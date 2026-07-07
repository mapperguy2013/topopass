# Phase 7 Learner Training System

Phase 7 turns the completed Phase 6 London route-runner map into a learner-driver
training system. It adds training domain modules around the existing map,
routing, route review, overlays, and local/Supabase fallback storage. It does
not replace the Phase 6 renderer or change the road hierarchy, label rules,
restriction symbols, route matching, or non-training route review behaviour.

## Existing Phase 6 Boundary

- `lib/map-engine` owns `MapDefinition`, `RouteExercise`, graph construction,
  legal movement checks, shortest legal route calculation, drawn-route snapping,
  route matching, and existing route scoring.
- `app/dev/route-runner/RouteRunnerClient.tsx` owns the current route-runner UI
  shell, canvas interactions, map/exercise selection, and Phase 6 London
  cartography.
- `app/dev/route-runner/routeAttemptReview.ts` turns scoring and pipeline output
  into route review items, correction hints, weak-area classifications, and
  recommended practice queues.
- `app/dev/route-runner/restrictionMapVisuals.ts` and
  `lib/map-engine/restrictionVisuals.ts` derive no-entry, one-way, prohibited
  turn, restricted-road, and route-review symbols from map/review data. They
  remain responsible for collision, zoom, and visual priority behaviour.
- `app/dev/route-runner/routeAttemptStorage.ts` keeps the existing
  Supabase/local fallback pattern for saved reviewed attempts.

Phase 7 references this layer by stable IDs such as `mapId`, road IDs, node IDs,
route segment IDs, route review IDs, saved attempt IDs, and scenario IDs. It
does not store canvas state, map pan/zoom state, label collision state, or road
style tokens in learner progress records.

## Training Mode Overview

Training Mode is exposed through the route-runner map interface and is modelled
by `app/dev/route-runner/learnerTrainingModeUi.ts`.

The learner-facing entry point is now `/practice/training`. The Practice page
shows a Training Mode card that links to this route, and the page reuses
`app/dev/route-runner/RouteRunnerClient.tsx` in student beta mode rather than
duplicating exercise generation, route validation, scoring, hints, feedback, or
progress logic. The development route `/dev/route-runner` remains available for
QA and map-fixture work.

`NEXT_PUBLIC_REAL_LONDON_BETA` is not required to open Training Mode. When the
flag is disabled, `/practice/training` opens with the standard Marlowe practice
map and explains that Real London beta routes are hidden. When the flag is
enabled, the same Training Mode page includes the beta-safe Real London map
catalogue. `/practice/real-london` remains the beta-specific route drawing
practice screen for testers.

The learner flow is:

1. Open Training Mode.
2. Select difficulty and exercise type.
3. Generate a learner exercise from the active map.
4. Follow the planned route, checkpoints, objective, and current instruction.
5. Request progressive hints when needed.
6. Complete the attempt and review score, faults, feedback, and overlays.
7. Save progress locally and use the recommendation for the next exercise.

The UI model includes ARIA labels, a live-region message, keyboard order, focus
targets, mobile layout constraints, touch target minimums, and overlay
readability metadata. The route-runner client can consume those fields without
recalculating the training domain state during map rendering.

## Exercise Generation

`lib/training/learnerExerciseGeneration.ts` generates deterministic route
candidates from the existing map graph. Inputs include difficulty, exercise
type, target bounds, optional length/time constraints, optional max attempts,
and seed.

The generator:

- Builds candidate start/destination pairs from drivable graph nodes.
- Uses the existing shortest legal route search to produce route candidates.
- Validates candidates with the learner route validator.
- Scores candidates against difficulty profile, constraints, and route
  complexity.
- Returns the best valid candidate, or a degraded candidate with advisory
  metadata when strict profile fit is not available.
- Fails gracefully with reason codes when the map does not contain enough route
  context.

The Training Mode wrapper adds a small bounded generation cache keyed by map
identity, graph size, difficulty, exercise type, seed, and attempt limit. This
keeps repeated seeded generation responsive and avoids unnecessary recomputation
without changing route output.

### Difficulty And Variation

`learnerExerciseGeneration.ts` calculates a route complexity score for each
candidate before choosing an exercise. The score uses only project map data:
distance, segment count, road changes, turns, junction decision points,
roundabout exposure where tagged, mapped restriction exposure, route shape,
straightness, repeated roads, and estimated instruction count. If reliable
distance is limited by a fixture, segment count and route geometry still
contribute to the score.

Difficulty profiles now separate the generated routes more clearly:

- Beginner targets short, simple route-following with low complexity, few road
  changes, and no roundabout exposure where the map can detect it.
- Intermediate targets longer routes with more road changes, more turns, and
  more junction decisions while keeping the route manageable.
- Advanced targets noticeably longer multi-decision routes and rejects tiny
  simple candidates when the map contains better alternatives. Advanced can use
  denser networks, one-way or restriction exposure, roundabouts, and complex
  junctions only when those features exist in the map data.

Candidate ranking no longer accepts the first valid simple route. Generation
evaluates multiple start/destination pairs, validates each candidate, scores
the route complexity against the selected difficulty, penalises routes that are
too easy, and exposes up to three candidate option summaries in generation
metadata. Each option includes distance, segment count, turn count, decision
point count, complexity score, a route signature, and skill tags such as
junction planning, roundabout practice, legal route choice, or turn sequencing.

Training Mode records the last few generated route signatures in the local UI
state. Repeated Generate requests pass those signatures back to the generator,
so the same session avoids repeating the same route shape when alternatives are
available. If a map cannot produce a route that satisfies the requested
difficulty, the generator returns the closest valid route as degraded with
reason codes instead of silently labelling a simple route as fully advanced.

## Route Validation Rules

`lib/training/learnerRouteValidation.ts` validates learner routes only against
metadata present in the project.

Blocking rules include:

- Empty routes.
- Unknown roads or nodes.
- Segment endpoints that do not match road geometry.
- Disconnected jumps between route segments.
- Wrong-way travel on roads marked one-way.
- No-entry and closed/restricted-road restrictions where mapped.
- Prohibited turns where restriction records exist.
- Explicitly non-drivable segments such as private, pedestrian-only, cycle-only,
  or restricted roads where access metadata proves it.

Advisory rules include:

- Missing or unknown access metadata.
- Excessive beginner complexity.
- Roundabout complexity.
- Route length or estimated time outside configured bounds.
- Duplicate loops and unnecessary backtracking.

If the map data cannot prove a legal restriction, the validator returns an
unknown/advisory warning instead of inventing an invalid move.

## Scoring Model

`lib/training/learnerAttemptScoring.ts` scores a submitted learner attempt
against the generated route and objectives.

The scoring model evaluates:

- Route adherence.
- Missed checkpoints.
- Wrong turns and recovery.
- Illegal or invalid route segments.
- Unnecessary detours.
- Completion.
- Hints used.
- Time/distance efficiency where available.
- Repeated mistakes and fault severity.

The result includes total score, pass/fail or blocked status, minor faults,
serious faults, dangerous/blocking faults when data supports that distinction,
objective-level scores, route segment annotations, and a summary explanation.
Wrong turns can remain minor when recovered; illegal mapped moves are serious or
blocking.

## Feedback Categories

`lib/training/learnerAttemptFeedback.ts` converts scoring and validation output
into instructor-style learner feedback.

Supported categories are:

- Legal validity.
- Route adherence.
- Observation/planning.
- Junction handling.
- Roundabout handling.
- Recovery.
- Efficiency.
- Hint dependence.

Messages explain what happened, why it matters, where it happened, and one clear
improvement suggestion. Segment-level feedback links messages back to affected
route segment IDs so the review overlay can mark the route without obscuring
Phase 6 map labels.

## Hint Progression

`lib/training/learnerProgressiveHints.ts` generates deterministic progressive
hints from the exercise objective, current instruction, checkpoint, previous
mistakes, difficulty, and prior hint count.

Hint stages progress from:

1. General nudge.
2. Directional clue.
3. Road or junction clue.
4. Specific next action.
5. Reveal route segment or answer.

Beginner exercises start more directly. Advanced exercises begin with lower
specificity. Final hints may reveal the answer; earlier hints avoid exposing
legal/practical constraints unless the hint level allows it. Hint usage is
recorded and penalised by the scoring engine.

## Progress Tracking

`lib/training/learnerProgressTracking.ts` tracks local learner progress through a
small storage adapter that follows the existing browser-storage fallback pattern.
It can be replaced later by a backend adapter without changing the progress
shape.

Tracked fields include completed exercises, scores, fault history, hint usage,
difficulty attempted, pass/fail or completion status, common mistake categories,
recent trend, recommended next difficulty, and recommended next exercise type.

Progression rules:

- Promote difficulty after consistent strong performance.
- Hold difficulty after mixed performance.
- Recommend targeted practice after repeated fault categories.
- Avoid promotion when serious or invalid-route faults are frequent.
- Avoid over-promotion when completions are hint-heavy.
- Handle storage failures safely without blocking Training Mode.

## Scenario Library

`lib/training/learnerScenarioLibrary.ts` contains curated scenario templates for
realistic practice:

- First route-following practice.
- Simple left/right turn sequence.
- Roundabout introduction.
- Missed-turn recovery.
- Choose the legal route.
- Junction planning.
- Checkpoint navigation.
- Route review challenge.
- Advanced dense-network navigation.

Each template defines exercise type, target difficulty, objective text,
generation constraints, scoring emphasis, hint style, feedback emphasis, and
tags. The generator instantiates templates through `generateLearnerScenarioExercise`
and still validates the generated route before returning it.

To add a scenario:

1. Add a stable ID to `LEARNER_SCENARIO_TEMPLATE_IDS`.
2. Add a `LearnerScenarioTemplate` with target difficulty, exercise type,
   objective category, generation constraints, scoring emphasis, hint style, and
   feedback emphasis.
3. Keep constraints realistic for the target map and difficulty.
4. Add or update tests in `learnerScenarioLibrary.test.ts` for template
   validity, graceful generation, expected difficulty, scoring emphasis, and hint
   style.
5. Run `npm run test:training` and the full validation suite.

## Map Data Limitations

Phase 7 does not invent legal restrictions. It can only validate what the map
metadata exposes.

Known limitations:

- Missing access tags are advisory, not invalid.
- A road without one-way metadata is treated as unknown/two-way rather than
  illegal in one direction.
- Turn restrictions require explicit restriction records.
- Private, pedestrian-only, cycle-only, and restricted segments are invalid only
  when access metadata proves them.
- Practical learner suitability is heuristic and based on graph complexity,
  route length, time estimate, repeated roads, junction count, and roundabout
  detection.
- Difficulty and variation depend on the roads, restrictions, roundabouts,
  junction density, and metadata present in the committed map fixture. Sparse
  maps may return degraded advanced exercises rather than inventing complex
  legal constraints.
- Dense London map fixtures are curated project data, not live authoritative
  legal guidance.

## Phase 6 Visual Protection

Training Mode overlays are additive. Planned routes, attempted routes, fault
markers, hint markers, and segment feedback use the existing Phase 6 overlay
tokens and review-marker priority. The Training Mode model explicitly records
that overlays preserve Phase 6 labels, use route halos, use marker halos, and
keep detailed text in the panel instead of in large map labels.

Regression tests protect:

- Phase 6 map controls still present.
- Mobile map controls and primary training actions remain available.
- Route/checkpoint/fault overlays align with route segments.
- Existing route review tests still pass.
- Map zoom, pan, restriction overlays, road hierarchy, labels, and review
  markers continue through the existing map test suite.

## Final Review

The final Phase 7 review covered:

- Map rendering: protected by the Phase 6 route-runner, synthetic renderer,
  visual semantics, restriction overlay, zoom/pan, and mobile QA tests.
- Route review: existing non-training route review tests and learner attempt
  overlay tests pass together.
- Training Mode: generation, selection, hints, review, progress, failure states,
  accessibility metadata, and mobile model tests pass.
- Mobile layout: tests verify no hidden primary actions, 44 px minimum touch
  targets, below-map panel placement, layout-shift guard metadata, and Phase 6
  control preservation.
- Generated exercise: deterministic seeded generation and validator integration
  tests pass.
- Scored learner attempt: perfect, wrong-turn recovery, missed checkpoint,
  illegal segment, detour, hint penalty, incomplete attempt, and severity
  ordering tests pass.
- Feedback and hints: all feedback categories, serious-fault priority,
  non-duplicate messages, hint progression, difficulty-aware hints, and final
  reveal behaviour pass.
- Progress summary: local storage, promotion, no-promotion on serious faults,
  targeted practice, hint-heavy attempts, and storage failure handling pass.

No pixel-perfect visual regression test was added because the project does not
currently use screenshot or pixel regression testing for this route-runner
surface.

## Manual Training Mode Check

To open Training Mode locally:

1. Run `npm run dev`.
2. Visit `/practice`.
3. Select the Training Mode card, or go directly to `/practice/training`.
4. Open the Training Mode panel in the map surface.
5. Confirm the Difficulty selector, Exercise type selector, Generate exercise
   button, Hint button, review action, route overlays, checkpoints, feedback,
   and progress summary are available.
6. On a phone-width viewport, confirm the Practice entry card has usable touch
   targets and the route-runner controls remain below or around the map without
   covering important labels.

To include Real London beta maps locally, start the app with
`NEXT_PUBLIC_REAL_LONDON_BETA=1` and repeat the same flow. Without the flag, the
Training Mode route should still work on the Marlowe practice map and should not
show a broken Real London link.

## Validation Commands

Run the focused Phase 7 tests:

```powershell
npm run test:training
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test app/dev/route-runner/learnerTrainingModeUi.test.ts
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test app/practice/training/learnerTrainingPractice.test.ts
```

Run the full validation suite:

```powershell
npm run lint
npm run test:map
npm test
npm run build
git diff --check
```

There is no separate `typecheck` script in `package.json`; `npm run build`
performs Next.js lint/type validation before page generation.
