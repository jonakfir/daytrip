import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { MOCK_TOKYO_ITINERARY } from "@/lib/mock-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: "Missing share ID" },
      { status: 400 }
    );
  }

  // Always-available demo trip — used by the homepage Sample Trips section
  // and the footer "Sample Trips" link. Doesn't require Supabase.
  if (id === "demo" || id === "tokyo-demo-5d") {
    return NextResponse.json({ itinerary: MOCK_TOKYO_ITINERARY });
  }

  if (!supabase) {
    return NextResponse.json(
      {
        error: "Database not configured",
        message:
          "Supabase is not set up. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables to enable shared itineraries.",
      },
      { status: 404 }
    );
  }

  try {
    // Fetch itinerary by share_id
    const { data, error } = await supabase
      .from("itineraries")
      .select("*")
      .eq("share_id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Itinerary not found" },
        { status: 404 }
      );
    }

    // Increment view count (fire-and-forget)
    supabase
      .from("itineraries")
      .update({ view_count: (data.view_count ?? 0) + 1 })
      .eq("share_id", id)
      .then(({ error: updateError }) => {
        if (updateError) {
          console.error("Failed to increment view count:", updateError.message);
        }
      });

    // Schema column is `itinerary_data` (see migrations/001_initial_schema.sql);
    // fall back to `data` for any legacy rows that were stored under the old key.
    return NextResponse.json({
      itinerary: data.itinerary_data ?? data.data,
    });
  } catch (error) {
    console.error("Share lookup failed:", error);
    return NextResponse.json(
      { error: "Failed to retrieve itinerary" },
      { status: 500 }
    );
  }
}
