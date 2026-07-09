import {
  appendRouteDraftPoint,
  buildMapGraph,
  buildRoadSpatialIndex,
  createEmptyRouteDraft,
  findCandidateRoadsForPoint,
  findShortestLegalRoute,
  findShortestLegalRouteThroughStops,
  finishRouteStroke,
  matchSnappedRouteToSelection,
  routeDraftToDrawnRouteTrace,
  snapDrawnRouteToRoads,
  startRouteStroke,
  undoLastRouteStroke,
  validateDrawnRouteGesture,
  type DrawnRouteDraft,
  type MapDefinition,
  type MapGraph,
  type MapNode,
  type RouteExercise,
  type RouteStop,
  type ShortestLegalRouteResult,
  type ShortestLegalRouteThroughStopsResult,
  type Vec2
} from "../../../lib/map-engine/index.ts";
import {
  EXERCISE_TYPES,
  type ExerciseDifficulty
} from "../../../lib/training/learnerDriverTraining.ts";
import {
  type CuratedTrainingRouteComplexitySummary,
  type CuratedTrainingRouteExport,
  type CuratedTrainingRouteMetadata,
  type CuratedShortestRouteComparison,
  type CuratedShortestRouteComparisonDetail,
  type CuratedTrainingRouteStatus,
  type CuratedTrainingRouteStop
} from "../../../lib/training/curatedTrainingRoutes.ts";
import {
  validateLearnerRoute,
  type LearnerRouteValidationResult,
  type LearnerRouteValidationSegment
} from "../../../lib/training/learnerRouteValidation.ts";
import {
  getRealLondonPilotExerciseMetadata,
  realLondonOsmPilotRouteExercises,
  realLondonOsmPilotRouteMap
} from "../route-runner/routeRunnerMaps.ts";

export type { CuratedShortestRouteComparisonDetail } from "../../../lib/training/curatedTrainingRoutes.ts";

export const DEV_TRAINING_ROUTE_AUTHOR_PATH = "/dev/training-route";
export const TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH = 1120;
export const TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT = 760;
export const TRAINING_ROUTE_AUTHOR_SNAP_TOLERANCE = 24;

export type TrainingRouteAuthorMode =
  | "pan"
  | "set-start"
  | "draw-route"
  | "add-checkpoint"
  | "set-destination";

export type TrainingRouteAuthorMapWheelInput = {
  targetInsideMap: boolean;
  deltaX: number;
  deltaY: number;
};

export type TrainingRouteAuthorPointerIsolationInput = {
  targetInsideMap: boolean;
  activeMode: TrainingRouteAuthorMode;
};

export type TrainingRouteAuthorToolbarActionId =
  | TrainingRouteAuthorMode
  | "undo"
  | "remove-last-checkpoint"
  | "clear-route"
  | "clear-checkpoints"
  | "reset-view"
  | "validate-route"
  | "compare-shortest-route"
  | "export-json";

export type TrainingRouteAuthorField = {
  id: keyof CuratedTrainingRouteMetadata;
  label: string;
  input: "text" | "textarea" | "select";
  value: string;
  options?: readonly string[];
};

export type TrainingRouteAuthorApprovalWarning = {
  blocking: boolean;
  message: string;
};

export type TrainingRouteAuthorToolbarAction = {
  id: TrainingRouteAuthorToolbarActionId;
  label: string;
  primary?: boolean;
  disabled?: boolean;
  pressed?: boolean;
};

export type TrainingRouteAuthorStep = {
  index: number;
  label: string;
  complete: boolean;
  current: boolean;
  optional?: boolean;
  instruction: string;
};

export type TrainingRouteAuthorStatusItem = {
  label: string;
  value: string;
  state: "complete" | "missing" | "warning" | "ready";
};

export type TrainingRouteAuthorMapMarker = {
  id: string;
  label: string;
  kind: "start" | "destination" | "checkpoint";
  point: Vec2;
};

export type TrainingRouteAuthorMapModel = {
  authoredRoutePoints: Vec2[];
  matchedRoutePoints: Vec2[];
  snappedRoutePoints: Vec2[];
  shortestRoutePoints: Vec2[];
  markers: TrainingRouteAuthorMapMarker[];
  showShortestRouteComparison: boolean;
  validationIssueSegmentIds: string[];
  markerRadiusPixels: number;
};

export type TrainingRouteAuthorExportReadiness = {
  ready: boolean;
  suggestedFilename: string;
  checklist: Array<{
    label: string;
    complete: boolean;
  }>;
};

export type TrainingRouteAuthorRouteMatchStatus =
  | "empty"
  | "insufficient"
  | "matched"
  | "snapping-failed"
  | "matching-failed";

export type TrainingRouteAuthorState = {
  activeMode: TrainingRouteAuthorMode;
  metadata: CuratedTrainingRouteMetadata;
  startNodeId: string | null;
  destinationNodeId: string | null;
  checkpointNodeIds: string[];
  routeDraft: DrawnRouteDraft;
  routeMatchStatus: TrainingRouteAuthorRouteMatchStatus;
  routeMatchMessage: string;
  routeNodeIds: string[];
  roadIds: string[];
  validationSegments: LearnerRouteValidationSegment[];
  snappedRoutePoints: Vec2[];
  validationHasRun: boolean;
  comparisonHasRun: boolean;
  sampleLoaded: boolean;
};

export type TrainingRouteAuthorModel = {
  path: typeof DEV_TRAINING_ROUTE_AUTHOR_PATH;
  title: "Curated Training Route Author";
  devOnlyNotice: string;
  sourceMapId: string;
  sourceMapName: string;
  sourceExerciseId: string;
  sampleLoaded: boolean;
  activeMode: TrainingRouteAuthorMode;
  toolbarActions: TrainingRouteAuthorToolbarAction[];
  authoringSteps: TrainingRouteAuthorStep[];
  routeStatusItems: TrainingRouteAuthorStatusItem[];
  mapModel: TrainingRouteAuthorMapModel;
  exportReadiness: TrainingRouteAuthorExportReadiness;
  metadataFields: TrainingRouteAuthorField[];
  validationRunStatus: "not-run" | LearnerRouteValidationResult["status"];
  comparisonRunStatus: "not-run" | CuratedShortestRouteComparisonDetail["comparisonStatus"];
  validation: LearnerRouteValidationResult;
  complexitySummary: CuratedTrainingRouteComplexitySummary;
  shortestRouteComparison: CuratedShortestRouteComparison;
  exportData: CuratedTrainingRouteExport;
  exportJson: string;
  approvalWarning: TrainingRouteAuthorApprovalWarning | null;
  authoringWorkflow: string[];
  routeMatchStatus: TrainingRouteAuthorRouteMatchStatus;
  routeMatchMessage: string;
};

const DEFAULT_ROUTE_EXERCISE =
  realLondonOsmPilotRouteExercises.find((exercise) => exercise.stops.length >= 2) ??
  realLondonOsmPilotRouteExercises[0];

const EMPTY_VALIDATION = validateLearnerRoute({
  map: realLondonOsmPilotRouteMap,
  routeSegments: [],
  difficulty: "beginner"
});

const ARRAY_METADATA_FIELDS = new Set<keyof CuratedTrainingRouteMetadata>([
  "skillsPractised",
  "expectedLearnerMistakes",
  "hintSequence",
  "scoringEmphasis"
]);

function hasUsableScrollDelta(delta: number): boolean {
  return Number.isFinite(delta) && delta !== 0;
}

export function shouldIsolateTrainingRouteAuthorMapWheel(input: TrainingRouteAuthorMapWheelInput): boolean {
  return input.targetInsideMap && (hasUsableScrollDelta(input.deltaX) || hasUsableScrollDelta(input.deltaY));
}

export function dominantTrainingRouteAuthorWheelDelta(input: Pick<TrainingRouteAuthorMapWheelInput, "deltaX" | "deltaY">): number {
  if (!hasUsableScrollDelta(input.deltaX) && !hasUsableScrollDelta(input.deltaY)) {
    return 0;
  }

  return Math.abs(input.deltaY) >= Math.abs(input.deltaX) ? input.deltaY : input.deltaX;
}

export function shouldIsolateTrainingRouteAuthorPointer(input: TrainingRouteAuthorPointerIsolationInput): boolean {
  return input.targetInsideMap;
}

function stopNodeId(stop: RouteStop, map: MapDefinition): string | null {
  if (stop.type === "node") {
    return stop.nodeId;
  }

  const landmark = map.landmarks.find((candidate) => candidate.id === stop.landmarkId);

  return landmark?.nearestNodeId ?? null;
}

function pointForNode(map: MapDefinition, nodeId: string | null): Vec2 | undefined {
  const node = nodeId ? map.nodes.find((candidate) => candidate.id === nodeId) : null;

  return node ? { x: node.x, y: node.y } : undefined;
}

function nodeLabel(map: MapDefinition, nodeId: string, fallback: string): string {
  const node = map.nodes.find((candidate) => candidate.id === nodeId);

  return node?.label?.trim() || fallback;
}

function selectedStopNodeIds(exercise: RouteExercise, map: MapDefinition): string[] {
  return exercise.stops.map((stop) => stopNodeId(stop, map)).filter((nodeId): nodeId is string => Boolean(nodeId));
}

function pointsForNodeIds(map: MapDefinition, nodeIds: readonly string[]): Vec2[] {
  return nodeIds.map((nodeId) => pointForNode(map, nodeId)).filter((point): point is Vec2 => Boolean(point));
}

function curatedStopForNode(input: {
  map: MapDefinition;
  nodeId: string | null;
  fallbackLabel: string;
}): CuratedTrainingRouteStop {
  const nodeId = input.nodeId ?? "unselected";

  return {
    nodeId,
    label: input.nodeId ? nodeLabel(input.map, input.nodeId, input.fallbackLabel) : input.fallbackLabel,
    point: pointForNode(input.map, input.nodeId)
  };
}

function metadataForNewRoute(): CuratedTrainingRouteMetadata {
  return {
    routeId: "curated-training-route-draft",
    title: "Untitled curated training route",
    area: "Real London",
    difficulty: "beginner",
    exerciseType: "follow-planned-route",
    description: "Curated learner-driver route authored from the Real London map.",
    objective: "Complete the authored route legally while following the selected checkpoints.",
    skillsPractised: ["route planning", "legal route choice", "junction observation"],
    expectedLearnerMistakes: ["wrong turn", "missed checkpoint", "unnecessary detour"],
    hintSequence: [
      "Check the next junction before committing.",
      "Confirm whether the next road is legal for your direction."
    ],
    scoringEmphasis: ["legal route validity", "checkpoint order", "route efficiency"],
    instructorFeedbackNotes:
      "Explain the first major legal or planning issue, then give one concrete recovery suggestion.",
    routeChoiceJustification: "",
    status: "draft"
  };
}

function metadataForExercise(exercise: RouteExercise): CuratedTrainingRouteMetadata {
  const metadata = getRealLondonPilotExerciseMetadata(exercise);
  const routeType = metadata?.routeType ?? "direct";

  return {
    routeId: `curated-${exercise.id}`,
    title: `${exercise.title} curated training route`,
    area: "Real London beta fixture",
    difficulty: metadata?.difficulty === "hard" ? "advanced" : metadata?.difficulty === "easy" ? "beginner" : "intermediate",
    exerciseType: routeType === "checkpoint" || routeType === "multi-stop"
      ? "follow-planned-route"
      : "choose-legal-route",
    description: exercise.description ?? "Curated learner-driver route prepared from existing Real London map data.",
    objective: "Complete the route legally while preserving checkpoint order and practical learner-driver decision making.",
    skillsPractised: ["route planning", "legal route choice", "junction observation"],
    expectedLearnerMistakes: ["wrong turn", "missed checkpoint", "unnecessary detour"],
    hintSequence: [
      "Check the next junction before committing.",
      "Confirm whether the next road is legal for your direction.",
      "Use the planned checkpoint order to recover if you miss a turn."
    ],
    scoringEmphasis: ["legal route validity", "checkpoint order", "route efficiency"],
    instructorFeedbackNotes:
      "Explain the first major legal or planning issue, then give one concrete recovery suggestion.",
    routeChoiceJustification:
      "This sample follows the selected exercise stops. Replace this note if the authored route is intentionally longer than the shortest legal option.",
    status: "beta"
  };
}

function buildMetadataFields(metadata: CuratedTrainingRouteMetadata): TrainingRouteAuthorField[] {
  return [
    { id: "routeId", label: "Route id", input: "text", value: metadata.routeId },
    { id: "title", label: "Title", input: "text", value: metadata.title },
    { id: "area", label: "Area", input: "text", value: metadata.area },
    {
      id: "difficulty",
      label: "Difficulty",
      input: "select",
      value: metadata.difficulty,
      options: ["beginner", "intermediate", "advanced"]
    },
    {
      id: "exerciseType",
      label: "Exercise type",
      input: "select",
      value: metadata.exerciseType,
      options: EXERCISE_TYPES
    },
    { id: "description", label: "Description", input: "textarea", value: metadata.description },
    { id: "objective", label: "Objective", input: "textarea", value: metadata.objective },
    { id: "skillsPractised", label: "Skills practised", input: "textarea", value: metadata.skillsPractised.join("\n") },
    {
      id: "expectedLearnerMistakes",
      label: "Expected learner mistakes",
      input: "textarea",
      value: metadata.expectedLearnerMistakes.join("\n")
    },
    { id: "hintSequence", label: "Hint sequence", input: "textarea", value: metadata.hintSequence.join("\n") },
    {
      id: "scoringEmphasis",
      label: "Scoring emphasis",
      input: "textarea",
      value: metadata.scoringEmphasis.join("\n")
    },
    {
      id: "instructorFeedbackNotes",
      label: "Instructor feedback notes",
      input: "textarea",
      value: metadata.instructorFeedbackNotes
    },
    {
      id: "routeChoiceJustification",
      label: "Route choice justification",
      input: "textarea",
      value: metadata.routeChoiceJustification
    },
    {
      id: "status",
      label: "Approved/beta status",
      input: "select",
      value: metadata.status,
      options: ["draft", "beta", "approved"]
    }
  ];
}

function validationSegmentsFromRoadsAndNodes(input: {
  graph: MapGraph;
  roadIds: readonly string[];
  nodeIds: readonly string[];
}): LearnerRouteValidationSegment[] {
  return input.roadIds.flatMap((roadId, index): LearnerRouteValidationSegment[] => {
    const fromNodeId = input.nodeIds[index];
    const toNodeId = input.nodeIds[index + 1];
    const road = input.graph.roadsById[roadId];

    if (!fromNodeId || !toNodeId || !road) {
      return [];
    }

    const edge = input.graph.edges.find(
      (candidate) =>
        candidate.roadId === roadId &&
        candidate.fromNodeId === fromNodeId &&
        candidate.toNodeId === toNodeId
    );

    return [
      {
        id: edge?.id ?? `${roadId}:${fromNodeId}->${toNodeId}`,
        roadId,
        fromNodeId,
        toNodeId
      }
    ];
  });
}

function validationMetrics(input: {
  map: MapDefinition;
  routeSegments: readonly LearnerRouteValidationSegment[];
  difficulty: Exclude<ExerciseDifficulty, "easy">;
}): LearnerRouteValidationResult {
  return validateLearnerRoute({
    map: input.map,
    routeSegments: input.routeSegments,
    difficulty: input.difficulty
  });
}

function inferDifficultyFromMetrics(
  validation: LearnerRouteValidationResult,
  selectedDifficulty: ExerciseDifficulty
): ExerciseDifficulty {
  if (validation.metrics.segmentCount > 14 || validation.metrics.junctionDecisionCount > 9) {
    return "advanced";
  }

  if (validation.metrics.segmentCount > 8 || validation.metrics.turnCount > 5) {
    return "intermediate";
  }

  return selectedDifficulty === "advanced" ? "intermediate" : selectedDifficulty;
}

function complexityWarnings(input: {
  validation: LearnerRouteValidationResult;
  selectedDifficulty: Exclude<ExerciseDifficulty, "easy">;
  estimatedDifficulty: ExerciseDifficulty;
}): string[] {
  const warnings = input.validation.advisoryWarnings.map((warning) => warning.explanation);

  if (input.validation.metrics.segmentCount === 0) {
    return [];
  }

  if (input.selectedDifficulty === "advanced" && input.validation.metrics.segmentCount < 6) {
    warnings.push("Advanced curated routes should normally include more than a very short simple segment sequence.");
  }

  if (
    input.selectedDifficulty === "beginner" &&
    (input.validation.metrics.segmentCount > 5 || input.validation.metrics.junctionDecisionCount > 3)
  ) {
    warnings.push("Beginner curated routes should avoid excessive segment and decision-point complexity.");
  }

  if (input.estimatedDifficulty !== input.selectedDifficulty) {
    warnings.push(`Route metrics currently estimate ${input.estimatedDifficulty} difficulty.`);
  }

  return [...new Set(warnings)];
}

function approvalWarning(input: {
  status: CuratedTrainingRouteStatus;
  validation: LearnerRouteValidationResult;
  validationHasRun: boolean;
}): TrainingRouteAuthorApprovalWarning | null {
  if (input.status !== "approved") {
    return null;
  }

  if (!input.validationHasRun) {
    return {
      blocking: true,
      message: "Approved routes must be validated before export."
    };
  }

  if (!input.validation.valid) {
    return {
      blocking: true,
      message: "Invalid routes cannot be marked approved. Fix blocking validation errors or keep this route in draft/beta."
    };
  }

  if (input.validation.status === "warning") {
    return {
      blocking: false,
      message: "This route can be approved only after an instructor reviews advisory warnings."
    };
  }

  return null;
}

function unknownComparison(explanation: string): CuratedShortestRouteComparisonDetail {
  return {
    comparisonStatus: "unknown",
    verdict: "unknown",
    explanation,
    authoredLengthMeters: null,
    shortestLengthMeters: null,
    lengthDeltaMeters: null,
    percentageLonger: null,
    authoredSegmentCount: null,
    shortestSegmentCount: null,
    segmentCountDelta: null,
    authoredTurnCount: null,
    shortestTurnCount: null,
    turnCountDelta: null,
    authoredDecisionPointCount: null,
    shortestDecisionPointCount: null,
    decisionPointDelta: null,
    shortestRouteSegmentIds: []
  };
}

function notApplicableComparison(explanation: string): CuratedShortestRouteComparisonDetail {
  return {
    ...unknownComparison(explanation),
    comparisonStatus: "not-applicable"
  };
}

export function classifyShortestRouteComparison(input: {
  authoredLengthMeters: number;
  shortestLengthMeters: number;
  authoredSegmentCount: number;
  shortestSegmentCount: number;
  authoredTurnCount: number;
  shortestTurnCount: number;
  authoredDecisionPointCount: number;
  shortestDecisionPointCount: number;
  shortestRouteSegmentIds?: readonly string[];
}): CuratedShortestRouteComparisonDetail {
  if (!Number.isFinite(input.authoredLengthMeters) || !Number.isFinite(input.shortestLengthMeters)) {
    return unknownComparison("Route length data is incomplete, so shortest-route efficiency is advisory only.");
  }

  if (input.shortestLengthMeters <= 0) {
    return unknownComparison("The shortest route length is zero or unavailable, so route efficiency cannot be compared.");
  }

  const lengthDeltaMeters = input.authoredLengthMeters - input.shortestLengthMeters;
  const percentageLonger = (lengthDeltaMeters / input.shortestLengthMeters) * 100;
  const roundedPercentage = Math.round(percentageLonger * 10) / 10;
  let verdict: CuratedShortestRouteComparisonDetail["verdict"] = "shortest-or-near-shortest";

  if (percentageLonger >= 50) {
    verdict = "major-detour-warning";
  } else if (percentageLonger >= 25) {
    verdict = "detour-warning";
  } else if (percentageLonger > 10) {
    verdict = "acceptable-training-variation";
  }

  const verdictText: Record<Exclude<CuratedShortestRouteComparisonDetail["verdict"], "unknown">, string> = {
    "shortest-or-near-shortest": "near-shortest",
    "acceptable-training-variation": "an acceptable training variation",
    "detour-warning": "a detour warning",
    "major-detour-warning": "a major detour warning"
  };

  return {
    comparisonStatus: "available",
    verdict,
    explanation: `The authored route is ${roundedPercentage}% longer than the shortest legal route, which is ${verdictText[verdict]}.`,
    authoredLengthMeters: Math.round(input.authoredLengthMeters),
    shortestLengthMeters: Math.round(input.shortestLengthMeters),
    lengthDeltaMeters: Math.round(lengthDeltaMeters),
    percentageLonger: roundedPercentage,
    authoredSegmentCount: input.authoredSegmentCount,
    shortestSegmentCount: input.shortestSegmentCount,
    segmentCountDelta: input.authoredSegmentCount - input.shortestSegmentCount,
    authoredTurnCount: input.authoredTurnCount,
    shortestTurnCount: input.shortestTurnCount,
    turnCountDelta: input.authoredTurnCount - input.shortestTurnCount,
    authoredDecisionPointCount: input.authoredDecisionPointCount,
    shortestDecisionPointCount: input.shortestDecisionPointCount,
    decisionPointDelta: input.authoredDecisionPointCount - input.shortestDecisionPointCount,
    shortestRouteSegmentIds: [...(input.shortestRouteSegmentIds ?? [])]
  };
}

function directShortestResult(input: {
  graph: MapGraph;
  stopNodeIds: readonly string[];
  restrictions: MapDefinition["restrictions"];
}): ShortestLegalRouteResult {
  const startNodeId = input.stopNodeIds[0];
  const endNodeId = input.stopNodeIds[input.stopNodeIds.length - 1];

  if (!startNodeId || !endNodeId) {
    return {
      found: false,
      startNodeId: startNodeId ?? "unknown-start",
      endNodeId: endNodeId ?? "unknown-destination",
      reason: "INVALID_START_NODE"
    };
  }

  return findShortestLegalRoute({
    graph: input.graph,
    startNodeId,
    endNodeId,
    restrictions: input.restrictions
  });
}

function comparisonFromShortestRoute(input: {
  map: MapDefinition;
  graph: MapGraph;
  authoredValidation: LearnerRouteValidationResult;
  authoredRouteIsValid: boolean;
  difficulty: Exclude<ExerciseDifficulty, "easy">;
  shortestRoute: ShortestLegalRouteResult | ShortestLegalRouteThroughStopsResult;
  missingRouteExplanation: string;
}): CuratedShortestRouteComparisonDetail {
  if (!input.authoredRouteIsValid) {
    return unknownComparison("The authored route is invalid or incomplete, so shortest-route comparison is advisory only.");
  }

  if (!input.shortestRoute.found) {
    return unknownComparison(input.missingRouteExplanation);
  }

  const shortestSegments = validationSegmentsFromRoadsAndNodes({
    graph: input.graph,
    roadIds: input.shortestRoute.roadIds,
    nodeIds: input.shortestRoute.nodeIds
  });
  const shortestValidation = validationMetrics({
    map: input.map,
    routeSegments: shortestSegments,
    difficulty: input.difficulty
  });

  return classifyShortestRouteComparison({
    authoredLengthMeters: input.authoredValidation.metrics.routeDistanceMeters,
    shortestLengthMeters: input.shortestRoute.distanceMeters,
    authoredSegmentCount: input.authoredValidation.metrics.segmentCount,
    shortestSegmentCount: shortestValidation.metrics.segmentCount,
    authoredTurnCount: input.authoredValidation.metrics.turnCount,
    shortestTurnCount: shortestValidation.metrics.turnCount,
    authoredDecisionPointCount: input.authoredValidation.metrics.junctionDecisionCount,
    shortestDecisionPointCount: shortestValidation.metrics.junctionDecisionCount,
    shortestRouteSegmentIds: input.shortestRoute.edgeIds
  });
}

function buildShortestRouteComparison(input: {
  map: MapDefinition;
  graph: MapGraph;
  stopNodeIds: readonly string[];
  authoredValidation: LearnerRouteValidationResult;
  authoredRouteIsValid: boolean;
  difficulty: Exclude<ExerciseDifficulty, "easy">;
  routeChoiceJustification: string;
  comparisonHasRun: boolean;
}): CuratedShortestRouteComparison {
  if (!input.comparisonHasRun) {
    const comparison = unknownComparison("Shortest route comparison has not been run for the current authored route.");

    return {
      directComparison: comparison,
      checkpointConstrainedComparison: notApplicableComparison("Checkpoint-constrained comparison has not been run."),
      routeChoiceJustification: input.routeChoiceJustification,
      requiresRouteChoiceJustification: false,
      guidance: [
        "Select start, draw a route, set destination, then run the shortest-route comparison before export."
      ]
    };
  }

  const directRoute = directShortestResult({
    graph: input.graph,
    stopNodeIds: input.stopNodeIds,
    restrictions: input.map.restrictions
  });
  const checkpointRoute =
    input.stopNodeIds.length > 2
      ? findShortestLegalRouteThroughStops({
          graph: input.graph,
          stopNodeIds: [...input.stopNodeIds],
          restrictions: input.map.restrictions
        })
      : null;
  const directComparison = comparisonFromShortestRoute({
    map: input.map,
    graph: input.graph,
    authoredValidation: input.authoredValidation,
    authoredRouteIsValid: input.authoredRouteIsValid,
    difficulty: input.difficulty,
    shortestRoute: directRoute,
    missingRouteExplanation: "No direct legal shortest route can be proven from the available map graph."
  });
  const checkpointConstrainedComparison = checkpointRoute
    ? comparisonFromShortestRoute({
        map: input.map,
        graph: input.graph,
        authoredValidation: input.authoredValidation,
        authoredRouteIsValid: input.authoredRouteIsValid,
        difficulty: input.difficulty,
        shortestRoute: checkpointRoute,
        missingRouteExplanation: "No checkpoint-constrained legal shortest route can be proven from the available map graph."
      })
    : notApplicableComparison("Checkpoint-constrained comparison is not needed because this route has no intermediate checkpoints.");
  const requiresRouteChoiceJustification =
    directComparison.verdict === "detour-warning" ||
    directComparison.verdict === "major-detour-warning" ||
    checkpointConstrainedComparison.verdict === "detour-warning" ||
    checkpointConstrainedComparison.verdict === "major-detour-warning";

  return {
    directComparison,
    checkpointConstrainedComparison,
    routeChoiceJustification: input.routeChoiceJustification,
    requiresRouteChoiceJustification,
    guidance: [
      "A training route does not need to be shortest if the objective justifies the route choice.",
      "Beginner routes should usually stay close to shortest unless they are teaching checkpoint navigation.",
      "Advanced routes may be longer when they deliberately practise complex junction or recovery decisions.",
      "Major detours should include an instructor route-choice note before beta or approved status."
    ]
  };
}

function shortestRoutePoints(input: {
  map: MapDefinition;
  graph: MapGraph;
  stopNodeIds: readonly string[];
  comparisonHasRun: boolean;
}): Vec2[] {
  if (!input.comparisonHasRun) {
    return [];
  }

  const directRoute = directShortestResult({
    graph: input.graph,
    stopNodeIds: input.stopNodeIds,
    restrictions: input.map.restrictions
  });

  return directRoute.found ? pointsForNodeIds(input.map, directRoute.nodeIds) : [];
}

function invalidateReviewState(state: TrainingRouteAuthorState): TrainingRouteAuthorState {
  return {
    ...state,
    validationHasRun: false,
    comparisonHasRun: false
  };
}

function refreshRouteMatch(state: TrainingRouteAuthorState): TrainingRouteAuthorState {
  const trace = routeDraftToDrawnRouteTrace(state.routeDraft);

  if (trace.points.length === 0) {
    return {
      ...invalidateReviewState(state),
      routeMatchStatus: "empty",
      routeMatchMessage: "No route has been drawn.",
      routeNodeIds: [],
      roadIds: [],
      validationSegments: [],
      snappedRoutePoints: []
    };
  }

  const gestureValidation = validateDrawnRouteGesture(trace, {
    minimumRawPointCount: 3,
    minimumTotalDistance: 10
  });

  if (!gestureValidation.isMeaningful) {
    return {
      ...invalidateReviewState(state),
      routeMatchStatus: "insufficient",
      routeMatchMessage:
        gestureValidation.failureReason === "not_enough_movement"
          ? "The drawn route is too short to snap to roads."
          : "Draw at least three route points before matching.",
      routeNodeIds: [],
      roadIds: [],
      validationSegments: [],
      snappedRoutePoints: []
    };
  }

  const map = realLondonOsmPilotRouteMap;
  const graph = buildMapGraph(map);
  const snappedRoute = snapDrawnRouteToRoads({
    map,
    points: trace.points,
    snapTolerance: TRAINING_ROUTE_AUTHOR_SNAP_TOLERANCE,
    maxCandidatesPerPoint: 5
  });

  if (!snappedRoute.isValidTrace || snappedRoute.hasOffRoadPoints) {
    return {
      ...invalidateReviewState(state),
      routeMatchStatus: "snapping-failed",
      routeMatchMessage: snappedRoute.diagnostics[0]?.message ?? "The drawn route could not be snapped to Real London roads.",
      routeNodeIds: [],
      roadIds: [],
      validationSegments: [],
      snappedRoutePoints: snappedRoute.snappedPoints.map((point) => point.snappedPoint)
    };
  }

  const matchResult = matchSnappedRouteToSelection({
    map,
    snappedRoute,
    options: {
      minimumSnappedPoints: 2
    }
  });

  if (matchResult.status !== "matched" || !matchResult.isReadyForRunRouteExercise) {
    return {
      ...invalidateReviewState(state),
      routeMatchStatus: "matching-failed",
      routeMatchMessage: matchResult.diagnostics[0]?.message ?? "The snapped road sequence is not a connected route.",
      routeNodeIds: matchResult.nodeIds,
      roadIds: matchResult.orderedRoadIds,
      validationSegments: [],
      snappedRoutePoints: snappedRoute.snappedPoints.map((point) => point.snappedPoint)
    };
  }

  return {
    ...invalidateReviewState(state),
    routeMatchStatus: "matched",
    routeMatchMessage: `Matched ${matchResult.orderedRoadIds.length} road segment(s) from the current drawing.`,
    routeNodeIds: matchResult.nodeIds,
    roadIds: matchResult.orderedRoadIds,
    validationSegments: validationSegmentsFromRoadsAndNodes({
      graph,
      roadIds: matchResult.orderedRoadIds,
      nodeIds: matchResult.nodeIds
    }),
    snappedRoutePoints: snappedRoute.snappedPoints.map((point) => point.snappedPoint)
  };
}

export function createEmptyTrainingRouteAuthorState(): TrainingRouteAuthorState {
  return {
    activeMode: "pan",
    metadata: metadataForNewRoute(),
    startNodeId: null,
    destinationNodeId: null,
    checkpointNodeIds: [],
    routeDraft: createEmptyRouteDraft(),
    routeMatchStatus: "empty",
    routeMatchMessage: "No route has been drawn.",
    routeNodeIds: [],
    roadIds: [],
    validationSegments: [],
    snappedRoutePoints: [],
    validationHasRun: false,
    comparisonHasRun: false,
    sampleLoaded: false
  };
}

export function createSampleTrainingRouteAuthorState(): TrainingRouteAuthorState {
  if (!DEFAULT_ROUTE_EXERCISE) {
    return createEmptyTrainingRouteAuthorState();
  }

  const map = realLondonOsmPilotRouteMap;
  const graph = buildMapGraph(map);
  const stopNodeIds = selectedStopNodeIds(DEFAULT_ROUTE_EXERCISE, map);
  const shortestRoute = findShortestLegalRouteThroughStops({
    graph,
    stopNodeIds,
    restrictions: map.restrictions
  });
  const nodeIds = shortestRoute.found ? shortestRoute.nodeIds : stopNodeIds;
  const roadIds = shortestRoute.found ? shortestRoute.roadIds : [];
  const routePoints = pointsForNodeIds(map, nodeIds);
  const state: TrainingRouteAuthorState = {
    ...createEmptyTrainingRouteAuthorState(),
    metadata: metadataForExercise(DEFAULT_ROUTE_EXERCISE),
    startNodeId: stopNodeIds[0] ?? null,
    destinationNodeId: stopNodeIds.at(-1) ?? null,
    checkpointNodeIds: stopNodeIds.slice(1, -1),
    routeDraft: createEmptyRouteDraft(routePoints.length > 0 ? [routePoints] : []),
    routeMatchStatus: roadIds.length > 0 ? "matched" : "empty",
    routeMatchMessage:
      roadIds.length > 0
        ? "Loaded sample route from the Real London pilot exercise. Edit before export."
        : "Sample route could not be matched.",
    routeNodeIds: nodeIds,
    roadIds,
    validationSegments: validationSegmentsFromRoadsAndNodes({ graph, roadIds, nodeIds }),
    snappedRoutePoints: routePoints,
    sampleLoaded: true
  };

  return state;
}

export function getTrainingRouteAuthorMap(): MapDefinition {
  return realLondonOsmPilotRouteMap;
}

export function resolveNearestTrainingRouteAuthorNode(point: Vec2, tolerance = 80): MapNode | null {
  const map = realLondonOsmPilotRouteMap;
  const graph = buildMapGraph(map);
  const candidates = findCandidateRoadsForPoint({
    point,
    index: buildRoadSpatialIndex(map),
    tolerance,
    maxCandidates: 1
  });
  const road = candidates[0] ? graph.roadsById[candidates[0].roadId] : null;

  if (!road) {
    return null;
  }

  const from = graph.nodesById[road.fromNodeId];
  const to = graph.nodesById[road.toNodeId];

  if (!from || !to) {
    return null;
  }

  const fromDistance = Math.hypot(point.x - from.x, point.y - from.y);
  const toDistance = Math.hypot(point.x - to.x, point.y - to.y);

  return fromDistance <= toDistance ? from : to;
}

export function setTrainingRouteAuthorMode(
  state: TrainingRouteAuthorState,
  activeMode: TrainingRouteAuthorMode
): TrainingRouteAuthorState {
  return {
    ...state,
    activeMode,
    routeDraft:
      state.routeDraft.activeStrokeIndex === null ? state.routeDraft : finishRouteStroke(state.routeDraft)
  };
}

export function setTrainingRouteAuthorStart(
  state: TrainingRouteAuthorState,
  nodeId: string
): TrainingRouteAuthorState {
  return {
    ...state,
    startNodeId: nodeId,
    comparisonHasRun: false,
    sampleLoaded: false
  };
}

export function setTrainingRouteAuthorDestination(
  state: TrainingRouteAuthorState,
  nodeId: string
): TrainingRouteAuthorState {
  return {
    ...state,
    destinationNodeId: nodeId,
    comparisonHasRun: false,
    sampleLoaded: false
  };
}

export function addTrainingRouteAuthorCheckpoint(
  state: TrainingRouteAuthorState,
  nodeId: string
): TrainingRouteAuthorState {
  return {
    ...state,
    checkpointNodeIds: [...state.checkpointNodeIds, nodeId],
    comparisonHasRun: false,
    sampleLoaded: false
  };
}

export function removeLastTrainingRouteAuthorCheckpoint(state: TrainingRouteAuthorState): TrainingRouteAuthorState {
  return {
    ...state,
    checkpointNodeIds: state.checkpointNodeIds.slice(0, -1),
    comparisonHasRun: false,
    sampleLoaded: false
  };
}

export function clearTrainingRouteAuthorCheckpoints(state: TrainingRouteAuthorState): TrainingRouteAuthorState {
  return {
    ...state,
    checkpointNodeIds: [],
    comparisonHasRun: false,
    sampleLoaded: false
  };
}

export function startTrainingRouteAuthorStroke(
  state: TrainingRouteAuthorState,
  point: Vec2
): TrainingRouteAuthorState {
  return {
    ...state,
    routeDraft: startRouteStroke(state.routeDraft, point),
    sampleLoaded: false
  };
}

export function appendTrainingRouteAuthorStrokePoint(
  state: TrainingRouteAuthorState,
  point: Vec2
): TrainingRouteAuthorState {
  return {
    ...state,
    routeDraft: appendRouteDraftPoint(state.routeDraft, point, 3),
    sampleLoaded: false
  };
}

export function finishTrainingRouteAuthorStroke(
  state: TrainingRouteAuthorState,
  point?: Vec2
): TrainingRouteAuthorState {
  const draft = finishRouteStroke(point ? appendRouteDraftPoint(state.routeDraft, point, 3) : state.routeDraft);

  return refreshRouteMatch({
    ...state,
    routeDraft: draft,
    sampleLoaded: false
  });
}

export function undoTrainingRouteAuthorAction(state: TrainingRouteAuthorState): TrainingRouteAuthorState {
  if (state.routeDraft.strokes.length > 0) {
    return refreshRouteMatch({
      ...state,
      routeDraft: undoLastRouteStroke(state.routeDraft),
      sampleLoaded: false
    });
  }

  if (state.checkpointNodeIds.length > 0) {
    return removeLastTrainingRouteAuthorCheckpoint(state);
  }

  if (state.destinationNodeId) {
    return {
      ...state,
      destinationNodeId: null,
      comparisonHasRun: false,
      sampleLoaded: false
    };
  }

  return {
    ...state,
    startNodeId: null,
    comparisonHasRun: false,
    sampleLoaded: false
  };
}

export function clearTrainingRouteAuthorRoute(state: TrainingRouteAuthorState): TrainingRouteAuthorState {
  return refreshRouteMatch({
    ...state,
    routeDraft: createEmptyRouteDraft(),
    sampleLoaded: false
  });
}

export function validateTrainingRouteAuthorState(state: TrainingRouteAuthorState): TrainingRouteAuthorState {
  return {
    ...state,
    validationHasRun: Boolean(state.startNodeId && state.destinationNodeId && state.validationSegments.length > 0)
  };
}

export function compareTrainingRouteAuthorShortestRoute(state: TrainingRouteAuthorState): TrainingRouteAuthorState {
  return {
    ...state,
    comparisonHasRun: Boolean(state.startNodeId && state.destinationNodeId && state.validationSegments.length > 0)
  };
}

export function updateTrainingRouteAuthorMetadataField(
  state: TrainingRouteAuthorState,
  fieldId: keyof CuratedTrainingRouteMetadata,
  value: string
): TrainingRouteAuthorState {
  const metadata = { ...state.metadata };

  if (ARRAY_METADATA_FIELDS.has(fieldId)) {
    (metadata[fieldId] as string[]) = value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  } else if (fieldId === "difficulty") {
    metadata.difficulty = value as CuratedTrainingRouteMetadata["difficulty"];
    return {
      ...state,
      metadata,
      validationHasRun: false,
      comparisonHasRun: false
    };
  } else if (fieldId === "exerciseType") {
    metadata.exerciseType = value as CuratedTrainingRouteMetadata["exerciseType"];
  } else if (fieldId === "status") {
    metadata.status = value as CuratedTrainingRouteMetadata["status"];
  } else {
    (metadata[fieldId] as string) = value;
  }

  return {
    ...state,
    metadata
  };
}

function buildToolbarActions(input: {
  activeMode: TrainingRouteAuthorMode;
  canUndo: boolean;
  canRemoveCheckpoint: boolean;
  canClearRoute: boolean;
  canClearCheckpoints: boolean;
  canValidate: boolean;
  canCompare: boolean;
  exportReady: boolean;
}): TrainingRouteAuthorToolbarAction[] {
  return [
    { id: "pan", label: "Pan", pressed: input.activeMode === "pan" },
    { id: "set-start", label: "Set start", primary: true, pressed: input.activeMode === "set-start" },
    { id: "draw-route", label: "Draw route", primary: true, pressed: input.activeMode === "draw-route" },
    { id: "add-checkpoint", label: "Add checkpoint", pressed: input.activeMode === "add-checkpoint" },
    { id: "set-destination", label: "Set destination", primary: true, pressed: input.activeMode === "set-destination" },
    { id: "undo", label: "Undo", disabled: !input.canUndo },
    { id: "remove-last-checkpoint", label: "Remove last checkpoint", disabled: !input.canRemoveCheckpoint },
    { id: "clear-route", label: "Clear route", disabled: !input.canClearRoute },
    { id: "clear-checkpoints", label: "Clear checkpoints", disabled: !input.canClearCheckpoints },
    { id: "reset-view", label: "Reset view" },
    { id: "validate-route", label: "Validate route", primary: true, disabled: !input.canValidate },
    { id: "compare-shortest-route", label: "Compare shortest route", primary: true, disabled: !input.canCompare },
    { id: "export-json", label: "Export JSON", primary: true, disabled: !input.exportReady }
  ];
}

function buildAuthoringSteps(input: {
  hasStart: boolean;
  hasRoute: boolean;
  checkpointCount: number;
  hasDestination: boolean;
  validationHasRun: boolean;
  validationStatus: LearnerRouteValidationResult["status"];
  comparisonHasRun: boolean;
  exportReady: boolean;
}): TrainingRouteAuthorStep[] {
  const steps = [
    {
      index: 1,
      label: "Set start",
      complete: input.hasStart,
      instruction: "Click Set start, then click a valid road/node on the Real London map."
    },
    {
      index: 2,
      label: "Draw route",
      complete: input.hasRoute,
      instruction: "Switch to Draw route and trace the intended learner route on the roads."
    },
    {
      index: 3,
      label: "Add checkpoints if needed",
      complete: false,
      optional: true,
      instruction: `${input.checkpointCount} checkpoint(s) selected. Add checkpoints only when the exercise needs them.`
    },
    {
      index: 4,
      label: "Set destination",
      complete: input.hasDestination,
      instruction: "Click Set destination, then click the final road/node for the route."
    },
    {
      index: 5,
      label: "Validate",
      complete: input.validationHasRun && input.validationStatus !== "invalid",
      instruction: "Validate after start, destination, and a matched drawn route exist."
    },
    {
      index: 6,
      label: "Compare shortest route",
      complete: input.comparisonHasRun,
      instruction: "Compare with the shortest legal route between the selected route points."
    },
    {
      index: 7,
      label: "Export",
      complete: input.exportReady,
      instruction: "Export only when route data, metadata, validation, and comparison are ready."
    }
  ];
  const currentIndex = steps.findIndex((step) => !step.complete && !step.optional);

  return steps.map((step, index) => ({
    ...step,
    current: index === (currentIndex === -1 ? steps.length - 1 : currentIndex)
  }));
}

function buildExportReadiness(input: {
  metadata: CuratedTrainingRouteMetadata;
  hasStart: boolean;
  hasDestination: boolean;
  hasRoute: boolean;
  validation: LearnerRouteValidationResult;
  validationHasRun: boolean;
  comparisonHasRun: boolean;
  approvalWarning: TrainingRouteAuthorApprovalWarning | null;
}): TrainingRouteAuthorExportReadiness {
  const hasRequiredMetadata = Boolean(
    input.metadata.routeId.trim() &&
      input.metadata.title.trim() &&
      input.metadata.area.trim() &&
      input.metadata.objective.trim()
  );
  const checklist = [
    { label: "Start selected", complete: input.hasStart },
    { label: "Destination selected", complete: input.hasDestination },
    { label: "Route drawn and matched", complete: input.hasRoute },
    { label: "Required metadata complete", complete: hasRequiredMetadata },
    { label: "Validation has run without blocking errors", complete: input.validationHasRun && input.validation.valid },
    { label: "Shortest-route comparison has run", complete: input.comparisonHasRun },
    { label: "Approved status is allowed", complete: !input.approvalWarning?.blocking }
  ];

  return {
    ready: checklist.every((item) => item.complete),
    suggestedFilename: `${input.metadata.routeId.trim() || "curated-training-route"}.json`,
    checklist
  };
}

function buildRouteStatusItems(input: {
  hasStart: boolean;
  hasDestination: boolean;
  checkpointCount: number;
  hasRoute: boolean;
  validationHasRun: boolean;
  validation: LearnerRouteValidationResult;
  comparisonHasRun: boolean;
  comparison: CuratedShortestRouteComparison;
  exportReady: boolean;
}): TrainingRouteAuthorStatusItem[] {
  const comparisonValue = input.comparisonHasRun ? input.comparison.directComparison.verdict : "not run";

  return [
    { label: "Start", value: input.hasStart ? "selected" : "missing", state: input.hasStart ? "complete" : "missing" },
    {
      label: "Destination",
      value: input.hasDestination ? "selected" : "missing",
      state: input.hasDestination ? "complete" : "missing"
    },
    {
      label: "Route",
      value: input.hasRoute ? "drawn and matched" : "missing",
      state: input.hasRoute ? "complete" : "missing"
    },
    {
      label: "Checkpoints",
      value: `${input.checkpointCount}`,
      state: input.checkpointCount > 0 ? "complete" : "ready"
    },
    {
      label: "Validation",
      value: input.validationHasRun ? input.validation.status : "not run",
      state: input.validationHasRun
        ? input.validation.valid
          ? "complete"
          : input.validation.status === "warning"
            ? "warning"
            : "missing"
        : "missing"
    },
    {
      label: "Shortest comparison",
      value: comparisonValue,
      state: input.comparisonHasRun
        ? input.comparison.directComparison.verdict.includes("warning")
          ? "warning"
          : "complete"
        : "missing"
    },
    { label: "Export", value: input.exportReady ? "ready" : "not ready", state: input.exportReady ? "ready" : "missing" }
  ];
}

export function buildTrainingRouteAuthorModel(input?: {
  state?: TrainingRouteAuthorState;
  statusOverride?: CuratedTrainingRouteStatus;
  routeChoiceJustification?: string;
  difficultyOverride?: Exclude<ExerciseDifficulty, "easy">;
}): TrainingRouteAuthorModel {
  const sourceMap = realLondonOsmPilotRouteMap;
  const graph = buildMapGraph(sourceMap);
  const baseState = input?.state ?? createEmptyTrainingRouteAuthorState();
  const metadata: CuratedTrainingRouteMetadata = {
    ...baseState.metadata,
    difficulty: input?.difficultyOverride ?? baseState.metadata.difficulty,
    routeChoiceJustification: input?.routeChoiceJustification ?? baseState.metadata.routeChoiceJustification,
    status: input?.statusOverride ?? baseState.metadata.status
  };
  const validation = validationMetrics({
    map: sourceMap,
    routeSegments: baseState.validationSegments,
    difficulty: metadata.difficulty
  });
  const validationForDisplay = baseState.validationHasRun ? validation : EMPTY_VALIDATION;
  const selectedStopNodeIds = [
    baseState.startNodeId,
    ...baseState.checkpointNodeIds,
    baseState.destinationNodeId
  ].filter((nodeId): nodeId is string => Boolean(nodeId));
  const shortestRouteComparison = buildShortestRouteComparison({
    map: sourceMap,
    graph,
    stopNodeIds: selectedStopNodeIds,
    authoredValidation: validation,
    authoredRouteIsValid: validation.valid && baseState.validationSegments.length > 0,
    difficulty: metadata.difficulty,
    routeChoiceJustification: metadata.routeChoiceJustification,
    comparisonHasRun: baseState.comparisonHasRun
  });
  const estimatedDifficulty = inferDifficultyFromMetrics(validation, metadata.difficulty);
  const complexitySummary: CuratedTrainingRouteComplexitySummary = {
    approximateRouteLengthMeters: Math.round(validation.metrics.routeDistanceMeters),
    segmentCount: validation.metrics.segmentCount,
    turnCount: validation.metrics.turnCount,
    decisionPointCount: validation.metrics.junctionDecisionCount,
    checkpointCount: baseState.checkpointNodeIds.length,
    estimatedDifficulty,
    warnings: complexityWarnings({
      validation,
      selectedDifficulty: metadata.difficulty,
      estimatedDifficulty
    })
  };
  const hasStart = Boolean(baseState.startNodeId);
  const hasDestination = Boolean(baseState.destinationNodeId);
  const hasRoute = baseState.validationSegments.length > 0 && baseState.routeMatchStatus === "matched";
  const approval = approvalWarning({
    status: metadata.status,
    validation,
    validationHasRun: baseState.validationHasRun
  });
  const exportReadiness = buildExportReadiness({
    metadata,
    hasStart,
    hasDestination,
    hasRoute,
    validation,
    validationHasRun: baseState.validationHasRun,
    comparisonHasRun: baseState.comparisonHasRun,
    approvalWarning: approval
  });
  const routeGeometry = pointsForNodeIds(sourceMap, baseState.routeNodeIds);
  const rawRoutePoints = routeDraftToDrawnRouteTrace(baseState.routeDraft).points;
  const markers: TrainingRouteAuthorMapMarker[] = [
    ...(baseState.startNodeId
      ? [
          {
            id: "start",
            label: "START",
            kind: "start" as const,
            point: pointForNode(sourceMap, baseState.startNodeId)
          }
        ]
      : []),
    ...baseState.checkpointNodeIds.map((nodeId, index) => ({
      id: `checkpoint-${index + 1}`,
      label: `${index + 1}`,
      kind: "checkpoint" as const,
      point: pointForNode(sourceMap, nodeId)
    })),
    ...(baseState.destinationNodeId
      ? [
          {
            id: "destination",
            label: "DESTINATION",
            kind: "destination" as const,
            point: pointForNode(sourceMap, baseState.destinationNodeId)
          }
        ]
      : [])
  ].filter((marker): marker is TrainingRouteAuthorMapMarker => Boolean(marker.point));
  const shortestPoints = shortestRoutePoints({
    map: sourceMap,
    graph,
    stopNodeIds: selectedStopNodeIds,
    comparisonHasRun: baseState.comparisonHasRun
  });
  const mapModel: TrainingRouteAuthorMapModel = {
    authoredRoutePoints: rawRoutePoints,
    matchedRoutePoints: routeGeometry,
    snappedRoutePoints: baseState.snappedRoutePoints,
    shortestRoutePoints: shortestPoints,
    markers,
    showShortestRouteComparison: baseState.comparisonHasRun,
    validationIssueSegmentIds: baseState.validationHasRun ? validation.affectedRouteSegmentIds : [],
    markerRadiusPixels: 9
  };
  const routeStatusItems = buildRouteStatusItems({
    hasStart,
    hasDestination,
    checkpointCount: baseState.checkpointNodeIds.length,
    hasRoute,
    validationHasRun: baseState.validationHasRun,
    validation: validationForDisplay,
    comparisonHasRun: baseState.comparisonHasRun,
    comparison: shortestRouteComparison,
    exportReady: exportReadiness.ready
  });
  const authoringSteps = buildAuthoringSteps({
    hasStart,
    hasRoute,
    checkpointCount: baseState.checkpointNodeIds.length,
    hasDestination,
    validationHasRun: baseState.validationHasRun,
    validationStatus: validation.status,
    comparisonHasRun: baseState.comparisonHasRun,
    exportReady: exportReadiness.ready
  });
  const checkpoints = baseState.checkpointNodeIds.map((nodeId, index) =>
    curatedStopForNode({
      map: sourceMap,
      nodeId,
      fallbackLabel: `Checkpoint ${index + 1}`
    })
  );
  const exportData: CuratedTrainingRouteExport = {
    schemaVersion: 1,
    metadata,
    mapId: sourceMap.id,
    mapVersion: sourceMap.mapVersion ?? sourceMap.version,
    sourceRouteExerciseId: baseState.sampleLoaded ? DEFAULT_ROUTE_EXERCISE?.id : undefined,
    sourceRouteExerciseVersion: baseState.sampleLoaded ? DEFAULT_ROUTE_EXERCISE?.exerciseVersion : undefined,
    start: curatedStopForNode({ map: sourceMap, nodeId: baseState.startNodeId, fallbackLabel: "Start" }),
    destination: curatedStopForNode({ map: sourceMap, nodeId: baseState.destinationNodeId, fallbackLabel: "Destination" }),
    checkpoints,
    routeSegmentIds: baseState.validationSegments.map((segment) => segment.id),
    roadIds: [...new Set(baseState.validationSegments.map((segment) => segment.roadId))],
    nodeIds: baseState.routeNodeIds,
    routeGeometry,
    validationSummary: {
      status: baseState.validationHasRun ? validation.status : "invalid",
      valid: baseState.validationHasRun ? validation.valid : false,
      blockingErrors: baseState.validationHasRun ? validation.blockingErrors : [],
      advisoryWarnings: baseState.validationHasRun ? validation.advisoryWarnings : [],
      affectedRouteSegmentIds: baseState.validationHasRun ? validation.affectedRouteSegmentIds : [],
      ruleCodes: baseState.validationHasRun ? validation.ruleCodes : [],
      explanation: baseState.validationHasRun
        ? validation.explanation
        : "Validation has not been run for the current authored route."
    },
    complexitySummary,
    shortestRouteComparison,
    validationSegments: baseState.validationSegments
  };

  return {
    path: DEV_TRAINING_ROUTE_AUTHOR_PATH,
    title: "Curated Training Route Author",
    devOnlyNotice:
      "Dev/admin only. Create, validate, compare, and export curated learner-driver training routes from real map interaction.",
    sourceMapId: sourceMap.id,
    sourceMapName: sourceMap.name,
    sourceExerciseId: baseState.sampleLoaded && DEFAULT_ROUTE_EXERCISE ? DEFAULT_ROUTE_EXERCISE.id : "none",
    sampleLoaded: baseState.sampleLoaded,
    activeMode: baseState.activeMode,
    toolbarActions: buildToolbarActions({
      activeMode: baseState.activeMode,
      canUndo: baseState.routeDraft.strokes.length > 0 || baseState.checkpointNodeIds.length > 0 || Boolean(baseState.destinationNodeId) || Boolean(baseState.startNodeId),
      canRemoveCheckpoint: baseState.checkpointNodeIds.length > 0,
      canClearRoute: baseState.routeDraft.strokes.length > 0,
      canClearCheckpoints: baseState.checkpointNodeIds.length > 0,
      canValidate: hasStart && hasDestination && hasRoute,
      canCompare: hasStart && hasDestination && hasRoute,
      exportReady: exportReadiness.ready
    }),
    authoringSteps,
    routeStatusItems,
    mapModel,
    exportReadiness,
    metadataFields: buildMetadataFields(metadata),
    validationRunStatus: baseState.validationHasRun ? validation.status : "not-run",
    comparisonRunStatus: baseState.comparisonHasRun
      ? shortestRouteComparison.directComparison.comparisonStatus
      : "not-run",
    validation: validationForDisplay,
    complexitySummary,
    shortestRouteComparison,
    exportData,
    exportJson: `${JSON.stringify(exportData, null, 2)}\n`,
    approvalWarning: approval,
    routeMatchStatus: baseState.routeMatchStatus,
    routeMatchMessage: baseState.routeMatchMessage,
    authoringWorkflow: [
      "Open the Real London map.",
      "Set a start point by clicking a valid road/node.",
      "Draw the intended learner route on the roads.",
      "Add optional ordered checkpoints.",
      "Set the destination.",
      "Validate, compare with the shortest legal route, then export JSON."
    ]
  };
}
