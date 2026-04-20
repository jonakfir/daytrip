import { describe, it, expect } from "vitest";
import {
  cityForDay,
  groupHotelsByCity,
  flattenHotelsByCity,
  isMultiCity,
  TIER_ORDER,
} from "@/lib/itinerary-helpers";
import type { Hotel, Itinerary } from "@/types/itinerary";

const hotel = (over: Partial<Hotel> = {}): Hotel => ({
  name: "A hotel",
  pricePerNight: "$100",
  rating: 4,
  bookingUrl: "https://skyscanner.test",
  ...over,
});

describe("cityForDay", () => {
  const itin = {
    cityPlan: [
      { city: "Prague", country: "Czech Republic", startDay: 1, endDay: 7 },
      { city: "Budapest", country: "Hungary", startDay: 8, endDay: 14 },
    ],
  };

  it("returns the right city for a mid-range day", () => {
    expect(cityForDay(itin, 1)).toEqual({
      city: "Prague",
      country: "Czech Republic",
    });
    expect(cityForDay(itin, 7)).toEqual({
      city: "Prague",
      country: "Czech Republic",
    });
    expect(cityForDay(itin, 8)).toEqual({
      city: "Budapest",
      country: "Hungary",
    });
  });

  it("returns null when cityPlan is missing (single-city trip)", () => {
    expect(cityForDay({ cityPlan: undefined }, 1)).toBeNull();
    expect(cityForDay({}, 3)).toBeNull();
  });

  it("returns null for a day outside any range", () => {
    expect(cityForDay(itin, 99)).toBeNull();
  });
});

describe("groupHotelsByCity", () => {
  it("groups a flat list by the hotel's city field", () => {
    const itin: Pick<Itinerary, "hotels" | "hotelsByCity"> = {
      hotels: [
        hotel({ name: "Prague Hostel", city: "Prague", tier: "hostel" }),
        hotel({ name: "Prague Budget", city: "Prague", tier: "budget" }),
        hotel({ name: "Budapest Hostel", city: "Budapest", tier: "hostel" }),
      ],
    };
    const out = groupHotelsByCity(itin);
    expect(Object.keys(out).sort()).toEqual(["Budapest", "Prague"]);
    expect(out.Prague.map((h) => h.name)).toEqual([
      "Prague Hostel",
      "Prague Budget",
    ]);
  });

  it("prefers hotelsByCity when provided", () => {
    const itin: Pick<Itinerary, "hotels" | "hotelsByCity"> = {
      hotels: [],
      hotelsByCity: {
        Prague: [hotel({ name: "P", tier: "hostel" })],
      },
    };
    const out = groupHotelsByCity(itin);
    expect(out.Prague).toHaveLength(1);
    expect(out.Prague[0].name).toBe("P");
  });

  it("sorts tiers in hostel → upscale order regardless of input order", () => {
    const itin: Pick<Itinerary, "hotels" | "hotelsByCity"> = {
      hotelsByCity: {
        Prague: [
          hotel({ name: "U", tier: "upscale" }),
          hotel({ name: "H", tier: "hostel" }),
          hotel({ name: "M", tier: "mid" }),
          hotel({ name: "B", tier: "budget" }),
        ],
      },
      hotels: [],
    };
    const out = groupHotelsByCity(itin);
    expect(out.Prague.map((h) => h.tier)).toEqual(TIER_ORDER);
  });

  it("buckets hotels without a city under empty-string key", () => {
    const itin: Pick<Itinerary, "hotels" | "hotelsByCity"> = {
      hotels: [hotel({ name: "Orphan" })],
    };
    const out = groupHotelsByCity(itin);
    expect(out[""]).toHaveLength(1);
  });
});

describe("flattenHotelsByCity", () => {
  it("preserves order and copies city onto each hotel", () => {
    const byCity = {
      Prague: [hotel({ name: "P1", tier: "hostel" as const })],
      Budapest: [hotel({ name: "B1", tier: "hostel" as const })],
    };
    const flat = flattenHotelsByCity(byCity);
    expect(flat.map((h) => `${h.city}/${h.name}`)).toEqual([
      "Prague/P1",
      "Budapest/B1",
    ]);
  });
});

describe("isMultiCity", () => {
  it("true when cityPlan has >1 entry", () => {
    expect(
      isMultiCity({
        cityPlan: [
          { city: "A", country: "X", startDay: 1, endDay: 3 },
          { city: "B", country: "Y", startDay: 4, endDay: 6 },
        ],
      })
    ).toBe(true);
  });

  it("false for single-city cityPlan", () => {
    expect(
      isMultiCity({
        cityPlan: [
          { city: "A", country: "X", startDay: 1, endDay: 7 },
        ],
      })
    ).toBe(false);
  });

  it("true when hotelsByCity has >1 key", () => {
    expect(
      isMultiCity({
        hotelsByCity: { A: [], B: [] },
      })
    ).toBe(true);
  });
});
