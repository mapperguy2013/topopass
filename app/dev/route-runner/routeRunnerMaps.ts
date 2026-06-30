import {
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  type MapDefinition,
  type RouteExercise,
  type Vec2
} from "../../../lib/map-engine/index.ts";
import { convertOverpassJsonToRouteMap, type OsmRouteGraphMapDefinition } from "../../../lib/map-engine/osm/index.ts";
import mediumLondonOverpassFixture from "../../../lib/map-engine/osm/fixtures/mediumLondonOverpass.json" with { type: "json" };
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
};

export type RouteRunnerMapBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

const OSM_FIXTURE_MAP_ID = "osm-tiny-london-prototype";
const MEDIUM_OSM_FIXTURE_MAP_ID = "osm-medium-london-prototype";
const DEFAULT_ROUTE_RUNNER_MAP_PADDING = 45;
const MEDIUM_OSM_ROUTE_RUNNER_PADDING_RATIO = 0.22;

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

export const tinyLondonOsmRouteExercises: RouteExercise[] = [
  {
    id: "osm-tiny-kings-cross-to-argyle",
    title: "OSM prototype: King's Cross Road to Argyle Street",
    mapId: tinyLondonOsmRouteMap.id,
    difficulty: "easy",
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
    fixtureName: "tinyLondonOverpass.json"
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
    fixtureName: "mediumLondonOverpass.json"
  }
];

export function getRouteRunnerMapOption(mapId: string): RouteRunnerMapOption | undefined {
  return ROUTE_RUNNER_MAP_OPTIONS.find((option) => option.id === mapId);
}

export function isConvertedOsmRouteRunnerMap(option: RouteRunnerMapOption): boolean {
  return option.source === "converted-osm";
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
  if (map.id !== MEDIUM_OSM_FIXTURE_MAP_ID) {
    return DEFAULT_ROUTE_RUNNER_MAP_PADDING;
  }

  const bounds = getRouteRunnerMapBounds(map);
  const width = Math.max(0, bounds.maxX - bounds.minX);
  const height = Math.max(0, bounds.maxY - bounds.minY);

  return Math.max(DEFAULT_ROUTE_RUNNER_MAP_PADDING, Math.max(width, height) * MEDIUM_OSM_ROUTE_RUNNER_PADDING_RATIO);
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

export function routeRunnerMapCenter(map: MapDefinition): Vec2 {
  const bounds = getRouteRunnerMapBounds(map);

  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2
  };
}
