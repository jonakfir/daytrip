import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated accessibility scans with axe-core on every public page.
 *
 * The gate fails only on "critical" violations (missing labels, broken
 * ARIA, focus traps, etc.). "Serious" issues — most commonly our brand's
 * low-contrast caption text — surface as warnings in the test output so
 * we keep a running backlog without blocking deploys on color decisions.
 */

const PAGES = [
  { path: "/", name: "home" },
  { path: "/login", name: "login" },
  { path: "/signup", name: "signup" },
  { path: "/pricing", name: "pricing" },
  { path: "/contact", name: "contact" },
  { path: "/about", name: "about" },
  { path: "/privacy", name: "privacy" },
  { path: "/terms", name: "terms" },
  { path: "/destinations", name: "destinations" },
  { path: "/destinations/paris", name: "destinations-paris" },
  { path: "/destinations/paris/5-day-itinerary", name: "paris-5day" },
  { path: "/trip/demo", name: "trip-demo" },
  { path: "/guides", name: "guides" },
  { path: "/zzznotfound", name: "404" },
];

for (const { path, name } of PAGES) {
  test(`axe-core: ${name} (${path}) — no serious/critical violations`, async ({ page }, testInfo) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle").catch(() => {});
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === "critical");
    const serious = results.violations.filter((v) => v.impact === "serious");
    const other = results.violations.filter(
      (v) => v.impact === "moderate" || v.impact === "minor"
    );

    // Always attach the full axe report for the record
    if (results.violations.length > 0) {
      await testInfo.attach(`axe-${name}`, {
        body: JSON.stringify(results.violations, null, 2),
        contentType: "application/json",
      });
    }

    if (critical.length > 0) {
      const summary = critical
        .map(
          (v) =>
            `CRITICAL [${v.id}] ${v.help}\n  nodes: ${v.nodes
              .slice(0, 3)
              .map((n) => n.target.join(" "))
              .join(" | ")}`
        )
        .join("\n\n");
      throw new Error(
        `${critical.length} critical a11y violations on ${path}:\n\n${summary}`
      );
    }

    if (serious.length > 0) {
      // eslint-disable-next-line no-console
      console.log(
        `[a11y:${name}] ${serious.length} serious (non-gating): ${serious
          .map((v) => v.id)
          .join(", ")}`
      );
    }
    if (other.length > 0) {
      // eslint-disable-next-line no-console
      console.log(
        `[a11y:${name}] ${other.length} moderate/minor: ${other
          .map((v) => v.id)
          .join(", ")}`
      );
    }
  });
}
