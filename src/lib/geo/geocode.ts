/**
 * Geocoding — turns a place-name string (destination-biased) into a
 * coordinate + canonical place identity. Results are cached in the
 * `place_cache` Postgres table so map opens and clip-adds don't re-hit
 * Google Places for the same query.
 *
 * Provider hierarchy:
 *   1. GOOGLE_PLACES_API_KEY set → Google Places API (New) Text Search.
 *   2. Fallback → OpenStreetMap Nominatim (free, 1 req/s rate limit).
 *
 * This file deliberately does not import `@/lib/social/*` — geocoding
 * is shared infrastructure (the map view uses it for plain Activities
 * too, not just clips).
 */

import { sql } from "@/lib/db-client";
import { ensureSocialClipsTables } from "@/lib/social/db-bootstrap";
import type { GeocodeConfidence } from "@/types/itinerary";

export interface GeocodeResult {
  placeId?: string;
  displayName: string;
  latitude: number;
  longitude: number;
  confidence: GeocodeConfidence;
  provider: "google_places" | "nominatim" | "manual";
}

function googlePlacesConfigured(): boolean {
  return !!process.env.GOOGLE_PLACES_API_KEY;
}

function normalizeKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

async function readCache(destinationKey: string, query: string): Promise<GeocodeResult | null> {
  await ensureSocialClipsTables();
  const { rows } = await sql<{
    place_id: string | null;
    display_name: string | null;
    latitude: number;
    longitude: number;
    confidence: GeocodeConfidence;
    provider: GeocodeResult["provider"];
    expires_at: string;
  }>`
    SELECT place_id, display_name, latitude, longitude, confidence, provider, expires_at
    FROM public.place_cache
    WHERE destination_key = ${destinationKey}
      AND query = ${query}
      AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const row = rows[0];
  if (!row || row.latitude == null) return null;
  return {
    placeId: row.place_id ?? undefined,
    displayName: row.display_name ?? query,
    latitude: row.latitude,
    longitude: row.longitude,
    confidence: row.confidence,
    provider: row.provider,
  };
}

async function writeCache(
  destinationKey: string,
  query: string,
  r: GeocodeResult | null,
  raw: unknown
): Promise<void> {
  await ensureSocialClipsTables();
  await sql`
    INSERT INTO public.place_cache
      (destination_key, query, provider, place_id, display_name, latitude, longitude, confidence, raw_response)
    VALUES
      (${destinationKey}, ${query}, ${r?.provider ?? "google_places"},
       ${r?.placeId ?? null}, ${r?.displayName ?? null},
       ${r?.latitude ?? null}, ${r?.longitude ?? null},
       ${r?.confidence ?? "unresolved"}, ${JSON.stringify(raw ?? null)}::jsonb)
    ON CONFLICT (destination_key, query, provider) DO UPDATE SET
      place_id = EXCLUDED.place_id,
      display_name = EXCLUDED.display_name,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      confidence = EXCLUDED.confidence,
      raw_response = EXCLUDED.raw_response,
      expires_at = now() + interval '90 days'
  `;
}

async function googlePlacesSearch(query: string, destination: string): Promise<{ result: GeocodeResult | null; raw: unknown }> {
  const body = {
    textQuery: `${query}, ${destination}`,
    maxResultCount: 1,
    locationBias: undefined as unknown, // optional; the text prefix is usually enough
  };
  const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY!,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.types",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const raw = await r.json().catch(() => ({}));
  if (!r.ok) {
    // Surface a telltale error up so the caller can log; don't throw — we
    // still want to cache the "unresolved" outcome so we don't retry forever.
    return { result: null, raw };
  }
  const place = (raw as { places?: Array<{ id: string; displayName?: { text: string }; location?: { latitude: number; longitude: number }; formattedAddress?: string; types?: string[] }> }).places?.[0];
  if (!place?.location) return { result: null, raw };

  // Confidence heuristic: exact word overlap between the query and the
  // returned displayName → high; otherwise medium. City-only results
  // (where the destination itself is the top hit) → low.
  const q = normalizeKey(query);
  const name = normalizeKey(place.displayName?.text ?? "");
  const isCityType = place.types?.some((t) => ["locality", "political", "administrative_area_level_1"].includes(t));
  const confidence: GeocodeConfidence = isCityType ? "low" : name && name.includes(q.split(" ")[0]) ? "high" : "medium";

  return {
    raw,
    result: {
      placeId: place.id,
      displayName: place.displayName?.text ?? query,
      latitude: place.location.latitude,
      longitude: place.location.longitude,
      confidence,
      provider: "google_places",
    },
  };
}

// Polite rate limit for Nominatim (1 req/s per their usage policy).
let nominatimLastHit = 0;
async function nominatimSearch(query: string, destination: string): Promise<{ result: GeocodeResult | null; raw: unknown }> {
  const wait = Math.max(0, 1100 - (Date.now() - nominatimLastHit));
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  nominatimLastHit = Date.now();

  const url =
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=0` +
    `&q=${encodeURIComponent(`${query}, ${destination}`)}`;
  const r = await fetch(url, {
    headers: { "user-agent": "daytrip/1.0 (https://daytrip-ai.com)" },
    cache: "no-store",
  });
  if (!r.ok) return { result: null, raw: { status: r.status } };
  const arr = (await r.json().catch(() => [])) as Array<{
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    class?: string;
  }>;
  const hit = arr[0];
  if (!hit) return { result: null, raw: arr };
  return {
    raw: arr,
    result: {
      placeId: String(hit.place_id),
      displayName: hit.display_name,
      latitude: parseFloat(hit.lat),
      longitude: parseFloat(hit.lon),
      // OSM rarely distinguishes POI vs city cleanly; default to medium.
      confidence: hit.class === "place" ? "low" : "medium",
      provider: "nominatim",
    },
  };
}

export async function geocode(query: string, destination: string): Promise<GeocodeResult | null> {
  const destinationKey = normalizeKey(destination);
  const queryKey = normalizeKey(query);
  if (!queryKey || !destinationKey) return null;

  // Cache read
  try {
    const cached = await readCache(destinationKey, queryKey);
    if (cached) return cached;
  } catch (err) {
    console.warn("[geocode] cache read failed:", err instanceof Error ? err.message : err);
  }

  const { result, raw } = googlePlacesConfigured()
    ? await googlePlacesSearch(queryKey, destination)
    : await nominatimSearch(queryKey, destination);

  // Cache write is fire-and-forget — failures shouldn't block the response.
  writeCache(destinationKey, queryKey, result, raw).catch((err) =>
    console.warn("[geocode] cache write failed:", err instanceof Error ? err.message : err)
  );

  return result;
}
