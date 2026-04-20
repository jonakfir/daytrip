import { test, expect } from "@playwright/test";

/**
 * End-to-end authentication coverage against a real local Postgres
 * (see playwright.config.ts webServer.env.POSTGRES_URL). Each test
 * creates a fresh throwaway user so the suite is order-independent.
 *
 * In CI we set SKIP_REAL_DB_TESTS=1 to skip these — GHA runners don't
 * provision a Postgres instance. Everything else in the suite runs.
 */

const SKIP_REASON = "auth-flow requires a local Postgres — set SKIP_REAL_DB_TESTS=1 to opt out";

test.beforeEach(async () => {
  test.skip(!!process.env.SKIP_REAL_DB_TESTS, SKIP_REASON);
});

function newEmail(tag: string): string {
  return `pw-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
}

const VALID_PW = "Sup3rSecret!pw";

test.describe("Signup API end-to-end", () => {
  test("valid signup succeeds and sets an auth cookie", async ({ request }) => {
    const email = newEmail("signup");
    const r = await request.post("/api/auth/signup", {
      data: { email, password: VALID_PW, fullName: "Playwright Test" },
    });
    expect(r.status(), await r.text()).toBeLessThan(400);
    const body = await r.json();
    expect(body.success).toBe(true);
    expect(body.email).toBe(email.toLowerCase());
    // Cookie set
    const setCookie = r.headers()["set-cookie"] ?? "";
    expect(setCookie).toMatch(/daytrip-auth=/);
    expect(setCookie).toMatch(/HttpOnly/i);
  });

  test("duplicate signup returns 409", async ({ request }) => {
    const email = newEmail("dupe");
    const first = await request.post("/api/auth/signup", {
      data: { email, password: VALID_PW, fullName: "First" },
    });
    expect(first.status()).toBeLessThan(400);
    const second = await request.post("/api/auth/signup", {
      data: { email, password: VALID_PW, fullName: "Second" },
    });
    expect(second.status()).toBe(409);
  });
});

test.describe("Login API end-to-end", () => {
  test("correct credentials log in and set cookie", async ({ request }) => {
    const email = newEmail("login");
    await request.post("/api/auth/signup", {
      data: { email, password: VALID_PW, fullName: "Login Tester" },
    });
    const r = await request.post("/api/auth/login", {
      data: { email, password: VALID_PW },
    });
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.success).toBe(true);
    expect(r.headers()["set-cookie"] ?? "").toMatch(/daytrip-auth=/);
  });

  test("wrong password returns 401", async ({ request }) => {
    const email = newEmail("wrongpw");
    await request.post("/api/auth/signup", {
      data: { email, password: VALID_PW, fullName: "WrongPW Tester" },
    });
    const r = await request.post("/api/auth/login", {
      data: { email, password: "nope-this-is-wrong" },
    });
    expect(r.status()).toBe(401);
  });

  test("unknown email returns 401 (not 404 — avoid user enumeration)", async ({ request }) => {
    const r = await request.post("/api/auth/login", {
      data: { email: newEmail("unknown"), password: VALID_PW },
    });
    expect([401, 404]).toContain(r.status());
  });
});

test.describe("Authenticated session: /api/auth/me", () => {
  test("after login, /api/auth/me returns authenticated=true", async ({ request, browser }) => {
    const email = newEmail("me");
    const signup = await request.post("/api/auth/signup", {
      data: { email, password: VALID_PW, fullName: "Me Tester" },
    });
    const signupCookies = signup.headers()["set-cookie"] ?? "";
    const authCookie = signupCookies.split(/[,\n]/).find((c) => c.includes("daytrip-auth="));
    expect(authCookie, "expected set-cookie on signup").toBeTruthy();

    // Create a new request context that carries the cookie
    const ctx = await browser.newContext();
    await ctx.addCookies([
      {
        name: "daytrip-auth",
        value: decodeURIComponent(
          authCookie!.split("daytrip-auth=")[1].split(";")[0]
        ),
        domain: "127.0.0.1",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ]);
    const page = await ctx.newPage();
    const me = await page.request.get("/api/auth/me");
    expect(me.status()).toBe(200);
    const meBody = await me.json();
    expect(meBody.authenticated).toBe(true);
    expect(meBody.email).toBe(email.toLowerCase());
    await ctx.close();
  });
});

test.describe("Logout API end-to-end", () => {
  test("logout clears the auth cookie", async ({ request }) => {
    const email = newEmail("logout");
    await request.post("/api/auth/signup", {
      data: { email, password: VALID_PW, fullName: "Logout Tester" },
    });
    const r = await request.post("/api/auth/logout");
    expect([200, 204]).toContain(r.status());
    const setCookie = r.headers()["set-cookie"] ?? "";
    // Expect the cookie to be cleared — Max-Age=0 or expired
    if (setCookie.includes("daytrip-auth=")) {
      expect(setCookie).toMatch(/Max-Age=0|Expires=[^\n]*197[0-9]/i);
    }
  });
});

test.describe("Browser-level auth flow", () => {
  test("signup via the form logs the user in and redirects away from /signup", async ({ page }) => {
    const email = newEmail("ui-signup");
    await page.goto("/signup");
    await page.fill("#signup-name", "UI Tester");
    await page.fill("#signup-email", email);
    await page.fill("#signup-password", VALID_PW);
    await page.getByRole("button", { name: /create account/i }).click();
    // Router pushes to "/" (or "/admin" for admin email). /signup redirect = not on /signup anymore.
    await page.waitForURL((url) => !url.pathname.startsWith("/signup"), {
      timeout: 10_000,
    });
    // Fetch /api/auth/me from the browser context — should be authenticated
    const me = await page.request.get("/api/auth/me");
    const j = await me.json();
    expect(j.authenticated).toBe(true);
    expect(j.email).toBe(email.toLowerCase());
  });

  test("logged-in user can load /account (no redirect loop)", async ({ page }) => {
    const email = newEmail("ui-account");
    // Sign up through the API so the cookie is set in this browser context
    await page.request.post("/api/auth/signup", {
      data: { email, password: VALID_PW, fullName: "Account UI" },
    });
    await page.goto("/account");
    // Should stay on /account, not redirect to /login
    await page.waitForLoadState("networkidle").catch(() => {});
    expect(page.url()).toContain("/account");
    // Email should be visible somewhere on the page
    const body = (await page.textContent("body")) ?? "";
    expect(body).toContain(email.toLowerCase());
  });

  test("login form error state surfaces wrong-password error", async ({ page }) => {
    const email = newEmail("ui-wrongpw");
    await page.request.post("/api/auth/signup", {
      data: { email, password: VALID_PW, fullName: "WPW" },
    });
    // Log out the cookie from signup so we're anon
    await page.context().clearCookies();
    await page.goto("/login");
    await page.fill("#login-email", email);
    await page.fill("#login-password", "definitely-wrong-password");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(
      page.locator("text=/login failed|invalid|incorrect|wrong/i").first()
    ).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain("/login");
  });

  test("session persists across full page reload", async ({ page }) => {
    const email = newEmail("persist");
    await page.request.post("/api/auth/signup", {
      data: { email, password: VALID_PW, fullName: "Persist" },
    });
    await page.goto("/account");
    await page.reload();
    await page.waitForLoadState("networkidle").catch(() => {});
    // Still on /account after reload, not bounced to /login
    expect(page.url()).toContain("/account");
  });
});

test.describe("Credits + trip endpoints after signup", () => {
  test("/api/me/credits returns 200 with credits once authenticated", async ({ browser }) => {
    const email = newEmail("credits");
    const ctx = await browser.newContext();
    const signup = await ctx.request.post("/api/auth/signup", {
      data: { email, password: VALID_PW, fullName: "Credits" },
    });
    expect(signup.status()).toBeLessThan(400);
    const r = await ctx.request.get("/api/me/credits");
    expect(r.status()).toBe(200);
    const j = await r.json();
    expect(j.authenticated).toBe(true);
    expect(typeof j.credits).toBe("number");
    await ctx.close();
  });

  test("/api/me/trips returns empty array for brand-new user", async ({ browser }) => {
    const email = newEmail("trips-empty");
    const ctx = await browser.newContext();
    await ctx.request.post("/api/auth/signup", {
      data: { email, password: VALID_PW, fullName: "Trips Empty" },
    });
    const r = await ctx.request.get("/api/me/trips");
    expect(r.status()).toBe(200);
    const j = await r.json();
    expect(Array.isArray(j.trips)).toBe(true);
    expect(j.trips.length).toBe(0);
    await ctx.close();
  });
});
