import {
  buildBlockedDirectedEdgeKeys,
  directedEdgeKey,
  validateDirectedEdgePath
} from "./directedEdgeRestrictions.ts";
import type { DirectedEdge, MapGraph, MapRestriction } from "./types.ts";

export type FindShortestLegalRouteInput = {
  graph: MapGraph;
  startNodeId: string;
  endNodeId: string;
  restrictions?: MapRestriction[];
};

export type FindShortestLegalRouteThroughStopsInput = {
  graph: MapGraph;
  stopNodeIds: string[];
  restrictions?: MapRestriction[];
};

export type ShortestLegalRouteResult =
  | {
      found: true;
      startNodeId: string;
      endNodeId: string;
      distanceMeters: number;
      edgeIds: string[];
      roadIds: string[];
      nodeIds: string[];
    }
  | {
      found: false;
      startNodeId: string;
      endNodeId: string;
      reason: "NO_ROUTE" | "INVALID_START_NODE" | "INVALID_END_NODE";
    };

export type ShortestLegalRouteThroughStopsResult =
  | {
      found: true;
      stopNodeIds: string[];
      distanceMeters: number;
      edgeIds: string[];
      roadIds: string[];
      nodeIds: string[];
    }
  | {
      found: false;
      stopNodeIds: string[];
      reason: "NO_ROUTE" | "INVALID_STOP_NODE" | "INVALID_STOP_SEQUENCE";
      invalidNodeId?: string;
    };

type SearchState = {
  nodeId: string;
  previousEdgeId: string | null;
};

type QueueItem = {
  state: SearchState;
  distanceMeters: number;
};

type OrderedStopSearchState = SearchState & {
  nextStopIndex: number;
};

type OrderedStopQueueItem = {
  state: OrderedStopSearchState;
  distanceMeters: number;
};

type PreviousState = {
  previousStateKey: string;
  viaEdgeId: string;
};

function stateKey(state: SearchState): string {
  return `${state.nodeId}|${state.previousEdgeId ?? "START"}`;
}

function isImmediateUTurn(previousEdge: DirectedEdge | null, nextEdge: DirectedEdge): boolean {
  return (
    previousEdge !== null &&
    previousEdge.roadId === nextEdge.roadId &&
    previousEdge.fromNodeId === nextEdge.toNodeId &&
    previousEdge.toNodeId === nextEdge.fromNodeId
  );
}

function isTransitionBlockedByProhibitedTurn(
  previousEdge: DirectedEdge | null,
  nextEdge: DirectedEdge,
  restrictions: Array<Extract<MapRestriction, { type: "prohibited_turn" }>>
): boolean {
  if (!previousEdge) {
    return false;
  }

  return restrictions.some(
    (restriction) =>
      restriction.fromRoadId === previousEdge.roadId &&
      restriction.viaNodeId === previousEdge.toNodeId &&
      restriction.toRoadId === nextEdge.roadId
  );
}

function transitionIsBlocked(input: {
  previousEdge: DirectedEdge | null;
  nextEdge: DirectedEdge;
  blockedDirectedEdgeKeys: Set<string>;
  prohibitedTurnRestrictions: Array<Extract<MapRestriction, { type: "prohibited_turn" }>>;
}): boolean {
  return (
    input.blockedDirectedEdgeKeys.has(directedEdgeKey(input.nextEdge)) ||
    isImmediateUTurn(input.previousEdge, input.nextEdge) ||
    isTransitionBlockedByProhibitedTurn(input.previousEdge, input.nextEdge, input.prohibitedTurnRestrictions)
  );
}

function popLowestDistance<TQueueItem extends { distanceMeters: number }>(queue: TQueueItem[]): TQueueItem {
  let bestIndex = 0;

  for (let index = 1; index < queue.length; index += 1) {
    if (queue[index].distanceMeters < queue[bestIndex].distanceMeters) {
      bestIndex = index;
    }
  }

  const [item] = queue.splice(bestIndex, 1);
  return item;
}

function reconstructEdgeIds(endStateKey: string, previousByStateKey: Record<string, PreviousState>): string[] {
  const edgeIds: string[] = [];
  let cursor = endStateKey;

  while (previousByStateKey[cursor]) {
    const previous = previousByStateKey[cursor];
    edgeIds.push(previous.viaEdgeId);
    cursor = previous.previousStateKey;
  }

  return edgeIds.reverse();
}

function orderedStopStateKey(state: OrderedStopSearchState): string {
  return `${state.nodeId}|${state.previousEdgeId ?? "START"}|${state.nextStopIndex}`;
}

function advanceStopIndex(nodeId: string, nextStopIndex: number, stopNodeIds: string[]): number {
  let advancedIndex = nextStopIndex;

  while (advancedIndex < stopNodeIds.length && nodeId === stopNodeIds[advancedIndex]) {
    advancedIndex += 1;
  }

  return advancedIndex;
}

function routeEdgeIdsAreLegal(input: {
  graph: MapGraph;
  edgeIds: readonly string[];
  restrictions: readonly MapRestriction[];
}): boolean {
  return validateDirectedEdgePath(input).valid;
}

export function findShortestLegalRoute(input: FindShortestLegalRouteInput): ShortestLegalRouteResult {
  const { graph, startNodeId, endNodeId } = input;

  if (!graph.nodesById[startNodeId]) {
    return {
      found: false,
      startNodeId,
      endNodeId,
      reason: "INVALID_START_NODE"
    };
  }

  if (!graph.nodesById[endNodeId]) {
    return {
      found: false,
      startNodeId,
      endNodeId,
      reason: "INVALID_END_NODE"
    };
  }

  if (startNodeId === endNodeId) {
    return {
      found: true,
      startNodeId,
      endNodeId,
      distanceMeters: 0,
      edgeIds: [],
      roadIds: [],
      nodeIds: [startNodeId]
    };
  }

  const restrictions = input.restrictions ?? [];
  const blockedDirectedEdgeKeys = buildBlockedDirectedEdgeKeys(graph, restrictions);
  const prohibitedTurnRestrictions = restrictions.filter((restriction) => restriction.type === "prohibited_turn");
  const startState: SearchState = {
    nodeId: startNodeId,
    previousEdgeId: null
  };
  const startKey = stateKey(startState);
  const queue: QueueItem[] = [{ state: startState, distanceMeters: 0 }];
  const distancesByStateKey: Record<string, number> = {
    [startKey]: 0
  };
  const previousByStateKey: Record<string, PreviousState> = {};

  while (queue.length > 0) {
    const current = popLowestDistance(queue);
    const currentKey = stateKey(current.state);

    if (current.distanceMeters > distancesByStateKey[currentKey]) {
      continue;
    }

    if (current.state.nodeId === endNodeId) {
      const edgeIds = reconstructEdgeIds(currentKey, previousByStateKey);
      const edges = edgeIds.map((edgeId) => graph.edgesById[edgeId]);

      if (
        !routeEdgeIdsAreLegal({
          graph,
          edgeIds,
          restrictions
        })
      ) {
        continue;
      }

      return {
        found: true,
        startNodeId,
        endNodeId,
        distanceMeters: current.distanceMeters,
        edgeIds,
        roadIds: edges.map((edge) => edge.roadId),
        nodeIds: [startNodeId, ...edges.map((edge) => edge.toNodeId)]
      };
    }

    const previousEdge = current.state.previousEdgeId ? graph.edgesById[current.state.previousEdgeId] : null;
    const candidateEdges = graph.outgoingEdgesByNodeId[current.state.nodeId] ?? [];

    for (const candidateEdge of candidateEdges) {
      if (
        transitionIsBlocked({
          previousEdge,
          nextEdge: candidateEdge,
          blockedDirectedEdgeKeys,
          prohibitedTurnRestrictions
        })
      ) {
        continue;
      }

      const nextState: SearchState = {
        nodeId: candidateEdge.toNodeId,
        previousEdgeId: candidateEdge.id
      };
      const nextKey = stateKey(nextState);
      const nextDistance = current.distanceMeters + candidateEdge.distanceMeters;

      if (distancesByStateKey[nextKey] !== undefined && distancesByStateKey[nextKey] <= nextDistance) {
        continue;
      }

      distancesByStateKey[nextKey] = nextDistance;
      previousByStateKey[nextKey] = {
        previousStateKey: currentKey,
        viaEdgeId: candidateEdge.id
      };
      queue.push({
        state: nextState,
        distanceMeters: nextDistance
      });
    }
  }

  return {
    found: false,
    startNodeId,
    endNodeId,
    reason: "NO_ROUTE"
  };
}

export function findShortestLegalRouteThroughStops(
  input: FindShortestLegalRouteThroughStopsInput
): ShortestLegalRouteThroughStopsResult {
  const { graph, stopNodeIds } = input;

  if (stopNodeIds.length < 2) {
    return {
      found: false,
      stopNodeIds: [...stopNodeIds],
      reason: "INVALID_STOP_SEQUENCE"
    };
  }

  for (const stopNodeId of stopNodeIds) {
    if (!graph.nodesById[stopNodeId]) {
      return {
        found: false,
        stopNodeIds: [...stopNodeIds],
        reason: "INVALID_STOP_NODE",
        invalidNodeId: stopNodeId
      };
    }
  }

  const restrictions = input.restrictions ?? [];
  const blockedDirectedEdgeKeys = buildBlockedDirectedEdgeKeys(graph, restrictions);
  const prohibitedTurnRestrictions = restrictions.filter((restriction) => restriction.type === "prohibited_turn");
  const startState: OrderedStopSearchState = {
    nodeId: stopNodeIds[0],
    previousEdgeId: null,
    nextStopIndex: advanceStopIndex(stopNodeIds[0], 1, stopNodeIds)
  };
  const startKey = orderedStopStateKey(startState);
  const queue: OrderedStopQueueItem[] = [{ state: startState, distanceMeters: 0 }];
  const distancesByStateKey: Record<string, number> = {
    [startKey]: 0
  };
  const previousByStateKey: Record<string, PreviousState> = {};

  while (queue.length > 0) {
    const current = popLowestDistance(queue);
    const currentKey = orderedStopStateKey(current.state);

    if (current.distanceMeters > distancesByStateKey[currentKey]) {
      continue;
    }

    if (current.state.nextStopIndex >= stopNodeIds.length) {
      const edgeIds = reconstructEdgeIds(currentKey, previousByStateKey);
      const edges = edgeIds.map((edgeId) => graph.edgesById[edgeId]);

      if (
        !routeEdgeIdsAreLegal({
          graph,
          edgeIds,
          restrictions
        })
      ) {
        continue;
      }

      return {
        found: true,
        stopNodeIds: [...stopNodeIds],
        distanceMeters: current.distanceMeters,
        edgeIds,
        roadIds: edges.map((edge) => edge.roadId),
        nodeIds: [stopNodeIds[0], ...edges.map((edge) => edge.toNodeId)]
      };
    }

    const previousEdge = current.state.previousEdgeId ? graph.edgesById[current.state.previousEdgeId] : null;
    const candidateEdges = graph.outgoingEdgesByNodeId[current.state.nodeId] ?? [];

    for (const candidateEdge of candidateEdges) {
      if (
        transitionIsBlocked({
          previousEdge,
          nextEdge: candidateEdge,
          blockedDirectedEdgeKeys,
          prohibitedTurnRestrictions
        })
      ) {
        continue;
      }

      const nextState: OrderedStopSearchState = {
        nodeId: candidateEdge.toNodeId,
        previousEdgeId: candidateEdge.id,
        nextStopIndex: advanceStopIndex(candidateEdge.toNodeId, current.state.nextStopIndex, stopNodeIds)
      };
      const nextKey = orderedStopStateKey(nextState);
      const nextDistance = current.distanceMeters + candidateEdge.distanceMeters;

      if (distancesByStateKey[nextKey] !== undefined && distancesByStateKey[nextKey] <= nextDistance) {
        continue;
      }

      distancesByStateKey[nextKey] = nextDistance;
      previousByStateKey[nextKey] = {
        previousStateKey: currentKey,
        viaEdgeId: candidateEdge.id
      };
      queue.push({
        state: nextState,
        distanceMeters: nextDistance
      });
    }
  }

  return {
    found: false,
    stopNodeIds: [...stopNodeIds],
    reason: "NO_ROUTE"
  };
}
