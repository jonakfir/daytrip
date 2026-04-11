import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@vercel/postgres";
import { getServerAuth } from "@/lib/check-auth";
import { isDbConfigured, listAllUsers, listRecentPayments } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/admin/users — admin-only. Create a new user with email,
 * password, and an initial trip-credit balance.
 *
 * The password is bcrypt-hashed (rounds: 10). Email must be unique.
 * Uses inline SQL with `ALTER TABLE … ADD COLUMN IF NOT EXISTS trip_credits`
 * for forward compatibility, so the route works whether or not the in-progress
 * trip-credits refactor in lib/db.ts has been merged yet.
 */
export async function POST(req: NextRequest) {
  const auth = await getServerAuth();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const tripCreditsRaw = Number(body?.tripCredits ?? 1);
    const fullName: string | null =
      typeof body?.fullName === "string" && body.fullName.trim()
        ? body.fullName.trim()
        : null;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    const tripCredits =
      Number.isFinite(tripCreditsRaw) && tripCreditsRaw >= 0
        ? Math.floor(tripCreditsRaw)
        : 1;

    // Ensure schema (idempotent — safe to run on every call)
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
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS trip_credits integer NOT NULL DEFAULT 1;`;

    // Reject duplicates with a clean 409
    const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "A user with that email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await sql<{
      id: string;
      email: string;
      full_name: string | null;
      role: string;
      trip_credits: number;
      created_at: string;
    }>`
      INSERT INTO users (email, full_name, password_hash, role, trip_credits)
      VALUES (${email}, ${fullName}, ${passwordHash}, 'user', ${tripCredits})
      RETURNING id, email, full_name, role, trip_credits, created_at
    `;

    const created = rows[0];
    return NextResponse.json({
      ok: true,
      user: {
        id: created.id,
        email: created.email,
        fullName: created.full_name,
        role: created.role,
        tripCredits: created.trip_credits,
        createdAt: created.created_at,
      },
    });
  } catch (e) {
    console.error("[admin/users POST] error:", e);
    return NextResponse.json(
      { error: "Could not create user" },
      { status: 500 }
    );
  }
}

export async function GET(_req: NextRequest) {
  const auth = await getServerAuth();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({
      users: [],
      payments: [],
      totalRevenue: 0,
      totalUsers: 0,
      configured: false,
      message:
        "Vercel Postgres not configured. Attach a Postgres database in the Vercel dashboard (Storage → Create Database → Postgres) and redeploy.",
    });
  }

  try {
    const [users, payments] = await Promise.all([
      listAllUsers(),
      listRecentPayments(100),
    ]);

    const shaped = users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      role: u.role,
      totalPaidCents: u.total_paid_cents,
      plan: u.plan,
      createdAt: u.created_at,
    }));

    const totalRevenue = shaped.reduce(
      (sum, u) => sum + (u.totalPaidCents || 0),
      0
    );

    return NextResponse.json({
      users: shaped,
      payments,
      totalRevenue,
      totalUsers: shaped.length,
      configured: true,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch users", detail: message },
      { status: 500 }
    );
  }
}
