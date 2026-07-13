import victoriaWestminsterVauxhallOverpassFixture from "../../../lib/map-engine/osm/fixtures/victoriaWestminsterVauxhallOverpass.json" with { type: "json" };
import victoriaWestminsterVauxhallBuildingsOverpassFixture from "../../../lib/map-engine/osm/fixtures/victoriaWestminsterVauxhallBuildingsOverpass.json" with { type: "json" };
import {
  VICTORIA_WESTMINSTER_VAUXHALL_OSM_MAP_ID,
  buildCuratedRealLondonOsmMap,
  getCuratedRealLondonFixtureMetadata
} from "./curatedRealLondonRouteRunnerMaps.ts";
import type { RouteRunnerMapOption } from "./routeRunnerMaps.ts";

const conversionStartedAt = performanceNow();

const victoriaWestminsterVauxhallContextFixture = {
  ...victoriaWestminsterVauxhallOverpassFixture,
  elements: [
    ...victoriaWestminsterVauxhallOverpassFixture.elements,
    ...victoriaWestminsterVauxhallBuildingsOverpassFixture.elements
  ]
};

export const victoriaWestminsterVauxhallOsmRouteMap = buildCuratedRealLondonOsmMap(
  victoriaWestminsterVauxhallOverpassFixture,
  {
    mapId: VICTORIA_WESTMINSTER_VAUXHALL_OSM_MAP_ID,
    name: "Victoria / Westminster / Vauxhall OSM - Phase 8.8 visual QA",
    description: "Phase 8.8 visual-QA Overpass benchmark for the principal examination-atlas scale and density target."
  }
);

const conversionFinishedAt = performanceNow();

export const victoriaWestminsterVauxhallOsmRouteRunnerMapOption: RouteRunnerMapOption = {
  id: victoriaWestminsterVauxhallOsmRouteMap.id,
  label: "Victoria / Westminster / Vauxhall OSM - Phase 8.8 visual QA",
  description: getCuratedRealLondonFixtureMetadata("victoriaWestminsterVauxhall").areaPurpose,
  source: "converted-osm",
  map: victoriaWestminsterVauxhallOsmRouteMap,
  exercises: [],
  defaultExerciseId: "",
  attribution: getCuratedRealLondonFixtureMetadata("victoriaWestminsterVauxhall").attribution.text,
  fixtureName: "victoriaWestminsterVauxhallOverpass.json",
  sourceOverpassFixture: victoriaWestminsterVauxhallContextFixture,
  devOnly: true,
  fixtureUse: "visualQaOnly",
  fixturePerformanceGate: "visualQaOnly",
  visibleInBeta: false,
  scoreable: false
};

export const VICTORIA_WESTMINSTER_VAUXHALL_FIXTURE_LOAD_TIMING = {
  fixtureName: "victoriaWestminsterVauxhallOverpass.json",
  fixtureImportMs: null,
  jsonParseMs: null,
  osmConversionMs: Math.max(0, conversionFinishedAt - conversionStartedAt),
  graphBuildMs: null,
  contextFeatureConversionMs: null,
  labelCandidateGenerationMs: null,
  firstRenderPreparationMs: null,
  totalUntilInteractiveMs: null,
  note:
    "Static JSON module parsing is not separately observable in Node/Next. The dev visual-QA page defers the lightweight route fixture and bounded building-only context fixture behind one dynamic import and shows a loading state while import, parse, conversion, graph, context, label, and first render preparation complete."
} as const;

function performanceNow(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}
