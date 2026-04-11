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
  consumeTripCredit,
  isDbConfigured,
} from "@/lib/db";
import {
  buildSkyscannerFlightUrl,
  buildSkyscannerHotelUrl,
} from "@/lib/skyscanner";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "daytrip-secret-change-me-in-production"
);

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

async function fetchAmadeusFlights(
  destination: string,
  startDate: string,
  endDate: string
): Promise<Flight[] | null> {
  const clientId = process.env.AMADEUS_API_KEY;
  const clientSecret = process.env.AMADEUS_API_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    // Get OAuth token
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
    if (!tokenRes.ok) return null;
    const { access_token } = await tokenRes.json();

    // Search flights
    const params = new URLSearchParams({
      originLocationCode: "LAX",
      destinationLocationCode: destination.substring(0, 3).toUpperCase(),
      departureDate: startDate,
      returnDate: endDate,
      adults: "1",
      max: "3",
    });
    const flightRes = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?${params}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    if (!flightRes.ok) return null;
    const flightData = await flightRes.json();

    return (flightData.data ?? []).slice(0, 2).map(
      (offer: Record<string, unknown>): Flight => {
        const seg = (offer as any).itineraries?.[0]?.segments?.[0];
        return {
          airline: seg?.carrierCode ?? "Unknown",
          departure: seg?.departure?.at ?? startDate,
          arrival: seg?.arrival?.at ?? startDate,
          price: `$${(offer as any).price?.total ?? "N/A"}`,
          bookingUrl: "https://www.amadeus.com",
          stops: ((offer as any).itineraries?.[0]?.segments?.length ?? 1) - 1,
        };
      }
    );
  } catch {
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
 * Generate a contiguous chunk of days. The chunk is described with absolute
 * day numbers + dates so Sonnet can plan distances correctly even when the
 * trip is split across parallel calls.
 */
async function generateDayChunk(
  req: GenerateRequest,
  dayNumbers: number[],
  dates: string[],
  userId: string | null
): Promise<DayPlan[]> {
  const numDays = dayNumbers.length;
  const system = `Travel editor. Output ONLY a JSON array. No prose, no markdown. Real places, real distances.`;
  const budgetLine = req.budgetPerDay
    ? budgetContextLine(req.budgetPerDay)
    : "";
  const prompt = `${req.style} trip to ${req.destination}. Days ${dayNumbers[0]}–${
    dayNumbers[dayNumbers.length - 1]
  } (of a longer itinerary). Dates: ${dates.join(", ")}.${budgetLine ? "\n" + budgetLine : ""}

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

GEOGRAPHY RULES (CRITICAL — NEVER VIOLATE):
- Every single place must be PHYSICALLY LOCATED in ${req.destination}. Not "near", not "famous nationwide", not "in the same country". In the actual city limits or metro area of ${req.destination}.
- Do NOT include restaurants, hotels, or attractions from OTHER cities, even if they are famous or thematically related. Example: for a New York trip, do not include Zahav (Philadelphia), Shake Shack in Las Vegas, or an Uri Scheft location in Tel Aviv.
- If you are not 100% certain a place exists in ${req.destination}, do NOT include it. Pick a different real place you are sure about instead.
- For walking distances to make sense, every two consecutive activities must be within reasonable local travel time of each other.

Meal rules (CRITICAL):
- MORNING food = breakfast or brunch ONLY. Cafés, bakeries, pastries, eggs, bagels, pancakes, congee, dim sum, pastéis de nata, hummus brunch, etc. Never dinner food at breakfast.
- AFTERNOON food = lunch. Sandwiches, ramen, tacos, salads, light plates, pizza, sushi at lunch counter, etc. Not heavy multi-course dinners.
- EVENING food = dinner. Full restaurants, tasting menus, steakhouses, izakaya, wine bars, etc.
- Match cuisine to the time of day: no steak for breakfast, no cereal for dinner, no kaiseki at 9am.
- If a famous spot is all-day, still pick the time block where it makes most sense.`;

  const { text, usage } = await callClaudeWithUsage({
    system,
    prompt,
    model: "claude-sonnet-4-6",
    maxTokens: 3500,
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
 * First Claude call: generate the days array. For long trips (>3 days)
 * splits into 2 parallel chunks to halve wall-time on Sonnet.
 */
async function generateDays(
  req: GenerateRequest,
  numDays: number,
  userId: string | null
): Promise<DayPlan[]> {
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

  // Short trips: single call
  if (numDays <= 3) {
    return generateDayChunk(req, allDayNumbers, allDates, userId);
  }

  // Long trips: split in half, run in parallel — wall time roughly halves
  const mid = Math.ceil(numDays / 2);
  const firstHalf = generateDayChunk(
    req,
    allDayNumbers.slice(0, mid),
    allDates.slice(0, mid),
    userId
  );
  const secondHalf = generateDayChunk(
    req,
    allDayNumbers.slice(mid),
    allDates.slice(mid),
    userId
  );
  const [a, b] = await Promise.all([firstHalf, secondHalf]);
  return [...a, ...b];
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
  const prompt = `Trip to ${req.destination}, ${req.startDate} to ${req.endDate}, ${req.travelers} travelers, ${req.style} style. ${originLine}${airportLine ? " " + airportLine : ""}${budgetLine ? "\n" + budgetLine : ""}

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

export async function POST(request: NextRequest) {
  // Auth: admin (jonakfir@gmail.com) bypasses credits entirely.
  // Logged-in users need ≥1 trip_credit (decremented atomically below).
  // Anonymous users get 401.
  const authCookie = request.cookies.get("daytrip-auth")?.value;
  const isAdmin = await isAdminRequest(authCookie);
  const userId = await getCallerUserId(request);

  if (!isAdmin && !userId) {
    return NextResponse.json(
      {
        error: "auth_required",
        message: "Sign up to get one free trip.",
      },
      { status: 401 }
    );
  }

  // For non-admin users, atomically consume one trip credit. If they have
  // none left, return 402 (Payment Required) with a hint to buy more.
  if (!isAdmin) {
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

  // If neither the proxy nor the Anthropic key is set, return mock data
  if (!isClaudeConfigured()) {
    console.warn(
      "Neither DAYTRIP_PROXY_URL nor ANTHROPIC_API_KEY is set — returning mock Tokyo itinerary"
    );
    return NextResponse.json({ itinerary: MOCK_TOKYO_ITINERARY });
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

        // Kick off all 3 work streams in parallel:
        //   - hero image (Wikipedia, ~200ms)
        //   - days array (Claude, ~10-15s)
        //   - booking data (Claude, ~3-5s)
        const heroPromise = fetchHeroImage(body.destination);
        const daysPromise = generateDays(body, numDays, userId);
        const bookingPromise = generateBookingData(body, userId);

        // Hero usually returns first
        heroPromise.then((heroImage) => {
          if (heroImage) send({ type: "hero", heroImage });
        });

        // Booking usually finishes before days because the response is smaller
        bookingPromise
          .then((booking) => {
            send({
              type: "booking",
              hotels: postProcessHotels(body, booking.hotels),
              flights: postProcessFlights(body, booking.flights),
              tours: booking.tours,
              tips: booking.tips,
            });
          })
          .catch((e) => {
            console.error("booking generation failed:", e);
            send({
              type: "booking",
              hotels: [],
              flights: postProcessFlights(body, []),
              tours: [],
              tips: [],
              error: e instanceof Error ? e.message : "booking failed",
            });
          });

        // Days finishes last
        const [heroImage, days, booking] = await Promise.all([
          heroPromise.catch(() => null),
          daysPromise,
          bookingPromise.catch(() => ({
            hotels: [] as Hotel[],
            flights: [] as Flight[],
            tours: [] as ViatorTour[],
            tips: [] as string[],
          })),
        ]);

        send({ type: "days", days });

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
          days,
          hotels: postProcessHotels(body, booking.hotels),
          flights: postProcessFlights(body, booking.flights),
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

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
