import { buildMapGraph } from "./graph.ts";
import {
  buildRoadSpatialIndex,
  findCandidateRoadsForPoint,
  type RoadCandidate,
  type Vec2
} from "./geometry.ts";
import type { MapDefinition, MapGraph, MapRoad } from "./types.ts";

export type CandidateRoadMatch = {
  pointIndex: number;
  roadId: string;
  directedEdgeId?: string | null;
  snappedPoint: Vec2;
  distanceFromRoad: number;
  confidence: number;
  selected: boolean;
};

export type SnappedRoutePoint = {
  originalPoint: Vec2;
  snappedPoint: Vec2;
  roadId: string | null;
  directedEdgeId?: string | null;
  distanceFromRoad: number;
  confidence: number;
  candidates: CandidateRoadMatch[];
};

export type RouteSnappingDiagnosticCode = "trace_too_short" | "off_road_points" | "disconnected_selected_roads";

export type RouteSnappingDiagnostic = {
  code: RouteSnappingDiagnosticCode;
  message: string;
  pointIndex?: number;
  fromRoadId?: string;
  toRoadId?: string;
};

export type RouteSnappingDisconnectedTransition = {
  fromRoadId: string;
  toRoadId: string;
  pointIndex?: number;
};

export type RouteSnappingCandidateDiagnostic = {
  pointIndex: number;
  roadId: string;
  distanceFromRoad: number;
  snappedPoint: Vec2;
  selected: boolean;
};

export type RouteSnappingConnectivityDiagnostics = {
  candidateCountsByPoint: number[];
  candidates: RouteSnappingCandidateDiagnostic[];
  selectedCandidates: RouteSnappingCandidateDiagnostic[];
  totalCost: number;
  usedDisconnectedPenalty: boolean;
};

export type RouteSnappingConnectivity = {
  selectedCandidateRoadIds: string[];
  collapsedRoadIds: string[];
  isContinuous: boolean;
  disconnectedTransitions: RouteSnappingDisconnectedTransition[];
  diagnostics: RouteSnappingConnectivityDiagnostics;
};

export type SnapDrawnRouteToRoadsInput = {
  points: readonly Vec2[];
  map: MapDefinition;
  snapTolerance?: number;
  maxCandidatesPerPoint?: number;
};

export type SnappedRouteTraceResult = {
  isValidTrace: boolean;
  hasOffRoadPoints: boolean;
  snapTolerance: number;
  snappedPoints: SnappedRoutePoint[];
  connectivity: RouteSnappingConnectivity;
  diagnostics: RouteSnappingDiagnostic[];
};

const DEFAULT_SNAP_TOLERANCE = 24;
const DEFAULT_MAX_CANDIDATES_PER_POINT = 5;
const CONNECTED_ROAD_CHANGE_PENALTY = 4;
const DISCONNECTED_ROAD_TRANSITION_PENALTY = 500;

function roundConfidence(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function confidenceForDistance(distanceFromRoad: number, snapTolerance: number): number {
  if (!Number.isFinite(distanceFromRoad) || snapTolerance <= 0) {
    return 0;
  }

  return roundConfidence(Math.max(0, Math.min(1, 1 - distanceFromRoad / snapTolerance)));
}

function directedEdgeIdForRoad(graph: MapGraph, roadId: string): string | null {
  return graph.edges.find((edge) => edge.roadId === roadId)?.id ?? null;
}

function emptyConnectivity(): RouteSnappingConnectivity {
  return {
    selectedCandidateRoadIds: [],
    collapsedRoadIds: [],
    isContinuous: true,
    disconnectedTransitions: [],
    diagnostics: {
      candidateCountsByPoint: [],
      candidates: [],
      selectedCandidates: [],
      totalCost: 0,
      usedDisconnectedPenalty: false
    }
  };
}

function candidateToMatch(
  graph: MapGraph,
  candidate: RoadCandidate,
  snapTolerance: number,
  pointIndex: number
): CandidateRoadMatch {
  return {
    pointIndex,
    roadId: candidate.roadId,
    directedEdgeId: directedEdgeIdForRoad(graph, candidate.roadId),
    snappedPoint: { ...candidate.projection.point },
    distanceFromRoad: candidate.distanceFromRoad,
    confidence: confidenceForDistance(candidate.distanceFromRoad, snapTolerance),
    selected: false
  };
}

function roadsShareNode(firstRoad: MapRoad | undefined, secondRoad: MapRoad | undefined): boolean {
  if (!firstRoad || !secondRoad) {
    return false;
  }

  return (
    firstRoad.fromNodeId === secondRoad.fromNodeId ||
    firstRoad.fromNodeId === secondRoad.toNodeId ||
    firstRoad.toNodeId === secondRoad.fromNodeId ||
    firstRoad.toNodeId === secondRoad.toNodeId
  );
}

function transitionPenalty(
  graph: MapGraph,
  previousCandidate: CandidateRoadMatch,
  nextCandidate: CandidateRoadMatch
): number {
  if (previousCandidate.roadId === nextCandidate.roadId) {
    return 0;
  }

  if (roadsShareNode(graph.roadsById[previousCandidate.roadId], graph.roadsById[nextCandidate.roadId])) {
    return CONNECTED_ROAD_CHANGE_PENALTY;
  }

  return DISCONNECTED_ROAD_TRANSITION_PENALTY;
}

type CandidatePathState = {
  candidate: CandidateRoadMatch;
  cost: number;
  previousIndex: number | null;
};

type CandidateSequenceSelection = {
  selectedCandidates: Array<CandidateRoadMatch | null>;
  totalCost: number;
};

function isBetterPath(candidate: CandidatePathState, currentBest: CandidatePathState | null): boolean {
  if (!currentBest) {
    return true;
  }

  const costDifference = candidate.cost - currentBest.cost;

  if (Math.abs(costDifference) > Number.EPSILON) {
    return costDifference < 0;
  }

  return candidate.candidate.roadId.localeCompare(currentBest.candidate.roadId) < 0;
}

function selectConnectedCandidateSequence(
  graph: MapGraph,
  candidateGroups: readonly CandidateRoadMatch[][]
): CandidateSequenceSelection {
  if (candidateGroups.length === 0) {
    return {
      selectedCandidates: [],
      totalCost: 0
    };
  }

  if (candidateGroups.some((candidates) => candidates.length === 0)) {
    const selectedCandidates = candidateGroups.map((candidates) => candidates[0] ?? null);

    return {
      selectedCandidates,
      totalCost: selectedCandidates.reduce(
        (sum, candidate) => sum + (candidate?.distanceFromRoad ?? 0),
        0
      )
    };
  }

  const stateGroups: CandidatePathState[][] = [];
  let previousStates = candidateGroups[0].map<CandidatePathState>((candidate) => ({
    candidate,
    cost: candidate.distanceFromRoad,
    previousIndex: null
  }));

  stateGroups.push(previousStates);

  for (let pointIndex = 1; pointIndex < candidateGroups.length; pointIndex += 1) {
    const currentStates = candidateGroups[pointIndex].map<CandidatePathState>((candidate) => {
      let bestState: CandidatePathState | null = null;

      previousStates.forEach((previousState, previousIndex) => {
        const candidateState: CandidatePathState = {
          candidate,
          cost:
            previousState.cost +
            candidate.distanceFromRoad +
            transitionPenalty(graph, previousState.candidate, candidate),
          previousIndex
        };

        if (isBetterPath(candidateState, bestState)) {
          bestState = candidateState;
        }
      });

      if (!bestState) {
        return {
          candidate,
          cost: candidate.distanceFromRoad,
          previousIndex: null
        };
      }

      return bestState;
    });

    stateGroups.push(currentStates);
    previousStates = currentStates;
  }

  let bestFinalIndex = 0;
  let bestFinalState: CandidatePathState | null = null;

  previousStates.forEach((state, index) => {
    if (isBetterPath(state, bestFinalState)) {
      bestFinalState = state;
      bestFinalIndex = index;
    }
  });

  const selectedCandidates: Array<CandidateRoadMatch | null> = Array.from({ length: candidateGroups.length }, () => null);
  let selectedIndex: number | null = bestFinalIndex;

  for (let pointIndex = stateGroups.length - 1; pointIndex >= 0; pointIndex -= 1) {
    if (selectedIndex === null) {
      break;
    }

    const state: CandidatePathState | undefined = stateGroups[pointIndex]?.[selectedIndex];

    if (!state) {
      break;
    }

    selectedCandidates[pointIndex] = state.candidate;
    selectedIndex = state.previousIndex;
  }

  return {
    selectedCandidates,
    totalCost: previousStates[bestFinalIndex]?.cost ?? 0
  };
}

type CollapsedSelectedRoad = {
  roadId: string;
  pointIndex: number;
};

function collapseSelectedRoads(selectedCandidates: ReadonlyArray<CandidateRoadMatch | null>): CollapsedSelectedRoad[] {
  const collapsedRoads: CollapsedSelectedRoad[] = [];

  for (const candidate of selectedCandidates) {
    if (!candidate) {
      continue;
    }

    if (collapsedRoads[collapsedRoads.length - 1]?.roadId === candidate.roadId) {
      continue;
    }

    collapsedRoads.push({
      roadId: candidate.roadId,
      pointIndex: candidate.pointIndex
    });
  }

  return collapsedRoads;
}

function disconnectedTransitionsForRoads(
  graph: MapGraph,
  collapsedRoads: readonly CollapsedSelectedRoad[]
): RouteSnappingDisconnectedTransition[] {
  const disconnectedTransitions: RouteSnappingDisconnectedTransition[] = [];

  for (let index = 0; index < collapsedRoads.length - 1; index += 1) {
    const fromRoadId = collapsedRoads[index].roadId;
    const toRoadId = collapsedRoads[index + 1].roadId;

    if (!roadsShareNode(graph.roadsById[fromRoadId], graph.roadsById[toRoadId])) {
      disconnectedTransitions.push({
        fromRoadId,
        toRoadId,
        pointIndex: collapsedRoads[index + 1].pointIndex
      });
    }
  }

  return disconnectedTransitions;
}

function candidateDiagnostic(candidate: CandidateRoadMatch): RouteSnappingCandidateDiagnostic {
  return {
    pointIndex: candidate.pointIndex,
    roadId: candidate.roadId,
    distanceFromRoad: candidate.distanceFromRoad,
    snappedPoint: { ...candidate.snappedPoint },
    selected: candidate.selected
  };
}

function connectivityForSelection(input: {
  graph: MapGraph;
  candidateGroups: readonly CandidateRoadMatch[][];
  selectedCandidates: ReadonlyArray<CandidateRoadMatch | null>;
  totalCost: number;
}): RouteSnappingConnectivity {
  const collapsedRoads = collapseSelectedRoads(input.selectedCandidates);
  const disconnectedTransitions = disconnectedTransitionsForRoads(input.graph, collapsedRoads);
  const selectedCandidateRoadIds = input.selectedCandidates
    .map((candidate) => candidate?.roadId)
    .filter((roadId): roadId is string => Boolean(roadId));
  const candidates = input.candidateGroups.flatMap((candidateGroup) => candidateGroup.map(candidateDiagnostic));
  const selectedCandidates = input.selectedCandidates
    .filter((candidate): candidate is CandidateRoadMatch => Boolean(candidate))
    .map(candidateDiagnostic);

  return {
    selectedCandidateRoadIds,
    collapsedRoadIds: collapsedRoads.map((road) => road.roadId),
    isContinuous: disconnectedTransitions.length === 0,
    disconnectedTransitions,
    diagnostics: {
      candidateCountsByPoint: input.candidateGroups.map((candidateGroup) => candidateGroup.length),
      candidates,
      selectedCandidates,
      totalCost: input.totalCost,
      usedDisconnectedPenalty: disconnectedTransitions.length > 0
    }
  };
}

export function snapDrawnRouteToRoads(input: SnapDrawnRouteToRoadsInput): SnappedRouteTraceResult {
  const snapTolerance = input.snapTolerance ?? DEFAULT_SNAP_TOLERANCE;
  const maxCandidatesPerPoint = input.maxCandidatesPerPoint ?? DEFAULT_MAX_CANDIDATES_PER_POINT;
  const points = input.points.map((point) => ({ ...point }));
  const diagnostics: RouteSnappingDiagnostic[] = [];

  if (points.length < 2) {
    return {
      isValidTrace: false,
      hasOffRoadPoints: false,
      snapTolerance,
      snappedPoints: [],
      connectivity: emptyConnectivity(),
      diagnostics: [
        {
          code: "trace_too_short",
          message: "Draw at least two points before route snapping can be previewed."
        }
      ]
    };
  }

  const index = buildRoadSpatialIndex(input.map);
  const graph = buildMapGraph(input.map);
  const candidateGroups = points.map((point, pointIndex) => {
    const candidates = findCandidateRoadsForPoint({
      point,
      index,
      tolerance: snapTolerance,
      maxCandidates: maxCandidatesPerPoint
    }).map((candidate) => candidateToMatch(graph, candidate, snapTolerance, pointIndex));

    if (candidates.length === 0) {
      diagnostics.push({
        code: "off_road_points",
        message: "A drawn point is outside the road snap tolerance.",
        pointIndex
      });
    }

    return candidates;
  });
  const candidateSelection = selectConnectedCandidateSequence(graph, candidateGroups);
  const candidateGroupsWithSelection = candidateGroups.map((candidates, pointIndex) =>
    candidates.map((candidate) => ({
      ...candidate,
      snappedPoint: { ...candidate.snappedPoint },
      selected: candidateSelection.selectedCandidates[pointIndex] === candidate
    }))
  );
  const selectedCandidates = candidateGroupsWithSelection.map(
    (candidates) => candidates.find((candidate) => candidate.selected) ?? null
  );
  const connectivity = connectivityForSelection({
    graph,
    candidateGroups: candidateGroupsWithSelection,
    selectedCandidates,
    totalCost: candidateSelection.totalCost
  });

  for (const disconnectedTransition of connectivity.disconnectedTransitions) {
    diagnostics.push({
      code: "disconnected_selected_roads",
      message: `Selected road candidates do not connect between ${disconnectedTransition.fromRoadId} and ${disconnectedTransition.toRoadId}.`,
      pointIndex: disconnectedTransition.pointIndex,
      fromRoadId: disconnectedTransition.fromRoadId,
      toRoadId: disconnectedTransition.toRoadId
    });
  }

  const snappedPoints = points.map<SnappedRoutePoint>((point, pointIndex) => {
    const candidates = candidateGroupsWithSelection[pointIndex];
    const bestCandidate = selectedCandidates[pointIndex];

    if (!bestCandidate) {
      return {
        originalPoint: point,
        snappedPoint: { ...point },
        roadId: null,
        directedEdgeId: null,
        distanceFromRoad: Number.POSITIVE_INFINITY,
        confidence: 0,
        candidates
      };
    }

    return {
      originalPoint: point,
      snappedPoint: { ...bestCandidate.snappedPoint },
      roadId: bestCandidate.roadId,
      directedEdgeId: bestCandidate.directedEdgeId ?? null,
      distanceFromRoad: bestCandidate.distanceFromRoad,
      confidence: bestCandidate.confidence,
      candidates
    };
  });

  return {
    isValidTrace: true,
    hasOffRoadPoints: diagnostics.some((diagnostic) => diagnostic.code === "off_road_points"),
    snapTolerance,
    snappedPoints,
    connectivity,
    diagnostics
  };
}
