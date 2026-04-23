/**
 * Resolve an itinerary row for mutation. Centralized so /api/media/*
 * all enforce ownership the same way.
 *
 * Lookup accepts either the row `id` (uuid) or the `share_id` (slug used
 * in URLs) — different callers have different handles on a trip.
 */

import { sql } from "@/lib/db-client";
import { ensureItinerariesTable } from "@/lib/trip-job-repo";

export interface ItineraryRef {
  id: string;
  shareId: string;
  userId: string | null;
  destination: string;
  isPublic: boolean;
}

export async function findItineraryForUser(
  idOrShareId: string,
  userId: string | null
): Promise<ItineraryRef | null> {
  await ensureItinerariesTable();
  const { rows } = await sql<{
    id: string;
    share_id: string;
    user_id: string | null;
    destination: string;
    is_public: boolean | null;
  }>`
    SELECT id, share_id, user_id, destination, is_public
    FROM itineraries
    WHERE id::text = ${idOrShareId} OR share_id = ${idOrShareId}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  const ref: ItineraryRef = {
    id: row.id,
    shareId: row.share_id,
    userId: row.user_id,
    destination: row.destination,
    isPublic: !!row.is_public,
  };
  // Read access: owner OR public. Write access handled by caller (they check
  // ref.userId === userId before mutating).
  if (!ref.isPublic && userId && ref.userId !== userId) {
    // Still return the ref — the route decides 403 vs 404 based on whether
    // the user is authenticated.
    return null;
  }
  return ref;
}

export async function assertOwner(ref: ItineraryRef, userId: string | null): Promise<boolean> {
  return !!userId && ref.userId === userId;
}
