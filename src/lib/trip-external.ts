/**
 * External-service wrappers used by the step runner.
 *
 * Each function is best-effort: returns null / does nothing on failure
 * so a single external outage doesn't kill a trip. Timeouts are
 * bounded so the runner never spends more than the step's budget.
 */

import { supabase } from "@/lib/supabase";
import {
  buildSkyscannerFlightUrl,
  buildSkyscannerHotelUrl,
} from "@/lib/skyscanner";
import { fetchTravelpayoutsFlights } from "@/lib/travelpayouts";
import { fetchSerpApiFlights } from "@/lib/serpapi";
import type { GenerateRequest, Flight, Itinerary } from "@/types/itinerary";
import { withTimeout } from "@/lib/trip-generator";

const WIKI_TIMEOUT_MS = 8_000;
const PROVIDER_TIMEOUT_MS = 10_000;

/**
 * Wikipedia image lookup. Multiple candidate queries, first non-
 * disambiguation hit with an image wins.
 */
async function fetchWikipediaImage(destination: string): Promise<string | null> {
  const primary = destination.split(",")[0]?.trim() || destination.trim();
  const candidates = Array.from(
    new Set([`${primary} city`, primary, destination.trim()].filter((s) => s.length > 0))
  );
  for (const query of candidates) {
    try {
      const url = new URL("https://en.wikipedia.org/w/api.php");
      url.searchParams.set("action", "query");
      url.searchParams.set("format", "json");
      url.searchParams.set("generator", "search");
      url.searchParams.set("gsrsearch", query);
      url.searchParams.set("gsrlimit", "3");
      url.searchParams.set("prop", "pageimages|pageprops");
      url.searchParams.set("piprop", "original");
      url.searchParams.set("origin", "*");
      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "Daytrip/1.0 (https://daytrip-ai.com)",
        },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as {
        query?: {
          pages?: Record<
            string,
            {
              title?: string;
              index?: number;
              original?: { source?: string };
              pageprops?: { disambiguation?: string };
            }
          >;
        };
      };
      const pages = Object.values(data.query?.pages ?? {});
      pages.sort((a, b) => (a.index ?? 99) - (b.index ?? 99));
      for (const page of pages) {
        if (page.pageprops?.disambiguation !== undefined) continue;
        const src = page.original?.source;
        if (src && src.startsWith("https://")) return src;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function fetchUnsplashImage(destination: string): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;
  try {
    const params = new URLSearchParams({
      query: `${destination} travel`,
      per_page: "1",
      orientation: "landscape",
    });
    const res = await fetch(
      `https://api.unsplash.com/search/photos?${params}`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.urls?.regular ?? null;
  } catch {
    return null;
  }
}

export async function fetchHeroImageForStep(
  destination: string
): Promise<string | null> {
  try {
    return await withTimeout(
      (async () => {
        const unsplash = await fetchUnsplashImage(destination);
        if (unsplash) return unsplash;
        return fetchWikipediaImage(destination);
      })(),
      WIKI_TIMEOUT_MS,
      "hero_timeout"
    );
  } catch {
    return null;
  }
}

/**
 * Real-flight aggregator. Tries SerpAPI, Travelpayouts in parallel,
 * returns the first non-empty result. Everything bounded by a single
 * provider timeout; if nothing responds we return null and the caller
 * falls back to Claude flight stubs.
 */
export async function fetchBestFlightsForStep(
  req: GenerateRequest
): Promise<Flight[] | null> {
  const races = await Promise.all([
    withTimeout(
      fetchSerpApiFlights(req).catch(() => null),
      PROVIDER_TIMEOUT_MS,
      "serpapi_timeout"
    ).catch(() => null),
    withTimeout(
      fetchTravelpayoutsFlights(req).catch(() => null),
      PROVIDER_TIMEOUT_MS,
      "travelpayouts_timeout"
    ).catch(() => null),
  ]);

  const picked = races.find((r) => r && r.length > 0);
  if (!picked) return null;

  return picked.map((f) => ({
    ...f,
    bookingUrl:
      f.bookingUrl ??
      buildSkyscannerFlightUrl({
        originCity: req.originCity,
        destinationCity: req.destination,
        startDate: req.startDate,
        endDate: req.endDate,
        travelers: req.travelers,
        originAirport: req.originAirport ?? f.originAirport,
        destinationAirport: req.destinationAirport ?? f.destinationAirport,
      }),
  }));
}

/** Write the final itinerary to the existing `itineraries` table. */
export async function finalizeItinerary(itinerary: Itinerary): Promise<void> {
  if (!supabase) return;
  try {
    // Add Skyscanner hotel URL to each hotel for consistent cards.
    const hotelsWithUrls = itinerary.hotels.map((h) => ({
      ...h,
      bookingUrl:
        h.bookingUrl ??
        buildSkyscannerHotelUrl({
          destinationCity: itinerary.destination,
          startDate: itinerary.startDate,
          endDate: itinerary.endDate,
          travelers: itinerary.travelers,
        }),
    }));
    const enriched: Itinerary = { ...itinerary, hotels: hotelsWithUrls };
    await supabase.from("itineraries").insert({
      id: enriched.id,
      share_id: enriched.shareId,
      destination: enriched.destination,
      start_date: enriched.startDate,
      end_date: enriched.endDate,
      travelers: enriched.travelers,
      travel_style: enriched.travelStyle,
      budget: enriched.budget,
      itinerary_data: enriched,
      view_count: 0,
    });
  } catch {
    // Non-fatal: the itinerary is still in the client's sessionStorage.
  }
}
