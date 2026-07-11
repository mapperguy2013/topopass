# Phase 7 Paused State

Stage 7P pauses Phase 7 without marking it complete. The existing Training Mode,
curated-route authoring, route pack, learner page, and dev content-library work
remain in place. No Phase 7 implementation is removed by this pause.

## What Is Working

- `/practice/training` exists as the learner-facing Training Mode entry point.
- Training Mode reuses the shared Route Runner client instead of duplicating map,
  scoring, hint, feedback, review, or progress logic.
- `/dev/training-route` exists for curated route authoring with map-first route
  creation, area/map selection, checkpoints, validation, shortest-route
  comparison, export readiness, and save targets for drafts, review, and
  complete routes.
- Curated route loading is supported through
  `lib/training/curatedLearnerRoutePack.ts`.
- Complete `beta` or `approved` curated routes are preferred for learners before
  the experimental generator fallback.
- The first Real London pilot curated pack is present under
  `data/training-routes/complete/` and currently has 15 learner-facing routes:
  5 beginner, 5 intermediate, and 5 advanced.
- Checkpoint routes are supported as ordered required stops when route metadata
  exports the required checkpoint contract.
- `/dev/library` exists as a dev-only content library for route inventory, map
  registry diagnostics, import validation, archive/restore operations, and
  manifest health reporting.
- Draft and review route JSON files are excluded from learner Training Mode.
- Curated routes for maps that learner Training Mode cannot load are excluded
  with diagnostics instead of appearing as broken route cards.

## What Is Incomplete

- Phase 7 is not complete. The current curated pack is a first beta pack, not a
  finished learner curriculum.
- Curated route coverage needs expansion beyond the initial Real London pilot
  pack, especially across more areas, more exercise types, and stronger
  real-world learner progression.
- Roundabout-specific curated routes are not in the first pack because the
  selected pilot fixture does not provide enough safe roundabout training
  context.
- Automatic route generation is no longer trusted as the primary learner
  experience. It remains available only as a clearly labelled experimental
  fallback or developer/helper path.
- `/dev/library` is conservative and diagnostic. It does not yet provide a full
  map-management workflow, arbitrary map importing, or automatic TypeScript
  manifest editing.
- Map and area management still needs more operational polish before non-core
  contributors can safely add new learner-ready maps without code review.
- Complete-route discovery still depends on the static curated-route manifest in
  `lib/training/curatedLearnerRoutePack.ts`.
- New complete JSON files must still be added to that manifest and picked up by
  the dev/build process before they appear in learner Training Mode.

## Known Bugs And Risks

- Generated routes can still be too weak, repetitive, or poorly matched to
  learner intent on sparse or uneven map fixtures. They must not silently become
  the main learner experience again.
- Some curated routes carry advisory validation warnings. These do not block
  learner visibility, but each route still needs human QA before being promoted
  beyond beta.
- Checkpoint save/export/loading is supported, but route authors must continue
  verifying `checkpointRequirements`, ordered required checkpoint IDs, stop
  metadata, scoring, hints, and review overlays for every checkpoint route.
- Area presets inside a larger map change viewport/bounds only. They must not be
  treated as separate maps unless a distinct loadable map source exists.
- Unsupported, visual-QA-only, or test-only fixtures must stay out of learner
  route authoring and learner Training Mode.
- The full `npm run test:map` command can be slow and has previously stranded
  worker processes on this Windows workspace around the large route-runner map
  batch. Focused map and training suites pass, but the full map-test runner
  should be made more reliable before Phase 7 closure.

## Must Finish Before Phase 7 Completion

- Expand the curated route pack beyond the initial 15-route beta target with
  enough beginner, intermediate, and advanced coverage for a credible learner
  journey.
- Add or validate more real loadable map/area coverage without inventing fake
  maps.
- Finish a repeatable route QA process for complete route promotion, including
  checkpoints, route-choice justification, shortest-route comparison, map
  readability, learner hints, feedback, and review overlays.
- Decide whether the curated-route manifest remains manual or becomes a
  generated/validated manifest.
- Mature `/dev/library` into the intended safe content workflow, or document its
  remaining manual steps clearly enough for route-pack maintenance.
- Keep dev tools out of learner navigation and learner-facing pages.
- Prove `/practice/training` can reliably filter, load, start, score, review,
  and save curated routes by map, area, difficulty, and exercise type.
- Resolve or quarantine the full map-test runner reliability issue so Phase 7
  closure validation can run end to end.
- Re-run lint, training tests, map tests, build/type validation, and
  `git diff --check` cleanly at the final Phase 7 closure point.

## Why Phase 8 Starts While Phase 7 Is Paused

Phase 8 starts because the next useful work is cartographic: improving the Real
London map visual target toward the examination-atlas style. That work can
advance independently while Phase 7 remains paused.

Phase 8 must not claim Phase 7 is complete. It must not remove Phase 7 work,
change route legality, replace learner scoring, hide curated-route gaps, or make
automatic generation the primary learner path. Its purpose is to improve the map
reading surface that future Phase 7 learner routes will depend on.
