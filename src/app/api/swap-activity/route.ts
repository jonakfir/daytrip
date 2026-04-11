import { NextRequest, NextResponse } from "next/server";
import { callClaude, isClaudeConfigured } from "@/lib/claude-client";
import { isAdminRequest } from "@/lib/check-auth";
import type { Activity } from "@/types/itinerary";

export const runtime = "nodejs";
export const maxDuration = 300;

interface SwapRequest {
  activity: Activity;
  destination: string;
  timeBlock?: "morning" | "afternoon" | "evening";
  reason?: string;
  priorActivities?: Activity[];
}

function stripFences(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenceMatch ? fenceMatch[1].trim() : text.trim();
}

export async function POST(req: NextRequest) {
  try {
    // Gate: only admin (and future paying users) can swap
    const authCookie = req.cookies.get("daytrip-auth")?.value;
    const admin = await isAdminRequest(authCookie);
    if (!admin) {
      return NextResponse.json(
        { error: "subscription_required" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as SwapRequest;
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

    const systemPrompt = `You are a travel editor. Suggest ONE replacement activity in the same city, same category, same time of day, and roughly the same duration. Output ONLY valid JSON — no markdown, no prose.`;

    const userPrompt = `City: ${body.destination}
Time block: ${body.timeBlock ?? "unknown"}
Activity to replace: "${body.activity.name}" at ${body.activity.time} (${body.activity.category}, ${body.activity.duration})
Original description: ${body.activity.description}
${priorContext ? `Other activities already planned this block: ${priorContext}` : ""}
${body.reason ? `Reason for swap: ${body.reason}` : ""}

Suggest ONE real, highly-rated alternative that locals and travelers love. It must:
- Be a real place in ${body.destination}
- Be different from the original
- Match the same category (${body.activity.category})
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

    const text = await callClaude({
      system: systemPrompt,
      prompt: userPrompt,
      model: "claude-sonnet-4-6",
      maxTokens: 1000,
    });

    let parsed: Activity;
    try {
      parsed = JSON.parse(stripFences(text)) as Activity;
    } catch (err) {
      console.error(
        "[swap-activity] Claude returned malformed JSON:",
        text.slice(0, 500)
      );
      return NextResponse.json(
        {
          error:
            "Claude returned an invalid activity format. Please try swapping again.",
        },
        { status: 502 }
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
