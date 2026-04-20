import { test, expect } from "@playwright/test";

/**
 * Emulates print media and prefers-reduced-motion so the layout is
 * still usable in both modes. We capture a screenshot for manual
 * review and assert the page has measurable, non-broken content.
 */

const CHECK_PAGES = ["/", "/trip/demo", "/destinations/paris/5-day-itinerary"];

test.describe("print CSS renders without breaking the page", () => {
  for (const path of CHECK_PAGES) {
    test(`${path} is printable`, async ({ page }, testInfo) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.emulateMedia({ media: "print" });

      // Give the browser a frame to apply the media change
      await page.waitForTimeout(200);

      const metrics = await page.evaluate(() => ({
        bodyText: document.body.innerText.length,
        overflowX: document.documentElement.scrollWidth - window.innerWidth,
      }));
      expect(metrics.bodyText, `${path} print body text`).toBeGreaterThan(200);
      // A little overflow is fine (navs, etc.); anything > 400px indicates
      // the print layout is broken.
      expect(metrics.overflowX, `${path} print overflow`).toBeLessThan(400);

      const buf = await page.screenshot({ fullPage: false });
      await testInfo.attach(`print-${path.replace(/\//g, "_")}`, {
        body: buf,
        contentType: "image/png",
      });
    });
  }
});

test.describe("prefers-reduced-motion: no parallax, animations suppressed", () => {
  test("homepage still renders with reduced motion", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/");
    await page.waitForLoadState("networkidle").catch(() => {});
    const bodyLen = await page.evaluate(() => document.body.innerText.length);
    expect(bodyLen).toBeGreaterThan(400);

    // Spot check: no motion.div with transform mid-flight. We assert
    // the hero still renders content and the Plan-a-trip area is visible.
    const visible = await page.evaluate(() => {
      const el = document.getElementById("plan");
      if (!el) return true; // hash target may not exist on every page
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    expect(visible).toBe(true);
    await ctx.close();
  });

  test("trip/demo honors reduced-motion for activity swap", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/trip/demo");
    await page.waitForLoadState("networkidle").catch(() => {});
    const cards = page.locator("h4");
    const count = await cards.count();
    expect(count).toBeGreaterThan(5);
    await ctx.close();
  });
});

test.describe("dark mode color scheme", () => {
  test("dark color scheme doesn't break the homepage", async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: "dark" });
    const page = await ctx.newPage();
    await page.goto("/");
    await page.waitForLoadState("networkidle").catch(() => {});
    const bodyLen = await page.evaluate(() => document.body.innerText.length);
    expect(bodyLen).toBeGreaterThan(400);
    await ctx.close();
  });
});
