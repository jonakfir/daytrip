/**
 * Pure-ish generator functions for a single trip step. These are the
 * building blocks the step executor calls; each function does ONE
 * unit of work and returns the result (no state persistence here —
 * the executor owns writes to the trip_jobs table).
 *
 * Most of this code was extracted from the monolithic
 * /api/generate route. Behavior is preserved, but the functions are
 * now individually unit-testable and can be stubbed in integration
 * tests by injecting a mock Claude client.
 */

import {
  callClaudeWithUsage,
  estimateUsageCents,
  type ClaudeCallOptions,
  type ClaudeCallResult,
} from "@/lib/claude-client";
import { addClaudeUsage } from "@/lib/db";
import type {
  GenerateRequest,
  DayPlan,
  Activity,
  Hotel,
  Flight,
  ViatorTour,
} from "@/types/itinerary";
import type { CityPlanEntry } from "@/lib/trip-job";

// ── Types for dependency injection ───────────────────────────────────

/**
 * The functions that do real network calls are injected. Tests pass
 * stubs; the API route passes the real implementations. Makes the
 * executor deterministic and fast to test.
 */
export interface TripGeneratorDeps {
  callClaude: (opts: ClaudeCallOptions) => Promise<ClaudeCallResult>;
  addUsage: (userId: string, cents: number) => Promise<void>;
  now?: () => number;
}

export const defaultDeps: TripGeneratorDeps = {
  callClaude: callClaudeWithUsage,
  addUsage: async (userId, cents) => {
    try {
      await addClaudeUsage(userId, cents);
    } catch {
      // usage tracking is best-effort; never fail a generation on this.
    }
  },
};

// ── Small helpers (exported so step executor can use them too) ───────

export function stripJsonFences(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (fenceMatch ? fenceMatch[1] : text).trim();
}

export function withTimeout<T>(
  p: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label)), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

export function styleDescriptor(req: GenerateRequest): string {
  if (req.styles && req.styles.length > 0) return req.styles.join(" + ");
  return req.style;
}

export function budgetContextLine(budgetPerDay: number): string {
  let label: string;
  let hotelHint: string;
  let mealHint: string;
  if (budgetPerDay < 60) {
    label = "shoestring";
    hotelHint = "hostels or $40-60/night guesthouses";
    mealHint = "street food and cheap eats under $10";
  } else if (budgetPerDay < 150) {
    label = "budget";
    hotelHint = "3-star hotels around $80-130/night";
    mealHint = "casual restaurants with mains under $20";
  } else if (budgetPerDay < 300) {
    label = "mid-range";
    hotelHint = "4-star boutique or chain hotels $150-250/night";
    mealHint = "mid-range restaurants with mains $15-35";
  } else if (budgetPerDay < 600) {
    label = "upscale";
    hotelHint = "boutique or upscale hotels $300-450/night";
    mealHint = "fine dining with mains $40-80";
  } else {
    label = "luxury";
    hotelHint = "5-star luxury hotels $500+/night";
    mealHint = "tasting menus and Michelin-level dinners $100+ per person";
  }
  return `Budget: ~$${budgetPerDay}/person/day (${label} traveler). Pick ${hotelHint} and ${mealHint}. Do NOT recommend places that would blow this budget.`;
}

export function buildDatesForTrip(
  startDate: string,
  numDays: number
): string[] {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const out: string[] = [];
  for (let i = 0; i < numDays; i++) {
    const d = new Date(sy, (sm ?? 1) - 1, (sd ?? 1) + i);
    out.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`
    );
  }
  return out;
}

// ── Step functions — each does one unit of work ─────────────────────

const CITY_PLAN_TIMEOUT_MS = 45_000;
const BOOKING_TIMEOUT_MS = 60_000;
const CHUNK_TIMEOUT_MS = 60_000;

/**
 * Pick 4–8 real cities inside the selected region(s) and assign
 * contiguous day ranges. Returns null if the call fails or covers
 * too few days; caller falls back to the region-prompt path.
 */
export async function runCityPlanStep(
  req: GenerateRequest,
  numDays: number,
  userId: string | null,
  deps: TripGeneratorDeps = defaultDeps
): Promise<CityPlanEntry[] | null> {
  if (!req.regions || req.regions.length === 0) return null;
  const regionList = req.regions.join(", ");
  const budgetLine = req.budgetPerDay ? budgetContextLine(req.budgetPerDay) : "";
  const system = `Travel editor. Output ONLY a JSON array. No prose, no markdown. Real cities only.`;
  const prompt = `Plan a ${numDays}-day ${styleDescriptor(req)} trip covering ${regionList}. Dates: ${req.startDate} to ${req.endDate}.${budgetLine ? "\n" + budgetLine : ""}

Pick 4–8 real cities inside ${regionList} that flow well geographically. Assign each city a contiguous span of days summing to exactly ${numDays}.

Return JSON: [{"city":"Prague","country":"Czech Republic","startDay":1,"endDay":5}]

Rules: every city real and in ${regionList}; ranges contiguous, non-overlapping, covering 1..${numDays}; 4–8 cities.`;

  try {
    const { text, usage } = await withTimeout(
      deps.callClaude({
        system,
        prompt,
        model: "claude-sonnet-4-6",
        maxTokens: 1000,
      }),
      CITY_PLAN_TIMEOUT_MS,
      "city_plan_timeout"
    );
    if (userId) {
      deps.addUsage(userId, estimateUsageCents(usage)).catch(() => undefined);
    }
    const parsed = JSON.parse(stripJsonFences(text));
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const entries: CityPlanEntry[] = [];
    for (const e of parsed) {
      const city = typeof e?.city === "string" ? e.city.trim() : "";
      const country = typeof e?.country === "string" ? e.country.trim() : "";
      const startDay = Number(e?.startDay);
      const endDay = Number(e?.endDay);
      if (!city || !Number.isFinite(startDay) || !Number.isFinite(endDay)) continue;
      entries.push({ city, country, startDay, endDay });
    }
    // Coverage check — drop the plan if it's too sparse.
    const coverage = new Set<number>();
    for (const e of entries) {
      for (let d = e.startDay; d <= e.endDay; d++) {
        if (d >= 1 && d <= numDays) coverage.add(d);
      }
    }
    if (coverage.size < numDays * 0.8) return null;
    return entries;
  } catch {
    return null;
  }
}

/**
 * Generate one 7-day chunk of day plans. Pinned to a specific
 * localDestination (real city) when the caller has one.
 */
export async function runChunkStep(
  req: GenerateRequest,
  dayNumbers: number[],
  dates: string[],
  userId: string | null,
  localDestination: string | undefined,
  deps: TripGeneratorDeps = defaultDeps
): Promise<DayPlan[]> {
  const numDays = dayNumbers.length;
  const effectiveDestination = localDestination ?? req.destination;
  const budgetLine = req.budgetPerDay ? budgetContextLine(req.budgetPerDay) : "";

  const system = `Travel editor. Output ONLY a JSON array. No prose, no markdown. Real places, real distances. Every activity name across the itinerary MUST be unique.`;
  const prompt = `${styleDescriptor(req)} trip to ${effectiveDestination}. Days ${dayNumbers[0]}\u2013${dayNumbers[dayNumbers.length - 1]}. Dates: ${dates.join(", ")}.${budgetLine ? "\n" + budgetLine : ""}

Return JSON array of ${numDays} day objects: [{"dayNumber":N,"date":"YYYY-MM-DD","title":"short","morning":[A,A],"afternoon":[A,A],"evening":[A,A],"tip":"one tip"}]

Activity = {"time":"HH:MM","name":"real place","category":"food|culture|nature|shopping|entertainment|transport","description":"one sentence","duration":"Xh","distanceFromPrevious":"X km","walkingTime":"X min"}

Rules:
- Exactly ${numDays} day objects with dayNumbers: ${dayNumbers.join(", ")}
- 2 activities per block
- Every place physically in ${effectiveDestination} (city limits / metro area)
- MORNING=breakfast, AFTERNOON=lunch, EVENING=dinner; time-appropriate cuisine
- Omit distance fields on the first activity of each block and on transport
- Do NOT include arrival/departure flights or airport transfers (added separately)
- Unique activity names; no repeats across days`;

  const maxTokens = Math.min(numDays * 600, 8000);
  const { text, usage } = await withTimeout(
    deps.callClaude({ system, prompt, model: "claude-sonnet-4-6", maxTokens }),
    CHUNK_TIMEOUT_MS,
    "chunk_timeout"
  );
  if (userId) {
    deps.addUsage(userId, estimateUsageCents(usage)).catch(() => undefined);
  }
  const parsed = JSON.parse(stripJsonFences(text));
  return Array.isArray(parsed) ? (parsed as DayPlan[]) : [];
}

/** Generate the booking payload (hotels, Claude flight stubs, tours, tips). */
export async function runBookingStep(
  req: GenerateRequest,
  userId: string | null,
  deps: TripGeneratorDeps = defaultDeps
): Promise<{ hotels: Hotel[]; flights: Flight[]; tours: ViatorTour[]; tips: string[] }> {
  const system = `Travel editor. Output ONLY a single JSON object. No prose, no markdown. Real airlines, real hotels.`;
  const originLine = req.originCity ? `Origin: ${req.originCity}.` : "";
  const airportLine =
    req.originAirport || req.destinationAirport
      ? `REQUIRED airports: ${req.originAirport ? `origin must be ${req.originAirport}` : ""}${req.originAirport && req.destinationAirport ? ", " : ""}${req.destinationAirport ? `destination must be ${req.destinationAirport}` : ""}.`
      : "";
  const budgetLine = req.budgetPerDay ? budgetContextLine(req.budgetPerDay) : "";
  const prompt = `Trip to ${req.destination}, ${req.startDate} to ${req.endDate}, ${req.travelers} travelers, ${styleDescriptor(req)} style. ${originLine}${airportLine ? " " + airportLine : ""}${budgetLine ? "\n" + budgetLine : ""}

Output: {"hotels":[{"name":"","pricePerNight":"$X","rating":4.5}],"flights":[{"airline":"","departure":"","arrival":"","price":"$X","stops":0,"originAirport":"IATA","destinationAirport":"IATA"}],"tours":[{"name":"","price":"$X","duration":"","rating":4.5}],"tips":[""]}

Rules: 3 real hotels at different price points, 2 real airlines with correct IATAs, 3 real tours/experiences, 4 practical tips.`;

  const { text, usage } = await withTimeout(
    deps.callClaude({ system, prompt, model: "claude-sonnet-4-6", maxTokens: 1500 }),
    BOOKING_TIMEOUT_MS,
    "booking_timeout"
  );
  if (userId) {
    deps.addUsage(userId, estimateUsageCents(usage)).catch(() => undefined);
  }
  const parsed = JSON.parse(stripJsonFences(text)) as {
    hotels?: Hotel[];
    flights?: Flight[];
    tours?: ViatorTour[];
    tips?: string[];
  };
  return {
    hotels: parsed.hotels ?? [],
    flights: parsed.flights ?? [],
    tours: parsed.tours ?? [],
    tips: parsed.tips ?? [],
  };
}

// ── Dedup safety net (moved in from route.ts) ────────────────────────

export function dedupeDays(days: DayPlan[]): DayPlan[] {
  const seen = new Set<string>();
  for (const day of days) {
    for (const blockKey of ["morning", "afternoon", "evening"] as const) {
      const block = day[blockKey];
      if (!Array.isArray(block)) continue;
      const kept: Activity[] = [];
      for (const act of block) {
        if (!act) continue;
        if (act.category === "transport") {
          kept.push(act);
          continue;
        }
        const name = (act.name ?? "").trim();
        const key = name.toLowerCase();
        if (!key) {
          kept.push(act);
          continue;
        }
        if (!seen.has(key)) {
          seen.add(key);
          kept.push(act);
          continue;
        }
        const remaining = kept.filter((a) => a.category !== "transport").length;
        if (remaining >= 1) continue;
        const renamed: Activity = { ...act, name: `${name} (alternate spot nearby)` };
        const renamedKey = renamed.name.toLowerCase();
        if (!seen.has(renamedKey)) {
          seen.add(renamedKey);
          kept.push(renamed);
        }
      }
      (day[blockKey] as Activity[]) = kept;
    }
  }
  return days;
}
