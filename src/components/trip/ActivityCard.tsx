"use client";

import {
  UtensilsCrossed,
  Landmark,
  ShoppingBag,
  TreePine,
  Music,
  Car,
  Clock,
  ExternalLink,
} from "lucide-react";
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
    bgAccent: "bg-terracotta-50",
  },
  culture: {
    icon: Landmark,
    color: "text-blue-600",
    borderColor: "border-blue-600",
    bgAccent: "bg-blue-50",
  },
  shopping: {
    icon: ShoppingBag,
    color: "text-amber-600",
    borderColor: "border-amber-600",
    bgAccent: "bg-amber-50",
  },
  nature: {
    icon: TreePine,
    color: "text-sage-600",
    borderColor: "border-sage-600",
    bgAccent: "bg-sage-50",
  },
  entertainment: {
    icon: Music,
    color: "text-purple-500",
    borderColor: "border-purple-500",
    bgAccent: "bg-purple-50",
  },
  transport: {
    icon: Car,
    color: "text-gray-500",
    borderColor: "border-gray-400",
    bgAccent: "bg-gray-50",
  },
};

interface ActivityCardProps {
  activity: Activity;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const config = categoryConfig[activity.category];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "group relative flex gap-4 p-4 rounded-xl bg-white border border-cream-200",
        "shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300",
        "border-l-4",
        config.borderColor
      )}
    >
      {/* Time Badge */}
      <div className="shrink-0 flex flex-col items-center pt-0.5">
        <span className={cn(
          "text-caption font-sans font-medium text-charcoal-800 px-2.5 py-1 rounded-full",
          config.bgAccent
        )}>
          {activity.time}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <Icon className={cn("w-4 h-4 mt-1 shrink-0", config.color)} />
          <h4 className="font-serif text-heading-lg text-charcoal-900 leading-tight">
            {activity.name}
          </h4>
        </div>

        <p className="text-body-sm font-sans text-charcoal-800/70 line-clamp-2 mt-1 ml-6">
          {activity.description}
        </p>

        <div className="flex items-center gap-3 mt-3 ml-6">
          <span className="inline-flex items-center gap-1 text-caption font-sans text-charcoal-800/50">
            <Clock className="w-3.5 h-3.5" />
            {activity.duration}
          </span>

          {activity.bookingUrl && (
            <a
              href={activity.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-terracotta-500 text-white text-caption font-sans font-medium hover:bg-terracotta-600 transition-colors"
            >
              {activity.bookingPrice && (
                <span>{activity.bookingPrice}</span>
              )}
              <span>Book now</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
