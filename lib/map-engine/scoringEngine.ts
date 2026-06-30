import { buildMapGraph } from "./graph.ts";
import {
  checkRouteLegality,
  type AttemptedRouteMovement,
  type IllegalMovement,
  type LegalityCheckResult
} from "./legalityEngine.ts";
import { findShortestLegalRoute } from "./shortestRoute.ts";
import type { MapDefinition, MapGraph } from "./types.ts";

export type RoutePassStatus = "pass" | "fail";

export type RouteEfficiencyGrade = "excellent" | "very_good" | "pass" | "fail" | "automatic_fail";

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
  minimumLegScorePercent?: number;
};

export type RouteEfficiencyScoreInput = {
  shortestLegalRouteDistanceMeters: number;
  userRouteDistanceMeters: number;
  passThresholdPercent?: number;
  isLegal?: boolean;
  automaticFail?: boolean;
  failureReason?: RouteScoringFailureReason;
};

export type RouteEfficiencyScoreResult = {
  passed: boolean;
  automaticFail: boolean;
  scorePercent: number;
  efficiencyRatio: number;
  grade: RouteEfficiencyGrade;
  gradeLabel: string;
  explanation: string;
  passThresholdPercent: number;
  failureReason?: RouteScoringFailureReason;
};

export type RouteScoringLegResult = {
  legIndex: number;
  fromNodeId: string;
  toNodeId: string;
  userRouteDistanceMeters: number;
  shortestLegalRouteDistanceMeters: number;
  extraDistanceMeters: number;
  scorePercent: number;
  efficiencyRatio: number;
  grade: RouteEfficiencyGrade;
  gradeLabel: string;
  passed: boolean;
  automaticFail: boolean;
  isLegal: boolean;
  failureReasons: RouteScoringFailureReason[];
  failureReason?: RouteScoringFailureReason;
  violations: IllegalMovement[];
  movementStartIndex?: number;
  movementEndIndex?: number;
  minimumLegScorePercent?: number;
  meetsMinimumLegScore?: boolean;
};

export type RouteScoringResult = {
  passed: boolean;
  automaticFail: boolean;
  status: RoutePassStatus;
  isLegal: boolean;
  scorePercent: number;
  efficiencyRatio: number;
  scoreRatio: number;
  grade: RouteEfficiencyGrade;
  gradeLabel: string;
  scoringExplanation: string;
  userRouteDistanceMeters: number;
  shortestLegalRouteDistanceMeters: number;
  userDistanceMeters: number;
  shortestLegalDistanceMeters: number;
  extraDistanceMeters: number;
  passThresholdPercent: number;
  thresholdPercent: number;
  legBreakdown: RouteScoringLegResult[];
  failureReasons: RouteScoringFailureReason[];
  failureReason?: RouteScoringFailureReason;
  legality: LegalityCheckResult;
};

export type RouteScoreFailureReason = RouteScoringFailureReason;
export type ScoreRouteAttemptInput = RouteScoringInput;
export type RouteScoreResult = RouteScoringResult;

const DEFAULT_ROUTE_PASS_THRESHOLD_PERCENT = 80;
const LEGAL_PASS_EXPLANATION = "Your route was legal and within the pass threshold.";
const LEGAL_TOO_LONG_EXPLANATION = "Your route was legal but too long.";
const ILLEGAL_ROUTE_EXPLANATION = "Your route failed because it used a restricted movement.";
const ZERO_DISTANCE_EXPLANATION = "Your route could not be scored because it has no usable distance.";
const NO_SHORTEST_ROUTE_EXPLANATION = "This route could not be scored because no valid shortest legal route was found.";
const REQUIRED_STOPS_EXPLANATION = "Your route could not be scored because it did not follow the required stops.";

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

type ShortestRouteLegResult = {
  legIndex: number;
  fromNodeId: string;
  toNodeId: string;
  found: boolean;
  distanceMeters: number;
};

function calculateShortestRequiredRouteLegs(input: {
  graph: MapGraph;
  restrictions: MapDefinition["restrictions"];
  requiredStopNodeIds: string[];
}): { found: boolean; distanceMeters: number; legs: ShortestRouteLegResult[] } {
  const legs = input.requiredStopNodeIds.slice(0, -1).map((fromNodeId, index) => {
    const toNodeId = input.requiredStopNodeIds[index + 1];
    const route = findShortestLegalRoute({
      graph: input.graph,
      startNodeId: fromNodeId,
      endNodeId: toNodeId,
      restrictions: input.restrictions
    });

    return {
      legIndex: index,
      fromNodeId,
      toNodeId,
      found: route.found && route.distanceMeters > 0,
      distanceMeters: route.found && route.distanceMeters > 0 ? route.distanceMeters : 0
    };
  });

  return {
    found: legs.every((leg) => leg.found),
    distanceMeters: legs.reduce((total, leg) => total + leg.distanceMeters, 0),
    legs
  };
}

function orderedRequiredStopVisitIndexes(
  visitedNodeIds: string[],
  requiredStopNodeIds: string[]
): Array<number | undefined> {
  const visitIndexes: Array<number | undefined> = Array.from({ length: requiredStopNodeIds.length }, () => undefined);

  if (visitedNodeIds[0] !== requiredStopNodeIds[0]) {
    return visitIndexes;
  }

  visitIndexes[0] = 0;

  let searchStartIndex = 1;

  for (let requiredStopIndex = 1; requiredStopIndex < requiredStopNodeIds.length; requiredStopIndex += 1) {
    const foundIndex = visitedNodeIds.findIndex(
      (nodeId, visitedIndex) => visitedIndex >= searchStartIndex && nodeId === requiredStopNodeIds[requiredStopIndex]
    );

    if (foundIndex === -1) {
      break;
    }

    visitIndexes[requiredStopIndex] = foundIndex;
    searchStartIndex = foundIndex + 1;
  }

  return visitIndexes;
}

function illegalMovementsForMovementRange(
  illegalMovements: IllegalMovement[],
  movementStartIndex: number | undefined,
  movementEndIndex: number | undefined
): IllegalMovement[] {
  if (movementStartIndex === undefined || movementEndIndex === undefined) {
    return [];
  }

  return illegalMovements.filter(
    (movement) => movement.movementIndex >= movementStartIndex && movement.movementIndex <= movementEndIndex
  );
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function routeEfficiencyGrade(scorePercent: number, automaticFail: boolean): RouteEfficiencyGrade {
  if (automaticFail) {
    return "automatic_fail";
  }

  if (scorePercent >= 95) {
    return "excellent";
  }

  if (scorePercent >= 90) {
    return "very_good";
  }

  if (scorePercent >= DEFAULT_ROUTE_PASS_THRESHOLD_PERCENT) {
    return "pass";
  }

  return "fail";
}

function routeEfficiencyGradeLabel(grade: RouteEfficiencyGrade): string {
  if (grade === "automatic_fail") {
    return "Automatic fail";
  }

  if (grade === "excellent") {
    return "Excellent";
  }

  if (grade === "very_good") {
    return "Very good";
  }

  if (grade === "pass") {
    return "Pass";
  }

  return "Fail";
}

function explanationForFailureReason(reason: RouteScoringFailureReason | undefined): string {
  if (reason === "illegal_route") {
    return ILLEGAL_ROUTE_EXPLANATION;
  }

  if (reason === "zero_distance_route") {
    return ZERO_DISTANCE_EXPLANATION;
  }

  if (reason === "no_valid_shortest_route") {
    return NO_SHORTEST_ROUTE_EXPLANATION;
  }

  if (reason === "wrong_start" || reason === "wrong_destination" || reason === "missed_required_stop") {
    return REQUIRED_STOPS_EXPLANATION;
  }

  return LEGAL_TOO_LONG_EXPLANATION;
}

export function calculateRouteEfficiencyScore(input: RouteEfficiencyScoreInput): RouteEfficiencyScoreResult {
  const passThresholdPercent = input.passThresholdPercent ?? DEFAULT_ROUTE_PASS_THRESHOLD_PERCENT;
  const automaticFail = input.automaticFail === true || input.isLegal === false || input.failureReason === "illegal_route";
  const primaryFailureReason = automaticFail ? "illegal_route" : input.failureReason;
  const shortestDistance = input.shortestLegalRouteDistanceMeters;
  const userDistance = input.userRouteDistanceMeters;

  if (automaticFail) {
    return {
      passed: false,
      automaticFail: true,
      scorePercent: 0,
      efficiencyRatio: 0,
      grade: "automatic_fail",
      gradeLabel: routeEfficiencyGradeLabel("automatic_fail"),
      explanation: ILLEGAL_ROUTE_EXPLANATION,
      passThresholdPercent,
      failureReason: "illegal_route"
    };
  }

  if (primaryFailureReason && primaryFailureReason !== "below_efficiency_threshold") {
    const grade = routeEfficiencyGrade(0, false);

    return {
      passed: false,
      automaticFail: false,
      scorePercent: 0,
      efficiencyRatio: 0,
      grade,
      gradeLabel: routeEfficiencyGradeLabel(grade),
      explanation: explanationForFailureReason(primaryFailureReason),
      passThresholdPercent,
      failureReason: primaryFailureReason
    };
  }

  if (!Number.isFinite(userDistance) || userDistance <= 0) {
    const grade = routeEfficiencyGrade(0, false);

    return {
      passed: false,
      automaticFail: false,
      scorePercent: 0,
      efficiencyRatio: 0,
      grade,
      gradeLabel: routeEfficiencyGradeLabel(grade),
      explanation: ZERO_DISTANCE_EXPLANATION,
      passThresholdPercent,
      failureReason: "zero_distance_route"
    };
  }

  if (!Number.isFinite(shortestDistance) || shortestDistance <= 0) {
    const grade = routeEfficiencyGrade(0, false);

    return {
      passed: false,
      automaticFail: false,
      scorePercent: 0,
      efficiencyRatio: 0,
      grade,
      gradeLabel: routeEfficiencyGradeLabel(grade),
      explanation: NO_SHORTEST_ROUTE_EXPLANATION,
      passThresholdPercent,
      failureReason: "no_valid_shortest_route"
    };
  }

  const efficiencyRatio = Math.min(1, Math.max(0, shortestDistance / userDistance));
  const scorePercent = Math.min(roundToOneDecimal(efficiencyRatio * 100), 100);
  const passed = scorePercent >= passThresholdPercent;
  const grade = routeEfficiencyGrade(scorePercent, false);

  return {
    passed,
    automaticFail: false,
    scorePercent,
    efficiencyRatio,
    grade,
    gradeLabel: routeEfficiencyGradeLabel(grade),
    explanation: passed ? LEGAL_PASS_EXPLANATION : LEGAL_TOO_LONG_EXPLANATION,
    passThresholdPercent,
    failureReason: passed ? undefined : "below_efficiency_threshold"
  };
}

function result(input: {
  score: RouteEfficiencyScoreResult;
  userRouteDistanceMeters: number;
  shortestLegalRouteDistanceMeters: number;
  legBreakdown: RouteScoringLegResult[];
  failureReasons: RouteScoringFailureReason[];
  legality: LegalityCheckResult;
}): RouteScoringResult {
  return {
    passed: input.score.passed,
    automaticFail: input.score.automaticFail,
    status: input.score.passed ? "pass" : "fail",
    isLegal: input.legality.isLegal,
    scorePercent: input.score.scorePercent,
    efficiencyRatio: input.score.efficiencyRatio,
    scoreRatio: input.score.efficiencyRatio,
    grade: input.score.grade,
    gradeLabel: input.score.gradeLabel,
    scoringExplanation: input.score.explanation,
    userRouteDistanceMeters: input.userRouteDistanceMeters,
    shortestLegalRouteDistanceMeters: input.shortestLegalRouteDistanceMeters,
    userDistanceMeters: input.userRouteDistanceMeters,
    shortestLegalDistanceMeters: input.shortestLegalRouteDistanceMeters,
    extraDistanceMeters: Math.max(0, input.userRouteDistanceMeters - input.shortestLegalRouteDistanceMeters),
    passThresholdPercent: input.score.passThresholdPercent,
    thresholdPercent: input.score.passThresholdPercent,
    legBreakdown: input.legBreakdown,
    failureReasons: input.failureReasons,
    failureReason: input.failureReasons[0],
    legality: input.legality
  };
}

function calculateRouteLegBreakdown(input: {
  graph: MapGraph;
  movements: AttemptedRouteMovement[];
  requiredStopNodeIds: string[];
  shortestLegs: ShortestRouteLegResult[];
  legality: LegalityCheckResult;
  passThresholdPercent: number;
  minimumLegScorePercent?: number;
}): RouteScoringLegResult[] {
  const visitedNodeIds = movementNodeSequence(input.movements);
  const visitIndexes = orderedRequiredStopVisitIndexes(visitedNodeIds, input.requiredStopNodeIds);

  return input.shortestLegs.map((shortestLeg) => {
    const startVisitIndex = visitIndexes[shortestLeg.legIndex];
    const endVisitIndex = visitIndexes[shortestLeg.legIndex + 1];
    const hasUserLeg = startVisitIndex !== undefined && endVisitIndex !== undefined && endVisitIndex > startVisitIndex;
    const movementStartIndex = hasUserLeg ? startVisitIndex : undefined;
    const movementEndIndex = hasUserLeg ? endVisitIndex - 1 : undefined;
    const legMovements = hasUserLeg ? input.movements.slice(startVisitIndex, endVisitIndex) : [];
    const userRouteDistanceMeters = calculateUserRouteDistanceMeters(input.graph, legMovements);
    const violations = illegalMovementsForMovementRange(
      input.legality.illegalMovements,
      movementStartIndex,
      movementEndIndex
    );
    const failureReasons: RouteScoringFailureReason[] = [];

    if (violations.length > 0) {
      failureReasons.push("illegal_route");
    }

    if (!hasUserLeg) {
      failureReasons.push("missed_required_stop");
    }

    if (!shortestLeg.found) {
      failureReasons.push("no_valid_shortest_route");
    }

    const score = calculateRouteEfficiencyScore({
      shortestLegalRouteDistanceMeters: shortestLeg.distanceMeters,
      userRouteDistanceMeters,
      passThresholdPercent: input.passThresholdPercent,
      isLegal: violations.length === 0,
      automaticFail: violations.length > 0,
      failureReason: failureReasons[0]
    });

    if (score.failureReason === "below_efficiency_threshold" && !failureReasons.includes("below_efficiency_threshold")) {
      failureReasons.push("below_efficiency_threshold");
    }

    return {
      legIndex: shortestLeg.legIndex,
      fromNodeId: shortestLeg.fromNodeId,
      toNodeId: shortestLeg.toNodeId,
      userRouteDistanceMeters,
      shortestLegalRouteDistanceMeters: shortestLeg.distanceMeters,
      extraDistanceMeters: Math.max(0, userRouteDistanceMeters - shortestLeg.distanceMeters),
      scorePercent: score.scorePercent,
      efficiencyRatio: score.efficiencyRatio,
      grade: score.grade,
      gradeLabel: score.gradeLabel,
      passed: score.passed,
      automaticFail: score.automaticFail,
      isLegal: violations.length === 0,
      failureReasons,
      failureReason: failureReasons[0],
      violations,
      movementStartIndex,
      movementEndIndex,
      minimumLegScorePercent: input.minimumLegScorePercent,
      meetsMinimumLegScore:
        input.minimumLegScorePercent === undefined ? undefined : score.scorePercent >= input.minimumLegScorePercent
    };
  });
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
  const shortestRequiredRoute = calculateShortestRequiredRouteLegs({
    graph,
    restrictions: input.map.restrictions,
    requiredStopNodeIds: input.requiredStopNodeIds
  });
  const legBreakdown = calculateRouteLegBreakdown({
    graph,
    movements: input.movements,
    requiredStopNodeIds: input.requiredStopNodeIds,
    shortestLegs: shortestRequiredRoute.legs,
    legality,
    passThresholdPercent,
    minimumLegScorePercent: input.minimumLegScorePercent
  });

  if (legality.automaticFail) {
    const score = calculateRouteEfficiencyScore({
      shortestLegalRouteDistanceMeters: shortestRequiredRoute.found ? shortestRequiredRoute.distanceMeters : 0,
      userRouteDistanceMeters,
      passThresholdPercent,
      isLegal: false,
      automaticFail: true,
      failureReason: "illegal_route"
    });

    return result({
      score,
      userRouteDistanceMeters,
      shortestLegalRouteDistanceMeters: shortestRequiredRoute.found ? shortestRequiredRoute.distanceMeters : 0,
      legBreakdown,
      failureReasons: ["illegal_route"],
      legality
    });
  }

  const failureReasons = requiredStopFailureReasons(input.movements, input.requiredStopNodeIds);

  if (userRouteDistanceMeters <= 0) {
    failureReasons.push("zero_distance_route");
  }

  if (!shortestRequiredRoute.found) {
    failureReasons.push("no_valid_shortest_route");
  }

  if (failureReasons.length > 0) {
    const score = calculateRouteEfficiencyScore({
      shortestLegalRouteDistanceMeters: shortestRequiredRoute.found ? shortestRequiredRoute.distanceMeters : 0,
      userRouteDistanceMeters,
      passThresholdPercent,
      isLegal: true,
      automaticFail: false,
      failureReason: failureReasons[0]
    });

    return result({
      score,
      userRouteDistanceMeters,
      shortestLegalRouteDistanceMeters: shortestRequiredRoute.found ? shortestRequiredRoute.distanceMeters : 0,
      legBreakdown,
      failureReasons,
      legality
    });
  }

  const score = calculateRouteEfficiencyScore({
    shortestLegalRouteDistanceMeters: shortestRequiredRoute.distanceMeters,
    userRouteDistanceMeters,
    passThresholdPercent,
    isLegal: true,
    automaticFail: false
  });

  return result({
    score,
    userRouteDistanceMeters,
    shortestLegalRouteDistanceMeters: shortestRequiredRoute.distanceMeters,
    legBreakdown,
    failureReasons: score.passed ? [] : ["below_efficiency_threshold"],
    legality
  });
}
