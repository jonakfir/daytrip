"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2, Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaceAutocomplete } from "@/lib/use-place-autocomplete";

interface Props {
  /** Current input value (controlled) */
  value: string;
  /** Called when the user picks a suggestion or types — pass back to parent */
  onChange: (value: string) => void;
  /** Optional placeholder for the empty state */
  placeholder?: string;
  /** Optional left icon override (defaults to MapPin) */
  leftIcon?: React.ReactNode;
  /** Optional right slot (e.g. clear button) */
  rightSlot?: React.ReactNode;
  /** Tailwind classes for the input element */
  inputClassName?: string;
}

/**
 * A text input with live geocoding autocomplete via Photon (OSM).
 * Drop this into any field that should accept a real-world city/place.
 */
export default function PlaceInput({
  value,
  onChange,
  placeholder,
  leftIcon,
  rightSlot,
  inputClassName,
}: Props) {
  const [focused, setFocused] = useState(false);
  // Track whether the user is actively typing — we suppress suggestions for
  // 200ms after a programmatic value change (e.g. selecting a suggestion)
  // so the dropdown doesn't immediately re-open with the just-picked label.
  const [activeQuery, setActiveQuery] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { suggestions, loading } = usePlaceAutocomplete(activeQuery);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleType = (next: string) => {
    onChange(next);
    setActiveQuery(next);
    setFocused(true);
  };

  const handlePick = (label: string) => {
    onChange(label);
    setActiveQuery(""); // suppress dropdown re-fetch
    setFocused(false);
  };

  // If the parent updates the value (e.g. clearing it), sync our active query
  useEffect(() => {
    if (value === "") setActiveQuery("");
  }, [value]);

  const showDropdown = focused && (loading || suggestions.length > 0);

  return (
    <div ref={wrapperRef} className="relative">
      {leftIcon ?? (
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-800/30 pointer-events-none" />
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => handleType(e.target.value)}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        className={cn(
          "w-full pl-11 pr-10 py-3.5 bg-cream-50 border border-cream-200 rounded-2xl",
          "font-sans text-body text-charcoal-900",
          "placeholder:text-charcoal-800/30 placeholder:font-serif",
          "focus:outline-none focus:ring-2 focus:ring-terracotta-500/40 focus:border-terracotta-500/30",
          inputClassName
        )}
        autoComplete="off"
      />
      {rightSlot}

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 z-30 bg-white rounded-2xl shadow-elevated border border-cream-200 overflow-hidden max-h-80 overflow-y-auto"
          >
            {loading && suggestions.length === 0 && (
              <div className="flex items-center gap-2 px-4 py-3 font-sans text-body-sm text-charcoal-800/50">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-terracotta-500" />
                Searching places…
              </div>
            )}
            {suggestions.map((s) => (
              <button
                key={`${s.compactLabel}-${s.coordinates?.join(",") ?? ""}`}
                type="button"
                onClick={() => handlePick(s.compactLabel)}
                className="w-full flex items-start gap-2.5 px-4 py-2.5 text-left hover:bg-cream-100 transition-colors"
              >
                {s.isAirport ? (
                  <Plane className="w-3.5 h-3.5 mt-1 text-terracotta-500/70 shrink-0" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 mt-1 text-terracotta-500/60 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-sans text-body-sm text-charcoal-900 truncate">
                    {s.isAirport && s.iata && (
                      <span className="font-mono font-semibold text-terracotta-600 mr-1.5">
                        {s.iata}
                      </span>
                    )}
                    {s.name}
                    {s.country && (
                      <span className="text-charcoal-800/50">
                        {", "}
                        {s.country}
                      </span>
                    )}
                  </div>
                  {s.kind && (
                    <div className="font-sans text-caption text-charcoal-800/40 capitalize">
                      {s.kind}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
