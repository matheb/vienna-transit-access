// MapLibre paint properties can't read CSS variables, so map colours mirror palette.css here. Keep both in sync.
export const MAP_COLORS = {
  coverage: "#2563eb", // --palette-blue-600
  stop: "#1e3a8a", // --palette-blue-900
  stopStroke: "#fff", // --palette-neutral-0
} as const;
