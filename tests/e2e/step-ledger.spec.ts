import { test, expect, type Route } from "@playwright/test";

/**
 * E2E tests for the /trip/generating step ledger.
 *
 * Component: src/app/trip/generating/page.tsx
 *
 * The page on mount POSTs /api/trip/start, then loops POSTing
 * /api/trip/step/:jobId until status is "complete" or "failed".
 *
 * These tests mock both endpoints so the page can run without
 * a real Supabase / Claude backend.
 */

const STEPS = [
  { key: "init", label: "Warming up" },
  { key: "hero", label: "Picking a hero image" },
  { key: "flight_providers", label: "Scanning flight providers" },
  { key: "booking", label: "Reserving hotels & flights" },
  { key: "chunk:0", label: "Drafting day 1-3" },
  { key: "assemble", label: "Assembling your trip" },
];

type StepStatus = "pending" | "running" | "done" | "failed";
interface MockStep {
  index: number;
  key: string;
  label: string;
  status: StepStatus;
  attempts: number;
  error?: string;
}

function baseSteps(): MockStep[] {
  return STEPS.map((s, i) => ({
    index: i,
    key: s.key,
    label: s.label,
    status: "pending",
    attempts: 0,
  }));
}

function emptyPartial() {
  return {
    heroImage: null,
    cityPlan: null,
    booking: null,
    dayChunks: [] as Array<{ chunkIndex: number; days: unknown[] }>,
  };
}

const SEARCH =
  "destination=Tokyo,%20Japan&startDate=2026-05-01&endDate=2026-05-05&travelers=2&style=Cultural";

async function mockStart(page: import("@playwright/test").Page) {
  await page.route("**/api/trip/start", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        jobId: "j1",
        totalSteps: STEPS.length,
        steps: baseSteps(),
      }),
    });
  });
}

test.describe("generating page — step ledger", () => {
  test("shows destination heading on initial render", async ({ page }) => {
    await mockStart(page);
    // Keep the loop pending forever — we only care about the header.
    await page.route("**/api/trip/step/j1", async (route: Route) => {
      const steps = baseSteps();
      steps[0].status = "running";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          jobId: "j1",
          status: "running",
          currentStep: 0,
          totalSteps: STEPS.length,
          stepLabel: steps[0].label,
          steps,
          error: null,
          shareId: null,
          partial: emptyPartial(),
        }),
      });
    });

    await page.goto(`/trip/generating?${SEARCH}`);

    await expect(
      page.getByRole("heading", { name: "Planning your trip to", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Tokyo, Japan", exact: true })
    ).toBeVisible();
  });

  test("ledger renders every step label after start", async ({ page }) => {
    await mockStart(page);
    await page.route("**/api/trip/step/j1", async (route: Route) => {
      const steps = baseSteps();
      steps[0].status = "running";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          jobId: "j1",
          status: "running",
          currentStep: 0,
          totalSteps: STEPS.length,
          stepLabel: steps[0].label,
          steps,
          error: null,
          shareId: null,
          partial: emptyPartial(),
        }),
      });
    });

    await page.goto(`/trip/generating?${SEARCH}`);

    for (const s of STEPS) {
      await expect(page.getByText(s.label, { exact: true }).first()).toBeVisible();
    }
  });

  test("running step row shows an animate-spin element", async ({ page }) => {
    await mockStart(page);
    await page.route("**/api/trip/step/j1", async (route: Route) => {
      const steps = baseSteps();
      steps[0].status = "done";
      steps[1].status = "running"; // hero is spinning
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          jobId: "j1",
          status: "running",
          currentStep: 1,
          totalSteps: STEPS.length,
          stepLabel: steps[1].label,
          steps,
          error: null,
          shareId: null,
          partial: emptyPartial(),
        }),
      });
    });

    await page.goto(`/trip/generating?${SEARCH}`);

    // The Loader2 icon carries `animate-spin`. At least one should be present.
    const spinner = page.locator(".animate-spin").first();
    await expect(spinner).toBeVisible();
  });

  test("done step row renders a sage-500 (green) check", async ({ page }) => {
    await mockStart(page);
    await page.route("**/api/trip/step/j1", async (route: Route) => {
      const steps = baseSteps();
      steps[0].status = "done";
      steps[1].status = "running";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          jobId: "j1",
          status: "running",
          currentStep: 1,
          totalSteps: STEPS.length,
          stepLabel: steps[1].label,
          steps,
          error: null,
          shareId: null,
          partial: emptyPartial(),
        }),
      });
    });

    await page.goto(`/trip/generating?${SEARCH}`);

    // The done indicator is a div with bg-sage-500 containing a Check icon.
    const sage = page.locator(".bg-sage-500").first();
    await expect(sage).toBeVisible();
  });

  test("progress bar width grows as steps complete", async ({ page }) => {
    await mockStart(page);
    let stepCalls = 0;
    await page.route("**/api/trip/step/j1", async (route: Route) => {
      stepCalls++;
      const steps = baseSteps();
      // Reveal progressively more done steps on successive calls.
      const doneCount = Math.min(stepCalls, STEPS.length - 1);
      for (let i = 0; i < doneCount; i++) steps[i].status = "done";
      if (doneCount < STEPS.length) steps[doneCount].status = "running";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          jobId: "j1",
          status: "running",
          currentStep: doneCount,
          totalSteps: STEPS.length,
          stepLabel: steps[doneCount]?.label ?? null,
          steps,
          error: null,
          shareId: null,
          partial: emptyPartial(),
        }),
      });
    });

    await page.goto(`/trip/generating?${SEARCH}`);

    // The progress bar is the inner div with bg-terracotta-500 inside an
    // h-1 bg-cream-200 container. Framer-motion writes width into the style attr.
    const bar = page.locator(".bg-cream-200 > .bg-terracotta-500").first();
    await expect(bar).toBeVisible();

    // Wait for some progress beyond 0%.
    await expect
      .poll(
        async () => {
          const style = (await bar.getAttribute("style")) ?? "";
          const m = style.match(/width:\s*([\d.]+)%/);
          return m ? parseFloat(m[1]) : 0;
        },
        { timeout: 10_000, intervals: [200, 400, 800] }
      )
      .toBeGreaterThan(0);
  });

  test("live preview panel appears when partial booking data arrives", async ({
    page,
  }) => {
    await mockStart(page);
    await page.route("**/api/trip/step/j1", async (route: Route) => {
      const steps = baseSteps();
      steps[0].status = "done";
      steps[1].status = "done";
      steps[2].status = "done";
      steps[3].status = "running"; // booking
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          jobId: "j1",
          status: "running",
          currentStep: 3,
          totalSteps: STEPS.length,
          stepLabel: steps[3].label,
          steps,
          error: null,
          shareId: null,
          partial: {
            heroImage: "https://example.com/hero.jpg",
            cityPlan: [
              { city: "Tokyo", country: "Japan", startDay: 1, endDay: 5 },
            ],
            booking: {
              hotels: [
                {
                  name: "Park Hyatt Tokyo",
                  city: "Tokyo",
                  pricePerNight: 400,
                  rating: 4.8,
                },
              ],
              flights: [],
              tours: [],
              tips: [],
            },
            dayChunks: [],
          },
        }),
      });
    });

    await page.goto(`/trip/generating?${SEARCH}`);

    await expect(page.getByText("Live preview", { exact: false })).toBeVisible();
    await expect(page.getByText("Park Hyatt Tokyo", { exact: true })).toBeVisible();
  });

  test("on status=complete, router navigates to /trip/[shareId]", async ({
    page,
  }) => {
    await mockStart(page);
    let stepCalls = 0;
    await page.route("**/api/trip/step/j1", async (route: Route) => {
      stepCalls++;
      const steps = baseSteps();
      if (stepCalls < 2) {
        steps[0].status = "running";
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            jobId: "j1",
            status: "running",
            currentStep: 0,
            totalSteps: STEPS.length,
            stepLabel: steps[0].label,
            steps,
            error: null,
            shareId: null,
            partial: emptyPartial(),
          }),
        });
        return;
      }
      // Second call: complete.
      for (const s of steps) s.status = "done";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          jobId: "j1",
          status: "complete",
          currentStep: STEPS.length - 1,
          totalSteps: STEPS.length,
          stepLabel: null,
          steps,
          error: null,
          shareId: "abc123",
          partial: {
            heroImage: "https://example.com/hero.jpg",
            cityPlan: [
              { city: "Tokyo", country: "Japan", startDay: 1, endDay: 5 },
            ],
            booking: { hotels: [], flights: [], tours: [], tips: [] },
            dayChunks: [{ chunkIndex: 0, days: [] }],
          },
        }),
      });
    });

    // /trip/abc123 likely needs session data or a GET; stub it so the
    // navigation lands on a 200 page and we can assert the URL.
    await page.route("**/trip/abc123", async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<!doctype html><html><body><main>trip abc123</main></body></html>",
      });
    });

    await page.goto(`/trip/generating?${SEARCH}`);

    await page.waitForURL("**/trip/abc123", { timeout: 15_000 });
    expect(page.url()).toContain("/trip/abc123");
  });
});
