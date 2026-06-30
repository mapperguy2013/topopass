import {
  buildMapGraph,
  findShortestLegalRouteThroughStops,
  validateRouteExerciseLegalReachability,
  type MapDefinition,
  type RouteExercise,
  type Vec2
} from "../../../lib/map-engine/index.ts";

const NO_LEGAL_FASTEST_ROUTE_MESSAGE = "No legal fastest route available for this exercise.";

export type FastestRouteRevealState = {
  visible: boolean;
};

export type FastestRouteOverlayResult =
  | {
      status: "hidden";
      visible: false;
      points: Vec2[];
      nodeIds: string[];
      roadIds: string[];
      edgeIds: string[];
      distanceMeters: 0;
      message: null;
      invalidReasons: string[];
    }
  | {
      status: "available";
      visible: true;
      points: Vec2[];
      nodeIds: string[];
      roadIds: string[];
      edgeIds: string[];
      distanceMeters: number;
      message: null;
      invalidReasons: string[];
    }
  | {
      status: "unavailable";
      visible: true;
      points: Vec2[];
      nodeIds: string[];
      roadIds: string[];
      edgeIds: string[];
      distanceMeters: 0;
      message: string;
      invalidReasons: string[];
    };

export function createHiddenFastestRouteRevealState(): FastestRouteRevealState {
  return {
    visible: false
  };
}

export function toggleFastestRouteReveal(state: FastestRouteRevealState): FastestRouteRevealState {
  return {
    visible: !state.visible
  };
}

export function hideFastestRouteReveal(): FastestRouteRevealState {
  return createHiddenFastestRouteRevealState();
}

function hiddenFastestRouteResult(): FastestRouteOverlayResult {
  return {
    status: "hidden",
    visible: false,
    points: [],
    nodeIds: [],
    roadIds: [],
    edgeIds: [],
    distanceMeters: 0,
    message: null,
    invalidReasons: []
  };
}

function unavailableFastestRouteResult(
  message: string = NO_LEGAL_FASTEST_ROUTE_MESSAGE,
  invalidReasons: readonly string[] = []
): FastestRouteOverlayResult {
  return {
    status: "unavailable",
    visible: true,
    points: [],
    nodeIds: [],
    roadIds: [],
    edgeIds: [],
    distanceMeters: 0,
    message,
    invalidReasons: [...invalidReasons]
  };
}

export function buildFastestRouteOverlay(input: {
  map: MapDefinition;
  exercise?: RouteExercise;
  revealState: FastestRouteRevealState;
}): FastestRouteOverlayResult {
  if (!input.revealState.visible) {
    return hiddenFastestRouteResult();
  }

  if (!input.exercise) {
    return unavailableFastestRouteResult();
  }

  const exerciseValidation = validateRouteExerciseLegalReachability(input.exercise, input.map);

  if (!exerciseValidation.valid) {
    return unavailableFastestRouteResult(NO_LEGAL_FASTEST_ROUTE_MESSAGE, exerciseValidation.errors);
  }

  const graph = buildMapGraph(input.map);
  const route = findShortestLegalRouteThroughStops({
    graph,
    stopNodeIds: exerciseValidation.stopNodeIds,
    restrictions: input.map.restrictions
  });

  if (!route.found) {
    return unavailableFastestRouteResult(NO_LEGAL_FASTEST_ROUTE_MESSAGE, [
      `Route exercise ${input.exercise.id} has no valid legal route through required stops ${exerciseValidation.stopNodeIds.join(
        " -> "
      )}`
    ]);
  }

  const points: Vec2[] = [];

  for (const nodeId of route.nodeIds) {
    const node = graph.nodesById[nodeId];

    if (node) {
      points.push({ x: node.x, y: node.y });
    }
  }

  if (points.length < 2) {
    return unavailableFastestRouteResult();
  }

  return {
    status: "available",
    visible: true,
    points: points.map((point) => ({ x: point.x, y: point.y })),
    nodeIds: [...route.nodeIds],
    roadIds: [...route.roadIds],
    edgeIds: [...route.edgeIds],
    distanceMeters: route.distanceMeters,
    message: null,
    invalidReasons: []
  };
}
