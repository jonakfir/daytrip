import { sql } from "@/lib/db-client";
import { isDbConfigured } from "@/lib/db";
import type { AuthUser } from "@/lib/check-auth";

/**
 * Resolve a userId for an authenticated request.
 *
 * The permanent-admin login path issues JWTs that contain `email` but no
 * `userId`. To avoid forcing those users to log out and back in, this helper
 * falls back to looking up the Postgres `users` row by email.
 *
 * Returns the resolved userId, or null if no DB row exists.
 */
export async function resolveUserIdForAuth(
  auth: AuthUser
): Promise<string | null> {
  if (auth.userId) return auth.userId;
  if (!auth.email || !isDbConfigured()) return null;
  try {
    const r = await sql<{ id: string }>`
      SELECT id FROM users WHERE email = ${auth.email.toLowerCase()} LIMIT 1
    `;
    return r.rows[0]?.id ?? null;
  } catch (e) {
    console.error("[resolveUserIdForAuth] lookup failed:", e);
    return null;
  }
}
