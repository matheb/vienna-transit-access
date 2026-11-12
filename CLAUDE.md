# vienna-transit-access
Vienna areas within walking distance of frequent transit. GTFS → pipeline/ (Python) → web/public/data/stops.geojson → web/ (Next.js+MapLibre+Turf).

Rules
- Never run git commit/push; user commits via TortoiseGit.
- Low tokens: read only files needed; no repo-wide scans; small diffs.
- Don't read/commit GTFS raw data or node_modules; don't open stops.geojson (large).
- Windows; shell is PowerShell.

Commands (the user is a beginner; keep every command easy to read)
- One simple command per step: no pipes (|), no chaining (; && ||), no inline scripts (powershell -Command, python -c, node -e).
- Anything longer goes into a small script file under scripts/; show it in full and let the user read it before running it.
- Before each command, say in one sentence what it does and what it can change.
- Ask before anything that installs, deletes, or changes the system outside the files being edited.
See pipeline/CLAUDE.md and web/CLAUDE.md.
Planned work and priorities: docs/ROADMAP.md
