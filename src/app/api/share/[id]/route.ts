import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db-client";
import { MOCK_TOKYO_ITINERARY } from "@/lib/mock-data";
import { ensureItinerariesTable } from "@/lib/trip-job-repo";

/**
 * Public read-only lookup for a shared itinerary.
 *
 * Reads from Vercel Postgres (the same `itineraries` table that
 * finalizeItinerary writes to). Production has no Supabase — the
 * previous version of this route used the supabase client which
 * always returned null in prod, surfacing as "Database not
 * configured" on every attempt to re-open a saved trip. The user
 * saw this as "it's not active" and couldn't open anything from
 * their saved list.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Missing share ID" }, { status: 400 });
  }

  // Demo trips don't touch the DB — they're always available for
  // homepage sample links and footer tiles.
  if (id === "demo" || id === "tokyo-demo-5d") {
    return NextResponse.json({ itinerary: MOCK_TOKYO_ITINERARY });
  }

  const isDbConfigured =
    !!process.env.POSTGRES_URL ||
    !!process.env.POSTGRES_PRISMA_URL ||
    !!process.env.DATABASE_URL;
  if (!isDbConfigured) {
    return NextResponse.json(
      {
        error: "db_not_configured",
        message: "Shared itineraries are not available in this environment.",
      },
      { status: 503 }
    );
  }

  try {
    await ensureItinerariesTable();
    const result = await sql`
      SELECT itinerary_data, view_count
      FROM itineraries
      WHERE share_id = ${id}
      LIMIT 1;
    `;
    const row = result.rows[0] as
      | { itinerary_data: unknown; view_count: number | null }
      | undefined;
    if (!row) {
      return NextResponse.json(
        { error: "not_found", message: "Itinerary not found" },
        { status: 404 }
      );
    }

    // Fire-and-forget view-count increment. Failures are non-fatal —
    // reads must succeed even if the write is throttled.
    sql`
      UPDATE itineraries
      SET view_count = COALESCE(view_count, 0) + 1
      WHERE share_id = ${id};
    `.catch((err) => {
      console.error(
        "[share] view_count increment failed:",
        err instanceof Error ? err.message : err
      );
    });

    return NextResponse.json({ itinerary: row.itinerary_data });
  } catch (err) {
    console.error(
      "[share] lookup failed:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "lookup_failed", message: "Failed to retrieve itinerary" },
      { status: 500 }
    );
  }
}
