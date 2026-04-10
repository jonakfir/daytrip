"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Users, X, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchParams {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  style: string;
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

const DESTINATIONS = [
  "Tokyo, Japan",
  "Kyoto, Japan",
  "Paris, France",
  "Nice, France",
  "Bali, Indonesia",
  "Barcelona, Spain",
  "Madrid, Spain",
  "Lisbon, Portugal",
  "Porto, Portugal",
  "Rome, Italy",
  "Florence, Italy",
  "Venice, Italy",
  "Amalfi Coast, Italy",
  "Cinque Terre, Italy",
  "Marrakech, Morocco",
  "Cape Town, South Africa",
  "Reykjavik, Iceland",
  "Dubrovnik, Croatia",
  "Santorini, Greece",
  "Athens, Greece",
  "Istanbul, Turkey",
  "Dubai, UAE",
  "Petra, Jordan",
  "Jaipur, India",
  "Mumbai, India",
  "Bangkok, Thailand",
  "Singapore",
  "Hong Kong",
  "Hoi An, Vietnam",
  "Seoul, South Korea",
  "Sydney, Australia",
  "Queenstown, New Zealand",
  "New York, USA",
  "San Francisco, USA",
  "Mexico City, Mexico",
  "Havana, Cuba",
  "Rio de Janeiro, Brazil",
  "Buenos Aires, Argentina",
  "Machu Picchu, Peru",
  "Bruges, Belgium",
  "Amsterdam, Netherlands",
  "Berlin, Germany",
  "Vienna, Austria",
  "Prague, Czech Republic",
  "London, England",
  "Banff, Canada",
  "Zanzibar, Tanzania",
  "Cairo, Egypt",
];

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
  const [startDate, setStartDate] = useState<string>(todayPlus(14));
  const [endDate, setEndDate] = useState<string>(todayPlus(19));
  const [travelers, setTravelers] = useState<number>(2);
  const [style, setStyle] = useState<string>("Cultural");

  // Typewriter placeholder
  const [placeholderText, setPlaceholderText] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  // Suggestions dropdown
  const [showSuggestions, setShowSuggestions] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Click outside suggestions to close them
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Notify parent of primary destination changes (for landscape morph)
  useEffect(() => {
    onDestinationChange?.(destinations[0] || "");
  }, [destinations, onDestinationChange]);

  const handleDestinationInput = (idx: number, value: string) => {
    const next = [...destinations];
    next[idx] = value;
    setDestinations(next);
    setShowSuggestions(idx);
  };

  const selectSuggestion = (idx: number, value: string) => {
    const next = [...destinations];
    next[idx] = value;
    setDestinations(next);
    setShowSuggestions(null);
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
    const allCities = destinations
      .map((d) => d.trim())
      .filter(Boolean)
      .join(" → ");
    onSearch({
      destination: allCities || primary,
      startDate,
      endDate,
      travelers,
      style,
    });
  };

  const filteredSuggestions = (input: string): string[] => {
    if (!input.trim()) return [];
    const q = input.toLowerCase();
    return DESTINATIONS.filter((d) => d.toLowerCase().includes(q)).slice(0, 6);
  };

  const isMultiCity = destinations.length > 1;

  return (
    <div
      ref={containerRef}
      className="relative mx-auto max-w-3xl"
    >
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
          {/* Destination inputs */}
          <div className="space-y-2">
            {destinations.map((dest, index) => {
              const suggestions = filteredSuggestions(dest);
              const isPrimary = index === 0;
              return (
                <div key={index} className="relative">
                  <div className="flex items-center gap-2">
                    {isMultiCity && (
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-terracotta-500/10 text-terracotta-500 font-sans text-caption font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                    )}
                    <div className="relative flex-1">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-800/30" />
                      <input
                        type="text"
                        value={dest}
                        onChange={(e) =>
                          handleDestinationInput(index, e.target.value)
                        }
                        onFocus={() => setShowSuggestions(index)}
                        placeholder={
                          isPrimary && !dest
                            ? `${placeholderText}|`
                            : isPrimary
                            ? ""
                            : "Add next destination..."
                        }
                        className={cn(
                          "w-full pl-11 pr-10 py-3.5 bg-cream-50 border border-cream-200 rounded-2xl",
                          "font-sans text-body text-charcoal-900",
                          "placeholder:text-charcoal-800/30 placeholder:font-serif",
                          "focus:outline-none focus:ring-2 focus:ring-terracotta-500/40 focus:border-terracotta-500/30"
                        )}
                      />
                      {dest && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isMultiCity) removeCity(index);
                            else handleDestinationInput(0, "");
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-charcoal-800/40 hover:text-terracotta-500 hover:bg-terracotta-500/10"
                          aria-label="Clear"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Suggestions dropdown */}
                  <AnimatePresence>
                    {showSuggestions === index && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-2 z-30 bg-white rounded-2xl shadow-elevated border border-cream-200 overflow-hidden"
                      >
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => selectSuggestion(index, s)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left font-sans text-body-sm text-charcoal-900 hover:bg-cream-100 transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5 text-terracotta-500/60" />
                            {s}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                  onClick={() => selectSuggestion(0, d)}
                  className="px-3 py-1 rounded-full bg-cream-100 border border-cream-200 font-sans text-caption text-charcoal-800/70 hover:bg-terracotta-500 hover:text-white hover:border-terracotta-500 transition-colors"
                >
                  {d.split(",")[0]}
                </button>
              ))}
            </div>
          )}

          {/* Date + traveler + style row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Start date */}
            <div className="relative md:col-span-1">
              <label className="block font-sans text-caption font-medium text-charcoal-800/60 mb-1.5">
                Start date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-800/30 pointer-events-none" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl font-sans text-body-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                />
              </div>
            </div>

            {/* End date */}
            <div className="relative md:col-span-1">
              <label className="block font-sans text-caption font-medium text-charcoal-800/60 mb-1.5">
                End date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-800/30 pointer-events-none" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full pl-9 pr-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl font-sans text-body-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/40"
                />
              </div>
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
