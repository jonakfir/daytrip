import { test, expect } from "@playwright/test";

/**
 * Exhaustive coverage: every destination city slug, every guide slug,
 * and a healthy sample of city×duration combinations render without error.
 *
 * Test bodies are parallel-safe and short — use request.get() for pure
 * status checks so we don't spin up a Chromium instance per URL.
 */

const DESTINATION_SLUGS = [
  "paris","rome","barcelona","lisbon","amsterdam","london","prague","santorini",
  "tokyo","kyoto","bangkok","bali","singapore","seoul",
  "new-york-city","san-francisco","mexico-city","rio-de-janeiro","buenos-aires","cusco",
  "marrakech","cape-town","dubai","sydney","reykjavik","edinburgh",
  "florence","vienna","berlin","copenhagen","hong-kong","istanbul","madrid",
  "athens","dublin","budapest","hanoi","chiang-mai","taipei",
  "los-angeles","chicago","toronto",
];

const GUIDE_SLUGS = [
  "how-to-plan-a-trip",
  "best-time-to-visit-europe",
  "first-time-in-japan",
  "ai-trip-planning-explained",
  "best-cities-for-solo-travel",
  "best-honeymoon-destinations",
  "weekend-trip-ideas-from-london",
  "europe-vs-asia-first-trip",
];

const DURATIONS = [2, 3, 4, 5, 7, 10];

test.describe("Destination city landing pages", () => {
  for (const city of DESTINATION_SLUGS) {
    test(`/destinations/${city} returns 200 and has H1`, async ({ page }) => {
      const r = await page.goto(`/destinations/${city}`);
      expect(r?.status(), city).toBe(200);
      await expect(page.locator("h1").first()).toBeVisible();
    });
  }
});

test.describe("Guide articles", () => {
  for (const slug of GUIDE_SLUGS) {
    test(`/guides/${slug} returns 200 and renders meaningful content`, async ({ page }) => {
      const r = await page.goto(`/guides/${slug}`);
      expect(r?.status(), slug).toBe(200);
      const body = (await page.textContent("body")) ?? "";
      expect(body.length, `content length for ${slug}`).toBeGreaterThan(500);
      await expect(page.locator("h1").first()).toBeVisible();
    });
  }
});

test.describe("Duration coverage (sampled)", () => {
  // Sample 6 cities × 6 durations = 36 combinations
  const SAMPLE_CITIES = ["paris","tokyo","rome","barcelona","new-york-city","bali"];
  for (const city of SAMPLE_CITIES) {
    for (const days of DURATIONS) {
      test(`/destinations/${city}/${days}-day-itinerary renders a plan`, async ({ page }) => {
        const r = await page.goto(`/destinations/${city}/${days}-day-itinerary`);
        expect(r?.status()).toBe(200);
        await expect(
          page.locator("h1", { hasText: new RegExp(`${days} Days in`, "i") })
        ).toBeVisible();
        // Last day block should render
        await expect(page.locator(`text=Day ${days}`).first()).toBeVisible();
      });
    }
  }
});

test.describe("Sitemap lists every destination city", () => {
  test("sitemap contains all known cities", async ({ request }) => {
    const r = await request.get("/sitemap.xml");
    const body = await r.text();
    for (const city of DESTINATION_SLUGS) {
      expect(body, `sitemap missing /destinations/${city}`).toContain(
        `/destinations/${city}`
      );
    }
  });

  test("sitemap contains all known guides", async ({ request }) => {
    const r = await request.get("/sitemap.xml");
    const body = await r.text();
    for (const g of GUIDE_SLUGS) {
      expect(body, `sitemap missing /guides/${g}`).toContain(`/guides/${g}`);
    }
  });
});

test.describe("Non-existent slugs 404 cleanly", () => {
  test("unknown destination slug returns 404", async ({ request }) => {
    const r = await request.get("/destinations/definitely-not-a-city");
    expect(r.status()).toBe(404);
  });

  test("unknown duration returns 404", async ({ request }) => {
    const r = await request.get("/destinations/paris/99-day-itinerary");
    expect(r.status()).toBe(404);
  });

  test("unknown guide slug returns 404", async ({ request }) => {
    const r = await request.get("/guides/definitely-not-a-guide");
    expect(r.status()).toBe(404);
  });
});
