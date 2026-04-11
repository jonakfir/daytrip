import Stripe from "stripe";

/**
 * Stripe helper for Daytrip's $3-per-trip pricing model.
 *
 * Two env vars are required for live payments:
 *   - STRIPE_SECRET_KEY    (sk_test_... or sk_live_...)
 *   - STRIPE_WEBHOOK_SECRET (whsec_..., from the Stripe dashboard webhook page)
 *
 * If STRIPE_SECRET_KEY isn't set, getStripe() returns null and the
 * checkout endpoint reports a friendly "not configured" error.
 */

let cached: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.startsWith("your_")) return null;
  // Let the SDK pick its default API version (matches the installed
  // package's bundled types, currently dahlia / 2026-03-25).
  cached = new Stripe(key);
  return cached;
}

export function isStripeConfigured(): boolean {
  return !!getStripe();
}

/** Price for a single trip credit, in USD cents. */
export const TRIP_PRICE_CENTS = 300;

/** Build absolute success/cancel URLs for Stripe Checkout. */
export function buildCheckoutUrls(req: Request): {
  successUrl: string;
  cancelUrl: string;
} {
  const fromHeader = req.headers.get("origin");
  const base =
    fromHeader ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "https://daytrip-five.vercel.app";
  return {
    successUrl: `${base}/pricing?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}/pricing?status=cancel`,
  };
}
