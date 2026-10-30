"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { setWorkerUrl } from "maplibre-gl";
import Map, { Layer, Source } from "react-map-gl/maplibre";

// Worker is copied to public/ by scripts/copy-maplibre-worker.mjs; set before any map is created.
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

// Carto basemap: free, requires attribution (rendered by MapLibre automatically).
const STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

interface Props {
  stops: FeatureCollection;
  area: Feature<Polygon | MultiPolygon> | null;
}

export default function TransitMap({ stops, area }: Props) {
  return (
    <Map initialViewState={{ longitude: 16.373, latitude: 48.208, zoom: 11 }} mapStyle={STYLE} style={{ width: "100%", height: "100%" }}>
      {area && (
        <Source id="coverage" type="geojson" data={area}>
          <Layer id="coverage-fill" type="fill" paint={{ "fill-color": "#2563eb", "fill-opacity": 0.2 }} />
          <Layer id="coverage-line" type="line" paint={{ "line-color": "#2563eb", "line-width": 1 }} />
        </Source>
      )}
      <Source id="stops" type="geojson" data={stops}>
        <Layer id="stops-circle" type="circle" paint={{ "circle-radius": 3, "circle-color": "#1e3a8a", "circle-stroke-width": 1, "circle-stroke-color": "#fff" }} />
      </Source>
    </Map>
  );
}
