import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail, isDbConfigured } from "@/lib/db";
import { JWT_SECRET } from "@/lib/jwt-secret";

// Permanent admin email — pinned in code so the role survives DB resets.
// The PASSWORD must come from the ADMIN_PASSWORD env var (set in Vercel).
const PERMANENT_ADMIN_EMAIL = "jonakfir@gmail.com";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

async function issueCookie(
  email: string,
  role: "user" | "admin",
  userId?: string
): Promise<NextResponse> {
  const token = await new SignJWT({ email, role, userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);

  const response = NextResponse.json({ success: true, role, email });
  response.cookies.set("daytrip-auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
  return response;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Path 0: Permanent admin (jonakfir@gmail.com) authenticated via env var.
    // Always admin, always free, no DB needed — but the password must be set
    // in the ADMIN_PASSWORD env var. Hardcoded credentials are forbidden.
    if (
      ADMIN_PASSWORD &&
      normalizedEmail === PERMANENT_ADMIN_EMAIL &&
      password === ADMIN_PASSWORD
    ) {
      // Try to attach a real Postgres userId so /api/me/trips and similar
      // user-scoped endpoints have something to query against. Auto-creates
      // the admin row on first login if it doesn't exist yet.
      let adminUserId: string | undefined;
      if (isDbConfigured()) {
        try {
          const existing = await getUserByEmail(PERMANENT_ADMIN_EMAIL);
          if (existing) {
            adminUserId = existing.id;
          } else {
            const created = await createUser({
              email: PERMANENT_ADMIN_EMAIL,
              fullName: null,
              passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
              role: "admin",
            });
            adminUserId = created.id;
          }
        } catch (e) {
          // Non-fatal: the cookie still issues, just without a userId.
          console.error("[login] could not resolve admin DB row:", e);
        }
      }
      return issueCookie(PERMANENT_ADMIN_EMAIL, "admin", adminUserId);
    }

    // Path 1: Env-var admin alternate email (e.g. test@daytrip.app)
    if (
      ADMIN_EMAIL &&
      ADMIN_PASSWORD &&
      normalizedEmail === ADMIN_EMAIL.toLowerCase() &&
      password === ADMIN_PASSWORD
    ) {
      return issueCookie(normalizedEmail, "admin");
    }

    // Path 2: Regular user login via Postgres
    if (!isDbConfigured()) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Enforce admin override: jonakfir@gmail.com is always admin regardless of DB state
    const role: "user" | "admin" =
      normalizedEmail === PERMANENT_ADMIN_EMAIL ? "admin" : user.role;

    return issueCookie(user.email, role, user.id);
  } catch (e) {
    // Log the full error server-side, but never leak the message to the
    // client — it can contain stack frames, library versions, and DB hints.
    console.error("Login error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
