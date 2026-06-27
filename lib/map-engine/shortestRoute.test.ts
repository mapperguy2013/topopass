import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMapGraph,
  findShortestLegalRoute,
  marloweDistrictMap,
  type MapDefinition,
  type ShortestLegalRouteResult
} from "./index.ts";

function expectFound(result: ShortestLegalRouteResult): Extract<ShortestLegalRouteResult, { found: true }> {
  assert.equal(result.found, true);
  return result;
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
