import { test, expect, Page } from "@playwright/test";

/**
 * Edge-case tests for the region → city picker.
 *
 * Companion to region-picker.spec.ts, which covers the happy path.
 * This file probes:
 *  - multi-region expansion
 *  - city-selection persistence across region toggles
 *  - tooltip (title attribute) on city chips
 *  - visual selected state (terracotta bg + Check SVG)
 *  - keyboard toggle via Tab + Enter
 *
 * BEHAVIOR NOTES (derived from reading the component + wiring):
 *
 *  DestinationSearch.tsx has a comment at line ~137 claiming selectedCities
 *  is "Cleared when all regions are deselected", but the actual
 *  toggleRegion() implementation (line ~205) ONLY mutates `regions` — it
 *  never touches `selectedCities`. So the REAL behavior is that city
 *  selections persist across region toggles (including deselect → re-select).
 *  The comment is stale; tests match real behavior, not the comment.
 */

async function openPicker(page: Page) {
  await page.goto("/");
  await page
    .getByRole("heading", { name: /your journey begins/i })
    .scrollIntoViewIfNeeded();
}

test.describe("region → city picker — edges", () => {
  test("selecting multiple regions expands both, counts are independent", async ({
    page,
  }) => {
    await openPicker(page);

    await page
      .getByRole("button", { name: "Eastern Europe", exact: true })
      .click();
    await page.getByRole("button", { name: "Balkans", exact: true }).click();

    // Picker visible
    await expect(
      page.getByText(/Pick the cities you want to visit/i)
    ).toBeVisible();

    // Both region headers in the picker. Target the h4 to disambiguate
    // from the region-toggle buttons above the picker.
    await expect(
      page.locator("h4", { hasText: /^Eastern Europe$/ })
    ).toBeVisible();
    await expect(
      page.locator("h4", { hasText: /^Balkans$/ })
    ).toBeVisible();

    // Country headers from both regions render
    await expect(page.getByText("Czech Republic", { exact: true })).toBeVisible();
    await expect(page.getByText("Croatia", { exact: true })).toBeVisible();

    // Pick a city from Eastern Europe (Prague) — count goes to 1
    await page.getByRole("button", { name: "Prague", exact: true }).click();
    await expect(page.getByText("1 selected", { exact: true })).toBeVisible();

    // Pick a city from Balkans (Dubrovnik is in the Balkans > Croatia catalog)
    await page.getByRole("button", { name: "Dubrovnik", exact: true }).click();
    await expect(page.getByText("2 selected", { exact: true })).toBeVisible();

    // Both chips are selected simultaneously — selecting one region's city
    // does not deselect the other's.
    await expect(
      page.getByRole("button", { name: "Prague", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("button", { name: "Dubrovnik", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("deselecting a region collapses that region's section but city stays in state", async ({
    page,
  }) => {
    await openPicker(page);

    const easternEurope = page.getByRole("button", {
      name: "Eastern Europe",
      exact: true,
    });
    const balkans = page.getByRole("button", { name: "Balkans", exact: true });

    await easternEurope.click();
    await balkans.click();

    // Pick Prague (EE) and Dubrovnik (Balkans)
    await page.getByRole("button", { name: "Prague", exact: true }).click();
    await page.getByRole("button", { name: "Dubrovnik", exact: true }).click();
    await expect(page.getByText("2 selected", { exact: true })).toBeVisible();

    // Deselect Eastern Europe. Its section should collapse (Czech Republic
    // header no longer visible), but Balkans section stays open and the
    // overall selected-count is UNCHANGED — the component never clears
    // selectedCities when a region is deselected.
    await easternEurope.click();
    await expect(
      page.getByText("Czech Republic", { exact: true })
    ).not.toBeVisible();
    await expect(page.getByText("Croatia", { exact: true })).toBeVisible();
    await expect(page.getByText("2 selected", { exact: true })).toBeVisible();
  });

  test("re-selecting a region shows the previously-picked city still checked", async ({
    page,
  }) => {
    await openPicker(page);

    const easternEurope = page.getByRole("button", {
      name: "Eastern Europe",
      exact: true,
    });

    await easternEurope.click();
    await page.getByRole("button", { name: "Warsaw", exact: true }).click();
    await expect(page.getByText("1 selected", { exact: true })).toBeVisible();

    // Toggle region off then on
    await easternEurope.click();
    await easternEurope.click();

    // Warsaw chip should still be rendered as selected (aria-pressed true)
    const warsaw = page.getByRole("button", { name: "Warsaw", exact: true });
    await expect(warsaw).toBeVisible();
    await expect(warsaw).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("1 selected", { exact: true })).toBeVisible();
  });

  test("city chip exposes its catalog blurb via the title attribute", async ({
    page,
  }) => {
    await openPicker(page);
    await page
      .getByRole("button", { name: "Eastern Europe", exact: true })
      .click();

    const prague = page.getByRole("button", { name: "Prague", exact: true });
    await expect(prague).toBeVisible();
    // From region-catalog.ts Czech Republic > Prague
    await expect(prague).toHaveAttribute(
      "title",
      "Old Town with the 15th-century astronomical clock."
    );

    // Hover to surface the tooltip (browser-native; we just assert the
    // attribute is still present after hover).
    await prague.hover();
    await expect(prague).toHaveAttribute(
      "title",
      "Old Town with the 15th-century astronomical clock."
    );
  });

  test("selected city chip has terracotta bg class and renders a Check SVG; deselected does not", async ({
    page,
  }) => {
    await openPicker(page);
    await page
      .getByRole("button", { name: "Eastern Europe", exact: true })
      .click();

    const krakow = page.getByRole("button", { name: "Kraków", exact: true });

    // Deselected: no terracotta bg, no inner svg
    await expect(krakow).not.toHaveClass(/bg-terracotta-500/);
    await expect(krakow.locator("svg")).toHaveCount(0);

    await krakow.click();

    // Selected: terracotta bg + one <svg> (the lucide Check icon)
    await expect(krakow).toHaveClass(/bg-terracotta-500/);
    await expect(krakow.locator("svg")).toHaveCount(1);

    // Toggle back off — svg disappears again
    await krakow.click();
    await expect(krakow).not.toHaveClass(/bg-terracotta-500/);
    await expect(krakow.locator("svg")).toHaveCount(0);
  });

  test("keyboard: focus a city chip and press Enter to toggle selection", async ({
    page,
  }) => {
    await openPicker(page);
    await page
      .getByRole("button", { name: "Eastern Europe", exact: true })
      .click();

    const budapest = page.getByRole("button", {
      name: "Budapest",
      exact: true,
    });
    await expect(budapest).toBeVisible();

    // Programmatically focus (avoids brittle Tab-count walks through
    // many region/style/city chips on the page) — equivalent UX-wise
    // once the user tabs here.
    await budapest.focus();
    await expect(budapest).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(budapest).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("1 selected", { exact: true })).toBeVisible();

    // Enter again toggles back off
    await page.keyboard.press("Enter");
    await expect(budapest).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByText("0 selected", { exact: true })).toBeVisible();
  });
});
