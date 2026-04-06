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
}

export interface GenerateRequest {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  style: string;
  budget?: string;
}
