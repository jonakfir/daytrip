/**
 * Extract up to 3 place-name candidates from a social clip's caption/title,
 * biased to a trip's destination. Uses Claude because captions are messy
 * (emojis, hashtags, mixed languages, brand names interleaved with POIs).
 *
 * Fail-soft: if Claude is unreachable or returns garbage, we return the
 * empty array and the UI falls back to "drop pin manually".
 */

import { callClaudeWithUsage, isClaudeConfigured } from "@/lib/claude-client";

export interface PlaceCandidate {
  name: string;
  type: "restaurant" | "landmark" | "neighborhood" | "hotel" | "activity" | "other";
  city?: string;
}

function stripFences(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenceMatch ? fenceMatch[1].trim() : text.trim();
}

export async function extractPlaceCandidates(args: {
  caption: string;
  destination: string;
  authorName?: string;
}): Promise<PlaceCandidate[]> {
  const caption = args.caption.trim();
  if (!caption) return [];
  if (!isClaudeConfigured()) return [];

  const system = [
    "You extract specific, searchable place names from short-video captions.",
    "You ONLY output JSON. No prose, no markdown fences.",
    "If the caption doesn't name a specific place, return an empty array.",
    `The user is planning a trip to ${args.destination} — prefer candidates plausibly in that area.`,
  ].join(" ");

  const prompt = `Caption: ${JSON.stringify(caption)}
${args.authorName ? `Posted by: ${args.authorName}\n` : ""}Trip destination: ${args.destination}

Return a JSON array (0 to 3 items) of place candidates. Each item:
{
  "name": "Specific place name a traveler could look up",
  "type": "restaurant" | "landmark" | "neighborhood" | "hotel" | "activity" | "other",
  "city": "City name if the caption implies a different city than ${args.destination}"
}

Rules:
- Only specific, searchable names. Not "this cafe", not "that view".
- Skip vague vibes ("vibes", "aesthetic", "must visit").
- Skip brand-generic phrases ("best pasta", "food tour").
- If nothing specific is named, return [].`;

  try {
    const { text } = await callClaudeWithUsage({
      system,
      prompt,
      model: "claude-haiku-4-5",
      maxTokens: 300,
    });
    const cleaned = stripFences(text);
    const arr = JSON.parse(cleaned);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x): x is PlaceCandidate => !!x && typeof x.name === "string" && x.name.length > 1)
      .slice(0, 3);
  } catch (err) {
    console.warn("[extract-place] extraction failed:", err instanceof Error ? err.message : err);
    return [];
  }
}
