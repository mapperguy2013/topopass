import type {
  DrawRouteQuestion,
  RouteEdge,
  RouteGraph,
  RouteMapPoint
} from "@/src/data/maps/routeTypes";

export type RouteScoreCode =
  | "correct"
  | "start-too-far"
  | "end-too-far"
  | "missed-required"
  | "used-restricted";

export type RouteScoreResult = {
  code: RouteScoreCode;
  isCorrect: boolean;
  message: string;
  startDistance: number;
  endDistance: number;
  matchedRouteIndex: number | null;
};

const ENDPOINT_TOLERANCE = 60;
const EDGE_TOLERANCE = 42;
const REQUIRED_EDGE_COVERAGE = 0.65;
const RESTRICTED_EDGE_COVERAGE = 0.5;
const EDGE_SAMPLE_COUNT = 11;

function distanceBetween(a: RouteMapPoint, b: RouteMapPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distanceToSegment(
  point: RouteMapPoint,
  start: RouteMapPoint,
  end: RouteMapPoint
) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;

  if (lengthSquared === 0) {
    return distanceBetween(point, start);
  }

  const projection = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) /
        lengthSquared
    )
  );
  const closestPoint = {
    x: start.x + projection * deltaX,
    y: start.y + projection * deltaY
  };

  return distanceBetween(point, closestPoint);
}

function distanceToDrawnRoute(point: RouteMapPoint, route: RouteMapPoint[]) {
  let minimumDistance = Number.POSITIVE_INFINITY;

  for (let index = 1; index < route.length; index += 1) {
    minimumDistance = Math.min(
      minimumDistance,
      distanceToSegment(point, route[index - 1], route[index])
    );
  }

  return minimumDistance;
}

function getEdgePoints(edge: RouteEdge, graph: RouteGraph) {
  const start = graph.nodes.find((node) => node.id === edge.from);
  const end = graph.nodes.find((node) => node.id === edge.to);

  if (!start || !end) {
    throw new Error(`Route edge ${edge.id} references an unknown node.`);
  }

  return { start, end };
}

function getEdgeCoverage(
  edge: RouteEdge,
  graph: RouteGraph,
  drawnRoute: RouteMapPoint[]
) {
  const { start, end } = getEdgePoints(edge, graph);
  let nearbySamples = 0;

  for (let index = 0; index < EDGE_SAMPLE_COUNT; index += 1) {
    const progress = index / (EDGE_SAMPLE_COUNT - 1);
    const sample = {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress
    };

    if (distanceToDrawnRoute(sample, drawnRoute) <= EDGE_TOLERANCE) {
      nearbySamples += 1;
    }
  }

  return nearbySamples / EDGE_SAMPLE_COUNT;
}

function getNode(graph: RouteGraph, nodeId: string) {
  const node = graph.nodes.find((candidate) => candidate.id === nodeId);

  if (!node) {
    throw new Error(`Route question references unknown node ${nodeId}.`);
  }

  return node;
}

function getEdge(graph: RouteGraph, edgeId: string) {
  const edge = graph.edges.find((candidate) => candidate.id === edgeId);

  if (!edge) {
    throw new Error(`Accepted route references unknown edge ${edgeId}.`);
  }

  return edge;
}

export function scoreDrawnRoute(
  drawnRoute: RouteMapPoint[],
  graph: RouteGraph,
  question: DrawRouteQuestion
): RouteScoreResult {
  const startNode = getNode(graph, question.startNodeId);
  const endNode = getNode(graph, question.endNodeId);
  const startDistance = distanceBetween(drawnRoute[0], startNode);
  const endDistance = distanceBetween(drawnRoute[drawnRoute.length - 1], endNode);
  const baseResult = { startDistance, endDistance, matchedRouteIndex: null };

  if (startDistance > ENDPOINT_TOLERANCE) {
    return {
      ...baseResult,
      code: "start-too-far",
      isCorrect: false,
      message: "Started too far from the start"
    };
  }

  if (endDistance > ENDPOINT_TOLERANCE) {
    return {
      ...baseResult,
      code: "end-too-far",
      isCorrect: false,
      message: "Ended too far from the destination"
    };
  }

  const usedRestrictedEdge = graph.edges
    .filter((edge) => edge.restricted)
    .some(
      (edge) =>
        getEdgeCoverage(edge, graph, drawnRoute) >= RESTRICTED_EDGE_COVERAGE
    );

  if (usedRestrictedEdge) {
    return {
      ...baseResult,
      code: "used-restricted",
      isCorrect: false,
      message: "Used a restricted/wrong road"
    };
  }

  const matchedRouteIndex = question.acceptedRoutes.findIndex((route) =>
    route.every(
      (edgeId) =>
        getEdgeCoverage(getEdge(graph, edgeId), graph, drawnRoute) >=
        REQUIRED_EDGE_COVERAGE
    )
  );

  if (matchedRouteIndex === -1) {
    return {
      ...baseResult,
      code: "missed-required",
      isCorrect: false,
      message: "Missed part of the required route"
    };
  }

  return {
    ...baseResult,
    matchedRouteIndex,
    code: "correct",
    isCorrect: true,
    message: "Correct route"
  };
}
