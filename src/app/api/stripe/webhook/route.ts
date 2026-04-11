import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { addTripCredits } from "@/lib/db";
import { sql } from "@vercel/postgres";

export const runtime = "nodejs";

/**
 * Stripe webhook handler.
 *
 * Configure in Stripe dashboard → Developers → Webhooks → Add endpoint:
 *   URL:  https://daytrip-five.vercel.app/api/stripe/webhook
 *   Events: checkout.session.completed
 *
 * Stripe will give you a "Signing secret" (whsec_...) — set it as
 * STRIPE_WEBHOOK_SECRET in Vercel.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    console.error("Stripe webhook hit but Stripe is not configured");
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  // Verify the signature using the raw body
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("stripe webhook signature verification failed:", message);
    return NextResponse.json(
      { error: "invalid signature", details: message },
      { status: 400 }
    );
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      amount_total: number | null;
      currency: string | null;
      metadata?: Record<string, string>;
    };
    const userId = session.metadata?.userId;
    const amountCents = session.amount_total ?? 300;
    const currency = session.currency ?? "usd";

    if (!userId) {
      console.error(
        "checkout.session.completed missing userId in metadata:",
        session.id
      );
      return NextResponse.json({ received: true });
    }

    try {
      // Credit the user with 1 trip
      await addTripCredits(userId, 1);

      // Record the payment + bump total_paid_cents
      await sql`
        INSERT INTO payments (user_id, amount_cents, currency, plan, stripe_payment_id, status)
        VALUES (${userId}, ${amountCents}, ${currency}, 'per-trip', ${session.id}, 'succeeded')
        ON CONFLICT (stripe_payment_id) DO NOTHING
      `;
      await sql`
        UPDATE users
        SET total_paid_cents = total_paid_cents + ${amountCents}
        WHERE id = ${userId}
      `;

      console.log(
        `[stripe-webhook] credited 1 trip to user ${userId} ($${(
          amountCents / 100
        ).toFixed(2)})`
      );
    } catch (e) {
      console.error("Failed to credit user after payment:", e);
      // Return 500 so Stripe retries the webhook
      return NextResponse.json(
        { error: "credit_failed" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
