/**
 * Verify that a place (restaurant, attraction, etc.) actually exists in
 * a given destination city. Uses Photon (Komoot's free OSM-based geocoder)
 * — same API as our autocomplete, no key needed.
 *
 * Strategy:
 *   1. Geocode the destination to get its lat/lon and a rough bbox
 *   2. Search for the place name bounded to that bbox
 *   3. If any result lands within ~30 km of the city center, it's valid
 *   4. If not, mark as suspicious (probably a hallucination / wrong city)
 *
 * Failure modes: transient network errors return true (don't block the
 * user) — validation is a safety net, not a hard gate.
 */

interface PhotonFeature {
  properties: {
    name?: string;
    city?: string;
    country?: string;
    osm_value?: string;
    osm_key?: string;
  };
  geometry?: { coordinates?: [number, number] };
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

/** In-memory cache of destination centers (bounded to this request). */
const destinationCache = new Map<
  string,
  { lat: number; lon: number } | null
>();

async function getDestinationCenter(
  destination: string
): Promise<{ lat: number; lon: number } | null> {
  const key = destination.toLowerCase().trim();
  if (destinationCache.has(key)) return destinationCache.get(key)!;
  try {
    const primary = destination.split(",")[0]?.trim() || destination;
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      primary
    )}&limit=1&lang=en`;
    const res = await fetch(url);
    if (!res.ok) {
      destinationCache.set(key, null);
      return null;
    }
    const data = (await res.json()) as PhotonResponse;
    const f = data.features?.[0];
    const coords = f?.geometry?.coordinates;
    if (!coords) {
      destinationCache.set(key, null);
      return null;
    }
    const [lon, lat] = coords;
    const center = { lat, lon };
    destinationCache.set(key, center);
    return center;
  } catch {
    destinationCache.set(key, null);
    return null;
  }
}

/** Haversine distance in kilometers. */
function distanceKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const aa =
    s1 * s1 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      s2 *
      s2;
  return 2 * R * Math.asin(Math.sqrt(aa));
}

const RADIUS_KM = 35; // accepts anything within ~35 km of the destination center

/**
 * Returns true if a place with the given name exists within ~35km of the
 * destination city's center. Returns true (pass-through) on any network or
 * cache error so we never hard-block the user on a transient issue.
 */
export async function isPlaceInDestination(
  placeName: string,
  destination: string
): Promise<boolean> {
  const center = await getDestinationCenter(destination);
  if (!center) return true; // can't verify, don't block

  try {
    // Bias the search toward the destination center and ask for more results
    // so we can pick the closest match if there are multiple worldwide.
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", placeName);
    url.searchParams.set("limit", "10");
    url.searchParams.set("lang", "en");
    url.searchParams.set("lat", String(center.lat));
    url.searchParams.set("lon", String(center.lon));

    const res = await fetch(url.toString());
    if (!res.ok) return true;
    const data = (await res.json()) as PhotonResponse;
    const features = data.features ?? [];
    if (features.length === 0) {
      // Unknown place — could be too obscure for OSM. Don't block.
      return true;
    }

    // Check if ANY result is within the radius
    for (const f of features) {
      const coords = f.geometry?.coordinates;
      if (!coords) continue;
      const [lon, lat] = coords;
      const d = distanceKm(center, { lat, lon });
      if (d <= RADIUS_KM) return true;
    }

    // All results are far from destination → probably wrong city
    return false;
  } catch {
    return true; // pass-through on error
  }
}

/**
 * Given a list of activities, check each food activity's name against the
 * destination. Returns the indices of activities that appear to be in the
 * wrong city so the caller can filter / re-prompt them.
 */
export async function findSuspiciousFoodPlaces(
  activities: { name: string; category?: string }[],
  destination: string
): Promise<number[]> {
  const suspicious: number[] = [];
  // Only check food — that's where the hallucinations happen most
  const checks = activities.map((a, i) =>
    a.category === "food"
      ? isPlaceInDestination(a.name, destination).then((ok) => ({ i, ok }))
      : Promise.resolve({ i, ok: true })
  );
  const results = await Promise.all(checks);
  for (const { i, ok } of results) {
    if (!ok) suspicious.push(i);
  }
  return suspicious;
}
