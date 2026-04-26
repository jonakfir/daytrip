-- 003_trip_media_and_coords.sql
-- Social Clips: attach TikTok / Instagram / (future) YouTube Shorts URLs
-- to an itinerary, resolved to a (day, slot, position) coordinate within
-- the trip and optionally to a lat/lng for the map view.
--
-- Also: make itineraries mutable post-generation by adding updated_at
-- (the existing schema only tracked created_at). A trigger keeps it
-- current so API code doesn't have to remember to bump it.

-- 1. itineraries.updated_at (reuses the set_updated_at() function from
--    002_trip_jobs.sql — safe to reference, runs in the same migration
--    order).
ALTER TABLE itineraries
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_itineraries_updated_at ON itineraries;
CREATE TRIGGER trg_itineraries_updated_at
BEFORE UPDATE ON itineraries
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. trip_media: one row per saved social clip.
--    Clips live in a sidecar table (not inside itinerary_data jsonb) so
--    that adding or removing a clip doesn't require rewriting the whole
--    itinerary blob. day_number + slot + position locate the clip in
--    the trip timeline; nulls mean "unassigned" (e.g. saved from the
--    share extension before picking a day).
CREATE TABLE IF NOT EXISTS trip_media (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id         uuid NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  platform             text NOT NULL
                         CHECK (platform IN ('tiktok','instagram','youtube_shorts')),
  source_url           text NOT NULL,
  provider_video_id    text,                  -- extracted from URL, used for dedupe
  embed_html           text NOT NULL,         -- from platform oEmbed; rendered client-side
  thumbnail_url        text,
  author_name          text,
  title                text,                  -- oEmbed title / caption

  -- Placement within the itinerary:
  day_number           int,
  slot                 text CHECK (slot IN ('morning','afternoon','evening')),
  position             int NOT NULL DEFAULT 0,

  -- Geography (resolved post-ingest via Google Places):
  latitude             double precision,
  longitude            double precision,
  place_id             text,                  -- Google place_id, for re-fetch
  place_name           text,
  geocode_confidence   text CHECK (geocode_confidence IN
                         ('high','medium','low','manual','unresolved')),

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  -- Same video URL shouldn't land in the same trip twice; attach-is-idempotent.
  UNIQUE (itinerary_id, provider_video_id)
);

CREATE INDEX IF NOT EXISTS trip_media_itinerary_idx ON trip_media(itinerary_id);
CREATE INDEX IF NOT EXISTS trip_media_user_idx      ON trip_media(user_id);
CREATE INDEX IF NOT EXISTS trip_media_day_slot_idx  ON trip_media(itinerary_id, day_number, slot, position);

DROP TRIGGER IF EXISTS trg_trip_media_updated_at ON trip_media;
CREATE TRIGGER trg_trip_media_updated_at
BEFORE UPDATE ON trip_media
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3. RLS: mirror the itineraries policy model — owners do everything,
--    and public itineraries' media is readable by anyone (so shared
--    trip links render the pins + embeds for anon viewers).
ALTER TABLE trip_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_media_owner_all"
  ON trip_media FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trip_media_public_select"
  ON trip_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM itineraries i
      WHERE i.id = trip_media.itinerary_id
        AND i.is_public = true
    )
  );
