/**
 * Geocode-backfill for legacy itineraries.
 *
 * Trips generated before the map feature have no `coords` on any Activity.
 * First time the map view opens we run this — it geocodes every Activity
 * name biased to the trip's destination and writes the results back into
 * `itineraries.itinerary_data` so subsequent opens are instant.
 *
 * Activities that can't be resolved get `confidence: 'unresolved'` so we
 * don't retry them on every open.
 */

import type { Activity, Itinerary, DayPlan } from "@/types/itinerary";
import { geocode } from "@/lib/geo/geocode";

interface BackfillResult {
  itinerary: Itinerary;
  changed: number;
}

function slotKey(slot: keyof Pick<DayPlan, "morning" | "afternoon" | "evening">) {
  return slot;
}

async function backfillActivity(a: Activity, destination: string): Promise<Activity> {
  if (a.coords) return a;
  const hit = await geocode(a.name, destination);
  if (!hit) {
    return { ...a, coords: { lat: 0, lng: 0, confidence: "unresolved" } };
  }
  return {
    ...a,
    coords: { lat: hit.latitude, lng: hit.longitude, placeId: hit.placeId, confidence: hit.confidence },
  };
}

export async function backfillItineraryCoords(itinerary: Itinerary): Promise<BackfillResult> {
  let changed = 0;
  const days: DayPlan[] = await Promise.all(
    itinerary.days.map(async (day) => {
      const slots = ["morning", "afternoon", "evening"] as const;
      const next: DayPlan = { ...day };
      for (const s of slots) {
        const key = slotKey(s);
        const before = day[key];
        const after = await Promise.all(before.map((a) => backfillActivity(a, itinerary.destination)));
        for (let i = 0; i < before.length; i++) {
          if (before[i].coords !== after[i].coords) changed++;
        }
        next[key] = after;
      }
      return next;
    })
  );
  return { itinerary: { ...itinerary, days }, changed };
}
