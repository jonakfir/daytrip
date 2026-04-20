import { test, expect } from "@playwright/test";

/**
 * Crawls every internal link found on the homepage's footer (and header)
 * and asserts each one returns 2xx. Guards against link-rot.
 */

test.describe("Footer and header link health (homepage)", () => {
  test("every internal link resolves to 2xx", async ({ page, request }) => {
    await page.goto("/");
    const hrefs: string[] = await page.evaluate(() => {
      const out: string[] = [];
      document.querySelectorAll("a[href]").forEach((a) => {
        const h = (a as HTMLAnchorElement).getAttribute("href") ?? "";
        if (
          h.startsWith("/") &&
          !h.startsWith("//") &&
          !h.startsWith("/api/")
        ) {
          out.push(h.split("#")[0]);
        }
      });
      return Array.from(new Set(out));
    });

    expect(hrefs.length, "should find >0 internal links on /").toBeGreaterThan(5);

    const failures: string[] = [];
    for (const href of hrefs) {
      const r = await request.get(href);
      if (r.status() < 200 || r.status() >= 400) {
        failures.push(`${r.status()} ${href}`);
      }
    }
    expect(failures, `broken internal links: ${failures.join(", ")}`).toEqual([]);
  });

  test("every external link has rel=noopener or rel=noreferrer", async ({ page }) => {
    await page.goto("/");
    const externals = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a[href]"))
        .map((a) => ({
          href: (a as HTMLAnchorElement).getAttribute("href") ?? "",
          rel: (a as HTMLAnchorElement).getAttribute("rel") ?? "",
          target: (a as HTMLAnchorElement).getAttribute("target") ?? "",
        }))
        .filter((x) => x.href.startsWith("http") && !x.href.includes("daytrip-ai.com"));
    });
    for (const link of externals) {
      if (link.target === "_blank") {
        expect(link.rel, `rel on ${link.href}`).toMatch(/noopener|noreferrer/);
      }
    }
  });

  test("footer contains legal + discovery links", async ({ page }) => {
    await page.goto("/");
    const body = (await page.textContent("body")) ?? "";
    for (const needle of ["Privacy", "Terms", "Contact", "Destinations"]) {
      expect(body, `homepage body should mention ${needle}`).toContain(needle);
    }
  });
});

test.describe("Footer exists on pages with the homepage-style layout", () => {
  const PAGES = ["/", "/destinations", "/destinations/paris"];
  for (const path of PAGES) {
    test(`${path} has Privacy + Terms links visible`, async ({ page }) => {
      await page.goto(path);
      const privacyLinks = page.locator('a[href="/privacy"]');
      const termsLinks = page.locator('a[href="/terms"]');
      expect(await privacyLinks.count()).toBeGreaterThan(0);
      expect(await termsLinks.count()).toBeGreaterThan(0);
    });
  }
});

test.describe("Back/home navigation on minimal-layout pages", () => {
  const MINIMAL = ["/pricing", "/about", "/contact", "/privacy", "/terms"];
  for (const path of MINIMAL) {
    test(`${path} has a visible link back to / `, async ({ page }) => {
      await page.goto(path);
      // Either a Daytrip brand link or an explicit "Back" link
      const backLinks = page.locator('a[href="/"]');
      expect(await backLinks.count()).toBeGreaterThan(0);
    });
  }
});

test.describe("Cross-page: 'Plan a trip' path is reachable from every page", () => {
  const PAGES = [
    "/",
    "/destinations",
    "/destinations/paris",
    "/pricing",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/guides",
  ];
  for (const path of PAGES) {
    test(`${path} has at least one link to / or /trip/generating`, async ({ page }) => {
      await page.goto(path);
      const count = await page
        .locator('a[href="/"], a[href^="/trip/"], a[href^="/destinations"]')
        .count();
      expect(count, `escape hatch from ${path}`).toBeGreaterThan(0);
    });
  }
});
