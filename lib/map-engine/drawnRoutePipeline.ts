import { buildMapGraph } from "./graph.ts";
import {
  createDrawnRouteTrace,
  simplifyDrawnRouteTrace,
  validateDrawnRouteGesture,
  type DrawnRouteGestureValidation,
  type DrawnRouteTrace
} from "./drawingTrace.ts";
import { runRouteExercise, type RunRouteExerciseResult } from "./exerciseRunner.ts";
import { findShortestLegalRoute } from "./shortestRoute.ts";
import { matchSnappedRouteToSelection, type RouteMatchingResult } from "./routeMatching.ts";
import {
  snapDrawnRouteToRoads,
  type RouteSnappingDiagnostic,
  type SnappedRoutePoint,
  type SnappedRouteTraceResult
} from "./routeSnapping.ts";
import type { DirectedEdge, MapDefinition, MapGraph, MapRoad, RouteExercise, RouteStop } from "./types.ts";

export type DrawnRoutePipelineStatus =
  | "scored"
  | "empty"
  | "insufficient_points"
  | "snapping_failed"
  | "matching_failed"
  | "exercise_failed";

export type DrawnRoutePipelineWarningSource = "pipeline" | "snapping" | "matching" | "exercise";

export type DrawnRoutePipelineWarningSeverity = "info" | "warning" | "error";

export type DrawnRoutePipelineWarning = {
  source: DrawnRoutePipelineWarningSource;
  code: string;
  severity: DrawnRoutePipelineWarningSeverity;
  message: string;
  pointIndex?: number;
  roadId?: string;
  fromRoadId?: string;
  toRoadId?: string;
};

export type RunDrawnRoutePipelineOptions = {
  simplifyTolerance?: number;
  minimumPointCount?: number;
  minimumGesturePointCount?: number;
  minimumGestureDistance?: number;
  maximumSnapDistance?: number;
  maxCandidatesPerPoint?: number;
  passThresholdPercent?: number;
};

export type RunDrawnRoutePipelineInput = {
  map: MapDefinition;
  exercises: RouteExercise[];
  exerciseId: string;
  drawnTrace: DrawnRouteTrace;
  options?: RunDrawnRoutePipelineOptions;
};

export type DrawnRoutePipelineResult = {
  status: DrawnRoutePipelineStatus;
  simplifiedTrace: DrawnRouteTrace;
  snappedRoute: SnappedRouteTraceResult | null;
  snappedPoints: SnappedRoutePoint[];
  matchResult: RouteMatchingResult | null;
  exerciseResult: RunRouteExerciseResult | null;
  warnings: DrawnRoutePipelineWarning[];
};

const DEFAULT_SIMPLIFY_TOLERANCE = 4;
const DEFAULT_MINIMUM_POINT_COUNT = 2;
const DEFAULT_MAXIMUM_SNAP_DISTANCE = 24;

type SnappingAndMatchingAttempt = {
  trace: DrawnRouteTrace;
  snappedRoute: SnappedRouteTraceResult;
  snappingWarnings: DrawnRoutePipelineWarning[];
  matchResult: RouteMatchingResult | null;
  matchingWarnings: DrawnRoutePipelineWarning[];
};

type SparseOsmRecoveryAnchor = {
  nodeId: string;
  pointIndex: number;
  originalPoint: { x: number; y: number };
};

function pipelineWarning(warning: DrawnRoutePipelineWarning): DrawnRoutePipelineWarning {
  return warning;
}

function warningFromSnappingDiagnostic(diagnostic: RouteSnappingDiagnostic): DrawnRoutePipelineWarning {
  return pipelineWarning({
    source: "snapping",
    code: diagnostic.code,
    severity: diagnostic.code === "trace_too_short" ? "info" : "warning",
    message: diagnostic.message,
    pointIndex: diagnostic.pointIndex,
    fromRoadId: diagnostic.fromRoadId,
    toRoadId: diagnostic.toRoadId
  });
}

function warningFromMatchingDiagnostic(diagnostic: RouteMatchingResult["diagnostics"][number]): DrawnRoutePipelineWarning {
  return pipelineWarning({
    source: "matching",
    code: diagnostic.code,
    severity: diagnostic.severity,
    message: diagnostic.message,
    pointIndex: diagnostic.pointIndex,
    roadId: diagnostic.roadId,
    fromRoadId: diagnostic.fromRoadId,
    toRoadId: diagnostic.toRoadId
  });
}

function resolveStopNodeId(map: MapDefinition, graph: MapGraph, stop: RouteStop): string | null {
  if (stop.type === "node") {
    return graph.nodesById[stop.nodeId] ? stop.nodeId : null;
  }

  const landmark = map.landmarks.find((candidate) => candidate.id === stop.landmarkId);
  const nearestNodeId = landmark?.nearestNodeId;

  return nearestNodeId && graph.nodesById[nearestNodeId] ? nearestNodeId : null;
}

function requiredStopNodeIdsForExercise(input: {
  map: MapDefinition;
  exercises: RouteExercise[];
  exerciseId: string;
  graph: MapGraph;
}): string[] {
  const exercise = input.exercises.find((candidate) => candidate.id === input.exerciseId);

  if (!exercise) {
    return [];
  }

  return exercise.stops
    .map((stop) => resolveStopNodeId(input.map, input.graph, stop))
    .filter((nodeId): nodeId is string => Boolean(nodeId));
}

function roadHasOsmSourceMetadata(road: MapRoad): boolean {
  const metadata = (road as MapRoad & { metadata?: { source?: string } }).metadata;

  return metadata?.source === "osm";
}

function isConvertedOsmMap(map: MapDefinition): boolean {
  return map.roads.some(roadHasOsmSourceMetadata);
}

function pointDistance(left: { x: number; y: number }, right: { x: number; y: number }): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function pathMapDistance(graph: MapGraph, nodeIds: readonly string[]): number {
  let distance = 0;

  for (let index = 0; index < nodeIds.length - 1; index += 1) {
    const from = graph.nodesById[nodeIds[index]];
    const to = graph.nodesById[nodeIds[index + 1]];

    if (!from || !to) {
      return Number.POSITIVE_INFINITY;
    }

    distance += pointDistance(from, to);
  }

  return distance;
}

function pointIsNearNode(input: {
  graph: MapGraph;
  point: { x: number; y: number } | undefined;
  nodeId: string;
  tolerance: number;
}): boolean {
  const node = input.graph.nodesById[input.nodeId];

  return Boolean(node && input.point && pointDistance(input.point, node) <= input.tolerance);
}

function directedEdgeForMovement(
  graph: MapGraph,
  roadId: string,
  fromNodeId: string,
  toNodeId: string
): DirectedEdge | undefined {
  return graph.edges.find(
    (edge) => edge.roadId === roadId && edge.fromNodeId === fromNodeId && edge.toNodeId === toNodeId
  );
}

function routeConfidenceForSnappedPoints(snappedPoints: readonly SnappedRoutePoint[]): {
  average: number;
  minimum: number;
  label: RouteMatchingResult["confidence"];
} {
  const confidences = snappedPoints
    .map((point) => point.confidence)
    .filter((confidence) => Number.isFinite(confidence));

  if (confidences.length === 0) {
    return {
      average: 0,
      minimum: 0,
      label: "failed"
    };
  }

  const average = Math.round((confidences.reduce((sum, confidence) => sum + confidence, 0) / confidences.length) * 1000) / 1000;
  const minimum = Math.round(Math.min(...confidences) * 1000) / 1000;

  if (minimum < 0.5 || average < 0.65) {
    return { average, minimum, label: "low" };
  }

  if (minimum < 0.75 || average < 0.85) {
    return { average, minimum, label: "medium" };
  }

  return { average, minimum, label: "high" };
}

function rebuildMatchResultWithSelection(input: {
  matchResult: RouteMatchingResult;
  graph: MapGraph;
  nodeIds: string[];
  roadIds: string[];
}): RouteMatchingResult {
  const attemptedMovements = input.roadIds.map((roadId, index) => {
    const fromNodeId = input.nodeIds[index];
    const toNodeId = input.nodeIds[index + 1];
    const directedEdge = directedEdgeForMovement(input.graph, roadId, fromNodeId, toNodeId);

    return {
      roadId,
      fromNodeId,
      toNodeId,
      directedEdgeId: directedEdge?.id ?? null
    };
  });
  const directedEdgeSequence = attemptedMovements.map((movement) => movement.directedEdgeId);
  const directedEdgeIds = directedEdgeSequence.filter((edgeId): edgeId is string => Boolean(edgeId));
  const routeDistanceMeters = input.roadIds.reduce(
    (total, roadId) => total + (input.graph.roadsById[roadId]?.distanceMeters ?? 0),
    0
  );

  return {
    ...input.matchResult,
    routeDistanceMeters,
    orderedRoadIds: [...input.roadIds],
    transitionNodeIds: input.nodeIds.slice(1, -1),
    nodeIds: [...input.nodeIds],
    directedEdgeIds,
    directedEdgeSequence,
    attemptedMovements,
    selection: {
      nodeIds: [...input.nodeIds],
      roadIds: [...input.roadIds]
    }
  };
}

function buildRecoveredMatchResultWithSelection(input: {
  graph: MapGraph;
  snappedRoute: SnappedRouteTraceResult;
  nodeIds: string[];
  roadIds: string[];
  diagnostics: RouteMatchingResult["diagnostics"];
}): RouteMatchingResult {
  const confidence = routeConfidenceForSnappedPoints(input.snappedRoute.snappedPoints);
  const attemptedMovements = input.roadIds.map((roadId, index) => {
    const fromNodeId = input.nodeIds[index];
    const toNodeId = input.nodeIds[index + 1];
    const directedEdge = directedEdgeForMovement(input.graph, roadId, fromNodeId, toNodeId);

    return {
      roadId,
      fromNodeId,
      toNodeId,
      directedEdgeId: directedEdge?.id ?? null
    };
  });
  const directedEdgeSequence = attemptedMovements.map((movement) => movement.directedEdgeId);
  const directedEdgeIds = directedEdgeSequence.filter((edgeId): edgeId is string => Boolean(edgeId));
  const routeDistanceMeters = input.roadIds.reduce(
    (total, roadId) => total + (input.graph.roadsById[roadId]?.distanceMeters ?? 0),
    0
  );

  return {
    status: "matched",
    isReadyForRunRouteExercise: true,
    confidence: confidence.label,
    averageSnappedPointConfidence: confidence.average,
    minimumSnappedPointConfidence: confidence.minimum,
    routeDistanceMeters,
    orderedRoadIds: [...input.roadIds],
    transitionNodeIds: input.nodeIds.slice(1, -1),
    nodeIds: [...input.nodeIds],
    directedEdgeIds,
    directedEdgeSequence,
    attemptedMovements,
    selection: {
      nodeIds: [...input.nodeIds],
      roadIds: [...input.roadIds]
    },
    diagnostics: [...input.diagnostics]
  };
}

function prependLegalConnector(input: {
  map: MapDefinition;
  graph: MapGraph;
  matchResult: RouteMatchingResult;
  fromNodeId: string;
  diagnostics: RouteMatchingResult["diagnostics"];
}): RouteMatchingResult {
  const currentStartNodeId = input.matchResult.nodeIds[0];

  if (!currentStartNodeId || currentStartNodeId === input.fromNodeId) {
    return input.matchResult;
  }

  const connector = findShortestLegalRoute({
    graph: input.graph,
    startNodeId: input.fromNodeId,
    endNodeId: currentStartNodeId,
    restrictions: input.map.restrictions
  });

  if (!connector.found || connector.roadIds.length === 0) {
    return input.matchResult;
  }

  input.diagnostics.push({
    code: "start_anchor_repaired",
    severity: "info",
    message: `Matched route was anchored back to required start node ${input.fromNodeId}.`
  });

  return rebuildMatchResultWithSelection({
    matchResult: input.matchResult,
    graph: input.graph,
    nodeIds: [...connector.nodeIds.slice(0, -1), ...input.matchResult.nodeIds],
    roadIds: [...connector.roadIds, ...input.matchResult.orderedRoadIds]
  });
}

function appendLegalConnector(input: {
  map: MapDefinition;
  graph: MapGraph;
  matchResult: RouteMatchingResult;
  toNodeId: string;
  diagnostics: RouteMatchingResult["diagnostics"];
}): RouteMatchingResult {
  const currentDestinationNodeId = input.matchResult.nodeIds.at(-1);

  if (!currentDestinationNodeId || currentDestinationNodeId === input.toNodeId) {
    return input.matchResult;
  }

  const connector = findShortestLegalRoute({
    graph: input.graph,
    startNodeId: currentDestinationNodeId,
    endNodeId: input.toNodeId,
    restrictions: input.map.restrictions
  });

  if (!connector.found || connector.roadIds.length === 0) {
    return input.matchResult;
  }

  input.diagnostics.push({
    code: "destination_anchor_repaired",
    severity: "info",
    message: `Matched route was anchored forward to required destination node ${input.toNodeId}.`
  });

  return rebuildMatchResultWithSelection({
    matchResult: input.matchResult,
    graph: input.graph,
    nodeIds: [...input.matchResult.nodeIds, ...connector.nodeIds.slice(1)],
    roadIds: [...input.matchResult.orderedRoadIds, ...connector.roadIds]
  });
}

function repairRequiredEndpointAnchors(input: {
  map: MapDefinition;
  graph: MapGraph;
  rawTrace: DrawnRouteTrace;
  matchResult: RouteMatchingResult;
  requiredStopNodeIds: readonly string[];
  endpointTolerance: number;
}): RouteMatchingResult {
  if (input.matchResult.status !== "matched" || input.requiredStopNodeIds.length < 2) {
    return input.matchResult;
  }

  let matchResult = input.matchResult;
  const diagnostics = [...matchResult.diagnostics];
  const requiredStartNodeId = input.requiredStopNodeIds[0];
  const requiredDestinationNodeId = input.requiredStopNodeIds[input.requiredStopNodeIds.length - 1];

  if (
    matchResult.nodeIds[0] !== requiredStartNodeId &&
    pointIsNearNode({
      graph: input.graph,
      point: input.rawTrace.points[0],
      nodeId: requiredStartNodeId,
      tolerance: input.endpointTolerance
    })
  ) {
    matchResult = prependLegalConnector({
      map: input.map,
      graph: input.graph,
      matchResult,
      fromNodeId: requiredStartNodeId,
      diagnostics
    });
  }

  if (
    matchResult.nodeIds.at(-1) !== requiredDestinationNodeId &&
    pointIsNearNode({
      graph: input.graph,
      point: input.rawTrace.points.at(-1),
      nodeId: requiredDestinationNodeId,
      tolerance: input.endpointTolerance
    })
  ) {
    matchResult = appendLegalConnector({
      map: input.map,
      graph: input.graph,
      matchResult,
      toNodeId: requiredDestinationNodeId,
      diagnostics
    });
  }

  return {
    ...matchResult,
    diagnostics
  };
}

function nearestRoadEndpointAnchor(input: {
  graph: MapGraph;
  point: SnappedRoutePoint;
  pointIndex: number;
}): SparseOsmRecoveryAnchor | null {
  if (!input.point.roadId) {
    return null;
  }

  const road = input.graph.roadsById[input.point.roadId];
  const from = road ? input.graph.nodesById[road.fromNodeId] : undefined;
  const to = road ? input.graph.nodesById[road.toNodeId] : undefined;

  if (!road || !from || !to) {
    return null;
  }

  const distanceToFrom = pointDistance(input.point.originalPoint, from);
  const distanceToTo = pointDistance(input.point.originalPoint, to);

  return {
    nodeId: distanceToFrom <= distanceToTo ? road.fromNodeId : road.toNodeId,
    pointIndex: input.pointIndex,
    originalPoint: { ...input.point.originalPoint }
  };
}

function sparseOsmRecoveryAnchors(input: {
  graph: MapGraph;
  snappedRoute: SnappedRouteTraceResult;
}): SparseOsmRecoveryAnchor[] {
  const anchors: SparseOsmRecoveryAnchor[] = [];

  input.snappedRoute.snappedPoints.forEach((point, pointIndex) => {
    const anchor = nearestRoadEndpointAnchor({
      graph: input.graph,
      point,
      pointIndex
    });

    if (!anchor || anchors[anchors.length - 1]?.nodeId === anchor.nodeId) {
      return;
    }

    anchors.push(anchor);
  });

  return anchors;
}

function recoverSparseConvertedOsmMatch(input: {
  map: MapDefinition;
  graph: MapGraph;
  snappedRoute: SnappedRouteTraceResult;
  maximumSnapDistance: number;
}): RouteMatchingResult | null {
  if (!input.snappedRoute.isValidTrace || input.snappedRoute.hasOffRoadPoints) {
    return null;
  }

  const anchors = sparseOsmRecoveryAnchors({
    graph: input.graph,
    snappedRoute: input.snappedRoute
  });

  if (anchors.length < 2) {
    return null;
  }

  const firstBreak = input.snappedRoute.connectivity.disconnectedTransitions[0];
  const recoveredNodeIds: string[] = [anchors[0].nodeId];
  const recoveredRoadIds: string[] = [];

  for (let index = 0; index < anchors.length - 1; index += 1) {
    const fromAnchor = anchors[index];
    const toAnchor = anchors[index + 1];

    if (fromAnchor.nodeId === toAnchor.nodeId) {
      continue;
    }

    const connector = findShortestLegalRoute({
      graph: input.graph,
      startNodeId: fromAnchor.nodeId,
      endNodeId: toAnchor.nodeId,
      restrictions: input.map.restrictions
    });

    if (!connector.found) {
      return null;
    }

    const drawnSegmentDistance = pointDistance(fromAnchor.originalPoint, toAnchor.originalPoint);
    const connectorMapDistance = pathMapDistance(input.graph, connector.nodeIds);
    const maximumConnectorDistance = drawnSegmentDistance * 2 + input.maximumSnapDistance * 2;

    if (connectorMapDistance > maximumConnectorDistance) {
      return null;
    }

    recoveredNodeIds.push(...connector.nodeIds.slice(1));
    recoveredRoadIds.push(...connector.roadIds);
  }

  if (recoveredRoadIds.length === 0) {
    return null;
  }

  return buildRecoveredMatchResultWithSelection({
    graph: input.graph,
    snappedRoute: input.snappedRoute,
    nodeIds: recoveredNodeIds,
    roadIds: recoveredRoadIds,
    diagnostics: [
      {
        code: "osm_sparse_connector_retry",
        severity: "info",
        message: firstBreak
          ? `Converted OSM route matching filled legal split-way connectors after selected candidates broke between ${firstBreak.fromRoadId} and ${firstBreak.toRoadId}.`
          : "Converted OSM route matching filled legal split-way connectors between sparse drawn anchors.",
        pointIndex: firstBreak?.pointIndex,
        fromRoadId: firstBreak?.fromRoadId,
        toRoadId: firstBreak?.toRoadId
      }
    ]
  });
}

function snapAndMatchTrace(input: {
  map: MapDefinition;
  trace: DrawnRouteTrace;
  minimumPointCount: number;
  maximumSnapDistance: number;
  maxCandidatesPerPoint?: number;
}): SnappingAndMatchingAttempt {
  const snappedRoute = snapDrawnRouteToRoads({
    map: input.map,
    points: input.trace.points,
    snapTolerance: input.maximumSnapDistance,
    maxCandidatesPerPoint: input.maxCandidatesPerPoint
  });
  const snappingWarnings = snappedRoute.diagnostics.map(warningFromSnappingDiagnostic);

  if (!snappedRoute.isValidTrace || snappedRoute.hasOffRoadPoints) {
    return {
      trace: input.trace,
      snappedRoute,
      snappingWarnings,
      matchResult: null,
      matchingWarnings: []
    };
  }

  const matchResult = matchSnappedRouteToSelection({
    map: input.map,
    snappedRoute,
    options: {
      minimumSnappedPoints: input.minimumPointCount
    }
  });

  return {
    trace: input.trace,
    snappedRoute,
    snappingWarnings,
    matchResult,
    matchingWarnings: matchResult.diagnostics.map(warningFromMatchingDiagnostic)
  };
}

function result(input: {
  status: DrawnRoutePipelineStatus;
  simplifiedTrace: DrawnRouteTrace;
  snappedRoute?: SnappedRouteTraceResult | null;
  matchResult?: RouteMatchingResult | null;
  exerciseResult?: RunRouteExerciseResult | null;
  warnings?: DrawnRoutePipelineWarning[];
}): DrawnRoutePipelineResult {
  return {
    status: input.status,
    simplifiedTrace: createDrawnRouteTrace(input.simplifiedTrace.points),
    snappedRoute: input.snappedRoute ?? null,
    snappedPoints: input.snappedRoute?.snappedPoints.map((point) => ({
      ...point,
      originalPoint: { ...point.originalPoint },
      snappedPoint: { ...point.snappedPoint },
      candidates: point.candidates.map((candidate) => ({
        ...candidate,
        snappedPoint: { ...candidate.snappedPoint }
      }))
    })) ?? [],
    matchResult: input.matchResult ?? null,
    exerciseResult: input.exerciseResult ?? null,
    warnings: input.warnings ?? []
  };
}

export function createInsufficientDrawnGesturePipelineResult(input: {
  drawnTrace: DrawnRouteTrace;
  validation: DrawnRouteGestureValidation;
}): DrawnRoutePipelineResult {
  const code =
    input.validation.failureReason === "not_enough_movement" ? "insufficient_movement" : "insufficient_raw_points";
  const message =
    input.validation.failureReason === "not_enough_movement"
      ? `Tap ignored: not enough movement. Draw at least ${input.validation.minimumTotalDistance} map units before scoring.`
      : `Draw at least ${input.validation.minimumRawPointCount} route points before scoring.`;

  return result({
    status: "insufficient_points",
    simplifiedTrace: createDrawnRouteTrace(input.drawnTrace.points),
    warnings: [
      pipelineWarning({
        source: "pipeline",
        code,
        severity: "info",
        message
      })
    ]
  });
}

export function runDrawnRoutePipeline(input: RunDrawnRoutePipelineInput): DrawnRoutePipelineResult {
  const minimumPointCount = input.options?.minimumPointCount ?? DEFAULT_MINIMUM_POINT_COUNT;
  const rawTrace = createDrawnRouteTrace(input.drawnTrace.points);

  if (rawTrace.points.length === 0) {
    return result({
      status: "empty",
      simplifiedTrace: rawTrace,
      warnings: [
        pipelineWarning({
          source: "pipeline",
          code: "empty_trace",
          severity: "info",
          message: "Draw a route before running the route pipeline."
        })
      ]
    });
  }

  const gestureValidation = validateDrawnRouteGesture(rawTrace, {
    minimumRawPointCount: input.options?.minimumGesturePointCount,
    minimumTotalDistance: input.options?.minimumGestureDistance
  });

  if (!gestureValidation.isMeaningful) {
    return createInsufficientDrawnGesturePipelineResult({
      drawnTrace: rawTrace,
      validation: gestureValidation
    });
  }

  if (rawTrace.points.length < minimumPointCount) {
    return result({
      status: "insufficient_points",
      simplifiedTrace: rawTrace,
      warnings: [
        pipelineWarning({
          source: "pipeline",
          code: "insufficient_points",
          severity: "info",
          message: `Draw at least ${minimumPointCount} points before running the route pipeline.`
        })
      ]
    });
  }

  const simplifiedTrace = simplifyDrawnRouteTrace(
    rawTrace,
    input.options?.simplifyTolerance ?? DEFAULT_SIMPLIFY_TOLERANCE
  );

  if (simplifiedTrace.points.length < minimumPointCount) {
    return result({
      status: "insufficient_points",
      simplifiedTrace,
      warnings: [
        pipelineWarning({
          source: "pipeline",
          code: "insufficient_points_after_simplification",
          severity: "info",
          message: `Route simplification left fewer than ${minimumPointCount} points to process.`
        })
      ]
    });
  }

  const maximumSnapDistance = input.options?.maximumSnapDistance ?? DEFAULT_MAXIMUM_SNAP_DISTANCE;
  const graph = buildMapGraph(input.map);
  const requiredStopNodeIds = requiredStopNodeIdsForExercise({
    map: input.map,
    exercises: input.exercises,
    exerciseId: input.exerciseId,
    graph
  });
  let attempt = snapAndMatchTrace({
    map: input.map,
    trace: simplifiedTrace,
    minimumPointCount,
    maximumSnapDistance,
    maxCandidatesPerPoint: input.options?.maxCandidatesPerPoint
  });

  if (
    isConvertedOsmMap(input.map) &&
    simplifiedTrace.points.length < rawTrace.points.length &&
    attempt.snappedRoute.isValidTrace &&
    !attempt.snappedRoute.hasOffRoadPoints &&
    (!attempt.matchResult || attempt.matchResult.status !== "matched" || !attempt.matchResult.isReadyForRunRouteExercise)
  ) {
    const rawAttempt = snapAndMatchTrace({
      map: input.map,
      trace: rawTrace,
      minimumPointCount,
      maximumSnapDistance,
      maxCandidatesPerPoint: input.options?.maxCandidatesPerPoint
    });

    if (rawAttempt.matchResult?.status === "matched" && rawAttempt.matchResult.isReadyForRunRouteExercise) {
      rawAttempt.matchResult = {
        ...rawAttempt.matchResult,
        diagnostics: [
          ...rawAttempt.matchResult.diagnostics,
          {
            code: "osm_simplification_retry",
            severity: "info",
            message:
              "Converted OSM route matching retried without simplification because simplified split-way points disconnected the route."
          }
        ]
      };
      rawAttempt.matchingWarnings = rawAttempt.matchResult.diagnostics.map(warningFromMatchingDiagnostic);
      attempt = rawAttempt;
    }
  }

  const { snappedRoute } = attempt;
  let { matchResult } = attempt;
  const snappingWarnings = attempt.snappingWarnings;
  let matchingWarnings = attempt.matchingWarnings;

  if (!snappedRoute.isValidTrace || snappedRoute.hasOffRoadPoints) {
    return result({
      status: snappedRoute.isValidTrace ? "snapping_failed" : "insufficient_points",
      simplifiedTrace: attempt.trace,
      snappedRoute,
      warnings:
        snappingWarnings.length > 0
          ? snappingWarnings
          : [
              pipelineWarning({
                source: "snapping",
                code: "snapping_failed",
                severity: "warning",
                message: "The drawn route could not be snapped to map roads."
              })
            ]
    });
  }

  if (matchResult) {
    matchResult = repairRequiredEndpointAnchors({
      map: input.map,
      graph,
      rawTrace,
      matchResult,
      requiredStopNodeIds,
      endpointTolerance: maximumSnapDistance
    });
    matchingWarnings = matchResult.diagnostics.map(warningFromMatchingDiagnostic);
  }

  if (
    isConvertedOsmMap(input.map) &&
    (!matchResult || matchResult.status !== "matched" || !matchResult.isReadyForRunRouteExercise)
  ) {
    const recoveredMatchResult = recoverSparseConvertedOsmMatch({
      map: input.map,
      graph,
      snappedRoute,
      maximumSnapDistance
    });

    if (recoveredMatchResult) {
      matchResult = repairRequiredEndpointAnchors({
        map: input.map,
        graph,
        rawTrace,
        matchResult: recoveredMatchResult,
        requiredStopNodeIds,
        endpointTolerance: maximumSnapDistance
      });
      matchingWarnings = matchResult.diagnostics.map(warningFromMatchingDiagnostic);
    }
  }

  if (!matchResult || matchResult.status !== "matched" || !matchResult.isReadyForRunRouteExercise) {
    return result({
      status: "matching_failed",
      simplifiedTrace: attempt.trace,
      snappedRoute,
      matchResult,
      warnings: [...snappingWarnings, ...matchingWarnings]
    });
  }

  try {
    const exerciseResult = runRouteExercise({
      map: input.map,
      exercises: input.exercises,
      exerciseId: input.exerciseId,
      userRoute: matchResult.selection,
      passThresholdPercent: input.options?.passThresholdPercent
    });

    return result({
      status: "scored",
      simplifiedTrace: attempt.trace,
      snappedRoute,
      matchResult,
      exerciseResult,
      warnings: [...snappingWarnings, ...matchingWarnings]
    });
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : "Route exercise scoring failed.";

    return result({
      status: "exercise_failed",
      simplifiedTrace: attempt.trace,
      snappedRoute,
      matchResult,
      warnings: [
        ...snappingWarnings,
        ...matchingWarnings,
        pipelineWarning({
          source: "exercise",
          code: "exercise_failed",
          severity: "error",
          message
        })
      ]
    });
  }
}
