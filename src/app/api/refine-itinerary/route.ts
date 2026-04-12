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
import type { Activity, Itinerary } from "@/types/itinerary";
import { JWT_SECRET } from "@/lib/jwt-secret";

export const runtime = "nodejs";
export const maxDuration = 300;

interface RefineRequest {
  itinerary: Itinerary;
  message: string;
}

interface JwtPayload {
  email?: string;
  userId?: string;
  role?: string;
}

function stripFences(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenceMatch ? fenceMatch[1].trim() : text.trim();
}

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
      return NextResponse.json(
        { error: "auth_required" },
        { status: 401 }
      );
    }

    // Silent per-credit usage cap: if the user has exhausted their $1 of
    // Claude budget on this credit, refuse refinement. Surface as a
    // generic message — we never reveal the dollar count.
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
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }
    if (!body?.itinerary || !body?.message?.trim()) {
      return NextResponse.json(
        { error: "Missing itinerary or message" },
        { status: 400 }
      );
    }

    if (!isClaudeConfigured()) {
      return NextResponse.json(
        { error: "Claude not configured" },
        { status: 503 }
      );
    }

    // Send only the parts of the itinerary that are useful for refinement —
    // skip hotels/flights/tours/tips since the user is refining day plans.
    const compactItinerary = {
      destination: body.itinerary.destination,
      startDate: body.itinerary.startDate,
      endDate: body.itinerary.endDate,
      travelers: body.itinerary.travelers,
      travelStyle: body.itinerary.travelStyle,
      days: body.itinerary.days.map((d) => ({
        dayNumber: d.dayNumber,
        date: d.date,
        title: d.title,
        morning: d.morning.map((a) => ({
          time: a.time,
          name: a.name,
          category: a.category,
          description: a.description,
          duration: a.duration,
        })),
        afternoon: d.afternoon.map((a) => ({
          time: a.time,
          name: a.name,
          category: a.category,
          description: a.description,
          duration: a.duration,
        })),
        evening: d.evening.map((a) => ({
          time: a.time,
          name: a.name,
          category: a.category,
          description: a.description,
          duration: a.duration,
        })),
        tip: d.tip,
      })),
    };

    const systemPrompt = `Travel editor. Output ONLY a single JSON object. No prose, no markdown fences, no explanation outside the JSON. The JSON object has exactly two keys: "reply" (a friendly 1-sentence string explaining what you changed) and "days" (the full updated days array).

STRICT RULES:
- Only modify what the user asked about. Preserve everything else exactly.
- GEOGRAPHY (CRITICAL): Every place you suggest MUST be physically located IN the destination city. Not "near", not "in the same country". If you aren't 100% certain a place is in the destination, pick a different real place you ARE certain about.
- Use real place names that actually exist in the destination city.
- Meal timing: morning food = breakfast/brunch, afternoon food = lunch, evening food = dinner.`;

    const userPrompt = `Current itinerary for ${compactItinerary.destination}:
${JSON.stringify(compactItinerary, null, 2)}

User's request: ${body.message.trim()}

Respond with a single JSON object (no markdown, no code fences, no text outside the JSON):
{"reply":"one sentence about what you changed","days":[...the full updated days array...]}

Each Activity needs: time (HH:MM), name, category (food|culture|shopping|nature|entertainment|transport), description (1-2 sentences), duration.
Keep activities not mentioned unchanged. Every place must be real and in ${compactItinerary.destination}.`;

    const { text, usage } = await callClaudeWithUsage({
      system: systemPrompt,
      prompt: userPrompt,
      model: "claude-sonnet-4-6",
      maxTokens: 8000,
    });
    if (userId && !admin) {
      addClaudeUsage(userId, estimateUsageCents(usage)).catch(() => undefined);
    }

    // Parse the JSON object — Claude should return {"reply":"...","days":[...]}
    let reply = "Itinerary updated.";
    let newDays: typeof body.itinerary.days | null = null;
    let parseError: string | null = null;

    try {
      const cleaned = stripFences(text);
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.reply === "string") reply = parsed.reply;
        if (Array.isArray(parsed.days) && parsed.days.length > 0) {
          newDays = parsed.days;
        } else {
          parseError = "Parsed JSON but 'days' was empty or missing";
        }
      } else {
        parseError = "Parsed JSON but not an object";
      }
    } catch (e) {
      parseError = e instanceof Error ? e.message : "JSON parse failed";
      // Fallback: try to extract a JSON object from mixed prose + JSON
      const objMatch = text.match(/\{[\s\S]*"days"\s*:\s*\[[\s\S]*\]\s*\}/);
      if (objMatch) {
        try {
          const parsed = JSON.parse(objMatch[0]);
          if (typeof parsed.reply === "string") reply = parsed.reply;
          if (Array.isArray(parsed.days) && parsed.days.length > 0) {
            newDays = parsed.days;
            parseError = null;
          }
        } catch {
          // give up
        }
      }
    }

    // If parsing failed, tell the user we couldn't apply the change.
    // This prevents the diverged-reply bug where the LLM says "I swapped X
    // for Y" but the rendered itinerary never updates.
    if (!newDays) {
      console.warn(
        "refine-itinerary parse failure:",
        parseError,
        "raw response:",
        text.slice(0, 500)
      );
      return NextResponse.json({
        reply:
          "Hmm — I tried to make that change but couldn't. Can you rephrase or try a more specific request?",
        itinerary: body.itinerary,
        unchanged: true,
      });
    }

    // ── Post-validation: catch out-of-city hallucinations ────────────
    // Claude sometimes suggests famous restaurants that are in OTHER cities
    // (e.g. "Zahav" for New York, which is actually in Philadelphia).
    // We verify every NEW food activity against OSM and revert any that
    // aren't actually in the destination city.
    const destination = body.itinerary.destination;
    const oldDays = body.itinerary.days;
    const changedFoodPositions: Array<{
      dayIdx: number;
      block: "morning" | "afternoon" | "evening";
      actIdx: number;
      oldActivity: Activity;
      newActivity: Activity;
    }> = [];

    for (let di = 0; di < Math.min(newDays.length, oldDays.length); di++) {
      const oldDay = oldDays[di];
      const newDay = newDays[di];
      for (const block of ["morning", "afternoon", "evening"] as const) {
        const oldBlock = oldDay[block] ?? [];
        const newBlock = newDay[block] ?? [];
        for (let ai = 0; ai < newBlock.length; ai++) {
          const na = newBlock[ai];
          const oa = oldBlock[ai];
          if (
            na?.category === "food" &&
            (!oa || oa.name !== na.name)
          ) {
            changedFoodPositions.push({
              dayIdx: di,
              block,
              actIdx: ai,
              oldActivity: oa ?? na,
              newActivity: na,
            });
          }
        }
      }
    }

    // Verify in parallel — Photon handles concurrent requests fine
    const verifications = await Promise.all(
      changedFoodPositions.map(({ newActivity }) =>
        isPlaceInDestination(newActivity.name, destination)
      )
    );

    const rejected: string[] = [];
    for (let idx = 0; idx < changedFoodPositions.length; idx++) {
      if (!verifications[idx]) {
        const pos = changedFoodPositions[idx];
        rejected.push(pos.newActivity.name);
        // Revert this one activity to the original
        newDays[pos.dayIdx][pos.block][pos.actIdx] = pos.oldActivity;
        console.warn(
          `[refine-itinerary] Rejected out-of-city food: ${pos.newActivity.name} (destination: ${destination})`
        );
      }
    }

    // If we rejected anything, prepend a note to the reply so the user
    // knows some changes were blocked.
    if (rejected.length > 0) {
      const list = rejected.slice(0, 3).join(", ");
      reply = `${reply}  (Note: I tried suggesting ${list}${
        rejected.length > 3 ? " and others" : ""
      } but those aren't actually in ${destination.split(",")[0]}, so I kept the original pick${rejected.length > 1 ? "s" : ""} for those slot${rejected.length > 1 ? "s" : ""}.)`;
    }

    const updatedItinerary: Itinerary = {
      ...body.itinerary,
      days: newDays,
    };

    return NextResponse.json({
      reply,
      itinerary: updatedItinerary,
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
