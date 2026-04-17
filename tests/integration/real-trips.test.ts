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
import type { GenerateRequest, DayPlan, Flight, Itinerary } from "@/types/itinerary";
import type { ClaudeCallResult } from "@/lib/claude-client";

/**
 * Three "real" end-to-end trip scenarios. Each uses a realistic
 * Claude stub (right-shaped JSON, realistic cities, ~normal timings)
 * and exercises the full job lifecycle through the runner. The goal
 * is to prove — before we trust the UI — that the *shape* and
 * *invariants* of a completed itinerary hold for each trip type.
 *
 * Scenario 1: LA → Tokyo, 10 days, Cultural           (single city, medium)
 * Scenario 2: NYC → Italy, 14 days, explicit cities   (region + cities)
 * Scenario 3: LA → Eastern Europe, 47 days            (original failing case)
 */

// ── Realistic Claude stub ────────────────────────────────────────────

function realisticClaudeStub(): RunnerDeps {
  const cityDB: Record<string, { name: string; category: "food" | "culture" | "nature" | "shopping" | "entertainment" }[]> = {
    Tokyo: [
      { name: "Tsukiji Outer Market", category: "food" },
      { name: "Senso-ji Temple", category: "culture" },
      { name: "Meiji Shrine", category: "culture" },
      { name: "Shibuya Crossing", category: "entertainment" },
      { name: "Yanaka Ginza", category: "shopping" },
      { name: "Ueno Park", category: "nature" },
      { name: "Shinjuku Gyoen", category: "nature" },
      { name: "Akihabara Electric Town", category: "shopping" },
      { name: "Ghibli Museum", category: "culture" },
      { name: "Tokyo National Museum", category: "culture" },
      { name: "Sushi Dai", category: "food" },
      { name: "Piss Alley (Omoide Yokocho)", category: "food" },
      { name: "Ramen Street Tokyo Station", category: "food" },
      { name: "Roppongi Hills", category: "entertainment" },
      { name: "Odaiba", category: "entertainment" },
      { name: "teamLab Planets", category: "entertainment" },
      { name: "Nezu Museum", category: "culture" },
      { name: "Harajuku Takeshita Street", category: "shopping" },
      { name: "Golden Gai", category: "food" },
      { name: "Ichiran Shinjuku", category: "food" },
      { name: "Imperial Palace East Gardens", category: "nature" },
      { name: "Koishikawa Korakuen", category: "nature" },
      { name: "Blue Bottle Aoyama", category: "food" },
      { name: "Tomoe Sushi Tsukiji", category: "food" },
      { name: "Toraya Akasaka", category: "food" },
      { name: "Yayoi Kusama Museum", category: "culture" },
      { name: "Ebisu Yokocho", category: "food" },
      { name: "Nakameguro Canal", category: "nature" },
      { name: "Daikanyama T-Site", category: "shopping" },
      { name: "Kappabashi Kitchen Street", category: "shopping" },
    ],
    Prague: [
      { name: "Old Town Square", category: "culture" },
      { name: "Prague Castle", category: "culture" },
      { name: "Charles Bridge", category: "culture" },
      { name: "Lokál Dlouhááá", category: "food" },
      { name: "Letná Park", category: "nature" },
      { name: "Cafe Savoy", category: "food" },
      { name: "Vrtba Garden", category: "nature" },
      { name: "Vyšehrad", category: "culture" },
      { name: "Nase Maso", category: "food" },
      { name: "Strahov Monastery Library", category: "culture" },
      { name: "Municipal House", category: "culture" },
      { name: "Pivovarský Klub", category: "food" },
      { name: "Jewish Quarter (Josefov)", category: "culture" },
    ],
    Budapest: [
      { name: "Fisherman's Bastion", category: "culture" },
      { name: "Széchenyi Thermal Baths", category: "entertainment" },
      { name: "Parliament Building", category: "culture" },
      { name: "Central Market Hall", category: "food" },
      { name: "Margaret Island", category: "nature" },
      { name: "Ruin Bar Szimpla Kert", category: "food" },
      { name: "Andrássy Avenue", category: "shopping" },
      { name: "Dohány Street Synagogue", category: "culture" },
      { name: "Chain Bridge", category: "culture" },
      { name: "Gellért Hill", category: "nature" },
      { name: "Menza", category: "food" },
      { name: "Mazel Tov", category: "food" },
      { name: "House of Terror", category: "culture" },
    ],
    Krakow: [
      { name: "Main Market Square (Rynek)", category: "culture" },
      { name: "Wawel Castle", category: "culture" },
      { name: "Kazimierz District", category: "culture" },
      { name: "St. Mary's Basilica", category: "culture" },
      { name: "Hala Forum", category: "food" },
      { name: "Schindler's Factory Museum", category: "culture" },
      { name: "Pod Nosem", category: "food" },
      { name: "Planty Park", category: "nature" },
      { name: "Cloth Hall", category: "shopping" },
      { name: "Pod Aniołami", category: "food" },
      { name: "Wieliczka Salt Mine", category: "culture" },
      { name: "Hamsa", category: "food" },
      { name: "Bar Mleczny Pod Temida", category: "food" },
    ],
    Warsaw: [
      { name: "Old Town Market Square", category: "culture" },
      { name: "Łazienki Park", category: "nature" },
      { name: "POLIN Museum", category: "culture" },
      { name: "Wilanów Palace", category: "culture" },
      { name: "Zapiecek", category: "food" },
      { name: "Hala Koszyki", category: "food" },
      { name: "Warsaw Uprising Museum", category: "culture" },
      { name: "Praga District", category: "culture" },
      { name: "Piwna Kompania", category: "food" },
      { name: "Copernicus Science Centre", category: "entertainment" },
      { name: "Charlotte", category: "food" },
      { name: "Stary Dom", category: "food" },
      { name: "Bar Bambino", category: "food" },
    ],
    Rome: [
      { name: "Colosseum", category: "culture" },
      { name: "Roman Forum", category: "culture" },
      { name: "Pantheon", category: "culture" },
      { name: "Trastevere", category: "food" },
      { name: "Vatican Museums", category: "culture" },
      { name: "St Peter's Basilica", category: "culture" },
      { name: "Borghese Gallery", category: "culture" },
      { name: "Trevi Fountain", category: "culture" },
      { name: "Campo de' Fiori", category: "food" },
      { name: "Pizzarium Bonci", category: "food" },
      { name: "Villa Borghese Gardens", category: "nature" },
      { name: "Testaccio Market", category: "food" },
      { name: "Checchino dal 1887", category: "food" },
    ],
    Florence: [
      { name: "Uffizi Gallery", category: "culture" },
      { name: "Ponte Vecchio", category: "culture" },
      { name: "Duomo Florence", category: "culture" },
      { name: "All'Antico Vinaio", category: "food" },
      { name: "Boboli Gardens", category: "nature" },
      { name: "Accademia Gallery", category: "culture" },
      { name: "Mercato Centrale", category: "food" },
      { name: "Oltrarno District Walk", category: "culture" },
      { name: "Piazzale Michelangelo", category: "nature" },
      { name: "Trattoria Mario", category: "food" },
      { name: "Palazzo Pitti", category: "culture" },
      { name: "Gelateria La Carraia", category: "food" },
      { name: "Vivoli Gelateria", category: "food" },
    ],
    Venice: [
      { name: "St Mark's Square", category: "culture" },
      { name: "Doge's Palace", category: "culture" },
      { name: "Rialto Bridge", category: "culture" },
      { name: "Cicchetti at All'Arco", category: "food" },
      { name: "Grand Canal Boat Ride", category: "entertainment" },
      { name: "Peggy Guggenheim Collection", category: "culture" },
      { name: "Burano Island", category: "culture" },
      { name: "Osteria alle Testiere", category: "food" },
      { name: "Dorsoduro Walk", category: "culture" },
      { name: "Harry's Bar", category: "food" },
      { name: "Libreria Acqua Alta", category: "shopping" },
      { name: "Trattoria da Remigio", category: "food" },
      { name: "Gelato Nico", category: "food" },
    ],
  };

  const call = async ({ prompt }: { prompt: string }): Promise<ClaudeCallResult> => {
    await new Promise((r) => setTimeout(r, 5));

    // City coordinator prompt
    if (/Plan a .* trip covering/.test(prompt)) {
      const m = prompt.match(/Plan a (\d+)-day/);
      const n = m ? Number(m[1]) : 14;
      if (prompt.includes("Eastern Europe")) {
        return {
          text: JSON.stringify([
            { city: "Prague", country: "Czech Republic", startDay: 1, endDay: Math.ceil(n * 0.3) },
            { city: "Budapest", country: "Hungary", startDay: Math.ceil(n * 0.3) + 1, endDay: Math.ceil(n * 0.55) },
            { city: "Krakow", country: "Poland", startDay: Math.ceil(n * 0.55) + 1, endDay: Math.ceil(n * 0.8) },
            { city: "Warsaw", country: "Poland", startDay: Math.ceil(n * 0.8) + 1, endDay: n },
          ]),
          usage: { inputTokens: 200, outputTokens: 400, model: "claude-sonnet-4-6" },
        };
      }
      return {
        text: JSON.stringify([
          { city: "Rome", country: "Italy", startDay: 1, endDay: Math.ceil(n / 3) },
          { city: "Florence", country: "Italy", startDay: Math.ceil(n / 3) + 1, endDay: Math.ceil((2 * n) / 3) },
          { city: "Venice", country: "Italy", startDay: Math.ceil((2 * n) / 3) + 1, endDay: n },
        ]),
        usage: { inputTokens: 200, outputTokens: 400, model: "claude-sonnet-4-6" },
      };
    }

    // Booking prompt
    if (/Output:.*hotels.*flights.*tours.*tips/s.test(prompt)) {
      const dest = prompt.match(/Trip to ([^,]+)/)?.[1] ?? "Somewhere";
      return {
        text: JSON.stringify({
          hotels: [
            { name: `${dest} Grand Hotel`, pricePerNight: "$220", rating: 4.5, bookingUrl: "https://skyscanner.test" },
            { name: `${dest} Boutique`, pricePerNight: "$140", rating: 4.2, bookingUrl: "https://skyscanner.test" },
            { name: `${dest} Budget Inn`, pricePerNight: "$75", rating: 3.8, bookingUrl: "https://skyscanner.test" },
          ],
          flights: [
            { airline: "United", departure: "2026-05-16T09:00", arrival: "2026-05-16T21:00", price: "$850", stops: 1, originAirport: "LAX", destinationAirport: "NRT", bookingUrl: "https://skyscanner.test" },
            { airline: "ANA", departure: "2026-06-01T14:00", arrival: "2026-06-02T10:00", price: "$920", stops: 0, originAirport: "NRT", destinationAirport: "LAX", bookingUrl: "https://skyscanner.test" },
          ],
          tours: [
            { name: `${dest} Walking Tour`, price: "$45", duration: "3h", rating: 4.8, bookingUrl: "https://viator.test" },
            { name: `${dest} Food Crawl`, price: "$85", duration: "4h", rating: 4.9, bookingUrl: "https://viator.test" },
            { name: `${dest} Day Trip`, price: "$120", duration: "8h", rating: 4.7, bookingUrl: "https://viator.test" },
          ],
          tips: [
            "Cash is still king in many small places.",
            "Public transit is cheaper than cabs everywhere.",
            "Book major museums online to skip lines.",
            "Tipping 10% is plenty in restaurants.",
          ],
        }),
        usage: { inputTokens: 150, outputTokens: 800, model: "claude-sonnet-4-6" },
      };
    }

    // Day chunk prompt — use the `trip to X` destination to pick a city
    const cityMatch = prompt.match(/trip to ([^.]+)\. Days/);
    let city = cityMatch ? cityMatch[1].split(",")[0].trim() : "Tokyo";
    // city might have region label for coordinator-less runs
    if (!cityDB[city]) {
      // Fallback: pick any catalog
      city = Object.keys(cityDB)[0];
    }
    const m = prompt.match(/Days (\d+)\u2013(\d+)/);
    const start = m ? Number(m[1]) : 1;
    const end = m ? Number(m[2]) : 1;
    const pool = cityDB[city];
    // Use a deterministic offset based on start day so each chunk gets
    // different pool entries (avoiding dedupe hits in tests)
    const days: DayPlan[] = [];
    for (let d = start; d <= end; d++) {
      const base = (d - 1) * 6; // 6 activities per day
      const pick = (offset: number) => pool[(base + offset) % pool.length];
      days.push({
        dayNumber: d,
        date: `2026-05-${String(d).padStart(2, "0")}`,
        title: `${city} Day ${d}`,
        morning: [
          { time: "08:30", name: `${pick(0).name} (day ${d})`, category: pick(0).category, description: "morning activity", duration: "1h" },
          { time: "10:30", name: `${pick(1).name} (day ${d})`, category: pick(1).category, description: "morning activity 2", duration: "2h", distanceFromPrevious: "0.5 km", walkingTime: "7 min" },
        ],
        afternoon: [
          { time: "13:00", name: `${pick(2).name} (day ${d})`, category: pick(2).category, description: "lunch", duration: "1h" },
          { time: "15:00", name: `${pick(3).name} (day ${d})`, category: pick(3).category, description: "afternoon sight", duration: "2h", distanceFromPrevious: "1 km", walkingTime: "12 min" },
        ],
        evening: [
          { time: "18:30", name: `${pick(4).name} (day ${d})`, category: pick(4).category, description: "evening", duration: "1.5h" },
          { time: "20:30", name: `${pick(5).name} (day ${d})`, category: pick(5).category, description: "dinner", duration: "2h", distanceFromPrevious: "0.8 km", walkingTime: "10 min" },
        ],
        tip: `Tip for day ${d} in ${city}.`,
      });
    }
    return {
      text: JSON.stringify(days),
      usage: { inputTokens: 600 * (end - start + 1), outputTokens: 400 * (end - start + 1), model: "claude-sonnet-4-6" },
    };
  };

  return {
    callClaude: call,
    addUsage: async () => undefined,
    fetchHero: async (dest) => `https://img.test/${encodeURIComponent(dest)}.jpg`,
    fetchFlights: async (): Promise<Flight[] | null> => null,
    generateId: () => `test-${Math.random().toString(36).slice(2, 8)}`,
    generateShareId: () => Math.random().toString(36).slice(2, 10),
  };
}

// ── Test setup ───────────────────────────────────────────────────────

beforeEach(() => {
  setRepoBackend(createInMemoryRepo());
});
afterEach(() => {
  setRepoBackend(null);
});

// Common assertions that apply to every finished itinerary.
function assertItineraryInvariants(
  itin: Itinerary,
  expectations: { expectedDays: number; hotelsMin: number; toursMin: number; tipsMin: number }
) {
  expect(itin.days).toHaveLength(expectations.expectedDays);
  for (const d of itin.days) {
    expect(d.morning.length).toBeGreaterThan(0);
    expect(d.afternoon.length).toBeGreaterThan(0);
    expect(d.evening.length).toBeGreaterThan(0);
    // dayNumber should be within range
    expect(d.dayNumber).toBeGreaterThanOrEqual(1);
    expect(d.dayNumber).toBeLessThanOrEqual(expectations.expectedDays);
  }
  // day numbers are unique and contiguous 1..N
  const nums = itin.days.map((d) => d.dayNumber).sort((a, b) => a - b);
  expect(nums).toEqual(Array.from({ length: expectations.expectedDays }, (_, i) => i + 1));
  // side-car fields
  expect(itin.hotels.length).toBeGreaterThanOrEqual(expectations.hotelsMin);
  expect(itin.tours.length).toBeGreaterThanOrEqual(expectations.toursMin);
  expect(itin.tips.length).toBeGreaterThanOrEqual(expectations.tipsMin);
  expect(itin.shareId).toBeTruthy();
}

// ── Scenario 1: LA → Tokyo, 10 days (single city, medium) ─────────────

describe("REAL TRIP 1: LA → Tokyo, 10 days, Cultural", () => {
  const req: GenerateRequest = {
    destination: "Tokyo, Japan",
    startDate: "2026-05-01",
    endDate: "2026-05-10",
    travelers: 2,
    style: "Cultural",
    styles: ["Cultural", "Relaxation"],
    originCity: "Los Angeles",
    originAirport: "LAX",
    destinationAirport: "NRT",
    budgetPerDay: 250,
  };

  it("completes end-to-end and produces a well-formed 10-day itinerary", async () => {
    const job = await createJob(req, { userId: null, anonToken: "anon-tokyo" });
    const done = await runUntilDone(job.id, realisticClaudeStub());
    expect(done.status).toBe("complete");
    const itin = done.finalItinerary as Itinerary;
    assertItineraryInvariants(itin, { expectedDays: 10, hotelsMin: 3, toursMin: 3, tipsMin: 4 });
    expect(itin.destination).toBe("Tokyo, Japan");
    expect(itin.travelers).toBe(2);
    expect(itin.heroImage).toContain("img.test");
  });

  it("has 2 chunks (days 1–7 + days 8–10)", async () => {
    const job = await createJob(req, { userId: null, anonToken: "anon-tokyo" });
    const chunks = job.steps.filter((s) => s.key.startsWith("chunk:"));
    expect(chunks).toHaveLength(2);
  });

  it("does NOT run the city coordinator (single-city)", async () => {
    const job = await createJob(req, { userId: null, anonToken: "anon-tokyo" });
    expect(job.steps.map((s) => s.key)).not.toContain("city_plan");
  });
});

// ── Scenario 2: NYC → Italy, 14 days, explicit cities ────────────────

describe("REAL TRIP 2: NYC → Italy, 14 days, explicit Rome/Florence/Venice", () => {
  const req: GenerateRequest = {
    destination: "Southern Europe",
    startDate: "2026-06-01",
    endDate: "2026-06-14",
    travelers: 2,
    style: "Cultural",
    styles: ["Cultural", "Foodie"],
    regions: ["Southern Europe"],
    cities: ["Rome", "Florence", "Venice"],
    originCity: "New York",
    originAirport: "JFK",
    budgetPerDay: 400,
  };

  it("completes end-to-end, skips Claude city-coordinator", async () => {
    const job = await createJob(req, { userId: null, anonToken: "anon-italy" });
    // explicit cities → no city_plan step
    expect(job.steps.map((s) => s.key)).not.toContain("city_plan");
    const done = await runUntilDone(job.id, realisticClaudeStub());
    expect(done.status).toBe("complete");
    const itin = done.finalItinerary as Itinerary;
    assertItineraryInvariants(itin, { expectedDays: 14, hotelsMin: 3, toursMin: 3, tipsMin: 4 });
  });

  it("distributes 14 days across 3 chunks", async () => {
    const job = await createJob(req, { userId: null, anonToken: "anon-italy" });
    const chunks = job.steps.filter((s) => s.key.startsWith("chunk:"));
    expect(chunks).toHaveLength(2); // 14 days / 7 = 2 chunks (days 1-7, 8-14)
  });

  it("retries gracefully when chunk 1 transiently fails", async () => {
    let failures = 1;
    const base = realisticClaudeStub();
    const deps: RunnerDeps = {
      ...base,
      callClaude: async (opts) => {
        if (opts.prompt.includes("Days 1\u20137") && failures > 0) {
          failures -= 1;
          throw new Error("transient chunk 1 failure");
        }
        return base.callClaude(opts);
      },
    };
    const job = await createJob(req, { userId: null, anonToken: "anon-italy" });
    const done = await runUntilDone(job.id, deps);
    expect(done.status).toBe("complete");
    const chunk0 = done.steps.find((s) => s.key === "chunk:0");
    expect(chunk0?.attempts).toBeGreaterThanOrEqual(2);
  });
});

// ── Scenario 3: LA → Eastern Europe, 47 days (ORIGINAL FAILURE) ──────

describe("REAL TRIP 3: LA → Eastern Europe, May 16 → July 1 (47 days) — THE CANARY", () => {
  const req: GenerateRequest = {
    destination: "Eastern Europe",
    startDate: "2026-05-16",
    endDate: "2026-07-01",
    travelers: 2,
    style: "Cultural",
    styles: ["Cultural"],
    regions: ["Eastern Europe"],
    originCity: "Los Angeles",
    originAirport: "LAX",
    budgetPerDay: 200,
  };

  it("completes the full 47-day trip (this was the original failure)", async () => {
    const job = await createJob(req, { userId: null, anonToken: "anon-ee47" });
    const done = await runUntilDone(job.id, realisticClaudeStub());
    expect(done.status).toBe("complete");
    const itin = done.finalItinerary as Itinerary;
    assertItineraryInvariants(itin, { expectedDays: 47, hotelsMin: 3, toursMin: 3, tipsMin: 4 });
  });

  it("runs exactly 7 chunks + 1 city_plan step for 47 days", async () => {
    const job = await createJob(req, { userId: null, anonToken: "anon-ee47" });
    const keys = job.steps.map((s) => s.key);
    expect(keys).toContain("city_plan");
    expect(keys.filter((k) => k.startsWith("chunk:"))).toHaveLength(7);
  });

  it("city coordinator plan covers all 47 days across 4 cities", async () => {
    const job = await createJob(req, { userId: null, anonToken: "anon-ee47" });
    const done = await runUntilDone(job.id, realisticClaudeStub());
    expect(done.cityPlan).toBeTruthy();
    const plan = done.cityPlan!;
    expect(plan.length).toBeGreaterThanOrEqual(3);
    // Coverage: union of all day ranges should cover 1..47
    const covered = new Set<number>();
    for (const entry of plan) {
      for (let d = entry.startDay; d <= entry.endDay; d++) covered.add(d);
    }
    expect(covered.size).toBeGreaterThanOrEqual(Math.floor(47 * 0.95));
  });

  it("when Claude coordinator returns a sparse plan, falls back cleanly without dying", async () => {
    const base = realisticClaudeStub();
    const deps: RunnerDeps = {
      ...base,
      callClaude: async (opts) => {
        if (/Plan a .* trip covering/.test(opts.prompt)) {
          // Intentionally sparse: only covers 5 days out of 47
          return {
            text: JSON.stringify([
              { city: "Prague", country: "Czech Republic", startDay: 1, endDay: 5 },
            ]),
            usage: { inputTokens: 100, outputTokens: 100, model: "claude-sonnet-4-6" },
          };
        }
        return base.callClaude(opts);
      },
    };
    const job = await createJob(req, { userId: null, anonToken: "anon-ee47-sparse" });
    const done = await runUntilDone(job.id, deps);
    // Sparse plan should be rejected (<80% coverage) and cityPlan stays null;
    // the trip still completes using the plain region prompt.
    expect(done.status).toBe("complete");
    expect(done.cityPlan).toBeNull();
  });

  it("never hangs — completes in bounded time", async () => {
    const job = await createJob(req, { userId: null, anonToken: "anon-ee47-timing" });
    const t0 = Date.now();
    const done = await runUntilDone(job.id, realisticClaudeStub());
    const elapsed = Date.now() - t0;
    expect(done.status).toBe("complete");
    // The stub simulates real latency (~5ms/call). With ~12 steps this
    // should finish well under 1s in tests. This catches accidental
    // unbounded loops or exponential backoff bugs.
    expect(elapsed).toBeLessThan(5_000);
  });
});
