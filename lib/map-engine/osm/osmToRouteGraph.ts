import type { MapDefinition, MapNode, MapRestriction, MapRoad } from "../types.ts";
import { validateMapDefinition } from "../validation.ts";
import { parseOverpassRoadExtract } from "./overpassImport.ts";
import type {
  ImportedOsmRoad,
  ImportedOsmRoadCoordinate,
  ImportedOsmRoadDirection,
  OverpassElementId,
  OverpassRoadImportResult,
  OverpassTags
} from "./overpassImport.ts";
import {
  createOsmLocalProjection,
  measureOsmCoordinateDistanceMeters,
  projectOsmCoordinateToLocalMeters
} from "./osmProjection.ts";
import type { OsmLocalProjection } from "./osmProjection.ts";
import { shouldIncludeOsmRoadForRouteGraph } from "./osmRoadFilters.ts";
import type { OsmRoadFilterOptions, OsmRouteGraphHighway } from "./osmRoadFilters.ts";

export type OsmRouteGraphNodeMetadata = {
  source: "osm";
  osmNodeId: OverpassElementId;
  lat: number;
  lon: number;
};

export type OsmRouteGraphRoadMetadata = {
  source: "osm";
  osmWayId: OverpassElementId;
  highway: OsmRouteGraphHighway;
  originalDirection: ImportedOsmRoadDirection;
  segmentIndex: number;
  fromOsmNodeId: OverpassElementId;
  toOsmNodeId: OverpassElementId;
  rawTags: OverpassTags;
};

export type OsmRouteGraphNode = MapNode & {
  metadata: OsmRouteGraphNodeMetadata;
};

export type OsmRouteGraphRoad = MapRoad & {
  metadata: OsmRouteGraphRoadMetadata;
};

export type OsmRouteGraphMetadata = {
  source: "osm";
  projection: OsmLocalProjection;
  blockedOsmWayIds: OverpassElementId[];
  ignoredRelationIds: OverpassElementId[];
  sourceRoadCount: number;
  convertedRoadSegmentCount: number;
};

export type OsmRouteGraphMapDefinition = MapDefinition & {
  metadata: OsmRouteGraphMetadata;
  nodes: OsmRouteGraphNode[];
  roads: OsmRouteGraphRoad[];
};

export type OsmRouteGraphConversionWarningCode =
  | "blocked_way_excluded"
  | "duplicate_node_coordinate"
  | "filtered_highway"
  | "missing_coordinate"
  | "skipped_zero_length_segment";

export type OsmRouteGraphConversionWarning = {
  code: OsmRouteGraphConversionWarningCode;
  message: string;
  osmWayId?: OverpassElementId;
  osmNodeId?: OverpassElementId;
  highway?: string;
};

export type ConvertImportedOsmToRouteMapOptions = OsmRoadFilterOptions & {
  mapId?: string;
  name?: string;
  description?: string;
  mapVersion?: string;
  version?: number;
};

export type OsmRouteGraphConversionResult =
  | {
      ok: true;
      map: OsmRouteGraphMapDefinition;
      warnings: OsmRouteGraphConversionWarning[];
    }
  | {
      ok: false;
      errors: string[];
      warnings: OsmRouteGraphConversionWarning[];
      projection?: OsmLocalProjection;
    };

type NodeBuildState = {
  coordinate: ImportedOsmRoadCoordinate;
  projected: { x: number; y: number };
};

const DEFAULT_MAP_ID = "osm-prototype-route-map";
const DEFAULT_MAP_NAME = "OSM Prototype Route Map";
const COORDINATE_EPSILON = 0.0000001;

function nodeId(osmNodeId: OverpassElementId): string {
  return `osm-node-${osmNodeId}`;
}

function roadSegmentId(osmWayId: OverpassElementId, segmentIndex: number): string {
  return `osm-way-${osmWayId}-segment-${segmentIndex}`;
}

function blockedByVehicleAccess(tags: OverpassTags): boolean {
  return ["access", "motor_vehicle", "vehicle"].some((key) => tags[key]?.trim().toLowerCase() === "no");
}

function sameCoordinate(left: ImportedOsmRoadCoordinate, right: ImportedOsmRoadCoordinate): boolean {
  return Math.abs(left.lat - right.lat) <= COORDINATE_EPSILON && Math.abs(left.lon - right.lon) <= COORDINATE_EPSILON;
}

function coordinatesFromRoads(roads: readonly ImportedOsmRoad[]): ImportedOsmRoadCoordinate[] {
  return roads.flatMap((road) => road.coordinates);
}

function roadEndpointCoordinates(
  road: ImportedOsmRoad,
  segmentIndex: number
): [ImportedOsmRoadCoordinate, ImportedOsmRoadCoordinate] | null {
  const current = road.coordinates[segmentIndex];
  const next = road.coordinates[segmentIndex + 1];

  if (!current || !next) {
    return null;
  }

  return road.direction === "reverse" ? [next, current] : [current, next];
}

function segmentDistanceMeters(
  fromCoordinate: ImportedOsmRoadCoordinate,
  toCoordinate: ImportedOsmRoadCoordinate,
  projection: OsmLocalProjection
): number {
  return measureOsmCoordinateDistanceMeters(fromCoordinate, toCoordinate, projection);
}

function routeGraphRestrictionForBlockedRoad(road: OsmRouteGraphRoad): MapRestriction {
  return {
    id: `${road.id}-closed`,
    type: "road_closed",
    roadId: road.id,
    reason: "Blocked by imported OSM access tags"
  };
}

function isImportedOsmRoadArray(
  input: OverpassRoadImportResult | readonly ImportedOsmRoad[]
): input is readonly ImportedOsmRoad[] {
  return Array.isArray(input);
}

function importedRoadsFromInput(input: OverpassRoadImportResult | readonly ImportedOsmRoad[]): {
  roads: ImportedOsmRoad[];
  blockedOsmWayIds: OverpassElementId[];
  ignoredRelationIds: OverpassElementId[];
} {
  if (isImportedOsmRoadArray(input)) {
    return {
      roads: [...input],
      blockedOsmWayIds: [],
      ignoredRelationIds: []
    };
  }

  return {
    roads: [...input.roads],
    blockedOsmWayIds: input.excludedWays
      .filter((way) => way.reason === "blocked_access")
      .map((way) => way.osmWayId)
      .sort((left, right) => left - right),
    ignoredRelationIds: [...input.ignoredRelationIds]
  };
}

function buildRouteGraphNodes(input: {
  roads: readonly ImportedOsmRoad[];
  projection: OsmLocalProjection;
  warnings: OsmRouteGraphConversionWarning[];
  errors: string[];
}): OsmRouteGraphNode[] {
  const nodesByOsmId = new Map<OverpassElementId, NodeBuildState>();

  for (const road of input.roads) {
    for (const coordinate of road.coordinates) {
      const existing = nodesByOsmId.get(coordinate.osmNodeId);

      if (existing && !sameCoordinate(existing.coordinate, coordinate)) {
        input.errors.push(
          `OSM node ${coordinate.osmNodeId} has conflicting coordinates in imported road ${road.osmWayId}.`
        );
        input.warnings.push({
          code: "duplicate_node_coordinate",
          message: `OSM node ${coordinate.osmNodeId} has conflicting imported coordinates.`,
          osmWayId: road.osmWayId,
          osmNodeId: coordinate.osmNodeId
        });
        continue;
      }

      if (!existing) {
        nodesByOsmId.set(coordinate.osmNodeId, {
          coordinate,
          projected: projectOsmCoordinateToLocalMeters(coordinate, input.projection)
        });
      }
    }
  }

  return [...nodesByOsmId.entries()]
    .sort(([leftId], [rightId]) => leftId - rightId)
    .map(([osmNodeId, state]) => ({
      id: nodeId(osmNodeId),
      x: state.projected.x,
      y: state.projected.y,
      label: `OSM node ${osmNodeId}`,
      metadata: {
        source: "osm",
        osmNodeId,
        lat: state.coordinate.lat,
        lon: state.coordinate.lon
      }
    }));
}

function buildRouteGraphRoads(input: {
  roads: readonly ImportedOsmRoad[];
  projection: OsmLocalProjection;
  warnings: OsmRouteGraphConversionWarning[];
}): { roads: OsmRouteGraphRoad[]; restrictions: MapRestriction[] } {
  const roads: OsmRouteGraphRoad[] = [];
  const restrictions: MapRestriction[] = [];

  for (const importedRoad of input.roads) {
    for (let segmentIndex = 0; segmentIndex < importedRoad.coordinates.length - 1; segmentIndex += 1) {
      const endpoints = roadEndpointCoordinates(importedRoad, segmentIndex);

      if (!endpoints) {
        input.warnings.push({
          code: "missing_coordinate",
          message: `OSM way ${importedRoad.osmWayId} segment ${segmentIndex} is missing coordinates.`,
          osmWayId: importedRoad.osmWayId
        });
        continue;
      }

      const [fromCoordinate, toCoordinate] = endpoints;
      const distanceMeters = segmentDistanceMeters(fromCoordinate, toCoordinate, input.projection);

      if (fromCoordinate.osmNodeId === toCoordinate.osmNodeId || distanceMeters <= 0) {
        input.warnings.push({
          code: "skipped_zero_length_segment",
          message: `OSM way ${importedRoad.osmWayId} segment ${segmentIndex} has no usable distance.`,
          osmWayId: importedRoad.osmWayId,
          osmNodeId: fromCoordinate.osmNodeId
        });
        continue;
      }

      const road: OsmRouteGraphRoad = {
        id: roadSegmentId(importedRoad.osmWayId, segmentIndex),
        fromNodeId: nodeId(fromCoordinate.osmNodeId),
        toNodeId: nodeId(toCoordinate.osmNodeId),
        distanceMeters,
        isOneWay: importedRoad.oneWay,
        name: importedRoad.name,
        metadata: {
          source: "osm",
          osmWayId: importedRoad.osmWayId,
          highway: importedRoad.highway as OsmRouteGraphHighway,
          originalDirection: importedRoad.direction,
          segmentIndex,
          fromOsmNodeId: fromCoordinate.osmNodeId,
          toOsmNodeId: toCoordinate.osmNodeId,
          rawTags: { ...importedRoad.rawTags }
        }
      };

      roads.push(road);

      if (blockedByVehicleAccess(importedRoad.rawTags)) {
        restrictions.push(routeGraphRestrictionForBlockedRoad(road));
      }
    }
  }

  return {
    roads,
    restrictions
  };
}

export function convertImportedOsmToRouteMap(
  input: OverpassRoadImportResult | readonly ImportedOsmRoad[],
  options: ConvertImportedOsmToRouteMapOptions = {}
): OsmRouteGraphConversionResult {
  const imported = importedRoadsFromInput(input);
  const warnings: OsmRouteGraphConversionWarning[] = imported.blockedOsmWayIds.map((osmWayId) => ({
    code: "blocked_way_excluded",
    message: `OSM way ${osmWayId} was excluded because vehicle access is blocked.`,
    osmWayId
  }));
  const errors: string[] = [];
  const filteredRoads = imported.roads
    .slice()
    .sort((left, right) => left.osmWayId - right.osmWayId)
    .filter((road) => {
      const decision = shouldIncludeOsmRoadForRouteGraph(road, options);

      if (decision.include) {
        return true;
      }

      warnings.push({
        code: "filtered_highway",
        message: `OSM way ${road.osmWayId} was filtered out: ${decision.reason}.`,
        osmWayId: road.osmWayId,
        highway: decision.highway
      });
      return false;
    });
  const projection = createOsmLocalProjection(coordinatesFromRoads(filteredRoads));

  if (!projection) {
    return {
      ok: false,
      errors: ["OSM route graph conversion requires at least one valid road coordinate."],
      warnings
    };
  }

  const nodes = buildRouteGraphNodes({
    roads: filteredRoads,
    projection,
    warnings,
    errors
  });
  const { roads, restrictions } = buildRouteGraphRoads({
    roads: filteredRoads,
    projection,
    warnings
  });

  if (roads.length === 0) {
    return {
      ok: false,
      errors: ["OSM route graph conversion produced no routable road segments."],
      warnings,
      projection
    };
  }

  const map: OsmRouteGraphMapDefinition = {
    id: options.mapId ?? DEFAULT_MAP_ID,
    name: options.name ?? DEFAULT_MAP_NAME,
    mapVersion: options.mapVersion ?? "1.0.0",
    version: options.version,
    description: options.description,
    nodes,
    roads,
    restrictions,
    landmarks: [],
    metadata: {
      source: "osm",
      projection,
      blockedOsmWayIds: imported.blockedOsmWayIds,
      ignoredRelationIds: imported.ignoredRelationIds,
      sourceRoadCount: filteredRoads.length,
      convertedRoadSegmentCount: roads.length
    }
  };
  const validation = validateMapDefinition(map);

  if (!validation.valid || errors.length > 0) {
    return {
      ok: false,
      errors: [...errors, ...validation.errors],
      warnings,
      projection
    };
  }

  return {
    ok: true,
    map,
    warnings
  };
}

export function convertOverpassJsonToRouteMap(
  input: unknown,
  options: ConvertImportedOsmToRouteMapOptions = {}
): OsmRouteGraphConversionResult {
  return convertImportedOsmToRouteMap(parseOverpassRoadExtract(input), options);
}
