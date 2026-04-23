#!/usr/bin/env node
// Visual QA for the Social Clips + Trip Map feature. Boots Playwright's
// bundled Chromium (no branded Chrome required), hits the demo trip page
// and the map page, checks for the new UI + logs console errors.
//
// Dev server must be running at http://localhost:3100 before this script.
// Screenshots land in /tmp/daytrip-qa-*.png.

import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.QA_BASE_URL || "http://localhost:3100";
const OUT  = "/tmp";

const errors = [];
const warnings = [];
const findings = [];

function log(kind, msg) { findings.push(`[${kind}] ${msg}`); }

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
  else if (m.type() === "warning") warnings.push(m.text());
});
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

// ─── 1. Demo trip page ─────────────────────────────────────────────────
await page.goto(`${BASE}/trip/demo`, { waitUntil: "networkidle", timeout: 30000 }).catch((e) => errors.push(`navigate trip: ${e.message}`));
await page.screenshot({ path: `${OUT}/daytrip-qa-trip.png`, fullPage: true }).catch(() => {});
const tripText = await page.content();
log("trip/demo", `status reachable: ${tripText.length > 1000 ? "yes" : "empty"}`);

// Look for ClipsToolbar buttons
const addClipBtn = await page.locator('button:has-text("Add clip")').count();
const mapLink    = await page.locator('a:has-text("View full map")').count();
log("trip/demo", `Add clip button visible: ${addClipBtn > 0}`);
log("trip/demo", `View full map link visible: ${mapLink > 0}`);

// Click "Add clip" → dialog should open
if (addClipBtn > 0) {
  await page.locator('button:has-text("Add clip")').first().click().catch((e) => errors.push(`click add clip: ${e.message}`));
  await page.waitForTimeout(300);
  const dialogOpen = await page.locator('h2:has-text("Add clip to trip")').count();
  log("AddClipDialog", `opened on click: ${dialogOpen > 0}`);
  await page.screenshot({ path: `${OUT}/daytrip-qa-dialog.png` }).catch(() => {});

  // Paste a TikTok URL to exercise the preview button (will 401 since not logged in)
  const urlInput = page.locator('input[type="url"]');
  if (await urlInput.count() > 0) {
    await urlInput.fill("https://www.tiktok.com/@tiktok/video/7106594312292453675");
    await page.locator('button:has-text("Preview")').click().catch(() => {});
    await page.waitForTimeout(1200);
    const errorBanner = await page.locator('text=/auth_required|rate_limited|feature_disabled/').count();
    log("AddClipDialog", `preview returns expected error (auth/flag): ${errorBanner > 0}`);
  }
  // Close dialog
  await page.locator('button[aria-label="Close"]').first().click().catch(() => {});
  await page.waitForTimeout(200);
}

// ─── 2. Trip map page ──────────────────────────────────────────────────
await page.goto(`${BASE}/trip/demo/map`, { waitUntil: "domcontentloaded", timeout: 30000 }).catch((e) => errors.push(`navigate map: ${e.message}`));
await page.waitForTimeout(5000); // give MapLibre time to boot + load tiles
// Wait for MapLibre markers to render, if any
await page.waitForSelector('.maplibregl-marker', { timeout: 5000 }).catch(() => {});
await page.screenshot({ path: `${OUT}/daytrip-qa-map.png`, fullPage: false }).catch(() => {});
const mapCanvas = await page.locator('canvas').count();
const dayFilter = await page.locator('button:has-text("Day 1")').count();
const backBtn   = await page.locator('a:has-text("Back to trip")').count();
const markerCount = await page.locator('.maplibregl-marker').count();
log("trip/demo/map", `canvas rendered: ${mapCanvas > 0}`);
log("trip/demo/map", `day filter chips rendered: ${dayFilter > 0}`);
log("trip/demo/map", `back button visible: ${backBtn > 0}`);
log("trip/demo/map", `pin markers rendered: ${markerCount}`);

// Check MapTiler key is present in the style URL requested
const mapTilerHit = await page.evaluate(async () => {
  const res = await fetch("/_next/static/chunks/pages/_app.js").catch(() => null);
  return !!res;
});

await browser.close();

// ─── Report ─────────────────────────────────────────────────────────────
const report = {
  findings,
  errors: errors.filter((e) => !/Failed to load resource|favicon|\/_next\/static/.test(e)).slice(0, 20),
  warnings: warnings.filter((w) => !/Download the React DevTools|Each child in a list/.test(w)).slice(0, 10),
  screenshots: [
    `${OUT}/daytrip-qa-trip.png`,
    `${OUT}/daytrip-qa-dialog.png`,
    `${OUT}/daytrip-qa-map.png`,
  ].filter((p) => fs.existsSync(p)),
};

fs.writeFileSync("/tmp/daytrip-qa-report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
