import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  EXAM_MODE_PRACTICE_CARD_CTA,
  EXAM_MODE_PRACTICE_PATH,
  buildExamModePracticeEntryModel,
  buildExamModePracticePageModel
} from "./examModePractice.ts";

test("Stage 9.1 exam mode entry exposes a learner-facing route", () => {
  const entry = buildExamModePracticeEntryModel();

  assert.equal(entry.visible, true);
  assert.equal(entry.href, EXAM_MODE_PRACTICE_PATH);
  assert.equal(entry.ctaLabel, EXAM_MODE_PRACTICE_CARD_CTA);
  assert.match(entry.message, /no hints/i);
});

test("Stage 9.1 exam mode page uses existing scoreable route fixtures", () => {
  const model = buildExamModePracticePageModel();

  assert.equal(model.path, EXAM_MODE_PRACTICE_PATH);
  assert.equal(model.routeRunnerMode, "student-exam");
  assert.equal(model.usesExistingRouteRunnerClient, true);
  assert.equal(model.usesExistingRouteFixturesOnly, true);
  assert.ok(model.mapOptions.length > 0);
  assert.ok(model.initialMapOptionId.length > 0);
  assert.ok(model.initialExerciseId);
  assert.ok(model.mapOptions.every((option) => option.exercises.length > 0));
});

test("Stage 9.1 exam mode rules differ from practice mode", () => {
  const model = buildExamModePracticePageModel();

  assert.equal(model.suppressesHintsDuringAttempt, true);
  assert.equal(model.locksAttemptAfterSubmission, true);
  assert.equal(model.reviewVisibleOnlyAfterSubmission, true);
  assert.equal(model.timer.type, "elapsed");
  assert.equal(model.timer.usesExistingExamTimeFormatter, true);
  assert.equal(model.learnerRules.modeSeparateFromPractice, true);
  assert.equal(model.learnerRules.routeEditingBeforeSubmit, true);
  assert.equal(model.learnerRules.routeEditingAfterSubmit, false);
  assert.equal(model.learnerRules.panZoomRemainAvailable, true);
  assert.equal(model.learnerRules.turnByTurnGuidance, false);
  assert.equal(model.mobile.avoidsHorizontalOverflow, true);
});

test("Stage 9.1 exam page mounts the route runner in student-exam mode", () => {
  const source = readFileSync("app/practice/exam-mode/page.tsx", "utf8");

  assert.match(source, /RouteRunnerClient/);
  assert.match(source, /mode=\{model\.routeRunnerMode\}/);
  assert.match(source, /showTrainingModePanel=\{false\}/);
});

test("Stage 9.1 practice hub links to exam mode without replacing practice mode", () => {
  const source = readFileSync("app/practice/page.tsx", "utf8");

  assert.match(source, /buildExamModePracticeEntryModel/);
  assert.match(source, /practice: "exam-mode"/);
  assert.match(source, /buildLearnerTrainingPracticeEntryModel/);
});

test("Stage 9.1 route runner suppresses exam hints and locks submitted attempts", () => {
  const source = readFileSync("app/dev/route-runner/RouteRunnerClient.tsx", "utf8");

  assert.match(source, /const isExamRouteRunner = mode === "student-exam"/);
  assert.match(source, /const shouldRenderTrainingModePanel = !isExamRouteRunner/);
  assert.match(source, /const isExamAttemptLocked = isExamRouteRunner && hasSubmittedCurrentDrawnAttempt/);
  assert.match(source, /const isRouteEditingLocked = isExamRouteRunner && \(hasSubmittedCurrentDrawnAttempt \|\| isSubmittingCurrentDrawnAttempt\)/);
  assert.match(source, /disabled=\{drawnSubmitDisabled \|\| isSubmittingCurrentDrawnAttempt \|\| isExamAttemptLocked\}/);
  assert.match(source, /isDrawing \|\| \(isExamRouteRunner && !hasSubmittedCurrentDrawnAttempt\)/);
});

test("Stage 9.2 exam model exposes deterministic post-submit scoring without an official TfL claim", () => {
  const model = buildExamModePracticePageModel();

  assert.equal(model.scoring.runsOnlyAfterSubmission, true);
  assert.equal(model.scoring.deterministic, true);
  assert.equal(model.scoring.officialTfLScore, false);
  assert.deepEqual(model.scoring.categoryIds, [
    "legality",
    "destination-completion",
    "route-efficiency",
    "detour-backtracking",
    "road-suitability",
    "avoidable-mistakes"
  ]);
});

test("Stage 9.2 route runner gates the rubric to locked submitted exam attempts", () => {
  const source = readFileSync("app/dev/route-runner/RouteRunnerClient.tsx", "utf8");

  assert.match(source, /resolveSubmittedExamScoringResult/);
  assert.match(source, /mode,/);
  assert.match(source, /submitted: hasSubmittedCurrentDrawnAttempt/);
  assert.match(source, /exerciseResult: drawnPipelineResult\.exerciseResult/);
  assert.match(source, /data-testid="exam-scoring-breakdown"/);
  assert.match(source, /isExamAttemptLocked = isExamRouteRunner && hasSubmittedCurrentDrawnAttempt/);
});

test("Stage 9.3 exam model exposes grounded review only after submission", () => {
  const model = buildExamModePracticePageModel();

  assert.equal(model.review.visibleOnlyAfterSubmission, true);
  assert.equal(model.review.includesOverallResult, true);
  assert.equal(model.review.includesCategoryExplanations, true);
  assert.equal(model.review.includesGroundedStrengthsAndImprovements, true);
  assert.equal(model.review.reportsAssessmentLimits, true);
  assert.equal(model.review.keepsSubmittedRouteLocked, true);
});

test("Stage 9.3 route runner gates exam review and preserves route locking and practice feedback", () => {
  const source = readFileSync("app/dev/route-runner/RouteRunnerClient.tsx", "utf8");

  assert.match(source, /resolveSubmittedExamReviewFeedback/);
  assert.match(source, /submitted: hasSubmittedCurrentDrawnAttempt/);
  assert.match(source, /scoringResult: examScoringResult/);
  assert.match(source, /data-testid="exam-review-feedback"/);
  assert.match(source, /examScoringResult\.categories\.map/);
  assert.match(source, /isExamRouteRunner && !hasSubmittedCurrentDrawnAttempt/);
  assert.match(source, /isExamAttemptLocked = isExamRouteRunner && hasSubmittedCurrentDrawnAttempt/);
  assert.match(source, /learnerFeedbackIssueSections\.map/);
});
