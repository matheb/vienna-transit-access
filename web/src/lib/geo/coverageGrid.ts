import type { Stop } from "./coverage";
import { getLocalProjection, type LocalProjection } from "./localProjection";

const SQUARE_METERS_PER_KM2 = 1e6;
// Extra cells stamped around each circle so cells just outside it hold their true (negative) value;
// the contour step interpolates between neighbouring cells and needs that to place the edge correctly.
const STAMP_MARGIN_CELLS = 2;

/**
 * Regular grid in local metres. Each cell stores radiusMeters minus the distance from the cell centre
 * to the nearest stop, so a cell is covered when its value is >= 0.
 */
export interface CoverageGrid {
  projection: LocalProjection;
  originXMeters: number; // west edge of column 0
  originYMeters: number; // south edge of row 0
  cellSizeMeters: number;
  columns: number;
  rows: number;
  values: Float32Array; // row-major, index = row * columns + column
}

export function getCoverageGrid(stops: Stop[], radiusMeters: number, cellSizeMeters: number): CoverageGrid | null {
  if (stops.length === 0) return null;
  const longitudes = stops.map((stop) => stop.geometry.coordinates[0]);
  const latitudes = stops.map((stop) => stop.geometry.coordinates[1]);
  const projection = getLocalProjection(
    (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
  );
  const stopPositionsMeters = stops.map((stop) => projection.toMeters(stop.geometry.coordinates));
  const stampReachMeters = radiusMeters + STAMP_MARGIN_CELLS * cellSizeMeters;
  const originXMeters = Math.min(...stopPositionsMeters.map(([xMeters]) => xMeters)) - stampReachMeters;
  const originYMeters = Math.min(...stopPositionsMeters.map(([, yMeters]) => yMeters)) - stampReachMeters;
  const columns = Math.ceil((Math.max(...stopPositionsMeters.map(([xMeters]) => xMeters)) + stampReachMeters - originXMeters) / cellSizeMeters);
  const rows = Math.ceil((Math.max(...stopPositionsMeters.map(([, yMeters]) => yMeters)) + stampReachMeters - originYMeters) / cellSizeMeters);
  // Cells no stop reaches stay at -stampReachMeters: clearly outside, and finite for interpolation.
  const values = new Float32Array(columns * rows).fill(-stampReachMeters);
  const stampReachSquared = stampReachMeters * stampReachMeters;

  // Each stop fills only the cells inside its own bounding square, so the grid itself is the spatial index.
  for (const [stopXMeters, stopYMeters] of stopPositionsMeters) {
    const firstColumn = Math.max(0, Math.floor((stopXMeters - stampReachMeters - originXMeters) / cellSizeMeters));
    const lastColumn = Math.min(columns - 1, Math.floor((stopXMeters + stampReachMeters - originXMeters) / cellSizeMeters));
    const firstRow = Math.max(0, Math.floor((stopYMeters - stampReachMeters - originYMeters) / cellSizeMeters));
    const lastRow = Math.min(rows - 1, Math.floor((stopYMeters + stampReachMeters - originYMeters) / cellSizeMeters));
    for (let row = firstRow; row <= lastRow; row++) {
      const offsetYMeters = originYMeters + (row + 0.5) * cellSizeMeters - stopYMeters;
      for (let column = firstColumn; column <= lastColumn; column++) {
        const offsetXMeters = originXMeters + (column + 0.5) * cellSizeMeters - stopXMeters;
        const distanceSquared = offsetXMeters * offsetXMeters + offsetYMeters * offsetYMeters;
        if (distanceSquared >= stampReachSquared) continue;
        const value = radiusMeters - Math.sqrt(distanceSquared);
        const index = row * columns + column;
        if (value > values[index]) values[index] = value;
      }
    }
  }
  return { projection, originXMeters, originYMeters, cellSizeMeters, columns, rows, values };
}

/** Covered area approximated by counting covered cells (cell centre within the radius of a stop). */
export function getCoveredAreaKm2(grid: CoverageGrid | null): number {
  if (!grid) return 0;
  let coveredCells = 0;
  for (const value of grid.values) if (value >= 0) coveredCells++;
  return (coveredCells * grid.cellSizeMeters * grid.cellSizeMeters) / SQUARE_METERS_PER_KM2;
}
