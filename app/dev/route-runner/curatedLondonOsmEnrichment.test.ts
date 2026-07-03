import assert from "node:assert/strict";
import test from "node:test";
import centralLondonOverpassFixture from "../../../lib/map-engine/osm/fixtures/centralLondonOverpass.json" with { type: "json" };
import curatedLondonStage1605Fixture from "../../../lib/map-engine/osm/fixtures/curatedLondonStage1605Overpass.json" with { type: "json" };
import kingsCrossEustonOverpassFixture from "../../../lib/map-engine/osm/fixtures/kingsCrossEustonOverpass.json" with { type: "json" };
import largeLondonOverpassFixture from "../../../lib/map-engine/osm/fixtures/largeLondonOverpass.json" with { type: "json" };
import mediumLondonOverpassFixture from "../../../lib/map-engine/osm/fixtures/mediumLondonOverpass.json" with { type: "json" };
import realLondonPilotOverpassFixture from "../../../lib/map-engine/osm/fixtures/realLondonPilotOverpass.json" with { type: "json" };
import realLondonPilotTwoOverpassFixture from "../../../lib/map-engine/osm/fixtures/realLondonPilotTwoOverpass.json" with { type: "json" };
import tinyLondonOverpassFixture from "../../../lib/map-engine/osm/fixtures/tinyLondonOverpass.json" with { type: "json" };
import { convertOverpassJsonToRouteMap } from "../../../lib/map-engine/osm/index.ts";
import {
  CURATED_LONDON_OSM_ATTRIBUTION,
  CURATED_LONDON_OSM_TAG_WHITELIST,
  CURATED_LONDON_OSM_ZONES,
  CURATED_LONDON_RENDER_CATEGORIES,
  CURATED_REAL_LONDON_OVERPASS_FIXTURES,
  auditCuratedLondonOsmFixture,
  auditCurrentRealLondonFixtureSet,
  curatedRealLondonFixtureAllowedForBetaPractice,
  summariseCuratedLondonRenderCategories
} from "./curatedLondonOsmEnrichment.ts";
import { buildRealLondonContextFeatures } from "./realLondonContextData.ts";

test("Stage 160.5 curated London OSM zones stay bounded and representative", () => {
  assert.deepEqual(
    CURATED_LONDON_OSM_ZONES.map((zone) => zone.id),
    [
      "dense-central-streets",
      "major-road-side-streets",
      "high-street",
      "suburban-estate",
      "thames-bridge",
      "park-edge",
      "rail-station-heavy",
      "awkward-junction",
      "one-way-system",
      "learner-route-review",
      "mobile-viewport-stress"
    ]
  );

  for (const zone of CURATED_LONDON_OSM_ZONES) {
    assert.ok(zone.bounds.west < zone.bounds.east, zone.id);
    assert.ok(zone.bounds.south < zone.bounds.north, zone.id);
    assert.ok(zone.bounds.east - zone.bounds.west < 0.04, zone.id);
    assert.ok(zone.bounds.north - zone.bounds.south < 0.02, zone.id);
    assert.ok(zone.intendedUse.length > 0, zone.id);
  }

  assert.equal(CURATED_LONDON_OSM_ATTRIBUTION.licence, "ODbL");
  assert.ok(CURATED_LONDON_OSM_TAG_WHITELIST.includes("highway"));
  assert.ok(CURATED_LONDON_OSM_TAG_WHITELIST.includes("restriction"));
  assert.ok(CURATED_LONDON_OSM_TAG_WHITELIST.includes("public_transport"));
});

test("Stage 160.5 current fixture audit records the pre-enrichment context gaps", () => {
  const audit = auditCurrentRealLondonFixtureSet({
    tinyLondonOverpassFixture,
    realLondonPilotOverpassFixture,
    realLondonPilotTwoOverpassFixture,
    mediumLondonOverpassFixture,
    largeLondonOverpassFixture
  });

  assert.equal(audit.realLondonPilotOverpassFixture.coverage.roadClassCount > 0, true);
  assert.equal(audit.realLondonPilotOverpassFixture.coverage.namedRoadCount > 0, true);
  assert.equal(audit.realLondonPilotOverpassFixture.contextCoverage.parkOpenSpaceFeatures, 0);
  assert.equal(audit.realLondonPilotOverpassFixture.contextCoverage.waterFeatures, 0);
  assert.equal(audit.realLondonPilotOverpassFixture.contextCoverage.railFeatures, 0);
  assert.equal(audit.realLondonPilotOverpassFixture.coverage.turnRestrictionRelationCount, 0);
});

test("Stage 160.5 curated fixture adds richer OSM-derived visual coverage without live runtime fetches", () => {
  const coverage = auditCuratedLondonOsmFixture(curatedLondonStage1605Fixture);
  const categories = summariseCuratedLondonRenderCategories(curatedLondonStage1605Fixture);

  assert.ok(coverage.elementCount > 1000);
  assert.ok(coverage.roadClassCount > 600);
  assert.ok(coverage.namedRoadCount > 500);
  assert.ok(coverage.oneWayTaggedWayCount > 300);
  assert.ok(coverage.accessRestrictionTaggedWayCount > 100);
  assert.ok(coverage.bridgeTaggedWayCount > 0);
  assert.ok(coverage.tunnelTaggedWayCount > 0);
  assert.ok(coverage.railFeatureCount > 0);
  assert.ok(coverage.stationFeatureCount > 0);
  assert.ok(coverage.parkFeatureCount > 0);
  assert.ok(coverage.waterFeatureCount > 0);
  assert.ok(coverage.landmarkFeatureCount > 0);
  assert.ok(coverage.areaNameFeatureCount > 0);
  assert.equal(coverage.turnRestrictionRelationCount, 0);
  assert.equal(coverage.crossingFeatureCount, 0);

  for (const category of CURATED_LONDON_RENDER_CATEGORIES) {
    assert.ok(category in categories, category);
  }

  assert.ok(categories.majorRoad > 0);
  assert.ok(categories.secondaryRoad > 0);
  assert.ok(categories.localRoad > 0);
  assert.ok(categories.serviceRoad > 0);
  assert.ok(categories.nonDrivingPath > 0);
  assert.ok(categories.bridgeRoad > 0);
  assert.ok(categories.tunnelRoad > 0);
  assert.ok(categories.oneWaySegment > 0);
  assert.ok(categories.park > 0);
  assert.ok(categories.water > 0);
  assert.ok(categories.rail > 0);
  assert.ok(categories.station > 0);
  assert.ok(categories.landmark > 0);
  assert.ok(categories.areaLabel > 0);
  assert.equal(categories.restrictedTurn, 0);
  assert.equal(categories.learnerOverlay, 0);
});

test("Stage 160.5 curated fixture converts safely and supplies render context features", () => {
  const result = convertOverpassJsonToRouteMap(curatedLondonStage1605Fixture, {
    mapId: "stage-160-5-curated-london-test",
    name: "Stage 160.5 Curated London Test"
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.ok(result.map.roads.length > 0);
  assert.ok(result.map.roads.some((road) => road.metadata.rawTags.bridge));
  assert.ok(result.map.roads.some((road) => road.metadata.rawTags.tunnel));
  assert.ok(result.map.roads.some((road) => road.metadata.rawTags.oneway));
  assert.ok(result.map.roads.some((road) => road.metadata.rawTags.maxspeed));

  const contextFeatures = buildRealLondonContextFeatures(result.map, curatedLondonStage1605Fixture);
  const contextKinds = new Set(contextFeatures.map((feature) => feature.kind));

  assert.ok(contextKinds.has("rail"));
  assert.ok(contextKinds.has("station"));
  assert.ok(contextKinds.has("bridge"));
  assert.ok(contextKinds.has("park"));
  assert.ok(contextKinds.has("water"));
  assert.ok(contextKinds.has("landmark"));
  assert.ok(contextKinds.has("area"));
});

test("Stage 161.8 centralLondon fixture audits larger coverage and relation-backed water", () => {
  const metadata = CURATED_REAL_LONDON_OVERPASS_FIXTURES.find((fixture) => fixture.id === "centralLondon");
  const coverage = auditCuratedLondonOsmFixture(centralLondonOverpassFixture);
  const categories = summariseCuratedLondonRenderCategories(centralLondonOverpassFixture);
  const waterMultipolygonRelations = (centralLondonOverpassFixture.elements ?? []).filter(
    (element) =>
      element.type === "relation" &&
      element.tags?.type === "multipolygon" &&
      (element.tags.natural === "water" || Boolean(element.tags.water) || Boolean(element.tags.waterway))
  );

  assert.ok(metadata);
  assert.equal(metadata.devOnlyStressTest, true);
  assert.equal(metadata.betaPracticeAllowed, false);
  assert.equal(metadata.fixtureBudget.totalElements, 251273);
  assert.equal(metadata.fixtureBudget.nodes, 213466);
  assert.equal(metadata.fixtureBudget.ways, 36579);
  assert.equal(metadata.fixtureBudget.relations, 1228);
  assert.equal(curatedRealLondonFixtureAllowedForBetaPractice(metadata), false);
  assert.ok(coverage.elementCount > 250000);
  assert.ok(coverage.nodeCount > 200000);
  assert.ok(coverage.wayCount > 35000);
  assert.ok(coverage.relationCount > 1000);
  assert.ok(coverage.namedRoadCount > 16000);
  assert.ok(coverage.oneWayTaggedWayCount > 8000);
  assert.ok(coverage.turnRestrictionRelationCount > 1000);
  assert.ok(coverage.bridgeTaggedWayCount > 150);
  assert.ok(coverage.tunnelTaggedWayCount > 800);
  assert.ok(coverage.railFeatureCount > 2400);
  assert.ok(coverage.stationFeatureCount > 90);
  assert.ok(coverage.waterFeatureCount > 200);
  assert.ok(waterMultipolygonRelations.length >= 10);
  assert.ok(categories.majorRoad > 0);
  assert.ok(categories.secondaryRoad > 0);
  assert.ok(categories.localRoad > 0);
  assert.ok(categories.water > 0);
  assert.ok(categories.rail > 0);
  assert.ok(categories.station > 0);

  const result = convertOverpassJsonToRouteMap(centralLondonOverpassFixture, {
    mapId: "stage-161-8-centralLondon-conversion-test",
    name: "Stage 161.8 centralLondon conversion test"
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  const contextFeatures = buildRealLondonContextFeatures(result.map, centralLondonOverpassFixture);
  const contextKinds = new Set(contextFeatures.map((feature) => feature.kind));

  assert.ok(result.map.nodes.length > 60000);
  assert.ok(result.map.roads.length > 70000);
  assert.ok(contextKinds.has("water"));
  assert.ok(contextKinds.has("rail"));
  assert.ok(contextKinds.has("station"));
  assert.ok(contextKinds.has("bridge"));
  assert.ok(contextFeatures.some((feature) => feature.id.startsWith("water-relation-")));
});

test("Stage 161.8.3 kingsCrossEuston fixture stays within beta fixture budget", () => {
  const metadata = CURATED_REAL_LONDON_OVERPASS_FIXTURES.find((fixture) => fixture.id === "kingsCrossEuston");
  const coverage = auditCuratedLondonOsmFixture(kingsCrossEustonOverpassFixture);
  const categories = summariseCuratedLondonRenderCategories(kingsCrossEustonOverpassFixture);

  assert.ok(metadata);
  assert.equal(metadata.fixtureName, "kingsCrossEustonOverpass.json");
  assert.equal(metadata.betaPracticeAllowed, true);
  assert.equal(metadata.devOnlyStressTest, false);
  assert.equal(metadata.fixtureBudget.totalElements, 25746);
  assert.equal(metadata.fixtureBudget.nodes, 21484);
  assert.equal(metadata.fixtureBudget.ways, 4134);
  assert.equal(metadata.fixtureBudget.relations, 128);
  assert.equal(metadata.fixtureBudget.roadSegments, 6963);
  assert.equal(curatedRealLondonFixtureAllowedForBetaPractice(metadata), true);
  assert.equal(coverage.elementCount, metadata.fixtureBudget.totalElements);
  assert.equal(coverage.nodeCount, metadata.fixtureBudget.nodes);
  assert.equal(coverage.wayCount, metadata.fixtureBudget.ways);
  assert.equal(coverage.relationCount, metadata.fixtureBudget.relations);
  assert.ok(coverage.namedRoadCount >= 1900);
  assert.ok(coverage.oneWayTaggedWayCount >= 1000);
  assert.equal(coverage.turnRestrictionRelationCount, 112);
  assert.ok(coverage.accessRestrictionTaggedWayCount >= 600);
  assert.ok(coverage.bridgeTaggedWayCount >= 20);
  assert.ok(coverage.tunnelTaggedWayCount >= 80);
  assert.ok(coverage.waterFeatureCount >= 10);
  assert.ok(coverage.parkFeatureCount >= 100);
  assert.ok(coverage.railFeatureCount >= 300);
  assert.ok(coverage.stationFeatureCount >= 10);
  assert.ok(coverage.landmarkFeatureCount + coverage.publicBuildingFeatureCount >= 200);
  assert.ok(categories.majorRoad > 0);
  assert.ok(categories.secondaryRoad > 0);
  assert.ok(categories.localRoad > 0);
  assert.ok(categories.serviceRoad > 0);
  assert.ok(categories.oneWaySegment > 0);
  assert.equal(categories.restrictedTurn, 112);
  assert.ok(categories.rail > 0);
  assert.ok(categories.station > 0);
});
