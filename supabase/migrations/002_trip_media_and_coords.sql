-- Migration 002: social clips sidecar + geocode cache
-- Paired with Phase 1 of docs/tiktok-map-feature-plan.md.
--
-- Runs cleanly on plain Postgres (Vercel Postgres in prod) and on Supabase
-- (RLS policies at the bottom are idempotent and will no-op on platforms
-- without the auth schema — prod routes enforce ownership in code via the
-- daytrip-auth JWT, so RLS is belt-and-suspenders only).

-- 1. trip_media — one row per saved TikTok / IG clip attached to a trip.
create table if not exists public.trip_media (
  id                   uuid primary key default gen_random_uuid(),
  itinerary_id         uuid not null,
  user_id              uuid not null,
  platform             text not null check (platform in ('tiktok','instagram','youtube_shorts')),
  source_url           text not null,
  provider_video_id    text,
  embed_html           text not null,
  thumbnail_url        text,
  author_name          text,
  title                text,
  -- placement within the itinerary (nullable = unassigned, e.g. saved from
  -- the iOS share extension before the user picked a day):
  day_number           int,
  slot                 text check (slot in ('morning','afternoon','evening')),
  position             int not null default 0,
  -- geography (resolved post-ingest via Places / Nominatim):
  latitude             double precision,
  longitude            double precision,
  place_id             text,
  place_name           text,
  geocode_confidence   text check (geocode_confidence in ('high','medium','low','manual','unresolved')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Dedupe within a trip — same video can't be attached twice. `provider_video_id`
-- is nullable for short links that haven't been resolved yet, so only enforce
-- the constraint when it's set.
create unique index if not exists trip_media_itinerary_provider_uq
  on public.trip_media (itinerary_id, provider_video_id)
  where provider_video_id is not null;

create index if not exists trip_media_itinerary_idx on public.trip_media (itinerary_id);
create index if not exists trip_media_user_idx      on public.trip_media (user_id);

-- 2. place_cache — memoize geocode lookups so we don't re-spend on Google
-- Places (or re-rate-limit Nominatim) every time a trip opens. Keyed on
-- (destination, query) since the same POI name means different things in
-- different cities ("Old Town" in Prague vs. in Tallinn).
create table if not exists public.place_cache (
  id                  uuid primary key default gen_random_uuid(),
  destination_key     text not null,
  query               text not null,
  provider            text not null check (provider in ('google_places','nominatim','manual')),
  place_id            text,
  display_name        text,
  latitude            double precision,
  longitude           double precision,
  confidence          text not null check (confidence in ('high','medium','low','manual','unresolved')),
  raw_response        jsonb,
  created_at          timestamptz not null default now(),
  expires_at          timestamptz not null default (now() + interval '90 days'),
  unique (destination_key, query, provider)
);

create index if not exists place_cache_lookup_idx
  on public.place_cache (destination_key, query);

-- 3. itineraries.updated_at — so clients can detect when a trip's clips
-- or coords changed without diffing the full jsonb.
alter table if exists public.itineraries
  add column if not exists updated_at timestamptz not null default now();

-- 4. RLS — only applies on Supabase (prod skips this since it's Vercel
-- Postgres without an `auth` schema). Wrapped in a DO block so a missing
-- auth.uid() function doesn't abort the migration.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'auth') then
    execute 'alter table public.trip_media enable row level security';

    execute $policy$
      drop policy if exists "trip_media read" on public.trip_media;
      create policy "trip_media read" on public.trip_media
        for select using (
          user_id = auth.uid()
          or exists (
            select 1 from public.itineraries i
            where i.id = trip_media.itinerary_id and i.is_public
          )
        );
    $policy$;

    execute $policy$
      drop policy if exists "trip_media write" on public.trip_media;
      create policy "trip_media write" on public.trip_media
        for all using (user_id = auth.uid())
        with check (user_id = auth.uid());
    $policy$;

    execute 'alter table public.place_cache enable row level security';

    execute $policy$
      drop policy if exists "place_cache read any" on public.place_cache;
      create policy "place_cache read any" on public.place_cache
        for select using (true);
    $policy$;
  end if;
end
$$;
