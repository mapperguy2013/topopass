import {
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  type MapDefinition,
  type RouteExercise,
  type RouteExerciseDifficulty,
  type Vec2
} from "../../../lib/map-engine/index.ts";
import { convertOverpassJsonToRouteMap, type OsmRouteGraphMapDefinition } from "../../../lib/map-engine/osm/index.ts";
import largeLondonOverpassFixture from "../../../lib/map-engine/osm/fixtures/largeLondonOverpass.json" with { type: "json" };
import mediumLondonOverpassFixture from "../../../lib/map-engine/osm/fixtures/mediumLondonOverpass.json" with { type: "json" };
import realLondonPilotOverpassFixture from "../../../lib/map-engine/osm/fixtures/realLondonPilotOverpass.json" with { type: "json" };
import tinyLondonOverpassFixture from "../../../lib/map-engine/osm/fixtures/tinyLondonOverpass.json" with { type: "json" };

export type RouteRunnerMapSource = "synthetic-dev" | "converted-osm";

export type RouteRunnerMapOption = {
  id: string;
  label: string;
  description: string;
  source: RouteRunnerMapSource;
  map: MapDefinition;
  exercises: RouteExercise[];
  defaultExerciseId: string;
  attribution?: string;
  fixtureName?: string;
  sourceOverpassFixture?: unknown;
};

export type RouteRunnerMapBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type RealLondonPilotRouteType = "direct" | "checkpoint" | "multi-stop" | "one-way-awareness";

export type RealLondonPilotExerciseMetadata = {
  difficulty: RouteExerciseDifficulty;
  routeType: RealLondonPilotRouteType;
  estimatedDistanceMeters: number;
  expectedComplexity: string;
};

export type RealLondonPilotRouteExercise = RouteExercise & {
  difficulty: RouteExerciseDifficulty;
  realLondonPilotMetadata: RealLondonPilotExerciseMetadata;
};

type RealLondonPilotRouteExerciseInput = RouteExercise & {
  exerciseVersion: string;
  difficulty: RouteExerciseDifficulty;
  routeType: RealLondonPilotRouteType;
  estimatedDistanceMeters: number;
  expectedComplexity: string;
};

function buildRealLondonPilotRouteExercise(input: RealLondonPilotRouteExerciseInput): RealLondonPilotRouteExercise {
  const { routeType, estimatedDistanceMeters, expectedComplexity, ...exercise } = input;

  return {
    ...exercise,
    realLondonPilotMetadata: {
      difficulty: exercise.difficulty,
      routeType,
      estimatedDistanceMeters,
      expectedComplexity
    }
  };
}

export function getRealLondonPilotExerciseMetadata(
  exercise: RouteExercise
): RealLondonPilotExerciseMetadata | null {
  const metadata = (exercise as Partial<RealLondonPilotRouteExercise>).realLondonPilotMetadata;

  return metadata ?? null;
}

const OSM_FIXTURE_MAP_ID = "osm-tiny-london-prototype";
const MEDIUM_OSM_FIXTURE_MAP_ID = "osm-medium-london-prototype";
const REAL_LONDON_OSM_PILOT_MAP_ID = "osm-real-london-pilot";
const LARGE_LONDON_OSM_MAP_ID = "osm-large-london";
const DEFAULT_ROUTE_RUNNER_MAP_PADDING = 45;
const LARGE_OSM_ROUTE_RUNNER_PADDING_RATIO = 0.22;

type MaybeOsmRouteGraphMapDefinition = MapDefinition & {
  metadata?: {
    source?: string;
  };
};

function buildTinyLondonOsmMap(): OsmRouteGraphMapDefinition {
  const result = convertOverpassJsonToRouteMap(tinyLondonOverpassFixture, {
    mapId: OSM_FIXTURE_MAP_ID,
    name: "Tiny London OSM Prototype",
    description: "Dev-only converted Overpass fixture for route-runner rendering checks.",
    version: 1
  });

  if (!result.ok) {
    throw new Error(`Unable to build converted OSM fixture map: ${result.errors.join("; ")}`);
  }

  return result.map;
}

export const tinyLondonOsmRouteMap = buildTinyLondonOsmMap();

function buildMediumLondonOsmMap(): OsmRouteGraphMapDefinition {
  const result = convertOverpassJsonToRouteMap(mediumLondonOverpassFixture, {
    mapId: MEDIUM_OSM_FIXTURE_MAP_ID,
    name: "Medium London OSM Prototype",
    description: "Dev-only medium converted Overpass-like fixture for route-runner map-scale checks.",
    version: 1
  });

  if (!result.ok) {
    throw new Error(`Unable to build converted medium OSM fixture map: ${result.errors.join("; ")}`);
  }

  return result.map;
}

export const mediumLondonOsmRouteMap = buildMediumLondonOsmMap();

function buildRealLondonOsmPilotMap(): OsmRouteGraphMapDefinition {
  const result = convertOverpassJsonToRouteMap(realLondonPilotOverpassFixture, {
    mapId: REAL_LONDON_OSM_PILOT_MAP_ID,
    name: "OSM Real London Pilot",
    description: "Dev-only real exported London Overpass fixture for route-runner QA checks.",
    version: 1
  });

  if (!result.ok) {
    throw new Error(`Unable to build real London OSM pilot fixture map: ${result.errors.join("; ")}`);
  }

  return result.map;
}

export const realLondonOsmPilotRouteMap = buildRealLondonOsmPilotMap();

function buildLargeLondonOsmMap(): OsmRouteGraphMapDefinition {
  const result = convertOverpassJsonToRouteMap(largeLondonOverpassFixture, {
    mapId: LARGE_LONDON_OSM_MAP_ID,
    name: "OSM Large London",
    description: "Dev-only larger committed London Overpass-like fixture for route-runner QA checks.",
    version: 1
  });

  if (!result.ok) {
    throw new Error(`Unable to build large London OSM fixture map: ${result.errors.join("; ")}`);
  }

  return result.map;
}

export const largeLondonOsmRouteMap = buildLargeLondonOsmMap();

export const tinyLondonOsmRouteExercises: RouteExercise[] = [
  {
    id: "osm-tiny-kings-cross-to-argyle",
    title: "OSM prototype: King's Cross Road to Argyle Street",
    mapId: tinyLondonOsmRouteMap.id,
    difficulty: "easy",
    exerciseVersion: "1.0.0",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-1001",
        label: "King's Cross Road"
      },
      {
        type: "node",
        nodeId: "osm-node-1005",
        label: "Argyle Street"
      }
    ]
  },
  {
    id: "osm-tiny-kings-cross-via-junction",
    title: "OSM prototype: King's Cross Road via junction to Argyle Street",
    mapId: tinyLondonOsmRouteMap.id,
    difficulty: "easy",
    exerciseVersion: "1.0.0",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-1001",
        label: "King's Cross Road west"
      },
      {
        type: "node",
        nodeId: "osm-node-1003",
        label: "King's Cross Road junction"
      },
      {
        type: "node",
        nodeId: "osm-node-1005",
        label: "Argyle Street east"
      }
    ]
  },
  {
    id: "osm-tiny-roundabout-loop",
    title: "OSM prototype: roundabout checkpoint segment",
    mapId: tinyLondonOsmRouteMap.id,
    difficulty: "medium",
    exerciseVersion: "1.0.0",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-1006",
        label: "Belgrove Street"
      },
      {
        type: "node",
        nodeId: "osm-node-1007",
        label: "Roundabout north side"
      },
      {
        type: "node",
        nodeId: "osm-node-1008",
        label: "Euston Road Roundabout"
      }
    ]
  },
  {
    id: "osm-tiny-roundabout-to-argyle",
    title: "OSM prototype: roundabout to Argyle Street legal one-way route",
    mapId: tinyLondonOsmRouteMap.id,
    difficulty: "medium",
    exerciseVersion: "1.0.0",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-1008",
        label: "Euston Road Roundabout east"
      },
      {
        type: "node",
        nodeId: "osm-node-1006",
        label: "Belgrove Street approach"
      },
      {
        type: "node",
        nodeId: "osm-node-1005",
        label: "Argyle Street east"
      }
    ]
  },
  {
    id: "osm-tiny-stable-yard-lane",
    title: "OSM prototype: Stable Yard Lane",
    mapId: tinyLondonOsmRouteMap.id,
    difficulty: "easy",
    exerciseVersion: "1.0.0",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-1009",
        label: "Stable Yard west"
      },
      {
        type: "node",
        nodeId: "osm-node-1010",
        label: "Stable Yard east"
      }
    ]
  }
];

export const mediumLondonOsmRouteExercises: RouteExercise[] = [
  {
    id: "osm-medium-euston-crossing",
    title: "Medium OSM: Euston Road crossing",
    mapId: mediumLondonOsmRouteMap.id,
    difficulty: "easy",
    exerciseVersion: "1.0.0",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-5001",
        label: "Euston Road west"
      },
      {
        type: "node",
        nodeId: "osm-node-5005",
        label: "Euston Road east"
      }
    ]
  },
  {
    id: "osm-medium-tavistock-one-way",
    title: "Medium OSM: Tavistock Place one-way run",
    mapId: mediumLondonOsmRouteMap.id,
    difficulty: "easy",
    exerciseVersion: "1.0.0",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-5011",
        label: "Tavistock Place west"
      },
      {
        type: "node",
        nodeId: "osm-node-5015",
        label: "Tavistock Place east"
      }
    ]
  },
  {
    id: "osm-medium-bloomsbury-checkpoint",
    title: "Medium OSM: King's Cross to Bloomsbury via Russell Square",
    mapId: mediumLondonOsmRouteMap.id,
    difficulty: "medium",
    exerciseVersion: "1.0.0",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-5002",
        label: "King's Cross Road north"
      },
      {
        type: "node",
        nodeId: "osm-node-5023",
        label: "Russell Square gyratory"
      },
      {
        type: "node",
        nodeId: "osm-node-5044",
        label: "Store Street east"
      }
    ]
  },
  {
    id: "osm-medium-one-way-detour",
    title: "Medium OSM: one-way-aware Tavistock detour",
    mapId: mediumLondonOsmRouteMap.id,
    difficulty: "medium",
    exerciseVersion: "1.0.0",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-5015",
        label: "Tavistock Place east"
      },
      {
        type: "node",
        nodeId: "osm-node-5011",
        label: "Tavistock Place west"
      }
    ]
  },
  {
    id: "osm-medium-store-street",
    title: "Medium OSM: Store Street service route",
    mapId: mediumLondonOsmRouteMap.id,
    difficulty: "easy",
    exerciseVersion: "1.0.0",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-5041",
        label: "Store Street west"
      },
      {
        type: "node",
        nodeId: "osm-node-5045",
        label: "Store Street east"
      }
    ]
  }
];

const realLondonOsmPilotRouteExerciseDefinitions = [
  {
    id: "osm-real-pilot-short-crossing",
    title: "Goodge Street to Tottenham Court Road",
    mapId: realLondonOsmPilotRouteMap.id,
    description: "Start on Goodge Street west and route legally to Tottenham Court Road, respecting one-way restrictions.",
    difficulty: "easy",
    exerciseVersion: "1.0.0",
    routeType: "direct",
    estimatedDistanceMeters: 154.16,
    expectedComplexity: "Short direct A to B route with basic one-way compliance.",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-107319",
        label: "Goodge Street west"
      },
      {
        type: "node",
        nodeId: "osm-node-107320",
        label: "Tottenham Court Road"
      }
    ]
  },
  {
    id: "osm-real-pilot-one-way-detour",
    title: "Torrington Place one-way check",
    mapId: realLondonOsmPilotRouteMap.id,
    description:
      "Start at Torrington Place east and route legally to Tottenham Court Road north on the committed real London pilot graph.",
    difficulty: "medium",
    exerciseVersion: "1.0.0",
    routeType: "one-way-awareness",
    estimatedDistanceMeters: 209.11,
    expectedComplexity: "One-way-aware A to B route that must follow the legal Torrington Place direction.",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-108034",
        label: "Torrington Place east"
      },
      {
        type: "node",
        nodeId: "osm-node-108044",
        label: "Tottenham Court Road north"
      }
    ]
  },
  {
    id: "osm-real-pilot-checkpoint-route",
    title: "Huntley Street via Chenies Street",
    mapId: realLondonOsmPilotRouteMap.id,
    description:
      "Start on Huntley Street south, pass the Chenies Street checkpoint, then finish at Ridgmount Gardens.",
    difficulty: "medium",
    exerciseVersion: "1.0.0",
    routeType: "checkpoint",
    estimatedDistanceMeters: 181.27,
    expectedComplexity: "Checkpoint route that verifies Huntley Street to Chenies Street before Ridgmount Gardens.",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-14725979",
        label: "Huntley Street south"
      },
      {
        type: "node",
        nodeId: "osm-node-108025",
        label: "Chenies Street checkpoint"
      },
      {
        type: "node",
        nodeId: "osm-node-108030",
        label: "Ridgmount Gardens"
      }
    ]
  },
  {
    id: "osm-real-pilot-longer-route",
    title: "Goodge Street to Byng Place",
    mapId: realLondonOsmPilotRouteMap.id,
    description: "Start on Goodge Street west and route legally to Byng Place.",
    difficulty: "hard",
    exerciseVersion: "1.0.0",
    routeType: "direct",
    estimatedDistanceMeters: 660.84,
    expectedComplexity: "Long A to B route with a legal path much longer than the visual straight-line trip.",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-107319",
        label: "Goodge Street west"
      },
      {
        type: "node",
        nodeId: "osm-node-273194",
        label: "Byng Place"
      }
    ]
  },
  {
    id: "osm-real-pilot-turn-choice",
    title: "Whitfield Street to Goodge Street",
    mapId: realLondonOsmPilotRouteMap.id,
    description: "Start on Whitfield Street and route legally to Goodge Street at Tottenham Court Road.",
    difficulty: "medium",
    exerciseVersion: "1.0.0",
    routeType: "direct",
    estimatedDistanceMeters: 159.33,
    expectedComplexity: "Medium A to B route with turn choice around Whitfield Street and Goodge Street.",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-9791489",
        label: "Whitfield Street"
      },
      {
        type: "node",
        nodeId: "osm-node-107320",
        label: "Goodge Street at Tottenham Court Road"
      }
    ]
  },
  {
    id: "osm-real-pilot-store-street-short-hop",
    title: "Store Street short hop",
    mapId: realLondonOsmPilotRouteMap.id,
    description: "Start at Store Street east and route legally to Store Street west through the short one-way connector.",
    difficulty: "easy",
    exerciseVersion: "1.0.0",
    routeType: "direct",
    estimatedDistanceMeters: 21.48,
    expectedComplexity: "Very short A to B route across the Store Street connector.",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-25472045",
        label: "Store Street east"
      },
      {
        type: "node",
        nodeId: "osm-node-333670394",
        label: "Store Street west"
      }
    ]
  },
  {
    id: "osm-real-pilot-gower-to-torrington",
    title: "Gower Street to Torrington Place",
    mapId: realLondonOsmPilotRouteMap.id,
    description: "Start on Gower Street south and route legally to Torrington Place east.",
    difficulty: "medium",
    exerciseVersion: "1.0.0",
    routeType: "direct",
    estimatedDistanceMeters: 142.74,
    expectedComplexity: "Medium A to B route from Gower Street into the Torrington Place approach.",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-108033",
        label: "Gower Street south"
      },
      {
        type: "node",
        nodeId: "osm-node-108034",
        label: "Torrington Place east"
      }
    ]
  },
  {
    id: "osm-real-pilot-goodge-chenies-ridgmount",
    title: "Goodge Street via Chenies Street",
    mapId: realLondonOsmPilotRouteMap.id,
    description: "Start on Goodge Street west, pass the Chenies Street checkpoint, then finish at Ridgmount Gardens.",
    difficulty: "medium",
    exerciseVersion: "1.0.0",
    routeType: "checkpoint",
    estimatedDistanceMeters: 346.79,
    expectedComplexity: "A to B to C checkpoint route linking Goodge Street, Chenies Street, and Ridgmount Gardens.",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-107319",
        label: "Goodge Street west"
      },
      {
        type: "node",
        nodeId: "osm-node-108025",
        label: "Chenies Street checkpoint"
      },
      {
        type: "node",
        nodeId: "osm-node-108030",
        label: "Ridgmount Gardens"
      }
    ]
  },
  {
    id: "osm-real-pilot-torrington-byng",
    title: "Torrington Place to Byng Place",
    mapId: realLondonOsmPilotRouteMap.id,
    description: "Start on Torrington Place and route legally to Byng Place.",
    difficulty: "easy",
    exerciseVersion: "1.0.0",
    routeType: "direct",
    estimatedDistanceMeters: 49.89,
    expectedComplexity: "Short A to B route from Torrington Place into Byng Place.",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-108006",
        label: "Torrington Place"
      },
      {
        type: "node",
        nodeId: "osm-node-273194",
        label: "Byng Place"
      }
    ]
  },
  {
    id: "osm-real-pilot-south-crescent-ridgmount-multistop",
    title: "South Crescent to Ridgmount Gardens",
    mapId: realLondonOsmPilotRouteMap.id,
    description: "Start at Store Street, pass South Crescent and Ridgmount Street, then finish at Ridgmount Gardens.",
    difficulty: "hard",
    exerciseVersion: "1.0.0",
    routeType: "multi-stop",
    estimatedDistanceMeters: 294.06,
    expectedComplexity: "A to B to C to D multi-stop route through South Crescent and Ridgmount Street.",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-25472045",
        label: "Store Street"
      },
      {
        type: "node",
        nodeId: "osm-node-25472056",
        label: "South Crescent"
      },
      {
        type: "node",
        nodeId: "osm-node-10845640242",
        label: "Ridgmount Street"
      },
      {
        type: "node",
        nodeId: "osm-node-108030",
        label: "Ridgmount Gardens"
      }
    ]
  },
  {
    id: "osm-real-pilot-tottenham-to-gower-detour",
    title: "Tottenham Court Road to Gower Street",
    mapId: realLondonOsmPilotRouteMap.id,
    description: "Start on Tottenham Court Road north and route legally to Gower Street south via the one-way detour.",
    difficulty: "hard",
    exerciseVersion: "1.0.0",
    routeType: "one-way-awareness",
    estimatedDistanceMeters: 362.61,
    expectedComplexity: "One-way detour route where the legal path is longer than the visually obvious connection.",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-108044",
        label: "Tottenham Court Road north"
      },
      {
        type: "node",
        nodeId: "osm-node-108033",
        label: "Gower Street south"
      }
    ]
  },
  {
    id: "osm-real-pilot-torrington-reverse-loop",
    title: "Tottenham Court Road to Torrington Place",
    mapId: realLondonOsmPilotRouteMap.id,
    description: "Start at Tottenham Court Road north and reach Torrington Place east without reversing one-way segments.",
    difficulty: "hard",
    exerciseVersion: "1.0.0",
    routeType: "one-way-awareness",
    estimatedDistanceMeters: 505.35,
    expectedComplexity: "Hard reverse-direction route that proves one-way awareness with a longer legal loop.",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-108044",
        label: "Tottenham Court Road north"
      },
      {
        type: "node",
        nodeId: "osm-node-108034",
        label: "Torrington Place east"
      }
    ]
  },
  {
    id: "osm-real-pilot-mortimer-goodge-options",
    title: "Mortimer Market to Goodge Street",
    mapId: realLondonOsmPilotRouteMap.id,
    description:
      "Start at Mortimer Market and route legally to Goodge Street at Tottenham Court Road, where several connected streets make plausible route choices.",
    difficulty: "hard",
    exerciseVersion: "1.0.0",
    routeType: "direct",
    estimatedDistanceMeters: 512.86,
    expectedComplexity: "Long A to B route with multiple plausible legal street choices before Goodge Street.",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-1046362979",
        label: "Mortimer Market"
      },
      {
        type: "node",
        nodeId: "osm-node-107320",
        label: "Goodge Street at Tottenham Court Road"
      }
    ]
  }
] satisfies RealLondonPilotRouteExerciseInput[];

export const realLondonOsmPilotRouteExercises: RealLondonPilotRouteExercise[] =
  realLondonOsmPilotRouteExerciseDefinitions.map(buildRealLondonPilotRouteExercise);

export const largeLondonOsmRouteExercises: RouteExercise[] = [
  {
    id: "osm-large-main-crossing",
    title: "Large OSM: Euston Road main crossing",
    mapId: largeLondonOsmRouteMap.id,
    difficulty: "easy",
    exerciseVersion: "1.0.0",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-10000",
        label: "Euston Road west"
      },
      {
        type: "node",
        nodeId: "osm-node-10006",
        label: "Euston Road east"
      }
    ]
  },
  {
    id: "osm-large-one-way-detour",
    title: "Large OSM: one-way Tavistock detour",
    mapId: largeLondonOsmRouteMap.id,
    difficulty: "medium",
    exerciseVersion: "1.0.0",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-10026",
        label: "Tavistock Place east"
      },
      {
        type: "node",
        nodeId: "osm-node-10020",
        label: "Tavistock Place west"
      }
    ]
  },
  {
    id: "osm-large-checkpoint-route",
    title: "Large OSM: Euston to Store Street via Russell Square",
    mapId: largeLondonOsmRouteMap.id,
    difficulty: "medium",
    exerciseVersion: "1.0.0",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-10001",
        label: "Euston Road and Woburn Place"
      },
      {
        type: "node",
        nodeId: "osm-node-10044",
        label: "Russell Square east"
      },
      {
        type: "node",
        nodeId: "osm-node-10066",
        label: "Store Street east"
      }
    ]
  },
  {
    id: "osm-large-service-road",
    title: "Large OSM: Store Street service route",
    mapId: largeLondonOsmRouteMap.id,
    difficulty: "easy",
    exerciseVersion: "1.0.0",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-10060",
        label: "Store Street west"
      },
      {
        type: "node",
        nodeId: "osm-node-10066",
        label: "Store Street east"
      }
    ]
  },
  {
    id: "osm-large-long-route",
    title: "Large OSM: Oxford Street to Euston Road",
    mapId: largeLondonOsmRouteMap.id,
    difficulty: "hard",
    exerciseVersion: "1.0.0",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-10080",
        label: "Oxford Street west"
      },
      {
        type: "node",
        nodeId: "osm-node-10006",
        label: "Euston Road east"
      }
    ]
  }
];

export const DEFAULT_ROUTE_RUNNER_MAP_ID = marloweDistrictMap.id;

export const ROUTE_RUNNER_MAP_OPTIONS: RouteRunnerMapOption[] = [
  {
    id: marloweDistrictMap.id,
    label: "Marlowe District synthetic map",
    description: "Default fictional TOPOPASS practice map.",
    source: "synthetic-dev",
    map: marloweDistrictMap,
    exercises: marloweDistrictRouteExercises,
    defaultExerciseId: marloweDistrictRouteExercises[0]?.id ?? ""
  },
  {
    id: tinyLondonOsmRouteMap.id,
    label: "Converted OSM fixture",
    description: "Tiny London-like Overpass extract converted into the TOPOPASS route graph shape.",
    source: "converted-osm",
    map: tinyLondonOsmRouteMap,
    exercises: tinyLondonOsmRouteExercises,
    defaultExerciseId: tinyLondonOsmRouteExercises[0]?.id ?? "",
    attribution: "OpenStreetMap contributors",
    fixtureName: "tinyLondonOverpass.json",
    sourceOverpassFixture: tinyLondonOverpassFixture
  },
  {
    id: mediumLondonOsmRouteMap.id,
    label: "Medium converted OSM fixture",
    description: "Medium London-like Overpass extract converted into the TOPOPASS route graph shape.",
    source: "converted-osm",
    map: mediumLondonOsmRouteMap,
    exercises: mediumLondonOsmRouteExercises,
    defaultExerciseId: mediumLondonOsmRouteExercises[0]?.id ?? "",
    attribution: "OpenStreetMap contributors",
    fixtureName: "mediumLondonOverpass.json",
    sourceOverpassFixture: mediumLondonOverpassFixture
  },
  {
    id: realLondonOsmPilotRouteMap.id,
    label: "OSM Real London Pilot",
    description: "Real exported London Overpass JSON fixture converted into the TOPOPASS route graph.",
    source: "converted-osm",
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises,
    defaultExerciseId: realLondonOsmPilotRouteExercises[0]?.id ?? "",
    attribution: "OpenStreetMap contributors",
    fixtureName: "realLondonPilotOverpass.json",
    sourceOverpassFixture: realLondonPilotOverpassFixture
  },
  {
    id: largeLondonOsmRouteMap.id,
    label: "OSM Large London",
    description: "Larger committed London-like Overpass extract converted into the TOPOPASS route graph shape.",
    source: "converted-osm",
    map: largeLondonOsmRouteMap,
    exercises: largeLondonOsmRouteExercises,
    defaultExerciseId: largeLondonOsmRouteExercises[0]?.id ?? "",
    attribution: "OpenStreetMap contributors",
    fixtureName: "largeLondonOverpass.json",
    sourceOverpassFixture: largeLondonOverpassFixture
  }
];

export function getRouteRunnerMapOption(mapId: string): RouteRunnerMapOption | undefined {
  return ROUTE_RUNNER_MAP_OPTIONS.find((option) => option.id === mapId);
}

export function isConvertedOsmRouteRunnerMap(option: RouteRunnerMapOption): boolean {
  return option.source === "converted-osm";
}

export function isConvertedOsmRouteRunnerMapDefinition(map: MapDefinition): boolean {
  return (map as MaybeOsmRouteGraphMapDefinition).metadata?.source === "osm";
}

export function getRouteRunnerMapBounds(map: MapDefinition): RouteRunnerMapBounds {
  if (map.nodes.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0
    };
  }

  return map.nodes.reduce(
    (bounds, node) => ({
      minX: Math.min(bounds.minX, node.x),
      minY: Math.min(bounds.minY, node.y),
      maxX: Math.max(bounds.maxX, node.x),
      maxY: Math.max(bounds.maxY, node.y)
    }),
    {
      minX: map.nodes[0].x,
      minY: map.nodes[0].y,
      maxX: map.nodes[0].x,
      maxY: map.nodes[0].y
    }
  );
}

export function getRouteRunnerMapFitPadding(map: MapDefinition): number {
  if (
    map.id !== MEDIUM_OSM_FIXTURE_MAP_ID &&
    map.id !== REAL_LONDON_OSM_PILOT_MAP_ID &&
    map.id !== LARGE_LONDON_OSM_MAP_ID
  ) {
    return DEFAULT_ROUTE_RUNNER_MAP_PADDING;
  }

  const bounds = getRouteRunnerMapBounds(map);
  const width = Math.max(0, bounds.maxX - bounds.minX);
  const height = Math.max(0, bounds.maxY - bounds.minY);

  return Math.max(DEFAULT_ROUTE_RUNNER_MAP_PADDING, Math.max(width, height) * LARGE_OSM_ROUTE_RUNNER_PADDING_RATIO);
}

export function getRouteRunnerMapFitBounds(map: MapDefinition): RouteRunnerMapBounds {
  const bounds = getRouteRunnerMapBounds(map);
  const padding = getRouteRunnerMapFitPadding(map);

  return {
    minX: bounds.minX - padding,
    minY: bounds.minY - padding,
    maxX: bounds.maxX + padding,
    maxY: bounds.maxY + padding
  };
}

function routeRunnerBoundsWidth(bounds: RouteRunnerMapBounds): number {
  return bounds.maxX - bounds.minX;
}

function routeRunnerBoundsHeight(bounds: RouteRunnerMapBounds): number {
  return bounds.maxY - bounds.minY;
}

export function fitRouteRunnerMapBoundsToViewport(
  bounds: RouteRunnerMapBounds,
  viewportWidth: number,
  viewportHeight: number
): RouteRunnerMapBounds {
  const width = routeRunnerBoundsWidth(bounds);
  const height = routeRunnerBoundsHeight(bounds);

  if (width <= 0 || height <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
    return { ...bounds };
  }

  const targetAspectRatio = viewportWidth / viewportHeight;
  const boundsAspectRatio = width / height;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  if (boundsAspectRatio < targetAspectRatio) {
    const fittedWidth = height * targetAspectRatio;
    const halfWidth = fittedWidth / 2;

    return {
      minX: centerX - halfWidth,
      minY: bounds.minY,
      maxX: centerX + halfWidth,
      maxY: bounds.maxY
    };
  }

  const fittedHeight = width / targetAspectRatio;
  const halfHeight = fittedHeight / 2;

  return {
    minX: bounds.minX,
    minY: centerY - halfHeight,
    maxX: bounds.maxX,
    maxY: centerY + halfHeight
  };
}

export function getRouteRunnerMapViewportBounds(
  map: MapDefinition,
  viewportWidth: number,
  viewportHeight: number
): RouteRunnerMapBounds {
  const fitBounds = getRouteRunnerMapFitBounds(map);

  if (!isConvertedOsmRouteRunnerMapDefinition(map)) {
    return fitBounds;
  }

  return fitRouteRunnerMapBoundsToViewport(fitBounds, viewportWidth, viewportHeight);
}

export function routeRunnerMapCenter(map: MapDefinition): Vec2 {
  const bounds = getRouteRunnerMapBounds(map);

  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2
  };
}
