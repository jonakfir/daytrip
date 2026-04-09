"use client";

import { motion } from "framer-motion";
import { Sunrise, Sun, Moon, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DayPlan, Activity } from "@/types/itinerary";
import ActivityCard from "./ActivityCard";

type TimeBlockKey = "morning" | "afternoon" | "evening";

interface DaySectionProps {
  day: DayPlan;
  isLast: boolean;
  destination?: string;
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
      <section className="mb-16">
        {/* Day Header */}
        <div className="mb-8">
          <p className="font-sans text-caption uppercase tracking-[0.2em] text-terracotta-500 mb-1">
            {formatDate(day.date)}
          </p>
          <h2 className="font-serif text-display text-charcoal-900">
            Day {day.dayNumber}
          </h2>
          {day.title && (
            <p className="font-sans text-body-lg text-charcoal-800/60 mt-1">
              {day.title}
            </p>
          )}
          <div className="w-16 h-0.5 bg-terracotta-500/40 mt-4" />
        </div>

        {/* Time Blocks */}
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
      </section>
    </motion.div>
  );
}
