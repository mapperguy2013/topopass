import assert from "node:assert/strict";
import test from "node:test";
import type { MapDefinition } from "../../../lib/map-engine/index.ts";
import { marloweDistrictMap } from "../../../lib/map-engine/fixtures/index.ts";
import {
  buildLearnerTrainingProgressState,
  validateLearnerRoute,
  type GeneratedLearnerExercise,
  type LearnerTrainingAttemptProgressRecord,
  type LearnerRouteValidationSegment
} from "../../../lib/training/index.ts";
import {
  buildLearnerTrainingModePanelModel,
  createLearnerTrainingModeState,
  openLearnerTrainingMode,
  requestLearnerTrainingHint,
  reviewLearnerTrainingAttempt,
  selectLearnerTrainingDifficulty,
  selectLearnerTrainingExerciseType,
  startLearnerTrainingExercise
} from "./learnerTrainingModeUi.ts";

const plannedReviewSegments: LearnerRouteValidationSegment[] = [
  { id: "planned-ab", roadId: "road-ab", fromNodeId: "a", toNodeId: "b" },
  { id: "planned-bc", roadId: "road-bc", fromNodeId: "b", toNodeId: "c" },
  { id: "planned-cd", roadId: "road-cd", fromNodeId: "c", toNodeId: "d" }
];

function generatedState(seed = "training-ui-test") {
  return startLearnerTrainingExercise({
    state: openLearnerTrainingMode(createLearnerTrainingModeState()),
    map: marloweDistrictMap,
    seed
  });
}

function learnerReviewMap(): MapDefinition {
  return {
    id: "learner-review-map",
    name: "Learner Review Map",
    nodes: [
      { id: "a", x: 0, y: 0, label: "Start" },
      { id: "b", x: 100, y: 0, label: "Junction B" },
      { id: "c", x: 200, y: 0, label: "Checkpoint C" },
      { id: "d", x: 300, y: 0, label: "Finish" },
      { id: "e", x: 100, y: 100, label: "Restricted Road" },
      { id: "f", x: 100, y: -100, label: "Recovery Road" }
    ],
    roads: [
      { id: "road-ab", fromNodeId: "a", toNodeId: "b", distanceMeters: 100, isOneWay: false, name: "Alpha Street" },
      { id: "road-bc", fromNodeId: "b", toNodeId: "c", distanceMeters: 100, isOneWay: false, name: "Beacon Street" },
      { id: "road-cd", fromNodeId: "c", toNodeId: "d", distanceMeters: 100, isOneWay: false, name: "Carter Street" },
      { id: "road-bf", fromNodeId: "b", toNodeId: "f", distanceMeters: 120, isOneWay: false, name: "Wrong Turn Road" },
      { id: "road-fc", fromNodeId: "f", toNodeId: "c", distanceMeters: 120, isOneWay: false, name: "Recovery Road" },
      { id: "road-be", fromNodeId: "b", toNodeId: "e", distanceMeters: 100, isOneWay: false, name: "No Entry Street" },
      { id: "road-ed", fromNodeId: "e", toNodeId: "d", distanceMeters: 180, isOneWay: false, name: "Exit Road" },
      { id: "road-bd", fromNodeId: "b", toNodeId: "d", distanceMeters: 240, isOneWay: false, name: "Checkpoint Bypass" }
    ],
    restrictions: [
      {
        id: "no-entry-be",
        type: "no_entry",
        roadId: "road-be",
        fromNodeId: "b",
        toNodeId: "e",
        reason: "No entry for learner route test"
      }
    ],
    landmarks: []
  };
}

function learnerReviewExercise(map = learnerReviewMap()): GeneratedLearnerExercise {
  const validation = validateLearnerRoute({
    map,
    difficulty: "beginner",
    routeSegments: plannedReviewSegments
  });

  return {
    id: "learner-review-exercise",
    title: "Learner review exercise",
    type: "follow-planned-route",
    difficulty: "beginner",
    mapId: map.id,
    objectives: [
      {
        id: "objective-follow-route",
        title: "Follow the planned route",
        category: "route-legality",
        required: true,
        successCriteria: ["Stay on the planned route and visit the checkpoint."],
        linkedFaultCategories: ["missed-checkpoint", "no-entry", "unsafe-junction-decision"]
      }
    ],
    routeLegs: [
      {
        id: "leg-a-d",
        from: { type: "node", nodeId: "a", label: "Start" },
        to: { type: "node", nodeId: "d", label: "Finish" },
        expectedRoadIds: ["road-ab", "road-bc", "road-cd"],
        distanceMeters: 300
      }
    ],
    routeInstructions: [
      {
        id: "instruction-start",
        sequence: 0,
        kind: "start",
        text: "Start on Alpha Street.",
        nodeId: "a",
        mapPoint: { x: 0, y: 0 }
      },
      {
        id: "instruction-turn",
        sequence: 1,
        kind: "turn-right",
        text: "Turn onto Beacon Street at Junction B.",
        roadId: "road-bc",
        nodeId: "b",
        mapPoint: { x: 100, y: 0 }
      },
      {
        id: "instruction-checkpoint",
        sequence: 2,
        kind: "checkpoint",
        text: "Pass Checkpoint C before continuing.",
        nodeId: "c",
        mapPoint: { x: 200, y: 0 }
      },
      {
        id: "instruction-arrive",
        sequence: 3,
        kind: "arrive",
        text: "Finish at the destination.",
        nodeId: "d",
        mapPoint: { x: 300, y: 0 }
      }
    ],
    estimatedMinutes: 4,
    published: true,
    routeGeometry: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 200, y: 0 },
      { x: 300, y: 0 }
    ],
    checkpoints: [
      { type: "node", nodeId: "a", label: "Start" },
      { type: "node", nodeId: "c", label: "Checkpoint C" },
      { type: "node", nodeId: "d", label: "Finish" }
    ],
    expectedRouteSegments: plannedReviewSegments,
    estimatedDifficulty: "beginner",
    validation,
    generationMetadata: {
      status: "generated",
      seed: "learner-review-fixture",
      attempts: 1,
      reasonCodes: ["candidate-selected"],
      constraints: {}
    }
  };
}

function learnerReviewState(): { map: MapDefinition; state: ReturnType<typeof createLearnerTrainingModeState> } {
  const map = learnerReviewMap();

  return {
    map,
    state: createLearnerTrainingModeState({
      isOpen: true,
      activeExercise: learnerReviewExercise(map)
    })
  };
}

function learnerProgressAttempt(input: {
  id: string;
  scorePercent: number;
  completedAt: string;
  fault?: boolean;
}): LearnerTrainingAttemptProgressRecord {
  const faults = input.fault
    ? [
        {
          id: `${input.id}-fault`,
          category: "unsafe-junction-decision" as const,
          severity: "minor" as const,
          title: "Wrong turn recovered",
          blocking: false
        }
      ]
    : [];

  return {
    id: input.id,
    exerciseId: `exercise-${input.id}`,
    exerciseTitle: `Exercise ${input.id}`,
    mapId: "learner-review-map",
    exerciseType: "follow-planned-route",
    difficulty: "beginner",
    attemptedAt: input.completedAt,
    completedAt: input.completedAt,
    status: input.scorePercent >= 70 ? "passed" : "failed",
    scorePercent: input.scorePercent,
    passed: input.scorePercent >= 70,
    completed: true,
    hintCount: 1,
    highestHintLevel: "nudge",
    hintPenalty: 2,
    seriousFaultCount: 0,
    dangerousFaultCount: 0,
    invalidRouteFaultCount: 0,
    faultCategories: input.fault ? ["unsafe-junction-decision"] : [],
    faults,
    summary: `Attempt ${input.id}`
  };
}

test("training mode opens from the route runner model", () => {
  const state = openLearnerTrainingMode(createLearnerTrainingModeState());
  const model = buildLearnerTrainingModePanelModel({
    state,
    map: marloweDistrictMap,
    viewport: "desktop"
  });

  assert.equal(model.isOpen, true);
  assert.equal(model.label, "Training Mode");
  assert.ok(model.primaryActions.some((action) => action.id === "generate-exercise" && !action.disabled));
});

test("difficulty and exercise type can be selected", () => {
  const state = selectLearnerTrainingExerciseType(
    selectLearnerTrainingDifficulty(createLearnerTrainingModeState(), "advanced"),
    "practise-junction-decision-making"
  );
  const model = buildLearnerTrainingModePanelModel({
    state,
    map: marloweDistrictMap,
    viewport: "desktop"
  });

  assert.equal(state.selectedDifficulty, "advanced");
  assert.equal(state.selectedExerciseType, "practise-junction-decision-making");
  assert.equal(model.difficultyOptions.find((option) => option.value === "advanced")?.selected, true);
  assert.equal(
    model.exerciseTypeOptions.find((option) => option.value === "practise-junction-decision-making")?.selected,
    true
  );
});

test("exercise generation produces a startable route model", () => {
  const state = generatedState();
  const model = buildLearnerTrainingModePanelModel({
    state,
    map: marloweDistrictMap,
    viewport: "desktop"
  });

  assert.notEqual(state.activeExercise, null);
  assert.match(state.generation.status, /generated|degraded/);
  assert.equal(model.routeSummary?.difficulty, "beginner");
  assert.ok((model.routeSummary?.segmentCount ?? 0) > 0);
  assert.equal(model.validation?.blockingErrorCount, 0);
  assert.ok(model.currentObjective?.title);
  assert.ok(model.currentInstruction?.text);
});

test("hint button advances progressive hint output", () => {
  const firstHintState = requestLearnerTrainingHint({
    state: generatedState("training-ui-hints")
  });
  const firstHintModel = buildLearnerTrainingModePanelModel({
    state: firstHintState,
    map: marloweDistrictMap,
    viewport: "desktop"
  });
  const secondHintState = requestLearnerTrainingHint({
    state: firstHintState
  });
  const secondHintModel = buildLearnerTrainingModePanelModel({
    state: secondHintState,
    map: marloweDistrictMap,
    viewport: "desktop"
  });

  assert.equal(firstHintModel.hint?.requestNumber, 1);
  assert.equal(secondHintModel.hint?.requestNumber, 2);
  assert.ok((secondHintModel.hint?.specificity ?? 0) > (firstHintModel.hint?.specificity ?? 0));
  assert.notEqual(secondHintModel.hint?.text, firstHintModel.hint?.text);
});

test("route and checkpoint overlays render for generated exercises", () => {
  const state = generatedState("training-ui-overlays");
  const model = buildLearnerTrainingModePanelModel({
    state,
    map: marloweDistrictMap,
    viewport: "desktop"
  });

  assert.equal(model.overlay.visible, true);
  assert.ok(model.overlay.route.points.length >= 2);
  assert.ok(model.overlay.route.segmentIds.length > 0);
  assert.ok(model.overlay.checkpoints.some((checkpoint) => checkpoint.role === "start"));
  assert.ok(model.overlay.checkpoints.some((checkpoint) => checkpoint.role === "finish"));
});

test("existing Phase 6 map controls remain present in the training model", () => {
  const model = buildLearnerTrainingModePanelModel({
    state: generatedState("training-ui-phase6-controls"),
    map: marloweDistrictMap,
    viewport: "desktop"
  });

  assert.ok(model.phase6Controls.includes("Practice map"));
  assert.ok(model.phase6Controls.includes("Pan"));
  assert.ok(model.phase6Controls.includes("Draw"));
  assert.ok(model.phase6Controls.includes("Zoom in"));
  assert.ok(model.phase6Controls.includes("Zoom out"));
  assert.ok(model.phase6Controls.includes("Submit"));
});

test("mobile layout keeps primary training actions available", () => {
  const model = buildLearnerTrainingModePanelModel({
    state: generatedState("training-ui-mobile"),
    map: marloweDistrictMap,
    viewport: "mobile"
  });
  const actionIds = model.primaryActions.map((action) => action.id);

  assert.equal(model.mobile.primaryActionsSticky, false);
  assert.equal(model.mobile.controlsAvoidMapOverlay, true);
  assert.equal(model.mobile.minimumTouchTargetPx >= 44, true);
  assert.deepEqual(model.mobile.hiddenPrimaryActionIds, []);
  assert.deepEqual(actionIds, ["open-training-mode", "generate-exercise", "request-hint", "complete-review"]);
});

test("completion review action returns instructor-style feedback", () => {
  const state = reviewLearnerTrainingAttempt({
    state: requestLearnerTrainingHint({
      state: generatedState("training-ui-review")
    }),
    map: marloweDistrictMap
  });
  const model = buildLearnerTrainingModePanelModel({
    state,
    map: marloweDistrictMap,
    viewport: "desktop"
  });

  assert.ok(model.review);
  assert.equal(typeof model.review?.scorePercent, "number");
  assert.ok(model.review?.summary);
});

test("training mode progress model shows summary, recent attempts, mistakes, and reset action", () => {
  const progress = buildLearnerTrainingProgressState({
    learnerId: "learner-progress-ui",
    updatedAt: "2026-07-07T12:00:00.000Z",
    attempts: [
      learnerProgressAttempt({
        id: "progress-1",
        scorePercent: 76,
        completedAt: "2026-07-07T10:00:00.000Z",
        fault: true
      }),
      learnerProgressAttempt({
        id: "progress-2",
        scorePercent: 81,
        completedAt: "2026-07-07T11:00:00.000Z",
        fault: true
      })
    ]
  });
  const model = buildLearnerTrainingModePanelModel({
    state: openLearnerTrainingMode(createLearnerTrainingModeState()),
    map: marloweDistrictMap,
    viewport: "desktop",
    progress
  });

  assert.equal(model.progress?.summary.attemptCount, 2);
  assert.equal(model.progress?.summary.averageScoreLabel, "78.5%");
  assert.equal(model.progress?.recentAttempts[0]?.id, "progress-2");
  assert.equal(model.progress?.commonMistakes[0]?.label, "Junction decision");
  assert.equal(model.progress?.recommendation.exerciseType, "practise-junction-decision-making");
  assert.equal(model.progress?.resetAction.disabled, false);
});

test("clean learner attempt review shows planned and attempted route without fault markers", () => {
  const { map, state } = learnerReviewState();
  const reviewedState = reviewLearnerTrainingAttempt({
    state,
    map,
    attemptedRouteSegments: plannedReviewSegments,
    attemptId: "clean-learner-review"
  });
  const model = buildLearnerTrainingModePanelModel({
    state: reviewedState,
    map,
    viewport: "desktop"
  });

  assert.equal(model.review?.passed, true);
  assert.equal(model.review?.minorFaultCount, 0);
  assert.equal(model.review?.seriousFaultCount, 0);
  assert.equal(model.overlay.route.points.length, 4);
  assert.deepEqual(model.overlay.attemptedRoute?.segmentIds, plannedReviewSegments.map((segment) => segment.id));
  assert.deepEqual(model.overlay.faultMarkers, []);
  assert.equal(model.review?.messages[0]?.severity, "positive");
  assert.equal(model.reviewActions.some((action) => action.id === "retry-exercise"), true);
  assert.equal(model.reviewActions.some((action) => action.id === "next-exercise"), true);
});

test("learner attempt review marks wrong turns and recovery on the route", () => {
  const { map, state } = learnerReviewState();
  const attemptedRouteSegments: LearnerRouteValidationSegment[] = [
    plannedReviewSegments[0],
    { id: "wrong-turn-bf", roadId: "road-bf", fromNodeId: "b", toNodeId: "f" },
    { id: "recovery-fc", roadId: "road-fc", fromNodeId: "f", toNodeId: "c" },
    plannedReviewSegments[2]
  ];
  const reviewedState = reviewLearnerTrainingAttempt({
    state,
    map,
    attemptedRouteSegments,
    attemptId: "wrong-turn-learner-review"
  });
  const model = buildLearnerTrainingModePanelModel({
    state: reviewedState,
    map,
    viewport: "desktop"
  });

  assert.equal(model.overlay.attemptedRoute?.roadIds.includes("road-bf"), true);
  assert.equal(model.overlay.faultMarkers.some((marker) => marker.kind === "wrong-turn"), true);
  assert.ok((model.review?.routeAdherencePercent ?? 100) < 100);
  assert.ok(model.review?.segmentFeedback.some((item) => item.routeSegmentId === "wrong-turn-bf"));
});

test("learner attempt review marks illegal route segments as serious visual faults", () => {
  const { map, state } = learnerReviewState();
  const reviewedState = reviewLearnerTrainingAttempt({
    state,
    map,
    attemptedRouteSegments: [
      plannedReviewSegments[0],
      { id: "illegal-be", roadId: "road-be", fromNodeId: "b", toNodeId: "e" },
      { id: "detour-ed", roadId: "road-ed", fromNodeId: "e", toNodeId: "d" }
    ],
    attemptId: "illegal-learner-review"
  });
  const model = buildLearnerTrainingModePanelModel({
    state: reviewedState,
    map,
    viewport: "desktop"
  });
  const illegalMarker = model.overlay.faultMarkers.find((marker) => marker.kind === "illegal-segment");

  assert.equal(model.review?.passed, false);
  assert.ok((model.review?.seriousFaultCount ?? 0) > 0);
  assert.ok(illegalMarker);
  assert.equal(illegalMarker?.roadIds.includes("road-be") || illegalMarker?.routeSegmentIds.includes("illegal-be"), true);
  assert.ok(model.review?.messages.some((message) => /no-entry|legal/i.test(message.whatHappened)));
});

test("learner attempt review marks missed checkpoints visually and textually", () => {
  const { map, state } = learnerReviewState();
  const reviewedState = reviewLearnerTrainingAttempt({
    state,
    map,
    attemptedRouteSegments: [
      plannedReviewSegments[0],
      { id: "checkpoint-bypass-bd", roadId: "road-bd", fromNodeId: "b", toNodeId: "d" }
    ],
    attemptId: "missed-checkpoint-learner-review"
  });
  const model = buildLearnerTrainingModePanelModel({
    state: reviewedState,
    map,
    viewport: "desktop"
  });
  const checkpoint = model.overlay.checkpoints.find((candidate) => candidate.nodeId === "c");

  assert.equal(model.review?.passed, false);
  assert.equal(checkpoint?.reviewStatus, "missed");
  assert.equal(model.overlay.faultMarkers.some((marker) => marker.kind === "missed-checkpoint"), true);
  assert.ok(model.review?.messages.some((message) => /checkpoint/i.test(message.whatHappened)));
});

test("learner review feedback markers align with affected route segments", () => {
  const { map, state } = learnerReviewState();
  const reviewedState = reviewLearnerTrainingAttempt({
    state,
    map,
    attemptedRouteSegments: [
      plannedReviewSegments[0],
      { id: "wrong-turn-bf", roadId: "road-bf", fromNodeId: "b", toNodeId: "f" },
      { id: "recovery-fc", roadId: "road-fc", fromNodeId: "f", toNodeId: "c" },
      plannedReviewSegments[2]
    ],
    attemptId: "marker-alignment-review"
  });
  const model = buildLearnerTrainingModePanelModel({
    state: reviewedState,
    map,
    viewport: "desktop"
  });
  const wrongTurnMarker = model.overlay.faultMarkers.find((marker) => marker.kind === "wrong-turn");
  const wrongTurnSegmentFeedback = model.overlay.segmentFeedback.find(
    (item) => item.routeSegmentId === "wrong-turn-bf"
  );

  assert.deepEqual(wrongTurnMarker?.point, { x: 100, y: -50 });
  assert.deepEqual(wrongTurnSegmentFeedback?.point, { x: 100, y: -50 });
  assert.deepEqual(wrongTurnSegmentFeedback?.points, [
    { x: 100, y: 0 },
    { x: 100, y: -100 }
  ]);
});

test("generation failure degrades gracefully without route context", () => {
  const emptyMap: MapDefinition = {
    id: "empty-training-map",
    name: "Empty Training Map",
    nodes: [],
    roads: [],
    restrictions: [],
    landmarks: []
  };
  const state = startLearnerTrainingExercise({
    state: openLearnerTrainingMode(createLearnerTrainingModeState()),
    map: emptyMap,
    seed: "empty"
  });
  const model = buildLearnerTrainingModePanelModel({
    state,
    map: emptyMap,
    viewport: "mobile"
  });

  assert.equal(state.generation.status, "failed");
  assert.equal(state.activeExercise, null);
  assert.equal(model.overlay.visible, false);
  assert.equal(model.primaryActions.find((action) => action.id === "request-hint")?.disabled, true);
  assert.ok(state.generation.explanation);
});
