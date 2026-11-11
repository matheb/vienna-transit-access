# Roadmap

## Professionalism checklist

### Tracking
Usage analytics and error tracking, privacy-friendly; tool choice decided after deployment.
- Status: not started
- Why: without it we cannot see whether people use the app or whether it breaks for them.
- First step: after deployment, compare privacy-friendly analytics and error-tracking options (cookie-free, EU hosting, free tier: to verify).

### End-to-end testing
Playwright as a third CI job with read-only permissions, testing the built app via `npm run start`.
- Status: not started
- Why: unit and component tests mock the map and data, so only an end-to-end test proves the real page loads and responds.
- First step: write one Playwright test that loads the page, waits for the results card and changes a slider; check the package in the registry before installing.

### Accessibility
Keyboard use, labels, contrast, and axe checks inside the Playwright tests.
- Status: not started
- Why: the controls and results must work for keyboard and screen-reader users and stay readable.
- First step: add an axe scan to the first Playwright test and fix what it reports; then go through the controls by keyboard only.

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
