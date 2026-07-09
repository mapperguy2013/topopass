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

## Authoring Workflow

Use `/dev/training-route` for curated route creation:

1. Set the start point on the map by choosing `Set start` and clicking a valid road/node.
2. Draw the learner route in driving order with `Draw route`; the tool snaps and matches the trace to Real London road segments.
3. Add numbered checkpoints with `Add checkpoint` if the learner must visit them.
4. Set the destination by choosing `Set destination` and clicking the final valid road/node.
5. Review the route state summary for missing start, destination, route, checkpoints, length, segments, turns, decisions, validation, comparison, and export readiness.
6. Complete metadata after the route shape is clear.
7. Validate the route.
8. Compare against the shortest valid route.
9. Export JSON only after the readiness checklist is complete.

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

The export panel appears last. It shows copyable JSON for future files under `data/training-routes/` and an export readiness checklist.

Export should remain blocked until start, destination, matched route geometry, required metadata, validation, and shortest-route comparison are ready. The exported JSON uses the currently authored route shown in the authoring workspace and does not silently use a preselected fixture.

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
4. Pan and wheel-zoom the map.
5. Confirm mouse wheel over the map zooms the map without scrolling the page.
6. Confirm dragging in `Pan` mode moves the map without scrolling the page.
7. Confirm drawing a route does not scroll the page.
8. Confirm mobile/touch drawing and panning do not fight the page scroll.
9. Confirm page scroll still works normally when the gesture starts outside the map.
10. Choose `Set start` and click the map; confirm the start summary changes to selected.
11. Choose `Draw route`, trace roads, and confirm the route summary changes to drawn and matched.
12. Choose `Add checkpoint`, click the map, and confirm the checkpoint count increments.
13. Choose `Set destination` and click the map; confirm the destination summary changes to selected.
14. Run `Validate route`, then `Compare shortest route`; confirm the panels move out of the not-run state.
15. Complete required metadata and confirm `Copy JSON` enables only when the readiness checklist is complete.
16. Confirm the JSON contains the authored start, destination, checkpoints, route segment ids, route geometry, metadata, validation summary, and shortest-route comparison.
17. Use `Clear route` and confirm route data resets while checkpoints remain; use `Clear checkpoints` and confirm only checkpoints reset.
18. Confirm one-way indicators on `/dev/training-route` are clearly arrows, not dot-like symbols.
19. Confirm START and DESTINATION markers match the practice map marker style and are not oversized.
20. Confirm checkpoint markers match the Training Mode/practice map style and remain readable.
21. Confirm authored, matched, shortest-route, and validation overlays remain visually distinct over the Real London map.
22. The learner sidebar and `/practice` page do not link to `/dev/training-route`.
23. `/practice/training` remains the learner-facing Training Mode route.

## Validation Commands

Run the project validation suite before committing dev tool changes:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run test:map
npm.cmd run build
git diff --check
```
