import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

    return NextResponse.json({ itinerary: data.data });
  } catch (error) {
    console.error("Share lookup failed:", error);
    return NextResponse.json(
      { error: "Failed to retrieve itinerary" },
      { status: 500 }
    );
  }
}
