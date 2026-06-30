import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { parseOverpassRoadExtract } from "./overpassImport.ts";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(currentDirectory, "fixtures", "tinyLondonOverpass.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));

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
