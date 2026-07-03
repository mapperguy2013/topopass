import {
  type RouteExercise,
  type RouteExerciseDifficulty
} from "../../../lib/map-engine/index.ts";
import { convertOverpassJsonToRouteMap, type OsmRouteGraphMapDefinition } from "../../../lib/map-engine/osm/index.ts";
import oneWaySystemAreaOverpassFixture from "../../../lib/map-engine/osm/fixtures/oneWaySystemAreaOverpass.json" with { type: "json" };
import piccadillyCircusOverpassFixture from "../../../lib/map-engine/osm/fixtures/piccadillyCircusOverpass.json" with { type: "json" };
import quietResidentialRoadsOverpassFixture from "../../../lib/map-engine/osm/fixtures/quietResidentialRoadsOverpass.json" with { type: "json" };
import waterlooBridgeOverpassFixture from "../../../lib/map-engine/osm/fixtures/waterlooBridgeOverpass.json" with { type: "json" };
import {
  CURATED_REAL_LONDON_OVERPASS_FIXTURES,
  type CuratedRealLondonOverpassFixtureId
} from "./curatedLondonOsmEnrichment.ts";
import {
  buildCuratedFixtureRoutableExercise,
  type CuratedFixtureRoutePreflight
} from "./curatedFixtureRoutabilityGate.ts";
import { ROUTE_RUNNER_MAP_OPTIONS, type RouteRunnerMapOption } from "./routeRunnerMaps.ts";

const PICCADILLY_CIRCUS_OSM_MAP_ID = "osm-curated-piccadilly-circus";
const WATERLOO_BRIDGE_OSM_MAP_ID = "osm-curated-waterloo-bridge";
const ONE_WAY_SYSTEM_AREA_OSM_MAP_ID = "osm-curated-one-way-system-area";
const QUIET_RESIDENTIAL_ROADS_OSM_MAP_ID = "osm-curated-quiet-residential-roads";

function buildCuratedRealLondonOsmMap(
  fixture: unknown,
  input: { mapId: string; name: string; description: string }
): OsmRouteGraphMapDefinition {
  const result = convertOverpassJsonToRouteMap(fixture, {
    mapId: input.mapId,
    name: input.name,
    description: input.description,
    version: 1
  });

  if (!result.ok) {
    throw new Error(`Unable to build curated Real London OSM fixture map ${input.mapId}: ${result.errors.join("; ")}`);
  }

  return result.map;
}

export const piccadillyCircusOsmRouteMap = buildCuratedRealLondonOsmMap(piccadillyCircusOverpassFixture, {
  mapId: PICCADILLY_CIRCUS_OSM_MAP_ID,
  name: "Piccadilly Circus curated OSM map",
  description: "Dev-only curated Overpass fixture for dense Central London Phase 6 visual QA."
});

export const waterlooBridgeOsmRouteMap = buildCuratedRealLondonOsmMap(waterlooBridgeOverpassFixture, {
  mapId: WATERLOO_BRIDGE_OSM_MAP_ID,
  name: "Waterloo Bridge curated OSM map",
  description: "Dev-only curated Overpass fixture for Thames, bridge, rail, and station Phase 6 visual QA."
});

export const oneWaySystemAreaOsmRouteMap = buildCuratedRealLondonOsmMap(oneWaySystemAreaOverpassFixture, {
  mapId: ONE_WAY_SYSTEM_AREA_OSM_MAP_ID,
  name: "One-way system curated OSM map",
  description: "Dev-only curated Overpass fixture for one-way and restriction Phase 6 visual QA."
});

export const quietResidentialRoadsOsmRouteMap = buildCuratedRealLondonOsmMap(quietResidentialRoadsOverpassFixture, {
  mapId: QUIET_RESIDENTIAL_ROADS_OSM_MAP_ID,
  name: "Quiet residential curated OSM map",
  description: "Dev-only curated Overpass fixture for suburban learner-driver Phase 6 visual QA."
});

function buildCuratedRealLondonRoutableExercisePreflight(
  map: OsmRouteGraphMapDefinition,
  sourceOverpassFixture: unknown,
  input: { idPrefix: string; title: string; description: string; difficulty: RouteExerciseDifficulty }
): CuratedFixtureRoutePreflight {
  return buildCuratedFixtureRoutableExercise({
    map,
    sourceOverpassFixture,
    id: `${input.idPrefix}-visual-qa-route`,
    title: input.title,
    description: input.description,
    difficulty: input.difficulty
  });
}

function getCuratedRealLondonFixtureMetadata(id: CuratedRealLondonOverpassFixtureId) {
  const metadata = CURATED_REAL_LONDON_OVERPASS_FIXTURES.find((fixture) => fixture.id === id);

  if (!metadata) {
    throw new Error(`Missing curated Real London fixture metadata for ${id}`);
  }

  return metadata;
}

export const piccadillyCircusOsmRoutePreflight = buildCuratedRealLondonRoutableExercisePreflight(
  piccadillyCircusOsmRouteMap,
  piccadillyCircusOverpassFixture,
  {
    idPrefix: "osm-curated-piccadilly-circus",
    title: "Piccadilly Circus: dense central visual QA",
    description: "Static Phase 6 visual QA route for dense Central London hierarchy, labels, and context.",
    difficulty: "hard"
  }
);

export const waterlooBridgeOsmRoutePreflight = buildCuratedRealLondonRoutableExercisePreflight(waterlooBridgeOsmRouteMap, waterlooBridgeOverpassFixture, {
  idPrefix: "osm-curated-waterloo-bridge",
  title: "Waterloo Bridge: Thames and station visual QA",
  description: "Static Phase 6 visual QA route for bridge, Thames, rail, station, and central context.",
  difficulty: "medium"
});

export const oneWaySystemAreaOsmRoutePreflight = buildCuratedRealLondonRoutableExercisePreflight(
  oneWaySystemAreaOsmRouteMap,
  oneWaySystemAreaOverpassFixture,
  {
    idPrefix: "osm-curated-one-way-system-area",
    title: "One-way system: restriction visual QA",
    description: "Static Phase 6 visual QA route for one-way and turn-restriction cartography.",
    difficulty: "hard"
  }
);

export const quietResidentialRoadsOsmRoutePreflight = buildCuratedRealLondonRoutableExercisePreflight(
  quietResidentialRoadsOsmRouteMap,
  quietResidentialRoadsOverpassFixture,
  {
    idPrefix: "osm-curated-quiet-residential-roads",
    title: "Quiet residential roads: learner readability QA",
    description: "Static Phase 6 visual QA route for suburban road hierarchy and mobile readability.",
    difficulty: "easy"
  }
);

function exercisesFromPreflight(preflight: CuratedFixtureRoutePreflight): RouteExercise[] {
  return preflight.exercise ? [preflight.exercise] : [];
}

export const piccadillyCircusOsmRouteExercises = exercisesFromPreflight(piccadillyCircusOsmRoutePreflight);
export const waterlooBridgeOsmRouteExercises = exercisesFromPreflight(waterlooBridgeOsmRoutePreflight);
export const oneWaySystemAreaOsmRouteExercises = exercisesFromPreflight(oneWaySystemAreaOsmRoutePreflight);
export const quietResidentialRoadsOsmRouteExercises = exercisesFromPreflight(quietResidentialRoadsOsmRoutePreflight);

export const CURATED_REAL_LONDON_ROUTE_RUNNER_MAP_OPTIONS: RouteRunnerMapOption[] = [
  {
    id: piccadillyCircusOsmRouteMap.id,
    label: "Piccadilly Circus curated OSM",
    description: getCuratedRealLondonFixtureMetadata("piccadilly-circus").areaPurpose,
    source: "converted-osm",
    map: piccadillyCircusOsmRouteMap,
    exercises: piccadillyCircusOsmRouteExercises,
    defaultExerciseId: piccadillyCircusOsmRouteExercises[0]?.id ?? "",
    attribution: getCuratedRealLondonFixtureMetadata("piccadilly-circus").attribution.text,
    fixtureName: "piccadillyCircusOverpass.json",
    sourceOverpassFixture: piccadillyCircusOverpassFixture,
    devOnly: true,
    fixtureUse: piccadillyCircusOsmRoutePreflight.fixtureUse
  },
  {
    id: waterlooBridgeOsmRouteMap.id,
    label: "Waterloo Bridge curated OSM",
    description: getCuratedRealLondonFixtureMetadata("waterloo-bridge").areaPurpose,
    source: "converted-osm",
    map: waterlooBridgeOsmRouteMap,
    exercises: waterlooBridgeOsmRouteExercises,
    defaultExerciseId: waterlooBridgeOsmRouteExercises[0]?.id ?? "",
    attribution: getCuratedRealLondonFixtureMetadata("waterloo-bridge").attribution.text,
    fixtureName: "waterlooBridgeOverpass.json",
    sourceOverpassFixture: waterlooBridgeOverpassFixture,
    devOnly: true,
    fixtureUse: waterlooBridgeOsmRoutePreflight.fixtureUse
  },
  {
    id: oneWaySystemAreaOsmRouteMap.id,
    label: "One-way system curated OSM",
    description: getCuratedRealLondonFixtureMetadata("one-way-system-area").areaPurpose,
    source: "converted-osm",
    map: oneWaySystemAreaOsmRouteMap,
    exercises: oneWaySystemAreaOsmRouteExercises,
    defaultExerciseId: oneWaySystemAreaOsmRouteExercises[0]?.id ?? "",
    attribution: getCuratedRealLondonFixtureMetadata("one-way-system-area").attribution.text,
    fixtureName: "oneWaySystemAreaOverpass.json",
    sourceOverpassFixture: oneWaySystemAreaOverpassFixture,
    devOnly: true,
    fixtureUse: oneWaySystemAreaOsmRoutePreflight.fixtureUse
  },
  {
    id: quietResidentialRoadsOsmRouteMap.id,
    label: "Quiet residential curated OSM",
    description: getCuratedRealLondonFixtureMetadata("quiet-residential-roads").areaPurpose,
    source: "converted-osm",
    map: quietResidentialRoadsOsmRouteMap,
    exercises: quietResidentialRoadsOsmRouteExercises,
    defaultExerciseId: quietResidentialRoadsOsmRouteExercises[0]?.id ?? "",
    attribution: getCuratedRealLondonFixtureMetadata("quiet-residential-roads").attribution.text,
    fixtureName: "quietResidentialRoadsOverpass.json",
    sourceOverpassFixture: quietResidentialRoadsOverpassFixture,
    devOnly: true,
    fixtureUse: quietResidentialRoadsOsmRoutePreflight.fixtureUse
  }
];

export const ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON: RouteRunnerMapOption[] = [
  ...ROUTE_RUNNER_MAP_OPTIONS,
  ...CURATED_REAL_LONDON_ROUTE_RUNNER_MAP_OPTIONS
];
