import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { JWT_SECRET } from "@/lib/jwt-secret";
import { MAX_TRIP_DAYS } from "@/lib/constants";
import { createJob } from "@/lib/trip-job-runner";
import { daysBetween } from "@/lib/trip-job";
import { isAdminRequest } from "@/lib/check-auth";
import { consumeTripCredit, isDbConfigured, addTripCredits } from "@/lib/db";
import { hasAnonCreditLeft, readAnonUsed } from "@/lib/anon-credits";
import type { GenerateRequest } from "@/types/itinerary";

export const runtime = "nodejs";
export const maxDuration = 30;

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
        {
          error: "anon_limit_reached",
          message: "You've used your free trip. Sign up or buy 1 for $3.",
          checkoutPath: "/api/stripe/checkout",
        },
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
      { error: "Missing required fields: destination, startDate, endDate" },
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
      return NextResponse.json(
        { error: "db_not_configured", message: "Trip generation requires DB." },
        { status: 503 }
      );
    }
    const remaining = await consumeTripCredit(userId);
    if (remaining === null) {
      return NextResponse.json(
        {
          error: "out_of_credits",
          message: "You've used your trip credits.",
          checkoutPath: "/api/stripe/checkout",
        },
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

  try {
    const job = await createJob(body, { userId, anonToken });
    const res = NextResponse.json({
      jobId: job.id,
      totalSteps: job.totalSteps,
      steps: job.steps,
    });
    if (isAnon) {
      const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
      res.headers.set(
        "Set-Cookie",
        `daytrip-anon=${anonToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${365 * 24 * 60 * 60}${secure}`
      );
    }
    return res;
  } catch (e) {
    if (!isAdmin && userId) {
      addTripCredits(userId, 1).catch(() => undefined);
    }
    const message = e instanceof Error ? e.message : "Failed to start job";
    return NextResponse.json({ error: "start_failed", message }, { status: 500 });
  }
}
