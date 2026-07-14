# Stage 8.9 Learner and Review Overlay Rebalance

## Status

Stage 8.9 is implemented and visually accepted against the approved Phase 8
visual master at displayed 100%. Stage 8.10 has not started. The preserved
`WIP Stage 8.9 overlay rebalance before Stage 8.8.1` stash remains intact and
was not applied, popped or dropped during the focused correction.

The focused submission-parity correction is also complete. Real London
Practice beta and Learner Training now use one shared submission/review
implementation, and Training hints use timed responsive disclosure rather than
the former inline instruction block. Detailed evidence is indexed in
`docs/submission-parity/README.md`.

## Purpose

This stage keeps learner routes, markers, hints and submitted-review feedback
immediately understandable without turning the map into a route-first
navigation display. Dense source-backed roads, names, A/B references,
junctions, buildings and landmarks remain useful for independent route
planning beneath the learner state.

The repository Phase 8 roadmap, baseline audit and full specification are the
authoritative scope. The approved visual master controls the desired density
and information hierarchy, not overlay artwork or geography.

## Overlay Hierarchy And Ownership

The renderer now uses typed central overlay tokens for route widths, casings,
opacity, marker dimensions and visible marker radii. The deterministic stack is:

1. Base geography, roads and geographic labels.
2. Correct/planned route and accepted learner movement.
3. Attempt and submitted-review route state.
4. Subordinate hints and warnings.
5. Checkpoints, start/destination markers and review feedback.
6. Keyboard focus and restriction focus.

Normal learner state owns the visible route, endpoints, route-review feedback
and training endpoints. Training review owns its attempt and review overlays,
preventing normal and training renderers from drawing the same information.
Pipeline matching, selected-road and snap-preview diagnostics remain available
to development diagnostics but are suppressed in learner-facing active and
submitted states.

## Visual Rules

- Learner and planned routes use narrower, bounded casings and opacity so road
  names, references and junction geometry remain visible.
- Start, destination and checkpoint artwork is visibly smaller while existing
  interaction hit targets remain independently usable.
- Mistake and invalid-section symbols remain compact, distinct and above the
  associated route state.
- Hints stay below markers and use general decision-making language rather
  than turn-by-turn instructions.
- Marker and feedback reservations are compact. The former broad route-wide
  label reservation was removed so routes do not create artificial blank
  strips through the atlas labels.
- The same reusable ownership and style rules apply across London; no
  route-specific or location-specific exception was added.

## Screenshot Matrix

All captures use the production renderer and displayed 100%. Desktop captures
are 1440 by 900 and mobile captures are 390 by 844.

| State | Desktop evidence | Mobile evidence |
| --- | --- | --- |
| No active route | `screenshots/stage-8-9/desktop-kings-cross-no-active-route-100.jpg` | `screenshots/stage-8-9/mobile-kings-cross-no-active-route-100.jpg` |
| Active training route and compact markers | `screenshots/stage-8-9/desktop-kings-cross-active-training-route-markers-100.jpg` | `screenshots/stage-8-9/mobile-kings-cross-active-training-route-markers-100.jpg` |
| Active route over Piccadilly central junctions | `screenshots/stage-8-9/desktop-piccadilly-active-route-100.jpg` | n/a |
| Active route across the Waterloo/Thames corridor | `screenshots/stage-8-9/desktop-waterloo-active-route-100.jpg` | n/a |
| Mistake or invalid route state | `screenshots/stage-8-9/desktop-kings-cross-active-mistake-route-100.jpg` | `screenshots/stage-8-9/mobile-kings-cross-mistake-state-100.jpg` |
| Correct submitted review | `screenshots/stage-8-9/desktop-kings-cross-correct-review-map-100.jpg` and `desktop-kings-cross-correct-review-panel-100.jpg` | `screenshots/stage-8-9/mobile-kings-cross-correct-review-map-100.jpg` |
| Incorrect submitted review | `screenshots/stage-8-9/desktop-kings-cross-incorrect-mistake-review-100.jpg` | `screenshots/stage-8-9/mobile-kings-cross-incorrect-review-100.jpg` |
| Hint and feedback | `screenshots/stage-8-9/desktop-kings-cross-hint-feedback-100.jpg` | `screenshots/stage-8-9/mobile-kings-cross-hint-feedback-100.jpg` |

Normal-size inspection found the route and review states immediately legible
without obscuring the dense atlas field. Road names, A/B references, building
fabric and junction structure remain visible around and beneath the thinner
overlays. Correct and incorrect submitted states are visibly distinct, OSM
attribution remains present, and marker artwork fits mobile without clipping.
Piccadilly and Waterloo active-route captures confirm the same hierarchy over
a dense central junction and a river crossing outside the King's Cross fixture.

The first active-route inspection exposed a dominant turquoise chain of snap
points and selected-road highlighting. Those are pipeline diagnostics rather
than learner information, so final tuning removed them from learner-facing
active and submitted states while retaining them in development diagnostics.

## Interaction And Performance

Pan, wheel zoom, reset to displayed 100%, route drawing, submission and review
transitions were exercised in the browser. Routes, markers and review feedback
remained coordinate-aligned while panning and zooming. The ownership change
removes duplicate learner-facing diagnostic work and does not add per-frame
geometry processing.

Automated interaction tests continue to cover two-contact pinch behaviour. A
physical touch-device pinch check remains part of the Stage 8.10 mobile and
accessibility gate because the integrated browser cannot synthesize that
gesture.

## Automated Validation

- `npm.cmd run lint`: passed with no ESLint warnings or errors.
- `npm.cmd run test:map`: 1,221 passed; 0 failed, skipped, cancelled or todo.
- `npm.cmd test`: passed all eight chained suites, including route scoring,
  map, mock exam, mock selection, admin questions, database persistence,
  progress analytics and training; no required suite was skipped.
- `npm.cmd run build`: passed compilation, type checking, 70/70 static pages
  and build-trace collection. Existing webpack cache-size and Supabase
  Edge-runtime compatibility notices remain non-failing build warnings.
- `git diff --check`: passed. Git reported only expected Windows line-ending
  conversion notices.

## Deliberate Non-Changes

- No Stage 8.8.1 roads, buildings, labels, symbols, parks, land use, water or
  principal-scale framing were redesigned.
- No route generation, legality, validation, snapping, matching, scoring,
  curated training-route or progress behaviour changed.
- No geography was fabricated and no proprietary map tiles were introduced.
- The development-only narrow-screen toolbar and broader mobile composition
  remain Stage 8.10 work.

## Known Limitations

The mobile QA shell retains its inherited tall source framing and development
toolbar behaviour. This stage verifies overlay scaling and alignment within
that shell; Stage 8.10 owns the full mobile, tablet, accessibility and physical
touch-device pass.

The shared-submission correction used one isolated headless Chrome process
after the integrated browser backend became unavailable. Accepted desktop and
mobile evidence, including transient loading and paused-timer states, is stored
under `docs/submission-parity/screenshots/`.
