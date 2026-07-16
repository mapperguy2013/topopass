# Phase 9 Stage 9.3: Exam Review and Feedback

## What Stage 9.3 adds

Stage 9.3 adds a learner-facing review layer to the existing exam submission drawer. A submitted exam attempt now presents:

- the Stage 9.2 overall result and deterministic category breakdown;
- route-planning strengths supported by the scored attempt;
- improvement principles supported by current legality, completion, efficiency, backtracking, and validation evidence;
- verified restriction findings alongside the existing post-submit map issue overlays; and
- explicit assessment limits where the current route data cannot support a dependable judgement.

The review model is deterministic for the same scored attempt. It does not alter the Stage 9.2 score.

## Active exam mode versus review

During an active exam attempt, hints, route issue overlays, scoring previews, and the Stage 9.3 review remain hidden. The learner can draw and edit the route using the existing map interactions.

After submission, the attempt remains locked. The review drawer can then explain the result and the existing overlay controls can show verified route issues or the shortest legal comparison. These are review tools only and do not provide live turn-by-turn guidance.

Practice mode keeps its existing hints and feedback flow. The Stage 9.3 resolver returns no review for practice or developer modes.

## Grounded feedback coverage

Current review feedback can explain:

- movements rejected by the existing legality engine, including one-way direction, no-entry, road closure, prohibited-turn, U-turn, disconnected-route, and off-road findings;
- destination completion from the existing required-node validation;
- excessive distance against the existing shortest legal route comparison;
- immediate same-road reversal and broader detour evidence from the Stage 9.2 rubric; and
- origin, required-stop, destination, and route-continuity issues already reported by the route validator.

The submitted learner route and existing issue overlays remain above the dense Phase 8 atlas map. Stage 9.3 does not change cartography, road hierarchy, labels, buildings, colours, symbols, map data, snapping, matching, scoring weights, or overlay drawing rules.

## Intentionally limited or deferred

The review does not claim to assess road hierarchy quality, landmark use, bridge choice, or the quality of a legal junction approach unless dependable comparison data becomes available. Those limits are shown to the learner instead of generating a speculative explanation.

This is not an official TfL result or certification. Learner progress history, readiness dashboards, route-pack expansion, a fuller scoring model, and broader London-context assessment remain deferred to later Phase 9 stages.

## Manual QA expectations

Manual QA should submit both passing and failing exam routes on desktop, tablet, and mobile. Confirm that:

- no review, score, hint, issue overlay, or route comparison appears before submission;
- submission locks drawing, undo, erase, and resubmission for that attempt while pan and zoom remain available;
- the review drawer shows the overall score, every category explanation, strengths or improvements, and assessment limits;
- verified issue focus and shortest-route comparison remain readable over the Phase 8 atlas;
- long evidence text wraps without horizontal overflow; and
- the drawer can be opened, scrolled, and closed without hiding essential mobile controls or trapping keyboard focus.
