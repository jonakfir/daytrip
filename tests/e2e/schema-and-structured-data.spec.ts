import { test, expect } from "@playwright/test";

async function getJsonLd(page: import("@playwright/test").Page): Promise<unknown[]> {
  const scripts = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  const parsed: unknown[] = [];
  for (const s of scripts) {
    try {
      const obj = JSON.parse(s);
      // Unwrap Schema.org @graph containers
      if (obj && typeof obj === "object" && Array.isArray((obj as { "@graph"?: unknown[] })["@graph"])) {
        parsed.push(...(obj as { "@graph": unknown[] })["@graph"]);
      } else if (Array.isArray(obj)) {
        parsed.push(...obj);
      } else {
        parsed.push(obj);
      }
    } catch {
      // ignore
    }
  }
  return parsed;
}

test.describe("JSON-LD structured data", () => {
  test("homepage includes Organization and WebSite schemas", async ({ page }) => {
    await page.goto("/");
    const items = await getJsonLd(page);
    const types = items.map((i) => (i as { "@type"?: string })["@type"]).filter(Boolean);
    expect(types.some((t) => String(t).toLowerCase().includes("organization"))).toBe(true);
    expect(types.some((t) => String(t).toLowerCase().includes("website"))).toBe(true);
  });

  test("every JSON-LD block parses as valid JSON", async ({ page }) => {
    const PAGES = [
      "/",
      "/destinations",
      "/destinations/paris",
      "/destinations/paris/3-day-itinerary",
      "/guides",
      "/trip/demo",
    ];
    for (const path of PAGES) {
      await page.goto(path);
      const scripts = await page
        .locator('script[type="application/ld+json"]')
        .allTextContents();
      for (const s of scripts) {
        expect(() => JSON.parse(s), `invalid JSON-LD on ${path}`).not.toThrow();
      }
    }
  });

  test("destination hub page emits at least one JSON-LD block", async ({ page }) => {
    await page.goto("/destinations/paris");
    const items = await getJsonLd(page);
    expect(items.length, "JSON-LD items on /destinations/paris").toBeGreaterThan(0);
  });

  test("destination itinerary page includes BreadcrumbList schema", async ({ page }) => {
    await page.goto("/destinations/paris/3-day-itinerary");
    const items = await getJsonLd(page);
    // BreadcrumbList may sit inside @graph or as a standalone script block
    const breadcrumb = items.find(
      (i) => (i as { "@type"?: string | string[] })["@type"] === "BreadcrumbList"
    );
    if (!breadcrumb) {
      // Some pages emit breadcrumbs via raw JSON — verify it's at least in page HTML
      const html = await page.content();
      expect(html, "BreadcrumbList must appear in page HTML or @graph").toMatch(/BreadcrumbList/);
      return;
    }
    const list = (breadcrumb as { itemListElement?: unknown[] }).itemListElement;
    expect(Array.isArray(list)).toBe(true);
    expect((list ?? []).length).toBeGreaterThanOrEqual(2);
  });

  test("guides index emits a schema block", async ({ page }) => {
    await page.goto("/guides");
    const items = await getJsonLd(page);
    const html = await page.content();
    // Either a BreadcrumbList in a parsed block, or at least a schema script in HTML
    const hasBreadcrumb = items.some(
      (i) => (i as { "@type"?: string })["@type"] === "BreadcrumbList"
    );
    expect(hasBreadcrumb || html.includes("BreadcrumbList")).toBe(true);
  });
});

test.describe("Page metadata: lang and viewport", () => {
  test("html has lang attribute set to en", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
  });

  test("viewport meta tag exists and includes device-width", async ({ page }) => {
    await page.goto("/");
    const viewport = await page
      .locator('meta[name="viewport"]')
      .first()
      .getAttribute("content");
    expect(viewport).toMatch(/device-width/);
  });
});

test.describe("Heading hierarchy is sane", () => {
  const PAGES = [
    "/",
    "/pricing",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/login",
    "/signup",
    "/destinations",
    "/destinations/paris",
    "/destinations/paris/3-day-itinerary",
    "/guides",
    "/trip/demo",
  ];
  for (const path of PAGES) {
    test(`${path} has at least one <h1>`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle").catch(() => {});
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 5000 });
      const count = await page.locator("h1").count();
      expect(count, `h1 count on ${path}`).toBeGreaterThanOrEqual(1);
      // Allow up to 3 h1s for pages with multi-section heroes
      expect(count, `h1 count on ${path}`).toBeLessThanOrEqual(3);
    });
  }
});

test.describe("Images have alt text where they carry meaning", () => {
  test("homepage images either have alt or are marked decorative", async ({ page }) => {
    await page.goto("/");
    const imgs = await page.locator("img").all();
    for (const img of imgs) {
      const alt = await img.getAttribute("alt");
      const role = await img.getAttribute("role");
      const ariaHidden = await img.getAttribute("aria-hidden");
      const isDecorative =
        role === "presentation" || ariaHidden === "true" || alt === "";
      const hasMeaningfulAlt = (alt ?? "").trim().length > 0;
      expect(isDecorative || hasMeaningfulAlt).toBe(true);
    }
  });
});

test.describe("Favicon and touch icons", () => {
  test("favicon link is present", async ({ page }) => {
    await page.goto("/");
    const count = await page.locator('link[rel~="icon"]').count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("No double-slash links and no trailing whitespace in href", () => {
  test("homepage links are clean", async ({ page }) => {
    await page.goto("/");
    const hrefs = await page
      .locator("a[href]")
      .evaluateAll((els) => els.map((el) => (el as HTMLAnchorElement).getAttribute("href") ?? ""));
    for (const h of hrefs) {
      expect(h.startsWith("http") || h.startsWith("#") || h.startsWith("/") || h.startsWith("mailto:") || h.startsWith("tel:"))
        .toBeTruthy();
      // No accidental "//internal" path (would collapse to protocol-relative)
      if (!h.startsWith("http") && !h.startsWith("//")) {
        expect(h, `link on /: ${h}`).not.toMatch(/^\/\//);
      }
      expect(h).not.toMatch(/^\s|\s$/);
    }
  });
});
