import { describe, expect, it } from "vitest";
import { coverage, filterStops, type Params, type Stop } from "./coverage";

const stop = (id: string, lon: number, dph: number, modes: Stop["properties"]["modes"] = ["bus"]): Stop => ({
  type: "Feature",
  geometry: { type: "Point", coordinates: [lon, 48.2] },
  properties: {
    id, name: id, modes,
    dph: { weekday: { am: dph, midday: dph, pm: dph, evening: dph }, saturday: { am: 0, midday: 0, pm: 0, evening: 0 }, sunday: { am: 0, midday: 0, pm: 0, evening: 0 } },
  },
});
const params: Params = { day: "weekday", band: "am", minDph: 4, radius: 400, modes: ["bus", "tram"] };

describe("filterStops", () => {
  it("keeps only stops meeting frequency and mode filters", () => {
    const stops = [stop("a", 16.3, 6), stop("b", 16.31, 2), stop("c", 16.32, 8, ["rail"])];
    expect(filterStops(stops, params).map((s) => s.properties.id)).toEqual(["a"]);
  });
});

describe("coverage", () => {
  it("is empty without stops", () => expect(coverage([], 400).km2).toBe(0));
  it("does not double count overlapping buffers", () => {
    const one = coverage([stop("a", 16.3, 6)], 400).km2;
    const two = coverage([stop("a", 16.3, 6), stop("b", 16.3001, 6)], 400).km2;
    expect(two).toBeLessThan(one * 1.1);
  });
});
