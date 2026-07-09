import assert from "node:assert/strict";
import test from "node:test";
import { realLondonOsmPilotRouteMap } from "../../app/dev/route-runner/routeRunnerMaps.ts";
import {
  CURATED_LEARNER_ROUTE_PACK,
  EXPERIMENTAL_GENERATED_ROUTE_LABEL,
  NO_CURATED_ROUTE_AVAILABLE_MESSAGE,
  auditCuratedTrainingRoutePack,
  buildCuratedTrainingRouteCards,
  buildCuratedTrainingRoutePackSummary,
  curatedTrainingRouteToGeneratedLearnerExercise,
  generateLearnerAttemptFeedback,
  generateLearnerHint,
  learnerFacingCuratedTrainingRoutes,
  recordLearnerTrainingAttempt,
  scoreLearnerAttempt,
  selectCuratedTrainingRoute,
  validateLearnerRoute,
  createEmptyLearnerTrainingProgress,
  type CuratedTrainingRouteExport
} from "./index.ts";

const routeMapById = {
  [realLondonOsmPilotRouteMap.id]: realLondonOsmPilotRouteMap
};

test("Stage 20 curated learner route pack loads complete learner-facing routes", () => {
  const summary = buildCuratedTrainingRoutePackSummary();
  const learnerRoutes = learnerFacingCuratedTrainingRoutes();

  assert.equal(CURATED_LEARNER_ROUTE_PACK.length, 13);
  assert.equal(learnerRoutes.length, 13);
  assert.equal(summary.totalLearnerFacingRoutes, 13);
  assert.equal(summary.countsByDifficulty.beginner, 3);
  assert.equal(summary.countsByDifficulty.intermediate, 5);
  assert.equal(summary.countsByDifficulty.advanced, 5);
  assert.equal(summary.checkpointRouteCount, 3);
  assert.equal(summary.countsByExerciseType["follow-planned-route"], 7);
  assert.ok(summary.countsByExerciseType["choose-legal-route"]);
  assert.ok(summary.countsByExerciseType["practise-junction-decision-making"]);
  assert.ok(summary.countsByExerciseType["route-review-mistake-correction"]);
});

test("Stage 20 draft and review curated routes are excluded from learner Training Mode", () => {
  const draftRoute: CuratedTrainingRouteExport = {
    ...CURATED_LEARNER_ROUTE_PACK[0],
    routeId: "draft-copy",
    status: "draft",
    lifecycleStage: "draft",
    metadata: {
      ...CURATED_LEARNER_ROUTE_PACK[0].metadata,
      routeId: "draft-copy",
      status: "draft"
    }
  };
  const reviewRoute: CuratedTrainingRouteExport = {
    ...CURATED_LEARNER_ROUTE_PACK[1],
    routeId: "review-copy",
    status: "draft",
    lifecycleStage: "review",
    metadata: {
      ...CURATED_LEARNER_ROUTE_PACK[1].metadata,
      routeId: "review-copy",
      status: "draft"
    }
  };
  const learnerRoutes = learnerFacingCuratedTrainingRoutes([
    ...CURATED_LEARNER_ROUTE_PACK,
    draftRoute,
    reviewRoute
  ]);

  assert.equal(learnerRoutes.some((route) => route.routeId === "draft-copy"), false);
  assert.equal(learnerRoutes.some((route) => route.routeId === "review-copy"), false);
  assert.equal(learnerRoutes.every((route) => route.status === "beta" || route.status === "approved"), true);
});

test("Stage 20 learner-facing routes pass metadata and validation audit", () => {
  const audit = auditCuratedTrainingRoutePack({
    mapById: routeMapById
  });

  assert.equal(audit.validLearnerFacingRouteIds.length, 13);
  assert.deepEqual(audit.issues.filter((issue) => issue.severity === "error"), []);
  assert.equal(
    audit.summary.averageComplexityByDifficulty.beginner <
      audit.summary.averageComplexityByDifficulty.intermediate,
    true
  );
  assert.equal(
    audit.summary.averageComplexityByDifficulty.intermediate <
      audit.summary.averageComplexityByDifficulty.advanced,
    true
  );
});

test("Stage 20 every complete beta route validates with no blocking errors", () => {
  for (const route of learnerFacingCuratedTrainingRoutes()) {
    const validation = validateLearnerRoute({
      map: realLondonOsmPilotRouteMap,
      routeSegments: route.validationSegments,
      difficulty: route.difficulty
    });

    assert.equal(validation.valid, true, route.routeId);
    assert.equal(validation.blockingErrors.length, 0, route.routeId);
    assert.equal(route.validationSummary.valid, true, route.routeId);
    assert.equal(route.validationSummary.blockingErrors.length, 0, route.routeId);
    assert.ok(route.shortestRouteComparison.directComparison.comparisonStatus !== "unknown", route.routeId);
    assert.ok(route.instructorQaNote?.length, route.routeId);
    assert.ok(route.metadata.hintSequence.length > 0, route.routeId);
    assert.ok(route.metadata.scoringEmphasis.length > 0, route.routeId);
    assert.ok(route.routePack?.manualQaNote, route.routeId);
  }
});

test("Stage 20 checkpoint routes export ordered required checkpoints", () => {
  const checkpointRoutes = learnerFacingCuratedTrainingRoutes().filter((route) => route.checkpoints.length > 0);

  assert.equal(checkpointRoutes.length, 3);

  for (const route of checkpointRoutes) {
    assert.equal(route.checkpointRequirements.required, true, route.routeId);
    assert.equal(route.checkpointRequirements.ordered, true, route.routeId);
    assert.deepEqual(
      route.checkpointRequirements.requiredNodeIds,
      route.checkpoints.map((checkpoint) => checkpoint.nodeId),
      route.routeId
    );
    assert.deepEqual(
      route.checkpoints.map((checkpoint) => checkpoint.order),
      route.checkpoints.map((_, index) => index + 1),
      route.routeId
    );
  }
});

test("Stage 20 route cards expose learner-useful curated route details", () => {
  const cards = buildCuratedTrainingRouteCards({
    mapId: realLondonOsmPilotRouteMap.id,
    difficulty: "beginner",
    exerciseType: "follow-planned-route",
    activeRouteId: "real-london-beginner-follow-store-street"
  });

  assert.equal(cards.length, 3);
  assert.equal(cards.filter((card) => card.selected).length, 1);
  assert.ok(cards.every((card) => card.title && card.area === "Real London Pilot"));
  assert.ok(cards.every((card) => card.approximateLengthLabel.length > 0));
  assert.ok(cards.every((card) => card.skillsPractised.length > 0));
  assert.ok(cards.every((card) => card.statusLabel === "Beta"));
});

test("Stage 20 curated route selection avoids immediate repetition where alternatives exist", () => {
  const first = selectCuratedTrainingRoute({
    mapId: realLondonOsmPilotRouteMap.id,
    difficulty: "beginner",
    exerciseType: "follow-planned-route",
    seed: "rotation"
  });
  const second = selectCuratedTrainingRoute({
    mapId: realLondonOsmPilotRouteMap.id,
    difficulty: "beginner",
    exerciseType: "follow-planned-route",
    seed: "rotation",
    recentRouteIds: first.route ? [first.route.routeId] : []
  });
  const exhausted = selectCuratedTrainingRoute({
    mapId: realLondonOsmPilotRouteMap.id,
    difficulty: "beginner",
    exerciseType: "follow-planned-route",
    seed: "rotation",
    recentRouteIds: [
      "real-london-beginner-follow-goodge-tottenham",
      "real-london-beginner-follow-store-street",
      "real-london-beginner-follow-torrington-byng"
    ]
  });

  assert.ok(first.route);
  assert.ok(second.route);
  assert.notEqual(second.route?.routeId, first.route?.routeId);
  assert.ok(exhausted.route);
  assert.equal(exhausted.repeatedRecentRoute, true);
});

test("Stage 20 no curated route selection returns clear fallback messaging", () => {
  const selection = selectCuratedTrainingRoute({
    mapId: "marlowe-district-dev-map",
    difficulty: "advanced",
    exerciseType: "practise-roundabouts",
    seed: "missing"
  });

  assert.equal(selection.route, null);
  assert.equal(selection.message, NO_CURATED_ROUTE_AVAILABLE_MESSAGE);
  assert.equal(EXPERIMENTAL_GENERATED_ROUTE_LABEL, "Try experimental generated route");
});

test("Stage 20 curated routes instantiate, hint, score, feedback, and progress end to end", () => {
  const route = CURATED_LEARNER_ROUTE_PACK.find(
    (candidate) => candidate.routeId === "real-london-intermediate-follow-huntley-chenies"
  );

  assert.ok(route);

  const exercise = curatedTrainingRouteToGeneratedLearnerExercise(route);
  const hint = generateLearnerHint({
    exercise,
    currentCheckpointIndex: 0,
    hintsAlreadyUsed: []
  });
  const scoring = scoreLearnerAttempt({
    map: realLondonOsmPilotRouteMap,
    exercise,
    attemptedRouteSegments: exercise.expectedRouteSegments,
    hintsUsed: hint.status === "generated" ? [hint.hint] : [],
    attemptId: "curated-pack-perfect"
  });
  const feedback = generateLearnerAttemptFeedback({
    map: realLondonOsmPilotRouteMap,
    exercise,
    scoring
  });
  const progress = recordLearnerTrainingAttempt({
    progress: createEmptyLearnerTrainingProgress({
      learnerId: "curated-pack-learner",
      updatedAt: "2026-07-09T12:00:00.000Z"
    }),
    exercise,
    scoring,
    feedback,
    hintsUsed: hint.status === "generated" ? [hint.hint] : [],
    completedAt: "2026-07-09T12:05:00.000Z"
  });

  assert.equal(exercise.published, true);
  assert.equal(exercise.tags?.some((tag) => tag.startsWith("skill:checkpoint navigation")), true);
  assert.equal(hint.status, "generated");
  assert.equal(scoring.passed, true);
  assert.ok(feedback.messages.length > 0);
  assert.ok(feedback.summary.length > 0);
  assert.equal(progress.attempts.length, 1);
  assert.equal(progress.attempts[0]?.exerciseId, exercise.id);
  assert.equal(progress.attempts[0]?.hintCount, 1);
});
