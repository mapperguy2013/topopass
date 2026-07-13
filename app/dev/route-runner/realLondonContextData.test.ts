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

const atlasFixture: OverpassJsonResponse = {
  elements: [
    { type: "node", id: 1, lat: 51.52, lon: -0.14 },
    { type: "node", id: 2, lat: 51.5201, lon: -0.1398 },
    { type: "node", id: 3, lat: 51.5202, lon: -0.1396 },
    { type: "node", id: 4, lat: 51.5203, lon: -0.1398 },
    { type: "way", id: 100, nodes: [1, 2, 3], tags: { highway: "primary", name: "Atlas Road", ref: "B500; A1(M); Cycle Route 4" } },
    { type: "way", id: 101, nodes: [2, 3], tags: { railway: "rail", ref: "A9" } },
    { type: "way", id: 200, nodes: [1, 2, 3, 4, 1], tags: { building: "apartments" } },
    { type: "way", id: 201, nodes: [1, 2, 3, 4, 1], tags: { building: "office" } },
    { type: "way", id: 202, nodes: [1, 2, 3, 4, 1], tags: { building: "school", amenity: "school" } },
    { type: "way", id: 203, nodes: [1, 2, 3, 4, 1], tags: { building: "hospital", healthcare: "hospital" } },
    { type: "way", id: 204, nodes: [1, 2, 3, 4, 1], tags: { building: "civic", amenity: "townhall" } },
    { type: "way", id: 205, nodes: [1, 2, 3, 4, 1], tags: { building: "church", amenity: "place_of_worship" } },
    { type: "way", id: 300, nodes: [1, 2, 3, 4, 1], tags: { landuse: "residential" } },
    { type: "way", id: 301, nodes: [1, 2, 3, 4, 1], tags: { landuse: "commercial" } },
    { type: "way", id: 302, nodes: [1, 2, 3, 4, 1], tags: { landuse: "retail" } },
    { type: "way", id: 303, nodes: [1, 2, 3, 4, 1], tags: { landuse: "industrial" } }
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

function convertedAtlasMap() {
  const converted = convertOverpassJsonToRouteMap(atlasFixture, {
    mapId: "phase-8-3-atlas-adapter-test",
    name: "Phase 8.3 Atlas Adapter Test"
  });

  if (!converted.ok) {
    throw new Error(`Expected atlas fixture to convert: ${converted.errors.join("; ")}`);
  }

  return converted.map;
}

test("Stage 149.5 context audit counts fixture-backed Real London coverage deterministically", () => {
  const audit = auditRealLondonContextCoverage(contextFixture);

  assert.deepEqual(audit.counts, {
    buildingFootprintFeatures: 0,
    institutionalAreaFeatures: 0,
    educationInstitutionalAreaFeatures: 0,
    healthcareInstitutionalAreaFeatures: 0,
    civicInstitutionalAreaFeatures: 0,
    religiousInstitutionalAreaFeatures: 0,
    landUseBlockFeatures: 0,
    residentialLandUseBlockFeatures: 0,
    commercialLandUseBlockFeatures: 0,
    retailLandUseBlockFeatures: 0,
    industrialLandUseBlockFeatures: 0,
    roadReferenceFeatures: 0,
    aRoadReferenceFeatures: 0,
    bRoadReferenceFeatures: 0,
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
      "buildingFootprintFeatures",
      "institutionalAreaFeatures",
      "educationInstitutionalAreaFeatures",
      "healthcareInstitutionalAreaFeatures",
      "civicInstitutionalAreaFeatures",
      "religiousInstitutionalAreaFeatures",
      "landUseBlockFeatures",
      "residentialLandUseBlockFeatures",
      "commercialLandUseBlockFeatures",
      "retailLandUseBlockFeatures",
      "industrialLandUseBlockFeatures",
      "roadReferenceFeatures",
      "aRoadReferenceFeatures",
      "bRoadReferenceFeatures",
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
    buildingFootprintFeatures: 0,
    institutionalAreaFeatures: 0,
    educationInstitutionalAreaFeatures: 0,
    healthcareInstitutionalAreaFeatures: 0,
    civicInstitutionalAreaFeatures: 0,
    religiousInstitutionalAreaFeatures: 0,
    landUseBlockFeatures: 0,
    residentialLandUseBlockFeatures: 0,
    commercialLandUseBlockFeatures: 0,
    retailLandUseBlockFeatures: 0,
    industrialLandUseBlockFeatures: 0,
    roadReferenceFeatures: 0,
    aRoadReferenceFeatures: 0,
    bRoadReferenceFeatures: 0,
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

test("Stage 8.3 adapter normalises atlas polygons, subtypes, road refs, and source metadata", () => {
  const features = buildRealLondonContextFeatures(convertedAtlasMap(), atlasFixture);
  const atlasFeatures = features.filter((feature) =>
    ["land-use", "building", "institution", "road-reference"].includes(feature.kind)
  );

  assert.deepEqual(
    atlasFeatures.map((feature) => [feature.kind, "subtype" in feature ? feature.subtype : "", feature.id]),
    [
      ["land-use", "residential", "land-use-way-300"],
      ["land-use", "commercial", "land-use-way-301"],
      ["land-use", "retail", "land-use-way-302"],
      ["land-use", "industrial", "land-use-way-303"],
      ["building", "residential", "building-way-200"],
      ["building", "commercial", "building-way-201"],
      ["building", "education", "building-way-202"],
      ["building", "healthcare", "building-way-203"],
      ["building", "civic", "building-way-204"],
      ["building", "religious", "building-way-205"],
      ["institution", "education", "institution-way-202"],
      ["institution", "healthcare", "institution-way-203"],
      ["institution", "civic", "institution-way-204"],
      ["institution", "religious", "institution-way-205"],
      ["road-reference", "a-road", "road-reference-way-100-a1-m"],
      ["road-reference", "b-road", "road-reference-way-100-b500"]
    ]
  );
  assert.ok(atlasFeatures.every((feature) => feature.sourceElementType === "way"));
  assert.ok(atlasFeatures.every((feature) => feature.sourceTags && Object.keys(feature.sourceTags).length > 0));
  assert.ok(
    atlasFeatures
      .filter((feature) => "points" in feature)
      .every((feature) => feature.points.length >= (feature.kind === "road-reference" ? 2 : 4))
  );
});

test("Stage 8.3 coverage counts every atlas category and ignores non-highway refs", () => {
  const audit = auditRealLondonContextCoverage(atlasFixture);

  assert.deepEqual(
    {
      buildingFootprintFeatures: audit.counts.buildingFootprintFeatures,
      institutionalAreaFeatures: audit.counts.institutionalAreaFeatures,
      educationInstitutionalAreaFeatures: audit.counts.educationInstitutionalAreaFeatures,
      healthcareInstitutionalAreaFeatures: audit.counts.healthcareInstitutionalAreaFeatures,
      civicInstitutionalAreaFeatures: audit.counts.civicInstitutionalAreaFeatures,
      religiousInstitutionalAreaFeatures: audit.counts.religiousInstitutionalAreaFeatures,
      landUseBlockFeatures: audit.counts.landUseBlockFeatures,
      residentialLandUseBlockFeatures: audit.counts.residentialLandUseBlockFeatures,
      commercialLandUseBlockFeatures: audit.counts.commercialLandUseBlockFeatures,
      retailLandUseBlockFeatures: audit.counts.retailLandUseBlockFeatures,
      industrialLandUseBlockFeatures: audit.counts.industrialLandUseBlockFeatures,
      roadReferenceFeatures: audit.counts.roadReferenceFeatures,
      aRoadReferenceFeatures: audit.counts.aRoadReferenceFeatures,
      bRoadReferenceFeatures: audit.counts.bRoadReferenceFeatures
    },
    {
      buildingFootprintFeatures: 6,
      institutionalAreaFeatures: 4,
      educationInstitutionalAreaFeatures: 1,
      healthcareInstitutionalAreaFeatures: 1,
      civicInstitutionalAreaFeatures: 1,
      religiousInstitutionalAreaFeatures: 1,
      landUseBlockFeatures: 4,
      residentialLandUseBlockFeatures: 1,
      commercialLandUseBlockFeatures: 1,
      retailLandUseBlockFeatures: 1,
      industrialLandUseBlockFeatures: 1,
      roadReferenceFeatures: 2,
      aRoadReferenceFeatures: 1,
      bRoadReferenceFeatures: 1
    }
  );
  assert.equal(
    buildRealLondonContextFeatures(convertedAtlasMap(), atlasFixture).some(
      (feature) => feature.kind === "road-reference" && feature.sourceElementId === 101
    ),
    false
  );
});

test("Stage 8.3 adapter output is deterministic and does not mutate source fixtures", () => {
  const fixtureBefore = structuredClone(atlasFixture);
  const first = buildRealLondonContextFeatures(convertedAtlasMap(), atlasFixture);
  const second = buildRealLondonContextFeatures(convertedAtlasMap(), atlasFixture);

  assert.deepEqual(second, first);
  assert.deepEqual(atlasFixture, fixtureBefore);
});

test("Stage 8.6 adapter preserves multipolygon outer and inner rings with relation traceability", () => {
  const fixture: OverpassJsonResponse = {
    elements: [
      { type: "node", id: 1, lat: 51.52, lon: -0.14 },
      { type: "node", id: 2, lat: 51.5201, lon: -0.1398 },
      { type: "node", id: 3, lat: 51.5202, lon: -0.1396 },
      { type: "node", id: 4, lat: 51.5203, lon: -0.1398 },
      { type: "node", id: 5, lat: 51.52013, lon: -0.13982 },
      { type: "node", id: 6, lat: 51.52015, lon: -0.13978 },
      { type: "node", id: 7, lat: 51.52017, lon: -0.1398 },
      { type: "node", id: 8, lat: 51.52015, lon: -0.13984 },
      { type: "way", id: 10, nodes: [1, 2], tags: { highway: "residential" } },
      { type: "way", id: 20, nodes: [1, 2, 3] },
      { type: "way", id: 21, nodes: [3, 4, 1] },
      { type: "way", id: 22, nodes: [5, 6, 7, 8, 5] },
      {
        type: "relation",
        id: 30,
        members: [
          { type: "way", ref: 20, role: "outer" },
          { type: "way", ref: 21, role: "outer" },
          { type: "way", ref: 22, role: "inner" }
        ],
        tags: { type: "multipolygon", building: "yes", name: "Relation Building" }
      }
    ]
  };
  const converted = convertOverpassJsonToRouteMap(fixture, {
    mapId: "phase-8-3-relation-test",
    name: "Phase 8.3 Relation Test"
  });

  assert.equal(converted.ok, true);

  if (!converted.ok) {
    return;
  }

  const building = buildRealLondonContextFeatures(converted.map, fixture).find(
    (feature) => feature.id === "building-relation-30-ring-1"
  );

  assert.ok(building && building.kind === "building");
  assert.equal(building.sourceElementType, "relation");
  assert.equal(building.sourceElementId, 30);
  assert.equal(building.name, "Relation Building");
  assert.deepEqual(building.points[0], building.points.at(-1));
  assert.equal(building.innerRings?.length, 1);
  assert.deepEqual(building.innerRings?.[0][0], building.innerRings?.[0].at(-1));
});
