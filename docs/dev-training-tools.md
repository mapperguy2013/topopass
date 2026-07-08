# TOPOPASS Dev Training Tools

Phase 18.5 adds a dev-only workspace for testing Route Runner and preparing curated learner-driver training routes. These pages are intentionally not linked from the learner navigation.

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
- the existing RouteRunnerClient map and drawing preview surface
- the learner route validation engine
- Phase 7 exercise difficulty and exercise type models

Author fields include route id, title, area, difficulty, exercise type, description, objective, skills practised, expected learner mistakes, hint sequence, scoring emphasis, instructor feedback notes, and draft/beta/approved status.

Stage 18.6 adds a `Route choice justification` field. Use it when the authored route is intentionally longer than the shortest legal route that the project can prove from current map data.

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

The export panel shows copyable JSON for future files under `data/training-routes/`.

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
3. `/dev/training-route` shows metadata fields, validation, shortest-route comparison, export JSON, and the Real London map preview.
4. The learner sidebar and `/practice` page do not link to `/dev/training-route`.
5. `/practice/training` remains the learner-facing Training Mode route.

## Validation Commands

Run the project validation suite before committing dev tool changes:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run test:map
npm.cmd run build
git diff --check
```
