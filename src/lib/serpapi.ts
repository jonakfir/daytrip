/**
 * SerpAPI Google Flights integration.
 *
 * This is the only flight-data source we have that gives REAL prices for
 * 100% of routes — it's literally Google Flights' own data, scraped on
 * demand by SerpAPI's backend. Universal coverage, no cache gaps, no
 * "this route isn't in our dataset" surprises.
 *
 * Required env var (set in Vercel):
 *   SERPAPI_KEY — your API key from https://serpapi.com/
 *
 * Pricing: 100 free queries/month, then $50/mo for 5,000 queries.
 * Each /api/generate trip = 1 SerpAPI query.
 *
 * Docs: https://serpapi.com/google-flights-api
 */

import type { Flight, GenerateRequest } from "@/types/itinerary";
import { buildSkyscannerFlightUrl } from "./skyscanner";
import { getAirportByIATA, searchAirports } from "./airports";

function resolveIata(input: string | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[A-Z]{3}$/i.test(trimmed)) {
    const exact = getAirportByIATA(trimmed);
    if (exact) return exact.iata;
  }
  const cityOnly = trimmed.split(",")[0].trim();
  const matches = searchAirports(cityOnly, 1);
  return matches[0]?.iata ?? null;
}

interface SerpFlightSegment {
  departure_airport?: { name?: string; id?: string; time?: string };
  arrival_airport?: { name?: string; id?: string; time?: string };
  duration?: number;
  airplane?: string;
  airline?: string;
  airline_logo?: string;
  travel_class?: string;
  flight_number?: string;
  legroom?: string;
  extensions?: string[];
}

interface SerpFlightOption {
  flights: SerpFlightSegment[];
  layovers?: Array<{ duration: number; name: string; id: string }>;
  total_duration?: number;
  carbon_emissions?: { this_flight?: number };
  price?: number;
  type?: string;
  airline_logo?: string;
  departure_token?: string;
  booking_token?: string;
}

interface SerpFlightsResponse {
  error?: string;
  search_metadata?: { id: string; status: string };
  best_flights?: SerpFlightOption[];
  other_flights?: SerpFlightOption[];
  price_insights?: {
    lowest_price?: number;
    price_level?: string;
    typical_price_range?: [number, number];
  };
}

/**
 * Fetch real flight prices from SerpAPI Google Flights.
 *
 * Returns null if:
 *   - SERPAPI_KEY env var is not set
 *   - The origin/destination can't be resolved to IATA codes
 *   - SerpAPI returns an error (out of quota, invalid params, etc)
 *   - No flight options are returned for the route
 *
 * Returns an array of up to 3 Flight objects (cheapest first), each
 * carrying a real Google Flights price.
 */
export async function fetchSerpApiFlights(
  body: GenerateRequest
): Promise<Flight[] | null> {
  // .trim() defends against the Vercel trailing-newline env var quirk
  const apiKey = process.env.SERPAPI_KEY?.trim();
  if (!apiKey) {
    console.warn("[serpapi] SERPAPI_KEY not set");
    return null;
  }

  const originIata =
    body.originAirport?.toUpperCase() || resolveIata(body.originCity);
  const destIata =
    body.destinationAirport?.toUpperCase() || resolveIata(body.destination);

  if (!originIata || !destIata) {
    console.warn(
      `[serpapi] Could not resolve IATA — origin=${body.originCity ?? "?"} → ${originIata}, dest=${body.destination} → ${destIata}`
    );
    return null;
  }

  try {
    const params = new URLSearchParams({
      engine: "google_flights",
      departure_id: originIata,
      arrival_id: destIata,
      outbound_date: body.startDate,
      return_date: body.endDate,
      currency: "USD",
      hl: "en",
      type: "1", // 1 = round trip, 2 = one way
      adults: String(body.travelers || 1),
      api_key: apiKey,
    });

    const url = `https://serpapi.com/search.json?${params}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.warn(
        `[serpapi] HTTP ${res.status} ${res.statusText} for ${originIata} → ${destIata}`
      );
      return null;
    }

    const data = (await res.json()) as SerpFlightsResponse;

    if (data.error) {
      console.warn(`[serpapi] API error: ${data.error}`);
      return null;
    }

    // Combine best + other flights. Google's `best_flights` is curated
    // for the best price/duration tradeoff, but we want the user to be
    // able to filter by stops, airline, price, etc — so return a wider
    // pool (up to 12) and let the frontend filter client-side.
    const allOptions = [
      ...(data.best_flights ?? []),
      ...(data.other_flights ?? []),
    ];

    if (allOptions.length === 0) {
      console.warn(
        `[serpapi] No flight options returned for ${originIata} → ${destIata}`
      );
      return null;
    }

    // De-dup by airline + price + stops so the user doesn't see 3
    // identical-looking entries from the same airline.
    const seen = new Set<string>();
    const deduped: SerpFlightOption[] = [];
    for (const opt of allOptions) {
      const segs = opt.flights ?? [];
      const firstSeg = segs[0];
      const key = `${firstSeg?.airline ?? "?"}|${opt.price ?? 0}|${segs.length - 1}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(opt);
    }

    // Sort by price ascending so cheapest is first; cap at 12.
    deduped.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    const top = deduped.slice(0, 12);

    const flights = top
      .map((opt) => mapOptionToFlight(opt, body, originIata, destIata))
      .filter((f): f is Flight => f !== null);

    if (flights.length === 0) return null;

    console.log(
      `[serpapi] fetched ${flights.length} REAL flights for ${originIata} → ${destIata}, cheapest $${top[0].price}, most expensive $${top[top.length - 1].price}`
    );
    return flights;
  } catch (e) {
    console.warn(
      "[serpapi] fetch threw:",
      e instanceof Error ? e.message : String(e)
    );
    return null;
  }
}

function mapOptionToFlight(
  opt: SerpFlightOption,
  body: GenerateRequest,
  originIata: string,
  destIata: string
): Flight | null {
  const segs = opt.flights ?? [];
  const firstSeg = segs[0];
  const lastSeg = segs[segs.length - 1];
  if (!firstSeg) return null;

  // SerpAPI returns the TOTAL price for the entire party (we passed
  // adults=body.travelers in the request). Divide back to per-person so
  // every flight provider in our system speaks the same units.
  const travelers = Math.max(1, body.travelers || 1);
  const perPerson =
    typeof opt.price === "number"
      ? Math.round(opt.price / travelers)
      : null;
  const price = perPerson !== null ? `$${perPerson}` : "—";

  // Build the booking URL — SerpAPI returns a `booking_token` we COULD use
  // to fetch a Google Flights deep-link via a follow-up request, but each
  // such call is another billable query. Instead we surface the existing
  // Skyscanner deep-link with the user's pinned IATA codes — same UX, zero
  // extra API cost. The Travelpayouts marker on subsequent /api/generate
  // calls (Travelpayouts fallback path) still earns affiliate commission.
  const bookingUrl = buildSkyscannerFlightUrl({
    originCity: body.originCity,
    destinationCity: body.destination,
    startDate: body.startDate,
    endDate: body.endDate,
    travelers: body.travelers,
    originAirport: firstSeg.departure_airport?.id || originIata,
    destinationAirport: lastSeg.arrival_airport?.id || destIata,
  });

  return {
    airline: firstSeg.airline || "—",
    departure: firstSeg.departure_airport?.time || body.startDate,
    arrival: lastSeg.arrival_airport?.time || body.endDate,
    price,
    stops: Math.max(0, segs.length - 1),
    originAirport: firstSeg.departure_airport?.id || originIata,
    destinationAirport: lastSeg.arrival_airport?.id || destIata,
    bookingUrl,
  };
}
