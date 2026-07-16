# Phase 9 Stage 9.5: Learner Progress Tracking

## Scope

Stage 9.5 adds a local-first progress layer to Exam Mode. A completed attempt is recorded only after the existing submission state has locked the route and Stage 9.2 has produced a scoring result. The summary is displayed inside the post-submit review surface, so active exam attempts remain free from progress-derived hints or guidance.

This is a compact progress summary, not the full Phase 9 readiness dashboard.

## Stored attempt data

Each version 1 progress record contains:

- a unique attempt id;
- route task id, title, map id, and task version where available;
- clear origin and destination labels;
- completion timestamp and elapsed exam time;
- submitted completion state;
- overall score and pass or needs-practice status;
- a snapshot of every Stage 9.2 category, including assessment support, outcome, score, weighting, summary, and evidence;
- deterministic Stage 9.4 route tags when the selected task has them.

Raw drawing points, matched route geometry, account data, and invented geographic conclusions are not stored in the Stage 9.5 progress record. History is normalised, deduplicated by attempt id, ordered newest first, and capped at 50 attempts.

## Persistence

Progress uses the repository's defensive local-first browser storage pattern under `topopass.examProgress.v1`. The adapter:

- reads and normalises saved JSON on Exam Mode entry;
- discards malformed records instead of treating them as learner evidence;
- writes the complete bounded progress state after a submitted attempt;
- keeps the current session summary usable when localStorage is disabled or a write fails.

Progress survives normal navigation and reload in the same browser profile. It is not currently synced to an account, another browser, or another device. Clearing site data, private-browsing expiry, browser storage policies, or manual storage removal can erase it.

## Supported summaries

The post-submit Exam Progress panel shows:

- the latest, best, and average score;
- the latest pass or needs-practice result;
- the score change from the immediately previous stored attempt;
- up to five recent attempts with task, endpoints, timestamp, elapsed time, score, and status;
- categories marked `needs-practice` on at least two stored attempts;
- Stage 9.4 tags appearing on attempts that received a needs-practice result.

Weak-category counts use only explicit Stage 9.2 `needs-practice` outcomes. Limited or unavailable categories are not converted into weaknesses. Route tags provide task context only: the summary does not claim that a tag caused a low score.

## Unchanged and deferred

Stage 9.5 does not change Phase 8 cartography, map density, route fixtures, scoring rules, review feedback, practice-mode persistence, hints, submission locking, route drawing, overlays, pan, wheel zoom, or pinch zoom.

Deferred to later Phase 9 work:

- account-backed progress sync and cross-device history;
- the full readiness dashboard and readiness weighting;
- official TfL readiness or certification claims;
- date-range, route-tag, or category filters;
- progress export, deletion controls, and storage-management UI;
- causal conclusions about road hierarchy, landmarks, bridges, or route suitability when the scoring engine marks evidence limited or unavailable.

## Manual QA

On desktop, tablet, and mobile:

1. Complete and submit an exam task, then confirm the route remains locked and Exam Progress appears only in review.
2. Reload Exam Mode and submit another task; confirm the earlier attempt contributes to latest, best, average, recent attempts, and trend.
3. Submit repeated needs-practice attempts and confirm only evidence-backed repeated categories and relevant route tags appear.
4. Confirm long task and endpoint labels wrap without horizontal overflow and the panel does not cover essential map content.
5. Disable or clear browser storage and confirm the interface reports the local limitation without losing the current submitted review.
6. Open normal practice and confirm its hints, feedback, route list, and persistence behaviour are unchanged.
