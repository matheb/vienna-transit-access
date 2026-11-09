import { DAY_TYPES, TIME_BANDS, type DayType, type Mode, type Stop, type TimeBand } from "@/lib/geo/coverage";

const DEFAULT_COORDINATES = [16.37, 48.21];
const DEFAULT_DEPARTURES_PER_HOUR = 10;

interface StopFixtureOptions {
  id?: string;
  modes?: Mode[];
  coordinates?: number[];
  departuresPerHour?: number;
  departuresOverrides?: Partial<Record<DayType, Partial<Record<TimeBand, number>>>>;
}

function getDeparturesByBand(departuresPerHour: number) {
  return Object.fromEntries(TIME_BANDS.map((band) => [band, departuresPerHour])) as Record<TimeBand, number>;
}

// A stop with the same departures in every day and band, unless departuresOverrides says otherwise.
export function getStopFixture({
  id = "stop-1",
  modes = ["tram"],
  coordinates = DEFAULT_COORDINATES,
  departuresPerHour = DEFAULT_DEPARTURES_PER_HOUR,
  departuresOverrides = {},
}: StopFixtureOptions = {}): Stop {
  const dph = Object.fromEntries(
    DAY_TYPES.map((day) => [day, { ...getDeparturesByBand(departuresPerHour), ...departuresOverrides[day] }]),
  ) as Stop["properties"]["dph"];

  return {
    type: "Feature",
    geometry: { type: "Point", coordinates },
    properties: { id, name: id, modes, dph },
  };
}
