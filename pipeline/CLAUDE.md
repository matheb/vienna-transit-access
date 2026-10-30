Python, pandas. Entry: compute_stops.py <gtfs_dir> <out.geojson> <YYYY-MM-DD>.
Test: `python -m pytest` (run from pipeline/). Add/adjust tests with every logic change.
Semantics: one representative date per day type; deps/hour = deps in band / band length; terminals excluded; grouped by parent_station.
