import type { MapDefinition, Vec2 } from "../../../lib/map-engine/index.ts";
import { projectOsmCoordinateToLocalMeters } from "../../../lib/map-engine/osm/index.ts";
import type {
  OsmLocalProjection,
  OverpassElementId,
  OverpassJsonResponse,
  OverpassNodeElement,
  OverpassTags,
  OverpassWayElement
} from "../../../lib/map-engine/osm/index.ts";

export type RealLondonContextFeatureKind =
  | "rail"
  | "station"
  | "bridge"
  | "crossing"
  | "landmark"
  | "park"
  | "water"
  | "pedestrian-area"
  | "area";

export type RealLondonContextFeatureBase = {
  id: string;
  kind: RealLondonContextFeatureKind;
  name?: string;
  sourceElementType: "node" | "way";
  sourceElementId: OverpassElementId;
  sourceTags?: OverpassTags;
};

export type RealLondonRailContextFeature = RealLondonContextFeatureBase & {
  kind: "rail";
  subtype: "rail" | "light_rail" | "subway";
  points: Vec2[];
};

export type RealLondonStationContextFeature = RealLondonContextFeatureBase & {
  kind: "station";
  point: Vec2;
};

export type RealLondonBridgeContextFeature = RealLondonContextFeatureBase & {
  kind: "bridge";
  subtype: "bridge" | "man_made_bridge";
  points: Vec2[];
};

export type RealLondonCrossingContextFeature = RealLondonContextFeatureBase & {
  kind: "crossing";
  point: Vec2;
};

export type RealLondonLandmarkContextFeature = RealLondonContextFeatureBase & {
  kind: "landmark";
  name: string;
  landmarkKind: "hospital" | "important-landmark" | "public-building" | "learner-reference";
  point: Vec2;
};

export type RealLondonParkContextFeature = RealLondonContextFeatureBase & {
  kind: "park";
  subtype: "park" | "garden" | "open-space";
  points: Vec2[];
};

export type RealLondonWaterContextFeature = RealLondonContextFeatureBase & {
  kind: "water";
  subtype: "basin" | "waterway";
  points: Vec2[];
};

export type RealLondonPedestrianAreaContextFeature = RealLondonContextFeatureBase & {
  kind: "pedestrian-area";
  points: Vec2[];
};

export type RealLondonAreaContextFeature = RealLondonContextFeatureBase & {
  kind: "area";
  point: Vec2;
};

export type RealLondonContextFeature =
  | RealLondonRailContextFeature
  | RealLondonStationContextFeature
  | RealLondonBridgeContextFeature
  | RealLondonCrossingContextFeature
  | RealLondonLandmarkContextFeature
  | RealLondonParkContextFeature
  | RealLondonWaterContextFeature
  | RealLondonPedestrianAreaContextFeature
  | RealLondonAreaContextFeature;

export type RealLondonContextCoverageCounts = {
  railFeatures: number;
  subwayRailFeatures: number;
  stationFeatures: number;
  namedStationFeatures: number;
  bridgeFeatures: number;
  namedBridgeFeatures: number;
  crossingFeatures: number;
  landmarkLikeFeatures: number;
  parkOpenSpaceFeatures: number;
  waterFeatures: number;
  namedWaterFeatures: number;
  areaContextLabelFeatures: number;
};

export type RealLondonContextCoverageAudit = {
  counts: RealLondonContextCoverageCounts;
  orderedCategories: Array<{ id: keyof RealLondonContextCoverageCounts; count: number }>;
};

type OverpassContext = {
  nodesById: Map<OverpassElementId, OverpassNodeElement>;
  ways: OverpassWayElement[];
};

const orderedCoverageKeys: Array<keyof RealLondonContextCoverageCounts> = [
  "railFeatures",
  "subwayRailFeatures",
  "stationFeatures",
  "namedStationFeatures",
  "bridgeFeatures",
  "namedBridgeFeatures",
  "crossingFeatures",
  "landmarkLikeFeatures",
  "parkOpenSpaceFeatures",
  "waterFeatures",
  "namedWaterFeatures",
  "areaContextLabelFeatures"
];

const contextKindOrder: Record<RealLondonContextFeatureKind, number> = {
  rail: 10,
  station: 20,
  bridge: 30,
  crossing: 40,
  landmark: 50,
  park: 60,
  water: 70,
  "pedestrian-area": 75,
  area: 80
};

function emptyCoverageCounts(): RealLondonContextCoverageCounts {
  return {
    railFeatures: 0,
    subwayRailFeatures: 0,
    stationFeatures: 0,
    namedStationFeatures: 0,
    bridgeFeatures: 0,
    namedBridgeFeatures: 0,
    crossingFeatures: 0,
    landmarkLikeFeatures: 0,
    parkOpenSpaceFeatures: 0,
    waterFeatures: 0,
    namedWaterFeatures: 0,
    areaContextLabelFeatures: 0
  };
}

export function auditRealLondonContextCoverage(fixture: unknown): RealLondonContextCoverageAudit {
  const context = overpassContextFromFixture(fixture);
  const counts = emptyCoverageCounts();

  if (context) {
    for (const node of context.nodesById.values()) {
      applyContextCoverageCounts(counts, node.tags ?? {});
    }

    for (const way of context.ways) {
      applyContextCoverageCounts(counts, way.tags ?? {});
    }
  }

  return {
    counts,
    orderedCategories: orderedCoverageKeys.map((id) => ({ id, count: counts[id] }))
  };
}

export function buildRealLondonContextFeatures(map: MapDefinition, fixture: unknown): RealLondonContextFeature[] {
  const projection = osmProjectionForMap(map);
  const context = overpassContextFromFixture(fixture);

  if (!projection || !context) {
    return [];
  }

  const features: RealLondonContextFeature[] = [];

  for (const node of context.nodesById.values()) {
    features.push(...contextFeaturesFromNode(node, projection));
  }

  for (const way of context.ways) {
    features.push(...contextFeaturesFromWay(way, context.nodesById, projection));
  }

  return dedupeContextFeatures(features).sort(compareContextFeatures);
}

function applyContextCoverageCounts(counts: RealLondonContextCoverageCounts, tags: OverpassTags): void {
  const railway = tagValue(tags, "railway");

  if (railway === "rail" || railway === "light_rail" || railway === "subway") {
    counts.railFeatures += 1;
  }

  if (railway === "subway") {
    counts.subwayRailFeatures += 1;
  }

  if (railway === "station") {
    counts.stationFeatures += 1;

    if (namedContextLabel(tags)) {
      counts.namedStationFeatures += 1;
    }
  }

  if (hasBridgeContextTag(tags)) {
    counts.bridgeFeatures += 1;

    if (bridgeContextLabel(tags)) {
      counts.namedBridgeFeatures += 1;
    }
  }

  if (hasCrossingContextTag(tags)) {
    counts.crossingFeatures += 1;
  }

  if (landmarkKindForTags(tags)) {
    counts.landmarkLikeFeatures += 1;
  }

  if (parkSubtypeForTags(tags)) {
    counts.parkOpenSpaceFeatures += 1;
  }

  if (waterSubtypeForTags(tags)) {
    counts.waterFeatures += 1;

    if (namedContextLabel(tags)) {
      counts.namedWaterFeatures += 1;
    }
  }

  if (areaLabelSupported(tags) && namedContextLabel(tags)) {
    counts.areaContextLabelFeatures += 1;
  }
}

function contextFeaturesFromNode(node: OverpassNodeElement, projection: OsmLocalProjection): RealLondonContextFeature[] {
  const tags = node.tags ?? {};
  const point = projectOsmCoordinateToLocalMeters({ lat: node.lat, lon: node.lon }, projection);
  const features: RealLondonContextFeature[] = [];

  if (tagValue(tags, "railway") === "station") {
    features.push({
      id: `station-node-${node.id}`,
      kind: "station",
      name: namedContextLabel(tags),
      point,
      sourceElementType: "node",
      sourceElementId: node.id,
      sourceTags: { ...tags }
    });
  }

  const landmarkKind = landmarkKindForTags(tags);

  if (landmarkKind) {
    const name = namedContextLabel(tags);

    if (name) {
      features.push({
        id: `landmark-node-${node.id}`,
        kind: "landmark",
        landmarkKind,
        name,
        point,
        sourceElementType: "node",
        sourceElementId: node.id,
        sourceTags: { ...tags }
      });
    }
  }

  if (hasCrossingContextTag(tags)) {
    features.push({
      id: `crossing-node-${node.id}`,
      kind: "crossing",
      name: namedContextLabel(tags),
      point,
      sourceElementType: "node",
      sourceElementId: node.id,
      sourceTags: { ...tags }
    });
  }

  if (areaLabelSupported(tags)) {
    const name = namedContextLabel(tags);

    if (name) {
      features.push({
        id: `area-node-${node.id}`,
        kind: "area",
        name,
        point,
        sourceElementType: "node",
        sourceElementId: node.id,
        sourceTags: { ...tags }
      });
    }
  }

  return features;
}

function contextFeaturesFromWay(
  way: OverpassWayElement,
  nodesById: ReadonlyMap<OverpassElementId, OverpassNodeElement>,
  projection: OsmLocalProjection
): RealLondonContextFeature[] {
  const tags = way.tags ?? {};
  const points = projectedWayPoints({ way, nodesById, projection });
  const features: RealLondonContextFeature[] = [];
  const closed = isClosedWay(way);

  if (points.length >= 2) {
    const railSubtype = railSubtypeForTags(tags);

    if (railSubtype && !closed) {
      features.push({
        id: `rail-way-${way.id}`,
        kind: "rail",
        subtype: railSubtype,
        name: namedContextLabel(tags),
        points,
        sourceElementType: "way",
        sourceElementId: way.id,
        sourceTags: { ...tags }
      });
    }

    if (hasBridgeContextTag(tags) && Boolean(tags.highway)) {
      features.push({
        id: `bridge-way-${way.id}`,
        kind: "bridge",
        subtype: tagValue(tags, "man_made") === "bridge" ? "man_made_bridge" : "bridge",
        name: bridgeContextLabel(tags),
        points,
        sourceElementType: "way",
        sourceElementId: way.id,
        sourceTags: { ...tags }
      });
    }
  }

  if (points.length >= 1 && hasCrossingContextTag(tags)) {
    features.push({
      id: `crossing-way-${way.id}`,
      kind: "crossing",
      name: namedContextLabel(tags),
      point: polygonCenter(points),
      sourceElementType: "way",
      sourceElementId: way.id,
      sourceTags: { ...tags }
    });
  }

  if (closed && points.length >= 4) {
    const parkSubtype = parkSubtypeForTags(tags);

    if (parkSubtype) {
      features.push({
        id: `park-way-${way.id}`,
        kind: "park",
        subtype: parkSubtype,
        name: namedContextLabel(tags),
        points,
        sourceElementType: "way",
        sourceElementId: way.id,
        sourceTags: { ...tags }
      });
    }

    const waterSubtype = waterSubtypeForTags(tags);

    if (waterSubtype) {
      features.push({
        id: `water-way-${way.id}`,
        kind: "water",
        subtype: waterSubtype,
        name: namedContextLabel(tags),
        points,
        sourceElementType: "way",
        sourceElementId: way.id,
        sourceTags: { ...tags }
      });
    }

    if (pedestrianAreaSupported(tags)) {
      features.push({
        id: `pedestrian-area-way-${way.id}`,
        kind: "pedestrian-area",
        name: namedContextLabel(tags),
        points,
        sourceElementType: "way",
        sourceElementId: way.id,
        sourceTags: { ...tags }
      });
    }

    if (tagValue(tags, "railway") === "station") {
      features.push({
        id: `station-way-${way.id}`,
        kind: "station",
        name: namedContextLabel(tags),
        point: polygonCenter(points),
        sourceElementType: "way",
        sourceElementId: way.id,
        sourceTags: { ...tags }
      });
    }

    const landmarkKind = landmarkKindForTags(tags);
    const landmarkName = namedContextLabel(tags);

    if (landmarkKind && landmarkName) {
      features.push({
        id: `landmark-way-${way.id}`,
        kind: "landmark",
        landmarkKind,
        name: landmarkName,
        point: polygonCenter(points),
        sourceElementType: "way",
        sourceElementId: way.id,
        sourceTags: { ...tags }
      });
    }

    if (areaLabelSupported(tags)) {
      const name = namedContextLabel(tags);

      if (name) {
        features.push({
          id: `area-way-${way.id}`,
          kind: "area",
          name,
          point: polygonCenter(points),
          sourceElementType: "way",
          sourceElementId: way.id,
          sourceTags: { ...tags }
        });
      }
    }
  } else if (points.length >= 2 && tagValue(tags, "waterway")) {
    features.push({
      id: `waterway-way-${way.id}`,
      kind: "water",
      subtype: "waterway",
      name: namedContextLabel(tags),
      points,
      sourceElementType: "way",
      sourceElementId: way.id,
      sourceTags: { ...tags }
    });
  }

  return features;
}

function dedupeContextFeatures(features: readonly RealLondonContextFeature[]): RealLondonContextFeature[] {
  const byKey = new Map<string, RealLondonContextFeature>();

  for (const feature of features) {
    const key = contextFeatureDedupeKey(feature);
    const existing = byKey.get(key);

    if (!existing || compareContextFeatures(feature, existing) < 0) {
      byKey.set(key, feature);
    }
  }

  return Array.from(byKey.values());
}

function contextFeatureDedupeKey(feature: RealLondonContextFeature): string {
  const name = feature.name?.toLowerCase() ?? "";
  const point =
    "point" in feature
      ? `${Math.round(feature.point.x)}:${Math.round(feature.point.y)}`
      : `${Math.round(feature.points[0]?.x ?? 0)}:${Math.round(feature.points[0]?.y ?? 0)}`;

  return `${feature.kind}:${name}:${point}`;
}

function compareContextFeatures(left: RealLondonContextFeature, right: RealLondonContextFeature): number {
  return (
    contextKindOrder[left.kind] - contextKindOrder[right.kind] ||
    left.sourceElementId - right.sourceElementId ||
    left.id.localeCompare(right.id)
  );
}

function railSubtypeForTags(tags: OverpassTags): RealLondonRailContextFeature["subtype"] | null {
  const railway = tagValue(tags, "railway");

  if (railway === "rail" || railway === "light_rail" || railway === "subway") {
    return railway;
  }

  return null;
}

function landmarkKindForTags(tags: OverpassTags): RealLondonLandmarkContextFeature["landmarkKind"] | null {
  const amenity = tagValue(tags, "amenity");
  const tourism = tagValue(tags, "tourism");
  const historic = tagValue(tags, "historic");
  const building = tagValue(tags, "building");
  const shop = tagValue(tags, "shop");

  if (amenity === "hospital") {
    return "hospital";
  }

  if (tourism === "attraction" || Boolean(historic) || tagValue(tags, "landmark") === "yes") {
    return "important-landmark";
  }

  if (
    amenity === "townhall" ||
    amenity === "library" ||
    amenity === "school" ||
    amenity === "university" ||
    amenity === "college" ||
    amenity === "police" ||
    amenity === "fire_station" ||
    amenity === "courthouse" ||
    building === "public" ||
    building === "civic"
  ) {
    return "public-building";
  }

  if (amenity === "marketplace" || shop === "mall" || tourism === "museum" || tourism === "gallery") {
    return "learner-reference";
  }

  return null;
}

function parkSubtypeForTags(tags: OverpassTags): RealLondonParkContextFeature["subtype"] | null {
  const leisure = tagValue(tags, "leisure");
  const landuse = tagValue(tags, "landuse");
  const natural = tagValue(tags, "natural");

  if (leisure === "park") {
    return "park";
  }

  if (leisure === "garden") {
    return "garden";
  }

  if (
    leisure === "recreation_ground" ||
    landuse === "grass" ||
    landuse === "recreation_ground" ||
    landuse === "village_green" ||
    landuse === "meadow" ||
    landuse === "forest" ||
    natural === "wood" ||
    natural === "grassland"
  ) {
    return "open-space";
  }

  return null;
}

function waterSubtypeForTags(tags: OverpassTags): RealLondonWaterContextFeature["subtype"] | null {
  if (tagValue(tags, "waterway")) {
    return "waterway";
  }

  if (tagValue(tags, "natural") === "water" || Boolean(tagValue(tags, "water"))) {
    return "basin";
  }

  return null;
}

function hasBridgeContextTag(tags: OverpassTags): boolean {
  const bridge = tagValue(tags, "bridge");
  const manMade = tagValue(tags, "man_made");

  return (Boolean(bridge) && bridge !== "no") || manMade === "bridge";
}

function hasCrossingContextTag(tags: OverpassTags): boolean {
  const highway = tagValue(tags, "highway");

  return highway === "crossing" || Boolean(tagValue(tags, "crossing"));
}

function areaLabelSupported(tags: OverpassTags): boolean {
  const place = tagValue(tags, "place");

  return place === "neighbourhood" || place === "suburb" || place === "quarter" || place === "locality" || place === "square";
}

function pedestrianAreaSupported(tags: OverpassTags): boolean {
  return tagValue(tags, "highway") === "pedestrian" && tagValue(tags, "area") === "yes";
}

function namedContextLabel(tags: OverpassTags): string | undefined {
  const name = tags.name?.trim();

  return name && name.length > 0 ? name : undefined;
}

function bridgeContextLabel(tags: OverpassTags): string | undefined {
  const bridgeName = tags["bridge:name"]?.trim();

  return namedContextLabel(tags) ?? (bridgeName && bridgeName.length > 0 ? bridgeName : undefined);
}

function projectedWayPoints(input: {
  way: OverpassWayElement;
  nodesById: ReadonlyMap<OverpassElementId, OverpassNodeElement>;
  projection: OsmLocalProjection;
}): Vec2[] {
  return input.way.nodes.flatMap((nodeId) => {
    const node = input.nodesById.get(nodeId);

    if (!node) {
      return [];
    }

    return [projectOsmCoordinateToLocalMeters({ lat: node.lat, lon: node.lon }, input.projection)];
  });
}

function isClosedWay(way: OverpassWayElement): boolean {
  return way.nodes.length >= 4 && way.nodes[0] === way.nodes[way.nodes.length - 1];
}

function polygonCenter(points: readonly Vec2[]): Vec2 {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  const total = points.reduce(
    (sum, point) => ({
      x: sum.x + point.x,
      y: sum.y + point.y
    }),
    { x: 0, y: 0 }
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length
  };
}

function osmProjectionForMap(map: MapDefinition): OsmLocalProjection | null {
  const metadata = (map as { metadata?: { source?: unknown; projection?: unknown } }).metadata;
  const projection = metadata?.projection;

  if (metadata?.source !== "osm" || !isRecord(projection)) {
    return null;
  }

  return projection as OsmLocalProjection;
}

function overpassContextFromFixture(fixture: unknown): OverpassContext | null {
  if (!isOverpassJsonResponse(fixture)) {
    return null;
  }

  const nodesById = new Map<OverpassElementId, OverpassNodeElement>();
  const ways: OverpassWayElement[] = [];

  for (const element of fixture.elements) {
    if (isOverpassNodeElement(element)) {
      nodesById.set(element.id, element);
    } else if (isOverpassWayElement(element)) {
      ways.push(element);
    }
  }

  return { nodesById, ways };
}

function tagValue(tags: OverpassTags, key: string): string {
  return tags[key]?.trim().toLowerCase() ?? "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isTagRecord(value: unknown): value is OverpassTags {
  return isRecord(value) && Object.values(value).every((tagValue) => typeof tagValue === "string");
}

function isOverpassNodeElement(value: unknown): value is OverpassNodeElement {
  return (
    isRecord(value) &&
    value.type === "node" &&
    typeof value.id === "number" &&
    typeof value.lat === "number" &&
    typeof value.lon === "number" &&
    (value.tags === undefined || isTagRecord(value.tags))
  );
}

function isOverpassWayElement(value: unknown): value is OverpassWayElement {
  return (
    isRecord(value) &&
    value.type === "way" &&
    typeof value.id === "number" &&
    Array.isArray(value.nodes) &&
    value.nodes.every((nodeId) => typeof nodeId === "number") &&
    (value.tags === undefined || isTagRecord(value.tags))
  );
}

function isOverpassJsonResponse(value: unknown): value is OverpassJsonResponse {
  return isRecord(value) && Array.isArray(value.elements);
}
