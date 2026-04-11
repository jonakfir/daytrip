import { sql } from "@vercel/postgres";

/**
 * Vercel Postgres helper for user accounts + payments.
 *
 * Schema is created lazily on the first write — no migrations needed.
 * Vercel Postgres is configured by POSTGRES_URL which Vercel sets
 * automatically when you attach a Postgres database to the project.
 */

let schemaEnsured = false;

export function isDbConfigured(): boolean {
  return !!(
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL
  );
}

export async function ensureSchema(): Promise<void> {
  if (schemaEnsured) return;
  if (!isDbConfigured()) return;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE NOT NULL,
      full_name text,
      password_hash text NOT NULL,
      role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      total_paid_cents integer NOT NULL DEFAULT 0,
      plan text,
      trip_credits integer NOT NULL DEFAULT 1,
      total_trips_generated integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `;
  // Lazy migration: add columns if they don't exist (for existing rows)
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS trip_credits integer NOT NULL DEFAULT 1;`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS total_trips_generated integer NOT NULL DEFAULT 0;`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS current_credit_usage_cents integer NOT NULL DEFAULT 0;`;

  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount_cents integer NOT NULL,
      currency text NOT NULL DEFAULT 'usd',
      plan text,
      stripe_payment_id text UNIQUE,
      status text NOT NULL DEFAULT 'succeeded',
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);`;
  await sql`CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);`;

  schemaEnsured = true;
}

export interface DbUser {
  id: string;
  email: string;
  full_name: string | null;
  password_hash: string;
  role: "user" | "admin";
  total_paid_cents: number;
  plan: string | null;
  trip_credits: number;
  total_trips_generated: number;
  created_at: string;
  updated_at: string;
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  if (!isDbConfigured()) return null;
  await ensureSchema();
  const { rows } = await sql<DbUser>`
    SELECT * FROM users WHERE email = ${email.toLowerCase()} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function createUser(params: {
  email: string;
  fullName: string | null;
  passwordHash: string;
  role: "user" | "admin";
}): Promise<DbUser> {
  if (!isDbConfigured()) {
    throw new Error("Database not configured");
  }
  await ensureSchema();
  const { rows } = await sql<DbUser>`
    INSERT INTO users (email, full_name, password_hash, role)
    VALUES (${params.email.toLowerCase()}, ${params.fullName}, ${params.passwordHash}, ${params.role})
    RETURNING *
  `;
  return rows[0];
}

export async function listAllUsers(): Promise<DbUser[]> {
  if (!isDbConfigured()) return [];
  await ensureSchema();
  const { rows } = await sql<DbUser>`
    SELECT * FROM users ORDER BY created_at DESC
  `;
  return rows;
}

export interface DbPayment {
  id: string;
  user_id: string;
  amount_cents: number;
  currency: string;
  plan: string | null;
  stripe_payment_id: string | null;
  status: string;
  created_at: string;
}

export async function listRecentPayments(
  limit: number = 100
): Promise<DbPayment[]> {
  if (!isDbConfigured()) return [];
  await ensureSchema();
  const { rows } = await sql<DbPayment>`
    SELECT * FROM payments ORDER BY created_at DESC LIMIT ${limit}
  `;
  return rows;
}

// ── Trip credits ─────────────────────────────────────────────────────────

/** Read the current trip_credits balance for a user. Null if not found. */
export async function getTripCredits(userId: string): Promise<number | null> {
  if (!isDbConfigured()) return null;
  await ensureSchema();
  const { rows } = await sql<{ trip_credits: number }>`
    SELECT trip_credits FROM users WHERE id = ${userId} LIMIT 1
  `;
  return rows[0]?.trip_credits ?? null;
}

/**
 * Atomically decrement trip_credits by 1 if > 0 AND reset the per-credit
 * Claude usage counter for the new trip. Returns the new balance, or null
 * if the user had no credits (denied) / doesn't exist.
 */
export async function consumeTripCredit(
  userId: string
): Promise<number | null> {
  if (!isDbConfigured()) return null;
  await ensureSchema();
  const { rows } = await sql<{ trip_credits: number }>`
    UPDATE users
    SET trip_credits = trip_credits - 1,
        total_trips_generated = total_trips_generated + 1,
        current_credit_usage_cents = 0,
        updated_at = now()
    WHERE id = ${userId} AND trip_credits > 0
    RETURNING trip_credits
  `;
  return rows[0]?.trip_credits ?? null;
}

/** Per-credit Claude usage cap in cents (silent — never shown to users). */
export const CREDIT_USAGE_CAP_CENTS = 100;

/**
 * Returns true if the user has remaining Claude budget on their current
 * credit. Admins (via the auth layer above this) skip this check entirely.
 */
export async function hasClaudeBudget(userId: string): Promise<boolean> {
  if (!isDbConfigured()) return true;
  await ensureSchema();
  const { rows } = await sql<{ current_credit_usage_cents: number }>`
    SELECT current_credit_usage_cents FROM users WHERE id = ${userId} LIMIT 1
  `;
  const used = rows[0]?.current_credit_usage_cents ?? 0;
  return used < CREDIT_USAGE_CAP_CENTS;
}

/**
 * Add usage cents to the current credit's running total. Silent — no
 * UI visibility. Used after every Claude call to enforce the $1 cap.
 */
export async function addClaudeUsage(
  userId: string,
  cents: number
): Promise<void> {
  if (!isDbConfigured() || cents <= 0) return;
  await ensureSchema();
  await sql`
    UPDATE users
    SET current_credit_usage_cents = current_credit_usage_cents + ${cents},
        updated_at = now()
    WHERE id = ${userId}
  `;
}

/** Add N credits to a user (used after a successful Stripe payment). */
export async function addTripCredits(
  userId: string,
  amount: number
): Promise<void> {
  if (!isDbConfigured()) return;
  await ensureSchema();
  await sql`
    UPDATE users
    SET trip_credits = trip_credits + ${amount},
        updated_at = now()
    WHERE id = ${userId}
  `;
}
