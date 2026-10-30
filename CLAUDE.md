# vienna-transit-access
Vienna areas within walking distance of frequent transit. GTFS → pipeline/ (Python) → web/public/data/stops.geojson → web/ (Next.js+MapLibre+Turf).

Rules
- Never run git commit/push; user commits via TortoiseGit.
- Ask before installing packages or running anything that changes the system.
- Low tokens: read only files needed; no repo-wide scans; small diffs.
- Don't read/commit GTFS raw data or node_modules; don't open stops.geojson (large).
- Windows; shell is PowerShell.
See pipeline/CLAUDE.md and web/CLAUDE.md.
