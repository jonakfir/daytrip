"use client";

import Link from "next/link";
import {
  Share2,
  Heart,
  Calendar,
  Users,
  Sparkles,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TripHeroProps {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  travelStyle: string;
  heroImage?: string;
  onShare?: () => void;
}

/** Inclusive day count — Oct 1 → Oct 4 = 4 days, not 3. Parses as local dates. */
function computeDuration(start: string, end: string): number {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const startDate = new Date(sy, (sm ?? 1) - 1, sd ?? 1);
  const endDate = new Date(ey, (em ?? 1) - 1, ed ?? 1);
  const ms = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}

/** Format as "Oct 1, 2026" parsing as local date to avoid TZ drift. */
function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TripHero({
  destination,
  startDate,
  endDate,
  travelers,
  travelStyle,
  heroImage,
  onShare,
}: TripHeroProps) {
  const [isSaved, setIsSaved] = useState(false);

  const duration = computeDuration(startDate, endDate);

  return (
    <section
      className={cn(
        "relative w-full min-h-[50vh] flex items-end overflow-hidden"
      )}
    >
      {/* Background */}
      {heroImage ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/90 via-charcoal-900/50 to-charcoal-900/30" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal-900 via-charcoal-900/95 to-terracotta-500" />
      )}

      {/* Top nav — back to home to plan a new trip */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-white font-sans text-caption font-medium hover:bg-white/25 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New trip
        </Link>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-12 pt-32">
        <p className="text-cream-200 font-sans text-body-sm uppercase tracking-[0.2em] mb-4">
          Your Itinerary
        </p>
        <h1 className="font-serif text-display-lg md:text-display-xl text-white mb-6 max-w-3xl">
          Your {duration} Days in {destination}
        </h1>

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-8">
          <div className="flex items-center gap-2 text-cream-200 font-sans text-body-sm">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDate(startDate)} — {formatDate(endDate)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-cream-200 font-sans text-body-sm">
            <Users className="w-4 h-4" />
            <span>
              {travelers} {travelers === 1 ? "Traveler" : "Travelers"}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-cream-100 font-sans text-caption">
            <Sparkles className="w-3.5 h-3.5" />
            {travelStyle}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onShare}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-sm text-white font-sans text-body-sm hover:bg-white/25 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-sans text-body-sm transition-colors",
              isSaved
                ? "bg-terracotta-500 text-white"
                : "bg-white/15 backdrop-blur-sm text-white hover:bg-white/25"
            )}
          >
            <Heart className={cn("w-4 h-4", isSaved && "fill-current")} />
            {isSaved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </section>
  );
}
