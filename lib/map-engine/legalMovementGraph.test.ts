import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLegalMovementGraph,
  getLegalMovementsFromPosition,
  getLegalNextMovements,
  getLegalOutgoingMovements,
  marloweDistrictMap,
  validateMapDefinition,
  type DirectedEdge,
  type MapDefinition
} from "./index.ts";

const legalMovementTestMap: MapDefinition = {
  id: "legal-movement-test-map",
  name: "Legal Movement Test Map",
  nodes: [
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 100, y: 0 },
    { id: "c", x: 200, y: 0 },
    { id: "d", x: 100, y: 100 },
    { id: "e", x: 100, y: -100 }
  ],
  roads: [
    {
      id: "road-ab",
      fromNodeId: "a",
      toNodeId: "b",
      distanceMeters: 100,
      isOneWay: false,
      name: "Alpha Street"
    },
    {
      id: "road-bc",
      fromNodeId: "b",
      toNodeId: "c",
      distanceMeters: 100,
      isOneWay: true,
      name: "Bravo Street"
    },
    {
      id: "road-bd",
      fromNodeId: "b",
      toNodeId: "d",
      distanceMeters: 100,
      isOneWay: false,
      name: "Delta Lane"
    },
    {
      id: "road-be",
      fromNodeId: "b",
      toNodeId: "e",
      distanceMeters: 100,
      isOneWay: false,
      name: "Echo Road"
    },
    {
      id: "road-db",
      fromNodeId: "d",
      toNodeId: "b",
      distanceMeters: 100,
      isOneWay: false,
      name: "Depot Mews"
    }
  ],
  restrictions: [
    {
      id: "no-entry-b-to-e",
      type: "no_entry",
      roadId: "road-be",
      fromNodeId: "b",
      toNodeId: "e",
      reason: "No entry from B to E"
    },
    {
      id: "no-turn-ab-to-bc",
      type: "prohibited_turn",
      fromRoadId: "road-ab",
      viaNodeId: "b",
      toRoadId: "road-bc",
      reason: "No turn from Alpha Street into Bravo Street"
    }
  ],
  landmarks: []
};

function edgeIds(edges: DirectedEdge[]): string[] {
  return edges.map((edge) => edge.id).sort();
}

test("legal movement graph keeps two-way roads in both directions unless blocked", () => {
  const graph = buildLegalMovementGraph(legalMovementTestMap);

  assert(graph.edgesById["road-ab:forward"]);
  assert(graph.edgesById["road-ab:reverse"]);
  assert(graph.edgesById["road-be:reverse"]);
  assert(!graph.edgesById["road-be:forward"]);
});

test("legal movement graph keeps one-way roads only in the legal direction", () => {
  const graph = buildLegalMovementGraph(legalMovementTestMap);

  assert(graph.edgesById["road-bc:forward"]);
  assert(!graph.edgesById["road-bc:reverse"]);
});

test("no-entry restrictions remove only the blocked directed movement", () => {
  const graph = buildLegalMovementGraph(legalMovementTestMap);

  assert(!edgeIds(getLegalOutgoingMovements(graph, "b")).includes("road-be:forward"));
  assert(edgeIds(getLegalOutgoingMovements(graph, "e")).includes("road-be:reverse"));
});

test("starting from a node returns legal outgoing movements", () => {
  const graph = buildLegalMovementGraph(legalMovementTestMap);

  assert.deepEqual(edgeIds(getLegalOutgoingMovements(graph, "b")), [
    "road-ab:reverse",
    "road-bc:forward",
    "road-bd:forward",
    "road-db:reverse"
  ]);
});

test("prohibited turns block only the illegal transition", () => {
  const graph = buildLegalMovementGraph(legalMovementTestMap);

  assert.deepEqual(edgeIds(getLegalNextMovements(graph, "road-ab:forward")), [
    "road-ab:reverse",
    "road-bd:forward",
    "road-db:reverse"
  ]);
});

test("the same destination road remains legal when approached from a different road", () => {
  const graph = buildLegalMovementGraph(legalMovementTestMap);

  assert(edgeIds(getLegalNextMovements(graph, "road-db:forward")).includes("road-bc:forward"));
});

test("getLegalMovementsFromPosition handles starts and validates previous edge position", () => {
  const graph = buildLegalMovementGraph(legalMovementTestMap);

  assert.deepEqual(
    edgeIds(
      getLegalMovementsFromPosition(graph, {
        nodeId: "b"
      })
    ),
    ["road-ab:reverse", "road-bc:forward", "road-bd:forward", "road-db:reverse"]
  );
  assert.deepEqual(
    edgeIds(
      getLegalMovementsFromPosition(graph, {
        nodeId: "b",
        previousEdgeId: "road-ab:forward"
      })
    ),
    ["road-ab:reverse", "road-bd:forward", "road-db:reverse"]
  );
  assert.throws(
    () =>
      getLegalMovementsFromPosition(graph, {
        nodeId: "c",
        previousEdgeId: "road-ab:forward"
      }),
    /ends at b, not c/
  );
});

test("legal movement graph rejects unknown nodes and edges clearly", () => {
  const graph = buildLegalMovementGraph(legalMovementTestMap);

  assert.throws(() => getLegalOutgoingMovements(graph, "missing"), /Unknown node id: missing/);
  assert.throws(() => getLegalNextMovements(graph, "missing-edge"), /Unknown edge id: missing-edge/);
});

test("validation catches invalid directional no-entry endpoint and prohibited-turn connectivity", () => {
  const invalidNoEntry: MapDefinition = {
    ...legalMovementTestMap,
    restrictions: [
      {
        id: "invalid-no-entry",
        type: "no_entry",
        roadId: "road-ab",
        fromNodeId: "a",
        toNodeId: "e"
      }
    ]
  };
  const invalidTurn: MapDefinition = {
    ...legalMovementTestMap,
    restrictions: [
      {
        id: "invalid-turn",
        type: "prohibited_turn",
        fromRoadId: "road-ab",
        viaNodeId: "e",
        toRoadId: "road-bc"
      }
    ]
  };

  assert.equal(validateMapDefinition(invalidNoEntry).valid, false);
  assert(validateMapDefinition(invalidNoEntry).errors.some((error) => error.includes("not an endpoint")));
  assert.equal(validateMapDefinition(invalidTurn).valid, false);
  assert(validateMapDefinition(invalidTurn).errors.some((error) => error.includes("not connected")));
});

test("Marlowe District builds a legal movement graph with blocked restrictions", () => {
  const graph = buildLegalMovementGraph(marloweDistrictMap);

  assert(graph.edges.length > 0);
  assert(Object.keys(graph.transitionsByEdgeId).length > 0);
  assert(!graph.edgesById["r12:reverse"]);
  assert(graph.edgesById["r12:forward"]);
  assert(!edgeIds(getLegalNextMovements(graph, "r16:forward")).includes("r13:forward"));
});
