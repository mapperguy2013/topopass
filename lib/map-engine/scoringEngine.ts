import { buildMapGraph } from "./graph.ts";
import { checkRouteLegality, type AttemptedRouteMovement, type LegalityCheckResult } from "./legalityEngine.ts";
import { findShortestLegalRouteThroughStops } from "./shortestRoute.ts";
import type { MapDefinition, MapGraph } from "./types.ts";

export type RoutePassStatus = "pass" | "fail";

export type RouteScoringFailureReason =
  | "illegal_route"
  | "below_efficiency_threshold"
  | "wrong_start"
  | "wrong_destination"
  | "missed_required_stop"
  | "no_valid_shortest_route"
  | "zero_distance_route";

export type RouteScoringInput = {
  map: MapDefinition;
  movements: AttemptedRouteMovement[];
  requiredStopNodeIds: string[];
  passThresholdPercent?: number;
};

export type RouteScoringResult = {
  passed: boolean;
  automaticFail: boolean;
  status: RoutePassStatus;
  isLegal: boolean;
  scorePercent: number;
  efficiencyRatio: number;
  scoreRatio: number;
  userRouteDistanceMeters: number;
  shortestLegalRouteDistanceMeters: number;
  userDistanceMeters: number;
  shortestLegalDistanceMeters: number;
  passThresholdPercent: number;
  thresholdPercent: number;
  failureReasons: RouteScoringFailureReason[];
  failureReason?: RouteScoringFailureReason;
  legality: LegalityCheckResult;
};

export type RouteScoreFailureReason = RouteScoringFailureReason;
export type ScoreRouteAttemptInput = RouteScoringInput;
export type RouteScoreResult = RouteScoringResult;

const DEFAULT_ROUTE_PASS_THRESHOLD_PERCENT = 80;

function assertValidRequiredStops(requiredStopNodeIds: string[]): void {
  if (requiredStopNodeIds.length < 2) {
    throw new Error("requiredStopNodeIds must contain at least two node IDs.");
  }
}

function movementNodeSequence(movements: AttemptedRouteMovement[]): string[] {
  if (movements.length === 0) {
    return [];
  }

  return [movements[0].fromNodeId, ...movements.map((movement) => movement.toNodeId)];
}

function calculateUserRouteDistanceMeters(graph: MapGraph, movements: AttemptedRouteMovement[]): number {
  return movements.reduce((total, movement) => {
    const road = graph.roadsById[movement.roadId];

    return total + (road?.distanceMeters ?? 0);
  }, 0);
}

function requiredStopsAreVisitedInOrder(visitedNodeIds: string[], requiredStopNodeIds: string[]): boolean {
  let requiredStopIndex = 0;

  for (const visitedNodeId of visitedNodeIds) {
    if (visitedNodeId === requiredStopNodeIds[requiredStopIndex]) {
      requiredStopIndex += 1;
    }

    if (requiredStopIndex === requiredStopNodeIds.length) {
      return true;
    }
  }

  return false;
}

function requiredStopFailureReasons(
  movements: AttemptedRouteMovement[],
  requiredStopNodeIds: string[]
): RouteScoringFailureReason[] {
  const visitedNodeIds = movementNodeSequence(movements);
  const failureReasons: RouteScoringFailureReason[] = [];
  const firstRequiredStopId = requiredStopNodeIds[0];
  const finalRequiredStopId = requiredStopNodeIds[requiredStopNodeIds.length - 1];

  if (visitedNodeIds[0] !== firstRequiredStopId) {
    failureReasons.push("wrong_start");
  }

  if (visitedNodeIds[visitedNodeIds.length - 1] !== finalRequiredStopId) {
    failureReasons.push("wrong_destination");
  }

  if (!requiredStopsAreVisitedInOrder(visitedNodeIds, requiredStopNodeIds)) {
    failureReasons.push("missed_required_stop");
  }

  return failureReasons;
}

function calculateShortestRequiredRouteDistance(input: {
  graph: MapGraph;
  restrictions: MapDefinition["restrictions"];
  requiredStopNodeIds: string[];
}): { found: true; distanceMeters: number } | { found: false; distanceMeters: 0 } {
  const route = findShortestLegalRouteThroughStops({
    graph: input.graph,
    stopNodeIds: input.requiredStopNodeIds,
    restrictions: input.restrictions
  });

  if (!route.found || route.distanceMeters <= 0) {
    return { found: false, distanceMeters: 0 };
  }

  return { found: true, distanceMeters: route.distanceMeters };
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function result(input: {
  passed: boolean;
  automaticFail: boolean;
  scorePercent: number;
  efficiencyRatio: number;
  userRouteDistanceMeters: number;
  shortestLegalRouteDistanceMeters: number;
  passThresholdPercent: number;
  failureReasons: RouteScoringFailureReason[];
  legality: LegalityCheckResult;
}): RouteScoringResult {
  return {
    passed: input.passed,
    automaticFail: input.automaticFail,
    status: input.passed ? "pass" : "fail",
    isLegal: input.legality.isLegal,
    scorePercent: input.scorePercent,
    efficiencyRatio: input.efficiencyRatio,
    scoreRatio: input.efficiencyRatio,
    userRouteDistanceMeters: input.userRouteDistanceMeters,
    shortestLegalRouteDistanceMeters: input.shortestLegalRouteDistanceMeters,
    userDistanceMeters: input.userRouteDistanceMeters,
    shortestLegalDistanceMeters: input.shortestLegalRouteDistanceMeters,
    passThresholdPercent: input.passThresholdPercent,
    thresholdPercent: input.passThresholdPercent,
    failureReasons: input.failureReasons,
    failureReason: input.failureReasons[0],
    legality: input.legality
  };
}

export function scoreRouteAttempt(input: RouteScoringInput): RouteScoringResult {
  assertValidRequiredStops(input.requiredStopNodeIds);

  const passThresholdPercent = input.passThresholdPercent ?? DEFAULT_ROUTE_PASS_THRESHOLD_PERCENT;
  const graph = buildMapGraph(input.map);
  const legality = checkRouteLegality({
    map: input.map,
    movements: input.movements
  });
  const userRouteDistanceMeters = calculateUserRouteDistanceMeters(graph, input.movements);

  if (legality.automaticFail) {
    return result({
      passed: false,
      automaticFail: true,
      scorePercent: 0,
      efficiencyRatio: 0,
      userRouteDistanceMeters,
      shortestLegalRouteDistanceMeters: 0,
      passThresholdPercent,
      failureReasons: ["illegal_route"],
      legality
    });
  }

  const failureReasons = requiredStopFailureReasons(input.movements, input.requiredStopNodeIds);

  if (userRouteDistanceMeters <= 0) {
    failureReasons.push("zero_distance_route");
  }

  const shortestRequiredRoute = calculateShortestRequiredRouteDistance({
    graph,
    restrictions: input.map.restrictions,
    requiredStopNodeIds: input.requiredStopNodeIds
  });

  if (!shortestRequiredRoute.found) {
    failureReasons.push("no_valid_shortest_route");
  }

  if (failureReasons.length > 0) {
    return result({
      passed: false,
      automaticFail: false,
      scorePercent: 0,
      efficiencyRatio: 0,
      userRouteDistanceMeters,
      shortestLegalRouteDistanceMeters: shortestRequiredRoute.found ? shortestRequiredRoute.distanceMeters : 0,
      passThresholdPercent,
      failureReasons,
      legality
    });
  }

  const efficiencyRatio = shortestRequiredRoute.distanceMeters / userRouteDistanceMeters;
  const scorePercent = Math.min(roundToOneDecimal(efficiencyRatio * 100), 100);
  const passed = scorePercent >= passThresholdPercent;

  return result({
    passed,
    automaticFail: false,
    scorePercent,
    efficiencyRatio,
    userRouteDistanceMeters,
    shortestLegalRouteDistanceMeters: shortestRequiredRoute.distanceMeters,
    passThresholdPercent,
    failureReasons: passed ? [] : ["below_efficiency_threshold"],
    legality
  });
}
