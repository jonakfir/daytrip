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

export interface Hotel {
  name: string;
  pricePerNight: string;
  rating: number;
  bookingUrl: string;
  image?: string;
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
