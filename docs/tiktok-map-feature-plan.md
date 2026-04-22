# Daytrip — Social Clips + Full Trip Map

Implementation plan for two linked features:

1. **Social Clips** — paste or share a TikTok / Instagram Reel URL into a trip. It lands as a pin on the trip map + an embedded video card inside the itinerary day.
2. **Full Trip Map** — a view showing every planned item (activities, hotels, tours, clips) for a trip as pins, so travelers can see the whole trip geographically.

Scoped to Jonathan's version of Ben's idea — we are **not** building a cross-platform video search engine (TOS-blocked, scrapers get killed). We are adding a first-class "save a clip to your trip" capability and a proper map view.

---

## Decisions to lock before coding

| # | Decision | Recommendation | Why |
|---|----------|----------------|-----|
| D1 | Map library | **MapLibre GL JS** via `react-map-gl/maplibre` | Free, open, no vendor lock. Works on web + Capacitor webview. Styled tiles from MapTiler or Protomaps. |
| D2 | Tile provider | **MapTiler** (free tier 100k loads/mo) | Generous free tier, easy switch to Protomaps self-host later. |
| D3 | Geocoding | **Google Places API** (Text Search + Place Details) | Best POI recall for ambiguous names ("Trevi", "Old Town"). Already a Google-adjacent stack. |
| D4 | Media storage | **New `trip_media` sidecar table** (not in `itinerary_data` jsonb) | Keeps the generation blob clean; clips can be added/removed without rewriting the whole itinerary; natural place for thumbnails + embed HTML. |
| D5 | Coordinates | **Add `latitude`/`longitude` inside existing jsonb Activity shape**, backfill lazily on first map render | Minimizes schema churn. Jsonb is already the source of truth for activities. |
| D6 | Ingestion scope | **TikTok only for v1; Instagram deferred** | IG oEmbed requires a Meta Business app + oEmbed Read permission — provisioning skipped in Phase 0 (2026-04-22). Add IG in a later phase when there's appetite for the Meta maze. YouTube Shorts even later. |
| D7 | oEmbed provider | **Official oEmbed** (`www.tiktok.com/oembed` — no auth required) | Phase 2 ships TikTok-only. IG codepath stays behind an `IG_OEMBED_TOKEN` presence check and 503s with a clear message if called without it. |
| D8 | Mutation model | **Itineraries become mutable after generation** for clip-adds and stop-adds | Current code treats them as immutable. We need a `PATCH /api/trips/[id]` that accepts `{type:'add_clip'\|'add_activity'\|'move_stop', ...}`. Server validates, writes jsonb + trip_media, bumps `updated_at`. |
| D9 | Share extension scope | **iOS first (Capacitor + native Swift extension). Android deferred.** | iOS is where Ben described the behavior; Android share is a separate native target we can add later. |

---

## Out of scope (explicit)

- Downloading, re-hosting, transcoding, or caching the video file itself — TOS violation on both platforms. We embed via the official iframe and link out.
- A "search engine pulling direct video" across TikTok/IG. Neither platform allows this reliably — scrapers hit CAPTCHA/rate limits within hours.
- Android share sheet (punt to v2).
- Auto-generating itinerary segments from the clip's audio transcription (interesting, but separate project).
- Real-time multi-device sync.

---

## Phase 0 — Foundation (0.5 day)

**Deliverable:** env, keys, and libs in place; nothing user-visible yet.

- [ ] Provision MapTiler account, put `MAPTILER_KEY` in `.env.local` + Vercel project env.
- [ ] Enable Google Places API on existing Google Cloud project; add `GOOGLE_PLACES_API_KEY` (server-side only).
- [ ] Create Facebook App for Instagram oEmbed (required for IG). Add `IG_OEMBED_TOKEN`. TikTok oEmbed needs no key.
- [ ] `npm i maplibre-gl react-map-gl @types/maplibre-gl zod` (Zod is already present — confirm).
- [ ] Add Zod schemas for oEmbed responses under `src/lib/social/schemas.ts`.

**Verification:** a throwaway script in `scripts/` fetches oEmbed for a known TikTok + IG URL and logs the response. Delete after.

---

## Phase 1 — Data model (1 day)

**Deliverable:** schema can hold clips and coordinates. No UI yet.

### Migration: `supabase/migrations/002_trip_media_and_coords.sql`

```sql
-- Media items attached to an itinerary (social clips, future: user photos)
create table public.trip_media (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references public.itineraries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('tiktok','instagram','youtube_shorts')),
  source_url text not null,
  provider_video_id text,                -- extracted from URL, for dedupe
  embed_html text,                        -- from oEmbed; we render this
  thumbnail_url text,
  author_name text,
  title text,                             -- oEmbed title/caption
  -- placement within the itinerary:
  day_number int,                         -- 1-indexed, nullable = "unassigned"
  slot text check (slot in ('morning','afternoon','evening') or slot is null),
  position int default 0,                 -- order within the slot
  -- geography (resolved post-ingest via Places):
  latitude double precision,
  longitude double precision,
  place_id text,                          -- Google place_id for re-fetch
  place_name text,
  geocode_confidence text check (geocode_confidence in ('high','medium','low','manual','unresolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (itinerary_id, provider_video_id)
);

create index trip_media_itinerary_idx on public.trip_media(itinerary_id);
create index trip_media_user_idx on public.trip_media(user_id);

alter table public.trip_media enable row level security;

create policy "users read own or public trip media" on public.trip_media
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.itineraries i
               where i.id = trip_media.itinerary_id and i.is_public)
  );
create policy "users write own trip media" on public.trip_media
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- itineraries: bump updated_at on mutation
alter table public.itineraries add column if not exists updated_at timestamptz not null default now();
```

### Type extensions: `src/types/itinerary.ts`

```ts
export interface ActivityCoords { lat: number; lng: number; placeId?: string; confidence: 'high'|'medium'|'low'|'manual'|'unresolved'; }

export interface Activity {
  // ...existing fields
  coords?: ActivityCoords;          // NEW — optional, backfilled lazily
  mediaIds?: string[];              // NEW — references to trip_media rows
}

export interface TripMedia {
  id: string;
  platform: 'tiktok' | 'instagram' | 'youtube_shorts';
  sourceUrl: string;
  embedHtml: string;
  thumbnailUrl?: string;
  authorName?: string;
  title?: string;
  dayNumber?: number;
  slot?: 'morning' | 'afternoon' | 'evening';
  position: number;
  coords?: ActivityCoords;
  placeName?: string;
}
```

**Tests:** unit test for migration SQL via `supabase db reset` in CI (if not already wired, this is a good moment). Snapshot the new type shapes.

---

## Phase 2 — oEmbed ingestion pipeline (1.5 days)

**Deliverable:** a server endpoint that takes a TikTok/IG URL, validates, fetches oEmbed, guesses a location, and returns a draft `TripMedia`. No DB write yet in this phase — caller decides.

### Route: `src/app/api/media/preview/route.ts`

```ts
POST /api/media/preview
body: { url: string }
auth: required (getUser)
returns: { platform, embedHtml, thumbnailUrl, authorName, title, placeCandidates: Place[] }
```

**Steps inside the handler:**

1. Zod-validate URL against TikTok / IG regexes; extract `provider_video_id`.
2. Fetch platform oEmbed (TikTok: GET `https://www.tiktok.com/oembed?url=...`; IG: `https://graph.facebook.com/v19.0/instagram_oembed?url=...&access_token=$IG_OEMBED_TOKEN`).
3. **Place extraction** (`src/lib/social/extract-place.ts`):
   - Pull caption/title from oEmbed.
   - Also hit a lightweight server-side fetch of the post page and regex for hashtags and any `#location` / geo metadata (best-effort, fail-soft).
   - Send caption + hashtags + trip destination (from the itinerary) to Claude Haiku with a tight system prompt: "Return up to 3 place candidates as JSON with {name, type, city} or [] if none inferable."
   - For each candidate, call Google Places Text Search biased to the trip's destination → get `place_id`, `location`, `formatted_address`.
4. Return ranked candidates with confidence. Client picks or drops pin manually.

### Route: `src/app/api/media/attach/route.ts`

```ts
POST /api/media/attach
body: { itineraryId, url, dayNumber?, slot?, placeId?, coords?, title? }
auth: required + ownership check
returns: TripMedia
```

- Re-runs preview (idempotent by `provider_video_id`).
- Inserts into `trip_media`.
- If `placeId` provided but no coords, resolves via Place Details.
- Returns the full row.

### Route: `src/app/api/media/[id]` — DELETE + PATCH (move between days/slots)

**Tests (vitest integration):**
- Happy path: TikTok URL → preview returns embed + ≥1 candidate.
- IG URL without token → 503 with clear error.
- Malformed URL → 400.
- Attach then re-attach same URL → 409 or idempotent return (pick one — recommend idempotent).
- Place extraction with caption that has no location → empty candidates, not an error.

---

## Phase 3 — Single-trip map view (2 days)

**Deliverable:** a map that renders everything planned for one trip.

### New component: `src/components/map/TripMap.tsx`

- Uses `react-map-gl/maplibre` with MapTiler Streets style.
- Accepts `{ itinerary: Itinerary, media: TripMedia[], focusDay?: number }`.
- Renders pins for:
  - Activities that have `coords` — colored by day (consistent palette: day 1 = coral, day 2 = teal, …), numbered by morning/afternoon/evening order.
  - Hotels with resolved coords (different marker shape).
  - `TripMedia` with coords — platform icon (TikTok / IG) on the pin.
- Pin click → popover with: activity name, time, category, and (if media attached) the embed iframe rendered inline.
- Fit-to-bounds on mount; "Day X" chips above the map filter pins.
- Mobile-first: map is full-screen on small viewports with a bottom drawer for day filter.

### Geocode backfill: `src/lib/geo/backfill.ts`

- Given an Activity without `coords`, call Places Text Search biased to the trip destination.
- Cache by `{destination, activity.name}` in a new `place_cache` table (TTL 90 days) — avoids re-spending on Places.
- Confidence rubric: exact match on name + destination city → `high`; partial → `medium`; fallback to city centroid → `low`; nothing → `unresolved` (pin not drawn).
- Run on-demand when map opens for legacy trips; persist back into `itinerary_data` via a server-side batch PATCH so it only runs once per trip.

### Routes
- `/trip/[id]` — existing; add a "View full map" button above the day list that opens the map as a full-screen modal.
- `/trip/[id]/map` — shareable deep link to the map view (respects `is_public`).

**Tests (playwright):**
- `tests/e2e/trip-map.spec.ts` — open a seeded trip, verify map renders, all activities have pins, clicking a pin opens popover with correct activity.
- `tests/e2e/trip-map-legacy.spec.ts` — open a legacy trip with no coords, wait for backfill, verify pins appear.

---

## Phase 4 — Add-a-clip UX (1 day)

**Deliverable:** users can add TikTok/IG clips to a trip on the web.

### Component: `src/components/trip/AddClipDialog.tsx`

- Trigger: "+ Add clip" button on each day section and on the map.
- Steps:
  1. Paste URL (or prefill from share extension deep link — Phase 5).
  2. Client calls `/api/media/preview`.
  3. Shows embed preview + platform badge + caption.
  4. Shows place candidates as cards; user picks one, or clicks "Drop pin manually" → mini-map picker.
  5. Picks day + slot (default: current day if opened from a day section; otherwise day 1 morning).
  6. Saves via `/api/media/attach`.
- After save: the day section shows the embed inline, and the map gets a new pin.

### Embed rendering: `src/components/media/SocialEmbed.tsx`

- Renders `trip_media.embed_html` in a sandboxed iframe (`sandbox="allow-scripts allow-same-origin allow-popups"`).
- Lazy-loads the platform's blocking embed script (`tiktok.com/embed.js`, `instagram.com/embed.js`) only when the embed scrolls into view.
- Fallback: if embed fails (deleted post), show thumbnail + "Watch on TikTok" link.

**Tests:**
- Unit: URL validators for TikTok (`vm.tiktok.com/...`, `www.tiktok.com/@user/video/123`), IG (`instagram.com/reel/...`, `instagram.com/p/...`).
- Playwright: paste → preview → attach → embed visible in day section + pin visible on map.

---

## Phase 5 — iOS share extension (1.5 days, native Swift)

**Deliverable:** from TikTok or Instagram, "Share → Daytrip" → app opens on the AddClip dialog with URL prefilled.

### Steps

1. **Xcode: add Share Extension target** to `mobile/ios/App.xcworkspace`.
   - Bundle id: `com.daytrip.app.share`.
   - Activation rule: `NSExtensionActivationSupportsWebURLWithMaxCount = 1`.
2. **App Group**: create `group.com.daytrip.shared`. Both main app and extension enable it in capabilities. Used to pass the shared URL across processes.
3. **Extension code** (Swift): `ShareViewController` reads the incoming URL, writes it to `UserDefaults(suiteName: "group.com.daytrip.shared")` under key `pending_clip_url`, opens `daytrip://add-clip?source=share-extension` via `extensionContext?.open(...)` (requires a helper workaround — see Apple sample).
4. **Main app**: register URL scheme `daytrip://` in `Info.plist` (`CFBundleURLTypes`). Capacitor's `App` plugin emits `appUrlOpen` event with the URL.
5. **Bridge**: a small Capacitor plugin (or reuse `@capacitor/preferences` pointed at the App Group) reads `pending_clip_url` and posts a message to the webview: `window.dispatchEvent(new CustomEvent('daytrip:pending-clip', { detail: { url } }))`.
6. **Web**: a top-level listener in `src/app/layout.tsx` (client boundary) catches the event, navigates to the user's active trip (or a trip picker if multiple), and opens `<AddClipDialog>` with the URL preset.

**Edge cases to handle:**
- User not logged in → route to login, preserve the URL in `localStorage` + app-group storage.
- No trips yet → show "Create a trip first" CTA, preserve URL.
- Multiple trips → picker sheet ("Add this clip to which trip?").

**Tests:**
- Manual: share a TikTok from the TikTok app → Daytrip should open on the AddClip dialog. Capture as a TestFlight-able build.
- Playwright can't exercise this; a single manual QA script in `docs/qa/ios-share-extension.md`.

---

## Phase 6 — Polish, analytics, docs (0.5 day)

- Per-platform analytics events (`clip_added`, `clip_attached_from_share`, `map_opened`, `pin_clicked`).
- Rate-limit `/api/media/preview` to 30 req/min/user (Vercel Edge middleware) — prevents accidental oEmbed spam.
- Update `CLAUDE.md` with the new data model.
- Update public site's landing page copy for Daytrip to mention "Save TikToks + Reels to your trip map".
- `docs/social-clips.md` — user-facing help doc + GIF of the share flow.

---

## Rollout

1. Ship Phases 1–4 behind a feature flag `clips_enabled` (per-user column in `itineraries`-adjacent settings or via an env var). Dogfood on Jonathan's + Ben's accounts first.
2. Phase 5 requires a TestFlight build — do this before inviting beta users.
3. Once stable, flip the flag to on-by-default and include the feature in the next LinkedIn post for Daytrip via MCC.

---

## Risk register

| Risk | Mitigation |
|------|------------|
| TikTok / IG oEmbed rate limits or deprecation | Cache oEmbed responses for 7 days. Fall back to thumbnail + link if embed fails. |
| Google Places API cost creep | Cache in `place_cache` table; only geocode when a clip is attached or a map opens for the first time. |
| Legacy trips with zero coords pollute the map | Skip `confidence='unresolved'` pins. Show a "Some stops couldn't be placed" banner with a "Geocode manually" CTA. |
| Share extension approval in App Store review | Apple allows URL-sharing extensions. Document TOS compliance (embed, no download) in the review notes. |
| Copyright DMCA on embedded clips | We embed, we don't host — standard oEmbed behavior. If a creator deletes the post the embed dies gracefully. |

---

## Effort summary

| Phase | Effort | Blocking next phase? |
|-------|--------|----------------------|
| 0 — Foundation | 0.5d | Yes for all |
| 1 — Data model | 1d | Yes |
| 2 — Ingestion | 1.5d | Yes for 4, partial for 3 |
| 3 — Trip map | 2d | No |
| 4 — Add clip UX (web) | 1d | No |
| 5 — iOS share ext | 1.5d | No |
| 6 — Polish | 0.5d | — |
| **Total** | **~8 days** of focused work | |

Phases 3 and 4 can run in parallel after Phase 2 lands. Phase 5 can start any time after Phase 4 is functional in the web.
