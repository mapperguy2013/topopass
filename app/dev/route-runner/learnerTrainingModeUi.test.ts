import assert from "node:assert/strict";
import test from "node:test";
import type { MapDefinition } from "../../../lib/map-engine/index.ts";
import { marloweDistrictMap } from "../../../lib/map-engine/fixtures/index.ts";
import { realLondonOsmPilotRouteMap } from "./routeRunnerMaps.ts";
import {
  CURATED_LEARNER_ROUTE_PACK,
  buildLearnerTrainingProgressState,
  validateLearnerRoute,
  type GeneratedLearnerExercise,
  type LearnerTrainingAttemptProgressRecord,
  type LearnerRouteValidationSegment
} from "../../../lib/training/index.ts";
import {
  LEARNER_TRAINING_PHASE6_CONTROL_LABELS,
  buildLearnerTrainingModePanelModel,
  createLearnerTrainingModeState,
  createLearnerTrainingExerciseGenerationCache,
  openLearnerTrainingMode,
  requestLearnerTrainingHint,
  reviewLearnerTrainingAttempt,
  selectLearnerTrainingDifficulty,
  selectLearnerTrainingExerciseType,
  startLearnerTrainingExercise
} from "./learnerTrainingModeUi.ts";
import { buildRouteRunnerOverlayOwnership } from "./routeRunnerOverlayOwnership.ts";

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

test("normal Route Runner endpoints render when no learner training exercise is active", () => {
  const ownership = buildRouteRunnerOverlayOwnership({
    trainingOverlay: { visible: false }
  });

  assert.equal(ownership.activeOverlayMode, "normal");
  assert.equal(ownership.renderNormalRouteEndpoints, true);
  assert.equal(ownership.renderNormalRouteEndpointLabels, true);
  assert.equal(ownership.renderTrainingRouteEndpoints, false);
});

test("learner training endpoints suppress original Route Runner start and destination markers", () => {
  const state = generatedState("training-endpoint-ownership");
  const model = buildLearnerTrainingModePanelModel({
    state,
    map: marloweDistrictMap,
    viewport: "desktop"
  });
  const roles = model.overlay.checkpoints.map((checkpoint) => checkpoint.role);
  const ownership = buildRouteRunnerOverlayOwnership({
    trainingOverlay: model.overlay
  });

  assert.equal(model.overlay.visible, true);
  assert.ok(roles.includes("start"));
  assert.ok(roles.includes("finish"));
  assert.equal(ownership.activeOverlayMode, "training");
  assert.equal(ownership.renderTrainingRouteEndpoints, true);
  assert.equal(ownership.renderNormalRouteEndpoints, false);
  assert.equal(ownership.renderNormalRouteEndpointLabels, false);
});

test("learner training review keeps training markers authoritative over original endpoints", () => {
  const generated = generatedState("training-review-endpoint-ownership");
  const reviewed = reviewLearnerTrainingAttempt({
    state: generated,
    map: marloweDistrictMap,
    attemptedRouteSegments: generated.activeExercise?.expectedRouteSegments ?? [],
    attemptId: "training-review-endpoint-ownership"
  });
  const model = buildLearnerTrainingModePanelModel({
    state: reviewed,
    map: marloweDistrictMap,
    viewport: "desktop"
  });
  const ownership = buildRouteRunnerOverlayOwnership({
    trainingOverlay: model.overlay
  });

  assert.equal(model.review?.status, "passed");
  assert.equal(model.overlay.visible, true);
  assert.equal(ownership.activeOverlayMode, "training");
  assert.equal(ownership.renderNormalRouteEndpoints, false);
  assert.equal(ownership.renderNormalRouteEndpointLabels, false);
  assert.equal(ownership.renderTrainingRouteEndpoints, true);
});

test("closing learner training restores normal Route Runner endpoint ownership", () => {
  const ownership = buildRouteRunnerOverlayOwnership({
    trainingOverlay: null
  });

  assert.equal(ownership.activeOverlayMode, "normal");
  assert.equal(ownership.renderNormalRouteEndpoints, true);
  assert.equal(ownership.renderNormalRouteEndpointLabels, true);
  assert.equal(ownership.renderTrainingRouteEndpoints, false);
});

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
      routeSignature: "review-fixture-route",
      complexity: {
        score: 18,
        routeSignature: "review-fixture-route",
        roadChangeCount: 2,
        turnCount: 2,
        decisionPointCount: 1,
        roundaboutExposure: 0,
        restrictionExposure: 1,
        instructionCountEstimate: 5,
        shapeComplexity: 2,
        repeatedRoadPenalty: 0,
        straightnessRatio: 1,
        mostlyStraight: false
      },
      reasonCodes: ["candidate-selected"],
      constraints: {},
      candidateOptions: [
        {
          id: "option-review-fixture-route",
          routeSignature: "review-fixture-route",
          difficulty: "beginner",
          exerciseType: "follow-planned-route",
          distanceMeters: 300,
          segmentCount: 3,
          turnCount: 2,
          decisionPointCount: 1,
          complexityScore: 18,
          estimatedMinutes: 1,
          skillTags: ["junction planning", "turn sequencing"],
          selected: true
        }
      ]
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
  assert.ok(model.routeSummary?.routeSignature);
  assert.ok((model.routeSummary?.complexityScore ?? 0) > 0);
  assert.ok(model.generationOptions.length > 0);
  assert.equal(model.generationOptions.filter((option) => option.selected).length, 1);
  assert.equal(model.primaryActions.find((action) => action.id === "generate-exercise")?.label, "Try another route");
});

test("curated learner route cards render and curated generation starts a route", () => {
  const baseState = openLearnerTrainingMode(createLearnerTrainingModeState());
  const setupModel = buildLearnerTrainingModePanelModel({
    state: baseState,
    map: realLondonOsmPilotRouteMap,
    viewport: "desktop",
    curatedRoutes: CURATED_LEARNER_ROUTE_PACK
  });
  const started = startLearnerTrainingExercise({
    state: baseState,
    map: realLondonOsmPilotRouteMap,
    curatedRoutes: CURATED_LEARNER_ROUTE_PACK,
    seed: "curated-ui-start"
  });
  const startedModel = buildLearnerTrainingModePanelModel({
    state: started,
    map: realLondonOsmPilotRouteMap,
    viewport: "desktop",
    curatedRoutes: CURATED_LEARNER_ROUTE_PACK
  });

  assert.equal(setupModel.curatedRouteAvailability.status, "available");
  assert.equal(setupModel.curatedRouteCards.length, 3);
  assert.equal(started.generation.routeSource, "curated-route-pack");
  assert.ok(started.generation.curatedRouteId);
  assert.equal(started.activeExercise?.tags?.includes("curated-training-route"), true);
  assert.equal(startedModel.curatedRouteCards.filter((card) => card.selected).length, 1);
  assert.equal(startedModel.generationOptions.length, 0);
  assert.equal(startedModel.validation?.blockingErrorCount, 0);
});

test("approved complete dev exports appear in learner Training Mode route options", () => {
  const state = selectLearnerTrainingExerciseType(
    openLearnerTrainingMode(createLearnerTrainingModeState()),
    "identify-next-safe-turn"
  );
  const model = buildLearnerTrainingModePanelModel({
    state,
    map: realLondonOsmPilotRouteMap,
    viewport: "desktop",
    curatedRoutes: CURATED_LEARNER_ROUTE_PACK
  });
  const started = startLearnerTrainingExercise({
    state,
    map: realLondonOsmPilotRouteMap,
    curatedRoutes: CURATED_LEARNER_ROUTE_PACK,
    seed: "approved-dev-export"
  });

  assert.equal(model.curatedRouteAvailability.status, "available");
  assert.equal(model.curatedRouteCards.length, 1);
  assert.equal(model.curatedRouteCards[0]?.routeId, "real-london-beginner-identify-next-safe-turn-store-street");
  assert.equal(started.generation.routeSource, "curated-route-pack");
  assert.equal(started.generation.curatedRouteId, "real-london-beginner-identify-next-safe-turn-store-street");
  assert.equal(started.activeExercise?.type, "identify-next-safe-turn");
});

test("curated generation avoids recent route ids when alternatives exist", () => {
  const baseState = openLearnerTrainingMode(createLearnerTrainingModeState());
  const first = startLearnerTrainingExercise({
    state: baseState,
    map: realLondonOsmPilotRouteMap,
    curatedRoutes: CURATED_LEARNER_ROUTE_PACK,
    seed: "curated-ui-repeat"
  });
  const second = startLearnerTrainingExercise({
    state: first,
    map: realLondonOsmPilotRouteMap,
    curatedRoutes: CURATED_LEARNER_ROUTE_PACK,
    seed: "curated-ui-repeat"
  });

  assert.ok(first.generation.curatedRouteId);
  assert.ok(second.generation.curatedRouteId);
  assert.notEqual(second.generation.curatedRouteId, first.generation.curatedRouteId);
  assert.ok(second.generation.recentCuratedRouteIds.includes(first.generation.curatedRouteId ?? ""));
  assert.ok(second.generation.recentCuratedRouteIds.includes(second.generation.curatedRouteId ?? ""));
});

test("missing curated route shows clear fallback without silent generation", () => {
  const state = selectLearnerTrainingExerciseType(
    selectLearnerTrainingDifficulty(openLearnerTrainingMode(createLearnerTrainingModeState()), "advanced"),
    "practise-roundabouts"
  );
  const generated = startLearnerTrainingExercise({
    state,
    map: realLondonOsmPilotRouteMap,
    curatedRoutes: CURATED_LEARNER_ROUTE_PACK,
    seed: "curated-ui-missing"
  });
  const model = buildLearnerTrainingModePanelModel({
    state: generated,
    map: realLondonOsmPilotRouteMap,
    viewport: "mobile",
    curatedRoutes: CURATED_LEARNER_ROUTE_PACK
  });

  assert.equal(generated.activeExercise, null);
  assert.equal(generated.generation.status, "failed");
  assert.equal(generated.generation.reasonCodes.includes("no-curated-route-available"), true);
  assert.match(generated.generation.explanation ?? "", /No approved curated route is available/);
  assert.equal(model.curatedRouteAvailability.status, "unavailable");
  assert.equal(model.experimentalFallbackAction?.label, "Try experimental generated route");
  assert.equal(model.overlay.visible, false);
});

test("experimental generated fallback is explicit when curated routes are missing", () => {
  const state = selectLearnerTrainingExerciseType(
    selectLearnerTrainingDifficulty(openLearnerTrainingMode(createLearnerTrainingModeState()), "advanced"),
    "practise-roundabouts"
  );
  const generated = startLearnerTrainingExercise({
    state,
    map: realLondonOsmPilotRouteMap,
    curatedRoutes: CURATED_LEARNER_ROUTE_PACK,
    allowExperimentalGenerationFallback: true,
    preferExperimentalGeneration: true,
    seed: "curated-ui-experimental"
  });

  assert.match(generated.generation.status, /generated|degraded|failed/);
  assert.equal(generated.generation.routeSource, "experimental-generator");
});

test("exercise generation cache reuses seeded results and records cache state", () => {
  const cache = createLearnerTrainingExerciseGenerationCache();
  const baseState = openLearnerTrainingMode(createLearnerTrainingModeState());
  const first = startLearnerTrainingExercise({
    state: baseState,
    map: marloweDistrictMap,
    seed: "training-ui-cache",
    generationCache: cache
  });
  const second = startLearnerTrainingExercise({
    state: baseState,
    map: marloweDistrictMap,
    seed: "training-ui-cache",
    generationCache: cache
  });

  assert.equal(first.generation.cacheStatus, "miss");
  assert.equal(second.generation.cacheStatus, "hit");
  assert.equal(cache.size(), 1);
  assert.equal(first.activeExercise?.id, second.activeExercise?.id);
  assert.deepEqual(first.activeExercise?.expectedRouteSegments, second.activeExercise?.expectedRouteSegments);
  assert.ok((second.generation.attemptLimit ?? 0) > 0);
});

test("repeated Generate requests avoid recent learner training route signatures", () => {
  const baseState = openLearnerTrainingMode(
    selectLearnerTrainingDifficulty(createLearnerTrainingModeState(), "intermediate")
  );
  const first = startLearnerTrainingExercise({
    state: baseState,
    map: marloweDistrictMap,
    seed: "training-ui-repeat"
  });
  const second = startLearnerTrainingExercise({
    state: first,
    map: marloweDistrictMap,
    seed: "training-ui-repeat"
  });
  const secondModel = buildLearnerTrainingModePanelModel({
    state: second,
    map: marloweDistrictMap,
    viewport: "mobile"
  });

  assert.ok(first.activeExercise);
  assert.ok(second.activeExercise);
  assert.notEqual(
    second.activeExercise.generationMetadata.routeSignature,
    first.activeExercise.generationMetadata.routeSignature
  );
  assert.ok(second.generation.recentRouteSignatures.includes(first.activeExercise.generationMetadata.routeSignature));
  assert.ok(second.generation.recentRouteSignatures.includes(second.activeExercise.generationMetadata.routeSignature));
  assert.equal(secondModel.primaryActions.find((action) => action.id === "generate-exercise")?.label, "Try another route");
  assert.ok(secondModel.generationOptions.every((option) => option.distanceLabel.length > 0));
  assert.equal(secondModel.mobile.hiddenPrimaryActionIds.length, 0);
});

test("training mode exposes accessible live regions focus targets and keyboard order", () => {
  const model = buildLearnerTrainingModePanelModel({
    state: openLearnerTrainingMode(createLearnerTrainingModeState()),
    map: marloweDistrictMap,
    viewport: "desktop"
  });

  assert.equal(model.accessibility.panelRole, "region");
  assert.equal(model.accessibility.panelAriaLabel, "Learner driver training mode");
  assert.equal(model.accessibility.liveRegion.id, "learner-training-status");
  assert.equal(model.accessibility.liveRegion.politeness, "polite");
  assert.equal(model.accessibility.liveRegion.atomic, true);
  assert.match(model.accessibility.liveRegion.message, /choose a difficulty/i);
  assert.equal(model.accessibility.focusTargetId, "generate-exercise");
  assert.deepEqual(model.accessibility.keyboardNavigationOrder.slice(0, 4), [
    "open-training-mode",
    "learner-training-difficulty",
    "learner-training-exercise-type",
    "generate-exercise"
  ]);
  assert.equal(model.primaryActions.every((action) => action.ariaLabel.length > action.label.length), true);
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
  assert.equal(secondHintModel.accessibility.focusTargetId, "request-hint");
  assert.match(secondHintModel.accessibility.liveRegion.message, /hint 2/i);
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
  assert.equal(model.overlay.readability.preservesPhase6Labels, true);
  assert.equal(model.overlay.readability.routeLineHalo, true);
  assert.equal(model.overlay.readability.markerHalo, true);
  assert.equal(model.performance.mapRerenderScope, "training-overlay-only");
  assert.equal(model.performance.shouldRenderTrainingOverlay, true);
  assert.ok(model.performance.overlayPointCount >= model.overlay.route.points.length);
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
  assert.equal(model.mobile.panelPlacement, "below-map");
  assert.equal(model.mobile.maxPanelHeightVh <= 72, true);
  assert.equal(model.mobile.reservedStatusMinHeightPx >= 48, true);
  assert.equal(model.mobile.layoutShiftGuard, true);
  assert.deepEqual(model.mobile.hiddenPrimaryActionIds, []);
  assert.deepEqual(actionIds, ["open-training-mode", "generate-exercise", "request-hint", "complete-review"]);
});

test("mobile learner review preserves Phase 6 controls while rendering training overlays", () => {
  const { map, state } = learnerReviewState();
  const hintedState = requestLearnerTrainingHint({
    state,
    currentInstructionId: "instruction-turn",
    attemptId: "mobile-review-hint"
  });
  const reviewedState = reviewLearnerTrainingAttempt({
    state: hintedState,
    map,
    attemptedRouteSegments: [
      plannedReviewSegments[0],
      { id: "wrong-turn-bf", roadId: "road-bf", fromNodeId: "b", toNodeId: "f" },
      { id: "recovery-fc", roadId: "road-fc", fromNodeId: "f", toNodeId: "c" },
      plannedReviewSegments[2]
    ],
    attemptId: "mobile-review-overlay-regression"
  });
  const model = buildLearnerTrainingModePanelModel({
    state: reviewedState,
    map,
    viewport: "mobile"
  });

  assert.deepEqual(model.phase6Controls, [...LEARNER_TRAINING_PHASE6_CONTROL_LABELS]);
  assert.deepEqual(model.mobile.hiddenPrimaryActionIds, []);
  assert.equal(model.mobile.controlsAvoidMapOverlay, true);
  assert.equal(model.mobile.minimumTouchTargetPx >= 44, true);
  assert.equal(model.mobile.layoutShiftGuard, true);
  assert.equal(model.overlay.visible, true);
  assert.match(model.overlay.ariaLabel, /planned route, learner route, checkpoints, and review faults/i);
  assert.ok(model.overlay.route.points.length >= 4);
  assert.ok((model.overlay.attemptedRoute?.points.length ?? 0) >= 4);
  assert.ok(model.overlay.faultMarkers.some((marker) => marker.kind === "wrong-turn"));
  assert.equal(model.overlay.hintMarkers.length, 1);
  assert.ok(model.overlay.segmentFeedback.some((item) => item.routeSegmentId === "wrong-turn-bf"));
  assert.ok(model.overlay.segmentFeedback.every((item) => item.points.length === 2));
  assert.equal(model.accessibility.focusTargetId, "learner-training-feedback");
  assert.match(model.accessibility.liveRegion.message, /learner attempt review ready/i);
});

test("training overlay render key is stable until training overlay inputs change", () => {
  const state = generatedState("training-ui-render-key");
  const firstModel = buildLearnerTrainingModePanelModel({
    state,
    map: marloweDistrictMap,
    viewport: "desktop"
  });
  const repeatedModel = buildLearnerTrainingModePanelModel({
    state,
    map: marloweDistrictMap,
    viewport: "desktop"
  });
  const hintedModel = buildLearnerTrainingModePanelModel({
    state: requestLearnerTrainingHint({ state }),
    map: marloweDistrictMap,
    viewport: "desktop"
  });

  assert.equal(firstModel.performance.overlayRenderKey, repeatedModel.performance.overlayRenderKey);
  assert.notEqual(firstModel.performance.overlayRenderKey, hintedModel.performance.overlayRenderKey);
  assert.equal(firstModel.phase6Controls.join("|"), repeatedModel.phase6Controls.join("|"));
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
  assert.equal(model.accessibility.focusTargetId, "learner-training-feedback");
  assert.match(model.accessibility.liveRegion.message, /learner attempt review ready/i);
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
  assert.equal(model.accessibility.liveRegion.politeness, "assertive");
  assert.equal(model.accessibility.focusTargetId, "generate-exercise");
  assert.equal(model.performance.shouldRenderTrainingOverlay, false);
});
