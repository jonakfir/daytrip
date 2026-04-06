import { MOCK_TOKYO_ITINERARY } from "@/lib/mock-data";
import TripPageClient from "./TripPageClient";

interface Props {
  params: { id: string };
}

async function getItinerary(id: string) {
  // Try fetching from Supabase via the share API
  // In production, this would be a direct Supabase query on the server
  // For now, fall back to mock data for the demo route
  if (id === "demo" || id === "tokyo-demo-5d") {
    return MOCK_TOKYO_ITINERARY;
  }

  try {
    // Try to fetch from Supabase directly
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && supabaseUrl !== "your_supabase_url") {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase
        .from("itineraries")
        .select("*")
        .eq("share_id", id)
        .single();

      if (data) {
        // Increment view count
        await supabase
          .from("itineraries")
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq("share_id", id);

        return {
          id: data.id,
          shareId: data.share_id,
          destination: data.destination,
          startDate: data.start_date,
          endDate: data.end_date,
          travelers: data.travelers,
          travelStyle: data.travel_style,
          budget: data.budget,
          ...data.itinerary_data,
        };
      }
    }
  } catch {
    // Fall through to mock data
  }

  // Default: return mock data
  return MOCK_TOKYO_ITINERARY;
}

export default async function TripPage({ params }: Props) {
  const itinerary = await getItinerary(params.id);
  return <TripPageClient itinerary={itinerary} />;
}
