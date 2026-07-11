# TOPOPASS Dev Training Tools

Phase 18.5 adds a dev-only workspace for testing Route Runner and preparing curated learner-driver training routes. Stage 18.7 rebuilds the authoring page around a map-first route creation flow. Stage 18.8 makes that authoring page interactive. Stage 18.15 adds explicit working draft, review candidate, and complete route save modes. Stage 18.16 adds a map/area selector backed by the existing Route Runner map registry. Stage 18.17 moves the authoring map legend into a collapsed map control. Stage 18.18 keeps the authoring map viewport sized to the rendered Real London map instead of stretching under the side panels. Stage 18.19 redesigns the authoring page as a map-first workspace with a top toolbar and bottom drawer instead of a permanent sidebar. Stage 18.20 reduces the authoring map height by about 25% so the drawer is easier to reach at normal browser zoom. Stage 19.1 makes checkpoints ordered required stops for curated authoring when route metadata requires them. Stage 20 adds the first complete beta curated learner route pack under `data/training-routes/complete/`. Stage 20.1 lets the Training Route Author switch between real loadable map fixtures without exposing dev-only tooling to learners. These pages are intentionally not linked from the learner navigation.

## Dev Tools Home

Open `/dev` locally to see the internal tool index.

Available tools:

- `/dev/route-runner` - Dev Route Runner for map QA, route drawing, overlays, route review, and Training Mode testing.
- `/dev/training-route` - Curated Training Route Author for drafting, reviewing, and completing future learner training routes.
- `/dev/beta-feedback` - internal Real London beta feedback review.
- `/dev/beta-attempts` - internal Real London beta attempt review.

## Dev Route Runner

`/dev/route-runner` keeps the existing RouteRunnerClient development surface. It remains useful for inspecting Phase 6 map rendering, road hierarchy, labels, overlays, drawn attempts, route review, and Training Mode behaviour.

The page title is `Dev Route Runner` and it links back to `/dev`. No learner-facing Training Mode logic is duplicated here.

## Curated Training Route Author

`/dev/training-route` prepares Stage 19 curated route data without changing the learner Training Mode route generator.

The authoring page reuses:

- the existing Real London map data
- the learner route validation engine
- Phase 7 exercise difficulty and exercise type models

Author fields include route id, title, practice map / area, difficulty, exercise type, description, objective, skills practised, expected learner mistakes, hint sequence, scoring emphasis, instructor feedback notes, route choice justification, and route lifecycle status.

Stage 18.6 adds a `Route choice justification` field. Use it when the authored route is intentionally longer than the shortest legal route that the project can prove from current map data.

Stage 18.7 keeps `/dev/training-route` focused on route authoring instead of embedding the full Route Runner debug surface. The first working section is the map authoring workspace with toolbar actions for pan, set start, draw route, add checkpoint, set destination, undo, removing checkpoints, clearing route data, resetting view, validation, shortest-route comparison, and export.

Stage 18.8 removes the static placeholder export. `/dev/training-route` now starts empty, renders the Real London road and label data, and updates route state from map interaction. The `Load sample route` button is the only way to seed a fixture route for testing; normal export readiness depends on the route currently authored in the workspace.

Stage 18.9 isolates map gestures from page scrolling. Mouse wheel and trackpad scroll over the authoring map are handled by the map viewport only, touch drawing and panning do not drag the page, and normal page scroll still works outside the map.

Stage 18.10 aligns the authoring map styling with the learner practice map. One-way indicators now use the shared restriction arrow styling and decluttering pipeline, START/DESTINATION/checkpoint markers use the shared practice marker assets and label bubbles, and authored, matched, and shortest-route overlays use the shared route overlay tokens.

Stage 18.11 fixes authoring map input precision. Wheel zoom now keeps the map point under the cursor stable, while middle-click and right-click inside the map are blocked from placing start/destination/checkpoints, drawing routes, or triggering browser autoscroll.

Stage 18.12 adds initial dev-only saving for curated training routes. The authoring page can save JSON locally, download JSON, copy JSON to the clipboard, and recover browser-local autosaves after a reload. The dev save endpoint is disabled in production.

Stage 18.12 map-control follow-up aligns `/dev/training-route` with the beta practice map controls. Wheel zoom stays cursor-centred, middle mouse drag temporarily pans without changing the selected authoring mode, middle/right clicks cannot place markers or draw route points, and page scroll remains isolated while the pointer is inside the map.

Stage 18.13 fixes click-to-map coordinate alignment on `/dev/training-route`. Pointer coordinates are converted through the actual SVG content box before snapping or drawing, so START, DESTINATION, checkpoint, and route points use the same corrected map coordinate after zooming, panning, resizing, or page scrolling. The optional `Show click diagnostics` toggle displays the raw client point, local SVG point, canonical map point, snap target, and snap distance for dev QA.

Stage 18.14 separates validation readiness from export readiness. `Validate route` and `Compare shortest route` stay available so incomplete routes produce useful blocking messages instead of inactive controls. The map uses the author canvas aspect ratio to avoid a large unused empty area below the visible map, and the compact validation result now appears beside the route state summary near the map workspace.

Stage 18.15 splits explicit saves into three targets: `Save working draft`, `Save review candidate`, and `Save complete route`. The export panel shows each target's save mode, JSON status, suggested filename, full save path, learner-facing readiness, and checklist. Browser autosave recovery is labelled separately because it is not a route library save.

Stage 18.16 replaces the free-text area field with a selector populated from the existing Route Runner map registry.

Stage 18.17 keeps the authoring legend collapsed by default. Use the `Map legend` control inside the map viewport to reveal Raw drawing, Matched route, Shortest overlay, One-way arrows, START, DESTINATION, and Checkpoint entries. The legend should not render as a permanent horizontal row below the map.

Stage 18.18 prevents the authoring map card from stretching to match the height of the status panels beside it. The SVG, base map, route overlays, markers, pointer interaction layer, and legend now use the same viewport sizing contract, so the Real London map fills the visible authoring viewport without a large blank area below it.

Stage 18.19 makes `/dev/training-route` map-first. The top toolbar contains the authoring modes and primary route actions. The bottom drawer opens on `Authoring steps` by default and contains `Route state`, `Validation`, `Metadata`, and `Export` tabs. Metadata, validation details, shortest-route comparison, and export JSON are no longer permanent blocks below or beside the map.

Stage 18.20 keeps the map full-width but reduces the authoring viewport height from the previous 760px canvas ratio to a 570px ratio. The SVG, base map, route overlays, marker layer, legend, and interaction layer still share the same viewport dimensions, so the shorter map should not create stretching, marker drift, or blank space below the rendered map.

Stage 19.1 makes checkpoint behaviour explicit. Checkpoints added in `Add checkpoint` mode are numbered required stops when route metadata says the exercise needs checkpoint order. Validation checks the matched route visits them as Start -> Checkpoint 1 -> Checkpoint 2 -> Destination. Missed checkpoints and out-of-order checkpoints become blocking authoring validation issues for complete routes, and exports include checkpoint ids, order, labels, snapped node metadata, related route segment or road ids where available, marker display metadata, and an ordered `checkpointRequirements` block.

Stage 20.1 adds the real map selector. `/dev/training-route` builds `TRAINING_ROUTE_AUTHOR_MAP_REGISTRY` from `ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON`, then exposes only entries that can already load in the authoring workspace. A map is authoring-supported when it has a loaded map definition, committed source fixture, routable exercises, and scoreable route matching. Synthetic practice maps, lazy-load placeholders, visual QA fixtures, stress-test fixtures, unscoreable maps, and maps without routable exercises stay in the registry with an unsupported reason but do not appear in the authoring selector.

## Authoring Maps

The authoring map selector is labelled `Map / training area`. It is dev-only and is not linked from learner navigation.

Available authoring sources come from:

- `app/dev/route-runner/routeRunnerMaps.ts` for practice, converted OSM, Real London pilot, larger OSM, and Phase 6 visual QA fixtures
- `app/dev/route-runner/curatedRealLondonRouteRunnerMaps.ts` for curated real OSM area fixtures
- `app/dev/training-route/trainingRouteAuthor.ts` for the authoring registry and selector filtering rules

Actually loadable for route authoring:

- `osm-real-london-pilot` - Real London pilot, fixture `realLondonPilotOverpass.json`, active
- `osm-real-london-pilot-2` - Euston / Bloomsbury pilot, fixture `realLondonPilotTwoOverpass.json`, dev-only
- `osm-tiny-london-prototype` - Tiny converted OSM fixture, fixture `tinyLondonOverpass.json`, dev-only
- `osm-medium-london-prototype` - Medium converted OSM fixture, fixture `mediumLondonOverpass.json`, dev-only
- `osm-large-london` - Larger converted OSM fixture, fixture `largeLondonOverpass.json`, dev-only
- `osm-curated-piccadilly-circus` - Piccadilly Circus curated OSM, fixture `piccadillyCircusOverpass.json`, beta
- `osm-curated-waterloo-bridge` - Waterloo Bridge curated OSM, fixture `waterlooBridgeOverpass.json`, beta
- `osm-curated-one-way-system-area` - one-way system curated OSM, fixture `oneWaySystemAreaOverpass.json`, beta
- `osm-curated-quiet-residential-roads` - quiet residential curated OSM, fixture `quietResidentialRoadsOverpass.json`, beta

Known exclusions:

- `marlowe-district-dev-map` is a synthetic practice map, so it is not used for real curated route authoring.
- `osm-phase-6-real-london-visual-qa` is a visual QA scenario and must not become a learner route source.
- `osm-curated-kings-cross-euston` is a lazy-load placeholder in the route-runner catalogue; the full map is not loaded in `/dev/training-route` yet.
- `osm-curated-centralLondon` is a lazy stress-test / visual QA fixture and remains unsupported for route authoring.
- Test-only unit fixtures and visual QA fixtures are not shown unless they meet the same loaded, routable, scoreable fixture contract.

A map source is the actual route graph and fixture used for snapping, validation, matching, shortest-route comparison, and learner replay. An area preset is only a viewport/bounds selection within an existing map source. Do not create a separate map entry for a neighbourhood unless the project has a separate committed map fixture or a real viewport preset tied to an existing source.

To add a new authoring-supported map:

1. Add or reuse a real route-runner map option with a committed fixture, loaded map definition, routable exercises, and stable map id.
2. Keep `fixtureUse` as `routableExercise`, leave `scoreable` enabled, and avoid `lazyLoadId` until `/dev/training-route` can load that fixture directly.
3. Confirm `TRAINING_ROUTE_AUTHOR_MAP_REGISTRY` reports the entry as supported and the selector lists it.
4. Author a sample route, run validation and shortest-route comparison, and confirm export metadata includes the selected `mapId`, `areaId`, `areaName`, `sourceFixture`, `mapVersion`, and viewport metadata.
5. Add learner loader support before expecting `/practice/training` to show complete routes from that map.

## Authoring Workflow

Use `/dev/training-route` for curated route creation:

1. Set the start point on the map by choosing `Set start` and clicking a valid road/node.
2. Draw the learner route in driving order with `Draw route`; the tool snaps and matches the trace to Real London road segments.
3. Add numbered checkpoints with `Add checkpoint` if the learner must visit them. They are validated in the order shown on the map and in the Route state tab.
4. Set the destination by choosing `Set destination` and clicking the final valid road/node.
5. Use the bottom drawer's `Authoring steps` tab for the compact seven-step route workflow.
6. Open the `Route state` tab to review missing start, destination, route, checkpoint requirement, ordered checkpoint list, length, segments, turns, decisions, validation, comparison, and export readiness.
7. Use the top `Map / training area` selector before drawing if the route belongs to a different loaded map source. Changing maps clears start, destination, checkpoints, drawn route, validation, shortest comparison, and export readiness after confirmation when the current route has unsaved state.
8. Open the `Metadata` tab to complete route metadata after the route shape is clear. The selected map source still controls snapping, validation, shortest-route comparison, viewport reset, save suggestions, and export metadata.
9. Use `Validate route` from the top toolbar or `Validation` tab. This action is available even before the route is complete and should list missing start, destination, route, metadata, or matching requirements as blocking errors.
10. Compare against the shortest valid route from the top toolbar or `Validation` tab. If the route cannot be compared yet, the comparison result should report an unknown or unsupported result rather than silently completing export readiness.
11. Open the `Export` tab and use `Save working draft` to preserve incomplete authoring work. It writes draft-status JSON to `data/training-routes/drafts/` and is blocked if the selected route status is approved.
12. Use `Save review candidate` after route id, title, start, destination, matched route, required metadata, and validation have run. It writes draft-status JSON with review lifecycle metadata to `data/training-routes/review/`.
13. Use `Save complete route` only after required metadata, validation, no blocking errors, shortest-route comparison, any required route choice justification, and beta or approved status are ready. It writes to `data/training-routes/complete/`.
14. Use `Download JSON` or `Copy JSON` in the `Export` tab for manual review only after the export readiness checklist is complete.

Use `/dev/route-runner` for full diagnostics, QA tables, manual route input, attempt review, adaptive practice diagnostics, and Route Runner regression testing. The authoring page links to `/dev/route-runner` from an advanced diagnostics section instead of showing those panels by default.

## Validation Workflow

Use the validation panel before copying an export:

1. Confirm the route is connected and starts/ends on valid drivable map data.
2. Review blocking errors and advisory warnings from the learner route validator.
3. Check affected segment ids, affected checkpoint node ids, and the complexity summary.
4. Keep invalid routes as working drafts or review candidates; do not mark them beta or approved.
5. Approve only after validation is clean and instructor review has resolved advisory warnings.

The validation panel uses only restrictions present in the project data. Unknown legal restrictions remain advisory or unverified; they are not invented.

Checkpoint validation is authoring-specific and uses the matched route node sequence. If a selected checkpoint node is not visited by the matched route, validation reports `author-checkpoint-missed`. If a checkpoint appears before an earlier required checkpoint, validation reports `author-checkpoint-out-of-order`. If metadata requires checkpoints but none are selected, validation reports `author-checkpoint-missing`.

## Shortest Route Check

The Training Route Author includes a shortest-route comparison panel. It compares the authored route against:

- the direct shortest legal route from start to destination
- the checkpoint-constrained shortest legal route, when intermediate checkpoints exist

The check reuses the existing map graph, legal shortest-route traversal, one-way handling, prohibited turn handling, restricted/non-drivable filtering, and learner route validation. It does not invent legal restrictions. If the graph or restriction data cannot prove a route, the result is shown as `unknown` or advisory rather than invalid. When checkpoints exist, the map overlay shows the checkpoint-constrained shortest route so the author compares against the same required-stop sequence.

The percentage longer value means:

- `0-10%` longer - shortest or near-shortest
- `10-25%` longer - acceptable training variation
- `25-50%` longer - detour warning
- `50%+` longer - major detour warning

A route does not need to be shortest when the learning objective justifies it. Beginner routes should usually stay near-shortest unless the exercise teaches checkpoint navigation. Intermediate and advanced routes can be longer when they deliberately practise complex junction planning, legal route choice, missed-turn recovery, or dense-network decisions.

For detour warnings and major detour warnings, write a route choice justification before marking the route beta or approved. A good note explains the training reason, for example:

> This route intentionally avoids the shortest turn to practise checkpoint navigation and two additional junction decisions.

## Export Workflow

The export panel appears last. It shows explicit save controls, copyable JSON for future files under `data/training-routes/`, autosave recovery state, and readiness checklists.

Export should remain blocked until start, destination, matched route geometry, required metadata, validation, and shortest-route comparison are ready. The exported JSON uses the currently authored route shown in the authoring workspace and does not silently use a preselected fixture.

Save targets:

- `Save working draft` is for incomplete or in-progress routes. It requires a safe route id, title, and selected practice map / area, stores JSON status as `draft`, and writes to `data/training-routes/drafts/`.
- `Save review candidate` is for routes ready for dev or instructor review. It requires route id, title, selected practice map / area, start, destination, matched route, required metadata, and a validation run. It stores JSON status as `draft`, lifecycle stage as `review`, and writes to `data/training-routes/review/`.
- `Save complete route` is for routes ready to become curated learner training routes. It requires route id, title, selected practice map / area, difficulty, exercise type, start, destination, matched route, required metadata, validation run, no blocking validation errors, shortest-route comparison run or unknown, required route choice justification, and beta or approved status. It writes to `data/training-routes/complete/`.

The suggested filename is based on route metadata:

```text
<area-slug>-<difficulty>-<exercise-type>-<title-slug>.json
```

Working drafts append `-draft` before `.json`. Review and complete route filenames avoid `draft` unless that word is genuinely part of the cleaned route title. Existing files are preserved by writing a safe `-copy` filename.

Save directories:

- `data/training-routes/drafts/`
- `data/training-routes/review/`
- `data/training-routes/complete/`

The save API is intentionally dev-only. In production it returns a clear disabled response. Route ids are sanitized, path traversal is rejected, approved routes cannot be saved to drafts, and JSON is pretty-printed with `createdAt` and `updatedAt` timestamps.

The autosave recovery is browser-local storage for `/dev/training-route`. It is not a curated route source of truth and does not write any route library file. Use explicit file saves for work that should move toward Stage 19 review.

The exported contract includes:

- top-level route id, title, area, difficulty, exercise type, status, save mode where applicable, and lifecycle stage
- map/area metadata including `mapId`, `practiceMapId`, `areaId`, `areaName`, optional `sourceFixture`, map version when available, and `mapViewport` bounds when useful
- metadata and status
- source map and route exercise ids
- start, destination, ordered checkpoints, checkpoint requirements, node ids, and route geometry
- route segment ids and road ids
- validation summary
- complexity summary
- shortest route comparison, including direct and checkpoint-constrained results
- route choice justification
- validation segments for later replay

Stage 20 learner Training Mode loads complete beta or approved curated exports first. The automatic generator remains available only as a clearly labelled experimental fallback when no curated route exists for the current map, difficulty, and exercise type.

## First Curated Route Pack

The first learner-facing route pack is documented in `docs/phase-7-curated-route-pack.md`.

Current pack status:

- Pack id: `real-london-pilot-route-pack-1`
- Storage: `data/training-routes/complete/`
- Source map: `osm-real-london-pilot`
- Learner-facing routes: 13 beta routes
- Beginner routes: 3
- Intermediate routes: 5
- Advanced routes: 5
- Checkpoint routes: 3

Training Mode filters routes by active map id, area metadata, difficulty, exercise type, complete lifecycle stage, and `beta` or `approved` status. Draft and review exports must not appear to learners. If a complete route belongs to a map that learner Training Mode cannot load yet, diagnostics exclude it with `unsupported-learner-map` instead of showing a broken card. If no curated route matches, the learner sees `No approved curated route is available for this selection yet.` and can choose `Try experimental generated route` only as an explicit fallback.

## Manual QA

Run the app locally and check:

1. `/dev` lists Route Runner and Training Route Author.
2. `/dev/route-runner` opens the existing map workspace and still shows Phase 6 map labels, overlays, route review, and Training Mode test controls.
3. At 100% browser zoom, `/dev/training-route` opens with no default route exported and shows a compact dev header, top authoring toolbar, shorter full-width map, and bottom drawer. It should not show a permanent right sidebar or always-visible metadata/export blocks.
4. Confirm the map is about 25% shorter than the previous Stage 18.19 viewport, the bottom drawer is easier to reach, and the map still fills the authoring viewport without a large empty grey/blue area below the visible roads or below the collapsed legend.
5. Confirm the bottom drawer opens on the `Authoring steps` tab and can be collapsed and expanded.
6. Click `Validate route` with no authored route and confirm the bottom drawer opens validation details explaining the missing start, destination, and route.
7. Confirm the `Route state` tab shows compact route status cards and the authoring steps do not mark route, validation, comparison, or export complete from the empty default state.
8. Confirm the top `Map / training area` field is a selector, lists only authoring-supported map sources from the registry, and shows map id, area, source fixture, status, and readiness details.
9. Confirm the suggested route id and filename continue to use the selected area and update while the route id is still auto-generated.
10. Confirm removing or invalidating the selected map / area blocks save readiness with `Select a practice map or training area.`
11. Confirm the map legend is collapsed by default and appears as a `Map legend` control, not a permanent row below the map.
12. Open `Map legend` and confirm the authoring entries are visible: Raw drawing, Matched route, Shortest overlay, One-way arrows, START, DESTINATION, and Checkpoint.
13. On mobile, confirm the legend button is easy to tap, the expanded legend is easy to close, and it does not cover the map badly.
14. Pan and wheel-zoom the map.
15. Confirm the rendered map still fills the viewport after panning and zooming.
16. Confirm mouse wheel over the map zooms the map without scrolling the page.
17. Confirm dragging in `Pan` mode moves the map without scrolling the page.
18. Confirm drawing a route does not scroll the page.
19. Confirm mobile/touch drawing and panning do not fight the page scroll.
20. Confirm page scroll still works normally when the gesture starts outside the map.
21. Choose `Set start` and click the map; confirm the start summary changes to selected and the marker appears where clicked or at the nearest-road snap point.
22. Choose `Set destination` and click the map without drawing a route; confirm the destination marker is aligned, then run `Validate route` and confirm the route missing error remains blocking.
23. Choose `Draw route`, trace roads, and confirm the route summary changes to matched only after the trace snaps and matches to road segments.
24. Choose `Add checkpoint`, click the map, and confirm the checkpoint count increments and the checkpoint marker remains aligned.
25. Run `Validate route`, then `Compare shortest route`; confirm the panels move out of the not-run state. If checkpoints are present, confirm the checkpoint-constrained comparison runs or reports a clear unsupported/unknown state.
26. Confirm export remains blocked while validation has blocking errors, and the export checklist explains each missing requirement.
27. Open the `Export` tab and confirm `Save working draft`, `Save review candidate`, and `Save complete route` are visible.
28. Confirm `Save working draft` writes draft-status JSON under `data/training-routes/drafts/` and shows the saved path.
29. Confirm `Save review candidate` blocks until validation has run and then writes under `data/training-routes/review/`.
30. Confirm `Save complete route` blocks until validation, shortest-route comparison, route choice justification where required, and beta or approved status are ready, then writes under `data/training-routes/complete/`.
31. Confirm an approved route cannot be saved into `data/training-routes/drafts/`.
32. Confirm the `Export` tab shows save mode, JSON status, suggested filename, full save path, learner-facing later, and a checklist for each save target.
33. Complete required metadata and confirm `Download JSON` and `Copy JSON` enable only when the export readiness checklist is complete.
34. Confirm the JSON contains the authored start, destination, ordered checkpoints, checkpoint requirements, route segment ids, route geometry, route metadata, selected map id, selected area id/name, source fixture, map version, viewport metadata, save lifecycle data, validation summary, complexity summary, and shortest-route comparison.
35. Reload `/dev/training-route` after editing and confirm autosave recovery restores the local authoring state without looking like a file save.
36. Confirm a repeated file save creates a safe copy instead of silently overwriting an existing route file.
37. Use `Clear route` and confirm route data resets while checkpoints remain; use `Clear checkpoints` and confirm only checkpoints reset.
38. Confirm one-way indicators on `/dev/training-route` are clearly arrows, not dot-like symbols.
39. Confirm START and DESTINATION markers match the practice map marker style and are not oversized.
40. Confirm checkpoint markers match the Training Mode/practice map style and remain readable.
41. Confirm authored, matched, shortest-route, and validation overlays remain visually distinct over the Real London map.
42. Confirm wheel zoom over the map zooms towards the cursor and the map point under the cursor stays stable.
43. Confirm middle mouse drag pans the map in `Pan`, `Set start`, `Draw route`, `Add checkpoint`, and `Set destination` modes.
44. Confirm releasing the middle mouse button leaves the selected authoring mode unchanged.
45. Confirm middle-click does not place start, destination, or checkpoints and does not draw a route.
46. Confirm browser middle-click autoscroll does not activate inside the map.
47. Confirm right-click does not place or draw on the map.
48. Confirm left-click still places start, destination, checkpoints, and begins drawing in the matching authoring modes.
49. Confirm page scroll does not move while panning or drawing inside the map.
50. Confirm touch drawing and panning still work on mobile.
51. Click `Set start` on several parts of the map and confirm the marker appears at the clicked or nearest-road snap location.
52. Zoom in, repeat start placement, and confirm there is no growing offset across the viewport.
53. Zoom out, repeat destination placement, and confirm the selected marker stays aligned.
54. Pan the map, then place checkpoints across different map areas and confirm each checkpoint lands near the clicked road.
55. Scroll the page away from and back to the map, then place start/destination again and confirm coordinates remain aligned.
56. Draw a route and confirm the raw route line follows the cursor path.
57. Enable `Show click diagnostics` and confirm the raw click marker and snapped marker are close to the clicked road.
58. Add two checkpoints on a matched route, reverse their order through the route state if testing model-level validation, and confirm validation reports an out-of-order checkpoint rather than a generic route error.
59. Add a checkpoint away from the matched route and confirm validation reports a missed checkpoint with the affected checkpoint node.
60. Confirm the learner Training Mode review still displays numbered checkpoint markers, missed checkpoint markers, and checkpoint feedback for generated exercises that include checkpoints.
61. The learner sidebar and `/practice` page do not link to `/dev/training-route`.
62. `/practice/training` remains the learner-facing Training Mode route.

## Ready for Stage 19 Checklist

Before curated route loading begins in Stage 19, use `/dev/training-route` to prove the authoring pipeline end to end:

1. Open `/dev/training-route` and confirm the map-first workspace starts empty. The top toolbar, shorter full-width map, collapsed `Map legend`, and bottom drawer should be visible without a permanent metadata/export panel.
2. Select the intended `Map / training area` before drawing. If changing away from an edited route, confirm the warning clears the current authoring state before the new map loads.
3. Create a route manually: `Set start`, `Draw route`, optional or required `Add checkpoint`, and `Set destination`. The route state cards should change from missing to selected or matched only after real map interaction.
4. Run `Validate route`. Empty and partial routes should show blocking errors for missing start, destination, route, or required checkpoints. Complete routes should show valid, warning, or invalid based on the current authored geometry, ordered checkpoints, and available map restrictions.
5. Run `Compare shortest route`. If enough route data exists, confirm authored length, direct shortest length, checkpoint-constrained shortest length when checkpoints exist, percentage longer, and verdict are shown. If the route is a major detour, add a route choice justification before marking it beta or approved.
6. Complete the `Metadata` tab. Route id plus filename suggestions should update from selected map/area, difficulty, exercise type, and title while remaining editable.
7. Use `Save working draft` for incomplete authoring work under `data/training-routes/drafts/`. Use `Save review candidate` for validated instructor review files under `data/training-routes/review/`. Use `Save complete route` only for beta or approved routes that pass validation, shortest-route comparison, and route choice checks under `data/training-routes/complete/`.
8. Confirm the exported JSON contains authored start, destination, ordered checkpoints, checkpoint requirements, route geometry, route segment ids, map/area metadata, metadata, validation summary, complexity summary, shortest-route comparison, and lifecycle data. It must not contain placeholder route geometry from a hidden fixture unless `Load sample route` was clicked explicitly.
9. Verify one beginner, one intermediate, and one advanced route can reach export readiness. They can remain draft or review candidates during this gate; do not create the full curated route pack until Stage 19.
10. Recheck `/dev/route-runner`, `/practice/training`, and `/practice/real-london` after authoring changes to ensure Phase 6 map rendering and Phase 7 learner Training Mode remain unchanged.

## Validation Commands

Run the project validation suite before committing dev tool changes:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run test:map
npm.cmd run build
git diff --check
```
