import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { supabase } from "@/lib/supabase";
import { MOCK_TOKYO_ITINERARY } from "@/lib/mock-data";
import { isAdminRequest } from "@/lib/check-auth";
import {
  callClaudeWithUsage,
  estimateUsageCents,
  isClaudeConfigured,
} from "@/lib/claude-client";
import {
  addClaudeUsage,
  addTripCredits,
  consumeTripCredit,
  isDbConfigured,
} from "@/lib/db";
import { hasAnonCreditLeft, readAnonUsed } from "@/lib/anon-credits";
import { SignJWT } from "jose";
import {
  buildSkyscannerFlightUrl,
  buildSkyscannerHotelUrl,
} from "@/lib/skyscanner";
import { getAirportByIATA, searchAirports } from "@/lib/airports";
import { fetchTravelpayoutsFlights } from "@/lib/travelpayouts";
import { fetchSerpApiFlights } from "@/lib/serpapi";

import { JWT_SECRET } from "@/lib/jwt-secret";
import { MAX_TRIP_DAYS } from "@/lib/constants";

interface JwtPayload {
  email?: string;
  userId?: string;
  role?: string;
}

async function getCallerUserId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("daytrip-auth")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return (payload as JwtPayload).userId ?? null;
  } catch {
    return null;
  }
}

// Allow long Claude responses (up to 5 min) — the proxy calls Claude CLI
// which can take 60-120s for complex itineraries.
export const runtime = "nodejs";
export const maxDuration = 300;
import type {
  GenerateRequest,
  Itinerary,
  DayPlan,
  Activity,
  Hotel,
  Flight,
  ViatorTour,
} from "@/types/itinerary";

function generateId(): string {
  return crypto.randomUUID();
}

function generateShareId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function daysBetween(start: string, end: string): number {
  // Parse as local dates (split avoids timezone drift from "YYYY-MM-DD" being
  // interpreted as UTC midnight and falling back a day in negative timezones).
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const startDate = new Date(sy, (sm ?? 1) - 1, sd ?? 1);
  const endDate = new Date(ey, (em ?? 1) - 1, ed ?? 1);
  const ms = endDate.getTime() - startDate.getTime();
  // Inclusive: Oct 1 → Oct 4 is 4 days (Oct 1, 2, 3, 4), not 3.
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}

// ── External API helpers ──────────────────────────────────────────────

/**
 * Resolve a city name to its primary airport IATA code, using the static
 * airports dataset shipped with the app. Falls back to scanning by city
 * name for cases where the input is "Tokyo, Japan" or "New York City".
 */
function resolveIataForCity(cityOrAirport: string | undefined): string | null {
  if (!cityOrAirport) return null;
  const trimmed = cityOrAirport.trim();
  // If the input is already a 3-letter IATA code, use it directly.
  if (/^[A-Z]{3}$/i.test(trimmed)) {
    const exact = getAirportByIATA(trimmed);
    if (exact) return exact.iata;
  }
  // Strip "Tokyo, Japan" → "Tokyo" before searching
  const cityOnly = trimmed.split(",")[0].trim();
  const matches = searchAirports(cityOnly, 1);
  return matches[0]?.iata ?? null;
}

/**
 * Fetch real flight prices from Amadeus Self-Service API.
 *
 * Returns null if:
 *   - AMADEUS_API_KEY / AMADEUS_API_SECRET aren't set
 *   - We can't resolve origin or destination to a real IATA code
 *   - The Amadeus call fails for any reason (we fall back gracefully)
 *
 * Returns [outbound, return] when both legs are available, or just
 * [outbound] for one-way searches. Caller treats the second flight
 * as the return leg in postProcessFlights / injectFlightAndAirportTransfers.
 *
 * Sign up at https://developers.amadeus.com (free, 2K calls/month).
 */
async function fetchAmadeusFlights(
  body: GenerateRequest
): Promise<Flight[] | null> {
  const clientId = process.env.AMADEUS_API_KEY?.trim();
  const clientSecret = process.env.AMADEUS_API_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  // Resolve real IATA codes from the user's inputs.
  const originIata =
    body.originAirport?.toUpperCase() ||
    resolveIataForCity(body.originCity);
  const destIata =
    body.destinationAirport?.toUpperCase() ||
    resolveIataForCity(body.destination);

  if (!originIata || !destIata) {
    console.warn(
      `[amadeus] Could not resolve IATA codes — origin=${body.originCity ?? "?"} → ${originIata}, dest=${body.destination} → ${destIata}`
    );
    return null;
  }

  try {
    // OAuth token request
    const tokenRes = await fetch(
      "https://test.api.amadeus.com/v1/security/oauth2/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
        }),
      }
    );
    if (!tokenRes.ok) {
      console.warn(`[amadeus] OAuth failed: ${tokenRes.status}`);
      return null;
    }
    const { access_token } = await tokenRes.json();

    // Real flight offers search
    const params = new URLSearchParams({
      originLocationCode: originIata,
      destinationLocationCode: destIata,
      departureDate: body.startDate,
      returnDate: body.endDate,
      adults: String(body.travelers || 1),
      currencyCode: "USD",
      max: "5",
    });
    const flightRes = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?${params}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    if (!flightRes.ok) {
      console.warn(`[amadeus] flight-offers failed: ${flightRes.status}`);
      return null;
    }
    const flightData = await flightRes.json();
    const offers: unknown[] = flightData.data ?? [];
    if (offers.length === 0) {
      console.warn(`[amadeus] No flight offers for ${originIata} → ${destIata}`);
      return null;
    }

    // Convert Amadeus offers into our Flight shape. We treat each offer's
    // first itinerary as the outbound and the second as the return leg.
    const out: Flight[] = [];
    const top = offers[0] as Record<string, unknown>;
    const itineraries = (top as any).itineraries ?? [];
    const totalPrice = (top as any).price?.total
      ? `$${Number((top as any).price.total).toFixed(0)}`
      : "—";

    for (const itin of itineraries) {
      const segs = (itin as any).segments ?? [];
      const firstSeg = segs[0];
      const lastSeg = segs[segs.length - 1];
      if (!firstSeg) continue;
      out.push({
        airline: firstSeg.carrierCode ?? "—",
        departure: firstSeg.departure?.at ?? body.startDate,
        arrival: lastSeg?.arrival?.at ?? firstSeg.arrival?.at ?? body.startDate,
        price: totalPrice,
        stops: Math.max(0, segs.length - 1),
        originAirport: firstSeg.departure?.iataCode ?? originIata,
        destinationAirport:
          lastSeg?.arrival?.iataCode ?? destIata,
        bookingUrl: buildSkyscannerFlightUrl({
          originCity: body.originCity,
          destinationCity: body.destination,
          startDate: body.startDate,
          endDate: body.endDate,
          travelers: body.travelers,
          originAirport: firstSeg.departure?.iataCode ?? originIata,
          destinationAirport:
            lastSeg?.arrival?.iataCode ?? destIata,
        }),
      });
    }
    console.log(
      `[amadeus] Fetched ${out.length} real flight legs for ${originIata} → ${destIata}: ${totalPrice}`
    );
    return out;
  } catch (e) {
    console.warn(
      "[amadeus] flight fetch threw:",
      e instanceof Error ? e.message : String(e)
    );
    return null;
  }
}

async function fetchFoursquarePlaces(
  destination: string
): Promise<string[] | null> {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      query: destination,
      categories: "16000,13065,10000",
      limit: "10",
    });
    const res = await fetch(
      `https://api.foursquare.com/v3/places/search?${params}`,
      {
        headers: {
          Authorization: apiKey,
          Accept: "application/json",
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.results ?? []).map(
      (p: Record<string, unknown>) => (p as any).name as string
    );
  } catch {
    return null;
  }
}

async function fetchYelpRestaurants(
  destination: string
): Promise<string[] | null> {
  const apiKey = process.env.YELP_API_KEY;
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      location: destination,
      categories: "restaurants",
      sort_by: "rating",
      limit: "10",
    });
    const res = await fetch(
      `https://api.yelp.com/v3/businesses/search?${params}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.businesses ?? []).map(
      (b: Record<string, unknown>) => (b as any).name as string
    );
  } catch {
    return null;
  }
}

async function fetchUnsplashImage(
  destination: string
): Promise<string | null> {
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

/**
 * Fetch a representative image from Wikipedia for a real place.
 *
 * Uses the MediaWiki search API which handles disambiguation automatically:
 * search for the destination with a "city" hint, get the top page result,
 * pull its `original` image from `prop=pageimages`. Skips disambiguation
 * pages. No API key required.
 *
 * Returns null for fake/nonexistent places.
 */
async function fetchWikipediaImage(
  destination: string
): Promise<string | null> {
  // Candidate search queries in order of preference. Adding "city" as a hint
  // helps Wikipedia disambiguate common state-vs-city cases (e.g. "New York"
  // → the disambiguation page vs "New York city" → New York City article).
  const primary = destination.split(",")[0]?.trim() || destination.trim();
  const candidates = Array.from(
    new Set([
      `${primary} city`,
      primary,
      destination.trim(),
    ].filter((s) => !!s && s.length > 0))
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
          "User-Agent": "Daytrip/1.0 (https://daytrip-five.vercel.app)",
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
      // Pages are keyed by pageid; sort by search index so we get top match
      pages.sort((a, b) => (a.index ?? 99) - (b.index ?? 99));

      for (const page of pages) {
        if (page.pageprops?.disambiguation !== undefined) continue;
        const src = page.original?.source;
        if (src && src.startsWith("https://")) {
          return src;
        }
      }
    } catch {
      // try next candidate
    }
  }

  return null;
}

/** Try Unsplash first (nicer photos), fall back to Wikipedia (free, no key). */
async function fetchHeroImage(destination: string): Promise<string | null> {
  const unsplash = await fetchUnsplashImage(destination);
  if (unsplash) return unsplash;
  return fetchWikipediaImage(destination);
}

// ── Claude itinerary generation ───────────────────────────────────────

function stripJsonFences(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (fenceMatch ? fenceMatch[1] : text).trim();
}

/**
 * Turn a $/day budget into a human-readable hint for Claude that also sets
 * realistic expectations about what kind of hotels/restaurants to suggest.
 *
 * Buckets:
 *   - under $60/day   → shoestring (hostels, street food, free attractions)
 *   - $60-$150/day    → budget (3-star hotels, casual restaurants, <$20 lunch)
 *   - $150-$300/day   → mid-range (4-star hotels, mid-range restaurants)
 *   - $300-$600/day   → upscale (boutique hotels, fine dining)
 *   - $600+/day       → luxury (5-star, tasting menus, private experiences)
 */
function budgetContextLine(budgetPerDay: number): string {
  let label: string;
  let hotelHint: string;
  let mealHint: string;
  if (budgetPerDay < 60) {
    label = "shoestring";
    hotelHint = "hostels or $40-60/night guesthouses";
    mealHint = "street food and cheap eats under $10";
  } else if (budgetPerDay < 150) {
    label = "budget";
    hotelHint = "3-star hotels around $80-130/night";
    mealHint = "casual restaurants with mains under $20";
  } else if (budgetPerDay < 300) {
    label = "mid-range";
    hotelHint = "4-star boutique or chain hotels $150-250/night";
    mealHint = "mid-range restaurants with mains $15-35";
  } else if (budgetPerDay < 600) {
    label = "upscale";
    hotelHint = "boutique or upscale hotels $300-450/night";
    mealHint = "fine dining with mains $40-80";
  } else {
    label = "luxury";
    hotelHint = "5-star luxury hotels $500+/night";
    mealHint = "tasting menus and Michelin-level dinners $100+ per person";
  }
  return `Budget: ~$${budgetPerDay}/person/day (${label} traveler). Pick ${hotelHint} and ${mealHint}. Do NOT recommend places that would blow this budget.`;
}

/**
 * Describe the trip style for Claude. Prefers the multi-select `styles` array
 * (e.g. "Cultural + Relaxation") and falls back to the single `style` string
 * for backwards compatibility with any caller that hasn't been upgraded yet.
 */
function styleDescriptor(req: GenerateRequest): string {
  if (req.styles && req.styles.length > 0) {
    return req.styles.join(" + ");
  }
  return req.style;
}

/**
 * Build an extra prompt line describing the selected regions, if any. Region
 * selection means the user hasn't picked a specific city — Claude should pick
 * cities within those regions that match the style and budget.
 */
function regionContextLine(req: GenerateRequest): string {
  if (!req.regions || req.regions.length === 0) return "";
  const list = req.regions.join(", ");
  return `\nRegion focus: the traveler wants a trip in ${list}. If the destination label is one of these regions (not a specific city), pick the best-fitting real cities within ${list} for the chosen style and budget, and build the itinerary around them. All places must be within cities in ${list}.`;
}

/**
 * For long region trips (e.g. "47 days in Eastern Europe"), ask Claude
 * once — upfront, cheaply — to break the trip into a realistic multi-city
 * itinerary. Returns a map from dayNumber → city so each parallel day
 * chunk plans against a single concrete city instead of the whole region.
 *
 * Returns null when:
 *   - no regions selected (the user already picked a specific city)
 *   - trip is too short to be worth multi-city planning
 *   - the Claude call fails or returns garbage — caller falls back to the
 *     existing region-prompt behavior
 */
async function planCityItinerary(
  req: GenerateRequest,
  numDays: number,
  userId: string | null
): Promise<Map<number, string> | null> {
  if (!req.regions || req.regions.length === 0) return null;
  if (numDays < 14) return null;

  const regionList = req.regions.join(", ");
  const budgetLine = req.budgetPerDay
    ? budgetContextLine(req.budgetPerDay)
    : "";

  const system = `Travel editor. Output ONLY a JSON array. No prose, no markdown. Real cities only.`;
  const prompt = `Plan a ${numDays}-day ${styleDescriptor(req)} trip covering ${regionList}. Dates: ${req.startDate} to ${req.endDate}.${budgetLine ? "\n" + budgetLine : ""}

Pick 4–8 real cities inside ${regionList} that flow well geographically (travelers will move between them). Assign each city a contiguous span of days that sums to exactly ${numDays}. Favor cities that actually exist in ${regionList} and match the chosen style and budget.

Return a JSON array in this exact shape:
[{"city":"Prague","country":"Czech Republic","startDay":1,"endDay":5},{"city":"Budapest","country":"Hungary","startDay":6,"endDay":10}]

Rules:
- Every city must be a real city in ${regionList}.
- Day ranges must be contiguous, non-overlapping, and cover every day from 1 to ${numDays} with no gaps.
- 4–8 cities total. More cities for longer trips; fewer for shorter ones.
- Group neighboring cities so travelers don't zigzag across the region.`;

  try {
    const { text, usage } = await callClaudeWithUsage({
      system,
      prompt,
      model: "claude-sonnet-4-6",
      maxTokens: 1000,
    });
    if (userId) {
      addClaudeUsage(userId, estimateUsageCents(usage)).catch(() => undefined);
    }
    const parsed = JSON.parse(stripJsonFences(text));
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    const cityByDay = new Map<number, string>();
    for (const entry of parsed as Array<{
      city?: string;
      startDay?: number;
      endDay?: number;
    }>) {
      const city = typeof entry?.city === "string" ? entry.city.trim() : "";
      const startDay = Number(entry?.startDay);
      const endDay = Number(entry?.endDay);
      if (!city || !Number.isFinite(startDay) || !Number.isFinite(endDay)) continue;
      for (let d = startDay; d <= endDay; d++) {
        if (d >= 1 && d <= numDays) cityByDay.set(d, city);
      }
    }
    // If the coordinator returned too few days covered, abandon it so we
    // fall back to the old region-prompt path instead of a partial plan.
    if (cityByDay.size < numDays * 0.8) {
      console.warn(
        `[generate] City coordinator covered ${cityByDay.size}/${numDays} days — falling back to region prompt`
      );
      return null;
    }
    console.log(
      `[generate] City coordinator assigned ${cityByDay.size} days across ${new Set(cityByDay.values()).size} cities`
    );
    return cityByDay;
  } catch (e) {
    console.warn(
      "[generate] City coordinator failed:",
      e instanceof Error ? e.message : String(e)
    );
    return null;
  }
}

/**
 * Generate a contiguous chunk of days. The chunk is described with absolute
 * day numbers + dates so Sonnet can plan distances correctly even when the
 * trip is split across multiple calls. The optional `forbiddenPlaces` list
 * tells Claude which place names have already been used by an earlier
 * chunk, so day 4-7 don't repeat day 1-3's activities. When
 * `localDestination` is provided (from the city-coordinator), the chunk
 * plans inside that specific city instead of the broader req.destination.
 */
async function generateDayChunk(
  req: GenerateRequest,
  dayNumbers: number[],
  dates: string[],
  userId: string | null,
  forbiddenPlaces: string[] = [],
  localDestination?: string
): Promise<DayPlan[]> {
  const numDays = dayNumbers.length;
  // When a specific city was chosen by the city-coordinator (long region
  // trips), pin this chunk to that city. Otherwise fall back to the
  // user-supplied destination label (which may be a city or a region).
  const effectiveDestination = localDestination ?? req.destination;
  const system = `Travel editor. Output ONLY a JSON array. No prose, no markdown. Real places, real distances. Every single activity name across the entire itinerary MUST be unique — never repeat a restaurant, attraction, neighborhood walk, or experience.`;
  const budgetLine = req.budgetPerDay
    ? budgetContextLine(req.budgetPerDay)
    : "";

  // If we already generated activities in an earlier chunk of the same trip,
  // explicitly forbid them so Claude can't repeat itself. Uses compact
  // comma-separated format to save tokens on long trips.
  const forbiddenLine =
    forbiddenPlaces.length > 0
      ? `\n\nFORBIDDEN (already used in this trip — never repeat): ${forbiddenPlaces.join(", ")}\n\nPick completely different restaurants, attractions, neighborhoods, and experiences.`
      : "";

  // When a localDestination is pinned we've already committed this chunk
  // to a single city, so the region-context line (which says "pick cities
  // within the region") becomes noise. Skip it in that case.
  const regionLine = localDestination ? "" : regionContextLine(req);

  const prompt = `${styleDescriptor(req)} trip to ${effectiveDestination}. Days ${dayNumbers[0]}–${
    dayNumbers[dayNumbers.length - 1]
  } (of a longer itinerary). Dates: ${dates.join(", ")}.${budgetLine ? "\n" + budgetLine : ""}${regionLine}${forbiddenLine}

Return a JSON array of ${numDays} day objects:
[{"dayNumber":N,"date":"YYYY-MM-DD","title":"short","morning":[Activity,Activity],"afternoon":[Activity,Activity],"evening":[Activity,Activity],"tip":"one tip"}]

Activity = {
  "time":"HH:MM",
  "name":"real place name",
  "category":"food|culture|nature|shopping|entertainment|transport",
  "description":"one vivid sentence",
  "duration":"Xh",
  "distanceFromPrevious":"X.X km",
  "walkingTime":"X min"
}

Rules:
- Exactly ${numDays} day objects with the dayNumber values: ${dayNumbers.join(", ")}
- 2 activities per time block
- Real place names with accurate locations
- Group activities by geography to minimize travel time
- For every activity AFTER the first in a block, fill in distanceFromPrevious (e.g. "0.6 km") and walkingTime (e.g. "8 min walk" or "12 min by metro" if too far to walk)
- Skip distance/walking on the first activity of each time block
- For transport-category activities (airport, train, etc), omit distance fields
- Keep descriptions short and specific
- DO NOT include the arrival or departure flight, airport-to-hotel transfer, or hotel-to-airport transfer in any block — those are added separately by the system. Day 1 morning should start with the FIRST in-destination activity. The last day's evening should end with the LAST in-destination activity.

UNIQUENESS RULES (CRITICAL — NEVER VIOLATE):
- Every single activity name across this whole chunk must be UNIQUE. Two different days cannot list the same restaurant, the same neighborhood walk, the same museum, the same park, the same viewpoint. Each is used exactly once.
- Two days within this chunk cannot have the same title, the same theme, or substantially overlapping content.
- If a destination only has a handful of "must-see" spots and you'd be tempted to repeat one, instead branch out: pick a quieter alternative, a different neighborhood, a less-touristy version of the same category.

GEOGRAPHY RULES (CRITICAL — NEVER VIOLATE):
- Every single place must be PHYSICALLY LOCATED in ${effectiveDestination}. Not "near", not "famous nationwide", not "in the same country". In the actual city limits or metro area of ${effectiveDestination}.
- Do NOT include restaurants, hotels, or attractions from OTHER cities, even if they are famous or thematically related. Example: for a New York trip, do not include Zahav (Philadelphia), Shake Shack in Las Vegas, or an Uri Scheft location in Tel Aviv.
- If you are not 100% certain a place exists in ${effectiveDestination}, do NOT include it. Pick a different real place you are sure about instead.
- For walking distances to make sense, every two consecutive activities must be within reasonable local travel time of each other.

Meal rules (CRITICAL):
- MORNING food = breakfast or brunch ONLY. Cafés, bakeries, pastries, eggs, bagels, pancakes, congee, dim sum, pastéis de nata, hummus brunch, etc. Never dinner food at breakfast.
- AFTERNOON food = lunch. Sandwiches, ramen, tacos, salads, light plates, pizza, sushi at lunch counter, etc. Not heavy multi-course dinners.
- EVENING food = dinner. Full restaurants, tasting menus, steakhouses, izakaya, wine bars, etc.
- Match cuisine to the time of day: no steak for breakfast, no cereal for dinner, no kaiseki at 9am.
- If a famous spot is all-day, still pick the time block where it makes most sense.`;

  // Scale token budget with chunk size: ~600 tokens per day covers 6
  // activities with all their fields. Capped at 8000 to stay reasonable.
  const maxTokens = Math.min(numDays * 600, 8000);

  const { text, usage } = await callClaudeWithUsage({
    system,
    prompt,
    model: "claude-sonnet-4-6",
    maxTokens,
  });
  if (userId) {
    addClaudeUsage(userId, estimateUsageCents(usage)).catch(() => undefined);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFences(text));
  } catch (err) {
    console.error(
      "[generate] Claude returned malformed JSON for day chunk:",
      String(text).slice(0, 500)
    );
    throw new Error(
      "Claude returned an invalid day-chunk format. Please try again."
    );
  }
  return Array.isArray(parsed) ? parsed : [];
}

/**
 * First Claude call: generate the days array. For long trips (>7 days) we
 * split into 7-day chunks and fire them in parallel — Claude Sonnet's
 * per-call latency is the floor, so a 47-day trip finishes in roughly the
 * time of one chunk (~15s) instead of seven sequential chunks (~84s).
 *
 * Tradeoff: parallel chunks can't share a forbidden-places window the way
 * sequential ones did. `dedupeDays()` is the safety net that renames or
 * drops duplicate activity names across the whole itinerary. When
 * `cityByDay` is provided (from `planCityItinerary`), each chunk pins its
 * days to a specific real city inside the user's region(s), so even
 * independent chunks pick geographically disjoint places.
 */
async function generateDays(
  req: GenerateRequest,
  numDays: number,
  userId: string | null,
  onChunkComplete?: (completedDays: number, totalDays: number) => void,
  cityByDay?: Map<number, string>
): Promise<DayPlan[]> {
  const CHUNK_SIZE = 7;
  const MAX_RETRIES = 2;
  const PER_CHUNK_TIMEOUT_MS = 60_000;

  // Build absolute date list
  const allDates: string[] = [];
  const [sy, sm, sd] = req.startDate.split("-").map(Number);
  for (let i = 0; i < numDays; i++) {
    const d = new Date(sy, (sm ?? 1) - 1, (sd ?? 1) + i);
    allDates.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`
    );
  }
  const allDayNumbers = Array.from({ length: numDays }, (_, i) => i + 1);

  // Wraps generateDayChunk with per-attempt timeout + bounded retries so
  // one slow Claude call can't stall the whole Promise.all.
  const runChunkWithRetry = async (
    dayNumbers: number[],
    dates: string[],
    localDestination?: string
  ): Promise<DayPlan[]> => {
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const chunkPromise = generateDayChunk(
          req,
          dayNumbers,
          dates,
          userId,
          [],
          localDestination
        );
        const timeoutPromise = new Promise<DayPlan[]>((_, reject) =>
          setTimeout(
            () => reject(new Error("chunk_timeout")),
            PER_CHUNK_TIMEOUT_MS
          )
        );
        return await Promise.race([chunkPromise, timeoutPromise]);
      } catch (e) {
        lastError = e;
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("Day chunk generation failed");
  };

  // Short trips: single call.
  if (numDays <= CHUNK_SIZE) {
    const localDest = cityByDay
      ? pickDominantCity(allDayNumbers, cityByDay)
      : undefined;
    const single = await runChunkWithRetry(allDayNumbers, allDates, localDest);
    onChunkComplete?.(numDays, numDays);
    return dedupeDays(single);
  }

  // Long trips: split into chunks of up to CHUNK_SIZE days and fire all in
  // parallel. Wall-clock ≈ slowest chunk instead of sum of all chunks.
  const chunkRanges: Array<{
    dayNumbers: number[];
    dates: string[];
    localDestination?: string;
  }> = [];
  for (let offset = 0; offset < numDays; offset += CHUNK_SIZE) {
    const end = Math.min(offset + CHUNK_SIZE, numDays);
    const dayNumbers = allDayNumbers.slice(offset, end);
    const dates = allDates.slice(offset, end);
    chunkRanges.push({
      dayNumbers,
      dates,
      localDestination: cityByDay
        ? pickDominantCity(dayNumbers, cityByDay)
        : undefined,
    });
  }

  // Track completed-day progress for the NDJSON `progress` event. Chunks
  // finish in arbitrary order, so we accumulate day counts instead of
  // reporting a monotonic left-to-right boundary.
  let completedDays = 0;
  const chunkPromises = chunkRanges.map(
    async ({ dayNumbers, dates, localDestination }) => {
      const chunk = await runChunkWithRetry(dayNumbers, dates, localDestination);
      completedDays += dayNumbers.length;
      onChunkComplete?.(completedDays, numDays);
      return { dayNumbers, chunk };
    }
  );

  const results = await Promise.all(chunkPromises);

  // Reassemble chunks in day-number order so the final itinerary reads
  // Day 1 → Day N regardless of which chunk resolved first.
  results.sort((a, b) => (a.dayNumbers[0] ?? 0) - (b.dayNumbers[0] ?? 0));
  const allDays: DayPlan[] = results.flatMap((r) => r.chunk);

  return dedupeDays(allDays);
}

/**
 * Given a chunk's day numbers and the cityByDay map from planCityItinerary,
 * return the city that covers the most days in the chunk. This lets each
 * parallel chunk plan against a single, concrete city instead of the
 * whole region label.
 */
function pickDominantCity(
  dayNumbers: number[],
  cityByDay: Map<number, string>
): string | undefined {
  const counts = new Map<string, number>();
  for (const d of dayNumbers) {
    const city = cityByDay.get(d);
    if (!city) continue;
    counts.set(city, (counts.get(city) ?? 0) + 1);
  }
  let bestCity: string | undefined;
  let bestCount = 0;
  for (const [city, count] of counts) {
    if (count > bestCount) {
      bestCity = city;
      bestCount = count;
    }
  }
  return bestCity;
}

/**
 * Pull out every non-transport activity name from a list of days, so we
 * can hand the list to a follow-up generateDayChunk call as the
 * "forbidden" list. Returns trimmed, de-duplicated names.
 */
function collectPlaceNames(days: DayPlan[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const day of days) {
    for (const block of [day.morning, day.afternoon, day.evening]) {
      if (!Array.isArray(block)) continue;
      for (const act of block) {
        if (!act || act.category === "transport") continue;
        const name = (act.name ?? "").trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(name);
      }
    }
  }
  return out;
}

/**
 * Post-process safety net: even with the forbidden-list trick + system
 * prompt rules, Claude can still occasionally repeat a place name across
 * days (especially in long trips to small destinations). Walk every
 * activity in order and, on a duplicate, either drop it (if the time
 * block already has another activity) or rename it with a "(alternate)"
 * suffix so the user at least sees something distinct. Transport rows
 * are exempt — those are airport transfers added by the system layer.
 */
function dedupeDays(days: DayPlan[]): DayPlan[] {
  const seen = new Set<string>();
  for (const day of days) {
    for (const blockKey of ["morning", "afternoon", "evening"] as const) {
      const block = day[blockKey];
      if (!Array.isArray(block)) continue;
      const kept: Activity[] = [];
      for (const act of block) {
        if (!act) continue;
        if (act.category === "transport") {
          kept.push(act);
          continue;
        }
        const name = (act.name ?? "").trim();
        const key = name.toLowerCase();
        if (!key) {
          kept.push(act);
          continue;
        }
        if (!seen.has(key)) {
          seen.add(key);
          kept.push(act);
          continue;
        }
        // Duplicate detected. If this block still has other activities
        // (or will), drop the dup entirely. Otherwise keep a renamed
        // version so the user doesn't see an empty block.
        const remainingInBlock =
          kept.filter((a) => a.category !== "transport").length;
        if (remainingInBlock >= 1) {
          // already have at least one real activity in this block, drop
          continue;
        }
        // Rename so it at least reads as distinct from the original
        const renamed: Activity = {
          ...act,
          name: `${name} (alternate spot nearby)`,
          description: act.description,
        };
        const renamedKey = renamed.name.toLowerCase();
        if (!seen.has(renamedKey)) {
          seen.add(renamedKey);
          kept.push(renamed);
        }
      }
      (day[blockKey] as Activity[]) = kept;
    }
  }
  return days;
}

/** Second Claude call: hotels, flights, tours, tips. Fast (small response). */
async function generateBookingData(
  req: GenerateRequest,
  userId: string | null
): Promise<{
  hotels: Hotel[];
  flights: Flight[];
  tours: ViatorTour[];
  tips: string[];
}> {
  const system = `Travel editor. Output ONLY a single JSON object. No prose, no markdown. Real airlines, real hotels.`;
  const originLine = req.originCity
    ? `Origin: ${req.originCity}.`
    : `No origin city specified.`;
  // If the user explicitly picked an airport in the autocomplete, pin it —
  // otherwise Claude might pick a nearby one (LGA instead of JFK, etc.)
  // and the Skyscanner deep link would be wrong.
  const airportLine =
    req.originAirport || req.destinationAirport
      ? `REQUIRED airports: ${
          req.originAirport ? `origin must be ${req.originAirport}` : ""
        }${req.originAirport && req.destinationAirport ? ", " : ""}${
          req.destinationAirport
            ? `destination must be ${req.destinationAirport}`
            : ""
        }.`
      : "";
  const budgetLine = req.budgetPerDay
    ? budgetContextLine(req.budgetPerDay)
    : "";
  const prompt = `Trip to ${req.destination}, ${req.startDate} to ${req.endDate}, ${req.travelers} travelers, ${styleDescriptor(req)} style. ${originLine}${airportLine ? " " + airportLine : ""}${budgetLine ? "\n" + budgetLine : ""}${regionContextLine(req)}

Output this exact JSON object:
{"hotels":[{"name":"real hotel","pricePerNight":"$X","rating":4.5},{"name":"","pricePerNight":"$X","rating":4.5},{"name":"","pricePerNight":"$X","rating":4.5}],"flights":[{"airline":"real airline","departure":"","arrival":"","price":"$X","stops":0,"originAirport":"IATA","destinationAirport":"IATA"},{"airline":"","departure":"","arrival":"","price":"$X","stops":0,"originAirport":"IATA","destinationAirport":"IATA"}],"tours":[{"name":"real tour","price":"$X","duration":"","rating":4.5},{"name":"","price":"$X","duration":"","rating":4.5},{"name":"","price":"$X","duration":"","rating":4.5}],"tips":["","","",""]}

Rules:
- 3 real hotels at different price points in ${req.destination}
- 2 real airlines flying ${req.originCity ?? "anywhere"} → ${req.destination} with correct IATA codes${
    req.originAirport ? ` (origin MUST be ${req.originAirport})` : ""
  }${
    req.destinationAirport
      ? ` (destination MUST be ${req.destinationAirport})`
      : ""
  }
- 3 real tours/experiences in ${req.destination}
- 4 practical travel tips for ${req.destination}`;

  const { text, usage } = await callClaudeWithUsage({
    system,
    prompt,
    model: "claude-sonnet-4-6",
    maxTokens: 1500,
  });
  if (userId) {
    addClaudeUsage(userId, estimateUsageCents(usage)).catch(() => undefined);
  }
  let parsed: {
    hotels?: unknown[];
    flights?: unknown[];
    tours?: unknown[];
    tips?: unknown[];
  };
  try {
    parsed = JSON.parse(stripJsonFences(text));
  } catch (err) {
    console.error(
      "[generate] Claude returned malformed JSON for booking data:",
      String(text).slice(0, 500)
    );
    throw new Error(
      "Claude returned invalid booking data. Please try again."
    );
  }
  return {
    hotels: parsed.hotels ?? [],
    flights: parsed.flights ?? [],
    tours: parsed.tours ?? [],
    tips: parsed.tips ?? [],
  };
}

// ── Supabase storage ──────────────────────────────────────────────────

async function storeItinerary(
  itinerary: Itinerary
): Promise<string> {
  if (!supabase) {
    return itinerary.shareId;
  }

  try {
    const { error } = await supabase.from("itineraries").insert({
      id: itinerary.id,
      share_id: itinerary.shareId,
      destination: itinerary.destination,
      start_date: itinerary.startDate,
      end_date: itinerary.endDate,
      travelers: itinerary.travelers,
      travel_style: itinerary.travelStyle,
      budget: itinerary.budget,
      itinerary_data: itinerary,
      view_count: 0,
    });

    if (error) {
      console.error("Supabase insert error:", error.message);
    }
  } catch (err) {
    console.error("Supabase storage failed, continuing without persistence:", err);
  }

  return itinerary.shareId;
}

// ── POST handler — streaming NDJSON ────────────────────────────────────
//
// Response is a stream of newline-delimited JSON events. Each line is a
// JSON object with a `type` field. The client reads them as they arrive
// and updates the UI progressively.
//
// Event types (in order):
//   1. {"type":"start", numDays, destination}                       — meta
//   2. {"type":"hero", heroImage}                                    — image
//   3. {"type":"days", days[]}                                        — itinerary
//   4. {"type":"booking", hotels, flights, tours, tips}              — sidebar
//   5. {"type":"done", itinerary}                                    — final assembled

function postProcessFlights(
  body: GenerateRequest,
  flights: Flight[]
): Flight[] {
  // If the user explicitly picked an airport in the autocomplete, that
  // choice overrides anything Claude guessed. We also stamp it onto each
  // returned flight so the card shows the right IATA code.
  const pinnedOrigin = body.originAirport?.toUpperCase();
  const pinnedDest = body.destinationAirport?.toUpperCase();

  const out = flights.map((f) => {
    const originAirport = pinnedOrigin ?? f.originAirport;
    const destinationAirport = pinnedDest ?? f.destinationAirport;
    return {
      ...f,
      originAirport,
      destinationAirport,
      bookingUrl: buildSkyscannerFlightUrl({
        originCity: body.originCity,
        destinationCity: body.destination,
        startDate: body.startDate,
        endDate: body.endDate,
        travelers: body.travelers,
        originAirport,
        destinationAirport,
      }),
    };
  });
  if (out.length === 0) {
    out.push({
      airline: "Search on Skyscanner",
      departure: body.originCity ?? "Departure",
      arrival: body.destination,
      price: "—",
      stops: 0,
      originAirport: pinnedOrigin,
      destinationAirport: pinnedDest,
      bookingUrl: buildSkyscannerFlightUrl({
        originCity: body.originCity,
        destinationCity: body.destination,
        startDate: body.startDate,
        endDate: body.endDate,
        travelers: body.travelers,
        originAirport: pinnedOrigin,
        destinationAirport: pinnedDest,
      }),
    });
  }
  return out;
}

/**
 * Pick the right flights to surface to the UI. Priority order:
 *
 *   1. **SerpAPI Google Flights** — REAL Google Flights data for ANY
 *      route. Universal coverage. Paid: 100 free queries/mo, then
 *      $50/mo for 5K. Primary path when SERPAPI_KEY is configured.
 *   2. **Travelpayouts** — real cached prices from Aviasales, includes
 *      affiliate marker for revenue. Free, but spotty coverage —
 *      mostly major routes from US East Coast hubs.
 *   3. **Amadeus** — real live prices from Self-Service API. Being
 *      decommissioned by Amadeus on 2026-07-17 but kept as a backstop
 *      in case we have a key set.
 *   4. **Claude masked stubs** — last-resort fallback when no real-data
 *      provider is configured / all returned empty. Replaces the
 *      invented price with the string "See live prices" so users aren't
 *      misled, then funnels them through the Skyscanner deep-link.
 *
 * The result of every path is run through postProcessFlights so the
 * Skyscanner-fallback URL uses any pinned-airport overrides from the
 * user's autocomplete selection.
 */
function pickFlights(
  body: GenerateRequest,
  serpapi: Flight[] | null,
  travelpayouts: Flight[] | null,
  amadeus: Flight[] | null,
  claudeFlights: Flight[]
): Flight[] {
  if (serpapi && serpapi.length > 0) {
    return postProcessFlights(body, serpapi);
  }
  if (travelpayouts && travelpayouts.length > 0) {
    return postProcessFlights(body, travelpayouts);
  }
  if (amadeus && amadeus.length > 0) {
    return postProcessFlights(body, amadeus);
  }
  // No real-data provider configured — mask Claude's invented prices.
  const masked = claudeFlights.map((f) => ({
    ...f,
    price: "See live prices",
  }));
  return postProcessFlights(body, masked);
}

function postProcessHotels(body: GenerateRequest, hotels: Hotel[]): Hotel[] {
  return hotels.map((h) => ({
    ...h,
    bookingUrl: buildSkyscannerHotelUrl({
      destinationCity: body.destination,
      startDate: body.startDate,
      endDate: body.endDate,
      travelers: body.travelers,
    }),
  }));
}

// ── Inject flight + airport-transfer activities into the day plan ────
//
// Travelers expect to see their actual journey reflected in the day-by-day:
// the outbound flight + airport-to-hotel transfer at the start of Day 1,
// and the hotel-to-airport transfer + return flight at the end of the last
// day. We don't want Claude inventing flight times (the prompt now tells
// it to skip these), so we synthesize the activities here from the booking
// flights data + the user's origin/destination airport choices.

function formatTimeFromIso(iso: string | undefined): string | null {
  if (!iso) return null;
  // Booking flights use ISO-ish strings like "2026-06-15T10:00".
  const m = iso.match(/T(\d{1,2}:\d{2})/);
  if (!m) return null;
  // Pad to HH:MM
  const [h, mm] = m[1].split(":");
  return `${h.padStart(2, "0")}:${mm}`;
}

function subtractHoursFromTime(time: string, hours: number): string {
  const [h, m] = time.split(":").map(Number);
  let newH = h - hours;
  if (newH < 0) newH = 0;
  return `${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function injectFlightAndAirportTransfers(
  days: DayPlan[],
  body: GenerateRequest,
  flights: Flight[]
): DayPlan[] {
  if (days.length === 0) return days;

  const cityName =
    body.destination.split(",")[0]?.trim() || body.destination;
  // Treat the first flight as outbound and the second (if any) as return.
  // Claude often only generates outbound options; we synthesize the return.
  const outbound = flights[0];
  const returnFlight = flights[1];

  const destAirportCode =
    body.destinationAirport?.toUpperCase() || outbound?.destinationAirport;
  const originAirportCode =
    body.originAirport?.toUpperCase() || outbound?.originAirport;
  const originLabel = body.originCity || originAirportCode || "your origin";
  const destAirportLabel = destAirportCode
    ? destAirportCode
    : `${cityName} airport`;

  // ─── Day 1: outbound flight + airport-to-hotel transfer ───
  const day1 = days[0];
  if (day1) {
    const departureTime = formatTimeFromIso(outbound?.departure) || "08:00";
    const arrivalTime = formatTimeFromIso(outbound?.arrival) || "11:00";

    const flightActivity: Activity = {
      time: departureTime,
      name: outbound
        ? `${outbound.airline} ${outbound.originAirport ?? originAirportCode ?? ""}${
            outbound.destinationAirport
              ? ` → ${outbound.destinationAirport}`
              : ""
          }`.trim()
        : `Flight to ${cityName}`,
      category: "transport",
      description: outbound
        ? `${outbound.airline} from ${originLabel}${
            outbound.originAirport ? ` (${outbound.originAirport})` : ""
          }, departing ${departureTime}, arriving ${arrivalTime} at ${destAirportLabel}.${
            outbound.stops === 0
              ? " Direct flight."
              : outbound.stops
                ? ` ${outbound.stops} stop${outbound.stops > 1 ? "s" : ""}.`
                : ""
          }`
        : `Outbound flight from ${originLabel} to ${cityName}.`,
      duration: outbound?.stops === 0 ? "Direct" : "Flight",
      bookingUrl: outbound?.bookingUrl,
      bookingPrice: outbound?.price,
      distanceFromPrevious: "",
      walkingTime: "",
    };

    const transferActivity: Activity = {
      time: arrivalTime,
      name: `Transfer from ${destAirportLabel} to your hotel`,
      category: "transport",
      description: `Pick up your bags, clear customs and immigration, then take a taxi, train, or pre-booked transfer (~30–60 minutes) from ${destAirportLabel} into central ${cityName} to drop your luggage at your hotel before the day begins.`,
      duration: "1h",
      distanceFromPrevious: "",
      walkingTime: "",
    };

    day1.morning = [
      flightActivity,
      transferActivity,
      ...(day1.morning || []),
    ];
  }

  // ─── Last day: hotel-to-airport transfer + return flight ───
  // Only inject if we have at least one day (which we already checked)
  // and the trip isn't a single day (a 1-day trip would have outbound and
  // return on the same Day 1, which we'd append to the same day's evening).
  const lastDay = days[days.length - 1];
  if (lastDay) {
    const departureTime =
      formatTimeFromIso(returnFlight?.departure) || "18:00";
    const arrivalTime = formatTimeFromIso(returnFlight?.arrival);
    // International travel typically wants you at the airport 3h before.
    const transferTime = subtractHoursFromTime(departureTime, 3);

    const transferBackActivity: Activity = {
      time: transferTime,
      name: `Transfer from your hotel to ${destAirportLabel}`,
      category: "transport",
      description: `Check out of your hotel and head to ${destAirportLabel}. Aim to arrive ~3 hours before your flight to allow for check-in, security, and any duty-free browsing.`,
      duration: "1h",
      distanceFromPrevious: "",
      walkingTime: "",
    };

    const returnFlightActivity: Activity = {
      time: departureTime,
      name: returnFlight
        ? `${returnFlight.airline} ${returnFlight.originAirport ?? destAirportCode ?? ""}${
            returnFlight.destinationAirport
              ? ` → ${returnFlight.destinationAirport}`
              : ""
          }`.trim()
        : `Return flight from ${cityName}`,
      category: "transport",
      description: returnFlight
        ? `${returnFlight.airline} from ${destAirportLabel}, departing ${departureTime}${
            arrivalTime ? `, arriving ${arrivalTime}` : ""
          }${
            returnFlight.destinationAirport
              ? ` at ${returnFlight.destinationAirport}`
              : ""
          }.${
            returnFlight.stops === 0
              ? " Direct flight."
              : returnFlight.stops
                ? ` ${returnFlight.stops} stop${returnFlight.stops > 1 ? "s" : ""}.`
                : ""
          }`
        : `Return flight from ${cityName} back to ${originLabel}.`,
      duration: returnFlight?.stops === 0 ? "Direct" : "Flight",
      bookingUrl: returnFlight?.bookingUrl,
      bookingPrice: returnFlight?.price,
      distanceFromPrevious: "",
      walkingTime: "",
    };

    lastDay.evening = [
      ...(lastDay.evening || []),
      transferBackActivity,
      returnFlightActivity,
    ];
  }

  return days;
}

export async function POST(request: NextRequest) {
  // Auth: admin (jonakfir@gmail.com) bypasses credits entirely.
  // Logged-in users need ≥1 trip_credit (decremented atomically below).
  // Anonymous users get FREE_ANON_TRIPS free generations tracked via a
  // signed httpOnly cookie so the app complies with App Store guideline
  // 5.1.1(v) (non-account features must be accessible without sign-up).
  const authCookie = request.cookies.get("daytrip-auth")?.value;
  const isAdmin = await isAdminRequest(authCookie);
  const userId = await getCallerUserId(request);

  const isAnon = !isAdmin && !userId;
  let anonUsed = 0;
  if (isAnon) {
    anonUsed = await readAnonUsed(request);
    if (!hasAnonCreditLeft(anonUsed)) {
      return NextResponse.json(
        {
          error: "anon_limit_reached",
          message:
            "You've used your free trip. Sign up to keep planning, or buy 1 trip for $3.",
          checkoutPath: "/api/stripe/checkout",
        },
        { status: 402 }
      );
    }
  }

  // Parse + validate the body BEFORE consuming any credit. The previous
  // order was the opposite, which meant a 400 (e.g. malformed JSON or
  // missing destination) would silently burn the user's free credit.
  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.destination || !body.startDate || !body.endDate) {
    return NextResponse.json(
      { error: "Missing required fields: destination, startDate, endDate" },
      { status: 400 }
    );
  }

  const requestedDays = daysBetween(body.startDate, body.endDate);
  if (requestedDays > MAX_TRIP_DAYS) {
    return NextResponse.json(
      {
        error: "trip_too_long",
        message: `Trip cannot exceed ${MAX_TRIP_DAYS} days. Please choose a shorter date range.`,
      },
      { status: 400 }
    );
  }

  // For non-admin, *authed* users, atomically consume one trip credit.
  // Anonymous callers skip this path — their limit is enforced by the
  // signed cookie above and the Set-Cookie written on the response below.
  if (!isAdmin && userId) {
    if (!isDbConfigured()) {
      return NextResponse.json(
        {
          error: "db_not_configured",
          message:
            "Trip generation requires Vercel Postgres to be attached. Contact the site admin.",
        },
        { status: 503 }
      );
    }
    const remaining = await consumeTripCredit(userId!);
    if (remaining === null) {
      return NextResponse.json(
        {
          error: "out_of_credits",
          message:
            "You've used your trip credits. Buy 1 trip for $3 to keep planning.",
          checkoutPath: "/api/stripe/checkout",
        },
        { status: 402 }
      );
    }
  }

  // If neither the proxy nor the Anthropic key is set, return mock data.
  // Note: this also means we just consumed a credit for fake data — refund
  // it so the user isn't penalized for a misconfigured backend.
  if (!isClaudeConfigured()) {
    console.warn(
      "Neither DAYTRIP_PROXY_URL nor ANTHROPIC_API_KEY is set — returning mock Tokyo itinerary"
    );
    if (!isAdmin && userId) {
      addTripCredits(userId, 1).catch(() => undefined);
    }
    const mockRes = NextResponse.json({ itinerary: MOCK_TOKYO_ITINERARY });
    if (isAnon) await writeAnonCookie(mockRes, anonUsed + 1);
    return mockRes;
  }

  const numDays = daysBetween(body.startDate, body.endDate);
  const id = generateId();
  const shareId = generateShareId();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      };

      try {
        // Event 1: meta
        send({
          type: "start",
          numDays,
          destination: body.destination,
          originCity: body.originCity,
          startDate: body.startDate,
          endDate: body.endDate,
          travelers: body.travelers,
          travelStyle: body.style,
          shareId,
        });

        // Kick off 6 work streams in parallel:
        //   - hero image (Wikipedia, ~200ms)
        //   - real flight prices via SerpAPI Google Flights (~3-5s; primary)
        //   - real flight prices via Travelpayouts cached (~200ms; secondary)
        //   - real flight prices via Amadeus (~500-1500ms; backstop)
        //   - days array (Claude, ~10-15s)
        //   - booking data (Claude, ~3-5s) — hotels/tours/tips + last-resort
        const heroPromise = fetchHeroImage(body.destination);
        const serpapiPromise = fetchSerpApiFlights(body).catch((e) => {
          console.warn("[generate] SerpAPI flights failed:", e);
          return null;
        });
        const travelpayoutsPromise = fetchTravelpayoutsFlights(body).catch((e) => {
          console.warn("[generate] Travelpayouts flights failed:", e);
          return null;
        });
        const amadeusPromise = fetchAmadeusFlights(body).catch((e) => {
          console.warn("[generate] Amadeus flights failed:", e);
          return null;
        });
        // For long region trips, plan the multi-city itinerary up front so
        // each parallel day chunk can pin to a concrete city. The call is
        // cheap (~3s) and its result flows into generateDays; failures fall
        // back to the old region-prompt behavior.
        const cityPlanPromise = planCityItinerary(body, numDays, userId);
        const daysPromise = cityPlanPromise.then((cityByDay) =>
          generateDays(
            body,
            numDays,
            userId,
            (completedDays, totalDays) => {
              send({ type: "progress", completedDays, totalDays });
            },
            cityByDay ?? undefined
          )
        );
        const bookingPromise = generateBookingData(body, userId);

        // Hero usually returns first
        heroPromise.then((heroImage) => {
          if (heroImage) send({ type: "hero", heroImage });
        });

        // Booking usually finishes before days because the response is smaller.
        // Wait for ALL flight providers so the flights array carries real
        // prices when available; otherwise fall back to Claude's invented
        // (but masked) flight stubs.
        Promise.all([
          bookingPromise,
          serpapiPromise,
          travelpayoutsPromise,
          amadeusPromise,
        ])
          .then(([booking, serpFlights, tpFlights, amadeusFlights]) => {
            const flightsForUi = pickFlights(
              body,
              serpFlights,
              tpFlights,
              amadeusFlights,
              booking.flights
            );
            send({
              type: "booking",
              hotels: postProcessHotels(body, booking.hotels),
              flights: flightsForUi,
              tours: booking.tours,
              tips: booking.tips,
            });
          })
          .catch((e) => {
            console.error("booking generation failed:", e);
            send({
              type: "booking",
              hotels: [],
              flights: pickFlights(body, null, null, null, []),
              tours: [],
              tips: [],
              error: e instanceof Error ? e.message : "booking failed",
            });
          });

        // Days finishes last
        const [heroImage, serpFlights, tpFlights, amadeusFlights, days, booking] =
          await Promise.all([
            heroPromise.catch(() => null),
            serpapiPromise,
            travelpayoutsPromise,
            amadeusPromise,
            daysPromise,
            bookingPromise.catch(() => ({
              hotels: [] as Hotel[],
              flights: [] as Flight[],
              tours: [] as ViatorTour[],
              tips: [] as string[],
            })),
          ]);

        // Real flights priority chain: SerpAPI → Travelpayouts → Amadeus → Claude masked.
        const finalFlights = pickFlights(
          body,
          serpFlights,
          tpFlights,
          amadeusFlights,
          booking.flights
        );

        // Inject the outbound flight + arrival transfer at the start of
        // Day 1, and the return transfer + departure flight at the end of
        // the last day. The day plan now reflects the full journey, not
        // just the in-destination activities.
        const daysWithTransport = injectFlightAndAirportTransfers(
          days,
          body,
          finalFlights
        );

        send({ type: "days", days: daysWithTransport });

        // Final assembled itinerary
        const itinerary: Itinerary = {
          id,
          shareId,
          destination: body.destination,
          startDate: body.startDate,
          endDate: body.endDate,
          travelers: body.travelers,
          travelStyle: body.style,
          budget: body.budget ?? "moderate",
          days: daysWithTransport,
          hotels: postProcessHotels(body, booking.hotels),
          flights: finalFlights,
          tours: booking.tours,
          tips: booking.tips,
          heroImage: heroImage ?? undefined,
          originCity: body.originCity,
        };

        // Fire-and-forget storage
        storeItinerary(itinerary).catch(() => undefined);

        send({ type: "done", itinerary });
      } catch (e) {
        console.error("streaming generate failed:", e);
        const message = e instanceof Error ? e.message : "Unknown error";

        // Refund the credit we consumed earlier — the user shouldn't be
        // charged for a generation that crashed mid-stream. Admins are
        // skipped because they don't consume credits in the first place.
        if (!isAdmin && userId) {
          addTripCredits(userId, 1).catch((refundErr) => {
            console.error(
              "[generate] failed to refund credit after stream error:",
              refundErr
            );
          });
        }

        try {
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({ type: "error", error: message }) + "\n"
            )
          );
        } catch {}
      } finally {
        try {
          controller.close();
        } catch {}
      }
    },
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/x-ndjson",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
  };
  if (isAnon) {
    headers["Set-Cookie"] = await buildAnonCookieHeader(anonUsed + 1);
  }

  return new Response(stream, {
    status: 200,
    headers,
  });
}

async function writeAnonCookie(
  res: NextResponse,
  used: number
): Promise<void> {
  const token = await signAnonToken(used);
  res.cookies.set("daytrip-anon", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
  });
}

async function buildAnonCookieHeader(used: number): Promise<string> {
  const token = await signAnonToken(used);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `daytrip-anon=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${
    365 * 24 * 60 * 60
  }${secure}`;
}

async function signAnonToken(used: number): Promise<string> {
  return new SignJWT({ used })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(JWT_SECRET);
}
