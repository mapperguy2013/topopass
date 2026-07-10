import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import test from "node:test";
import { realLondonOsmPilotRouteMap } from "../../app/dev/route-runner/routeRunnerMaps.ts";
import {
  CURATED_LEARNER_ROUTE_PACK_FILES,
  CURATED_LEARNER_ROUTE_PACK_TARGET_COUNTS_BY_DIFFICULTY,
  CURATED_LEARNER_ROUTE_PACK,
  EXPERIMENTAL_GENERATED_ROUTE_LABEL,
  auditCuratedTrainingRoutePack,
  auditCuratedTrainingRouteFiles,
  buildCuratedTrainingRouteCards,
  buildCuratedTrainingRoutePackReadiness,
  buildCuratedTrainingRoutePackSummary,
  buildCuratedTrainingRouteVisibilityDiagnostics,
  curatedTrainingRouteUnavailableMessage,
  curatedTrainingRouteToGeneratedLearnerExercise,
  generateLearnerAttemptFeedback,
  generateLearnerHint,
  learnerFacingCuratedTrainingRoutes,
  normaliseCuratedTrainingRouteExport,
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

const completeRouteFilenames = readdirSync("data/training-routes/complete")
  .filter((filename) => filename.endsWith(".json"))
  .sort();

test("Stage 20 curated learner route pack loads complete learner-facing routes", () => {
  const summary = buildCuratedTrainingRoutePackSummary();
  const learnerRoutes = learnerFacingCuratedTrainingRoutes();

  assert.equal(CURATED_LEARNER_ROUTE_PACK.length, 14);
  assert.equal(learnerRoutes.length, 14);
  assert.equal(summary.totalLearnerFacingRoutes, 14);
  assert.equal(summary.countsByDifficulty.beginner, 4);
  assert.equal(summary.countsByDifficulty.intermediate, 5);
  assert.equal(summary.countsByDifficulty.advanced, 5);
  assert.deepEqual(summary.targetCountsByDifficulty, CURATED_LEARNER_ROUTE_PACK_TARGET_COUNTS_BY_DIFFICULTY);
  assert.deepEqual(summary.missingTargetCountsByDifficulty, {
    beginner: 1,
    intermediate: 0,
    advanced: 0
  });
  assert.equal(summary.routePackStatus, "initial-beta");
  assert.equal(summary.checkpointRouteCount, 3);
  assert.equal(summary.countsByExerciseType["follow-planned-route"], 7);
  assert.equal(summary.countsByExerciseType["identify-next-safe-turn"], 1);
  assert.ok(summary.countsByExerciseType["choose-legal-route"]);
  assert.ok(summary.countsByExerciseType["practise-junction-decision-making"]);
  assert.ok(summary.countsByExerciseType["route-review-mistake-correction"]);
});

test("Stage 20 manifest includes every complete route JSON file", () => {
  const manifestFilenames = CURATED_LEARNER_ROUTE_PACK_FILES.map((entry) => entry.filename).sort();

  assert.deepEqual(manifestFilenames, completeRouteFilenames);
});

test("Stage 20 route file audit reports learner-facing visibility for every complete file", () => {
  const fileAudit = auditCuratedTrainingRouteFiles();

  assert.equal(fileAudit.length, completeRouteFilenames.length);
  assert.equal(fileAudit.every((route) => route.filename.endsWith(".json")), true);
  assert.equal(fileAudit.every((route) => route.routeId.length > 0), true);
  assert.equal(fileAudit.every((route) => route.title.length > 0), true);
  assert.equal(fileAudit.every((route) => route.areaName.length > 0 && route.mapId === realLondonOsmPilotRouteMap.id), true);
  assert.equal(fileAudit.every((route) => route.startExists && route.destinationExists), true);
  assert.equal(fileAudit.every((route) => route.routeGeometryExists && route.routeSegmentsExist), true);
  assert.equal(fileAudit.every((route) => route.validationStatus === "valid" || route.validationStatus === "warning"), true);
  assert.equal(fileAudit.every((route) => route.validationBlockingErrorCount === 0), true);
  assert.equal(fileAudit.some((route) => route.validationAdvisoryWarningCount > 0), true);
  assert.equal(fileAudit.every((route) => route.shortestRouteComparisonStatus !== "unknown"), true);
  assert.equal(fileAudit.every((route) => route.learnerFacing), true);
  assert.deepEqual(fileAudit.flatMap((route) => route.excludedReasons), []);
  assert.ok(fileAudit.some((route) => route.checkpointCount > 0 && route.checkpointRequirement === "Required"));
  assert.ok(fileAudit.some((route) => route.checkpointCount === 0 && route.checkpointRequirement === "Optional"));
});

test("Stage 20 route pack readiness documents the missing beginner route target", () => {
  const readiness = buildCuratedTrainingRoutePackReadiness();

  assert.equal(readiness.currentTotal, 14);
  assert.equal(readiness.targetTotal, 15);
  assert.equal(readiness.status, "initial-beta");
  assert.deepEqual(readiness.missingTargetCountsByDifficulty, {
    beginner: 1,
    intermediate: 0,
    advanced: 0
  });
  assert.equal(readiness.missingTotal, 1);
  assert.deepEqual(readiness.expansionTodo, ["Add 1 more beginner curated route."]);
});

test("Stage 19.4 complete beta and approved route exports are loaded for learners", () => {
  const learnerRoutes = learnerFacingCuratedTrainingRoutes();

  assert.ok(learnerRoutes.some((route) => route.routeId === "real-london-beginner-follow-store-street" && route.status === "beta"));
  assert.ok(
    learnerRoutes.some(
      (route) =>
        route.routeId === "real-london-beginner-identify-next-safe-turn-store-street" &&
        route.status === "approved" &&
        route.exerciseType === "identify-next-safe-turn"
    )
  );
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

test("Stage 20 learner-suitability warnings do not block curated route inclusion", () => {
  const warningRoute: CuratedTrainingRouteExport = {
    ...CURATED_LEARNER_ROUTE_PACK[0],
    routeId: "warning-copy",
    validationSummary: {
      ...CURATED_LEARNER_ROUTE_PACK[0].validationSummary,
      status: "warning",
      valid: true,
      advisoryWarnings: [
        {
          code: "route-length-out-of-bounds",
          severity: "warning",
          routeSegmentIds: CURATED_LEARNER_ROUTE_PACK[0].routeSegmentIds,
          roadIds: CURATED_LEARNER_ROUTE_PACK[0].roadIds,
          nodeIds: CURATED_LEARNER_ROUTE_PACK[0].nodeIds,
          explanation: "This route may be long for beginner practice. Instructor review recommended."
        }
      ],
      ruleCodes: ["route-length-out-of-bounds"]
    },
    metadata: {
      ...CURATED_LEARNER_ROUTE_PACK[0].metadata,
      routeId: "warning-copy"
    }
  };

  assert.equal(learnerFacingCuratedTrainingRoutes([warningRoute]).length, 1);
  assert.equal(auditCuratedTrainingRouteFiles([{ filename: "warning-copy.json", route: warningRoute }])[0]?.learnerFacing, true);
});

test("Stage 20 checkpoint optional and required settings control learner visibility", () => {
  const optionalNoCheckpointRoute = CURATED_LEARNER_ROUTE_PACK.find(
    (route) => route.routeId === "real-london-beginner-identify-next-safe-turn-store-street"
  );

  assert.ok(optionalNoCheckpointRoute);
  assert.equal(optionalNoCheckpointRoute.checkpointRequirements.required, false);
  assert.equal(optionalNoCheckpointRoute.checkpoints.length, 0);
  assert.equal(learnerFacingCuratedTrainingRoutes([optionalNoCheckpointRoute]).length, 1);

  const requiredWithoutCheckpointRoute: CuratedTrainingRouteExport = {
    ...optionalNoCheckpointRoute,
    routeId: "required-missing-checkpoint-copy",
    checkpointRequirements: {
      required: true,
      ordered: true,
      checkpointCount: 0,
      requiredNodeIds: [],
      instruction: "Visit the required checkpoint."
    },
    metadata: {
      ...optionalNoCheckpointRoute.metadata,
      routeId: "required-missing-checkpoint-copy",
      checkpointRequirement: "required"
    }
  };
  const audit = auditCuratedTrainingRouteFiles([
    {
      filename: "required-missing-checkpoint-copy.json",
      route: requiredWithoutCheckpointRoute
    }
  ]);

  assert.equal(learnerFacingCuratedTrainingRoutes([requiredWithoutCheckpointRoute]).length, 0);
  assert.equal(audit[0]?.learnerFacing, false);
  assert.ok(audit[0]?.excludedReasons.includes("checkpoint-requirement-invalid"));
});

test("Stage 20 learner-facing routes pass metadata and validation audit", () => {
  const audit = auditCuratedTrainingRoutePack({
    mapById: routeMapById
  });

  assert.equal(audit.validLearnerFacingRouteIds.length, 14);
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
    assert.ok(route.metadata.hintSequence.length > 0, route.routeId);
    assert.ok(route.metadata.scoringEmphasis.length > 0, route.routeId);
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
  assert.match(selection.message ?? "", /hidden by the selected map, difficulty, or exercise type/);
  assert.equal(EXPERIMENTAL_GENERATED_ROUTE_LABEL, "Try experimental generated route");
});

test("Stage 19.4 dev training-route exports are normalised for curated route visibility", () => {
  const sourceRoute = CURATED_LEARNER_ROUTE_PACK.find(
    (route) => route.routeId === "real-london-beginner-identify-next-safe-turn-store-street"
  );

  assert.ok(sourceRoute);

  const devExportShape = {
    ...sourceRoute,
    mapId: undefined,
    areaId: undefined,
    areaName: undefined,
    difficulty: undefined,
    exerciseType: undefined,
    status: undefined,
    metadata: {
      ...sourceRoute.metadata,
      practiceMapId: realLondonOsmPilotRouteMap.id,
      status: "approved"
    }
  };
  const normalised = normaliseCuratedTrainingRouteExport(devExportShape);

  assert.equal(normalised.mapId, realLondonOsmPilotRouteMap.id);
  assert.equal(normalised.areaId, "osm-real-london-pilot");
  assert.equal(normalised.difficulty, "beginner");
  assert.equal(normalised.exerciseType, "identify-next-safe-turn");
  assert.equal(normalised.status, "approved");
  assert.equal(learnerFacingCuratedTrainingRoutes([normalised]).length, 1);
});

test("Stage 19.4 Training Mode route cards include matching complete route options", () => {
  const cards = buildCuratedTrainingRouteCards({
    mapId: realLondonOsmPilotRouteMap.id,
    difficulty: "beginner",
    exerciseType: "identify-next-safe-turn",
    activeRouteId: "real-london-beginner-identify-next-safe-turn-store-street"
  });
  const selection = selectCuratedTrainingRoute({
    mapId: realLondonOsmPilotRouteMap.id,
    difficulty: "beginner",
    exerciseType: "identify-next-safe-turn",
    seed: "stage-19-4"
  });

  assert.equal(cards.length, 1);
  assert.equal(cards[0]?.routeId, "real-london-beginner-identify-next-safe-turn-store-street");
  assert.equal(cards[0]?.selected, true);
  assert.equal(selection.route?.routeId, "real-london-beginner-identify-next-safe-turn-store-street");
  assert.equal(selection.message, null);
});

test("Stage 19.4 curated route diagnostics identify hidden and excluded routes", () => {
  const betaRoute = CURATED_LEARNER_ROUTE_PACK[0];
  const draftRoute: CuratedTrainingRouteExport = {
    ...betaRoute,
    routeId: "diagnostic-draft",
    status: "draft",
    lifecycleStage: "draft",
    metadata: {
      ...betaRoute.metadata,
      routeId: "diagnostic-draft",
      status: "draft"
    }
  };
  const invalidRoute: CuratedTrainingRouteExport = {
    ...betaRoute,
    routeId: "diagnostic-invalid",
    validationSummary: {
      ...betaRoute.validationSummary,
      valid: false,
      status: "invalid",
      blockingErrors: [
        {
          code: "empty-route",
          severity: "error",
          routeSegmentIds: [],
          roadIds: [],
          nodeIds: [],
          explanation: "Route is empty."
        }
      ]
    },
    metadata: {
      ...betaRoute.metadata,
      routeId: "diagnostic-invalid"
    }
  };
  const missingMetadataRoute: CuratedTrainingRouteExport = {
    ...betaRoute,
    routeId: "",
    title: "",
    metadata: {
      ...betaRoute.metadata,
      routeId: "",
      title: "",
      description: ""
    }
  };
  const diagnostics = buildCuratedTrainingRouteVisibilityDiagnostics({
    routes: [betaRoute, draftRoute, invalidRoute, missingMetadataRoute],
    mapId: realLondonOsmPilotRouteMap.id,
    difficulty: "advanced",
    exerciseType: "practise-roundabouts"
  });

  assert.equal(diagnostics.completeRouteCount, 3);
  assert.equal(diagnostics.learnerFacingRouteCount, 1);
  assert.equal(diagnostics.excludedDraftOrReviewCount, 1);
  assert.equal(diagnostics.excludedMissingMetadataCount, 1);
  assert.equal(diagnostics.excludedValidationBlockingCount, 1);
  assert.equal(diagnostics.filter?.matchingRouteCount, 0);
  assert.ok(diagnostics.availableFilterCombinations.some((combination) => combination.difficulty === "beginner"));
  assert.ok(diagnostics.excludedRoutes.some((route) => route.routeId === "diagnostic-draft" && route.reasons.includes("not-complete")));
  assert.ok(diagnostics.excludedRoutes.some((route) => route.routeId === "diagnostic-invalid" && route.reasons.includes("validation-blocking-error")));
  assert.match(
    curatedTrainingRouteUnavailableMessage({
      routes: [betaRoute],
      mapId: realLondonOsmPilotRouteMap.id,
      difficulty: "advanced",
      exerciseType: "practise-roundabouts"
    }),
    /hidden by the selected map, difficulty, or exercise type/
  );
  assert.match(
    curatedTrainingRouteUnavailableMessage({
      routes: [betaRoute],
      mapId: realLondonOsmPilotRouteMap.id,
      difficulty: "advanced",
      exerciseType: "practise-roundabouts"
    }),
    /Available selections: Real London Pilot \/ beginner \/ follow-planned-route/
  );
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
