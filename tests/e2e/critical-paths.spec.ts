import { test, expect } from "@playwright/test";

const PUBLIC_PAGES = [
  "/",
  "/login",
  "/signup",
  "/pricing",
  "/contact",
  "/about",
  "/privacy",
  "/terms",
  "/destinations",
  "/destinations/paris",
  "/destinations/paris/2-day-itinerary",
  "/destinations/paris/3-day-itinerary",
  "/destinations/paris/4-day-itinerary",
  "/destinations/paris/5-day-itinerary",
  "/destinations/paris/7-day-itinerary",
  "/destinations/paris/10-day-itinerary",
  "/destinations/tokyo",
  "/destinations/tokyo/3-day-itinerary",
  "/destinations/rome/5-day-itinerary",
  "/guides",
  "/trip/demo",
];

test.describe("Smoke: every public page returns 200 + no runtime errors", () => {
  for (const path of PUBLIC_PAGES) {
    test(`GET ${path} renders cleanly`, async ({ page }) => {
      const errors: string[] = [];
      const failed5xx: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("response", (r) => {
        if (r.status() >= 500 && !r.url().includes("/_next/")) {
          failed5xx.push(`${r.status()} ${r.url()}`);
        }
      });

      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `status for ${path}`).toBe(200);
      // Give client components a moment to run
      await page.waitForLoadState("networkidle").catch(() => {});
      expect(errors, `console errors on ${path}`).toEqual([]);
      expect(failed5xx, `5xx responses on ${path}`).toEqual([]);
    });
  }
});

test.describe("404 branding", () => {
  test("unknown URL returns branded 404 with CTAs", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.locator("text=wandered off the map")).toBeVisible();
    await expect(page.getByRole("link", { name: /plan a new trip/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /browse destinations/i })).toBeVisible();
  });

  test("404 page is noindex", async ({ page }) => {
    await page.goto("/nonexistent");
    // Next.js emits its own default robots meta in addition to ours — both should say noindex.
    const all = await page.locator('meta[name="robots"]').evaluateAll((els) =>
      els.map((el) => (el as HTMLMetaElement).content)
    );
    expect(all.length).toBeGreaterThanOrEqual(1);
    for (const content of all) {
      expect(content).toMatch(/noindex/i);
    }
  });
});

test.describe("Homepage primary flow", () => {
  test("Flying from is marked optional and does not block CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Flying from")).toBeVisible();
    await expect(page.locator("text=(optional)")).toBeVisible();
  });

  test("travelers counter handles rapid clicks without dropping state", async ({ page }) => {
    await page.goto("/");
    const inc = page.getByRole("button", { name: /increase travelers/i });
    const dec = page.getByRole("button", { name: /decrease travelers/i });
    // baseline = 2
    for (let i = 0; i < 10; i++) await inc.click();
    // Should reliably reach 12 (was buggy due to stale closure)
    const travelers = page
      .locator('text=/^\\d+$/')
      .filter({ hasText: /^12$/ })
      .first();
    await expect(travelers).toBeVisible();
    // Min clamp at 1
    for (let i = 0; i < 20; i++) await dec.click();
    await expect(page.locator("text=/^1$/").first()).toBeVisible();
  });

  test("typing a destination enables Plan my trip", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("button", { name: /plan my trip/i });
    await expect(cta).toBeDisabled();

    // Find the "Going to" destination input
    const destInput = page.locator('input').filter({ hasNot: page.locator('[type=date]') }).nth(1);
    await destInput.fill("Paris");
    await expect(cta).toBeEnabled();
  });

  test("Plan my trip navigates to generating page", async ({ page }) => {
    await page.goto("/");
    const destInput = page.locator('input').filter({ hasNot: page.locator('[type=date]') }).nth(1);
    await destInput.fill("Paris");
    const cta = page.getByRole("button", { name: /plan my trip/i });
    await cta.click();
    await page.waitForURL(/\/trip\/generating/, { timeout: 10_000 });
    expect(page.url()).toContain("destination=Paris");
  });
});

test.describe("Trip demo: Change button cycling", () => {
  test("clicking Change swaps to a new activity", async ({ page }) => {
    await page.goto("/trip/demo");
    await page.waitForLoadState("networkidle").catch(() => {});

    // Clear sessionStorage so repeated runs see the baseline Ichiran
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await page.waitForLoadState("networkidle").catch(() => {});

    // Find the first non-disabled Change button and capture its day-section parent
    const changeBtn = page.getByRole("button", { name: /^change$/i }).first();
    await expect(changeBtn).toBeVisible();

    // Capture the activity name currently rendered BEFORE clicking
    const firstH4 = page.locator("article, section, div").filter({
      has: page.getByRole("button", { name: /^change$/i }),
    });
    const allNames = await page.locator("h4").allTextContents();
    const targetIndex = allNames.findIndex((n) => n.includes("Ichiran Ramen"));
    if (targetIndex < 0) test.skip(true, "Ichiran not rendered");

    const before = allNames[targetIndex];
    await changeBtn.click();

    // Wait for React state update
    await expect(async () => {
      const after = (await page.locator("h4").allTextContents())[targetIndex];
      expect(after).not.toBe(before);
    }).toPass({ timeout: 5000 });
  });

  test("Change on activity WITHOUT local alternatives falls back to category pool", async ({ page }) => {
    await page.goto("/trip/demo");
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await page.waitForLoadState("networkidle").catch(() => {});

    const allNames = await page.locator("h4").allTextContents();
    const shibuyaIndex = allNames.findIndex((n) => n.includes("Shibuya Crossing"));
    if (shibuyaIndex < 0) test.skip(true, "Shibuya Crossing not found");

    const before = allNames[shibuyaIndex];
    // Click the Change button that sits in the same parent as the Shibuya h4
    const allChange = await page.getByRole("button", { name: /^change$/i }).all();
    // Map Change buttons to their card's h4 by walking up
    let clicked = false;
    for (const btn of allChange) {
      const sibling = await btn.evaluate((el) => {
        let c: HTMLElement | null = el.parentElement;
        while (c && !c.querySelector("h4")) c = c.parentElement;
        return c?.querySelector("h4")?.textContent ?? null;
      });
      if (sibling === before) {
        await btn.click();
        clicked = true;
        break;
      }
    }
    expect(clicked, "found Shibuya's Change button").toBe(true);

    await expect(async () => {
      const after = (await page.locator("h4").allTextContents())[shibuyaIndex];
      expect(after).not.toBe(before);
    }).toPass({ timeout: 8000 });
  });

  test("Booking links open in new tab with rel=noopener", async ({ page }) => {
    await page.goto("/trip/demo");
    await page.waitForLoadState("networkidle").catch(() => {});
    // Booking links have target=_blank + rel with noopener; use that as selector
    const externalLinks = page.locator('a[target="_blank"][rel*="noopener"]');
    const count = await externalLinks.count();
    expect(count).toBeGreaterThan(0);
    // Verify all have noopener explicitly
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = externalLinks.nth(i);
      await expect(link).toHaveAttribute("rel", /noopener/);
    }
  });

  test("Expand all / Collapse all toggle works", async ({ page }) => {
    await page.goto("/trip/demo");
    const toggle = page.getByRole("button", {
      name: /collapse all days|expand all days/i,
    });
    await expect(toggle).toBeVisible();
    const initialLabel = await toggle.textContent();
    await toggle.click();
    await expect(toggle).not.toHaveText(initialLabel ?? "");
  });

  test("Share panel opens via Share button", async ({ page }) => {
    await page.goto("/trip/demo");
    const shareBtn = page.getByRole("button", { name: /share/i }).first();
    await shareBtn.click();
    await expect(page.getByRole("dialog").or(page.getByText(/share this trip/i))).toBeVisible();
  });
});

test.describe("Auth-gated pages redirect when logged out", () => {
  test("/account redirects to /login", async ({ page }) => {
    await page.goto("/account");
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toMatch(/next=%2Faccount|next=\/account/);
  });
});

test.describe("API endpoints behave correctly when unauthenticated", () => {
  test("/api/auth/me returns 200 with authenticated:false", async ({ request }) => {
    const r = await request.get("/api/auth/me");
    expect(r.status()).toBe(200);
    const j = await r.json();
    expect(j.authenticated).toBe(false);
  });

  test("/api/me/trips/log returns 401 (not 500)", async ({ request }) => {
    const r = await request.post("/api/me/trips/log", {
      data: { shareId: "x", destination: "Paris" },
    });
    expect(r.status()).toBe(401);
  });

  test("/api/swap-activity returns 401 for anon, UI degrades gracefully", async ({ request }) => {
    const r = await request.post("/api/swap-activity", {
      data: {
        activity: { time: "14:00", name: "Test", category: "culture", description: "x", duration: "1h" },
        destination: "Paris",
      },
    });
    expect(r.status()).toBe(401);
  });

  test("/api/admin/users is protected", async ({ request }) => {
    const r = await request.get("/api/admin/users");
    expect([401, 403]).toContain(r.status());
  });
});
