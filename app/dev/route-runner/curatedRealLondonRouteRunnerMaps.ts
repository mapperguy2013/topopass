import {
  type MapDefinition,
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
import {
  ROUTE_RUNNER_MAP_OPTIONS,
  type RealLondonPilotRouteType,
  type RouteRunnerMapOption
} from "./routeRunnerMaps.ts";

const PICCADILLY_CIRCUS_OSM_MAP_ID = "osm-curated-piccadilly-circus";
const WATERLOO_BRIDGE_OSM_MAP_ID = "osm-curated-waterloo-bridge";
const ONE_WAY_SYSTEM_AREA_OSM_MAP_ID = "osm-curated-one-way-system-area";
const QUIET_RESIDENTIAL_ROADS_OSM_MAP_ID = "osm-curated-quiet-residential-roads";
export const KINGS_CROSS_EUSTON_OSM_MAP_ID = "osm-curated-kings-cross-euston";
export const KINGS_CROSS_EUSTON_LAZY_LOAD_ID = "kingsCrossEuston";

export function buildCuratedRealLondonOsmMap(
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

export const kingsCrossEustonLazyPlaceholderRouteMap: MapDefinition = {
  id: KINGS_CROSS_EUSTON_OSM_MAP_ID,
  name: "King's Cross / Euston curated OSM map",
  mapVersion: "lazy-placeholder-1.0.0",
  description: "King's Cross / Euston curated OSM fixture placeholder. Full map loads after selection.",
  nodes: [
    { id: "osm-curated-kings-cross-euston-loading-west", x: 0, y: 0, label: "King's Cross / Euston" },
    { id: "osm-curated-kings-cross-euston-loading-east", x: 100, y: 0, label: "Loading map" }
  ],
  roads: [
    {
      id: "osm-curated-kings-cross-euston-loading-road",
      fromNodeId: "osm-curated-kings-cross-euston-loading-west",
      toNodeId: "osm-curated-kings-cross-euston-loading-east",
      distanceMeters: 100,
      isOneWay: false,
      name: "Loading King's Cross / Euston"
    }
  ],
  restrictions: [],
  landmarks: []
};

export function buildCuratedRealLondonRoutableExercisePreflight(
  map: OsmRouteGraphMapDefinition,
  sourceOverpassFixture: unknown,
  input: {
    idPrefix: string;
    suffix: string;
    title: string;
    description: string;
    difficulty: RouteExerciseDifficulty;
    routeType: RealLondonPilotRouteType;
    routeOrdinal?: number;
    includeCheckpoint?: boolean;
    minimumStraightLineDistanceMeters?: number;
  }
): CuratedFixtureRoutePreflight {
  const preflight = buildCuratedFixtureRoutableExercise({
    map,
    sourceOverpassFixture,
    id: `${input.idPrefix}-${input.suffix}`,
    title: input.title,
    description: input.description,
    difficulty: input.difficulty,
    routeOrdinal: input.routeOrdinal,
    includeCheckpoint: input.includeCheckpoint,
    minimumStraightLineDistanceMeters: input.minimumStraightLineDistanceMeters
  });

  if (!preflight.exercise) {
    return preflight;
  }

  return {
    ...preflight,
    exercise: {
      ...preflight.exercise,
      realLondonPilotMetadata: {
        difficulty: input.difficulty,
        routeType: input.routeType,
        estimatedDistanceMeters: preflight.shortestRouteDistanceMeters ?? 0,
        expectedComplexity: input.description
      }
    } as RouteExercise
  };
}

export function getCuratedRealLondonFixtureMetadata(id: CuratedRealLondonOverpassFixtureId) {
  const metadata = CURATED_REAL_LONDON_OVERPASS_FIXTURES.find((fixture) => fixture.id === id);

  if (!metadata) {
    throw new Error(`Missing curated Real London fixture metadata for ${id}`);
  }

  return metadata;
}

export function requireDefaultPreflight(
  preflights: readonly CuratedFixtureRoutePreflight[],
  fixtureName: string
): CuratedFixtureRoutePreflight {
  const preflight = preflights[0];

  if (!preflight) {
    throw new Error(`Missing curated Real London default preflight for ${fixtureName}.`);
  }

  return preflight;
}

export const piccadillyCircusOsmRoutePreflights = [
  buildCuratedRealLondonRoutableExercisePreflight(piccadillyCircusOsmRouteMap, piccadillyCircusOverpassFixture, {
    idPrefix: "osm-curated-piccadilly-circus",
    suffix: "short-central-route",
    title: "Piccadilly Circus: short central route",
    description: "Short beta route for dense Central London road hierarchy and labels.",
    difficulty: "medium",
    routeType: "direct",
    includeCheckpoint: false,
    routeOrdinal: 0,
    minimumStraightLineDistanceMeters: 180
  }),
  buildCuratedRealLondonRoutableExercisePreflight(piccadillyCircusOsmRouteMap, piccadillyCircusOverpassFixture, {
    idPrefix: "osm-curated-piccadilly-circus",
    suffix: "checkpoint-route",
    title: "Piccadilly Circus: checkpoint route",
    description: "Checkpoint beta route through the dense central fixture.",
    difficulty: "hard",
    routeType: "checkpoint",
    includeCheckpoint: true,
    routeOrdinal: 1,
    minimumStraightLineDistanceMeters: 220
  }),
  buildCuratedRealLondonRoutableExercisePreflight(piccadillyCircusOsmRouteMap, piccadillyCircusOverpassFixture, {
    idPrefix: "osm-curated-piccadilly-circus",
    suffix: "longer-central-route",
    title: "Piccadilly Circus: longer central route",
    description: "Longer beta route for checking central London label density and learner overlays.",
    difficulty: "hard",
    routeType: "checkpoint",
    includeCheckpoint: true,
    routeOrdinal: 2,
    minimumStraightLineDistanceMeters: 260
  })
];
export const piccadillyCircusOsmRoutePreflight = requireDefaultPreflight(
  piccadillyCircusOsmRoutePreflights,
  "piccadilly-circus"
);

export const waterlooBridgeOsmRoutePreflights = [
  buildCuratedRealLondonRoutableExercisePreflight(waterlooBridgeOsmRouteMap, waterlooBridgeOverpassFixture, {
    idPrefix: "osm-curated-waterloo-bridge",
    suffix: "thames-crossing-route",
    title: "Waterloo Bridge: Thames crossing",
    description: "Bridge and Thames beta route for the Waterloo corridor.",
    difficulty: "medium",
    routeType: "direct",
    includeCheckpoint: false,
    routeOrdinal: 0,
    minimumStraightLineDistanceMeters: 200
  }),
  buildCuratedRealLondonRoutableExercisePreflight(waterlooBridgeOsmRouteMap, waterlooBridgeOverpassFixture, {
    idPrefix: "osm-curated-waterloo-bridge",
    suffix: "station-context-checkpoint",
    title: "Waterloo Bridge: station context checkpoint",
    description: "Checkpoint beta route for bridge, station, rail, and central context.",
    difficulty: "medium",
    routeType: "checkpoint",
    includeCheckpoint: true,
    routeOrdinal: 1,
    minimumStraightLineDistanceMeters: 240
  }),
  buildCuratedRealLondonRoutableExercisePreflight(waterlooBridgeOsmRouteMap, waterlooBridgeOverpassFixture, {
    idPrefix: "osm-curated-waterloo-bridge",
    suffix: "longer-thames-route",
    title: "Waterloo Bridge: longer Thames corridor route",
    description: "Longer beta route for checking Thames, bridge, and major-road readability.",
    difficulty: "hard",
    routeType: "checkpoint",
    includeCheckpoint: true,
    routeOrdinal: 2,
    minimumStraightLineDistanceMeters: 280
  })
];
export const waterlooBridgeOsmRoutePreflight = requireDefaultPreflight(waterlooBridgeOsmRoutePreflights, "waterloo-bridge");

export const oneWaySystemAreaOsmRoutePreflights = [
  buildCuratedRealLondonRoutableExercisePreflight(oneWaySystemAreaOsmRouteMap, oneWaySystemAreaOverpassFixture, {
    idPrefix: "osm-curated-one-way-system-area",
    suffix: "short-one-way-route",
    title: "One-way system: short legal route",
    description: "Short beta route for one-way and restriction cartography.",
    difficulty: "medium",
    routeType: "one-way-awareness",
    includeCheckpoint: false,
    routeOrdinal: 0,
    minimumStraightLineDistanceMeters: 180
  }),
  buildCuratedRealLondonRoutableExercisePreflight(oneWaySystemAreaOsmRouteMap, oneWaySystemAreaOverpassFixture, {
    idPrefix: "osm-curated-one-way-system-area",
    suffix: "restriction-checkpoint-route",
    title: "One-way system: restriction checkpoint route",
    description: "Checkpoint beta route through the one-way and restriction-heavy fixture.",
    difficulty: "hard",
    routeType: "one-way-awareness",
    includeCheckpoint: true,
    routeOrdinal: 1,
    minimumStraightLineDistanceMeters: 220
  }),
  buildCuratedRealLondonRoutableExercisePreflight(oneWaySystemAreaOsmRouteMap, oneWaySystemAreaOverpassFixture, {
    idPrefix: "osm-curated-one-way-system-area",
    suffix: "longer-one-way-route",
    title: "One-way system: longer legal route",
    description: "Longer beta route for dense one-way decision-point readability.",
    difficulty: "hard",
    routeType: "one-way-awareness",
    includeCheckpoint: true,
    routeOrdinal: 2,
    minimumStraightLineDistanceMeters: 260
  })
];
export const oneWaySystemAreaOsmRoutePreflight = requireDefaultPreflight(
  oneWaySystemAreaOsmRoutePreflights,
  "one-way-system-area"
);

export const quietResidentialRoadsOsmRoutePreflights = [
  buildCuratedRealLondonRoutableExercisePreflight(quietResidentialRoadsOsmRouteMap, quietResidentialRoadsOverpassFixture, {
    idPrefix: "osm-curated-quiet-residential-roads",
    suffix: "short-residential-route",
    title: "Quiet residential roads: short route",
    description: "Short beta route for suburban learner-driver readability.",
    difficulty: "easy",
    routeType: "direct",
    includeCheckpoint: false,
    routeOrdinal: 0,
    minimumStraightLineDistanceMeters: 140
  }),
  buildCuratedRealLondonRoutableExercisePreflight(quietResidentialRoadsOsmRouteMap, quietResidentialRoadsOverpassFixture, {
    idPrefix: "osm-curated-quiet-residential-roads",
    suffix: "checkpoint-residential-route",
    title: "Quiet residential roads: checkpoint route",
    description: "Checkpoint beta route for quiet residential and side-street readability.",
    difficulty: "medium",
    routeType: "checkpoint",
    includeCheckpoint: true,
    routeOrdinal: 1,
    minimumStraightLineDistanceMeters: 180
  }),
  buildCuratedRealLondonRoutableExercisePreflight(quietResidentialRoadsOsmRouteMap, quietResidentialRoadsOverpassFixture, {
    idPrefix: "osm-curated-quiet-residential-roads",
    suffix: "major-to-side-road-route",
    title: "Quiet residential roads: major to side road",
    description: "Longer beta route for major-road to side-street transition readability.",
    difficulty: "medium",
    routeType: "checkpoint",
    includeCheckpoint: true,
    routeOrdinal: 2,
    minimumStraightLineDistanceMeters: 220
  })
];
export const quietResidentialRoadsOsmRoutePreflight = requireDefaultPreflight(
  quietResidentialRoadsOsmRoutePreflights,
  "quiet-residential-roads"
);

export function exercisesFromPreflights(preflights: readonly CuratedFixtureRoutePreflight[]): RouteExercise[] {
  return preflights.flatMap((preflight) => (preflight.exercise ? [preflight.exercise] : []));
}

export const piccadillyCircusOsmRouteExercises = exercisesFromPreflights(piccadillyCircusOsmRoutePreflights);
export const waterlooBridgeOsmRouteExercises = exercisesFromPreflights(waterlooBridgeOsmRoutePreflights);
export const oneWaySystemAreaOsmRouteExercises = exercisesFromPreflights(oneWaySystemAreaOsmRoutePreflights);
export const quietResidentialRoadsOsmRouteExercises = exercisesFromPreflights(quietResidentialRoadsOsmRoutePreflights);

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
  },
  {
    id: kingsCrossEustonLazyPlaceholderRouteMap.id,
    label: "King's Cross / Euston curated OSM",
    description: getCuratedRealLondonFixtureMetadata("kingsCrossEuston").areaPurpose,
    source: "converted-osm",
    map: kingsCrossEustonLazyPlaceholderRouteMap,
    exercises: [],
    defaultExerciseId: "",
    attribution: getCuratedRealLondonFixtureMetadata("kingsCrossEuston").attribution.text,
    fixtureName: "kingsCrossEustonOverpass.json",
    devOnly: true,
    fixtureUse: "routableExercise",
    fixturePerformanceGate: "betaPracticeAllowedWithLoading",
    lazyLoadId: KINGS_CROSS_EUSTON_LAZY_LOAD_ID,
    lazyLoadingLabel: "Loading King's Cross / Euston map..."
  }
];

export const ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON: RouteRunnerMapOption[] = [
  ...ROUTE_RUNNER_MAP_OPTIONS,
  ...CURATED_REAL_LONDON_ROUTE_RUNNER_MAP_OPTIONS
];
