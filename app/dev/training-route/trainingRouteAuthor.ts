import {
  buildMapGraph,
  findShortestLegalRouteThroughStops,
  type MapDefinition,
  type MapGraph,
  type RouteExercise,
  type RouteStop,
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

export type TrainingRouteAuthorModel = {
  path: typeof DEV_TRAINING_ROUTE_AUTHOR_PATH;
  title: "Curated Training Route Author";
  devOnlyNotice: string;
  sourceMapId: string;
  sourceMapName: string;
  sourceExerciseId: string;
  metadataFields: TrainingRouteAuthorField[];
  validation: LearnerRouteValidationResult;
  complexitySummary: CuratedTrainingRouteComplexitySummary;
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

export function buildTrainingRouteAuthorModel(input?: {
  exercise?: RouteExercise;
  statusOverride?: CuratedTrainingRouteStatus;
}): TrainingRouteAuthorModel {
  const sourceExercise = input?.exercise ?? DEFAULT_ROUTE_EXERCISE;

  if (!sourceExercise) {
    throw new Error("Training Route Author requires at least one Real London route exercise.");
  }

  const sourceMap = realLondonOsmPilotRouteMap;
  const graph = buildMapGraph(sourceMap);
  const stopNodeIds = selectedStopNodeIds(sourceExercise, sourceMap);
  const shortestRoute = findShortestLegalRouteThroughStops({
    graph,
    stopNodeIds,
    restrictions: sourceMap.restrictions
  });
  const routeSegments = shortestRoute.found
    ? validationSegmentsFromRoute({
        graph,
        edgeIds: shortestRoute.edgeIds
      })
    : [];
  const baseMetadata = metadataForExercise(sourceExercise);
  const metadata: CuratedTrainingRouteMetadata = {
    ...baseMetadata,
    status: input?.statusOverride ?? baseMetadata.status
  };
  const validation = validateLearnerRoute({
    map: sourceMap,
    routeSegments,
    difficulty: metadata.difficulty
  });
  const estimatedDifficulty = inferDifficultyFromMetrics(validation, metadata.difficulty);
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
  const nodeIds = shortestRoute.found ? shortestRoute.nodeIds : stopNodeIds;
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
    roadIds: shortestRoute.found ? [...new Set(shortestRoute.roadIds)] : [],
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
    validationSegments: routeSegments
  };

  return {
    path: DEV_TRAINING_ROUTE_AUTHOR_PATH,
    title: "Curated Training Route Author",
    devOnlyNotice:
      "Dev/admin route authoring only. Outputs are drafts for a future curated route library and are not learner-facing defaults.",
    sourceMapId: sourceMap.id,
    sourceMapName: sourceMap.name,
    sourceExerciseId: sourceExercise.id,
    metadataFields: buildMetadataFields(metadata),
    validation,
    complexitySummary,
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
