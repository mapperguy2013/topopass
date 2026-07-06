import type { RouteExercise } from "../../../lib/map-engine/index.ts";
import kingsCrossEustonOverpassFixture from "../../../lib/map-engine/osm/fixtures/kingsCrossEustonOverpass.json" with { type: "json" };
import {
  KINGS_CROSS_EUSTON_OSM_MAP_ID,
  buildCuratedRealLondonOsmMap,
  buildCuratedRealLondonRoutableExercisePreflight,
  exercisesFromPreflights,
  getCuratedRealLondonFixtureMetadata,
  requireDefaultPreflight
} from "./curatedRealLondonRouteRunnerMaps.ts";
import type { CuratedFixtureRoutePreflight } from "./curatedFixtureRoutabilityGate.ts";
import type { RouteRunnerMapOption } from "./routeRunnerMaps.ts";

const conversionStartedAt = performanceNow();

export const kingsCrossEustonOsmRouteMap = buildCuratedRealLondonOsmMap(kingsCrossEustonOverpassFixture, {
  mapId: KINGS_CROSS_EUSTON_OSM_MAP_ID,
  name: "King's Cross / Euston curated OSM map",
  description: "Curated Overpass fixture for King's Cross / Euston beta practice validation."
});

const conversionFinishedAt = performanceNow();

function buildKingsCrossEustonDiversePreflights(): CuratedFixtureRoutePreflight[] {
  const selectedPreflights: CuratedFixtureRoutePreflight[] = [];
  const specs = [
    {
    idPrefix: "osm-curated-kings-cross-euston",
    suffix: "station-corridor-route",
    title: "King's Cross / Euston: station corridor route",
    description: "Beta route for station-area roads, labels, and learner overlays.",
    difficulty: "medium",
    routeType: "direct",
    includeCheckpoint: false,
    routeOrdinal: 0,
    minimumStraightLineDistanceMeters: 180
    },
    {
    idPrefix: "osm-curated-kings-cross-euston",
    suffix: "main-road-side-road-route",
    title: "King's Cross / Euston: side-street route",
    description: "Beta route for a different station-area side-street corridor.",
    difficulty: "hard",
    routeType: "direct",
    includeCheckpoint: false,
    routeOrdinal: 0,
    minimumStraightLineDistanceMeters: 220
    },
    {
    idPrefix: "osm-curated-kings-cross-euston",
    suffix: "checkpoint-route",
    title: "King's Cross / Euston: checkpoint sector route",
    description: "Checkpoint beta route using a separate map sector for station-area orientation.",
    difficulty: "hard",
    routeType: "checkpoint",
    includeCheckpoint: true,
    routeOrdinal: 0,
    minimumStraightLineDistanceMeters: 260
    }
  ] as const;

  return specs.map((spec) => {
    const preflight = buildCuratedRealLondonRoutableExercisePreflight(
      kingsCrossEustonOsmRouteMap,
      kingsCrossEustonOverpassFixture,
      {
        ...spec,
        diversity: {
          avoidRouteRoadIds: selectedPreflights.map((selected) => selected.routeRoadIds),
          avoidStartNodeIds: selectedPreflights.flatMap((selected) => selected.routeNodeIds[0] ?? []),
          avoidDestinationNodeIds: selectedPreflights.flatMap((selected) => selected.routeNodeIds.at(-1) ?? []),
          maxRouteOverlapRatio: 0.68,
          minStartDistanceMeters: 70,
          minDestinationDistanceMeters: 70
        }
      }
    );

    if (preflight.exercise) {
      selectedPreflights.push(preflight);
    }

    return preflight;
  });
}

export const kingsCrossEustonOsmRoutePreflights = buildKingsCrossEustonDiversePreflights();

export const kingsCrossEustonOsmRoutePreflight = requireDefaultPreflight(
  kingsCrossEustonOsmRoutePreflights,
  "kings-cross-euston"
);
export const kingsCrossEustonOsmRouteExercises: RouteExercise[] = exercisesFromPreflights(
  kingsCrossEustonOsmRoutePreflights
);

export const kingsCrossEustonOsmRouteRunnerMapOption: RouteRunnerMapOption = {
  id: kingsCrossEustonOsmRouteMap.id,
  label: "King's Cross / Euston curated OSM",
  description: getCuratedRealLondonFixtureMetadata("kingsCrossEuston").areaPurpose,
  source: "converted-osm",
  map: kingsCrossEustonOsmRouteMap,
  exercises: kingsCrossEustonOsmRouteExercises,
  defaultExerciseId: kingsCrossEustonOsmRouteExercises[0]?.id ?? "",
  attribution: getCuratedRealLondonFixtureMetadata("kingsCrossEuston").attribution.text,
  fixtureName: "kingsCrossEustonOverpass.json",
  sourceOverpassFixture: kingsCrossEustonOverpassFixture,
  devOnly: true,
  fixtureUse: kingsCrossEustonOsmRoutePreflight.fixtureUse,
  fixturePerformanceGate: "betaPracticeAllowedWithLoading"
};

export const KINGS_CROSS_EUSTON_FIXTURE_LOAD_TIMING = {
  fixtureName: "kingsCrossEustonOverpass.json",
  fixtureImportMs: null,
  jsonParseMs: null,
  osmConversionMs: Math.max(0, conversionFinishedAt - conversionStartedAt),
  graphBuildMs: null,
  contextFeatureConversionMs: null,
  labelCandidateGenerationMs: null,
  firstRenderPreparationMs: null,
  totalUntilInteractiveMs: null,
  note:
    "Static JSON module parsing is not separately observable in Node/Next. The learner page defers this fixture behind a dynamic import and shows a loading state while import, parse, conversion, graph, context, label, and first render preparation complete."
} as const;

function performanceNow(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}
