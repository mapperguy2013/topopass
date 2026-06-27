import type { DirectedEdge, MapRoad } from "./types.ts";

export function buildDirectedEdges(roads: MapRoad[]): DirectedEdge[] {
  return roads.flatMap((road) => {
    const forward: DirectedEdge = {
      id: `${road.id}:forward`,
      roadId: road.id,
      fromNodeId: road.fromNodeId,
      toNodeId: road.toNodeId,
      distanceMeters: road.distanceMeters,
      direction: "forward"
    };

    if (road.isOneWay) {
      return [forward];
    }

    const reverse: DirectedEdge = {
      id: `${road.id}:reverse`,
      roadId: road.id,
      fromNodeId: road.toNodeId,
      toNodeId: road.fromNodeId,
      distanceMeters: road.distanceMeters,
      direction: "reverse"
    };

    return [forward, reverse];
  });
}
