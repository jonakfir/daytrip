/**
 * PATCH /api/media/[id]  → move a clip between days/slots, or edit its pin
 * DELETE /api/media/[id] → remove a clip from a trip
 *
 * Both require the caller to own the parent itinerary (enforced by joining
 * trip_media -> itineraries at the update/delete site).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db-client";
import { getServerAuth } from "@/lib/check-auth";
import { ensureSocialClipsTables } from "@/lib/social/db-bootstrap";
import { socialClipsEnabled } from "@/lib/feature-flags";

export const runtime = "nodejs";

const Patch = z.object({
  dayNumber: z.number().int().positive().nullable().optional(),
  slot: z.enum(["morning", "afternoon", "evening"]).nullable().optional(),
  position: z.number().int().nonnegative().optional(),
  coords: z
    .object({
      lat: z.number(),
      lng: z.number(),
      placeId: z.string().optional(),
      confidence: z.enum(["high", "medium", "low", "manual", "unresolved"]).default("manual"),
    })
    .optional(),
  placeName: z.string().optional(),
});

async function requireAuth() {
  const auth = await getServerAuth();
  if (!auth.authenticated || !auth.userId) {
    return { err: NextResponse.json({ error: "auth_required" }, { status: 401 }) } as const;
  }
  return { auth } as const;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!socialClipsEnabled()) return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  const gate = await requireAuth();
  if ("err" in gate) return gate.err;

  let body: z.infer<typeof Patch>;
  try {
    body = Patch.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "invalid_body", details: String(err) }, { status: 400 });
  }

  await ensureSocialClipsTables();

  // Only touch rows the user owns. A single UPDATE with the ownership check
  // inline avoids a read-then-write race.
  const { rows } = await sql<{ id: string }>`
    UPDATE public.trip_media
    SET
      day_number = COALESCE(${body.dayNumber ?? null}, day_number),
      slot = COALESCE(${body.slot ?? null}, slot),
      position = COALESCE(${body.position ?? null}, position),
      latitude = COALESCE(${body.coords?.lat ?? null}, latitude),
      longitude = COALESCE(${body.coords?.lng ?? null}, longitude),
      place_id = COALESCE(${body.coords?.placeId ?? null}, place_id),
      place_name = COALESCE(${body.placeName ?? null}, place_name),
      geocode_confidence = COALESCE(${body.coords?.confidence ?? null}, geocode_confidence),
      updated_at = now()
    WHERE id = ${params.id}::uuid AND user_id = ${gate.auth.userId}::uuid
    RETURNING id
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "not_found_or_forbidden" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!socialClipsEnabled()) return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  const gate = await requireAuth();
  if ("err" in gate) return gate.err;

  await ensureSocialClipsTables();
  const { rows } = await sql<{ id: string }>`
    DELETE FROM public.trip_media
    WHERE id = ${params.id}::uuid AND user_id = ${gate.auth.userId}::uuid
    RETURNING id
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: "not_found_or_forbidden" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
