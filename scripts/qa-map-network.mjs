import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

const tileRequests = [];
const tileResponses = new Map();
const consoleErrors = [];
const consoleWarns = [];

page.on("request", (r) => {
  const u = r.url();
  if (/maptiler|\.pbf|\/tiles\/|style\.json/.test(u)) tileRequests.push(u);
});
page.on("response", async (r) => {
  const u = r.url();
  if (/maptiler|\.pbf|\/tiles\/|style\.json/.test(u)) {
    tileResponses.set(u, { status: r.status(), ct: r.headers()["content-type"] || "" });
  }
});
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
  else if (m.type() === "warning") consoleWarns.push(m.text());
});
page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));

await page.goto("http://localhost:3100/trip/demo/map", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(6000);

// Evaluate: check that the map's style actually loaded and has sources
const mapDiag = await page.evaluate(() => {
  const canvases = document.querySelectorAll(".maplibregl-canvas");
  const container = document.querySelector(".maplibregl-map");
  return {
    canvasCount: canvases.length,
    containerRect: container ? container.getBoundingClientRect().toJSON() : null,
    publicKey: !!(typeof window !== "undefined" && (window).__NEXT_DATA__),
  };
});

// Filter tile requests to get a sample
const byHost = {};
for (const u of tileRequests) {
  try { const h = new URL(u).host; byHost[h] = (byHost[h] || 0) + 1; } catch {}
}
const sampleResponses = [...tileResponses.entries()].slice(0, 8).map(([u, r]) => ({ url: u.slice(0, 120), ...r }));

const fails = [...tileResponses.entries()].filter(([, r]) => r.status >= 400);

console.log(JSON.stringify({
  totalMapRequests: tileRequests.length,
  hosts: byHost,
  failedCount: fails.length,
  failedSample: fails.slice(0, 10).map(([u, r]) => ({ url: u.slice(0, 160), ...r })),
  sampleOk: sampleResponses.slice(0, 5),
  mapDiag,
  consoleErrors: consoleErrors.slice(0, 10),
  consoleWarns: consoleWarns.filter((w) => !/GPU stall/.test(w)).slice(0, 10),
}, null, 2));

await browser.close();
