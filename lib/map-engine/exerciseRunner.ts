import { buildMapGraph } from "./graph.ts";
import { scoreRouteAttempt, type RouteScoringResult } from "./scoringEngine.ts";
import type { AttemptedRouteMovement } from "./legalityEngine.ts";
import type { DirectedEdge, MapDefinition, MapGraph, MapRoad, RouteExercise, RouteStop } from "./types.ts";

export type UserRouteSelectionInput = {
  nodeIds?: string[];
  roadIds?: string[];
};

export type RunRouteExerciseInput = {
  map: MapDefinition;
  exercises: RouteExercise[];
  exerciseId: string;
  userRoute: UserRouteSelectionInput;
  passThresholdPercent?: number;
};

export type NormalisedRouteAttempt = {
  exerciseId: string;
  startLandmarkId?: string;
  destinationLandmarkIds: string[];
  requiredNodeIds: string[];
  selectedNodeIds: string[];
  selectedRoadIds: string[];
  selectedDirectedEdgeIds: string[];
  movements: AttemptedRouteMovement[];
};

export type RunRouteExerciseResult = {
  exerciseId: string;
  normalisedAttempt: NormalisedRouteAttempt;
  score: RouteScoringResult;
};

function findExercise(exercises: RouteExercise[], exerciseId: string): RouteExercise {
  const exercise = exercises.find((candidate) => candidate.id === exerciseId);

  if (!exercise) {
    throw new Error(`Unknown route exercise id: ${exerciseId}`);
  }

  return exercise;
}

function assertNodeExists(graph: MapGraph, nodeId: string): void {
  if (!graph.nodesById[nodeId]) {
    throw new Error(`Unknown node id in user route: ${nodeId}`);
  }
}

function assertRoadExists(graph: MapGraph, roadId: string): MapRoad {
  const road = graph.roadsById[roadId];

  if (!road) {
    throw new Error(`Unknown road id in user route: ${roadId}`);
  }

  return road;
}

function resolveRouteStop(map: MapDefinition, graph: MapGraph, stop: RouteStop): { nodeId: string; landmarkId?: string } {
  if (stop.type === "node") {
    if (!graph.nodesById[stop.nodeId]) {
      throw new Error(`Route exercise references unknown node id: ${stop.nodeId}`);
    }

    return { nodeId: stop.nodeId };
  }

  const landmark = map.landmarks.find((candidate) => candidate.id === stop.landmarkId);

  if (!landmark) {
    throw new Error(`Route exercise references unknown landmark id: ${stop.landmarkId}`);
  }

  if (!landmark.nearestNodeId) {
    throw new Error(`Landmark ${stop.landmarkId} cannot be resolved to a route node.`);
  }

  if (!graph.nodesById[landmark.nearestNodeId]) {
    throw new Error(`Landmark ${stop.landmarkId} references unknown nearest node id: ${landmark.nearestNodeId}`);
  }

  return {
    nodeId: landmark.nearestNodeId,
    landmarkId: stop.landmarkId
  };
}

function roadConnectsNodes(road: MapRoad, fromNodeId: string, toNodeId: string): boolean {
  return (
    (road.fromNodeId === fromNodeId && road.toNodeId === toNodeId) ||
    (road.fromNodeId === toNodeId && road.toNodeId === fromNodeId)
  );
}

function directedEdgeForMovement(graph: MapGraph, movement: AttemptedRouteMovement): DirectedEdge | undefined {
  return graph.edges.find(
    (edge) =>
      edge.roadId === movement.roadId &&
      edge.fromNodeId === movement.fromNodeId &&
      edge.toNodeId === movement.toNodeId
  );
}

function findRoadBetweenNodes(graph: MapGraph, fromNodeId: string, toNodeId: string): MapRoad {
  const road = Object.values(graph.roadsById).find((candidate) => roadConnectsNodes(candidate, fromNodeId, toNodeId));

  if (!road) {
    throw new Error(`Disconnected node sequence: ${fromNodeId} is not connected to ${toNodeId}.`);
  }

  return road;
}

function normaliseFromNodeIds(graph: MapGraph, nodeIds: string[], roadIds?: string[]): AttemptedRouteMovement[] {
  if (nodeIds.length < 2) {
    throw new Error("User route nodeIds must contain at least two node IDs.");
  }

  for (const nodeId of nodeIds) {
    assertNodeExists(graph, nodeId);
  }

  if (roadIds && roadIds.length !== nodeIds.length - 1) {
    throw new Error("When nodeIds and roadIds are both supplied, roadIds must have one fewer item than nodeIds.");
  }

  return nodeIds.slice(0, -1).map((fromNodeId, index) => {
    const toNodeId = nodeIds[index + 1];
    const road = roadIds ? assertRoadExists(graph, roadIds[index]) : findRoadBetweenNodes(graph, fromNodeId, toNodeId);

    if (!roadConnectsNodes(road, fromNodeId, toNodeId)) {
      throw new Error(`Road ${road.id} does not connect selected nodes ${fromNodeId} and ${toNodeId}.`);
    }

    return {
      roadId: road.id,
      fromNodeId,
      toNodeId
    };
  });
}

function normaliseFromRoadIds(graph: MapGraph, roadIds: string[]): AttemptedRouteMovement[] {
  if (roadIds.length === 0) {
    throw new Error("User route roadIds must contain at least one road ID.");
  }

  const roads = roadIds.map((roadId) => assertRoadExists(graph, roadId));

  for (let index = 1; index < roads.length; index += 1) {
    const previousRoad = roads[index - 1];
    const currentRoad = roads[index];

    if (previousRoad.toNodeId !== currentRoad.fromNodeId) {
      throw new Error(
        `Disconnected road sequence: road ${previousRoad.id} ends at ${previousRoad.toNodeId}, but road ${currentRoad.id} starts at ${currentRoad.fromNodeId}.`
      );
    }
  }

  return roads.map((road) => ({
    roadId: road.id,
    fromNodeId: road.fromNodeId,
    toNodeId: road.toNodeId
  }));
}

function normaliseUserRoute(graph: MapGraph, userRoute: UserRouteSelectionInput): AttemptedRouteMovement[] {
  if (userRoute.nodeIds?.length) {
    return normaliseFromNodeIds(graph, userRoute.nodeIds, userRoute.roadIds);
  }

  if (userRoute.roadIds?.length) {
    return normaliseFromRoadIds(graph, userRoute.roadIds);
  }

  throw new Error("User route must include nodeIds or roadIds.");
}

function selectedNodeIdsFromMovements(movements: AttemptedRouteMovement[]): string[] {
  if (movements.length === 0) {
    return [];
  }

  return [movements[0].fromNodeId, ...movements.map((movement) => movement.toNodeId)];
}

export function runRouteExercise(input: RunRouteExerciseInput): RunRouteExerciseResult {
  const graph = buildMapGraph(input.map);
  const exercise = findExercise(input.exercises, input.exerciseId);
  const resolvedStops = exercise.stops.map((stop) => resolveRouteStop(input.map, graph, stop));
  const requiredNodeIds = resolvedStops.map((stop) => stop.nodeId);
  const movements = normaliseUserRoute(graph, input.userRoute);
  const selectedDirectedEdgeIds = movements
    .map((movement) => directedEdgeForMovement(graph, movement)?.id)
    .filter((edgeId): edgeId is string => Boolean(edgeId));
  const score = scoreRouteAttempt({
    map: input.map,
    movements,
    requiredStopNodeIds: requiredNodeIds,
    passThresholdPercent: input.passThresholdPercent
  });

  return {
    exerciseId: exercise.id,
    normalisedAttempt: {
      exerciseId: exercise.id,
      startLandmarkId: resolvedStops[0]?.landmarkId,
      destinationLandmarkIds: resolvedStops
        .slice(1)
        .map((stop) => stop.landmarkId)
        .filter((landmarkId): landmarkId is string => Boolean(landmarkId)),
      requiredNodeIds,
      selectedNodeIds: selectedNodeIdsFromMovements(movements),
      selectedRoadIds: movements.map((movement) => movement.roadId),
      selectedDirectedEdgeIds,
      movements
    },
    score
  };
}
