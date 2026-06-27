import type { MapDefinition } from "../types.ts";

export const tinyMap: MapDefinition = {
  id: "tiny-fictional-grid",
  name: "Tiny Fictional Grid",
  nodes: [
    { id: "node-maple-square", x: 0, y: 0, label: "Maple Square" },
    { id: "node-orchard-corner", x: 120, y: 0, label: "Orchard Corner" },
    { id: "node-copper-school", x: 120, y: 90, label: "Copper School" },
    { id: "node-lantern-park", x: 20, y: 110, label: "Lantern Park" }
  ],
  roads: [
    {
      id: "road-maple-walk",
      fromNodeId: "node-maple-square",
      toNodeId: "node-orchard-corner",
      distanceMeters: 120,
      isOneWay: false,
      name: "Maple Walk"
    },
    {
      id: "road-orchard-rise",
      fromNodeId: "node-orchard-corner",
      toNodeId: "node-copper-school",
      distanceMeters: 90,
      isOneWay: true,
      name: "Orchard Rise"
    },
    {
      id: "road-lantern-lane",
      fromNodeId: "node-copper-school",
      toNodeId: "node-lantern-park",
      distanceMeters: 115,
      isOneWay: false,
      name: "Lantern Lane"
    }
  ],
  restrictions: [
    {
      id: "restriction-no-turn-orchard-to-lantern",
      type: "prohibited_turn",
      fromRoadId: "road-orchard-rise",
      viaNodeId: "node-copper-school",
      toRoadId: "road-lantern-lane",
      reason: "Training-only turn restriction"
    }
  ],
  landmarks: [
    {
      id: "landmark-copper-school",
      name: "Copper School",
      type: "school",
      x: 125,
      y: 92,
      nearestNodeId: "node-copper-school"
    }
  ]
};
