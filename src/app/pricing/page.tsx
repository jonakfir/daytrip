"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check,
  Sparkles,
  Plane,
  MapPin,
  MessageCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";

const FEATURES = [
  { icon: MapPin, text: "Real, day-by-day itinerary with attractions" },
  { icon: Plane, text: "Skyscanner flight links from your home city" },
  { icon: Sparkles, text: "Wikipedia hero photo + 3 hotels + 3 tours" },
  { icon: RefreshCw, text: "Swap any activity with one click" },
  { icon: MessageCircle, text: "Refine your trip with AI chat" },
];

interface CreditState {
  authenticated: boolean;
  credits: number; // -1 = unlimited (admin)
  isAdmin: boolean;
}

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [credits, setCredits] = useState<CreditState | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const status = searchParams.get("status"); // "success" | "cancel" | null

  useEffect(() => {
    fetch("/api/me/credits")
      .then((r) => r.json())
      .then((d) => setCredits(d as CreditState))
      .catch(() => setCredits({ authenticated: false, credits: 0, isAdmin: false }));
  }, []);

  const buyTrip = async () => {
    if (!credits?.authenticated) {
      router.push("/signup?next=/pricing");
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo: "/pricing" }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert(data?.message ?? data?.error ?? "Checkout failed");
        setCheckoutLoading(false);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Checkout failed");
      setCheckoutLoading(false);
    }
  };

  const ctaLabel = (() => {
    if (credits?.isAdmin) return "You have admin access";
    if (!credits?.authenticated) return "Sign up — first trip free";
    if (credits.credits > 0)
      return `Plan a trip (${credits.credits} credit${credits.credits === 1 ? "" : "s"} left)`;
    return checkoutLoading ? "Redirecting…" : "Buy 1 trip — $3";
  })();

  const ctaAction = () => {
    if (credits?.isAdmin) {
      router.push("/");
    } else if (!credits?.authenticated) {
      router.push("/signup?next=/pricing");
    } else if (credits.credits > 0) {
      router.push("/");
    } else {
      buyTrip();
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="px-6 md:px-12 lg:px-20 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-heading-lg text-charcoal-900 hover:text-terracotta-500 transition-colors"
          >
            Daytrip
          </Link>
          <Link
            href="/"
            className="font-sans text-body-sm text-charcoal-800/60 hover:text-charcoal-900"
          >
            ← Back to Daytrip
          </Link>
        </div>
      </header>

      <main className="px-6 md:px-12 lg:px-20 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-12">
            <p className="font-sans text-caption uppercase tracking-[0.2em] text-terracotta-500 mb-3">
              Pricing
            </p>
            <h1 className="font-serif text-display-lg text-charcoal-900 mb-4">
              Pay only for what you use
            </h1>
            <p className="font-sans text-body-lg text-charcoal-800/60 max-w-xl mx-auto">
              Your first trip is on us. After that, every itinerary is just{" "}
              <span className="font-medium text-charcoal-900">$3</span> — no
              subscription, no commitment, no monthly fees.
            </p>
          </div>

          {/* Status banner */}
          {status === "success" && (
            <div className="mb-8 px-5 py-3 rounded-2xl bg-sage-300/20 border border-sage-400/30 text-center font-sans text-body-sm text-sage-700">
              ✓ Payment successful — your trip credit has been added.
            </div>
          )}
          {status === "cancel" && (
            <div className="mb-8 px-5 py-3 rounded-2xl bg-cream-200 border border-cream-300 text-center font-sans text-body-sm text-charcoal-800/70">
              Checkout cancelled. No charge was made.
            </div>
          )}

          {/* The single big pricing card */}
          <div className="bg-white rounded-3xl shadow-elevated border border-cream-200 p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-baseline gap-1 mb-2">
                <span className="font-serif text-display-lg text-charcoal-900">
                  $3
                </span>
                <span className="font-sans text-body-lg text-charcoal-800/50">
                  / trip
                </span>
              </div>
              <div className="font-sans text-body-sm text-terracotta-500 font-medium">
                First trip free when you sign up
              </div>
            </div>

            {/* Credits state */}
            {credits?.authenticated && !credits.isAdmin && (
              <div className="mb-6 px-5 py-3 rounded-2xl bg-cream-100 border border-cream-200 text-center">
                <span className="font-sans text-caption text-charcoal-800/50 uppercase tracking-wider">
                  Your balance
                </span>
                <div className="font-serif text-heading-lg text-charcoal-900 mt-1">
                  {credits.credits} trip{credits.credits === 1 ? "" : "s"}{" "}
                  available
                </div>
              </div>
            )}
            {credits?.isAdmin && (
              <div className="mb-6 px-5 py-3 rounded-2xl bg-terracotta-500/10 border border-terracotta-500/20 text-center">
                <span className="font-sans text-body-sm text-terracotta-600 font-medium">
                  Admin account — unlimited trips
                </span>
              </div>
            )}

            {/* Feature list */}
            <ul className="space-y-3 mb-8">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <li
                    key={f.text}
                    className="flex items-start gap-3 font-sans text-body-sm text-charcoal-800/80"
                  >
                    <div className="p-1.5 rounded-lg bg-sage-300/20 text-sage-600 mt-0.5">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{f.text}</span>
                  </li>
                );
              })}
              <li className="flex items-start gap-3 font-sans text-body-sm text-charcoal-800/80">
                <div className="p-1.5 rounded-lg bg-sage-300/20 text-sage-600 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>One-time payment — no subscription, ever</span>
              </li>
            </ul>

            <button
              onClick={ctaAction}
              disabled={checkoutLoading}
              className="w-full py-4 px-6 rounded-2xl bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-sans font-medium text-body shadow-card transition-all"
            >
              {checkoutLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting…
                </span>
              ) : (
                ctaLabel
              )}
            </button>

            <p className="mt-4 text-center font-sans text-caption text-charcoal-800/40">
              Secure payment via Stripe. Cards accepted worldwide.
            </p>
          </div>

          {/* Tiny FAQ */}
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-serif text-heading text-charcoal-900 mb-2">
                Why one-time?
              </h3>
              <p className="font-sans text-body-sm text-charcoal-800/60">
                You shouldn&apos;t pay every month if you only travel
                occasionally. Buy a credit when you need a trip.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-heading text-charcoal-900 mb-2">
                What does $3 buy?
              </h3>
              <p className="font-sans text-body-sm text-charcoal-800/60">
                One full multi-day itinerary, real flight + hotel links, and
                unlimited refinements via the AI chat for that trip.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-heading text-charcoal-900 mb-2">
                Can I get a refund?
              </h3>
              <p className="font-sans text-body-sm text-charcoal-800/60">
                If something&apos;s wrong with a trip, email
                hello@daytrip.travel and we&apos;ll refund you within 24 hours.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-terracotta-500" />
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
