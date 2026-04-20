import { test, expect } from "@playwright/test";

test.describe("Login form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("uses POST method and action=/api/auth/login", async ({ page }) => {
    const form = page.locator("form").first();
    await expect(form).toHaveAttribute("method", /post/i);
    await expect(form).toHaveAttribute("action", "/api/auth/login");
  });

  test("email and password inputs have proper autocomplete", async ({ page }) => {
    await expect(page.locator("#login-email")).toHaveAttribute("autocomplete", "email");
    await expect(page.locator("#login-email")).toHaveAttribute("type", "email");
    await expect(page.locator("#login-password")).toHaveAttribute("autocomplete", "current-password");
  });

  test("labels are associated via for/id", async ({ page }) => {
    const emailLabel = page.locator('label[for="login-email"]');
    const passwordLabel = page.locator('label[for="login-password"]');
    await expect(emailLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();
  });

  test("password reveal button has aria-label and toggles input type", async ({ page }) => {
    const input = page.locator("#login-password");
    await input.fill("secretvalue");
    await expect(input).toHaveAttribute("type", "password");
    const toggle = page.getByRole("button", { name: /show password/i });
    await toggle.click();
    await expect(input).toHaveAttribute("type", "text");
  });

  test("empty submit is blocked by HTML5 required", async ({ page }) => {
    await page.getByRole("button", { name: /^sign in$/i }).click();
    // Browser's native validation should keep us on the same page
    expect(page.url()).toContain("/login");
  });

  test("wrong credentials show error and do not navigate", async ({ page }) => {
    await page.fill("#login-email", "nobody@example.com");
    await page.fill("#login-password", "wrongpassword123");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page.locator("text=/login failed|invalid|unauthorized|not found/i")).toBeVisible({
      timeout: 5000,
    });
    expect(page.url()).toContain("/login");
  });
});

test.describe("Signup form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
  });

  test("uses POST method and has name/email/password with autocomplete + minLength=8", async ({ page }) => {
    const form = page.locator("form").first();
    await expect(form).toHaveAttribute("method", /post/i);
    await expect(form).toHaveAttribute("action", "/api/auth/signup");

    await expect(page.locator("#signup-name")).toHaveAttribute("autocomplete", "name");
    await expect(page.locator("#signup-email")).toHaveAttribute("autocomplete", "email");
    await expect(page.locator("#signup-password")).toHaveAttribute("autocomplete", "new-password");
    await expect(page.locator("#signup-password")).toHaveAttribute("minlength", "8");
  });

  test("submitting a 7-char password is blocked by HTML5 minlength", async ({ page }) => {
    await page.fill("#signup-name", "Test User");
    await page.fill("#signup-email", "t@example.com");
    await page.fill("#signup-password", "short07");
    await page.getByRole("button", { name: /create account/i }).click();
    // Browser should not submit; we stay on /signup
    expect(page.url()).toContain("/signup");
    // The password input should be invalid (HTML5 constraint)
    const valid = await page.locator("#signup-password").evaluate(
      (el) => (el as HTMLInputElement).validity.valid
    );
    expect(valid).toBe(false);
  });

  test("API rejects a 7-char password with 400", async ({ request }) => {
    const r = await request.post("/api/auth/signup", {
      data: {
        email: `test+${Date.now()}@example.com`,
        password: "short07",
        fullName: "Test",
      },
    });
    expect(r.status()).toBe(400);
    const j = await r.json();
    expect(j.error).toMatch(/8 characters/);
  });
});

test.describe("Contact form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("labels are linked via for/id, inputs have autocomplete", async ({ page }) => {
    await expect(page.locator('label[for="contact-name"]')).toBeVisible();
    await expect(page.locator('label[for="contact-email"]')).toBeVisible();
    await expect(page.locator('label[for="contact-message"]')).toBeVisible();
    await expect(page.locator("#contact-name")).toHaveAttribute("autocomplete", "name");
    await expect(page.locator("#contact-email")).toHaveAttribute("autocomplete", "email");
  });

  test("empty submit shows inline error banner", async ({ page }) => {
    await page.getByRole("button", { name: /send message/i }).click();
    const alert = page.locator('p[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/fill in your name, email, and message/i);
  });

  test("invalid email shows specific inline error", async ({ page }) => {
    await page.fill("#contact-name", "Jane");
    await page.fill("#contact-email", "not-an-email");
    await page.fill("#contact-message", "hello there friends");
    await page.getByRole("button", { name: /send message/i }).click();
    const alert = page.locator('p[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/email address doesn.?t look right/i);
  });

  test("short message rejected", async ({ page }) => {
    await page.fill("#contact-name", "Jane");
    await page.fill("#contact-email", "jane@example.com");
    await page.fill("#contact-message", "hi");
    await page.getByRole("button", { name: /send message/i }).click();
    const alert = page.locator('p[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/share a little more detail/i);
  });

  test("contact page shows @daytrip-ai.com emails only (no @daytrip.travel)", async ({ page }) => {
    const body = await page.textContent("body");
    expect(body).toContain("hello@daytrip-ai.com");
    expect(body).toContain("partners@daytrip-ai.com");
    expect(body).not.toContain("@daytrip.travel");
  });
});

test.describe("Admin page gate", () => {
  test("shows inline login form, not the dashboard, when anonymous", async ({ page }) => {
    await page.goto("/admin");
    // A login form of some kind must be visible
    await expect(page.locator("input[type=email]").or(page.locator("input#email"))).toBeVisible();
  });

  test("admin APIs reject anonymous", async ({ request }) => {
    const users = await request.get("/api/admin/users");
    expect([401, 403]).toContain(users.status());
  });
});
