/**
 * Centralized JWT secret loader.
 *
 * Never throws at module load — that was breaking `next build`'s
 * page-data collection step for Preview deploys that don't have
 * JWT_SECRET wired in. If the env var is missing we fall back to an
 * ephemeral per-process secret, which is safe (attackers can't know a
 * random 256-bit value) but means tokens don't survive cold starts.
 *
 * Production deploys always set JWT_SECRET via Vercel project env, so
 * sessions persist there. Dev, test, CI, and Preview without a secret
 * all work transparently with the ephemeral fallback.
 *
 * Trims trailing whitespace defensively (Vercel sometimes preserves a
 * literal \n in env var values — see lib/claude-client.ts for the same fix).
 */
import crypto from "node:crypto";

const raw = process.env.JWT_SECRET?.trim();

function resolve(): string {
  if (raw) return raw;
  // eslint-disable-next-line no-console
  console.warn(
    "[jwt-secret] JWT_SECRET is not set — using an ephemeral per-process secret. Sessions will not persist across restarts. Set JWT_SECRET in env to fix."
  );
  return crypto.randomBytes(32).toString("hex");
}

export const JWT_SECRET = new TextEncoder().encode(resolve());
