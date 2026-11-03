import { contours } from "d3-contour";
import type { Feature, MultiPolygon, Position } from "geojson";
import type { CoverageGrid } from "./coverageGrid";

// Cells store radius minus distance to the nearest stop, so the coverage edge is where the value crosses 0.
const COVERAGE_EDGE_THRESHOLD = 0;

/**
 * Traces the covered area of a grid as one MultiPolygon in lon/lat (marching squares, d3-contour).
 * Linear interpolation between cell values puts the edge close to the true circle edges,
 * so the outline is smooth rather than stair-stepped.
 */
export function getCoveragePolygon(grid: CoverageGrid | null): Feature<MultiPolygon> | null {
  if (!grid) return null;
  const [contour] = contours().size([grid.columns, grid.rows]).thresholds([COVERAGE_EDGE_THRESHOLD])(Array.from(grid.values));
  if (!contour || contour.coordinates.length === 0) return null;
  // d3-contour places the value of cell i at coordinate i + 0.5, which is the cell centre in our layout.
  const toLonLat = ([column, row]: Position): Position =>
    grid.projection.toLonLat([grid.originXMeters + column * grid.cellSizeMeters, grid.originYMeters + row * grid.cellSizeMeters]);
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "MultiPolygon",
      coordinates: contour.coordinates.map((polygon) => polygon.map((ring) => ring.map(toLonLat))),
    },
  };
}
