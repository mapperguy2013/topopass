import type { DirectedEdge, MapGraph, MapRestriction, MapRoad } from "./types.ts";

type NoEntryRestriction = Extract<MapRestriction, { type: "no_entry" }>;
type RoadClosedRestriction = Extract<MapRestriction, { type: "road_closed" }>;

export type DirectedEdgePathValidationResult = {
  valid: boolean;
  invalidEdgeKeys: string[];
  blockedEdgeKeys: string[];
};

export function directedEdgeKey(input: Pick<DirectedEdge, "fromNodeId" | "toNodeId">): string {
  return `${input.fromNodeId}->${input.toNodeId}`;
}

function restrictionDirectionMatchesEdge(
  restriction: NoEntryRestriction,
  edge: DirectedEdge,
  road: MapRoad | undefined
): boolean {
  if (!restriction.fromNodeId || !restriction.toNodeId) {
    return true;
  }

  if (!road) {
    return restriction.fromNodeId === edge.fromNodeId && restriction.toNodeId === edge.toNodeId;
  }

  if (restriction.fromNodeId === road.fromNodeId && restriction.toNodeId === road.toNodeId) {
    return edge.direction === "forward";
  }

  if (restriction.fromNodeId === road.toNodeId && restriction.toNodeId === road.fromNodeId) {
    return edge.direction === "reverse";
  }

  return restriction.fromNodeId === edge.fromNodeId && restriction.toNodeId === edge.toNodeId;
}

function restrictionHasDistanceRange(restriction: NoEntryRestriction): boolean {
  return (
    Number.isFinite(restriction.blockedFromDistanceMeters) &&
    Number.isFinite(restriction.blockedToDistanceMeters)
  );
}

function edgeIsInsideBlockedDistanceRange(edge: DirectedEdge, restriction: NoEntryRestriction): boolean {
  if (!restrictionHasDistanceRange(restriction)) {
    return true;
  }

  const blockedStart = restriction.blockedFromDistanceMeters as number;
  const blockedEnd = restriction.blockedToDistanceMeters as number;
  const blockedMin = Math.min(blockedStart, blockedEnd);
  const blockedMax = Math.max(blockedStart, blockedEnd);
  const edgeMin = Math.min(edge.sourceFromDistanceMeters, edge.sourceToDistanceMeters);
  const edgeMax = Math.max(edge.sourceFromDistanceMeters, edge.sourceToDistanceMeters);

  return edgeMin >= blockedMin && edgeMax <= blockedMax;
}

function noEntryBlocksEdge(restriction: NoEntryRestriction, edge: DirectedEdge, graph: MapGraph): boolean {
  if (restriction.roadId !== edge.roadId) {
    return false;
  }

  return (
    restrictionDirectionMatchesEdge(restriction, edge, graph.roadsById[edge.roadId]) &&
    edgeIsInsideBlockedDistanceRange(edge, restriction)
  );
}

function roadClosureBlocksEdge(restriction: RoadClosedRestriction, edge: DirectedEdge): boolean {
  return restriction.roadId === edge.roadId;
}

export function buildBlockedDirectedEdgeKeys(
  graph: MapGraph,
  restrictions: readonly MapRestriction[] = []
): Set<string> {
  const noEntryRestrictions = restrictions.filter(
    (restriction): restriction is NoEntryRestriction => restriction.type === "no_entry"
  );
  const roadClosedRestrictions = restrictions.filter(
    (restriction): restriction is RoadClosedRestriction => restriction.type === "road_closed"
  );
  const blockedKeys = new Set<string>();

  for (const edge of graph.edges) {
    const blocked =
      noEntryRestrictions.some((restriction) => noEntryBlocksEdge(restriction, edge, graph)) ||
      roadClosedRestrictions.some((restriction) => roadClosureBlocksEdge(restriction, edge));

    if (blocked) {
      blockedKeys.add(directedEdgeKey(edge));
    }
  }

  return blockedKeys;
}

export function validateDirectedEdgePath(input: {
  graph: MapGraph;
  edgeIds: readonly string[];
  restrictions?: readonly MapRestriction[];
}): DirectedEdgePathValidationResult {
  const blockedEdgeKeys = buildBlockedDirectedEdgeKeys(input.graph, input.restrictions);
  const invalidEdgeKeys: string[] = [];

  for (const edgeId of input.edgeIds) {
    const edge = input.graph.edgesById[edgeId];

    if (!edge) {
      invalidEdgeKeys.push(edgeId);
      continue;
    }

    const key = directedEdgeKey(edge);

    if (blockedEdgeKeys.has(key)) {
      invalidEdgeKeys.push(key);
    }
  }

  return {
    valid: invalidEdgeKeys.length === 0,
    invalidEdgeKeys,
    blockedEdgeKeys: [...blockedEdgeKeys]
  };
}
