#!/usr/bin/env node
// Phase 0 setup wizard for the Social Clips feature.
//
// Walks through MapTiler, Google Places, and Instagram oEmbed provisioning:
//   1. Opens each dashboard in your browser.
//   2. Prompts you to paste the key/token.
//   3. Validates it live against the real API before accepting.
//   4. Appends to .env.local (dedup-safe).
//
// Safe to re-run — existing keys get offered as defaults and re-validated.
// Each key can be skipped with "s" and done later.
//
// Usage: node scripts/setup-social-clips-env.mjs

import { exec } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { readFile, writeFile, access } from "node:fs/promises";
import { stdin, stdout } from "node:process";
import { constants as FS } from "node:fs";

const ENV_PATH = new URL("../.env.local", import.meta.url);
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};
const tag = (col, label) => `${col}${C.bold}${label}${C.reset}`;

const rl = createInterface({ input: stdin, output: stdout });
const ask = (q) => rl.question(q);
const openInBrowser = (url) =>
  new Promise((resolve) => exec(`open "${url}"`, () => resolve()));

function banner(n, total, title) {
  console.log(`\n${C.cyan}${C.bold}━━━ step ${n}/${total} · ${title} ━━━${C.reset}`);
}

async function readEnv() {
  try {
    await access(ENV_PATH, FS.R_OK);
    const txt = await readFile(ENV_PATH, "utf8");
    const map = new Map();
    for (const line of txt.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) map.set(m[1], m[2]);
    }
    return { raw: txt, map };
  } catch {
    return { raw: "", map: new Map() };
  }
}

async function writeEnv(updates) {
  const { raw, map } = await readEnv();
  const lines = raw.split("\n");
  const seen = new Set();
  const out = [];
  for (const line of lines) {
    const m = line.match(/^([A-Z0-9_]+)=/);
    if (m && updates.has(m[1])) {
      out.push(`${m[1]}=${updates.get(m[1])}`);
      seen.add(m[1]);
    } else {
      out.push(line);
    }
  }
  if (out.length && out[out.length - 1] !== "") out.push("");
  for (const [k, v] of updates) {
    if (!seen.has(k)) out.push(`${k}=${v}`);
  }
  await writeFile(ENV_PATH, out.join("\n"));
  // Silent return of count so the step can acknowledge it.
  return updates.size;
}

async function promptForKey({ name, current, instructions, validate }) {
  if (current) {
    console.log(`${C.dim}current .env.local value: ${mask(current)}${C.reset}`);
  }
  while (true) {
    const ans = (await ask(`paste ${name} (or "s" to skip, "enter" to keep current): `)).trim();
    if (ans.toLowerCase() === "s") return null;
    const value = ans || current;
    if (!value) {
      console.log(tag(C.red, "empty — try again or press s to skip"));
      continue;
    }
    process.stdout.write(`${C.dim}validating…${C.reset} `);
    try {
      await validate(value);
      console.log(tag(C.green, "✓ valid"));
      return value;
    } catch (err) {
      console.log(tag(C.red, "✗ " + err.message));
      const retry = (await ask("retry? [Y/n]: ")).trim().toLowerCase();
      if (retry === "n") return null;
    }
  }
}

function mask(v) {
  if (!v) return "(none)";
  if (v.length <= 8) return "•".repeat(v.length);
  return v.slice(0, 4) + "•".repeat(v.length - 8) + v.slice(-4);
}

// ─── validators ────────────────────────────────────────────────────────────

async function validateMapTiler(key) {
  // Cheapest working endpoint: the tile JSON for a style.
  const r = await fetch(
    `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(key)}`
  );
  if (r.status === 403) throw new Error("403 forbidden — key is rejected by MapTiler");
  if (r.status === 401) throw new Error("401 unauthorized — key invalid");
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  const j = await r.json();
  if (!j.version) throw new Error("response didn't look like a style.json");
}

async function validateGooglePlaces(key) {
  // Places API (New) text search — cheapest POI lookup.
  const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName",
    },
    body: JSON.stringify({ textQuery: "Eiffel Tower", maxResultCount: 1 }),
  });
  const txt = await r.text();
  if (r.status === 403) {
    throw new Error(
      "403 — key rejected. Did you enable 'Places API (New)' on the project? (" +
        txt.slice(0, 140) +
        ")"
    );
  }
  if (!r.ok) throw new Error(`${r.status}: ${txt.slice(0, 140)}`);
  const j = JSON.parse(txt);
  if (!j.places?.length) throw new Error("no places returned — unexpected");
}

async function validateIgOembedToken(token) {
  // Step 1: confirm token is a valid app token at all.
  const dbg = await fetch(
    `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(
      token
    )}&access_token=${encodeURIComponent(token)}`
  );
  const dbgJson = await dbg.json();
  if (!dbg.ok || !dbgJson?.data?.is_valid) {
    const m = dbgJson?.data?.error?.message || dbgJson?.error?.message || dbg.statusText;
    throw new Error(`token rejected: ${m}`);
  }

  // Step 2: confirm instagram_oembed actually works with it.
  const stableUrl = "https://www.instagram.com/p/CUbHfhpswxt/";
  const r = await fetch(
    `https://graph.facebook.com/v19.0/instagram_oembed?url=${encodeURIComponent(
      stableUrl
    )}&access_token=${encodeURIComponent(token)}`
  );
  const j = await r.json().catch(() => ({}));
  if (r.ok) return;
  // Meta error codes:
  //   190 = bad token | 200 = missing perm | 100 = bad param
  const code = j?.error?.code;
  if (code === 100) return; // token OK, our canary URL is gone — acceptable
  throw new Error(
    `instagram_oembed rejected token (code ${code}): ${
      j?.error?.message || r.statusText
    }. App needs 'oEmbed Read' permission and must be Live mode.`
  );
}

// ─── main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`${C.bold}Daytrip · Social Clips env setup${C.reset}`);
  console.log(`${C.dim}writes to ${ENV_PATH.pathname}${C.reset}`);

  const { map } = await readEnv();
  const updates = new Map();

  // 1. MapTiler
  banner(1, 4, "MapTiler (map tiles, free 100k loads/mo)");
  console.log(`
  1. A browser tab will open MapTiler Cloud.
  2. Sign in (or create an account, free).
  3. Click ${C.bold}Create a new key${C.reset}, name it "Daytrip".
  4. Restrict to domains: ${C.bold}daytrip-ai.com, *.vercel.app, localhost${C.reset}
  5. Copy the key and paste below.`);
  await openInBrowser("https://cloud.maptiler.com/account/keys/");
  const maptiler = await promptForKey({
    name: "MAPTILER_KEY",
    current: map.get("MAPTILER_KEY"),
    validate: validateMapTiler,
  });
  if (maptiler) updates.set("MAPTILER_KEY", maptiler);

  // 2. Google Places
  banner(2, 4, "Google Places API (server-side geocoding)");
  console.log(`
  Two tabs will open:
    a. ${C.bold}Places API (New)${C.reset} — click Enable on your project.
    b. ${C.bold}Credentials${C.reset} — Create credentials → API key.
  Copy the key and paste below.

  Tip: restrict the key by IP later (Vercel egress) — unrestricted is fine for dev.`);
  await openInBrowser("https://console.cloud.google.com/apis/library/places.googleapis.com");
  // small delay so the two tabs don't collide
  await new Promise((r) => setTimeout(r, 800));
  await openInBrowser("https://console.cloud.google.com/apis/credentials");
  const places = await promptForKey({
    name: "GOOGLE_PLACES_API_KEY",
    current: map.get("GOOGLE_PLACES_API_KEY"),
    validate: validateGooglePlaces,
  });
  if (places) updates.set("GOOGLE_PLACES_API_KEY", places);

  // 3. Instagram oEmbed
  banner(3, 4, "Instagram oEmbed token (Meta for Developers)");
  console.log(`
  1. Create or pick an app: ${C.bold}Business${C.reset} type.
  2. In the left nav → ${C.bold}App Review → Permissions and Features${C.reset} → request "oEmbed Read".
     (For personal dogfood use, the advanced review can be skipped — ok as app owner.)
  3. Settings → Basic → copy ${C.bold}App ID${C.reset} and ${C.bold}App Secret${C.reset}.
  4. Paste token here in the form ${C.bold}APPID|APPSECRET${C.reset} (literal pipe between them).

  You can skip this for now — TikTok ships first, Instagram is day-7.`);
  await openInBrowser("https://developers.facebook.com/apps/");
  const ig = await promptForKey({
    name: "IG_OEMBED_TOKEN",
    current: map.get("IG_OEMBED_TOKEN"),
    validate: validateIgOembedToken,
  });
  if (ig) updates.set("IG_OEMBED_TOKEN", ig);

  // 4. Feature flag
  banner(4, 4, "SOCIAL_CLIPS_ENABLED feature flag");
  const flagDefault = map.get("SOCIAL_CLIPS_ENABLED") ?? "false";
  const flagAns = (
    await ask(`enable Social Clips in this env? [true/false, default ${flagDefault}]: `)
  ).trim();
  const flagValue = flagAns || flagDefault;
  if (flagValue !== "true" && flagValue !== "false") {
    console.log(tag(C.yellow, "not true/false — leaving unset"));
  } else {
    updates.set("SOCIAL_CLIPS_ENABLED", flagValue);
  }

  // Write
  if (updates.size === 0) {
    console.log(`\n${C.yellow}nothing to write — all steps skipped.${C.reset}`);
  } else {
    await writeEnv(updates);
    console.log(`\n${C.green}${C.bold}✓ wrote ${updates.size} var(s) to .env.local${C.reset}`);
    for (const [k, v] of updates) console.log(`  ${k}=${mask(v)}`);
  }

  // Vercel push hints (don't automate — user may not have CLI logged in)
  if (updates.size > 0) {
    console.log(`\n${C.dim}to push to Vercel Preview + Production:${C.reset}`);
    for (const [k, v] of updates) {
      console.log(`  echo -n '${v}' | vercel env add ${k} preview`);
      console.log(`  echo -n '${v}' | vercel env add ${k} production`);
    }
  }

  rl.close();
}

main().catch((err) => {
  console.error(`\n${C.red}setup failed:${C.reset}`, err);
  rl.close();
  process.exit(1);
});
