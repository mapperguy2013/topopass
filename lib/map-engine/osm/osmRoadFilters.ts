import type { ImportedOsmRoad } from "./overpassImport.ts";

export type OsmRouteGraphHighway =
  | "primary"
  | "primary_link"
  | "secondary"
  | "secondary_link"
  | "tertiary"
  | "tertiary_link"
  | "residential"
  | "unclassified"
  | "living_street"
  | "service"
  | "road";

export type OsmRouteGraphExcludedHighway =
  | "footway"
  | "cycleway"
  | "path"
  | "steps"
  | "pedestrian"
  | "construction"
  | "proposed"
  | "platform";

export type OsmRoadFilterOptions = {
  includedHighways?: readonly string[];
  excludedHighways?: readonly string[];
  includeUnnamedRoads?: boolean;
};

export type OsmRoadFilterDecision =
  | {
      include: true;
      highway: OsmRouteGraphHighway;
    }
  | {
      include: false;
      reason: "excluded_highway" | "missing_highway" | "unsupported_highway" | "unnamed_road";
      highway?: string;
    };

export const DEFAULT_OSM_ROUTE_GRAPH_HIGHWAYS: readonly OsmRouteGraphHighway[] = [
  "primary",
  "primary_link",
  "secondary",
  "secondary_link",
  "tertiary",
  "tertiary_link",
  "residential",
  "unclassified",
  "living_street",
  "service",
  "road"
];

export const DEFAULT_OSM_ROUTE_GRAPH_EXCLUDED_HIGHWAYS: readonly OsmRouteGraphExcludedHighway[] = [
  "footway",
  "cycleway",
  "path",
  "steps",
  "pedestrian",
  "construction",
  "proposed",
  "platform"
];

function normaliseHighway(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function shouldIncludeOsmRoadForRouteGraph(
  road: Pick<ImportedOsmRoad, "highway" | "name">,
  options: OsmRoadFilterOptions = {}
): OsmRoadFilterDecision {
  const highway = normaliseHighway(road.highway);
  const includedHighways = new Set(options.includedHighways ?? DEFAULT_OSM_ROUTE_GRAPH_HIGHWAYS);
  const excludedHighways = new Set(options.excludedHighways ?? DEFAULT_OSM_ROUTE_GRAPH_EXCLUDED_HIGHWAYS);

  if (!highway) {
    return {
      include: false,
      reason: "missing_highway"
    };
  }

  if (excludedHighways.has(highway)) {
    return {
      include: false,
      reason: "excluded_highway",
      highway
    };
  }

  if (!includedHighways.has(highway)) {
    return {
      include: false,
      reason: "unsupported_highway",
      highway
    };
  }

  if (options.includeUnnamedRoads === false && !road.name?.trim()) {
    return {
      include: false,
      reason: "unnamed_road",
      highway
    };
  }

  return {
    include: true,
    highway: highway as OsmRouteGraphHighway
  };
}
