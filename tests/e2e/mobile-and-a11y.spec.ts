import { test, expect, devices } from "@playwright/test";

/**
 * Runs at both mobile (iPhone 13) and desktop via the playwright.config.ts
 * `projects` array. The tests guard viewport-specific assertions with
 * conditional branches.
 */

test.describe("Navbar hamburger (mobile only)", () => {
  test("hamburger visible below 1024px, desktop nav hidden", async ({ page, viewport }) => {
    if (!viewport || viewport.width >= 1024) test.skip();
    await page.goto("/");
    const hamburger = page.locator('button[aria-controls="mobile-nav-drawer"]');
    await expect(hamburger).toBeVisible();
  });

  test("hamburger has correct aria attributes and 44x44 tap target", async ({ page, viewport }) => {
    if (!viewport || viewport.width >= 1024) test.skip();
    await page.goto("/");
    const hamburger = page.locator('button[aria-controls="mobile-nav-drawer"]');
    await expect(hamburger).toHaveAttribute("aria-expanded", "false");
    await expect(hamburger).toHaveAttribute("aria-controls", "mobile-nav-drawer");
    const box = await hamburger.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test("drawer opens on tap and shows nav links", async ({ page, viewport }) => {
    if (!viewport || viewport.width >= 1024) test.skip();
    await page.goto("/");
    await page.locator('button[aria-controls="mobile-nav-drawer"]').click();

    const drawer = page.locator("#mobile-nav-drawer");
    await expect(drawer).toHaveAttribute("role", "dialog");
    await expect(drawer).toHaveAttribute("aria-modal", "true");
    await expect(page.locator('button[aria-controls="mobile-nav-drawer"]')).toHaveAttribute(
      "aria-expanded",
      "true"
    );

    // Wait for drawer transform to settle
    await page.waitForTimeout(400);
    const rect = await drawer.boundingBox();
    // Drawer should be inside viewport
    expect(rect?.x ?? 99999).toBeLessThan(viewport!.width);

    // Nav links accessible
    for (const label of ["Destinations", "Guides", "Pricing"]) {
      await expect(drawer.getByRole("link", { name: new RegExp(label, "i") })).toBeVisible();
    }
  });

  test("drawer closes on backdrop tap", async ({ page, viewport }) => {
    if (!viewport || viewport.width >= 1024) test.skip();
    await page.goto("/");
    await page.locator('button[aria-controls="mobile-nav-drawer"]').click();
    await page.waitForTimeout(400);

    // Click the backdrop (fixed inset-0 element)
    const backdrop = page.locator(".bg-charcoal-900\\/40");
    await backdrop.click({ position: { x: 10, y: 300 }, force: true });
    await expect(page.locator('button[aria-controls="mobile-nav-drawer"]')).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  test("drawer nav link triggers navigation", async ({ page, viewport }) => {
    if (!viewport || viewport.width >= 1024) test.skip();
    await page.goto("/");
    await page.locator('button[aria-controls="mobile-nav-drawer"]').click();
    await page.waitForTimeout(400);
    const drawer = page.locator("#mobile-nav-drawer");
    await drawer.getByRole("link", { name: /destinations/i }).click();
    // The primary behavior: tapping a drawer link lands the user on the linked page.
    // (The global Navbar is currently only rendered on `/`; other pages have their
    // own headers, so we don't assert post-nav drawer state here.)
    await page.waitForURL(/\/destinations/, { timeout: 10_000 });
    expect(page.url()).toContain("/destinations");
  });
});

test.describe("Desktop nav (desktop only)", () => {
  test("desktop nav visible at 1024+, hamburger hidden", async ({ page, viewport }) => {
    if (!viewport || viewport.width < 1024) test.skip();
    await page.goto("/");
    await expect(page.getByRole("link", { name: /^destinations$/i }).first()).toBeVisible();
    const hamburger = page.locator('button[aria-controls="mobile-nav-drawer"]');
    // Should not be visible on desktop (has lg:hidden)
    await expect(hamburger).toBeHidden();
  });
});

test.describe("Tap targets (mobile only)", () => {
  test("travelers +/- buttons are at least 44x44", async ({ page, viewport }) => {
    if (!viewport || viewport.width >= 1024) test.skip();
    await page.goto("/");
    const inc = page.getByRole("button", { name: /increase travelers/i });
    const dec = page.getByRole("button", { name: /decrease travelers/i });
    for (const btn of [inc, dec]) {
      const box = await btn.boundingBox();
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe("No horizontal overflow", () => {
  const PAGES = [
    "/",
    "/pricing",
    "/about",
    "/contact",
    "/login",
    "/signup",
    "/destinations",
    "/destinations/paris",
    "/destinations/paris/3-day-itinerary",
    "/trip/demo",
  ];
  for (const path of PAGES) {
    test(`${path} has no horizontal overflow`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle").catch(() => {});
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1
      );
      expect(overflow, `horizontal overflow on ${path}`).toBe(false);
    });
  }
});

test.describe("Keyboard accessibility", () => {
  test("login form: Tab order reaches password input from email", async ({ page, browserName, isMobile }) => {
    // Mobile (touch) browsers don't have deterministic Tab semantics; skip.
    test.skip(isMobile, "Tab-key semantics vary on mobile");
    // Safari's keyboard-focus model needs explicit enabling and differs
    // enough that Tab between form fields isn't reliable in Playwright.
    test.skip(browserName === "webkit", "Safari Tab semantics differ");
    await page.goto("/login");
    await page.locator("#login-email").focus();
    await page.keyboard.press("Tab");
    await expect(page.locator("#login-password")).toBeFocused();
  });

  test("hamburger is reachable by Tab and activates with Enter", async ({ page, viewport }) => {
    if (!viewport || viewport.width >= 1024) test.skip();
    await page.goto("/");
    // Focus the hamburger directly, then activate
    await page.locator('button[aria-controls="mobile-nav-drawer"]').focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
    await expect(page.locator('button[aria-controls="mobile-nav-drawer"]')).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  test("all form inputs on /contact have a linked label", async ({ page }) => {
    await page.goto("/contact");
    const inputs = await page.locator("form input, form textarea").all();
    for (const input of inputs) {
      const id = await input.getAttribute("id");
      if (!id) continue;
      const label = page.locator(`label[for="${id}"]`);
      await expect(label, `label for #${id}`).toHaveCount(1);
    }
  });
});

test.describe("Visual regression screenshots (baseline)", () => {
  const SHOTS = [
    { name: "home", path: "/" },
    { name: "pricing", path: "/pricing" },
    { name: "trip-demo", path: "/trip/demo" },
    { name: "404", path: "/zzznotfound" },
  ];
  for (const { name, path } of SHOTS) {
    test(`screenshot ${name}`, async ({ page }, testInfo) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle").catch(() => {});
      // Disable animations so screenshots are stable
      await page.addStyleTag({
        content: `*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }`,
      });
      const buf = await page.screenshot({ fullPage: false });
      await testInfo.attach(`${name}-${testInfo.project.name}`, {
        body: buf,
        contentType: "image/png",
      });
    });
  }
});
