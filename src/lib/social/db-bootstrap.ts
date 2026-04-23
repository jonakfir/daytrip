/**
 * Idempotent table creation for the Social Clips feature.
 *
 * Mirrors the `CREATE TABLE IF NOT EXISTS` pattern used by
 * `src/app/api/me/trips/route.ts` so Vercel Postgres environments that
 * haven't had migration 002 applied still work on first request.
 *
 * Migration 002 (supabase/migrations/002_trip_media_and_coords.sql) is the
 * source of truth for local/Supabase; this helper keeps prod self-healing.
 *
 * Ensure is memoized per-process so we don't hammer the DB on every request.
 */

import { sql } from "@/lib/db-client";

let bootstrapped: Promise<void> | null = null;

async function doBootstrap(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS public.trip_media (
      id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      itinerary_id       uuid NOT NULL,
      user_id            uuid NOT NULL,
      platform           text NOT NULL CHECK (platform IN ('tiktok','instagram','youtube_shorts')),
      source_url         text NOT NULL,
      provider_video_id  text,
      embed_html         text NOT NULL,
      thumbnail_url      text,
      author_name        text,
      title              text,
      day_number         int,
      slot               text CHECK (slot IN ('morning','afternoon','evening')),
      position           int NOT NULL DEFAULT 0,
      latitude           double precision,
      longitude          double precision,
      place_id           text,
      place_name         text,
      geocode_confidence text CHECK (geocode_confidence IN ('high','medium','low','manual','unresolved')),
      created_at         timestamptz NOT NULL DEFAULT now(),
      updated_at         timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS trip_media_itinerary_provider_uq
      ON public.trip_media (itinerary_id, provider_video_id)
      WHERE provider_video_id IS NOT NULL
  `;
  await sql`CREATE INDEX IF NOT EXISTS trip_media_itinerary_idx ON public.trip_media (itinerary_id)`;
  await sql`CREATE INDEX IF NOT EXISTS trip_media_user_idx      ON public.trip_media (user_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS public.place_cache (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      destination_key text NOT NULL,
      query           text NOT NULL,
      provider        text NOT NULL CHECK (provider IN ('google_places','nominatim','manual')),
      place_id        text,
      display_name    text,
      latitude        double precision,
      longitude       double precision,
      confidence      text NOT NULL CHECK (confidence IN ('high','medium','low','manual','unresolved')),
      raw_response    jsonb,
      created_at      timestamptz NOT NULL DEFAULT now(),
      expires_at      timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
      UNIQUE (destination_key, query, provider)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS place_cache_lookup_idx ON public.place_cache (destination_key, query)`;
}

export function ensureSocialClipsTables(): Promise<void> {
  if (!bootstrapped) bootstrapped = doBootstrap().catch((err) => {
    // Reset so the next request retries — don't cache a failed bootstrap.
    bootstrapped = null;
    throw err;
  });
  return bootstrapped;
}
