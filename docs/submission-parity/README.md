# Stage 8.9 Shared Submission And Hint Correction

## Scope

Real London Practice beta and Learner Training now submit through the same
`RouteRunnerClient` submission state, responsive feedback JSX, route-comparison
controls, focus management and overlay ownership. Training supplies generated
exercise, matched learner route, progress and hint data through typed adapters;
it does not maintain a second review interface.

The correction does not change route generation, snapping, matching, legality
or scoring algorithms. It does not start Stage 8.10.

## Submission Behaviour

- Both pages use `Submit route`, `Submitting...`, `Passed`, `Needs review` and
  `Unable to score` states.
- A 120 ms minimum shared transition makes the loading state perceivable while
  retaining duplicate-request and stale-result guards.
- Training submits the route produced by the drawn-route matcher, not its
  authored or shortest route.
- Closing feedback preserves the result. Reopening does not submit or score
  again. Exercise generation clears the previous result.
- The learner route remains visible. The shortest legal route remains hidden
  until requested, and closing comparison restores submitted-review ownership.
- Shared feedback groups repeated issues and omits raw OSM, segment and
  pipeline identifiers from learner-facing text.
- Training progress and generated-hint history are recorded after a scored
  submission and retained when feedback closes.

## Hint Behaviour

Training hints use a desktop side drawer and mobile bottom sheet. A new hint
starts a 30-second dismissal timer. The timer pauses while the panel is hovered,
keyboard-focused or the document is hidden, and can be paused explicitly.
`Keep open` disables dismissal. An expired or closed hint can be reopened
without generating another hint. Opening submission feedback closes the hint;
review and hint panels cannot be visible together.

The former learner-facing `Current instruction` block is no longer rendered.
Hints remain brief decision cues rather than turn-by-turn directions.

## Screenshot Evidence

All images use the production page renderer. Desktop is 1440 by 900 and mobile
is 390 by 844.

| Scenario | Real London Practice beta | Learner Training |
| --- | --- | --- |
| Ready to submit | `screenshots/desktop-beta-pass-ready.png` | `screenshots/desktop-training-pass-ready.png` |
| Submitting | `screenshots/desktop-beta-submitting.png`, `screenshots/mobile-beta-submitting.png` | Same shared transition and control |
| Passed desktop | `screenshots/desktop-beta-passed.png` | `screenshots/desktop-training-passed.png` |
| Needs review desktop | `screenshots/desktop-beta-needs-review.png` | `screenshots/desktop-training-needs-review.png` |
| Unable to score desktop | Shared drawer verified during disconnected-route QA | `screenshots/desktop-training-unable-to-score.png` |
| Passed mobile open/collapsed/reopened | `screenshots/mobile-beta-passed-feedback-open.png`, `mobile-beta-passed-feedback-collapsed.png`, `mobile-beta-passed-feedback-reopened.png` | `screenshots/mobile-training-passed-feedback-open.png`, `mobile-training-passed-feedback-collapsed.png`, `mobile-training-passed-feedback-reopened.png` |
| Needs review mobile open/collapsed/reopened | `screenshots/mobile-beta-needs-review-feedback-open.png`, `mobile-beta-needs-review-feedback-collapsed.png`, `mobile-beta-needs-review-feedback-reopened.png` | `screenshots/mobile-training-needs-review-feedback-open.png`, `mobile-training-needs-review-feedback-collapsed.png`, `mobile-training-needs-review-feedback-reopened.png` |
| Mobile comparison | `screenshots/mobile-beta-passed-comparison.png`, `mobile-beta-needs-review-comparison.png` | `screenshots/mobile-training-passed-comparison.png`, `mobile-training-needs-review-comparison.png` |
| Desktop close/reopen/comparison | `screenshots/desktop-beta-closed-view-feedback.png`, `desktop-beta-reopened-feedback.png`, `desktop-beta-shortest-route-comparison.png` | `screenshots/desktop-training-shortest-route-comparison.png` |
| Hint open/dismissed/reopened/kept | n/a | `screenshots/desktop-training-hint-open.png`, `desktop-training-hint-dismissed.png`, `desktop-training-hint-reopened.png`, `desktop-training-hint-kept-open.png` and mobile equivalents |
| Hint timer paused | n/a | `screenshots/desktop-training-hint-paused.png`, `mobile-training-hint-paused.png` |

Normal-size inspection confirmed the same drawer dimensions, status hierarchy,
score metrics, grouped issues and comparison controls on both pages. Mobile
panels leave the route map and drawing controls visible; added bottom safe space
keeps hint actions clear of the fixed compass control.

## Validation

- `npm.cmd run lint`: passed.
- `npm.cmd run test:map`: 1,222 passed, 0 failed, 0 skipped.
- `npm.cmd test`: passed, including 11 shared submission and hint tests.
- `npm.cmd run build`: passed from a clean `.next` directory.
- `git diff --check`: passed.

The interrupted run left an orphaned Next build with 30 idle workers. That
verified repository process tree was stopped before final validation. Next's
build worker count is limited to two so the required production build remains
within the available memory; this does not change runtime map or learner
behaviour.

## Known Limitations

The default curated Training pack does not contain a matching approved Marlowe
beginner route, so deterministic visual QA used the existing experimental
generated route on the synthetic Marlowe fixture. Some complete routes require
panning or zooming at its closer principal reset scale. These are existing
content and fixture-framing constraints, not shared-submission defects.

The integrated browser backend became unavailable during QA, so accepted
evidence was captured with the repository's direct headless Chrome workflow.
Desktop and mobile screenshots were inspected at normal size. Physical-device
pinch testing remains part of the later documented mobile/accessibility stage.
