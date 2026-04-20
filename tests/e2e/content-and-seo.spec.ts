import { test, expect } from "@playwright/test";

const SEO_PAGES: Array<{ path: string; canonicalEnds: string; titleIncludes: RegExp }> = [
  { path: "/", canonicalEnds: "daytrip-ai.com", titleIncludes: /Daytrip/ },
  { path: "/login", canonicalEnds: "/login", titleIncludes: /Log in/ },
  { path: "/signup", canonicalEnds: "/signup", titleIncludes: /Sign up/ },
  { path: "/account", canonicalEnds: "/account", titleIncludes: /Your account|Account/ },
  { path: "/admin", canonicalEnds: "/admin", titleIncludes: /Admin/ },
  { path: "/pricing", canonicalEnds: "/pricing", titleIncludes: /Pricing/ },
  { path: "/contact", canonicalEnds: "/contact", titleIncludes: /Contact/ },
  { path: "/privacy", canonicalEnds: "/privacy", titleIncludes: /Privacy/ },
  { path: "/terms", canonicalEnds: "/terms", titleIncludes: /Terms/ },
  { path: "/destinations", canonicalEnds: "/destinations", titleIncludes: /Destinations/ },
  {
    path: "/destinations/paris/5-day-itinerary",
    canonicalEnds: "/destinations/paris/5-day-itinerary",
    titleIncludes: /5 Days in Paris/,
  },
  { path: "/trip/demo", canonicalEnds: "/trip/demo", titleIncludes: /Tokyo/ },
];

test.describe("Per-page canonicals point to self (not homepage)", () => {
  for (const { path, canonicalEnds, titleIncludes } of SEO_PAGES) {
    test(`${path} has canonical + unique title`, async ({ page }) => {
      await page.goto(path);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical, `canonical for ${path}`).toBeTruthy();
      expect(canonical, `canonical for ${path}`).toContain(canonicalEnds);
      const title = await page.title();
      expect(title, `title for ${path}`).toMatch(titleIncludes);
    });
  }
});

test.describe("Open Graph / Twitter metadata", () => {
  const OG_PAGES = [
    "/",
    "/destinations",
    "/guides",
    "/destinations/paris",
    "/destinations/paris/5-day-itinerary",
    "/trip/demo",
  ];
  for (const path of OG_PAGES) {
    test(`${path} has og:image + og:title`, async ({ page }) => {
      await page.goto(path);
      const ogImage = page.locator('meta[property="og:image"]');
      const ogTitle = page.locator('meta[property="og:title"]');
      await expect(ogImage).toHaveCount(1);
      await expect(ogTitle).toHaveCount(1);
      const imageContent = await ogImage.getAttribute("content");
      expect(imageContent).toBeTruthy();
    });
  }

  test("destinations index exposes twitter:card", async ({ page }) => {
    await page.goto("/destinations");
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image"
    );
  });
});

test.describe("Sitemap.xml completeness", () => {
  test("includes all 6 itinerary durations", async ({ request }) => {
    const r = await request.get("/sitemap.xml");
    expect(r.status()).toBe(200);
    const body = await r.text();
    const durations = new Set(
      Array.from(body.matchAll(/(\d+)-day-itinerary/g)).map((m) => m[1])
    );
    for (const d of ["2", "3", "4", "5", "7", "10"]) {
      expect(durations, `sitemap durations`).toContain(d);
    }
    const locs = body.match(/<loc>/g)?.length ?? 0;
    expect(locs).toBeGreaterThan(100);
  });

  test("includes core static routes", async ({ request }) => {
    const r = await request.get("/sitemap.xml");
    const body = await r.text();
    for (const p of ["/pricing", "/about", "/contact", "/privacy", "/terms", "/destinations", "/guides"]) {
      expect(body, `sitemap must list ${p}`).toContain(p);
    }
  });
});

test.describe("Itinerary duration variants render unique intros", () => {
  const PHRASES: Record<number, RegExp> = {
    2: /highlight reel/i,
    3: /sweet spot/i,
    4: /starts to feel/i,
    5: /classic first-time/i,
    7: /week in|short residency/i,
    10: /genuinely generous/i,
  };

  for (const days of [2, 3, 4, 5, 7, 10]) {
    test(`Paris ${days}-day itinerary shows duration-specific intro`, async ({ page }) => {
      const response = await page.goto(`/destinations/paris/${days}-day-itinerary`);
      expect(response?.status()).toBe(200);
      const body = await page.textContent("body");
      expect(body, `${days}-day intro phrase`).toMatch(PHRASES[days]);
    });
  }

  test("4-day and 10-day were previously 404 — now render day blocks", async ({ page }) => {
    for (const days of [4, 10]) {
      await page.goto(`/destinations/paris/${days}-day-itinerary`);
      await expect(page.locator("h1", { hasText: `${days} Days in Paris` })).toBeVisible();
      // Last day should be rendered
      await expect(page.locator(`text=Day ${days}`).first()).toBeVisible();
    }
  });
});

test.describe("Multi-city destination coverage", () => {
  const CITIES = ["paris", "tokyo", "rome", "barcelona", "lisbon"];
  for (const city of CITIES) {
    test(`${city} 3-day renders content`, async ({ page }) => {
      const response = await page.goto(`/destinations/${city}/3-day-itinerary`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toContainText(/3 Days in/i);
    });
  }
});

test.describe("Legal pages have substantial content", () => {
  test("/privacy has >3000 chars and names processors", async ({ page }) => {
    await page.goto("/privacy");
    const body = (await page.textContent("body")) ?? "";
    expect(body.length).toBeGreaterThan(3000);
    expect(body).toMatch(/Stripe/i);
    expect(body).toMatch(/Anthropic|Claude/i);
    expect(body).toMatch(/Supabase/i);
  });

  test("/terms has >3000 chars, 12 numbered sections, Delaware law", async ({ page }) => {
    await page.goto("/terms");
    const body = (await page.textContent("body")) ?? "";
    expect(body.length).toBeGreaterThan(3000);
    expect(body).toMatch(/12\.\s*Contact|Contact\s*\n.{0,5}12\./i);
    expect(body).toMatch(/Delaware/);
  });
});

test.describe("Email domain consistency", () => {
  const CHECK = ["/contact", "/privacy", "/pricing"];
  for (const path of CHECK) {
    test(`${path} uses @daytrip-ai.com (no @daytrip.travel)`, async ({ page }) => {
      await page.goto(path);
      const body = (await page.textContent("body")) ?? "";
      const html = await page.content();
      expect(body, `${path} body text`).not.toMatch(/@daytrip\.travel/);
      expect(html, `${path} HTML including hrefs`).not.toMatch(/@daytrip\.travel/);
    });
  }
});

test.describe("Destinations and guides index pages", () => {
  test("/destinations lists multiple regions", async ({ page }) => {
    await page.goto("/destinations");
    const body = (await page.textContent("body")) ?? "";
    for (const region of ["Europe", "Asia", "Americas"]) {
      expect(body).toContain(region);
    }
  });

  test("/guides lists at least 6 guide cards", async ({ page }) => {
    await page.goto("/guides");
    const links = page.locator("a[href^='/guides/']");
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });
});

test.describe("No placeholder / lorem ipsum in production copy", () => {
  const SAMPLES = ["/", "/pricing", "/contact", "/destinations", "/destinations/paris/3-day-itinerary"];
  for (const path of SAMPLES) {
    test(`${path} has no lorem ipsum`, async ({ page }) => {
      await page.goto(path);
      const body = (await page.textContent("body")) ?? "";
      expect(body).not.toMatch(/lorem ipsum/i);
      expect(body).not.toMatch(/\btodo\b:/i);
      expect(body).not.toMatch(/\bfixme\b/i);
    });
  }
});
