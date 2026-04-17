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
    // Nothing to run. Three cases:
    //   A) Everything is done AND finalItinerary exists → complete.
    //   B) All retryable steps are exhausted but we have enough partial
    //      data to assemble a usable itinerary → run a best-effort
    //      assemble anyway, mark complete.
    //   C) Truly stuck (no chunk days at all) → failed.
    if (isComplete(job)) {
      return repo.update(job.id, { status: "complete" });
    }
    if (canAssemblePartial(job)) {
      return forceAssemblePartial(job, deps);
    }
    return repo.update(job.id, {
      status: "failed",
      error: job.error ?? "no runnable step",
    });
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
    // Job is complete if:
    //   - every step is done AND finalItinerary exists (ideal path), OR
    //   - finalItinerary exists (assemble ran, produced a usable result).
    //     This covers the fail-soft case where one chunk was unrecover-
    //     ably failed but assemble still built an itinerary from the
    //     chunks that succeeded.
    const nowComplete = !!updated.finalItinerary;
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
    // Keep the job in "running" state even when a single step is
    // permanently failed — the runner's top-level "no runnable step"
    // branch decides whether to fail-soft assemble or terminate. This
    // lets one broken chunk coexist with successful ones and still
    // produce a usable itinerary.
    return repo.update(job.id, {
      steps: failedSteps,
      status: "running",
      error: exhausted ? message : null,
    });
  }
}

/**
 * A job is "assemble-able" when there's NO runnable step remaining
 * and we have at least one chunk of day data. This lets the user
 * receive a usable (even if incomplete) itinerary instead of getting
 * a stuck "no runnable step" error when a single chunk is wedged.
 */
function canAssemblePartial(job: TripJob): boolean {
  const assembleStep = job.steps.find((s) => s.key === "assemble");
  if (!assembleStep) return false;
  const hasDays = job.dayChunks.some((c) => c.days.length > 0);
  return hasDays && !job.finalItinerary;
}

/**
 * Last-resort assemble: whatever we have, turn it into an itinerary.
 * Marks all unfinished steps as done (they're as done as they'll
 * ever be) and flips the job to complete. Better to show the user
 * a partial trip than an error screen.
 */
async function forceAssemblePartial(
  job: TripJob,
  deps: RunnerDeps
): Promise<TripJob> {
  const repo = getRepo();
  try {
    const req = job.request;
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
    // Flip every non-done step to done so the ledger reflects reality.
    const sealedSteps = job.steps.map((s) =>
      s.status === "done" ? s : { ...s, status: "done" as const, finishedAt: new Date().toISOString() }
    );
    return repo.update(job.id, {
      status: "complete",
      finalItinerary: itinerary,
      shareId: itinerary.shareId,
      steps: sealedSteps,
      error: null,
    });
  } catch (e) {
    return repo.update(job.id, {
      status: "failed",
      error: `force-assemble failed: ${e instanceof Error ? e.message : String(e)}`,
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
    // Refuse to produce an empty itinerary. Zero days means every chunk
    // failed permanently — let the step be marked failed so the top-
    // level runner flips the job to "failed" instead of silently
    // emitting a day-less shell.
    if (allDays.length === 0) {
      throw new Error("cannot assemble: no day data produced by any chunk");
    }
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
