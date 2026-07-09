# TOPOPASS Dev Training Tools

Phase 18.5 adds a dev-only workspace for testing Route Runner and preparing curated learner-driver training routes. Stage 18.7 rebuilds the authoring page around a map-first route creation flow. Stage 18.8 makes that authoring page interactive. Stage 18.15 adds explicit working draft, review candidate, and complete route save modes. Stage 18.16 adds a map/area selector backed by the existing Route Runner map registry. Stage 18.17 moves the authoring map legend into a collapsed map control. These pages are intentionally not linked from the learner navigation.

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

Stage 18.16 replaces the free-text area field with a selector populated from the existing Route Runner map registry. The current authoring workspace can load the Real London pilot map, so the selector only exposes that supported area for now. Additional registered maps can be enabled later when `/dev/training-route` can switch its authoring map, snapping, validation, and shortest-route comparison state safely. The selected option records stable map and area metadata in exports: `practiceMapId`, `areaId`, `areaName`, optional `sourceFixture`, and the existing map version fields.

Stage 18.17 keeps the authoring legend collapsed by default. Use the `Map legend` control inside the map viewport to reveal Raw drawing, Matched route, Shortest overlay, One-way arrows, START, DESTINATION, and Checkpoint entries. The legend should not render as a permanent horizontal row below the map.

## Authoring Workflow

Use `/dev/training-route` for curated route creation:

1. Set the start point on the map by choosing `Set start` and clicking a valid road/node.
2. Draw the learner route in driving order with `Draw route`; the tool snaps and matches the trace to Real London road segments.
3. Add numbered checkpoints with `Add checkpoint` if the learner must visit them.
4. Set the destination by choosing `Set destination` and clicking the final valid road/node.
5. Review the route state summary for missing start, destination, route, checkpoints, length, segments, turns, decisions, validation, comparison, and export readiness.
6. Select the practice map / area and complete metadata after the route shape is clear. The current selector exposes the Real London pilot map because it is the only map the authoring workspace can load.
7. Validate the route. This button is available even before the route is complete and should list missing start, destination, route, metadata, or matching requirements as blocking errors.
8. Compare against the shortest valid route. If the route cannot be compared yet, the comparison panel should report an unknown or unsupported result rather than silently completing export readiness.
9. Use `Save working draft` to preserve incomplete authoring work. It writes draft-status JSON to `data/training-routes/drafts/` and is blocked if the selected route status is approved.
10. Use `Save review candidate` after route id, title, start, destination, matched route, required metadata, and validation have run. It writes draft-status JSON with review lifecycle metadata to `data/training-routes/review/`.
11. Use `Save complete route` only after required metadata, validation, no blocking errors, shortest-route comparison, any required route choice justification, and beta or approved status are ready. It writes to `data/training-routes/complete/`.
12. Use `Download JSON` or `Copy JSON` for manual review only after the export readiness checklist is complete.

Use `/dev/route-runner` for full diagnostics, QA tables, manual route input, attempt review, adaptive practice diagnostics, and Route Runner regression testing. The authoring page links to `/dev/route-runner` from an advanced diagnostics section instead of showing those panels by default.

## Validation Workflow

Use the validation panel before copying an export:

1. Confirm the route is connected and starts/ends on valid drivable map data.
2. Review blocking errors and advisory warnings from the learner route validator.
3. Check affected segment ids and the complexity summary.
4. Keep invalid routes as working drafts or review candidates; do not mark them beta or approved.
5. Approve only after validation is clean and instructor review has resolved advisory warnings.

The validation panel uses only restrictions present in the project data. Unknown legal restrictions remain advisory or unverified; they are not invented.

## Shortest Route Check

The Training Route Author includes a shortest-route comparison panel. It compares the authored route against:

- the direct shortest legal route from start to destination
- the checkpoint-constrained shortest legal route, when intermediate checkpoints exist

The check reuses the existing map graph, legal shortest-route traversal, one-way handling, prohibited turn handling, restricted/non-drivable filtering, and learner route validation. It does not invent legal restrictions. If the graph or restriction data cannot prove a route, the result is shown as `unknown` or advisory rather than invalid.

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
- map/area metadata including `practiceMapId`, `areaId`, `areaName`, optional `sourceFixture`, and map version when available
- metadata and status
- source map and route exercise ids
- start, destination, checkpoints, node ids, and route geometry
- route segment ids and road ids
- validation summary
- complexity summary
- shortest route comparison, including direct and checkpoint-constrained results
- route choice justification
- validation segments for later replay

Stage 18.5 through Stage 18.15 do not switch learner Training Mode to curated routes. Stage 19 can load complete, beta, or approved exports and instantiate exercises through the existing Phase 7 generation, validation, scoring, hint, feedback, and progress modules.

## Manual QA

Run the app locally and check:

1. `/dev` lists Route Runner and Training Route Author.
2. `/dev/route-runner` opens the existing map workspace and still shows Phase 6 map labels, overlays, route review, and Training Mode test controls.
3. `/dev/training-route` opens with no default route exported and shows the map authoring workspace before metadata, validation, shortest-route comparison, and export JSON.
4. Confirm the map fills the authoring viewport without a large empty grey/blue area below the visible roads.
5. Click `Validate route` with no authored route and confirm blocking errors explain the missing start, destination, and route.
6. Confirm the validation result appears beside the route state summary near the map, while the full validation panel remains available below.
7. Confirm the authoring steps do not mark route, validation, comparison, or export complete from the empty default state.
8. Confirm the `Practice map / area` field is a selector, lists the Real London pilot map, and shows map id, source fixture, exercise count, map version, and readiness details.
9. Confirm the suggested route id and filename continue to use the selected area and update while the route id is still auto-generated.
10. Confirm removing or invalidating the selected map / area blocks save readiness with `Select a practice map or training area.`
11. Confirm the map legend is collapsed by default and appears as a `Map legend` control, not a permanent row below the map.
12. Open `Map legend` and confirm the authoring entries are visible: Raw drawing, Matched route, Shortest overlay, One-way arrows, START, DESTINATION, and Checkpoint.
13. On mobile, confirm the legend button is easy to tap, the expanded legend is easy to close, and it does not cover the map badly.
14. Pan and wheel-zoom the map.
15. Confirm mouse wheel over the map zooms the map without scrolling the page.
16. Confirm dragging in `Pan` mode moves the map without scrolling the page.
17. Confirm drawing a route does not scroll the page.
18. Confirm mobile/touch drawing and panning do not fight the page scroll.
19. Confirm page scroll still works normally when the gesture starts outside the map.
20. Choose `Set start` and click the map; confirm the start summary changes to selected.
21. Choose `Set destination` and click the map without drawing a route; run `Validate route` and confirm the route missing error remains blocking.
22. Choose `Draw route`, trace roads, and confirm the route summary changes to matched only after the trace snaps and matches to road segments.
23. Choose `Add checkpoint`, click the map, and confirm the checkpoint count increments.
24. Run `Validate route`, then `Compare shortest route`; confirm the panels move out of the not-run state.
25. Confirm export remains blocked while validation has blocking errors, and the export checklist explains each missing requirement.
26. Confirm `Save working draft`, `Save review candidate`, and `Save complete route` are visible in the export panel.
27. Confirm `Save working draft` writes draft-status JSON under `data/training-routes/drafts/` and shows the saved path.
28. Confirm `Save review candidate` blocks until validation has run and then writes under `data/training-routes/review/`.
29. Confirm `Save complete route` blocks until validation, shortest-route comparison, route choice justification where required, and beta or approved status are ready, then writes under `data/training-routes/complete/`.
30. Confirm an approved route cannot be saved into `data/training-routes/drafts/`.
31. Confirm the export panel shows save mode, JSON status, suggested filename, full save path, learner-facing later, and a checklist for each save target.
32. Complete required metadata and confirm `Download JSON` and `Copy JSON` enable only when the export readiness checklist is complete.
33. Confirm the JSON contains the authored start, destination, checkpoints, route segment ids, route geometry, route metadata, map/area metadata, save lifecycle data, validation summary, complexity summary, and shortest-route comparison.
34. Reload `/dev/training-route` after editing and confirm autosave recovery restores the local authoring state without looking like a file save.
35. Confirm a repeated file save creates a safe copy instead of silently overwriting an existing route file.
36. Use `Clear route` and confirm route data resets while checkpoints remain; use `Clear checkpoints` and confirm only checkpoints reset.
37. Confirm one-way indicators on `/dev/training-route` are clearly arrows, not dot-like symbols.
38. Confirm START and DESTINATION markers match the practice map marker style and are not oversized.
39. Confirm checkpoint markers match the Training Mode/practice map style and remain readable.
40. Confirm authored, matched, shortest-route, and validation overlays remain visually distinct over the Real London map.
41. Confirm wheel zoom over the map zooms towards the cursor and the map point under the cursor stays stable.
42. Confirm middle mouse drag pans the map in `Pan`, `Set start`, `Draw route`, `Add checkpoint`, and `Set destination` modes.
43. Confirm releasing the middle mouse button leaves the selected authoring mode unchanged.
44. Confirm middle-click does not place start, destination, or checkpoints and does not draw a route.
45. Confirm browser middle-click autoscroll does not activate inside the map.
46. Confirm right-click does not place or draw on the map.
47. Confirm left-click still places start, destination, checkpoints, and begins drawing in the matching authoring modes.
48. Confirm page scroll does not move while panning or drawing inside the map.
49. Confirm touch drawing and panning still work on mobile.
50. Click `Set start` on several parts of the map and confirm the marker appears at the clicked or nearest-road snap location.
51. Zoom in, repeat start placement, and confirm there is no growing offset across the viewport.
52. Zoom out, repeat destination placement, and confirm the selected marker stays aligned.
53. Pan the map, then place checkpoints across different map areas and confirm each checkpoint lands near the clicked road.
54. Scroll the page away from and back to the map, then place start/destination again and confirm coordinates remain aligned.
55. Draw a route and confirm the raw route line follows the cursor path.
56. Enable `Show click diagnostics` and confirm the raw click marker and snapped marker are close to the clicked road.
57. The learner sidebar and `/practice` page do not link to `/dev/training-route`.
58. `/practice/training` remains the learner-facing Training Mode route.

## Validation Commands

Run the project validation suite before committing dev tool changes:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run test:map
npm.cmd run build
git diff --check
```
