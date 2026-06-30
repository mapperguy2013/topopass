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
const largeFixturePath = path.join(currentDirectory, "fixtures", "largeLondonOverpass.json");
const mediumFixturePath = path.join(currentDirectory, "fixtures", "mediumLondonOverpass.json");
const realLondonPilotFixturePath = path.join(currentDirectory, "fixtures", "realLondonPilotOverpass.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
const largeFixture = JSON.parse(readFileSync(largeFixturePath, "utf8"));
const mediumFixture = JSON.parse(readFileSync(mediumFixturePath, "utf8"));
const realLondonPilotFixture = JSON.parse(readFileSync(realLondonPilotFixturePath, "utf8"));

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

function convertLargeFixture() {
  const result = convertOverpassJsonToRouteMap(largeFixture, {
    mapId: "osm-large-london",
    name: "OSM Large London"
  });

  assert.equal(result.ok, true, result.ok ? undefined : result.errors.join("; "));

  return result.map;
}

function convertRealLondonPilotFixture() {
  const result = convertOverpassJsonToRouteMap(realLondonPilotFixture, {
    mapId: "osm-real-london-pilot",
    name: "OSM Real London Pilot"
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
  assert.equal(first.metadata.projection.method, "local-web-mercator");
  assert.equal(first.metadata.projection.originLat, (51.5301 + 51.5333) / 2);
  assert.equal(first.metadata.projection.originLon, (-0.1248 + -0.1175) / 2);
  assert.equal(Number.isFinite(first.metadata.projection.originMercatorX), true);
  assert.equal(Number.isFinite(first.metadata.projection.originMercatorY), true);
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

test("real London pilot fixture converts into a real exported route graph", () => {
  const map = convertRealLondonPilotFixture();

  assert.equal(map.id, "osm-real-london-pilot");
  assert.equal(map.name, "OSM Real London Pilot");
  assert.equal(map.nodes.length, 390);
  assert.equal(map.roads.length, 395);
  assert.equal(map.metadata.sourceRoadCount, 161);
  assert.equal(map.metadata.convertedRoadSegmentCount, 395);
  assert.deepEqual(map.metadata.blockedOsmWayIds, [58987876, 779180492]);
  assert.deepEqual(map.metadata.ignoredRelationIds, []);
});

test("real London pilot projection uses north-up local Web Mercator axes", () => {
  const map = convertRealLondonPilotFixture();
  const westKeppelNode = map.nodes.find((node) => node.id === "osm-node-104302");
  const eastKeppelNode = map.nodes.find((node) => node.id === "osm-node-107844");
  const northernNode = map.nodes.reduce((current, candidate) =>
    candidate.metadata.lat > current.metadata.lat ? candidate : current
  );
  const southernNode = map.nodes.reduce((current, candidate) =>
    candidate.metadata.lat < current.metadata.lat ? candidate : current
  );

  assert.ok(westKeppelNode);
  assert.ok(eastKeppelNode);
  assert.equal(map.metadata.projection.method, "local-web-mercator");
  assert.deepEqual(map.metadata.projection.projectedBounds, {
    minX: -413.924829,
    maxX: 413.924829,
    minY: -436.462593,
    maxY: 436.439213
  });
  assert.ok(eastKeppelNode.x > westKeppelNode.x, "eastward longitude should increase x");
  assert.ok(northernNode.y < southernNode.y, "northward latitude should move toward the top of the canvas");
});

test("real London pilot segment distances stay on the local metric route scale", () => {
  const map = convertRealLondonPilotFixture();
  const storeStreetSegment = map.roads.find((road) => road.id === "osm-way-2644236-segment-0");

  assert.ok(storeStreetSegment);
  assert.equal(storeStreetSegment.distanceMeters, 4.45895723684103);
});

test("real London pilot fixture preserves road hierarchy metadata for rendering", () => {
  const map = convertRealLondonPilotFixture();
  const cheniesStreet = map.roads.find((road) => road.name === "Chenies Street");
  const maletStreet = map.roads.find((road) => road.name === "Malet Street");
  const torringtonPlace = map.roads.find((road) => road.name === "Torrington Place");

  assert.ok(cheniesStreet);
  assert.ok(maletStreet);
  assert.ok(torringtonPlace);
  assert.equal(cheniesStreet.metadata.highway, "primary");
  assert.equal(maletStreet.metadata.highway, "residential");
  assert.equal(torringtonPlace.metadata.highway, "tertiary");
  assert.equal(torringtonPlace.metadata.originalDirection, "forward");
  assert.equal(torringtonPlace.isOneWay, true);
});

test("real London pilot one-way road only generates legal forward edges", () => {
  const map = convertRealLondonPilotFixture();
  const graph = buildMapGraph(map);
  const legalStoreStreet = findShortestLegalRoute({
    graph,
    startNodeId: "osm-node-333719180",
    endNodeId: "osm-node-25472045",
    restrictions: map.restrictions
  });
  const illegalReverseStoreStreetEdge = graph.edges.find(
    (edge) => edge.roadId === "osm-way-2644236-segment-2" && edge.fromNodeId === "osm-node-25472045"
  );

  assert.equal(legalStoreStreet.found, true);
  assert.equal(illegalReverseStoreStreetEdge, undefined);

  if (legalStoreStreet.found) {
    assert.ok(legalStoreStreet.roadIds.every((roadId) => roadId.startsWith("osm-way-2644236-")));
    assert.deepEqual(legalStoreStreet.nodeIds, [
      "osm-node-333719180",
      "osm-node-9523025798",
      "osm-node-6355365946",
      "osm-node-25472045"
    ]);
  }
});

test("large London fixture converts into a graph larger than the medium fixture", () => {
  const mediumMap = convertMediumFixture();
  const largeMap = convertLargeFixture();

  assert.equal(largeMap.id, "osm-large-london");
  assert.equal(largeMap.name, "OSM Large London");
  assert.equal(largeMap.nodes.length, 63);
  assert.equal(largeMap.roads.length, 122);
  assert.ok(largeMap.nodes.length > mediumMap.nodes.length);
  assert.ok(largeMap.roads.length > mediumMap.roads.length);
  assert.equal(largeMap.metadata.sourceRoadCount, 21);
  assert.equal(largeMap.metadata.convertedRoadSegmentCount, 122);
  assert.deepEqual(largeMap.metadata.blockedOsmWayIds, [11022]);
  assert.deepEqual(largeMap.metadata.ignoredRelationIds, [12001]);
});

test("large London fixture preserves named road hierarchy metadata", () => {
  const map = convertLargeFixture();
  const eustonRoad = map.roads.find((road) => road.name === "Euston Road");
  const gowerStreet = map.roads.find((road) => road.name === "Gower Street");
  const storeStreet = map.roads.find((road) => road.name === "Store Street");
  const tavistockPlace = map.roads.find((road) => road.name === "Tavistock Place");

  assert.ok(eustonRoad);
  assert.ok(gowerStreet);
  assert.ok(storeStreet);
  assert.ok(tavistockPlace);
  assert.equal(eustonRoad.metadata.highway, "primary");
  assert.equal(gowerStreet.metadata.highway, "secondary");
  assert.equal(gowerStreet.metadata.originalDirection, "reverse");
  assert.equal(storeStreet.metadata.highway, "service");
  assert.equal(tavistockPlace.isOneWay, true);
});

test("large London one-way detour avoids illegal reverse Tavistock Place travel", () => {
  const map = convertLargeFixture();
  const graph = buildMapGraph(map);
  const legalEastbound = findShortestLegalRoute({
    graph,
    startNodeId: "osm-node-10020",
    endNodeId: "osm-node-10026",
    restrictions: map.restrictions
  });
  const westboundDetour = findShortestLegalRoute({
    graph,
    startNodeId: "osm-node-10026",
    endNodeId: "osm-node-10020",
    restrictions: map.restrictions
  });
  const illegalReverseTavistockEdge = graph.edges.find(
    (edge) => edge.roadId === "osm-way-11003-segment-5" && edge.fromNodeId === "osm-node-10026"
  );

  assert.equal(legalEastbound.found, true);
  assert.equal(westboundDetour.found, true);
  assert.equal(illegalReverseTavistockEdge, undefined);

  if (legalEastbound.found) {
    assert.ok(legalEastbound.roadIds.every((roadId) => roadId.startsWith("osm-way-11003-")));
  }

  if (westboundDetour.found) {
    assert.equal(westboundDetour.roadIds.some((roadId) => roadId.startsWith("osm-way-11003-")), false);
    assert.deepEqual(westboundDetour.nodeIds, [
      "osm-node-10026",
      "osm-node-10036",
      "osm-node-10035",
      "osm-node-10034",
      "osm-node-10033",
      "osm-node-10032",
      "osm-node-10031",
      "osm-node-10030",
      "osm-node-10020"
    ]);
  }
});
