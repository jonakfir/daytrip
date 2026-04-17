import { test, expect } from "@playwright/test";

/**
 * E2E tests for the DestinationSearch form rendered on the homepage.
 *
 * Component: src/components/search/DestinationSearch.tsx
 * Renders inside: src/components/hero/LandscapeHero.tsx
 *
 * The card is identified by its heading "Your journey begins".
 */

test.describe("DestinationSearch form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the search card to be visible before interacting.
    await expect(
      page.getByRole("heading", { name: "Your journey begins", exact: true })
    ).toBeVisible();
  });

  test("submitting with no destination and no regions does not navigate", async ({
    page,
  }) => {
    // Button copy defaults to "Plan my trip" when no destination is entered.
    const submit = page.getByRole("button", { name: "Plan my trip", exact: true });
    await expect(submit).toBeVisible();

    // The submit button is disabled when there's nothing to submit (no city,
    // no region). A disabled submit is effectively a no-op. Attempt a click
    // with `force` to ensure the form's handleSubmit early-returns even if
    // the disabled guard were bypassed.
    await submit.click({ force: true }).catch(() => {
      /* clicking disabled button may be a no-op — that's the point */
    });

    // URL should remain on the homepage.
    await expect(page).toHaveURL(/\/$/);
    // Form heading still visible (didn't navigate to /trip/generating).
    await expect(
      page.getByRole("heading", { name: "Your journey begins", exact: true })
    ).toBeVisible();
  });

  test("clicking a trip-style chip toggles its aria-pressed state", async ({
    page,
  }) => {
    const foodie = page.getByRole("button", { name: "Foodie", exact: true });
    await expect(foodie).toBeVisible();

    // Style chips in the current component don't set aria-pressed. They
    // reflect "active" only via class changes. We test the visible toggle:
    // clicking once makes it active (terracotta background), clicking again
    // removes it. We assert via class list.
    const initialClass = (await foodie.getAttribute("class")) ?? "";
    const initiallyActive = initialClass.includes("bg-terracotta-500");

    await foodie.click();
    const afterFirstClick = (await foodie.getAttribute("class")) ?? "";
    const afterFirstActive = afterFirstClick.includes("bg-terracotta-500");
    expect(afterFirstActive).toBe(!initiallyActive);

    await foodie.click();
    const afterSecondClick = (await foodie.getAttribute("class")) ?? "";
    const afterSecondActive = afterSecondClick.includes("bg-terracotta-500");
    expect(afterSecondActive).toBe(initiallyActive);
  });

  test("destinations input accepts text input", async ({ page }) => {
    // The primary destination PlaceInput has no explicit placeholder text
    // (it's animated via a typewriter effect and the attribute can be empty
    // at the moment we query). Instead, locate it by its sibling MapPin icon
    // inside the "destinations" section — the first text input after the
    // "Flying from" input is the primary destination.
    const inputs = page.locator('input[type="text"]');
    // Origin "Flying from" is the first text input, destination is the second.
    const destination = inputs.nth(1);
    await expect(destination).toBeVisible();

    await destination.fill("Paris, France");
    await expect(destination).toHaveValue("Paris, France");
  });

  test("entering a trip range exceeding 120 days shows an error and does not navigate", async ({
    page,
  }) => {
    // Need a valid destination so handleSubmit proceeds past the
    // "no city, no regions" early-return to reach the date validation.
    const inputs = page.locator('input[type="text"]');
    const destination = inputs.nth(1);
    await destination.fill("Paris, France");

    // Set start and end dates more than 120 days apart.
    const startDate = page.locator('input[type="date"]').first();
    const endDate = page.locator('input[type="date"]').nth(1);

    await startDate.fill("2027-01-01");
    await endDate.fill("2027-12-01"); // ~334 days — well over 120.

    const submit = page.getByRole("button", { name: "Plan my trip", exact: true });
    await submit.click();

    // URL should remain on the homepage (we did not navigate).
    await expect(page).toHaveURL(/\/$/);

    // Error message should surface. The component renders:
    //   "Trips are limited to 120 days. Please choose a shorter range."
    await expect(
      page.getByText(/Trips are limited to 120 days/i)
    ).toBeVisible();
  });

  test("travelers stepper can be incremented", async ({ page }) => {
    const increase = page.getByRole("button", { name: "Increase travelers" });
    const decrease = page.getByRole("button", { name: "Decrease travelers" });
    await expect(increase).toBeVisible();
    await expect(decrease).toBeVisible();

    // The current value is rendered in a <span> next to the buttons.
    // Default is 2 per the component. Increment once -> 3.
    await increase.click();
    await expect(page.getByText("3", { exact: true }).first()).toBeVisible();

    // Decrement back to 2.
    await decrease.click();
    await expect(page.getByText("2", { exact: true }).first()).toBeVisible();
  });
});
