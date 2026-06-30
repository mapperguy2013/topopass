import {
  buildBlockedDirectedEdgeKeys,
  buildMapGraph,
  directedEdgeKey,
  findShortestLegalRoute,
  findShortestLegalRouteThroughStops,
  validateDirectedEdgePath,
  type DirectedEdge,
  type MapDefinition,
  type MapGraph,
  type RouteExercise,
  type RouteStop
} from "../../../lib/map-engine/index.ts";
import { getRouteRunnerMapFitBounds, type RouteRunnerMapBounds } from "./routeRunnerMaps.ts";

export type OsmExerciseQaFailureReason =
  | "missing-start-node"
  | "missing-destination-node"
  | "missing-checkpoint-node"
  | "same-start-destination"
  | "unreachable-leg"
  | "illegal-directed-edge"
  | "unknown-route-edge"
  | "outside-render-bounds";

export type OsmExerciseQaFailure = {
  reason: OsmExerciseQaFailureReason;
  mapId: string;
  exerciseId: string;
  nodeId?: string;
  edgeId?: string;
  directedEdgeKey?: string;
  legIndex?: number;
  legStartNodeId?: string;
  legEndNodeId?: string;
  message: string;
};

export type OsmExerciseQaResult = {
  isValid: boolean;
  mapId: string;
  exerciseId: string;
  stopNodeIds: Array<string | null>;
  routeEdgeIds: string[];
  routeNodeIds: string[];
  routeDistanceMeters: number | null;
  failures: OsmExerciseQaFailure[];
};

export type OsmExerciseQaSuiteResult = {
  isValid: boolean;
  mapId: string;
  exerciseCount: number;
  results: OsmExerciseQaResult[];
  failures: OsmExerciseQaFailure[];
};

export type OsmExerciseQaAcceptanceReport = {
  isValid: boolean;
  mapId: string;
  exerciseId: string;
  startNodeId: string | null;
  destinationNodeId: string | null;
  checkpointNodeIds: Array<string | null>;
  checkpointCount: number;
  hasLegalRoute: boolean;
  fastestRouteEdgeCount: number;
  fastestRouteDistanceMeters: number | null;
  failureReasonCodes: OsmExerciseQaFailureReason[];
  failureMessages: string[];
};

export type OsmExerciseQaAcceptanceSuiteReport = {
  isValid: boolean;
  mapId: string;
  exerciseCount: number;
  reports: OsmExerciseQaAcceptanceReport[];
  failureReasonCodes: OsmExerciseQaFailureReason[];
  failureMessages: string[];
};

export type ValidateOsmRouteExerciseQaInput = {
  map: MapDefinition;
  exercise: RouteExercise;
  graph?: MapGraph;
  renderBounds?: RouteRunnerMapBounds;
};

export type ValidateOsmRouteExerciseDirectedEdgePathInput = ValidateOsmRouteExerciseQaInput & {
  edgeIds: readonly string[];
};

export type ValidateOsmRouteExerciseQaSuiteInput = {
  map: MapDefinition;
  exercises: readonly RouteExercise[];
  graph?: MapGraph;
  renderBounds?: RouteRunnerMapBounds;
};

export function validateOsmRouteExerciseQa(input: ValidateOsmRouteExerciseQaInput): OsmExerciseQaResult {
  const graph = input.graph ?? buildMapGraph(input.map);
  const renderBounds = input.renderBounds ?? getRouteRunnerMapFitBounds(input.map);
  const stopNodeIds = input.exercise.stops.map((stop) => stopNodeId(stop));
  const failures: OsmExerciseQaFailure[] = [];

  validateExerciseStopNodes({
    map: input.map,
    graph,
    exercise: input.exercise,
    stopNodeIds,
    renderBounds,
    failures
  });

  const resolvedStopNodeIds = stopNodeIds.filter((nodeId): nodeId is string => Boolean(nodeId));

  if (resolvedStopNodeIds.length >= 2 && resolvedStopNodeIds[0] === resolvedStopNodeIds[resolvedStopNodeIds.length - 1]) {
    failures.push(
      failure({
        reason: "same-start-destination",
        mapId: input.map.id,
        exerciseId: input.exercise.id,
        nodeId: resolvedStopNodeIds[0],
        message: `Start and destination both resolve to ${resolvedStopNodeIds[0]}.`
      })
    );
  }

  const hasMissingStops = failures.some((entry) =>
    ["missing-start-node", "missing-destination-node", "missing-checkpoint-node"].includes(entry.reason)
  );

  if (hasMissingStops || resolvedStopNodeIds.length < 2) {
    return qaResult(input.map.id, input.exercise.id, stopNodeIds, null, failures);
  }

  for (let index = 0; index < resolvedStopNodeIds.length - 1; index += 1) {
    const startNodeId = resolvedStopNodeIds[index];
    const endNodeId = resolvedStopNodeIds[index + 1];
    const legRoute = findShortestLegalRoute({
      graph,
      startNodeId,
      endNodeId,
      restrictions: input.map.restrictions
    });

    if (!legRoute.found) {
      failures.push(
        failure({
          reason: "unreachable-leg",
          mapId: input.map.id,
          exerciseId: input.exercise.id,
          legIndex: index + 1,
          legStartNodeId: startNodeId,
          legEndNodeId: endNodeId,
          message: `No legal route for leg ${index + 1}: ${startNodeId} -> ${endNodeId}.`
        })
      );
    }
  }

  if (failures.some((entry) => entry.reason === "unreachable-leg")) {
    return qaResult(input.map.id, input.exercise.id, stopNodeIds, null, failures);
  }

  const route = findShortestLegalRouteThroughStops({
    graph,
    stopNodeIds: resolvedStopNodeIds,
    restrictions: input.map.restrictions
  });

  if (!route.found) {
    failures.push(
      failure({
        reason: "unreachable-leg",
        mapId: input.map.id,
        exerciseId: input.exercise.id,
        message: `No legal ordered route through stops: ${resolvedStopNodeIds.join(" -> ")}.`
      })
    );

    return qaResult(input.map.id, input.exercise.id, stopNodeIds, null, failures);
  }

  return validateOsmRouteExerciseDirectedEdgePath({
    ...input,
    graph,
    renderBounds,
    edgeIds: route.edgeIds
  });
}

export function validateOsmRouteExerciseDirectedEdgePath(
  input: ValidateOsmRouteExerciseDirectedEdgePathInput
): OsmExerciseQaResult {
  const graph = input.graph ?? buildMapGraph(input.map);
  const renderBounds = input.renderBounds ?? getRouteRunnerMapFitBounds(input.map);
  const stopNodeIds = input.exercise.stops.map((stop) => stopNodeId(stop));
  const failures: OsmExerciseQaFailure[] = [];

  validateExerciseStopNodes({
    map: input.map,
    graph,
    exercise: input.exercise,
    stopNodeIds,
    renderBounds,
    failures
  });

  for (const edgeId of input.edgeIds) {
    if (!graph.edgesById[edgeId]) {
      failures.push(
        failure({
          reason: "unknown-route-edge",
          mapId: input.map.id,
          exerciseId: input.exercise.id,
          edgeId,
          message: `Route references unknown edge ${edgeId}.`
        })
      );
    }
  }

  const routeValidation = validateDirectedEdgePath({
    graph,
    edgeIds: input.edgeIds,
    restrictions: input.map.restrictions
  });

  for (const invalidEdgeKey of routeValidation.invalidEdgeKeys) {
    const edge =
      graph.edgesById[invalidEdgeKey] ??
      Object.values(graph.edgesById).find((candidate) => directedEdgeKey(candidate) === invalidEdgeKey);

    if (failures.some((entry) => entry.reason === "unknown-route-edge" && entry.edgeId === invalidEdgeKey)) {
      continue;
    }

    failures.push(
      failure({
        reason: edge ? "illegal-directed-edge" : "unknown-route-edge",
        mapId: input.map.id,
        exerciseId: input.exercise.id,
        edgeId: edge?.id ?? invalidEdgeKey,
        directedEdgeKey: edge ? directedEdgeKey(edge) : undefined,
        message: edge
          ? `Route uses blocked directed edge ${directedEdgeKey(edge)}.`
          : `Route references unknown edge ${invalidEdgeKey}.`
      })
    );
  }

  const blockedDirectedEdgeKeys = buildBlockedDirectedEdgeKeys(graph, input.map.restrictions);

  for (const edgeId of input.edgeIds) {
    const edge = graph.edgesById[edgeId];

    if (!edge) {
      continue;
    }

    const key = directedEdgeKey(edge);

    if (blockedDirectedEdgeKeys.has(key) && !failures.some((entry) => entry.directedEdgeKey === key)) {
      failures.push(
        failure({
          reason: "illegal-directed-edge",
          mapId: input.map.id,
          exerciseId: input.exercise.id,
          edgeId,
          directedEdgeKey: key,
          message: `Route uses blocked directed edge ${key}.`
        })
      );
    }
  }

  const routeEdges = input.edgeIds
    .map((edgeId) => graph.edgesById[edgeId])
    .filter((edge): edge is DirectedEdge => Boolean(edge));

  for (const edge of routeEdges) {
    const from = graph.nodesById[edge.fromNodeId];
    const to = graph.nodesById[edge.toNodeId];

    if (from && !pointInsideBounds(from, renderBounds)) {
      failures.push(
        failure({
          reason: "outside-render-bounds",
          mapId: input.map.id,
          exerciseId: input.exercise.id,
          nodeId: from.id,
          edgeId: edge.id,
          message: `Route edge ${edge.id} starts outside render bounds at ${from.id}.`
        })
      );
    }

    if (to && !pointInsideBounds(to, renderBounds)) {
      failures.push(
        failure({
          reason: "outside-render-bounds",
          mapId: input.map.id,
          exerciseId: input.exercise.id,
          nodeId: to.id,
          edgeId: edge.id,
          message: `Route edge ${edge.id} ends outside render bounds at ${to.id}.`
        })
      );
    }
  }

  return {
    isValid: failures.length === 0,
    mapId: input.map.id,
    exerciseId: input.exercise.id,
    stopNodeIds,
    routeEdgeIds: [...input.edgeIds],
    routeNodeIds: routeNodeIdsFromEdges(graph, input.edgeIds),
    routeDistanceMeters: routeEdges.length > 0 ? routeEdges.reduce((total, edge) => total + edge.distanceMeters, 0) : null,
    failures
  };
}

export function validateOsmRouteExerciseQaSuite(
  input: ValidateOsmRouteExerciseQaSuiteInput
): OsmExerciseQaSuiteResult {
  const graph = input.graph ?? buildMapGraph(input.map);
  const renderBounds = input.renderBounds ?? getRouteRunnerMapFitBounds(input.map);
  const results = input.exercises.map((exercise) =>
    validateOsmRouteExerciseQa({
      map: input.map,
      exercise,
      graph,
      renderBounds
    })
  );
  const failures = results.flatMap((result) => result.failures);

  return {
    isValid: failures.length === 0,
    mapId: input.map.id,
    exerciseCount: input.exercises.length,
    results,
    failures
  };
}

export function buildOsmRouteExerciseQaAcceptanceReport(
  input: ValidateOsmRouteExerciseQaInput
): OsmExerciseQaAcceptanceReport {
  return acceptanceReportFromQaResult(validateOsmRouteExerciseQa(input));
}

export function buildOsmRouteExerciseQaAcceptanceSuiteReport(
  input: ValidateOsmRouteExerciseQaSuiteInput
): OsmExerciseQaAcceptanceSuiteReport {
  const suite = validateOsmRouteExerciseQaSuite(input);
  const reports = suite.results.map(acceptanceReportFromQaResult);

  return {
    isValid: suite.isValid,
    mapId: suite.mapId,
    exerciseCount: suite.exerciseCount,
    reports,
    failureReasonCodes: uniqueFailureReasonCodes(suite.failures),
    failureMessages: suite.failures.map(formatOsmExerciseQaFailure)
  };
}

export function formatOsmExerciseQaFailure(failure: OsmExerciseQaFailure): string {
  return [
    failure.reason,
    `map=${failure.mapId}`,
    `exercise=${failure.exerciseId}`,
    failure.legIndex ? `leg=${failure.legIndex}` : null,
    failure.nodeId ? `node=${failure.nodeId}` : null,
    failure.edgeId ? `edge=${failure.edgeId}` : null,
    failure.directedEdgeKey ? `directed=${failure.directedEdgeKey}` : null,
    failure.message
  ]
    .filter((part): part is string => Boolean(part))
    .join(" | ");
}

function acceptanceReportFromQaResult(result: OsmExerciseQaResult): OsmExerciseQaAcceptanceReport {
  return {
    isValid: result.isValid,
    mapId: result.mapId,
    exerciseId: result.exerciseId,
    startNodeId: result.stopNodeIds[0] ?? null,
    destinationNodeId: result.stopNodeIds.at(-1) ?? null,
    checkpointNodeIds: result.stopNodeIds.slice(1, -1),
    checkpointCount: Math.max(0, result.stopNodeIds.length - 2),
    hasLegalRoute: result.isValid && result.routeEdgeIds.length > 0 && result.routeDistanceMeters !== null,
    fastestRouteEdgeCount: result.routeEdgeIds.length,
    fastestRouteDistanceMeters: result.routeDistanceMeters,
    failureReasonCodes: uniqueFailureReasonCodes(result.failures),
    failureMessages: result.failures.map(formatOsmExerciseQaFailure)
  };
}

function uniqueFailureReasonCodes(failures: readonly OsmExerciseQaFailure[]): OsmExerciseQaFailureReason[] {
  const reasonCodes: OsmExerciseQaFailureReason[] = [];

  for (const failure of failures) {
    if (!reasonCodes.includes(failure.reason)) {
      reasonCodes.push(failure.reason);
    }
  }

  return reasonCodes;
}

function validateExerciseStopNodes(input: {
  map: MapDefinition;
  graph: MapGraph;
  exercise: RouteExercise;
  stopNodeIds: Array<string | null>;
  renderBounds: RouteRunnerMapBounds;
  failures: OsmExerciseQaFailure[];
}): void {
  input.stopNodeIds.forEach((nodeId, index) => {
    const role = stopRole(index, input.stopNodeIds.length);
    const reason =
      role === "start"
        ? "missing-start-node"
        : role === "finish"
          ? "missing-destination-node"
          : "missing-checkpoint-node";

    if (!nodeId || !input.graph.nodesById[nodeId]) {
      input.failures.push(
        failure({
          reason,
          mapId: input.map.id,
          exerciseId: input.exercise.id,
          nodeId: nodeId ?? undefined,
          legIndex: role === "checkpoint" ? index : undefined,
          message: `${role} node ${nodeId ?? "(unresolved)"} does not exist in ${input.map.id}.`
        })
      );
      return;
    }

    if (!pointInsideBounds(input.graph.nodesById[nodeId], input.renderBounds)) {
      input.failures.push(
        failure({
          reason: "outside-render-bounds",
          mapId: input.map.id,
          exerciseId: input.exercise.id,
          nodeId,
          message: `${role} node ${nodeId} is outside render bounds.`
        })
      );
    }
  });
}

function qaResult(
  mapId: string,
  exerciseId: string,
  stopNodeIds: Array<string | null>,
  route: { edgeIds: string[]; nodeIds: string[]; distanceMeters: number } | null,
  failures: OsmExerciseQaFailure[]
): OsmExerciseQaResult {
  return {
    isValid: failures.length === 0,
    mapId,
    exerciseId,
    stopNodeIds,
    routeEdgeIds: route?.edgeIds ?? [],
    routeNodeIds: route?.nodeIds ?? [],
    routeDistanceMeters: route?.distanceMeters ?? null,
    failures
  };
}

function routeNodeIdsFromEdges(graph: MapGraph, edgeIds: readonly string[]): string[] {
  const firstEdge = edgeIds.map((edgeId) => graph.edgesById[edgeId]).find(Boolean);

  if (!firstEdge) {
    return [];
  }

  return [
    firstEdge.fromNodeId,
    ...edgeIds.map((edgeId) => graph.edgesById[edgeId]?.toNodeId).filter((nodeId): nodeId is string => Boolean(nodeId))
  ];
}

function stopNodeId(stop: RouteStop): string | null {
  return stop.type === "node" ? stop.nodeId : null;
}

function stopRole(index: number, stopCount: number): "start" | "checkpoint" | "finish" {
  if (index === 0) {
    return "start";
  }

  return index === stopCount - 1 ? "finish" : "checkpoint";
}

function pointInsideBounds(point: { x: number; y: number }, bounds: RouteRunnerMapBounds): boolean {
  return point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY;
}

function failure(failure: OsmExerciseQaFailure): OsmExerciseQaFailure {
  return failure;
}
