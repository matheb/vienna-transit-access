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
- All user-facing text lives in the dictionaries `src/i18n/<locale>.ts` (see Internationalization below).
- Pure geo logic lives in `src/lib/geo/` and is unit-tested; UI lives in `src/components/`.
- Constants such as fonts and class strings go outside components, so component files stay small (fonts in `src/app/fonts.ts`, other constants in `src/constants/<area>.ts`, e.g. `src/constants/home.ts`).
- Types that other files can reuse go outside components, next to the module that owns the concept (`StopsLoadStatus` in `stopsService.ts`). Reuse an existing type before adding a new type or constant for the same values.
- Extract repeated Tailwind class strings or JSX blocks into small components in `src/components/`.

## Messages (`src/i18n/en.ts` defines the keys; every other dictionary has the same)
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

## Internationalization
- One dictionary per page language: `src/i18n/<locale>.ts`. `en.ts` is `as const` and defines the shape; every other
  dictionary is typed with `satisfies Messages`, so a missing or misspelled key fails typecheck.
- `src/i18n/messages.test.ts` checks every dictionary against `en.ts`: the same keys, no empty texts, the same placeholders.
- Components read text through `useMessages()` and format numbers with `getFormattedNumber()` and the page's Intl
  locale from `useIntlLocale()`. Lint enforces this in `src/app/` and `src/components/`: no hard-coded text, no
  `toFixed`, and no imports of `@/i18n/en` or `@/i18n/de` in components and pages.
- A language is registered in three places only: `LOCALES` and `LOCALE_NAMES` in `src/i18n/locales.ts`, and
  `MESSAGES_BY_LOCALE` (read through `getLocaleMessages()`) in `src/i18n/messages.ts`. Routes, prerendering and the
  hreflang alternates are built from `LOCALES`.
- The server HTML must not contain the dictionary: the layout passes only the locale string to
  `LocaleMessagesProvider`, which looks up the dictionary in the browser bundle.
- Language names in the switch (`LOCALE_NAMES`) are each written in their own language and are not translated.

### Adding a language
1. `src/i18n/<locale>.ts`, typed with `satisfies Messages`.
2. Add the locale to `LOCALES` and its own name to `LOCALE_NAMES` (`src/i18n/locales.ts`).
3. Add it to `MESSAGES_BY_LOCALE` with its Intl locale (`src/i18n/messages.ts`; German uses `de-AT`).
4. In `e2e/constants.ts`: add it to `PAGE_LANGUAGES` and `LOCALE_PATHS`, and add its `TEXT` entry.
5. Run `npm test` (dictionary check), the four checks, and `npm run test:e2e`; the `layoutFit.spec.ts` guards show
   whether the longer texts fit.

The e2e texts assume exactly one other language (`otherLanguageLinkName`), so a third language also means reworking
the language-switch tests.

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
- Structure (keep it lean):
  - `e2e/constants.ts`: expected user-visible texts per page language (`TEXT.en`, `TEXT.de`), name patterns as literals, URL patterns, timeouts.
  - `e2e/stubs.ts`: request stubs (`stubCartoRequests`, `holdStopsRequest`).
  - `e2e/fixtures.ts`: exports `test` and `expect`. Its automatic fixture stubs CARTO, prints console errors and fails the test on any uncaught page error.
  - `e2e/<page>Page.ts` (e.g. `homePage.ts`): small functions returning locators, by role and accessible label. Locators that depend on the page language take its texts.
  - The specs.
- Specs import `test` and `expect` only from `./fixtures`, never from `@playwright/test`.
- Assertions stay in the specs; page files only return locators.
- No imports from `src/`: expected texts are literals per language in `TEXT` in `e2e/constants.ts`, never taken from the dictionaries, so a changed label fails the test.
- No page-object classes or class hierarchy yet; plain functions until a second page needs more.
- CARTO is always stubbed (empty style, `application/json`, `access-control-allow-origin: *`), so tests never depend on CARTO. Assert on our own data and controls, never on map pixels.
- Same query rules as above: role and accessible label, no snapshots, no CSS selectors. No fixed sleeps: use web-first `expect` assertions, and hold a request with `holdStopsRequest` to test a loading state.
- The one agreed CSS-selector exception: the hreflang `<link>` elements in `<head>` (`routes.spec.ts`), which have no role.
- Page console errors are printed to the run output without failing the test; uncaught page errors fail it.
- Accessibility: `accessibility.spec.ts` runs axe with the tags in `AXE_WCAG_TAGS` (WCAG 2.0/2.1 A and AA) on the fully loaded page and fails on any violation. Never disable rules or exclude elements to make it pass; an exclusion needs explicit agreement and a comment that says what and why.
- Check that a new e2e assertion fails when the behaviour it covers is broken (for example, change a label temporarily), then revert.

## Dependencies
- New and upgraded packages get exact versions: `--save-exact`, or an exact `overrides` entry in `package.json` for a transitive package. No `^` or `~` in what we add.
- Before installing, check the version and its publish date with `npm view <package> "time[<version>]"`. The version must be at least 7 days old.
- Install with `--ignore-scripts` and `--before=<date>`, with the date set 7 days back, so nothing newer than the cooling period can be resolved.
- Review the lockfile diff: only the expected packages may change.
- Then run lint, typecheck, test, build and test:e2e.
- Treat `npm audit` findings by triage: advisory, dependency path, whether it ships to the browser or runs under `next start`, and the fix version. Record the decision in `docs/ROADMAP.md`. Never run `npm audit fix` or `npm audit fix --force`.
