export type OverpassElementId = number;

export type OverpassTags = Record<string, string>;

export type OverpassNodeElement = {
  type: "node";
  id: OverpassElementId;
  lat: number;
  lon: number;
  tags?: OverpassTags;
};

export type OverpassWayElement = {
  type: "way";
  id: OverpassElementId;
  nodes: OverpassElementId[];
  tags?: OverpassTags;
};

export type OverpassRelationElement = {
  type: "relation";
  id: OverpassElementId;
  members?: unknown[];
  tags?: OverpassTags;
};

export type OverpassElement = OverpassNodeElement | OverpassWayElement | OverpassRelationElement;

export type OverpassJsonResponse = {
  version?: number;
  generator?: string;
  osm3s?: unknown;
  elements: OverpassElement[];
};

export type OsmAcceptedHighway =
  | "primary"
  | "primary_link"
  | "secondary"
  | "secondary_link"
  | "tertiary"
  | "tertiary_link"
  | "unclassified"
  | "residential"
  | "service"
  | "living_street"
  | "road";

export type ImportedOsmRoadDirection = "both" | "forward" | "reverse";

export type ImportedOsmRoadCoordinate = {
  osmNodeId: OverpassElementId;
  lat: number;
  lon: number;
};

export type ImportedOsmRoad = {
  id: string;
  source: "osm";
  osmWayId: OverpassElementId;
  name?: string;
  highway: OsmAcceptedHighway;
  oneWay: boolean;
  direction: ImportedOsmRoadDirection;
  nodeRefs: OverpassElementId[];
  coordinates: ImportedOsmRoadCoordinate[];
  rawTags: OverpassTags;
};

export type OverpassExcludedWayReason =
  | "blocked_access"
  | "ignored_non_road"
  | "missing_highway"
  | "missing_node_reference"
  | "unsupported_highway";

export type OverpassExcludedWay = {
  osmWayId: OverpassElementId;
  reason: OverpassExcludedWayReason;
  highway?: string;
  missingNodeRefs: OverpassElementId[];
  rawTags: OverpassTags;
};

export type OverpassRoadImportResult = {
  roads: ImportedOsmRoad[];
  excludedWays: OverpassExcludedWay[];
  ignoredRelationIds: OverpassElementId[];
  nodeCount: number;
};

const acceptedHighways = new Set<OsmAcceptedHighway>([
  "primary",
  "primary_link",
  "secondary",
  "secondary_link",
  "tertiary",
  "tertiary_link",
  "unclassified",
  "residential",
  "service",
  "living_street",
  "road"
]);

const unsupportedHighways = new Set([
  "motorway",
  "motorway_link",
  "trunk",
  "trunk_link"
]);

const ignoredHighways = new Set([
  "footway",
  "cycleway",
  "path",
  "pedestrian",
  "steps",
  "bridleway",
  "construction",
  "proposed"
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normaliseTagValue(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function normaliseTags(value: unknown): OverpassTags {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, rawValue]) => [key, normaliseTagValue(rawValue)] as const)
      .filter((entry): entry is readonly [string, string] => entry[1] !== null)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
  );
}

function normaliseTag(tags: OverpassTags, key: string): string {
  return (tags[key] ?? "").trim().toLowerCase();
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseElements(value: unknown): OverpassElement[] {
  if (!isRecord(value) || !Array.isArray(value.elements)) {
    return [];
  }

  return value.elements.flatMap((element): OverpassElement[] => {
    if (!isRecord(element) || typeof element.type !== "string" || !isFiniteNumber(element.id)) {
      return [];
    }

    const tags = normaliseTags(element.tags);

    if (element.type === "node" && isFiniteNumber(element.lat) && isFiniteNumber(element.lon)) {
      return [
        {
          type: "node",
          id: element.id,
          lat: element.lat,
          lon: element.lon,
          tags
        }
      ];
    }

    if (element.type === "way" && Array.isArray(element.nodes)) {
      const nodeRefs = element.nodes.filter(isFiniteNumber);

      return [
        {
          type: "way",
          id: element.id,
          nodes: nodeRefs,
          tags
        }
      ];
    }

    if (element.type === "relation") {
      return [
        {
          type: "relation",
          id: element.id,
          members: Array.isArray(element.members) ? element.members : [],
          tags
        }
      ];
    }

    return [];
  });
}

function blockedByVehicleAccess(tags: OverpassTags): boolean {
  return ["access", "motor_vehicle", "vehicle"].some((key) => normaliseTag(tags, key) === "no");
}

function wayDirection(tags: OverpassTags): ImportedOsmRoadDirection {
  const oneway = normaliseTag(tags, "oneway");

  if (oneway === "-1") {
    return "reverse";
  }

  if (oneway === "yes" || oneway === "true" || oneway === "1" || normaliseTag(tags, "junction") === "roundabout") {
    return "forward";
  }

  return "both";
}

function excludedWay(
  way: OverpassWayElement,
  reason: OverpassExcludedWayReason,
  missingNodeRefs: OverpassElementId[] = []
): OverpassExcludedWay {
  return {
    osmWayId: way.id,
    reason,
    highway: way.tags?.highway,
    missingNodeRefs: [...missingNodeRefs].sort((left, right) => left - right),
    rawTags: { ...(way.tags ?? {}) }
  };
}

function classifyWayExclusion(way: OverpassWayElement): OverpassExcludedWayReason | null {
  const tags = way.tags ?? {};
  const highway = normaliseTag(tags, "highway");

  if (!highway) {
    if (tags.railway || tags.waterway || tags.building) {
      return "ignored_non_road";
    }

    return "missing_highway";
  }

  if (ignoredHighways.has(highway)) {
    return "ignored_non_road";
  }

  if (unsupportedHighways.has(highway)) {
    return "unsupported_highway";
  }

  if (!acceptedHighways.has(highway as OsmAcceptedHighway)) {
    return "unsupported_highway";
  }

  if (blockedByVehicleAccess(tags)) {
    return "blocked_access";
  }

  return null;
}

export function parseOverpassRoadExtract(input: unknown): OverpassRoadImportResult {
  const elements = parseElements(input);
  const nodeIndex = new Map(
    elements
      .filter((element): element is OverpassNodeElement => element.type === "node")
      .map((node) => [node.id, node])
  );
  const ways = elements
    .filter((element): element is OverpassWayElement => element.type === "way")
    .sort((left, right) => left.id - right.id);
  const ignoredRelationIds = elements
    .filter((element): element is OverpassRelationElement => element.type === "relation")
    .map((relation) => relation.id)
    .sort((left, right) => left - right);
  const roads: ImportedOsmRoad[] = [];
  const excludedWays: OverpassExcludedWay[] = [];

  for (const way of ways) {
    const exclusionReason = classifyWayExclusion(way);

    if (exclusionReason) {
      excludedWays.push(excludedWay(way, exclusionReason));
      continue;
    }

    const missingNodeRefs = way.nodes.filter((nodeRef) => !nodeIndex.has(nodeRef));

    if (missingNodeRefs.length > 0 || way.nodes.length < 2) {
      excludedWays.push(excludedWay(way, "missing_node_reference", missingNodeRefs));
      continue;
    }

    const tags = way.tags ?? {};
    const highway = normaliseTag(tags, "highway") as OsmAcceptedHighway;
    const direction = wayDirection(tags);

    roads.push({
      id: `osm-way-${way.id}`,
      source: "osm",
      osmWayId: way.id,
      name: tags.name,
      highway,
      oneWay: direction !== "both",
      direction,
      nodeRefs: [...way.nodes],
      coordinates: way.nodes.map((nodeRef) => {
        const node = nodeIndex.get(nodeRef);

        if (!node) {
          throw new Error(`Internal parser error: missing node ${nodeRef} for OSM way ${way.id}`);
        }

        return {
          osmNodeId: node.id,
          lat: node.lat,
          lon: node.lon
        };
      }),
      rawTags: { ...tags }
    });
  }

  return {
    roads,
    excludedWays: excludedWays.sort((left, right) => left.osmWayId - right.osmWayId),
    ignoredRelationIds,
    nodeCount: nodeIndex.size
  };
}
