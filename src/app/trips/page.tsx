"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Loader2, Plus } from "lucide-react";

interface Trip {
  shareId: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  travelers: number | null;
  travelStyle: string | null;
  budget: string | null;
  days: number | null;
  createdAt: string;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "unauthenticated" }
  | { kind: "loaded"; trips: Trip[] }
  | { kind: "error"; message: string };

export default function MyTripsPage() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/me/trips", { credentials: "include" });
        if (cancelled) return;
        if (r.status === 401) {
          setState({ kind: "unauthenticated" });
          return;
        }
        if (!r.ok) {
          setState({ kind: "error", message: `Request failed (${r.status})` });
          return;
        }
        const data = await r.json();
        setState({ kind: "loaded", trips: data.trips ?? [] });
      } catch (err) {
        if (cancelled) return;
        setState({
          kind: "error",
          message:
            err instanceof Error ? err.message : "Could not load your trips",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-cream-100">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream-100/90 backdrop-blur-sm border-b border-cream-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-2xl text-terracotta-500 font-semibold"
          >
            Daytrip
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/destinations"
              className="hidden sm:block text-body-sm text-charcoal-800/70 hover:text-charcoal-900 transition-colors"
            >
              Destinations
            </Link>
            <Link
              href="/account"
              className="hidden sm:block text-body-sm text-charcoal-800/70 hover:text-charcoal-900 transition-colors"
            >
              Account
            </Link>
            <Link
              href="/"
              className="rounded-full bg-terracotta-500 px-5 py-2 text-body-sm font-medium text-white transition-colors hover:bg-terracotta-600"
            >
              Plan a trip
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-6 pt-32 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="font-sans text-caption uppercase tracking-[0.2em] text-terracotta-500 mb-4">
            My library
          </p>
          <h1 className="font-serif text-display-lg text-charcoal-900 mb-6">
            Your trips
          </h1>
          <p className="font-sans text-body-lg text-charcoal-800/70 max-w-2xl">
            Every itinerary you've planned with Daytrip, in one place. Click any
            trip to view the full day-by-day plan.
          </p>
        </motion.div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        {state.kind === "loading" && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-terracotta-500" />
          </div>
        )}

        {state.kind === "unauthenticated" && (
          <EmptyState
            title="Sign in to see your trips"
            body="Your library is private to your account. Log in or create one to start saving trips here."
            cta={{ label: "Log in", href: "/login" }}
            secondary={{ label: "Sign up free", href: "/signup" }}
          />
        )}

        {state.kind === "error" && (
          <EmptyState
            title="Something went wrong"
            body={state.message}
            cta={{ label: "Try again", href: "/trips" }}
          />
        )}

        {state.kind === "loaded" && state.trips.length === 0 && (
          <EmptyState
            title="No trips yet"
            body="When you generate an itinerary, it'll appear here. Pick a destination and start planning."
            cta={{ label: "Plan your first trip", href: "/" }}
            secondary={{ label: "Browse destinations", href: "/destinations" }}
          />
        )}

        {state.kind === "loaded" && state.trips.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.trips.map((trip) => (
              <Link
                key={trip.shareId}
                href={`/trip/${trip.shareId}`}
                className="group block rounded-2xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <div className="h-32 bg-gradient-to-br from-terracotta-500 to-terracotta-700 p-5 flex items-end">
                  <div>
                    <p className="font-sans text-caption uppercase tracking-[0.15em] text-white/70">
                      {formatDateRange(trip.startDate, trip.endDate, trip.days)}
                    </p>
                    <h3 className="font-serif text-heading text-white">
                      {trip.destination}
                    </h3>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  {trip.travelers && (
                    <div className="flex items-center gap-2 text-body-sm text-charcoal-800/70">
                      <Users className="w-4 h-4" />
                      {trip.travelers}{" "}
                      {trip.travelers === 1 ? "traveler" : "travelers"}
                    </div>
                  )}
                  {trip.budget && (
                    <div className="flex items-center gap-2 text-body-sm text-charcoal-800/70">
                      <MapPin className="w-4 h-4" />
                      {trip.budget}
                    </div>
                  )}
                  {trip.travelStyle && (
                    <div className="flex items-center gap-2 text-body-sm text-charcoal-800/70">
                      <Calendar className="w-4 h-4" />
                      {trip.travelStyle}
                    </div>
                  )}
                  <p className="font-sans text-caption text-charcoal-800/40 pt-2 border-t border-cream-200">
                    Saved {formatRelative(trip.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
            <Link
              href="/"
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-cream-300 bg-cream-50/50 p-8 text-charcoal-800/40 hover:bg-cream-50 hover:border-terracotta-500/30 hover:text-terracotta-500 transition-all min-h-[260px]"
            >
              <div className="w-12 h-12 rounded-full bg-cream-200 flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-sans text-body-sm font-medium">
                Plan another trip
              </span>
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

function formatDateRange(
  start: string | null,
  end: string | null,
  days: number | null
): string {
  if (start && end) {
    const s = new Date(start);
    const e = new Date(end);
    const sM = s.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const eM = e.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${sM} – ${eM}`;
  }
  if (days) return `${days} days`;
  return "Trip";
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const minute = 60_000;
  const hour = 3_600_000;
  const day = 86_400_000;
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < day * 7) return `${Math.floor(diff / day)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function EmptyState({
  title,
  body,
  cta,
  secondary,
}: {
  title: string;
  body: string;
  cta: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <div className="text-center py-20 max-w-md mx-auto">
      <h2 className="font-serif text-heading-xl text-charcoal-900 mb-4">
        {title}
      </h2>
      <p className="font-sans text-body text-charcoal-800/70 mb-8">{body}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={cta.href}
          className="inline-block rounded-full bg-terracotta-500 px-8 py-3 font-sans text-body-sm font-medium text-white hover:bg-terracotta-600 transition-colors"
        >
          {cta.label}
        </Link>
        {secondary && (
          <Link
            href={secondary.href}
            className="inline-block rounded-full bg-white border border-charcoal-900/10 px-8 py-3 font-sans text-body-sm font-medium text-charcoal-800 hover:border-charcoal-900/30 transition-colors"
          >
            {secondary.label}
          </Link>
        )}
      </div>
    </div>
  );
}
