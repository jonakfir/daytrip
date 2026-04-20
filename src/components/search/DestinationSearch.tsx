"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Users, Plus, Sparkles, Plane, Wallet, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_TRIP_DAYS } from "@/lib/constants";
import PlaceInput from "@/components/search/PlaceInput";
import { extractIataFromLabel, getAirportByIATA } from "@/lib/airports";
import { hapticTap } from "@/lib/capacitor";
import RegionCityPicker from "@/components/search/RegionCityPicker";

interface SearchParams {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  style: string;
  /** Selected trip-type styles (multi-select). */
  styles: string[];
  /** Selected regions the user wants to consider (multi-select). */
  regions: string[];
  /** Specific cities the user picked inside one or more regions. When
   *  non-empty, the generator distributes days across exactly these
   *  cities. */
  cities: string[];
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

const STYLES = [
  "Adventure",
  "Cultural",
  "Relaxation",
  "Foodie",
  "Luxury",
  "Nature",
  "Nightlife",
  "Family",
  "Romantic",
];

const REGIONS = [
  "Western Europe",
  "Eastern Europe",
  "Southern Europe",
  "Northern Europe",
  "Mediterranean",
  "Scandinavia",
  "Balkans",
  "British Isles",
  "North America",
  "Central America",
  "Caribbean",
  "South America",
  "North Africa",
  "Sub-Saharan Africa",
  "Middle East",
  "South Asia",
  "Southeast Asia",
  "East Asia",
  "Central Asia",
  "Oceania",
];

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
  // Multi-select trip styles. User can pick more than one (e.g. Cultural + Relaxation).
  const [styles, setStyles] = useState<string[]>(["Cultural"]);
  // Multi-select regions. Used when the user wants a region-based trip
  // (e.g. "Eastern Europe") instead of specifying a city.
  const [regions, setRegions] = useState<string[]>([]);
  // Cities the user picked from the region's catalog. Keyed by city name
  // (globally unique across our catalog). Cleared when all regions are
  // deselected.
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  // Budget per person per day in USD. Defaults to $150 (moderate).
  const [budgetPerDay, setBudgetPerDay] = useState<number>(150);
  const [dateError, setDateError] = useState<string | null>(null);

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

  const toggleStyle = (s: string) => {
    setStyles((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const toggleRegion = (r: string) => {
    setRegions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const primary = destinations[0]?.trim();
    // Submit is valid when the user has EITHER a city destination OR at
    // least one region selected. Region-only trips let the generator pick
    // cities within the chosen regions.
    if (!primary && regions.length === 0) return;

    // Validate trip length before submitting
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
      if (days > MAX_TRIP_DAYS) {
        setDateError(`Trips are limited to ${MAX_TRIP_DAYS} days. Please choose a shorter range.`);
        return;
      }
      setDateError(null);
    }

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

    // When no city is provided we fall back to the selected regions as the
    // "destination" label so downstream code always has a human-readable
    // target (e.g. "Eastern Europe, Balkans").
    const destinationLabel =
      allCities || primaryDest?.cityText || regions.join(", ");

    // Preserve legacy single-string `style` for any existing consumer —
    // join the multi-select with " + " so backends see e.g. "Cultural + Relaxation".
    const legacyStyle = styles.length > 0 ? styles.join(" + ") : "Cultural";

    onSearch({
      destination: destinationLabel,
      startDate,
      endDate,
      travelers,
      style: legacyStyle,
      styles,
      regions,
      cities: selectedCities,
      originCity: origin.cityText,
      originAirport: origin.iata ?? undefined,
      destinationAirport: primaryDest?.iata ?? undefined,
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
          <h1 className="font-serif text-display text-charcoal-900 md:text-display-lg">
            Your journey begins
          </h1>
          <p className="mt-2 font-sans text-body-sm text-charcoal-800/60">
            Plan your perfect trip in seconds
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Origin "from" input */}
          <div>
            <label className="block font-sans text-caption font-medium text-charcoal-800/60 mb-1.5">
              Flying from{" "}
              <span className="text-charcoal-800/40 font-normal">
                (optional)
              </span>
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
              <label
                htmlFor="trip-start-date"
                className="flex items-center gap-1.5 font-sans text-caption font-medium text-charcoal-800/60 mb-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                Start date
              </label>
              <input
                id="trip-start-date"
                name="startDate"
                type="date"
                aria-label="Trip start date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full appearance-none min-h-[44px] px-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl font-sans text-base text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
              />
            </div>

            {/* End date */}
            <div className="relative md:col-span-1">
              <label
                htmlFor="trip-end-date"
                className="flex items-center gap-1.5 font-sans text-caption font-medium text-charcoal-800/60 mb-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                End date
              </label>
              <input
                id="trip-end-date"
                name="endDate"
                type="date"
                aria-label="Trip end date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateError(null);
                }}
                min={startDate}
                className={cn(
                  "w-full appearance-none min-h-[44px] px-3 py-2.5 bg-cream-50 border rounded-xl font-sans text-base text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500/40",
                  dateError ? "border-red-400" : "border-cream-200"
                )}
              />
              {dateError && (
                <p className="mt-1 font-sans text-caption text-red-500">
                  {dateError}
                </p>
              )}
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
                  onClick={() => setTravelers((n) => Math.max(1, n - 1))}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full border border-cream-300 flex items-center justify-center text-charcoal-800/70 hover:bg-terracotta-500 hover:text-white hover:border-terracotta-500 transition-colors"
                  aria-label="Decrease travelers"
                >
                  −
                </button>
                <span className="flex-1 text-center font-sans text-body-sm font-medium text-charcoal-900">
                  {travelers}
                </span>
                <button
                  type="button"
                  onClick={() => setTravelers((n) => Math.min(20, n + 1))}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full border border-cream-300 flex items-center justify-center text-charcoal-800/70 hover:bg-terracotta-500 hover:text-white hover:border-terracotta-500 transition-colors"
                  aria-label="Increase travelers"
                >
                  +
                </button>
              </div>
            </div>

            {/* Style summary (multi-select chips render below) */}
            <div className="relative md:col-span-1">
              <label className="flex items-center gap-1.5 font-sans text-caption font-medium text-charcoal-800/60 mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Vibe
              </label>
              <div className="min-h-[44px] px-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl font-sans text-body-sm text-charcoal-800/70 flex items-center">
                {styles.length === 0
                  ? "Pick one or more"
                  : styles.join(" + ")}
              </div>
            </div>
          </div>

          {/* Multi-select style chips — user can pick any combination
              (e.g. Cultural + Relaxation). Empty selection is allowed but
              the submit button will hint the user to pick at least one. */}
          <div>
            <label className="block font-sans text-caption font-medium text-charcoal-800/60 mb-1.5">
              What&apos;s the vibe? (pick any that fit)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STYLES.map((s) => {
                const active = styles.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStyle(s)}
                    className={cn(
                      "px-3 py-1.5 rounded-full font-sans text-caption border transition-colors",
                      active
                        ? "bg-terracotta-500 text-white border-terracotta-500"
                        : "bg-white border-cream-300 text-charcoal-800/70 hover:border-terracotta-500"
                    )}
                    aria-pressed={active}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Region multi-select — lets the user describe a region-based
              trip ("Eastern Europe", "Mediterranean") instead of a single
              city. Filled in only when destinations[0] is empty, to avoid
              ambiguity between "Paris" + "Western Europe". */}
          {!destinations[0]?.trim() && (
            <div>
              <label className="block font-sans text-caption font-medium text-charcoal-800/60 mb-1.5">
                Or pick regions to explore
                {regions.length > 0 && (
                  <span className="ml-1.5 text-charcoal-800/40">
                    ({regions.length} selected)
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {REGIONS.map((r) => {
                  const active = regions.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleRegion(r)}
                      className={cn(
                        "px-3 py-1.5 rounded-full font-sans text-caption border transition-colors",
                        active
                          ? "bg-terracotta-500 text-white border-terracotta-500"
                          : "bg-white border-cream-300 text-charcoal-800/70 hover:border-terracotta-500"
                      )}
                      aria-pressed={active}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
              <RegionCityPicker
                regions={regions}
                selectedCities={selectedCities}
                onToggleCity={(city) =>
                  setSelectedCities((cur) =>
                    cur.includes(city)
                      ? cur.filter((c) => c !== city)
                      : [...cur, city]
                  )
                }
                onSelectAllInRegion={(cities, select) => {
                  setSelectedCities((cur) => {
                    if (!select) {
                      return cur.filter((c) => !cities.includes(c));
                    }
                    const set = new Set(cur);
                    cities.forEach((c) => set.add(c));
                    return Array.from(set);
                  });
                }}
              />
            </div>
          )}

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

          {/* Submit — valid when the user has a city destination OR
              at least one region picked. Region-only trips let the backend
              pick cities within the chosen regions. */}
          <button
            type="submit"
            disabled={!destinations[0]?.trim() && regions.length === 0}
            className={cn(
              "w-full mt-4 px-6 py-4 rounded-2xl font-sans font-medium text-body",
              "bg-terracotta-500 text-white shadow-card",
              "hover:bg-terracotta-600 hover:shadow-card-hover",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "transition-all"
            )}
          >
            {isMultiCity
              ? "Plan my multi-city trip"
              : !destinations[0]?.trim() && regions.length > 0
              ? `Plan a trip across ${regions.length === 1 ? regions[0] : `${regions.length} regions`}`
              : "Plan my trip"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
