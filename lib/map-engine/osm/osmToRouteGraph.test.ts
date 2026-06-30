import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildMapGraph } from "../graph.ts";
import { checkRouteLegality } from "../legalityEngine.ts";
import { findShortestLegalRoute } from "../shortestRoute.ts";
import { parseOverpassRoadExtract } from "./overpassImport.ts";
import { convertImportedOsmToRouteMap, convertOverpassJsonToRouteMap } from "./osmToRouteGraph.ts";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(currentDirectory, "fixtures", "tinyLondonOverpass.json");
const mediumFixturePath = path.join(currentDirectory, "fixtures", "mediumLondonOverpass.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
const mediumFixture = JSON.parse(readFileSync(mediumFixturePath, "utf8"));

function convertFixture() {
  const result = convertOverpassJsonToRouteMap(fixture, {
    mapId: "tiny-london-osm",
    name: "Tiny London OSM Prototype"
  });

  assert.equal(result.ok, true, result.ok ? undefined : result.errors.join("; "));

  return result.map;
}

function convertMediumFixture() {
  const result = convertOverpassJsonToRouteMap(mediumFixture, {
    mapId: "medium-london-osm",
    name: "Medium London OSM Prototype"
  });

  assert.equal(result.ok, true, result.ok ? undefined : result.errors.join("; "));

  return result.map;
}

test("converts OSM nodes into internal route graph nodes with metadata", () => {
  const map = convertFixture();

  assert.equal(map.nodes.length, 10);
  assert.equal(map.nodes[0].id, "osm-node-1001");
  assert.equal(map.nodes[0].metadata.source, "osm");
  assert.equal(map.nodes[0].metadata.osmNodeId, 1001);
  assert.equal(map.nodes[0].metadata.lat, 51.5301);
  assert.equal(map.nodes[0].metadata.lon, -0.1248);
  assert.equal(Number.isFinite(map.nodes[0].x), true);
  assert.equal(Number.isFinite(map.nodes[0].y), true);
});

test("converts OSM way node pairs into connected internal road segments", () => {
  const map = convertFixture();

  assert.equal(map.roads.length, 9);
  assert.deepEqual(
    map.roads.map((road) => road.id),
    [
      "osm-way-2001-segment-0",
      "osm-way-2001-segment-1",
      "osm-way-2002-segment-0",
      "osm-way-2002-segment-1",
      "osm-way-2003-segment-0",
      "osm-way-2004-segment-0",
      "osm-way-2004-segment-1",
      "osm-way-2004-segment-2",
      "osm-way-2014-segment-0"
    ]
  );

  assert.deepEqual(
    map.roads.slice(0, 2).map((road) => [road.fromNodeId, road.toNodeId]),
    [
      ["osm-node-1001", "osm-node-1002"],
      ["osm-node-1002", "osm-node-1003"]
    ]
  );
});

test("preserves road names, OSM ids, highway tags, and raw tags for debugging", () => {
  const map = convertFixture();
  const road = map.roads.find((candidate) => candidate.id === "osm-way-2002-segment-0");

  assert.ok(road);
  assert.equal(road.name, "Argyle Street");
  assert.equal(road.metadata.osmWayId, 2002);
  assert.equal(road.metadata.highway, "residential");
  assert.equal(road.metadata.originalDirection, "forward");
  assert.equal(road.metadata.rawTags.oneway, "yes");
});

test("local projection is deterministic and stores bounding box metadata", () => {
  const first = convertFixture();
  const second = convertFixture();

  assert.deepEqual(first.metadata.projection, second.metadata.projection);
  assert.equal(first.metadata.projection.originLat, (51.5301 + 51.5333) / 2);
  assert.equal(first.metadata.projection.originLon, (-0.1248 + -0.1175) / 2);
  assert.equal(first.metadata.projection.latLonBounds.minLat, 51.5301);
  assert.equal(first.metadata.projection.latLonBounds.maxLon, -0.1175);
});

test("one-way ways only route in the legal direction", () => {
  const map = convertFixture();
  const graph = buildMapGraph(map);
  const legalForward = findShortestLegalRoute({
    graph,
    startNodeId: "osm-node-1001",
    endNodeId: "osm-node-1005",
    restrictions: map.restrictions
  });
  const illegalReverse = findShortestLegalRoute({
    graph,
    startNodeId: "osm-node-1005",
    endNodeId: "osm-node-1001",
    restrictions: map.restrictions
  });

  assert.equal(legalForward.found, true);
  assert.equal(illegalReverse.found, false);
  assert.equal(illegalReverse.reason, "NO_ROUTE");
});

test("oneway=-1 reverses generated segment direction", () => {
  const map = convertFixture();
  const road = map.roads.find((candidate) => candidate.id === "osm-way-2003-segment-0");
  const graph = buildMapGraph(map);
  const legalReverseWay = findShortestLegalRoute({
    graph,
    startNodeId: "osm-node-1006",
    endNodeId: "osm-node-1005",
    restrictions: map.restrictions
  });
  const illegalOriginalWay = findShortestLegalRoute({
    graph,
    startNodeId: "osm-node-1005",
    endNodeId: "osm-node-1006",
    restrictions: map.restrictions
  });

  assert.ok(road);
  assert.equal(road.fromNodeId, "osm-node-1006");
  assert.equal(road.toNodeId, "osm-node-1005");
  assert.equal(road.isOneWay, true);
  assert.equal(legalReverseWay.found, true);
  assert.equal(illegalOriginalWay.found, false);
  assert.equal(illegalOriginalWay.reason, "NO_ROUTE");
});

test("roundabouts are treated as one-way generated segments", () => {
  const map = convertFixture();
  const graph = buildMapGraph(map);
  const roundaboutRoads = map.roads.filter((road) => road.metadata.osmWayId === 2004);
  const reverseEdge = graph.edges.find(
    (edge) => edge.fromNodeId === "osm-node-1008" && edge.toNodeId === "osm-node-1007"
  );

  assert.equal(roundaboutRoads.length, 3);
  assert.equal(roundaboutRoads.every((road) => road.isOneWay), true);
  assert.equal(reverseEdge, undefined);
});

test("missing or too-short imported roads do not crash conversion", () => {
  const parsed = parseOverpassRoadExtract({
    elements: [
      { type: "node", id: 1, lat: 51.5, lon: -0.12 },
      {
        type: "way",
        id: 99,
        nodes: [1, 2],
        tags: { highway: "residential", name: "Broken Street" }
      }
    ]
  });
  const result = convertImportedOsmToRouteMap(parsed);

  assert.equal(result.ok, false);
  assert.deepEqual(result.ok ? [] : result.errors, [
    "OSM route graph conversion requires at least one valid road coordinate."
  ]);
});

test("non-road and blocked ways stay out of the converted graph", () => {
  const importResult = parseOverpassRoadExtract(fixture);
  const map = convertFixture();

  assert.equal(map.roads.some((road) => road.name === "Canal Walk"), false);
  assert.equal(map.roads.some((road) => road.name === "Depot Yard"), false);
  assert.deepEqual(map.metadata.blockedOsmWayIds, [2007, 2008]);
  assert.equal(importResult.excludedWays.some((way) => way.osmWayId === 2005), true);
});

test("shortest-route engine can run on the converted graph", () => {
  const map = convertFixture();
  const graph = buildMapGraph(map);
  const result = findShortestLegalRoute({
    graph,
    startNodeId: "osm-node-1001",
    endNodeId: "osm-node-1005",
    restrictions: map.restrictions
  });

  assert.equal(result.found, true);

  if (result.found) {
    assert.deepEqual(result.nodeIds, [
      "osm-node-1001",
      "osm-node-1002",
      "osm-node-1003",
      "osm-node-1004",
      "osm-node-1005"
    ]);
    assert.deepEqual(result.roadIds, [
      "osm-way-2001-segment-0",
      "osm-way-2001-segment-1",
      "osm-way-2002-segment-0",
      "osm-way-2002-segment-1"
    ]);
  }
});

test("legality engine rejects illegal reverse one-way travel on converted roads", () => {
  const map = convertFixture();
  const result = checkRouteLegality({
    map,
    movements: [
      {
        roadId: "osm-way-2002-segment-1",
        fromNodeId: "osm-node-1005",
        toNodeId: "osm-node-1004"
      }
    ]
  });

  assert.equal(result.isLegal, false);
  assert.equal(result.automaticFail, true);
  assert.equal(result.illegalMovements[0]?.type, "wrong_way_one_way");
});

test("converter accepts Stage 102 highway classes from Stage 101 parser output", () => {
  const result = convertOverpassJsonToRouteMap({
    elements: [
      { type: "node", id: 1, lat: 51.5, lon: -0.12 },
      { type: "node", id: 2, lat: 51.5001, lon: -0.1199 },
      { type: "node", id: 3, lat: 51.5002, lon: -0.1198 },
      {
        type: "way",
        id: 1,
        nodes: [1, 2],
        tags: { highway: "primary_link", name: "Primary Link" }
      },
      {
        type: "way",
        id: 2,
        nodes: [2, 3],
        tags: { highway: "road", name: "Mapped Road" }
      }
    ]
  });

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.deepEqual(
      result.map.roads.map((road) => road.metadata.highway),
      ["primary_link", "road"]
    );
  }
});

test("medium London fixture converts into a compact route graph", () => {
  const tinyMap = convertFixture();
  const mediumMap = convertMediumFixture();

  assert.equal(mediumMap.nodes.length, 25);
  assert.equal(mediumMap.roads.length, 48);
  assert.ok(mediumMap.nodes.length > tinyMap.nodes.length);
  assert.ok(mediumMap.roads.length > tinyMap.roads.length);
  assert.ok(mediumMap.roads.length <= 120);
  assert.equal(mediumMap.metadata.sourceRoadCount, 13);
  assert.equal(mediumMap.metadata.convertedRoadSegmentCount, 48);
  assert.deepEqual(mediumMap.metadata.blockedOsmWayIds, [6016]);
});

test("medium London fixture preserves names and highway metadata for rendering", () => {
  const mediumMap = convertMediumFixture();
  const eustonRoad = mediumMap.roads.find((road) => road.name === "Euston Road");
  const storeStreet = mediumMap.roads.find((road) => road.name === "Store Street");

  assert.ok(eustonRoad);
  assert.ok(storeStreet);
  assert.equal(eustonRoad.metadata.highway, "primary");
  assert.equal(storeStreet.metadata.highway, "service");
});

test("medium London one-way roads only generate legal directed graph edges", () => {
  const mediumMap = convertMediumFixture();
  const graph = buildMapGraph(mediumMap);
  const eastboundTavistock = findShortestLegalRoute({
    graph,
    startNodeId: "osm-node-5011",
    endNodeId: "osm-node-5015",
    restrictions: mediumMap.restrictions
  });
  const westboundDetour = findShortestLegalRoute({
    graph,
    startNodeId: "osm-node-5015",
    endNodeId: "osm-node-5011",
    restrictions: mediumMap.restrictions
  });
  const illegalReverseTavistockEdge = graph.edges.find(
    (edge) => edge.roadId === "osm-way-6005-segment-3" && edge.fromNodeId === "osm-node-5015"
  );

  assert.equal(eastboundTavistock.found, true);
  assert.equal(westboundDetour.found, true);
  assert.equal(illegalReverseTavistockEdge, undefined);

  if (eastboundTavistock.found) {
    assert.ok(eastboundTavistock.roadIds.every((roadId) => roadId.startsWith("osm-way-6005-")));
  }

  if (westboundDetour.found) {
    assert.equal(westboundDetour.roadIds.some((roadId) => roadId.startsWith("osm-way-6005-")), false);
  }
});
