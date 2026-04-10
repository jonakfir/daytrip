import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { MOCK_TOKYO_ITINERARY } from "@/lib/mock-data";
import { isAdminRequest } from "@/lib/check-auth";
import { callClaude, isClaudeConfigured } from "@/lib/claude-client";

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
 * Strategy: strip country suffix, try the primary name ("Tokyo, Japan" -> "Tokyo"),
 * then fall back to the full string. Returns the high-res `originalimage.source`
 * from Wikipedia's REST summary API. Requires no API key.
 *
 * Returns null for fake/nonexistent places since Wikipedia has no page for them.
 */
async function fetchWikipediaImage(
  destination: string
): Promise<string | null> {
  const candidates = Array.from(
    new Set(
      [
        destination.split(",")[0]?.trim(),
        destination.trim(),
      ].filter((s): s is string => !!s && s.length > 0)
    )
  );

  for (const candidate of candidates) {
    try {
      const title = encodeURIComponent(candidate.replace(/\s+/g, "_"));
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "Daytrip/1.0 (https://daytrip-five.vercel.app)",
          },
        }
      );
      if (!res.ok) continue;
      const data = await res.json();

      // Skip disambiguation pages
      if (data.type === "disambiguation") continue;

      // Prefer the full-resolution original, fall back to the thumb
      const url: string | undefined =
        data.originalimage?.source ?? data.thumbnail?.source;
      if (url && url.startsWith("https://")) {
        return url;
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

async function generateWithClaude(
  req: GenerateRequest,
  numDays: number,
  externalData: {
    flights: Flight[] | null;
    places: string[] | null;
    restaurants: string[] | null;
    heroImage: string | null;
  }
): Promise<{
  days: DayPlan[];
  hotels: Hotel[];
  flights: Flight[];
  tours: ViatorTour[];
  tips: string[];
}> {
  const externalContext = [
    externalData.flights
      ? `Real flight data available: ${JSON.stringify(externalData.flights)}`
      : "No real flight data available. Generate realistic flight options.",
    externalData.places
      ? `Popular places from Foursquare: ${externalData.places.join(", ")}`
      : "No Foursquare data. Use your knowledge of real popular places.",
    externalData.restaurants
      ? `Top restaurants from Yelp: ${externalData.restaurants.join(", ")}`
      : "No Yelp data. Use your knowledge of real popular restaurants.",
  ].join("\n");

  const systemPrompt = `Travel editor. Output ONLY valid JSON, no prose, no markdown. Real places only.`;

  const userPrompt = `${numDays} days in ${req.destination}. Dates ${req.startDate}–${req.endDate}. Style: ${req.style}.

JSON shape:
{"days":[{"dayNumber":1,"date":"YYYY-MM-DD","title":"short","morning":[Activity,Activity],"afternoon":[Activity,Activity],"evening":[Activity,Activity],"tip":"one tip"}],"hotels":[{"name":"","pricePerNight":"$X","rating":4.5,"bookingUrl":""},{"name":"","pricePerNight":"$X","rating":4.5,"bookingUrl":""},{"name":"","pricePerNight":"$X","rating":4.5,"bookingUrl":""}],"flights":[{"airline":"","departure":"","arrival":"","price":"$X","bookingUrl":"","stops":0},{"airline":"","departure":"","arrival":"","price":"$X","bookingUrl":"","stops":0}],"tours":[{"name":"","price":"$X","duration":"","rating":4.5,"bookingUrl":""},{"name":"","price":"$X","duration":"","rating":4.5,"bookingUrl":""},{"name":"","price":"$X","duration":"","rating":4.5,"bookingUrl":""}],"tips":["","","",""]}

Activity={"time":"HH:MM","name":"real place","category":"food|culture|nature|shopping|entertainment|transport","description":"one short sentence","duration":"Xh"}

Rules: 2 activities per block. Real ${req.destination} place names. Keep all text short.`;

  const text = await callClaude({
    system: systemPrompt,
    prompt: userPrompt,
    model: "claude-sonnet-4-6",
    maxTokens: 8000,
  });

  // Extract JSON — handle possible markdown wrapping
  let jsonStr = text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);

  return {
    days: parsed.days ?? [],
    hotels: parsed.hotels ?? [],
    flights: externalData.flights ?? parsed.flights ?? [],
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
      data: itinerary,
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

// ── POST handler ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Auth check: admin gets free access, everyone else needs to pay
    const authCookie = request.cookies.get("daytrip-auth")?.value;
    const admin = await isAdminRequest(authCookie);

    if (!admin) {
      // Non-admin: check if they have a valid payment/subscription
      // For now, block non-admin users and redirect to pricing
      return NextResponse.json(
        { error: "subscription_required", message: "Please subscribe to generate itineraries" },
        { status: 403 }
      );
    }

    const body = (await request.json()) as GenerateRequest;

    if (!body.destination || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: "Missing required fields: destination, startDate, endDate" },
        { status: 400 }
      );
    }

    const numDays = daysBetween(body.startDate, body.endDate);

    // If neither the proxy nor the Anthropic key is set, return mock data
    if (!isClaudeConfigured()) {
      console.warn(
        "Neither DAYTRIP_PROXY_URL nor ANTHROPIC_API_KEY is set — returning mock Tokyo itinerary"
      );
      return NextResponse.json({ itinerary: MOCK_TOKYO_ITINERARY });
    }

    // Fetch external data in parallel (all gracefully fallback to null)
    const [flights, places, restaurants, heroImage] = await Promise.all([
      fetchAmadeusFlights(body.destination, body.startDate, body.endDate),
      fetchFoursquarePlaces(body.destination),
      fetchYelpRestaurants(body.destination),
      fetchHeroImage(body.destination),
    ]);

    // Generate itinerary with Claude
    const generated = await generateWithClaude(body, numDays, {
      flights,
      places,
      restaurants,
      heroImage,
    });

    const itinerary: Itinerary = {
      id: generateId(),
      shareId: generateShareId(),
      destination: body.destination,
      startDate: body.startDate,
      endDate: body.endDate,
      travelers: body.travelers,
      travelStyle: body.style,
      budget: body.budget ?? "moderate",
      days: generated.days,
      hotels: generated.hotels,
      flights: generated.flights,
      tours: generated.tours,
      tips: generated.tips,
      heroImage: heroImage ?? undefined,
    };

    await storeItinerary(itinerary);

    return NextResponse.json({ itinerary });
  } catch (error) {
    console.error("Itinerary generation failed:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate itinerary", details: message },
      { status: 500 }
    );
  }
}
