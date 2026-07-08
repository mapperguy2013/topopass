import {
  buildMapGraph,
  findShortestLegalRoute,
  findShortestLegalRouteThroughStops,
  type MapDefinition,
  type MapGraph,
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
  id:
    | "pan"
    | "set-start"
    | "draw-route"
    | "add-checkpoint"
    | "set-destination"
    | "undo"
    | "remove-last-checkpoint"
    | "clear-route"
    | "clear-checkpoints"
    | "reset-view"
    | "validate-route"
    | "compare-shortest-route"
    | "export-json";
  label: string;
  primary?: boolean;
  disabled?: boolean;
};

export type TrainingRouteAuthorStep = {
  index: number;
  label: string;
  complete: boolean;
  current: boolean;
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
  viewBox: string;
  authoredRoutePoints: Vec2[];
  shortestRoutePoints: Vec2[];
  markers: TrainingRouteAuthorMapMarker[];
  showShortestRouteComparison: boolean;
  validationIssueSegmentIds: string[];
};

export type TrainingRouteAuthorExportReadiness = {
  ready: boolean;
  suggestedFilename: string;
  checklist: Array<{
    label: string;
    complete: boolean;
  }>;
};

export type TrainingRouteAuthorModel = {
  path: typeof DEV_TRAINING_ROUTE_AUTHOR_PATH;
  title: "Curated Training Route Author";
  devOnlyNotice: string;
  sourceMapId: string;
  sourceMapName: string;
  sourceExerciseId: string;
  toolbarActions: TrainingRouteAuthorToolbarAction[];
  authoringSteps: TrainingRouteAuthorStep[];
  routeStatusItems: TrainingRouteAuthorStatusItem[];
  mapModel: TrainingRouteAuthorMapModel;
  exportReadiness: TrainingRouteAuthorExportReadiness;
  metadataFields: TrainingRouteAuthorField[];
  validation: LearnerRouteValidationResult;
  complexitySummary: CuratedTrainingRouteComplexitySummary;
  shortestRouteComparison: CuratedShortestRouteComparison;
  exportData: CuratedTrainingRouteExport;
  exportJson: string;
  approvalWarning: TrainingRouteAuthorApprovalWarning | null;
  authoringWorkflow: string[];
};

const DEFAULT_ROUTE_EXERCISE =
  realLondonOsmPilotRouteExercises.find((exercise) => exercise.stops.length >= 2) ??
  realLondonOsmPilotRouteExercises[0];

function stopNodeId(stop: RouteStop, map: MapDefinition): string | null {
  if (stop.type === "node") {
    return stop.nodeId;
  }

  const landmark = map.landmarks.find((candidate) => candidate.id === stop.landmarkId);

  return landmark?.nearestNodeId ?? null;
}

function stopLabel(stop: RouteStop, fallback: string): string {
  return stop.label?.trim() || fallback;
}

function pointForNode(map: MapDefinition, nodeId: string | null): Vec2 | undefined {
  const node = nodeId ? map.nodes.find((candidate) => candidate.id === nodeId) : null;

  return node ? { x: node.x, y: node.y } : undefined;
}

function pointsForNodeIds(map: MapDefinition, nodeIds: readonly string[]): Vec2[] {
  return nodeIds.map((nodeId) => pointForNode(map, nodeId)).filter((point): point is Vec2 => Boolean(point));
}

function curatedStop(input: {
  map: MapDefinition;
  stop: RouteStop;
  fallbackLabel: string;
}): CuratedTrainingRouteStop {
  const nodeId = stopNodeId(input.stop, input.map) ?? "unknown-node";

  return {
    nodeId,
    label: stopLabel(input.stop, input.fallbackLabel),
    point: pointForNode(input.map, nodeId)
  };
}

function selectedStopNodeIds(exercise: RouteExercise, map: MapDefinition): string[] {
  return exercise.stops.map((stop) => stopNodeId(stop, map)).filter((nodeId): nodeId is string => Boolean(nodeId));
}

function calculateViewBox(points: readonly Vec2[]): string {
  if (points.length === 0) {
    return "0 0 1000 700";
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = Math.max(120, maxX - minX);
  const height = Math.max(120, maxY - minY);
  const padding = Math.max(width, height) * 0.18;

  return `${Math.round(minX - padding)} ${Math.round(minY - padding)} ${Math.round(width + padding * 2)} ${Math.round(height + padding * 2)}`;
}

function validationSegmentsFromRoute(input: {
  graph: MapGraph;
  edgeIds: readonly string[];
}): LearnerRouteValidationSegment[] {
  return input.edgeIds
    .map((edgeId) => input.graph.edgesById[edgeId])
    .filter((edge): edge is NonNullable<typeof edge> => Boolean(edge))
    .map((edge) => ({
      id: edge.id,
      roadId: edge.roadId,
      fromNodeId: edge.fromNodeId,
      toNodeId: edge.toNodeId
    }));
}

function routeValidationMetrics(input: {
  map: MapDefinition;
  graph: MapGraph;
  edgeIds: readonly string[];
  difficulty: Exclude<ExerciseDifficulty, "easy">;
}): LearnerRouteValidationResult {
  return validateLearnerRoute({
    map: input.map,
    routeSegments: validationSegmentsFromRoute({
      graph: input.graph,
      edgeIds: input.edgeIds
    }),
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
      "This draft follows the selected exercise stops. Add a specific instructor note if the route is intentionally longer than the shortest legal option.",
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

function approvalWarning(input: {
  status: CuratedTrainingRouteStatus;
  validation: LearnerRouteValidationResult;
}): TrainingRouteAuthorApprovalWarning | null {
  if (input.status !== "approved") {
    return null;
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

  const shortestValidation = routeValidationMetrics({
    map: input.map,
    graph: input.graph,
    edgeIds: input.shortestRoute.edgeIds,
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
}): CuratedShortestRouteComparison {
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
}): Vec2[] {
  const directRoute = directShortestResult({
    graph: input.graph,
    stopNodeIds: input.stopNodeIds,
    restrictions: input.map.restrictions
  });

  return directRoute.found ? pointsForNodeIds(input.map, directRoute.nodeIds) : [];
}

function buildToolbarActions(exportReady: boolean): TrainingRouteAuthorToolbarAction[] {
  return [
    { id: "pan", label: "Pan" },
    { id: "set-start", label: "Set start", primary: true },
    { id: "draw-route", label: "Draw route", primary: true },
    { id: "add-checkpoint", label: "Add checkpoint" },
    { id: "set-destination", label: "Set destination", primary: true },
    { id: "undo", label: "Undo" },
    { id: "remove-last-checkpoint", label: "Remove last checkpoint" },
    { id: "clear-route", label: "Clear route" },
    { id: "clear-checkpoints", label: "Clear checkpoints" },
    { id: "reset-view", label: "Reset view" },
    { id: "validate-route", label: "Validate route", primary: true },
    { id: "compare-shortest-route", label: "Compare shortest route", primary: true },
    { id: "export-json", label: "Export JSON", primary: true, disabled: !exportReady }
  ];
}

function buildAuthoringSteps(input: {
  hasStart: boolean;
  hasRoute: boolean;
  hasDestination: boolean;
  validationStatus: LearnerRouteValidationResult["status"];
  comparisonStatus: CuratedShortestRouteComparisonDetail["comparisonStatus"];
  exportReady: boolean;
}): TrainingRouteAuthorStep[] {
  const steps = [
    {
      index: 1,
      label: "Set start",
      complete: input.hasStart,
      instruction: "Click Set start, then click the map near the intended starting road."
    },
    {
      index: 2,
      label: "Draw route",
      complete: input.hasRoute,
      instruction: "Now draw the learner route in the order the learner should drive."
    },
    {
      index: 3,
      label: "Add checkpoints if needed",
      complete: true,
      instruction: "Add checkpoints in the order learners must visit them."
    },
    {
      index: 4,
      label: "Set destination",
      complete: input.hasDestination,
      instruction: "Set the destination marker at the intended final road segment."
    },
    {
      index: 5,
      label: "Validate",
      complete: input.validationStatus !== "invalid",
      instruction: "Validate before export and fix blocking errors first."
    },
    {
      index: 6,
      label: "Compare shortest route",
      complete: input.comparisonStatus === "available",
      instruction: "Compare with the shortest legal route and justify any major detour."
    },
    {
      index: 7,
      label: "Export",
      complete: input.exportReady,
      instruction: "Export only when route data, metadata, validation, and comparison are ready."
    }
  ];
  const currentIndex = steps.findIndex((step) => !step.complete);

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
  comparison: CuratedShortestRouteComparison;
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
    { label: "Route drawn", complete: input.hasRoute },
    { label: "Required metadata complete", complete: hasRequiredMetadata },
    { label: "Validation has run without blocking errors", complete: input.validation.valid },
    {
      label: "Shortest-route comparison available or safely advisory",
      complete: input.comparison.directComparison.comparisonStatus !== "unknown" || input.validation.valid
    }
  ];

  return {
    ready: checklist.every((item) => item.complete),
    suggestedFilename: `${input.metadata.routeId || "curated-training-route"}.json`,
    checklist
  };
}

function buildRouteStatusItems(input: {
  hasStart: boolean;
  hasDestination: boolean;
  checkpointCount: number;
  hasRoute: boolean;
  validation: LearnerRouteValidationResult;
  complexitySummary: CuratedTrainingRouteComplexitySummary;
  comparison: CuratedShortestRouteComparison;
  exportReady: boolean;
}): TrainingRouteAuthorStatusItem[] {
  return [
    { label: "Start", value: input.hasStart ? "selected" : "missing", state: input.hasStart ? "complete" : "missing" },
    {
      label: "Destination",
      value: input.hasDestination ? "selected" : "missing",
      state: input.hasDestination ? "complete" : "missing"
    },
    {
      label: "Checkpoints",
      value: `${input.checkpointCount}`,
      state: input.checkpointCount > 0 ? "complete" : "ready"
    },
    { label: "Route", value: input.hasRoute ? "drawn" : "missing", state: input.hasRoute ? "complete" : "missing" },
    {
      label: "Approx length",
      value: `${input.complexitySummary.approximateRouteLengthMeters} m`,
      state: input.hasRoute ? "complete" : "missing"
    },
    { label: "Segments", value: `${input.complexitySummary.segmentCount}`, state: input.hasRoute ? "complete" : "missing" },
    { label: "Turns", value: `${input.complexitySummary.turnCount}`, state: input.hasRoute ? "complete" : "missing" },
    {
      label: "Decision points",
      value: `${input.complexitySummary.decisionPointCount}`,
      state: input.hasRoute ? "complete" : "missing"
    },
    {
      label: "Validation",
      value: input.validation.status,
      state: input.validation.valid ? "complete" : input.validation.status === "warning" ? "warning" : "missing"
    },
    {
      label: "Shortest comparison",
      value: input.comparison.directComparison.comparisonStatus,
      state: input.comparison.directComparison.comparisonStatus === "available" ? "complete" : "warning"
    },
    { label: "Export", value: input.exportReady ? "ready" : "blocked", state: input.exportReady ? "ready" : "missing" }
  ];
}

export function buildTrainingRouteAuthorModel(input?: {
  exercise?: RouteExercise;
  statusOverride?: CuratedTrainingRouteStatus;
  authoredRouteSegmentIds?: readonly string[];
  routeChoiceJustification?: string;
  difficultyOverride?: Exclude<ExerciseDifficulty, "easy">;
}): TrainingRouteAuthorModel {
  const sourceExercise = input?.exercise ?? DEFAULT_ROUTE_EXERCISE;

  if (!sourceExercise) {
    throw new Error("Training Route Author requires at least one Real London route exercise.");
  }

  const sourceMap = realLondonOsmPilotRouteMap;
  const graph = buildMapGraph(sourceMap);
  const stopNodeIds = selectedStopNodeIds(sourceExercise, sourceMap);
  const checkpointShortestRoute = findShortestLegalRouteThroughStops({
    graph,
    stopNodeIds,
    restrictions: sourceMap.restrictions
  });
  const candidateRouteSegmentIds = input?.authoredRouteSegmentIds ?? (checkpointShortestRoute.found ? checkpointShortestRoute.edgeIds : []);
  const routeSegments = candidateRouteSegmentIds.length > 0
    ? validationSegmentsFromRoute({
        graph,
        edgeIds: candidateRouteSegmentIds
      })
    : [];
  const baseMetadata = metadataForExercise(sourceExercise);
  const metadata: CuratedTrainingRouteMetadata = {
    ...baseMetadata,
    difficulty: input?.difficultyOverride ?? baseMetadata.difficulty,
    routeChoiceJustification: input?.routeChoiceJustification ?? baseMetadata.routeChoiceJustification,
    status: input?.statusOverride ?? baseMetadata.status
  };
  const validation = validateLearnerRoute({
    map: sourceMap,
    routeSegments,
    difficulty: metadata.difficulty
  });
  const estimatedDifficulty = inferDifficultyFromMetrics(validation, metadata.difficulty);
  const shortestRouteComparison = buildShortestRouteComparison({
    map: sourceMap,
    graph,
    stopNodeIds,
    authoredValidation: validation,
    authoredRouteIsValid: validation.valid && routeSegments.length > 0,
    difficulty: metadata.difficulty,
    routeChoiceJustification: metadata.routeChoiceJustification
  });
  const complexitySummary: CuratedTrainingRouteComplexitySummary = {
    approximateRouteLengthMeters: Math.round(validation.metrics.routeDistanceMeters),
    segmentCount: validation.metrics.segmentCount,
    turnCount: validation.metrics.turnCount,
    decisionPointCount: validation.metrics.junctionDecisionCount,
    checkpointCount: Math.max(0, sourceExercise.stops.length - 2),
    estimatedDifficulty,
    warnings: complexityWarnings({
      validation,
      selectedDifficulty: metadata.difficulty,
      estimatedDifficulty
    })
  };
  const nodeIds = routeSegments.length > 0
    ? [routeSegments[0].fromNodeId, ...routeSegments.map((segment) => segment.toNodeId)]
    : stopNodeIds;
  const routeGeometry = nodeIds
    .map((nodeId) => pointForNode(sourceMap, nodeId))
    .filter((point): point is Vec2 => Boolean(point));
  const checkpoints = sourceExercise.stops.slice(1, -1).map((stop, index) =>
    curatedStop({
      map: sourceMap,
      stop,
      fallbackLabel: `Checkpoint ${index + 1}`
    })
  );
  const hasStart = Boolean(sourceExercise.stops[0] && stopNodeId(sourceExercise.stops[0], sourceMap));
  const hasDestination = Boolean(
    sourceExercise.stops[sourceExercise.stops.length - 1] &&
      stopNodeId(sourceExercise.stops[sourceExercise.stops.length - 1], sourceMap)
  );
  const hasRoute = routeSegments.length > 0;
  const exportReadiness = buildExportReadiness({
    metadata,
    hasStart,
    hasDestination,
    hasRoute,
    validation,
    comparison: shortestRouteComparison
  });
  const markerPoints = [
    curatedStop({ map: sourceMap, stop: sourceExercise.stops[0], fallbackLabel: "START" }),
    ...checkpoints,
    curatedStop({
      map: sourceMap,
      stop: sourceExercise.stops[sourceExercise.stops.length - 1],
      fallbackLabel: "DESTINATION"
    })
  ];
  const markers: TrainingRouteAuthorMapMarker[] = markerPoints.flatMap((stop, index): TrainingRouteAuthorMapMarker[] => {
    if (!stop.point) {
      return [];
    }

    if (index === 0) {
      return [{ id: "start", label: "START", kind: "start", point: stop.point }];
    }

    if (index === markerPoints.length - 1) {
      return [{ id: "destination", label: "DESTINATION", kind: "destination", point: stop.point }];
    }

    return [{ id: `checkpoint-${index}`, label: `${index}`, kind: "checkpoint", point: stop.point }];
  });
  const shortestPoints = shortestRoutePoints({
    map: sourceMap,
    graph,
    stopNodeIds
  });
  const allMapPoints = [...routeGeometry, ...shortestPoints, ...markers.map((marker) => marker.point)];
  const mapModel: TrainingRouteAuthorMapModel = {
    viewBox: calculateViewBox(allMapPoints),
    authoredRoutePoints: routeGeometry,
    shortestRoutePoints: shortestPoints,
    markers,
    showShortestRouteComparison: true,
    validationIssueSegmentIds: validation.affectedRouteSegmentIds
  };
  const routeStatusItems = buildRouteStatusItems({
    hasStart,
    hasDestination,
    checkpointCount: checkpoints.length,
    hasRoute,
    validation,
    complexitySummary,
    comparison: shortestRouteComparison,
    exportReady: exportReadiness.ready
  });
  const authoringSteps = buildAuthoringSteps({
    hasStart,
    hasRoute,
    hasDestination,
    validationStatus: validation.status,
    comparisonStatus: shortestRouteComparison.directComparison.comparisonStatus,
    exportReady: exportReadiness.ready
  });
  const exportData: CuratedTrainingRouteExport = {
    schemaVersion: 1,
    metadata,
    mapId: sourceMap.id,
    mapVersion: sourceMap.mapVersion ?? sourceMap.version,
    sourceRouteExerciseId: sourceExercise.id,
    sourceRouteExerciseVersion: sourceExercise.exerciseVersion,
    start: curatedStop({ map: sourceMap, stop: sourceExercise.stops[0], fallbackLabel: "Start" }),
    destination: curatedStop({
      map: sourceMap,
      stop: sourceExercise.stops[sourceExercise.stops.length - 1],
      fallbackLabel: "Destination"
    }),
    checkpoints,
    routeSegmentIds: routeSegments.map((segment) => segment.id),
    roadIds: [...new Set(routeSegments.map((segment) => segment.roadId))],
    nodeIds,
    routeGeometry,
    validationSummary: {
      status: validation.status,
      valid: validation.valid,
      blockingErrors: validation.blockingErrors,
      advisoryWarnings: validation.advisoryWarnings,
      affectedRouteSegmentIds: validation.affectedRouteSegmentIds,
      ruleCodes: validation.ruleCodes,
      explanation: validation.explanation
    },
    complexitySummary,
    shortestRouteComparison,
    validationSegments: routeSegments
  };

  return {
    path: DEV_TRAINING_ROUTE_AUTHOR_PATH,
    title: "Curated Training Route Author",
    devOnlyNotice:
      "Dev/admin only. Create, validate, compare, and export curated learner-driver training routes.",
    sourceMapId: sourceMap.id,
    sourceMapName: sourceMap.name,
    sourceExerciseId: sourceExercise.id,
    toolbarActions: buildToolbarActions(exportReadiness.ready),
    authoringSteps,
    routeStatusItems,
    mapModel,
    exportReadiness,
    metadataFields: buildMetadataFields(metadata),
    validation,
    complexitySummary,
    shortestRouteComparison,
    exportData,
    exportJson: `${JSON.stringify(exportData, null, 2)}\n`,
    approvalWarning: approvalWarning({ status: metadata.status, validation }),
    authoringWorkflow: [
      "Open the Real London map and select a scoreable route exercise.",
      "Use the route drawing tools to preview the intended learner path.",
      "Fill in metadata, objectives, hints, scoring emphasis, and instructor notes.",
      "Review validation errors, warnings, affected segments, and complexity metrics.",
      "Export JSON and commit it later under data/training-routes/ during Stage 19."
    ]
  };
}
