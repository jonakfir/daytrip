"use client";

import { useEffect, useRef, useState } from "react";
import { formatAirportLabel, searchAirports } from "@/lib/airports";

/**
 * Place autocomplete using Photon (Komoot's free OSM-based geocoder) +
 * a hardcoded IATA airport list.
 *
 * - Airports: instant results from the local airport DB (by IATA code,
 *   airport name, or city). No network call.
 * - Cities/places: Photon query — https://photon.komoot.io/api/?q=<query>
 * - Free, no API key, CORS-enabled, ~50ms latency
 * - 250ms debounce on the network call
 *
 * Airports are shown first so "JFK", "LAX", "LHR" pull up the airport
 * immediately, then city matches follow.
 */

export interface PlaceSuggestion {
  /** Display label, e.g. "Dubrovnik, Dubrovnik-Neretva County, Croatia" */
  label: string;
  /** Compact label used when the user picks this option. For airports
   *  this is "IATA · City (Airport Name)". */
  compactLabel: string;
  /** Just the city/place name, e.g. "Dubrovnik" */
  name: string;
  /** Country if known */
  country?: string;
  /** OSM place type (city, town, village, airport, …) */
  kind?: string;
  /** [lon, lat] if known */
  coordinates?: [number, number];
  /** True if this is an airport entry (affects icon + IATA extraction) */
  isAirport?: boolean;
  /** Airport IATA code (3 letters) if this is an airport */
  iata?: string;
}

interface PhotonProperties {
  name?: string;
  city?: string;
  state?: string;
  county?: string;
  country?: string;
  countrycode?: string;
  osm_key?: string;
  osm_value?: string;
  type?: string;
}

interface PhotonFeature {
  properties: PhotonProperties;
  geometry?: { coordinates?: [number, number] };
}

// Place kinds we accept (in priority order). Anything outside this set is
// filtered out — we don't want users picking restaurants or train stations.
const PLACE_KIND_PRIORITY: Record<string, number> = {
  city: 1,
  town: 2,
  village: 3,
  hamlet: 4,
  municipality: 5,
  borough: 6,
  county: 7,
  state: 8,
  province: 9,
  region: 10,
  island: 11,
  archipelago: 12,
  locality: 13,
  suburb: 14,
  // Airports — we accept these from Photon too (in addition to our hardcoded
  // IATA list) so full-name searches like "Heathrow" or "Charles de Gaulle"
  // still work even if a niche airport isn't in our hardcoded list.
  aerodrome: 15,
};

function formatLabel(p: PhotonProperties): {
  label: string;
  compactLabel: string;
} {
  const name = p.name ?? "";
  const region = p.state ?? p.county ?? "";
  const country = p.country ?? "";
  const fullParts = [name, region && region !== name ? region : null, country]
    .filter(Boolean) as string[];
  const compactParts = [name, country].filter(Boolean) as string[];
  return {
    label: Array.from(new Set(fullParts)).join(", "),
    compactLabel: Array.from(new Set(compactParts)).join(", "),
  };
}

function dedupe(list: PlaceSuggestion[]): PlaceSuggestion[] {
  const seen = new Set<string>();
  const out: PlaceSuggestion[] = [];
  for (const item of list) {
    const key = item.compactLabel.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

async function fetchPhoton(
  query: string,
  signal: AbortSignal
): Promise<PlaceSuggestion[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
    query
  )}&lang=en&limit=15`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const data = (await res.json()) as { features?: PhotonFeature[] };
  const features = data.features ?? [];

  const suggestions: PlaceSuggestion[] = features
    .filter((f) => {
      const key = f.properties.osm_key ?? "";
      const val = f.properties.osm_value ?? "";
      if (!f.properties.name) return false;
      // Accept cities/towns/villages/etc (osm_key=place)
      if (key === "place" && val in PLACE_KIND_PRIORITY) return true;
      // Also accept airports (osm_key=aeroway, osm_value=aerodrome)
      if (key === "aeroway" && val === "aerodrome") return true;
      return false;
    })
    .sort((a, b) => {
      const pa = PLACE_KIND_PRIORITY[a.properties.osm_value ?? ""] ?? 99;
      const pb = PLACE_KIND_PRIORITY[b.properties.osm_value ?? ""] ?? 99;
      return pa - pb;
    })
    .map((f) => {
      const isAirport =
        f.properties.osm_key === "aeroway" &&
        f.properties.osm_value === "aerodrome";
      const { label, compactLabel } = formatLabel(f.properties);
      return {
        label,
        compactLabel,
        name: f.properties.name ?? "",
        country: f.properties.country,
        kind: isAirport ? "airport" : f.properties.osm_value,
        coordinates: f.geometry?.coordinates,
        isAirport,
      };
    });

  return dedupe(suggestions).slice(0, 8);
}

/**
 * Synchronous airport search from our hardcoded IATA list. Runs instantly
 * with zero network cost, returned ahead of the Photon results.
 */
function searchLocalAirports(query: string): PlaceSuggestion[] {
  return searchAirports(query, 4).map((a) => ({
    label: `${a.iata} · ${a.name}, ${a.city}, ${a.country}`,
    compactLabel: formatAirportLabel(a),
    name: a.name,
    country: a.country,
    kind: "airport",
    isAirport: true,
    iata: a.iata,
  }));
}

/** Merge hardcoded airports with Photon city results, deduped. Airports go
 *  first when the query looks like an airport code/name (≤4 chars or the
 *  local search returned a strong hit); otherwise cities lead and airports
 *  fill the tail. */
function mergeResults(
  query: string,
  airports: PlaceSuggestion[],
  cities: PlaceSuggestion[]
): PlaceSuggestion[] {
  const airportsFirst =
    query.length <= 4 ||
    (airports.length > 0 &&
      airports[0].iata?.toLowerCase() === query.toLowerCase());
  const ordered = airportsFirst ? [...airports, ...cities] : [...cities, ...airports];
  return dedupe(ordered).slice(0, 8);
}

export function usePlaceAutocomplete(query: string) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    // Instant: show local airport matches while Photon spins up
    const localAirports = searchLocalAirports(trimmed);
    if (localAirports.length > 0) {
      setSuggestions(localAirports);
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const photonResults = await fetchPhoton(trimmed, controller.signal);
        setSuggestions(mergeResults(trimmed, localAirports, photonResults));
      } catch (e) {
        if ((e as DOMException)?.name !== "AbortError") {
          // Fall back to just the local airport hits if Photon fails
          setSuggestions(localAirports);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [query]);

  return { suggestions, loading };
}
