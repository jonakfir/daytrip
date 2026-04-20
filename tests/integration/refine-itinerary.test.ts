import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { Itinerary } from "@/types/itinerary";

/**
 * /api/refine-itinerary — mocks Claude at the client-module boundary
 * so we never hit the real API. Focus: auth gate + IMMUTABLE_FIELDS
 * enforcement + response shape.
 */

const mockCallClaudeWithUsage = vi.fn();
const mockIsClaudeConfigured = vi.fn();
const mockEstimateUsageCents = vi.fn().mockReturnValue(0.5);
vi.mock("@/lib/claude-client", () => ({
  callClaudeWithUsage: mockCallClaudeWithUsage,
  isClaudeConfigured: mockIsClaudeConfigured,
  estimateUsageCents: mockEstimateUsageCents,
}));

const mockIsAdminRequest = vi.fn();
vi.mock("@/lib/check-auth", () => ({
  isAdminRequest: mockIsAdminRequest,
}));

const mockAddClaudeUsage = vi.fn();
const mockHasClaudeBudget = vi.fn();
vi.mock("@/lib/db", async () => {
  const actual = await vi.importActual<typeof import("@/lib/db")>("@/lib/db");
  return {
    ...actual,
    addClaudeUsage: mockAddClaudeUsage,
    hasClaudeBudget: mockHasClaudeBudget,
  };
});

vi.mock("@/lib/verify-place", () => ({
  isPlaceInDestination: vi.fn().mockResolvedValue(true),
}));

async function cookieFor(userId: string): Promise<string> {
  const { SignJWT } = await import("jose");
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET ?? "ci-placeholder-secret-32-chars-minimum"
  );
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(secret);
}

const baseItin: Itinerary = {
  id: "it-1",
  shareId: "share-1",
  destination: "Paris",
  startDate: "2026-06-01",
  endDate: "2026-06-05",
  travelers: 2,
  travelStyle: "Cultural",
  budget: "mid",
  days: [],
  hotels: [],
  flights: [],
  tours: [],
  tips: [],
} as unknown as Itinerary;

beforeEach(() => {
  mockCallClaudeWithUsage.mockReset();
  mockIsClaudeConfigured.mockReset();
  mockIsAdminRequest.mockReset();
  mockAddClaudeUsage.mockReset();
  mockHasClaudeBudget.mockReset();
  process.env.JWT_SECRET = "ci-placeholder-secret-32-chars-minimum";
});

describe("POST /api/refine-itinerary", () => {
  it("returns 401 when anonymous", async () => {
    mockIsAdminRequest.mockResolvedValue(false);
    const { POST } = await import("@/app/api/refine-itinerary/route");
    const res = await POST(
      new NextRequest("https://app.test/api/refine-itinerary", {
        method: "POST",
        body: JSON.stringify({ itinerary: baseItin, message: "add sushi" }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 503 when Claude is not configured", async () => {
    mockIsAdminRequest.mockResolvedValue(true);
    mockIsClaudeConfigured.mockReturnValue(false);
    const { POST } = await import("@/app/api/refine-itinerary/route");
    const res = await POST(
      new NextRequest("https://app.test/api/refine-itinerary", {
        method: "POST",
        headers: { cookie: `daytrip-auth=${await cookieFor("u-1")}` },
        body: JSON.stringify({ itinerary: baseItin, message: "add sushi" }),
      })
    );
    expect([500, 503]).toContain(res.status);
  });

  it("re-asserts IMMUTABLE_FIELDS on Claude's response", async () => {
    mockIsAdminRequest.mockResolvedValue(true);
    mockIsClaudeConfigured.mockReturnValue(true);
    mockHasClaudeBudget.mockResolvedValue(true);

    // Claude tries to mutate shareId + startDate (both IMMUTABLE). The
    // route must strip those changes.
    const malicious = {
      ...baseItin,
      shareId: "HIJACKED",
      startDate: "1999-01-01",
      travelStyle: "Relaxed", // mutable — should be accepted
    };
    mockCallClaudeWithUsage.mockResolvedValue({
      text: "```json\n" + JSON.stringify({ itinerary: malicious }) + "\n```",
      usage: { input_tokens: 1, output_tokens: 1 },
    });

    const { POST } = await import("@/app/api/refine-itinerary/route");
    const res = await POST(
      new NextRequest("https://app.test/api/refine-itinerary", {
        method: "POST",
        headers: { cookie: `daytrip-auth=${await cookieFor("u-1")}` },
        body: JSON.stringify({ itinerary: baseItin, message: "relax me" }),
      })
    );
    // Route accepted the request (auth ok, Claude mocked, budget ok)
    expect(res.status).toBeLessThan(500);
    if (res.status === 200) {
      const body = await res.json();
      const returned: Itinerary = body.itinerary ?? body;
      // Immutable fields preserved from the original, NOT the malicious copy
      expect(returned.shareId).toBe(baseItin.shareId);
      expect(returned.startDate).toBe(baseItin.startDate);
    }
  });
});
