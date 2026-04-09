import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { getUserByEmail, isDbConfigured } from "@/lib/db";

// Hardcoded permanent admin — always works regardless of env vars or database state.
const HARDCODED_ADMIN_EMAIL = "jonakfir@gmail.com";
const HARDCODED_ADMIN_PASSWORD = "Jonathankfir7861!";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "daytrip-secret-change-me-in-production"
);

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

    // Path 0: Hardcoded permanent admin (jonakfir@gmail.com)
    // Always admin, always free, always works — no DB needed.
    if (
      normalizedEmail === HARDCODED_ADMIN_EMAIL &&
      password === HARDCODED_ADMIN_PASSWORD
    ) {
      return issueCookie(HARDCODED_ADMIN_EMAIL, "admin");
    }

    // Path 1: Env-var admin (backup, also no DB needed)
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
      normalizedEmail === HARDCODED_ADMIN_EMAIL ? "admin" : user.role;

    return issueCookie(user.email, role, user.id);
  } catch (e) {
    console.error("Login error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 }
    );
  }
}
