import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { TRIP_PRICE_CENTS, buildCheckoutUrls } from "@/lib/stripe";

/**
 * Create a Stripe Checkout session for one $3 trip credit.
 *
 * Uses raw fetch() instead of the Stripe SDK because the SDK's internal
 * HTTP client doesn't reliably work in Vercel's serverless runtime
 * (returns "An error occurred with our connection to Stripe"). Raw fetch
 * is simpler and actually works.
 *
 * Auth: requires the user to be logged in (cookie-based JWT). Anonymous
 * users get 401. Admin users shouldn't normally hit this — they have
 * unlimited free trips.
 *
 * Returns { url } which the client redirects to.
 */

export const runtime = "nodejs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "daytrip-secret-change-me-in-production"
);

interface JwtPayload {
  email?: string;
  userId?: string;
  role?: string;
}

/**
 * Call the Stripe REST API directly. Stripe uses form-urlencoded with
 * bracket notation for nested fields.
 */
async function createCheckoutSession(params: {
  secretKey: string;
  successUrl: string;
  cancelUrl: string;
  email: string;
  userId: string;
  returnTo: string;
}): Promise<{ id: string; url: string }> {
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("payment_method_types[0]", "card");
  form.set("customer_email", params.email);

  // Inline price_data: $3 USD, product name "Daytrip — 1 trip credit"
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", "usd");
  form.set(
    "line_items[0][price_data][unit_amount]",
    String(TRIP_PRICE_CENTS)
  );
  form.set(
    "line_items[0][price_data][product_data][name]",
    "Daytrip — 1 trip credit"
  );
  form.set(
    "line_items[0][price_data][product_data][description]",
    "One AI-generated travel itinerary with real flights, hotels, activities, and an interactive refinement chat."
  );

  form.set("success_url", params.successUrl);
  form.set("cancel_url", params.cancelUrl);

  // Metadata is forwarded to the webhook on checkout.session.completed
  form.set("metadata[userId]", params.userId);
  form.set("metadata[email]", params.email);
  form.set("metadata[returnTo]", params.returnTo);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(params.secretKey + ":").toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2025-04-30.basil",
    },
    body: form.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg =
      data?.error?.message ?? data?.error?.type ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  if (!data?.url || !data?.id) {
    throw new Error("Stripe response missing url/id");
  }
  return { id: data.id as string, url: data.url as string };
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey.startsWith("your_")) {
    return NextResponse.json(
      {
        error: "Stripe not configured",
        message:
          "Set STRIPE_SECRET_KEY in Vercel env vars to enable payments.",
      },
      { status: 503 }
    );
  }

  // Auth check
  const token = req.cookies.get("daytrip-auth")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  let payload: JwtPayload;
  try {
    const { payload: p } = await jwtVerify(token, JWT_SECRET);
    payload = p as JwtPayload;
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
  const userId = payload.userId;
  const email = payload.email;
  if (!userId || !email) {
    return NextResponse.json(
      { error: "Account required — please sign up first" },
      { status: 401 }
    );
  }

  // Optional returnTo for deep-linking back to the pending trip generation
  let returnTo = "";
  try {
    const body = (await req.json()) as { returnTo?: string };
    if (typeof body.returnTo === "string") returnTo = body.returnTo;
  } catch {
    // body is optional
  }

  const { successUrl, cancelUrl } = buildCheckoutUrls(req);

  try {
    const session = await createCheckoutSession({
      secretKey,
      successUrl,
      cancelUrl,
      email,
      userId,
      returnTo,
    });
    return NextResponse.json({ url: session.url, id: session.id });
  } catch (e) {
    console.error("stripe checkout error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create checkout session", details: message },
      { status: 500 }
    );
  }
}
