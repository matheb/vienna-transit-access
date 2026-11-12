# Coding & refactoring conventions (web/)

Rules for agents and humans changing code in `web/`. Some target locations (e.g. `src/i18n/`, `src/services/`, `src/styles/`) are introduced by the ongoing naming/styles refactor; follow them for all new code.

## Refactoring rules
- No behaviour changes in a refactor: the app must look and work the same unless a visible change is explicitly agreed, and then it goes in its own commit.
- Before and after every step: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` must pass.
- Small, reviewable steps; keep naming changes and style changes in separate commits.
- Do not rename data-contract fields (`stops.geojson` properties such as `dph`, `am`, `midday`, `pm`, `evening`, `weekday`/`saturday`/`sunday`). List them as a follow-up, because the pipeline and the regenerated data must change too.
- Do not edit generated shadcn files in `src/components/ui/` or build output. Wrap them in our own components in `src/components/` instead.
- Ask before installing packages. No git commit/push (the user commits via TortoiseGit). Don't run `npm run dev`; the user checks visuals.

## Naming
- Descriptive camelCase names; no 1–2 letter names (except a loop index `i`), including callback params (`stop`, `value`, `previous`, not `s`, `v`, `p`).
- A function whose purpose is to return a value in a new or derived form starts with `get` (`getCoverage`, `getSliderValue`).
- Event handlers are separate functions named `handleXChange`; no logic inline in JSX `onChange`/`onValueChange`.
- Constants are UPPER_SNAKE_CASE at module level; no magic numbers or inline option lists (`DEFAULT_FILTER_PARAMS`, `RADIUS_SLIDER`, `DAY_TYPES`).
- Put the unit in the name where relevant (`radiusMeters`, `areaKm2`).
- Name types specifically (`TransitMapProps`, not `Props`; `FilterParams`, not `Params`).

## Structure
- Data fetching lives in `src/services/` (e.g. `stopsService.ts`), not in components.
- All user-facing text lives in `src/i18n/en.ts` as a next-intl-shaped `messages` object (we plan to add a localization package).
- Pure geo logic lives in `src/lib/geo/` and is unit-tested; UI lives in `src/components/`.
- Constants such as fonts and class strings go outside components, so component files stay small (fonts in `src/app/fonts.ts`, other constants in `src/constants/<area>.ts`, e.g. `src/constants/home.ts`).
- Types that other files can reuse go outside components, next to the module that owns the concept (`StopsLoadStatus` in `stopsService.ts`). Reuse an existing type before adding a new type or constant for the same values.
- Extract repeated Tailwind class strings or JSX blocks into small components in `src/components/`.

## Messages (`src/i18n/en.ts`)
- The top-level key is the component or feature that uses the text, in PascalCase and spelled exactly like the component. This is the one exception to camelCase naming.
- A text belongs to the component that reads it from `messages`. Generic components that receive text as props (`LabeledSlider`, `OptionToggleGroup`) have no namespace of their own.
- The second level names the role of the text: `title`, `label`, `description`, `unit`, `loading`, `error`, ... If a component has several texts of the same role, group them by element first.
- A single text uses a singular role such as `label`. A map from option value to text uses `options`.
- Text deliberately shared by several components goes in `Common`. Two texts that merely have the same words keep separate keys.
- Dynamic texts (counts, areas) stay split around their values until a localization package adds ICU messages.
- Keep `messages` as `as const` so a wrong key fails typecheck. Keys that mirror data-contract values (`weekday`, `am`, `tram`) must not be renamed.
- `npm run lint` rejects hard-coded text in `src/app/` and `src/components/`.

Examples:
- One text of a role: `ResultsCard.loading` -> "Loading stops…"
- Grouped by element: `ControlsPanel.radiusSlider.label` -> "Walking radius:" and `ControlsPanel.dayToggle.options.weekday` -> "weekday"

## React & TypeScript
- Do not define functions inside `useEffect`. Keep the effect to one call to a helper outside the component that returns its cleanup: `useEffect(() => startStopsLoad(setAllStops, setLoadStatus), [])`.
- Async work started from an effect must ignore results that arrive after cleanup (unmount, React Strict Mode).
- Fixed sets of app-state values are TypeScript enums, used through their members (`StopsLoadStatus.ready`), not bare strings. Data-contract values from `stops.geojson` keep their `as const` arrays and union types (`DAY_TYPES`, `DayType`).
- Use `??` for a null/undefined fallback. Use a ternary when the condition is a boolean, because `??` would never fall through.

## Styles & colours
- Primitive colours are defined once in `src/styles/palette.css` (`--palette-*`). Semantic tokens in `globals.css` (`--primary`, `--border`, …) reference the palette; components use the semantic tokens or Tailwind classes, never raw colour values.
- MapLibre cannot read CSS variables: map colours come from `src/styles/mapColors.ts`, which mirrors `palette.css` (keep the two in sync).

## Testing
- Vitest + React Testing Library. Tests sit next to the code as `name.test.ts` (logic, node environment) or `Name.test.tsx` (components). Shared helpers live in `src/test/`.
- Component tests start with `// @vitest-environment jsdom` and import `@/test/setupDom`; node tests load no DOM code.
- Mock `TransitMap` (no WebGL) and `fetchStops` (no network), and assert on the props the map mock received. When mocking `stopsService`, keep its real exports with `importOriginal`, because `StopsLoadStatus` is a runtime enum. Keep pure logic in `src/lib/geo/` real.
- Query by role and accessible label; use `getByText` only for plain text with no role. Never query by CSS class; no snapshot tests.
- Find sliders with `getByLabelText`: Base UI keeps the thumb `visibility: hidden` in jsdom (no layout), which hides it from `getByRole`.
- Check that a test for a guard or edge case fails when that code is removed. A successful `setState` after unmount is invisible at page level, so test it on the helper directly.
- Do not test generated files in `src/components/ui/`.

### End-to-end tests (Playwright)
- E2E tests live in `e2e/` as `name.spec.ts`, outside `src/`, so `npm test` (Vitest) does not pick them up. Config: `playwright.config.ts`. Chromium only.
- Run them with `npm run test:e2e`. It builds the app and starts it with `next start` on port 3100 (never the dev server). It is separate from the four checks.
- One-time setup per machine: `npx --no playwright install --only-shell chromium` downloads the headless Chromium shell (about 120 MB) to `%USERPROFILE%\AppData\Local\ms-playwright\`, outside the repo. Re-run it after upgrading `@playwright/test`.
- Stub every CARTO request with `page.route` (empty style, `application/json`, `access-control-allow-origin: *`), so tests never depend on CARTO. Assert on our own data and controls, never on map pixels.
- Same query rules as above: role and accessible label, no snapshots, no CSS selectors. No fixed sleeps: use web-first `expect` assertions, and hold a request with `page.route` to test a loading state.
- Expected texts are literals in the spec, not imported from `src/i18n/en.ts`, so a changed label fails the test.
- Page console errors are printed to the run output without failing the test; uncaught page errors fail it.
- Check that a new e2e assertion fails when the behaviour it covers is broken (for example, change a label temporarily), then revert.
