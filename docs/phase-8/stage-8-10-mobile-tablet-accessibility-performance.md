# Phase 8, Stage 8.10: Mobile, Tablet, Accessibility and Performance

## Status

Implemented and validated in browser emulation. Physical touch-device acceptance
remains manual, so this stage is not a claim of whole-application WCAG
conformance or final Phase 8 acceptance.

## Preflight

- Branch: `main`.
- Starting commit: `4a6d208 Align Phase 8 map with revised visual master`.
- Stage 8.8.2 and Stage 8.9 were present and committed.
- The working tree was clean after the authorized removal of the redundant,
  byte-identical untracked v2 master copy.
- The tracked v1 and v2 appearance references were inspected at original and
  normal displayed size:
  - `references/phase-8-approved-exam-atlas-visual-master.png`
  - `references/phase-8-approved-exam-atlas-visual-master-v2.png`
- The historical `WIP Stage 8.9 overlay rebalance before Stage 8.8.1` stash was
  not applied, modified, popped or dropped.

## Baseline Findings

- Learner pages placed explanatory and setup content ahead of the map at narrow
  widths, leaving too little first-viewport map area.
- The development toolbar could collide with the fixed zoom controls and could
  force horizontal overflow on a phone viewport.
- Training setup remained expanded after a compact-width load.
- Map, feedback and hint regions needed stronger disclosure and focus-return
  contracts.
- `pointercancel` shared the normal pointer-up path and could commit an
  interrupted stroke.
- The canvas backing-store policy was implicit and had no deterministic high-DPR
  allocation assertion.
- Learner feedback could expose internal node, road or OSM pipeline identifiers.

## Responsive Changes

- Compact layout now applies through 1024 CSS pixels, covering phone and tablet
  widths consistently.
- The learner map is promoted ahead of secondary introduction content on compact
  pages; the training setup disclosure starts collapsed on phone and tablet.
- Grid tracks use explicit `minmax(0, 1fr)` sizing so long QA content cannot
  force page overflow.
- The compact development toolbar reserves the fixed zoom-control column and
  wraps inside the map.
- Feedback and hint surfaces use safe-area-aware offsets, bounded internal
  scrolling and compact-height rules. Attribution remains visible when the
  panels are collapsed.
- The six required viewport classifications and portrait/landscape orientation
  results are deterministic in `routeRunnerMobileQa`.

## Accessibility Changes

- The canvas has a meaningful accessible name and linked instructions and route
  status outside the bitmap.
- Draw and Pan are exposed as a named interaction group.
- Training setup, feedback and hint triggers expose `aria-expanded` and
  `aria-controls`.
- Escape closes dismissible hint and feedback surfaces. Closing feedback returns
  focus to its trigger, with Submit as a fallback; hint focus return remains
  intact.
- Review status remains textual and is not conveyed by colour alone.
- Essential controls receive explicit forced-colour treatment and existing
  reduced-motion behavior remains preserved.
- Learner feedback replaces raw internal movement, node, road, segment and OSM
  identifiers with a stable human-readable matching message. Developer
  diagnostics remain available in development QA.

Freehand canvas drawing still requires a mouse, touch contact or stylus. All
surrounding controls are keyboard operable, but Stage 8.10 does not claim a
keyboard-equivalent freehand route authoring method or complete WCAG
conformance.

## Touch and Pointer Behavior

- A dedicated `pointercancel` path now clears the interrupted stroke instead of
  committing it.
- Existing one-pointer drawing, Pan mode, pinch transition guards, lift-one-
  contact handling, undo, clear, wheel zoom and reset behavior remain in place.
- The responsive QA model records a 44 CSS pixel minimum target contract.
- Browser QA confirmed drawing, Pan, reset, review collapse/reopen and map-page
  scrolling in portrait and landscape. Real-device two-finger behavior remains
  on the physical-device checklist below.

## Performance Protection

Canvas backing stores are now selected by an explicit profile rather than
multiplied by the reported device-pixel ratio:

| Profile | Backing store | Pixels | Approximate RGBA bytes |
| --- | ---: | ---: | ---: |
| Development | 1120 x 760 | 851,200 | 3,404,800 |
| Learner desktop/tablet | 1920 x 912 | 1,751,040 | 7,004,160 |
| Learner phone | 900 x 2160 | 1,944,000 | 7,776,000 |

The deterministic ceiling is 2,000,000 pixels. Reported DPR is normalized and
bounded to 3 for diagnostics, while allocation remains fixed, preventing a
high-DPR phone from multiplying the backing-store area again. Existing graph
memoization, route-point budgets, viewport filtering, label caches and lazy
fixture loading were not changed. The Victoria benchmark remains development-
only, lazy-loaded, unscoreable and absent from learner beta catalogues.

## Visual QA

All new captures are unedited renderer screenshots under
`screenshots/stage-8-10/`. They were inspected at normal size against both Phase
8 masters.

| Scenario | Viewport | Displayed zoom | Evidence |
| --- | --- | --- | --- |
| Victoria dense benchmark | 1440 x 900 | 100% | `dense-victoria-desktop-1440x900-100.png` |
| Victoria tablet landscape | 1024 x 768 | 100% | `dense-victoria-tablet-landscape-1024x768-100.png` |
| Victoria tablet portrait | 768 x 1024 | 100% | `dense-victoria-tablet-portrait-768x1024-100.png` |
| Victoria mobile portrait | 390 x 844 | 100% | `dense-victoria-mobile-portrait-390x844-100.png` |
| Victoria narrow portrait | 360 x 800 | 100% | `dense-victoria-mobile-portrait-360x800-100.png` |
| Victoria mobile landscape | 844 x 390 | 100% | `dense-victoria-mobile-landscape-844x390-100.png` |
| Active learner route | 1440 x 900 | 100% | `learner-desktop-active-route-1440x900.png` |
| Active learner route | 390 x 844 | 100% | `learner-mobile-active-route-390x844.png` |
| Needs-review feedback | 1440 x 900 | 100% | `learner-desktop-needs-review-feedback-1440x900.png` |
| Mobile feedback open/collapsed/reopened | 390 x 844 | 100% | `learner-mobile-feedback-open-390x844.png`, `learner-mobile-feedback-collapsed-390x844.png`, `learner-mobile-feedback-reopened-390x844.png` |
| Shortest-route comparison | 1440 x 900 | 100% | `learner-desktop-shortest-route-comparison-1440x900.png` |
| Desktop hint over map | 1440 x 900 | 100% | `learner-desktop-hint-over-map-1440x900.png` |
| Mobile hint over map | 390 x 844 | 100% | `learner-mobile-hint-over-map-390x844.png` |
| One-way/restriction fixture | 1440 x 900 | 100% | `one-way-restrictions-desktop-1440x900-100.png` |
| Waterloo bridge/water | 1440 x 900 | 100% | `waterloo-bridge-desktop-1440x900-100.png` |
| Waterloo tablet | 768 x 1024 | 100% | `waterloo-tablet-portrait-768x1024-100.png` |
| Keyboard focus | 768 x 1024 | 100% | `accessibility-tablet-keyboard-focus-768x1024.png` |
| 200% reflow equivalent | 720 x 900 CSS viewport | 100% map | `desktop-200-percent-reflow-equivalent-720x900.png` |

The final browser measurements reported equal document client and scroll widths
at phone, tablet, desktop and reflow-equivalent widths. The rendered map kept
the v2 density, yellow/orange road authority, dark casings, red A/B references,
built fabric, source-backed labels, symbols and water context. No base-map
density suppression was added for compact screens. OSM attribution remained
visible in the OSM fixture captures, and no browser console warnings or errors
remained in the final session.

The accepted Stage 8.8.1/8.8.2 passing-review captures were re-inspected as the
unchanged pass-state baseline. Stage 8.10 current-renderer evidence covers the
active, unscoreable/needs-review, comparison and review reopen paths. The
submitting transition is intentionally brief and is covered deterministically
by the shared-submission tests rather than a misleading post-submit screenshot.

## Non-Regressions and Deliberate Non-Changes

- No route generation, legality, validation, matching, snapping or scoring
  algorithm changed.
- No curated route, learner progress, authentication, payment, subscription or
  deployment behavior changed.
- Hint timing, pause, Keep open, timed dismissal, reopen and counters were not
  changed.
- Stage 8.8.2 cartography and Stage 8.9 overlay ownership were not redesigned.
- The revised master is not a product raster layer and no geography was copied
  or fabricated.
- No dependency was added, and Stage 8.11/8.12 work was not started.

## Validation

Final validation completed sequentially with the development server and browser
closed:

- `npm.cmd run lint`: passed.
- `npm.cmd run test:map`: passed.
- `npm.cmd test`: passed with no failed, cancelled, skipped or todo tests.
- `npm.cmd run build`: passed; all 70 static pages generated.
- `npm.cmd run map:audit:phase8`: passed; eight real OSM fixtures audited.
- `npm.cmd run map:audit:stage8-density`: passed; the Victoria principal audit
  retained 4,279 displayed building polygons, 106 road labels, 82 unique road
  names and 7 road references at the 1120 x 760 production canvas.
- `git diff --check`: passed; line-ending conversion notices are informational.

Focused Stage 8.10 tests cover the six exact viewports, orientation categories,
44-pixel target contract, compact setup policy, backing-store profiles, DPR
allocation invariance, focus return, stale timers and learner-safe feedback.

## Manual QA Remaining

A physical touch device must still verify:

- two-finger pinch, lift-one-finger transitions and accidental-stroke prevention;
- drawing, Pan, undo, clear and resubmit after pinch;
- portrait/landscape orientation changes and route alignment;
- feedback drawer scrolling, close/reopen and shortest-route comparison;
- hint pause, Keep open, dismiss and reopen;
- safe-area behavior on a device with display cutouts;
- a current passing submission and the brief submitting transition at phone size.

These items prevent a claim of full physical acceptance, but do not block the
implemented and browser-validated Stage 8.10 correction.
