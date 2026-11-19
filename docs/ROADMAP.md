# Roadmap

## Professionalism checklist

### Tracking
Usage analytics and error tracking, privacy-friendly; tool choice decided after deployment.
- Status: not started
- Why: without it we cannot see whether people use the app or whether it breaks for them.
- First step: after deployment, compare privacy-friendly analytics and error-tracking options (cookie-free, EU hosting, free tier: to verify).

### End-to-end testing
Playwright as a third CI job with read-only permissions, testing the built app via `npm run start`.
- Status: done. `web/e2e/home.spec.ts` (smoke test) and `web/e2e/accessibility.spec.ts` run in Chromium against the production build, locally with `npm run test:e2e` and in the CI job `e2e`.
- Why: unit and component tests mock the map and data, so only an end-to-end test proves the real page loads and responds.
- Next step: add an HTML report upload in CI only if failures are hard to read from the log.

### Accessibility
Keyboard use, labels, contrast, and axe checks inside the Playwright tests.
- Status: automated checks done in `web/e2e/accessibility.spec.ts` (CI job `e2e`): axe finds no WCAG 2.0/2.1 level A or AA violations; Tab order through the toggle groups, both sliders and the data link; arrow keys, Home and End inside each toggle group; Space and Enter on toggles; arrow keys on both sliders; toggle-group names; slider names without the value, and the radius spoken with its unit; every focus indicator at least 3:1 in the light and the dark theme (measured 4.74:1 light, 6.94:1 and 7.66:1 dark). This is not a claim of full WCAG conformance.
- Why: the controls and results must work for keyboard and screen-reader users and stay readable.
- Next step (manual checks): a screen-reader pass; focus order including the map controls; contrast of the map attribution box in the dark theme (its background is always light); a text label for the map canvas.

### Internationalization
Messages are already organised by component in `web/src/i18n/en.ts`; German is the first translation; library choice open.
- Status: not started
- Why: the audience is in Vienna, and the split texts (TODO(i18n)) are waiting for ICU messages.
- First step: compare localization libraries for the Next.js App Router (next-intl and others: to verify), then translate `en.ts` into German.

## Analysis improvements

### 1. Real Vienna boundary instead of the bounding rectangle
Filter stops by point-in-polygon in the pipeline, clip the coverage to the boundary, and use the true city area for the share.
- Status: not started
- Why: the rectangle includes neighbouring towns, which skews stop counts, coverage and the share.
- First step: find the city boundary in the City of Vienna open data (dataset name and licence: to verify) and add a pipeline test for point-in-polygon filtering.

### 2. Residents who can reach transit
Show the share and number of residents within walking distance of service with at least N departures per hour, using a population grid or district data summed over covered grid cells. Depends on (1).
- Status: not started
- Why: people served matters more than area covered, because much of Vienna's area is forest, water or parks.
- First step: find a population grid or district population dataset (data source and licence: to verify) and check its resolution against the 25 m coverage grid.

### 3. Walking time over the street network
Add street-network catchments with a walking-minutes selector next to the existing walking-radius (distance) slider, which stays. Catchments are precomputed offline in the pipeline for a few minute presets from OpenStreetMap (ODbL attribution needed).
- Status: not started
- Why: straight-line circles overstate access across rivers, rail lines and blocks without through paths.
- First step (interim): offer walking minutes converted to a radius with a stated walking speed, labelled approximate, alongside the distance slider. Then choose a routing library for the pipeline; new dependencies need registry checks first (candidates: to verify).

## Fixes and maintenance

### Hidden placeholder numbers in the server HTML
The results card is rendered on the server with placeholder values, hidden with `visibility: hidden` so the card keeps its height until the stops load (`LAYOUT_RESERVING_COVERAGE` in `web/src/constants/home.ts`).
- Status: not started
- Priority: high
- Why: the live page's raw HTML shows "0 of 0 stops qualify" and "Covered area: 100.0 km² (25% of Vienna, approx.)", so crawlers and link previews see these numbers as if they were results.
- First step: keep the reserved height but render no result numbers in the server HTML, and add a test that the server HTML contains none.

### Map fallback when WebGL is unavailable
MapLibre needs WebGL; without it the map cannot render.
- Status: not started
- Why: on devices or browsers without WebGL the page should still explain what is missing, and the controls and results should keep working.
- First step: check what the page does today with WebGL disabled (to verify), then show a short message in place of the map.

### Remove the empty rail toggle
The "rail" mode comes from GTFS route type 2 or 1xx; the Wiener Linien feed probably has no such routes (to verify).
- Status: not started
- Why: a toggle that never changes the result is confusing.
- First step: count the stops with mode "rail" in `stops.geojson` with a small script (the file is too large to open); if there are none, remove "rail" from `SELECTABLE_MODES` and the toggle labels, and update the tests.

### npm audit findings
`npm install` reported 10 moderate vulnerabilities on 2026-11-19 (during the Next.js 16.4.5 upgrade); they are not triaged yet.
- Status: not started
- Why: we need to know whether any affected package ships to the browser or only runs in development.
- First step: run `npm audit` (read-only), list each affected package with its dependency path, and decide per package.

### Next.js 16.4.6 patch bump
16.4.5 contains the November 2026 security fixes; 16.4.6 (published 2026-11-09) is a later patch that the security post does not mention.
- Status: not started (optional)
- Why: stay on the current patch release without mixing it into feature work.
- First step: the same steps as for 16.4.5: exact-version install with `--ignore-scripts` and `--before`, review the 12 lockfile entries, then lint, typecheck, test, build and test:e2e.
