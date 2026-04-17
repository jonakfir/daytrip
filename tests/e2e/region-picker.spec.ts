import { test, expect } from "@playwright/test";

/**
 * Smoke test for the region → city picker on the homepage.
 *
 * Doesn't exercise the backend — just proves the new UX works: pick a
 * region, the city list appears, you can select cities, and the
 * selection count updates.
 */
test.describe("region → city picker", () => {
  test("selecting a region reveals its countries and cities", async ({ page }) => {
    await page.goto("/");

    // Scroll the search card into view (it sits below the hero)
    await page.getByRole("heading", { name: /your journey begins/i }).scrollIntoViewIfNeeded();

    // Pick the "Eastern Europe" region. Its button is rendered inside the
    // search card; use role+name to disambiguate from any decorative text.
    const easternEurope = page.getByRole("button", { name: "Eastern Europe", exact: true });
    await expect(easternEurope).toBeVisible();
    await easternEurope.click();

    // Picker should now be visible with at least one country header.
    await expect(page.getByText(/Pick the cities you want to visit/i)).toBeVisible();
    // Selection count starts at 0
    await expect(page.getByText("0 selected")).toBeVisible();

    // Toggle a known catalog city. Prague is in our Eastern Europe catalog.
    const prague = page.getByRole("button", { name: "Prague", exact: true });
    await expect(prague).toBeVisible();
    await prague.click();

    // Count updates to 1 — use exact match so we don't collide with the
    // region-selection badge which reads "(1 selected)".
    await expect(page.getByText("1 selected", { exact: true })).toBeVisible();

    // Toggle another
    const budapest = page.getByRole("button", { name: "Budapest", exact: true });
    await budapest.click();
    await expect(page.getByText("2 selected", { exact: true })).toBeVisible();

    // Deselect the region → picker collapses
    await easternEurope.click();
    await expect(page.getByText(/Pick the cities you want to visit/i)).not.toBeVisible();
  });

  test("select all / clear all works per region", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("heading", { name: /your journey begins/i }).scrollIntoViewIfNeeded();

    await page.getByRole("button", { name: "Eastern Europe", exact: true }).click();

    // "Select all" button inside the Eastern Europe block
    const selectAll = page.getByRole("button", { name: /Select all/i }).first();
    await selectAll.click();

    // Selection count in the city picker is now >0. Locate the specific
    // span inside the picker (not the region badge which wraps its count
    // in parens).
    const cityCount = page
      .locator("span", { hasText: /^\d+ selected$/ })
      .first();
    const text = await cityCount.innerText();
    expect(parseInt(text)).toBeGreaterThan(0);

    // Clear it
    await page.getByRole("button", { name: /Clear all/i }).first().click();
    await expect(page.getByText("0 selected", { exact: true })).toBeVisible();
  });
});
