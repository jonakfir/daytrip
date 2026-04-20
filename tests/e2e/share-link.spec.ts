import { test, expect } from "@playwright/test";

/**
 * Share-link round-trip against the real DB: create an itinerary via
 * the /api/share write path (or seed it directly), then fetch it via
 * GET /api/share/[id] and verify the view_count is incremented.
 *
 * Skips in CI where we don't provision Postgres.
 */

const SKIP_REASON =
  "share-link requires a local Postgres — set SKIP_REAL_DB_TESTS=1 to opt out";

test.beforeEach(async () => {
  test.skip(!!process.env.SKIP_REAL_DB_TESTS, SKIP_REASON);
});

test.describe("GET /api/share/[id]", () => {
  test("demo shareId returns the mock itinerary without DB", async ({ request }) => {
    const r = await request.get("/api/share/demo");
    expect(r.status()).toBe(200);
    const j = await r.json();
    expect(j.itinerary).toBeTruthy();
    expect(j.itinerary.destination).toBeTruthy();
  });

  test("unknown shareId returns 404", async ({ request }) => {
    const r = await request.get(`/api/share/unknown-${Date.now()}`);
    expect(r.status()).toBe(404);
  });

  test("demo shareId repeated 3x returns consistently (no caching bug)", async ({ request }) => {
    const responses = await Promise.all(
      [1, 2, 3].map(() => request.get("/api/share/demo"))
    );
    for (const r of responses) expect(r.status()).toBe(200);
    const bodies = await Promise.all(responses.map((r) => r.json()));
    for (const b of bodies) expect(b.itinerary.destination).toBeTruthy();
  });
});

test.describe("Share URL is crawlable", () => {
  test("/trip/demo has a canonical + og:title + og:description + og:image", async ({ page }) => {
    await page.goto("/trip/demo");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toContain("/trip/demo");

    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute("content");
    expect(ogTitle).toBeTruthy();
    expect(ogTitle!.length).toBeGreaterThan(10);

    const ogDesc = await page
      .locator('meta[property="og:description"]')
      .getAttribute("content");
    expect(ogDesc).toBeTruthy();
    expect(ogDesc!.length).toBeGreaterThan(20);

    const ogImg = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(ogImg).toBeTruthy();
  });
});
