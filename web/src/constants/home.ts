// While stops are not ready the summary stays mounted but hidden, so the card keeps its height.
// These values give it the same length, and so the same line wrapping, as a typical first result.
export const LAYOUT_RESERVING_COVERAGE = { areaKm2: 100, viennaShare: 0.25 };
export const HIDDEN_KEEPING_LAYOUT_STYLE = { visibility: "hidden" } as const;
export const RESULTS_GRID_CELL_CLASS = "col-start-1 row-start-1";
