# Phase 9 Stage 9.1 - Exam Mode Rules

Stage 9.1 adds the first exam-mode foundation for TOPOPASS route drawing. It introduces a learner-facing Exam Mode entry at `/practice/exam-mode` that reuses existing scoreable route-runner fixtures and the Phase 8 examination-atlas map renderer.

## What Was Added

- A separate `student-exam` route-runner mode distinct from `student-beta` practice and dev QA mode.
- An Exam Mode practice entry on the main practice hub.
- A dedicated `/practice/exam-mode` page using the existing `RouteRunnerClient`.
- An elapsed timer in the exam route-runner header using the existing mock-exam time formatter.
- Clear origin and destination chips in the exam header.
- Active-attempt hint suppression by disabling Training Mode and its hint panel for exam mode.
- Post-submit-only review behaviour for exam route issue overlays and feedback.
- Submitted-attempt locking so draw, undo, erase, and resubmit cannot mutate the submitted route.

## Practice vs Exam Mode

Practice mode keeps the existing learner-training and beta-practice behaviours:

- Training Mode can still generate exercises and hints.
- Practice feedback continues to use the existing route-runner submission flow.
- Existing route generation, validation, matching, snapping, scoring, review overlays, map pan, wheel zoom, pinch zoom, and mobile interaction remain shared.

Exam Mode changes only the attempt rules:

- The learner reads the atlas and plans independently.
- Hints and shortest-route guidance are unavailable during the active attempt.
- The learner may draw and edit before submission.
- Once submitted, the attempt is locked.
- Review and feedback appear only after submission.

## Deferred

- Full Phase 9 scoring rubric.
- New exam route packs.
- Readiness dashboard and learner progress history.
- Official TfL scoring language or certification claims.
- Turn-by-turn navigation.

## Known Limitations And Manual QA

- Stage 9.1 uses existing route fixtures only; coverage expansion belongs to later Phase 9 stages.
- The timer is elapsed-time only and does not auto-submit.
- Manual QA should verify desktop, tablet, and mobile layouts for no horizontal overflow, reachable controls, and readable Phase 8 map density.
- Manual QA should check that pan, wheel zoom, pinch zoom, and feedback drawer behaviour remain intact after submission.
