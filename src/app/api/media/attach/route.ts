/**
 * POST /api/media/attach
 *
 * Saves a social clip onto a trip. Idempotent on (itinerary_id,
 * provider_video_id) — re-attaching the same TikTok returns the existing
 * row instead of erroring, so the iOS share extension can retry freely.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db-client";
import { getServerAuth } from "@/lib/check-auth";
import { fetchOEmbed, OEmbedError } from "@/lib/social/oembed";
import { findItineraryForUser, assertOwner } from "@/lib/social/itinerary-lookup";
import { ensureSocialClipsTables } from "@/lib/social/db-bootstrap";
import { socialClipsEnabled } from "@/lib/feature-flags";
import type { TripMedia } from "@/types/itinerary";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  itineraryId: z.string().min(1),
  url: z.string().min(1),
  dayNumber: z.number().int().positive().nullable().optional(),
  slot: z.enum(["morning", "afternoon", "evening"]).nullable().optional(),
  position: z.number().int().nonnegative().optional(),
  placeName: z.string().optional(),
  coords: z
    .object({
      lat: z.number(),
      lng: z.number(),
      placeId: z.string().optional(),
      confidence: z.enum(["high", "medium", "low", "manual", "unresolved"]),
    })
    .optional(),
});

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
  geocode_confidence: TripMedia["coords"] extends { confidence: infer C } ? C | null : null;
  created_at: string;
}

function rowToClient(r: DbRow): TripMedia {
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

  const ref = await findItineraryForUser(body.itineraryId, auth.userId);
  if (!ref) return NextResponse.json({ error: "itinerary_not_found" }, { status: 404 });
  if (!(await assertOwner(ref, auth.userId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let normalized;
  try {
    normalized = await fetchOEmbed(body.url);
  } catch (err) {
    if (err instanceof OEmbedError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "oembed_failed" }, { status: 500 });
  }

  await ensureSocialClipsTables();

  // Idempotent insert — ON CONFLICT on (itinerary_id, provider_video_id)
  // bumps updated_at and keeps the existing row's id/day/slot intact unless
  // the request explicitly specifies new placement.
  const { rows } = await sql<DbRow>`
    INSERT INTO public.trip_media
      (itinerary_id, user_id, platform, source_url, provider_video_id,
       embed_html, thumbnail_url, author_name, title,
       day_number, slot, position,
       latitude, longitude, place_id, place_name, geocode_confidence)
    VALUES
      (${ref.id}::uuid, ${auth.userId}::uuid, ${normalized.platform}, ${normalized.sourceUrl}, ${normalized.providerVideoId},
       ${normalized.embedHtml}, ${normalized.thumbnailUrl ?? null}, ${normalized.authorName ?? null}, ${normalized.title ?? null},
       ${body.dayNumber ?? null}, ${body.slot ?? null}, ${body.position ?? 0},
       ${body.coords?.lat ?? null}, ${body.coords?.lng ?? null},
       ${body.coords?.placeId ?? null}, ${body.placeName ?? null},
       ${body.coords?.confidence ?? (body.coords ? "manual" : "unresolved")})
    ON CONFLICT (itinerary_id, provider_video_id) WHERE provider_video_id IS NOT NULL
    DO UPDATE SET
      day_number = COALESCE(EXCLUDED.day_number, public.trip_media.day_number),
      slot = COALESCE(EXCLUDED.slot, public.trip_media.slot),
      latitude = COALESCE(EXCLUDED.latitude, public.trip_media.latitude),
      longitude = COALESCE(EXCLUDED.longitude, public.trip_media.longitude),
      place_id = COALESCE(EXCLUDED.place_id, public.trip_media.place_id),
      place_name = COALESCE(EXCLUDED.place_name, public.trip_media.place_name),
      geocode_confidence = COALESCE(EXCLUDED.geocode_confidence, public.trip_media.geocode_confidence),
      updated_at = now()
    RETURNING *
  `;

  // Bump the parent itinerary's updated_at so map/trip readers can detect change.
  await sql`UPDATE public.itineraries SET updated_at = now() WHERE id = ${ref.id}::uuid`.catch(() => {});

  return NextResponse.json({ media: rowToClient(rows[0]) }, { status: 201 });
}
