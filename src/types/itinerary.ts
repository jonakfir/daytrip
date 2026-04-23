/** Confidence bucket for a geocoded coordinate. `unresolved` means we
 *  tried to geocode and failed — store the row, skip the pin. */
export type GeocodeConfidence = "high" | "medium" | "low" | "manual" | "unresolved";

export interface ActivityCoords {
  lat: number;
  lng: number;
  /** Google Places place_id when the coord came from Places API — lets us
   *  re-fetch for fresh details (hours, photos) without re-searching. */
  placeId?: string;
  confidence: GeocodeConfidence;
}

export interface Activity {
  time: string;
  name: string;
  category:
    | "food"
    | "culture"
    | "shopping"
    | "nature"
    | "entertainment"
    | "transport";
  description: string;
  duration: string;
  bookingUrl?: string;
  bookingPrice?: string;
  distanceFromPrevious?: string;
  walkingTime?: string;
  rating?: number;
  reviewCount?: number;
  alternatives?: Activity[];
  /** Lazily populated — activities generated before the map feature
   *  have no coords; the map view backfills them via Places and writes
   *  the result back into itinerary_data so the geocode only runs once. */
  coords?: ActivityCoords;
}

export type MediaPlatform = "tiktok" | "instagram" | "youtube_shorts";
export type TripSlot = "morning" | "afternoon" | "evening";

/** A saved social clip attached to a trip. Mirrors the trip_media table
 *  row; the server converts snake_case DB columns to camelCase for the
 *  client. Clips live beside the itinerary jsonb rather than inside it
 *  so add/remove doesn't rewrite the whole blob. */
export interface TripMedia {
  id: string;
  platform: MediaPlatform;
  sourceUrl: string;
  providerVideoId?: string;
  embedHtml: string;
  thumbnailUrl?: string;
  authorName?: string;
  title?: string;
  /** 1-indexed day number. `null` = unassigned (saved from the share
   *  extension before the user picks a day). */
  dayNumber: number | null;
  slot: TripSlot | null;
  position: number;
  coords?: ActivityCoords;
  placeName?: string;
  createdAt: string;
}

export interface DayPlan {
  dayNumber: number;
  date: string;
  title: string;
  morning: Activity[];
  afternoon: Activity[];
  evening: Activity[];
  tip?: string;
}

export type HotelTier = "hostel" | "budget" | "mid" | "upscale";

export interface Hotel {
  name: string;
  pricePerNight: string;
  rating: number;
  bookingUrl: string;
  image?: string;
  /** City this hotel is in. Set when the trip is multi-city so the UI
   *  can group hotels under the city they serve. Optional for
   *  back-compat with older flat-list itineraries. */
  city?: string;
  /** Price tier. Populated by the per-city hotel step so the UI can
   *  badge cards ("Hostel" / "Budget" / "Mid" / "Upscale"). */
  tier?: HotelTier;
}

export interface Flight {
  airline: string;
  departure: string;
  arrival: string;
  price: string;
  bookingUrl: string;
  stops: number;
  originAirport?: string;
  destinationAirport?: string;
}

export interface ViatorTour {
  name: string;
  price: string;
  duration: string;
  rating: number;
  bookingUrl: string;
}

export interface Itinerary {
  id: string;
  shareId: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  travelStyle: string;
  budget: string;
  days: DayPlan[];
  hotels: Hotel[];
  /** Hotels grouped by city for multi-city trips. When present the
   *  UI renders each city's 4 tiers (hostel / budget / mid / upscale).
   *  The flat `hotels` array is still populated (union of all cities)
   *  for back-compat with callers that don't know about grouping. */
  hotelsByCity?: Record<string, Hotel[]>;
  /** City-by-day plan from the generator. Lets the trip page render
   *  a "Prague · Czech Republic" subheader on each day of a
   *  multi-city trip, and lets PDF/DOCX export group by city. */
  cityPlan?: Array<{
    city: string;
    country: string;
    startDay: number;
    endDay: number;
  }>;
  flights: Flight[];
  tours: ViatorTour[];
  tips: string[];
  heroImage?: string;
  originCity?: string;
}

export interface GenerateRequest {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  style: string;
  /** Multi-select trip styles (e.g. ["Cultural", "Relaxation"]). When present
   *  and non-empty, callers should prefer this over the single `style` field. */
  styles?: string[];
  /** Multi-select regions (e.g. ["Eastern Europe", "Balkans"]). When set,
   *  `destination` is a free-text region label and the generator should pick
   *  specific cities within those regions. */
  regions?: string[];
  /** Explicit cities chosen by the user after expanding a region (from the
   *  region catalog). When present and non-empty, the generator distributes
   *  days across these cities directly and SKIPS the Claude city-coordinator
   *  pre-step. This is the preferred path for region-based trips. */
  cities?: string[];
  budget?: string;
  /** City the traveler is departing from (e.g. "New York", "London"). Used to
   *  generate Skyscanner deep-links so flight prices and search results are
   *  scoped to their actual departure airport. */
  originCity?: string;
  /** Explicit origin airport IATA (e.g. "JFK") when the user picked an
   *  airport entry from the autocomplete. Overrides the city→airport lookup. */
  originAirport?: string;
  /** Explicit destination airport IATA (e.g. "CDG") when the user picked an
   *  airport entry from the autocomplete. Overrides the city→airport lookup. */
  destinationAirport?: string;
  /** Budget per person per day in USD. Feeds the Claude prompt so activities,
   *  restaurants, and hotels are priced within the user's range. */
  budgetPerDay?: number;
}
