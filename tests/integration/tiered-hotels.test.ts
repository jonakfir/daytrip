import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createJob,
  runUntilDone,
  type RunnerDeps,
} from "@/lib/trip-job-runner";
import {
  setRepoBackend,
  createInMemoryRepo,
} from "@/lib/trip-job-repo";
import type { GenerateRequest, Itinerary, DayPlan } from "@/types/itinerary";
import type { ClaudeCallResult } from "@/lib/claude-client";

/**
 * End-to-end tests for the per-city 4-tier hotels feature.
 *
 * Validates three flows:
 *  A) Explicit cities (user picked Prague + Budapest + Krakow): the
 *     runner should schedule one hotels:{N} step per city and every
 *     city should end up with exactly 4 tiered hotels in the final
 *     itinerary.hotelsByCity.
 *  B) Region trip where the Claude coordinator picks the cities. The
 *     runner should dynamically insert hotels steps after city_plan
 *     and fan them out. No hotels:{N} steps exist in the initial
 *     ledger — they appear once city_plan resolves.
 *  C) Single-city trip: exactly one hotels:0 step producing 4 tiers
 *     (hostel + budget + mid + upscale) for the destination.
 */

function makeStub(): RunnerDeps {
  const call = async ({ prompt }: { prompt: string }): Promise<ClaudeCallResult> => {
    // City-coordinator prompt
    if (/Plan a .* trip covering/.test(prompt)) {
      return {
        text: JSON.stringify([
          { city: "Prague", country: "Czech Republic", startDay: 1, endDay: 7 },
          { city: "Budapest", country: "Hungary", startDay: 8, endDay: 14 },
        ]),
        usage: { inputTokens: 10, outputTokens: 20, model: "claude-sonnet-4-6" },
      };
    }
    // Per-city 4-tier hotels prompt
    if (/List 4 real, currently-operating hotels in/.test(prompt)) {
      const cityMatch = prompt.match(/hotels in ([^,\n]+?)(?:,|\n| for)/);
      const city = cityMatch ? cityMatch[1].trim() : "Unknown";
      return {
        text: JSON.stringify([
          { name: `${city} Hostel`, pricePerNight: "$40", rating: 4.0, tier: "hostel" },
          { name: `${city} Budget Inn`, pricePerNight: "$95", rating: 4.2, tier: "budget" },
          { name: `${city} Boutique`, pricePerNight: "$190", rating: 4.6, tier: "mid" },
          { name: `${city} Grand`, pricePerNight: "$350", rating: 4.8, tier: "upscale" },
        ]),
        usage: { inputTokens: 20, outputTokens: 40, model: "claude-sonnet-4-6" },
      };
    }
    // Booking (flights/tours/tips only now)
    if (/Output:[\s\S]*hotels[\s\S]*flights[\s\S]*tours[\s\S]*tips/.test(prompt)) {
      return {
        text: JSON.stringify({
          hotels: [],
          flights: [
            { airline: "United", departure: "", arrival: "", price: "$850", stops: 1, originAirport: "LAX", destinationAirport: "PRG", bookingUrl: "https://example.test" },
          ],
          tours: [{ name: "Walking Tour", price: "$50", duration: "3h", rating: 4.8, bookingUrl: "https://example.test" }],
          tips: ["t1", "t2", "t3", "t4"],
        }),
        usage: { inputTokens: 20, outputTokens: 40, model: "claude-sonnet-4-6" },
      };
    }
    // Chunk prompt
    const m = prompt.match(/Days (\d+)\u2013(\d+)/);
    const start = m ? Number(m[1]) : 1;
    const end = m ? Number(m[2]) : 1;
    const days: DayPlan[] = [];
    for (let d = start; d <= end; d++) {
      days.push({
        dayNumber: d,
        date: `2026-05-${String(d).padStart(2, "0")}`,
        title: `Day ${d}`,
        morning: [{ time: "09:00", name: `Morning ${d}`, category: "food", description: "", duration: "1h" }],
        afternoon: [{ time: "13:00", name: `Afternoon ${d}`, category: "culture", description: "", duration: "2h" }],
        evening: [{ time: "19:00", name: `Evening ${d}`, category: "food", description: "", duration: "2h" }],
        tip: "tip",
      });
    }
    return {
      text: JSON.stringify(days),
      usage: { inputTokens: 10, outputTokens: 20, model: "claude-sonnet-4-6" },
    };
  };
  return {
    callClaude: call,
    addUsage: async () => undefined,
    fetchHero: async () => "https://img.test/hero.jpg",
    fetchFlights: async () => null,
    generateId: () => "id",
    generateShareId: () => "shr",
  };
}

beforeEach(() => setRepoBackend(createInMemoryRepo()));
afterEach(() => setRepoBackend(null));

const base = (over: Partial<GenerateRequest> = {}): GenerateRequest => ({
  destination: "Tokyo, Japan",
  startDate: "2026-05-01",
  endDate: "2026-05-05",
  travelers: 2,
  style: "Cultural",
  ...over,
});

describe("tiered hotels — explicit user cities", () => {
  const req = base({
    destination: "Eastern Europe",
    startDate: "2026-05-01",
    endDate: "2026-05-14",
    regions: ["Eastern Europe"],
    cities: ["Prague", "Budapest", "Krakow"],
  });

  it("plans 3 hotels:{N} steps up front (one per city)", async () => {
    const job = await createJob(req, { userId: null, anonToken: "anon" });
    const hotelsSteps = job.steps.filter((s) => s.key.startsWith("hotels:"));
    expect(hotelsSteps).toHaveLength(3);
  });

  it("completes with hotelsByCity populated 3 × 4 tiers", async () => {
    const job = await createJob(req, { userId: null, anonToken: "anon" });
    const done = await runUntilDone(job.id, makeStub());
    expect(done.status).toBe("complete");
    const itin = done.finalItinerary as Itinerary;
    const byCity = itin.hotelsByCity ?? {};
    expect(Object.keys(byCity).sort()).toEqual(["Budapest", "Krakow", "Prague"]);
    for (const [, list] of Object.entries(byCity)) {
      expect(list).toHaveLength(4);
      const tiers = list.map((h) => h.tier);
      expect(new Set(tiers)).toEqual(
        new Set(["hostel", "budget", "mid", "upscale"])
      );
    }
    // The flat hotels[] is also flattened from byCity (12 total).
    expect(itin.hotels).toHaveLength(12);
  });
});

describe("tiered hotels — region trip, runtime-picked cities", () => {
  const req = base({
    destination: "Eastern Europe",
    startDate: "2026-05-01",
    endDate: "2026-05-14",
    regions: ["Eastern Europe"],
  });

  it("no hotels:{N} steps up front (inserted after city_plan)", async () => {
    const job = await createJob(req, { userId: null, anonToken: "anon" });
    expect(job.steps.filter((s) => s.key.startsWith("hotels:"))).toHaveLength(0);
    expect(job.steps.some((s) => s.key === "city_plan")).toBe(true);
  });

  it("inserts hotels steps dynamically and completes with 2 cities × 4 tiers", async () => {
    const job = await createJob(req, { userId: null, anonToken: "anon" });
    const done = await runUntilDone(job.id, makeStub());
    expect(done.status).toBe("complete");
    const itin = done.finalItinerary as Itinerary;
    const byCity = itin.hotelsByCity ?? {};
    expect(Object.keys(byCity).sort()).toEqual(["Budapest", "Prague"]);
    expect(byCity.Prague).toHaveLength(4);
    expect(byCity.Budapest).toHaveLength(4);
    // cityPlan passes through to the Itinerary
    expect(itin.cityPlan).toBeTruthy();
    expect(itin.cityPlan!.length).toBe(2);
  });
});

describe("tiered hotels — single-city", () => {
  it("generates one hotels:0 step with 4 tiers for Tokyo", async () => {
    const job = await createJob(base(), { userId: null, anonToken: "anon" });
    const hotelsSteps = job.steps.filter((s) => s.key.startsWith("hotels:"));
    expect(hotelsSteps).toHaveLength(1);
    expect(hotelsSteps[0].label).toContain("Tokyo");
    const done = await runUntilDone(job.id, makeStub());
    expect(done.status).toBe("complete");
    const itin = done.finalItinerary as Itinerary;
    const byCity = itin.hotelsByCity ?? {};
    expect(Object.keys(byCity)).toHaveLength(1);
    expect(Object.values(byCity)[0]).toHaveLength(4);
    // No cityPlan for a plain single-city trip
    expect(itin.cityPlan).toBeUndefined();
  });
});
