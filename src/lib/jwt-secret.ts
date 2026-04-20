/**
 * Centralized JWT secret loader.
 *
 * In production we require JWT_SECRET from env — throwing would-be a hard
 * deploy failure rather than letting a committed default silently ship.
 * In local dev, missing JWT_SECRET generates a per-process random secret
 * so API routes still boot; this never ships and can't be used to forge
 * production tokens.
 *
 * Trims trailing whitespace defensively (Vercel sometimes preserves a
 * literal \n in env var values — see lib/claude-client.ts for the same fix).
 */
import crypto from "node:crypto";

const raw = process.env.JWT_SECRET?.trim();
const isProd = process.env.NODE_ENV === "production";

function resolveSecret(): string {
  if (raw) return raw;
  if (isProd) {
    throw new Error(
      "JWT_SECRET is not set. Add it to Vercel env vars and redeploy."
    );
  }
  // Dev / test fallback: ephemeral secret scoped to this process.
  // Regenerated on every restart so no long-lived session is trusted.
  const ephemeral = crypto.randomBytes(32).toString("hex");
  // eslint-disable-next-line no-console
  console.warn(
    "[jwt-secret] JWT_SECRET unset — using ephemeral dev secret. Set JWT_SECRET in .env.local to persist sessions across restarts."
  );
  return ephemeral;
}

export const JWT_SECRET = new TextEncoder().encode(resolveSecret());
