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
import type { Activity } from "@/types/itinerary";

export const runtime = "nodejs";
export const maxDuration = 300;

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "daytrip-secret-change-me-in-production"
);

interface SwapRequest {
  activity: Activity;
  destination: string;
  timeBlock?: "morning" | "afternoon" | "evening";
  reason?: string;
  priorActivities?: Activity[];
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
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }

    // Silent per-credit usage cap
    if (!admin && userId) {
      const ok = await hasClaudeBudget(userId);
      if (!ok) {
        return NextResponse.json(
          {
            error: "credit_exhausted",
            message:
              "This trip has been fully refined. Buy a new trip credit ($3) to keep swapping.",
          },
          { status: 402 }
        );
      }
    }

    let body: SwapRequest;
    try {
      body = (await req.json()) as SwapRequest;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }
    if (!body?.activity || !body?.destination) {
      return NextResponse.json(
        { error: "Missing activity or destination" },
        { status: 400 }
      );
    }

    if (!isClaudeConfigured()) {
      return NextResponse.json(
        { error: "Claude not configured on the server" },
        { status: 503 }
      );
    }

    const priorContext = (body.priorActivities ?? [])
      .map((a) => `${a.time} — ${a.name}`)
      .join(", ");

    const systemPrompt = `You are a travel editor. Suggest ONE replacement activity PHYSICALLY LOCATED in the requested city, same category, same time of day, and roughly the same duration. Never suggest a place from a different city. Output ONLY valid JSON — no markdown, no prose.`;

    const userPrompt = `City: ${body.destination}
Time block: ${body.timeBlock ?? "unknown"}
Activity to replace: "${body.activity.name}" at ${body.activity.time} (${body.activity.category}, ${body.activity.duration})
Original description: ${body.activity.description}
${priorContext ? `Other activities already planned this block: ${priorContext}` : ""}
${body.reason ? `Reason for swap: ${body.reason}` : ""}

Suggest ONE real, highly-rated alternative that locals and travelers love. It must:
- Be PHYSICALLY located inside ${body.destination} (not "near", not "famous nearby", not a different city). If you are not 100% certain a place is in ${body.destination}, do not use it — pick a different real place you are sure about.
- Be different from the original
- Match the same category (${body.activity.category})
- Match the meal time if food (morning=breakfast, afternoon=lunch, evening=dinner)
- Fit the same time slot (${body.activity.time})
- Be geographically reasonable given the other activities in this block

Return ONLY this JSON object (no other text):
{
  "time": "${body.activity.time}",
  "name": "string",
  "category": "${body.activity.category}",
  "description": "1-2 vivid sentences",
  "duration": "${body.activity.duration}",
  "rating": 4.5,
  "reviewCount": 1234
}`;

    // Ask Claude up to 2 times — once with the normal prompt, and a second
    // time with an explicit "don't suggest X" if the first suggestion turns
    // out to be in the wrong city.
    let parsed: Activity | null = null;
    let rejected: string | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      const extraConstraint =
        attempt === 1 && rejected
          ? `\n\nIMPORTANT: Do NOT suggest "${rejected}" — it is not in ${body.destination}. Suggest a different real place that is physically located in ${body.destination}.`
          : "";

      const { text, usage } = await callClaudeWithUsage({
        system: systemPrompt,
        prompt: userPrompt + extraConstraint,
        model: "claude-sonnet-4-6",
        maxTokens: 800,
      });
      if (userId && !admin) {
        addClaudeUsage(userId, estimateUsageCents(usage)).catch(
          () => undefined
        );
      }

      let candidate: Activity;
      try {
        candidate = JSON.parse(stripFences(text)) as Activity;
      } catch (err) {
        console.error(
          "[swap-activity] Claude returned malformed JSON:",
          String(text).slice(0, 500)
        );
        rejected = "malformed-json";
        continue; // try again
      }

      // Only verify food activities (where hallucinations happen most)
      if (candidate.category === "food") {
        const ok = await isPlaceInDestination(candidate.name, body.destination);
        if (!ok) {
          console.warn(
            `[swap-activity] Rejected ${candidate.name} (not in ${body.destination}), attempt ${attempt + 1}`
          );
          rejected = candidate.name;
          continue; // try once more
        }
      }
      parsed = candidate;
      break;
    }

    if (!parsed) {
      return NextResponse.json(
        {
          error: "out_of_city",
          message: `Couldn't find a real alternative in ${body.destination.split(",")[0]}. Try a different swap.`,
        },
        { status: 422 }
      );
    }

    // Preserve the original time slot as a hard guarantee
    const swapped: Activity = {
      ...parsed,
      time: body.activity.time,
      category: body.activity.category,
      distanceFromPrevious: body.activity.distanceFromPrevious,
      walkingTime: body.activity.walkingTime,
    };

    return NextResponse.json({ activity: swapped });
  } catch (e) {
    console.error("swap-activity error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to swap activity", details: message },
      { status: 500 }
    );
  }
}
