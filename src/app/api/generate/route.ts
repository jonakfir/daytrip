/**
 * Legacy /api/generate endpoint.
 *
 * The heavy generation flow now lives at /api/trip/start + /api/trip/step +
 * /api/trip/status (client-driven, resumable, no Vercel 300s race). This
 * shim preserves the old NDJSON contract so any native app or bookmarked
 * request still works: it creates a job, runs steps until done, and
 * streams the same event shapes the old UI expected.
 *
 * All new clients should use the /api/trip/* endpoints directly.
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { JWT_SECRET } from "@/lib/jwt-secret";
import { MAX_TRIP_DAYS } from "@/lib/constants";
import { createJob, runOneStep } from "@/lib/trip-job-runner";
import { daysBetween, nextStep } from "@/lib/trip-job";
import { isAdminRequest } from "@/lib/check-auth";
import {
  consumeTripCredit,
  isDbConfigured,
  addTripCredits,
  addClaudeUsage,
} from "@/lib/db";
import { hasAnonCreditLeft, readAnonUsed } from "@/lib/anon-credits";
import {
  fetchHeroImageForStep,
  fetchBestFlightsForStep,
  finalizeItinerary,
} from "@/lib/trip-external";
import { callClaudeWithUsage } from "@/lib/claude-client";
import type { GenerateRequest, Itinerary } from "@/types/itinerary";

export const runtime = "nodejs";
export const maxDuration = 300;

interface JwtPayload {
  userId?: string;
}

async function getCallerUserId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("daytrip-auth")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return (payload as JwtPayload).userId ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const authCookie = request.cookies.get("daytrip-auth")?.value;
  const isAdmin = await isAdminRequest(authCookie);
  const userId = await getCallerUserId(request);
  const isAnon = !isAdmin && !userId;

  let anonUsed = 0;
  if (isAnon) {
    anonUsed = await readAnonUsed(request);
    if (!hasAnonCreditLeft(anonUsed)) {
      return NextResponse.json(
        { error: "anon_limit_reached", message: "Used free trip." },
        { status: 402 }
      );
    }
  }

  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.destination || !body.startDate || !body.endDate) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }
  const numDays = daysBetween(body.startDate, body.endDate);
  if (numDays > MAX_TRIP_DAYS) {
    return NextResponse.json(
      {
        error: "trip_too_long",
        message: `Trip cannot exceed ${MAX_TRIP_DAYS} days.`,
      },
      { status: 400 }
    );
  }

  if (!isAdmin && userId) {
    if (!isDbConfigured()) {
      return NextResponse.json({ error: "db_not_configured" }, { status: 503 });
    }
    const remaining = await consumeTripCredit(userId);
    if (remaining === null) {
      return NextResponse.json(
        { error: "out_of_credits" },
        { status: 402 }
      );
    }
  }

  const anonToken = isAnon
    ? await new SignJWT({ used: anonUsed + 1 })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("365d")
        .sign(JWT_SECRET)
    : null;

  // Build the NDJSON stream by running steps server-side and emitting
  // the legacy event shapes. Heartbeat every 20s so clients without
  // the new progress UI still stay alive.
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (obj: unknown) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        } catch {}
      };
      const HEARTBEAT_MS = 20_000;
      const heartbeat = setInterval(() => send({ type: "heartbeat" }), HEARTBEAT_MS);

      try {
        const job = await createJob(body, { userId, anonToken });
        send({
          type: "start",
          jobId: job.id,
          numDays,
          destination: body.destination,
          originCity: body.originCity,
          startDate: body.startDate,
          endDate: body.endDate,
          travelers: body.travelers,
          travelStyle: body.style,
          shareId: job.shareId,
        });

        let current = job;
        while (current.status !== "complete" && current.status !== "failed") {
          const pending = nextStep(current);
          if (!pending) break;
          current = await runOneStep(current.id, {
            callClaude: callClaudeWithUsage,
            addUsage: async (uid, cents) => {
              addClaudeUsage(uid, cents).catch(() => undefined);
            },
            fetchHero: fetchHeroImageForStep,
            fetchFlights: fetchBestFlightsForStep,
          });

          // Emit legacy-shaped events as pieces land.
          if (pending.key === "hero" && current.heroImage) {
            send({ type: "hero", heroImage: current.heroImage });
          }
          if (pending.key === "booking" && current.booking) {
            send({
              type: "booking",
              hotels: current.booking.hotels,
              flights: current.flightsReal ?? current.booking.flights,
              tours: current.booking.tours,
              tips: current.booking.tips,
            });
          }
          send({
            type: "progress",
            completedDays: current.dayChunks.reduce((n, c) => n + c.days.length, 0),
            totalDays: numDays,
            stepLabel: current.stepLabel,
            currentStep: current.currentStep,
            totalSteps: current.totalSteps,
          });
        }

        if (current.status === "failed") {
          throw new Error(current.error ?? "Generation failed");
        }

        const itin = current.finalItinerary as Itinerary;
        await finalizeItinerary(itin).catch(() => undefined);
        send({ type: "days", days: itin.days });
        send({ type: "done", itinerary: itin });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (!isAdmin && userId) {
          addTripCredits(userId, 1).catch(() => undefined);
        }
        send({ type: "error", error: message });
      } finally {
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {}
      }
    },
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/x-ndjson",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
  };
  if (isAnon && anonToken) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    headers["Set-Cookie"] = `daytrip-anon=${anonToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${365 * 24 * 60 * 60}${secure}`;
  }

  return new Response(stream, { status: 200, headers });
}
