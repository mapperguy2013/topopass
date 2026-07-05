import centralLondonOverpassFixture from "../../../lib/map-engine/osm/fixtures/centralLondonOverpass.json" with { type: "json" };
import {
  buildCuratedRealLondonOsmMap,
  CENTRAL_LONDON_OSM_MAP_ID,
  getCuratedRealLondonFixtureMetadata
} from "./curatedRealLondonRouteRunnerMaps.ts";
import type { RouteRunnerMapOption } from "./routeRunnerMaps.ts";

export const centralLondonOsmRouteMap = buildCuratedRealLondonOsmMap(centralLondonOverpassFixture, {
  mapId: CENTRAL_LONDON_OSM_MAP_ID,
  name: "Central London curated OSM - Stress test",
  description: "Large Central London curated Overpass fixture for slow visual stress testing."
});

export const centralLondonOsmRouteRunnerMapOption: RouteRunnerMapOption = {
  id: centralLondonOsmRouteMap.id,
  label: "Central London curated OSM - Stress test",
  description: getCuratedRealLondonFixtureMetadata("centralLondon").areaPurpose,
  source: "converted-osm",
  map: centralLondonOsmRouteMap,
  exercises: [],
  defaultExerciseId: "",
  attribution: getCuratedRealLondonFixtureMetadata("centralLondon").attribution.text,
  fixtureName: "centralLondonOverpass.json",
  sourceOverpassFixture: centralLondonOverpassFixture,
  devOnly: true,
  fixtureUse: "visualQaOnly",
  fixturePerformanceGate: "devOnlyStressTest",
  visibleInBeta: true,
  scoreable: false
};
