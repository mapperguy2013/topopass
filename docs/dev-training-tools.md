# TOPOPASS Dev Training Tools

Phase 18.5 adds a dev-only workspace for testing Route Runner and preparing curated learner-driver training routes. Stage 18.7 rebuilds the authoring page around a map-first route creation flow. Stage 18.8 makes that authoring page interactive. These pages are intentionally not linked from the learner navigation.

## Dev Tools Home

Open `/dev` locally to see the internal tool index.

Available tools:

- `/dev/route-runner` - Dev Route Runner for map QA, route drawing, overlays, route review, and Training Mode testing.
- `/dev/training-route` - Curated Training Route Author for drafting future learner training routes.
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

Author fields include route id, title, area, difficulty, exercise type, description, objective, skills practised, expected learner mistakes, hint sequence, scoring emphasis, instructor feedback notes, and draft/beta/approved status.

Stage 18.6 adds a `Route choice justification` field. Use it when the authored route is intentionally longer than the shortest legal route that the project can prove from current map data.

Stage 18.7 keeps `/dev/training-route` focused on route authoring instead of embedding the full Route Runner debug surface. The first working section is the map authoring workspace with toolbar actions for pan, set start, draw route, add checkpoint, set destination, undo, removing checkpoints, clearing route data, resetting view, validation, shortest-route comparison, and export.

Stage 18.8 removes the static placeholder export. `/dev/training-route` now starts empty, renders the Real London road and label data, and updates route state from map interaction. The `Load sample route` button is the only way to seed a fixture route for testing; normal export readiness depends on the route currently authored in the workspace.

Stage 18.9 isolates map gestures from page scrolling. Mouse wheel and trackpad scroll over the authoring map are handled by the map viewport only, touch drawing and panning do not drag the page, and normal page scroll still works outside the map.

Stage 18.10 aligns the authoring map styling with the learner practice map. One-way indicators now use the shared restriction arrow styling and decluttering pipeline, START/DESTINATION/checkpoint markers use the shared practice marker assets and label bubbles, and authored, matched, and shortest-route overlays use the shared route overlay tokens.

Stage 18.11 fixes authoring map input precision. Wheel zoom now keeps the map point under the cursor stable, while middle-click and right-click inside the map are blocked from placing start/destination/checkpoints, drawing routes, or triggering browser autoscroll.

Stage 18.12 adds dev-only draft saving for curated training routes. The authoring page can now save JSON drafts to `data/training-routes/drafts/`, save stricter validated drafts, download JSON locally, copy JSON to the clipboard, and recover browser-local autosaves after a reload. The dev save endpoint is disabled in production and only writes sanitized `.json` filenames under the drafts directory.

Stage 18.12 map-control follow-up aligns `/dev/training-route` with the beta practice map controls. Wheel zoom stays cursor-centred, middle mouse drag temporarily pans without changing the selected authoring mode, middle/right clicks cannot place markers or draw route points, and page scroll remains isolated while the pointer is inside the map.

Stage 18.13 fixes click-to-map coordinate alignment on `/dev/training-route`. Pointer coordinates are converted through the actual SVG content box before snapping or drawing, so START, DESTINATION, checkpoint, and route points use the same corrected map coordinate after zooming, panning, resizing, or page scrolling. The optional `Show click diagnostics` toggle displays the raw client point, local SVG point, canonical map point, snap target, and snap distance for dev QA.

Stage 18.14 separates validation readiness from export readiness. `Validate route` and `Compare shortest route` stay available so incomplete routes produce useful blocking messages instead of inactive controls. The map uses the author canvas aspect ratio to avoid a large unused empty area below the visible map, and the compact validation result now appears beside the route state summary near the map workspace.

## Authoring Workflow

Use `/dev/training-route` for curated route creation:

1. Set the start point on the map by choosing `Set start` and clicking a valid road/node.
2. Draw the learner route in driving order with `Draw route`; the tool snaps and matches the trace to Real London road segments.
3. Add numbered checkpoints with `Add checkpoint` if the learner must visit them.
4. Set the destination by choosing `Set destination` and clicking the final valid road/node.
5. Review the route state summary for missing start, destination, route, checkpoints, length, segments, turns, decisions, validation, comparison, and export readiness.
6. Complete metadata after the route shape is clear.
7. Validate the route. This button is available even before the route is complete and should list missing start, destination, route, metadata, or matching requirements as blocking errors.
8. Compare against the shortest valid route. If the route cannot be compared yet, the comparison panel should report an unknown or unsupported result rather than silently completing export readiness.
9. Use `Save draft` once route id, start, destination, and matched route data exist.
10. Use `Save validated draft` only after metadata, validation, and shortest-route comparison are complete.
11. Use `Download JSON` or `Copy JSON` for manual review only after the export readiness checklist is complete.

Use `/dev/route-runner` for full diagnostics, QA tables, manual route input, attempt review, adaptive practice diagnostics, and Route Runner regression testing. The authoring page links to `/dev/route-runner` from an advanced diagnostics section instead of showing those panels by default.

## Validation Workflow

Use the validation panel before copying an export:

1. Confirm the route is connected and starts/ends on valid drivable map data.
2. Review blocking errors and advisory warnings from the learner route validator.
3. Check affected segment ids and the complexity summary.
4. Keep invalid routes in draft or beta.
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

The export panel appears last. It shows save controls, copyable JSON for future files under `data/training-routes/`, and readiness checklists.

Export should remain blocked until start, destination, matched route geometry, required metadata, validation, and shortest-route comparison are ready. The exported JSON uses the currently authored route shown in the authoring workspace and does not silently use a preselected fixture.

`Save draft` is available earlier than export because it is meant to preserve authoring work. It still requires a safe route id, selected start, selected destination, and matched route. `Save validated draft` is stricter and requires complete metadata, a non-blocking validation result, a completed shortest-route comparison, and route choice justification where a major detour warning requires one.

Saved dev drafts are written to:

- `data/training-routes/drafts/`

Prepared future route folders are:

- `data/training-routes/beta/`
- `data/training-routes/approved/`
- `data/training-routes/archive/`

The save API is intentionally dev-only. In production it returns a clear disabled response. Route ids are sanitized into `.json` filenames, path traversal is rejected, existing drafts are preserved by writing a safe copy filename, and JSON is pretty-printed with `createdAt` and `updatedAt` timestamps.

The autosave recovery is browser-local storage for `/dev/training-route`. It is not a curated route source of truth; use file saves for drafts that should move toward Stage 19 review.

The exported contract includes:

- metadata and status
- source map and route exercise ids
- start, destination, checkpoints, node ids, and route geometry
- route segment ids and road ids
- validation summary
- complexity summary
- shortest route comparison, including direct and checkpoint-constrained results
- route choice justification
- validation segments for later replay

Stage 18.5 and Stage 18.6 do not switch learner Training Mode to curated routes. Stage 19 can load these exports and instantiate exercises through the existing Phase 7 generation, validation, scoring, hint, feedback, and progress modules.

## Manual QA

Run the app locally and check:

1. `/dev` lists Route Runner and Training Route Author.
2. `/dev/route-runner` opens the existing map workspace and still shows Phase 6 map labels, overlays, route review, and Training Mode test controls.
3. `/dev/training-route` opens with no default route exported and shows the map authoring workspace before metadata, validation, shortest-route comparison, and export JSON.
4. Confirm the map fills the authoring viewport without a large empty grey/blue area below the visible roads.
5. Click `Validate route` with no authored route and confirm blocking errors explain the missing start, destination, and route.
6. Confirm the validation result appears beside the route state summary near the map, while the full validation panel remains available below.
7. Confirm the authoring steps do not mark route, validation, comparison, or export complete from the empty default state.
8. Pan and wheel-zoom the map.
9. Confirm mouse wheel over the map zooms the map without scrolling the page.
10. Confirm dragging in `Pan` mode moves the map without scrolling the page.
11. Confirm drawing a route does not scroll the page.
12. Confirm mobile/touch drawing and panning do not fight the page scroll.
13. Confirm page scroll still works normally when the gesture starts outside the map.
14. Choose `Set start` and click the map; confirm the start summary changes to selected.
15. Choose `Set destination` and click the map without drawing a route; run `Validate route` and confirm the route missing error remains blocking.
16. Choose `Draw route`, trace roads, and confirm the route summary changes to matched only after the trace snaps and matches to road segments.
17. Choose `Add checkpoint`, click the map, and confirm the checkpoint count increments.
18. Run `Validate route`, then `Compare shortest route`; confirm the panels move out of the not-run state.
19. Confirm export remains blocked while validation has blocking errors, and the export checklist explains each missing requirement.
20. Confirm `Save draft` writes a JSON file under `data/training-routes/drafts/` once required route data exists.
21. Confirm `Save validated draft` blocks until validation and shortest-route comparison are complete.
22. Complete required metadata and confirm `Download JSON` and `Copy JSON` enable only when the export readiness checklist is complete.
23. Confirm the JSON contains the authored start, destination, checkpoints, route segment ids, route geometry, metadata, validation summary, complexity summary, and shortest-route comparison.
24. Reload `/dev/training-route` after editing and confirm autosave recovery restores the draft state.
25. Confirm a repeated file save creates a safe copy instead of silently overwriting an existing draft.
26. Use `Clear route` and confirm route data resets while checkpoints remain; use `Clear checkpoints` and confirm only checkpoints reset.
27. Confirm one-way indicators on `/dev/training-route` are clearly arrows, not dot-like symbols.
28. Confirm START and DESTINATION markers match the practice map marker style and are not oversized.
29. Confirm checkpoint markers match the Training Mode/practice map style and remain readable.
30. Confirm authored, matched, shortest-route, and validation overlays remain visually distinct over the Real London map.
31. Confirm wheel zoom over the map zooms towards the cursor and the map point under the cursor stays stable.
32. Confirm middle mouse drag pans the map in `Pan`, `Set start`, `Draw route`, `Add checkpoint`, and `Set destination` modes.
33. Confirm releasing the middle mouse button leaves the selected authoring mode unchanged.
34. Confirm middle-click does not place start, destination, or checkpoints and does not draw a route.
35. Confirm browser middle-click autoscroll does not activate inside the map.
36. Confirm right-click does not place or draw on the map.
37. Confirm left-click still places start, destination, checkpoints, and begins drawing in the matching authoring modes.
38. Confirm page scroll does not move while panning or drawing inside the map.
39. Confirm touch drawing and panning still work on mobile.
40. Click `Set start` on several parts of the map and confirm the marker appears at the clicked or nearest-road snap location.
41. Zoom in, repeat start placement, and confirm there is no growing offset across the viewport.
42. Zoom out, repeat destination placement, and confirm the selected marker stays aligned.
43. Pan the map, then place checkpoints across different map areas and confirm each checkpoint lands near the clicked road.
44. Scroll the page away from and back to the map, then place start/destination again and confirm coordinates remain aligned.
45. Draw a route and confirm the raw route line follows the cursor path.
46. Enable `Show click diagnostics` and confirm the raw click marker and snapped marker are close to the clicked road.
47. The learner sidebar and `/practice` page do not link to `/dev/training-route`.
48. `/practice/training` remains the learner-facing Training Mode route.

## Validation Commands

Run the project validation suite before committing dev tool changes:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run test:map
npm.cmd run build
git diff --check
```
