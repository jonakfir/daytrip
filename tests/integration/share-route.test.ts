import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Smoke-tests the /api/share/[id] route AFTER the Vercel-Postgres
 * migration. The route used to call the Supabase client which is
 * null in prod — it would always return "Database not configured".
 * These tests mock @vercel/postgres at the module boundary and
 * confirm the route now reads from the correct store.
 */

const sqlTag = vi.fn();
// The share route imports `sql` from @/lib/db-client (the adapter that
// delegates to @vercel/postgres in prod and node-postgres in local dev).
// We mock the adapter boundary so the route never touches a real DB.
vi.mock("@/lib/db-client", () => ({
  sql: sqlTag,
}));
vi.mock("@vercel/postgres", () => ({
  sql: sqlTag,
}));
vi.mock("@/lib/trip-job-repo", () => ({
  ensureItinerariesTable: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  sqlTag.mockReset();
  process.env.POSTGRES_URL =
    "postgres://user:pass@localhost:5432/db?sslmode=require";
});

describe("GET /api/share/[id]", () => {
  it("returns the demo itinerary without touching the DB", async () => {
    const { GET } = await import("@/app/api/share/[id]/route");
    const res = await GET(new Request("https://app.test/api/share/demo") as never, {
      params: { id: "demo" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.itinerary).toBeTruthy();
    expect(sqlTag).not.toHaveBeenCalled();
  });

  it("returns the stored itinerary from Vercel Postgres for a real shareId", async () => {
    const stored = {
      id: "id",
      shareId: "abc123",
      destination: "Prague",
      startDate: "2026-05-01",
      endDate: "2026-05-05",
      travelers: 2,
      travelStyle: "Cultural",
      budget: "mid",
      days: [],
      hotels: [],
      flights: [],
      tours: [],
      tips: [],
    };
    sqlTag.mockResolvedValueOnce({
      rows: [{ itinerary_data: stored, view_count: 0 }],
    });
    // Second call is the fire-and-forget view_count update. Let it resolve.
    sqlTag.mockResolvedValueOnce({ rows: [] });

    const { GET } = await import("@/app/api/share/[id]/route");
    const res = await GET(
      new Request("https://app.test/api/share/abc123") as never,
      { params: { id: "abc123" } }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.itinerary).toEqual(stored);
  });

  it("returns 404 when the shareId is unknown", async () => {
    sqlTag.mockResolvedValueOnce({ rows: [] });
    const { GET } = await import("@/app/api/share/[id]/route");
    const res = await GET(
      new Request("https://app.test/api/share/unknown") as never,
      { params: { id: "unknown" } }
    );
    expect(res.status).toBe(404);
  });
});
