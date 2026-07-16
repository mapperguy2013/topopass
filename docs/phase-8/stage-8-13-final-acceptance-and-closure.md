# Stage 8.13: Phase 8 Final Acceptance and Closure

## Decision

Phase 8 cartography is accepted and closed on 16 July 2026.

The final production evidence is recognisably part of the approved dense London
examination-atlas family while remaining an original TOPOPASS implementation.
Rendered geography is source-backed and attributed; neither approved visual
master is used as product geography or a raster layer.

This decision closes cartographic acceptance. Physical-device interaction checks
listed below remain release QA and must still be completed before relying on the
affected mobile interactions in production.

## Evidence Reviewed

The controlling appearance references were inspected at normal displayed size,
with v2 primary and v1 secondary:

- `references/phase-8-approved-exam-atlas-visual-master-v2.png`
- `references/phase-8-approved-exam-atlas-visual-master.png`

The Stage 8.12 owner pack, Stage 8.8.3 density audit and all current Stage 8.11
screenshots were reviewed. The final representative matrix is:

| Evidence | Viewport | Acceptance coverage |
| --- | --- | --- |
| `victoria-neutral-desktop.png` | 1440 x 900 | Victoria, Pimlico, Westminster, Vauxhall, Lambeth and Thames density |
| `kings-cross-correct-review-desktop.png` | 1440 x 900 | King's Cross/Euston, A501 geometry and passing review |
| `piccadilly-active-route-desktop.png` | 1440 x 900 | Piccadilly density, active route and markers |
| `one-way-restrictions-desktop.png` | 1440 x 900 | Post-supplement one-way/restriction context and attribution |
| `waterloo-context-tablet.png` | 768 x 1024 | Waterloo, Thames, bridges, rail and tablet layout |
| `waterloo-incorrect-review-mobile.png` | 390 x 844 | Incorrect review and mobile feedback |
| `piccadilly-hint-mobile.png` | 390 x 844 | Compact hint over dense mobile geography |
| `quiet-residential-mobile.png` | 390 x 844 | Residential road/building context at intentionally quieter density |

The owner archive verifier confirms both reference hashes, all 12 evidence
folders, and the dimensions and hashes of all eight current screenshots.

## Acceptance Findings

- Victoria, Piccadilly, Waterloo, King's Cross/Euston and the one-way fixture
  have continuous source-backed building/context fields rather than unexplained
  beige gaps. Quiet residential remains visibly quieter but is not artificially
  empty.
- Yellow/orange major corridors, dark casings and junction geometry establish a
  clear printed-atlas road hierarchy. Genuine red A/B references remain readable
  and attached to rendered road geometry.
- Compact local street labels, district/place labels, institutions, parks,
  transport, rail, water, bridges and civic symbols provide useful independent
  route-planning context without consumer-navigation simplification.
- Active routes, markers, hints and correct/incorrect review states remain
  legible above the geography without replacing the map as the primary learning
  surface.
- OpenStreetMap attribution is visible on every current map-focused evidence
  image.
- The map is less typographically compressed and less visually saturated than
  the v2 concept, but the remaining difference is consistent with source
  accuracy, screen legibility and an original renderer. It is not an acceptance
  blocker.

Stage 8.8.3, Stage 8.11 and Stage 8.12 are complete. The integrated Stage 8.13
review also accepts the Stage 8.4 road hierarchy, which did not have a separate
final evidence set.

## Closure Verification Addition

Stage 8.13 added the missing post-supplement one-way/restriction screenshot and a
typed deterministic fixture for it. The accepted 1440 x 900 production capture
is `one-way-restrictions-desktop.png`, SHA-256
`1d8707958cfbbcebbd837ded1652d15230acdac0ddae3d5637de327933a37281`.

The capture utility now attaches to a blank browser target before navigating,
allows bounded five-minute loading for large source-backed fixtures, and writes a
temporary diagnostic screenshot when readiness times out. These are verification
changes only. They do not alter production rendering.

## Preserved Non-Goals

Stage 8.13 changes no cartographic style tokens, source geography, context data,
route generation, legality, matching, snapping, scoring, restrictions, hints,
feedback, learner progress, submissions, reviews, authentication, payments,
subscriptions or deployment behavior.

## Validation

Final validation completed sequentially with no development server or browser
running alongside the test/build commands:

- `npm.cmd run lint`: passed.
- `npm.cmd run test:map`: 1,245 passed, 0 failed, 0 skipped.
- `npm.cmd test`: every required constituent suite passed, 0 failed, 0 skipped.
- `npm.cmd run build`: passed. The existing Supabase Edge-runtime warning was
  non-fatal; two static pages retried after the 60-second generation threshold
  and completed successfully.
- `npm.cmd run map:qa:phase8-owner-review`: passed; 2 references, 12 evidence
  folders and 8 screenshots matched the archive manifest.
- The original Stage 8.8.3 seven-fixture repeated comparison remains passed: 5
  exact matches and 2 within the documented tiny antialias tolerance.
- `git diff --check`: passed.

## Remaining Manual QA And Limitations

- Physical two-finger pinch, orientation changes, cutout/safe-area behavior,
  feedback scrolling and hint interaction still require representative iOS and
  Android hardware checks.
- A repeat capture for the new eighth one-way screenshot returned the app's
  generic error page after the first large context run. The accepted image was
  captured from the validated production build and inspected at normal size, and
  its hash/dimensions are archive-verified, but no repeat-equivalence claim is
  made for that image.
- King's Cross/Euston lacks only the optional Stage 8.8.3 `barrier=*` context
  group after Overpass endpoint failures; required source groups completed.
- Representative fixtures cannot prove uniform visual quality across every
  London location. Future source additions should reuse the same bounded,
  attributed context-supplement pattern.

These limitations do not block Phase 8 cartographic acceptance. A physical QA
defect must still be fixed before the affected mobile interaction is released.
