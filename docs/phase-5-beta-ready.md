# Phase 5 Beta-Ready Implementation Summary

This document preserves the detailed Stage 49-140 implementation history that was previously in the main README. The README now keeps the current setup, beta status, validation, and operational notes concise.

Phase 5 ended with the Real London beta marked beta-ready, not final-production-ready. The beta remains behind `NEXT_PUBLIC_REAL_LONDON_BETA`, uses only committed local OSM fixtures, keeps Marlowe as the default map, and preserves the internal/dev review tooling gates.

## Stage 49 Map Engine Architecture

- Added a shared TypeScript domain model for custom fictional maps.
- Added map nodes, roads, directed edges, restrictions, landmarks, route
  exercises, route attempts, and route score result types.
- Added directed edge generation from one-way and two-way roads.
- Added lightweight map and route exercise validation.
- Added a tiny fictional map fixture and tests.
- No UI, drawing, scoring, routefinding, OSM import, Google, Mapbox, or
  real-world map data was added.

## Stage 50 Fake Development Map Fixture

- Added Marlowe District as the canonical fake development map for route-engine
  tests.
- The fixture is fictional and does not use real map, OSM, Google, Mapbox, OS,
  or A-Z data.
- It includes 24 junctions, 38 roads, one-way roads, explicit no-entry rules,
  prohibited turns, landmarks, and route exercises.
- It is designed for controlled route-engine development only.
- No UI, drawing, scoring, routefinding, snapping, renderer, or import logic was
  added.

## Stage 51 Graph Builder

- Added a routing-ready graph builder for the custom map engine.
- Converts roads into directed edges using the existing directed-edge helper.
- Two-way roads become two directed edges; one-way roads become one directed
  edge.
- Adds graph indexes for nodes, roads, edges, outgoing edges, and incoming
  edges.
- Validates map definitions before graph construction and throws on invalid
  references.
- Added tests for the tiny fixture, Marlowe District fixture, and invalid map
  rejection.
- No UI, drawing, snapping, scoring, routefinding, renderer, or backend changes
  were added.

## Stage 51.5 Shortest Legal Route Engine

- Added a pure Dijkstra-based shortest route engine for the custom map engine.
- Calculates the shortest valid route between two map nodes by distance in
  metres.
- Uses the Stage 51 directed graph indexes and outgoing-edge lookup.
- Respects one-way roads through the graph's directed edges.
- Supports no-entry restrictions by blocking matching directed movements.
- Supports prohibited-turn restrictions with transition-aware search state that
  tracks the previous edge.
- Returns route distance, edge sequence, road sequence, and node sequence.
- Handles invalid start/end nodes, no-route cases, and zero-distance routes.
- No UI, drawing, snapping, scoring, Supabase, backend, deployment, or website
  page changes were added.

## Stage 52 Legal Movement Graph

- Added a legal movement graph for the custom map engine.
- One-way roads, no-entry restrictions, and prohibited turns are represented as
  legal directed movements and transitions.
- No-entry restrictions remove only blocked directed edges, unless the
  restriction is road-wide.
- Prohibited turns block only the matching transition at the relevant node.
- Added helpers for legal outgoing movements from a node, legal next movements
  after an edge, and legal movements from a current position.
- Added validation for no-entry endpoint references and prohibited-turn
  connectivity.
- Added tests for one-way, no-entry, prohibited-turn, position validation, and
  Marlowe District fixture behaviour.
- No UI, drawing, snapping, scoring, shortest-path routing, renderer, Supabase,
  or deployment code was added.

## Stage 53 Legality Engine

- Added a dedicated route-attempt legality checker for the custom map engine.
- Checks attempted road movements against the map definition and reports exact
  illegal movement reasons.
- Detects wrong-way one-way use, no-entry movements, prohibited turns, immediate
  U-turns, disconnected road jumps, unknown roads, and unknown nodes.
- Includes the reserved `off_road` illegal movement type for later snapped
  geometry checks without faking geometric detection now.
- Any illegal movement returns `automaticFail: true`; legal movement lists return
  `isLegal: true`.
- Added deterministic tests for legal movement, each illegal movement type,
  multiple violations, and unknown movement references.
- No UI, drawing, snapping, scoring integration, Supabase, backend, deployment,
  or website page changes were added.

## Stage 54 Route Comparison / Efficiency & Scoring Engine

- Added a pure route scoring engine for custom map-engine route attempts.
- Scores legal user routes as `shortestLegalRouteDistance / userRouteDistance`.
- Uses Stage 53 legality checks so illegal movements automatically fail.
- Uses Stage 51.5 shortest legal route calculation rather than hardcoded
  shortest distances.
- Calculates user route distance from attempted road movements and map road
  distances.
- Scores ordered required-stop routes using `requiredStopNodeIds`, so A to B
  must start at A and end at B, and A to B to C to D must visit B, C, and D in
  order.
- Calculates multi-stop shortest legal distance as the sum of each required
  shortest leg, such as A to B plus B to C plus C to D.
- Fails wrong starts, wrong destinations, missing required stops, and stops
  visited out of order.
- Applies the 80% pass threshold; exactly 80% passes and anything below fails.
- Safely handles zero or invalid route distances without divide-by-zero.
- Added tests for exact shortest routes, efficient and inefficient routes,
  threshold boundaries, ordered required stops, multi-stop shortest leg sums,
  illegal route auto-fail, disconnected jumps, and Marlowe no-entry/prohibited
  turn failures.
- No UI, drawing, snapping integration, Supabase, backend, deployment, or real
  map data changes were added.

## Stage 54.5 Route Comparison / Efficiency Scoring Checkpoint

- Confirmed the scoring engine supports ordered required stops.
- A route from A to B must start at A and end at B.
- Multi-stop routes such as A to B to C to D must visit B, C, and D in order.
- Required stops visited out of order do not count, and missing intermediate
  stops fail deterministically.
- Multi-stop shortest legal distance is calculated as the sum of each shortest
  legal leg, while the user route distance remains the full attempted movement
  distance.
- Added tests for wrong starts, wrong destinations, missing intermediate stops,
  out-of-order stops, ordered-stop passes, and multi-stop shortest-leg sums.
- No UI, drawing, snapping, Supabase, backend, deployment, or real map data work
  was added.

## Stage 55 Route Attempt Normalisation / Exercise Runner

- Added a pure exercise runner that bridges route exercises and the map-engine
  scoring stack.
- Accepts a map, a route exercise list, an exercise ID, and a deterministic
  manual user route made from node IDs and/or road IDs.
- Resolves exercise landmark stops to required route node IDs.
- Normalises user route selections into selected nodes, selected roads, directed
  edge IDs where available, and attempted road movements.
- Validates unknown exercises, landmarks, nodes, roads, disconnected node
  sequences, and disconnected road sequences with clear deterministic errors.
- Reuses the existing scoring engine, which in turn reuses legality checks and
  shortest legal route calculation.
- Keeps the future drawing flow clean: drawn route to snapped route to node/road
  sequence to normalised route attempt to scoring.
- Added tests for Marlowe District end-to-end execution, route normalisation
  errors, wrong starts, missed/out-of-order destinations, illegal movement
  pass-through, and longer-than-shortest legal scoring.
- No UI, hand-drawn snapping, external routing, real map data, Supabase,
  backend, or deployment work was added.

## Stage 56 Route Exercise Developer Runner UI

- Added a developer/debug page at `/dev/route-runner`.
- The page uses the fictional Marlowe District fixture and the Stage 55
  `runRouteExercise` API inside the app.
- It lets a developer choose a route exercise, inspect the start and required
  stop landmarks, enter manual comma-separated node IDs and road IDs, then run
  the attempt.
- The result panel shows the normalised attempt and scoring result as readable
  JSON, including selected nodes, selected roads, directed edge IDs, score,
  pass/fail status, and failure reasons.
- Added a small parser helper for comma-separated route IDs and unit tests for
  whitespace, empty input, and duplicate comma handling.
- This is not the final drawing or snapping layer. The intended future flow is:
  drawing UI to snapped node/road sequence to Stage 55 runner to score.
- No real maps, external routing, Supabase, backend, auth, scoring-engine
  changes, or production navigation changes were added.

## Stage 57 Draft Route Selection State

- Added a pure TypeScript state utility for in-progress route exercise drafts.
- The draft state tracks a selected exercise ID plus ordered draft node IDs and
  road IDs.
- Helper actions create an empty state, select or clear an exercise, add/remove
  nodes, clear nodes, add/remove roads, clear roads, and clear the draft route.
- All helpers are pure and immutable, preserve insertion order, and allow
  repeated node or road IDs for routes that revisit the same place or road.
- Changing to a different exercise clears existing draft selections so stale
  route attempts are not carried across exercises; re-selecting the same
  exercise preserves the current draft.
- Derived helpers convert the draft into the Stage 55 `UserRouteSelectionInput`
  shape and into a runnable `{ exerciseId, selection }` draft only when an
  exercise is selected.
- Added tests for empty state, exercise switching, repeated IDs, safe no-op
  removals/clears, node and road independence, derived route selections, and
  defensive array copies.
- No UI, drawing, snapping, real map data, external routing, Supabase, backend,
  scoring, legality, shortest-route, or route-runner behavior changes were
  added.

## Stage 58 Route Draft Validation / Attempt Preview

- Added a pure frontend-safe draft validation and preview helper for route
  exercise attempts.
- The validator checks whether the selected exercise exists, whether the draft
  route is empty, whether selected node and road IDs are known, whether selected
  nodes or roads form connected movements, and whether the draft starts at the
  required start.
- The preview reports selected nodes, selected roads, the current node, required
  stop node IDs, required-stop progress, the next required stop, destination
  status, and selected-route distance.
- Required stops are checked in order, so skipped or out-of-order stops are
  surfaced before a draft is submitted.
- Complete structurally valid drafts are marked ready to submit and include the
  Stage 55 normalised attempt generated through `runRouteExercise`.
- Added `canSubmitDraftRoute` as a small convenience helper for UI code.
- Added tests for unknown exercises, empty drafts, unknown node/road IDs,
  disconnected routes, wrong starts, missing destinations, missed required
  stops, out-of-order stops, ready-to-submit drafts, defensive preview copies,
  and submit readiness.
- No drawing UI, snapping, real map data, external routing, Supabase, backend,
  scoring formula, legality, shortest-route, or route-runner behavior changes
  were added.

## Stage 59 Manual Route Input UI

- Extended the `/dev/route-runner` developer page so manual node/road route
  attempts show a clearer route-engine result summary.
- The result panel now separates pass/fail status, score percentage, shortest
  legal distance, user route distance, extra distance, failure reasons,
  violations, normalised node and road sequences, attempted movements, and raw
  JSON for debugging.
- Manual route scoring still flows through the existing Stage 55
  `runRouteExercise` API.
- No drawing-based scoring, route matching, backend, storage, analytics, or
  scoring/legality changes were added.

## Stage 60 Drawing Capture Foundation

- Added a pure drawn-route trace utility for raw route drawing state.
- Added browser canvas drawing support to `/dev/route-runner` using pointer
  events so mouse, touch, and stylus share the same capture path where the
  browser supports it.
- Captured drawn points are stored in map coordinates with screen-to-map and
  map-to-screen conversion helpers.
- Added clear/reset handling and simple trace simplification helpers.
- The drawn trace is a preview-only development input and is not submitted to
  route scoring.

## Stage 61 Geometry and Spatial Index Foundation

- Added map-engine geometry helpers for point-to-segment projection,
  point-to-polyline projection, point-to-road-centreline distance, polyline
  length, heading calculation, bounding boxes, trace simplification, and road
  candidate lookup.
- Added a lightweight deterministic road spatial index based on expanded road
  bounding boxes, which is sufficient for the fictional Marlowe District
  fixture.
- Added tests for horizontal, vertical, diagonal, and polyline projection,
  heading/distance calculations, bounding boxes, trace simplification, and
  Marlowe road candidate lookup.
- No external routing dependency, real map import, OSM import, or route
  matching was added.

## Stage 62 Basic Route Snapping

- Added a basic snapping module that converts raw drawn points into snapped road
  candidates for the fake map-engine data.
- Snapped points include original point, snapped point, road ID when in
  tolerance, optional directed edge ID, distance from road, confidence, and
  candidate matches.
- Off-road points are diagnosed, repeated points are safe, very short traces
  return a clear diagnostic, and results are deterministic.
- `/dev/route-runner` shows a snap preview over the canvas, but snapped traces
  are not converted into route attempts or scored yet.
- Stage 63 route matching, drawn-route scoring, replay, production feedback UI,
  persistence, analytics, and real map imports remain intentionally deferred.

## Stage 63 Core Route Matching Engine

- Added a pure deterministic route matcher that consumes Stage 62 snapped route
  points and prepares an ordered route selection for the existing route exercise
  pipeline.
- The matcher collapses consecutive duplicate road IDs while preserving
  non-consecutive repeats, infers transition nodes for connected road chains,
  and returns ordered road IDs, transition node IDs, node IDs, directed edge IDs
  where legal, attempted movements, and a `UserRouteSelectionInput`.
- Empty and insufficient snapped inputs return stable non-throwing statuses.
- Unknown roads, unmatched points, disconnected road sequences, ambiguous
  transitions, and unresolved or wrong-way directed edges are reported through
  deterministic diagnostics.
- Marlowe District fixture tests confirm a matched snapped route can be passed
  into the existing `runRouteExercise` flow without changing scoring.
- Stage 63 does not implement advanced HMM/probabilistic map matching, new
  snapping, drawn-route scoring, production UI, backend persistence, analytics,
  London/OSM imports, or changes to scoring, legality, shortest-route, fixtures,
  or route-runner behavior.

## Stage 63.5 Drawn Route Matching Pipeline

- Added a pure dev-only drawn route pipeline that connects raw drawn traces,
  conservative trace simplification, Stage 62 snapping, Stage 63 route matching,
  and the existing Stage 55 `runRouteExercise` scorer.
- The pipeline returns stable statuses for empty, insufficient, snapping-failed,
  matching-failed, exercise-failed, and scored drawn attempts without throwing
  for expected in-progress drawing states.
- `/dev/route-runner` now shows a drawn route pipeline panel with simplified
  point count, snapped point count, matched road IDs, matched node IDs, directed
  edge IDs, matcher/pipeline warnings, and exercise scoring output when a drawn
  route is scoreable.
- Tests cover clean Marlowe drawn routes, disconnected drawn routes, wrong-way
  one-way routes, prohibited-turn routes, duplicate road collapse, and
  compatibility with the existing manual route runner flow.
- Stage 63.5 remains deterministic and development-only. It does not add
  advanced HMM/probabilistic map matching, new snapping, real London/OSM map
  imports, backend persistence, analytics, production drawing UI, or changes to
  scoring, legality, shortest-route, fixture, or runner algorithms.

## Stage 64 Drawn Route UX Hardening

- Hardened the `/dev/route-runner` drawn-route experience with clearer drawing
  instructions, active drawing state, selected-exercise attempt status, reset
  behaviour, stage badges, and grouped warning/scoring notes.
- The dev canvas now overlays raw drawing, snapped preview points, matched
  route movements, matched nodes, ordered stops, movement arrows, and unresolved
  direction highlights for debugging.
- Clearing the drawing resets the raw trace, simplified trace, snapped result,
  matched result, warning display, score output, overlays, and status badges
  through the existing derived pipeline state.
- Starting a new drawing hides stale drawn-route score output until the pointer
  is released, and changing the selected exercise resets the drawn attempt.
- Added pure display-helper tests for drawn pipeline statuses, stage badges,
  and human-readable warning/scoring messages.
- Stage 64 does not add new route intelligence, scoring integration changes,
  matcher changes, backend persistence, analytics, production drawing UI,
  London/OSM imports, or Supabase/auth work.

## Stage 64.5 Drawn Route Scoring Integration

- Completed the first end-to-end development browser flow for drawn route
  attempts: select an exercise, draw a route, simplify the trace, snap it,
  match roads/nodes/directed edges, run `runRouteExercise`, and show the score.
- The `/dev/route-runner` drawn result panel now clearly distinguishes routes
  blocked before scoring, routes scored and failed, and routes scored and
  passed.
- The score display shows pass/fail status, score percentage, shortest legal
  distance, user route distance, extra distance, failure reasons, illegal
  movement violations, and ordered required-stop progress.
- Multi-stop exercises show each ordered start/checkpoint/destination node as
  visited or missing/out of order using the existing exercise/scoring result.
- Tests cover clean drawn route scoring, long legal drawn routes failing below
  the pass mark, illegal drawn routes failing automatically, multi-stop
  required-stop output, blocked pre-scoring routes, stale-score hiding while
  drawing, and manual route-runner compatibility.
- Stage 64.5 does not add advanced matcher improvements, new routing
  intelligence, production storage, analytics, London/OSM imports, backend
  changes, Supabase changes, or auth changes.

## Stage 65 Connectivity-Aware Candidate Matching

- Improved drawn-route snapping candidate selection so nearby road candidates
  are evaluated as a connected sequence instead of choosing each point's
  nearest road independently.
- Snapping now strongly penalizes transitions between roads that do not share
  a real map node, while still preferring same-road continuity and connected
  road changes at junctions.
- Snapping results include selected-candidate flags, candidate counts,
  collapsed road IDs, total path cost, and disconnected transition diagnostics
  for dev-route-runner debugging.
- This reduces road flicker such as disconnected road jumps inside an otherwise
  clean drawn trace before the Stage 63 matcher validates the final sequence.
- Genuine disconnected drawings are still left disconnected and remain blocked
  by the existing matcher before scoring.
- Stage 65 does not change scoring, legality, shortest-route behavior,
  production UI, backend persistence, London/OSM imports, or real map data.

## Stage 66 Restriction / No-Entry Visual Overlay

- Added dev-route-runner road restriction overlays so existing map-engine
  one-way, no-entry, and road-closed restrictions are visible before drawing.
- The `/dev/route-runner` canvas now draws red barred no-entry markings, amber
  restricted-road markings, and blue one-way arrowheads using the existing
  Marlowe District fixture data.
- Added a pure `buildRoadRestrictionOverlays` display helper with deterministic
  tests for one-way, no-entry, road-closed, and turn-only restriction handling.
- Stage 66 focused on road-level overlays; the later Stage 68 section documents
  the separate turn-level junction overlay.
- Stage 66 is visual-only and does not change scoring, legality,
  shortest-route behavior, snapping, matching, fixtures, backend persistence,
  or exercise semantics.

## Stage 66.5 Route Runner Overlay UX + Legal Fixture Path Fix

- Stabilised the `/dev/route-runner` drawing area so status changes, drawing
  start/end messages, and clear-button layout do not shift the canvas viewport.
- Road-level restriction overlays now keep symbol markers on the canvas but no
  longer paint long `No entry...` labels directly over the map.
- Updated the Marlowe District fixture with a minimal road-direction adjustment
  so the current `Fox Lane Station to Northgate Hospital` dev exercise has at
  least one fully legal route.
- Added route-runner tests proving the station-to-hospital exercise has a
  shortest legal route, the known legal route passes, and an intentional
  no-entry attempt still fails.
- Stage 66.5 does not change scoring, legality, shortest-route behavior,
  snapping, matching, backend persistence, or exercise-runner semantics.

## Stage 67 Illegal Route Feedback Overlay

- Added dev-route-runner failure overlays that highlight illegal or broken
  parts of a drawn route after snapping, matching, and scoring.
- The `/dev/route-runner` canvas now marks wrong-way, no-entry, prohibited
  turn, U-turn, illegal movement, and disconnected-road transition diagnostics
  from the existing pipeline/scoring result with symbol-only highlights.
- Road-level route issues take precedence in the visual language: no-entry and
  one-way violations are shown as road-level issues instead of duplicating them
  with turn-restriction signs.
- Route-issue red line semantics are consistent: solid red marks an illegal or
  blocked route section, while dashed red marks a disconnected snapped
  transition.
- Passing routes do not show route-issue overlays, keeping successful attempts
  visually clean.
- Added a compact route-issue message panel so the visible marker has a
  readable explanation without requiring raw JSON diagnostics or inline canvas
  text labels.
- Stage 67 is display-only and does not change scoring, legality,
  shortest-route behavior, snapping, matching, fixtures, backend persistence,
  or exercise semantics.

## Stage 68 Turn-Level Restriction Visuals

- Added pure map-engine turn restriction visuals for existing
  `prohibited_turn` fixture restrictions.
- Each visual includes the blocked `fromRoadId`, `toRoadId`, `viaNodeId`,
  junction coordinate, incoming road coordinate, outgoing road coordinate, and
  deterministic marker angles for UI rendering.
- The `/dev/route-runner` canvas now shows banned turn movements as compact
  no-left-turn, no-right-turn, or no-U-turn signs on the incoming approach road
  before the restricted junction, distinct from road-level no-entry/one-way
  restriction overlays and without painting turn-pair IDs on the map.
- Turn signs are only shown for genuine transition-level bans where both road
  directions are otherwise usable; redundant turns into no-entry, one-way, or
  closed road movements and visually straight movements are suppressed from the
  default canvas overlay.
- Turn sign type is geometry-derived from the incoming approach vector and
  outgoing road vector using the screen-coordinate signed angle; because SVG
  and canvas coordinates increase downward on the y-axis, a positive signed
  angle is a right turn and a negative signed angle is a left turn.
- Turn signs use driver-relative geometry classification with screen-upright
  sign faces; the red border, red slash, and internal black turn arrow are
  drawn upright in screen coordinates instead of being angled with the road.
  For mostly downward approaches, the displayed no-left/no-right glyph is
  swapped to match the driver's screen direction while the semantic restriction
  remains unchanged.
- Added dev checkboxes for `Show road restrictions` and
  `Show turn restrictions`; both default on for debugging and only affect the
  visual overlay.
- Stage 68 is visual/debug-only and does not change scoring, legality,
  shortest-route behavior, snapping, matching, fixtures, backend persistence,
  or exercise semantics.

## Stage 69 Illegal Drawn Movement Highlighting

- Added a pure map-engine illegal movement highlighting helper that converts
  scored legality failures into deterministic post-attempt route highlights.
- The helper groups failures by attempted movement and applies visual priority:
  restricted or closed road, no-entry road, wrong-way one-way movement, then
  explicit prohibited turn. This prevents duplicate no-entry plus no-turn
  warnings for the same drawn movement.
- The `/dev/route-runner` canvas keeps the normal drawn and snapped route
  visible underneath, then uses a stronger red overlay only for the offending
  movement after scoring. Road-level violations highlight the affected road
  movement; prohibited turns use a local transition marker instead of repainting
  whole roads.
- Stage 69 is post-attempt diagnostic display only and does not change scoring,
  legality, shortest-route behavior, snapping, matching, fixtures, backend
  persistence, or exercise semantics.

## Stage 70 Route Attempt Review Panel

- Added a pure route attempt review helper for `/dev/route-runner` that turns
  scored route results and Stage 69 illegal movement highlights into
  student-friendly pass/fail, score, distance, illegal movement, route
  requirement, and suggested failure reason copy.
- The review panel shows the student's route distance, shortest legal route
  distance, extra distance, illegal movement list, missed route requirements,
  and a plain-English likely failure reason.
- The dev route runner now shows a written post-attempt review alongside the
  existing score panel, visible issue overlays, and raw debug JSON.
- Stage 70 is display-only and does not change scoring, legality, shortest-route
  behavior, snapping, matching, fixtures, backend persistence, route drawing, or
  exercise semantics.

## Stage 71 Student-Friendly Correction Hints

- Added a pure correction-hint helper for `/dev/route-runner` that turns the
  Stage 70 review result into short learner-facing next-step guidance.
- Hints explain common outcomes such as prohibited turns, no-entry roads,
  wrong-way one-way use, missed checkpoints, wrong destinations, disconnected
  matched routes, and legal routes that are too long.
- The route runner review panel now shows a compact "Try next" section after a
  drawn route is reviewed, while keeping the existing raw diagnostics available
  for development.
- Stage 71 is display/review formatting only and does not change scoring,
  legality, shortest-route behavior, snapping, matching, fixtures, backend
  persistence, route drawing, or exercise semantics.

## Stage 72 Adaptive Practice Recommendations

- Added a pure adaptive recommendation helper for `/dev/route-runner` that
  turns the existing route attempt review and Stage 71 correction hints into
  stable learner-facing practice focus cards.
- Recommendations identify weak areas such as prohibited turns, no-entry roads,
  wrong-way one-way use, restricted roads, wrong starts, wrong destinations,
  missed checkpoints, disconnected or insufficient drawings, and legal routes
  that are too long.
- Each recommendation has a stable id, title, explanation, practice focus, and
  high/medium/low priority. Illegal and route-validity problems are high
  priority, while inefficient legal routes are medium or low depending on the
  score.
- The route runner review panel now shows a compact "Recommended practice"
  section after the "Try next" hints.
- Stage 72 is review/UI-layer only and does not change scoring, legality,
  shortest-route behavior, snapping, matching, fixtures, backend persistence,
  restriction classification, route drawing, or exercise semantics.

## Stage 73 Adaptive Practice Queue

- Added a pure recommended-practice queue helper for `/dev/route-runner` that
  converts Stage 72 recommendations into learner-facing next-practice items.
- Queue items include a stable id, title, reason, weakness type, priority, and
  an optional future suggested exercise id field so targeted practice launches
  can be wired in later without changing the review data shape.
- The route runner now shows a "Recommended next practice" panel after a
  submitted attempt, sorted by priority with high-priority route validity and
  illegal movement issues first.
- The panel includes an empty state for attempts that produce no targeted queue
  items: "Great work - no targeted practice needed from this attempt."
- Stage 73 is review/UI-layer only and does not change scoring, legality,
  shortest-route behavior, snapping, matching, fixtures, backend persistence,
  restriction classification, map-engine logic, route drawing, or exercise
  semantics.

## Stage 74 Persistent Learner Weak-Area Profile

- Added pure helpers that extract weak-area counters from an existing route
  attempt review and merge them into an accumulated learner weak-area profile.
- The profile tracks repeated no-entry, one-way, prohibited-turn, restricted
  road, wrong-start, wrong-destination, missed-checkpoint, disconnected drawing,
  insufficient drawing, and inefficient-route signals across reviewed attempts.
- The `/dev/route-runner` now keeps this profile in browser-local storage and
  shows a dev-only "Weak areas profile" panel with the strongest categories,
  attempt counts, total tracked signals, and a recommended next practice focus.
- The profile can be reset from the dev UI and remains local-only. No backend
  persistence, analytics storage, scoring, legality, snapping, matching,
  routefinding, fixture, restriction classification, or exercise semantics were
  changed.

## Stage 75 Route Attempt History

- Added pure in-session attempt history helpers for `/dev/route-runner` that
  convert completed route attempt reviews into compact saved summaries.
- The dev route runner now appends a history item after each submitted drawn
  route and keeps the latest attempt selected automatically.
- The review area shows an "Attempt history" panel with attempt number,
  pass/fail/blocked status, score, student route distance, extra distance,
  illegal movement count, missed restriction count, and the primary failure
  reason when available.
- Selecting an earlier attempt shows its saved review summary without
  recalculating scoring or changing the current route result.
- Stage 75 is review/UI-layer only and does not change scoring, legality,
  shortest-route behavior, snapping, matching, fixtures, backend persistence,
  restriction classification, route drawing, or exercise semantics.

## Stage 76.5 Attempt Storage

- Added a Supabase `route_attempts` table migration for completed
  `/dev/route-runner` attempt reviews, including score, pass/fail status,
  failure reason, distance metrics, violations, missed restrictions, correction
  hints, practice recommendations, matched route JSON, full review payload, and
  review schema version.
- Added an isolated route-attempt storage helper that maps the existing
  `RouteAttemptReview` plus already-computed scoring/matching output into the
  database row shape. The pure review builder remains Supabase-free.
- The dev route runner now attempts to save a completed drawn route review after
  feedback has been generated. Saving is non-blocking: failed or unavailable
  Supabase persistence shows a small warning while the review remains visible.
- Stage 76.5 stores attempt results only. It does not change scoring, legality,
  shortest-route behavior, snapping, matching, fixtures, backend scoring,
  restriction classification, route drawing, review semantics, teacher
  dashboards, or history browsing.

## Stage 76.6 Attempt History UI

- Added a Supabase read helper for saved `/dev/route-runner` attempts. It maps
  stored rows into learner-facing list items and queries attempts newest first,
  with optional exercise filtering and a safe development fallback for nullable
  user IDs.
- Added a saved attempt history panel to the route runner review area. The panel
  handles loading, empty, error, saved-list, refresh, and read-only review-detail
  states, and refreshes automatically after a new drawn route attempt is saved.
- Stage 76.6 is display/readback only. It does not replay routes or change
  scoring, legality, shortest-route behavior, snapping, matching, fixtures,
  backend scoring, restriction classification, or exercise semantics.

## Stage 77 Adaptive Practice Queue

- Added a pure adaptive practice queue builder for `/dev/route-runner`. It
  combines the latest route review, the local weak-area profile, in-session
  attempt-history insights, saved attempt summaries, and available development
  exercises into one ranked practice queue.
- Queue items include a stable id, item type, title, explanation, practice
  focus, urgent/high/medium/low priority, numeric score, reasons, related weak
  areas, related exercise ids, and source-signal flags for latest review,
  weak-area profile, attempt history, and saved attempts.
- The builder prioritises repeated mistakes, latest failed-route signals,
  legality-critical restrictions, declining attempts, saved repeated failures,
  and links to available route exercises. It also handles empty or malformed
  saved attempt data safely and keeps ordering deterministic.
- The route runner now shows a dev-friendly "Adaptive practice queue" panel
  with the primary focus, confidence level, source signals used, ranked queue
  items, practice focus, reasons, and related exercise ids.
- Stage 77 does not change scoring, legality, snapping, matching,
  shortest-route behavior, fixtures, backend schema, road restrictions,
  restriction classification, exercise semantics, or attempt storage schema.

## Stage 78 Adaptive Practice Session Launcher

- Added a dev-only adaptive practice launcher to `/dev/route-runner`. It uses
  the Stage 77 queue to let learners start, skip, dismiss, complete, and undo
  status for recommended practice items.
- Launcher state is stored in browser local storage under
  `topopass.dev.routeRunner.adaptivePracticeLauncher.v1`, with safe fallback
  handling for missing storage, malformed JSON, and older partial state.
- Starting a launcher item selects the linked development exercise when one is
  available, clears the current route draft and attempt result, and shows an
  active-session summary explaining why the exercise was chosen.
- Stage 78 is UI/session-state only. It does not change scoring, legality,
  snapping, matching, shortest-route behavior, map-engine logic, fixtures,
  backend behavior, Supabase behavior, exercise semantics, or restriction
  classification.

## Stage 79 Adaptive Practice Outcome Feedback Loop

- Added local adaptive outcome feedback for `/dev/route-runner` launcher
  sessions. When a learner marks an adaptive practice item complete, the route
  runner records whether the practice resolved the focus, improved but still
  needs work, repeated the same issue, produced mixed signals, or could not yet
  be judged.
- Outcome feedback compares the completed route review against the launched
  practice focus, including score, pass/fail state, illegal movement count,
  missed restriction count, extra distance, and strongest review weakness
  categories.
- Repeated issues boost the same future adaptive queue focus, resolved issues
  lower that focus, improved-but-not-resolved outcomes keep it active at lower
  urgency, and unknown outcomes do not materially affect queue ranking.
- The feedback history is stored inside the Stage 78 browser-local launcher
  state with migration-safe parsing for old or malformed localStorage values.
- Stage 79 is dev-only feedback/session state. It does not change scoring,
  legality, snapping, matching, shortest-route behavior, map-engine logic,
  fixtures, backend schema, Supabase behavior, exercise semantics, or
  restriction classification.

## Stage 80 Exercise/Map Metadata Layer

- Added a pure exercise and map metadata layer for `/dev/route-runner`, covering
  stable map identity, map kind, version, area label, difficulty, estimated
  minutes, skill tags, weak-area tags, restriction tags, route-feature tags,
  prerequisites, and related exercises.
- Added validation and lookup helpers for metadata catalogues, including
  duplicate-id checks, unknown map/exercise references, missing route-exercise
  metadata, invalid durations, missing tags, metadata indexes, and filtered
  searches by weak area, skill, and difficulty.
- The dev route runner now derives its adaptive practice exercise catalogue
  from the metadata layer and shows compact selected-exercise metadata in the
  exercise card.
- Stage 80 is metadata/indexing only. It does not change route scoring,
  pass/fail rules, legality, snapping, matching, shortest-route behavior, map
  fixtures, restriction behavior, saved attempt shape, backend schema, Supabase
  behavior, or exercise semantics.

## Stage 81 Product Route Runner Layout Shell

- Reworked `/dev/route-runner` into a product-style Route Runner shell with a
  top control bar, left exercise brief, central map workspace, right attempt
  review workspace, and bottom learning dashboard.
- The top bar now surfaces the selected route title, exercise position,
  difficulty, estimated time, elapsed-time placeholder, and quick Undo, Clear,
  and Submit Attempt controls for the drawn trace.
- The exercise brief now separates start, ordered checkpoints, finish, rules,
  metadata, skill tags, and weak-area tags while keeping the manual route ID
  runner available for development checks.
- The central map panel keeps the existing dev map renderer, drawing capture,
  snapping preview, restriction toggles, and overlay legend. The right review
  panel keeps the existing Stage 70-79 review, diagnostics, scoring, save,
  adaptive, weak-area, and history output.
- Added a bottom learning dashboard summary for adaptive queue, weak areas, and
  recent attempts using the current local/dev state. Stage 81 is layout/UI shell
  only and does not change scoring, legality, snapping, matching, shortest-route
  behavior, map fixtures, adaptive queue logic, attempt review semantics,
  backend schema, Supabase behavior, or exercise semantics.

## Stage 82 Synthetic Street Map Renderer

- Added a pure synthetic street-map rendering adapter for `/dev/route-runner`.
  It derives visual-only road classes, road styles, road labels, area labels,
  stop labels, background features, route overlay styles, and legend items from
  the existing synthetic Marlowe District map and route exercises.
- The route runner canvas now draws soft park/water/block background shapes,
  road casing and width hierarchy, reduced junction dots, road names, area
  labels, clearer start/checkpoint/finish labels, and a stronger matched-route
  overlay while preserving the existing drawing, snapping, matching, scoring,
  restriction, and review overlays.
- Background features are explicitly visual-only and do not enter routable graph
  calculations, snapping, scoring, legality, shortest-route logic, or attempt
  storage.
- The map still uses fake/dev data only. Stage 82 does not import OSM/Overpass
  data and does not change scoring, legality, snapping, route matching,
  shortest-route behavior, restriction classification, exercise semantics,
  backend schema, adaptive queue logic, attempt review logic, or attempt storage
  logic.

## Stage 83 Restriction Symbol Layer Polish

- Added a pure restriction symbol-layer model for `/dev/route-runner` covering
  no-entry, one-way, prohibited-turn, restricted-road, illegal-movement,
  disconnected-route, selected-focus, and legend visuals.
- The route runner canvas now uses clearer no-entry barred circles, blue
  one-way arrows, compact turn-ban signs, amber restricted-road symbols, and
  stronger route-issue markers on top of the Stage 82 synthetic street-map
  renderer.
- Review-panel route issues now support a "Show on map" focus action where a
  matching visual target exists. The selected item receives a blue focus halo
  without changing scoring or review semantics.
- Stage 83 is visual/presentation-only. It does not change scoring, legality,
  snapping, route matching, shortest-route behavior, exercise semantics,
  backend schema, adaptive queue logic, attempt storage, or attempt review
  reasoning.

## Stage 84 Realistic Synthetic Exercise Map Fixtures

- Added eight fake-but-realistic Marlowe District route exercises for
  `/dev/route-runner`: central-grid, one-way-heavy, no-entry-heavy,
  prohibited-turn, restricted-road, checkpoint-order, efficiency-trap, and
  mixed-difficulty scenarios.
- Added a Stage 84 scenario catalogue with stable exercise ids, titles, area
  labels, difficulty, scenario tags, weak-area tags, road-name focus,
  restriction summaries, route rules, synthetic renderer metadata, map bounds,
  and current shortest-route distance estimates.
- The route runner exercise brief now surfaces the selected scenario, featured
  roads, restriction summary, ordered stop requirements, and scenario-specific
  rules while continuing to use the existing Marlowe synthetic map and runner
  APIs.
- The restricted-road scenario uses an existing `road_closed` fixture type for
  visual restricted-road training. This remains fixture/visual metadata only;
  Stage 84 does not add new road-closure legality enforcement.
- Stage 84 does not import London, OSM, Overpass, Mapbox routing, or external
  route data. It does not change scoring, legality, snapping, route matching,
  shortest-route behavior, backend schema, Supabase behavior, attempt review,
  adaptive queue semantics, or saved attempt shape.

## Stage 84.5 Immersive London-Inspired Practice Map Experience

- Enlarged `/dev/route-runner` into a map-first workspace. The route runner now
  opts into a wider app shell, makes the map the dominant full-width workspace,
  and moves the review and supporting panels underneath the map instead of
  squeezing the canvas with side rails.
- The synthetic map canvas now has a much larger desktop minimum height for
  route drawing and testing while preserving the existing canvas coordinate
  model, pointer handling, snapping, matching, scoring, and manual route input.
- Polished the fake Marlowe map renderer with a fictional station quarter,
  canal basin, goods-yard block, civic quarter, extra parkland, and clearer
  street hierarchy so it feels closer to a London route-planning practice map
  without importing or copying real London/OSM data.
- Stage 84.5 is UI/fixture/renderer polish only. It does not change scoring
  semantics, legality semantics, snapping, route matching, shortest-route
  behavior, backend schema, attempt review semantics, adaptive queue semantics,
  saved attempt shape, or exercise scoring data.

## Stage 85 Realistic Full-Size Map Rendering UI

- Increased the `/dev/route-runner` map canvas to a full-size atlas-style
  1120x760 drawing surface and gave the map panel the full available content
  width for route testing.
- Added pure visual renderer models for synthetic rail/context lines and
  landmark markers. These use existing Marlowe fixture landmarks and remain
  explicitly non-routable.
- The canvas renderer now draws layered map context: pale base, background
  areas, fictional rail approach, wider cased road hierarchy, landmark symbols,
  labels with stronger halos, route/restriction overlays, and larger numbered
  start/checkpoint/finish markers.
- The map is still fictional and London-inspired only. Stage 85 does not import
  OSM/Overpass/London data and does not change scoring logic, legality checks,
  snapping, route matching, shortest-route behavior, exercise semantics,
  restriction classification, backend/schema logic, adaptive practice logic,
  attempt history, or saved attempt shape.

## Stage 85.5 Continuous Route Drawing and Undo

- Updated `/dev/route-runner` drawing state from a single reset-on-draw trace to
  an immutable multi-stroke draft. Each pointer-down/move/up action is stored as
  one ordered stroke, and the existing drawn-route pipeline receives the
  flattened combined point sequence.
- Starting a second pointer action now appends to the current route instead of
  replacing it. Undo removes only the latest drawing stroke, while Clear drawing
  still resets the whole draft, overlays, score, and review state.
- The route map workspace now shows Undo next to Clear drawing. The raw orange
  drawing overlay renders strokes independently so nearby continuation strokes
  read as one route without forcing a large visual connector across accidental
  far-away restarts.
- Added a visual-only "Reveal fastest route" toggle beside the drawing controls.
  It uses the existing shortest legal route engine for the selected exercise,
  draws a blue dashed route overlay, and can be hidden again without modifying
  the learner's draft route, scoring, review, saved attempt, or adaptive
  practice state.
- Stage 85.5 is UI/draft-state only. It does not change scoring, legality,
  snapping, route matching, shortest-route algorithm behavior, route exercise
  semantics, map fixture topology, restriction classification, backend/schema
  logic, Supabase logic, adaptive practice logic, attempt history, or saved
  attempt shape.

## Stage 85.6 Map Zoom Controls and Reset View

- Added map viewport controls to `/dev/route-runner`: Zoom in, Zoom out, and
  Reset view. The default reset returns the canvas to the same Stage 85 view
  shown when the selected exercise loads.
- Zoom is implemented as a visual viewport transform over the existing
  synthetic map coordinate system. User-drawn route strokes, snapped previews,
  matched overlays, restriction symbols, and the Stage 85.5 revealed fastest
  route all continue to render through the same zoomed viewport, so they remain
  aligned while zooming.
- Reset view changes only the viewport. It does not clear the learner's draft
  route, hide a revealed fastest route, change the selected exercise, or reset
  attempt review, saved attempts, adaptive practice, weak-area, or history
  state. Switching exercises still resets the viewport to the default view.
- Stage 85.6 is viewport/UI-only. It does not change scoring, legality,
  snapping, route matching, shortest-route algorithm behavior, map fixtures,
  exercise semantics, backend/schema logic, Supabase logic, adaptive practice
  logic, attempt history, or saved attempt shape.

## Stage 85.7 Route Restriction Correctness Bug Fix

- Tightened the fastest-route/solution path so it is legal-only. The shortest
  route engine now blocks no-entry movements, one-way wrong-direction movement,
  prohibited turns, immediate U-turns, and modelled road-closed/restricted-road
  sections before returning a route.
- Added ordered-stop shortest-route search for multi-stop exercises. The search
  keeps previous-road state across checkpoints, so the solution cannot silently
  create an illegal U-turn or banned transition between independently calculated
  legs.
- The `/dev/route-runner` Reveal fastest route control now fails closed. If the
  required start, checkpoint, or finish sequence has no legal solution, the UI
  shows "No legal fastest route available for this exercise." and does not draw
  an illegal fallback route.
- Added legal reachability validation for route exercises. This flags invalid
  exercises whose required stops cannot be completed legally under current map
  restrictions. The current Marlowe no-entry focus exercise is treated as
  unavailable until the fixture is corrected instead of being shown as a valid
  legal solution.
- Directed restriction blocking is represented as `fromNodeId->toNodeId` edge
  keys and validated before a shortest route is returned for rendering. No-entry
  restrictions can also split a road at distance markers so a mid-road no-entry
  sign blocks only the illegal directed segment rather than the whole road.
- Stage 85.7 does not change scoring thresholds, map rendering style,
  backend/schema logic, Supabase logic, adaptive practice logic, attempt
  history, or saved attempt shape.

## Stage 86 Route Drawing Continuation and Undo UX

- Confirmed the `/dev/route-runner` drawing flow supports repeated drawing
  strokes: learners can release the pointer, click again, and continue the same
  route without losing earlier strokes.
- Added explicit map-workspace guidance beside the drawing controls:
  "Draw in multiple strokes. Release and click again to continue."
- Undo remains next to Clear drawing and removes only the latest stroke/action.
  Clear drawing still removes the full draft route and resets derived overlays,
  score, and review state.
- The review and scoring pipeline still receives the combined flattened route
  points from all strokes. Stage 86 does not change scoring, legality, snapping,
  matching, shortest-route behavior, map fixtures, exercise semantics, backend
  schema, Supabase logic, or route-engine semantics.

## Stage 87 Map Pan and Drag View Controls

- Added a Pan mode toggle to the `/dev/route-runner` map controls. With Pan mode
  on, left-drag moves the map view; with Pan mode off, left-drag continues to
  draw route strokes as before.
- The route-runner viewport state now tracks `zoom`, `panX`, `panY`, and
  `isPanModeEnabled`. Panning is clamped so the map cannot be dragged completely
  out of view, while still allowing useful movement when zoomed in.
- Pointer-to-map conversion now uses the same zoomed and panned viewport used
  for rendering. User-drawn routes, the revealed fastest route, stop markers,
  road labels, restriction symbols, and issue overlays remain aligned after
  both zooming and panning.
- Reset view restores the default zoom and pan without clearing the draft route
  or hiding a revealed fastest route. Switching exercise resets zoom, pan, and
  Pan mode to the default exercise view.
- Stage 87 is viewport/UI-only. It does not change scoring, legality, snapping,
  route matching, shortest-route algorithm behavior, restriction-engine
  semantics, map fixtures, exercise semantics, backend/schema logic, Supabase
  logic, adaptive practice logic, attempt history, or saved attempt shape.

## Stage 87.1 In-Map Map Controls UI Polish

- Moved the `/dev/route-runner` map controls into the map viewport so they feel
  attached to the drawing workspace instead of crowding the page header.
- Zoom now uses a compact in-map vertical control with `+` above `-`, a white
  face, subtle border, rounded corners, and shadow. The current zoom percentage
  remains visible as a small in-map badge.
- Pan mode, Undo, Clear drawing, Reveal/Hide fastest route, and Reset view now
  sit in a floating top-right map toolbar. Only the buttons capture pointer
  events, so the rest of the canvas remains drawable or pannable.
- Stage 87.1 is UI placement/styling only. It does not change route scoring,
  legality, snapping, route matching, shortest-route algorithm behavior,
  restriction-engine semantics, map fixtures, exercise semantics,
  backend/schema logic, Supabase logic, adaptive practice logic, attempt
  history, or saved attempt shape.

## Stage 88 Exercise Validity and Reachability Guard

- Added route-runner exercise availability validation that checks each selected
  exercise has a legal route through its required start, checkpoints, and
  finish before it is treated as a normal practice question.
- The validation uses the existing restriction-aware shortest-route logic. It
  respects no-entry restrictions, one-way direction rules, prohibited turns, and
  modelled road-closed/restricted-road sections without adding a second routing
  algorithm.
- Invalid exercises are now labelled in the `/dev/route-runner` selector as
  "Invalid - no legal route" and show a compact warning: "This exercise has no
  legal route and needs fixing." The known Marlowe no-entry focus exercise is
  currently detected as invalid/unrouteable.
- Reveal fastest route is disabled for invalid exercises, and drawn/manual route
  submission is blocked before scoring so an invalid fixture cannot be treated
  as a normal failed attempt. Drawing remains available for fixture debugging.
- Stage 88 does not change scoring logic, snapping, route matching,
  shortest-route algorithm behavior, restriction-engine semantics, map fixtures,
  backend/schema logic, Supabase logic, adaptive practice logic, attempt
  history, or saved attempt shape.

## Stage 89 Draw and Pan Interaction Modes

- Replaced the route-runner's single pan toggle with explicit `Draw` and `Pan`
  interaction modes inside the map viewport. `Draw` remains the default so route
  capture works immediately.
- In Draw mode, dragging adds multi-stroke route input and never pans the map.
  In Pan mode, dragging moves the map view and never creates route strokes.
- Switching modes preserves the current drawn route, fastest-route overlay,
  restriction overlays, markers, labels, zoom, and pan alignment.
- Cursor feedback now follows the active mode: crosshair for drawing and
  grab/grabbing for map panning.
- Stage 89 is UI interaction only. It does not change scoring, legality,
  snapping, route matching, shortest-route algorithm behavior, no-entry or
  one-way enforcement, fixtures, backend/schema logic, Supabase logic, adaptive
  practice logic, attempt history, or saved attempt shape.

## Stage 90 Bounded Pan and Viewport Polish

- Tightened `/dev/route-runner` viewport pan bounds so the large synthetic map
  cannot be dragged endlessly into blank space.
- Pan limits are now explicit, zoom-aware, symmetrical, and safely clamped for
  zero or invalid viewport dimensions. Zooming out reclamps existing pan offsets
  back into the valid range.
- Reset view restores the default zoom, centred pan position, and Draw mode, and
  continues to clear temporary drag state in the UI.
- The pan margin is bounded by viewport size to avoid large empty gaps while
  still allowing useful movement when zoomed in.
- Stage 90 is viewport/UI polish only. It does not change scoring, legality,
  snapping, route matching, shortest-route algorithm behavior, restriction
  semantics, map fixtures, adaptive practice logic, attempt storage, backend
  schema, Supabase logic, or exercise semantics.

## Stage 90.5 Route Runner Regression Lock

- Added focused regression coverage for the Stage 85-89 route-runner viewport
  behavior without adding new UI features.
- The tests lock draw/pan interaction intent, route-point alignment after
  zooming and panning, required stop marker alignment, road-restriction overlay
  alignment, and fastest-route overlay alignment.
- Existing drawing-trace and fastest-route tests continue to cover undo,
  clearing the full drawn route, and legal-only fastest-route reveal behavior.
- Stage 90.5 does not change scoring, legality, snapping, route matching,
  shortest-route algorithm behavior, exercise semantics, map fixtures,
  backend/schema logic, Supabase logic, adaptive practice logic, attempt
  history, or saved attempt shape.

## Stage 92 Route Matching Hardening

- Hardened route matching so same-road reversals are preserved as repeated road
  movements instead of being collapsed into invalid node sequences. This keeps
  loops, dead-end turn-backs, and repeated roads available for the existing
  legality/scoring layer to judge.
- Added additive matching debug output with high/medium/low/failed confidence,
  structured failure reasons, average/minimum snapped-point confidence, and
  matched route distance in metres.
- Added regressions for shaky and slightly off-road drawing, junction drawing,
  nearby parallel roads, multi-stroke draft scoring, disconnected rejection,
  off-road rejection, illegal route scoring, and legal-only fastest-route reveal.
- Stage 92 does not change scoring thresholds, legality rules, snapping
  tolerance policy, shortest-route behavior, exercise semantics, map fixtures,
  backend/schema logic, Supabase logic, adaptive practice logic, attempt
  history, or saved attempt shape.

## Stage 93 Scoring Calibration

- Centralised route-efficiency scoring in a pure `calculateRouteEfficiencyScore`
  helper used by `scoreRouteAttempt`.
- The calibrated score remains `shortest legal route distance / user route
  distance`, with the 80% pass mark preserved. Scores are rounded to one
  decimal place for display and capped at 100% when a user route is shorter
  than the calculated shortest route.
- Added safe handling for illegal routes, empty/zero-distance attempts, and
  missing shortest legal routes. Illegal movements still automatically fail
  before efficiency scoring.
- Added learner-facing grade bands: Excellent, Very good, Pass, Fail, and
  Automatic fail.
- Added stable scoring explanations for legal passes, legal-but-too-long
  failures, and restricted-movement failures so the route-runner review can
  explain the result consistently.
- Added regression examples for 1000/1000, 1000/1200, 1000/1250, 1000/1300,
  1000/5000, illegal attempts, empty routes, score clamping, grading bands, and
  explanation strings.
- Stage 93 does not change legality rules, snapping, route matching,
  shortest-route behavior, map fixtures, backend/schema logic, Supabase logic,
  adaptive practice logic, attempt history, or saved attempt shape.

## Stage 94 Multi-Stop Route Scoring

- Extended `scoreRouteAttempt` with a `legBreakdown` for ordered required stops
  such as A -> B, A -> B -> C, and A -> B -> C -> D.
- Each consecutive required-stop pair is scored as its own leg, with shortest
  legal distance, user route distance, extra distance, score percentage, grade,
  pass/fail state, failure reasons, and any legality violations for that leg.
- Overall scoring still uses the existing formula: total shortest legal
  required-route distance divided by the full user attempted distance.
- Illegal movement on any leg remains an automatic full-attempt fail, while
  missed or out-of-order checkpoints are reported as ordered-stop failures.
- Added internal per-leg minimum-score metadata support for future use without
  enforcing a new minimum-leg floor by default.
- `/dev/route-runner` now shows compact per-leg breakdown cards in the drawn
  attempt review and manual route result panels.
- Stage 94 keeps A -> B exercises working as before and does not change
  legality rules, one-way/no-entry/prohibited-turn enforcement, snapping,
  route matching, shortest-route algorithm behavior, map fixtures, backend
  schema, Supabase logic, adaptive practice logic, attempt history, or saved
  attempt shape.

## Stage 95 Attempt Storage

- Extended the route-runner attempt storage model with explicit map metadata,
  legal/illegal state, compact matched-route IDs, and Stage 94 per-leg
  breakdown payloads.
- Supabase-backed attempts now store `map_id`, `map_version`,
  `exercise_version`, `is_legal`, and `per_leg_breakdown` alongside the
  existing score, pass/fail, distance, violation, recommendation, matched-route,
  review payload, schema version, and created-at fields.
- Added local device fallback storage for `/dev/route-runner` attempts when
  Supabase is unavailable or a save fails, so anonymous/dev practice can keep
  working without blocking scoring feedback.
- Matched-route storage is intentionally compact: road IDs, node IDs, required
  stop IDs, and directed edge IDs are kept, while large matcher diagnostics and
  raw drawing traces are not saved.
- Saved attempt history can read from Supabase when available or local fallback
  attempts when Supabase is not configured or temporarily unavailable.
- Stage 95 does not change scoring rules, legality rules, snapping, route
  matching, shortest-route behavior, map fixtures, dashboards, OSM import, or
  exercise semantics.

## Stage 96 Attempt History Review

- Added a pure saved-attempt review builder for `/dev/route-runner` that turns
  stored attempt rows into structured learner-facing review sections.
- Saved history rows now show date, exercise title or id, score, pass/fail,
  legal/illegal state, user route distance, shortest route distance, and failure
  reason.
- Selecting a saved attempt now opens a structured review with user-route
  summary, shortest-route summary, score explanation, violations, missed
  restrictions, and Stage 94 per-leg breakdowns when available.
- The saved review panel handles stale or missing exercise titles safely by
  falling back to the saved exercise id and showing a compact warning.
- Saved-attempt visual replay is intentionally deferred; saved attempts
  currently show a textual route summary from compact stored road/node/directed-
  edge IDs, with the raw saved review payload retained in a collapsible debug
  section.
- Stage 96 does not change scoring rules, legality rules, snapping, route
  matching, shortest-route behavior, storage serialization semantics, backend
  schema, OSM import, dashboards, or exercise semantics.

## Stage 97 Route Replay

- Added pure route replay helpers for normalising route geometry, calculating
  replay length and duration, interpolating marker positions along polylines,
  clamping progress, resetting replay state, switching replay modes, and
  building compare-mode markers.
- `/dev/route-runner` now shows compact replay controls after a drawn attempt is
  reviewed: replay my route, replay the shortest legal route, compare both,
  play, pause, restart, and 0.5x/1x/2x speed selection.
- Replay markers are drawn in map coordinates on the existing canvas, using the
  same viewport transform as roads, stops, restriction icons, the snapped route,
  and the revealed fastest route, so they stay aligned after zoom, pan, and reset
  view.
- Replay state is isolated from scoring, pass/fail, attempt storage, saved
  history, matched route data, shortest-route data, adaptive practice, and weak-
  area analytics. Starting a new drawing, undoing, clearing, or changing
  exercises safely resets only replay playback.
- Empty or missing geometry disables the relevant replay mode instead of
  crashing. Compare mode is available when both snapped user-route geometry and
  the legal shortest-route geometry exist. Saved-attempt visual replay remains a
  future layer because saved rows intentionally store compact IDs rather than raw
  drawing payloads.
- Stage 97 does not change scoring rules, legality rules, snapping, route
  matching, shortest-route behavior, map fixtures, backend schema, OSM import,
  storage semantics, attempt history, or exercise semantics.

## Stage 98 Weak Area Analytics Upgrade

- Added a pure saved-attempt weak-area analytics helper for
  `/dev/route-runner` that consumes stored attempt records without requiring
  Supabase during dev testing.
- The analytics summary detects repeated one-way, no-entry, prohibited-turn,
  restricted-road, disconnected/off-road drawing, missed-checkpoint,
  checkpoint-order, inefficient-route, long-route, road-specific, and
  junction-specific weakness signals where the saved review data contains them.
- Weak areas are ranked by frequency with recent-attempt weighting, and the
  saved attempt panel now shows learner-friendly messages, practice focus, and
  an improving/stable/getting-worse trend when enough saved attempts exist.
- Existing adaptive practice helpers still consume their current signals; Stage
  98 adds an additional saved-history summary rather than replacing the
  Stage 74-79 recommendation flow.
- Stage 98 does not change scoring rules, legality rules, snapping, route
  matching, shortest-route behavior, storage schema, Supabase requirements,
  OSM import, dashboards, or exercise semantics.

## Stage 100 Performance Hardening

- Added a pure route-runner performance helper for graph memoization,
  large-trace budgeting, and active-drawing pipeline placeholders.
- `/dev/route-runner` now builds the Marlowe map graph once per component
  lifecycle and reuses it for exercise reachability checks and fastest-route
  reveal, avoiding repeated graph rebuilds in the dev UI.
- Active pointer drawing now keeps the UI responsive by rendering the raw trace
  while deferring snap, match, scoring, and debug overlay rebuilding until the
  stroke is finished.
- Very large completed traces are defensively simplified and capped before the
  drawn-route pipeline runs, preserving endpoints while preventing accidental
  huge pointer traces from overwhelming snapping/matching.
- Stage 100 keeps the existing debug panels and map overlays, but avoids
  recalculating expensive derived route data on every pointer move.
- Stage 100 does not change scoring rules, legality checks, snapping semantics,
  route matching semantics, shortest-route behavior, map fixtures, backend
  schema, Supabase logic, OSM import, or adaptive practice behavior.

## Stage 101 Overpass / OSM Import Prototype

- Added an isolated `lib/map-engine/osm` import prototype for minimal Overpass
  JSON responses, covering node, way, and relation elements while ignoring
  relations for Stage 101 graph conversion.
- `parseOverpassRoadExtract()` extracts accepted road-like highway ways
  (`primary`, `secondary`, `tertiary`, `unclassified`, `residential`,
  `service`, and `living_street`) into a deterministic prototype road shape
  with OSM IDs, names, highway type, direction metadata, coordinates, node
  references, and raw tags retained for debugging.
- Motorways, trunk roads, footways, cycleways, paths, pedestrian-only ways,
  steps, bridleways, construction/proposed ways, buildings, railways,
  waterways, blocked access roads, and ways with missing node references are
  excluded rather than routed through.
- Basic OSM direction and access tags are detected: `oneway=yes`, `true`, `1`,
  `-1`, and `junction=roundabout`; `access=no`, `motor_vehicle=no`, and
  `vehicle=no` are treated as blocked for this prototype.
- Added a tiny committed London-like Overpass fixture with named roads,
  one-way and reverse-one-way cases, a roundabout, blocked vehicle access, and
  excluded non-drivable ways. Tests use this fixture only and do not call live
  Overpass.
- For manual dev experiments, use a small Overpass Turbo query like:

```overpassql
[out:json][timeout:25];
(
  way["highway"~"^(primary|secondary|tertiary|unclassified|residential|service|living_street)$"](51.529,-0.126,51.534,-0.117);
);
(._;>;);
out body;
```

  Keep downloaded extracts small and committed fixtures synthetic or minimal
  enough for deterministic tests.
- Existing Marlowe/fake/dev maps remain the default. Stage 101 does not render
  OSM data, create OSM exercises, call external routing APIs, or change scoring,
  legality, snapping, matching, shortest-route, backend, or Supabase behavior.
- Future OSM-derived UI must include OpenStreetMap contributor attribution.
  Stage 102 is expected to convert this parsed output into the app graph format.

## Stage 102 OSM Import to Route Graph Converter

- Added a pure Stage 102 converter that consumes Stage 101 imported Overpass
  output and emits the existing `MapDefinition` shape used by snapping,
  legality, shortest-route, reveal-fastest-route, scoring, and route-exercise
  code.
- OSM node coordinates are projected into deterministic local x/y metres using
  a small-extract bbox-centred projection, with origin, scale, lat/lon bounds,
  and projected bounds retained in converter metadata for debugging.
- Imported OSM ways are split into one internal road segment for each
  consecutive OSM node pair. Stable ids use `osm-node-{id}` and
  `osm-way-{id}-segment-{index}`, preserving road names, OSM ids, highway tags,
  original OSM direction, segment index, node ids, and raw tags for Stage 103
  rendering/debug work.
- The converter default road filter includes `primary`, `primary_link`,
  `secondary`, `secondary_link`, `tertiary`, `tertiary_link`, `residential`,
  `unclassified`, `living_street`, `service`, and `road`; it excludes footways,
  cycleways, paths, steps, pedestrian-only/platform/construction/proposed ways,
  and remains configurable for later London tuning.
- One-way OSM data is represented using existing map-engine semantics:
  `oneway=yes`, `true`, `1`, and roundabouts become one-way generated segments;
  `oneway=-1` reverses generated segment endpoints so existing directed-edge
  routing only permits the legal direction. Stage 101 blocked-access ways remain
  excluded, while imported roads with vehicle-blocking tags are converted with
  `road_closed` restrictions.
- The tiny Stage 101 fixture now converts into an internal route map that can be
  passed through the existing shortest-route and legality engines. Tests prove
  one-way, reverse-one-way, roundabout, missing-node, non-road filtering,
  deterministic projection, and converted shortest-route behavior.
- Stage 102 does not fetch live OSM data, render London maps, create exercises,
  change scoring behavior, change drawing behavior, change snapping/matching
  behavior, or alter shortest-route legality rules beyond consuming the
  converted one-way/restricted road data through existing engine paths.

## Stage 103 Render Converted OSM Route Graph in Route Runner

- Added a dev-only route-runner map catalogue that keeps the Marlowe synthetic
  map as the default and adds the converted Stage 101 tiny London OSM fixture as
  an explicit selectable map option.
- `/dev/route-runner` now derives exercise lists, map graph, viewport bounds,
  restriction overlays, drawing/snapping/scoring inputs, fastest-route reveal,
  and canvas labels from the selected `MapDefinition` instead of assuming the
  Marlowe fixture.
- The converted OSM fixture renders through the existing canvas street-map path
  with Stage 102 projected coordinates. Road labels use preserved OSM road names,
  and display styling reads preserved highway metadata for primary, secondary,
  tertiary, residential, service, and fallback roads.
- Added simple dev OSM fixture exercises so drawing, snapping, panning, zooming,
  reset view, restriction display, and reveal-fastest-route can be manually
  tested against converted graph data without fetching live Overpass data.
- Stage 103 is integration/rendering only: it does not replace the fake/dev
  maps, call live OSM or external routing APIs, alter scoring, alter
  shortest-route behavior, change legality semantics, require Supabase, or wire
  imported OSM data into production UI.

## Stage 104 Converted OSM Exercise Fixtures and Solvability Validation

- Added several dev-only route exercises on top of the converted Stage 102 OSM
  fixture map: a simple start-to-finish route, a checkpoint route, a roundabout
  checkpoint route, a one-way-aware route from the roundabout to Argyle Street,
  and an isolated service-lane route.
- Converted OSM exercise stops use stable converted graph node ids such as
  `osm-node-1001`, so markers align with the rendered roads, snapping graph,
  and fastest-route overlay without arbitrary screen-coordinate fixtures.
- Added regression coverage proving the converted OSM exercises are registered
  only under the converted OSM route-runner map option while the synthetic
  Marlowe map remains the default.
- Added solvability validation for every converted OSM exercise using the
  existing restriction-aware shortest-route and exercise reachability helpers.
  Tests fail if any fixture requires illegal one-way/no-entry/restricted-road
  movement or has an unreachable checkpoint/finish.
- Added fastest-route reveal coverage for every converted OSM exercise. Returned
  edge sequences are validated with the existing directed-edge path validation
  before being accepted as renderable route overlays.
- Added a negative unreachable converted-OSM exercise test to prove invalid
  fixtures are rejected instead of being silently treated as normal practice
  questions.
- Stage 104 does not fetch live OSM/Overpass data, hard-code route solutions,
  bypass the route engine, change scoring, change legality, alter snapping,
  modify shortest-route behavior, replace synthetic fixtures, or expose OSM maps
  outside the dev route-runner flow.

## Stage 105 Medium London OSM Fixture Import

- Added a committed dev/test-only `mediumLondonOverpass.json` fixture under
  `lib/map-engine/osm/fixtures`. It is a deterministic, generated
  Overpass-like extract inspired by the King's Cross, Euston, and Bloomsbury
  street pattern, with multiple junctions, one-way streets, a roundabout,
  excluded foot/cycle/trunk ways, and a blocked private service way.
- The medium fixture is parsed and converted through the existing Stage 101/102
  OSM import pipeline into a normal `MapDefinition`. It currently produces 25
  converted graph nodes and 48 converted road segments, larger than the tiny
  prototype while remaining compact enough for unit tests and local dev.
- `/dev/route-runner` now exposes the medium converted OSM map as a separate
  selectable dev map. The Marlowe synthetic map remains the default, and the
  tiny converted OSM fixture remains available as its own option.
- Added five dev-only medium OSM exercises using stable converted graph node
  stops. The exercises cover simple start/finish routing, a one-way street, a
  checkpoint route, a one-way-aware detour, and a service-road route.
- Added parser, converter, route-runner selection, marker attachment,
  solvability, and reveal-fastest-route legality tests for the medium fixture.
  Revealed routes are validated against the existing directed-edge path
  validation and must not travel illegally against imported one-way rules.
- To replace this fixture later, commit a similarly small trimmed Overpass JSON
  extract, keep node/way ids stable, and run the parser/converter and
  route-runner map tests before adding exercises. Tests must not fetch live
  Overpass data.
- Stage 105 does not fetch live OSM/Overpass data, replace synthetic maps, use
  external routing APIs, hard-code solution routes, change scoring, change
  legality, alter snapping, modify shortest-route/reveal-fastest-route logic,
  or change backend/Supabase behavior.

## Stage 106 Medium OSM Map Visual QA / Debug Overlay

- Added a dev-only OSM graph QA overlay for `/dev/route-runner`. The overlay is
  available only when a converted OSM map is selected, is off by default, and
  does not appear for the default Marlowe synthetic map.
- To inspect the medium fixture, open `/dev/route-runner`, select `Medium
  converted OSM fixture`, then use the in-map `OSM QA` button or the converted
  OSM QA panel below the map to enable the graph overlay.
- When enabled, the overlay draws graph nodes, directed graph edges, one-way
  direction arrows, and optional node/road-segment IDs using the same map
  coordinate transform as roads, restrictions, drawn routes, fastest-route
  reveal, replay markers, and exercise stops. This keeps the QA layer aligned
  while zooming, panning, and resetting the view.
- Added a compact converted OSM QA summary panel with map id/name, source
  fixture name, node count, road segment count, directed edge count, one-way and
  two-way segment counts, selected exercise id/title, and start/checkpoint/finish
  node ids.
- Added deterministic helper tests for default-off state, converted-map-only
  availability, medium fixture debug counts, hidden overlay behavior, visible
  graph node/edge models, and tiny-vs-medium debug summary differences.
- Stage 106 is visual/debug-only. It does not fetch live OSM/Overpass data,
  change scoring, alter legality, modify snapping or matching, change
  shortest-route/reveal-fastest-route logic, touch saved attempts, analytics,
  Supabase, or replace the default synthetic map.

## Stage 107 Medium OSM Visual Fixture QA Fixes

- Improved the first-load fit for the medium converted OSM fixture in
  `/dev/route-runner`. The medium map now uses a larger deterministic viewport
  padding so roads and exercise stops are not tight against the canvas edge on
  initial load. The default synthetic map and tiny converted OSM fixture keep
  their existing fit behavior.
- Polished the dev-only OSM QA overlay for the medium fixture: graph nodes are
  smaller, two-way debug edges are lighter dashed guides, one-way edges remain
  clearer, and dense two-way arrowheads are suppressed for medium maps. Optional
  node/segment IDs remain off by default and only appear when explicitly
  enabled.
- Expanded the converted OSM QA panel with source kind, blocked OSM way count,
  map extent, bounds centre, and blocked OSM way IDs, while keeping selected
  exercise and start/checkpoint/finish node IDs visible for fixture inspection.
- The overlay continues to draw below routes, restriction focus highlights,
  replay markers, and start/checkpoint/finish markers so exercise markers remain
  readable while QA mode is enabled.
- Added deterministic tests for medium fixture fit bounds, QA summary bounds and
  extent, blocked-way metadata, medium overlay style, and default-hidden ID
  behavior.
- Stage 107 is dev-only visual QA polish. It does not fetch live OSM/Overpass
  data, change scoring, alter legality, modify snapping or matching, change
  shortest-route/reveal-fastest-route logic, touch saved attempts, analytics,
  Supabase, or replace the default synthetic map.

## Stage 108 Medium OSM Exercise QA Harness

- Added a dev/test-only QA harness for converted OSM route-runner exercises.
  It validates each exercise against the selected converted graph without
  changing route scoring, snapping, matching, shortest-route behavior, storage,
  analytics, Supabase, or production UI.
- The harness checks that start, checkpoint, and destination nodes exist, start
  and destination are distinct, ordered checkpoint legs are legally reachable,
  fastest/reveal route edges exist in the graph, returned routes avoid blocked
  directed edges, one-way/no-entry restrictions are respected, and route points
  sit inside the rendered map bounds.
- Diagnostics use stable reason codes for fixture QA, including
  `missing-start-node`, `missing-destination-node`, `missing-checkpoint-node`,
  `unreachable-leg`, `illegal-directed-edge`, `unknown-route-edge`, and
  `outside-render-bounds`.
- Added test coverage proving all tiny and medium converted OSM exercises pass
  the harness, while intentionally broken missing-node, unreachable, blocked
  directed-edge, wrong-way edge, and out-of-bounds cases fail deterministically.
- Run the OSM exercise QA coverage through `npm.cmd run test:map`. The harness
  is local and deterministic; it does not fetch live Overpass data or use any
  external routing API.

## Stage 109 OSM Visual Renderer Pass

- Improved dev-only converted OSM map rendering in `/dev/route-runner` without
  changing the default Marlowe synthetic map or any route scoring, snapping,
  matching, shortest-route, storage, analytics, Supabase, or production
  behavior.
- Converted OSM roads now expose deterministic visual hierarchy metadata from
  preserved OSM highway tags. Primary roads render thickest, secondary and
  tertiary roads render as medium roads, residential/living-street style roads
  render normally, and service roads render thinner.
- OSM road-name labels are optional and tied to the existing OSM QA/debug view.
  They are hidden during normal route drawing, deduplicated by road name when QA
  is enabled, and skipped safely for unnamed roads.
- The OSM QA directed-edge model now carries preserved OSM way id, highway, and
  original direction metadata so one-way and reverse-imported one-way segments
  are easier to inspect. Reverse-imported one-way debug arrows use a distinct QA
  colour in the overlay.
- Stage 109 remains dev-route-runner rendering/debug polish only. It does not
  fetch live Overpass data, add map data, use external map/routing APIs, replace
  synthetic fixtures, or alter legality and routing behavior.

## Stage 110 OSM Dev QA Status Panel

- Surfaced the existing Stage 108 converted OSM exercise QA harness inside the
  `/dev/route-runner` converted OSM QA panel.
- The status panel is dev-only and appears for converted OSM maps when OSM QA is
  enabled. Synthetic/Marlowe maps remain the default and do not receive OSM QA
  status metadata.
- The panel shows selected OSM map name, node count, directed edge count,
  exercise count, pass/fail summary, and selected-exercise checks for stop-node
  resolution, ordered leg reachability, legal reveal-route availability,
  directed-edge legality, and render-bounds sanity.
- QA failures are formatted with deterministic reason codes from the Stage 108
  harness so invalid converted OSM exercises can be diagnosed visually without
  duplicating route legality logic.
- Stage 110 does not change scoring, snapping, matching, shortest-route logic,
  saved attempts, Supabase behavior, analytics, production UI, live Overpass
  fetching, or external routing behavior.

## Stage 110.5 Real London OSM Fixture Pilot

- Added `realLondonPilotOverpass.json`, a small committed Overpass-style
  Bloomsbury/Tavistock/Russell Square pilot fixture with real London road names,
  residential/service roads, multiple junctions, forward and reverse one-way
  streets, and excluded non-drivable ways.
- Registered the fixture as the dev-only `Real London OSM Pilot` converted OSM
  map in `/dev/route-runner`. The Marlowe synthetic map remains the default, and
  the tiny and medium OSM prototype maps remain selectable.
- Added five node-based pilot exercises covering a simple Euston Road route, a
  checkpoint route through Woburn Place, a Tavistock Place one-way route, a
  one-way-aware detour, and a Gower Street northbound route.
- The pilot fixture is converted through the existing Stage 101/102 parser and
  graph converter. No special-case routing logic, live Overpass calls, external
  routing APIs, production UI, scoring, snapping, matching, shortest-route,
  saved-attempt, Supabase, or analytics behavior changed.
- Tests cover parser output, graph conversion, selectable map registration,
  deterministic road labels/rendering metadata, OSM debug metadata, legal
  reveal-fastest routes, and Stage 108 QA harness pass status for every pilot
  exercise.
- Relevant checks can be run with `npm.cmd run test:map`, or by running the
  focused OSM test files for `overpassImport`, `osmToRouteGraph`,
  `routeRunnerMaps`, `routeRunnerOsmDebug`, and `routeRunnerOsmExerciseQa`.

## Stage 111 Larger London OSM Fixture

- Added `largeLondonOverpass.json`, a larger committed London-like
  Overpass-style fixture that remains small enough for deterministic dev tests
  while covering a broader Bloomsbury/Euston/Russell Square style street grid.
- Registered the fixture as the dev-only `OSM Large London` converted OSM map
  with id `osm-large-london`. The Marlowe synthetic map remains the default, and
  the tiny, medium, and real-pilot OSM maps remain selectable.
- The fixture parses to 63 OSM nodes and 21 accepted source roads, then converts
  through the existing OSM graph converter into 63 route nodes, 122 road
  segments, and 202 legal directed graph edges. One blocked vehicle-access way
  and one ignored relation are retained in metadata for QA/debug checks.
- Added five smoke exercises for the large map:
  `osm-large-main-crossing`, `osm-large-one-way-detour`,
  `osm-large-checkpoint-route`, `osm-large-service-road`, and
  `osm-large-long-route`.
- The existing Stage 108 OSM QA harness validates every large-map exercise for
  stop-node resolution, ordered leg reachability, legal reveal-route
  availability, directed-edge legality, and render-bounds sanity.
- Larger converted OSM fixtures now reuse the padded first-load fit so the
  medium and large maps open comfortably in `/dev/route-runner`.
- Stage 111 is dev/test-only. It does not fetch live Overpass data, add
  production OSM routing, use external routing APIs, change scoring, snapping,
  matching, shortest-route logic, saved attempts, Supabase, or analytics
  behavior.

## Stage 112 Real London OSM Pilot Fixture

- Replaced the oversized real pilot contents in
  `lib/map-engine/osm/fixtures/realLondonPilotOverpass.json` with a smaller
  committed real exported Overpass JSON file around Tottenham Court Road,
  Goodge Street, Store Street, Keppel Street, Gower Street, and Malet Street.
  The fixture is validated as JSON with Overpass-style `elements`, `node`, and
  `way` records; tests explicitly guard against accidentally committing GeoJSON,
  XML/HTML, or an Overpass error response.
- Registered the fixture as the dev-only `Real London pilot map` with id
  `osm-real-london-pilot`. The Marlowe synthetic map remains the default, and
  the tiny, medium, and large OSM QA fixtures remain selectable.
- The real export contains 559 Overpass elements: 396 source nodes and 163
  ways. The parser extracts 161 accepted drivable roads, excludes 2 blocked
  access ways, and preserves 81 one-way roads and 80 two-way roads.
- The existing OSM converter turns the export into 390 route graph nodes, 395
  road segments, and 588 legal directed graph edges. Road hierarchy, names,
  blocked-access metadata, and one-way direction metadata are preserved for
  debug/QA rendering. The converted map tracks 202 one-way road segments, 193
  two-way road segments, and blocked OSM way ids `58987876` and `779180492`.
- Added the first validated real-pilot smoke exercises using stable converted
  OSM node ids. Stage 113 replaces these with the current QA exercise set.
- Larger converted OSM maps, including this real pilot, use the padded
  first-load fit so the map opens in a sane route-runner viewport.
- Converted OSM maps no longer receive synthetic Marlowe background or rail
  features, so real OSM rendering does not show fake labels such as Marlowe
  Canal, Station Quarter, Civic Quarter, Royal Oak Gardens, or Argent Square.
  OSM road-name labels remain optional through the existing QA/debug label mode.
- Stage 112 remains dev-only. It does not fetch live Overpass data, use
  external routing APIs, add production OSM map support, replace synthetic
  defaults, change scoring, snapping, matching, shortest-route logic, saved
  attempts, Supabase, analytics, or weaken one-way/no-entry legality.
- Validation for this stage is covered by `npm.cmd run test:map`,
  `npm.cmd run lint`, `npm.cmd run build`, and focused OSM tests for
  `overpassImport`, `osmToRouteGraph`, `routeRunnerMaps`,
  `routeRunnerOsmDebug`, `routeRunnerOsmExerciseQa`, and
  `routeRunnerOsmQaStatus`.

## Stage 112.5 Real OSM Map Projection and Visual Fit Fix

- Converted OSM route graph node coordinates now use a local Web-Mercator-style
  projection for display: longitude maps to x, projected latitude maps to y,
  and y is inverted for the canvas so north remains up. No manual rotation is
  applied.
- OSM road segment distances continue to use the existing local metric distance
  basis so route weights, scoring, snapping, matching, one-way legality, and
  no-entry legality are not tied to the display projection.
- Converted OSM maps now expand first-load viewport bounds to the canvas aspect
  ratio before rendering, preserving a uniform x/y scale instead of stretching
  the map independently to fill width and height. The Marlowe synthetic map
  keeps its existing default fit behavior.
- Restriction overlays remain toggleable in `/dev/route-runner`, but converted
  OSM maps open with road and turn restriction overlays hidden so the real
  London pilot road geometry is the default visual focus. The OSM QA/debug
  overlay still exposes direction and restriction inspection tools when needed.
- Validation for this stage is covered by `npm.cmd run test:map`,
  `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check`.

## Stage 112.6 Route Runner Map Zoom and Pan Controls

- `/dev/route-runner` map zoom now clamps at `1000%` while preserving the
  existing fitted default view and `75%` minimum zoom. The zoom indicator and
  existing plus/minus controls use the same viewport state.
- Mouse wheel input over the map zooms in or out around the pointer position
  where the canvas size permits it, prevents page scrolling for handled wheel
  zooms, and stays clamped within the route-runner zoom limits.
- Pressing and dragging the middle mouse button pans the map in either Draw or
  Pan mode, with browser autoscroll suppressed. Left mouse Draw mode still
  draws routes, and left mouse Pan mode still pans the map.
- Reset view clears active panning and restores the fitted default zoom, pan,
  and Draw interaction mode without changing route graph legality, OSM
  conversion, one-way/no-entry handling, snapping, scoring, matching, saved
  attempts, analytics, Supabase, or production map defaults.
- Validation for this stage is covered by `npm.cmd run test:map`,
  `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check`.

## Stage 113 Real London Pilot Exercises

- The dev-only real pilot exercise set now uses the committed local fixture
  `lib/map-engine/osm/fixtures/realLondonPilotOverpass.json` and map id
  `osm-real-london-pilot`; it does not fetch live Overpass data, use external
  routing APIs, or change the Marlowe synthetic default.
- Added five QA-validated route exercises:
  `osm-real-pilot-short-crossing` (`osm-node-107319` to `osm-node-107320`),
  `osm-real-pilot-one-way-detour` (`osm-node-108034` to
  `osm-node-108044`), `osm-real-pilot-checkpoint-route`
  (`osm-node-14725979` to `osm-node-108025` to `osm-node-108030`),
  `osm-real-pilot-longer-route` (`osm-node-107319` to `osm-node-273194`),
  and `osm-real-pilot-turn-choice` (`osm-node-9791489` to
  `osm-node-107320`).
- The OSM QA harness validates each exercise for stable stop-node resolution,
  ordered leg reachability, available fastest-route reveal, directed-edge
  legality, and render-bounds sanity. Fastest routes must use known graph
  edges and avoid blocked directed edges.
- Route legality, one-way/no-entry handling, scoring, snapping, matching,
  saved attempts, analytics, Supabase behavior, production map support, and
  production defaults are unchanged.
- Validation for this stage is covered by `npm.cmd run test:map`,
  `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check`.

## Stage 113.5 Map Hover Scroll Lock

- `/dev/route-runner` now confines wheel and trackpad scroll gestures to the
  map canvas only while the pointer is over the map. Those wheel events keep
  controlling cursor-focused map zoom and use a non-passive canvas listener so
  page scrolling is reliably prevented for handled map zoom gestures.
- Pointer leave and outside pointer-down clear the local map scroll-lock state,
  so normal page scrolling resumes once the user leaves or clicks outside the
  map. The implementation does not add body-level or page-global scroll
  locking.
- Draw mode, explicit Pan mode, middle-button panning, reset view, existing
  zoom limits, route scoring, snapping, matching, saved attempts, analytics,
  Supabase behavior, OSM conversion, exercise logic, and the default selected
  map are unchanged.
- Validation for this stage is covered by `npm.cmd run test:map`,
  `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check`.

## Stage 114 Real London Pilot Visual QA Overlay

- `/dev/route-runner` converted OSM maps now include a dev-only `Exercise QA`
  overlay toggle beside the existing OSM QA/debug controls. It is intended for
  inspecting `osm-real-london-pilot` exercises, and also works with the other
  converted fixture maps where source fixture data is available.
- The overlay draws the selected exercise start, ordered checkpoint, and finish
  markers with explicit `Start`, `CP n`, and `Finish` labels, plus the existing
  legality-aware fastest route returned by the Stage 108/113 OSM QA harness.
- Access-blocked OSM ways excluded from the navigable graph are projected from
  the committed Overpass fixture and drawn as debug-only blocked-access
  segments. These visuals do not add edges back into the route graph or change
  one-way/no-entry legality.
- The converted OSM QA panel now shows selected-exercise overlay metadata:
  map id, exercise id/title, start/checkpoint/destination ids, fastest-route
  status, segment count, route length, render bounds, blocked/unknown route-edge
  status, blocked visual counts, and deterministic QA failure messages.
- The Marlowe synthetic map remains the default, and scoring, snapping,
  matching, saved attempts, analytics, Supabase behavior, production routing,
  and OSM graph conversion are unchanged.
- Validation for this stage is covered by `npm.cmd run test:map` and the
  focused `routeRunnerOsmExerciseDebugOverlay` tests; `npm.cmd run lint`,
  `npm.cmd run build`, and `git diff --check` should remain clean.

## Stage 115 Real London Pilot Exercise Lockdown

- The real pilot exercise set for `osm-real-london-pilot` is now covered by a
  deterministic QA acceptance report built from the committed local fixture
  `lib/map-engine/osm/fixtures/realLondonPilotOverpass.json`. The report
  exposes exercise id, start node, destination node, checkpoint nodes/count,
  legal-route availability, fastest-route edge count, route distance, and
  stable failure reason codes/messages.
- The Stage 115 acceptance test locked the original five real pilot exercises
  and their accepted fastest-route summaries:
  `osm-real-pilot-short-crossing`, `osm-real-pilot-one-way-detour`,
  `osm-real-pilot-checkpoint-route`, `osm-real-pilot-longer-route`, and
  `osm-real-pilot-turn-choice`.
- The acceptance pass verifies real pilot start, checkpoint, and destination
  nodes exist, start and destination differ, ordered checkpoint legs are
  reachable, fastest/reveal routes exist, route edges are known, legal directed
  edges are used, blocked one-way/no-entry edges are avoided, and required stop
  points remain inside render bounds.
- The same acceptance report confirms tiny and medium converted OSM exercise
  QA still passes, and a default-map guard keeps the Marlowe synthetic map as
  the first/default route-runner option. No live Overpass data, external
  routing APIs, manual OSM direction edits, production map defaults, scoring,
  snapping, matching, saved attempts, analytics, or Supabase behaviour changed.
- Validation run for this pass: focused
  `routeRunnerOsmExerciseQa`/`routeRunnerOsmExerciseAcceptance` tests passed
  14/14, `npm.cmd run test:map` passed 640/640, `npm.cmd run lint` passed, and
  `npm.cmd run build` passed. `git diff --check` passed with Git's
  LF-to-CRLF working-copy normalization warnings only.

## Stage 116 Real London Pilot Exercise Polish

- The five `osm-real-london-pilot` exercises now keep their internal ids and
  stop definitions unchanged while exposing trainee-facing labels,
  descriptions, and visual-only difficulty metadata for the dev route runner.
  The selector now shows names such as `Goodge Street to Tottenham Court Road`
  and `Torrington Place one-way check` instead of raw debug-style titles.
- `/dev/route-runner` displays the selected real pilot exercise description
  and difficulty badge in the exercise brief. The display helper falls back to
  the exercise id, omits blank descriptions, and ignores unknown difficulty
  values so older Marlowe/synthetic exercises remain safe without metadata.
- Required stop markers are slightly clearer on the map canvas with stronger
  halos, shadows, and role text (`S`, `CPn`, `F`). Marker coordinates, route
  geometry, snapping, matching, scoring, saved attempts, analytics, Supabase
  behaviour, production map defaults, and OSM legality rules are unchanged.
- Stage 114 visual QA/debug overlay support is preserved: expected fastest
  route, snapped route, checkpoint markers, blocked-access visuals, and
  legality/debug metadata still use the existing real-pilot QA model.
- Validation run for this pass: focused display/availability/map/debug overlay
  tests passed 61/61, `npm.cmd run test:map` passed 645/645, and
  `npm.cmd run lint` and `npm.cmd run build` passed.

## Stage 117 Real London Pilot Manual Route Attempt QA

- The real London pilot now has a dev/test-only manual attempt QA harness for
  `osm-real-london-pilot`. It runs node/road/edge-sequence attempts through the
  route-runner exercise feedback path, including the exercise runner, scoring
  result, illegal movement highlighting, and attempt review summary.
- The Stage 117 tests build accepted manual attempts from the QA-approved legal
  fastest routes, then mutate those routes to cover rejected user-attempt cases:
  blocked one-way movement, unknown edge, skipped checkpoint, checkpoint order,
  incomplete route, wrong start, and an out-of-render-bounds QA guard.
- Manual attempt failures now expose deterministic dev QA reason codes such as
  `manual-attempt-valid`, `manual-attempt-blocked-directed-edge`,
  `manual-attempt-unknown-edge`, `manual-attempt-skipped-checkpoint`,
  `manual-attempt-checkpoint-order`, `manual-attempt-incomplete`,
  `manual-attempt-missing-start`, and `manual-attempt-outside-bounds`.
- This QA layer uses only the committed
  `lib/map-engine/osm/fixtures/realLondonPilotOverpass.json` fixture. It does
  not fetch live Overpass data, call external routing APIs, edit OSM road
  directions, change production scoring, or make the real OSM pilot the default
  route-runner map.
- Validation run for this pass: focused
  `routeRunnerOsmManualAttemptQa` tests passed 10/10,
  `npm.cmd run test:map` passed 655/655, `npm.cmd run lint` passed, and
  `npm.cmd run build` passed.

## Stage 118 Real London Pilot End-to-End Drawn Route QA

- The real London pilot now has a dev/test-only drawn-route QA helper for
  `osm-real-london-pilot`. It converts QA-approved legal fastest/reveal route
  edges into interior road-centreline draw points, then runs those traces
  through the same drawn-route pipeline used by `/dev/route-runner`: gesture
  validation, simplification, snapping, matching, exercise scoring, illegal
  movement highlighting, and review generation.
- The Stage 118 tests prove the original five real pilot exercises can pass end to end
  from generated drawn geometry, match the expected legal directed edges,
  preserve ordered checkpoint handling, and produce empty illegal movement
  highlights for valid reveal routes.
- The drawn-route QA helper returns deterministic failure codes for broken
  cases including `drawn-route-empty`, `drawn-route-unmatched`,
  `unknown-route-edge`, `illegal-directed-edge`, `accepted-route-expected`,
  `unexpected-illegal-highlight`, and `non-deterministic-review`.
- This remains dev/test-only and uses only the committed
  `lib/map-engine/osm/fixtures/realLondonPilotOverpass.json` fixture. It does
  not fetch live Overpass data, call external routing APIs, edit OSM road
  directions, change scoring rules, or change production behaviour.
- Validation run for this pass: focused
  `routeRunnerOsmDrawnRouteQa` tests passed 9/9,
  `npm.cmd run test:map` passed 664/664, `npm.cmd run lint` passed, and
  `npm.cmd run build` passed.

## Stage 119 Real London Pilot Consolidated Readiness Report

- Added a dev/test-only readiness report helper for `osm-real-london-pilot`
  built only from the committed
  `lib/map-engine/osm/fixtures/realLondonPilotOverpass.json` fixture and the
  existing Stage 115-118 QA helpers.
- The report consolidates map id, fixture source, exercise count, acceptance
  QA status, manual-attempt QA status, drawn-route QA status, render/bounds
  sanity, fastest legal route availability, illegal movement detection
  coverage, pass/fail section summary, deterministic prefixed failure reason
  codes, and an overall `ready` or `not-ready` status.
- Stage 119 reuses the existing acceptance, manual-attempt, drawn-route, and
  route-runner fit-bounds logic. It does not fetch live Overpass data, use
  external routing APIs, manually edit OSM road directions, weaken one-way or
  no-entry legality, change scoring rules, change production behaviour, or
  make the real London pilot the default map.
- Focused tests prove the current real pilot readiness report passes, includes
  every expected section, emits deterministic failure status output, keeps
  tiny and medium OSM acceptance regression behaviour unchanged, and leaves the
  Marlowe synthetic map as the default route-runner map.
- Validation for this stage is covered by the focused
  `routeRunnerOsmRealPilotReadinessReport` test, `npm.cmd run test:map`,
  `npm.cmd run lint`, and `npm.cmd run build`.

## Stage 120 Real London Pilot Dev Readiness Panel

- `/dev/route-runner` now shows a compact real London pilot readiness panel
  when the selected map is `osm-real-london-pilot`.
- The panel is powered by the deterministic Stage 119 consolidated readiness
  report and displays map id, committed fixture name, exercise pass/fail
  counts, readiness state, exercise ids, acceptance QA, manual-attempt QA,
  drawn-route QA, and deterministic failure reason codes.
- The panel helps confirm the real London pilot is safe to test manually in
  the browser while keeping Marlowe as the default synthetic map.
- This remains dev/test-only and uses only the committed
  `lib/map-engine/osm/fixtures/realLondonPilotOverpass.json` fixture. It does
  not fetch live OSM/Overpass data, use external routing APIs, manually edit
  OSM road directions, weaken one-way/no-entry legality, change scoring rules,
  or change production behaviour.
- Focused tests cover ready formatting, stable summary ordering, all real pilot
  exercise ids, `none` failure display, deterministic broken-report failure
  reasons, repeated formatting stability, and guards that keep Marlowe plus
  tiny/medium OSM maps from showing the real pilot panel.

## Stage 121 Real London Pilot Route Playthrough UX Polish

- `/dev/route-runner` now shows real London pilot playthrough guidance when
  the selected map is `osm-real-london-pilot`.
- The panel helps manual QA testers understand the selected exercise id, start
  location, destination, ordered checkpoints, reveal-route availability,
  current drawn/manual route status, illegal movement highlight state, and the
  next action to take.
- The formatter is dev/test-only and presentation-only: it consumes existing
  route-runner state such as exercise selection, reachability, reveal overlay
  state, drawn review status, manual run status, and illegal highlight counts
  without duplicating routing, matching, scoring, checkpoint, or legality logic.
- This stage uses only the committed
  `lib/map-engine/osm/fixtures/realLondonPilotOverpass.json` fixture. It does
  not fetch live OSM/Overpass data, use external routing APIs, manually edit
  OSM road directions, weaken one-way/no-entry legality, change scoring rules,
  or change production behaviour.
- Focused tests cover real-pilot-only visibility, Marlowe/tiny/medium map
  guards, selected exercise id display, stable start/destination labels,
  ordered checkpoints, `none` checkpoint display, reveal-route availability,
  empty/accepted/rejected attempt states, illegal-highlight guidance, stable
  next actions, and repeated formatting determinism.

## Stage 122 Real London Pilot Exercise Expansion

- The dev-only `osm-real-london-pilot` map now has eight additional
  QA-validated exercises, expanding the real pilot set from five to thirteen
  exercises while keeping Marlowe as the default route-runner map.
- The new exercises cover a short A-to-B route, medium A-to-B route,
  checkpoint routes, a four-stop route, one-way awareness, longer legal
  detours, and a route-choice exercise with multiple plausible legal options.
- The readiness report and `/dev/route-runner` QA panel automatically include
  the expanded exercise set because they consume the shared real London pilot
  exercise list and Stage 119 deterministic QA helpers.
- This remains dev/test-only and uses only the committed
  `lib/map-engine/osm/fixtures/realLondonPilotOverpass.json` fixture. It does
  not fetch live OSM/Overpass data, use external routing APIs, manually edit
  OSM road directions, weaken one-way/no-entry legality, change snapping,
  matching, or scoring rules, or change production behaviour.
- Focused tests lock the new exercise ids, route shapes, ordered checkpoint
  reachability, one-way detour behaviour, expanded readiness/panel counts,
  tiny/medium OSM regressions, and Marlowe default-map guardrails.

## Stage 123 Real London Pilot Exercise Difficulty Metadata

- Every dev-only `osm-real-london-pilot` exercise now declares structured
  metadata for difficulty, route type, estimated distance in metres, and a
  deterministic expected-complexity note.
- The metadata is declared beside the existing real London pilot exercises and
  is carried into the deterministic readiness report plus the
  `/dev/route-runner` QA panel, where difficulty and route type are shown in
  the compact exercise list.
- The metadata is descriptive only. It does not change route legality,
  snapping, matching, scoring, saved attempts, analytics, auth, Supabase,
  deployment config, production behaviour, or default map selection.
- This remains dev/test-only, keeps Marlowe as the default map, and continues
  to use only the committed
  `lib/map-engine/osm/fixtures/realLondonPilotOverpass.json` fixture with no
  live OSM/Overpass fetches or external routing APIs.
- Focused tests validate metadata completeness and allowed values, confirm the
  declared estimated distances match locked acceptance QA distances, prove the
  readiness report and QA panel preserve the metadata, and re-check
  tiny/medium OSM plus Marlowe guardrails.

## Stage 124 Map and Exercise Versioning

- Registered route-runner maps now expose `mapVersion`, and registered route
  exercises now expose `exerciseVersion`, both using simple
  `major.minor.patch` semver-style strings.
- Existing maps and exercises start at `1.0.0`. The numeric internal map
  `version` field is preserved where it already existed, but the new semver
  fields are the explicit metadata used for dev QA, future migration checks,
  beta debugging, and saved attempt metadata.
- The route-runner exercise brief now shows selected map and exercise versions,
  and the real London pilot readiness panel includes map/exercise versions
  alongside the Stage 123 difficulty/type/distance metadata.
- Added deterministic validation helpers for registered map/exercise version
  metadata. Focused tests reject missing, empty, and non-semver values and
  prove every registered route-runner map and exercise has valid version
  metadata.
- This remains metadata-only. It does not change route legality, route solving,
  snapping, matching, scoring, analytics, auth, Supabase schema, production
  behaviour, or default map selection. Marlowe remains the default map, and
  `osm-real-london-pilot` still uses only the committed
  `lib/map-engine/osm/fixtures/realLondonPilotOverpass.json` fixture with no
  live OSM/Overpass fetches or external routing APIs.

## Stage 125 Route Attempt Version Snapshots

- `/dev/route-runner` route attempt reviews now capture an immutable
  `versionSnapshot` when the attempt is created, containing the selected
  `mapId`, `mapVersion`, `exerciseId`, and `exerciseVersion`.
- Session attempt history, saved-attempt storage input, and saved-attempt
  review/debug display read the stored snapshot where available instead of
  recomputing versions from the current selected map or exercise.
- Legacy attempt-like objects with no snapshot continue to render deterministic
  unavailable labels instead of failing.
- The snapshot is debug/presentation metadata only. It does not change route
  solving, snapping, matching, legality, illegal movement detection, scoring,
  Supabase/auth/analytics behaviour, production persistence, deployment config,
  or default map selection.
- Marlowe remains the default map, and `osm-real-london-pilot` still uses only
  the committed `lib/map-engine/osm/fixtures/realLondonPilotOverpass.json`
  fixture with no live OSM/Overpass fetches or external routing APIs.

## Stage 126 OSM Conversion Stability Checks

- Added focused deterministic OSM conversion stability coverage for the
  committed tiny London, medium London, and real London pilot fixtures.
- The checks prove repeated conversion and reordered Overpass input elements
  produce equivalent normalized maps, converted node/road/edge identifiers stay
  stable, graph references are internally valid, bounds and stop coordinates are
  finite, and one-way/two-way edge expansion remains deterministic.
- The tests also lock preservation of app-facing road metadata and deterministic
  handling of skipped malformed OSM data.
- This remains fixture-only: `osm-real-london-pilot` still uses the committed
  `lib/map-engine/osm/fixtures/realLondonPilotOverpass.json` file with no live
  Overpass fetches and no external routing APIs.
- No route solving, scoring, snapping, legality, attempt review, UI production,
  Supabase, auth, analytics, deployment, or default-map behaviour changed.
  Marlowe remains the default map.

## Stage 127 OSM Restriction and Legality Audit

- Added a dev/test-only OSM legality audit helper for converted route-runner
  maps, with focused coverage registered under `npm.cmd run test:map`.
- The audit verifies legal OSM movements, one-way forward and reverse
  traversal, blocked-edge handling through an in-memory restriction overlay,
  unknown road/node/edge rejection, mixed legal/illegal movement ordering,
  generated fastest-route legality, and real London manual-attempt illegal
  feedback.
- The audit reuses the existing legality engine, directed-edge validation,
  fastest-route overlay, and manual-attempt QA path instead of changing route
  solving, scoring, snapping, or review behavior.
- This remains committed-fixture-only. `osm-real-london-pilot` still uses
  `lib/map-engine/osm/fixtures/realLondonPilotOverpass.json`; there are no live
  Overpass fetches and no external routing APIs.
- Marlowe remains the default map, and production behavior, Supabase, auth,
  analytics, and deployment behavior are unchanged.

## Separate Stage Mobile Route Runner QA

- Added a focused dev/test-only mobile QA helper for `/dev/route-runner`, with
  deterministic coverage registered under `npm.cmd run test:map`.
- The helper checks semantic mobile layout and interaction readiness: required
  controls, visible bounded map area, scroll release behavior, touch drawing,
  zoom control reachability, selected exercise visibility, and real London
  QA/playthrough/version/metadata panel overflow risk.
- This mobile QA is intentionally separate from route engine work. It does not
  run or change route solving, scoring, snapping, legality, OSM conversion,
  attempt persistence, Supabase, auth, analytics, deployment, or production
  behavior.
- `osm-real-london-pilot` remains committed-fixture-only using
  `lib/map-engine/osm/fixtures/realLondonPilotOverpass.json`; there are no live
  Overpass fetches and no external routing APIs. Marlowe remains the default
  map.

## Stage 128 Second London Pilot Map and Starter Exercises

- Added a second dev/test-only London pilot map, `osm-real-london-pilot-2`,
  backed by the committed local
  `lib/map-engine/osm/fixtures/realLondonPilotTwoOverpass.json` fixture.
- The second pilot uses the existing OSM conversion/import path and appears as a
  separate selectable `/dev/route-runner` map labelled `Real London pilot map 2`
  without replacing or mutating the existing `Real London pilot map`. The
  generic `OSM Large London` fixture remains separately selectable.
- Added three starter exercises for the second pilot: an easy direct route, a
  medium checkpoint route, and a medium one-way-awareness route, all with
  deterministic difficulty/type/distance/complexity metadata plus semver map and
  exercise versions.
- Extended deterministic readiness/QA coverage and the real London pilot
  dev-only QA/playthrough panels so both pilot maps are supported while unrelated
  synthetic and non-pilot OSM maps remain excluded.
- This remains committed-fixture-only with no live Overpass fetches, no external
  routing APIs, and no production behavior changes. Marlowe remains the default
  map.

## Stage 129 Dev Exercise Candidate Generator

- Added a dev/test-only route-runner exercise candidate generator that proposes
  review candidates from committed map data without registering them as official
  playable exercises.
- The generator produces deterministic candidate IDs, start/destination nodes,
  optional checkpoint nodes, estimated route distance, fastest-route edge count,
  difficulty/type estimates, review status, notes, warnings, and stable
  rejection reason codes.
- Added deterministic QA review output with map/version metadata, accepted and
  rejected counts, grouped rejection reasons, grouped warnings, and a
  `hasReviewableCandidates` flag for human inspection.
- Candidate generation reuses existing legal route helpers and remains bounded,
  fixture-only, and review-only. It does not change route solving, scoring,
  snapping, legality, official exercises, Supabase, auth, analytics, deployment,
  production behavior, or default map selection.
- Focused coverage can be run with
  `npm.cmd run test:route-candidate-generator`; it is also registered under
  `npm.cmd run test:map`.

## Stage 130 Real London Beta Gate and Readiness Review

- Real London route-runner practice is now behind the default-disabled
  `NEXT_PUBLIC_REAL_LONDON_BETA` feature flag. Accepted enabled values include
  `1`, `true`, `yes`, `on`, and `enabled`.
- Non-beta users keep the Marlowe default route-runner experience. Real London
  pilot maps are filtered out of the visible map selector, and direct requests
  for a real London map return a safe unavailable state explaining that access
  is beta-gated.
- Beta-enabled testers can access the fixture-backed real London pilot maps.
  The dev UI shows a clear Real London beta label, known limitations, a
  feedback placeholder, and OpenStreetMap attribution when an OSM-derived beta
  map is shown.
- Known limitations are explicit: committed local fixtures only, no live OSM or
  Overpass data, limited pilot coverage, QA/beta review required before
  production exposure, and mobile/touch interaction requiring final acceptance
  through the separate mobile QA stage.
- Added a deterministic Phase 5 real London beta readiness review covering beta
  gating, beta access, non-beta default behavior, safe unavailable state, real
  map readiness, pilot exercise QA, attempt version snapshots, student route
  flow, OSM attribution, documented limitations, and the separate mobile QA
  status.
- This is a release-readiness gate only. It does not change route solving,
  scoring, snapping, legality, official exercises, map data, Supabase, auth,
  analytics, persistence, deployment behavior, production route behavior, or
  default map selection.
- Focused coverage can be run with `npm.cmd run test:real-london-beta-gate`;
  it is also registered under `npm.cmd run test:map`.

## Stage 131 Map Visual Semantics and One-Way Arrow Density

- `/dev/route-runner` now applies a deterministic one-way arrow spacing rule:
  arrows on the same road/rendered OSM way group are kept at least 50 metres
  apart, while nearby arrows on different roads are left alone.
- Short one-way roads still get a single permitted-direction arrow when the
  renderer would otherwise show one, and arrow direction metadata is preserved.
- The compact route-runner legend now clarifies that blue arrows mean permitted
  one-way travel direction, orange/yellow roads highlight routable or important
  road geometry, and grey roads are context/de-emphasised geometry rather than
  automatically unavailable roads.
- This stage is presentation-only. It does not change route solving, scoring,
  snapping, legality, exercise definitions, OSM fixtures, Supabase, auth,
  analytics, deployment behavior, production behavior, or default map
  selection. Marlowe remains the default route-runner map, and the real London
  pilot maps remain committed-fixture-only.
- Focused coverage can be run with `npm.cmd run test:map-visual-semantics`;
  it is also registered under `npm.cmd run test:map`.

## Stage 131.5 Compact Real London QA and Practice Panels

- Compact Real London QA exercise output now uses dense table-style rows while
  preserving exercise id, exercise version, difficulty, route type, distance,
  brief/complexity text, and pass/fail readiness state.
- The route-runner exercise selector is presented as a single â€œPractice
  Exercisesâ€ area, avoiding duplicate official/recommended exercise lists while
  preserving existing exercise selection behavior.
- Real London beta practice now defaults to a clean student-facing view labelled
  â€œReal London Practice Betaâ€ with compact exercise selection, route
  instructions, known limitations, feedback placeholder, map legend, and OSM
  attribution where available.
- Internal QA/debug panels remain available for dev/QA review but are hidden by
  default for beta-student mode: readiness diagnostics, fixture filenames,
  pass/fail QA counts, metadata coverage counts, full restriction debug details,
  and raw map ids are not exposed unless QA/debug panels are explicitly shown.
- Restriction overlays are summary-first and compact by default. Full overlay
  symbol details remain accessible for QA/debugging without changing legality,
  scoring, snapping, OSM conversion, route solving, exercises, attempt
  versioning, Supabase, auth, analytics, deployment behavior, production
  behavior, or default map selection.
- Focused coverage can be run with
  `npm.cmd run test:compact-real-london-panels`; it is also registered under
  `npm.cmd run test:map`.

## Stage 132 Student-Facing Real London Beta Practice Screen

- Added `/practice/real-london` as a beta-gated student-facing Real London
  practice screen. When `NEXT_PUBLIC_REAL_LONDON_BETA` is disabled, the page
  shows a safe unavailable state and keeps Marlowe as the default route-runner
  experience.
- When enabled, the screen labels itself as "Real London Practice - Beta",
  shows compact exercise selection metadata, route instructions, known
  limitations, feedback placeholder text, OSM attribution, and the route-runner
  map legend without exposing internal QA diagnostics.
- The page mounts the existing route-runner drawing, snapping, scoring, and
  review flow in student beta mode. It does not duplicate or change route
  solving, scoring, snapping, legality, OSM conversion, exercises, Supabase,
  auth, analytics, deployment behavior, production behavior, or default map
  selection.
- Dev/QA surfaces stay available on `/dev/route-runner`; beta testers do not
  see readiness panels, fixture filenames, QA pass/fail counts, metadata
  coverage counts, raw map ids, or full restriction debug details by default.
- Focused coverage can be run with
  `npm.cmd run test:real-london-beta-practice-screen`; it is also registered
  under `npm.cmd run test:map`.

## Stage 133 Beta Tester Entry Point and Feedback Flow

- Added `/beta` as the beta tester entry route. It clearly labels the Real
  London practice pilot as beta, explains the limited review state, shows known
  limitations and OSM attribution when access is enabled, and links testers into
  `/practice/real-london`.
- When `NEXT_PUBLIC_REAL_LONDON_BETA` is disabled, `/beta` shows a safe
  unavailable state and links back to standard `/practice`; Marlowe remains the
  default map and Real London is not exposed as the default route-runner
  experience.
- The `/practice` hub now shows a small beta entry card only when beta access is
  enabled. Non-beta users keep the existing practice hub without a Real London
  beta card.
- Added a typed local-only feedback flow for the Real London beta practice
  screen. Feedback captures rating, issue type, comments, stage `133`, map and
  exercise ids/versions, exercise title, timestamp, and beta access state, then
  returns a deterministic local no-op success result. It does not send, email,
  persist, or use Supabase/auth/analytics/external services.
- Focused coverage can be run with
  `npm.cmd run test:real-london-beta-entry-feedback`; it is also registered
  under `npm.cmd run test:map`.

## Stage 134 Store Public Beta Feedback

- Replaced the Stage 133 local/no-op feedback submission with
  `POST /api/beta-feedback`. The API validates the typed beta feedback payload
  server-side, rejects invalid submissions with stable `400` responses, rejects
  submissions while `NEXT_PUBLIC_REAL_LONDON_BETA` is disabled, and returns
  explicit unavailable responses when feedback storage is not configured.
- Real London beta access is public when enabled with
  `NEXT_PUBLIC_REAL_LONDON_BETA=true`; it is not invite-only and does not
  require login, auth, analytics, email delivery, Supabase writes, or external
  feedback services. Real London still remains behind the public beta flag and
  Marlowe remains the default practice map.
- Added a small `BetaFeedbackStore` abstraction. In local development and test
  environments, feedback is written as JSONL to `.local/beta-feedback.jsonl`;
  `.local/` is gitignored and stored feedback must not be committed.
- Production currently returns a clear not-configured/unavailable response
  unless a durable production store is added later. The frontend surfaces that
  failure and keeps the user's typed comments instead of pretending feedback was
  saved.
- Feedback payloads preserve Stage 133 context with `sourceStage: 133` and now
  submit as Stage `134`, including map/exercise ids and versions, exercise
  title, timestamp, beta access state, rating, issue type, and comments.
- Focused coverage can be run with
  `npm.cmd run test:public-beta-feedback`; it is also registered under
  `npm.cmd run test:map`.

## Stage 135 Add Production Beta Feedback Storage

- Added durable production storage for Real London public beta feedback through
  the existing `BetaFeedbackStore` adapter. Local development and test behavior
  remains unchanged: feedback writes to `.local/beta-feedback.jsonl`, and that
  folder is gitignored.
- Production storage is enabled only when these server-only environment
  variables are configured:

  ```bash
  NEXT_PUBLIC_REAL_LONDON_BETA=true
  BETA_FEEDBACK_STORAGE=supabase
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
  BETA_FEEDBACK_TABLE=beta_feedback
  ```

  `BETA_FEEDBACK_TABLE` is optional and defaults to `beta_feedback`.
  Do not use `NEXT_PUBLIC_` for service-role secrets. `SUPABASE_SERVICE_ROLE_KEY` is
  server-only and is read only by the beta feedback storage adapter.
- Added `supabase/migrations/005_beta_feedback.sql` for the production
  `public.beta_feedback` table. The table stores the validated feedback payload
  faithfully in `payload jsonb` plus simple indexed metadata columns:
  `map_id`, `exercise_id`, `rating`, and `feedback_type`. Row-level security is
  enabled and no direct anon/authenticated table grants are added; the API uses
  the server-side service role when configured.
- If production storage is missing or unsupported, `POST /api/beta-feedback`
  returns a clear unavailable response. If the Supabase/PostgREST write fails,
  the API returns a storage failure response and never fakes success.
- The API still validates payloads and checks `NEXT_PUBLIC_REAL_LONDON_BETA`
  before touching storage, so disabled beta access and invalid submissions do
  not call the production store. Marlowe remains the default practice map and
  route scoring, snapping, legality, exercises, OSM conversion, auth, analytics,
  and unrelated persistence are unchanged.
- Focused coverage remains
  `npm.cmd run test:public-beta-feedback`; it is also registered under
  `npm.cmd run test:map`.

## Stage 136 Add Beta Feedback Review and Export Tool

- Added an internal review surface at `/dev/beta-feedback` for stored Real
  London beta feedback. It is not a public beta-user feature and stays
  unavailable unless `BETA_FEEDBACK_REVIEW_ENABLED=true` is set.
- The review tool reuses the Stage 135 storage configuration. In development
  and test it reads validated local JSONL records from
  `.local/beta-feedback.jsonl`. In production it reads the configured
  Supabase/PostgREST `beta_feedback` table only when the server-only storage
  variables are present; missing production config returns a safe unavailable
  state.
- The page and `GET /api/beta-feedback/review` show created time, map id,
  exercise id, rating, feedback type, notes, map/exercise version metadata,
  storage source/status, and a collapsed raw payload preview. Filtering is
  supported by map id, exercise id, rating, and feedback type, with results
  ordered newest first.
- CSV (`format=csv`) and JSON (`format=json`) exports include only validated
  stored feedback records. Invalid stored rows are skipped with deterministic
  review reason codes and are not exported.
- Security limitations: do not expose this route to beta testers. Do not use `NEXT_PUBLIC_`
  for service-role secrets. `SUPABASE_SERVICE_ROLE_KEY` remains
  server-only, is not read by the review page client surface, and is never
  returned in review API responses or exports.
- Focused coverage remains
  `npm.cmd run test:public-beta-feedback`; it is also registered under
  `npm.cmd run test:map`.

## Stage 137 Beta Safety, Rate Limit, and Error Hardening

- Hardened `POST /api/beta-feedback` and `GET /api/beta-feedback/review` with
  stable JSON errors for unsupported methods, malformed JSON, unsupported
  content types, oversized request bodies, invalid payloads, disabled feature
  flags, rate-limited submissions, missing storage, and storage failures.
- Feedback writes now reject before storage when the request body is too large
  or comments exceed the configured length. Defaults are a 16 KB JSON request
  body and 2,000 feedback-comment characters; override with
  `BETA_FEEDBACK_REQUEST_BODY_MAX_BYTES` and
  `BETA_FEEDBACK_COMMENTS_MAX_LENGTH` when needed.
- Added a deterministic in-memory abuse guard for beta feedback writes. It is
  enabled automatically in production or explicitly with
  `BETA_FEEDBACK_RATE_LIMIT_ENABLED=true`; configure it with
  `BETA_FEEDBACK_RATE_LIMIT_WINDOW_MS` and `BETA_FEEDBACK_RATE_LIMIT_MAX`.
  Requests are keyed by forwarded/IP-like headers with an anonymous fallback.
- Review/export remains gated by `BETA_FEEDBACK_REVIEW_ENABLED=true`. Unsupported
  review methods return stable JSON, and unexpected review read failures return
  a safe failure response instead of stack traces.
- Safe error policy: API responses do not include stack traces, storage
  exception details, `SUPABASE_SERVICE_ROLE_KEY`, server environment values, or
  user-identifying feedback content in error messages. Storage failures never
  return fake success.
- Production limitation: the in-memory rate limiter is process-local. It is a
  beta hardening guard, not a distributed abuse-prevention layer.
- Focused coverage remains
  `npm.cmd run test:public-beta-feedback`; it is also registered under
  `npm.cmd run test:map`.

## Stage 138 Beta Attempt Review and Repro Export

- Added an internal attempt review surface at `/dev/beta-attempts` plus
  `GET /api/beta-attempts/review` for stored Real London beta route attempts.
  This is not a public beta-user feature and stays unavailable unless
  `BETA_ATTEMPT_REVIEW_ENABLED=true` is set.
- Development and test review reads validated local JSONL records from
  `.local/beta-attempts.jsonl`. Production review intentionally returns a safe
  unavailable state unless a future explicit admin-safe attempt storage path is
  added.
- The review page shows created time, attempt id, map/exercise ids and
  versions, start/destination/checkpoints, exercise difficulty/type, score and
  pass/fail status, stored legality status, route distance/summary, storage
  source/status, and a collapsed raw snapshot preview.
- Filtering is supported by map id, exercise id, pass/fail/blocked/unknown
  status, and legal/illegal/unknown legality, with records ordered newest first.
- JSON repro export (`format=json`) includes only validated stored attempts and
  preserves the captured attempt snapshot, map/exercise versions, stored
  drawn/manual route data, scoring summary, legality summary, failure reason,
  and app build metadata when present. It does not expose server secrets or
  environment variables.
- Focused coverage is `npm.cmd run test:beta-attempt-review`; the new helper
  and API tests are also registered under `npm.cmd run test:map`.

## Stage 139 Complete Real London Mobile QA Pass

- Completed a mobile-only polish pass for `/practice/real-london`. The beta
  header is more compact on narrow screens, the current task is summarized
  first, full route instructions and known limitations are collapsed by
  default, and the existing combined `Practice Exercises` selector remains the
  single exercise/practice surface.
- The route map keeps the existing touch drawing/pan/zoom logic, but now uses a
  smaller mobile minimum map height so the exercise controls, map, attempt
  review, and feedback form are easier to reach on phone-sized layouts.
- Restriction information remains summary-first for beta users: one-way,
  illegal/wrong-way, and turn/route issue highlighting stays accessible while
  full debug details remain hidden outside dev QA mode.
- Feedback controls received mobile-safe touch targets and the screen model now
  records mobile QA expectations for compact instructions, feedback usability,
  route-runner map touch behavior, and collapsed restriction details.
- The existing Stage 131 one-way arrow visual thinning rule remains active:
  arrows on the same rendered road group are spaced by at least 50 metres where
  possible. This is presentation-only and does not change underlying one-way
  data, routing, scoring, snapping, legality checks, OSM conversion, attempt
  versioning, storage, auth, analytics, or Marlowe/default-map behavior.
- Focused coverage remains `npm.cmd run test:real-london-beta-practice-screen`;
  it is also registered under `npm.cmd run test:map`.

## Stage 140 Phase 5 Beta Readiness Freeze and Sign-Off

- Phase 5 is now frozen and signed off as **Real London beta-ready**, not final
  production-ready. The beta remains behind the default-disabled
  `NEXT_PUBLIC_REAL_LONDON_BETA` flag, and Marlowe remains the default
  route-runner map for non-beta users.
- Added a deterministic Stage 140 readiness sign-off report covering beta
  gating, non-beta fallback behavior, committed fixture map registration, map
  and exercise version metadata, attempt version snapshots, scoring/snapping
  and legality QA coverage, OSM attribution, feedback storage, internal review
  gates, mobile QA status, known limitations, and the final beta/not-production
  readiness statement.
- Frozen beta scope includes the two committed fixture-backed real London pilot
  maps: `Real London pilot map` and `Real London pilot map 2`. Their official
  registered starter exercises and versioned metadata are included. The generic
  `OSM Large London` map remains a separate dev map and is not the beta default.
- The beta intentionally excludes live Overpass/OSM fetches, external routing
  APIs, new OSM data, final production exposure, production admin auth for
  review tools, analytics instrumentation, and any route solving, scoring,
  snapping, legality, OSM conversion, storage, auth, or deployment behavior
  changes.
- Feedback remains available through `/api/beta-feedback`. Local/test feedback
  uses `.local/beta-feedback.jsonl`; production feedback uses the Stage 135
  Supabase/PostgREST storage path when `BETA_FEEDBACK_STORAGE=supabase`,
  `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` are configured. Missing
  production storage fails safely rather than pretending feedback was saved.
- Internal tools remain gated and are not public beta-user features:
  feedback review/export uses `BETA_FEEDBACK_REVIEW_ENABLED` and
  `/api/beta-feedback/review`; attempt review/repro export uses
  `BETA_ATTEMPT_REVIEW_ENABLED` and `/api/beta-attempts/review`.
- Known limitations: the beta uses committed local OSM fixtures only, covers
  only the current pilot areas and starter exercises, still needs human beta
  feedback triage, and is intended for beta validation rather than final public
  production rollout.
- Testers should report unclear route instructions, missing/confusing labels,
  wrong-way or restriction concerns, touch/zoom/scroll/drawing issues,
  difficulty mismatches, and feedback submission problems.
- Phase 6 handoff: beta feedback triage, more London areas, more exercises,
  production admin/auth hardening for review tools, optional analytics, broader
  device QA, tester onboarding improvements, and further map styling refinements.
- Focused coverage can be run with
  `npm.cmd run test:phase5-beta-readiness`; it is also registered under
  `npm.cmd run test:map`. The final validation set for this sign-off is
  `npm.cmd run test:phase5-beta-readiness`,
  `npm.cmd run test:public-beta-feedback`, `npm.cmd run test:map`,
  `npm.cmd run lint`, and `npm.cmd run build`.

