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
  ONE_WAY_SYSTEM_AREA_CONTEXT_SUPPLEMENT_ID,
  PICCADILLY_CIRCUS_CONTEXT_SUPPLEMENT_ID,
  QUIET_RESIDENTIAL_ROADS_CONTEXT_SUPPLEMENT_ID,
  WATERLOO_BRIDGE_CONTEXT_SUPPLEMENT_ID
} from "./curatedRealLondonContextSupplements.ts";
import {
  buildCuratedFixtureRoutableExercise,
  type CuratedFixtureRouteDiversityInput,
  type CuratedFixtureRoutePreflight
} from "./curatedFixtureRoutabilityGate.ts";
import {
  ROUTE_RUNNER_MAP_OPTIONS,
  type RealLondonPilotRouteType,
  type RouteRunnerMapOption
} from "./routeRunnerMaps.ts";
import {
  CENTRAL_LONDON_LAZY_LOAD_ID,
  KINGS_CROSS_EUSTON_LAZY_LOAD_ID,
  VICTORIA_WESTMINSTER_VAUXHALL_LAZY_LOAD_ID
} from "./curatedRealLondonLazyIds.ts";

const PICCADILLY_CIRCUS_OSM_MAP_ID = "osm-curated-piccadilly-circus";
const WATERLOO_BRIDGE_OSM_MAP_ID = "osm-curated-waterloo-bridge";
const ONE_WAY_SYSTEM_AREA_OSM_MAP_ID = "osm-curated-one-way-system-area";
const QUIET_RESIDENTIAL_ROADS_OSM_MAP_ID = "osm-curated-quiet-residential-roads";
export const KINGS_CROSS_EUSTON_OSM_MAP_ID = "osm-curated-kings-cross-euston";
export const VICTORIA_WESTMINSTER_VAUXHALL_OSM_MAP_ID = "osm-curated-victoria-westminster-vauxhall";
export const CENTRAL_LONDON_OSM_MAP_ID = "osm-curated-centralLondon";
export {
  CENTRAL_LONDON_LAZY_LOAD_ID,
  KINGS_CROSS_EUSTON_LAZY_LOAD_ID,
  VICTORIA_WESTMINSTER_VAUXHALL_LAZY_LOAD_ID
} from "./curatedRealLondonLazyIds.ts";

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

export const centralLondonLazyPlaceholderRouteMap: MapDefinition = {
  id: CENTRAL_LONDON_OSM_MAP_ID,
  name: "Central London curated OSM - Stress test",
  mapVersion: "lazy-placeholder-1.0.0",
  description: "Central London curated OSM stress-test fixture placeholder. Full map loads only after selection.",
  nodes: [
    { id: "osm-curated-central-london-loading-west", x: 0, y: 0, label: "Central London" },
    { id: "osm-curated-central-london-loading-east", x: 120, y: 0, label: "Stress map loading" }
  ],
  roads: [
    {
      id: "osm-curated-central-london-loading-road",
      fromNodeId: "osm-curated-central-london-loading-west",
      toNodeId: "osm-curated-central-london-loading-east",
      distanceMeters: 120,
      isOneWay: false,
      name: "Loading Central London stress map"
    }
  ],
  restrictions: [],
  landmarks: []
};

export const victoriaWestminsterVauxhallLazyPlaceholderRouteMap: MapDefinition = {
  id: VICTORIA_WESTMINSTER_VAUXHALL_OSM_MAP_ID,
  name: "Victoria / Westminster / Vauxhall OSM - Phase 8.8 visual QA",
  mapVersion: "lazy-placeholder-1.0.0",
  description: "Phase 8.8 Victoria / Westminster / Vauxhall visual-QA benchmark placeholder. Full map loads after selection.",
  nodes: [
    { id: "osm-curated-victoria-westminster-vauxhall-loading-west", x: 0, y: 0, label: "Victoria / Westminster" },
    { id: "osm-curated-victoria-westminster-vauxhall-loading-east", x: 140, y: 0, label: "Loading benchmark" }
  ],
  roads: [
    {
      id: "osm-curated-victoria-westminster-vauxhall-loading-road",
      fromNodeId: "osm-curated-victoria-westminster-vauxhall-loading-west",
      toNodeId: "osm-curated-victoria-westminster-vauxhall-loading-east",
      distanceMeters: 140,
      isOneWay: false,
      name: "Loading Victoria / Westminster / Vauxhall benchmark"
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
    diversity?: CuratedFixtureRouteDiversityInput;
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
    minimumStraightLineDistanceMeters: input.minimumStraightLineDistanceMeters,
    diversity: input.diversity
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

type CuratedRouteExerciseSpec = {
  idPrefix: string;
  suffix: string;
  title: string;
  description: string;
  difficulty: RouteExerciseDifficulty;
  routeType: RealLondonPilotRouteType;
  routeOrdinal?: number;
  includeCheckpoint?: boolean;
  minimumStraightLineDistanceMeters?: number;
};

function buildDiverseCuratedRoutePreflights(input: {
  map: OsmRouteGraphMapDefinition;
  sourceOverpassFixture: unknown;
  specs: readonly CuratedRouteExerciseSpec[];
  maxRouteOverlapRatio?: number;
  minStartDistanceMeters?: number;
  minDestinationDistanceMeters?: number;
}): CuratedFixtureRoutePreflight[] {
  const selectedPreflights: CuratedFixtureRoutePreflight[] = [];

  return input.specs.map((spec) => {
    const diversity: CuratedFixtureRouteDiversityInput = {
      avoidRouteRoadIds: selectedPreflights.map((preflight) => preflight.routeRoadIds),
      avoidStartNodeIds: selectedPreflights.flatMap((preflight) => preflight.routeNodeIds[0] ?? []),
      avoidDestinationNodeIds: selectedPreflights.flatMap((preflight) => preflight.routeNodeIds.at(-1) ?? []),
      maxRouteOverlapRatio: input.maxRouteOverlapRatio,
      minStartDistanceMeters: input.minStartDistanceMeters,
      minDestinationDistanceMeters: input.minDestinationDistanceMeters
    };
    const preflight = buildCuratedRealLondonRoutableExercisePreflight(input.map, input.sourceOverpassFixture, {
      ...spec,
      diversity
    });

    if (preflight.exercise) {
      selectedPreflights.push(preflight);
    }

    return preflight;
  });
}

export const piccadillyCircusOsmRoutePreflights = buildDiverseCuratedRoutePreflights({
  map: piccadillyCircusOsmRouteMap,
  sourceOverpassFixture: piccadillyCircusOverpassFixture,
  specs: [
    {
    idPrefix: "osm-curated-piccadilly-circus",
    suffix: "short-central-route",
    title: "Piccadilly Circus: short central route",
    description: "Short beta route for dense Central London road hierarchy and labels.",
    difficulty: "medium",
    routeType: "direct",
    includeCheckpoint: false,
    routeOrdinal: 0,
    minimumStraightLineDistanceMeters: 180
    },
    {
    idPrefix: "osm-curated-piccadilly-circus",
    suffix: "checkpoint-route",
    title: "Piccadilly Circus: side-street checkpoint route",
    description: "Checkpoint beta route using a different dense central side-street corridor.",
    difficulty: "hard",
    routeType: "checkpoint",
    includeCheckpoint: true,
    routeOrdinal: 0,
    minimumStraightLineDistanceMeters: 220
    },
    {
    idPrefix: "osm-curated-piccadilly-circus",
    suffix: "longer-central-route",
    title: "Piccadilly Circus: longer West End route",
    description: "Longer beta route for a separate West End corridor, label density, and learner overlays.",
    difficulty: "hard",
    routeType: "checkpoint",
    includeCheckpoint: true,
    routeOrdinal: 0,
    minimumStraightLineDistanceMeters: 260
    }
  ]
});
export const piccadillyCircusOsmRoutePreflight = requireDefaultPreflight(
  piccadillyCircusOsmRoutePreflights,
  "piccadilly-circus"
);

export const waterlooBridgeOsmRoutePreflights = buildDiverseCuratedRoutePreflights({
  map: waterlooBridgeOsmRouteMap,
  sourceOverpassFixture: waterlooBridgeOverpassFixture,
  specs: [
    {
    idPrefix: "osm-curated-waterloo-bridge",
    suffix: "thames-crossing-route",
    title: "Waterloo Bridge: Thames crossing",
    description: "Bridge and Thames beta route for the Waterloo corridor.",
    difficulty: "medium",
    routeType: "direct",
    includeCheckpoint: false,
    routeOrdinal: 0,
    minimumStraightLineDistanceMeters: 200
    },
    {
    idPrefix: "osm-curated-waterloo-bridge",
    suffix: "station-context-checkpoint",
    title: "Waterloo Bridge: riverside checkpoint route",
    description: "Checkpoint beta route using a distinct riverside and station-context corridor.",
    difficulty: "medium",
    routeType: "checkpoint",
    includeCheckpoint: true,
    routeOrdinal: 0,
    minimumStraightLineDistanceMeters: 240
    },
    {
    idPrefix: "osm-curated-waterloo-bridge",
    suffix: "longer-thames-route",
    title: "Waterloo Bridge: bridge-to-bridge route",
    description: "Longer beta route for a different bridge and major-road readability corridor.",
    difficulty: "hard",
    routeType: "checkpoint",
    includeCheckpoint: true,
    routeOrdinal: 0,
    minimumStraightLineDistanceMeters: 280
    }
  ]
});
export const waterlooBridgeOsmRoutePreflight = requireDefaultPreflight(waterlooBridgeOsmRoutePreflights, "waterloo-bridge");

export const oneWaySystemAreaOsmRoutePreflights = buildDiverseCuratedRoutePreflights({
  map: oneWaySystemAreaOsmRouteMap,
  sourceOverpassFixture: oneWaySystemAreaOverpassFixture,
  specs: [
    {
    idPrefix: "osm-curated-one-way-system-area",
    suffix: "short-one-way-route",
    title: "One-way system: short legal route",
    description: "Short beta route for one-way and restriction cartography.",
    difficulty: "medium",
    routeType: "one-way-awareness",
    includeCheckpoint: false,
    routeOrdinal: 0,
    minimumStraightLineDistanceMeters: 180
    },
    {
    idPrefix: "osm-curated-one-way-system-area",
    suffix: "restriction-checkpoint-route",
    title: "One-way system: restriction checkpoint route",
    description: "Checkpoint beta route through the one-way and restriction-heavy fixture.",
    difficulty: "hard",
    routeType: "one-way-awareness",
    includeCheckpoint: true,
    routeOrdinal: 0,
    minimumStraightLineDistanceMeters: 220
    },
    {
    idPrefix: "osm-curated-one-way-system-area",
    suffix: "longer-one-way-route",
    title: "One-way system: legal detour route",
    description: "Longer beta route that uses a different legal detour through one-way decision points.",
    difficulty: "hard",
    routeType: "one-way-awareness",
    includeCheckpoint: true,
    routeOrdinal: 0,
    minimumStraightLineDistanceMeters: 260
    }
  ]
});
export const oneWaySystemAreaOsmRoutePreflight = requireDefaultPreflight(
  oneWaySystemAreaOsmRoutePreflights,
  "one-way-system-area"
);

export const quietResidentialRoadsOsmRoutePreflights = buildDiverseCuratedRoutePreflights({
  map: quietResidentialRoadsOsmRouteMap,
  sourceOverpassFixture: quietResidentialRoadsOverpassFixture,
  specs: [
    {
    idPrefix: "osm-curated-quiet-residential-roads",
    suffix: "short-residential-route",
    title: "Quiet residential roads: short route",
    description: "Short beta route for suburban learner-driver readability.",
    difficulty: "easy",
    routeType: "direct",
    includeCheckpoint: false,
    routeOrdinal: 0,
    minimumStraightLineDistanceMeters: 140
    },
    {
    idPrefix: "osm-curated-quiet-residential-roads",
    suffix: "checkpoint-residential-route",
    title: "Quiet residential roads: residential checkpoint route",
    description: "Checkpoint beta route using a different residential side-street sector.",
    difficulty: "medium",
    routeType: "checkpoint",
    includeCheckpoint: true,
    routeOrdinal: 0,
    minimumStraightLineDistanceMeters: 180
    },
    {
    idPrefix: "osm-curated-quiet-residential-roads",
    suffix: "major-to-side-road-route",
    title: "Quiet residential roads: major to side road",
    description: "Longer beta route for major-road to side-street transition readability.",
    difficulty: "medium",
    routeType: "checkpoint",
    includeCheckpoint: true,
    routeOrdinal: 0,
    minimumStraightLineDistanceMeters: 220
    }
  ]
});
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
    contextSupplementLazyLoadId: PICCADILLY_CIRCUS_CONTEXT_SUPPLEMENT_ID,
    devOnly: true,
    fixtureUse: piccadillyCircusOsmRoutePreflight.fixtureUse,
    fixturePerformanceGate: "betaPracticeAllowed",
    visibleInBeta: true,
    scoreable: true
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
    contextSupplementLazyLoadId: WATERLOO_BRIDGE_CONTEXT_SUPPLEMENT_ID,
    devOnly: true,
    fixtureUse: waterlooBridgeOsmRoutePreflight.fixtureUse,
    fixturePerformanceGate: "betaPracticeAllowed",
    visibleInBeta: true,
    scoreable: true
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
    contextSupplementLazyLoadId: ONE_WAY_SYSTEM_AREA_CONTEXT_SUPPLEMENT_ID,
    devOnly: true,
    fixtureUse: oneWaySystemAreaOsmRoutePreflight.fixtureUse,
    fixturePerformanceGate: "betaPracticeAllowed",
    visibleInBeta: true,
    scoreable: true
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
    contextSupplementLazyLoadId: QUIET_RESIDENTIAL_ROADS_CONTEXT_SUPPLEMENT_ID,
    devOnly: true,
    fixtureUse: quietResidentialRoadsOsmRoutePreflight.fixtureUse,
    fixturePerformanceGate: "betaPracticeAllowed",
    visibleInBeta: true,
    scoreable: true
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
    visibleInBeta: true,
    scoreable: true,
    lazyLoadId: KINGS_CROSS_EUSTON_LAZY_LOAD_ID,
    lazyLoadingLabel: "Loading King's Cross / Euston map..."
  },
  {
    id: centralLondonLazyPlaceholderRouteMap.id,
    label: "Central London curated OSM - Stress test",
    description: getCuratedRealLondonFixtureMetadata("centralLondon").areaPurpose,
    source: "converted-osm",
    map: centralLondonLazyPlaceholderRouteMap,
    exercises: [],
    defaultExerciseId: "",
    attribution: getCuratedRealLondonFixtureMetadata("centralLondon").attribution.text,
    fixtureName: "centralLondonOverpass.json",
    devOnly: true,
    fixtureUse: "visualQaOnly",
    fixturePerformanceGate: "devOnlyStressTest",
    visibleInBeta: true,
    scoreable: false,
    lazyLoadId: CENTRAL_LONDON_LAZY_LOAD_ID,
    lazyLoadingLabel: "Loading Central London stress-test map..."
  },
  {
    id: victoriaWestminsterVauxhallLazyPlaceholderRouteMap.id,
    label: "Victoria / Westminster / Vauxhall OSM - Phase 8.8 visual QA",
    description: getCuratedRealLondonFixtureMetadata("victoriaWestminsterVauxhall").areaPurpose,
    source: "converted-osm",
    map: victoriaWestminsterVauxhallLazyPlaceholderRouteMap,
    exercises: [],
    defaultExerciseId: "",
    attribution: getCuratedRealLondonFixtureMetadata("victoriaWestminsterVauxhall").attribution.text,
    fixtureName: "victoriaWestminsterVauxhallOverpass.json",
    devOnly: true,
    fixtureUse: "visualQaOnly",
    fixturePerformanceGate: "visualQaOnly",
    visibleInBeta: false,
    scoreable: false,
    lazyLoadId: VICTORIA_WESTMINSTER_VAUXHALL_LAZY_LOAD_ID,
    lazyLoadingLabel: "Loading Victoria / Westminster / Vauxhall visual-QA benchmark..."
  }
];

export const ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON: RouteRunnerMapOption[] = [
  ...ROUTE_RUNNER_MAP_OPTIONS,
  ...CURATED_REAL_LONDON_ROUTE_RUNNER_MAP_OPTIONS
];
