import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config.
 *
 * Tests run against a locally-started Next.js dev server. CI passes
 * `PLAYWRIGHT_BASE_URL` to target a deployed preview instead.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          JWT_SECRET: "playwright-test-secret-32-chars-minimum-xxx",
          // Local Postgres from brew services. The app lazy-creates its
          // schema on first write, so no manual migration is needed.
          // In CI (SKIP_REAL_DB_TESTS=1) we omit POSTGRES_URL so auth
          // endpoints return a clean 503 instead of crashing on connect.
          ...(process.env.SKIP_REAL_DB_TESTS
            ? {}
            : {
                POSTGRES_URL: `postgres://pwtest:pwtest@localhost:5432/daytrip_pw`,
              }),
        },
      },
});
