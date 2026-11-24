# Roadmap

Status: 🟢 done · 🟡 started or partly done · 🔴 not started

## Professionalism checklist

### Tracking
Usage analytics and error tracking, privacy-friendly; tool choice decided after deployment.
- Status: 🔴 not started
- Why: without it we cannot see whether people use the app or whether it breaks for them.
- First step: after deployment, compare privacy-friendly analytics and error-tracking options (cookie-free, EU hosting, free tier: to verify).

### End-to-end testing
Playwright as a third CI job with read-only permissions, testing the built app via `npm run start`.
- Status: 🟢 done. `web/e2e/home.spec.ts` (smoke test), `web/e2e/accessibility.spec.ts` (keyboard and axe), `web/e2e/serverHtml.spec.ts` (raw server HTML without JavaScript) and `web/e2e/mobile.spec.ts` (phone layout at 390x844) run in Chromium against the production build, locally with `npm run test:e2e` and in the CI job `e2e`.
- Why: unit and component tests mock the map and data, so only an end-to-end test proves the real page loads and responds.
- Next step: add an HTML report upload in CI only if failures are hard to read from the log.

### Accessibility
Keyboard use, labels, contrast, and axe checks inside the Playwright tests.
- Status: 🟡 automated checks done in `web/e2e/accessibility.spec.ts` (CI job `e2e`): axe finds no WCAG 2.0/2.1 level A or AA violations; Tab order through the toggle groups, both sliders and the data link; arrow keys, Home and End inside each toggle group; Space and Enter on toggles; arrow keys on both sliders; toggle-group names; slider names without the value, and the radius spoken with its unit; every focus indicator at least 3:1 in the light and the dark theme (measured 4.74:1 light, 6.94:1 and 7.66:1 dark). This is not a claim of full WCAG conformance.
- Why: the controls and results must work for keyboard and screen-reader users and stay readable.
- Next step (manual checks): a screen-reader pass; focus order including the map controls; contrast of the map attribution box in the dark theme (its background is always light); a text alternative for the map canvas (the map region is labelled "Map of qualifying stops and covered area"; the canvas inside it has none yet).

### Internationalization
Messages are already organised by component in `web/src/i18n/en.ts`; German is the first translation; library choice open.
- Status: 🔴 not started
- Why: the audience is in Vienna, and the split texts (TODO(i18n)) are waiting for ICU messages.
- First step: compare localization libraries for the Next.js App Router (next-intl and others: to verify), then translate `en.ts` into German.

## Analysis improvements

### 1. Real Vienna boundary instead of the bounding rectangle
Filter stops by point-in-polygon in the pipeline, clip the coverage to the boundary, and use the true city area for the share.
- Status: 🔴 not started
- Why: the rectangle includes neighbouring towns, which skews stop counts, coverage and the share.
- First step: find the city boundary in the City of Vienna open data (dataset name and licence: to verify) and add a pipeline test for point-in-polygon filtering.

### 2. Residents who can reach transit
Show the share and number of residents within walking distance of service with at least N departures per hour, using a population grid or district data summed over covered grid cells. Depends on (1).
- Status: 🔴 not started
- Why: people served matters more than area covered, because much of Vienna's area is forest, water or parks.
- First step: find a population grid or district population dataset (data source and licence: to verify) and check its resolution against the 25 m coverage grid.

### 3. Walking time over the street network
Add street-network catchments with a walking-minutes selector next to the existing walking-radius (distance) slider, which stays. Catchments are precomputed offline in the pipeline for a few minute presets from OpenStreetMap (ODbL attribution needed).
- Status: 🔴 not started
- Why: straight-line circles overstate access across rivers, rail lines and blocks without through paths.
- First step (interim): offer walking minutes converted to a radius with a stated walking speed, labelled approximate, alongside the distance slider. Then choose a routing library for the pipeline; new dependencies need registry checks first (candidates: to verify).

## Fixes and maintenance

### Hidden placeholder numbers in the server HTML
The results card is rendered on the server with placeholder values, hidden with `visibility: hidden` so the card keeps its height until the stops load (`LAYOUT_RESERVING_COVERAGE` in `web/src/constants/home.ts`).
- Status: 🟢 done. The server HTML now has no result numbers; `web/e2e/serverHtml.spec.ts` checks the raw HTML without JavaScript, and layout guards (desktop and 390x844) check that nothing below the results card moves when the stops load. The results card shows three short lines (stops, covered area, share of Vienna) and is 116px in every state; a layout guard also runs with the fallback font, so the height does not depend on the font.
- Why: the live page's raw HTML shows "0 of 0 stops qualify" and "Covered area: 100.0 km² (25% of Vienna, approx.)", so crawlers and link previews see these numbers as if they were results.
- First step: keep the reserved height but render no result numbers in the server HTML, and add a test that the server HTML contains none.

### Announce result changes to screen readers
The results card changes when a control changes, but nothing announces it.
- Status: 🔴 not started
- Why: screen-reader users cannot tell that the numbers changed.
- First step: try a polite aria-live region around the summary and check that it does not announce on every slider step (debounce), with a unit test and a manual screen-reader pass.

### Map fallback when WebGL is unavailable
MapLibre needs WebGL; without it the map cannot render.
- Status: 🔴 not started
- Why: on devices or browsers without WebGL the page should still explain what is missing, and the controls and results should keep working.
- First step: check what the page does today with WebGL disabled (to verify), then show a short message in place of the map.

### Disable transport modes without stops
The "rail" mode comes from GTFS route type 2 or 1xx; the current `stops.geojson` has no rail stops (and no "other"; counted 2026-11-21).
- Status: 🟢 done. Modes with no stops in the loaded data are disabled, not pressed, skipped by the arrow keys, Home and End, and explained by a visible hint ("No stops in the timetable data: rail"). The available modes come from the data, so rail would enable itself if the feed had rail stops. The hint line is always reserved, and the layout guards check that nothing below the controls moves when the stops load. `web/e2e/accessibility.spec.ts` reads the modes from the same data file, so it follows the data too.
- Why: a toggle that never changes the result is confusing.

### npm audit findings
`npm install` reported 10 moderate vulnerabilities on 2026-11-19 (during the Next.js 16.4.5 upgrade). All 10 come from one advisory, minimatch GHSA-g3hv-75wg-m249 (denial of service, fixed in minimatch 11.0.1; it needs an attacker-controlled glob pattern). Nothing affected ships to the browser or runs under `next start`.
- Status: 🟡 triaged 2026-11-21; chain A fixed 2026-11-24; chain B accepted (4 findings left)
- Why: we need to know whether any affected package ships to the browser or only runs in development.
- Chain A (6 findings: lint tooling via `eslint-config-next`, `typescript-eslint` 8.72.1): fixed on 2026-11-24 with the override `"typescript-eslint": "8.73.0"` in `web/package.json`, installed with `--ignore-scripts --before=2026-11-17`. The lockfile moved `typescript-eslint` and the ten `@typescript-eslint/*` packages to 8.73.0, minimatch under `typescript-estree` to 11.0.9, and, nested there too, brace-expansion to 5.0.13 and semver to 7.8.6. Lint, typecheck, test, build and test:e2e pass. minimatch 11 brings in a new package, `@isaacs/nonrecursive-glob-match` 1.1.0: same maintainer as minimatch, the source in its tarball matches the GitHub `v1.1.0` tag, no dependencies or install hooks, but no repository field in its package.json and no provenance attestation.
- Chain B (4 findings: shadcn CLI → `ts-morph` → `minimatch`): accepted; no fix inside shadcn 4.x. Do not run `npm audit fix` (it suggests the downgrade `shadcn@1.0.0`). Recheck when shadcn uses `ts-morph` 28 or newer.
- Next step: recheck chain B when shadcn uses `ts-morph` 28 or newer.

### Next.js 16.4.6 patch bump
16.4.5 contains the November 2026 security fixes; 16.4.6 (published 2026-11-09) is a later patch that the security post does not mention.
- Status: 🔴 not started (optional)
- Why: stay on the current patch release without mixing it into feature work.
- First step: the same steps as for 16.4.5: exact-version install with `--ignore-scripts` and `--before`, review the 12 lockfile entries, then lint, typecheck, test, build and test:e2e.

### Pinned results strip on phones (optional)
On a phone the results sit below the controls, so seeing them after a change needs scrolling in the panel.
- Status: 🔴 drafted, not adopted. A `sticky bottom-0` strip with `scroll-pb-32` on the panel and a focus-not-obscured e2e test was drafted, but the strip takes about 30% of the panel.
- Why: the map already shows the effect of a change; the numbers are only worth pinning if people miss them.
- First step: try it only if people miss the results; start from the drafted approach (sticky strip, scroll padding, a test that no focused control is covered).

### Manual phone checks
The phone layout is checked automatically at 390x844 in `web/e2e/mobile.spec.ts`; one real phone has been checked by hand.
- Status: 🟡 in progress (one real phone checked)
- Why: the e2e test uses Chromium at one fixed size, without real browser bars, touch scrolling or the user's text size.
- Next step: small phones in landscape (under 768 px wide the phone layout applies, so the map is about 200 px tall); iOS Safari and Android Chrome with the browser bars shown and hidden; text zoom.
