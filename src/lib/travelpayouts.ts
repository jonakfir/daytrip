/**
 * Travelpayouts flight-data integration.
 *
 * Travelpayouts is an affiliate network that aggregates real airline price
 * data from Aviasales (and several other sources) and exposes it through
 * a free Data API. We use the "Latest Prices" endpoint which returns the
 * cheapest cached real prices for a given route + date range — fast (single
 * call, ~200ms), no polling, no per-search cost.
 *
 * The data is *cached* (typically 24-48h old) but it's REAL — every price
 * was offered by an airline at some point. When the user clicks the booking
 * URL, they land on an Aviasales / partner search page that shows the live
 * current price and lets them complete the booking. You earn an affiliate
 * commission on every completed booking.
 *
 * Required env vars (set in Vercel):
 *   TRAVELPAYOUTS_TOKEN  — your API token
 *   TRAVELPAYOUTS_MARKER — your affiliate marker (6-7 digit number)
 *
 * Sign up at https://www.travelpayouts.com — free, no credit card.
 *
 * Docs: https://support.travelpayouts.com/hc/en-us/articles/203956163
 */

import type { Flight, GenerateRequest } from "@/types/itinerary";
import { buildSkyscannerFlightUrl } from "./skyscanner";
import { getAirportByIATA, searchAirports } from "./airports";

/**
 * Resolve a city name or already-IATA-coded string into a 3-letter IATA
 * airport code, using the static airports dataset.
 */
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

interface TravelpayoutsLatestPriceEntry {
  origin: string;
  destination: string;
  departure_at: string;
  return_at?: string;
  airline: string;
  flight_number?: number;
  transfers?: number;
  return_transfers?: number;
  duration?: number;
  duration_to?: number;
  duration_back?: number;
  price: number;
  link?: string;
  found_at?: string;
}

/**
 * Build an Aviasales affiliate booking URL with the marker appended so
 * conversions are attributed to the user. Aviasales URLs look like:
 *   https://www.aviasales.com/search/LAX1506NRT1806?marker=XXXXXX
 *
 * Format: <ORIGIN><DD><MM><DEST><DD><MM>[<TRAVELERS>]
 *   - dates as DDMM (no year)
 *   - travelers count is optional and only added if > 1
 */
function buildAviasalesUrl(opts: {
  origin: string;
  destination: string;
  departDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD
  travelers: number;
  marker: string;
}): string {
  const fmt = (iso: string): string => {
    const [, m, d] = iso.split("-");
    return `${d}${m}`;
  };
  const departSegment = `${opts.origin}${fmt(opts.departDate)}${opts.destination}`;
  const returnSegment = opts.returnDate
    ? `${opts.destination}${fmt(opts.returnDate)}${opts.origin}`
    : "";
  const adults = opts.travelers > 1 ? String(opts.travelers) : "";
  return `https://www.aviasales.com/search/${departSegment}${returnSegment}${adults}?marker=${opts.marker}`;
}

/**
 * Fetch real flight prices from Travelpayouts.
 *
 * Returns null when:
 *   - Required env vars are missing
 *   - We can't resolve origin/destination to IATA codes
 *   - The API call fails or returns no data
 *
 * Returns an array of Flight objects when successful. The first entry is
 * always the cheapest one. We surface up to 3.
 */
export async function fetchTravelpayoutsFlights(
  body: GenerateRequest
): Promise<Flight[] | null> {
  // .trim() defends against the Vercel env-var trailing-newline quirk that
  // already bit ANTHROPIC_API_KEY, DAYTRIP_PROXY_URL, ADMIN_PASSWORD, etc.
  const token = process.env.TRAVELPAYOUTS_TOKEN?.trim();
  const marker = process.env.TRAVELPAYOUTS_MARKER?.trim();
  if (!token) {
    console.warn("[travelpayouts] TRAVELPAYOUTS_TOKEN not set");
    return null;
  }

  const originIata =
    body.originAirport?.toUpperCase() || resolveIata(body.originCity);
  const destIata =
    body.destinationAirport?.toUpperCase() || resolveIata(body.destination);

  if (!originIata || !destIata) {
    console.warn(
      `[travelpayouts] Could not resolve IATA — origin=${body.originCity ?? "?"} → ${originIata}, dest=${body.destination} → ${destIata}`
    );
    return null;
  }

  // 4-tier fallback chain — Travelpayouts free-tier coverage is spotty
  // (mostly US east coast → Europe), so we try multiple endpoints + the
  // no-date variant to squeeze every cached entry the API has for the
  // route. The first endpoint that returns ≥1 entry wins.
  //
  //   1. Calendar with dates → date-specific cached entries (best)
  //   2. Latest with NO dates → any cached entry for the route
  //   3. Cheap Flights with NO dates → broader cache, sometimes has more
  //
  // If none of them return data, return null and let the caller fall back
  // to Claude masked stubs.
  const attempts: Array<{
    label: string;
    fn: () => Promise<TravelpayoutsLatestPriceEntry[] | null>;
  }> = [
    {
      label: "calendar",
      fn: () => fetchCalendar(body, originIata, destIata, token),
    },
    {
      label: "latest-nodate",
      fn: () => fetchLatest(body, originIata, destIata, token),
    },
    {
      label: "cheap-nodate",
      fn: () => fetchCheap(body, originIata, destIata, token),
    },
  ];

  for (const attempt of attempts) {
    try {
      const entries = await attempt.fn();
      if (entries && entries.length > 0) {
        const flights = entries
          .slice(0, 3)
          .map((e) => mapEntryToFlight(e, body, marker, originIata, destIata));
        console.log(
          `[travelpayouts] ${attempt.label} returned ${flights.length} real flights for ${originIata} → ${destIata}, cheapest $${Math.round(entries[0].price)}`
        );
        return flights;
      }
    } catch (e) {
      console.warn(
        `[travelpayouts] ${attempt.label} threw:`,
        e instanceof Error ? e.message : String(e)
      );
    }
  }

  console.warn(
    `[travelpayouts] No real data for ${originIata} → ${destIata} from any endpoint`
  );
  return null;
}

async function fetchCalendar(
  body: GenerateRequest,
  originIata: string,
  destIata: string,
  token: string
): Promise<TravelpayoutsLatestPriceEntry[] | null> {
  const params = new URLSearchParams({
    origin: originIata,
    destination: destIata,
    depart_date: body.startDate,
    return_date: body.endDate,
    currency: "usd",
    token,
  });
  const res = await fetch(
    `https://api.travelpayouts.com/v1/prices/calendar?${params}`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    success?: boolean;
    data?: Record<string, TravelpayoutsLatestPriceEntry>;
  };
  if (!data.success || !data.data) return null;
  const entries = Object.values(data.data).map((e) => ({
    ...e,
    origin: originIata,
    destination: destIata,
  }));
  if (entries.length === 0) return null;
  entries.sort((a, b) => a.price - b.price);
  return entries;
}

async function fetchLatest(
  body: GenerateRequest,
  originIata: string,
  destIata: string,
  token: string
): Promise<TravelpayoutsLatestPriceEntry[] | null> {
  // Note: omitting depart_date so we get any cached entry for the route,
  // not just exact-date matches. The Latest endpoint ignores the date
  // filter on free tier anyway, so this is consistent behavior.
  const params = new URLSearchParams({
    origin: originIata,
    destination: destIata,
    currency: "usd",
    limit: "5",
    sorting: "price",
    token,
  });
  const res = await fetch(
    `https://api.travelpayouts.com/v2/prices/latest?${params}`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    success?: boolean;
    // Latest v2 uses `value` instead of `price` for some entries
    data?: Array<
      TravelpayoutsLatestPriceEntry & { value?: number }
    >;
  };
  if (!data.success || !data.data || data.data.length === 0) return null;
  // Normalize value → price
  return data.data.map((e) => ({
    ...e,
    price: e.price ?? e.value ?? 0,
  })) as TravelpayoutsLatestPriceEntry[];
}

async function fetchCheap(
  body: GenerateRequest,
  originIata: string,
  destIata: string,
  token: string
): Promise<TravelpayoutsLatestPriceEntry[] | null> {
  const params = new URLSearchParams({
    origin: originIata,
    destination: destIata,
    currency: "usd",
    token,
  });
  const res = await fetch(
    `https://api.travelpayouts.com/v1/prices/cheap?${params}`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    success?: boolean;
    data?: Record<string, Record<string, TravelpayoutsLatestPriceEntry>>;
  };
  if (!data.success || !data.data) return null;
  const entries: TravelpayoutsLatestPriceEntry[] = [];
  for (const dest of Object.values(data.data)) {
    for (const entry of Object.values(dest)) {
      entries.push({
        ...entry,
        origin: originIata,
        destination: destIata,
      });
    }
  }
  if (entries.length === 0) return null;
  entries.sort((a, b) => a.price - b.price);
  return entries;
}

function mapEntryToFlight(
  entry: TravelpayoutsLatestPriceEntry,
  body: GenerateRequest,
  marker: string | undefined,
  originIata: string,
  destIata: string
): Flight {
  // Travelpayouts gives total trip price for round-trip. Already in USD
  // because we passed currency=usd.
  const price = `$${Math.round(entry.price)}`;
  const transfers = entry.transfers ?? 0;
  const departureIso = entry.departure_at || `${body.startDate}T08:00`;
  const returnIso = entry.return_at || `${body.endDate}T18:00`;

  // Prefer the marker-tagged Aviasales URL when we have a marker; falls
  // back to the Skyscanner deep-link otherwise.
  const bookingUrl = marker
    ? buildAviasalesUrl({
        origin: originIata,
        destination: destIata,
        departDate: body.startDate,
        returnDate: body.endDate,
        travelers: body.travelers || 1,
        marker,
      })
    : buildSkyscannerFlightUrl({
        originCity: body.originCity,
        destinationCity: body.destination,
        startDate: body.startDate,
        endDate: body.endDate,
        travelers: body.travelers,
        originAirport: originIata,
        destinationAirport: destIata,
      });

  return {
    airline: airlineNameFromCode(entry.airline) || entry.airline,
    departure: departureIso,
    arrival: returnIso,
    price,
    stops: transfers,
    originAirport: originIata,
    destinationAirport: destIata,
    bookingUrl,
  };
}

/**
 * Map common airline IATA codes (e.g. "UA", "BA", "AF") to friendly names.
 * Travelpayouts returns 2-letter airline codes; users want "United Airlines"
 * not "UA".
 */
const AIRLINE_NAMES: Record<string, string> = {
  AA: "American Airlines",
  AC: "Air Canada",
  AF: "Air France",
  AI: "Air India",
  AS: "Alaska Airlines",
  AY: "Finnair",
  AZ: "ITA Airways",
  BA: "British Airways",
  CA: "Air China",
  CI: "China Airlines",
  CX: "Cathay Pacific",
  CZ: "China Southern",
  DL: "Delta",
  EI: "Aer Lingus",
  EK: "Emirates",
  EY: "Etihad Airways",
  F9: "Frontier",
  FI: "Icelandair",
  FR: "Ryanair",
  G3: "GOL",
  GA: "Garuda Indonesia",
  HU: "Hainan Airlines",
  IB: "Iberia",
  JL: "Japan Airlines",
  KE: "Korean Air",
  KL: "KLM",
  LA: "LATAM",
  LH: "Lufthansa",
  LO: "LOT Polish",
  LX: "Swiss",
  MH: "Malaysia Airlines",
  MS: "EgyptAir",
  NH: "ANA",
  NK: "Spirit Airlines",
  OS: "Austrian Airlines",
  OZ: "Asiana Airlines",
  PR: "Philippine Airlines",
  QF: "Qantas",
  QR: "Qatar Airways",
  SA: "South African Airways",
  SK: "SAS",
  SQ: "Singapore Airlines",
  SU: "Aeroflot",
  TG: "Thai Airways",
  TK: "Turkish Airlines",
  TP: "TAP Portugal",
  UA: "United Airlines",
  UX: "Air Europa",
  VS: "Virgin Atlantic",
  VY: "Vueling",
  WN: "Southwest",
  WS: "WestJet",
  WY: "Oman Air",
  // Low-cost / regional that show up often
  U2: "easyJet",
  W6: "Wizz Air",
  PC: "Pegasus",
  XQ: "SunExpress",
  EW: "Eurowings",
  HV: "Transavia",
  DY: "Norwegian",
};

function airlineNameFromCode(code: string | undefined): string | null {
  if (!code) return null;
  return AIRLINE_NAMES[code.toUpperCase()] ?? null;
}
