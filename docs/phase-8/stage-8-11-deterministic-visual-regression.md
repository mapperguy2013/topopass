# Stage 8.11: Deterministic Visual Regression

Stage 8.11 adds reproducible production-renderer fixtures and committed screenshot
evidence for the Phase 8 examination-atlas map. It protects the established dense
cartography and learner overlays from accidental visual regression. It is not the
final visual-acceptance or cartographic-correction pass; Stage 8.12 remains separate.

The v2 approved visual master was inspected as the primary appearance reference,
with the original master retained as the secondary reference. Neither image is used
as geography or product raster content.

## Fixture Matrix

| Fixture | Viewport | State | Source-backed context protected |
| --- | --- | --- | --- |
| `victoria-neutral-desktop` | 1440 x 900 | Neutral | Dense buildings, local labels, major roads, red A/B references and district context |
| `kings-cross-correct-review-desktop` | 1440 x 900 | Correct review | A501 geometry, route/marker alignment and submitted feedback |
| `piccadilly-active-route-desktop` | 1440 x 900 | Active route | Dense junctions, learner route, markers and overlay order |
| `waterloo-context-tablet` | 768 x 1024 | Neutral | Thames, bridges, rail context, attribution and tablet layout |
| `waterloo-incorrect-review-mobile` | 390 x 844 | Incorrect review | Incomplete route, needs-review feedback and mobile layout |
| `piccadilly-hint-mobile` | 390 x 844 | Hint | Compact hint, safe-area layout, map visibility and overlay hierarchy |
| `quiet-residential-mobile` | 390 x 844 | Neutral map focus | Local roads, compact labels, buildings and mobile density |

The fixture catalogue is in
`app/dev/route-runner/phase8VisualRegressionFixtures.ts`. Each fixture has a
stable id, map and exercise selection, route seed, overlay state, feedback state,
scroll target, viewport and protected-system list. The development-only pages are
available at `/dev/route-runner/visual-regression/[fixtureId]`; they are not added
to the beta map catalogue.

## Deterministic Controls

- Browser: Chromium / Google Chrome `150.0.7871.115`, light colour scheme,
  `en-GB`, `Europe/London`, reduced motion and device-pixel ratio 1.
- Viewports: exact 1440 x 900, 768 x 1024 and 390 x 844 CSS pixels.
- Geography: existing committed curated OSM-derived fixtures only; no live
  geography, fabricated labels or screenshot-derived coordinates.
- Routes: the existing deterministic shortest legal route, or a deterministic
  incomplete prefix for the incorrect-review fixture.
- Hints: a fixed fixture-only planning clue with no raw identifiers or
  turn-by-turn instruction; it is kept open to remove timer dependence.
- Side effects: fixture runs do not read or write learner progress, browser route
  history, weak-area state or attempt persistence.
- Presentation: animations, transitions and caret blinking are disabled on the
  fixture page. The review and map-focused mobile fixtures use explicit scroll
  targets rather than manual scrolling.

The rendered canvas publishes `data-phase8-visual-ready="true"` only after the
selected geography has loaded, document fonts are ready, marker images are ready,
the requested route/hint/review state exists, the requested scroll target has been
applied, and the canvas draw pass has completed. Captures wait for this positive
condition. Incorrect-review capture additionally waits for smooth document scroll
to settle before comparison.

## Evidence And Comparison

Final PNG evidence is stored in `docs/phase-8/screenshots/stage-8-11/`.
Every image was inspected at normal displayed size. The evidence visibly contains
the intended dense road/building field, major-road hierarchy, genuine red road
references, compact labels, district and transport context, water/bridges,
attribution, learner route/markers, hint and correct/incorrect feedback.

Stage 8.8.3 regenerated this evidence after adding targeted source-backed
context supplements to the lighter non-Victoria fixtures. Two controlled
captures of every fixture were compared with:

```text
npm.cmd run map:visual:compare:phase8 -- <run-a> <run-b>
```

The comparison first checks exact screenshot SHA-256 equality, then permits only
a tiny PNG pixel tolerance for browser antialias variance: at most 25 differing
pixels and maximum combined RGBA channel delta 4. In the retained comparison,
5 of 7 fixtures were byte-identical; Piccadilly active route differed by 5
pixels and Victoria neutral differed by 4 pixels, both below tolerance.

| Fixture | SHA-256 |
| --- | --- |
| `victoria-neutral-desktop` | `b52ab03fe47497250ccd3883bdcce1521faaaffa21cddf20316ed83b2100fd06` |
| `kings-cross-correct-review-desktop` | `15e16de5c194b055974e0c7a50e3eb4d057d36ffef172327b5d307ecffd0eafc` |
| `piccadilly-active-route-desktop` | `32e639a12f7c75c754959d9610ce29b51b04bb30411f4a74d6406c7e27c8017e` |
| `waterloo-context-tablet` | `ee6a25537541b1cabc0f268b703a9f0a2bf486b179116d7eeb2f9bebc749b726` |
| `waterloo-incorrect-review-mobile` | `4454e9703635e9e7ae6ffe301d752bbabcb9eaa9b96712c535068319caf729ba` |
| `piccadilly-hint-mobile` | `8eec738e244f9beddaf3838c201c7a7df7b9ea748078b38b7f62d6e18399ae6e` |
| `quiet-residential-mobile` | `1288bc1b4996ce55db61a60e07cc4f4f351558c4f61ee8d7f9dede333b62c4be` |

An isolated browser process was used for each affected desktop/tablet capture,
and explicit device emulation was used for the exact mobile viewport. This avoids
a platform-level Chrome basic-headless minimum-layout-width limitation and an
intermittent Windows compositor tile artifact. Corrupted intermediary captures
were rejected and are not retained.

## Validation And Non-Goals

Focused fixture tests cover stable ids, browser controls, viewport/state coverage,
route seeds, scroll targets and safe hint copy. Final validation passed:

- `npm.cmd run lint`
- `npm.cmd run test:map`: 1,230 passed, 0 failed, 0 skipped
- `npm.cmd test`: all required constituent suites passed, 0 failed,
  0 skipped
- `npm.cmd run build`: passed
- `git diff --check`
- repeated screenshot comparison: 7 of 7 equivalent; 5 exact byte matches and
  2 within the tiny PNG antialias tolerance

No cartographic colours, widths, density rules, labels, symbols or source geography
changed. Route generation, legality, matching, snapping, scoring, learner progress,
hint timing, submission/review behaviour, authentication, payments and deployment
did not change. The Stage 8.10 fixed canvas backing-store bounds remain intact.

Stage 8.12 owns integration QA, evidence archiving and the owner review pack;
it does not declare final visual acceptance. Stage 8.4's independent manual
visual acceptance and Stage 8.10's physical two-finger, orientation, safe-area
and touch checks remain pending. Owner review may request a focused Stage 8.8.3
visual correction.
