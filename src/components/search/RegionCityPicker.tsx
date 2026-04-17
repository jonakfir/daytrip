"use client";

import { useMemo } from "react";
import { MapPin, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getRegionByLabel } from "@/lib/region-catalog";

interface Props {
  /** Currently selected region labels, e.g. ["Eastern Europe"]. */
  regions: string[];
  /** City names the user has picked. Globally unique in our catalog. */
  selectedCities: string[];
  /** Called when the user toggles a city. */
  onToggleCity: (city: string) => void;
  /** Called with all cities in the given region. `select` is true for
   *  "Select all" (union in), false for "Clear all" (subtract). */
  onSelectAllInRegion?: (cities: string[], select: boolean) => void;
}

/**
 * Expands each selected region into the list of countries + cities
 * from our hand-curated catalog. The user multi-selects cities; those
 * cities flow through the search request as `cities: string[]` and
 * skip the Claude city-coordinator entirely.
 */
export default function RegionCityPicker({
  regions,
  selectedCities,
  onToggleCity,
  onSelectAllInRegion,
}: Props) {
  const expandedRegions = useMemo(
    () => regions.map((label) => getRegionByLabel(label)).filter((r): r is NonNullable<typeof r> => !!r),
    [regions]
  );

  if (expandedRegions.length === 0) return null;

  const selectedSet = new Set(selectedCities);

  return (
    <AnimatePresence>
      <motion.div
        key="region-city-picker"
        initial={{ opacity: 0, y: -6, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -6, height: 0 }}
        transition={{ duration: 0.25 }}
        className="mt-3 border border-cream-200 rounded-2xl bg-cream-50 p-4 text-left"
      >
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-terracotta-500" />
          <p className="font-sans text-body-sm font-medium text-charcoal-900">
            Pick the cities you want to visit
          </p>
          <span className="ml-auto text-caption text-charcoal-800/50 font-sans">
            {selectedCities.length} selected
          </span>
        </div>
        <p className="text-caption text-charcoal-800/60 font-sans mb-3">
          Your trip will spend time in each city you check. Pick at least one
          per region.
        </p>

        {expandedRegions.map((region) => {
          const regionCities = region.countries.flatMap((c) =>
            c.cities.map((city) => city.name)
          );
          const allInRegion = regionCities.every((c) => selectedSet.has(c));
          return (
            <div
              key={region.slug}
              className="mb-4 last:mb-0 border-t border-cream-200 first:border-t-0 pt-3 first:pt-0"
            >
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <div>
                  <h4 className="font-serif text-body text-charcoal-900">
                    {region.label}
                  </h4>
                  <p className="text-caption text-charcoal-800/50 font-sans">
                    {region.blurb}
                  </p>
                </div>
                {onSelectAllInRegion && (
                  <button
                    type="button"
                    onClick={() =>
                      onSelectAllInRegion(regionCities, !allInRegion)
                    }
                    className="text-caption font-sans text-terracotta-500 hover:text-terracotta-600"
                  >
                    {allInRegion ? "Clear all" : "Select all"}
                  </button>
                )}
              </div>

              {region.countries.map((country) => (
                <div key={country.name} className="mb-3 last:mb-0">
                  <p className="text-caption uppercase tracking-wider text-charcoal-800/50 font-sans font-medium mb-1.5">
                    {country.name}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {country.cities.map((city) => {
                      const selected = selectedSet.has(city.name);
                      return (
                        <button
                          key={city.name}
                          type="button"
                          onClick={() => onToggleCity(city.name)}
                          title={city.blurb}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-body-sm font-sans border transition-colors ${
                            selected
                              ? "bg-terracotta-500 text-white border-terracotta-500"
                              : "bg-white text-charcoal-800 border-cream-300 hover:border-terracotta-500/60"
                          }`}
                          aria-pressed={selected}
                        >
                          {selected && <Check className="w-3 h-3" />}
                          {city.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
