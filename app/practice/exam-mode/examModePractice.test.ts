import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildMapGraph,
  findShortestLegalRouteThroughStops,
  runRouteExercise,
  validateRouteExerciseLegalReachability
} from "../../../lib/map-engine/index.ts";
import {
  buildCompletedExamProgressAttempt,
  createEmptyExamProgressState,
  createLocalExamProgressStorage,
  recordExamProgressAttempt
} from "./examProgressTracking.ts";
import { buildExamReadinessSummary } from "./examReadiness.ts";
import { resolveSubmittedExamReviewFeedback } from "./examReviewFeedback.ts";
import { getExamRouteTaskMetadata, listExamRouteTasks } from "./examRoutePack.ts";
import { resolveSubmittedExamScoringResult } from "./examScoringRubric.ts";
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

test("Stage 9.4 exam model exposes the exam-only route pack contract", () => {
  const model = buildExamModePracticePageModel();

  assert.equal(model.routePack.stage, "9.4");
  assert.ok(model.routePack.taskCount > 0);
  assert.equal(model.routePack.taskIds.length, model.routePack.taskCount);
  assert.ok(model.routePack.tags.includes("bridge"));
  assert.ok(model.routePack.tags.includes("one-way-awareness"));
  assert.ok(model.routePack.tags.includes("station"));
  assert.ok(model.routePack.tags.includes("hospital"));
  assert.equal(model.routePack.usesExistingFixtureStopsOnly, true);
  assert.equal(model.routePack.leavesPracticeCatalogueUnchanged, true);
});

test("Stage 9.5 exam model exposes local submitted-attempt progress", () => {
  const model = buildExamModePracticePageModel();

  assert.equal(model.progress.schemaVersion, 1);
  assert.equal(model.progress.recordsSubmittedExamAttemptsOnly, true);
  assert.equal(model.progress.persistence, "local-storage");
  assert.equal(model.progress.includesScoringCategories, true);
  assert.equal(model.progress.includesRouteTags, true);
});

test("Stage 9.5 route runner gates recording and progress display to submitted exam attempts", () => {
  const source = readFileSync("app/dev/route-runner/RouteRunnerClient.tsx", "utf8");

  assert.match(source, /buildCompletedExamProgressAttempt/);
  assert.match(source, /submitted: hasSubmittedCurrentDrawnAttempt/);
  assert.match(source, /routeTags: routeMetadata\?\.tags \?\? \[\]/);
  assert.match(source, /data-testid="exam-progress-summary"/);
  assert.match(source, /isExamRouteRunner && hasSubmittedCurrentDrawnAttempt/);
  assert.match(source, /createLocalExamProgressStorage/);
});

test("Stage 9.6 exposes a non-official readiness dashboard in the learner progress area", () => {
  const model = buildExamModePracticePageModel();
  const progressPageSource = readFileSync("app/progress/page.tsx", "utf8");
  const dashboardSource = readFileSync(
    "src/components/progress/ExamReadinessDashboard.tsx",
    "utf8"
  );

  assert.equal(model.progress.fullReadinessDashboard, true);
  assert.equal(model.progress.readinessDashboardPath, "/progress#exam-readiness");
  assert.equal(model.progress.officialTfLReadiness, false);
  assert.deepEqual(model.progress.readinessStatusIds, [
    "ready-for-harder-practice",
    "nearly-ready",
    "needs-more-practice",
    "not-enough-attempts"
  ]);
  assert.match(progressPageSource, /ExamReadinessDashboard/);
  assert.match(dashboardSource, /data-testid="exam-readiness-dashboard"/);
  assert.match(dashboardSource, /createLocalExamProgressStorage/);
  assert.match(dashboardSource, /buildExamReadinessSummary/);
  assert.match(dashboardSource, /min-w-0/);
  assert.match(dashboardSource, /sm:grid-cols-2/);
  assert.match(dashboardSource, /lg:grid-cols-2/);
  assert.doesNotMatch(dashboardSource, /official TfL readiness/i);
});

test("Stage 9.6.1 uses a focused exam shell and a compact submitted review", () => {
  const model = buildExamModePracticePageModel();
  const pageSource = readFileSync("app/practice/exam-mode/page.tsx", "utf8");
  const appShellSource = readFileSync("components/layout/AppShell.tsx", "utf8");
  const routeRunnerSource = readFileSync("app/dev/route-runner/RouteRunnerClient.tsx", "utf8");

  assert.equal(model.presentation.focusedShell, true);
  assert.equal(model.presentation.globalNavigationVisible, false);
  assert.equal(model.presentation.exitHref, "/practice");
  assert.equal(model.presentation.exitLabel, "Exit exam");
  assert.equal(model.presentation.compactSubmittedReview, true);
  assert.equal(model.presentation.scoreBreakdownCollapsedByDefault, true);
  assert.equal(model.presentation.progressDetailsCollapsedByDefault, true);
  assert.equal(model.presentation.adaptivePracticePlanVisibleInReview, false);

  assert.match(pageSource, /focusMode=/);
  assert.doesNotMatch(pageSource, /Back to practice/);
  assert.match(appShellSource, /data-app-shell-mode="focus"/);
  assert.match(appShellSource, /focusMode\.exitLabel/);
  assert.match(routeRunnerSource, /Exam result/);
  assert.match(routeRunnerSource, /Score breakdown/);
  assert.match(routeRunnerSource, /Attempt saved/);
  assert.match(routeRunnerSource, /Next attempt/);
  assert.match(routeRunnerSource, /!isExamRouteRunner && learnerFeedbackIssueSections\.length/);
  assert.match(routeRunnerSource, /!isExamRouteRunner && requiredStopStatuses\.length/);
  assert.match(routeRunnerSource, /!isExamRouteRunner && learnerAdaptiveCoachingCard/);
});

test("Stage 9.7 carries one committed exam task through scoring review persistence and readiness", () => {
  const model = buildExamModePracticePageModel();
  const task = listExamRouteTasks(model.mapOptions)[0];

  assert.ok(task);

  const mapOption = model.mapOptions.find((option) => option.map.id === task.mapId);
  const metadata = getExamRouteTaskMetadata(task);

  assert.ok(mapOption);
  assert.ok(metadata);

  const validation = validateRouteExerciseLegalReachability(task, mapOption.map);
  assert.equal(validation.valid, true, validation.errors.join("; "));

  const shortestRoute = findShortestLegalRouteThroughStops({
    graph: buildMapGraph(mapOption.map),
    stopNodeIds: validation.stopNodeIds,
    restrictions: mapOption.map.restrictions
  });
  assert.equal(shortestRoute.found, true);

  if (!shortestRoute.found) {
    return;
  }

  const exerciseResult = runRouteExercise({
    map: mapOption.map,
    exercises: mapOption.exercises,
    exerciseId: task.id,
    userRoute: {
      nodeIds: shortestRoute.nodeIds,
      roadIds: shortestRoute.roadIds
    }
  });

  assert.equal(
    resolveSubmittedExamScoringResult({
      mode: "student-exam",
      submitted: false,
      exerciseResult
    }),
    null
  );

  const scoringResult = resolveSubmittedExamScoringResult({
    mode: "student-exam",
    submitted: true,
    exerciseResult
  });
  assert.ok(scoringResult);

  const review = resolveSubmittedExamReviewFeedback({
    mode: "student-exam",
    submitted: true,
    scoringResult,
    exerciseResult,
    attemptEvidence: { illegalMovements: [] }
  });
  assert.ok(review);

  const attempt = buildCompletedExamProgressAttempt({
    mode: "student-exam",
    submitted: true,
    attemptId: "stage-9-7-integrated-attempt",
    taskId: task.id,
    taskTitle: task.title,
    mapId: mapOption.map.id,
    taskVersion: task.exerciseVersion,
    originLabel: metadata.origin.label,
    destinationLabel: metadata.destination.label,
    completedAt: "2026-07-16T12:00:00.000Z",
    elapsedSeconds: 180,
    scoringResult,
    routeTags: metadata.tags
  });
  assert.ok(attempt);

  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key)
  };
  const adapter = createLocalExamProgressStorage({ storage });
  const progress = recordExamProgressAttempt(createEmptyExamProgressState(), attempt);

  assert.equal(adapter.save(progress).ok, true);

  const reloaded = createLocalExamProgressStorage({ storage }).load();
  const readiness = buildExamReadinessSummary(reloaded.progress);

  assert.equal(reloaded.ok, true);
  assert.equal(readiness.totalCompletedAttempts, 1);
  assert.equal(readiness.status.id, "not-enough-attempts");
  assert.equal(readiness.officialTfLReadiness, false);
  assert.equal(review.scorePercent, scoringResult.scorePercent);
});
