import type { MapDefinition, Vec2 } from "../../../lib/map-engine/index.ts";
import { projectOsmCoordinateToLocalMeters } from "../../../lib/map-engine/osm/index.ts";
import type {
  OsmLocalProjection,
  OverpassElementId,
  OverpassJsonResponse,
  OverpassNodeElement,
  OverpassRelationElement,
  OverpassTags,
  OverpassWayElement
} from "../../../lib/map-engine/osm/index.ts";

export type RealLondonContextFeatureKind =
  | "land-use"
  | "building"
  | "institution"
  | "road-reference"
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
  sourceElementType: "node" | "way" | "relation";
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
  subtype: "rail" | "underground" | "light-rail" | "transport-interchange";
  point: Vec2;
  sourceGeometry: Vec2[];
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
  symbolKind:
    | "hospital"
    | "religious"
    | "education"
    | "civic"
    | "museum"
    | "market"
    | "parking"
    | "pier"
    | "landmark";
  point: Vec2;
  sourceGeometry: Vec2[];
};

export type RealLondonParkContextFeature = RealLondonContextFeatureBase & {
  kind: "park";
  subtype: "park" | "garden" | "open-space";
  points: Vec2[];
  innerRings?: Vec2[][];
};

export type RealLondonWaterContextFeature = RealLondonContextFeatureBase & {
  kind: "water";
  subtype: "basin" | "waterway";
  points: Vec2[];
  innerRings?: Vec2[][];
};

export type RealLondonPedestrianAreaContextFeature = RealLondonContextFeatureBase & {
  kind: "pedestrian-area";
  points: Vec2[];
  innerRings?: Vec2[][];
};

export type RealLondonAreaContextFeature = RealLondonContextFeatureBase & {
  kind: "area";
  point: Vec2;
};

export type RealLondonBuildingContextFeature = RealLondonContextFeatureBase & {
  kind: "building";
  subtype: "residential" | "commercial" | "retail" | "industrial" | "education" | "healthcare" | "civic" | "religious" | "other";
  points: Vec2[];
  innerRings?: Vec2[][];
};

export type RealLondonInstitutionContextFeature = RealLondonContextFeatureBase & {
  kind: "institution";
  subtype: "education" | "healthcare" | "civic" | "religious";
  points: Vec2[];
  innerRings?: Vec2[][];
};

export type RealLondonLandUseContextFeature = RealLondonContextFeatureBase & {
  kind: "land-use";
  subtype: "residential" | "commercial" | "retail" | "industrial";
  points: Vec2[];
  innerRings?: Vec2[][];
};

export type RealLondonRoadReferenceContextFeature = RealLondonContextFeatureBase & {
  kind: "road-reference";
  subtype: "a-road" | "b-road";
  reference: string;
  points: Vec2[];
};

export type RealLondonContextFeature =
  | RealLondonLandUseContextFeature
  | RealLondonBuildingContextFeature
  | RealLondonInstitutionContextFeature
  | RealLondonRoadReferenceContextFeature
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
  buildingFootprintFeatures: number;
  institutionalAreaFeatures: number;
  educationInstitutionalAreaFeatures: number;
  healthcareInstitutionalAreaFeatures: number;
  civicInstitutionalAreaFeatures: number;
  religiousInstitutionalAreaFeatures: number;
  landUseBlockFeatures: number;
  residentialLandUseBlockFeatures: number;
  commercialLandUseBlockFeatures: number;
  retailLandUseBlockFeatures: number;
  industrialLandUseBlockFeatures: number;
  roadReferenceFeatures: number;
  aRoadReferenceFeatures: number;
  bRoadReferenceFeatures: number;
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
  waysById: Map<OverpassElementId, OverpassWayElement>;
  ways: OverpassWayElement[];
  relations: OverpassRelationElement[];
};

const orderedCoverageKeys: Array<keyof RealLondonContextCoverageCounts> = [
  "buildingFootprintFeatures",
  "institutionalAreaFeatures",
  "educationInstitutionalAreaFeatures",
  "healthcareInstitutionalAreaFeatures",
  "civicInstitutionalAreaFeatures",
  "religiousInstitutionalAreaFeatures",
  "landUseBlockFeatures",
  "residentialLandUseBlockFeatures",
  "commercialLandUseBlockFeatures",
  "retailLandUseBlockFeatures",
  "industrialLandUseBlockFeatures",
  "roadReferenceFeatures",
  "aRoadReferenceFeatures",
  "bRoadReferenceFeatures",
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
  "land-use": 2,
  building: 4,
  institution: 6,
  "road-reference": 8,
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
    buildingFootprintFeatures: 0,
    institutionalAreaFeatures: 0,
    educationInstitutionalAreaFeatures: 0,
    healthcareInstitutionalAreaFeatures: 0,
    civicInstitutionalAreaFeatures: 0,
    religiousInstitutionalAreaFeatures: 0,
    landUseBlockFeatures: 0,
    residentialLandUseBlockFeatures: 0,
    commercialLandUseBlockFeatures: 0,
    retailLandUseBlockFeatures: 0,
    industrialLandUseBlockFeatures: 0,
    roadReferenceFeatures: 0,
    aRoadReferenceFeatures: 0,
    bRoadReferenceFeatures: 0,
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
      applyAtlasAreaCoverageCounts(counts, way.tags ?? {}, isClosedWay(way));
    }

    for (const relation of context.relations) {
      applyAtlasAreaCoverageCounts(
        counts,
        relation.tags ?? {},
        tagValue(relation.tags ?? {}, "type") === "multipolygon"
      );
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

  for (const relation of context.relations) {
    features.push(...contextFeaturesFromRelation(relation, context.waysById, context.nodesById, projection));
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

  if (stationSubtypeForTags(tags)) {
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

  for (const roadReference of roadReferencesForTags(tags)) {
    counts.roadReferenceFeatures += 1;

    if (roadReference.subtype === "a-road") {
      counts.aRoadReferenceFeatures += 1;
    } else {
      counts.bRoadReferenceFeatures += 1;
    }
  }
}

function applyAtlasAreaCoverageCounts(
  counts: RealLondonContextCoverageCounts,
  tags: OverpassTags,
  polygonCapable: boolean
): void {
  if (!polygonCapable) {
    return;
  }

  if (buildingSubtypeForTags(tags)) {
    counts.buildingFootprintFeatures += 1;
  }

  const institutionSubtype = institutionSubtypeForTags(tags);

  if (institutionSubtype) {
    counts.institutionalAreaFeatures += 1;
    counts[`${institutionSubtype}InstitutionalAreaFeatures`] += 1;
  }

  const landUseSubtype = landUseSubtypeForTags(tags);

  if (landUseSubtype) {
    counts.landUseBlockFeatures += 1;
    counts[`${landUseSubtype}LandUseBlockFeatures`] += 1;
  }
}

function contextFeaturesFromNode(node: OverpassNodeElement, projection: OsmLocalProjection): RealLondonContextFeature[] {
  const tags = node.tags ?? {};
  const point = projectOsmCoordinateToLocalMeters({ lat: node.lat, lon: node.lon }, projection);
  const features: RealLondonContextFeature[] = [];

  const stationSubtype = stationSubtypeForTags(tags);

  if (stationSubtype) {
    features.push({
      id: `station-node-${node.id}`,
      kind: "station",
      subtype: stationSubtype,
      name: namedContextLabel(tags),
      point,
      sourceGeometry: [{ ...point }],
      sourceElementType: "node",
      sourceElementId: node.id,
      sourceTags: { ...tags }
    });
  }

  const landmarkClassification = landmarkClassificationForTags(tags);

  if (landmarkClassification) {
    const name = namedContextLabel(tags);

    if (name) {
      features.push({
        id: `landmark-node-${node.id}`,
        kind: "landmark",
        ...landmarkClassification,
        name,
        point,
        sourceGeometry: [{ ...point }],
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
  const polygonReady = closed && points.length === way.nodes.length && points.length >= 4;

  if (points.length >= 2) {
    for (const roadReference of roadReferencesForTags(tags)) {
      features.push({
        id: `road-reference-way-${way.id}-${roadReference.reference.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
        kind: "road-reference",
        subtype: roadReference.subtype,
        reference: roadReference.reference,
        name: namedContextLabel(tags),
        points,
        sourceElementType: "way",
        sourceElementId: way.id,
        sourceTags: { ...tags }
      });
    }

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

  if (polygonReady) {
    features.push(...atlasPolygonFeatures({
      elementType: "way",
      elementId: way.id,
      tags,
      points
    }));

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

    const stationSubtype = stationSubtypeForTags(tags);

    if (stationSubtype) {
      features.push({
        id: `station-way-${way.id}`,
        kind: "station",
        subtype: stationSubtype,
        name: namedContextLabel(tags),
        point: polygonCenter(points),
        sourceGeometry: points.map((point) => ({ ...point })),
        sourceElementType: "way",
        sourceElementId: way.id,
        sourceTags: { ...tags }
      });
    }

    const landmarkClassification = landmarkClassificationForTags(tags);
    const landmarkName = namedContextLabel(tags);

    if (landmarkClassification && landmarkName) {
      features.push({
        id: `landmark-way-${way.id}`,
        kind: "landmark",
        ...landmarkClassification,
        name: landmarkName,
        point: polygonCenter(points),
        sourceGeometry: points.map((point) => ({ ...point })),
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
  } else if (points.length >= 2 && tagValue(tags, "man_made") === "pier") {
    const name = namedContextLabel(tags);

    if (name) {
      features.push({
        id: `landmark-way-${way.id}`,
        kind: "landmark",
        landmarkKind: "learner-reference",
        symbolKind: "pier",
        name,
        point: polygonCenter(points),
        sourceGeometry: points.map((point) => ({ ...point })),
        sourceElementType: "way",
        sourceElementId: way.id,
        sourceTags: { ...tags }
      });
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

function contextFeaturesFromRelation(
  relation: OverpassRelationElement,
  waysById: ReadonlyMap<OverpassElementId, OverpassWayElement>,
  nodesById: ReadonlyMap<OverpassElementId, OverpassNodeElement>,
  projection: OsmLocalProjection
): RealLondonContextFeature[] {
  const tags = relation.tags ?? {};

  if (tagValue(tags, "type") !== "multipolygon") {
    return [];
  }

  const waterSubtype = waterSubtypeForTags(tags);

  return buildRelationPolygonRings(relation, waysById, nodesById, projection).flatMap((polygon, index) => {
    const ring = index + 1;
    const { outerRing: points, innerRings } = polygon;
    const features = atlasPolygonFeatures({
      elementType: "relation",
      elementId: relation.id,
      idSuffix: `-ring-${ring}`,
      tags,
      points,
      innerRings
    });

    const parkSubtype = parkSubtypeForTags(tags);

    if (parkSubtype) {
      features.push({
        id: `park-relation-${relation.id}-ring-${ring}`,
        kind: "park",
        subtype: parkSubtype,
        name: namedContextLabel(tags),
        points,
        innerRings,
        sourceElementType: "relation",
        sourceElementId: relation.id,
        sourceTags: { ...tags }
      });
    }

    if (waterSubtype) {
      features.push({
        id: `water-relation-${relation.id}-ring-${ring}`,
        kind: "water",
        subtype: waterSubtype === "waterway" ? "basin" : waterSubtype,
        name: namedContextLabel(tags),
        points,
        innerRings,
        sourceElementType: "relation",
        sourceElementId: relation.id,
        sourceTags: { ...tags }
      });
    }

    return features;
  });
}

function atlasPolygonFeatures(input: {
  elementType: "way" | "relation";
  elementId: OverpassElementId;
  idSuffix?: string;
  tags: OverpassTags;
  points: Vec2[];
  innerRings?: Vec2[][];
}): RealLondonContextFeature[] {
  const { elementType, elementId, idSuffix = "", tags, points, innerRings = [] } = input;
  const features: RealLondonContextFeature[] = [];
  const source = {
    name: namedContextLabel(tags),
    points,
    innerRings,
    sourceElementType: elementType,
    sourceElementId: elementId,
    sourceTags: { ...tags }
  };
  const landUseSubtype = landUseSubtypeForTags(tags);

  if (landUseSubtype) {
    features.push({
      ...source,
      id: `land-use-${elementType}-${elementId}${idSuffix}`,
      kind: "land-use",
      subtype: landUseSubtype
    });
  }

  const buildingSubtype = buildingSubtypeForTags(tags);

  if (buildingSubtype) {
    features.push({
      ...source,
      id: `building-${elementType}-${elementId}${idSuffix}`,
      kind: "building",
      subtype: buildingSubtype
    });
  }

  const institutionSubtype = institutionSubtypeForTags(tags);

  if (institutionSubtype) {
    features.push({
      ...source,
      id: `institution-${elementType}-${elementId}${idSuffix}`,
      kind: "institution",
      subtype: institutionSubtype
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
  if (
    feature.kind === "building" ||
    feature.kind === "institution" ||
    feature.kind === "land-use" ||
    feature.kind === "road-reference"
  ) {
    return feature.id;
  }

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

function landUseSubtypeForTags(tags: OverpassTags): RealLondonLandUseContextFeature["subtype"] | null {
  const landUse = tagValue(tags, "landuse");

  if (landUse === "residential" || landUse === "commercial" || landUse === "retail" || landUse === "industrial") {
    return landUse;
  }

  return null;
}

function institutionSubtypeForTags(tags: OverpassTags): RealLondonInstitutionContextFeature["subtype"] | null {
  const amenity = tagValue(tags, "amenity");
  const building = tagValue(tags, "building");
  const healthcare = tagValue(tags, "healthcare");
  const landUse = tagValue(tags, "landuse");

  if (
    ["school", "college", "university", "kindergarten", "childcare"].includes(amenity) ||
    landUse === "education" ||
    ["school", "college", "university", "kindergarten"].includes(building)
  ) {
    return "education";
  }

  if (
    ["hospital", "clinic", "doctors", "dentist", "pharmacy", "nursing_home"].includes(amenity) ||
    Boolean(healthcare) ||
    landUse === "healthcare" ||
    ["hospital", "healthcare"].includes(building)
  ) {
    return "healthcare";
  }

  if (
    amenity === "place_of_worship" ||
    landUse === "religious" ||
    ["church", "chapel", "cathedral", "mosque", "synagogue", "temple", "religious"].includes(building)
  ) {
    return "religious";
  }

  if (
    ["townhall", "courthouse", "police", "fire_station", "library", "community_centre", "social_facility"].includes(amenity) ||
    ["civic", "public", "government"].includes(building) ||
    landUse === "civic" ||
    tagValue(tags, "office") === "government" ||
    tagValue(tags, "government")
  ) {
    return "civic";
  }

  return null;
}

function buildingSubtypeForTags(tags: OverpassTags): RealLondonBuildingContextFeature["subtype"] | null {
  const building = tagValue(tags, "building");

  if (!building || building === "no") {
    return null;
  }

  const institutionSubtype = institutionSubtypeForTags(tags);

  if (institutionSubtype) {
    return institutionSubtype;
  }

  if (["apartments", "detached", "house", "residential", "semidetached_house", "terrace"].includes(building)) {
    return "residential";
  }

  if (["commercial", "office"].includes(building)) {
    return "commercial";
  }

  if (["retail", "supermarket", "kiosk"].includes(building)) {
    return "retail";
  }

  if (["industrial", "warehouse", "manufacture"].includes(building)) {
    return "industrial";
  }

  return "other";
}

function roadReferencesForTags(
  tags: OverpassTags
): Array<{ reference: string; subtype: RealLondonRoadReferenceContextFeature["subtype"] }> {
  if (!tagValue(tags, "highway")) {
    return [];
  }

  const references = (tags.ref ?? "")
    .split(/[;,]/)
    .map((reference) => reference.trim().toUpperCase())
    .filter(Boolean);
  const uniqueReferences = new Set<string>();

  for (const reference of references) {
    if (/^A\d{1,4}[A-Z]?(?:\([A-Z0-9]+\))?$/.test(reference) || /^B\d{1,4}[A-Z]?$/.test(reference)) {
      uniqueReferences.add(reference);
    }
  }

  return Array.from(uniqueReferences)
    .sort((left, right) => left.localeCompare(right))
    .map((reference) => ({
      reference,
      subtype: reference.startsWith("A") ? "a-road" : "b-road"
    }));
}

function railSubtypeForTags(tags: OverpassTags): RealLondonRailContextFeature["subtype"] | null {
  const railway = tagValue(tags, "railway");

  if (railway === "rail" || railway === "light_rail" || railway === "subway") {
    return railway;
  }

  return null;
}

function stationSubtypeForTags(tags: OverpassTags): RealLondonStationContextFeature["subtype"] | null {
  if (tagValue(tags, "railway") === "station") {
    if (tagValue(tags, "station") === "subway" || tagValue(tags, "subway") === "yes") {
      return "underground";
    }

    if (tagValue(tags, "station") === "light_rail") {
      return "light-rail";
    }

    return "rail";
  }

  if (tagValue(tags, "public_transport") === "station") {
    return "transport-interchange";
  }

  return null;
}

type LandmarkClassification = Pick<RealLondonLandmarkContextFeature, "landmarkKind" | "symbolKind">;

function landmarkKindForTags(tags: OverpassTags): RealLondonLandmarkContextFeature["landmarkKind"] | null {
  return landmarkClassificationForTags(tags)?.landmarkKind ?? null;
}

function landmarkClassificationForTags(tags: OverpassTags): LandmarkClassification | null {
  const amenity = tagValue(tags, "amenity");
  const tourism = tagValue(tags, "tourism");
  const historic = tagValue(tags, "historic");
  const building = tagValue(tags, "building");
  const shop = tagValue(tags, "shop");

  if (amenity === "hospital") {
    return { landmarkKind: "hospital", symbolKind: "hospital" };
  }

  if (amenity === "place_of_worship") {
    return { landmarkKind: "public-building", symbolKind: "religious" };
  }

  if (amenity === "school" || amenity === "university" || amenity === "college") {
    return { landmarkKind: "public-building", symbolKind: "education" };
  }

  if (tourism === "museum" || tourism === "gallery") {
    return { landmarkKind: "learner-reference", symbolKind: "museum" };
  }

  if (amenity === "marketplace" || shop === "mall") {
    return { landmarkKind: "learner-reference", symbolKind: "market" };
  }

  if (amenity === "parking") {
    return { landmarkKind: "learner-reference", symbolKind: "parking" };
  }

  if (tagValue(tags, "man_made") === "pier") {
    return { landmarkKind: "learner-reference", symbolKind: "pier" };
  }

  if (tourism === "attraction" || Boolean(historic) || tagValue(tags, "landmark") === "yes") {
    return { landmarkKind: "important-landmark", symbolKind: "landmark" };
  }

  if (
    amenity === "townhall" ||
    amenity === "library" ||
    amenity === "police" ||
    amenity === "fire_station" ||
    amenity === "courthouse" ||
    building === "public" ||
    building === "civic"
  ) {
    return { landmarkKind: "public-building", symbolKind: "civic" };
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

type RelationPolygonRings = {
  outerRing: Vec2[];
  innerRings: Vec2[][];
};

function buildRelationPolygonRings(
  relation: OverpassRelationElement,
  waysById: ReadonlyMap<OverpassElementId, OverpassWayElement>,
  nodesById: ReadonlyMap<OverpassElementId, OverpassNodeElement>,
  projection: OsmLocalProjection
): RelationPolygonRings[] {
  const members = relationMembers(relation);
  const outerRings = projectedRelationRings("outer", members, waysById, nodesById, projection);
  const innerRings = projectedRelationRings("inner", members, waysById, nodesById, projection);

  return outerRings.map((outerRing) => ({
    outerRing,
    innerRings: innerRings.filter((innerRing) => pointInPolygon(innerRing[0], outerRing))
  }));
}

function projectedRelationRings(
  role: "outer" | "inner",
  members: ReadonlyArray<{ type: "way"; ref: OverpassElementId; role: string }>,
  waysById: ReadonlyMap<OverpassElementId, OverpassWayElement>,
  nodesById: ReadonlyMap<OverpassElementId, OverpassNodeElement>,
  projection: OsmLocalProjection
): Vec2[][] {
  const ways = members
    .filter((member) => member.role === role)
    .flatMap((member) => {
      const way = waysById.get(member.ref);
      return way ? [way] : [];
    });

  return stitchClosedNodeRefRings(ways.map((way) => way.nodes)).flatMap((ring) => {
    const points = ring.flatMap((nodeId) => {
      const node = nodesById.get(nodeId);
      return node ? [projectOsmCoordinateToLocalMeters({ lat: node.lat, lon: node.lon }, projection)] : [];
    });

    return points.length === ring.length && points.length >= 4 ? [points] : [];
  });
}

function pointInPolygon(point: Vec2, polygon: readonly Vec2[]): boolean {
  let inside = false;

  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current, current += 1) {
    const currentPoint = polygon[current];
    const previousPoint = polygon[previous];
    const crosses =
      currentPoint.y > point.y !== previousPoint.y > point.y &&
      point.x <
        ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
          (previousPoint.y - currentPoint.y || Number.EPSILON) +
          currentPoint.x;

    if (crosses) {
      inside = !inside;
    }
  }

  return inside;
}

function stitchClosedNodeRefRings(nodeRefsByWay: readonly OverpassElementId[][]): OverpassElementId[][] {
  const unused = nodeRefsByWay.filter((nodeRefs) => nodeRefs.length >= 2).map((nodeRefs) => [...nodeRefs]);
  const rings: OverpassElementId[][] = [];

  while (unused.length > 0) {
    let ring = unused.shift() ?? [];

    for (let changed = true; changed && !isClosedNodeRefRing(ring); ) {
      changed = false;

      for (let index = 0; index < unused.length; index += 1) {
        const candidate = unused[index];
        const joined = joinNodeRefRingSegment(ring, candidate);

        if (joined) {
          ring = joined;
          unused.splice(index, 1);
          changed = true;
          break;
        }
      }
    }

    if (isClosedNodeRefRing(ring)) {
      rings.push(ring);
    }
  }

  return rings;
}

function joinNodeRefRingSegment(
  ring: readonly OverpassElementId[],
  candidate: readonly OverpassElementId[]
): OverpassElementId[] | null {
  const ringStart = ring[0];
  const ringEnd = ring[ring.length - 1];
  const candidateStart = candidate[0];
  const candidateEnd = candidate[candidate.length - 1];

  if (ringEnd === candidateStart) {
    return [...ring, ...candidate.slice(1)];
  }

  if (ringEnd === candidateEnd) {
    return [...ring, ...[...candidate].reverse().slice(1)];
  }

  if (ringStart === candidateEnd) {
    return [...candidate.slice(0, -1), ...ring];
  }

  if (ringStart === candidateStart) {
    return [...[...candidate].reverse().slice(0, -1), ...ring];
  }

  return null;
}

function isClosedNodeRefRing(nodeRefs: readonly OverpassElementId[]): boolean {
  return nodeRefs.length >= 4 && nodeRefs[0] === nodeRefs[nodeRefs.length - 1];
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
  const waysById = new Map<OverpassElementId, OverpassWayElement>();
  const ways: OverpassWayElement[] = [];
  const relations: OverpassRelationElement[] = [];

  for (const element of fixture.elements) {
    if (isOverpassNodeElement(element)) {
      nodesById.set(element.id, element);
    } else if (isOverpassWayElement(element)) {
      ways.push(element);
      waysById.set(element.id, element);
    } else if (isOverpassRelationElement(element)) {
      relations.push(element);
    }
  }

  return { nodesById, waysById, ways, relations };
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

function isOverpassRelationElement(value: unknown): value is OverpassRelationElement {
  return (
    isRecord(value) &&
    value.type === "relation" &&
    typeof value.id === "number" &&
    (value.members === undefined || Array.isArray(value.members)) &&
    (value.tags === undefined || isTagRecord(value.tags))
  );
}

function relationMembers(
  relation: OverpassRelationElement
): Array<{ type: "way"; ref: OverpassElementId; role: string }> {
  return (relation.members ?? []).flatMap((member) => {
    if (!isRecord(member) || member.type !== "way" || typeof member.ref !== "number") {
      return [];
    }

    return [
      {
        type: "way" as const,
        ref: member.ref,
        role: typeof member.role === "string" ? member.role : ""
      }
    ];
  });
}

function isOverpassJsonResponse(value: unknown): value is OverpassJsonResponse {
  return isRecord(value) && Array.isArray(value.elements);
}
