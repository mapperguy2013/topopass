# Phase 7 Curated Learner Route Pack

Stage 20 adds the first learner-facing curated route pack for Training Mode.
The pack is stored as complete route exports under
`data/training-routes/complete/` and loaded by
`lib/training/curatedLearnerRoutePack.ts`.

Automatic route generation remains available only as a clearly labelled
experimental fallback. The normal learner-facing Generate action selects from
complete `beta` or `approved` curated routes first.

## Pack Status

- Pack id: `real-london-pilot-route-pack-1`
- Pack version: `2026.07`
- Storage: `data/training-routes/complete/`
- Learner-facing statuses: `beta`, `approved`
- Current status: first-pack routes are `beta` or `approved`
- Source map: `osm-real-london-pilot`
- Source fixture: `realLondonPilotOverpass.json`

## Route Counts

| Difficulty | Count |
| --- | ---: |
| Beginner | 4 |
| Intermediate | 5 |
| Advanced | 5 |

Total learner-facing curated routes: 14.

Checkpoint routes: 3.

## Exercise Type Counts

| Exercise type | Count |
| --- | ---: |
| Follow a planned route | 7 |
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
and destination recognition. The first pack uses three direct Real London pilot
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
- selected difficulty
- selected exercise type
- learner-facing status (`beta` or `approved`)
- complete lifecycle stage

Draft and review exports are excluded from learner Training Mode.

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
- selected difficulty and exercise type matching the learner filters
- start, destination, route geometry, route segment ids, and validation
  segments
- no blocking validation errors

`buildCuratedTrainingRouteVisibilityDiagnostics()` reports how many complete
routes were found, how many are learner-facing, and why any route was excluded.
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

## Validation And Audit

`lib/training/curatedLearnerRoutePack.test.ts` audits the first pack.

The audit checks:

- learner-facing routes load from the complete pack
- draft and review routes are excluded
- required metadata exists
- every learner-facing route validates against the available map data
- there are no blocking validation errors
- checkpoint-required routes include ordered checkpoints
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

## Known Limitations

- The first pack focuses on the Real London pilot map. More areas are needed for
  broader learner coverage.
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
