import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createJob,
  runOneStep,
  runUntilDone,
  type RunnerDeps,
} from "@/lib/trip-job-runner";
import {
  setRepoBackend,
  createInMemoryRepo,
  getRepo,
} from "@/lib/trip-job-repo";
import { MAX_STEP_ATTEMPTS } from "@/lib/trip-job";
import type { GenerateRequest, DayPlan, Flight } from "@/types/itinerary";
import type { ClaudeCallResult } from "@/lib/claude-client";

/**
 * Mock Claude by returning canned JSON for each prompt shape. The
 * generator fns read `prompt` and `maxTokens` to decide what to do,
 * so the mock sniffs the prompt.
 */
function makeClaudeStub(options: {
  cityPlanDelayMs?: number;
  bookingDelayMs?: number;
  chunkDelayMs?: number;
  failFirstChunk?: boolean;
  failCityPlan?: boolean;
} = {}): RunnerDeps {
  let chunkFailures = options.failFirstChunk ? 1 : 0;
  const call = async ({ prompt, maxTokens }: { prompt: string; maxTokens?: number }): Promise<ClaudeCallResult> => {
    await new Promise((r) => setTimeout(r, 5));
    if (/Plan a .* trip covering/.test(prompt)) {
      if (options.failCityPlan) throw new Error("claude city_plan failed");
      if (options.cityPlanDelayMs) await new Promise((r) => setTimeout(r, options.cityPlanDelayMs));
      return {
        text: JSON.stringify([
          { city: "Prague", country: "Czech Republic", startDay: 1, endDay: 12 },
          { city: "Budapest", country: "Hungary", startDay: 13, endDay: 24 },
          { city: "Krakow", country: "Poland", startDay: 25, endDay: 36 },
          { city: "Warsaw", country: "Poland", startDay: 37, endDay: 47 },
        ]),
        usage: { inputTokens: 100, outputTokens: 200, model: "claude-sonnet-4-6" },
      };
    }
    if (/List 4 real, currently-operating hotels in/.test(prompt)) {
      // Per-city hotels prompt. Extract the city name from the prompt
      // so returned hotels carry it.
      const cityMatch = prompt.match(/hotels in ([^,\n]+?)(?:,|\n| for)/);
      const city = cityMatch ? cityMatch[1].trim() : "Unknown";
      return {
        text: JSON.stringify([
          { name: `${city} Hostel`, pricePerNight: "$35", rating: 4.0, tier: "hostel" },
          { name: `${city} Budget Inn`, pricePerNight: "$95", rating: 4.2, tier: "budget" },
          { name: `${city} Boutique`, pricePerNight: "$180", rating: 4.5, tier: "mid" },
          { name: `${city} Grand`, pricePerNight: "$350", rating: 4.8, tier: "upscale" },
        ]),
        usage: { inputTokens: 30, outputTokens: 60, model: "claude-sonnet-4-6" },
      };
    }
    if (new RegExp("Output:[\\s\\S]*hotels[\\s\\S]*flights[\\s\\S]*tours[\\s\\S]*tips").test(prompt)) {
      if (options.bookingDelayMs) await new Promise((r) => setTimeout(r, options.bookingDelayMs));
      return {
        text: JSON.stringify({
          hotels: [{ name: "Grand Hotel", pricePerNight: "$200", rating: 4.5 }],
          flights: [{ airline: "United", departure: "", arrival: "", price: "$850", stops: 1, originAirport: "LAX", destinationAirport: "PRG", bookingUrl: "https://example.test" }],
          tours: [{ name: "Prague Castle Tour", price: "$45", duration: "3h", rating: 4.8 }],
          tips: ["Tip A", "Tip B", "Tip C", "Tip D"],
        }),
        usage: { inputTokens: 50, outputTokens: 100, model: "claude-sonnet-4-6" },
      };
    }
    // Otherwise assume it's a chunk prompt.
    if (chunkFailures > 0) {
      chunkFailures -= 1;
      throw new Error("claude chunk transient failure");
    }
    if (options.chunkDelayMs) await new Promise((r) => setTimeout(r, options.chunkDelayMs));
    // Return a tiny day plan. The prompt tells us how many days; parse from "Days N–M".
    const m = prompt.match(/Days (\d+)\u2013(\d+)/);
    const start = m ? Number(m[1]) : 1;
    const end = m ? Number(m[2]) : 1;
    const days: DayPlan[] = [];
    for (let d = start; d <= end; d++) {
      days.push({
        dayNumber: d,
        date: `2026-05-${String(d).padStart(2, "0")}`,
        title: `Day ${d}`,
        morning: [
          { time: "09:00", name: `Morning Place ${d}`, category: "food", description: "breakfast", duration: "1h" },
        ],
        afternoon: [
          { time: "13:00", name: `Afternoon Place ${d}`, category: "culture", description: "museum", duration: "2h" },
        ],
        evening: [
          { time: "19:00", name: `Evening Place ${d}`, category: "food", description: "dinner", duration: "2h" },
        ],
        tip: "One tip",
      });
    }
    return {
      text: JSON.stringify(days),
      usage: { inputTokens: 500 * (end - start + 1), outputTokens: 300 * (end - start + 1), model: "claude-sonnet-4-6" },
    };
  };

  return {
    callClaude: call,
    addUsage: async () => undefined,
    fetchHero: async (_dest) => "https://example.test/image.jpg",
    fetchFlights: async () => null,
    generateId: () => "test-id",
    generateShareId: () => "share01",
  };
}

const baseReq = (override: Partial<GenerateRequest> = {}): GenerateRequest => ({
  destination: "Tokyo, Japan",
  startDate: "2026-05-01",
  endDate: "2026-05-05",
  travelers: 2,
  style: "Cultural",
  ...override,
});

beforeEach(() => {
  setRepoBackend(createInMemoryRepo());
});

afterEach(() => {
  setRepoBackend(null);
});

describe("single-city short trip", () => {
  it("completes a 5-day Tokyo trip end-to-end", async () => {
    const job = await createJob(baseReq(), { userId: null, anonToken: "anon-1" });
    const done = await runUntilDone(job.id, makeClaudeStub());
    expect(done.status).toBe("complete");
    expect(done.finalItinerary).toBeTruthy();
    const itin = done.finalItinerary as { days: DayPlan[]; shareId: string; heroImage?: string };
    expect(itin.days).toHaveLength(5);
    expect(itin.shareId).toBe("share01");
    expect(itin.heroImage).toBe("https://example.test/image.jpg");
  });

  it("has exactly one chunk step for a 5-day trip", async () => {
    const job = await createJob(baseReq(), { userId: null, anonToken: "anon-1" });
    const chunkSteps = job.steps.filter((s) => s.key.startsWith("chunk:"));
    expect(chunkSteps).toHaveLength(1);
  });
});

describe("47-day region trip (the user's original failing case)", () => {
  const fortySevenDay = baseReq({
    destination: "Eastern Europe",
    startDate: "2026-05-16",
    endDate: "2026-07-01",
    regions: ["Eastern Europe"],
  });

  it("completes end-to-end with Claude city plan", async () => {
    const job = await createJob(fortySevenDay, { userId: null, anonToken: "anon-1" });
    const done = await runUntilDone(job.id, makeClaudeStub());
    expect(done.status).toBe("complete");
    const itin = done.finalItinerary as { days: DayPlan[] };
    expect(itin.days).toHaveLength(47);
    // Every day has at least one activity in each block
    for (const d of itin.days) {
      expect(d.morning.length).toBeGreaterThan(0);
      expect(d.afternoon.length).toBeGreaterThan(0);
      expect(d.evening.length).toBeGreaterThan(0);
    }
  });

  it("plans 7 chunks + city_plan step for 47 days", async () => {
    const job = await createJob(fortySevenDay, { userId: null, anonToken: "anon-1" });
    const keys = job.steps.map((s) => s.key);
    expect(keys).toContain("city_plan");
    expect(keys.filter((k) => k.startsWith("chunk:"))).toHaveLength(7);
  });

  it("uses explicit cities (no city_plan step)", async () => {
    const req = {
      ...fortySevenDay,
      cities: ["Prague", "Budapest", "Krakow", "Warsaw"],
    };
    const job = await createJob(req, { userId: null, anonToken: "anon-1" });
    expect(job.steps.map((s) => s.key)).not.toContain("city_plan");
    const done = await runUntilDone(job.id, makeClaudeStub());
    expect(done.status).toBe("complete");
  });
});

describe("resilience", () => {
  it("retries a transient chunk failure automatically", async () => {
    const job = await createJob(baseReq(), { userId: null, anonToken: "anon-1" });
    const done = await runUntilDone(job.id, makeClaudeStub({ failFirstChunk: true }));
    expect(done.status).toBe("complete");
    const chunkStep = done.steps.find((s) => s.key === "chunk:0");
    // Failed once, then succeeded — attempts counts both tries.
    expect(chunkStep?.attempts).toBeGreaterThanOrEqual(2);
    expect(chunkStep?.status).toBe("done");
  });

  it("falls back cleanly when city_plan claude call fails", async () => {
    const req = baseReq({
      destination: "Eastern Europe",
      startDate: "2026-05-01",
      endDate: "2026-05-20",
      regions: ["Eastern Europe"],
    });
    const job = await createJob(req, { userId: null, anonToken: "anon-1" });
    const done = await runUntilDone(job.id, makeClaudeStub({ failCityPlan: true }));
    // city_plan returns null (not an error) when Claude fails, so job still completes
    expect(done.status).toBe("complete");
    expect(done.cityPlan).toBeNull();
  });

  it("marks the job failed after MAX_STEP_ATTEMPTS on a hard error", async () => {
    const alwaysFail: RunnerDeps = {
      callClaude: async () => {
        throw new Error("permanent failure");
      },
      addUsage: async () => undefined,
      fetchHero: async () => null,
      fetchFlights: async () => null,
    };
    const job = await createJob(baseReq(), { userId: null, anonToken: "anon-1" });
    const done = await runUntilDone(job.id, alwaysFail);
    expect(done.status).toBe("failed");
    // The first Claude-backed step is "booking" for a single-city trip
    // (hero + flight_providers don't touch Claude). That's what blows up.
    const booking = done.steps.find((s) => s.key === "booking");
    expect(booking?.status).toBe("failed");
    expect(booking?.attempts).toBe(MAX_STEP_ATTEMPTS);
    // The final error the runner surfaces is from the assemble step
    // (which can't build an itinerary when every chunk failed) but the
    // per-step error on `booking` still records the permanent failure.
    expect(booking?.error).toContain("permanent failure");
  });
});

describe("fail-soft assemble (partial completion)", () => {
  it("when one chunk is permanently failed but others succeed, still produces an itinerary", async () => {
    // 14-day trip → 2 chunks. Fail chunk:1 hard every time; chunk:0 succeeds.
    const base = makeClaudeStub();
    let chunk1Attempts = 0;
    const deps: RunnerDeps = {
      ...base,
      callClaude: async (opts) => {
        if (opts.prompt.includes("Days 8\u201314")) {
          chunk1Attempts += 1;
          throw new Error("chunk 1 always fails");
        }
        return base.callClaude(opts);
      },
    };
    const req = baseReq({ startDate: "2026-05-01", endDate: "2026-05-14" });
    const job = await createJob(req, { userId: null, anonToken: "anon-soft" });
    const done = await runUntilDone(job.id, deps);
    // Should complete (not fail), with partial days from chunk:0
    expect(done.status).toBe("complete");
    expect(done.finalItinerary).toBeTruthy();
    const itin = done.finalItinerary as { days: DayPlan[] };
    // chunk:0 covers days 1-7 so we get at least those
    expect(itin.days.length).toBeGreaterThanOrEqual(7);
    // chunk:1 was hit MAX_STEP_ATTEMPTS times
    expect(chunk1Attempts).toBeGreaterThanOrEqual(3);
  });

  it("if NO chunk succeeds, job correctly ends failed (not stuck in assemble)", async () => {
    const deps: RunnerDeps = {
      callClaude: async (opts) => {
        if (opts.prompt.includes("Days")) throw new Error("all chunks fail");
        // booking + city_plan succeed
        return (makeClaudeStub().callClaude as (o: { prompt: string; maxTokens?: number }) => Promise<ReturnType<typeof makeClaudeStub>["callClaude"] extends (...a: unknown[]) => Promise<infer R> ? R : never>)(opts);
      },
      addUsage: async () => undefined,
      fetchHero: async () => null,
      fetchFlights: async () => null,
    };
    const job = await createJob(baseReq(), { userId: null, anonToken: "anon-total-fail" });
    const done = await runUntilDone(job.id, deps);
    expect(done.status).toBe("failed");
  });
});

describe("resumption", () => {
  it("refetching the job after a step mid-way returns the partial state", async () => {
    const job = await createJob(baseReq(), { userId: null, anonToken: "anon-1" });
    // Run just 3 steps
    await runOneStep(job.id, makeClaudeStub());
    await runOneStep(job.id, makeClaudeStub());
    await runOneStep(job.id, makeClaudeStub());
    const mid = await getRepo().get(job.id);
    expect(mid?.status).toBe("running");
    expect(mid?.steps.filter((s) => s.status === "done").length).toBeGreaterThanOrEqual(3);
    // Now finish it
    const done = await runUntilDone(job.id, makeClaudeStub());
    expect(done.status).toBe("complete");
  });
});

describe("flight provider integration", () => {
  it("prefers real flights when the provider returns them", async () => {
    const realFlight: Flight = {
      airline: "Lufthansa",
      departure: "2026-05-16T10:00",
      arrival: "2026-05-17T08:00",
      price: "$1250",
      stops: 1,
      originAirport: "LAX",
      destinationAirport: "PRG",
      bookingUrl: "https://www.skyscanner.com/test",
    };
    const deps = makeClaudeStub();
    deps.fetchFlights = async () => [realFlight];
    const job = await createJob(baseReq(), { userId: null, anonToken: "anon-1" });
    const done = await runUntilDone(job.id, deps);
    const itin = done.finalItinerary as { flights: Flight[] };
    expect(itin.flights[0].airline).toBe("Lufthansa");
  });
});
