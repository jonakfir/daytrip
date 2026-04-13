"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Users, Plus, Sparkles, Plane, Wallet, X } from "lucide-react";
import { cn } from "@/lib/utils";
import PlaceInput from "@/components/search/PlaceInput";
import { extractIataFromLabel, getAirportByIATA } from "@/lib/airports";
import { hapticTap } from "@/lib/capacitor";

interface SearchParams {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  style: string;
  originCity: string;
  /** IATA code if the user picked an airport for origin (e.g. "JFK"). */
  originAirport?: string;
  /** IATA code if the user picked an airport for the primary destination. */
  destinationAirport?: string;
  /** Budget per person per day in USD, or null for "no preference". */
  budgetPerDay: number | null;
}

/** If the label looks like "JFK · ...", strip the airport code and return
 *  the bare city name along with the IATA code. Otherwise return the label
 *  unchanged with a null IATA. */
function resolveAirportLabel(label: string): {
  cityText: string;
  iata: string | null;
} {
  const trimmed = label.trim();
  const iata = extractIataFromLabel(trimmed);
  if (!iata) return { cityText: trimmed, iata: null };
  const airport = getAirportByIATA(iata);
  if (!airport) return { cityText: trimmed, iata };
  // Collapse to "<City>, <Country>" so the rest of the app treats it as
  // a normal destination and Skyscanner gets the explicit airport code.
  return { cityText: `${airport.city}, ${airport.country}`, iata };
}

interface Props {
  onSearch: (params: SearchParams) => void;
  onDestinationChange?: (destination: string) => void;
}

const PLACEHOLDER_DESTINATIONS = [
  "Tokyo, Japan",
  "Paris, France",
  "Bali, Indonesia",
  "Marrakech, Morocco",
  "Lisbon, Portugal",
  "Barcelona, Spain",
];

const POPULAR_DESTINATIONS = [
  "Tokyo, Japan",
  "Paris, France",
  "Bali, Indonesia",
  "Amalfi Coast, Italy",
  "Marrakech, Morocco",
];

// Destination autocomplete now uses Photon (Komoot's free OSM geocoder)
// via the PlaceInput component — no hardcoded list needed.

const STYLES = ["Adventure", "Cultural", "Relaxation", "Foodie", "Luxury"];

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function DestinationSearch({
  onSearch,
  onDestinationChange,
}: Props) {
  // Multi-city support — array of destinations, first is required
  const [destinations, setDestinations] = useState<string[]>([""]);
  const [originCity, setOriginCity] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(todayPlus(14));
  const [endDate, setEndDate] = useState<string>(todayPlus(19));
  const [travelers, setTravelers] = useState<number>(2);
  const [style, setStyle] = useState<string>("Cultural");
  // Budget per person per day in USD. Defaults to $150 (moderate).
  const [budgetPerDay, setBudgetPerDay] = useState<number>(150);

  // Typewriter placeholder
  const [placeholderText, setPlaceholderText] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  // Typewriter effect — animates the PLACEHOLDER attribute only.
  useEffect(() => {
    const currentDest = PLACEHOLDER_DESTINATIONS[placeholderIndex];
    const speed = isTyping ? 80 : 40;

    const timer = setTimeout(() => {
      if (isTyping) {
        if (charIndex < currentDest.length) {
          setPlaceholderText(currentDest.slice(0, charIndex + 1));
          setCharIndex((c) => c + 1);
        } else {
          setTimeout(() => setIsTyping(false), 1500);
        }
      } else {
        if (charIndex > 0) {
          setPlaceholderText(currentDest.slice(0, charIndex - 1));
          setCharIndex((c) => c - 1);
        } else {
          setIsTyping(true);
          setPlaceholderIndex(
            (i) => (i + 1) % PLACEHOLDER_DESTINATIONS.length
          );
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [charIndex, isTyping, placeholderIndex]);

  // Notify parent of primary destination changes (for landscape morph)
  useEffect(() => {
    onDestinationChange?.(destinations[0] || "");
  }, [destinations, onDestinationChange]);

  const setDestinationAt = (idx: number, value: string) => {
    setDestinations((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const addCity = () => {
    setDestinations([...destinations, ""]);
  };

  const removeCity = (idx: number) => {
    if (destinations.length === 1) return;
    setDestinations(destinations.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const primary = destinations[0]?.trim();
    if (!primary) return;
    hapticTap("MEDIUM");

    // If the user picked an airport entry (e.g. "JFK · New York (...)") we
    // split the airport code off so the rest of the pipeline still sees
    // a plain city name but we can hand the IATA straight to Skyscanner.
    const origin = resolveAirportLabel(originCity);
    const resolvedDestinations = destinations
      .map((d) => resolveAirportLabel(d.trim()))
      .filter((d) => d.cityText);
    const primaryDest = resolvedDestinations[0];
    const allCities = resolvedDestinations
      .map((d) => d.cityText)
      .join(" → ");

    onSearch({
      destination: allCities || primaryDest.cityText,
      startDate,
      endDate,
      travelers,
      style,
      originCity: origin.cityText,
      originAirport: origin.iata ?? undefined,
      destinationAirport: primaryDest.iata ?? undefined,
      budgetPerDay,
    });
  };

  const isMultiCity = destinations.length > 1;

  return (
    <div className="relative mx-auto max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-3xl shadow-elevated border border-cream-200 p-6 md:p-8"
      >
        <div className="text-center mb-6">
          <h2 className="font-serif text-display text-charcoal-900 md:text-display-lg">
            Your journey begins
          </h2>
          <p className="mt-2 font-sans text-body-sm text-charcoal-800/60">
            Plan your perfect trip in seconds
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Origin "from" input */}
          <div>
            <label className="block font-sans text-caption font-medium text-charcoal-800/60 mb-1.5">
              Flying from
            </label>
            <PlaceInput
              value={originCity}
              onChange={setOriginCity}
              placeholder="e.g. New York, London, Tokyo"
              leftIcon={
                <Plane className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-800/30 -rotate-45 pointer-events-none" />
              }
              inputClassName="py-3 text-body-sm placeholder:font-sans"
            />
          </div>

          {/* Destination inputs */}
          <div className="space-y-2">
            <label className="block font-sans text-caption font-medium text-charcoal-800/60">
              Going to
            </label>
            {destinations.map((dest, index) => {
              const isPrimary = index === 0;
              return (
                <div key={index} className="flex items-center gap-2">
                  {isMultiCity && (
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-terracotta-500/10 text-terracotta-500 font-sans text-caption font-medium flex items-center justify-center">
                      {index + 1}
                    </span>
                  )}
                  <div className="relative flex-1">
                    <PlaceInput
                      value={dest}
                      onChange={(v) => setDestinationAt(index, v)}
                      placeholder={
                        isPrimary && !dest
                          ? `${placeholderText}|`
                          : isPrimary
                          ? ""
                          : "Add next destination..."
                      }
                      rightSlot={
                        dest ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (isMultiCity) removeCity(index);
                              else setDestinationAt(0, "");
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-charcoal-800/40 hover:text-terracotta-500 hover:bg-terracotta-500/10 z-10"
                            aria-label="Clear"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        ) : undefined
                      }
                    />
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={addCity}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-caption text-terracotta-500 hover:bg-terracotta-500/5 hover:text-terracotta-600 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add another city (multi-city trip)
            </button>

            {isMultiCity && (
              <p className="px-1 font-sans text-caption text-charcoal-800/50">
                Route:{" "}
                {destinations
                  .filter((d) => d.trim())
                  .map((d) => d.split(",")[0].trim())
                  .join(" → ")}
              </p>
            )}
          </div>

          {/* Popular chips (only when first input empty) */}
          {!destinations[0] && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-sans text-caption text-charcoal-800/50 mr-1">
                Popular:
              </span>
              {POPULAR_DESTINATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDestinationAt(0, d)}
                  className="px-3 py-1 rounded-full bg-cream-100 border border-cream-200 font-sans text-caption text-charcoal-800/70 hover:bg-terracotta-500 hover:text-white hover:border-terracotta-500 transition-colors"
                >
                  {d.split(",")[0]}
                </button>
              ))}
            </div>
          )}

          {/* Date + traveler + style row.
              IMPORTANT mobile notes:
              - text-base = 16px is REQUIRED on date inputs. iOS Safari
                auto-zooms any input with font-size < 16px on focus,
                which janks the page and looks broken.
              - No decorative absolute-positioned Calendar icon — iOS
                renders its own native indicator inside the field and
                a custom overlay collides with it. Show our icon only
                next to the LABEL (above the field), where it can't
                conflict with the native control.
              - appearance-none + min-h-[44px] gives consistent height
                across iOS / Android / desktop.
          */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Start date */}
            <div className="relative md:col-span-1">
              <label className="flex items-center gap-1.5 font-sans text-caption font-medium text-charcoal-800/60 mb-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Start date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full appearance-none min-h-[44px] px-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl font-sans text-base text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
              />
            </div>

            {/* End date */}
            <div className="relative md:col-span-1">
              <label className="flex items-center gap-1.5 font-sans text-caption font-medium text-charcoal-800/60 mb-1.5">
                <Calendar className="w-3.5 h-3.5" />
                End date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full appearance-none min-h-[44px] px-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl font-sans text-base text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
              />
            </div>

            {/* Travelers */}
            <div className="relative md:col-span-1">
              <label className="block font-sans text-caption font-medium text-charcoal-800/60 mb-1.5">
                Travelers
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-cream-50 border border-cream-200 rounded-xl">
                <Users className="w-4 h-4 text-charcoal-800/30" />
                <button
                  type="button"
                  onClick={() => setTravelers(Math.max(1, travelers - 1))}
                  className="w-7 h-7 rounded-full border border-cream-300 flex items-center justify-center text-charcoal-800/70 hover:bg-terracotta-500 hover:text-white hover:border-terracotta-500 transition-colors"
                  aria-label="Decrease travelers"
                >
                  −
                </button>
                <span className="flex-1 text-center font-sans text-body-sm font-medium text-charcoal-900">
                  {travelers}
                </span>
                <button
                  type="button"
                  onClick={() => setTravelers(Math.min(20, travelers + 1))}
                  className="w-7 h-7 rounded-full border border-cream-300 flex items-center justify-center text-charcoal-800/70 hover:bg-terracotta-500 hover:text-white hover:border-terracotta-500 transition-colors"
                  aria-label="Increase travelers"
                >
                  +
                </button>
              </div>
            </div>

            {/* Style */}
            <div className="relative md:col-span-1">
              <label className="block font-sans text-caption font-medium text-charcoal-800/60 mb-1.5">
                Style
              </label>
              <div className="relative">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-800/30 pointer-events-none" />
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl font-sans text-body-sm appearance-none focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                >
                  {STYLES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="flex items-center justify-between font-sans text-caption font-medium text-charcoal-800/60 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                Budget per person per day
              </span>
              <span className="font-serif text-body text-charcoal-900">
                ${budgetPerDay}
                <span className="text-charcoal-800/40 text-caption ml-0.5">
                  /day
                </span>
              </span>
            </label>
            <div className="px-3 py-3 bg-cream-50 border border-cream-200 rounded-xl">
              <input
                type="range"
                min={30}
                max={800}
                step={10}
                value={budgetPerDay}
                onChange={(e) => setBudgetPerDay(parseInt(e.target.value))}
                className="w-full accent-terracotta-500"
                aria-label="Budget per person per day in USD"
              />
              <div className="flex justify-between text-caption font-sans text-charcoal-800/40 mt-1.5">
                <span>Shoestring $30</span>
                <span>Mid $150</span>
                <span>Luxury $800+</span>
              </div>
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {[50, 100, 150, 300, 500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBudgetPerDay(preset)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-caption font-sans border transition-colors",
                      budgetPerDay === preset
                        ? "bg-terracotta-500 text-white border-terracotta-500"
                        : "bg-white border-cream-300 text-charcoal-800/70 hover:border-terracotta-500"
                    )}
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!destinations[0]?.trim()}
            className={cn(
              "w-full mt-4 px-6 py-4 rounded-2xl font-sans font-medium text-body",
              "bg-terracotta-500 text-white shadow-card",
              "hover:bg-terracotta-600 hover:shadow-card-hover",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "transition-all"
            )}
          >
            {isMultiCity ? "Plan my multi-city trip" : "Plan my trip"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
