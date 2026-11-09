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

## React & TypeScript
- Do not define functions inside `useEffect`. Keep the effect to one call to a helper outside the component that returns its cleanup: `useEffect(() => startStopsLoad(setAllStops, setLoadStatus), [])`.
- Async work started from an effect must ignore results that arrive after cleanup (unmount, React Strict Mode).
- Fixed sets of app-state values are TypeScript enums, used through their members (`StopsLoadStatus.ready`), not bare strings. Data-contract values from `stops.geojson` keep their `as const` arrays and union types (`DAY_TYPES`, `DayType`).
- Use `??` for a null/undefined fallback. Use a ternary when the condition is a boolean, because `??` would never fall through.

## Styles & colours
- Primitive colours are defined once in `src/styles/palette.css` (`--palette-*`). Semantic tokens in `globals.css` (`--primary`, `--border`, …) reference the palette; components use the semantic tokens or Tailwind classes, never raw colour values.
- MapLibre cannot read CSS variables: map colours come from `src/styles/mapColors.ts`, which mirrors `palette.css` (keep the two in sync).
