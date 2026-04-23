/**
 * POST /api/media/preview
 *
 * Validates a TikTok or Instagram URL and returns a ready-to-attach draft:
 *   - normalized oEmbed (embed html, thumbnail, author, title)
 *   - place candidates inferred from the caption (Claude), geocoded
 *
 * Does NOT write to the DB — client decides (via /attach) whether to save.
 * This lets the UI render a preview + let the user pick the right place
 * candidate before committing.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuth } from "@/lib/check-auth";
import { fetchOEmbed, OEmbedError } from "@/lib/social/oembed";
import { extractPlaceCandidates, PlaceCandidate } from "@/lib/social/extract-place";
import { geocode, GeocodeResult } from "@/lib/geo/geocode";
import { findItineraryForUser } from "@/lib/social/itinerary-lookup";
import { socialClipsEnabled } from "@/lib/feature-flags";

export const runtime = "nodejs";
export const maxDuration = 45;

const Body = z.object({
  url: z.string().min(1),
  /** share_id or row id of the itinerary the clip will be attached to — used
   *  to bias place extraction and geocoding. Optional: unscoped previews
   *  still work, they just lose the destination signal. */
  itineraryId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  if (!socialClipsEnabled()) {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }
  const auth = await getServerAuth();
  if (!auth.authenticated || !auth.userId) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_body", details: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }

  let destination = "";
  if (body.itineraryId) {
    const ref = await findItineraryForUser(body.itineraryId, auth.userId);
    if (!ref) {
      return NextResponse.json({ error: "itinerary_not_found" }, { status: 404 });
    }
    destination = ref.destination;
  }

  // 1. oEmbed
  let normalized;
  try {
    normalized = await fetchOEmbed(body.url);
  } catch (err) {
    if (err instanceof OEmbedError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
    }
    console.error("[media/preview] oembed error:", err);
    return NextResponse.json({ error: "oembed_failed" }, { status: 500 });
  }

  // 2. Place extraction — fail-soft; preview should always succeed even if
  //    Claude is down or returns nothing useful.
  const caption = [normalized.title, normalized.authorName].filter(Boolean).join(" — ");
  const candidates: PlaceCandidate[] = destination
    ? await extractPlaceCandidates({
        caption,
        destination,
        authorName: normalized.authorName,
      })
    : [];

  // 3. Geocode each candidate. Run in parallel since Nominatim's rate limit
  //    is 1 req/s but Google Places has no tight per-request cap — the
  //    geocoder handles its own pacing internally.
  const geocoded: Array<PlaceCandidate & { geocode: GeocodeResult | null }> = destination
    ? await Promise.all(
        candidates.map(async (c) => ({
          ...c,
          geocode: await geocode(c.name, c.city ?? destination),
        }))
      )
    : candidates.map((c) => ({ ...c, geocode: null }));

  return NextResponse.json({
    preview: normalized,
    placeCandidates: geocoded,
  });
}
