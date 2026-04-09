"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, MapPin, UtensilsCrossed, Plane, Hotel } from "lucide-react";

const steps = [
  { icon: MapPin, label: "Discovering hidden gems", sublabel: "Searching for the best attractions..." },
  { icon: UtensilsCrossed, label: "Finding local flavors", sublabel: "Curating restaurant recommendations..." },
  { icon: Hotel, label: "Selecting stays", sublabel: "Comparing the finest hotels..." },
  { icon: Plane, label: "Booking flights", sublabel: "Finding the best routes..." },
  { icon: Compass, label: "Crafting your journey", sublabel: "Our AI is writing your story..." },
];

function GeneratingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const destination = searchParams.get("destination") || "your destination";

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2000);

    const generateTrip = async () => {
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination: searchParams.get("destination") || "Tokyo, Japan",
            startDate: searchParams.get("startDate") || new Date().toISOString().split("T")[0],
            endDate: searchParams.get("endDate") || new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
            travelers: parseInt(searchParams.get("travelers") || "2"),
            style: searchParams.get("style") || "Cultural",
          }),
        });

        if (response.status === 403) {
          clearInterval(stepInterval);
          router.push("/pricing");
          return;
        }
        if (!response.ok) throw new Error("Failed to generate itinerary");

        const data = await response.json();
        clearInterval(stepInterval);
        const itinerary = data.itinerary;
        const shareId = itinerary?.shareId || itinerary?.share_id || "demo";

        // Hand off the itinerary via sessionStorage so the trip page can
        // render it without needing a DB lookup. (Supabase/Postgres persistence
        // is optional — without it, sharing links won't survive a session.)
        try {
          if (itinerary) {
            sessionStorage.setItem(
              `daytrip:itinerary:${shareId}`,
              JSON.stringify(itinerary)
            );
          }
        } catch {
          // ignore quota errors
        }

        router.push(`/trip/${shareId}`);
      } catch (err) {
        clearInterval(stepInterval);
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    };

    generateTrip();

    return () => clearInterval(stepInterval);
  }, [router, searchParams]);

  if (error) {
    return (
      <main className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="font-serif text-heading-xl text-charcoal-900 mb-4">
            Something went wrong
          </h1>
          <p className="text-body text-charcoal-800/70 mb-8">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-terracotta-500 text-white rounded-xl font-sans font-medium hover:bg-terracotta-600 transition-colors"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="inline-block mb-8"
        >
          <Compass className="w-16 h-16 text-terracotta-500" strokeWidth={1} />
        </motion.div>

        <h1 className="font-serif text-display text-charcoal-900 mb-3">
          Planning your trip to
        </h1>
        <h2 className="font-serif text-display-lg text-terracotta-500 mb-12">
          {destination}
        </h2>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isDone = index < currentStep;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: isDone ? 0.5 : isActive ? 1 : 0.3,
                  x: 0,
                }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="flex items-center gap-4"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500 ${
                    isActive
                      ? "bg-terracotta-500 text-white"
                      : isDone
                      ? "bg-sage-500 text-white"
                      : "bg-cream-200 text-charcoal-800/40"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p
                    className={`font-sans font-medium transition-colors duration-500 ${
                      isActive ? "text-charcoal-900" : "text-charcoal-800/50"
                    }`}
                  >
                    {step.label}
                  </p>
                  <AnimatePresence>
                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-body-sm text-charcoal-800/50"
                      >
                        {step.sublabel}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="mt-12 h-1 bg-cream-200 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-full bg-terracotta-500 rounded-full"
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </main>
  );
}

export default function GeneratingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-cream-100 flex items-center justify-center">
          <Compass className="w-16 h-16 text-terracotta-500 animate-spin" strokeWidth={1} />
        </main>
      }
    >
      <GeneratingContent />
    </Suspense>
  );
}
