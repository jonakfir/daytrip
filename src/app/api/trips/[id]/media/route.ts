/**
 * GET /api/trips/[id]/media
 *
 * Returns all social clips attached to an itinerary. Respects visibility:
 *   - Owner sees their own clips always.
 *   - Anyone can read clips on a public trip (`itineraries.is_public = true`).
 *   - Everyone else → 404.
 *
 * Shape:
 *   { media: TripMedia[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db-client";
import { getServerAuth } from "@/lib/check-auth";
import { findItineraryForUser } from "@/lib/social/itinerary-lookup";
import { ensureSocialClipsTables } from "@/lib/social/db-bootstrap";
import type { TripMedia } from "@/types/itinerary";

export const runtime = "nodejs";

interface DbRow {
  id: string;
  platform: TripMedia["platform"];
  source_url: string;
  provider_video_id: string | null;
  embed_html: string;
  thumbnail_url: string | null;
  author_name: string | null;
  title: string | null;
  day_number: number | null;
  slot: TripMedia["slot"];
  position: number;
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
  place_name: string | null;
  geocode_confidence: string | null;
  created_at: string;
}

function toClient(r: DbRow): TripMedia {
  const coords =
    r.latitude != null && r.longitude != null
      ? {
          lat: r.latitude,
          lng: r.longitude,
          placeId: r.place_id ?? undefined,
          confidence: (r.geocode_confidence ?? "unresolved") as NonNullable<TripMedia["coords"]>["confidence"],
        }
      : undefined;
  return {
    id: r.id,
    platform: r.platform,
    sourceUrl: r.source_url,
    providerVideoId: r.provider_video_id ?? undefined,
    embedHtml: r.embed_html,
    thumbnailUrl: r.thumbnail_url ?? undefined,
    authorName: r.author_name ?? undefined,
    title: r.title ?? undefined,
    dayNumber: r.day_number,
    slot: r.slot,
    position: r.position,
    coords,
    placeName: r.place_name ?? undefined,
    createdAt: r.created_at,
  };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getServerAuth();
  const ref = await findItineraryForUser(params.id, auth.userId);
  if (!ref) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await ensureSocialClipsTables();
  const { rows } = await sql<DbRow>`
    SELECT id, platform, source_url, provider_video_id, embed_html,
           thumbnail_url, author_name, title,
           day_number, slot, position,
           latitude, longitude, place_id, place_name, geocode_confidence,
           created_at
    FROM public.trip_media
    WHERE itinerary_id = ${ref.id}::uuid
    ORDER BY day_number NULLS LAST, slot NULLS LAST, position ASC, created_at ASC
    LIMIT 500
  `;
  return NextResponse.json({ media: rows.map(toClient) });
}
