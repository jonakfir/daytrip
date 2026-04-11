import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getServerAuth } from "@/lib/check-auth";
import { isDbConfigured } from "@/lib/db";
import { resolveUserIdForAuth } from "../_shared";

/**
 * GET /api/me/trips — list all trips the current user has planned.
 *
 * Backed by a small Postgres `user_trips` log table that's populated by the
 * /api/me/trips/log endpoint after the trip view page successfully loads an
 * itinerary. Independent of supabase.itineraries — sidesteps the FK / two-DB
 * mismatch in the codebase so trips for Postgres-authenticated users actually
 * track to a real owner.
 */
export async function GET() {
  const auth = await getServerAuth();
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ trips: [] });
  }

  // Permanent admin path issues older cookies without a userId. Fall back to
  // an email lookup so the user doesn't have to log out / back in.
  const userId = await resolveUserIdForAuth(auth);
  if (!userId) {
    // Authenticated but we couldn't resolve a row — return empty (not 401),
    // because the user is logged in, they just haven't generated any trips
    // tracked under their account yet.
    return NextResponse.json({ trips: [] });
  }

  try {
    // Ensure schema (idempotent)
    await sql`
      CREATE TABLE IF NOT EXISTS user_trips (
        user_id uuid NOT NULL,
        share_id text NOT NULL,
        destination text NOT NULL,
        start_date date,
        end_date date,
        travelers integer,
        travel_style text,
        budget text,
        days integer,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, share_id)
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS user_trips_user_id_idx ON user_trips(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS user_trips_created_at_idx ON user_trips(created_at DESC);`;

    const { rows } = await sql<{
      share_id: string;
      destination: string;
      start_date: string | null;
      end_date: string | null;
      travelers: number | null;
      travel_style: string | null;
      budget: string | null;
      days: number | null;
      created_at: string;
    }>`
      SELECT share_id, destination, start_date, end_date, travelers,
             travel_style, budget, days, created_at
      FROM user_trips
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 200
    `;

    return NextResponse.json({
      trips: rows.map((r) => ({
        shareId: r.share_id,
        destination: r.destination,
        startDate: r.start_date,
        endDate: r.end_date,
        travelers: r.travelers,
        travelStyle: r.travel_style,
        budget: r.budget,
        days: r.days,
        createdAt: r.created_at,
      })),
    });
  } catch (e) {
    console.error("[me/trips GET] error:", e);
    return NextResponse.json(
      { error: "Could not load trips" },
      { status: 500 }
    );
  }
}
