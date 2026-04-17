/**
 * Executes one step of a trip job. Called by POST /api/trip/step
 * once per client invocation. Pure-ish: takes a repo + generator
 * deps, loads the job, picks the next step, runs it, writes the
 * result back.
 *
 * Every step function catches its own errors and the runner flips
 * the step to "failed" (still retryable until MAX_STEP_ATTEMPTS).
 * The runner never throws — the HTTP layer just reads the returned
 * job and surfaces the current state to the client.
 */

import {
  type TripJob,
  type StepKey,
  type StepRecord,
  type DayChunkRecord,
  CHUNK_SIZE,
  MAX_STEP_ATTEMPTS,
  daysBetween,
  markStepRunning,
  markStepDone,
  markStepFailed,
  nextStep,
  cityByDayFromPlan,
  pickDominantCity,
  planSteps,
  isComplete,
} from "@/lib/trip-job";
import {
  runCityPlanStep,
  runBookingStep,
  runChunkStep,
  buildDatesForTrip,
  dedupeDays,
  defaultDeps,
  type TripGeneratorDeps,
} from "@/lib/trip-generator";
import { getRepo } from "@/lib/trip-job-repo";
import type { GenerateRequest, Itinerary, Flight } from "@/types/itinerary";

export interface RunnerDeps extends TripGeneratorDeps {
  fetchHero?: (destination: string) => Promise<string | null>;
  fetchFlights?: (
    req: GenerateRequest
  ) => Promise<Flight[] | null>;
  generateId?: () => string;
  generateShareId?: () => string;
}

function defaultFetchHero(_destination: string): Promise<string | null> {
  return Promise.resolve(null);
}
function defaultFetchFlights(): Promise<Flight[] | null> {
  return Promise.resolve(null);
}

export async function runOneStep(
  jobId: string,
  deps: RunnerDeps = { ...defaultDeps }
): Promise<TripJob> {
  const repo = getRepo();
  const job = await repo.get(jobId);
  if (!job) throw new Error(`Job not found: ${jobId}`);
  if (job.status === "complete" || job.status === "failed") return job;

  const step = nextStep(job);
  if (!step) {
    // Nothing to run. Either we're already complete or stuck.
    const patchable = isComplete(job)
      ? { status: "complete" as const }
      : { status: "failed" as const, error: "no runnable step" };
    return repo.update(job.id, patchable);
  }

  // Mark running (atomically bumps attempts)
  const runningSteps = markStepRunning(job.steps, step.key);
  await repo.update(job.id, {
    status: "running",
    steps: runningSteps,
    stepLabel: step.label,
    currentStep: step.index,
  });

  try {
    const updated = await executeStep(
      { ...job, steps: runningSteps },
      step,
      deps
    );
    const nextSteps = markStepDone(updated.steps, step.key);
    const nowComplete =
      nextSteps.every((s) => s.status === "done") && !!updated.finalItinerary;
    return repo.update(job.id, {
      ...updated,
      steps: nextSteps,
      status: nowComplete ? "complete" : "running",
      error: null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const failedSteps = markStepFailed(runningSteps, step.key, message);
    const exhausted = failedSteps.find(
      (s) => s.key === step.key && s.attempts >= MAX_STEP_ATTEMPTS
    );
    return repo.update(job.id, {
      steps: failedSteps,
      status: exhausted ? "failed" : "running",
      error: exhausted ? message : null,
    });
  }
}

/** Dispatch one step — runs exactly one unit of work. */
async function executeStep(
  job: TripJob,
  step: StepRecord,
  deps: RunnerDeps
): Promise<Partial<TripJob> & { steps: StepRecord[] }> {
  const req = job.request;
  const numDays = daysBetween(req.startDate, req.endDate);

  if (step.key === "init") {
    // No-op marker so the ledger has a visible "we started" step.
    return { steps: job.steps };
  }

  if (step.key === "hero") {
    const fetchHero = deps.fetchHero ?? defaultFetchHero;
    const hero = await fetchHero(req.destination);
    return { steps: job.steps, heroImage: hero };
  }

  if (step.key === "flight_providers") {
    const fetchFlights = deps.fetchFlights ?? defaultFetchFlights;
    const real = await fetchFlights(req);
    return { steps: job.steps, flightsReal: real ?? null };
  }

  if (step.key === "city_plan") {
    const plan = await runCityPlanStep(req, numDays, job.userId, deps);
    return { steps: job.steps, cityPlan: plan };
  }

  if (step.key === "booking") {
    const booking = await runBookingStep(req, job.userId, deps);
    return { steps: job.steps, booking };
  }

  if (step.key.startsWith("chunk:")) {
    const chunkIndex = Number(step.key.split(":")[1]);
    const offset = chunkIndex * CHUNK_SIZE;
    const end = Math.min(offset + CHUNK_SIZE, numDays);
    const dayNumbers = Array.from({ length: end - offset }, (_, i) => offset + i + 1);
    const allDates = buildDatesForTrip(req.startDate, numDays);
    const dates = allDates.slice(offset, end);
    const cityByDay = cityByDayFromPlan(job.cityPlan, req.cities, numDays);
    const localDestination = cityByDay
      ? pickDominantCity(dayNumbers, cityByDay)
      : undefined;
    const days = await runChunkStep(
      req,
      dayNumbers,
      dates,
      job.userId,
      localDestination,
      deps
    );
    const existing = job.dayChunks.filter((c) => c.chunkIndex !== chunkIndex);
    const newChunks: DayChunkRecord[] = [
      ...existing,
      { chunkIndex, days },
    ].sort((a, b) => a.chunkIndex - b.chunkIndex);
    return { steps: job.steps, dayChunks: newChunks };
  }

  if (step.key === "assemble") {
    const generateId = deps.generateId ?? (() => crypto.randomUUID());
    const generateShareId =
      deps.generateShareId ?? (() => Math.random().toString(36).slice(2, 10));
    const allDays = dedupeDays(job.dayChunks.flatMap((c) => c.days));
    const booking = job.booking ?? { hotels: [], flights: [], tours: [], tips: [] };
    const flights = job.flightsReal ?? booking.flights;
    const itinerary: Itinerary = {
      id: generateId(),
      shareId: job.shareId ?? generateShareId(),
      destination: req.destination,
      startDate: req.startDate,
      endDate: req.endDate,
      travelers: req.travelers,
      travelStyle: req.style,
      budget: req.budget ?? "moderate",
      days: allDays,
      hotels: booking.hotels,
      flights,
      tours: booking.tours,
      tips: booking.tips,
      heroImage: job.heroImage ?? undefined,
      originCity: req.originCity,
    };
    return {
      steps: job.steps,
      finalItinerary: itinerary,
      shareId: itinerary.shareId,
    };
  }

  throw new Error(`Unknown step key: ${step.key}`);
}

/**
 * Repeatedly call runOneStep until the job is complete/failed OR a
 * hard cap is reached. Used by integration tests and the batch mode
 * (one client request that loops server-side when safe).
 */
export async function runUntilDone(
  jobId: string,
  deps: RunnerDeps = { ...defaultDeps },
  hardCap = 50
): Promise<TripJob> {
  let job = await getRepo().get(jobId);
  if (!job) throw new Error(`Job not found: ${jobId}`);
  let iterations = 0;
  while (
    job &&
    job.status !== "complete" &&
    job.status !== "failed" &&
    iterations < hardCap
  ) {
    job = await runOneStep(jobId, deps);
    iterations += 1;
  }
  if (!job) throw new Error("Lost job during run");
  return job;
}

/** Create a fresh pending job for a request (doesn't run it). */
export async function createJob(
  req: GenerateRequest,
  owner: { userId: string | null; anonToken: string | null }
): Promise<TripJob> {
  const repo = getRepo();
  const steps = planSteps(req);
  const id = crypto.randomUUID();
  return repo.create({
    id,
    userId: owner.userId,
    anonToken: owner.anonToken,
    status: "pending",
    request: req,
    shareId: null,
    totalSteps: steps.length,
    currentStep: 0,
    stepLabel: null,
    error: null,
    heroImage: null,
    cityPlan: null,
    dayChunks: [],
    booking: null,
    flightsReal: null,
    finalItinerary: null,
    steps,
  });
}
