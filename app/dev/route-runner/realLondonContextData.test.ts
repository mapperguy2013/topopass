import assert from "node:assert/strict";
import test from "node:test";
import type { OverpassJsonResponse } from "../../../lib/map-engine/osm/index.ts";
import { convertOverpassJsonToRouteMap } from "../../../lib/map-engine/osm/index.ts";
import {
  auditRealLondonContextCoverage,
  buildRealLondonContextFeatures
} from "./realLondonContextData.ts";

const contextFixture: OverpassJsonResponse = {
  elements: [
    { type: "node", id: 1, lat: 51.52, lon: -0.14 },
    { type: "node", id: 2, lat: 51.5201, lon: -0.1398 },
    { type: "node", id: 3, lat: 51.5202, lon: -0.1396 },
    { type: "node", id: 4, lat: 51.5203, lon: -0.1394 },
    { type: "node", id: 5, lat: 51.5199, lon: -0.1397 },
    { type: "node", id: 6, lat: 51.5198, lon: -0.1396 },
    { type: "node", id: 7, lat: 51.5197, lon: -0.1397 },
    { type: "node", id: 8, lat: 51.5198, lon: -0.1398 },
    { type: "node", id: 20, lat: 51.52004, lon: -0.1399, tags: { railway: "station", name: "Pilot Station" } },
    { type: "node", id: 21, lat: 51.52008, lon: -0.13985, tags: { railway: "station" } },
    { type: "node", id: 22, lat: 51.52012, lon: -0.13982, tags: { amenity: "library", name: "Pilot Library" } },
    { type: "node", id: 23, lat: 51.52016, lon: -0.13978, tags: { highway: "crossing", crossing: "uncontrolled" } },
    { type: "node", id: 24, lat: 51.5202, lon: -0.13975, tags: { place: "neighbourhood", name: "Fitzrovia" } },
    { type: "node", id: 25, lat: 51.52022, lon: -0.13972, tags: { amenity: "bench", name: "Named Bench" } },
    { type: "way", id: 100, nodes: [1, 2], tags: { highway: "residential", name: "Context Road" } },
    { type: "way", id: 200, nodes: [1, 2, 3], tags: { railway: "rail", name: "Main Line" } },
    { type: "way", id: 201, nodes: [2, 3, 4], tags: { railway: "subway", name: "Subsurface Line" } },
    { type: "way", id: 300, nodes: [3, 4], tags: { highway: "primary", bridge: "yes", "bridge:name": "Pilot Bridge" } },
    { type: "way", id: 301, nodes: [4, 3], tags: { highway: "secondary", man_made: "bridge" } },
    { type: "way", id: 400, nodes: [5, 6, 7, 8, 5], tags: { leisure: "garden", name: "Pilot Garden" } },
    { type: "way", id: 401, nodes: [1, 2, 3, 4, 1], tags: { highway: "pedestrian", area: "yes", name: "Pilot Walk" } },
    { type: "way", id: 500, nodes: [1, 2, 3, 4, 1], tags: { natural: "water", name: "Pilot Basin" } },
    { type: "way", id: 501, nodes: [5, 6], tags: { waterway: "canal" } },
    { type: "way", id: 600, nodes: [5, 6, 7, 8, 5], tags: { place: "square", name: "Pilot Square" } },
    { type: "way", id: 700, nodes: [999, 998], tags: { railway: "rail", name: "Broken Rail" } }
  ]
};

function convertedContextMap() {
  const converted = convertOverpassJsonToRouteMap(contextFixture, {
    mapId: "real-london-context-adapter-test",
    name: "Real London Context Adapter Test"
  });

  if (!converted.ok) {
    throw new Error(`Expected context fixture to convert: ${converted.errors.join("; ")}`);
  }

  return converted.map;
}

test("Stage 149.5 context audit counts fixture-backed Real London coverage deterministically", () => {
  const audit = auditRealLondonContextCoverage(contextFixture);

  assert.deepEqual(audit.counts, {
    railFeatures: 3,
    subwayRailFeatures: 1,
    stationFeatures: 2,
    namedStationFeatures: 1,
    bridgeFeatures: 2,
    namedBridgeFeatures: 1,
    crossingFeatures: 1,
    landmarkLikeFeatures: 1,
    parkOpenSpaceFeatures: 1,
    waterFeatures: 2,
    namedWaterFeatures: 1,
    areaContextLabelFeatures: 2
  });
  assert.deepEqual(
    audit.orderedCategories.map((category) => category.id),
    [
      "railFeatures",
      "subwayRailFeatures",
      "stationFeatures",
      "namedStationFeatures",
      "bridgeFeatures",
      "namedBridgeFeatures",
      "crossingFeatures",
      "landmarkLikeFeatures",
      "parkOpenSpaceFeatures",
      "waterFeatures",
      "namedWaterFeatures",
      "areaContextLabelFeatures"
    ]
  );
});

test("Stage 149.5 context audit ignores malformed optional fields and unknown feature types", () => {
  const audit = auditRealLondonContextCoverage({
    elements: [
      { type: "node", id: 1, lat: 51.52, lon: -0.14, tags: { amenity: "bench", name: "Named Bench" } },
      { type: "node", id: 2, lat: 51.52, lon: -0.14, tags: { railway: 123 } },
      { type: "way", id: 3, nodes: [1, "bad"], tags: { railway: "rail" } },
      { type: "relation", id: 4, tags: { natural: "water", name: "Relation Water" } }
    ]
  });

  assert.deepEqual(audit.counts, {
    railFeatures: 0,
    subwayRailFeatures: 0,
    stationFeatures: 0,
    namedStationFeatures: 0,
    bridgeFeatures: 0,
    namedBridgeFeatures: 0,
    crossingFeatures: 0,
    landmarkLikeFeatures: 0,
    parkOpenSpaceFeatures: 0,
    waterFeatures: 0,
    namedWaterFeatures: 0,
    areaContextLabelFeatures: 0
  });
});

test("Stage 150.5 adapter normalises supported context features and stable ordering", () => {
  const features = buildRealLondonContextFeatures(convertedContextMap(), contextFixture);

  assert.deepEqual(
    features.map((feature) => [feature.kind, feature.id, feature.name ?? ""]),
    [
      ["rail", "rail-way-200", "Main Line"],
      ["rail", "rail-way-201", "Subsurface Line"],
      ["station", "station-node-20", "Pilot Station"],
      ["station", "station-node-21", ""],
      ["bridge", "bridge-way-300", "Pilot Bridge"],
      ["bridge", "bridge-way-301", ""],
      ["crossing", "crossing-node-23", ""],
      ["landmark", "landmark-node-22", "Pilot Library"],
      ["park", "park-way-400", "Pilot Garden"],
      ["water", "water-way-500", "Pilot Basin"],
      ["water", "waterway-way-501", ""],
      ["pedestrian-area", "pedestrian-area-way-401", "Pilot Walk"],
      ["area", "area-node-24", "Fitzrovia"],
      ["area", "area-way-600", "Pilot Square"]
    ]
  );
  assert.equal(features.find((feature) => feature.id === "rail-way-201")?.kind, "rail");
  assert.equal(
    features.find((feature) => feature.id === "rail-way-201" && feature.kind === "rail")?.subtype,
    "subway"
  );
  assert.equal(features.some((feature) => feature.id.includes("700")), false);
});

test("Stage 150.5 adapter safely no-ops without projection fixture or usable geometry", () => {
  assert.deepEqual(buildRealLondonContextFeatures({ ...convertedContextMap(), metadata: undefined }, contextFixture), []);
  assert.deepEqual(buildRealLondonContextFeatures(convertedContextMap(), { elements: [{ type: "node", id: 1 }] }), []);
});
