import {
  buildMapGraph,
  findShortestLegalRoute,
  findShortestLegalRouteThroughStops,
  type MapGraph,
  type RouteExercise,
  type RouteExerciseDifficulty
} from "../../../lib/map-engine/index.ts";
import type { RealLondonPilotRouteType, RouteRunnerMapOption } from "./routeRunnerMaps.ts";

export type RouteExerciseCandidateReviewStatus = "needs-review" | "rejected";

export type RouteExerciseCandidateReasonCode =
  | "candidate:legal-route"
  | "candidate:checkpoint-route"
  | "candidate:one-way-awareness"
  | "candidate:distance-easy"
  | "candidate:distance-medium"
  | "candidate:distance-hard";

export type RouteExerciseCandidateRejectionReasonCode =
  | "candidate:duplicate-official-exercise"
  | "candidate:duplicate-pair"
  | "candidate:missing-start-node"
  | "candidate:missing-destination-node"
  | "candidate:same-start-destination"
  | "candidate:trivial-route"
  | "candidate:unreachable-route";

export type RouteExerciseCandidateWarningCode =
  | "candidate:long-route"
  | "candidate:no-checkpoint-variation"
  | "candidate:short-route";

export type RouteExerciseCandidateNodePair = {
  startNodeId: string;
  destinationNodeId: string;
  checkpointNodeIds?: string[];
};

export type RouteExerciseCandidate = {
  candidateId: string;
  mapId: string;
  startNodeId: string;
  destinationNodeId: string;
  checkpointNodeIds: string[];
  estimatedDistanceMeters: number | null;
  fastestRouteEdgeCount: number;
  difficulty: RouteExerciseDifficulty | null;
  routeType: RealLondonPilotRouteType | null;
  reviewStatus: RouteExerciseCandidateReviewStatus;
  reasonCodes: RouteExerciseCandidateReasonCode[];
  notes: string[];
  rejectionReasonCodes: RouteExerciseCandidateRejectionReasonCode[];
  warningCodes: RouteExerciseCandidateWarningCode[];
  routeEdgeIds: string[];
  routeNodeIds: string[];
};

export type RouteExerciseCandidateReasonCount<TReasonCode extends string> = {
  reasonCode: TReasonCode;
  count: number;
};

export type RouteExerciseCandidateReviewReport = {
  mapId: string;
  mapVersion: string | null;
  totalCandidatesConsidered: number;
  acceptedCandidateCount: number;
  rejectedCandidateCount: number;
  hasReviewableCandidates: boolean;
  acceptedCandidates: RouteExerciseCandidate[];
  rejectedCandidates: RouteExerciseCandidate[];
  rejectionReasonCounts: RouteExerciseCandidateReasonCount<RouteExerciseCandidateRejectionReasonCode>[];
  warningReasonCounts: RouteExerciseCandidateReasonCount<RouteExerciseCandidateWarningCode>[];
};

export type BuildRouteExerciseCandidateReviewInput = {
  mapOption: RouteRunnerMapOption;
  maxCandidates?: number;
  candidateNodePairs?: RouteExerciseCandidateNodePair[];
};

const DEFAULT_MAX_REVIEW_CANDIDATES = 6;
const MIN_REVIEWABLE_DISTANCE_METERS = 25;
const EASY_DISTANCE_LIMIT_METERS = 250;
const MEDIUM_DISTANCE_LIMIT_METERS = 700;
const LONG_ROUTE_WARNING_METERS = 1_200;
const MAX_DEFAULT_PAIR_SCAN_MULTIPLIER = 35;
const DEFAULT_PAIR_OFFSETS = [2, 5, 9, 14, 21, 34, 55, 89] as const;

export function buildRouteExerciseCandidateReviewReport(
  input: BuildRouteExerciseCandidateReviewInput
): RouteExerciseCandidateReviewReport {
  const maxCandidates = Math.max(0, Math.floor(input.maxCandidates ?? DEFAULT_MAX_REVIEW_CANDIDATES));
  const graph = buildMapGraph(input.mapOption.map);
  const officialPairs = buildOfficialExercisePairSet(input.mapOption.exercises);
  const seenPairs = new Set<string>();
  const acceptedCandidates: RouteExerciseCandidate[] = [];
  const rejectedCandidates: RouteExerciseCandidate[] = [];
  const nodePairs =
    input.candidateNodePairs ??
    buildDefaultCandidateNodePairs({
      graph,
      maxPairs: Math.max(DEFAULT_PAIR_OFFSETS.length, maxCandidates * MAX_DEFAULT_PAIR_SCAN_MULTIPLIER)
    });

  for (const pair of nodePairs) {
    if (acceptedCandidates.length >= maxCandidates) {
      break;
    }

    const sequence = acceptedCandidates.length + rejectedCandidates.length + 1;
    const candidate = evaluateCandidateNodePair({
      graph,
      mapOption: input.mapOption,
      pair,
      sequence,
      officialPairs,
      seenPairs
    });

    if (candidate.reviewStatus === "needs-review") {
      acceptedCandidates.push(candidate);
    } else {
      rejectedCandidates.push(candidate);
    }
  }

  return {
    mapId: input.mapOption.map.id,
    mapVersion: input.mapOption.map.mapVersion ?? null,
    totalCandidatesConsidered: acceptedCandidates.length + rejectedCandidates.length,
    acceptedCandidateCount: acceptedCandidates.length,
    rejectedCandidateCount: rejectedCandidates.length,
    hasReviewableCandidates: acceptedCandidates.length > 0,
    acceptedCandidates,
    rejectedCandidates,
    rejectionReasonCounts: countReasonCodes(rejectedCandidates.flatMap((candidate) => candidate.rejectionReasonCodes)),
    warningReasonCounts: countReasonCodes(acceptedCandidates.flatMap((candidate) => candidate.warningCodes))
  };
}

function evaluateCandidateNodePair(input: {
  graph: MapGraph;
  mapOption: RouteRunnerMapOption;
  pair: RouteExerciseCandidateNodePair;
  sequence: number;
  officialPairs: Set<string>;
  seenPairs: Set<string>;
}): RouteExerciseCandidate {
  const checkpointNodeIds = [...(input.pair.checkpointNodeIds ?? [])].sort();
  const pairKey = routePairKey(input.pair.startNodeId, input.pair.destinationNodeId, checkpointNodeIds);
  const candidateId = buildCandidateId(input.mapOption.map.id, input.sequence, input.pair);
  const baseCandidate = buildBaseCandidate({
    candidateId,
    mapId: input.mapOption.map.id,
    pair: input.pair,
    checkpointNodeIds
  });

  const rejectionReasonCodes = validateCandidatePairReferences(input.graph, input.pair);

  if (input.seenPairs.has(pairKey)) {
    rejectionReasonCodes.push("candidate:duplicate-pair");
  }

  input.seenPairs.add(pairKey);

  if (input.officialPairs.has(pairKey) || input.officialPairs.has(routePairKey(input.pair.startNodeId, input.pair.destinationNodeId))) {
    rejectionReasonCodes.push("candidate:duplicate-official-exercise");
  }

  if (rejectionReasonCodes.length > 0) {
    return rejectCandidate(baseCandidate, rejectionReasonCodes);
  }

  const route =
    checkpointNodeIds.length > 0
      ? findShortestLegalRouteThroughStops({
          graph: input.graph,
          stopNodeIds: [input.pair.startNodeId, ...checkpointNodeIds, input.pair.destinationNodeId],
          restrictions: input.mapOption.map.restrictions
        })
      : findShortestLegalRoute({
          graph: input.graph,
          startNodeId: input.pair.startNodeId,
          endNodeId: input.pair.destinationNodeId,
          restrictions: input.mapOption.map.restrictions
        });

  if (!route.found) {
    return rejectCandidate(baseCandidate, ["candidate:unreachable-route"]);
  }

  if (route.edgeIds.length === 0 || route.distanceMeters < MIN_REVIEWABLE_DISTANCE_METERS) {
    return rejectCandidate(
      {
        ...baseCandidate,
        estimatedDistanceMeters: roundDistance(route.distanceMeters),
        routeEdgeIds: route.edgeIds,
        routeNodeIds: route.nodeIds
      },
      ["candidate:trivial-route"]
    );
  }

  const routeType = classifyCandidateRouteType(input.graph, route.edgeIds, checkpointNodeIds);
  const difficulty = estimateCandidateDifficulty(route.distanceMeters);
  const reasonCodes = buildCandidateReasonCodes({
    routeType,
    difficulty
  });
  const warningCodes = buildCandidateWarningCodes({
    routeType,
    distanceMeters: route.distanceMeters
  });

  return {
    ...baseCandidate,
    estimatedDistanceMeters: roundDistance(route.distanceMeters),
    fastestRouteEdgeCount: route.edgeIds.length,
    difficulty,
    routeType,
    reviewStatus: "needs-review",
    reasonCodes,
    notes: buildCandidateNotes({ difficulty, routeType, edgeCount: route.edgeIds.length }),
    rejectionReasonCodes: [],
    warningCodes,
    routeEdgeIds: route.edgeIds,
    routeNodeIds: route.nodeIds
  };
}

function buildBaseCandidate(input: {
  candidateId: string;
  mapId: string;
  pair: RouteExerciseCandidateNodePair;
  checkpointNodeIds: string[];
}): RouteExerciseCandidate {
  return {
    candidateId: input.candidateId,
    mapId: input.mapId,
    startNodeId: input.pair.startNodeId,
    destinationNodeId: input.pair.destinationNodeId,
    checkpointNodeIds: input.checkpointNodeIds,
    estimatedDistanceMeters: null,
    fastestRouteEdgeCount: 0,
    difficulty: null,
    routeType: null,
    reviewStatus: "rejected",
    reasonCodes: [],
    notes: [],
    rejectionReasonCodes: [],
    warningCodes: [],
    routeEdgeIds: [],
    routeNodeIds: []
  };
}

function rejectCandidate(
  candidate: RouteExerciseCandidate,
  rejectionReasonCodes: RouteExerciseCandidateRejectionReasonCode[]
): RouteExerciseCandidate {
  return {
    ...candidate,
    reviewStatus: "rejected",
    rejectionReasonCodes: stableUnique(rejectionReasonCodes)
  };
}

function validateCandidatePairReferences(
  graph: MapGraph,
  pair: RouteExerciseCandidateNodePair
): RouteExerciseCandidateRejectionReasonCode[] {
  const rejectionReasonCodes: RouteExerciseCandidateRejectionReasonCode[] = [];

  if (!graph.nodesById[pair.startNodeId]) {
    rejectionReasonCodes.push("candidate:missing-start-node");
  }

  if (!graph.nodesById[pair.destinationNodeId]) {
    rejectionReasonCodes.push("candidate:missing-destination-node");
  }

  if (pair.startNodeId === pair.destinationNodeId) {
    rejectionReasonCodes.push("candidate:same-start-destination");
  }

  return rejectionReasonCodes;
}

function buildDefaultCandidateNodePairs(input: {
  graph: MapGraph;
  maxPairs: number;
}): RouteExerciseCandidateNodePair[] {
  const nodeIds = Object.keys(input.graph.nodesById)
    .filter((nodeId) => {
      const outgoingCount = input.graph.outgoingEdgesByNodeId[nodeId]?.length ?? 0;
      const incomingCount = input.graph.incomingEdgesByNodeId[nodeId]?.length ?? 0;

      return outgoingCount > 0 && incomingCount > 0;
    })
    .sort();
  const pairs: RouteExerciseCandidateNodePair[] = [];

  if (nodeIds.length < 2) {
    return pairs;
  }

  for (let startIndex = 0; startIndex < nodeIds.length && pairs.length < input.maxPairs; startIndex += 1) {
    for (const offset of DEFAULT_PAIR_OFFSETS) {
      if (pairs.length >= input.maxPairs) {
        break;
      }

      const destinationIndex = (startIndex + offset) % nodeIds.length;

      if (destinationIndex === startIndex) {
        continue;
      }

      const startNodeId = nodeIds[startIndex];
      const destinationNodeId = nodeIds[destinationIndex];
      const directRoute = findShortestLegalRoute({
        graph: input.graph,
        startNodeId,
        endNodeId: destinationNodeId
      });

      if (directRoute.found && directRoute.nodeIds.length >= 5 && pairs.length % 3 === 1) {
        const checkpointNodeIds = [directRoute.nodeIds[Math.floor(directRoute.nodeIds.length / 2)]];

        pairs.push({
          startNodeId,
          destinationNodeId,
          checkpointNodeIds
        });
      } else {
        pairs.push({
          startNodeId,
          destinationNodeId
        });
      }
    }
  }

  return pairs;
}

function buildOfficialExercisePairSet(exercises: readonly RouteExercise[]): Set<string> {
  const officialPairs = new Set<string>();

  for (const exercise of exercises) {
    const nodeStopIds = exercise.stops
      .filter((stop): stop is Extract<(typeof exercise.stops)[number], { type: "node" }> => stop.type === "node")
      .map((stop) => stop.nodeId);

    if (nodeStopIds.length >= 2) {
      officialPairs.add(routePairKey(nodeStopIds[0], nodeStopIds[nodeStopIds.length - 1], nodeStopIds.slice(1, -1)));
      officialPairs.add(routePairKey(nodeStopIds[0], nodeStopIds[nodeStopIds.length - 1]));
    }
  }

  return officialPairs;
}

function routePairKey(startNodeId: string, destinationNodeId: string, checkpointNodeIds: readonly string[] = []): string {
  return [startNodeId, ...checkpointNodeIds, destinationNodeId].join(">");
}

function buildCandidateId(mapId: string, sequence: number, pair: RouteExerciseCandidateNodePair): string {
  const checkpointSuffix =
    pair.checkpointNodeIds && pair.checkpointNodeIds.length > 0 ? `-via-${pair.checkpointNodeIds.join("-")}` : "";

  return `${mapId}-candidate-${String(sequence).padStart(3, "0")}-${pair.startNodeId}-to-${pair.destinationNodeId}${checkpointSuffix}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function classifyCandidateRouteType(
  graph: MapGraph,
  edgeIds: readonly string[],
  checkpointNodeIds: readonly string[]
): RealLondonPilotRouteType {
  if (checkpointNodeIds.length >= 2) {
    return "multi-stop";
  }

  if (checkpointNodeIds.length === 1) {
    return "checkpoint";
  }

  const usesOneWayRoad = edgeIds.some((edgeId) => {
    const edge = graph.edgesById[edgeId];
    const road = edge ? graph.roadsById[edge.roadId] : null;

    return road?.isOneWay === true;
  });

  return usesOneWayRoad ? "one-way-awareness" : "direct";
}

function estimateCandidateDifficulty(distanceMeters: number): RouteExerciseDifficulty {
  if (distanceMeters < EASY_DISTANCE_LIMIT_METERS) {
    return "easy";
  }

  if (distanceMeters < MEDIUM_DISTANCE_LIMIT_METERS) {
    return "medium";
  }

  return "hard";
}

function buildCandidateReasonCodes(input: {
  routeType: RealLondonPilotRouteType;
  difficulty: RouteExerciseDifficulty;
}): RouteExerciseCandidateReasonCode[] {
  const reasonCodes: RouteExerciseCandidateReasonCode[] = ["candidate:legal-route"];

  if (input.routeType === "checkpoint" || input.routeType === "multi-stop") {
    reasonCodes.push("candidate:checkpoint-route");
  }

  if (input.routeType === "one-way-awareness") {
    reasonCodes.push("candidate:one-way-awareness");
  }

  if (input.difficulty === "easy") {
    reasonCodes.push("candidate:distance-easy");
  } else if (input.difficulty === "medium") {
    reasonCodes.push("candidate:distance-medium");
  } else {
    reasonCodes.push("candidate:distance-hard");
  }

  return reasonCodes;
}

function buildCandidateWarningCodes(input: {
  routeType: RealLondonPilotRouteType;
  distanceMeters: number;
}): RouteExerciseCandidateWarningCode[] {
  const warningCodes: RouteExerciseCandidateWarningCode[] = [];

  if (input.distanceMeters < EASY_DISTANCE_LIMIT_METERS && input.routeType === "direct") {
    warningCodes.push("candidate:short-route");
  }

  if (input.distanceMeters > LONG_ROUTE_WARNING_METERS) {
    warningCodes.push("candidate:long-route");
  }

  if (input.routeType === "direct") {
    warningCodes.push("candidate:no-checkpoint-variation");
  }

  return warningCodes;
}

function buildCandidateNotes(input: {
  difficulty: RouteExerciseDifficulty;
  routeType: RealLondonPilotRouteType;
  edgeCount: number;
}): string[] {
  return [
    `${input.difficulty} ${input.routeType} candidate generated from committed map data`,
    `${input.edgeCount} legal directed edges in the fastest route`
  ];
}

function roundDistance(distanceMeters: number): number {
  return Math.round(distanceMeters * 100) / 100;
}

function countReasonCodes<TReasonCode extends string>(reasonCodes: TReasonCode[]): RouteExerciseCandidateReasonCount<TReasonCode>[] {
  const counts = new Map<TReasonCode, number>();

  for (const reasonCode of reasonCodes) {
    counts.set(reasonCode, (counts.get(reasonCode) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([reasonCode, count]) => ({ reasonCode, count }));
}

function stableUnique<TValue extends string>(values: TValue[]): TValue[] {
  return Array.from(new Set(values)).sort();
}
