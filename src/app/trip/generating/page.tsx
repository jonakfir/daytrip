"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  MapPin,
  UtensilsCrossed,
  Plane,
  Hotel,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import type { Itinerary } from "@/types/itinerary";
import { useIsNativeApp } from "@/lib/useIsNativeApp";
import { hapticSuccess } from "@/lib/capacitor";

interface Step {
  key: "hero" | "booking" | "days";
  icon: typeof MapPin;
  label: string;
  sublabel: string;
}

const STEPS: Step[] = [
  {
    key: "hero",
    icon: ImageIcon,
    label: "Finding the perfect hero photo",
    sublabel: "Searching Wikipedia for a real shot of your destination…",
  },
  {
    key: "booking",
    icon: Hotel,
    label: "Curating hotels & flights",
    sublabel: "Picking the best places to stay and routes to get there…",
  },
  {
    key: "days",
    icon: Compass,
    label: "Crafting your day-by-day journey",
    sublabel: "Sequencing real attractions, restaurants, and tips…",
  },
];

interface PartialItinerary {
  id?: string;
  shareId?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  travelStyle?: string;
  originCity?: string;
  numDays?: number;
  heroImage?: string;
  days?: Itinerary["days"];
  hotels?: Itinerary["hotels"];
  flights?: Itinerary["flights"];
  tours?: Itinerary["tours"];
  tips?: Itinerary["tips"];
}

function GeneratingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Record<Step["key"], boolean>>({
    hero: false,
    booking: false,
    days: false,
  });
  const [partial, setPartial] = useState<PartialItinerary>({});
  const isNative = useIsNativeApp();

  const destination = searchParams.get("destination") || "your destination";

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const generateTrip = async () => {
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination: searchParams.get("destination") || "Tokyo, Japan",
            startDate:
              searchParams.get("startDate") ||
              new Date().toISOString().split("T")[0],
            endDate:
              searchParams.get("endDate") ||
              new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
            travelers: parseInt(searchParams.get("travelers") || "2"),
            style: searchParams.get("style") || "Cultural",
            originCity: searchParams.get("originCity") || undefined,
            originAirport: searchParams.get("originAirport") || undefined,
            destinationAirport:
              searchParams.get("destinationAirport") || undefined,
            budgetPerDay: searchParams.get("budgetPerDay")
              ? parseInt(searchParams.get("budgetPerDay")!)
              : undefined,
          }),
          signal: controller.signal,
        });

        if (response.status === 401) {
          // Fallback: should no longer happen now that anonymous users get
          // one free trip, but keep the redirect as a safety net.
          router.push(
            `/signup?next=${encodeURIComponent(
              `/trip/generating?${searchParams.toString()}`
            )}`
          );
          return;
        }
        if (response.status === 402) {
          // Out of credits. The backend uses the same 402 for both
          // "anonymous user out of free trips" and "signed-in user out
          // of paid credits" — the body's `error` field disambiguates.
          let code: "OUT_OF_CREDITS" | "ANON_LIMIT" = "OUT_OF_CREDITS";
          try {
            const body = await response.clone().json();
            if (body?.error === "anon_limit_reached") code = "ANON_LIMIT";
          } catch {}
          setError(code);
          return;
        }
        if (response.status === 403) {
          router.push("/pricing");
          return;
        }
        if (!response.ok || !response.body) {
          throw new Error(
            `Generation failed (HTTP ${response.status})`
          );
        }

        // Read NDJSON stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          let newlineIdx;
          while ((newlineIdx = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, newlineIdx).trim();
            buffer = buffer.slice(newlineIdx + 1);
            if (!line) continue;

            try {
              const event = JSON.parse(line) as { type: string } & Record<
                string,
                unknown
              >;

              if (event.type === "start") {
                setPartial((p) => ({
                  ...p,
                  shareId: event.shareId as string,
                  destination: event.destination as string,
                  startDate: event.startDate as string,
                  endDate: event.endDate as string,
                  travelers: event.travelers as number,
                  travelStyle: event.travelStyle as string,
                  originCity: event.originCity as string,
                  numDays: event.numDays as number,
                }));
              } else if (event.type === "hero") {
                setPartial((p) => ({
                  ...p,
                  heroImage: event.heroImage as string,
                }));
                setCompleted((c) => ({ ...c, hero: true }));
              } else if (event.type === "booking") {
                setPartial((p) => ({
                  ...p,
                  hotels: event.hotels as Itinerary["hotels"],
                  flights: event.flights as Itinerary["flights"],
                  tours: event.tours as Itinerary["tours"],
                  tips: event.tips as Itinerary["tips"],
                }));
                setCompleted((c) => ({ ...c, booking: true }));
              } else if (event.type === "days") {
                setPartial((p) => ({
                  ...p,
                  days: event.days as Itinerary["days"],
                }));
                setCompleted((c) => ({ ...c, days: true }));
              } else if (event.type === "done") {
                hapticSuccess();
                const itinerary = event.itinerary as Itinerary;
                const shareId = itinerary?.shareId ?? "demo";
                try {
                  sessionStorage.setItem(
                    `daytrip:itinerary:${shareId}`,
                    JSON.stringify(itinerary)
                  );
                } catch {
                  // ignore quota
                }
                if (!cancelled) router.push(`/trip/${shareId}`);
                return;
              } else if (event.type === "error") {
                throw new Error(
                  (event.error as string) || "Generation failed"
                );
              }
            } catch (parseError) {
              console.warn(
                "Failed to parse stream line:",
                parseError,
                "line:",
                line
              );
            }
          }
        }
      } catch (err) {
        if (
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          return;
        }
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    };

    generateTrip();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [router, searchParams]);

  if (error === "ANON_LIMIT") {
    const next = `/trip/generating?${searchParams.toString()}`;
    return (
      <main className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-terracotta-500/10 rounded-full mb-6">
            <Compass className="w-8 h-8 text-terracotta-500" />
          </div>
          <h1 className="font-serif text-display text-charcoal-900 mb-3">
            Keep planning?
          </h1>
          <p className="font-sans text-body text-charcoal-800/70 mb-8 max-w-sm mx-auto">
            You&apos;ve used your free trip. Sign up free to save your
            itineraries and get another trip, or buy 1 for $3.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() =>
                router.push(`/signup?next=${encodeURIComponent(next)}`)
              }
              className="px-6 py-3 bg-terracotta-500 text-white rounded-xl font-sans font-medium hover:bg-terracotta-600 transition-colors"
            >
              Sign up free
            </button>
            <button
              onClick={() =>
                router.push(`/login?next=${encodeURIComponent(next)}`)
              }
              className="px-6 py-3 border border-cream-300 text-charcoal-800 rounded-xl font-sans font-medium hover:bg-cream-100 transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 text-charcoal-800/60 rounded-xl font-sans font-medium hover:text-charcoal-900 transition-colors"
            >
              Back home
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (error === "OUT_OF_CREDITS") {
    if (isNative) {
      return (
        <main className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-terracotta-500/10 rounded-full mb-6">
              <Compass className="w-8 h-8 text-terracotta-500" />
            </div>
            <h1 className="font-serif text-display text-charcoal-900 mb-3">
              No trips available
            </h1>
            <p className="font-sans text-body text-charcoal-800/70 mb-8 max-w-sm mx-auto">
              You&apos;ve used all of your trip credits.
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-terracotta-500 text-white rounded-xl font-sans font-medium hover:bg-terracotta-600 transition-colors"
            >
              Back home
            </button>
          </div>
        </main>
      );
    }
    const buyTrip = async () => {
      try {
        const returnTo = `/trip/generating?${searchParams.toString()}`;
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ returnTo }),
        });
        const data = await res.json();
        if (data?.url) {
          window.location.href = data.url;
        } else {
          alert(data?.message ?? data?.error ?? "Checkout failed");
        }
      } catch (e) {
        alert(e instanceof Error ? e.message : "Checkout failed");
      }
    };
    return (
      <main className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-terracotta-500/10 rounded-full mb-6">
            <Compass className="w-8 h-8 text-terracotta-500" />
          </div>
          <h1 className="font-serif text-display text-charcoal-900 mb-3">
            One more trip?
          </h1>
          <p className="font-sans text-body text-charcoal-800/70 mb-8 max-w-sm mx-auto">
            You&apos;ve used your free trip. Each new itinerary is just{" "}
            <span className="font-medium text-charcoal-900">$3</span> — pay
            once, get one trip with the AI chat, real flights, hotels, and
            activities.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={buyTrip}
              className="px-6 py-3 bg-terracotta-500 text-white rounded-xl font-sans font-medium hover:bg-terracotta-600 transition-colors"
            >
              Buy 1 trip — $3
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 border border-cream-300 text-charcoal-800 rounded-xl font-sans font-medium hover:bg-cream-100 transition-colors"
            >
              Back home
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="font-serif text-display text-charcoal-900 mb-4">
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

  // Compute progress percentage from completed steps
  const completedCount = Object.values(completed).filter(Boolean).length;
  const progress = (completedCount / STEPS.length) * 100;

  // Find which step is active (first incomplete)
  const activeStepKey = STEPS.find((s) => !completed[s.key])?.key;

  return (
    <main className="min-h-screen bg-cream-100 flex items-center justify-center px-6 py-16">
      <div className="text-center max-w-2xl w-full">
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

        <div className="space-y-4 max-w-md mx-auto">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isDone = completed[step.key];
            const isActive = step.key === activeStepKey;

            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: isDone ? 0.7 : isActive ? 1 : 0.3,
                  x: 0,
                }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="flex items-center gap-4"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500 ${
                    isDone
                      ? "bg-sage-500 text-white"
                      : isActive
                      ? "bg-terracotta-500 text-white"
                      : "bg-cream-200 text-charcoal-800/40"
                  }`}
                >
                  {isDone ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="text-left flex-1">
                  <p
                    className={`font-sans font-medium transition-colors duration-500 ${
                      isActive || isDone
                        ? "text-charcoal-900"
                        : "text-charcoal-800/50"
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
          className="mt-12 h-1 bg-cream-200 rounded-full overflow-hidden max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-full bg-terracotta-500 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Live preview of what's loaded so far */}
        {(partial.hotels || partial.flights || partial.days) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 max-w-md mx-auto bg-white rounded-2xl shadow-card p-5 text-left"
          >
            <p className="text-caption uppercase tracking-wider text-charcoal-800/40 font-sans font-medium mb-3">
              Live preview
            </p>
            {partial.flights && partial.flights[0] && (
              <div className="flex items-center gap-2 text-body-sm text-charcoal-800/80 font-sans mb-2">
                <Plane className="w-3.5 h-3.5 text-terracotta-500" />
                <span>
                  {partial.flights[0].airline}{" "}
                  {partial.flights[0].originAirport ?? ""} →{" "}
                  {partial.flights[0].destinationAirport ?? ""}
                </span>
              </div>
            )}
            {partial.hotels && partial.hotels[0] && (
              <div className="flex items-center gap-2 text-body-sm text-charcoal-800/80 font-sans mb-2">
                <Hotel className="w-3.5 h-3.5 text-terracotta-500" />
                <span>{partial.hotels[0].name}</span>
              </div>
            )}
            {partial.days && partial.days[0] && (
              <div className="flex items-center gap-2 text-body-sm text-charcoal-800/80 font-sans">
                <MapPin className="w-3.5 h-3.5 text-terracotta-500" />
                <span>
                  Day 1: {partial.days[0].title || partial.days[0].morning?.[0]?.name}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}

export default function GeneratingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-cream-100 flex items-center justify-center">
          <Compass
            className="w-16 h-16 text-terracotta-500 animate-spin"
            strokeWidth={1}
          />
        </main>
      }
    >
      <GeneratingContent />
    </Suspense>
  );
}
