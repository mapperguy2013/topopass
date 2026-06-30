import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { parseOverpassRoadExtract } from "./overpassImport.ts";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(currentDirectory, "fixtures", "tinyLondonOverpass.json");
const largeFixturePath = path.join(currentDirectory, "fixtures", "largeLondonOverpass.json");
const mediumFixturePath = path.join(currentDirectory, "fixtures", "mediumLondonOverpass.json");
const realLondonPilotFixturePath = path.join(currentDirectory, "fixtures", "realLondonPilotOverpass.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
const largeFixture = JSON.parse(readFileSync(largeFixturePath, "utf8"));
const mediumFixture = JSON.parse(readFileSync(mediumFixturePath, "utf8"));
const realLondonPilotFixture = JSON.parse(readFileSync(realLondonPilotFixturePath, "utf8"));

function parseFixture() {
  return parseOverpassRoadExtract(fixture);
}

function roadByWayId(osmWayId: number) {
  const road = parseFixture().roads.find((candidate) => candidate.osmWayId === osmWayId);

  assert.ok(road, `Expected OSM way ${osmWayId} to be imported as a road`);

  return road;
}

function excludedByWayId(osmWayId: number) {
  const excludedWay = parseFixture().excludedWays.find((candidate) => candidate.osmWayId === osmWayId);

  assert.ok(excludedWay, `Expected OSM way ${osmWayId} to be excluded`);

  return excludedWay;
}

test("parses Overpass nodes and accepted road-like ways", () => {
  const result = parseFixture();

  assert.equal(result.nodeCount, 10);
  assert.deepEqual(
    result.roads.map((road) => road.osmWayId),
    [2001, 2002, 2003, 2004, 2014]
  );

  const road = roadByWayId(2001);

  assert.equal(road.id, "osm-way-2001");
  assert.equal(road.source, "osm");
  assert.equal(road.name, "King's Cross Road");
  assert.equal(road.highway, "primary");
  assert.equal(road.oneWay, false);
  assert.equal(road.direction, "both");
  assert.deepEqual(road.nodeRefs, [1001, 1002, 1003]);
  assert.deepEqual(road.coordinates, [
    { osmNodeId: 1001, lat: 51.5301, lon: -0.1248 },
    { osmNodeId: 1002, lat: 51.5304, lon: -0.1239 },
    { osmNodeId: 1003, lat: 51.5307, lon: -0.1231 }
  ]);
  assert.equal(road.rawTags.highway, "primary");
});

test("filters accepted road types into deterministic output", () => {
  const result = parseFixture();

  assert.deepEqual(
    result.roads.map((road) => road.highway),
    ["primary", "residential", "tertiary", "secondary", "service"]
  );
});

test("excludes footways, cycleways, proposed ways, and buildings", () => {
  assert.equal(excludedByWayId(2005).reason, "ignored_non_road");
  assert.equal(excludedByWayId(2006).reason, "ignored_non_road");
  assert.equal(excludedByWayId(2012).reason, "ignored_non_road");
  assert.equal(excludedByWayId(2013).reason, "ignored_non_road");
});

test("excludes motorway and trunk roads for learner route planning", () => {
  assert.equal(excludedByWayId(2009).reason, "unsupported_highway");
  assert.equal(excludedByWayId(2010).reason, "unsupported_highway");
});

test("detects OSM one-way, reverse one-way, and roundabout directions", () => {
  const forward = roadByWayId(2002);
  const reverse = roadByWayId(2003);
  const roundabout = roadByWayId(2004);
  const twoWay = roadByWayId(2001);

  assert.equal(forward.oneWay, true);
  assert.equal(forward.direction, "forward");
  assert.equal(reverse.oneWay, true);
  assert.equal(reverse.direction, "reverse");
  assert.equal(roundabout.oneWay, true);
  assert.equal(roundabout.direction, "forward");
  assert.equal(twoWay.oneWay, false);
  assert.equal(twoWay.direction, "both");
});

test("excludes roads blocked by vehicle access tags", () => {
  assert.equal(excludedByWayId(2007).reason, "blocked_access");
  assert.equal(excludedByWayId(2008).reason, "blocked_access");

  const result = parseFixture();

  assert.equal(result.roads.some((road) => road.osmWayId === 2007), false);
  assert.equal(result.roads.some((road) => road.osmWayId === 2008), false);
});

test("handles missing node references safely", () => {
  const missingFixtureResult = parseOverpassRoadExtract({
    elements: [
      { type: "node", id: 1, lat: 51.5, lon: -0.12 },
      {
        type: "way",
        id: 42,
        nodes: [1, 2],
        tags: { highway: "residential", name: "Broken Street" }
      }
    ]
  });

  assert.deepEqual(missingFixtureResult.roads, []);
  assert.deepEqual(missingFixtureResult.excludedWays, [
    {
      osmWayId: 42,
      reason: "missing_node_reference",
      highway: "residential",
      missingNodeRefs: [2],
      rawTags: { highway: "residential", name: "Broken Street" }
    }
  ]);

  const missingNodeRoad = excludedByWayId(2011);

  assert.equal(missingNodeRoad.reason, "missing_node_reference");
  assert.deepEqual(missingNodeRoad.missingNodeRefs, [9999]);
});

test("ignores relations for Stage 101 graph conversion", () => {
  const result = parseFixture();

  assert.deepEqual(result.ignoredRelationIds, [3001]);
});

test("returns stable deterministic output regardless of element order", () => {
  const reversedFixture = {
    ...fixture,
    elements: [...fixture.elements].reverse()
  };

  assert.deepEqual(parseOverpassRoadExtract(reversedFixture), parseFixture());
});

test("medium London fixture parses as a larger deterministic road extract", () => {
  const tinyResult = parseFixture();
  const mediumResult = parseOverpassRoadExtract(mediumFixture);

  assert.equal(mediumResult.nodeCount, 25);
  assert.deepEqual(
    mediumResult.roads.map((road) => road.osmWayId),
    [6001, 6002, 6003, 6004, 6005, 6006, 6007, 6008, 6009, 6010, 6011, 6012, 6013]
  );
  assert.ok(mediumResult.roads.length > tinyResult.roads.length);
  assert.ok(mediumResult.roads.length <= 20);
  assert.deepEqual(
    mediumResult.excludedWays.map((way) => [way.osmWayId, way.reason]),
    [
      [6014, "ignored_non_road"],
      [6015, "ignored_non_road"],
      [6016, "blocked_access"],
      [6017, "unsupported_highway"]
    ]
  );
  assert.deepEqual(mediumResult.ignoredRelationIds, [7001]);
});

test("medium London fixture detects one-way, reverse one-way, roundabout, and blocked access tags", () => {
  const mediumResult = parseOverpassRoadExtract(mediumFixture);
  const tavistockPlace = mediumResult.roads.find((road) => road.osmWayId === 6005);
  const gowerStreet = mediumResult.roads.find((road) => road.osmWayId === 6004);
  const russellSquare = mediumResult.roads.find((road) => road.osmWayId === 6007);
  const gyratory = mediumResult.roads.find((road) => road.osmWayId === 6013);

  assert.ok(tavistockPlace);
  assert.ok(gowerStreet);
  assert.ok(russellSquare);
  assert.ok(gyratory);
  assert.equal(tavistockPlace.direction, "forward");
  assert.equal(gowerStreet.direction, "reverse");
  assert.equal(russellSquare.direction, "reverse");
  assert.equal(gyratory.direction, "forward");
  assert.equal(gyratory.oneWay, true);
  assert.equal(mediumResult.excludedWays.find((way) => way.osmWayId === 6016)?.reason, "blocked_access");
});

test("real London pilot fixture parses as a compact deterministic road extract", () => {
  const result = parseOverpassRoadExtract(realLondonPilotFixture);

  assert.equal(result.nodeCount, 12);
  assert.deepEqual(
    result.roads.map((road) => road.osmWayId),
    [9101, 9102, 9103, 9104, 9105, 9106, 9107, 9108, 9109, 9110]
  );
  assert.deepEqual(
    result.roads.map((road) => road.name),
    [
      "Euston Road",
      "Gower Street",
      "Woburn Place",
      "Judd Street",
      "Tavistock Place",
      "Russell Square",
      "Store Street",
      "Herbrand Street",
      "Marchmont Street",
      "Cartwright Gardens"
    ]
  );
  assert.deepEqual(
    result.excludedWays.map((way) => [way.osmWayId, way.reason]),
    [
      [9111, "blocked_access"],
      [9112, "ignored_non_road"]
    ]
  );
  assert.deepEqual(result.ignoredRelationIds, [9201]);
});

test("real London pilot fixture detects real-world one-way and blocked access metadata", () => {
  const result = parseOverpassRoadExtract(realLondonPilotFixture);
  const gowerStreet = result.roads.find((road) => road.osmWayId === 9102);
  const tavistockPlace = result.roads.find((road) => road.osmWayId === 9105);
  const russellSquare = result.roads.find((road) => road.osmWayId === 9106);
  const storeStreet = result.roads.find((road) => road.osmWayId === 9107);

  assert.ok(gowerStreet);
  assert.ok(tavistockPlace);
  assert.ok(russellSquare);
  assert.ok(storeStreet);
  assert.equal(gowerStreet.direction, "reverse");
  assert.equal(gowerStreet.oneWay, true);
  assert.equal(tavistockPlace.direction, "forward");
  assert.equal(russellSquare.direction, "forward");
  assert.equal(storeStreet.oneWay, false);
  assert.equal(result.excludedWays.find((way) => way.osmWayId === 9111)?.reason, "blocked_access");
});

test("large London fixture parses as a larger deterministic road extract", () => {
  const mediumResult = parseOverpassRoadExtract(mediumFixture);
  const result = parseOverpassRoadExtract(largeFixture);

  assert.equal(result.nodeCount, 63);
  assert.equal(result.roads.length, 21);
  assert.ok(result.nodeCount > mediumResult.nodeCount);
  assert.ok(result.roads.length > mediumResult.roads.length);
  assert.deepEqual(
    result.roads.map((road) => road.osmWayId),
    [
      11001, 11002, 11003, 11004, 11005, 11006, 11007, 11008, 11009, 11010, 11011, 11012, 11013,
      11014, 11015, 11016, 11017, 11018, 11019, 11020, 11021
    ]
  );
  assert.deepEqual(
    result.excludedWays.map((way) => [way.osmWayId, way.reason]),
    [
      [11022, "blocked_access"],
      [11023, "ignored_non_road"],
      [11024, "unsupported_highway"]
    ]
  );
  assert.deepEqual(result.ignoredRelationIds, [12001]);
});

test("large London fixture preserves hierarchy and one-way metadata", () => {
  const result = parseOverpassRoadExtract(largeFixture);
  const eustonRoad = result.roads.find((road) => road.osmWayId === 11001);
  const gowerStreet = result.roads.find((road) => road.osmWayId === 11010);
  const tavistockPlace = result.roads.find((road) => road.osmWayId === 11003);
  const bedfordWay = result.roads.find((road) => road.osmWayId === 11013);
  const storeStreet = result.roads.find((road) => road.osmWayId === 11007);

  assert.ok(eustonRoad);
  assert.ok(gowerStreet);
  assert.ok(tavistockPlace);
  assert.ok(bedfordWay);
  assert.ok(storeStreet);
  assert.equal(eustonRoad.highway, "primary");
  assert.equal(gowerStreet.direction, "reverse");
  assert.equal(gowerStreet.oneWay, true);
  assert.equal(tavistockPlace.direction, "forward");
  assert.equal(bedfordWay.direction, "forward");
  assert.equal(storeStreet.highway, "service");
  assert.equal(storeStreet.oneWay, false);
});

test("handles invalid or empty Overpass payloads safely", () => {
  assert.deepEqual(parseOverpassRoadExtract(null), {
    roads: [],
    excludedWays: [],
    ignoredRelationIds: [],
    nodeCount: 0
  });

  assert.deepEqual(parseOverpassRoadExtract({ elements: "not-an-array" }), {
    roads: [],
    excludedWays: [],
    ignoredRelationIds: [],
    nodeCount: 0
  });
});
