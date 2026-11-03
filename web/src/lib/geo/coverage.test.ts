import { describe, expect, it } from "vitest";
import { filterStops, getCoverage, type FilterParams, type Stop } from "./coverage";

const makeStop = (id: string, lon: number, dph: number, modes: Stop["properties"]["modes"] = ["bus"]): Stop => ({
  type: "Feature",
  geometry: { type: "Point", coordinates: [lon, 48.2] },
  properties: {
    id, name: id, modes,
    dph: { weekday: { am: dph, midday: dph, pm: dph, evening: dph }, saturday: { am: 0, midday: 0, pm: 0, evening: 0 }, sunday: { am: 0, midday: 0, pm: 0, evening: 0 } },
  },
});
const filterParams: FilterParams = { day: "weekday", band: "am", minDeparturesPerHour: 4, radiusMeters: 400, modes: ["bus", "tram"] };

describe("filterStops", () => {
  it("keeps only stops meeting frequency and mode filters", () => {
    const stops = [makeStop("a", 16.3, 6), makeStop("b", 16.31, 2), makeStop("c", 16.32, 8, ["rail"])];
    expect(filterStops(stops, filterParams).map((stop) => stop.properties.id)).toEqual(["a"]);
  });
});

describe("getCoverage", () => {
  it("is empty without stops", () => expect(getCoverage([], 400).areaKm2).toBe(0));
  it("does not double count overlapping buffers", () => {
    const singleStopArea = getCoverage([makeStop("a", 16.3, 6)], 400).areaKm2;
    const overlappingStopsArea = getCoverage([makeStop("a", 16.3, 6), makeStop("b", 16.3001, 6)], 400).areaKm2;
    expect(overlappingStopsArea).toBeLessThan(singleStopArea * 1.1);
  });
});
