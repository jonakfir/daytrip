import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getSupabaseAdminClient, isPermanentAdmin } from "@/lib/supabase";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "daytrip-secret-change-me-in-production"
);

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

    const admin = getSupabaseAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Supabase not configured. Contact site admin." },
        { status: 503 }
      );
    }

    // Create user via admin API (auto-confirmed email)
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || email.split("@")[0] },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Signup failed" },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json({ error: "Signup failed" }, { status: 500 });
    }

    const role = isPermanentAdmin(email) ? "admin" : "user";

    // Ensure profile exists + has correct role
    await admin.from("profiles").upsert(
      {
        id: data.user.id,
        email,
        full_name: fullName || email.split("@")[0],
        role,
      },
      { onConflict: "id" }
    );

    // Issue our JWT cookie
    const token = await new SignJWT({ email, role, userId: data.user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      success: true,
      email,
      role,
    });
    response.cookies.set("daytrip-auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (e) {
    console.error("Signup error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
