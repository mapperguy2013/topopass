import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDirectedEdges,
  tinyMap,
  validateMapDefinition,
  validateRouteExercise,
  type MapDefinition,
  type RouteExercise
} from "./index.ts";

test("tinyMap validates successfully", () => {
  assert.deepEqual(validateMapDefinition(tinyMap), {
    valid: true,
    errors: []
  });
});

test("buildDirectedEdges creates two edges for two-way roads and one for one-way roads", () => {
  const edges = buildDirectedEdges(tinyMap.roads);

  assert.equal(edges.filter((edge) => edge.roadId === "road-maple-walk").length, 2);
  assert.equal(edges.filter((edge) => edge.roadId === "road-orchard-rise").length, 1);
  assert(edges.some((edge) => edge.id === "road-maple-walk:forward"));
  assert(edges.some((edge) => edge.id === "road-maple-walk:reverse"));
  assert(edges.some((edge) => edge.id === "road-orchard-rise:forward"));
  assert(!edges.some((edge) => edge.id === "road-orchard-rise:reverse"));
});

test("validation rejects a road with a missing node", () => {
  const map: MapDefinition = {
    ...tinyMap,
    roads: [
      ...tinyMap.roads,
      {
        id: "road-missing-node",
        fromNodeId: "node-maple-square",
        toNodeId: "node-does-not-exist",
        distanceMeters: 40,
        isOneWay: false
      }
    ]
  };

  const result = validateMapDefinition(map);

  assert.equal(result.valid, false);
  assert(result.errors.some((error) => error.includes("missing toNodeId")));
});

test("validation rejects duplicate node ids", () => {
  const map: MapDefinition = {
    ...tinyMap,
    nodes: [...tinyMap.nodes, { ...tinyMap.nodes[0], label: "Duplicate Maple Square" }]
  };

  const result = validateMapDefinition(map);

  assert.equal(result.valid, false);
  assert(result.errors.some((error) => error.includes("Duplicate node id")));
});

test("validation rejects non-positive road distance", () => {
  const map: MapDefinition = {
    ...tinyMap,
    roads: [
      {
        ...tinyMap.roads[0],
        distanceMeters: 0
      }
    ]
  };

  const result = validateMapDefinition(map);

  assert.equal(result.valid, false);
  assert(result.errors.some((error) => error.includes("distanceMeters must be positive")));
});

test("validation accepts stored restrictions when references are valid", () => {
  const map: MapDefinition = {
    ...tinyMap,
    restrictions: [
      ...tinyMap.restrictions,
      {
        id: "restriction-maple-no-entry",
        type: "no_entry",
        roadId: "road-maple-walk"
      },
      {
        id: "restriction-lantern-closed",
        type: "road_closed",
        roadId: "road-lantern-lane",
        reason: "Training-only closure"
      }
    ]
  };

  assert.deepEqual(validateMapDefinition(map), {
    valid: true,
    errors: []
  });
});

test("route exercise validation accepts A to B and multi-stop exercises", () => {
  const twoStopExercise: RouteExercise = {
    id: "exercise-maple-to-school",
    title: "Maple Square to Copper School",
    mapId: tinyMap.id,
    stops: [
      { type: "node", nodeId: "node-maple-square" },
      { type: "landmark", landmarkId: "landmark-copper-school" }
    ],
    difficulty: "easy"
  };

  const multiStopExercise: RouteExercise = {
    id: "exercise-maple-school-park",
    title: "Maple Square to Copper School to Lantern Park",
    mapId: tinyMap.id,
    stops: [
      { type: "node", nodeId: "node-maple-square" },
      { type: "landmark", landmarkId: "landmark-copper-school" },
      { type: "node", nodeId: "node-lantern-park" }
    ],
    difficulty: "medium"
  };

  assert.deepEqual(validateRouteExercise(twoStopExercise, tinyMap), {
    valid: true,
    errors: []
  });
  assert.deepEqual(validateRouteExercise(multiStopExercise, tinyMap), {
    valid: true,
    errors: []
  });
});

test("route exercise validation rejects fewer than two stops", () => {
  const exercise: RouteExercise = {
    id: "exercise-one-stop",
    title: "Incomplete Route",
    mapId: tinyMap.id,
    stops: [{ type: "node", nodeId: "node-maple-square" }]
  };

  const result = validateRouteExercise(exercise, tinyMap);

  assert.equal(result.valid, false);
  assert(result.errors.some((error) => error.includes("at least 2 stops")));
});

test("route exercise validation rejects missing stop references", () => {
  const exercise: RouteExercise = {
    id: "exercise-missing-stops",
    title: "Missing Stops",
    mapId: tinyMap.id,
    stops: [
      { type: "node", nodeId: "node-missing" },
      { type: "landmark", landmarkId: "landmark-missing" }
    ]
  };

  const result = validateRouteExercise(exercise, tinyMap);

  assert.equal(result.valid, false);
  assert(result.errors.some((error) => error.includes("missing nodeId")));
  assert(result.errors.some((error) => error.includes("missing landmarkId")));
});
