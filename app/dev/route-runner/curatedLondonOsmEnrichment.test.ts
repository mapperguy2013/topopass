import assert from "node:assert/strict";
import test from "node:test";
import curatedLondonStage1605Fixture from "../../../lib/map-engine/osm/fixtures/curatedLondonStage1605Overpass.json" with { type: "json" };
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
  auditCuratedLondonOsmFixture,
  auditCurrentRealLondonFixtureSet,
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
