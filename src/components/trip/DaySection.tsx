"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Sunrise,
  Sun,
  Moon,
  Lightbulb,
  ChevronDown,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DayPlan, Activity } from "@/types/itinerary";
import ActivityCard from "./ActivityCard";

type TimeBlockKey = "morning" | "afternoon" | "evening";

interface DaySectionProps {
  day: DayPlan;
  isLast: boolean;
  destination?: string;
  /** Day's city + country, if the trip is multi-city. Renders under
   *  the day header as a small subheader, e.g. "Prague · Czech Republic". */
  cityLabel?: { city: string; country: string } | null;
  /** Is this day's content currently expanded? Controlled by parent
   *  (TripPageClient) so the top-level "Expand all / Collapse all"
   *  toggle can flip every day at once. Defaults to true. */
  expanded?: boolean;
  /** Called when the user clicks the day header to toggle this day
   *  individually. */
  onToggle?: () => void;
  onActivityChange?: (
    block: TimeBlockKey,
    activityIndex: number,
    newActivity: Activity
  ) => void;
}

function TimeBlock({
  label,
  icon: Icon,
  activities,
  iconColor,
  blockKey,
  destination,
  onActivityChange,
}: {
  label: string;
  icon: typeof Sunrise;
  activities: Activity[];
  iconColor: string;
  blockKey: TimeBlockKey;
  destination?: string;
  onActivityChange?: (
    block: TimeBlockKey,
    activityIndex: number,
    newActivity: Activity
  ) => void;
}) {
  if (activities.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2.5 mb-4">
        <Icon className={cn("w-5 h-5", iconColor)} />
        <h3 className="font-sans text-body-sm font-medium uppercase tracking-[0.15em] text-charcoal-800/60">
          {label}
        </h3>
      </div>
      <div className="flex flex-col gap-3 ml-1">
        {activities.map((activity, idx) => (
          <ActivityCard
            key={`${blockKey}-${activity.time}-${idx}`}
            activity={activity}
            destination={destination}
            timeBlock={blockKey}
            onActivityChange={(newActivity) =>
              onActivityChange?.(blockKey, idx, newActivity)
            }
          />
        ))}
      </div>
    </div>
  );
}

export default function DaySection({
  day,
  isLast,
  destination,
  cityLabel,
  expanded = true,
  onToggle,
  onActivityChange,
}: DaySectionProps) {
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <section className="mb-16" data-day-number={day.dayNumber}>
        {/* Day Header — clickable to toggle */}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "w-full text-left mb-6 group",
            onToggle ? "cursor-pointer" : "cursor-default"
          )}
          aria-expanded={expanded}
          aria-label={`Toggle day ${day.dayNumber}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-sans text-caption uppercase tracking-[0.2em] text-terracotta-500 mb-1">
                {formatDate(day.date)}
              </p>
              <h2 className="font-serif text-display text-charcoal-900">
                Day {day.dayNumber}
              </h2>
              {cityLabel && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <MapPin className="w-3.5 h-3.5 text-terracotta-500 shrink-0" />
                  <p className="font-sans text-body-sm text-charcoal-800/70">
                    <span className="font-medium">{cityLabel.city}</span>
                    <span className="text-charcoal-800/40"> · {cityLabel.country}</span>
                  </p>
                </div>
              )}
              {day.title && (
                <p className="font-sans text-body-lg text-charcoal-800/60 mt-1">
                  {day.title}
                </p>
              )}
              <div className="w-16 h-0.5 bg-terracotta-500/40 mt-4" />
            </div>
            {onToggle && (
              <motion.div
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0 mt-3 text-charcoal-800/40 group-hover:text-terracotta-500 transition-colors"
              >
                <ChevronDown className="w-6 h-6" />
              </motion.div>
            )}
          </div>
        </button>

        {/* Expandable body */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <TimeBlock
                label="Morning"
                icon={Sunrise}
                activities={day.morning}
                iconColor="text-amber-500"
                blockKey="morning"
                destination={destination}
                onActivityChange={onActivityChange}
              />
              <TimeBlock
                label="Afternoon"
                icon={Sun}
                activities={day.afternoon}
                iconColor="text-terracotta-400"
                blockKey="afternoon"
                destination={destination}
                onActivityChange={onActivityChange}
              />
              <TimeBlock
                label="Evening"
                icon={Moon}
                activities={day.evening}
                iconColor="text-sage-600"
                blockKey="evening"
                destination={destination}
                onActivityChange={onActivityChange}
              />

              {/* Divider with Tip */}
              {!isLast && (
                <div className="mt-12 pt-8 border-t border-cream-200">
                  {day.tip && (
                    <div className="flex items-start gap-3 bg-cream-100 rounded-xl p-4">
                      <Lightbulb className="w-5 h-5 text-terracotta-400 shrink-0 mt-0.5" />
                      <p className="font-sans text-body-sm text-charcoal-800/70 italic">
                        {day.tip}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </motion.div>
  );
}
