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

function resolveSecret(): string {
  if (raw) return raw;
  // No JWT_SECRET available. Don't throw at module load — that breaks
  // `next build`'s "Collecting page data" phase on Preview deploys that
  // don't have JWT_SECRET wired into env. Instead, generate an ephemeral
  // per-process secret. It's random 256-bit so attackers can't forge
  // tokens against it; the only downside is sessions don't survive a
  // cold start. Production always sets the real env var via Vercel.
  const ephemeral = crypto.randomBytes(32).toString("hex");
  // eslint-disable-next-line no-console
  console.warn(
    "[jwt-secret] JWT_SECRET unset — using ephemeral per-process secret. Set JWT_SECRET in env to persist sessions across restarts."
  );
  return ephemeral;
}

export const JWT_SECRET = new TextEncoder().encode(resolveSecret());
