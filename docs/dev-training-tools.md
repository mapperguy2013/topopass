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

## Validation Workflow

Use the validation panel before copying an export:

1. Confirm the route is connected and starts/ends on valid drivable map data.
2. Review blocking errors and advisory warnings from the learner route validator.
3. Check affected segment ids and the complexity summary.
4. Keep invalid routes in draft or beta.
5. Approve only after validation is clean and instructor review has resolved advisory warnings.

The validation panel uses only restrictions present in the project data. Unknown legal restrictions remain advisory or unverified; they are not invented.

## Export Workflow

The export panel shows copyable JSON for future files under `data/training-routes/`.

The exported contract includes:

- metadata and status
- source map and route exercise ids
- start, destination, checkpoints, node ids, and route geometry
- route segment ids and road ids
- validation summary
- complexity summary
- validation segments for later replay

Stage 18.5 does not switch learner Training Mode to curated routes. Stage 19 can load these exports and instantiate exercises through the existing Phase 7 generation, validation, scoring, hint, feedback, and progress modules.

## Manual QA

Run the app locally and check:

1. `/dev` lists Route Runner and Training Route Author.
2. `/dev/route-runner` opens the existing map workspace and still shows Phase 6 map labels, overlays, route review, and Training Mode test controls.
3. `/dev/training-route` shows metadata fields, validation, export JSON, and the Real London map preview.
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
