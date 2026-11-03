"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { setWorkerUrl } from "maplibre-gl";
import Map, { Layer, Source } from "react-map-gl/maplibre";
import { MAP_COLORS } from "@/styles/mapColors";

// Worker is copied to public/ by scripts/copy-maplibre-worker.mjs; set before any map is created.
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

// Carto basemap: free, requires attribution (rendered by MapLibre automatically).
const BASEMAP_STYLE_URL = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const INITIAL_VIEW_STATE = { longitude: 16.373, latitude: 48.208, zoom: 11 }; // Vienna centre
const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
const COVERAGE_FILL_OPACITY = 0.2;
const COVERAGE_LINE_WIDTH = 1;
const STOP_CIRCLE_RADIUS = 3;
const STOP_CIRCLE_STROKE_WIDTH = 1;

interface TransitMapProps {
  stops: FeatureCollection;
  area: Feature<Polygon | MultiPolygon> | null;
}

export default function TransitMap({ stops, area }: TransitMapProps) {
  return (
    <Map initialViewState={INITIAL_VIEW_STATE} mapStyle={BASEMAP_STYLE_URL} style={MAP_CONTAINER_STYLE}>
      {area && (
        <Source id="coverage" type="geojson" data={area}>
          <Layer id="coverage-fill" type="fill" paint={{ "fill-color": MAP_COLORS.coverage, "fill-opacity": COVERAGE_FILL_OPACITY }} />
          <Layer id="coverage-line" type="line" paint={{ "line-color": MAP_COLORS.coverage, "line-width": COVERAGE_LINE_WIDTH }} />
        </Source>
      )}
      <Source id="stops" type="geojson" data={stops}>
        <Layer
          id="stops-circle"
          type="circle"
          paint={{
            "circle-radius": STOP_CIRCLE_RADIUS,
            "circle-color": MAP_COLORS.stop,
            "circle-stroke-width": STOP_CIRCLE_STROKE_WIDTH,
            "circle-stroke-color": MAP_COLORS.stopStroke,
          }}
        />
      </Source>
    </Map>
  );
}
