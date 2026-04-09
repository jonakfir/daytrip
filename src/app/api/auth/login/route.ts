import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getSupabaseAdminClient, isPermanentAdmin } from "@/lib/supabase";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "daytrip-secret-change-me-in-production"
);

async function issueCookie(
  email: string,
  role: string,
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

    // Path 1: Env-var admin login (bootstrap / fallback, works without Supabase)
    if (
      ADMIN_EMAIL &&
      ADMIN_PASSWORD &&
      email === ADMIN_EMAIL &&
      password === ADMIN_PASSWORD
    ) {
      return issueCookie(email, "admin");
    }

    // Path 2: Supabase user login
    const admin = getSupabaseAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const { data, error } = await admin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Determine role: permanent admin override OR profile.role
    let role = "user";
    if (isPermanentAdmin(email)) {
      role = "admin";
      await admin
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", data.user.id);
    } else {
      const { data: profile } = await admin
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();
      if (profile?.role === "admin") role = "admin";
    }

    return issueCookie(email, role, data.user.id);
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
