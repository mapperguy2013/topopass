import assert from "node:assert/strict";
import { test } from "node:test";
import { convertOverpassJsonToRouteMap, type OverpassJsonResponse } from "../../../lib/map-engine/osm/index.ts";
import { buildRealLondonContextFeatures } from "./realLondonContextData.ts";
import { CURATED_REAL_LONDON_OVERPASS_FIXTURES } from "./curatedLondonOsmEnrichment.ts";
import { CURATED_REAL_LONDON_ROUTE_RUNNER_MAP_OPTIONS } from "./curatedRealLondonRouteRunnerMaps.ts";
import {
  buildPhase8AuditReportForFixture,
  buildPhase8GeographicRenderDataAuditReport,
  classifyPhase8RoadReferenceValue
} from "./phase8GeographicRenderDataAudit.ts";

const report = buildPhase8GeographicRenderDataAuditReport({
  includeStressFixtureSource: false,
  includeLazyFixtureConversion: false
});

function fixtureReport(fixtureName: string) {
  const fixture = report.fixtureReports.find((candidate) => candidate.fixtureName === fixtureName);

  if (!fixture) {
    throw new Error(`Missing audit fixture report ${fixtureName}`);
  }

  return fixture;
}

function buildEdgeFixture(): OverpassJsonResponse {
  return {
    version: 0.6,
    generator: "Phase 8 audit test fixture",
    elements: [
      { type: "node", id: 1, lat: 51.5, lon: -0.12 },
      { type: "node", id: 2, lat: 51.5005, lon: -0.119 },
      { type: "node", id: 3, lat: 51.501, lon: -0.119 },
      { type: "node", id: 4, lat: 51.501, lon: -0.12 },
      { type: "node", id: 5, lat: 51.5005, lon: -0.121 },
      { type: "node", id: 6, lat: 51.5015, lon: -0.121 },
      { type: "node", id: 7, lat: 51.5015, lon: -0.1202 },
      { type: "node", id: 8, lat: 51.5005, lon: -0.1202 },
      { type: "node", id: 9, lat: 51.502, lon: -0.12 },
      { type: "node", id: 10, lat: 51.502, lon: -0.119 },
      {
        type: "way",
        id: 100,
        nodes: [1, 2, 3],
        tags: { highway: "primary", name: "Audit Road", ref: "A4202", oneway: "yes" }
      },
      {
        type: "way",
        id: 101,
        nodes: [3, 4],
        tags: { highway: "secondary", name: "B Road", ref: "B506" }
      },
      {
        type: "way",
        id: 102,
        nodes: [4, 1],
        tags: { highway: "residential", name: "Code Road", ref: "Cycle Route 4" }
      },
      {
        type: "way",
        id: 200,
        nodes: [5, 6, 7, 8, 5],
        tags: { building: "public", amenity: "school", name: "Audit School" }
      },
      {
        type: "way",
        id: 210,
        nodes: [1, 2, 3, 4, 1],
        tags: { landuse: "residential", name: "Audit Estate" }
      },
      {
        type: "way",
        id: 220,
        nodes: [5, 6, 7, 8, 5],
        tags: { leisure: "park", name: "Audit Park" }
      },
      {
        type: "way",
        id: 230,
        nodes: [5, 6, 7, 8, 5],
        tags: { natural: "water", water: "river", name: "Audit Water" }
      },
      {
        type: "way",
        id: 240,
        nodes: [9, 10],
        tags: { railway: "rail", name: "Audit Rail" }
      },
      {
        type: "node",
        id: 300,
        lat: 51.5025,
        lon: -0.1195,
        tags: { railway: "station", public_transport: "station", name: "Audit Station" }
      },
      {
        type: "node",
        id: 310,
        lat: 51.5026,
        lon: -0.1196,
        tags: { man_made: "pier", name: "Audit Pier" }
      },
      {
        type: "relation",
        id: 400,
        members: [{ type: "way", ref: 230, role: "outer" }],
        tags: { type: "multipolygon", natural: "water", water: "river", name: "Audit Water Relation" }
      }
    ]
  };
}

test("Phase 8 audit orders fixtures and categories deterministically", () => {
  const fixtureNames = report.fixtureReports.map((fixture) => fixture.fixtureName);
  const sortedRealNames = report.fixtureReports
    .filter((fixture) => fixture.includedInRealGeographyAggregate)
    .map((fixture) => fixture.fixtureName)
    .sort((left, right) => left.localeCompare(right));

  assert.deepEqual(report.fixtureReports.slice(0, sortedRealNames.length).map((fixture) => fixture.fixtureName), sortedRealNames);

  for (const fixture of report.fixtureReports) {
    assert.deepEqual(
      fixture.categoryAudits.map((category) => category.id),
      [
        "road-network",
        "road-references",
        "buildings-built-fabric",
        "land-use-institutions",
        "places-area-labels",
        "parks-open-space",
        "water-river-context",
        "rail-transport",
        "landmarks-public-facilities"
      ]
    );
  }

  assert.deepEqual(fixtureNames, [...fixtureNames].sort((left, right) => {
    const leftReal = fixtureReport(left).includedInRealGeographyAggregate;
    const rightReal = fixtureReport(right).includedInRealGeographyAggregate;
    return Number(rightReal) - Number(leftReal) || left.localeCompare(right);
  }));
});

test("Phase 8 audit represents every authoritative real London fixture", () => {
  const auditedNames = new Set(report.aggregate.auditedFixtureNames);

  for (const fixture of CURATED_REAL_LONDON_OVERPASS_FIXTURES) {
    assert.ok(auditedNames.has(fixture.fixtureName), `Missing ${fixture.fixtureName}`);
  }

  assert.ok(auditedNames.has("realLondonPilotOverpass.json"));
});

test("Phase 8 audit excludes synthetic fixtures from real-geography aggregates", () => {
  assert.ok(report.aggregate.excludedSyntheticControls.includes("mediumLondonOverpass.json"));
  assert.ok(report.aggregate.excludedSyntheticControls.includes("largeLondonOverpass.json"));
  assert.ok(report.aggregate.excludedSyntheticControls.includes("realLondonPilotTwoOverpass.json"));
  assert.ok(report.aggregate.excludedSyntheticControls.some((name) => name.toLowerCase().includes("phase")));
  assert.equal(report.aggregate.auditedFixtureNames.includes("mediumLondonOverpass.json"), false);
});

test("Phase 8 road ref classification accepts valid A/B refs without fabricating from unrelated values", () => {
  assert.equal(classifyPhase8RoadReferenceValue("A4202"), "a-road");
  assert.equal(classifyPhase8RoadReferenceValue("A1(M)"), "a-road");
  assert.equal(classifyPhase8RoadReferenceValue("B506"), "b-road");
  assert.equal(classifyPhase8RoadReferenceValue("Cycle Route 4"), "other");
  assert.equal(classifyPhase8RoadReferenceValue("Road A"), "other");
});

test("Phase 8 synthetic edge report separates adapted road refs from displayed refs", () => {
  const edgeReport = buildPhase8AuditReportForFixture(buildEdgeFixture(), {
    mapId: "phase-8-edge-fixture",
    name: "Phase 8 edge fixture",
    description: "Small fixture for Phase 8 audit edge cases.",
    fixtureName: "phase8EdgeFixture.json"
  });

  assert.equal(edgeReport.sourceCoverage.sourceRoadRefWays, 3);
  assert.equal(edgeReport.sourceCoverage.aRoadRefWays, 1);
  assert.equal(edgeReport.sourceCoverage.bRoadRefWays, 1);
  assert.equal(edgeReport.sourceCoverage.otherRoadRefWays, 1);
  assert.equal(edgeReport.routeGraphCoverage.roadsWithRawRefTags, 3);
  assert.equal(edgeReport.contextAdapterCoverage.roadReferenceFeatures, 2);
  assert.equal(edgeReport.rendererConsumedCoverage.displayedRoadReferences, 2);
  assert.equal(edgeReport.categoryAudits.find((category) => category.id === "road-references")?.state, "render-ready");
});

test("Stage 8.6 audit reports adapted building geometry as renderer-consumed", () => {
  const edgeReport = buildPhase8AuditReportForFixture(buildEdgeFixture(), {
    mapId: "phase-8-building-fixture",
    name: "Phase 8 building fixture",
    description: "Small fixture for building geometry checks.",
    fixtureName: "phase8BuildingFixture.json"
  });

  assert.equal(edgeReport.sourceCoverage.usableClosedBuildingPolygons, 1);
  assert.equal(edgeReport.contextAdapterCoverage.generalBuildingPolygons, 1);
  assert.equal(edgeReport.rendererConsumedCoverage.generalBuildingPolygons, 1);
  assert.equal(edgeReport.categoryAudits.find((category) => category.id === "buildings-built-fabric")?.state, "render-ready");
});

test("Phase 8 audit keeps point landmarks separate from adapted institutional polygons", () => {
  const edgeReport = buildPhase8AuditReportForFixture(buildEdgeFixture(), {
    mapId: "phase-8-institution-fixture",
    name: "Phase 8 institution fixture",
    description: "Small fixture for institution checks.",
    fixtureName: "phase8InstitutionFixture.json"
  });

  assert.ok(edgeReport.contextAdapterCoverage.institutionalPointLandmarks > 0);
  assert.equal(edgeReport.contextAdapterCoverage.institutionalPolygons, 1);
  assert.equal(edgeReport.contextAdapterCoverage.landUsePolygons, 1);
  assert.equal(edgeReport.rendererConsumedCoverage.institutionalPolygons, 1);
  assert.equal(edgeReport.rendererConsumedCoverage.landUsePolygons, 1);
  assert.equal(edgeReport.categoryAudits.find((category) => category.id === "land-use-institutions")?.state, "render-ready");
});

test("Stage 8.7 audit reports committed pier tags through adapter and renderer coverage", () => {
  const edgeReport = buildPhase8AuditReportForFixture(buildEdgeFixture(), {
    mapId: "phase-8-whitelist-fixture",
    name: "Phase 8 whitelist fixture",
    description: "Small fixture for whitelist checks.",
    fixtureName: "phase8WhitelistFixture.json"
  });

  assert.equal(edgeReport.unsupportedCoverage.missingWhitelistTags.man_made, undefined);
  assert.equal(edgeReport.sourceCoverage.pierLikeSourceFeatures, 1);
  assert.equal(edgeReport.contextAdapterCoverage.pierFeatures, 1);
  assert.equal(edgeReport.rendererConsumedCoverage.piers, 1);
  assert.equal(edgeReport.unsupportedCoverage.pierLikeFeaturesMissingWhitelistOrAdapter, 0);
});

test("Phase 8 context feature totals agree with buildRealLondonContextFeatures", () => {
  const option = CURATED_REAL_LONDON_ROUTE_RUNNER_MAP_OPTIONS.find((candidate) => candidate.fixtureName === "waterlooBridgeOverpass.json");

  assert.ok(option?.sourceOverpassFixture);
  const contextFeatures = buildRealLondonContextFeatures(option.map, option.sourceOverpassFixture);

  assert.equal(fixtureReport("waterlooBridgeOverpass.json").contextAdapterCoverage.totalFeatures, contextFeatures.length);
});

test("Stage 8.6 audit reports source-backed building renderer output", () => {
  const waterloo = fixtureReport("waterlooBridgeOverpass.json");

  assert.ok(waterloo.sourceCoverage.usableClosedBuildingPolygons > 0);
  assert.ok(waterloo.rendererConsumedCoverage.generalBuildingPolygons > 0);
  assert.ok(waterloo.sourceCoverage.sourceRoadRefWays >= waterloo.rendererConsumedCoverage.displayedRoadReferences);
});

test("Stage 8.8 audit includes the bounded Victoria building-only context source", () => {
  const victoria = fixtureReport("victoriaWestminsterVauxhallOverpass.json");

  assert.equal(victoria.sourceCoverage.buildingTaggedWays, 5970);
  assert.equal(victoria.sourceCoverage.usableClosedBuildingPolygons, 5970);
});

test("Stage 8.6 renderer-consumed real fixture polygon counts stay stable behind existing gates", () => {
  const expectedByFixture = new Map([
    ["centralLondonOverpass.json", [0, 0, 0]],
    ["kingsCrossEustonOverpass.json", [0, 0, 0]],
    ["oneWaySystemAreaOverpass.json", [11, 18, 0]],
    ["piccadillyCircusOverpass.json", [9, 9, 0]],
    ["quietResidentialRoadsOverpass.json", [3, 8, 0]],
    ["realLondonPilotOverpass.json", [0, 0, 0]],
    ["waterlooBridgeOverpass.json", [15, 9, 0]]
  ]);

  for (const [fixtureName, expected] of expectedByFixture) {
    const consumed = fixtureReport(fixtureName).rendererConsumedCoverage;
    assert.deepEqual(
      [consumed.generalBuildingPolygons, consumed.institutionalPolygons, consumed.landUsePolygons],
      expected,
      fixtureName
    );
  }

  assert.equal(report.aggregate.totals.generalBuildingPolygonsRendered, 38);
  assert.equal(report.aggregate.totals.institutionalPolygonsRendered, 44);
  assert.equal(report.aggregate.totals.landUsePolygonsRendered, 0);
});

test("Phase 8 audit represents water multipolygon coverage where present", () => {
  const edgeReport = buildPhase8AuditReportForFixture(buildEdgeFixture(), {
    mapId: "phase-8-water-fixture",
    name: "Phase 8 water fixture",
    description: "Small fixture for water relation checks.",
    fixtureName: "phase8WaterFixture.json"
  });

  assert.equal(edgeReport.sourceCoverage.waterMultipolygonRelations, 1);
  assert.ok(edgeReport.contextAdapterCoverage.byKind.water > 0);
  assert.ok(edgeReport.rendererConsumedCoverage.backgroundFeatures.water > 0);
});

test("Phase 8 audit records attribution for real fixtures", () => {
  for (const fixtureName of report.aggregate.auditedFixtureNames) {
    assert.equal(fixtureReport(fixtureName).attributionStatus, "osm-attributed");
  }
});

test("Phase 8 audit does not mutate input fixtures", () => {
  const fixture = buildEdgeFixture();
  const before = JSON.stringify(fixture);

  buildPhase8AuditReportForFixture(fixture, {
    mapId: "phase-8-mutation-fixture",
    name: "Phase 8 mutation fixture",
    description: "Small fixture for mutation checks.",
    fixtureName: "phase8MutationFixture.json"
  });

  assert.equal(JSON.stringify(fixture), before);
});

test("Phase 8 audit output is stable across repeated calls", () => {
  assert.equal(
    JSON.stringify(buildPhase8GeographicRenderDataAuditReport({
      includeStressFixtureSource: false,
      includeLazyFixtureConversion: false
    })),
    JSON.stringify(buildPhase8GeographicRenderDataAuditReport({
      includeStressFixtureSource: false,
      includeLazyFixtureConversion: false
    }))
  );
});

test("Phase 8 edge fixture remains convertible through the route graph", () => {
  const converted = convertOverpassJsonToRouteMap(buildEdgeFixture(), {
    mapId: "phase-8-convertible-edge",
    name: "Phase 8 convertible edge"
  });

  assert.equal(converted.ok, true);
});
