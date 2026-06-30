import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMapGraph,
  checkRouteLegality,
  findShortestLegalRoute,
  findShortestLegalRouteThroughStops,
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  type DirectedEdge,
  type MapDefinition,
  type ShortestLegalRouteResult
} from "./index.ts";

function expectFound(result: ShortestLegalRouteResult): Extract<ShortestLegalRouteResult, { found: true }> {
  assert.equal(result.found, true);
  return result;
}

function movementsFromEdges(edges: DirectedEdge[]) {
  return edges.map((edge) => ({
    roadId: edge.roadId,
    fromNodeId: edge.fromNodeId,
    toNodeId: edge.toNodeId
  }));
}

const basicShortestMap: MapDefinition = {
  id: "basic-shortest-map",
  name: "Basic Shortest Map",
  nodes: [
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 100, y: 0 },
    { id: "c", x: 200, y: 0 },
    { id: "d", x: 100, y: 100 }
  ],
  roads: [
    { id: "road-ab", fromNodeId: "a", toNodeId: "b", distanceMeters: 100, isOneWay: false },
    { id: "road-bc", fromNodeId: "b", toNodeId: "c", distanceMeters: 100, isOneWay: false },
    { id: "road-ad", fromNodeId: "a", toNodeId: "d", distanceMeters: 180, isOneWay: false },
    { id: "road-dc", fromNodeId: "d", toNodeId: "c", distanceMeters: 180, isOneWay: false }
  ],
  restrictions: [],
  landmarks: []
};

test("findShortestLegalRoute selects the shorter of two legal routes", () => {
  const graph = buildMapGraph(basicShortestMap);
  const result = expectFound(
    findShortestLegalRoute({
      graph,
      startNodeId: "a",
      endNodeId: "c"
    })
  );

  assert.equal(result.distanceMeters, 200);
  assert.deepEqual(result.edgeIds, ["road-ab:forward", "road-bc:forward"]);
  assert.deepEqual(result.roadIds, ["road-ab", "road-bc"]);
  assert.deepEqual(result.nodeIds, ["a", "b", "c"]);
});

test("findShortestLegalRoute respects one-way directed edges", () => {
  const map: MapDefinition = {
    id: "one-way-route-map",
    name: "One Way Route Map",
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 100, y: 0 },
      { id: "c", x: 50, y: 100 }
    ],
    roads: [
      { id: "road-ab", fromNodeId: "a", toNodeId: "b", distanceMeters: 100, isOneWay: true },
      { id: "road-bc", fromNodeId: "b", toNodeId: "c", distanceMeters: 100, isOneWay: false },
      { id: "road-ca", fromNodeId: "c", toNodeId: "a", distanceMeters: 100, isOneWay: false }
    ],
    restrictions: [],
    landmarks: []
  };
  const graph = buildMapGraph(map);

  assert.deepEqual(
    expectFound(findShortestLegalRoute({ graph, startNodeId: "a", endNodeId: "b" })).edgeIds,
    ["road-ab:forward"]
  );

  const reverse = expectFound(findShortestLegalRoute({ graph, startNodeId: "b", endNodeId: "a" }));

  assert.deepEqual(reverse.edgeIds, ["road-bc:forward", "road-ca:forward"]);
  assert.equal(reverse.distanceMeters, 200);
});

test("findShortestLegalRoute avoids no-entry restricted movements", () => {
  const map: MapDefinition = {
    id: "no-entry-route-map",
    name: "No Entry Route Map",
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 100, y: 0 },
      { id: "c", x: 200, y: 0 },
      { id: "d", x: 100, y: 100 }
    ],
    roads: [
      { id: "road-ab", fromNodeId: "a", toNodeId: "b", distanceMeters: 100, isOneWay: false },
      { id: "road-bc", fromNodeId: "b", toNodeId: "c", distanceMeters: 100, isOneWay: false },
      { id: "road-ad", fromNodeId: "a", toNodeId: "d", distanceMeters: 150, isOneWay: false },
      { id: "road-dc", fromNodeId: "d", toNodeId: "c", distanceMeters: 150, isOneWay: false }
    ],
    restrictions: [
      {
        id: "no-entry-b-to-c",
        type: "no_entry",
        roadId: "road-bc",
        fromNodeId: "b",
        toNodeId: "c"
      }
    ],
    landmarks: []
  };
  const graph = buildMapGraph(map);
  const result = expectFound(
    findShortestLegalRoute({
      graph,
      startNodeId: "a",
      endNodeId: "c",
      restrictions: map.restrictions
    })
  );

  assert.equal(result.distanceMeters, 300);
  assert.deepEqual(result.edgeIds, ["road-ad:forward", "road-dc:forward"]);
});

test("findShortestLegalRoute avoids prohibited turns with transition-aware state", () => {
  const map: MapDefinition = {
    id: "prohibited-turn-route-map",
    name: "Prohibited Turn Route Map",
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 100, y: 0 },
      { id: "c", x: 200, y: 0 },
      { id: "d", x: 100, y: 100 }
    ],
    roads: [
      { id: "road-ab", fromNodeId: "a", toNodeId: "b", distanceMeters: 100, isOneWay: false },
      { id: "road-bc", fromNodeId: "b", toNodeId: "c", distanceMeters: 100, isOneWay: false },
      { id: "road-bd", fromNodeId: "b", toNodeId: "d", distanceMeters: 150, isOneWay: false },
      { id: "road-dc", fromNodeId: "d", toNodeId: "c", distanceMeters: 150, isOneWay: false }
    ],
    restrictions: [
      {
        id: "no-turn-ab-to-bc",
        type: "prohibited_turn",
        fromRoadId: "road-ab",
        viaNodeId: "b",
        toRoadId: "road-bc"
      }
    ],
    landmarks: []
  };
  const graph = buildMapGraph(map);
  const result = expectFound(
    findShortestLegalRoute({
      graph,
      startNodeId: "a",
      endNodeId: "c",
      restrictions: map.restrictions
    })
  );

  assert.equal(result.distanceMeters, 400);
  assert.deepEqual(result.edgeIds, ["road-ab:forward", "road-bd:forward", "road-dc:forward"]);
});

test("findShortestLegalRoute avoids closed or restricted roads", () => {
  const map: MapDefinition = {
    id: "closed-road-route-map",
    name: "Closed Road Route Map",
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 100, y: 0 },
      { id: "c", x: 200, y: 0 },
      { id: "d", x: 100, y: 100 }
    ],
    roads: [
      { id: "road-ab", fromNodeId: "a", toNodeId: "b", distanceMeters: 100, isOneWay: false },
      { id: "road-bc", fromNodeId: "b", toNodeId: "c", distanceMeters: 100, isOneWay: false },
      { id: "road-ad", fromNodeId: "a", toNodeId: "d", distanceMeters: 160, isOneWay: false },
      { id: "road-dc", fromNodeId: "d", toNodeId: "c", distanceMeters: 160, isOneWay: false }
    ],
    restrictions: [{ id: "close-road-bc", type: "road_closed", roadId: "road-bc" }],
    landmarks: []
  };
  const graph = buildMapGraph(map);
  const result = expectFound(
    findShortestLegalRoute({
      graph,
      startNodeId: "a",
      endNodeId: "c",
      restrictions: map.restrictions
    })
  );

  assert.equal(result.distanceMeters, 320);
  assert.deepEqual(result.edgeIds, ["road-ad:forward", "road-dc:forward"]);
});

test("findShortestLegalRoute avoids immediate U-turns", () => {
  const map: MapDefinition = {
    id: "u-turn-route-map",
    name: "U-turn Route Map",
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 100, y: 0 },
      { id: "c", x: 200, y: 0 },
      { id: "d", x: 100, y: 100 }
    ],
    roads: [
      { id: "road-ab", fromNodeId: "a", toNodeId: "b", distanceMeters: 100, isOneWay: false },
      { id: "road-bc", fromNodeId: "b", toNodeId: "c", distanceMeters: 100, isOneWay: false },
      { id: "road-bd", fromNodeId: "b", toNodeId: "d", distanceMeters: 100, isOneWay: false },
      { id: "road-da", fromNodeId: "d", toNodeId: "a", distanceMeters: 100, isOneWay: false }
    ],
    restrictions: [],
    landmarks: []
  };
  const graph = buildMapGraph(map);
  const result = expectFound(
    findShortestLegalRouteThroughStops({
      graph,
      stopNodeIds: ["a", "b", "a"],
      restrictions: map.restrictions
    })
  );

  assert.deepEqual(result.edgeIds, ["road-ab:forward", "road-bd:forward", "road-da:forward"]);
});

test("findShortestLegalRoute reports no route when all legal movement is blocked", () => {
  const map: MapDefinition = {
    id: "blocked-route-map",
    name: "Blocked Route Map",
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 100, y: 0 }
    ],
    roads: [{ id: "road-ab", fromNodeId: "a", toNodeId: "b", distanceMeters: 100, isOneWay: false }],
    restrictions: [
      {
        id: "road-ab-closed-to-a-to-b",
        type: "no_entry",
        roadId: "road-ab",
        fromNodeId: "a",
        toNodeId: "b"
      }
    ],
    landmarks: []
  };
  const graph = buildMapGraph(map);

  assert.deepEqual(findShortestLegalRoute({ graph, startNodeId: "a", endNodeId: "b", restrictions: map.restrictions }), {
    found: false,
    startNodeId: "a",
    endNodeId: "b",
    reason: "NO_ROUTE"
  });
});

test("findShortestLegalRouteThroughStops reports no route when the only path uses no-entry", () => {
  const map: MapDefinition = {
    id: "only-no-entry-route-map",
    name: "Only No Entry Route Map",
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 100, y: 0 }
    ],
    roads: [{ id: "road-ab", fromNodeId: "a", toNodeId: "b", distanceMeters: 100, isOneWay: false }],
    restrictions: [{ id: "no-entry-a-to-b", type: "no_entry", roadId: "road-ab", fromNodeId: "a", toNodeId: "b" }],
    landmarks: []
  };
  const graph = buildMapGraph(map);

  assert.deepEqual(
    findShortestLegalRouteThroughStops({
      graph,
      stopNodeIds: ["a", "b"],
      restrictions: map.restrictions
    }),
    {
      found: false,
      stopNodeIds: ["a", "b"],
      reason: "NO_ROUTE"
    }
  );
});

test("findShortestLegalRoute returns clean invalid start and end failures", () => {
  const graph = buildMapGraph(basicShortestMap);

  assert.deepEqual(findShortestLegalRoute({ graph, startNodeId: "missing", endNodeId: "c" }), {
    found: false,
    startNodeId: "missing",
    endNodeId: "c",
    reason: "INVALID_START_NODE"
  });
  assert.deepEqual(findShortestLegalRoute({ graph, startNodeId: "a", endNodeId: "missing" }), {
    found: false,
    startNodeId: "a",
    endNodeId: "missing",
    reason: "INVALID_END_NODE"
  });
});

test("findShortestLegalRoute returns a zero-distance route when start equals end", () => {
  const graph = buildMapGraph(basicShortestMap);

  assert.deepEqual(findShortestLegalRoute({ graph, startNodeId: "a", endNodeId: "a" }), {
    found: true,
    startNodeId: "a",
    endNodeId: "a",
    distanceMeters: 0,
    edgeIds: [],
    roadIds: [],
    nodeIds: ["a"]
  });
});

test("findShortestLegalRoute can calculate a Marlowe District route", () => {
  const graph = buildMapGraph(marloweDistrictMap);
  const result = expectFound(
    findShortestLegalRoute({
      graph,
      startNodeId: "n02",
      endNodeId: "n09",
      restrictions: marloweDistrictMap.restrictions
    })
  );

  assert(result.distanceMeters > 0);
  assert(result.edgeIds.length > 0);
  assert(result.roadIds.length > 0);
  assert(result.nodeIds.length > 1);
  assert.equal(result.nodeIds[0], "n02");
  assert.equal(result.nodeIds.at(-1), "n09");
});

test("findShortestLegalRouteThroughStops returns legal route for exercise 3 regression", () => {
  const graph = buildMapGraph(marloweDistrictMap);
  const result = findShortestLegalRouteThroughStops({
    graph,
    stopNodeIds: ["n10", "n20", "n22"],
    restrictions: marloweDistrictMap.restrictions
  });

  assert.equal(result.found, true);

  if (result.found) {
    const edges = result.edgeIds.map((edgeId) => graph.edgesById[edgeId]);
    const legality = checkRouteLegality({
      map: marloweDistrictMap,
      movements: movementsFromEdges(edges)
    });

    assert.equal(legality.isLegal, true);
    assert(!result.roadIds.includes("r33") || result.edgeIds.includes("r33:forward"));
  }
});

test("findShortestLegalRouteThroughStops returns legal route for exercise 6 regression", () => {
  const graph = buildMapGraph(marloweDistrictMap);
  const result = findShortestLegalRouteThroughStops({
    graph,
    stopNodeIds: ["n16", "n12", "n10"],
    restrictions: marloweDistrictMap.restrictions
  });

  assert.equal(result.found, true);

  if (result.found) {
    const edges = result.edgeIds.map((edgeId) => graph.edgesById[edgeId]);
    const legality = checkRouteLegality({
      map: marloweDistrictMap,
      movements: movementsFromEdges(edges)
    });

    assert.equal(legality.isLegal, true);
    assert(!legality.illegalMovements.some((movement) => movement.type === "no_entry"));
    assert(!legality.illegalMovements.some((movement) => movement.type === "no_u_turn"));
  }
});

test("Marlowe route exercises either have legal ordered fastest routes or are explicitly invalid", () => {
  const graph = buildMapGraph(marloweDistrictMap);
  const landmarkNodeIds = Object.fromEntries(
    marloweDistrictMap.landmarks.map((landmark) => [landmark.id, landmark.nearestNodeId])
  );
  const expectedInvalidExerciseIds = new Set(["ex-no-entry-eastgate-market"]);

  for (const exercise of marloweDistrictRouteExercises) {
    const stopNodeIds = exercise.stops.map((stop) =>
      stop.type === "node" ? stop.nodeId : landmarkNodeIds[stop.landmarkId]
    );
    const result = findShortestLegalRouteThroughStops({
      graph,
      stopNodeIds: stopNodeIds.filter((nodeId): nodeId is string => Boolean(nodeId)),
      restrictions: marloweDistrictMap.restrictions
    });

    if (expectedInvalidExerciseIds.has(exercise.id)) {
      assert.equal(result.found, false, `${exercise.id} should be marked unavailable until the fixture is corrected`);
      continue;
    }

    assert.equal(result.found, true, `${exercise.id} should have a legal fastest route`);

    if (result.found) {
      const legality = checkRouteLegality({
        map: marloweDistrictMap,
        movements: movementsFromEdges(result.edgeIds.map((edgeId) => graph.edgesById[edgeId]))
      });

      assert.equal(legality.isLegal, true, `${exercise.id} returned illegal fastest route`);
    }
  }
});
