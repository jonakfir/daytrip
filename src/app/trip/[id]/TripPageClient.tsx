"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronsDown, ChevronsUp } from "lucide-react";
import type { Activity, Itinerary } from "@/types/itinerary";
import TripHero from "@/components/trip/TripHero";
import DaySection from "@/components/trip/DaySection";
import Sidebar from "@/components/trip/Sidebar";
import SharePanel from "@/components/trip/SharePanel";
import ChatPanel from "@/components/trip/ChatPanel";
import { cityForDay, isMultiCity } from "@/lib/itinerary-helpers";

interface Props {
  itinerary: Itinerary;
}

type TimeBlockKey = "morning" | "afternoon" | "evening";

export default function TripPageClient({ itinerary: initialItinerary }: Props) {
  const [itinerary, setItinerary] = useState<Itinerary>(initialItinerary);
  const [shareOpen, setShareOpen] = useState(false);

  // Per-day expand/collapse state. Seeded expanded for every day so
  // the trip reads normally on first load. The top-level "Expand all
  // / Collapse all" button and individual day headers flip entries.
  const [expandedDays, setExpandedDays] = useState<Set<number>>(() => {
    const init = new Set<number>();
    (initialItinerary.days ?? []).forEach((d) => init.add(d.dayNumber));
    return init;
  });
  const toggleDay = useCallback((dayNumber: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayNumber)) next.delete(dayNumber);
      else next.add(dayNumber);
      return next;
    });
  }, []);
  const allExpanded = useMemo(() => {
    const days = itinerary.days ?? [];
    return days.length > 0 && days.every((d) => expandedDays.has(d.dayNumber));
  }, [itinerary.days, expandedDays]);
  const toggleAll = useCallback(() => {
    const days = itinerary.days ?? [];
    if (allExpanded) {
      setExpandedDays(new Set());
    } else {
      setExpandedDays(new Set(days.map((d) => d.dayNumber)));
    }
  }, [allExpanded, itinerary.days]);

  const showCityLabels = isMultiCity(itinerary);

  // Keep sessionStorage in sync so reloads get the updated version
  useEffect(() => {
    if (!itinerary?.shareId) return;
    try {
      sessionStorage.setItem(
        `daytrip:itinerary:${itinerary.shareId}`,
        JSON.stringify(itinerary)
      );
    } catch {
      // ignore quota
    }
  }, [itinerary]);

  const handleActivityChange = useCallback(
    (
      dayIndex: number,
      block: TimeBlockKey,
      activityIndex: number,
      newActivity: Activity
    ) => {
      setItinerary((prev) => {
        const nextDays = prev.days.map((day, di) => {
          if (di !== dayIndex) return day;
          const nextBlock = [...day[block]];
          nextBlock[activityIndex] = newActivity;
          return { ...day, [block]: nextBlock };
        });
        return { ...prev, days: nextDays };
      });
    },
    []
  );

  const dayCount = itinerary.days?.length || 0;
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/trip/${itinerary.shareId}`
      : `/trip/${itinerary.shareId}`;

  return (
    <main className="min-h-screen bg-cream-100">
      <TripHero
        destination={itinerary.destination}
        startDate={itinerary.startDate}
        endDate={itinerary.endDate}
        travelers={itinerary.travelers}
        travelStyle={itinerary.travelStyle}
        heroImage={itinerary.heroImage}
        onShare={() => setShareOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-3 lg:gap-12">
          {/* Main content — day-by-day itinerary */}
          <div className="lg:col-span-2 space-y-0">
            {/* Travel tips banner */}
            {itinerary.tips && itinerary.tips.length > 0 && (
              <div className="mb-10 p-6 bg-sage-500/10 rounded-2xl border border-sage-300/30">
                <h3 className="font-serif text-heading text-sage-700 mb-3">
                  Travel Tips
                </h3>
                <ul className="space-y-2">
                  {itinerary.tips.map((tip, i) => (
                    <li
                      key={i}
                      className="text-body-sm text-charcoal-800/80 flex items-start gap-2"
                    >
                      <span className="text-sage-500 mt-1">&#9670;</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Expand / collapse all toggle — only when there's more
                than one day, otherwise the toggle isn't meaningful. */}
            {(itinerary.days?.length ?? 0) > 1 && (
              <div className="mb-6 flex justify-end">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cream-300 text-charcoal-800 font-sans text-body-sm hover:border-terracotta-500 hover:text-terracotta-600 transition-colors"
                  aria-label={allExpanded ? "Collapse all days" : "Expand all days"}
                >
                  {allExpanded ? (
                    <>
                      <ChevronsUp className="w-4 h-4" /> Collapse all
                    </>
                  ) : (
                    <>
                      <ChevronsDown className="w-4 h-4" /> Expand all
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Day sections */}
            {itinerary.days?.map((day, index) => {
              const city = showCityLabels
                ? cityForDay(itinerary, day.dayNumber)
                : null;
              return (
                <DaySection
                  key={`${day.dayNumber}-${day.date}`}
                  day={day}
                  isLast={index === itinerary.days.length - 1}
                  destination={itinerary.destination}
                  cityLabel={city}
                  expanded={expandedDays.has(day.dayNumber)}
                  onToggle={() => toggleDay(day.dayNumber)}
                  onActivityChange={(block, activityIndex, newActivity) =>
                    handleActivityChange(index, block, activityIndex, newActivity)
                  }
                />
              );
            })}

            {/* End of itinerary */}
            <div className="text-center py-16">
              <p className="font-serif text-heading-lg text-charcoal-800/40 italic">
                Bon voyage.
              </p>
            </div>
          </div>

          {/* Sidebar — bookings */}
          <div className="lg:col-span-1 mt-10 lg:mt-0">
            <Sidebar
              flights={itinerary.flights || []}
              hotels={itinerary.hotels || []}
              hotelsByCity={itinerary.hotelsByCity}
              tours={itinerary.tours || []}
            />
          </div>
        </div>
      </div>

      <SharePanel
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        shareUrl={shareUrl}
        destination={itinerary.destination}
        duration={dayCount}
        itinerary={itinerary}
      />

      {/* Floating Claude chat for refining the itinerary */}
      <ChatPanel
        itinerary={itinerary}
        onItineraryUpdate={(next) => setItinerary(next)}
      />
    </main>
  );
}
