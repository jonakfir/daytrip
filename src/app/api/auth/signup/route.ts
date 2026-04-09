import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail, isDbConfigured } from "@/lib/db";

const HARDCODED_ADMIN_EMAIL = "jonakfir@gmail.com";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "daytrip-secret-change-me-in-production"
);

function issueCookieResponse(
  email: string,
  role: "user" | "admin",
  userId?: string
) {
  return (async () => {
    const token = await new SignJWT({ email, role, userId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    const response = NextResponse.json({ success: true, email, role });
    response.cookies.set("daytrip-auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  })();
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isDbConfigured()) {
      return NextResponse.json(
        {
          error:
            "Signup is not yet enabled. Contact the site admin to attach a database.",
        },
        { status: 503 }
      );
    }

    // Check for existing user
    const existing = await getUserByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // jonakfir@gmail.com always becomes admin on signup
    const role: "user" | "admin" =
      normalizedEmail === HARDCODED_ADMIN_EMAIL ? "admin" : "user";

    const user = await createUser({
      email: normalizedEmail,
      fullName: fullName?.trim() || normalizedEmail.split("@")[0],
      passwordHash,
      role,
    });

    return issueCookieResponse(user.email, user.role, user.id);
  } catch (e) {
    console.error("Signup error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Signup failed", details: message },
      { status: 500 }
    );
  }
}
