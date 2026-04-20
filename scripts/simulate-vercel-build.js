#!/usr/bin/env node
/**
 * Simulate a Vercel "Preview" build locally.
 *
 * Vercel runs `next build` with NODE_ENV=production and NEXT_PHASE=
 * phase-production-build. Preview environments routinely DON'T have
 * every env var that Production has (JWT_SECRET, Stripe keys, etc).
 * That mismatch has bitten us twice in the wild — a route module
 * throws at import time, and `next build`'s "Collecting page data"
 * phase dies with a useless error.
 *
 * This script runs the exact same command in a stripped-down env so
 * any regression shows up locally BEFORE we burn Vercel build
 * minutes. Each failed preview costs money.
 *
 * What we strip:
 *   - All API keys (JWT_SECRET, ANTHROPIC_API_KEY, STRIPE_*, SUPABASE_*,
 *     AMADEUS_*, YELP_*, FOURSQUARE_*, etc.)
 *   - POSTGRES_URL and its aliases (Vercel Postgres)
 *
 * What we keep:
 *   - PATH, HOME, USER, SHELL — needed for node to run at all
 *   - NODE_ENV, NEXT_PHASE — set to production / phase-production-build
 *
 * Exit 0 on success. Non-zero means a Vercel Preview deploy would fail.
 */

"use strict";

const { spawnSync } = require("node:child_process");
const { existsSync, rmSync } = require("node:fs");
const path = require("node:path");

const projectDir = path.resolve(__dirname, "..");
const nextDir = path.join(projectDir, ".next");

// Keep only the bare minimum env. We explicitly whitelist instead of
// blacklisting so new secrets added later are stripped by default.
const WHITELIST = new Set([
  "PATH",
  "HOME",
  "USER",
  "SHELL",
  "LANG",
  "LC_ALL",
  "LC_CTYPE",
  "TMPDIR",
  "TERM",
]);

const cleanEnv = Object.fromEntries(
  Object.entries(process.env).filter(([k]) => WHITELIST.has(k))
);
// Simulate what Vercel actually sets during `vercel build`.
cleanEnv.NODE_ENV = "production";
cleanEnv.NEXT_PHASE = "phase-production-build";
// Next.js insists on colors in dev, but CI-style output is cleaner here.
cleanEnv.FORCE_COLOR = "0";
cleanEnv.NO_COLOR = "1";

// Fresh build output so we don't benefit from cached work.
if (existsSync(nextDir)) {
  rmSync(nextDir, { recursive: true, force: true });
}

const bin = path.join(projectDir, "node_modules", ".bin", "next");
if (!existsSync(bin)) {
  console.error(
    "[preflight] node_modules/.bin/next not found. Run `npm install` first."
  );
  process.exit(1);
}

console.log("[preflight] simulating Vercel Preview build (zero secrets)…");
const res = spawnSync(bin, ["build"], {
  cwd: projectDir,
  env: cleanEnv,
  stdio: "inherit",
});

if (res.status !== 0) {
  console.error("");
  console.error(
    "[preflight] ❌ build FAILED in a zero-env Preview simulation."
  );
  console.error(
    "[preflight] A Vercel Preview deploy would also fail, burning build minutes."
  );
  console.error(
    "[preflight] Fix the crash above BEFORE pushing. Usually this means an"
  );
  console.error(
    "[preflight] API route throws at module load when its env var is missing."
  );
  process.exit(res.status ?? 1);
}

console.log("");
console.log("[preflight] ✅ Vercel Preview build simulation passed.");
