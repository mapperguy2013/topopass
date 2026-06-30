import { buildMapGraph } from "./graph.ts";
import type { DirectedEdge, MapDefinition, MapRestriction } from "./types.ts";

export type LegalTransition = {
  fromEdgeId: string;
  viaNodeId: string;
  toEdgeId: string;
  fromRoadId: string;
  toRoadId: string;
};

export type LegalMovementGraph = {
  mapId: string;
  edges: DirectedEdge[];
  edgesById: Record<string, DirectedEdge>;
  outgoingEdgeIdsByNodeId: Record<string, string[]>;
  incomingEdgeIdsByNodeId: Record<string, string[]>;
  transitionsByEdgeId: Record<string, LegalTransition[]>;
};

export type LegalMovementPosition = {
  nodeId: string;
  previousEdgeId?: string;
};

function noEntryBlocksEdge(restriction: Extract<MapRestriction, { type: "no_entry" }>, edge: DirectedEdge): boolean {
  if (restriction.roadId !== edge.roadId) {
    return false;
  }

  if (!restriction.fromNodeId || !restriction.toNodeId) {
    return true;
  }

  return restriction.fromNodeId === edge.fromNodeId && restriction.toNodeId === edge.toNodeId;
}

function roadClosureBlocksEdge(
  restriction: Extract<MapRestriction, { type: "road_closed" }>,
  edge: DirectedEdge
): boolean {
  return restriction.roadId === edge.roadId;
}

function isProhibitedTurn(
  restrictions: Array<Extract<MapRestriction, { type: "prohibited_turn" }>>,
  fromEdge: DirectedEdge,
  toEdge: DirectedEdge
): boolean {
  return restrictions.some(
    (restriction) =>
      restriction.fromRoadId === fromEdge.roadId &&
      restriction.viaNodeId === fromEdge.toNodeId &&
      restriction.toRoadId === toEdge.roadId
  );
}

function isImmediateUTurn(fromEdge: DirectedEdge, toEdge: DirectedEdge): boolean {
  return (
    fromEdge.roadId === toEdge.roadId &&
    fromEdge.fromNodeId === toEdge.toNodeId &&
    fromEdge.toNodeId === toEdge.fromNodeId
  );
}

function emptyStringArrayIndex(nodeIds: string[]): Record<string, string[]> {
  return Object.fromEntries(nodeIds.map((nodeId) => [nodeId, []]));
}

export function buildLegalMovementGraph(map: MapDefinition): LegalMovementGraph {
  const graph = buildMapGraph(map);
  const noEntryRestrictions = map.restrictions.filter((restriction) => restriction.type === "no_entry");
  const roadClosedRestrictions = map.restrictions.filter((restriction) => restriction.type === "road_closed");
  const prohibitedTurnRestrictions = map.restrictions.filter(
    (restriction) => restriction.type === "prohibited_turn"
  );
  const legalEdges = graph.edges.filter(
    (edge) =>
      !noEntryRestrictions.some((restriction) => noEntryBlocksEdge(restriction, edge)) &&
      !roadClosedRestrictions.some((restriction) => roadClosureBlocksEdge(restriction, edge))
  );
  const edgesById = Object.fromEntries(legalEdges.map((edge) => [edge.id, edge]));
  const nodeIds = Object.keys(graph.nodesById);
  const outgoingEdgeIdsByNodeId = emptyStringArrayIndex(nodeIds);
  const incomingEdgeIdsByNodeId = emptyStringArrayIndex(nodeIds);

  for (const edge of legalEdges) {
    outgoingEdgeIdsByNodeId[edge.fromNodeId].push(edge.id);
    incomingEdgeIdsByNodeId[edge.toNodeId].push(edge.id);
  }

  const transitionsByEdgeId: Record<string, LegalTransition[]> = Object.fromEntries(
    legalEdges.map((edge) => [edge.id, []])
  );

  for (const fromEdge of legalEdges) {
    const nextEdgeIds = outgoingEdgeIdsByNodeId[fromEdge.toNodeId];

    for (const toEdgeId of nextEdgeIds) {
      const toEdge = edgesById[toEdgeId];

      if (isImmediateUTurn(fromEdge, toEdge) || isProhibitedTurn(prohibitedTurnRestrictions, fromEdge, toEdge)) {
        continue;
      }

      transitionsByEdgeId[fromEdge.id].push({
        fromEdgeId: fromEdge.id,
        viaNodeId: fromEdge.toNodeId,
        toEdgeId: toEdge.id,
        fromRoadId: fromEdge.roadId,
        toRoadId: toEdge.roadId
      });
    }
  }

  return {
    mapId: map.id,
    edges: legalEdges,
    edgesById,
    outgoingEdgeIdsByNodeId,
    incomingEdgeIdsByNodeId,
    transitionsByEdgeId
  };
}

export function getLegalOutgoingMovements(graph: LegalMovementGraph, nodeId: string): DirectedEdge[] {
  const edgeIds = graph.outgoingEdgeIdsByNodeId[nodeId];

  if (!edgeIds) {
    throw new Error(`Unknown node id: ${nodeId}`);
  }

  return edgeIds.map((edgeId) => graph.edgesById[edgeId]);
}

export function getLegalNextMovements(graph: LegalMovementGraph, previousEdgeId: string): DirectedEdge[] {
  const transitions = graph.transitionsByEdgeId[previousEdgeId];

  if (!transitions) {
    throw new Error(`Unknown edge id: ${previousEdgeId}`);
  }

  return transitions.map((transition) => graph.edgesById[transition.toEdgeId]);
}

export function getLegalMovementsFromPosition(
  graph: LegalMovementGraph,
  position: LegalMovementPosition
): DirectedEdge[] {
  if (!graph.outgoingEdgeIdsByNodeId[position.nodeId]) {
    throw new Error(`Unknown node id: ${position.nodeId}`);
  }

  if (!position.previousEdgeId) {
    return getLegalOutgoingMovements(graph, position.nodeId);
  }

  const previousEdge = graph.edgesById[position.previousEdgeId];

  if (!previousEdge) {
    throw new Error(`Unknown edge id: ${position.previousEdgeId}`);
  }

  if (previousEdge.toNodeId !== position.nodeId) {
    throw new Error(
      `Previous edge ${position.previousEdgeId} ends at ${previousEdge.toNodeId}, not ${position.nodeId}`
    );
  }

  return getLegalNextMovements(graph, position.previousEdgeId);
}
