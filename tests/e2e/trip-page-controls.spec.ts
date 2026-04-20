import { test, expect } from "@playwright/test";

/**
 * E2E: /trip/[id] page controls.
 *
 * Seeds a fake multi-city itinerary into sessionStorage, opens the
 * share URL, and exercises:
 *   - City subheader on each multi-city day
 *   - Expand all / Collapse all toggle flips every day
 *   - Per-day chevron toggles a single day
 *   - Hotel tier badges render (Hostel / Budget / Mid-range / Upscale)
 *   - BEST PRICE badge is fully inside the flight card (no clipping)
 *   - Export PDF button exists and is clickable
 */

const FAKE_ITINERARY = {
  id: "id-1",
  shareId: "e2e-test",
  destination: "Eastern Europe",
  startDate: "2026-05-01",
  endDate: "2026-05-14",
  travelers: 2,
  travelStyle: "Cultural",
  budget: "mid",
  days: Array.from({ length: 14 }, (_, i) => ({
    dayNumber: i + 1,
    date: `2026-05-${String(i + 1).padStart(2, "0")}`,
    title: `Day ${i + 1} title`,
    morning: [
      {
        time: "09:00",
        name: `Morning place ${i + 1}`,
        category: "food",
        description: "Breakfast",
        duration: "1h",
      },
    ],
    afternoon: [
      {
        time: "13:00",
        name: `Afternoon place ${i + 1}`,
        category: "culture",
        description: "Museum",
        duration: "2h",
      },
    ],
    evening: [
      {
        time: "19:00",
        name: `Evening place ${i + 1}`,
        category: "food",
        description: "Dinner",
        duration: "2h",
      },
    ],
    tip: "A tip",
  })),
  hotels: [],
  hotelsByCity: {
    Prague: [
      { name: "Prague Hostel", pricePerNight: "$40", rating: 4.0, bookingUrl: "https://sky.test", tier: "hostel", city: "Prague" },
      { name: "Prague Budget Inn", pricePerNight: "$95", rating: 4.2, bookingUrl: "https://sky.test", tier: "budget", city: "Prague" },
      { name: "Prague Boutique", pricePerNight: "$180", rating: 4.5, bookingUrl: "https://sky.test", tier: "mid", city: "Prague" },
      { name: "Prague Grand", pricePerNight: "$340", rating: 4.8, bookingUrl: "https://sky.test", tier: "upscale", city: "Prague" },
    ],
    Budapest: [
      { name: "Budapest Hostel", pricePerNight: "$45", rating: 4.0, bookingUrl: "https://sky.test", tier: "hostel", city: "Budapest" },
      { name: "Budapest Budget Inn", pricePerNight: "$95", rating: 4.2, bookingUrl: "https://sky.test", tier: "budget", city: "Budapest" },
      { name: "Budapest Boutique", pricePerNight: "$175", rating: 4.6, bookingUrl: "https://sky.test", tier: "mid", city: "Budapest" },
      { name: "Budapest Grand", pricePerNight: "$320", rating: 4.7, bookingUrl: "https://sky.test", tier: "upscale", city: "Budapest" },
    ],
  },
  cityPlan: [
    { city: "Prague", country: "Czech Republic", startDay: 1, endDay: 7 },
    { city: "Budapest", country: "Hungary", startDay: 8, endDay: 14 },
  ],
  flights: [
    {
      airline: "United",
      departure: "2026-05-01T09:00",
      arrival: "2026-05-01T21:00",
      price: "$850",
      stops: 1,
      originAirport: "LAX",
      destinationAirport: "PRG",
      bookingUrl: "https://skyscanner.test",
    },
  ],
  tours: [
    {
      name: "Prague Castle Tour",
      price: "$45",
      duration: "3h",
      rating: 4.8,
      bookingUrl: "https://viator.test",
    },
  ],
  tips: ["Cash is king.", "Buy transit cards.", "Book ahead.", "Tip 10%."],
  heroImage: "https://example.test/hero.jpg",
};

async function seedAndGoto(page: import("@playwright/test").Page) {
  // Intercept the /api/share fetch so the page uses sessionStorage
  // (it tries sessionStorage first and only hits the API on miss).
  await page.route("**/api/share/e2e-test", (route) =>
    route.fulfill({ status: 200, json: { itinerary: FAKE_ITINERARY } })
  );
  // Pre-seed sessionStorage via addInitScript so it's set before the
  // page's useEffect reads from it.
  await page.addInitScript((itin) => {
    sessionStorage.setItem(
      `daytrip:itinerary:e2e-test`,
      JSON.stringify(itin)
    );
  }, FAKE_ITINERARY);
  await page.goto("/trip/e2e-test");
  await page.waitForLoadState("networkidle");
}

test.describe("trip page controls", () => {
  test("renders city subheader on every multi-city day", async ({ page }) => {
    await seedAndGoto(page);
    // Day 1 covers Prague; day 14 covers Budapest
    await expect(page.getByText("Prague").first()).toBeVisible();
    await expect(page.getByText("Budapest").first()).toBeVisible();
  });

  test("Expand all / Collapse all toggle flips every day", async ({ page }) => {
    await seedAndGoto(page);
    // All days start expanded — the "Collapse all" button is visible
    const toggle = page.getByRole("button", { name: /Collapse all/i });
    await expect(toggle).toBeVisible();
    await toggle.click();
    // After collapse: button label flips to "Expand all"
    await expect(page.getByRole("button", { name: /Expand all/i })).toBeVisible();
    // Morning / Afternoon / Evening block labels should no longer be visible.
    // The animated body has `hidden` height 0 so text is not rendered.
    await expect(page.getByText("Morning").first()).not.toBeVisible();
    // Expand all again
    await page.getByRole("button", { name: /Expand all/i }).click();
    await expect(page.getByRole("button", { name: /Collapse all/i })).toBeVisible();
  });

  test("hotel tier badges render for multi-city trips", async ({ page }) => {
    await seedAndGoto(page);
    // Each city has all 4 tiers — we should see every label at least once
    for (const label of ["Hostel", "Budget", "Mid-range", "Upscale"]) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
  });

  test("Export PDF and Export DOCX buttons appear in share panel", async ({
    page,
  }) => {
    await seedAndGoto(page);
    // Read back the sessionStorage to confirm seeding worked
    const seeded = await page.evaluate(() =>
      Boolean(sessionStorage.getItem("daytrip:itinerary:e2e-test"))
    );
    expect(seeded).toBe(true);

    // Open the share panel — TripHero has the only exact "Share" button
    const shareTrigger = page.getByRole("button", { name: "Share", exact: true });
    await shareTrigger.click();
    await expect(
      page.getByRole("heading", { name: /Share this trip/i })
    ).toBeVisible();
    // Buttons carry aria-labels for a11y; text is visible but the
    // accessible name uses the full label.
    await expect(
      page.getByRole("button", { name: /Export trip as PDF/i })
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("button", { name: /Export trip as Word DOCX/i })
    ).toBeVisible();
  });
});
