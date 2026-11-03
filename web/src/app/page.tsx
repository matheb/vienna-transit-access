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
  const [all, setAll] = useState<Stop[]>([]);
  const [p, setP] = useState<FilterParams>({ day: "weekday", band: "am", minDeparturesPerHour: 4, radiusMeters: 400, modes: ["tram", "metro", "rail", "bus"] });

  useEffect(() => {
    fetchStops().then(setAll);
  }, []);

  const stops = useMemo(() => filterStops(all, p), [all, p]);
  const cov = useMemo(() => getCoverage(stops, p.radiusMeters), [stops, p.radiusMeters]);
  const set = <K extends keyof FilterParams>(k: K, v: FilterParams[K]) => setP((s) => ({ ...s, [k]: v }));

  return (
    <main className="flex h-screen flex-col md:flex-row">
      <aside className="w-full space-y-4 overflow-y-auto p-4 md:w-96">
        <h1 className="text-xl font-semibold">Vienna transit accessibility</h1>
        <Card>
          <CardHeader><CardTitle>Parameters</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <ToggleGroup value={[p.day]} onValueChange={(v) => v[0] && set("day", v[0] as DayType)}>
              {["weekday", "saturday", "sunday"].map((d) => <ToggleGroupItem key={d} value={d}>{d}</ToggleGroupItem>)}
            </ToggleGroup>
            <ToggleGroup value={[p.band]} onValueChange={(v) => v[0] && set("band", v[0] as TimeBand)}>
              {["am", "midday", "pm", "evening"].map((b) => <ToggleGroupItem key={b} value={b}>{b}</ToggleGroupItem>)}
            </ToggleGroup>
            <ToggleGroup multiple value={p.modes} onValueChange={(v) => set("modes", v as Mode[])}>
              {["tram", "metro", "rail", "bus"].map((m) => <ToggleGroupItem key={m} value={m}>{m}</ToggleGroupItem>)}
            </ToggleGroup>
            <label className="block text-sm">Min. departures/hour: {p.minDeparturesPerHour}
              <Slider min={0} max={20} step={1} value={[p.minDeparturesPerHour]} onValueChange={(v) => set("minDeparturesPerHour", typeof v === "number" ? v : v[0])} />
            </label>
            <label className="block text-sm">Walking radius: {p.radiusMeters} m
              <Slider min={100} max={800} step={50} value={[p.radiusMeters]} onValueChange={(v) => set("radiusMeters", typeof v === "number" ? v : v[0])} />
            </label>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-sm">
            <p><b>{stops.length}</b> of {all.length} stops qualify</p>
            <p>Covered area: <b>{cov.areaKm2.toFixed(1)} km²</b> ({(cov.viennaShare * 100).toFixed(0)}% of Vienna, approx.)</p>
          </CardContent>
        </Card>
      </aside>
      <section className="h-[60vh] flex-1 md:h-auto">
        <TransitMap stops={{ type: "FeatureCollection", features: stops }} area={cov.polygon} />
      </section>
    </main>
  );
}
