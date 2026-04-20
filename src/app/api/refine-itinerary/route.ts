import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import {
  callClaudeWithUsage,
  estimateUsageCents,
  isClaudeConfigured,
} from "@/lib/claude-client";
import { isAdminRequest } from "@/lib/check-auth";
import { addClaudeUsage, hasClaudeBudget } from "@/lib/db";
import { isPlaceInDestination } from "@/lib/verify-place";
import { parseClaudeJson } from "@/lib/trip-generator";
import type { Activity, Itinerary } from "@/types/itinerary";
import { JWT_SECRET } from "@/lib/jwt-secret";

export const runtime = "nodejs";
export const maxDuration = 300;

interface RefineRequest {
  itinerary: Itinerary;
  message: string;
}

interface JwtPayload {
  userId?: string;
}

/**
 * Fields the chatbot is allowed to mutate. Anything NOT in this set is
 * stripped before we hand the request to Claude AND re-asserted on
 * whatever comes back, so a misbehaving prompt can never, say, change
 * the trip's share ID or swap travelers from 2 → 7.
 */
const MUTABLE_FIELDS: Array<keyof Itinerary> = [
  "destination",
  "travelStyle",
  "budget",
  "days",
  "hotels",
  "hotelsByCity",
  "cityPlan",
  "flights",
  "tours",
  "tips",
  "heroImage",
];
const IMMUTABLE_FIELDS = new Set<keyof Itinerary>([
  "id",
  "shareId",
  "startDate",
  "endDate",
  "travelers",
  "originCity",
]);

export async function POST(req: NextRequest) {
  try {
    const authCookie = req.cookies.get("daytrip-auth")?.value;
    const admin = await isAdminRequest(authCookie);
    let userId: string | null = null;
    if (authCookie) {
      try {
        const { payload } = await jwtVerify(authCookie, JWT_SECRET);
        userId = (payload as JwtPayload).userId ?? null;
      } catch {}
    }

    if (!admin && !userId) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }

    // Silent per-credit budget cap
    if (!admin && userId) {
      const ok = await hasClaudeBudget(userId);
      if (!ok) {
        return NextResponse.json({
          reply:
            "You've made a lot of changes to this trip — buy a fresh trip credit ($3) for unlimited refinements on a new itinerary.",
          itinerary: undefined,
          unchanged: true,
        });
      }
    }

    let body: RefineRequest;
    try {
      body = (await req.json()) as RefineRequest;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    if (!body?.itinerary || !body?.message?.trim()) {
      return NextResponse.json(
        { error: "Missing itinerary or message" },
        { status: 400 }
      );
    }

    if (!isClaudeConfigured()) {
      return NextResponse.json({ error: "Claude not configured" }, { status: 503 });
    }

    // Send the FULL mutable itinerary to Claude. The chatbot's job is to
    // make any change the user asks for — hotels, flights, tours, tips,
    // the hero image, the travel style, the day plans. Everything below
    // the immutable trip identity (id/shareId/dates/travelers) is fair
    // game. Anything Claude doesn't change it must echo back verbatim.
    const mutableItinerary: Partial<Itinerary> = {};
    for (const field of MUTABLE_FIELDS) {
      if (body.itinerary[field] !== undefined) {
        // Narrow any to the field's own type; both sides are Itinerary.
        (mutableItinerary as Record<string, unknown>)[field] =
          body.itinerary[field];
      }
    }

    const systemPrompt = `You are a travel editor chatbot embedded in a trip itinerary app. The user is viewing a finished itinerary and may ask for any kind of change: swap a restaurant, move a day, replace a hotel tier, find cheaper flights, update the hero image search term, change the travel style, rewrite a tip.

Output ONLY a single JSON object. No prose, no markdown fences, no explanation outside the JSON. The JSON object has exactly two keys:
  "reply" — a friendly 1-2 sentence string describing what you changed (conversational, plain English).
  "itinerary" — the FULL updated itinerary object.

CRITICAL RULES:
1. Echo every field the user didn't ask you to change EXACTLY as it was in the input. Don't paraphrase, don't re-style, don't reorder. If the user asked to swap day 3's lunch, only day 3's afternoon block changes.
2. Only modify fields relevant to the user's request. Leave the rest alone.
3. GEOGRAPHY: every NEW place (restaurants, hotels, attractions, tours) must be physically located in the appropriate city. Multi-city trips should pin each activity to the day's city. If you're not 100% sure a place exists there, pick a different real place you ARE sure about.
4. Meal timing stays intact: morning = breakfast / brunch, afternoon = lunch, evening = dinner.
5. Keep the same schema shape as the input. Activity needs: time (HH:MM), name, category (food|culture|shopping|nature|entertainment|transport), description, duration. Hotel needs: name, pricePerNight, rating (number), bookingUrl, and optionally city + tier (hostel|budget|mid|upscale). Flight needs: airline, departure, arrival, price, bookingUrl, stops, originAirport, destinationAirport. Tour needs: name, price, duration, rating, bookingUrl. Tips are strings.
6. If the user asks for something out of scope (billing, payment, account), reply briefly explaining it's out of scope and echo the itinerary unchanged.`;

    const userPrompt = `Current itinerary:
${JSON.stringify(mutableItinerary, null, 2)}

Immutable (DO NOT CHANGE): dates ${body.itinerary.startDate} → ${body.itinerary.endDate}, ${body.itinerary.travelers} travelers.

User request: ${body.message.trim()}

Return JSON: {"reply":"...","itinerary":{...the full updated itinerary with ALL the same top-level fields as the input, even the ones you didn't change...}}`;

    const { text, usage } = await callClaudeWithUsage({
      system: systemPrompt,
      prompt: userPrompt,
      model: "claude-sonnet-4-6",
      maxTokens: 16_000,
    });
    if (userId && !admin) {
      addClaudeUsage(userId, estimateUsageCents(usage)).catch(() => undefined);
    }

    let reply = "Itinerary updated.";
    let newMutable: Partial<Itinerary> | null = null;

    try {
      const parsed = parseClaudeJson(text) as {
        reply?: unknown;
        itinerary?: unknown;
      };
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.reply === "string") reply = parsed.reply;
        if (parsed.itinerary && typeof parsed.itinerary === "object") {
          newMutable = parsed.itinerary as Partial<Itinerary>;
        }
      }
    } catch (e) {
      console.warn(
        "refine-itinerary parse failure:",
        e instanceof Error ? e.message : e,
        "raw:",
        text.slice(0, 500)
      );
    }

    // If parsing failed or Claude produced no itinerary, return the
    // original and a polite apology rather than a broken UI state.
    if (!newMutable) {
      return NextResponse.json({
        reply:
          "Hmm — I tried to make that change but couldn't parse the result. Can you rephrase or try a more specific request?",
        itinerary: body.itinerary,
        unchanged: true,
      });
    }

    // Merge: start from the original itinerary, then overlay every
    // mutable field Claude returned. This guarantees immutable fields
    // stay untouched even if Claude accidentally echoed them.
    const merged: Itinerary = { ...body.itinerary };
    const newMutableAsRec = newMutable as unknown as Record<string, unknown>;
    const mergedAsRec = merged as unknown as Record<string, unknown>;
    for (const field of MUTABLE_FIELDS) {
      const val = newMutableAsRec[field as string];
      if (val !== undefined) {
        mergedAsRec[field as string] = val;
      }
    }
    // Defensive: re-apply immutable fields from the original regardless
    // of what Claude returned.
    const originalAsRec = body.itinerary as unknown as Record<string, unknown>;
    for (const field of IMMUTABLE_FIELDS) {
      mergedAsRec[field as string] = originalAsRec[field as string];
    }

    // ── Geography post-check on FOOD only ───────────────────────────
    // Food is the highest-risk category for out-of-city hallucinations
    // (famous restaurants get pulled from other cities). Hotels, tours,
    // and flights have their own city / IATA context and aren't run
    // through OSM. Multi-city trips: gate against the day's city when
    // cityPlan covers that day.
    const destination = body.itinerary.destination;
    const cityPlan = merged.cityPlan;
    const oldDays = body.itinerary.days;
    const newDays = merged.days;

    interface ChangedFood {
      dayIdx: number;
      block: "morning" | "afternoon" | "evening";
      actIdx: number;
      oldActivity: Activity;
      newActivity: Activity;
      dayCity: string;
    }
    const changed: ChangedFood[] = [];

    for (let di = 0; di < Math.min(newDays.length, oldDays.length); di++) {
      const oldDay = oldDays[di];
      const newDay = newDays[di];
      const dayNumber = newDay.dayNumber;
      const cityEntry = cityPlan?.find(
        (c) => dayNumber >= c.startDay && dayNumber <= c.endDay
      );
      const dayCity = cityEntry?.city ?? destination;

      for (const block of ["morning", "afternoon", "evening"] as const) {
        const oldBlock = oldDay[block] ?? [];
        const newBlock = newDay[block] ?? [];
        for (let ai = 0; ai < newBlock.length; ai++) {
          const na = newBlock[ai];
          const oa = oldBlock[ai];
          if (na?.category === "food" && (!oa || oa.name !== na.name)) {
            changed.push({
              dayIdx: di,
              block,
              actIdx: ai,
              oldActivity: oa ?? na,
              newActivity: na,
              dayCity,
            });
          }
        }
      }
    }

    const verifications = await Promise.all(
      changed.map((c) => isPlaceInDestination(c.newActivity.name, c.dayCity))
    );

    const rejected: string[] = [];
    for (let idx = 0; idx < changed.length; idx++) {
      if (!verifications[idx]) {
        const pos = changed[idx];
        rejected.push(pos.newActivity.name);
        merged.days[pos.dayIdx][pos.block][pos.actIdx] = pos.oldActivity;
      }
    }

    if (rejected.length > 0) {
      const list = rejected.slice(0, 3).join(", ");
      reply = `${reply}  (Note: I tried suggesting ${list}${
        rejected.length > 3 ? " and others" : ""
      } but those aren't actually in the day's city, so I kept the original pick${
        rejected.length > 1 ? "s" : ""
      }.)`;
    }

    return NextResponse.json({
      reply,
      itinerary: merged,
      rejectedPlaces: rejected,
    });
  } catch (e) {
    console.error("refine-itinerary error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to refine itinerary", details: message },
      { status: 500 }
    );
  }
}
