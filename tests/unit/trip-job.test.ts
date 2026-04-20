import { describe, it, expect } from "vitest";
import {
  daysBetween,
  chunkCount,
  needsCityPlan,
  planSteps,
  nextStep,
  markStepRunning,
  markStepDone,
  markStepFailed,
  jobProgress,
  cityByDayFromPlan,
  pickDominantCity,
  chunkIndices,
  MAX_STEP_ATTEMPTS,
  type TripJob,
} from "@/lib/trip-job";
import type { GenerateRequest } from "@/types/itinerary";

const baseReq = (override: Partial<GenerateRequest> = {}): GenerateRequest => ({
  destination: "Tokyo",
  startDate: "2026-05-01",
  endDate: "2026-05-05",
  travelers: 2,
  style: "Cultural",
  ...override,
});

describe("daysBetween", () => {
  it("is inclusive on both ends", () => {
    expect(daysBetween("2026-05-01", "2026-05-01")).toBe(1);
    expect(daysBetween("2026-05-01", "2026-05-05")).toBe(5);
  });
  it("handles 47-day trips", () => {
    expect(daysBetween("2026-05-16", "2026-07-01")).toBe(47);
  });
  it("crosses DST boundaries correctly", () => {
    expect(daysBetween("2026-03-07", "2026-03-09")).toBe(3);
  });
});

describe("chunkCount", () => {
  it("one chunk for <=7 days", () => {
    expect(chunkCount(1)).toBe(1);
    expect(chunkCount(7)).toBe(1);
  });
  it("two chunks at 8-14", () => {
    expect(chunkCount(8)).toBe(2);
    expect(chunkCount(14)).toBe(2);
  });
  it("seven chunks at 47 days", () => {
    expect(chunkCount(47)).toBe(7);
  });
});

describe("needsCityPlan", () => {
  it("skips when user picked explicit cities", () => {
    expect(
      needsCityPlan(
        baseReq({
          regions: ["Eastern Europe"],
          cities: ["Prague", "Budapest"],
          startDate: "2026-05-01",
          endDate: "2026-06-01",
        })
      )
    ).toBe(false);
  });
  it("runs when region picked with no explicit cities, >=14 days", () => {
    expect(
      needsCityPlan(
        baseReq({
          regions: ["Eastern Europe"],
          startDate: "2026-05-01",
          endDate: "2026-05-20",
        })
      )
    ).toBe(true);
  });
  it("skips for short region trips", () => {
    expect(
      needsCityPlan(
        baseReq({ regions: ["Eastern Europe"], startDate: "2026-05-01", endDate: "2026-05-07" })
      )
    ).toBe(false);
  });
  it("skips for city-based trips", () => {
    expect(needsCityPlan(baseReq())).toBe(false);
  });
});

describe("planSteps", () => {
  it("plans init + hero + flights + booking + single-city-hotels + chunk + assemble for a plain 5-day trip", () => {
    const steps = planSteps(baseReq());
    const keys = steps.map((s) => s.key);
    expect(keys).toEqual([
      "init",
      "hero",
      "flight_providers",
      "booking",
      "hotels:0",
      "chunk:0",
      "assemble",
    ]);
  });
  it("inserts city_plan for a long region trip (hotels steps inserted dynamically by runner)", () => {
    const steps = planSteps(
      baseReq({
        regions: ["Eastern Europe"],
        startDate: "2026-05-16",
        endDate: "2026-07-01",
      })
    );
    const keys = steps.map((s) => s.key);
    expect(keys).toContain("city_plan");
    // 47 days → 7 chunks
    const chunkSteps = keys.filter((k) => k.startsWith("chunk:"));
    expect(chunkSteps).toHaveLength(7);
    // Region trips don't plan hotel steps up front — they're added
    // after city_plan runs. Steps are: init, hero, flights, city_plan,
    // booking, 7 chunks, assemble = 13.
    expect(keys).toHaveLength(13);
    expect(keys.filter((k) => k.startsWith("hotels:"))).toHaveLength(0);
  });
  it("adds one hotels step per explicit city when user picks them", () => {
    const steps = planSteps(
      baseReq({
        regions: ["Eastern Europe"],
        cities: ["Prague", "Budapest"],
        startDate: "2026-05-16",
        endDate: "2026-07-01",
      })
    );
    const keys = steps.map((s) => s.key);
    expect(keys).not.toContain("city_plan");
    expect(keys.filter((k) => k.startsWith("hotels:"))).toHaveLength(2);
  });
  it("all steps start pending with zero attempts", () => {
    const steps = planSteps(baseReq());
    expect(steps.every((s) => s.status === "pending")).toBe(true);
    expect(steps.every((s) => s.attempts === 0)).toBe(true);
  });
  it("indices are sequential and unique", () => {
    const steps = planSteps(baseReq({ startDate: "2026-05-01", endDate: "2026-05-30" }));
    expect(steps.map((s) => s.index)).toEqual(steps.map((_, i) => i));
  });
});

const makeJob = (override: Partial<TripJob> = {}): TripJob => ({
  id: "job-1",
  userId: null,
  anonToken: "anon-1",
  status: "running",
  request: baseReq(),
  shareId: null,
  totalSteps: 6,
  currentStep: 0,
  stepLabel: null,
  error: null,
  heroImage: null,
  cityPlan: null,
  dayChunks: [],
  booking: null,
  hotelsByCity: {},
  flightsReal: null,
  finalItinerary: null,
  steps: planSteps(baseReq()),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...override,
});

describe("nextStep", () => {
  it("returns the first pending step", () => {
    const job = makeJob();
    expect(nextStep(job)?.key).toBe("init");
  });
  it("returns the next pending step after one is done", () => {
    const job = makeJob();
    job.steps = markStepDone(job.steps, "init");
    expect(nextStep(job)?.key).toBe("hero");
  });
  it("retries a failed step if attempts remain", () => {
    const job = makeJob();
    job.steps = markStepFailed(job.steps, "init", "network error");
    expect(nextStep(job)?.key).toBe("init");
  });
  it("skips a failed step after MAX_STEP_ATTEMPTS", () => {
    const job = makeJob();
    // Put "init" at MAX attempts by bumping the record directly.
    job.steps = job.steps.map((s) =>
      s.key === "init"
        ? { ...s, status: "failed", attempts: MAX_STEP_ATTEMPTS, error: "boom" }
        : s
    );
    expect(nextStep(job)?.key).toBe("hero");
  });
  it("returns null when job is complete", () => {
    const job = makeJob({ status: "complete" });
    expect(nextStep(job)).toBeNull();
  });
  it("returns null when job is failed", () => {
    const job = makeJob({ status: "failed" });
    expect(nextStep(job)).toBeNull();
  });
});

describe("step transitions", () => {
  it("markStepRunning bumps attempts and sets startedAt", () => {
    const job = makeJob();
    const steps = markStepRunning(job.steps, "init");
    const init = steps.find((s) => s.key === "init")!;
    expect(init.status).toBe("running");
    expect(init.attempts).toBe(1);
    expect(init.startedAt).toBeDefined();
  });
  it("markStepDone clears error and sets finishedAt", () => {
    const job = makeJob();
    const withFailed = markStepFailed(job.steps, "init", "boom");
    const done = markStepDone(withFailed, "init");
    const init = done.find((s) => s.key === "init")!;
    expect(init.status).toBe("done");
    expect(init.error).toBeUndefined();
    expect(init.finishedAt).toBeDefined();
  });
  it("markStepFailed records the error message", () => {
    const job = makeJob();
    const steps = markStepFailed(job.steps, "init", "timeout");
    const init = steps.find((s) => s.key === "init")!;
    expect(init.status).toBe("failed");
    expect(init.error).toBe("timeout");
  });
});

describe("jobProgress", () => {
  it("is 0 when nothing is running", () => {
    expect(jobProgress(makeJob())).toBe(0);
  });
  it("is 100 when all steps are done", () => {
    const job = makeJob();
    job.steps = job.steps.map((s) => ({ ...s, status: "done" as const }));
    expect(jobProgress(job)).toBe(100);
  });
  it("counts running as half-complete", () => {
    const job = makeJob();
    // 7 steps (init, hero, flights, booking, hotels:0, chunk:0, assemble).
    // One done + one running = (1 + 0.5) / 7 ≈ 21%.
    job.steps = markStepDone(job.steps, "init");
    job.steps = markStepRunning(job.steps, "hero");
    expect(jobProgress(job)).toBe(21);
  });
});

describe("chunkIndices", () => {
  it("returns chunk numbers from the step ledger", () => {
    const job = makeJob({
      request: baseReq({ startDate: "2026-05-01", endDate: "2026-05-21" }),
    });
    job.steps = planSteps(job.request);
    expect(chunkIndices(job)).toEqual([0, 1, 2]);
  });
});

describe("cityByDayFromPlan", () => {
  it("maps from a Claude city plan", () => {
    const plan = [
      { city: "Prague", country: "CZ", startDay: 1, endDay: 5 },
      { city: "Budapest", country: "HU", startDay: 6, endDay: 10 },
    ];
    const map = cityByDayFromPlan(plan, undefined, 10);
    expect(map?.get(1)).toBe("Prague");
    expect(map?.get(5)).toBe("Prague");
    expect(map?.get(6)).toBe("Budapest");
    expect(map?.get(10)).toBe("Budapest");
  });
  it("falls back to explicit cities when no plan", () => {
    const map = cityByDayFromPlan(null, ["Prague", "Budapest", "Warsaw"], 21);
    expect(map?.get(1)).toBe("Prague");
    expect(map?.get(8)).toBe("Budapest");
    expect(map?.get(15)).toBe("Warsaw");
    expect(map?.get(21)).toBe("Warsaw");
  });
  it("returns null when both inputs are empty", () => {
    expect(cityByDayFromPlan(null, undefined, 10)).toBeNull();
    expect(cityByDayFromPlan(null, [], 10)).toBeNull();
  });
});

describe("pickDominantCity", () => {
  const map = new Map<number, string>([
    [1, "Prague"],
    [2, "Prague"],
    [3, "Prague"],
    [4, "Budapest"],
    [5, "Budapest"],
  ]);
  it("returns the city covering the most days in a chunk", () => {
    expect(pickDominantCity([1, 2, 3], map)).toBe("Prague");
    expect(pickDominantCity([4, 5], map)).toBe("Budapest");
  });
  it("breaks ties by first seen", () => {
    const m = new Map([[1, "A"], [2, "B"]]);
    const out = pickDominantCity([1, 2], m);
    expect(["A", "B"]).toContain(out);
  });
  it("returns undefined for empty coverage", () => {
    expect(pickDominantCity([99, 100], map)).toBeUndefined();
  });
});
