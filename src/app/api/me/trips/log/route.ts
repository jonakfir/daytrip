import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db-client";
import { getServerAuth } from "@/lib/check-auth";
import { isDbConfigured } from "@/lib/db";
import { resolveUserIdForAuth } from "@/lib/auth-helpers";

/**
 * POST /api/me/trips/log — record that the current user generated/viewed a
 * trip with the given shareId. Idempotent: re-logging the same shareId is a
 * no-op (ON CONFLICT DO NOTHING).
 *
 * Called from src/app/trip/[id]/page.tsx after a real itinerary loads.
 * Anonymous users get a 401 silently — the trip page swallows it.
 */
export async function POST(req: NextRequest) {
  const auth = await getServerAuth();
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Permanent admin path issues older cookies without a userId. Fall back to
  // an email lookup so logged trips actually attach to the right user row.
  const userId = await resolveUserIdForAuth(auth);
  if (!userId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let body: {
    shareId?: unknown;
    destination?: unknown;
    startDate?: unknown;
    endDate?: unknown;
    travelers?: unknown;
    travelStyle?: unknown;
    budget?: unknown;
    days?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  try {
    const shareId = String(body?.shareId || "").trim();
    const destination = String(body?.destination || "").trim();
    if (!shareId || !destination) {
      return NextResponse.json(
        { error: "shareId and destination are required" },
        { status: 400 }
      );
    }
    if (shareId === "demo" || shareId === "tokyo-demo-5d") {
      // Don't log the demo trip — every visitor sees it.
      return NextResponse.json({ ok: true, skipped: true });
    }

    const startDate = body?.startDate ? String(body.startDate) : null;
    const endDate = body?.endDate ? String(body.endDate) : null;
    const travelers =
      typeof body?.travelers === "number" ? body.travelers : null;
    const travelStyle = body?.travelStyle ? String(body.travelStyle) : null;
    const budget = body?.budget ? String(body.budget) : null;
    const days = typeof body?.days === "number" ? body.days : null;

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

    await sql`
      INSERT INTO user_trips (
        user_id, share_id, destination, start_date, end_date,
        travelers, travel_style, budget, days
      )
      VALUES (
        ${userId}, ${shareId}, ${destination}, ${startDate}, ${endDate},
        ${travelers}, ${travelStyle}, ${budget}, ${days}
      )
      ON CONFLICT (user_id, share_id) DO NOTHING
    `;

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[me/trips/log POST] error:", e);
    return NextResponse.json(
      { error: "Could not log trip" },
      { status: 500 }
    );
  }
}
