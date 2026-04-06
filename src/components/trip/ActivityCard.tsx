"use client";

import { useState } from "react";
import {
  UtensilsCrossed,
  Landmark,
  ShoppingBag,
  TreePine,
  Music,
  Car,
  Clock,
  ExternalLink,
  RefreshCw,
  MapPin,
  Star,
  Footprints,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Activity } from "@/types/itinerary";

const categoryConfig: Record<
  Activity["category"],
  { icon: typeof UtensilsCrossed; color: string; borderColor: string; bgAccent: string }
> = {
  food: {
    icon: UtensilsCrossed,
    color: "text-terracotta-500",
    borderColor: "border-terracotta-500",
    bgAccent: "bg-terracotta-500/10",
  },
  culture: {
    icon: Landmark,
    color: "text-blue-600",
    borderColor: "border-blue-600",
    bgAccent: "bg-blue-600/10",
  },
  shopping: {
    icon: ShoppingBag,
    color: "text-amber-600",
    borderColor: "border-amber-600",
    bgAccent: "bg-amber-600/10",
  },
  nature: {
    icon: TreePine,
    color: "text-sage-600",
    borderColor: "border-sage-600",
    bgAccent: "bg-sage-600/10",
  },
  entertainment: {
    icon: Music,
    color: "text-purple-500",
    borderColor: "border-purple-500",
    bgAccent: "bg-purple-500/10",
  },
  transport: {
    icon: Car,
    color: "text-gray-500",
    borderColor: "border-gray-400",
    bgAccent: "bg-gray-500/10",
  },
};

interface ActivityCardProps {
  activity: Activity;
  onActivityChange?: (newActivity: Activity) => void;
}

export default function ActivityCard({ activity, onActivityChange }: ActivityCardProps) {
  const [currentActivity, setCurrentActivity] = useState(activity);
  const [alternativeIndex, setAlternativeIndex] = useState(-1);
  const [isSwapping, setIsSwapping] = useState(false);

  const config = categoryConfig[currentActivity.category];
  const Icon = config.icon;
  const hasAlternatives = activity.alternatives && activity.alternatives.length > 0;

  const handleChange = () => {
    if (!activity.alternatives || activity.alternatives.length === 0) return;

    setIsSwapping(true);
    const nextIndex = (alternativeIndex + 1) % activity.alternatives.length;

    setTimeout(() => {
      const nextActivity = activity.alternatives![nextIndex];
      setCurrentActivity({
        ...nextActivity,
        time: activity.time,
        alternatives: activity.alternatives,
      });
      setAlternativeIndex(nextIndex);
      onActivityChange?.({
        ...nextActivity,
        time: activity.time,
        alternatives: activity.alternatives,
      });
      setIsSwapping(false);
    }, 200);
  };

  const currentConfig = categoryConfig[currentActivity.category];
  const CurrentIcon = currentConfig.icon;

  return (
    <>
      {/* Distance indicator from previous activity */}
      {currentActivity.distanceFromPrevious && (
        <div className="flex items-center gap-2 ml-14 -mt-1 mb-1">
          <div className="flex items-center gap-1.5 text-caption text-charcoal-800/40 font-sans">
            <Footprints className="w-3 h-3" />
            <span>{currentActivity.distanceFromPrevious}</span>
            {currentActivity.walkingTime && (
              <>
                <span className="mx-0.5">·</span>
                <span>{currentActivity.walkingTime} walk</span>
              </>
            )}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentActivity.name}
          initial={isSwapping ? { opacity: 0, x: 20 } : false}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "group relative flex gap-4 p-4 rounded-xl bg-white border border-cream-200",
            "shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300",
            "border-l-4",
            currentConfig.borderColor
          )}
        >
          {/* Time Badge */}
          <div className="shrink-0 flex flex-col items-center pt-0.5">
            <span
              className={cn(
                "text-caption font-sans font-medium text-charcoal-800 px-2.5 py-1 rounded-full",
                currentConfig.bgAccent
              )}
            >
              {currentActivity.time}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              <CurrentIcon className={cn("w-4 h-4 mt-1 shrink-0", currentConfig.color)} />
              <h4 className="font-serif text-heading-lg text-charcoal-900 leading-tight">
                {currentActivity.name}
              </h4>
            </div>

            <p className="text-body-sm font-sans text-charcoal-800/70 line-clamp-2 mt-1 ml-6">
              {currentActivity.description}
            </p>

            {/* Rating & popularity */}
            {(currentActivity.rating || currentActivity.reviewCount) && (
              <div className="flex items-center gap-3 mt-2 ml-6">
                {currentActivity.rating && (
                  <span className="inline-flex items-center gap-1 text-caption font-sans font-medium text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {currentActivity.rating.toFixed(1)}
                  </span>
                )}
                {currentActivity.reviewCount && (
                  <span className="text-caption font-sans text-charcoal-800/40">
                    {currentActivity.reviewCount.toLocaleString()} reviews
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mt-3 ml-6">
              <span className="inline-flex items-center gap-1 text-caption font-sans text-charcoal-800/50">
                <Clock className="w-3.5 h-3.5" />
                {currentActivity.duration}
              </span>

              {currentActivity.bookingUrl && (
                <a
                  href={currentActivity.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-terracotta-500 text-white text-caption font-sans font-medium hover:bg-terracotta-600 transition-colors"
                >
                  {currentActivity.bookingPrice && (
                    <span>{currentActivity.bookingPrice}</span>
                  )}
                  <span>Book now</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Change button */}
          {hasAlternatives && (
            <div className="shrink-0 self-center">
              <button
                onClick={handleChange}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                  "text-caption font-sans font-medium",
                  "border border-cream-300 text-charcoal-800/60",
                  "hover:border-terracotta-500 hover:text-terracotta-500 hover:bg-terracotta-500/5",
                  "transition-all duration-200"
                )}
                title="Swap for an alternative activity"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isSwapping && "animate-spin")} />
                Change
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
