# Phase 9 Stage 9.2 - Exam Scoring Rubric Foundation

Stage 9.2 adds a deterministic, explainable score to a submitted Exam Mode route attempt. Scoring is derived from the existing matched route, legality engine, required-stop validation, shortest-legal-route comparison, and efficiency grade. It does not alter the Phase 8 atlas map or practice-mode feedback.

## What Stage 9.2 Adds

- A structured exam result with an overall percentage, `Pass` or `Needs practice` status, a short reason summary, and category breakdown.
- Post-submit-only score calculation through the existing `student-exam` submission state.
- An exam-practice rubric in the existing feedback drawer after the route is submitted and locked.
- Explicit supported, limited, and unavailable assessment states so missing evidence is not presented as a confident score.
- Deterministic tests using existing map-engine route fixtures.

## Current Calculation

The weighted Stage 9.2 score totals 100 points:

| Category | Weight | Current evidence |
| --- | ---: | --- |
| Legality | 30% | Existing legality result and identified illegal movements |
| Destination completion | 25% | Existing matched route and required destination node |
| Route efficiency | 35% | Existing route score, route distance, shortest legal distance, and pass threshold |
| Detour and backtracking | 10% | Existing efficiency grade plus immediate same-road reversal detection from matched movements |

The overall result is `Pass` only when the existing route scorer passes the attempt and the Stage 9.2 weighted score is at least 80%. Illegal, incomplete, and below-threshold routes remain `Needs practice` even if another category performs well.

The detour and backtracking category is marked `limited`. It can identify immediate reversal along the same road and excessive distance represented by the existing efficiency grade, but it cannot yet identify every semantically avoidable London route choice.

## Unweighted And Unavailable Categories

- `Avoidable mistakes` is a limited, unweighted summary of failure reasons already produced by the validator. It is not scored separately because that would count legality, completion, or efficiency failures twice.
- `Road hierarchy and suitability` is unavailable and unweighted. The shared scored-road contract does not consistently expose dependable hierarchy or suitability evidence across every current fixture.

An unavailable category contributes no awarded points and is visibly labelled unavailable. Stage 9.2 does not infer road class, restrictions, or route facts from labels or road names.

## Practice Mode And Map Scope

Practice and Training Mode keep their existing scoring, hints, feedback, progress, route editing, and review behaviour. The structured rubric resolves only for a submitted `student-exam` attempt. Exam hints remain suppressed and the submitted drawing remains locked.

No cartographic style, map density, road hierarchy rendering, labels, buildings, colours, symbols, route packs, or map data changed in this stage.

## Not An Official TfL Score

The result is a TOPOPASS practice score based on the current route engine and available fixture data. It is not an official TfL assessment, does not reproduce a final TfL scoring model, and must not be described as certification or an official pass result.

## Deferred And Known Limitations

- A deeper post-submit review experience is deferred to Stage 9.3.
- New exam route packs are deferred to Stage 9.4.
- Learner history and readiness dashboards remain deferred.
- Road hierarchy and broader route-suitability assessment need a stable, source-backed data contract before they can be scored.
- Backtracking assessment currently detects immediate same-road reversals, not every repeated junction, loop, or strategically poor road choice.
- The elapsed timer remains informational and does not affect the Stage 9.2 score.

## Manual QA Remaining

- Submit passing, illegal, incomplete, and inefficient routes and compare the summary with the existing map overlays.
- Confirm no rubric or review content appears during an active exam attempt.
- Confirm the submitted route remains locked while the score and category evidence are reviewed.
- Check the breakdown at desktop, tablet, and mobile widths for wrapping, reachable controls, no horizontal overflow, and preserved atlas readability.
- Recheck pan, wheel zoom, pinch zoom, shortest-route review overlay, and feedback-drawer behaviour after submission.
