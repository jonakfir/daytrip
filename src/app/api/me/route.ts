import { NextResponse } from "next/server";
import { sql } from "@/lib/db-client";
import { getServerAuth } from "@/lib/check-auth";
import { resolveUserIdForAuth } from "@/lib/auth-helpers";
import { ensureSchema, isDbConfigured } from "@/lib/db";

/**
 * DELETE /api/me — permanently delete the signed-in user's account.
 *
 * Required by App Store guideline 5.1.1(v): any app that supports account
 * creation must also offer in-app account deletion. Deletes the users row;
 * payments cascade via ON DELETE CASCADE. Clears the auth cookie so the
 * client is logged out immediately.
 */
export async function DELETE() {
  const auth = await getServerAuth();
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: "not_authenticated" },
      { status: 401 }
    );
  }

  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "db_not_configured" },
      { status: 503 }
    );
  }

  const userId = await resolveUserIdForAuth(auth);

  try {
    await ensureSchema();
    if (userId) {
      await sql`DELETE FROM users WHERE id = ${userId}`;
    } else if (auth.email) {
      await sql`DELETE FROM users WHERE email = ${auth.email.toLowerCase()}`;
    }
  } catch (e) {
    console.error("[DELETE /api/me] failed:", e);
    return NextResponse.json(
      { error: "delete_failed", message: "Could not delete account." },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("daytrip-auth", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
