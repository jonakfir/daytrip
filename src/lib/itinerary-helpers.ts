/**
 * Small, pure helpers for reading derived facts off an Itinerary.
 *
 * These are used by the trip page (city subheader per day), export
 * (PDF / DOCX group by city), and tests. No I/O, no Claude — just
 * data transformations.
 */

import type { Hotel, HotelTier, Itinerary } from "@/types/itinerary";

/**
 * The "1 → Prague, 8 → Budapest, …" lookup the trip page needs to
 * render a city subheader on every day.
 *
 * Returns `null` for single-city trips (no cityPlan) so the caller
 * can skip rendering the subheader entirely. For multi-city trips
 * returns the entry whose `[startDay, endDay]` range covers
 * `dayNumber`, or `null` if dayNumber falls in a gap (shouldn't
 * happen with a valid plan but we're defensive).
 */
export function cityForDay(
  itinerary: Pick<Itinerary, "cityPlan">,
  dayNumber: number
): { city: string; country: string } | null {
  const plan = itinerary.cityPlan;
  if (!plan || plan.length === 0) return null;
  for (const entry of plan) {
    if (dayNumber >= entry.startDay && dayNumber <= entry.endDay) {
      return { city: entry.city, country: entry.country };
    }
  }
  return null;
}

/**
 * Order of tiers for display and sorting. Keep this as the single
 * source of truth so the UI, exports, and tests all agree.
 */
export const TIER_ORDER: HotelTier[] = ["hostel", "budget", "mid", "upscale"];

const TIER_RANK: Record<HotelTier, number> = {
  hostel: 0,
  budget: 1,
  mid: 2,
  upscale: 3,
};

export const TIER_LABEL: Record<HotelTier, string> = {
  hostel: "Hostel",
  budget: "Budget",
  mid: "Mid-range",
  upscale: "Upscale",
};

/**
 * Return a city → [hostel, budget, mid, upscale] map. Input may be
 * either the already-grouped `hotelsByCity` or a flat `hotels[]`
 * where each hotel carries a `city` field. Hotels without a `city`
 * are bucketed under an empty-string key (caller decides what to
 * do with them).
 *
 * Within each city the output is sorted by `TIER_ORDER` so the UI
 * can render tiers in a consistent left-to-right / top-to-bottom
 * order regardless of the order Claude returned them.
 */
export function groupHotelsByCity(
  itinerary: Pick<Itinerary, "hotels" | "hotelsByCity">
): Record<string, Hotel[]> {
  const grouped: Record<string, Hotel[]> = {};

  if (itinerary.hotelsByCity) {
    for (const [city, list] of Object.entries(itinerary.hotelsByCity)) {
      grouped[city] = [...list];
    }
  } else {
    for (const h of itinerary.hotels ?? []) {
      const key = h.city ?? "";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(h);
    }
  }

  for (const list of Object.values(grouped)) {
    list.sort((a, b) => {
      const ra = a.tier ? TIER_RANK[a.tier] : 99;
      const rb = b.tier ? TIER_RANK[b.tier] : 99;
      return ra - rb;
    });
  }

  return grouped;
}

/**
 * Flatten a per-city grouping back into a single list, preserving
 * city-then-tier order. Used when writing the legacy `hotels[]`
 * field on an Itinerary so downstream code that doesn't know about
 * grouping still works.
 */
export function flattenHotelsByCity(
  byCity: Record<string, Hotel[]>
): Hotel[] {
  const out: Hotel[] = [];
  for (const [city, list] of Object.entries(byCity)) {
    for (const h of list) {
      out.push({ ...h, city: h.city ?? city });
    }
  }
  return out;
}

/** True when the trip involves multiple cities per the cityPlan. */
export function isMultiCity(
  itinerary: Pick<Itinerary, "cityPlan" | "hotelsByCity">
): boolean {
  if (itinerary.cityPlan && itinerary.cityPlan.length > 1) return true;
  if (
    itinerary.hotelsByCity &&
    Object.keys(itinerary.hotelsByCity).length > 1
  ) {
    return true;
  }
  return false;
}
