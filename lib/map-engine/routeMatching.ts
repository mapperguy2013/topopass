import { buildMapGraph } from "./graph.ts";
import type { UserRouteSelectionInput } from "./exerciseRunner.ts";
import type { AttemptedRouteMovement } from "./legalityEngine.ts";
import type { SnappedRoutePoint, SnappedRouteTraceResult } from "./routeSnapping.ts";
import type { DirectedEdge, MapDefinition, MapGraph, MapRoad } from "./types.ts";

export type RouteMatchingStatus = "empty" | "insufficient_points" | "matched" | "unmatched" | "disconnected";

export type RouteMatchingConfidence = "high" | "medium" | "low" | "failed";

export type RouteMatchingFailureReason =
  | "empty_input"
  | "insufficient_points"
  | "unmatched_point"
  | "unknown_road"
  | "disconnected_roads"
  | "invalid_road_sequence";

export type RouteMatchingDiagnosticCode =
  | "empty_input"
  | "insufficient_points"
  | "unmatched_point"
  | "unknown_road"
  | "disconnected_roads"
  | "ambiguous_transition"
  | "unresolved_direction";

export type RouteMatchingDiagnosticSeverity = "info" | "warning";

export type RouteMatchingDiagnostic = {
  code: RouteMatchingDiagnosticCode;
  severity: RouteMatchingDiagnosticSeverity;
  message: string;
  pointIndex?: number;
  roadId?: string;
  fromRoadId?: string;
  toRoadId?: string;
  nodeIds?: string[];
};

export type MatchedRouteMovement = AttemptedRouteMovement & {
  directedEdgeId: string | null;
};

export type RouteMatchingOptions = {
  minimumSnappedPoints?: number;
};

export type MatchSnappedRouteToSelectionInput = {
  map: MapDefinition;
  snappedRoute?: SnappedRouteTraceResult;
  snappedPoints?: readonly SnappedRoutePoint[];
  options?: RouteMatchingOptions;
};

export type RouteMatchingResult = {
  status: RouteMatchingStatus;
  isReadyForRunRouteExercise: boolean;
  confidence: RouteMatchingConfidence;
  failureReason?: RouteMatchingFailureReason;
  averageSnappedPointConfidence: number;
  minimumSnappedPointConfidence: number;
  routeDistanceMeters: number;
  orderedRoadIds: string[];
  transitionNodeIds: string[];
  nodeIds: string[];
  directedEdgeIds: string[];
  directedEdgeSequence: Array<string | null>;
  attemptedMovements: MatchedRouteMovement[];
  selection: UserRouteSelectionInput;
  diagnostics: RouteMatchingDiagnostic[];
};

type RoadRun = {
  roadId: string;
  firstPoint: SnappedRoutePoint;
  lastPoint: SnappedRoutePoint;
  direction: -1 | 0 | 1;
};

const DEFAULT_MINIMUM_SNAPPED_POINTS = 2;
const ROAD_REVERSAL_RATIO_EPSILON = 0.05;

function roundMetric(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function confidenceStats(snappedPoints: readonly SnappedRoutePoint[]): {
  averageSnappedPointConfidence: number;
  minimumSnappedPointConfidence: number;
} {
  const matchedConfidences = snappedPoints
    .filter((point) => point.roadId)
    .map((point) => point.confidence)
    .filter((confidence) => Number.isFinite(confidence));

  if (matchedConfidences.length === 0) {
    return {
      averageSnappedPointConfidence: 0,
      minimumSnappedPointConfidence: 0
    };
  }

  return {
    averageSnappedPointConfidence: roundMetric(
      matchedConfidences.reduce((sum, confidence) => sum + confidence, 0) / matchedConfidences.length
    ),
    minimumSnappedPointConfidence: roundMetric(Math.min(...matchedConfidences))
  };
}

function confidenceForMatchedRoute(input: {
  status: RouteMatchingStatus;
  averageSnappedPointConfidence: number;
  minimumSnappedPointConfidence: number;
}): RouteMatchingConfidence {
  if (input.status !== "matched") {
    return "failed";
  }

  if (input.minimumSnappedPointConfidence < 0.5 || input.averageSnappedPointConfidence < 0.65) {
    return "low";
  }

  if (input.minimumSnappedPointConfidence < 0.75 || input.averageSnappedPointConfidence < 0.85) {
    return "medium";
  }

  return "high";
}

function failureReasonFromDiagnostics(
  status: RouteMatchingStatus,
  diagnostics: readonly RouteMatchingDiagnostic[]
): RouteMatchingFailureReason | undefined {
  if (status === "matched") {
    return undefined;
  }

  const firstWarning = diagnostics.find((issue) => issue.severity === "warning") ?? diagnostics[0];

  if (!firstWarning) {
    return "invalid_road_sequence";
  }

  if (firstWarning.code === "ambiguous_transition" || firstWarning.code === "unresolved_direction") {
    return "invalid_road_sequence";
  }

  return firstWarning.code;
}

function routeDistanceMeters(graph: MapGraph, orderedRoadIds: readonly string[]): number {
  return orderedRoadIds.reduce((sum, roadId) => sum + (graph.roadsById[roadId]?.distanceMeters ?? 0), 0);
}

function emptyResult(
  status: RouteMatchingStatus,
  diagnostics: RouteMatchingDiagnostic[],
  snappedPoints: readonly SnappedRoutePoint[] = []
): RouteMatchingResult {
  const stats = confidenceStats(snappedPoints);

  return {
    status,
    isReadyForRunRouteExercise: false,
    confidence: "failed",
    failureReason: failureReasonFromDiagnostics(status, diagnostics),
    averageSnappedPointConfidence: stats.averageSnappedPointConfidence,
    minimumSnappedPointConfidence: stats.minimumSnappedPointConfidence,
    routeDistanceMeters: 0,
    orderedRoadIds: [],
    transitionNodeIds: [],
    nodeIds: [],
    directedEdgeIds: [],
    directedEdgeSequence: [],
    attemptedMovements: [],
    selection: {
      nodeIds: [],
      roadIds: []
    },
    diagnostics
  };
}

function diagnostic(value: RouteMatchingDiagnostic): RouteMatchingDiagnostic {
  return value;
}

function snappedPointsFromInput(input: MatchSnappedRouteToSelectionInput): readonly SnappedRoutePoint[] {
  return input.snappedPoints ?? input.snappedRoute?.snappedPoints ?? [];
}

function ratioDirection(delta: number): -1 | 0 | 1 {
  if (Math.abs(delta) < ROAD_REVERSAL_RATIO_EPSILON) {
    return 0;
  }

  return delta > 0 ? 1 : -1;
}

function endpointNearestPoint(graph: MapGraph, road: MapRoad, point: SnappedRoutePoint): string {
  const fromNode = graph.nodesById[road.fromNodeId];
  const toNode = graph.nodesById[road.toNodeId];

  if (!fromNode || !toNode) {
    return road.fromNodeId;
  }

  const distanceToFrom = Math.hypot(point.snappedPoint.x - fromNode.x, point.snappedPoint.y - fromNode.y);
  const distanceToTo = Math.hypot(point.snappedPoint.x - toNode.x, point.snappedPoint.y - toNode.y);

  return distanceToFrom <= distanceToTo ? road.fromNodeId : road.toNodeId;
}

function endpointNearestRunBoundary(graph: MapGraph, road: MapRoad, previousRun: RoadRun, nextRun: RoadRun): string {
  return endpointNearestPoint(graph, road, {
    ...previousRun.lastPoint,
    snappedPoint: {
      x: (previousRun.lastPoint.snappedPoint.x + nextRun.firstPoint.snappedPoint.x) / 2,
      y: (previousRun.lastPoint.snappedPoint.y + nextRun.firstPoint.snappedPoint.y) / 2
    }
  });
}

function collapseConsecutiveRoadRuns(graph: MapGraph, snappedPoints: readonly SnappedRoutePoint[]): RoadRun[] {
  const runs: RoadRun[] = [];

  for (const point of snappedPoints) {
    if (!point.roadId) {
      continue;
    }

    const previousRun = runs[runs.length - 1];

    if (previousRun?.roadId === point.roadId) {
      const road = graph.roadsById[point.roadId];

      if (!road) {
        continue;
      }

      const previousRatio = projectionRatioAlongRoad(graph, road, previousRun.lastPoint);
      const nextRatio = projectionRatioAlongRoad(graph, road, point);
      const nextDirection = ratioDirection(nextRatio - previousRatio);

      if (previousRun.direction !== 0 && nextDirection !== 0 && nextDirection !== previousRun.direction) {
        runs.push({
          roadId: point.roadId,
          firstPoint: point,
          lastPoint: point,
          direction: nextDirection
        });
        continue;
      }

      if (previousRun.direction === 0 && nextDirection !== 0) {
        previousRun.direction = nextDirection;
      }

      previousRun.lastPoint = point;
      continue;
    }

    runs.push({
      roadId: point.roadId,
      firstPoint: point,
      lastPoint: point,
      direction: 0
    });
  }

  return runs;
}

function sharedNodeIds(firstRoad: MapRoad, secondRoad: MapRoad): string[] {
  return [firstRoad.fromNodeId, firstRoad.toNodeId]
    .filter((nodeId) => nodeId === secondRoad.fromNodeId || nodeId === secondRoad.toNodeId)
    .sort((a, b) => a.localeCompare(b));
}

function oppositeRoadNodeId(road: MapRoad, nodeId: string): string {
  return road.fromNodeId === nodeId ? road.toNodeId : road.fromNodeId;
}

function roadContainsNode(road: MapRoad, nodeId: string): boolean {
  return road.fromNodeId === nodeId || road.toNodeId === nodeId;
}

function projectionRatioAlongRoad(graph: MapGraph, road: MapRoad, point: SnappedRoutePoint): number {
  const fromNode = graph.nodesById[road.fromNodeId];
  const toNode = graph.nodesById[road.toNodeId];

  if (!fromNode || !toNode) {
    return 0;
  }

  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return 0;
  }

  const ratio = ((point.snappedPoint.x - fromNode.x) * dx + (point.snappedPoint.y - fromNode.y) * dy) / lengthSquared;

  return Math.max(0, Math.min(1, ratio));
}

function inferSingleRoadNodeSequence(graph: MapGraph, run: RoadRun): string[] {
  const road = graph.roadsById[run.roadId];
  const firstRatio = projectionRatioAlongRoad(graph, road, run.firstPoint);
  const lastRatio = projectionRatioAlongRoad(graph, road, run.lastPoint);

  if (lastRatio < firstRatio) {
    return [road.toNodeId, road.fromNodeId];
  }

  return [road.fromNodeId, road.toNodeId];
}

function transitionNodeIdsForRuns(
  graph: MapGraph,
  runs: readonly RoadRun[],
  diagnostics: RouteMatchingDiagnostic[]
): string[] | null {
  const transitionNodeIds: string[] = [];

  for (let index = 0; index < runs.length - 1; index += 1) {
    const fromRoad = graph.roadsById[runs[index].roadId];
    const toRoad = graph.roadsById[runs[index + 1].roadId];
    const sharedNodes =
      fromRoad.id === toRoad.id
        ? [endpointNearestRunBoundary(graph, fromRoad, runs[index], runs[index + 1])]
        : sharedNodeIds(fromRoad, toRoad);

    if (sharedNodes.length === 0) {
      diagnostics.push(
        diagnostic({
          code: "disconnected_roads",
          severity: "warning",
          message: `Road ${fromRoad.id} does not share a node with road ${toRoad.id}.`,
          fromRoadId: fromRoad.id,
          toRoadId: toRoad.id
        })
      );

      return null;
    }

    if (sharedNodes.length > 1) {
      diagnostics.push(
        diagnostic({
          code: "ambiguous_transition",
          severity: "warning",
          message: `Roads ${fromRoad.id} and ${toRoad.id} share multiple nodes; chose ${sharedNodes[0]} deterministically.`,
          fromRoadId: fromRoad.id,
          toRoadId: toRoad.id,
          nodeIds: [...sharedNodes]
        })
      );
    }

    transitionNodeIds.push(sharedNodes[0]);
  }

  return transitionNodeIds;
}

function inferNodeSequenceFromRuns(
  graph: MapGraph,
  runs: readonly RoadRun[],
  transitionNodeIds: readonly string[]
): string[] {
  if (runs.length === 1) {
    return inferSingleRoadNodeSequence(graph, runs[0]);
  }

  const firstRoad = graph.roadsById[runs[0].roadId];
  const lastRoad = graph.roadsById[runs[runs.length - 1].roadId];
  const firstTransitionNodeId = transitionNodeIds[0];
  const finalTransitionNodeId = transitionNodeIds[transitionNodeIds.length - 1];

  return [
    oppositeRoadNodeId(firstRoad, firstTransitionNodeId),
    ...transitionNodeIds,
    oppositeRoadNodeId(lastRoad, finalTransitionNodeId)
  ];
}

function findDirectedEdge(
  graph: MapGraph,
  roadId: string,
  fromNodeId: string,
  toNodeId: string
): DirectedEdge | undefined {
  return graph.edges.find(
    (edge) => edge.roadId === roadId && edge.fromNodeId === fromNodeId && edge.toNodeId === toNodeId
  );
}

function movementsFromRoadsAndNodes(
  graph: MapGraph,
  orderedRoadIds: readonly string[],
  nodeIds: readonly string[],
  diagnostics: RouteMatchingDiagnostic[]
): MatchedRouteMovement[] | null {
  const movements: MatchedRouteMovement[] = [];

  if (nodeIds.length !== orderedRoadIds.length + 1) {
    return null;
  }

  for (let index = 0; index < orderedRoadIds.length; index += 1) {
    const roadId = orderedRoadIds[index];
    const road = graph.roadsById[roadId];
    const fromNodeId = nodeIds[index];
    const toNodeId = nodeIds[index + 1];

    if (!roadContainsNode(road, fromNodeId) || !roadContainsNode(road, toNodeId) || fromNodeId === toNodeId) {
      diagnostics.push(
        diagnostic({
          code: "disconnected_roads",
          severity: "warning",
          message: `Road ${roadId} cannot form movement ${fromNodeId} to ${toNodeId}.`,
          roadId
        })
      );

      return null;
    }

    const directedEdge = findDirectedEdge(graph, roadId, fromNodeId, toNodeId);

    if (!directedEdge) {
      diagnostics.push(
        diagnostic({
          code: "unresolved_direction",
          severity: "warning",
          message: `Movement ${fromNodeId} to ${toNodeId} on road ${roadId} has no legal directed edge.`,
          roadId
        })
      );
    }

    movements.push({
      roadId,
      fromNodeId,
      toNodeId,
      directedEdgeId: directedEdge?.id ?? null
    });
  }

  return movements;
}

export function matchSnappedRouteToSelection(input: MatchSnappedRouteToSelectionInput): RouteMatchingResult {
  const minimumSnappedPoints = input.options?.minimumSnappedPoints ?? DEFAULT_MINIMUM_SNAPPED_POINTS;
  const snappedPoints = snappedPointsFromInput(input);

  if (snappedPoints.length === 0) {
    return emptyResult("empty", [
      diagnostic({
        code: "empty_input",
        severity: "info",
        message: "No snapped route points were provided."
      })
    ]);
  }

  if (snappedPoints.length < minimumSnappedPoints) {
    return emptyResult("insufficient_points", [
      diagnostic({
        code: "insufficient_points",
        severity: "info",
        message: `At least ${minimumSnappedPoints} snapped points are required for route matching.`
      })
    ]);
  }

  const graph = buildMapGraph(input.map);
  const diagnostics: RouteMatchingDiagnostic[] = [];

  for (let index = 0; index < snappedPoints.length; index += 1) {
    const point = snappedPoints[index];

    if (!point.roadId) {
      diagnostics.push(
        diagnostic({
          code: "unmatched_point",
          severity: "warning",
          message: "A snapped point is not matched to a road.",
          pointIndex: index
        })
      );
      continue;
    }

    if (!graph.roadsById[point.roadId]) {
      diagnostics.push(
        diagnostic({
          code: "unknown_road",
          severity: "warning",
          message: `Snapped point references unknown road id: ${point.roadId}.`,
          pointIndex: index,
          roadId: point.roadId
        })
      );
    }
  }

  if (diagnostics.some((issue) => issue.code === "unmatched_point" || issue.code === "unknown_road")) {
    return emptyResult("unmatched", diagnostics, snappedPoints);
  }

  const roadRuns = collapseConsecutiveRoadRuns(graph, snappedPoints);
  const orderedRoadIds = roadRuns.map((run) => run.roadId);
  const matchedRouteDistanceMeters = routeDistanceMeters(graph, orderedRoadIds);

  if (orderedRoadIds.length === 0) {
    return emptyResult("unmatched", [
      diagnostic({
        code: "unmatched_point",
        severity: "warning",
        message: "Snapped route points did not contain any matched roads."
      })
    ], snappedPoints);
  }

  const transitionNodeIds = transitionNodeIdsForRuns(graph, roadRuns, diagnostics);

  if (!transitionNodeIds) {
    return {
      ...emptyResult("disconnected", diagnostics, snappedPoints),
      orderedRoadIds,
      routeDistanceMeters: matchedRouteDistanceMeters
    };
  }

  const nodeIds = inferNodeSequenceFromRuns(graph, roadRuns, transitionNodeIds);
  const attemptedMovements = movementsFromRoadsAndNodes(graph, orderedRoadIds, nodeIds, diagnostics);

  if (!attemptedMovements) {
    return {
      ...emptyResult("disconnected", diagnostics, snappedPoints),
      orderedRoadIds,
      routeDistanceMeters: matchedRouteDistanceMeters,
      transitionNodeIds: [...transitionNodeIds],
      nodeIds
    };
  }

  const directedEdgeSequence = attemptedMovements.map((movement) => movement.directedEdgeId);
  const directedEdgeIds = directedEdgeSequence.filter((edgeId): edgeId is string => Boolean(edgeId));
  const stats = confidenceStats(snappedPoints);

  return {
    status: "matched",
    isReadyForRunRouteExercise: true,
    confidence: confidenceForMatchedRoute({
      status: "matched",
      averageSnappedPointConfidence: stats.averageSnappedPointConfidence,
      minimumSnappedPointConfidence: stats.minimumSnappedPointConfidence
    }),
    averageSnappedPointConfidence: stats.averageSnappedPointConfidence,
    minimumSnappedPointConfidence: stats.minimumSnappedPointConfidence,
    routeDistanceMeters: matchedRouteDistanceMeters,
    orderedRoadIds,
    transitionNodeIds: [...transitionNodeIds],
    nodeIds,
    directedEdgeIds,
    directedEdgeSequence,
    attemptedMovements,
    selection: {
      nodeIds: [...nodeIds],
      roadIds: [...orderedRoadIds]
    },
    diagnostics
  };
}
