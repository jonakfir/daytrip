/**
 * Centralized JWT secret loader.
 *
 * Throws at module load if JWT_SECRET is missing instead of falling back
 * to a hardcoded default. The previous default ("daytrip-secret-change-me-in-production")
 * was committed to git, so any deployment without JWT_SECRET set in env
 * would let attackers forge admin cookies.
 *
 * Trims trailing whitespace defensively (Vercel sometimes preserves a
 * literal \n in env var values — see lib/claude-client.ts for the same fix).
 */
const raw = process.env.JWT_SECRET?.trim();

if (!raw) {
  throw new Error(
    "JWT_SECRET is not set. Add it to Vercel env vars and redeploy."
  );
}

export const JWT_SECRET = new TextEncoder().encode(raw);
