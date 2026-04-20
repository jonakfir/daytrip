import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Stripe webhook handler — tested without real Stripe.
 *
 * We mock the `@/lib/stripe` `getStripe` helper so
 * `stripe.webhooks.constructEvent()` returns a pre-built event shape
 * instead of verifying a real signature. That lets us assert:
 *   1. missing signature → 400
 *   2. not-configured → 503
 *   3. signed checkout.session.completed → credits granted
 */

const mockConstructEvent = vi.fn();
const mockGetStripe = vi.fn();
vi.mock("@/lib/stripe", async () => {
  const actual = await vi.importActual<typeof import("@/lib/stripe")>(
    "@/lib/stripe"
  );
  return {
    ...actual,
    getStripe: mockGetStripe,
  };
});

const mockAddTripCredits = vi.fn();
vi.mock("@/lib/db", async () => {
  const actual = await vi.importActual<typeof import("@/lib/db")>("@/lib/db");
  return {
    ...actual,
    addTripCredits: mockAddTripCredits,
  };
});

const mockSql = vi.fn();
vi.mock("@/lib/db-client", () => ({
  sql: mockSql,
}));

beforeEach(() => {
  mockConstructEvent.mockReset();
  mockGetStripe.mockReset();
  mockAddTripCredits.mockReset();
  mockSql.mockReset();
  delete process.env.STRIPE_WEBHOOK_SECRET;
});

describe("POST /api/stripe/webhook", () => {
  it("returns 503 when Stripe is not configured", async () => {
    mockGetStripe.mockReturnValue(null);
    const { POST } = await import("@/app/api/stripe/webhook/route");
    const res = await POST(
      new Request("https://app.test/api/stripe/webhook", {
        method: "POST",
        body: "{}",
      }) as never
    );
    expect(res.status).toBe(503);
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    mockGetStripe.mockReturnValue({
      webhooks: { constructEvent: mockConstructEvent },
    });
    const { POST } = await import("@/app/api/stripe/webhook/route");
    const res = await POST(
      new Request("https://app.test/api/stripe/webhook", {
        method: "POST",
        body: "{}",
      }) as never
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 on invalid signature", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });
    mockGetStripe.mockReturnValue({
      webhooks: { constructEvent: mockConstructEvent },
    });
    const { POST } = await import("@/app/api/stripe/webhook/route");
    const res = await POST(
      new Request("https://app.test/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": "t=1,v1=badsig" },
        body: "{}",
      }) as never
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/signature/i);
  });

  it("grants credits on a valid checkout.session.completed event", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const fakeEvent = {
      id: "evt_123",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          customer_email: "u@example.com",
          amount_total: 300,
          metadata: { userId: "u-1", credits: "1" },
          payment_status: "paid",
        },
      },
    };
    mockConstructEvent.mockReturnValue(fakeEvent);
    mockGetStripe.mockReturnValue({
      webhooks: { constructEvent: mockConstructEvent },
    });
    mockAddTripCredits.mockResolvedValue(undefined);
    mockSql.mockResolvedValue({ rows: [] });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const res = await POST(
      new Request("https://app.test/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": "t=1,v1=sig" },
        body: JSON.stringify(fakeEvent),
      }) as never
    );
    expect(res.status).toBe(200);
    // Credit grant was attempted
    expect(
      mockAddTripCredits.mock.calls.length + mockSql.mock.calls.length
    ).toBeGreaterThan(0);
  });

  it("ignores non-checkout events idempotently", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    mockConstructEvent.mockReturnValue({
      id: "evt_456",
      type: "customer.created",
      data: { object: {} },
    });
    mockGetStripe.mockReturnValue({
      webhooks: { constructEvent: mockConstructEvent },
    });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const res = await POST(
      new Request("https://app.test/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": "t=1,v1=sig" },
        body: "{}",
      }) as never
    );
    expect(res.status).toBe(200);
    expect(mockAddTripCredits).not.toHaveBeenCalled();
  });
});
