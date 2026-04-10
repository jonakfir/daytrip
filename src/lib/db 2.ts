import { sql } from "@vercel/postgres";

/**
 * Vercel Postgres helper for user accounts + payments.
 *
 * This replaces the old Supabase client for auth. The schema is created
 * lazily on the first write — no migrations needed. Vercel Postgres is
 * configured by the POSTGRES_URL env var which Vercel sets automatically
 * when you attach a Postgres database to the project.
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
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `;

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

export async function recordPayment(params: {
  userId: string;
  amountCents: number;
  currency?: string;
  plan?: string | null;
  stripePaymentId?: string | null;
}): Promise<void> {
  if (!isDbConfigured()) {
    throw new Error("Database not configured");
  }
  await ensureSchema();
  await sql`
    INSERT INTO payments (user_id, amount_cents, currency, plan, stripe_payment_id)
    VALUES (
      ${params.userId},
      ${params.amountCents},
      ${params.currency ?? "usd"},
      ${params.plan ?? null},
      ${params.stripePaymentId ?? null}
    )
  `;
  await sql`
    UPDATE users
    SET total_paid_cents = total_paid_cents + ${params.amountCents},
        plan = COALESCE(${params.plan ?? null}, plan),
        updated_at = now()
    WHERE id = ${params.userId}
  `;
}
