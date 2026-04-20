"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MOCK_TOKYO_ITINERARY } from "@/lib/mock-data";
import type { Itinerary } from "@/types/itinerary";
import TripPageClient from "./TripPageClient";

type LoadState =
  | { status: "loading" }
  | { status: "ok"; itinerary: Itinerary }
  | { status: "not-found" };

/**
 * Best-effort log of the loaded itinerary to the user's library
 * (POST /api/me/trips/log). Silent on auth/db errors — the trip view
 * still works for anonymous users.
 */
async function logTripToLibrary(itinerary: Itinerary): Promise<void> {
  try {
    await fetch("/api/me/trips/log", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shareId: itinerary.shareId,
        destination: itinerary.destination,
        startDate: itinerary.startDate,
        endDate: itinerary.endDate,
        travelers: itinerary.travelers,
        travelStyle: itinerary.travelStyle,
        budget: itinerary.budget,
        days: itinerary.days?.length,
      }),
    });
  } catch {
    // ignore — best-effort logging
  }
}

export default function TripPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  // Seed the demo itinerary synchronously so SSR + first paint include
  // the trip's heading + content. Avoids a bare "Loading…" screen for
  // the canonical shared demo URL.
  const [state, setState] = useState<LoadState>(() => {
    if (id === "demo" || id === "tokyo-demo-5d") {
      return { status: "ok", itinerary: MOCK_TOKYO_ITINERARY };
    }
    return { status: "loading" };
  });
  const loggedRef = useRef<string | null>(null);

  // When the itinerary is loaded for the first time, log it to the user's
  // trip library. We track which shareId we've already logged so the call
  // doesn't fire again on re-renders.
  useEffect(() => {
    if (state.status === "ok" && loggedRef.current !== state.itinerary.shareId) {
      loggedRef.current = state.itinerary.shareId;
      void logTripToLibrary(state.itinerary);
    }
  }, [state]);

  // Keep the browser tab in sync with the loaded itinerary. The layout's
  // generateMetadata handles the SSR/demo case; this updates the title for
  // non-demo shares whose data is only available client-side. Format kept
  // in lockstep with layout.tsx so hydration doesn't flip the tab text.
  useEffect(() => {
    if (state.status !== "ok") return;
    const it = state.itinerary;
    const days = it.days?.length ?? 0;
    const prefix = days > 0 ? `Your ${days}-day ${it.destination} itinerary` : `Your ${it.destination} itinerary`;
    document.title = `${prefix} | Daytrip`;
  }, [state]);

  useEffect(() => {
    if (!id) {
      setState({ status: "not-found" });
      return;
    }

    // Hardcoded demo itinerary always resolves.
    if (id === "demo" || id === "tokyo-demo-5d") {
      setState({ status: "ok", itinerary: MOCK_TOKYO_ITINERARY });
      return;
    }

    // Primary source: sessionStorage hand-off from /trip/generating.
    try {
      const cached = sessionStorage.getItem(`daytrip:itinerary:${id}`);
      if (cached) {
        setState({ status: "ok", itinerary: JSON.parse(cached) as Itinerary });
        return;
      }
    } catch {
      // ignore parse errors
    }

    // Fallback: try the /api/share endpoint (works if Supabase/Postgres is attached).
    let cancelled = false;
    fetch(`/api/share/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.itinerary) {
          setState({ status: "ok", itinerary: data.itinerary as Itinerary });
        } else {
          setState({ status: "not-found" });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "not-found" });
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.status === "loading") {
    return (
      <main className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-sans text-body-sm text-charcoal-800/50">
            Loading your trip…
          </p>
        </div>
      </main>
    );
  }

  if (state.status === "not-found") {
    return (
      <main className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="font-serif text-display text-charcoal-900 mb-4">
            Trip not found
          </h1>
          <p className="font-sans text-body text-charcoal-800/60 mb-8">
            This itinerary has expired or never existed. Generate a fresh one
            to get started.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/"
              className="rounded-full bg-terracotta-500 px-5 py-2.5 font-sans text-body-sm font-medium text-white hover:bg-terracotta-600"
            >
              Plan a new trip
            </Link>
            <Link
              href="/trip/demo"
              className="rounded-full border border-charcoal-800/20 px-5 py-2.5 font-sans text-body-sm font-medium text-charcoal-900 hover:bg-cream-200"
            >
              See a demo
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <TripPageClient itinerary={state.itinerary} />;
}
