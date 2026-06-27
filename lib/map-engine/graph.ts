import { buildDirectedEdges } from "./edges.ts";
import type { DirectedEdge, MapDefinition, MapGraph, MapNode, MapRoad } from "./types.ts";
import { validateMapDefinition } from "./validation.ts";

function indexById<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

function emptyEdgeIndex(nodes: MapNode[]): Record<string, DirectedEdge[]> {
  return Object.fromEntries(nodes.map((node) => [node.id, []]));
}

export function buildMapGraph(map: MapDefinition): MapGraph {
  const validation = validateMapDefinition(map);

  if (!validation.valid) {
    throw new Error(`Invalid map definition: ${validation.errors.join("; ")}`);
  }

  const edges = buildDirectedEdges(map.roads);
  const outgoingEdgesByNodeId = emptyEdgeIndex(map.nodes);
  const incomingEdgesByNodeId = emptyEdgeIndex(map.nodes);

  for (const edge of edges) {
    outgoingEdgesByNodeId[edge.fromNodeId].push(edge);
    incomingEdgesByNodeId[edge.toNodeId].push(edge);
  }

  return {
    mapId: map.id,
    nodesById: indexById<MapNode>(map.nodes),
    roadsById: indexById<MapRoad>(map.roads),
    edges,
    edgesById: indexById<DirectedEdge>(edges),
    outgoingEdgesByNodeId,
    incomingEdgesByNodeId
  };
}
