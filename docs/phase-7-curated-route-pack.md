# Phase 7 Curated Learner Route Pack

Stage 20 adds the first learner-facing curated route pack for Training Mode.
The pack is stored as complete route exports under
`data/training-routes/complete/` and loaded by
`lib/training/curatedLearnerRoutePack.ts`.

Stage 7P pauses Phase 7 without marking it complete. This document describes
the first beta curated pack, not a finished Phase 7 learner curriculum. See
`docs/phase-7-paused-state.md` for the remaining work before Phase 7 can be
called complete.

Automatic route generation remains available only as a clearly labelled
experimental fallback. The normal learner-facing Generate action selects from
complete `beta` or `approved` curated routes first.

## Pack Status

- Pack id: `real-london-pilot-route-pack-1`
- Pack version: `2026.07`
- Storage: `data/training-routes/complete/`
- Learner-facing statuses: `beta`, `approved`
- Current status: first beta target met; Phase 7 still paused and incomplete
- Target pack size: 15 routes, with 5 beginner, 5 intermediate, and 5 advanced
  routes
- Current pack size: 15 learner-facing routes
- Remaining target gap: 0 routes
- Source map: `osm-real-london-pilot`
- Source fixture: `realLondonPilotOverpass.json`

## Route Counts

| Difficulty | Current | Target | Remaining |
| --- | ---: | ---: | ---: |
| Beginner | 5 | 5 | 0 |
| Intermediate | 5 | 5 | 0 |
| Advanced | 5 | 5 | 0 |

Total learner-facing curated routes: 15.

Checkpoint routes: 3.

The pack is usable as the first beta learner-facing curated route pack and now
meets the 5 beginner / 5 intermediate / 5 advanced target.

## Exercise Type Counts

| Exercise type | Count |
| --- | ---: |
| Follow a planned route | 8 |
| Choose a legal route | 3 |
| Identify the next safe turn | 1 |
| Practise junction decision-making | 2 |
| Route review / mistake correction | 1 |

No first-pack route currently targets roundabout practice because the selected
Real London pilot source map does not provide enough safe roundabout-specific
training context. Roundabout routes should be added only when map metadata and
route QA support them.

## Difficulty Standards

Beginner routes should be short, clear, low-decision routes with simple start
and destination recognition. The first pack uses four direct Real London pilot
route-following routes plus one identify-next-safe-turn route for early
confidence. Some routes contain several OSM graph segments even though the
learner-facing task is short; this is documented as a segmentation limitation
rather than treated as a legal fault.

Intermediate routes add more road changes, route-following pressure, legal-route
choice, and ordered checkpoint navigation. They should remain realistic without
requiring the learner to solve dense-network route correction.

Advanced routes must be clearly harder than intermediate routes. The first pack
uses longer or denser Real London pilot paths, one-way/legal-route pressure,
multi-stop navigation, route review, and junction decision-making. Advanced
routes must not be tiny two-turn routes unless the objective explicitly justifies
that shape.

## Checkpoint Rules

Routes with checkpoints must export:

- `checkpoints` in learner order
- `checkpointRequirements.required: true`
- `checkpointRequirements.ordered: true`
- `checkpointRequirements.requiredNodeIds` matching the checkpoint order
- checkpoint stop metadata with `kind`, `order`, `required`, display label, node
  id, road id where available, and route segment id where available

Training Mode treats checkpoint routes as ordered required stops. Scoring,
feedback, hints, and review overlays can distinguish missed checkpoints from
wrong checkpoint order.

## Filtering And Rotation

Training Mode filters curated routes by:

- active map id
- area name and route map metadata when a caller provides an area filter
- selected difficulty
- selected exercise type
- learner-facing status (`beta` or `approved`)
- complete lifecycle stage

Draft and review exports are excluded from learner Training Mode. Complete
routes for maps that `/practice/training` cannot load yet are also excluded
with the diagnostic reason `unsupported-learner-map` instead of appearing as
broken learner cards.

The current learner-supported curated map ids are:

- `osm-real-london-pilot`
- `osm-real-london-pilot-2`
- `osm-curated-piccadilly-circus`
- `osm-curated-waterloo-bridge`
- `osm-curated-one-way-system-area`
- `osm-curated-quiet-residential-roads`
- `osm-curated-kings-cross-euston`

This project currently uses the static manifest in
`lib/training/curatedLearnerRoutePack.ts`. Saving a JSON route under
`data/training-routes/complete/` is not enough for client-side Training Mode by
itself; add the route JSON to that manifest unless the loader is later changed
to a generated manifest. Restart the dev server after adding a new JSON import
so Next.js picks up the new module.

Learner visibility requires:

- `lifecycleStage: "complete"`
- `status: "beta"` or `status: "approved"` at the top level and in `metadata`
- matching map/area metadata, especially `mapId` or `practiceMapId`
- learner Training Mode support for the exported `mapId`
- `areaName` matching the selected area filter when one is provided
- selected difficulty and exercise type matching the learner filters
- start, destination, route geometry, route segment ids, and validation
  segments
- no blocking validation errors

`buildCuratedTrainingRouteVisibilityDiagnostics()` reports how many complete
routes were found, how many are learner-facing, how many were excluded by
draft/review status, unsupported map id, missing metadata, or validation
blockers, and why any route was excluded.
Use it when a saved complete route does not appear in `/practice/training`.

Generate / Next route avoids the last three curated route ids where possible. If
only one route matches the current selection, it may repeat and the generation
state records that a repeat was necessary.

When no curated route exists for the selected map, difficulty, and exercise type,
Training Mode shows:

> No approved curated route is available for this selection yet.

The optional fallback action is labelled:

> Try experimental generated route

This prevents the learner-facing experience from silently returning to weak
random generation.

## Current Route Inventory

The current complete route audit includes every JSON file under
`data/training-routes/complete/`. All listed routes are learner-facing because
they are complete, `beta` or `approved`, map-backed, and have no blocking
validation errors.

| Route file | Difficulty | Exercise type | Status | Area / map | Checkpoints | Validation | Learner-facing |
| --- | --- | --- | --- | --- | ---: | --- | --- |
| `real-london-beginner-follow-chenies-street.json` | Beginner | Follow a planned route | beta | Real London Pilot / `osm-real-london-pilot` | 0 optional | valid | yes |
| `real-london-beginner-follow-goodge-tottenham.json` | Beginner | Follow a planned route | beta | Real London Pilot / `osm-real-london-pilot` | 0 optional | warning | yes |
| `real-london-beginner-follow-store-street.json` | Beginner | Follow a planned route | beta | Real London Pilot / `osm-real-london-pilot` | 0 optional | valid | yes |
| `real-london-beginner-follow-torrington-byng.json` | Beginner | Follow a planned route | beta | Real London Pilot / `osm-real-london-pilot` | 0 optional | warning | yes |
| `real-london-beginner-identify-next-safe-turn-store-street.json` | Beginner | Identify the next safe turn | approved | Real London / `osm-real-london-pilot` | 0 optional | valid | yes |
| `real-london-intermediate-checkpoint-goodge-chenies.json` | Intermediate | Follow a planned route | beta | Real London Pilot / `osm-real-london-pilot` | 1 required | warning | yes |
| `real-london-intermediate-follow-gower-torrington.json` | Intermediate | Follow a planned route | beta | Real London Pilot / `osm-real-london-pilot` | 0 optional | valid | yes |
| `real-london-intermediate-follow-huntley-chenies.json` | Intermediate | Follow a planned route | beta | Real London Pilot / `osm-real-london-pilot` | 1 required | valid | yes |
| `real-london-intermediate-junction-whitfield-goodge.json` | Intermediate | Practise junction decision-making | beta | Real London Pilot / `osm-real-london-pilot` | 0 optional | warning | yes |
| `real-london-intermediate-legal-torrington-one-way.json` | Intermediate | Choose a legal route | beta | Real London Pilot / `osm-real-london-pilot` | 0 optional | warning | yes |
| `real-london-advanced-follow-south-crescent-ridgmount.json` | Advanced | Follow a planned route | beta | Real London Pilot / `osm-real-london-pilot` | 2 required | warning | yes |
| `real-london-advanced-junction-mortimer-goodge.json` | Advanced | Practise junction decision-making | beta | Real London Pilot / `osm-real-london-pilot` | 0 optional | warning | yes |
| `real-london-advanced-legal-torrington-reverse.json` | Advanced | Choose a legal route | beta | Real London Pilot / `osm-real-london-pilot` | 0 optional | warning | yes |
| `real-london-advanced-legal-tottenham-gower.json` | Advanced | Choose a legal route | beta | Real London Pilot / `osm-real-london-pilot` | 0 optional | warning | yes |
| `real-london-advanced-review-goodge-byng.json` | Advanced | Route review / mistake correction | beta | Real London Pilot / `osm-real-london-pilot` | 0 optional | warning | yes |

Validation warnings in this inventory are advisory learner-suitability or route
review notes. They do not block learner visibility or complete-route save when
the route has no hard legal, technical, metadata, or checkpoint errors.

## Validation And Audit

`lib/training/curatedLearnerRoutePack.test.ts` audits the first pack.

The audit checks:

- learner-facing routes load from the complete pack
- every JSON file in `data/training-routes/complete/` appears in the static
  manifest
- draft and review routes are excluded
- required metadata exists
- every learner-facing route validates against the available map data
- there are no blocking validation errors
- checkpoint-required routes include ordered checkpoints
- checkpoint-optional routes remain learner-facing without checkpoints
- learner-suitability warnings remain advisory and do not block visibility
- route pack readiness records the 15-route target and target-met status
- shortest-route comparison exists or is explicitly non-applicable/unknown
- average complexity increases from beginner to intermediate to advanced
- advanced routes are not accidentally tiny/simple
- route cards expose title, area, difficulty, exercise type, skills, approximate
  length, segment count, turn count, decision count, checkpoint count, and status
- hints, scoring, feedback, and progress work on a curated route

Run:

```powershell
npm.cmd run test:training
```

## Route Lifecycle

Use `/dev/training-route` for future authoring.

- Working drafts save to `data/training-routes/drafts/`.
- Review candidates save to `data/training-routes/review/`.
- Complete learner-facing candidates save to `data/training-routes/complete/`.
- Only complete routes with `status: "beta"` or `status: "approved"` should load
  for learners.

Do not silently promote invalid drafts. A complete route should have a valid
validation summary, no blocking validation errors, route geometry, segment ids,
start/destination metadata, shortest-route comparison, scoring emphasis, hint
sequence, and instructor feedback notes. Instructor QA notes and route-choice
justification are recommended for reviewed route packs, but the learner loader
does not hide otherwise valid dev-author exports solely because those optional
notes are absent.

## Manual QA Checklist

For every future route before beta/approved use:

1. Open or author the route in `/dev/training-route`.
2. Confirm start, destination, route geometry, route segment ids, road ids, and
   node ids are real and map-backed.
3. Validate the route and resolve all blocking errors.
4. Run shortest-route comparison.
5. Confirm checkpoint routes visit checkpoints in order.
6. Confirm difficulty matches learner-facing complexity, not only raw graph
   segment count.
7. Confirm metadata includes skills practised, expected learner mistakes, hint
   sequence, scoring emphasis, instructor feedback notes, and route choice
   justification where needed.
8. Save as complete only with `beta` or `approved` status.
9. Run `npm.cmd run test:training`.
10. Run the full validation suite before committing.

## Stage 19.6 Pipeline Acceptance

Before building the full Stage 20 route pack, verify the curated route pipeline
with one complete `beta` or `approved` route.

To confirm a saved route appears in learner Training Mode:

1. Save or commit the route JSON under `data/training-routes/complete/`.
2. Add the JSON import to `lib/training/curatedLearnerRoutePack.ts` if the
   project is still using the static manifest.
3. Confirm `LEARNER_TRAINING_SUPPORTED_CURATED_MAP_IDS` includes the route's
   `mapId` only if `/practice/training` can load that map source.
4. Restart the dev server after adding the import.
5. Open `/practice/training`.
6. Select the matching map, difficulty, and exercise type.
7. Confirm the curated route card shows title, area/map, route length or segment
   count, checkpoint count, status, and skills practised.
8. If the card is hidden, check
   `buildCuratedTrainingRouteVisibilityDiagnostics()` for excluded routes and
   filter mismatches.

To test one curated route end to end:

1. Generate the matching curated route from `/practice/training`.
2. Confirm the map shows only the curated route, start marker, destination
   marker, and any checkpoints for that exercise.
3. Request a hint and confirm it uses the curated exercise objective and route
   instruction context.
4. Complete and review the attempt using the planned route.
5. Confirm scoring passes a clean route, feedback is specific, route review
   overlays remain readable, and local progress records the attempt.
6. Change filters to a combination with no curated route and confirm the message
   stays `No approved curated route is available for this selection yet.` with
   only an explicitly labelled `Try experimental generated route` fallback.
7. Recheck `/dev`, `/dev/route-runner`, and `/dev/training-route`; these should
   still work and should not appear in learner navigation.

Before Stage 20 starts, these checks must pass:

- `/practice/training` displays at least one complete `beta` or `approved`
  curated route.
- Difficulty, exercise type, and map filters either reveal matching routes or
  explain why no route is available.
- Curated route start, hint, review, feedback, and progress flows work without
  falling back to random generation.
- Checkpoint routes preserve checkpoint markers and ordering.
- `npm.cmd run lint`, `npm.cmd run test`, `npm.cmd run test:map`,
  `npm.cmd run build`, and `git diff --check` pass.

## Known Limitations

- The first pack focuses on the Real London pilot map. More areas are needed for
  broader learner coverage.
- The current beta pack meets the target 5 beginner / 5 intermediate /
  5 advanced split.
- Legal restrictions are enforced only where committed map metadata exposes
  them.
- OSM-derived roads can be split into many short graph segments, so raw segment
  count can overstate learner-facing turn count.
- Roundabout-specific curated routes are intentionally not included yet.
- Automatic generation remains a helper/experimental fallback, not the main
  learner-facing route source.

## Next Suggested Route Areas

- Roundabout introduction routes from a map with reliable roundabout metadata.
- More beginner routes with fewer raw graph segments.
- Additional checkpoint navigation routes in a second Real London area.
- Advanced legal route-choice routes with explicit one-way or turn restriction
  metadata.
- Missed-turn recovery routes with instructor-reviewed route choice notes.
