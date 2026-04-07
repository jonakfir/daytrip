"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Zap, Crown } from "lucide-react";

const plans = [
  {
    name: "Explorer",
    price: "$9",
    period: "/trip",
    description: "Perfect for a single getaway",
    icon: Zap,
    color: "terracotta",
    features: [
      "1 AI-generated itinerary",
      "Day-by-day activity plan",
      "Hotel & flight recommendations",
      "Shareable trip link",
      "Activity swap suggestions",
    ],
    cta: "Get started",
    popular: false,
  },
  {
    name: "Voyager",
    price: "$29",
    period: "/month",
    description: "For the frequent traveler",
    icon: Sparkles,
    color: "terracotta",
    features: [
      "Unlimited itineraries",
      "Multi-city trip planning",
      "Priority AI generation",
      "Exclusive hidden gems",
      "Bookable activities & tours",
      "Save & share all trips",
      "Email trip summaries",
    ],
    cta: "Start planning",
    popular: true,
  },
  {
    name: "First Class",
    price: "$79",
    period: "/year",
    description: "Best value — save 77%",
    icon: Crown,
    color: "sage",
    features: [
      "Everything in Voyager",
      "Yearly unlimited access",
      "Concierge-level detail",
      "Offline PDF exports",
      "Priority support",
      "Early access to new features",
    ],
    cta: "Upgrade now",
    popular: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [toast, setToast] = useState(false);

  const showToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  return (
    <main className="min-h-screen bg-cream-100 py-20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <p className="text-caption uppercase tracking-[0.2em] text-terracotta-500 font-sans mb-3">
            Pricing
          </p>
          <h1 className="font-serif text-display-lg md:text-display-xl text-charcoal-900 mb-4">
            Plan trips like a pro
          </h1>
          <p className="text-body-lg text-charcoal-800/60 max-w-xl mx-auto">
            AI-powered itineraries with real bookable hotels, flights, and activities.
            Choose the plan that fits your wanderlust.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-3xl p-8 shadow-card hover:shadow-elevated transition-shadow duration-300 ${
                plan.popular
                  ? "ring-2 ring-terracotta-500 scale-[1.02]"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-terracotta-500 text-white text-caption font-sans font-medium rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    plan.color === "sage"
                      ? "bg-sage-500/10"
                      : "bg-terracotta-500/10"
                  }`}
                >
                  <plan.icon
                    className={`w-6 h-6 ${
                      plan.color === "sage"
                        ? "text-sage-600"
                        : "text-terracotta-500"
                    }`}
                  />
                </div>
                <h3 className="font-serif text-heading-lg text-charcoal-900">
                  {plan.name}
                </h3>
                <p className="text-body-sm text-charcoal-800/50 mt-1">
                  {plan.description}
                </p>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="font-serif text-display-lg text-charcoal-900">
                  {plan.price}
                </span>
                <span className="text-body text-charcoal-800/40">
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-sage-500 mt-0.5 shrink-0" />
                    <span className="text-body-sm text-charcoal-800/70">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={showToast}
                className={`w-full py-3.5 rounded-xl font-sans font-medium transition-colors ${
                  plan.popular
                    ? "bg-terracotta-500 text-white hover:bg-terracotta-600"
                    : "border border-cream-300 text-charcoal-900 hover:border-terracotta-500 hover:text-terracotta-500"
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Back link */}
        <div className="text-center mt-12">
          <button
            onClick={() => router.push("/")}
            className="text-body-sm text-terracotta-500 hover:underline"
          >
            ← Back to Daytrip
          </button>
        </div>
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-charcoal-900 text-white px-6 py-3 rounded-xl shadow-elevated font-sans text-body-sm"
          >
            Payment integration launching soon — join the waitlist!
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
