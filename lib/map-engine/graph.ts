import { buildDirectedEdges } from "./edges.ts";
import type { DirectedEdge, MapDefinition, MapGraph, MapNode, MapRestriction, MapRoad } from "./types.ts";
import { validateMapDefinition } from "./validation.ts";

function indexById<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

function emptyEdgeIndex(nodes: MapNode[]): Record<string, DirectedEdge[]> {
  return Object.fromEntries(nodes.map((node) => [node.id, []]));
}

function noEntrySegmentRestrictions(map: MapDefinition): Array<Extract<MapRestriction, { type: "no_entry" }>> {
  return map.restrictions.filter(
    (restriction): restriction is Extract<MapRestriction, { type: "no_entry" }> =>
      restriction.type === "no_entry" &&
      typeof restriction.blockedFromDistanceMeters === "number" &&
      typeof restriction.blockedToDistanceMeters === "number" &&
      Number.isFinite(restriction.blockedFromDistanceMeters) &&
      Number.isFinite(restriction.blockedToDistanceMeters)
  );
}

function splitDistanceId(distanceMeters: number): string {
  return distanceMeters.toFixed(3).replace(/\.?0+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
}

function splitNodeId(roadId: string, distanceMeters: number): string {
  return `${roadId}__split_${splitDistanceId(distanceMeters)}`;
}

function splitDistancesForRoad(
  road: MapRoad,
  restrictions: Array<Extract<MapRestriction, { type: "no_entry" }>>
): number[] {
  const distances = new Set<number>([0, road.distanceMeters]);

  for (const restriction of restrictions) {
    if (restriction.roadId !== road.id) {
      continue;
    }

    const start = restriction.blockedFromDistanceMeters;
    const end = restriction.blockedToDistanceMeters;

    if (typeof start === "number" && Number.isFinite(start) && start > 0 && start < road.distanceMeters) {
      distances.add(start);
    }

    if (typeof end === "number" && Number.isFinite(end) && end > 0 && end < road.distanceMeters) {
      distances.add(end);
    }
  }

  return [...distances].sort((left, right) => left - right);
}

function interpolateRoadNode(input: {
  road: MapRoad;
  fromNode: MapNode;
  toNode: MapNode;
  distanceMeters: number;
}): MapNode {
  const ratio = input.distanceMeters / input.road.distanceMeters;

  return {
    id: splitNodeId(input.road.id, input.distanceMeters),
    x: input.fromNode.x + (input.toNode.x - input.fromNode.x) * ratio,
    y: input.fromNode.y + (input.toNode.y - input.fromNode.y) * ratio,
    label: `${input.road.name ?? input.road.id} split ${Math.round(input.distanceMeters)}m`
  };
}

function buildSegmentedDirectedEdges(input: {
  road: MapRoad;
  nodeIdsByDistance: Map<number, string>;
  splitDistances: number[];
}): DirectedEdge[] {
  const edges: DirectedEdge[] = [];

  for (let index = 0; index < input.splitDistances.length - 1; index += 1) {
    const startDistance = input.splitDistances[index];
    const endDistance = input.splitDistances[index + 1];
    const fromNodeId = input.nodeIdsByDistance.get(startDistance);
    const toNodeId = input.nodeIdsByDistance.get(endDistance);

    if (!fromNodeId || !toNodeId) {
      continue;
    }

    const distanceMeters = endDistance - startDistance;

    edges.push({
      id: `${input.road.id}:segment-${index}:forward`,
      roadId: input.road.id,
      fromNodeId,
      toNodeId,
      distanceMeters,
      direction: "forward",
      sourceFromDistanceMeters: startDistance,
      sourceToDistanceMeters: endDistance
    });

    if (!input.road.isOneWay) {
      edges.push({
        id: `${input.road.id}:segment-${index}:reverse`,
        roadId: input.road.id,
        fromNodeId: toNodeId,
        toNodeId: fromNodeId,
        distanceMeters,
        direction: "reverse",
        sourceFromDistanceMeters: endDistance,
        sourceToDistanceMeters: startDistance
      });
    }
  }

  return edges;
}

function buildGraphEdgesAndNodes(map: MapDefinition): { nodes: MapNode[]; edges: DirectedEdge[] } {
  const segmentRestrictions = noEntrySegmentRestrictions(map);

  if (segmentRestrictions.length === 0) {
    return {
      nodes: map.nodes,
      edges: buildDirectedEdges(map.roads)
    };
  }

  const nodesById = indexById<MapNode>(map.nodes);
  const augmentedNodes = [...map.nodes];
  const edges: DirectedEdge[] = [];

  for (const road of map.roads) {
    const splitDistances = splitDistancesForRoad(road, segmentRestrictions);

    if (splitDistances.length <= 2) {
      edges.push(...buildDirectedEdges([road]));
      continue;
    }

    const fromNode = nodesById[road.fromNodeId];
    const toNode = nodesById[road.toNodeId];
    const nodeIdsByDistance = new Map<number, string>([
      [0, road.fromNodeId],
      [road.distanceMeters, road.toNodeId]
    ]);

    for (const distanceMeters of splitDistances.slice(1, -1)) {
      const node = interpolateRoadNode({
        road,
        fromNode,
        toNode,
        distanceMeters
      });

      augmentedNodes.push(node);
      nodeIdsByDistance.set(distanceMeters, node.id);
    }

    edges.push(
      ...buildSegmentedDirectedEdges({
        road,
        nodeIdsByDistance,
        splitDistances
      })
    );
  }

  return {
    nodes: augmentedNodes,
    edges
  };
}

export function buildMapGraph(map: MapDefinition): MapGraph {
  const validation = validateMapDefinition(map);

  if (!validation.valid) {
    throw new Error(`Invalid map definition: ${validation.errors.join("; ")}`);
  }

  const { nodes, edges } = buildGraphEdgesAndNodes(map);
  const outgoingEdgesByNodeId = emptyEdgeIndex(nodes);
  const incomingEdgesByNodeId = emptyEdgeIndex(nodes);

  for (const edge of edges) {
    outgoingEdgesByNodeId[edge.fromNodeId].push(edge);
    incomingEdgesByNodeId[edge.toNodeId].push(edge);
  }

  return {
    mapId: map.id,
    nodesById: indexById<MapNode>(nodes),
    roadsById: indexById<MapRoad>(map.roads),
    edges,
    edgesById: indexById<DirectedEdge>(edges),
    outgoingEdgesByNodeId,
    incomingEdgesByNodeId
  };
}
