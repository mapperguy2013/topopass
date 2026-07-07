# Phase 7 Learner Training Domain Model

Phase 7 adds learner-driver training concepts around the completed Phase 6 map
system. It does not replace the current map, route matching, route review, or
overlay rendering pipeline.

## Existing Phase 6 Architecture

- `lib/map-engine` owns the map and routing primitives: `MapDefinition`,
  `RouteExercise`, graph construction, legal movement checks, shortest legal
  route calculation, drawn-route snapping, route matching, and scoring.
- `app/dev/route-runner/RouteRunnerClient.tsx` owns the current route-runner UI
  shell and canvas interactions. It chooses maps/exercises, runs the drawn route
  pipeline, and renders the Phase 6 London cartography.
- `app/dev/route-runner/routeAttemptReview.ts` turns scoring and pipeline output
  into learner-facing review items, hints, weak-area classifications, and
  recommended practice queues.
- `app/dev/route-runner/restrictionMapVisuals.ts` and
  `lib/map-engine/restrictionVisuals.ts` derive no-entry, one-way, prohibited
  turn, restricted-road, and route-review overlay symbols from map/review data.
  These modules remain presentation-focused and own collision, zoom, and visual
  priority behaviour.
- `app/dev/route-runner/routeAttemptStorage.ts` stores reviewed attempts in the
  existing Supabase/local fallback shape, including score, review payload,
  violations, hints, recommendations, matched route metadata, and per-leg data.

## Phase 7 Domain Boundary

The learner-driver training model lives in `lib/training`. It introduces typed
records for `LearnerExercise`, route-leg and instruction objectives, attempts,
attempt events, scores, driving faults, hints, progress, and instructor
feedback.

The model references Phase 6 concepts by stable IDs such as `mapId`,
`routeExerciseId`, road IDs, node IDs, route review item IDs, and saved route
attempt IDs. It intentionally does not store canvas state, generated overlay
geometry, zoom state, or label/collision decisions. That keeps Phase 6 map
visuals, mobile behaviour, road hierarchy, labels, overlays, readability, and
route review behaviour unchanged while giving Phase 7 a typed place to model
training workflows.

Future Phase 7 modules can adapt existing `RouteExercise`, `RouteAttemptReview`,
adaptive practice, and saved-attempt records into these learner-training
records. UI work should consume the domain model through adapters instead of
adding training state directly to the map renderer.
