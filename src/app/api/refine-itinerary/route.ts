import { NextRequest, NextResponse } from "next/server";
import { callClaude, isClaudeConfigured } from "@/lib/claude-client";
import { isAdminRequest } from "@/lib/check-auth";
import type { Itinerary } from "@/types/itinerary";

export const runtime = "nodejs";
export const maxDuration = 300;

interface RefineRequest {
  itinerary: Itinerary;
  message: string;
}

function stripFences(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenceMatch ? fenceMatch[1].trim() : text.trim();
}

export async function POST(req: NextRequest) {
  try {
    const authCookie = req.cookies.get("daytrip-auth")?.value;
    const admin = await isAdminRequest(authCookie);
    if (!admin) {
      return NextResponse.json(
        { error: "subscription_required" },
        { status: 403 }
      );
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

Only modify what the user asked about. Preserve everything else. Use real place names.`;

    const userPrompt = `Current itinerary for ${compactItinerary.destination}:
${JSON.stringify(compactItinerary, null, 2)}

User's request: ${body.message.trim()}

Update the days array accordingly. Keep activities not mentioned unchanged. Each Activity needs: time (HH:MM), name, category (food|culture|shopping|nature|entertainment|transport), description (1-2 sentences), duration.`;

    const text = await callClaude({
      system: systemPrompt,
      prompt: userPrompt,
      model: "claude-sonnet-4-6",
      maxTokens: 6000,
    });

    // Parse the REPLY + JSON format
    const replyMatch = text.match(/REPLY:\s*([^\n]+)/i);
    const jsonMatch = text.match(/JSON:\s*([\s\S]+)/i);

    let reply = replyMatch?.[1]?.trim() ?? "Itinerary updated.";
    let newDays = body.itinerary.days;

    if (jsonMatch) {
      try {
        const jsonStr = stripFences(jsonMatch[1]);
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          newDays = parsed;
        }
      } catch (parseError) {
        console.warn(
          "Failed to parse refined days JSON:",
          parseError instanceof Error ? parseError.message : parseError
        );
        // Fall back: try to extract JSON anywhere in the response
        const bareJson = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (bareJson) {
          try {
            newDays = JSON.parse(bareJson[0]);
          } catch {}
        }
      }
    }

    const updatedItinerary: Itinerary = {
      ...body.itinerary,
      days: newDays,
    };

    return NextResponse.json({
      reply,
      itinerary: updatedItinerary,
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
