"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  MapPin,
  Plane,
  Hotel,
  Check,
  Loader2,
  CircleDot,
  AlertTriangle,
} from "lucide-react";
import type { Itinerary } from "@/types/itinerary";
import { useIsNativeApp } from "@/lib/useIsNativeApp";
import { hapticSuccess } from "@/lib/capacitor";

type StepStatus = "pending" | "running" | "done" | "failed";
interface StepRecord {
  index: number;
  key: string;
  label: string;
  status: StepStatus;
  attempts: number;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
}

interface StatusResponse {
  jobId: string;
  status: "pending" | "running" | "complete" | "failed";
  currentStep: number;
  totalSteps: number;
  stepLabel: string | null;
  steps: StepRecord[];
  error: string | null;
  shareId: string | null;
  updatedAt?: string;
  partial: {
    heroImage: string | null;
    cityPlan: Array<{ city: string; country: string; startDay: number; endDay: number }> | null;
    booking: {
      hotels: Itinerary["hotels"];
      flights: Itinerary["flights"];
      tours: Itinerary["tours"];
      tips: Itinerary["tips"];
    } | null;
    dayChunks: Array<{ chunkIndex: number; days: Itinerary["days"] }>;
  };
}

const MAX_CONSECUTIVE_FAILURES = 3;
const STEP_POLL_MIN_MS = 400;

function GeneratingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNative = useIsNativeApp();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [lastTickAt, setLastTickAt] = useState<number>(Date.now());
  const consecutiveFailures = useRef(0);
  const startedRef = useRef(false);

  const destination = searchParams.get("destination") || "your destination";

  // ── Start a job then drive its steps ──────────────────────────────
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;

    const startJob = async (): Promise<string | null> => {
      const body = {
        destination: searchParams.get("destination") || "Tokyo, Japan",
        startDate:
          searchParams.get("startDate") ||
          new Date().toISOString().split("T")[0],
        endDate:
          searchParams.get("endDate") ||
          new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
        travelers: parseInt(searchParams.get("travelers") || "2"),
        style: searchParams.get("style") || "Cultural",
        styles: (searchParams.get("styles") || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        regions: (searchParams.get("regions") || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        cities: (searchParams.get("cities") || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        originCity: searchParams.get("originCity") || undefined,
        originAirport: searchParams.get("originAirport") || undefined,
        destinationAirport: searchParams.get("destinationAirport") || undefined,
        budgetPerDay: searchParams.get("budgetPerDay")
          ? parseInt(searchParams.get("budgetPerDay")!)
          : undefined,
      };
      const res = await fetch("/api/trip/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        router.push(
          `/signup?next=${encodeURIComponent(
            `/trip/generating?${searchParams.toString()}`
          )}`
        );
        return null;
      }
      if (res.status === 402) {
        try {
          const j = await res.json();
          setFatalError(j?.error === "anon_limit_reached" ? "ANON_LIMIT" : "OUT_OF_CREDITS");
        } catch {
          setFatalError("OUT_OF_CREDITS");
        }
        return null;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setFatalError(j?.message || `Failed to start (HTTP ${res.status})`);
        return null;
      }
      const j = (await res.json()) as {
        jobId: string;
        totalSteps: number;
        steps: StepRecord[];
      };
      setStatus({
        jobId: j.jobId,
        status: "pending",
        currentStep: 0,
        totalSteps: j.totalSteps,
        stepLabel: null,
        steps: j.steps,
        error: null,
        shareId: null,
        partial: { heroImage: null, cityPlan: null, booking: null, dayChunks: [] },
      });
      setLastTickAt(Date.now());
      return j.jobId;
    };

    const runStep = async (jobId: string): Promise<StatusResponse | null> => {
      try {
        const res = await fetch(`/api/trip/step/${jobId}`, { method: "POST" });
        if (!res.ok && res.status !== 500) {
          throw new Error(`Step failed (HTTP ${res.status})`);
        }
        const j = (await res.json()) as StatusResponse;
        consecutiveFailures.current = 0;
        return j;
      } catch (e) {
        consecutiveFailures.current += 1;
        if (consecutiveFailures.current >= MAX_CONSECUTIVE_FAILURES) {
          throw e;
        }
        // Brief backoff before the caller retries
        await new Promise((r) => setTimeout(r, 1000 * consecutiveFailures.current));
        return null;
      }
    };

    const drive = async () => {
      const jobId = await startJob();
      if (!jobId || cancelled) return;

      while (!cancelled) {
        let next: StatusResponse | null = null;
        try {
          next = await runStep(jobId);
        } catch (e) {
          setFatalError(
            e instanceof Error
              ? `${e.message} — we retried ${MAX_CONSECUTIVE_FAILURES} times and couldn't reach the server.`
              : "Generation failed"
          );
          return;
        }
        if (!next) continue; // retryable hiccup
        setStatus(next);
        setLastTickAt(Date.now());

        if (next.status === "complete") {
          hapticSuccess();
          // Pull the final itinerary via the assemble step output; it's
          // already in the partial state from the server, so rebuild here.
          const days = next.partial.dayChunks
            .slice()
            .sort((a, b) => a.chunkIndex - b.chunkIndex)
            .flatMap((c) => c.days);
          const itinerary: Partial<Itinerary> = {
            shareId: next.shareId ?? "demo",
            destination: searchParams.get("destination") || "your destination",
            startDate: searchParams.get("startDate") ?? "",
            endDate: searchParams.get("endDate") ?? "",
            travelers: parseInt(searchParams.get("travelers") ?? "2"),
            travelStyle: searchParams.get("style") ?? "Cultural",
            budget: "moderate",
            days,
            hotels: next.partial.booking?.hotels ?? [],
            flights: next.partial.booking?.flights ?? [],
            tours: next.partial.booking?.tours ?? [],
            tips: next.partial.booking?.tips ?? [],
            heroImage: next.partial.heroImage ?? undefined,
            originCity: searchParams.get("originCity") || undefined,
          };
          try {
            sessionStorage.setItem(
              `daytrip:itinerary:${itinerary.shareId}`,
              JSON.stringify(itinerary)
            );
          } catch {}
          if (!cancelled) router.push(`/trip/${itinerary.shareId}`);
          return;
        }
        if (next.status === "failed") {
          setFatalError(next.error ?? "Generation failed");
          return;
        }
        await new Promise((r) => setTimeout(r, STEP_POLL_MIN_MS));
      }
    };

    drive().catch((e) => {
      setFatalError(e instanceof Error ? e.message : "Unknown error");
    });

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  // ── Error screens ────────────────────────────────────────────────
  if (fatalError === "ANON_LIMIT") {
    const next = `/trip/generating?${searchParams.toString()}`;
    return (
      <ErrorShell
        title="Keep planning?"
        body="You've used your free trip. Sign up free to save your itineraries and get another, or buy 1 for $3."
        primary={{ label: "Sign up free", onClick: () => router.push(`/signup?next=${encodeURIComponent(next)}`) }}
        secondary={{ label: "Log in", onClick: () => router.push(`/login?next=${encodeURIComponent(next)}`) }}
        tertiary={{ label: "Back home", onClick: () => router.push("/") }}
      />
    );
  }
  if (fatalError === "OUT_OF_CREDITS") {
    if (isNative) {
      return (
        <ErrorShell
          title="No trips available"
          body="You've used all of your trip credits."
          primary={{ label: "Back home", onClick: () => router.push("/") }}
        />
      );
    }
    const buyTrip = async () => {
      const returnTo = `/trip/generating?${searchParams.toString()}`;
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo }),
      });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    };
    return (
      <ErrorShell
        title="One more trip?"
        body="Each new itinerary is just $3 — pay once, get one trip with the AI chat, real flights, hotels, and activities."
        primary={{ label: "Buy 1 trip — $3", onClick: buyTrip }}
        secondary={{ label: "Back home", onClick: () => router.push("/") }}
      />
    );
  }
  if (fatalError) {
    return (
      <ErrorShell
        title="Something went wrong"
        body={fatalError}
        primary={{ label: "Try again", onClick: () => window.location.reload() }}
        secondary={{ label: "Back home", onClick: () => router.push("/") }}
      />
    );
  }

  // ── Main render — step ledger ────────────────────────────────────
  const s = status;
  const steps = s?.steps ?? [];
  const done = steps.filter((x) => x.status === "done").length;
  const pct = steps.length === 0 ? 0 : Math.round((done / steps.length) * 100);

  return (
    <main className="min-h-screen bg-cream-100 flex items-start justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <Compass className="w-12 h-12 text-terracotta-500" strokeWidth={1} />
          </motion.div>
          <h1 className="font-serif text-display text-charcoal-900 mb-1">
            Planning your trip to
          </h1>
          <h2 className="font-serif text-display-lg text-terracotta-500">
            {destination}
          </h2>
          {s && (
            <p className="mt-3 text-body-sm text-charcoal-800/50 font-sans">
              Step {Math.max(1, (s.steps.findIndex((x) => x.status === "running") + 1) || done + 1)} of {s.totalSteps} · {pct}%
            </p>
          )}
        </div>

        <div className="h-1 bg-cream-200 rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full bg-terracotta-500"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5 space-y-2">
          {steps.map((step) => (
            <StepRow key={step.key} step={step} />
          ))}
        </div>

        <Heartbeat lastTickAt={lastTickAt} />
        <LivePreview partial={s?.partial} />
      </div>
    </main>
  );
}

function StepRow({ step }: { step: StepRecord }) {
  return (
    <motion.div
      layout
      className={`flex items-center gap-3 px-2 py-1.5 rounded-lg ${
        step.status === "running" ? "bg-terracotta-500/5" : ""
      }`}
    >
      <div className="w-6 h-6 flex items-center justify-center">
        {step.status === "done" && (
          <div className="w-5 h-5 rounded-full bg-sage-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
        {step.status === "running" && (
          <Loader2 className="w-5 h-5 text-terracotta-500 animate-spin" />
        )}
        {step.status === "pending" && (
          <CircleDot className="w-5 h-5 text-charcoal-800/25" />
        )}
        {step.status === "failed" && (
          <AlertTriangle className="w-5 h-5 text-amber-500" />
        )}
      </div>
      <div className="flex-1">
        <p
          className={`font-sans text-body-sm ${
            step.status === "done"
              ? "text-charcoal-800/60"
              : step.status === "running"
              ? "text-charcoal-900 font-medium"
              : step.status === "failed"
              ? "text-amber-600"
              : "text-charcoal-800/40"
          }`}
        >
          {step.label}
          {step.status === "failed" && step.attempts > 0 && (
            <span className="ml-2 text-caption text-charcoal-800/40">
              retrying ({step.attempts})
            </span>
          )}
        </p>
        {step.status === "failed" && step.error && (
          <p className="text-caption text-amber-600/70 font-sans mt-0.5">
            {step.error.slice(0, 120)}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function Heartbeat({ lastTickAt }: { lastTickAt: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const secondsAgo = Math.max(0, Math.round((now - lastTickAt) / 1000));
  return (
    <p className="mt-3 text-center text-caption text-charcoal-800/40 font-sans">
      {secondsAgo < 2 ? "live" : `updated ${secondsAgo}s ago`}
    </p>
  );
}

function LivePreview({ partial }: { partial: StatusResponse["partial"] | undefined }) {
  if (!partial) return null;
  const hasAny =
    partial.heroImage ||
    (partial.booking && (partial.booking.hotels.length > 0 || partial.booking.flights.length > 0)) ||
    partial.dayChunks.length > 0 ||
    (partial.cityPlan && partial.cityPlan.length > 0);
  if (!hasAny) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 bg-white rounded-2xl shadow-card p-5 text-left"
    >
      <p className="text-caption uppercase tracking-wider text-charcoal-800/40 font-sans font-medium mb-3">
        Live preview
      </p>
      {partial.cityPlan && partial.cityPlan.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 text-body-sm text-charcoal-800/80 font-sans mb-1">
            <MapPin className="w-3.5 h-3.5 text-terracotta-500" />
            <span className="font-medium">Route</span>
          </div>
          <p className="text-body-sm text-charcoal-800/70 font-sans pl-5">
            {partial.cityPlan.map((c) => c.city).join(" → ")}
          </p>
        </div>
      )}
      {partial.booking?.flights?.[0] && (
        <div className="flex items-center gap-2 text-body-sm text-charcoal-800/80 font-sans mb-2">
          <Plane className="w-3.5 h-3.5 text-terracotta-500" />
          <span>
            {partial.booking.flights[0].airline}{" "}
            {partial.booking.flights[0].originAirport ?? ""} →{" "}
            {partial.booking.flights[0].destinationAirport ?? ""}
          </span>
        </div>
      )}
      {partial.booking?.hotels?.[0] && (
        <div className="flex items-center gap-2 text-body-sm text-charcoal-800/80 font-sans mb-2">
          <Hotel className="w-3.5 h-3.5 text-terracotta-500" />
          <span>{partial.booking.hotels[0].name}</span>
        </div>
      )}
      {partial.dayChunks.length > 0 && (
        <p className="text-caption text-charcoal-800/50 font-sans mt-2">
          {partial.dayChunks.reduce((n, c) => n + c.days.length, 0)} days drafted so far
        </p>
      )}
    </motion.div>
  );
}

function ErrorShell({
  title,
  body,
  primary,
  secondary,
  tertiary,
}: {
  title: string;
  body: string;
  primary?: { label: string; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
  tertiary?: { label: string; onClick: () => void };
}) {
  return (
    <main className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-terracotta-500/10 rounded-full mb-6">
          <Compass className="w-8 h-8 text-terracotta-500" />
        </div>
        <h1 className="font-serif text-display text-charcoal-900 mb-3">{title}</h1>
        <p className="font-sans text-body text-charcoal-800/70 mb-8 max-w-sm mx-auto">{body}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          {primary && (
            <button
              onClick={primary.onClick}
              className="px-6 py-3 bg-terracotta-500 text-white rounded-xl font-sans font-medium hover:bg-terracotta-600 transition-colors"
            >
              {primary.label}
            </button>
          )}
          {secondary && (
            <button
              onClick={secondary.onClick}
              className="px-6 py-3 border border-cream-300 text-charcoal-800 rounded-xl font-sans font-medium hover:bg-cream-100 transition-colors"
            >
              {secondary.label}
            </button>
          )}
          {tertiary && (
            <button
              onClick={tertiary.onClick}
              className="px-6 py-3 text-charcoal-800/60 rounded-xl font-sans font-medium hover:text-charcoal-900 transition-colors"
            >
              {tertiary.label}
            </button>
          )}
        </div>
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
