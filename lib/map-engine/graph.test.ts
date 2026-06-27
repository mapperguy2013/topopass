import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMapGraph,
  marloweDistrictMap,
  tinyMap,
  type DirectedEdge,
  type MapDefinition
} from "./index.ts";

function edgeIds(edges: DirectedEdge[]): string[] {
  return edges.map((edge) => edge.id);
}

test("buildMapGraph builds indexes for the tiny fixture", () => {
  const graph = buildMapGraph(tinyMap);

  assert.equal(graph.mapId, tinyMap.id);
  assert.deepEqual(Object.keys(graph.nodesById).sort(), tinyMap.nodes.map((node) => node.id).sort());
  assert.deepEqual(Object.keys(graph.roadsById).sort(), tinyMap.roads.map((road) => road.id).sort());
  assert.equal(graph.edges.length, 5);
  assert.deepEqual(Object.keys(graph.edgesById).sort(), graph.edges.map((edge) => edge.id).sort());
});

test("buildMapGraph preserves two-way and one-way directed edge rules", () => {
  const graph = buildMapGraph(tinyMap);

  assert.deepEqual(edgeIds(graph.edges.filter((edge) => edge.roadId === "road-maple-walk")).sort(), [
    "road-maple-walk:forward",
    "road-maple-walk:reverse"
  ]);
  assert.deepEqual(edgeIds(graph.edges.filter((edge) => edge.roadId === "road-orchard-rise")), [
    "road-orchard-rise:forward"
  ]);
});

test("buildMapGraph groups outgoing and incoming edges by node", () => {
  const graph = buildMapGraph(tinyMap);

  assert.deepEqual(edgeIds(graph.outgoingEdgesByNodeId["node-maple-square"]).sort(), [
    "road-maple-walk:forward"
  ]);
  assert.deepEqual(edgeIds(graph.incomingEdgesByNodeId["node-maple-square"]).sort(), [
    "road-maple-walk:reverse"
  ]);
  assert.deepEqual(edgeIds(graph.outgoingEdgesByNodeId["node-orchard-corner"]).sort(), [
    "road-maple-walk:reverse",
    "road-orchard-rise:forward"
  ]);
  assert.deepEqual(edgeIds(graph.incomingEdgesByNodeId["node-copper-school"]).sort(), [
    "road-lantern-lane:reverse",
    "road-orchard-rise:forward"
  ]);
});

test("buildMapGraph initializes outgoing and incoming arrays for every node", () => {
  const isolatedMap: MapDefinition = {
    ...tinyMap,
    nodes: [...tinyMap.nodes, { id: "node-isolated", x: 999, y: 999 }]
  };
  const graph = buildMapGraph(isolatedMap);

  for (const node of isolatedMap.nodes) {
    assert(Array.isArray(graph.outgoingEdgesByNodeId[node.id]));
    assert(Array.isArray(graph.incomingEdgesByNodeId[node.id]));
  }

  assert.deepEqual(graph.outgoingEdgesByNodeId["node-isolated"], []);
  assert.deepEqual(graph.incomingEdgesByNodeId["node-isolated"], []);
});

test("buildMapGraph converts Marlowe District into a graph", () => {
  const graph = buildMapGraph(marloweDistrictMap);

  assert.equal(Object.keys(graph.nodesById).length, marloweDistrictMap.nodes.length);
  assert.equal(Object.keys(graph.roadsById).length, marloweDistrictMap.roads.length);
  assert.equal(graph.edges.length, 63);
  assert(graph.edgesById["r04:forward"]);
  assert(!graph.edgesById["r04:reverse"]);
  assert(graph.edgesById["r12:forward"]);
  assert(graph.edgesById["r12:reverse"]);
});

test("buildMapGraph populates Marlowe District incoming and outgoing indexes", () => {
  const graph = buildMapGraph(marloweDistrictMap);

  assert(graph.outgoingEdgesByNodeId.n12.length > 0);
  assert(graph.incomingEdgesByNodeId.n12.length > 0);
  assert(edgeIds(graph.outgoingEdgesByNodeId.n04).includes("r04:forward"));
  assert(edgeIds(graph.incomingEdgesByNodeId.n05).includes("r04:forward"));
  assert(edgeIds(graph.outgoingEdgesByNodeId.n12).includes("r12:reverse"));
  assert(edgeIds(graph.incomingEdgesByNodeId.n11).includes("r12:reverse"));
});

test("buildMapGraph rejects invalid maps before building indexes", () => {
  const invalidMap: MapDefinition = {
    ...tinyMap,
    roads: [
      ...tinyMap.roads,
      {
        id: "road-invalid",
        fromNodeId: "node-maple-square",
        toNodeId: "node-missing",
        distanceMeters: 50,
        isOneWay: false,
        name: "Invalid Road"
      }
    ]
  };

  assert.throws(
    () => buildMapGraph(invalidMap),
    /Invalid map definition: Road road-invalid references missing toNodeId: node-missing/
  );
});
