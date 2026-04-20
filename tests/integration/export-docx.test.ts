import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * /api/export/doc/[id] — generates a .docx file for a given shareId.
 * We test against the hardcoded demo itinerary so no DB is needed.
 */

const mockSql = vi.fn();
vi.mock("@/lib/db-client", () => ({
  sql: mockSql,
}));
vi.mock("@/lib/trip-job-repo", () => ({
  ensureItinerariesTable: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  mockSql.mockReset();
});

describe("GET /api/export/doc/[id]", () => {
  it("returns a docx buffer for the demo itinerary without touching DB", async () => {
    const { GET } = await import("@/app/api/export/doc/[id]/route");
    const res = await GET(
      new Request("https://app.test/api/export/doc/demo") as never,
      { params: { id: "demo" } }
    );
    expect(res.status).toBe(200);
    const ct = res.headers.get("content-type") ?? "";
    expect(ct).toMatch(/wordprocessingml|officedocument|octet-stream/i);
    const cd = res.headers.get("content-disposition") ?? "";
    expect(cd).toMatch(/attachment/i);
    expect(cd).toMatch(/\.docx/i);
    const buf = await res.arrayBuffer();
    // .docx files are zip archives — magic bytes "PK"
    const bytes = new Uint8Array(buf);
    expect(bytes.length).toBeGreaterThan(100);
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe("PK");
    expect(mockSql).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown shareId when DB is unconfigured", async () => {
    const prev = {
      pg: process.env.POSTGRES_URL,
      prisma: process.env.POSTGRES_PRISMA_URL,
      db: process.env.DATABASE_URL,
    };
    delete process.env.POSTGRES_URL;
    delete process.env.POSTGRES_PRISMA_URL;
    delete process.env.DATABASE_URL;
    try {
      const { GET } = await import("@/app/api/export/doc/[id]/route");
      const res = await GET(
        new Request("https://app.test/api/export/doc/unknown-xyz") as never,
        { params: { id: "unknown-xyz" } }
      );
      expect([404, 503]).toContain(res.status);
    } finally {
      if (prev.pg) process.env.POSTGRES_URL = prev.pg;
      if (prev.prisma) process.env.POSTGRES_PRISMA_URL = prev.prisma;
      if (prev.db) process.env.DATABASE_URL = prev.db;
    }
  });

  it("returns 404 when DB is configured but shareId is unknown", async () => {
    process.env.POSTGRES_URL = "postgres://u:p@h:5432/d";
    mockSql.mockResolvedValueOnce({ rows: [] });
    const { GET } = await import("@/app/api/export/doc/[id]/route");
    const res = await GET(
      new Request("https://app.test/api/export/doc/does-not-exist") as never,
      { params: { id: "does-not-exist" } }
    );
    expect(res.status).toBe(404);
  });
});
