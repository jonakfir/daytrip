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

export const runtime = "nodejs";
export const maxDuration = 300;

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "daytrip-secret-change-me-in-production"
);

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

    const body = (await req.json()) as RefineRequest;
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

    const systemPrompt = `You are a travel editor helping a traveler refine their itinerary. The user will describe a change they want (e.g. "make day 2 more relaxing", "swap the sushi dinner for vegetarian", "add a Harry Potter tour on day 3"). You respond with a friendly 1-sentence reply explaining what you changed, PLUS the updated "days" array in JSON.

Output format — this is critical. Respond with:
1. A single line: REPLY: <your 1-sentence friendly reply>
2. A line with just: JSON:
3. The updated days array as valid JSON (an array, not an object)

Example:
REPLY: I swapped the afternoon sushi for a vegetarian omakase at Nagi Shokudo in Shibuya.
JSON:
[{"dayNumber":1,"date":"...","title":"...","morning":[...],"afternoon":[...],"evening":[...],"tip":"..."}]

STRICT RULES:
- Only modify what the user asked about. Preserve everything else.
- GEOGRAPHY (CRITICAL): Every place you suggest MUST be physically located IN the destination city from the itinerary. Not "near", not "in the same country", not "famous nationally". If the itinerary is New York, suggest only places in New York — do NOT suggest Zahav (Philadelphia), restaurants from LA, or anywhere outside NYC. If you aren't 100% certain a place is in the destination, pick a different real place you ARE certain about.
- Use real place names that actually exist in the destination city.
- In the REPLY, only reference activity names that EXACTLY appeared in the provided itinerary JSON below. Never invent or guess the name of an activity you're replacing. If you don't remember the exact original name, describe the replacement only (e.g. "Added Breads Bakery on Day 2 morning" instead of "Replaced X with Breads Bakery").
- Meal timing: morning food = breakfast/brunch, afternoon food = lunch, evening food = dinner. Don't put steak at breakfast or bagels at dinner.`;

    const userPrompt = `Current itinerary for ${compactItinerary.destination}:
${JSON.stringify(compactItinerary, null, 2)}

User's request: ${body.message.trim()}

Update the days array accordingly. Keep activities not mentioned unchanged. Each Activity needs: time (HH:MM), name, category (food|culture|shopping|nature|entertainment|transport), description (1-2 sentences), duration.

Remember: in your REPLY line, ONLY reference activity names that appear in the JSON above. If you're replacing something, use its exact original name.`;

    const { text, usage } = await callClaudeWithUsage({
      system: systemPrompt,
      prompt: userPrompt,
      model: "claude-sonnet-4-6",
      maxTokens: 4000,
    });
    if (userId && !admin) {
      addClaudeUsage(userId, estimateUsageCents(usage)).catch(() => undefined);
    }

    // Parse the REPLY + JSON format
    const replyMatch = text.match(/REPLY:\s*([^\n]+)/i);
    const jsonMatch = text.match(/JSON:\s*([\s\S]+)/i);

    let reply = replyMatch?.[1]?.trim() ?? "Itinerary updated.";
    let newDays: typeof body.itinerary.days | null = null;
    let parseError: string | null = null;

    if (jsonMatch) {
      try {
        const jsonStr = stripFences(jsonMatch[1]);
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          newDays = parsed;
        } else {
          parseError = "Claude returned a non-array or empty days value";
        }
      } catch (e) {
        parseError = e instanceof Error ? e.message : "JSON parse failed";
        // Fallback: try to find a bare JSON array anywhere in the response
        const bareJson = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (bareJson) {
          try {
            const parsed = JSON.parse(bareJson[0]);
            if (Array.isArray(parsed) && parsed.length > 0) {
              newDays = parsed;
              parseError = null;
            }
          } catch {
            // give up
          }
        }
      }
    } else {
      // No JSON: try to find a bare array anywhere in the response
      const bareJson = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (bareJson) {
        try {
          const parsed = JSON.parse(bareJson[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            newDays = parsed;
          }
        } catch {
          parseError = "No JSON section and no bare array found";
        }
      } else {
        parseError = "Claude response missing JSON section";
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
