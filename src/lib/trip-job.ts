/**
 * Trip-job state machine.
 *
 * A trip job is a long-running generation split across many short
 * server calls. Each "step" is a single unit of work (≤30s) that the
 * client invokes via POST /api/trip/step/[jobId]. The step loads the
 * current job state, decides what to do next (pure function of state),
 * performs one unit, and writes the result back. Steps are
 * independently retryable; any single-step failure is recoverable.
 *
 * This file holds ONLY the state-machine primitives — step planning,
 * state updates, status enum. API routes and Claude calls live
 * elsewhere so this stays unit-testable without the network.
 */

import type { GenerateRequest, DayPlan, Flight, Hotel, ViatorTour } from "@/types/itinerary";

export type TripJobStatus = "pending" | "running" | "complete" | "failed";

export type StepKey =
  | "init"
  | "hero"
  | "flight_providers"
  | "city_plan"
  | "booking"
  | `chunk:${number}`
  | "assemble";

export type StepStatus = "pending" | "running" | "done" | "failed";

export interface StepRecord {
  index: number;
  key: StepKey;
  label: string;
  status: StepStatus;
  startedAt?: string;
  finishedAt?: string;
  attempts: number;
  error?: string;
}

export interface CityPlanEntry {
  city: string;
  country: string;
  startDay: number;
  endDay: number;
}

export interface DayChunkRecord {
  chunkIndex: number;
  days: DayPlan[];
}

export interface TripJob {
  id: string;
  userId: string | null;
  anonToken: string | null;
  status: TripJobStatus;
  request: GenerateRequest;
  shareId: string | null;
  totalSteps: number;
  currentStep: number;
  stepLabel: string | null;
  error: string | null;
  heroImage: string | null;
  cityPlan: CityPlanEntry[] | null;
  dayChunks: DayChunkRecord[];
  booking: {
    hotels: Hotel[];
    flights: Flight[];
    tours: ViatorTour[];
    tips: string[];
  } | null;
  flightsReal: Flight[] | null;
  finalItinerary: unknown | null;
  steps: StepRecord[];
  createdAt: string;
  updatedAt: string;
}

export const CHUNK_SIZE = 7;
export const MAX_STEP_ATTEMPTS = 3;

/** Inclusive day count: "YYYY-MM-DD" start + end. */
export function daysBetween(start: string, end: string): number {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const startDate = new Date(sy, (sm ?? 1) - 1, sd ?? 1);
  const endDate = new Date(ey, (em ?? 1) - 1, ed ?? 1);
  const ms = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}

/** Chunk count for a given trip length. */
export function chunkCount(numDays: number): number {
  return Math.ceil(numDays / CHUNK_SIZE);
}

/** Does this request need a Claude-driven city coordinator? */
export function needsCityPlan(req: GenerateRequest): boolean {
  // Explicit user-picked cities → skip Claude entirely.
  if (req.cities && req.cities.length > 0) return false;
  // Region trip with enough days to be worth planning multiple cities.
  if (req.regions && req.regions.length > 0) {
    const n = daysBetween(req.startDate, req.endDate);
    return n >= 14;
  }
  return false;
}

/** Plan the step ledger for a new job. Deterministic from the request. */
export function planSteps(req: GenerateRequest): StepRecord[] {
  const numDays = daysBetween(req.startDate, req.endDate);
  const chunks = chunkCount(numDays);
  const steps: StepRecord[] = [];
  let i = 0;
  steps.push({ index: i++, key: "init", label: "Preparing your trip", status: "pending", attempts: 0 });
  steps.push({ index: i++, key: "hero", label: "Finding a hero photo", status: "pending", attempts: 0 });
  steps.push({ index: i++, key: "flight_providers", label: "Checking real flight prices", status: "pending", attempts: 0 });
  if (needsCityPlan(req)) {
    steps.push({ index: i++, key: "city_plan", label: "Plotting cities across your region", status: "pending", attempts: 0 });
  }
  steps.push({ index: i++, key: "booking", label: "Curating hotels and tours", status: "pending", attempts: 0 });
  for (let c = 0; c < chunks; c++) {
    const startDay = c * CHUNK_SIZE + 1;
    const endDay = Math.min((c + 1) * CHUNK_SIZE, numDays);
    steps.push({
      index: i++,
      key: `chunk:${c}`,
      label: `Drafting days ${startDay}\u2013${endDay}`,
      status: "pending",
      attempts: 0,
    });
  }
  steps.push({ index: i++, key: "assemble", label: "Assembling your itinerary", status: "pending", attempts: 0 });
  return steps;
}

/** Pick the next step to run: first pending, or first failed with attempts left. */
export function nextStep(job: TripJob): StepRecord | null {
  if (job.status === "complete" || job.status === "failed") return null;
  for (const s of job.steps) {
    if (s.status === "pending") return s;
    if (s.status === "failed" && s.attempts < MAX_STEP_ATTEMPTS) return s;
  }
  return null;
}

/** Is this job done (all steps done, or final assemble ran)? */
export function isComplete(job: TripJob): boolean {
  return job.steps.every((s) => s.status === "done") && !!job.finalItinerary;
}

/** Mark a step as running. Returns a new steps array (immutable update). */
export function markStepRunning(steps: StepRecord[], key: StepKey): StepRecord[] {
  return steps.map((s) =>
    s.key === key
      ? {
          ...s,
          status: "running",
          startedAt: new Date().toISOString(),
          attempts: s.attempts + 1,
        }
      : s
  );
}

/** Mark a step as done. */
export function markStepDone(steps: StepRecord[], key: StepKey): StepRecord[] {
  return steps.map((s) =>
    s.key === key
      ? { ...s, status: "done", finishedAt: new Date().toISOString(), error: undefined }
      : s
  );
}

/** Mark a step as failed with an error message. */
export function markStepFailed(
  steps: StepRecord[],
  key: StepKey,
  error: string
): StepRecord[] {
  return steps.map((s) =>
    s.key === key
      ? { ...s, status: "failed", finishedAt: new Date().toISOString(), error }
      : s
  );
}

/** Overall job % complete (0–100), computed from step statuses. */
export function jobProgress(job: TripJob): number {
  if (job.steps.length === 0) return 0;
  const done = job.steps.filter((s) => s.status === "done").length;
  const running = job.steps.filter((s) => s.status === "running").length;
  return Math.round(((done + running * 0.5) / job.steps.length) * 100);
}

/** Which chunk indices belong to this job (for parallel client dispatch). */
export function chunkIndices(job: TripJob): number[] {
  return job.steps
    .filter((s) => s.key.startsWith("chunk:"))
    .map((s) => Number(s.key.split(":")[1]));
}

/**
 * Map cityByDay (from the Claude coordinator OR from user-picked cities)
 * to each chunk. For user-picked cities we round-robin through the list
 * proportional to chunk count so a 4-city trip over 28 days gets 7
 * days per city.
 */
export function cityByDayFromPlan(
  plan: CityPlanEntry[] | null,
  explicitCities: string[] | undefined,
  numDays: number
): Map<number, string> | null {
  const map = new Map<number, string>();
  if (plan && plan.length > 0) {
    for (const entry of plan) {
      for (let d = entry.startDay; d <= entry.endDay; d++) {
        if (d >= 1 && d <= numDays) map.set(d, entry.city);
      }
    }
    if (map.size > 0) return map;
  }
  if (explicitCities && explicitCities.length > 0) {
    const cities = explicitCities.filter(Boolean);
    if (cities.length === 0) return null;
    const daysPerCity = Math.ceil(numDays / cities.length);
    for (let d = 1; d <= numDays; d++) {
      const cityIndex = Math.min(
        cities.length - 1,
        Math.floor((d - 1) / daysPerCity)
      );
      map.set(d, cities[cityIndex]);
    }
    return map;
  }
  return null;
}

/**
 * Given a chunk's day numbers and a city map, return the city most
 * represented in that chunk.
 */
export function pickDominantCity(
  dayNumbers: number[],
  cityByDay: Map<number, string>
): string | undefined {
  const counts = new Map<string, number>();
  for (const d of dayNumbers) {
    const city = cityByDay.get(d);
    if (!city) continue;
    counts.set(city, (counts.get(city) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestN = 0;
  counts.forEach((n, city) => {
    if (n > bestN) {
      best = city;
      bestN = n;
    }
  });
  return best;
}
