import type { DirectedEdge, MapGraph, MapRestriction } from "./types.ts";

export type FindShortestLegalRouteInput = {
  graph: MapGraph;
  startNodeId: string;
  endNodeId: string;
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

type SearchState = {
  nodeId: string;
  previousEdgeId: string | null;
};

type QueueItem = {
  state: SearchState;
  distanceMeters: number;
};

type PreviousState = {
  previousStateKey: string;
  viaEdgeId: string;
};

function stateKey(state: SearchState): string {
  return `${state.nodeId}|${state.previousEdgeId ?? "START"}`;
}

function isEdgeBlockedByNoEntry(
  edge: DirectedEdge,
  restrictions: Array<Extract<MapRestriction, { type: "no_entry" }>>
): boolean {
  return restrictions.some((restriction) => {
    if (restriction.roadId !== edge.roadId) {
      return false;
    }

    if (!restriction.fromNodeId || !restriction.toNodeId) {
      return true;
    }

    return restriction.fromNodeId === edge.fromNodeId && restriction.toNodeId === edge.toNodeId;
  });
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

function popLowestDistance(queue: QueueItem[]): QueueItem {
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
  const noEntryRestrictions = restrictions.filter((restriction) => restriction.type === "no_entry");
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
      if (isEdgeBlockedByNoEntry(candidateEdge, noEntryRestrictions)) {
        continue;
      }

      if (isTransitionBlockedByProhibitedTurn(previousEdge, candidateEdge, prohibitedTurnRestrictions)) {
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
