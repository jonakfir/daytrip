/**
 * POST /api/trips/[id]/backfill-coords
 *
 * Ensures every Activity in the trip has a resolved `coords` (or
 * `confidence: 'unresolved'`). Cheap when already backfilled — the
 * per-Activity check short-circuits before any network call.
 *
 * Returns the updated itinerary. Callers (the map view) should use the
 * response as the new source of truth so pins render immediately.
 */

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db-client";
import { getServerAuth } from "@/lib/check-auth";
import { findItineraryForUser } from "@/lib/social/itinerary-lookup";
import { backfillItineraryCoords } from "@/lib/geo/backfill";
import { ensureItinerariesTable } from "@/lib/trip-job-repo";
import type { Itinerary } from "@/types/itinerary";
import { socialClipsEnabled } from "@/lib/feature-flags";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!socialClipsEnabled()) return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  const auth = await getServerAuth();
  const ref = await findItineraryForUser(params.id, auth.userId);
  if (!ref) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Backfill is write-through — only the owner can trigger it. Public viewers
  // get the best-available coords at read time.
  if (!auth.userId || ref.userId !== auth.userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await ensureItinerariesTable();
  const { rows } = await sql<{ itinerary_data: Itinerary }>`
    SELECT itinerary_data FROM itineraries WHERE id = ${ref.id}::uuid LIMIT 1
  `;
  const itin = rows[0]?.itinerary_data;
  if (!itin) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { itinerary: updated, changed } = await backfillItineraryCoords(itin);

  if (changed > 0) {
    await sql`
      UPDATE itineraries
      SET itinerary_data = ${JSON.stringify(updated)}::jsonb,
          updated_at = now()
      WHERE id = ${ref.id}::uuid
    `;
  }

  return NextResponse.json({ itinerary: updated, changed });
}
