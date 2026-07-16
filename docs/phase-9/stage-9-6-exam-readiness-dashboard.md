# Phase 9 Stage 9.6: Exam Readiness Dashboard

## Scope

Stage 9.6 adds a modest Exam Readiness section to the learner-facing `/progress` page. It reads the versioned local exam-attempt records introduced in Stage 9.5 and turns them into an explainable practice signal, score summary, repeated category focus, and Stage 9.4 route-tag coverage.

The dashboard does not run during an active exam attempt. Exam Mode still suppresses hints, locks submitted routes, and reveals scoring and review only after submission.

## Data used

Readiness uses only normalised `topopass.examProgress.v1` records stored in the current browser:

- completed submitted exam attempts;
- overall score and pass or needs-practice status;
- Stage 9.2 category outcomes;
- route task ids;
- Stage 9.4 route tags;
- attempt timestamps used to order recent results.

Malformed records remain excluded by the Stage 9.5 normaliser. Categories marked `limited` or `unavailable` are not converted into learner weaknesses. Route tags describe the task context and are not treated as causes of a score.

## Readiness calculation

The dashboard first checks whether there is enough varied evidence. A readiness judgement requires:

- at least 3 completed attempts;
- at least 2 different route task ids;
- at least 3 distinct Stage 9.4 route tags.

Until all three checks are met, the status is **Not enough attempts yet** and the missing evidence is listed. This includes separate empty, low-attempt, and low-variety states.

Once enough evidence exists, performance uses the latest 5 stored attempts:

- **Ready for harder practice** requires a passing latest attempt, latest and recent-average scores of at least 80%, a recent pass rate of at least 60%, no declining latest-score trend, and no scoring category marked `needs-practice` on 2 or more recent attempts.
- **Nearly ready** requires latest and recent-average scores of at least 70%, a recent pass rate of at least 40%, and no more than 1 repeated recent weak category.
- **Needs more practice** covers the remaining evidence-backed results.

The 80% boundary reuses the current Stage 9.2 TOPOPASS practice threshold. It is not presented as a TfL rule. The dashboard also shows all-time latest, best, and average scores, recent average and pass rate, latest-score trend, task/tag coverage, and repeated recent category outcomes.

## Meaning and limitations

"Ready for harder practice" means only that the stored attempts meet TOPOPASS's current consistency checks for increasing practice difficulty. "Nearly ready" and "Needs more practice" are also TOPOPASS practice guidance. None of these statuses is an official TfL readiness judgement, pass prediction, assessment, or certification.

Current limitations:

- progress is local to one browser profile and is not account-synchronised;
- clearing site data can erase the dashboard history;
- only the latest 5 attempts affect the performance status;
- the local history remains capped at 50 attempts;
- route-tag coverage shows exposure, not demonstrated mastery;
- sparse or unavailable scoring evidence remains unassessed;
- there are no date filters, tag filters, exports, deletion controls, or predictive analytics.

## Unchanged

Stage 9.6 does not change Phase 8 map rendering, cartographic density, labels, roads, buildings, symbols, route fixtures, map overlays, drawing, pan, wheel zoom, pinch zoom, scoring rules, practice hints, exam hint suppression, submission locking, or post-submit review behaviour.

## Manual QA

On desktop, tablet, and mobile:

1. Open `/progress` with no saved exam attempts and confirm the empty state, disclaimer, and Exam Mode action are visible without horizontal overflow.
2. Save 1 or 2 exam attempts and confirm the dashboard reports insufficient recent evidence while still showing available scores and coverage.
3. Repeat one route at least 3 times and confirm the narrow-route warning prevents a readiness judgement.
4. Complete varied route tasks and confirm latest, best, average, trend, category focus, and route-tag coverage match the submitted review records.
5. Confirm long route-tag and scoring-category labels wrap on narrow screens and no controls are hidden.
6. Disable or clear localStorage and confirm the dashboard reports the local limitation safely.
7. Confirm normal practice retains its existing hints, feedback, attempts, and analytics.
8. Confirm active Exam Mode remains hint-free and a submitted route remains locked.
