import { describe, it, expect } from "vitest";
import {
  REGION_CATALOG,
  getRegionBySlug,
  getRegionByLabel,
  allCitiesInRegions,
} from "@/lib/region-catalog";

describe("REGION_CATALOG", () => {
  it("has exactly 20 regions", () => {
    expect(REGION_CATALOG).toHaveLength(20);
  });

  it("every region has a non-empty slug, label, and at least 3 countries", () => {
    for (const r of REGION_CATALOG) {
      expect(r.slug).toMatch(/^[a-z0-9-]+$/);
      expect(r.label.length).toBeGreaterThan(0);
      expect(r.countries.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("every country has at least 4 real-looking cities", () => {
    for (const r of REGION_CATALOG) {
      for (const c of r.countries) {
        expect(c.name.length).toBeGreaterThan(0);
        expect(c.cities.length).toBeGreaterThanOrEqual(4);
        for (const city of c.cities) {
          // city names should not contain digits or look synthetic
          expect(city.name).not.toMatch(/\d/);
          expect(city.name.trim()).toBe(city.name);
        }
      }
    }
  });

  it("slugs are unique", () => {
    const slugs = REGION_CATALOG.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("labels are unique", () => {
    const labels = REGION_CATALOG.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe("lookups", () => {
  it("getRegionBySlug works", () => {
    expect(getRegionBySlug("eastern-europe")?.label).toBe("Eastern Europe");
  });
  it("getRegionByLabel works", () => {
    const r = getRegionByLabel("Eastern Europe");
    expect(r?.slug).toBe("eastern-europe");
  });
  it("returns undefined for unknown region", () => {
    expect(getRegionBySlug("atlantis")).toBeUndefined();
    expect(getRegionByLabel("Atlantis")).toBeUndefined();
  });
});

describe("allCitiesInRegions", () => {
  it("returns cities across multiple regions, de-duplicated by name", () => {
    const cities = allCitiesInRegions(["Eastern Europe"]);
    expect(cities.length).toBeGreaterThan(0);
    const names = cities.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });
  it("returns empty array for unknown region", () => {
    expect(allCitiesInRegions(["Atlantis"])).toEqual([]);
  });
  it("unions across multiple regions", () => {
    const single = allCitiesInRegions(["Eastern Europe"]).length;
    const combined = allCitiesInRegions(["Eastern Europe", "Balkans"]).length;
    expect(combined).toBeGreaterThanOrEqual(single);
  });
});
