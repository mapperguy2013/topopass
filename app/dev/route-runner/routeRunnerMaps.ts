import {
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  type MapDefinition,
  type RouteExercise,
  type Vec2
} from "../../../lib/map-engine/index.ts";
import { convertOverpassJsonToRouteMap, type OsmRouteGraphMapDefinition } from "../../../lib/map-engine/osm/index.ts";
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
};

export type RouteRunnerMapBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

const OSM_FIXTURE_MAP_ID = "osm-tiny-london-prototype";

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
    attribution: "OpenStreetMap contributors"
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

export function routeRunnerMapCenter(map: MapDefinition): Vec2 {
  const bounds = getRouteRunnerMapBounds(map);

  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2
  };
}
