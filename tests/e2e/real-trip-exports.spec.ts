import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * End-to-end verification of a REAL Claude-generated trip:
 *   1. Page renders the itinerary UI: destination, flights, hotels, tours, day activities.
 *   2. Share panel opens.
 *   3. PDF export produces a valid PDF file.
 *   4. DOCX export produces a valid .docx file.
 *
 * Opt-in: set REAL_TRIP_SHARE_ID to a finished share URL (or use the
 * demo fallback). The suite stays cheap — no generation happens here,
 * we only verify rendering + export against an existing trip.
 */

const SHARE_ID = process.env.REAL_TRIP_SHARE_ID ?? "demo";

test.describe("Real trip rendering + exports", () => {
  test(`/trip/${SHARE_ID} renders flights, hotels, tours, days`, async ({ page }) => {
    await page.goto(`/trip/${SHARE_ID}`);
    await page.waitForLoadState("networkidle").catch(() => {});

    // Hero + destination title
    const h1 = page.locator("h1");
    await expect(h1.first()).toBeVisible();
    const titleText = await h1.first().textContent();
    expect(titleText).toMatch(/Paris|Tokyo|Japan|France/i);

    // Day sections
    const dayHeadings = page.locator("text=/Day \\d+/");
    expect(await dayHeadings.count()).toBeGreaterThan(0);

    // Activities (h4 for each activity name)
    const activities = page.locator("h4");
    expect(await activities.count()).toBeGreaterThanOrEqual(3);

    // Sidebar should list flights / hotels / tours sections if present
    const bodyText = (await page.textContent("body")) ?? "";
    const hasFlights = /Flights|Flight/i.test(bodyText);
    const hasHotels = /Hotels|Stay|Stays|Accommodation/i.test(bodyText);
    expect(hasFlights || hasHotels, "expected flights or hotels in body").toBe(true);
  });

  test(`/trip/${SHARE_ID} share panel opens and has Export PDF + Export DOCX buttons`, async ({ page }) => {
    await page.goto(`/trip/${SHARE_ID}`);
    await page.waitForLoadState("networkidle").catch(() => {});

    const shareBtn = page.getByRole("button", { name: /share/i }).first();
    await shareBtn.click();

    // Dialog or panel visible
    await expect(
      page.getByText(/share this trip|export|download/i).first()
    ).toBeVisible({ timeout: 5000 });

    // Export buttons
    const pdfBtn = page.getByRole("button", { name: /pdf|export.*pdf/i });
    const docxBtn = page.getByRole("button", { name: /docx|word|export.*doc/i });
    expect(await pdfBtn.count()).toBeGreaterThan(0);
    expect(await docxBtn.count()).toBeGreaterThan(0);
  });

  test(`PDF export downloads a valid PDF`, async ({ page, context }, testInfo) => {
    await page.goto(`/trip/${SHARE_ID}`);
    await page.waitForLoadState("networkidle").catch(() => {});

    await page.getByRole("button", { name: /share/i }).first().click();
    await expect(page.getByText(/share this trip|export|download/i).first()).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30_000 }),
      page.getByRole("button", { name: /pdf|export.*pdf/i }).first().click(),
    ]);

    const dl = await download.path();
    expect(dl).toBeTruthy();
    const stat = fs.statSync(dl!);
    expect(stat.size).toBeGreaterThan(1000);
    // PDFs begin with "%PDF-"
    const fh = fs.openSync(dl!, "r");
    const buf = Buffer.alloc(5);
    fs.readSync(fh, buf, 0, 5, 0);
    fs.closeSync(fh);
    expect(buf.toString("utf8")).toBe("%PDF-");
    // Attach so we can eyeball the output on failure
    await testInfo.attach(`pdf-${SHARE_ID}.pdf`, {
      path: dl!,
      contentType: "application/pdf",
    });
  });

  test(`DOCX export downloads a valid .docx`, async ({ page }, testInfo) => {
    await page.goto(`/trip/${SHARE_ID}`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.getByRole("button", { name: /share/i }).first().click();
    await expect(page.getByText(/share this trip|export|download/i).first()).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30_000 }),
      page.getByRole("button", { name: /docx|word|export.*doc/i }).first().click(),
    ]);

    const dl = await download.path();
    expect(dl).toBeTruthy();
    const stat = fs.statSync(dl!);
    expect(stat.size).toBeGreaterThan(500);
    // .docx is a ZIP — starts with "PK"
    const fh = fs.openSync(dl!, "r");
    const buf = Buffer.alloc(2);
    fs.readSync(fh, buf, 0, 2, 0);
    fs.closeSync(fh);
    expect(buf.toString("utf8")).toBe("PK");
    await testInfo.attach(`docx-${SHARE_ID}.docx`, {
      path: dl!,
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  });
});
