import { test, expect } from "@playwright/test";

/**
 * Exercises every public-facing API endpoint without authentication
 * to lock in contracts and make sure no route 500s on a missing cookie.
 */

test.describe("API: /api/auth/*", () => {
  test("GET /api/auth/me returns the expected shape (200, anon)", async ({ request }) => {
    const r = await request.get("/api/auth/me");
    expect(r.status()).toBe(200);
    const j = await r.json();
    expect(j).toMatchObject({
      authenticated: false,
      role: null,
      email: null,
      isAdmin: false,
    });
  });

  test("POST /api/auth/login with empty body returns 400 (not 500)", async ({ request }) => {
    const r = await request.post("/api/auth/login", { data: {} });
    expect([400, 401, 422]).toContain(r.status());
    const body = await r.json();
    expect(body).toHaveProperty("error");
  });

  test("POST /api/auth/login with fake creds returns 401 with clean error", async ({ request }) => {
    const r = await request.post("/api/auth/login", {
      data: { email: "nobody@example.com", password: "wrongpass1234" },
    });
    expect([401, 403, 404, 503]).toContain(r.status());
    expect((await r.json()).error).toBeTruthy();
  });

  test("POST /api/auth/logout always 200s (idempotent)", async ({ request }) => {
    const r = await request.post("/api/auth/logout");
    expect([200, 204]).toContain(r.status());
  });

  test("POST /api/auth/signup rejects short passwords with 400", async ({ request }) => {
    const r = await request.post("/api/auth/signup", {
      data: {
        email: `short-pw-${Date.now()}@example.com`,
        password: "short07", // 7 chars, below 8-char minimum
        fullName: "Test",
      },
    });
    expect(r.status()).toBe(400);
    expect((await r.json()).error).toMatch(/8 characters/);
  });

  test("POST /api/auth/signup rejects missing email with 400", async ({ request }) => {
    const r = await request.post("/api/auth/signup", {
      data: { password: "longenough123", fullName: "Test" },
    });
    expect(r.status()).toBe(400);
  });

  test("POST /api/auth/signup handles DB-not-configured with 503 (not 500)", async ({ request }) => {
    const r = await request.post("/api/auth/signup", {
      data: {
        email: `probe-${Date.now()}@example.com`,
        password: "validpassword8+",
        fullName: "Probe",
      },
    });
    // Either a real signup (200/201) or a clean 503 if DB missing — never 500.
    expect([200, 201, 503]).toContain(r.status());
    expect(r.status()).not.toBe(500);
  });
});

test.describe("API: /api/share/:id", () => {
  test("GET /api/share/demo returns full itinerary JSON", async ({ request }) => {
    const r = await request.get("/api/share/demo");
    expect(r.status()).toBe(200);
    const j = await r.json();
    expect(j.itinerary).toBeDefined();
    expect(j.itinerary.destination).toContain("Tokyo");
    expect(Array.isArray(j.itinerary.days)).toBe(true);
    expect(j.itinerary.days.length).toBeGreaterThan(0);
  });

  test("GET /api/share/:unknownId returns 404 or 503 (not 500)", async ({ request }) => {
    const r = await request.get(`/api/share/nonexistent-${Date.now()}`);
    // 503 when Supabase isn't configured in this env; 404 when it is but the id isn't found.
    expect([200, 404, 503]).toContain(r.status());
    expect(r.status()).not.toBe(500);
    if (r.status() === 200) {
      const j = await r.json();
      expect(j.itinerary).toBeFalsy();
    }
  });
});

test.describe("API: authenticated-only endpoints return 401 when anon", () => {
  const PROTECTED = [
    { method: "GET", path: "/api/me/trips" },
    { method: "GET", path: "/api/me/credits" },
    { method: "GET", path: "/api/admin/users" },
    { method: "POST", path: "/api/admin/users" },
  ];

  for (const { method, path } of PROTECTED) {
    test(`${method} ${path} returns 401/403 when anonymous`, async ({ request }) => {
      const r =
        method === "GET"
          ? await request.get(path)
          : await request.post(path, { data: {} });
      // Expected protected response codes — never 500
      expect([401, 403]).toContain(r.status());
    });
  }

  test("POST /api/stripe/checkout returns 401/503 when anonymous (never 500)", async ({ request }) => {
    const r = await request.post("/api/stripe/checkout", { data: {} });
    expect([401, 403, 503]).toContain(r.status());
    expect(r.status()).not.toBe(500);
  });
});

test.describe("API: /api/swap-activity", () => {
  test("requires auth; returns 401 with auth_required error", async ({ request }) => {
    const r = await request.post("/api/swap-activity", {
      data: {
        activity: {
          time: "14:00",
          name: "Test Activity",
          category: "culture",
          description: "x",
          duration: "1h",
        },
        destination: "Paris",
        timeBlock: "afternoon",
      },
    });
    expect(r.status()).toBe(401);
    const j = await r.json();
    expect(j.error).toMatch(/auth/i);
  });

  test("rejects malformed body with 400", async ({ request }) => {
    const r = await request.post("/api/swap-activity", { data: {} });
    expect([400, 401]).toContain(r.status());
  });
});

test.describe("API: /api/contact", () => {
  test("returns 200 or 503 for valid payload (never 500)", async ({ request }) => {
    const r = await request.post("/api/contact", {
      data: {
        name: "Playwright Test",
        email: "playwright@example.com",
        message: "Automated test message from CI.",
      },
    });
    expect([200, 201, 202, 503]).toContain(r.status());
    expect(r.status()).not.toBe(500);
  });

  test("rejects empty payload with 400", async ({ request }) => {
    const r = await request.post("/api/contact", { data: {} });
    expect([400, 422]).toContain(r.status());
  });
});

test.describe("API: /api/generate", () => {
  test("rejects empty body with 400 (not 500)", async ({ request }) => {
    const r = await request.post("/api/generate", { data: {} });
    expect([400, 422]).toContain(r.status());
  });

  test("rejects body missing destination with 400", async ({ request }) => {
    const r = await request.post("/api/generate", {
      data: { startDate: "2026-01-01", endDate: "2026-01-03" },
    });
    expect([400, 422]).toContain(r.status());
  });
});

test.describe("robots.txt & sitemap.xml", () => {
  test("robots.txt exists with expected disallows", async ({ request }) => {
    const r = await request.get("/robots.txt");
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toMatch(/User-Agent:\s*\*/i);
    expect(body).toMatch(/Disallow:\s*\/api\//);
    expect(body).toMatch(/Disallow:\s*\/admin\//);
    expect(body).toMatch(/Sitemap:\s*https:/i);
  });

  test("sitemap.xml is well-formed XML", async ({ request }) => {
    const r = await request.get("/sitemap.xml");
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toContain("<?xml");
    expect(body).toContain("<urlset");
    expect(body).toContain("</urlset>");
    // Each <loc> should be inside a <url>
    const locs = body.match(/<loc>/g)?.length ?? 0;
    const urls = body.match(/<url>/g)?.length ?? 0;
    expect(locs).toBe(urls);
  });

  test("sitemap.xml lists canonical URLs only (no /api, /admin, /account)", async ({ request }) => {
    const r = await request.get("/sitemap.xml");
    const body = await r.text();
    expect(body).not.toMatch(/<loc>[^<]*\/api\//);
    expect(body).not.toMatch(/<loc>[^<]*\/admin[^-]/);
    expect(body).not.toMatch(/<loc>[^<]*\/account/);
  });
});

test.describe("API: no 500 errors on unexpected input", () => {
  const ENDPOINTS = [
    { method: "GET", path: "/api/auth/me" },
    { method: "GET", path: "/api/share/whatever" },
    { method: "GET", path: "/api/me/trips" },
    { method: "GET", path: "/api/me/credits" },
    { method: "GET", path: "/api/admin/users" },
  ];
  for (const { method, path } of ENDPOINTS) {
    test(`${method} ${path} never returns 500`, async ({ request }) => {
      const r = method === "GET" ? await request.get(path) : await request.post(path);
      // 503 is allowed (feature-not-configured), but 500 indicates an unhandled crash.
      expect(r.status(), `${method} ${path}`).not.toBe(500);
    });
  }
});
