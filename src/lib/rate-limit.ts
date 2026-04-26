/**
 * In-memory sliding-window rate limiter. Good enough for a single-region
 * Vercel deployment — each serverless instance keeps its own counters, so
 * the effective limit is `per-instance * instance-count`. Safe for the
 * current usage (protecting oEmbed/Places from a runaway client).
 *
 * Swap for @upstash/ratelimit + Redis if/when we shard across regions.
 */

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetMs: number;
}

interface Bucket {
  windowStart: number;
  count: number;
}

const store: Map<string, Bucket> = new Map();

export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);
  if (!existing || now - existing.windowStart > windowMs) {
    store.set(key, { windowStart: now, count: 1 });
    return { ok: true, remaining: max - 1, resetMs: windowMs };
  }
  existing.count++;
  if (existing.count > max) {
    return { ok: false, remaining: 0, resetMs: windowMs - (now - existing.windowStart) };
  }
  return { ok: true, remaining: max - existing.count, resetMs: windowMs - (now - existing.windowStart) };
}

/** Cheap periodic compaction so the Map doesn't grow unbounded under
 *  long-running instances. Cutoff is 2x the typical window — anything
 *  older than that is definitely eligible for reset. */
setInterval(() => {
  const cutoff = Date.now() - 5 * 60 * 1000;
  for (const [key, bucket] of store) {
    if (bucket.windowStart < cutoff) store.delete(key);
  }
}, 5 * 60 * 1000).unref?.();
