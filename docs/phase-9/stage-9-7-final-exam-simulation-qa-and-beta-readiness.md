# Phase 9 Stage 9.7: Final Exam Simulation QA and Beta Readiness

## Status

Phase 9 is ready for a controlled learner beta. TOPOPASS now supports a complete exam-practice loop: select an exam task, complete a timed independent route attempt, submit a locked route, receive deterministic scoring and grounded review, retain local attempt history, and view a non-official readiness signal.

This is beta readiness for TOPOPASS practice. It is not final production sign-off, an official TfL assessment, a TfL pass prediction, or certification.

## Integrated Phase 9 support

- Stage 9.1 keeps Exam Mode separate from normal practice, shows an elapsed timer and task endpoints, suppresses active-attempt hints and guidance, and locks submitted routes.
- Stage 9.2 scores only submitted exam attempts using the existing legality, required-stop, shortest-legal-route, efficiency, and backtracking evidence.
- Stage 9.3 reveals category explanations, strengths, improvements, assessment limits, and review overlays only after submission.
- Stage 9.4 supplies deterministic exam-only tasks and skill tags from committed map fixtures without changing the practice catalogue.
- Stage 9.5 records completed exam summaries in versioned browser local storage and derives recent scores and evidence-backed focus areas.
- Stage 9.6 converts stored attempts into an explainable readiness dashboard with explicit evidence thresholds and a non-official disclaimer.
- Stage 9.7 fixes learner endpoint display so an exercise's explicit source-backed stop label is preferred over an opaque graph-node fallback label.

## Automated integration evidence

The Stage 9.7 regression test takes one committed Stage 9.4 task through the existing legal-route engine, verifies that active-attempt scoring remains absent, then produces the submitted Stage 9.2 score and Stage 9.3 review. It records the same result through Stage 9.5 local persistence and builds the Stage 9.6 readiness output from the reloaded state.

The endpoint-label regression test confirms that explicit exercise labels such as `Regent Street` remain learner-facing even when the underlying graph node is labelled only with an OSM identifier. Graph and landmark labels remain safe fallbacks when no explicit stop label exists.

## Manual QA performed

The approved Phase 8 visual masters were inspected before live QA:

- `docs/phase-8/references/phase-8-approved-exam-atlas-visual-master.png`
- `docs/phase-8/references/phase-8-approved-exam-atlas-visual-master-v2.png`

Live browser QA covered:

1. Selected a committed Real London route and confirmed the timer advanced while the active attempt exposed no hint, scoring, review, progress, or shortest-route controls.
2. Drew and edited a route with the existing canvas controls, submitted it, and confirmed the submit, undo, and erase controls locked.
3. Confirmed the submitted attempt displayed the overall score, six-category rubric, grounded review, and local progress summary.
4. Opened `/progress`, confirmed the completed attempt updated the readiness evidence, and reloaded the page to confirm local persistence.
5. Opened Training Mode, generated a practice route, and confirmed the existing practice hint control remained available.
6. Checked desktop at `1689x1283`, tablet at `1024x900`, and mobile at `390x844`. All measured `scrollWidth` values stayed within the viewport, controls remained reachable, and the mobile review drawer remained scrollable without covering the map permanently.
7. Confirmed the dense atlas base retained road hierarchy, road references, contextual labels and buildings, learner overlays, map controls, and OSM attribution.

The live checks included both a passing desktop submission and a needs-practice mobile submission so the positive and corrective review states were visible.

## Phase 8 preservation

Stage 9.7 does not change map fixtures, cartographic style tokens, density rules, road hierarchy, labels, buildings, colours, symbols, restriction rendering, atlas transforms, route overlays, drawing, snapping, matching, pan, wheel zoom, or pinch zoom. Learner route and review overlays remain above the dense base map, and OSM-backed maps retain attribution.

## Validation

The required pre-commit checks passed:

- `npm.cmd run lint`
- `npm.cmd run test:map` (`1,273` tests passed)
- `npm.cmd test` (all configured suites passed)
- `npm.cmd run build`
- `git diff --check`

The focused Stage 9.7 route-runner and integrated exam-flow tests also passed (`47` tests).

## Known limitations and remaining manual QA

- Exam progress is local to one browser profile, capped at 50 attempts, and can be lost when site data is cleared. There is no account sync.
- Readiness needs at least three attempts, two route tasks, and three route tags. It deliberately avoids conclusions when evidence is sparse.
- Route tags show task exposure, not mastery, and limited or unavailable scoring categories are not converted into learner weaknesses.
- Some earlier pilot exercises do not carry human-readable stop labels and therefore still use their existing graph-node fallback. Stage 9.4 tasks with explicit source-backed labels now display those labels correctly.
- The dense Phase 8 initial viewport intentionally requires pan and zoom for some longer tasks; Stage 9.7 does not reduce map density or add route guidance to compensate.
- Physical-device checks for Safari and Chrome touch drawing, pinch zoom, orientation changes, browser zoom, and reduced-motion or high-contrast settings remain recommended before widening the beta.
- Beta monitoring, account-backed progress, exports, predictive readiness, official route coverage, and certification claims remain outside Phase 9.

## Recommended next phase

Run a controlled learner beta and collect evidence about task clarity, touch drawing, endpoint naming, scoring explanations, and readiness interpretation. Any later expansion should remain source-backed and should use beta findings before changing route coverage, persistence, or scoring behavior.
