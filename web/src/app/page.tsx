"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { filterStops, getCoverage, type DayType, type FilterParams, type Mode, type Stop, type TimeBand } from "@/lib/geo/coverage";
import { fetchStops } from "@/services/stopsService";

const TransitMap = dynamic(() => import("@/components/TransitMap"), { ssr: false });

export default function Home() {
  const [allStops, setAllStops] = useState<Stop[]>([]);
  const [filterParams, setFilterParams] = useState<FilterParams>({ day: "weekday", band: "am", minDeparturesPerHour: 4, radiusMeters: 400, modes: ["tram", "metro", "rail", "bus"] });

  useEffect(() => {
    fetchStops().then(setAllStops);
  }, []);

  const qualifyingStops = useMemo(() => filterStops(allStops, filterParams), [allStops, filterParams]);
  const coverage = useMemo(() => getCoverage(qualifyingStops, filterParams.radiusMeters), [qualifyingStops, filterParams.radiusMeters]);
  const updateFilterParam = <K extends keyof FilterParams>(key: K, value: FilterParams[K]) =>
    setFilterParams((previous) => ({ ...previous, [key]: value }));

  return (
    <main className="flex h-screen flex-col md:flex-row">
      <aside className="w-full space-y-4 overflow-y-auto p-4 md:w-96">
        <h1 className="text-xl font-semibold">Vienna transit accessibility</h1>
        <Card>
          <CardHeader><CardTitle>Parameters</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <ToggleGroup value={[filterParams.day]} onValueChange={(value) => value[0] && updateFilterParam("day", value[0] as DayType)}>
              {["weekday", "saturday", "sunday"].map((day) => <ToggleGroupItem key={day} value={day}>{day}</ToggleGroupItem>)}
            </ToggleGroup>
            <ToggleGroup value={[filterParams.band]} onValueChange={(value) => value[0] && updateFilterParam("band", value[0] as TimeBand)}>
              {["am", "midday", "pm", "evening"].map((band) => <ToggleGroupItem key={band} value={band}>{band}</ToggleGroupItem>)}
            </ToggleGroup>
            <ToggleGroup multiple value={filterParams.modes} onValueChange={(value) => updateFilterParam("modes", value as Mode[])}>
              {["tram", "metro", "rail", "bus"].map((mode) => <ToggleGroupItem key={mode} value={mode}>{mode}</ToggleGroupItem>)}
            </ToggleGroup>
            <label className="block text-sm">Min. departures/hour: {filterParams.minDeparturesPerHour}
              <Slider min={0} max={20} step={1} value={[filterParams.minDeparturesPerHour]} onValueChange={(value) => updateFilterParam("minDeparturesPerHour", typeof value === "number" ? value : value[0])} />
            </label>
            <label className="block text-sm">Walking radius: {filterParams.radiusMeters} m
              <Slider min={100} max={800} step={50} value={[filterParams.radiusMeters]} onValueChange={(value) => updateFilterParam("radiusMeters", typeof value === "number" ? value : value[0])} />
            </label>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-sm">
            <p><b>{qualifyingStops.length}</b> of {allStops.length} stops qualify</p>
            <p>Covered area: <b>{coverage.areaKm2.toFixed(1)} km²</b> ({(coverage.viennaShare * 100).toFixed(0)}% of Vienna, approx.)</p>
          </CardContent>
        </Card>
      </aside>
      <section className="h-[60vh] flex-1 md:h-auto">
        <TransitMap stops={{ type: "FeatureCollection", features: qualifyingStops }} area={coverage.polygon} />
      </section>
    </main>
  );
}
