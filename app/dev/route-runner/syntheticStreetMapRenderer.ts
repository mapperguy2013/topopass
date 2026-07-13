import {
  mapToScreenPoint,
  type Landmark,
  type MapDefinition,
  type MapRoad,
  type RouteExercise,
  type RouteStop,
  type ScreenMapViewport,
  type Vec2
} from "../../../lib/map-engine/index.ts";
import type { OverpassElementId, OverpassTags } from "../../../lib/map-engine/osm/index.ts";
import { buildRealLondonContextFeatures } from "./realLondonContextData.ts";
import type {
  RealLondonBuildingContextFeature,
  RealLondonContextFeature,
  RealLondonInstitutionContextFeature,
  RealLondonLandUseContextFeature,
  RealLondonLandmarkContextFeature,
  RealLondonParkContextFeature,
  RealLondonPedestrianAreaContextFeature,
  RealLondonWaterContextFeature
} from "./realLondonContextData.ts";
import {
  TOPOPASS_STREET_ATLAS_STYLE,
  type TopopassContextLabelStyle,
  type TopopassAreaPolygonStyle,
  type TopopassAtlasSymbolKind,
  type TopopassLabelStyle,
  type TopopassMarkerAssetStyle,
  type TopopassRoadInteractionStyle,
  type TopopassRoadLabelStyle
} from "./topopassCartographyStyle.ts";

export type SyntheticRoadClass =
  | "major"
  | "secondary"
  | "local"
  | "service"
  | "one-way"
  | "no-entry"
  | "restricted";

export type SyntheticBackgroundFeatureKind =
  | "land-use"
  | "park"
  | "water"
  | "institution"
  | "building"
  | "land-block"
  | "open-space"
  | "pedestrian-area";

export type SyntheticBackgroundRenderLayer =
  | "land-use"
  | "parks-water"
  | "institution"
  | "building"
  | "pedestrian-area";

export type SyntheticBackgroundSourceMetadata = {
  sourceFeatureId: string;
  sourceElementType: "node" | "way" | "relation";
  sourceElementId: OverpassElementId;
  sourceTags: OverpassTags;
};

export type SyntheticLinearFeatureKind = "rail" | "waterway" | "bridge" | "crossing";

export type SyntheticLandmarkVisualKind =
  | "station"
  | "hospital"
  | "park"
  | "important-landmark"
  | "public-building"
  | "open-space"
  | "learner-reference"
  | "market"
  | "civic"
  | "church"
  | "museum"
  | "religious"
  | "education"
  | "parking"
  | "pier"
  | "dock"
  | "generic";

export type SyntheticContextMapLabelKind =
  | "road_reference"
  | "district"
  | "institution"
  | "land_use"
  | "area"
  | "park"
  | "water"
  | "station"
  | "landmark"
  | "public_building"
  | "open_space"
  | "learner_reference"
  | "bridge";

export type SyntheticMapLabelKind = "road" | SyntheticContextMapLabelKind | "start" | "checkpoint" | "finish";

export type SyntheticAtlasLabelCategory =
  | "road-reference"
  | "district"
  | "major-road"
  | "station"
  | "landmark"
  | "local-road"
  | "park"
  | "estate"
  | "water"
  | "institution"
  | "contextual-land-use"
  | "learner-overlay";

export type SyntheticAtlasLabelSourceMetadata = {
  provider: "map-definition" | "openstreetmap" | "exercise";
  featureId: string;
  elementType?: "node" | "way" | "relation";
  elementId?: OverpassElementId;
  tags?: OverpassTags;
};

export type SyntheticRouteOverlayKind =
  | "raw-route"
  | "snapped-route"
  | "matched-route"
  | "shortest-legal-route"
  | "accepted-alternative-route"
  | "inefficient-section"
  | "backtrack-section"
  | "illegal-movement";

export type SyntheticLegendTone =
  | "route"
  | "shortest"
  | "alternative-route"
  | "illegal"
  | "restriction"
  | "one-way"
  | "turn"
  | "restricted"
  | "missed-checkpoint"
  | "start"
  | "checkpoint"
  | "finish"
  | "road"
  | "secondary-road"
  | "local-road"
  | "road-highlight"
  | "context-road"
  | "background"
  | "park"
  | "water"
  | "rail"
  | "station";

export type SyntheticRoadStyle = {
  casingColor: string;
  strokeColor: string;
  casingWidth: number;
  strokeWidth: number;
  dash?: number[];
  alpha?: number;
};

export type SyntheticRoadRenderLayer = "casing" | "fill";

export type SyntheticRoadRenderPass = {
  layer: SyntheticRoadRenderLayer;
  visual: SyntheticRoadVisual;
};

export type SyntheticRoadJunctionCap = {
  id: string;
  point: Vec2;
  visual: SyntheticRoadVisual;
  roadIds: readonly string[];
  osmWayId: string;
};

export type SyntheticRoadInteractionState = "selected" | "hovered";

export type OsmRoadVisualHierarchy =
  | "primary"
  | "secondary"
  | "tertiary"
  | "residential"
  | "service"
  | "pedestrian"
  | "restricted"
  | "inactive"
  | "unknown";

export type OsmRoadRenderMetadata = {
  source: "osm";
  highway: string | null;
  hierarchy: OsmRoadVisualHierarchy;
  osmWayId: string | null;
};

export type SyntheticRoadVisual = {
  roadId: string;
  name: string;
  roadClass: SyntheticRoadClass;
  source: "synthetic" | "osm";
  osmHighway?: string;
  osmHierarchy?: OsmRoadVisualHierarchy;
  osmWayId?: string;
  osmSourceTags?: OverpassTags;
  points: Vec2[];
  midpoint: Vec2;
  labelAngleRadians: number;
  isOneWay: boolean;
  hasNoEntryRestriction: boolean;
  hasRoadClosedRestriction: boolean;
  style: SyntheticRoadStyle;
};

export type SyntheticBackgroundFeature = {
  id: string;
  kind: SyntheticBackgroundFeatureKind;
  label?: string;
  points: Vec2[];
  innerRings?: Vec2[][];
  subtype?: string;
  renderLayer?: SyntheticBackgroundRenderLayer;
  sourceMetadata?: SyntheticBackgroundSourceMetadata;
  sourceBounds?: { minX: number; minY: number; maxX: number; maxY: number };
  sourceAreaSquareMeters?: number;
  fillColor: string;
  strokeColor: string;
  routable: false;
};

export type SyntheticLinearFeature = {
  id: string;
  kind: SyntheticLinearFeatureKind;
  label?: string;
  points: Vec2[];
  casingColor: string;
  strokeColor: string;
  casingWidth: number;
  strokeWidth: number;
  dash?: number[];
  routable: false;
};

export type SyntheticLandmarkVisual = {
  id: string;
  kind: SyntheticLandmarkVisualKind;
  label: string;
  point: Vec2;
  radius: number;
  fillColor: string;
  strokeColor: string;
  haloColor: string;
  priority: number;
  isExerciseStop: boolean;
  symbolKind?: TopopassAtlasSymbolKind;
  sourceGeometry?: Vec2[];
  sourceMetadata?: SyntheticAtlasSymbolSourceMetadata;
  routable: false;
};

export type SyntheticAtlasSymbolSourceMetadata = {
  provider: "map-definition" | "openstreetmap";
  sourceFeatureId: string;
  elementType?: "node" | "way" | "relation";
  elementId?: OverpassElementId;
  tags?: OverpassTags;
};

export type SyntheticAtlasSymbolCandidate = SyntheticLandmarkVisual & {
  symbolKind: TopopassAtlasSymbolKind;
  sourceGeometry: Vec2[];
  sourceMetadata: SyntheticAtlasSymbolSourceMetadata;
};

export type SyntheticMapLabel = {
  id: string;
  kind: SyntheticMapLabelKind;
  text: string;
  point: Vec2;
  angleRadians?: number;
  priority: number;
  roadClass?: SyntheticRoadClass;
  osmHierarchy?: OsmRoadVisualHierarchy;
  source?: "synthetic" | "osm";
  roadLengthMeters?: number;
  roadReferenceClass?: "a-road" | "b-road";
  sourceGeometry?: Vec2[];
  symbolKind?: TopopassAtlasSymbolKind;
  category?: SyntheticAtlasLabelCategory;
  sourceMetadata?: SyntheticAtlasLabelSourceMetadata;
};

export type SyntheticAtlasLabelCandidate = SyntheticMapLabel & {
  category: SyntheticAtlasLabelCategory;
  sourceMetadata: SyntheticAtlasLabelSourceMetadata;
};

export type SyntheticAtlasLabelCoverageCounts = {
  roadReferenceLabels: number;
  districtLabels: number;
  majorRoadLabels: number;
  stationLabels: number;
  landmarkLabels: number;
  localRoadLabels: number;
  parkLabels: number;
  estateLabels: number;
  waterLabels: number;
  institutionLabels: number;
  contextualLandUseLabels: number;
};

export type SyntheticAtlasLabelCoverageAudit = {
  counts: SyntheticAtlasLabelCoverageCounts;
  orderedCategories: Array<{ id: keyof SyntheticAtlasLabelCoverageCounts; count: number }>;
};

export type SyntheticRoadLabelTier = "major" | "secondary" | "minor" | "restricted" | "service";

export type SyntheticCartographicRoadScaleTier = "major" | "secondary" | "local" | "service" | "restricted";

export type SyntheticCartographicLabelScaleTier =
  | SyntheticRoadLabelTier
  | "context"
  | "stop";

export type SyntheticLabelCollisionBox = {
  id: string;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type FilterSyntheticMapLabelsOptions = {
  labels: readonly SyntheticMapLabel[];
  viewport: ScreenMapViewport;
  reservedBoxes?: readonly SyntheticLabelCollisionBox[];
  currentZoom?: number;
};

export type FilterSyntheticLandmarkVisualsOptions = {
  visuals: readonly SyntheticLandmarkVisual[];
  viewport: ScreenMapViewport;
  reservedBoxes?: readonly SyntheticLabelCollisionBox[];
  reservedLabels?: readonly SyntheticMapLabel[];
  currentZoom?: number;
};

export type SyntheticRouteOverlayVisual = {
  id: string;
  kind: SyntheticRouteOverlayKind;
  points: Vec2[];
  strokeColor: string;
  strokeWidth: number;
  casingColor?: string;
  casingWidth?: number;
  dash?: number[];
  alpha?: number;
};

export type SyntheticStreetMapLegendItem = {
  id: string;
  label: string;
  description: string;
  tone: SyntheticLegendTone;
};

export type SyntheticLabelMeasurementCacheStats = {
  widthCacheSize: number;
  fontSizeCacheSize: number;
  widthCacheHits: number;
  widthCacheMisses: number;
  fontSizeCacheHits: number;
  fontSizeCacheMisses: number;
};

export type BuildSyntheticMapLabelOptions = {
  includeOsmRoadLabels?: boolean;
  backgroundFeatures?: readonly SyntheticBackgroundFeature[];
  linearFeatures?: readonly SyntheticLinearFeature[];
  sourceOverpassFixture?: unknown;
};

export type BuildSyntheticContextOptions = {
  sourceOverpassFixture?: unknown;
};

type RoadWithOptionalOsmMetadata = MapRoad & {
  metadata?: {
    source?: string;
    highway?: string;
    osmWayId?: string | number;
    rawTags?: OverpassTags;
  };
};

const labelTextWidthCache = new Map<string, number>();
const labelFontSizeCache = new Map<string, number>();
let labelTextWidthCacheHits = 0;
let labelTextWidthCacheMisses = 0;
let labelFontSizeCacheHits = 0;
let labelFontSizeCacheMisses = 0;

export function resetSyntheticLabelMeasurementCache(): void {
  labelTextWidthCache.clear();
  labelFontSizeCache.clear();
  labelTextWidthCacheHits = 0;
  labelTextWidthCacheMisses = 0;
  labelFontSizeCacheHits = 0;
  labelFontSizeCacheMisses = 0;
}

export function getSyntheticLabelMeasurementCacheStats(): SyntheticLabelMeasurementCacheStats {
  return {
    widthCacheSize: labelTextWidthCache.size,
    fontSizeCacheSize: labelFontSizeCache.size,
    widthCacheHits: labelTextWidthCacheHits,
    widthCacheMisses: labelTextWidthCacheMisses,
    fontSizeCacheHits: labelFontSizeCacheHits,
    fontSizeCacheMisses: labelFontSizeCacheMisses
  };
}

function osmRoadMetadata(road: MapRoad): RoadWithOptionalOsmMetadata["metadata"] | null {
  const metadata = (road as RoadWithOptionalOsmMetadata).metadata;

  return metadata?.source === "osm" ? metadata : null;
}

function isOsmMap(map: MapDefinition): boolean {
  const metadata = (map as { metadata?: { source?: unknown } }).metadata;

  return metadata?.source === "osm" || map.roads.some((road) => osmRoadMetadata(road) !== null);
}

export function deriveOsmRoadVisualHierarchy(road: MapRoad): OsmRoadVisualHierarchy | null {
  const highway = osmRoadMetadata(road)?.highway;

  if (!highway) {
    return osmRoadMetadata(road) ? "unknown" : null;
  }

  if (highway === "trunk" || highway === "trunk_link" || highway === "primary" || highway === "primary_link") {
    return "primary";
  }

  if (highway === "secondary" || highway === "secondary_link") {
    return "secondary";
  }

  if (highway === "tertiary" || highway === "tertiary_link") {
    return "tertiary";
  }

  if (highway === "service") {
    return "service";
  }

  if (highway === "footway" || highway === "cycleway" || highway === "path" || highway === "pedestrian") {
    return "pedestrian";
  }

  if (highway === "residential" || highway === "living_street" || highway === "unclassified") {
    return "residential";
  }

  if (highway === "construction" || highway === "proposed" || highway === "platform") {
    return "inactive";
  }

  return "unknown";
}

export function deriveOsmRoadRenderMetadata(road: MapRoad): OsmRoadRenderMetadata | null {
  const metadata = osmRoadMetadata(road);

  if (!metadata) {
    return null;
  }

  return {
    source: "osm",
    highway: metadata.highway ?? null,
    hierarchy: deriveOsmRoadVisualHierarchy(road) ?? "unknown",
    osmWayId: typeof metadata.osmWayId === "string" || typeof metadata.osmWayId === "number" ? String(metadata.osmWayId) : null
  };
}

function roadClassFromOsmHighway(road: MapRoad): SyntheticRoadClass | null {
  const hierarchy = deriveOsmRoadVisualHierarchy(road);

  if (!hierarchy) {
    return null;
  }

  if (hierarchy === "primary") {
    return "major";
  }

  if (hierarchy === "secondary" || hierarchy === "tertiary") {
    return "secondary";
  }

  if (hierarchy === "service") {
    return "service";
  }

  if (hierarchy === "pedestrian" || hierarchy === "inactive" || hierarchy === "restricted") {
    return "service";
  }

  return "local";
}

function cloneRoadStyle(style: TopopassRoadStyleToken): SyntheticRoadStyle {
  return {
    casingColor: style.casingColor,
    strokeColor: style.strokeColor,
    casingWidth: style.casingWidth,
    strokeWidth: style.strokeWidth,
    ...(style.dash ? { dash: [...style.dash] } : {}),
    ...(typeof style.alpha === "number" ? { alpha: style.alpha } : {})
  };
}

type TopopassRoadStyleToken = {
  casingColor: string;
  strokeColor: string;
  casingWidth: number;
  strokeWidth: number;
  dash?: readonly number[];
  alpha?: number;
};

export function deriveSyntheticRoadClass(map: MapDefinition, road: MapRoad): SyntheticRoadClass {
  const thresholds = TOPOPASS_STREET_ATLAS_STYLE.roads.syntheticThresholds;

  if (hasRoadClosedRestriction(map, road.id)) {
    return "restricted";
  }

  if (hasNoEntryRestriction(map, road.id)) {
    return "no-entry";
  }

  const osmRoadClass = roadClassFromOsmHighway(road);

  if (osmRoadClass) {
    return osmRoadClass;
  }

  if (road.isOneWay) {
    return "one-way";
  }

  if (road.distanceMeters >= thresholds.majorMinDistanceMeters) {
    return "major";
  }

  if (road.distanceMeters >= thresholds.secondaryMinDistanceMeters) {
    return "secondary";
  }

  if (road.distanceMeters <= thresholds.serviceMaxDistanceMeters) {
    return "service";
  }

  return "local";
}

export function roadStyleForOsmHierarchy(hierarchy: OsmRoadVisualHierarchy): SyntheticRoadStyle {
  if (hierarchy === "primary") {
    return cloneRoadStyle(TOPOPASS_STREET_ATLAS_STYLE.roads.osm.primary);
  }

  if (hierarchy === "secondary" || hierarchy === "tertiary") {
    return cloneRoadStyle(TOPOPASS_STREET_ATLAS_STYLE.roads.osm[hierarchy]);
  }

  if (hierarchy === "service") {
    return cloneRoadStyle(TOPOPASS_STREET_ATLAS_STYLE.roads.osm.service);
  }

  if (hierarchy === "pedestrian") {
    return cloneRoadStyle(TOPOPASS_STREET_ATLAS_STYLE.roads.osm.pedestrian);
  }

  if (hierarchy === "restricted") {
    return cloneRoadStyle(TOPOPASS_STREET_ATLAS_STYLE.roads.osm.restricted);
  }

  if (hierarchy === "inactive") {
    return cloneRoadStyle(TOPOPASS_STREET_ATLAS_STYLE.roads.osm.inactive);
  }

  if (hierarchy === "residential") {
    return cloneRoadStyle(TOPOPASS_STREET_ATLAS_STYLE.roads.osm.residential);
  }

  return cloneRoadStyle(TOPOPASS_STREET_ATLAS_STYLE.roads.osm.unknown);
}

export function roadStyleForSyntheticClass(roadClass: SyntheticRoadClass): SyntheticRoadStyle {
  if (roadClass === "major") {
    return cloneRoadStyle(TOPOPASS_STREET_ATLAS_STYLE.roads.synthetic.major);
  }

  if (roadClass === "secondary") {
    return cloneRoadStyle(TOPOPASS_STREET_ATLAS_STYLE.roads.synthetic.secondary);
  }

  if (roadClass === "one-way") {
    return cloneRoadStyle(TOPOPASS_STREET_ATLAS_STYLE.roads.synthetic.oneWay);
  }

  if (roadClass === "no-entry") {
    return cloneRoadStyle(TOPOPASS_STREET_ATLAS_STYLE.roads.synthetic.noEntry);
  }

  if (roadClass === "restricted") {
    return cloneRoadStyle(TOPOPASS_STREET_ATLAS_STYLE.roads.synthetic.restricted);
  }

  if (roadClass === "service") {
    return cloneRoadStyle(TOPOPASS_STREET_ATLAS_STYLE.roads.synthetic.service);
  }

  return cloneRoadStyle(TOPOPASS_STREET_ATLAS_STYLE.roads.synthetic.local);
}

export function roadRenderRank(visual: Pick<SyntheticRoadVisual, "roadClass" | "osmHierarchy">): number {
  if (visual.roadClass === "restricted" || visual.roadClass === "no-entry" || visual.osmHierarchy === "inactive") {
    return 0;
  }

  if (visual.osmHierarchy === "service" || visual.osmHierarchy === "pedestrian" || visual.roadClass === "service") {
    return 1;
  }

  if (visual.osmHierarchy === "residential" || visual.osmHierarchy === "unknown" || visual.roadClass === "local") {
    return 2;
  }

  if (visual.osmHierarchy === "tertiary") {
    return 3;
  }

  if (visual.osmHierarchy === "secondary" || visual.roadClass === "secondary" || visual.roadClass === "one-way") {
    return 4;
  }

  return 5;
}

export function sortRoadVisualsForBaseRender(roadVisuals: readonly SyntheticRoadVisual[]): SyntheticRoadVisual[] {
  return [...roadVisuals].sort(
    (left, right) =>
      roadRenderRank(left) - roadRenderRank(right) ||
      left.name.localeCompare(right.name) ||
      left.roadId.localeCompare(right.roadId)
  );
}

export function buildRoadRenderPasses(roadVisuals: readonly SyntheticRoadVisual[]): SyntheticRoadRenderPass[] {
  const orderedRoadVisuals = sortRoadVisualsForBaseRender(roadVisuals);

  return [
    ...orderedRoadVisuals.map((visual) => ({ layer: "casing" as const, visual })),
    ...orderedRoadVisuals.map((visual) => ({ layer: "fill" as const, visual }))
  ];
}

const roadJunctionCapsCache = new WeakMap<readonly SyntheticRoadVisual[], SyntheticRoadJunctionCap[]>();

export function buildRoadJunctionCaps(roadVisuals: readonly SyntheticRoadVisual[]): SyntheticRoadJunctionCap[] {
  const cached = roadJunctionCapsCache.get(roadVisuals);

  if (cached) {
    return cached;
  }

  const endpointsByJoin = new Map<string, Array<{ point: Vec2; visual: SyntheticRoadVisual }>>();

  for (const visual of roadVisuals) {
    if (!visual.osmWayId || visual.points.length < 2) {
      continue;
    }

    const continuityKey = roadContinuityKey(visual);

    for (const point of [visual.points[0], visual.points[visual.points.length - 1]]) {
      const joinKey = `${continuityKey}:${roadPointKey(point)}`;
      const endpoints = endpointsByJoin.get(joinKey) ?? [];
      endpoints.push({ point, visual });
      endpointsByJoin.set(joinKey, endpoints);
    }
  }

  const caps = [...endpointsByJoin.values()]
    .flatMap((endpoints) => {
      const ordered = [...endpoints].sort(
        (left, right) =>
          roadRenderRank(left.visual) - roadRenderRank(right.visual) ||
          left.visual.name.localeCompare(right.visual.name) ||
          left.visual.roadId.localeCompare(right.visual.roadId)
      );
      const roadIds = [...new Set(ordered.map((endpoint) => endpoint.visual.roadId))].sort((left, right) =>
        left.localeCompare(right)
      );
      const representative = ordered[ordered.length - 1];

      if (!representative || roadIds.length < 2 || !representative.visual.osmWayId) {
        return [];
      }

      return [{
        id: `road-join-${representative.visual.osmWayId}-${roadPointKey(representative.point)}`,
        point: { ...representative.point },
        visual: representative.visual,
        roadIds,
        osmWayId: representative.visual.osmWayId
      }];
    })
    .sort(
      (left, right) =>
        roadRenderRank(left.visual) - roadRenderRank(right.visual) ||
        left.osmWayId.localeCompare(right.osmWayId) ||
        left.point.x - right.point.x ||
        left.point.y - right.point.y ||
        left.id.localeCompare(right.id)
    );

  roadJunctionCapsCache.set(roadVisuals, caps);

  return caps;
}

function roadContinuityKey(visual: SyntheticRoadVisual): string {
  const style = visual.style;

  return [
    visual.osmWayId ?? "",
    visual.roadClass,
    visual.osmHierarchy ?? "",
    style.casingColor,
    style.strokeColor,
    style.casingWidth,
    style.strokeWidth,
    style.alpha ?? 1,
    style.dash?.join(",") ?? ""
  ].join(":");
}

function roadPointKey(point: Vec2): string {
  const x = Object.is(point.x, -0) ? 0 : point.x;
  const y = Object.is(point.y, -0) ? 0 : point.y;

  return `${x},${y}`;
}

export function roadStyleForViewport(
  visual: SyntheticRoadVisual,
  viewport: ScreenMapViewport,
  currentZoom?: number
): SyntheticRoadStyle {
  const style = {
    ...visual.style,
    ...(visual.style.dash ? { dash: [...visual.style.dash] } : {})
  };
  const geometry = TOPOPASS_STREET_ATLAS_STYLE.roads.geometry;
  const viewportScale = syntheticMapViewportScale(viewport);

  const rank = roadRenderRank(visual);

  if (viewportScale < geometry.lowZoomViewportScale) {
    if (rank <= 0) {
      style.alpha = (style.alpha ?? 1) * geometry.restrictedLowZoomAlphaMultiplier;
    } else if (rank === 1) {
      style.casingWidth *= geometry.serviceLowZoomWidthMultiplier;
      style.strokeWidth *= geometry.serviceLowZoomWidthMultiplier;
      style.alpha = (style.alpha ?? 1) * geometry.serviceLowZoomAlphaMultiplier;
    } else if (rank === 2) {
      style.casingWidth *= geometry.minorLowZoomWidthMultiplier;
      style.strokeWidth *= geometry.minorLowZoomWidthMultiplier;
      style.alpha = (style.alpha ?? 1) * geometry.minorLowZoomAlphaMultiplier;
    }
  }

  const widthScale = cartographicRoadScaleForVisual(visual, viewport, currentZoom);

  return {
    ...style,
    casingWidth: style.casingWidth * widthScale,
    strokeWidth: style.strokeWidth * widthScale
  };
}

export function roadJunctionRadiusForVisual(
  visual: SyntheticRoadVisual,
  viewport: ScreenMapViewport,
  layer: SyntheticRoadRenderLayer,
  currentZoom?: number
): number {
  const style = roadStyleForViewport(visual, viewport, currentZoom);
  const lineWidth = layer === "casing" ? style.casingWidth : style.strokeWidth;
  const rank = roadRenderRank(visual);
  const junctions = TOPOPASS_STREET_ATLAS_STYLE.roads.junctions;
  const radiusMultiplier =
    rank >= 5
      ? junctions.majorRadiusMultiplier
      : rank >= 4
        ? junctions.secondaryRadiusMultiplier
        : rank >= 2
          ? junctions.minorRadiusMultiplier
          : junctions.quietRadiusMultiplier;

  return lineWidth * radiusMultiplier;
}

export function roadInteractionStyleForState(state: SyntheticRoadInteractionState): TopopassRoadInteractionStyle {
  const style = TOPOPASS_STREET_ATLAS_STYLE.roads.interaction[state];

  return { ...style };
}

export function buildSyntheticRoadVisuals(map: MapDefinition): SyntheticRoadVisual[] {
  return map.roads.flatMap((road) => {
    const endpoints = roadEndpoints(map, road);

    if (!endpoints) {
      return [];
    }

    const roadClass = deriveSyntheticRoadClass(map, road);
    const label = deriveRoadLabelPosition(map, road);
    const osmMetadata = deriveOsmRoadRenderMetadata(road);
    const sourceTags = (road as RoadWithOptionalOsmMetadata).metadata?.rawTags;
    const style =
      roadClass === "restricted" || roadClass === "no-entry"
        ? roadStyleForSyntheticClass(roadClass)
        : osmMetadata
          ? roadStyleForOsmHierarchy(osmMetadata.hierarchy)
          : roadStyleForSyntheticClass(roadClass);

    return [
      {
        roadId: road.id,
        name: road.name ?? road.id,
        roadClass,
        source: osmMetadata ? "osm" : "synthetic",
        ...(osmMetadata?.highway ? { osmHighway: osmMetadata.highway } : {}),
        ...(osmMetadata ? { osmHierarchy: osmMetadata.hierarchy } : {}),
        ...(osmMetadata?.osmWayId ? { osmWayId: osmMetadata.osmWayId } : {}),
        ...(sourceTags ? { osmSourceTags: { ...sourceTags } } : {}),
        points: [endpoints.from, endpoints.to],
        midpoint: midpoint(endpoints.from, endpoints.to),
        labelAngleRadians: label?.angleRadians ?? 0,
        isOneWay: road.isOneWay,
        hasNoEntryRestriction: hasNoEntryRestriction(map, road.id),
        hasRoadClosedRestriction: hasRoadClosedRestriction(map, road.id),
        style
      }
    ];
  });
}

export function deriveRoadLabelPosition(
  map: MapDefinition,
  road: MapRoad
): { point: Vec2; angleRadians: number } | null {
  const endpoints = roadEndpoints(map, road);

  if (!endpoints) {
    return null;
  }

  return {
    point: midpoint(endpoints.from, endpoints.to),
    angleRadians: Math.atan2(endpoints.to.y - endpoints.from.y, endpoints.to.x - endpoints.from.x)
  };
}

export function buildSyntheticMapLabels(
  map: MapDefinition,
  exercise?: RouteExercise,
  options: BuildSyntheticMapLabelOptions = {}
): SyntheticMapLabel[] {
  const labels: SyntheticMapLabel[] = [];
  const roadVisuals = buildSyntheticRoadVisuals(map);
  const contextFeatures = options.sourceOverpassFixture
    ? buildRealLondonContextFeatures(map, options.sourceOverpassFixture)
    : [];

  for (const visual of roadVisuals) {
    if (visual.source === "osm") {
      continue;
    }

    if (visual.roadClass === "service") {
      continue;
    }

    labels.push({
      id: `road-label-${visual.roadId}`,
      kind: "road",
      text: visual.name,
      point: { ...visual.midpoint },
      angleRadians: visual.labelAngleRadians,
      priority: roadLabelPriority(visual.roadClass, visual.osmHierarchy),
      roadClass: visual.roadClass,
      ...(visual.osmHierarchy ? { osmHierarchy: visual.osmHierarchy } : {}),
      source: visual.source,
      roadLengthMeters: roadVisualLength(visual),
      category: atlasRoadLabelCategory(visual),
      sourceMetadata: mapDefinitionLabelSource(visual.roadId)
    });
  }

  if (options.includeOsmRoadLabels) {
    labels.push(...buildOsmRoadLabels(roadVisuals));
  }

  for (const feature of options.backgroundFeatures ?? buildSyntheticBackgroundFeatures(map)) {
    if (!feature.label || (contextFeatures.length > 0 && feature.id.startsWith("osm-context-"))) {
      continue;
    }

    const kind = contextLabelKindForBackgroundFeature(feature);

    labels.push({
      id: `${kind}-label-${feature.id}`,
      kind,
      text: feature.label,
      point: polygonCenter(feature.points),
      priority: contextLabelPriority(kind),
      category: atlasCategoryForContextKind(kind),
      sourceMetadata: mapDefinitionLabelSource(feature.id)
    });
  }

  for (const feature of options.linearFeatures ?? buildSyntheticLinearFeatures(map)) {
    if (!feature.label || (contextFeatures.length > 0 && feature.id.startsWith("osm-context-"))) {
      continue;
    }

    const kind = contextLabelKindForLinearFeature(feature);

    labels.push({
      id: `${kind}-label-${feature.id}`,
      kind,
      text: feature.label,
      point: polylineCenter(feature.points),
      priority: contextLabelPriority(kind),
      category: atlasCategoryForContextKind(kind),
      sourceMetadata: mapDefinitionLabelSource(feature.id)
    });
  }

  labels.push(...buildOsmContextLabels(contextFeatures, roadVisuals));

  const labelledLandmarks = buildSyntheticLandmarkVisuals(map, exercise, {
    sourceOverpassFixture: options.sourceOverpassFixture
  }).filter((visual) => shouldLabelLandmark(visual) && !(contextFeatures.length > 0 && visual.id.startsWith("osm-")));

  for (const visual of labelledLandmarks) {
    const kind = contextLabelKindForLandmarkVisual(visual);

    labels.push({
      id: `${kind}-label-${visual.id}`,
      kind,
      text: visual.label,
      point: { x: visual.point.x, y: visual.point.y - 18 },
      priority: visual.isExerciseStop ? contextLabelPriority("station") : contextLabelPriority(kind),
      category: atlasCategoryForContextKind(kind),
      sourceMetadata: mapDefinitionLabelSource(visual.id)
    });
  }

  if (exercise) {
    exercise.stops.forEach((stop, index) => {
      const point = resolveRouteStopPoint(map, stop);

      if (!point) {
        return;
      }

      const isStart = index === 0;
      const isFinish = index === exercise.stops.length - 1;

      labels.push({
        id: `exercise-stop-label-${exercise.id}-${index}`,
        kind: isStart ? "start" : isFinish ? "finish" : "checkpoint",
        text: isStart
          ? TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.start.text
          : isFinish
            ? TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.destination.text
            : `CHECKPOINT ${index}`,
        point,
        priority: TOPOPASS_STREET_ATLAS_STYLE.labels.priorities.exerciseStop,
        category: "learner-overlay",
        sourceMetadata: {
          provider: "exercise",
          featureId: `${exercise.id}:${index}`
        }
      });
    });
  }

  return dedupeContextMapLabels(labels).sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
}

const orderedAtlasLabelCoverageKeys: Array<keyof SyntheticAtlasLabelCoverageCounts> = [
  "roadReferenceLabels",
  "districtLabels",
  "majorRoadLabels",
  "stationLabels",
  "landmarkLabels",
  "localRoadLabels",
  "parkLabels",
  "estateLabels",
  "waterLabels",
  "institutionLabels",
  "contextualLandUseLabels"
];

export function auditSyntheticAtlasLabelCoverage(
  labels: readonly Pick<SyntheticMapLabel, "category">[]
): SyntheticAtlasLabelCoverageAudit {
  const counts: SyntheticAtlasLabelCoverageCounts = {
    roadReferenceLabels: 0,
    districtLabels: 0,
    majorRoadLabels: 0,
    stationLabels: 0,
    landmarkLabels: 0,
    localRoadLabels: 0,
    parkLabels: 0,
    estateLabels: 0,
    waterLabels: 0,
    institutionLabels: 0,
    contextualLandUseLabels: 0
  };
  const countKeyByCategory: Partial<Record<SyntheticAtlasLabelCategory, keyof SyntheticAtlasLabelCoverageCounts>> = {
    "road-reference": "roadReferenceLabels",
    district: "districtLabels",
    "major-road": "majorRoadLabels",
    station: "stationLabels",
    landmark: "landmarkLabels",
    "local-road": "localRoadLabels",
    park: "parkLabels",
    estate: "estateLabels",
    water: "waterLabels",
    institution: "institutionLabels",
    "contextual-land-use": "contextualLandUseLabels"
  };

  for (const label of labels) {
    const key = label.category ? countKeyByCategory[label.category] : undefined;

    if (key) {
      counts[key] += 1;
    }
  }

  return {
    counts,
    orderedCategories: orderedAtlasLabelCoverageKeys.map((id) => ({ id, count: counts[id] }))
  };
}

export function roadLabelTier(label: Pick<SyntheticMapLabel, "roadClass" | "osmHierarchy">): SyntheticRoadLabelTier {
  if (label.roadClass === "restricted" || label.roadClass === "no-entry" || label.osmHierarchy === "inactive") {
    return "restricted";
  }

  if (label.roadClass === "service" || label.osmHierarchy === "service" || label.osmHierarchy === "pedestrian") {
    return "service";
  }

  if (label.roadClass === "major" || label.osmHierarchy === "primary") {
    return "major";
  }

  if (label.roadClass === "secondary" || label.roadClass === "one-way" || label.osmHierarchy === "secondary" || label.osmHierarchy === "tertiary") {
    return "secondary";
  }

  return "minor";
}

export function labelStyleForSyntheticMapLabel(
  label: SyntheticMapLabel,
  viewport?: ScreenMapViewport,
  currentZoom?: number
): TopopassLabelStyle | TopopassRoadLabelStyle | TopopassContextLabelStyle {
  if (label.kind === "road") {
    return scaleLabelStyleForViewport(
      TOPOPASS_STREET_ATLAS_STYLE.labels.roadHierarchy[roadLabelTier(label)],
      cartographicLabelScaleForTier(roadLabelTier(label), viewport, currentZoom),
      viewport
    );
  }

  if (isContextMapLabelKind(label.kind)) {
    return scaleLabelStyleForViewport(
      TOPOPASS_STREET_ATLAS_STYLE.labels.context[label.kind],
      cartographicLabelScaleForTier("context", viewport, currentZoom),
      viewport
    );
  }

  if (label.kind === "start") {
    return stopMarkerLabelStyleForKind(
      "start",
      TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markerLabels.start,
      viewport,
      currentZoom
    );
  }

  if (label.kind === "finish") {
    return stopMarkerLabelStyleForKind(
      "finish",
      TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markerLabels.destination,
      viewport,
      currentZoom
    );
  }

  if (label.kind === "checkpoint") {
    return stopMarkerLabelStyleForKind(
      "checkpoint",
      TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markerLabels.checkpoint,
      viewport,
      currentZoom
    );
  }

  return scaleLabelStyleForViewport(
    TOPOPASS_STREET_ATLAS_STYLE.labels.stop,
    cartographicLabelScaleForTier("stop", viewport, currentZoom),
    viewport
  );
}

type StopMarkerLabelKind = "start" | "finish" | "checkpoint";

function stopMarkerAssetForLabelKind(kind: StopMarkerLabelKind): TopopassMarkerAssetStyle | undefined {
  if (kind === "start") {
    return TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.start.asset;
  }

  if (kind === "finish") {
    return TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.destination.asset;
  }

  return TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.checkpointBase.asset;
}

function stopMarkerLabelStyleForKind(
  kind: StopMarkerLabelKind,
  style: TopopassLabelStyle,
  viewport?: ScreenMapViewport,
  currentZoom?: number
): TopopassLabelStyle {
  const scaledStyle = scaleLabelStyleForViewport(
    style,
    cartographicLabelScaleForTier("stop", viewport, currentZoom),
    viewport
  );
  const asset = stopMarkerAssetForLabelKind(kind);

  if (!asset) {
    return scaledStyle;
  }

  const assetScale = cartographicCustomMarkerAssetScaleForZoom(currentZoom ?? 1);
  const markerTopOffset = -((asset.anchorY / asset.sourceHeight) * asset.displayHeight * assetScale);
  const bubble = TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.labelBubble;
  const bubbleHeight = labelFontSize(scaledStyle) + bubble.paddingY * 2;
  const spacing = kind === "checkpoint" ? 4 : 5;

  return {
    ...scaledStyle,
    yOffset: markerTopOffset - spacing - bubbleHeight / 2
  };
}

export function filterSyntheticMapLabelsForViewport(
  options: FilterSyntheticMapLabelsOptions
): SyntheticMapLabel[] {
  const placedBoxes: SyntheticLabelCollisionBox[] = [...(options.reservedBoxes ?? [])];
  const acceptedLabels: SyntheticMapLabel[] = [];
  const roadLabelPointsByText = new Map<string, Vec2[]>();
  const roadReferencePointsByText = new Map<string, Vec2[]>();
  const acceptedRoadReferenceCounts = new Map<"a-road" | "b-road", number>();
  const viewportScale = syntheticMapViewportScale(options.viewport);
  let acceptedRoadReferenceCount = 0;
  const sortedLabels = [...options.labels].sort(compareLabelsForLayout);
  const roadReferenceLabels = sortedLabels.filter((label) => label.kind === "road_reference");
  const otherLabels = sortedLabels.filter((label) => label.kind !== "road_reference");

  const acceptLabel = (label: SyntheticMapLabel): boolean => {
    if (
      label.kind === "road" &&
      !shouldShowRoadLabel(label, options.viewport, viewportScale, roadLabelPointsByText, options.currentZoom)
    ) {
      return false;
    }

    if (isContextMapLabelKind(label.kind) && !shouldShowContextLabel(label, viewportScale)) {
      return false;
    }

    if (label.kind === "road_reference") {
      const roadReferenceClass = label.roadReferenceClass ?? (label.text.startsWith("B") ? "b-road" : "a-road");
      const collision = TOPOPASS_STREET_ATLAS_STYLE.labels.collision;
      const maxForViewport = roadReferenceBudgetForViewport(options.currentZoom, viewportScale);
      const acceptedForText = roadReferencePointsByText.get(label.text.toLowerCase())?.length ?? 0;

      if (
        acceptedRoadReferenceCount >= maxForViewport ||
        (acceptedRoadReferenceCounts.get(roadReferenceClass) ?? 0) >= collision.roadReferenceMaxPerClass[roadReferenceClass] ||
        acceptedForText >= collision.roadReferenceMaxPerText
      ) {
        return false;
      }

      if (!shouldShowRoadReferenceLabel(label, options.viewport, roadReferencePointsByText)) {
        return false;
      }
    }

    const box = labelCollisionBox(label, options.viewport, options.currentZoom);

    if (!boxFitsWithinViewport(box, options.viewport)) {
      return false;
    }

    if (placedBoxes.some((placedBox) => boxesIntersect(placedBox, box))) {
      return false;
    }

    placedBoxes.push(box);
    acceptedLabels.push(label);

    if (label.kind === "road") {
      const key = label.text.toLowerCase();
      const screenPoint = mapToScreenPoint(label.point, options.viewport);
      const points = roadLabelPointsByText.get(key) ?? [];

      points.push(screenPoint);
      roadLabelPointsByText.set(key, points);
    }

    if (label.kind === "road_reference") {
      const key = label.text.toLowerCase();
      const points = roadReferencePointsByText.get(key) ?? [];

      points.push(mapToScreenPoint(label.point, options.viewport));
      roadReferencePointsByText.set(key, points);
      acceptedRoadReferenceCount += 1;
      const roadReferenceClass = label.roadReferenceClass ?? (label.text.startsWith("B") ? "b-road" : "a-road");
      acceptedRoadReferenceCounts.set(roadReferenceClass, (acceptedRoadReferenceCounts.get(roadReferenceClass) ?? 0) + 1);
    }
    return true;
  };

  const referenceGroups = buildRoadReferenceLayoutGroups(
    roadReferenceLabels,
    options.viewport,
    options.currentZoom
  );

  for (const group of referenceGroups) {
    for (const candidate of group.candidates) {
      candidate.attempted = true;
      const accepted = candidate.placements.some((placement) => acceptLabel(placement.label));

      if (accepted) {
        candidate.accepted = true;
        break;
      }
    }
  }

  const collision = TOPOPASS_STREET_ATLAS_STYLE.labels.collision;
  let repeatPassAttemptedCandidate = true;

  while (
    repeatPassAttemptedCandidate &&
    acceptedRoadReferenceCount < roadReferenceBudgetForViewport(options.currentZoom, viewportScale)
  ) {
    repeatPassAttemptedCandidate = false;

    for (const group of referenceGroups) {
      if ((roadReferencePointsByText.get(group.key)?.length ?? 0) >= collision.roadReferenceMaxPerText) continue;

      const candidate = group.candidates.find(
        (item) => !item.attempted && item.maxVisibleSegmentLength >= collision.roadReferenceRepeatMinimumVisibleSegmentLength
      );

      if (!candidate) continue;

      candidate.attempted = true;
      candidate.accepted = candidate.placements.some((placement) => acceptLabel(placement.label));
      repeatPassAttemptedCandidate = true;
    }
  }

  for (const label of otherLabels) {
    acceptLabel(label);
  }

  return acceptedLabels.sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
}

export function filterSyntheticLandmarkVisualsForViewport(
  options: FilterSyntheticLandmarkVisualsOptions
): SyntheticLandmarkVisual[] {
  const criticalLabelBoxes = (options.reservedLabels ?? [])
    .filter((label) => label.kind === "road" || label.kind === "road_reference" || label.kind === "district")
    .map((label) => labelCollisionBox(label, options.viewport, options.currentZoom));
  const placedBoxes: SyntheticLabelCollisionBox[] = [...(options.reservedBoxes ?? []), ...criticalLabelBoxes];
  const acceptedVisuals: SyntheticLandmarkVisual[] = [];
  const acceptedByKind = new Map<TopopassAtlasSymbolKind, number>();
  const maxForViewport = isPhoneAtlasViewport(options.viewport)
    ? TOPOPASS_STREET_ATLAS_STYLE.atlasSymbols.mobileMaxPerViewport
    : TOPOPASS_STREET_ATLAS_STYLE.atlasSymbols.maxPerViewport;

  for (const visual of [...options.visuals].sort(compareLandmarkVisualsForLayout)) {
    if (!shouldShowSyntheticLandmarkVisualForViewport(visual, options.viewport)) {
      continue;
    }

    const box = landmarkVisualCollisionBox(visual, options.viewport, options.currentZoom);
    const symbolKind = atlasSymbolKindForVisual(visual);
    const style = TOPOPASS_STREET_ATLAS_STYLE.atlasSymbols.styles[symbolKind];

    if (acceptedVisuals.length >= maxForViewport || (acceptedByKind.get(symbolKind) ?? 0) >= style.maxPerViewport) {
      continue;
    }

    if (!symbolBoxFitsWithinViewport(box, options.viewport)) {
      continue;
    }

    const screenPoint = mapToScreenPoint(visual.point, options.viewport);
    const isTooClose = acceptedVisuals.some((accepted) => {
      const acceptedKind = atlasSymbolKindForVisual(accepted);

      if (acceptedKind !== symbolKind) {
        return false;
      }

      return distanceBetweenPoints(screenPoint, mapToScreenPoint(accepted.point, options.viewport)) < style.minSpacingPixels;
    });

    if (isTooClose) {
      continue;
    }

    if (placedBoxes.some((placedBox) => boxesIntersect(placedBox, box))) {
      continue;
    }

    placedBoxes.push(box);
    acceptedVisuals.push(visual);
    acceptedByKind.set(symbolKind, (acceptedByKind.get(symbolKind) ?? 0) + 1);
  }

  return acceptedVisuals.sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
}

export function shouldShowSyntheticLinearFeatureForViewport(
  feature: SyntheticLinearFeature,
  viewport: ScreenMapViewport
): boolean {
  const style = contextLineStyleForFeature(feature);

  return syntheticMapViewportScale(viewport) >= style.minViewportScale;
}

export function syntheticLinearFeatureAlphaForViewport(
  feature: SyntheticLinearFeature,
  viewport: ScreenMapViewport
): number {
  const style = contextLineStyleForFeature(feature);
  const scale = syntheticMapViewportScale(viewport);
  const decluttering = TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering;

  if (scale < decluttering.lowDetailViewportScale) {
    return style.lowZoomAlpha;
  }

  if (scale >= decluttering.highDetailViewportScale) {
    return style.highZoomAlpha;
  }

  return style.mediumZoomAlpha;
}

export function shouldShowSyntheticLandmarkVisualForViewport(
  visual: SyntheticLandmarkVisual,
  viewport: ScreenMapViewport
): boolean {
  if (visual.isExerciseStop) {
    return true;
  }

  return syntheticMapViewportScale(viewport) >= TOPOPASS_STREET_ATLAS_STYLE.atlasSymbols.styles[atlasSymbolKindForVisual(visual)].minViewportScale;
}

export function syntheticLandmarkVisualAlphaForViewport(
  visual: SyntheticLandmarkVisual,
  viewport: ScreenMapViewport
): number {
  if (visual.isExerciseStop) {
    return 1;
  }

  const scale = syntheticMapViewportScale(viewport);
  const decluttering = TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering;

  if (scale < decluttering.lowDetailViewportScale) {
    return 0.7;
  }

  if (scale >= decluttering.highDetailViewportScale) {
    return 1;
  }

  return 0.9;
}

function compareLabelsForLayout(left: SyntheticMapLabel, right: SyntheticMapLabel): number {
  const priorityDifference = left.priority - right.priority;

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  if (
    (left.kind === "road" && right.kind === "road") ||
    (left.kind === "road_reference" && right.kind === "road_reference")
  ) {
    const lengthDifference = (right.roadLengthMeters ?? 0) - (left.roadLengthMeters ?? 0);

    if (lengthDifference !== 0) {
      return lengthDifference;
    }
  }

  return left.id.localeCompare(right.id);
}

function compareLandmarkVisualsForLayout(left: SyntheticLandmarkVisual, right: SyntheticLandmarkVisual): number {
  const priorityDifference = left.priority - right.priority;

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  if (left.isExerciseStop !== right.isExerciseStop) {
    return left.isExerciseStop ? -1 : 1;
  }

  return left.id.localeCompare(right.id);
}

function contextLineStyleForFeature(feature: SyntheticLinearFeature) {
  if (feature.kind === "bridge" || feature.kind === "crossing") {
    return TOPOPASS_STREET_ATLAS_STYLE.contextFeatures.bridge;
  }

  if (feature.kind === "rail") {
    return TOPOPASS_STREET_ATLAS_STYLE.contextFeatures.rail;
  }

  return TOPOPASS_STREET_ATLAS_STYLE.background.water.linear;
}

export function atlasSymbolKindForVisual(visual: Pick<SyntheticLandmarkVisual, "kind" | "symbolKind">): TopopassAtlasSymbolKind {
  return visual.symbolKind ?? atlasSymbolKindForVisualKind(visual.kind);
}

function atlasSymbolKindForVisualKind(kind: SyntheticLandmarkVisualKind): TopopassAtlasSymbolKind {
  if (kind === "station") return "station";
  if (kind === "hospital") return "hospital";
  if (kind === "religious" || kind === "church") return "religious";
  if (kind === "education") return "education";
  if (kind === "civic" || kind === "public-building") return "civic";
  if (kind === "museum") return "museum";
  if (kind === "market") return "market";
  if (kind === "parking") return "parking";
  if (kind === "pier" || kind === "dock") return "pier";
  if (kind === "important-landmark" || kind === "learner-reference") return "landmark";
  if (kind === "park" || kind === "open-space") return "open-space";
  return "generic";
}

export function syntheticMapViewportScale(viewport: ScreenMapViewport): number {
  const width = viewport.mapBounds.maxX - viewport.mapBounds.minX;
  const height = viewport.mapBounds.maxY - viewport.mapBounds.minY;
  const scaleX = width > 0 ? viewport.width / width : 0;
  const scaleY = height > 0 ? viewport.height / height : 0;
  const scale = Math.min(scaleX, scaleY);

  return Number.isFinite(scale) ? scale : 0;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function cartographicScaleInputForViewport(viewport: ScreenMapViewport, currentZoom?: number): number {
  const viewportScale = syntheticMapViewportScale(viewport);

  if (!Number.isFinite(currentZoom) || currentZoom === undefined || currentZoom <= 0) {
    return viewportScale;
  }

  return Math.max(viewportScale, currentZoom);
}

export function getZoomStyleScale(
  zoomScale: number,
  exponent: number,
  maxMultiplier: number,
  minMultiplier = 1
): number {
  const scaleTokens = TOPOPASS_STREET_ATLAS_STYLE.zoom.cartographicScale;
  const referenceScale = Math.max(0.000001, scaleTokens.referenceViewportScale);

  if (!Number.isFinite(zoomScale) || zoomScale <= 0) {
    return 1;
  }

  const normalizedScale = Math.max(zoomScale / referenceScale, 1);
  const multiplier = Math.pow(normalizedScale, exponent);

  return clampNumber(multiplier, minMultiplier, maxMultiplier);
}

function roadScaleTierForVisual(visual: Pick<SyntheticRoadVisual, "roadClass" | "osmHierarchy">): SyntheticCartographicRoadScaleTier {
  const rank = roadRenderRank(visual);

  if (rank <= 0) {
    return "restricted";
  }

  if (rank === 1) {
    return "service";
  }

  if (rank <= 3) {
    return "local";
  }

  if (rank === 4) {
    return "secondary";
  }

  return "major";
}

export function cartographicRoadScaleForVisual(
  visual: Pick<SyntheticRoadVisual, "roadClass" | "osmHierarchy">,
  viewport: ScreenMapViewport,
  currentZoom?: number
): number {
  const scaleTokens = TOPOPASS_STREET_ATLAS_STYLE.zoom.cartographicScale;
  const tier = roadScaleTierForVisual(visual);

  return getZoomStyleScale(
    cartographicScaleInputForViewport(viewport, currentZoom),
    scaleTokens.roadGain[tier],
    scaleTokens.roadMaxMultiplier[tier],
    tier === "major" ? 1 : scaleTokens.roadMinMultiplier
  );
}

export function cartographicLabelScaleForTier(
  tier: SyntheticCartographicLabelScaleTier,
  viewport?: ScreenMapViewport,
  currentZoom?: number
): number {
  if (!viewport) {
    return 1;
  }

  const scaleTokens = TOPOPASS_STREET_ATLAS_STYLE.zoom.cartographicScale;

  return getZoomStyleScale(
    cartographicScaleInputForViewport(viewport, currentZoom),
    scaleTokens.labelGain[tier],
    scaleTokens.labelMaxMultiplier[tier]
  );
}

export function cartographicMarkerScaleForViewport(viewport: ScreenMapViewport, currentZoom?: number): number {
  const scaleTokens = TOPOPASS_STREET_ATLAS_STYLE.zoom.cartographicScale;

  return getZoomStyleScale(
    cartographicScaleInputForViewport(viewport, currentZoom),
    scaleTokens.markerGain,
    scaleTokens.markerMaxMultiplier
  );
}

export function cartographicRestrictionSymbolScaleForViewport(viewport: ScreenMapViewport, currentZoom?: number): number {
  const scaleTokens = TOPOPASS_STREET_ATLAS_STYLE.zoom.cartographicScale;

  return getZoomStyleScale(
    cartographicScaleInputForViewport(viewport, currentZoom),
    scaleTokens.restrictionGain,
    scaleTokens.restrictionMaxMultiplier
  );
}

export function cartographicRouteOverlayScaleForZoom(currentZoom: number): number {
  return cartographicCorrectRouteScaleForZoom(currentZoom);
}

export function cartographicDrawnAttemptScaleForZoom(currentZoom: number): number {
  const scaleTokens = TOPOPASS_STREET_ATLAS_STYLE.zoom.cartographicScale;
  const scaleInput = Number.isFinite(currentZoom) && currentZoom > 0 ? currentZoom : scaleTokens.referenceViewportScale;

  return getZoomStyleScale(scaleInput, scaleTokens.drawnAttemptGain, scaleTokens.drawnAttemptMaxMultiplier);
}

export function cartographicCorrectRouteScaleForZoom(currentZoom: number): number {
  const scaleTokens = TOPOPASS_STREET_ATLAS_STYLE.zoom.cartographicScale;
  const scaleInput = Number.isFinite(currentZoom) && currentZoom > 0 ? currentZoom : scaleTokens.referenceViewportScale;

  return getZoomStyleScale(scaleInput, scaleTokens.correctRouteGain, scaleTokens.correctRouteMaxMultiplier);
}

export function cartographicMistakeOverlayScaleForZoom(currentZoom: number): number {
  const scaleTokens = TOPOPASS_STREET_ATLAS_STYLE.zoom.cartographicScale;
  const scaleInput = Number.isFinite(currentZoom) && currentZoom > 0 ? currentZoom : scaleTokens.referenceViewportScale;

  return getZoomStyleScale(scaleInput, scaleTokens.mistakeOverlayGain, scaleTokens.mistakeOverlayMaxMultiplier);
}

export function cartographicReviewTextScaleForZoom(currentZoom: number): number {
  const scaleTokens = TOPOPASS_STREET_ATLAS_STYLE.zoom.cartographicScale;
  const scaleInput = Number.isFinite(currentZoom) && currentZoom > 0 ? currentZoom : scaleTokens.referenceViewportScale;

  return getZoomStyleScale(scaleInput, scaleTokens.reviewTextGain, scaleTokens.reviewTextMaxMultiplier);
}

export function cartographicLearnerMarkerScaleForZoom(currentZoom: number): number {
  const scaleTokens = TOPOPASS_STREET_ATLAS_STYLE.zoom.cartographicScale;
  const scaleInput = Number.isFinite(currentZoom) && currentZoom > 0 ? currentZoom : scaleTokens.referenceViewportScale;

  return getZoomStyleScale(scaleInput, scaleTokens.learnerMarkerGain, scaleTokens.learnerMarkerMaxMultiplier);
}

export function cartographicCustomMarkerAssetScaleForZoom(currentZoom: number): number {
  const scaleTokens = TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.assetZoomScale;
  const zoom = Number.isFinite(currentZoom) && currentZoom > 0 ? currentZoom : scaleTokens.lowZoom;

  if (zoom <= scaleTokens.lowZoom) {
    return scaleTokens.lowScale;
  }

  if (zoom <= scaleTokens.midZoom) {
    return interpolateScale(
      zoom,
      scaleTokens.lowZoom,
      scaleTokens.midZoom,
      scaleTokens.lowScale,
      scaleTokens.midScale
    );
  }

  if (zoom <= scaleTokens.baseZoom) {
    return interpolateScale(
      zoom,
      scaleTokens.midZoom,
      scaleTokens.baseZoom,
      scaleTokens.midScale,
      scaleTokens.baseScale
    );
  }

  if (zoom <= scaleTokens.highZoom) {
    return interpolateScale(
      zoom,
      scaleTokens.baseZoom,
      scaleTokens.highZoom,
      scaleTokens.baseScale,
      scaleTokens.highScale
    );
  }

  if (zoom <= scaleTokens.veryHighZoom) {
    return interpolateScale(
      zoom,
      scaleTokens.highZoom,
      scaleTokens.veryHighZoom,
      scaleTokens.highScale,
      scaleTokens.veryHighScale
    );
  }

  if (zoom <= scaleTokens.maxZoom) {
    return interpolateScale(
      zoom,
      scaleTokens.veryHighZoom,
      scaleTokens.maxZoom,
      scaleTokens.veryHighScale,
      scaleTokens.maxScale
    );
  }

  return scaleTokens.maxScale;
}

function interpolateScale(
  input: number,
  inputMin: number,
  inputMax: number,
  outputMin: number,
  outputMax: number
): number {
  const range = inputMax - inputMin;

  if (range <= 0) {
    return outputMax;
  }

  const progress = clampNumber((input - inputMin) / range, 0, 1);

  return outputMin + (outputMax - outputMin) * progress;
}

export function cartographicStyleScaleForZoom(currentZoom: number): {
  majorRoad: number;
  secondaryRoad: number;
  localRoad: number;
  serviceRoad: number;
  restrictedRoad: number;
  routeOverlay: number;
  drawnAttempt: number;
  correctRoute: number;
  mistakeOverlay: number;
  reviewText: number;
  learnerMarker: number;
  majorLabel: number;
  secondaryLabel: number;
  minorLabel: number;
  contextLabel: number;
  marker: number;
  restrictionSymbol: number;
} {
  const scaleTokens = TOPOPASS_STREET_ATLAS_STYLE.zoom.cartographicScale;
  const scaleInput = Number.isFinite(currentZoom) && currentZoom > 0 ? currentZoom : scaleTokens.referenceViewportScale;

  return {
    majorRoad: getZoomStyleScale(scaleInput, scaleTokens.roadGain.major, scaleTokens.roadMaxMultiplier.major),
    secondaryRoad: getZoomStyleScale(scaleInput, scaleTokens.roadGain.secondary, scaleTokens.roadMaxMultiplier.secondary),
    localRoad: getZoomStyleScale(
      scaleInput,
      scaleTokens.roadGain.local,
      scaleTokens.roadMaxMultiplier.local,
      scaleTokens.roadMinMultiplier
    ),
    serviceRoad: getZoomStyleScale(
      scaleInput,
      scaleTokens.roadGain.service,
      scaleTokens.roadMaxMultiplier.service,
      scaleTokens.roadMinMultiplier
    ),
    restrictedRoad: getZoomStyleScale(
      scaleInput,
      scaleTokens.roadGain.restricted,
      scaleTokens.roadMaxMultiplier.restricted,
      scaleTokens.roadMinMultiplier
    ),
    routeOverlay: cartographicRouteOverlayScaleForZoom(scaleInput),
    drawnAttempt: cartographicDrawnAttemptScaleForZoom(scaleInput),
    correctRoute: cartographicCorrectRouteScaleForZoom(scaleInput),
    mistakeOverlay: cartographicMistakeOverlayScaleForZoom(scaleInput),
    reviewText: cartographicReviewTextScaleForZoom(scaleInput),
    learnerMarker: cartographicLearnerMarkerScaleForZoom(scaleInput),
    majorLabel: getZoomStyleScale(scaleInput, scaleTokens.labelGain.major, scaleTokens.labelMaxMultiplier.major),
    secondaryLabel: getZoomStyleScale(
      scaleInput,
      scaleTokens.labelGain.secondary,
      scaleTokens.labelMaxMultiplier.secondary
    ),
    minorLabel: getZoomStyleScale(scaleInput, scaleTokens.labelGain.minor, scaleTokens.labelMaxMultiplier.minor),
    contextLabel: getZoomStyleScale(scaleInput, scaleTokens.labelGain.context, scaleTokens.labelMaxMultiplier.context),
    marker: getZoomStyleScale(scaleInput, scaleTokens.markerGain, scaleTokens.markerMaxMultiplier),
    restrictionSymbol: getZoomStyleScale(scaleInput, scaleTokens.restrictionGain, scaleTokens.restrictionMaxMultiplier)
  };
}

function roadLabelMinLengthMultiplierForViewport(viewportScale: number): number {
  const scaleTokens = TOPOPASS_STREET_ATLAS_STYLE.zoom.cartographicScale;

  if (viewportScale >= scaleTokens.veryHighZoomViewportScale) {
    return scaleTokens.veryHighZoomMinRoadLengthMultiplier;
  }

  if (viewportScale >= scaleTokens.highZoomViewportScale) {
    return scaleTokens.highZoomMinRoadLengthMultiplier;
  }

  return 1;
}

function scaleFontString(font: string, multiplier: number): string {
  return font.replace(/(\d+(?:\.\d+)?)px/, (_match, size: string) => `${Number(size) * multiplier}px`);
}

function scaleLabelStyleForViewport<
  T extends TopopassLabelStyle | TopopassRoadLabelStyle | TopopassContextLabelStyle
>(style: T, multiplier: number, viewport?: ScreenMapViewport): T {
  if (!viewport || Math.abs(multiplier - 1) < 0.000001) {
    return { ...style };
  }

  const scaleTokens = TOPOPASS_STREET_ATLAS_STYLE.zoom.cartographicScale;
  const haloMultiplier = Math.min(multiplier, scaleTokens.labelHaloMaxMultiplier);
  const collisionMultiplier = Math.min(multiplier, scaleTokens.labelCollisionMaxMultiplier);
  const scaledStyle = {
    ...style,
    font: scaleFontString(style.font, multiplier),
    haloWidth: style.haloWidth * haloMultiplier
  };

  if ("fontSize" in scaledStyle) {
    scaledStyle.fontSize *= multiplier;
  }

  if ("approximateCharacterWidth" in scaledStyle) {
    scaledStyle.approximateCharacterWidth *= multiplier;
  }

  if ("collisionPadding" in scaledStyle) {
    scaledStyle.collisionPadding *= collisionMultiplier;
  }

  return scaledStyle;
}

function shouldShowRoadLabel(
  label: SyntheticMapLabel,
  viewport: ScreenMapViewport,
  viewportScale: number,
  roadLabelPointsByText: ReadonlyMap<string, readonly Vec2[]>,
  currentZoom?: number
): boolean {
  const tier = roadLabelTier(label);
  const style = labelStyleForSyntheticMapLabel(label, viewport, currentZoom) as TopopassRoadLabelStyle;
  const roadLengthMeters = label.roadLengthMeters ?? 0;
  const roadScreenLength = roadLengthMeters * viewportScale;
  const visibilityMultiplier = roadLabelMinLengthMultiplierForViewport(viewportScale);

  if (viewportScale < style.minViewportScale) {
    return false;
  }

  if (roadScreenLength < style.minRoadScreenLength * visibilityMultiplier) {
    return false;
  }

  const estimatedWidth = estimatedLabelTextWidth(label.text, style);

  if (estimatedWidth + style.collisionPadding * 2 > roadScreenLength * style.maxTextToRoadRatio) {
    return false;
  }

  const screenPoint = mapToScreenPoint(label.point, viewport);
  const existingPoints = roadLabelPointsByText.get(label.text.toLowerCase()) ?? [];
  const repeatDistance = style.repeatDistance / Math.min(cartographicLabelScaleForTier(tier, viewport, currentZoom), 1.6);

  return existingPoints.every((point) => distanceBetweenPoints(point, screenPoint) >= repeatDistance);
}

function shouldShowContextLabel(label: SyntheticMapLabel, viewportScale: number): boolean {
  if (!isContextMapLabelKind(label.kind)) {
    return true;
  }

  return viewportScale >= TOPOPASS_STREET_ATLAS_STYLE.labels.context[label.kind].minViewportScale;
}

function labelCollisionBox(label: SyntheticMapLabel, viewport: ScreenMapViewport, currentZoom?: number): SyntheticLabelCollisionBox {
  const style = labelStyleForSyntheticMapLabel(label, viewport, currentZoom);
  const point = mapToScreenPoint(label.point, viewport);
  const yOffset = label.kind === "start" || label.kind === "checkpoint" || label.kind === "finish" ? style.yOffset ?? 0 : 0;
  const fontSize = labelFontSize(style);
  const padding = "collisionPadding" in style ? style.collisionPadding : TOPOPASS_STREET_ATLAS_STYLE.labels.collision.defaultPadding;
  const width = estimatedLabelTextWidth(label.text, style);
  const symbolOffsetX = syntheticMapLabelSymbolOffsetX(label, viewport, currentZoom, width, padding);
  const height = fontSize + padding * 2;
  const angle = (label.kind === "road" || label.kind === "road_reference") && typeof label.angleRadians === "number"
    ? readableSyntheticLabelAngle(label.angleRadians)
    : 0;
  const rotatedWidth = Math.abs(Math.cos(angle)) * width + Math.abs(Math.sin(angle)) * height;
  const rotatedHeight = Math.abs(Math.sin(angle)) * width + Math.abs(Math.cos(angle)) * height;

  return {
    id: label.id,
    minX: point.x + symbolOffsetX - rotatedWidth / 2 - padding,
    minY: point.y + yOffset - rotatedHeight / 2 - padding,
    maxX: point.x + symbolOffsetX + rotatedWidth / 2 + padding,
    maxY: point.y + yOffset + rotatedHeight / 2 + padding
  };
}

function landmarkVisualCollisionBox(
  visual: SyntheticLandmarkVisual,
  viewport: ScreenMapViewport,
  currentZoom?: number
): SyntheticLabelCollisionBox {
  const point = mapToScreenPoint(visual.point, viewport);
  const style = TOPOPASS_STREET_ATLAS_STYLE.atlasSymbols.styles[atlasSymbolKindForVisual(visual)];
  const scale = atlasSymbolSemanticScale(currentZoom, syntheticMapViewportScale(viewport));
  const radius = (style.size + style.haloWidth) * scale + style.collisionPadding;

  return {
    id: `landmark-marker-${visual.id}`,
    minX: point.x - radius,
    minY: point.y - radius,
    maxX: point.x + radius,
    maxY: point.y + radius
  };
}

function estimatedLabelTextWidth(text: string, style: TopopassLabelStyle | TopopassRoadLabelStyle | TopopassContextLabelStyle): number {
  const key = `${labelStyleCacheKey(style)}:${text}`;
  const cachedWidth = labelTextWidthCache.get(key);

  if (cachedWidth !== undefined) {
    labelTextWidthCacheHits += 1;
    return cachedWidth;
  }

  labelTextWidthCacheMisses += 1;
  const characterWidth = "approximateCharacterWidth" in style ? style.approximateCharacterWidth : labelFontSize(style) * 0.58;

  const width = text.length * characterWidth;

  labelTextWidthCache.set(key, width);

  return width;
}

function labelFontSize(style: TopopassLabelStyle | TopopassRoadLabelStyle | TopopassContextLabelStyle): number {
  if ("fontSize" in style) {
    return style.fontSize;
  }

  const cachedSize = labelFontSizeCache.get(style.font);

  if (cachedSize !== undefined) {
    labelFontSizeCacheHits += 1;
    return cachedSize;
  }

  labelFontSizeCacheMisses += 1;
  const match = /(\d+(?:\.\d+)?)px/.exec(style.font);

  const size = match ? Number(match[1]) : 11;

  labelFontSizeCache.set(style.font, size);

  return size;
}

function labelStyleCacheKey(style: TopopassLabelStyle | TopopassRoadLabelStyle | TopopassContextLabelStyle): string {
  const approximateCharacterWidth =
    "approximateCharacterWidth" in style ? style.approximateCharacterWidth : "auto";
  const fontSize = "fontSize" in style ? style.fontSize : "auto";

  return `${style.font}|${fontSize}|${approximateCharacterWidth}`;
}

export function readableSyntheticLabelAngle(angleRadians: number): number {
  const fullTurn = Math.PI * 2;
  let normalized = ((angleRadians + Math.PI) % fullTurn + fullTurn) % fullTurn - Math.PI;

  if (normalized > Math.PI / 2) normalized -= Math.PI;
  if (normalized < -Math.PI / 2) normalized += Math.PI;

  return normalized;
}

function boxesIntersect(left: SyntheticLabelCollisionBox, right: SyntheticLabelCollisionBox): boolean {
  return left.minX <= right.maxX && left.maxX >= right.minX && left.minY <= right.maxY && left.maxY >= right.minY;
}

export function syntheticLandmarkReservationBoxes(
  visuals: readonly SyntheticLandmarkVisual[],
  viewport: ScreenMapViewport,
  currentZoom?: number
): SyntheticLabelCollisionBox[] {
  return visuals.map((visual) => landmarkVisualCollisionBox(visual, viewport, currentZoom));
}

export function syntheticMapLabelSymbolOffsetX(
  label: Pick<SyntheticMapLabel, "symbolKind">,
  viewport: ScreenMapViewport,
  currentZoom: number | undefined,
  estimatedTextWidth: number,
  labelPadding: number
): number {
  if (!label.symbolKind) {
    return 0;
  }

  const style = TOPOPASS_STREET_ATLAS_STYLE.atlasSymbols.styles[label.symbolKind];
  const scale = atlasSymbolSemanticScale(currentZoom, syntheticMapViewportScale(viewport));
  const symbolRadius = (style.size + style.haloWidth) * scale + style.collisionPadding;

  return symbolRadius + labelPadding + estimatedTextWidth / 2 + 1;
}

function symbolBoxFitsWithinViewport(box: SyntheticLabelCollisionBox, viewport: ScreenMapViewport): boolean {
  const edgePadding = TOPOPASS_STREET_ATLAS_STYLE.atlasSymbols.viewportEdgePadding;

  return box.minX >= edgePadding && box.minY >= edgePadding && box.maxX <= viewport.width - edgePadding && box.maxY <= viewport.height - edgePadding;
}

function roadReferenceBudgetForViewport(currentZoom: number | undefined, viewportScale: number): number {
  const zoom = currentZoom ?? viewportScale;
  const budgets = TOPOPASS_STREET_ATLAS_STYLE.labels.collision.roadReferenceZoomBudgets;

  if (zoom <= 0.8) return budgets.low;
  if (zoom < 1.8) return budgets.principal;
  if (zoom < 3.2) return budgets.high;
  return budgets.veryHigh;
}

export function atlasSymbolSemanticScale(currentZoom: number | undefined, viewportScale: number): number {
  const zoom = currentZoom ?? viewportScale;
  const scales = TOPOPASS_STREET_ATLAS_STYLE.atlasSymbols.semanticScale;

  if (zoom <= 0.8) return scales.low;
  if (zoom < 1.8) return scales.principal;
  if (zoom < 3.2) return scales.high;
  return scales.veryHigh;
}

export function isPhoneAtlasViewport(viewport: Pick<ScreenMapViewport, "width" | "height">): boolean {
  return viewport.width <= 1000 && viewport.height >= viewport.width * 1.5;
}

type RoadReferencePlacement = {
  label: SyntheticMapLabel;
  visibleSegmentLength: number;
};

type RoadReferenceLayoutCandidate = {
  attempted: boolean;
  accepted: boolean;
  maxVisibleSegmentLength: number;
  placements: RoadReferencePlacement[];
};

type RoadReferenceLayoutGroup = {
  key: string;
  candidates: RoadReferenceLayoutCandidate[];
};

function buildRoadReferenceLayoutGroups(
  labels: readonly SyntheticMapLabel[],
  viewport: ScreenMapViewport,
  currentZoom?: number
): RoadReferenceLayoutGroup[] {
  const groups = new Map<string, RoadReferenceLayoutCandidate[]>();

  for (const label of labels) {
    const placements = roadReferencePlacementCandidatesForViewport(label, viewport, currentZoom);

    if (placements.length === 0) continue;

    const key = label.text.trim().toLowerCase();
    const candidates = groups.get(key) ?? [];
    candidates.push({
      attempted: false,
      accepted: false,
      maxVisibleSegmentLength: Math.max(...placements.map((placement) => placement.visibleSegmentLength)),
      placements
    });
    groups.set(key, candidates);
  }

  return Array.from(groups, ([key, candidates]) => ({
    key,
    candidates: candidates.sort(
      (left, right) => right.maxVisibleSegmentLength - left.maxVisibleSegmentLength ||
        left.placements[0].label.id.localeCompare(right.placements[0].label.id)
    )
  })).sort(
    (left, right) =>
      right.candidates[0].maxVisibleSegmentLength - left.candidates[0].maxVisibleSegmentLength ||
      left.key.localeCompare(right.key)
  );
}

export function roadReferencePlacementCandidatesForViewport(
  label: SyntheticMapLabel,
  viewport: ScreenMapViewport,
  currentZoom?: number
): RoadReferencePlacement[] {
  if (label.kind !== "road_reference" || !label.sourceGeometry || label.sourceGeometry.length < 2) {
    return [{
      label: {
        ...label,
        ...(typeof label.angleRadians === "number"
          ? { angleRadians: readableSyntheticLabelAngle(label.angleRadians) }
          : {})
      },
      visibleSegmentLength: Number.POSITIVE_INFINITY
    }];
  }

  const style = labelStyleForSyntheticMapLabel(label, viewport, currentZoom);
  const collision = TOPOPASS_STREET_ATLAS_STYLE.labels.collision;
  const textWidth = estimatedLabelTextWidth(label.text, style);
  const padding = "collisionPadding" in style ? style.collisionPadding : collision.defaultPadding;
  const requiredLength = Math.max(
    collision.roadReferenceMinimumVisibleSegmentLength,
    (textWidth + padding * 2) / collision.roadReferenceMaxTextToSegmentRatio
  );
  const edgePadding = collision.viewportEdgePadding;
  const bounds = {
    minX: edgePadding,
    minY: edgePadding,
    maxX: viewport.width - edgePadding,
    maxY: viewport.height - edgePadding
  };
  const screenPoints = label.sourceGeometry.map((point) => mapToScreenPoint(point, viewport));
  const segments: Array<{ start: Vec2; end: Vec2; length: number }> = [];

  for (let index = 1; index < screenPoints.length; index += 1) {
    const segment = clipLineToBounds(screenPoints[index - 1], screenPoints[index], bounds);

    if (!segment) continue;

    const length = distanceBetweenPoints(segment.start, segment.end);
    if (length > 0) segments.push({ ...segment, length });
  }

  const visibleSegmentLength = segments.reduce((sum, segment) => sum + segment.length, 0);

  if (visibleSegmentLength < requiredLength) return [];

  const placements = [0.5, 0.35, 0.65].map((fraction) => {
    const targetLength = visibleSegmentLength * fraction;
    let travelled = 0;
    const segment = segments.find((candidate) => {
      if (travelled + candidate.length >= targetLength) return true;
      travelled += candidate.length;
      return false;
    }) ?? segments.at(-1)!;
    const segmentFraction = Math.min(1, Math.max(0, (targetLength - travelled) / segment.length));
    const screenPoint = {
      x: segment.start.x + (segment.end.x - segment.start.x) * segmentFraction,
      y: segment.start.y + (segment.end.y - segment.start.y) * segmentFraction
    };

    return {
      label: {
        ...label,
        point: screenPointToMapPoint(screenPoint, viewport),
        angleRadians: readableSyntheticLabelAngle(
          Math.atan2(segment.end.y - segment.start.y, segment.end.x - segment.start.x)
        )
      },
      visibleSegmentLength
    };
  });

  return placements;
}

function clipLineToBounds(
  start: Vec2,
  end: Vec2,
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
): { start: Vec2; end: Vec2 } | null {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const p = [-deltaX, deltaX, -deltaY, deltaY];
  const q = [start.x - bounds.minX, bounds.maxX - start.x, start.y - bounds.minY, bounds.maxY - start.y];
  let minimum = 0;
  let maximum = 1;

  for (let index = 0; index < p.length; index += 1) {
    if (p[index] === 0) {
      if (q[index] < 0) return null;
      continue;
    }

    const ratio = q[index] / p[index];

    if (p[index] < 0) minimum = Math.max(minimum, ratio);
    else maximum = Math.min(maximum, ratio);

    if (minimum > maximum) return null;
  }

  return {
    start: { x: start.x + minimum * deltaX, y: start.y + minimum * deltaY },
    end: { x: start.x + maximum * deltaX, y: start.y + maximum * deltaY }
  };
}

function screenPointToMapPoint(point: Vec2, viewport: ScreenMapViewport): Vec2 {
  const mapWidth = viewport.mapBounds.maxX - viewport.mapBounds.minX;
  const mapHeight = viewport.mapBounds.maxY - viewport.mapBounds.minY;

  return {
    x: viewport.mapBounds.minX + (point.x / viewport.width) * mapWidth,
    y: viewport.mapBounds.minY + (point.y / viewport.height) * mapHeight
  };
}

function shouldShowRoadReferenceLabel(
  label: SyntheticMapLabel,
  viewport: ScreenMapViewport,
  pointsByText: ReadonlyMap<string, readonly Vec2[]>
): boolean {
  const point = mapToScreenPoint(label.point, viewport);
  const existingPoints = pointsByText.get(label.text.toLowerCase()) ?? [];
  const repeatDistance = TOPOPASS_STREET_ATLAS_STYLE.labels.collision.roadReferenceRepeatDistance;

  return existingPoints.every((existingPoint) => distanceBetweenPoints(existingPoint, point) >= repeatDistance);
}

function boxFitsWithinViewport(box: SyntheticLabelCollisionBox, viewport: ScreenMapViewport): boolean {
  const edgePadding = TOPOPASS_STREET_ATLAS_STYLE.labels.collision.viewportEdgePadding;

  return (
    box.minX >= edgePadding &&
    box.minY >= edgePadding &&
    box.maxX <= viewport.width - edgePadding &&
    box.maxY <= viewport.height - edgePadding
  );
}

function distanceBetweenPoints(left: Vec2, right: Vec2): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function isContextMapLabelKind(kind: SyntheticMapLabelKind): kind is SyntheticContextMapLabelKind {
  return (
    kind === "road_reference" ||
    kind === "district" ||
    kind === "institution" ||
    kind === "land_use" ||
    kind === "area" ||
    kind === "park" ||
    kind === "water" ||
    kind === "station" ||
    kind === "landmark" ||
    kind === "public_building" ||
    kind === "open_space" ||
    kind === "learner_reference" ||
    kind === "bridge"
  );
}

function dedupeContextMapLabels(labels: readonly SyntheticMapLabel[]): SyntheticMapLabel[] {
  const labelsByKey = new Map<string, SyntheticMapLabel>();
  const dedupedLabels: SyntheticMapLabel[] = [];

  for (const label of labels) {
    if (!isContextMapLabelKind(label.kind)) {
      dedupedLabels.push(label);
      continue;
    }

    const key = label.kind === "road_reference"
      ? `${label.kind}:${label.text.trim().toLowerCase()}:${label.sourceMetadata?.elementId ?? label.id}`
      : `${label.kind}:${label.text.trim().toLowerCase()}`;
    const existing = labelsByKey.get(key);

    if (!existing || label.priority < existing.priority || (label.priority === existing.priority && label.id.localeCompare(existing.id) < 0)) {
      labelsByKey.set(key, label);
    }
  }

  return [...dedupedLabels, ...labelsByKey.values()];
}

function contextLabelKindForBackgroundFeature(feature: SyntheticBackgroundFeature): SyntheticContextMapLabelKind {
  if (feature.kind === "park" || feature.kind === "open-space") {
    return "open_space";
  }

  if (feature.kind === "water") {
    return "water";
  }

  return "area";
}

function contextLabelKindForLandmarkVisual(visual: SyntheticLandmarkVisual): SyntheticContextMapLabelKind {
  if (visual.kind === "station") {
    return "station";
  }

  if (visual.kind === "public-building") {
    return "public_building";
  }

  if (visual.kind === "open-space" || visual.kind === "park") {
    return "open_space";
  }

  if (visual.kind === "learner-reference" || visual.kind === "market" || visual.kind === "dock") {
    return "learner_reference";
  }

  return "landmark";
}

function contextLabelKindForLinearFeature(feature: SyntheticLinearFeature): SyntheticContextMapLabelKind {
  if (feature.kind === "waterway") {
    return "water";
  }

  if (feature.kind === "bridge" || feature.kind === "crossing") {
    return "bridge";
  }

  return "area";
}

function contextLabelPriority(kind: SyntheticContextMapLabelKind): number {
  const priorities = TOPOPASS_STREET_ATLAS_STYLE.labels.priorities;

  if (kind === "road_reference") {
    return priorities.roadReference;
  }

  if (kind === "district") {
    return priorities.district;
  }

  if (kind === "station") {
    return priorities.station;
  }

  if (kind === "landmark") {
    return priorities.landmark;
  }

  if (kind === "public_building") {
    return priorities.publicBuilding;
  }

  if (kind === "open_space") {
    return priorities.openSpace;
  }

  if (kind === "learner_reference") {
    return priorities.learnerReference;
  }

  if (kind === "park") {
    return priorities.park;
  }

  if (kind === "water") {
    return priorities.water;
  }

  if (kind === "bridge") {
    return priorities.bridge;
  }

  if (kind === "institution") {
    return priorities.institution;
  }

  if (kind === "land_use") {
    return priorities.contextualLandUse;
  }

  return priorities.area;
}

function atlasRoadLabelCategory(visual: Pick<SyntheticRoadVisual, "roadClass" | "osmHierarchy">): SyntheticAtlasLabelCategory {
  const tier = roadLabelTier(visual);

  return tier === "major" || tier === "secondary" ? "major-road" : "local-road";
}

function atlasCategoryForContextKind(kind: SyntheticContextMapLabelKind): SyntheticAtlasLabelCategory {
  if (kind === "road_reference") {
    return "road-reference";
  }

  if (kind === "district" || kind === "area") {
    return "district";
  }

  if (kind === "station") {
    return "station";
  }

  if (kind === "park" || kind === "open_space") {
    return "park";
  }

  if (kind === "water") {
    return "water";
  }

  if (kind === "institution") {
    return "institution";
  }

  if (kind === "land_use") {
    return "contextual-land-use";
  }

  return "landmark";
}

function mapDefinitionLabelSource(featureId: string): SyntheticAtlasLabelSourceMetadata {
  return {
    provider: "map-definition",
    featureId
  };
}

function buildOsmRoadLabels(roadVisuals: readonly SyntheticRoadVisual[]): SyntheticAtlasLabelCandidate[] {
  const labelsByName = new Map<string, SyntheticRoadVisual[]>();

  for (const visual of roadVisuals) {
    if (visual.source !== "osm" || visual.name === visual.roadId || visual.name.trim().length === 0) {
      continue;
    }

    const key = visual.name.trim().toLowerCase();
    const group = labelsByName.get(key) ?? [];

    group.push(visual);
    labelsByName.set(key, group);
  }

  return [...labelsByName.values()].flatMap((visuals) => {
    const namedRoadLengthMeters = visuals.reduce((sum, visual) => sum + roadVisualLength(visual), 0);

    return selectOsmRoadLabelVisuals(visuals).map((selectedVisual) => {
      const name = selectedVisual.name.trim();
      const sourceWayElementId = selectedVisual.osmWayId ? Number(selectedVisual.osmWayId) : undefined;

      return {
        id: `road-label-osm-${selectedVisual.roadId}-${slugifyLabelId(name)}`,
        kind: "road" as const,
        text: name,
        point: { ...selectedVisual.midpoint },
        angleRadians: selectedVisual.labelAngleRadians,
        priority: roadLabelPriority(selectedVisual.roadClass, selectedVisual.osmHierarchy),
        roadClass: selectedVisual.roadClass,
        ...(selectedVisual.osmHierarchy ? { osmHierarchy: selectedVisual.osmHierarchy } : {}),
        source: selectedVisual.source,
        roadLengthMeters: Math.max(roadVisualLength(selectedVisual), namedRoadLengthMeters),
        category: atlasRoadLabelCategory(selectedVisual),
        sourceMetadata: {
          provider: "openstreetmap" as const,
          featureId: selectedVisual.roadId,
          elementType: "way" as const,
          ...(sourceWayElementId !== undefined && Number.isFinite(sourceWayElementId) ? { elementId: sourceWayElementId } : {}),
          ...(selectedVisual.osmSourceTags ? { tags: { ...selectedVisual.osmSourceTags } } : {})
        }
      };
    });
  }).sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
}

function selectOsmRoadLabelVisuals(visuals: readonly SyntheticRoadVisual[]): SyntheticRoadVisual[] {
  return [...visuals].sort((left, right) => {
    const classPriority = roadLabelPriority(left.roadClass, left.osmHierarchy) - roadLabelPriority(right.roadClass, right.osmHierarchy);

    if (classPriority !== 0) {
      return classPriority;
    }

    const lengthDifference = roadVisualLength(right) - roadVisualLength(left);

    if (lengthDifference !== 0) {
      return lengthDifference;
    }

    return left.roadId.localeCompare(right.roadId);
  });
}

function roadVisualLength(visual: SyntheticRoadVisual): number {
  if (visual.points.length < 2) {
    return 0;
  }

  const from = visual.points[0];
  const to = visual.points[visual.points.length - 1];

  return Math.hypot(to.x - from.x, to.y - from.y);
}

function slugifyLabelId(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unnamed";
}

function buildOsmContextLabels(
  features: readonly RealLondonContextFeature[],
  roadVisuals: readonly SyntheticRoadVisual[] = []
): SyntheticAtlasLabelCandidate[] {
  const roadReferencesByElement = new Map<string, string[]>();
  const renderedRoadReferencesByWay = buildRenderedRoadReferenceIndex(roadVisuals);

  for (const feature of features) {
    if (feature.kind !== "road-reference") continue;
    const key = `${feature.sourceElementType}:${feature.sourceElementId}`;
    const references = roadReferencesByElement.get(key) ?? [];
    references.push(feature.reference);
    roadReferencesByElement.set(key, references);
  }

  for (const [key, references] of roadReferencesByElement) {
    roadReferencesByElement.set(key, Array.from(new Set(references)).sort((left, right) => left.localeCompare(right)));
  }

  return features
    .flatMap((feature) => {
      if (feature.kind === "road-reference") {
        if (!isValidRoadReferenceSource(feature)) {
          return [];
        }

        if (!hasRenderedRoadReferenceSource(feature, renderedRoadReferencesByWay)) {
          return [];
        }

        const references = roadReferencesByElement.get(`${feature.sourceElementType}:${feature.sourceElementId}`) ?? [feature.reference];
        const index = Math.max(0, references.indexOf(feature.reference));
        const fraction = references.length === 1 ? 0.5 : 0.38 + (0.24 * index) / Math.max(1, references.length - 1);
        const pose = polylineLabelPoseAtFraction(feature.points, fraction);

        return pose
          ? [{
              ...contextCandidate(feature, "road_reference", "road-reference", feature.reference, pose.point, pose.angleRadians),
              roadLengthMeters: polylineLength(feature.points),
              roadReferenceClass: feature.subtype,
              sourceGeometry: feature.points.map((point) => ({ ...point }))
            }]
          : [];
      }

      if (!feature.name) {
        return [];
      }

      if (feature.kind === "area") {
        const place = feature.sourceTags?.place;
        const compactEstate =
          (place === "neighbourhood" || place === "locality") && /\bestate\b/i.test(feature.name);
        const compactArea = compactEstate || place === "square";

        return [contextCandidate(
          feature,
          compactArea ? "land_use" : "district",
          compactEstate ? "estate" : compactArea ? "contextual-land-use" : "district",
          feature.name,
          feature.point
        )];
      }

      if (feature.kind === "station") {
        return [contextCandidate(feature, "station", "station", feature.name, feature.point, undefined, "station")];
      }

      if (feature.kind === "landmark") {
        const kind = feature.landmarkKind === "public-building"
          ? "public_building"
          : feature.landmarkKind === "learner-reference"
            ? "learner_reference"
            : "landmark";

        return [contextCandidate(feature, kind, "landmark", feature.name, feature.point, undefined, feature.symbolKind)];
      }

      if (feature.kind === "institution") {
        return [contextCandidate(feature, "institution", "institution", feature.name, polygonCenter(feature.points))];
      }

      if (feature.kind === "land-use") {
        const category = feature.subtype === "residential" ? "estate" : "contextual-land-use";

        return [contextCandidate(feature, "land_use", category, feature.name, polygonCenter(feature.points))];
      }

      if (feature.kind === "park") {
        return [contextCandidate(feature, "park", "park", feature.name, polygonCenter(feature.points))];
      }

      if (feature.kind === "water") {
        return [contextCandidate(feature, "water", "water", feature.name, polylineCenter(feature.points))];
      }

      if (feature.kind === "bridge") {
        const pose = polylineLabelPose(feature.points);

        return pose ? [contextCandidate(feature, "bridge", "landmark", feature.name, pose.point, pose.angleRadians)] : [];
      }

      return [];
    })
    .sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
}

function buildRenderedRoadReferenceIndex(roadVisuals: readonly SyntheticRoadVisual[]): Map<string, Set<string>> {
  const referencesByWay = new Map<string, Set<string>>();

  for (const visual of roadVisuals) {
    if (!visual.osmWayId || visual.source !== "osm" || visual.points.length < 2) {
      continue;
    }

    const references = roadReferencesFromRawRef(visual.osmSourceTags?.ref);

    if (references.length === 0) {
      continue;
    }

    const existing = referencesByWay.get(visual.osmWayId) ?? new Set<string>();

    references.forEach((reference) => existing.add(reference));
    referencesByWay.set(visual.osmWayId, existing);
  }

  return referencesByWay;
}

function hasRenderedRoadReferenceSource(
  feature: Extract<RealLondonContextFeature, { kind: "road-reference" }>,
  renderedRoadReferencesByWay: ReadonlyMap<string, ReadonlySet<string>>
): boolean {
  if (feature.sourceElementType !== "way") {
    return false;
  }

  return renderedRoadReferencesByWay.get(String(feature.sourceElementId))?.has(feature.reference) ?? false;
}

function contextCandidate(
  feature: RealLondonContextFeature,
  kind: SyntheticContextMapLabelKind,
  category: SyntheticAtlasLabelCategory,
  text: string,
  point: Vec2,
  angleRadians?: number,
  symbolKind?: TopopassAtlasSymbolKind
): SyntheticAtlasLabelCandidate {
  return {
    id: `${kind}-label-${feature.id}`,
    kind,
    text,
    point: { ...point },
    ...(angleRadians === undefined ? {} : { angleRadians }),
    ...(symbolKind === undefined ? {} : { symbolKind }),
    priority: contextLabelPriority(kind),
    category,
    source: "osm",
    sourceMetadata: {
      provider: "openstreetmap",
      featureId: feature.id,
      elementType: feature.sourceElementType,
      elementId: feature.sourceElementId,
      ...(feature.sourceTags ? { tags: { ...feature.sourceTags } } : {})
    }
  };
}

function buildOsmLandmarkVisuals(map: MapDefinition, fixture: unknown): SyntheticAtlasSymbolCandidate[] {
  const candidates = buildRealLondonContextFeatures(map, fixture)
    .flatMap((feature) => {
      const visual = landmarkVisualFromContextFeature(feature);

      return visual ? [visual] : [];
    })
    .sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));

  return dedupeAtlasSymbolCandidates(candidates);
}

function landmarkVisualFromContextFeature(feature: RealLondonContextFeature): SyntheticAtlasSymbolCandidate | null {
  if (feature.kind === "station") {
    return feature.name
      ? buildSourceBackedAtlasSymbol(feature, "station", "station", feature.name, feature.point, feature.sourceGeometry)
      : null;
  }

  if (feature.kind === "park") {
    const name = feature.name;

    return name
      ? buildSourceBackedAtlasSymbol(feature, "open-space", "open-space", name, polygonCenter(feature.points), feature.points)
      : null;
  }

  if (feature.kind === "landmark") {
    const kind = landmarkVisualKindForContextLandmark(feature);
    return buildSourceBackedAtlasSymbol(feature, kind, feature.symbolKind, feature.name, feature.point, feature.sourceGeometry);
  }

  return null;
}

function landmarkVisualKindForContextLandmark(feature: RealLondonLandmarkContextFeature): SyntheticLandmarkVisualKind {
  if (feature.symbolKind === "religious") return "religious";
  if (feature.symbolKind === "education") return "education";
  if (feature.symbolKind === "civic") return "civic";
  if (feature.symbolKind === "museum") return "museum";
  if (feature.symbolKind === "market") return "market";
  if (feature.symbolKind === "parking") return "parking";
  if (feature.symbolKind === "pier") return "pier";
  return feature.landmarkKind;
}

function buildSourceBackedAtlasSymbol(
  feature: RealLondonContextFeature,
  kind: SyntheticLandmarkVisualKind,
  symbolKind: TopopassAtlasSymbolKind,
  label: string,
  point: Vec2,
  sourceGeometry: readonly Vec2[]
): SyntheticAtlasSymbolCandidate {
  const visual = buildLandmarkVisualFromPoint(`osm-${feature.id}`, kind, label, point);

  return {
    ...visual,
    symbolKind,
    sourceGeometry: sourceGeometry.map((sourcePoint) => ({ ...sourcePoint })),
    sourceMetadata: {
      provider: "openstreetmap",
      sourceFeatureId: feature.id,
      elementType: feature.sourceElementType,
      elementId: feature.sourceElementId,
      ...(feature.sourceTags ? { tags: { ...feature.sourceTags } } : {})
    }
  };
}

function dedupeAtlasSymbolCandidates(candidates: readonly SyntheticAtlasSymbolCandidate[]): SyntheticAtlasSymbolCandidate[] {
  const accepted: SyntheticAtlasSymbolCandidate[] = [];

  for (const candidate of [...candidates].sort(compareLandmarkVisualsForLayout)) {
    const duplicate = accepted.some((existing) =>
      existing.symbolKind === candidate.symbolKind &&
      canonicalSymbolLabel(existing.label) === canonicalSymbolLabel(candidate.label) &&
      distanceBetweenPoints(existing.point, candidate.point) <= 80
    );

    if (!duplicate) accepted.push(candidate);
  }

  return accepted;
}

function canonicalSymbolLabel(label: string): string {
  return label.toLowerCase().replace(/\blondon\b|\brailway\b|\bstation\b/g, "").replace(/[^a-z0-9]+/g, "").trim();
}

function buildOsmBackgroundFeatures(map: MapDefinition, fixture: unknown): SyntheticBackgroundFeature[] {
  return buildRealLondonContextFeatures(map, fixture)
    .flatMap((feature) => {
      if (feature.kind === "land-use") {
        return compactBackgroundFeature(backgroundFeatureFromLandUseContext(feature));
      }

      if (feature.kind === "park") {
        return compactBackgroundFeature(backgroundFeatureFromParkContext(feature));
      }

      if (feature.kind === "water" && feature.subtype !== "waterway" && feature.points.length >= 3) {
        return compactBackgroundFeature(backgroundFeatureFromWaterContext(feature));
      }

      if (feature.kind === "institution") {
        return compactBackgroundFeature(backgroundFeatureFromInstitutionContext(feature));
      }

      if (feature.kind === "building") {
        return compactBackgroundFeature(backgroundFeatureFromBuildingContext(feature));
      }

      if (feature.kind === "pedestrian-area") {
        return compactBackgroundFeature(backgroundFeatureFromPedestrianAreaContext(feature));
      }

      return [];
    })
    .sort(compareSyntheticBackgroundFeaturesForRender);
}

function compactBackgroundFeature(feature: SyntheticBackgroundFeature | null): SyntheticBackgroundFeature[] {
  return feature ? [feature] : [];
}

function backgroundFeatureFromLandUseContext(feature: RealLondonLandUseContextFeature): SyntheticBackgroundFeature | null {
  return prepareOsmBackgroundFeature(
    feature,
    "land-use",
    "land-use",
    TOPOPASS_STREET_ATLAS_STYLE.background.landUse[feature.subtype]
  );
}

function backgroundFeatureFromParkContext(feature: RealLondonParkContextFeature): SyntheticBackgroundFeature | null {
  const background = TOPOPASS_STREET_ATLAS_STYLE.background;
  const style =
    feature.subtype === "park" || feature.subtype === "garden"
      ? background.park.garden
      : background.openSpace;

  return prepareOsmBackgroundFeature(
    feature,
    feature.subtype === "park" || feature.subtype === "garden" ? "park" : "open-space",
    "parks-water",
    style
  );
}

function backgroundFeatureFromWaterContext(feature: RealLondonWaterContextFeature): SyntheticBackgroundFeature | null {
  const water = TOPOPASS_STREET_ATLAS_STYLE.background.water;
  const tags = feature.sourceTags ?? {};
  const waterValue = typeof tags.water === "string" ? tags.water : "";
  const style =
    feature.name?.toLowerCase().includes("thames") || waterValue === "river" ? water.river : water.basin;

  return prepareOsmBackgroundFeature(feature, "water", "parks-water", style);
}

function backgroundFeatureFromInstitutionContext(
  feature: RealLondonInstitutionContextFeature
): SyntheticBackgroundFeature | null {
  return prepareOsmBackgroundFeature(
    feature,
    "institution",
    "institution",
    TOPOPASS_STREET_ATLAS_STYLE.background.institution[feature.subtype]
  );
}

function backgroundFeatureFromBuildingContext(feature: RealLondonBuildingContextFeature): SyntheticBackgroundFeature | null {
  return prepareOsmBackgroundFeature(
    feature,
    "building",
    "building",
    TOPOPASS_STREET_ATLAS_STYLE.background.building[feature.subtype]
  );
}

function backgroundFeatureFromPedestrianAreaContext(
  feature: RealLondonPedestrianAreaContextFeature
): SyntheticBackgroundFeature | null {
  const style = TOPOPASS_STREET_ATLAS_STYLE.background.pedestrianArea;

  return prepareOsmBackgroundFeature(feature, "pedestrian-area", "pedestrian-area", {
    ...style,
    strokeWidth: TOPOPASS_STREET_ATLAS_STYLE.background.polygonStrokeWidth,
    minViewportScale: 0.34,
    lowZoomAlpha: 0.42,
    mediumZoomAlpha: 0.62,
    highZoomAlpha: 0.76,
    minRenderedAreaPixels: 3,
    simplifyBelowViewportScale: 0.56,
    simplifyTolerancePixels: 0.9,
    maxStrokeWidth: TOPOPASS_STREET_ATLAS_STYLE.background.polygonStrokeWidth
  });
}

function prepareOsmBackgroundFeature(
  feature:
    | RealLondonLandUseContextFeature
    | RealLondonParkContextFeature
    | RealLondonWaterContextFeature
    | RealLondonInstitutionContextFeature
    | RealLondonBuildingContextFeature
    | RealLondonPedestrianAreaContextFeature,
  kind: SyntheticBackgroundFeatureKind,
  renderLayer: SyntheticBackgroundRenderLayer,
  style: TopopassAreaPolygonStyle
): SyntheticBackgroundFeature | null {
  const points = validClosedPolygonRing(feature.points);

  if (!points) {
    return null;
  }

  const innerRings = (feature.innerRings ?? []).flatMap((ring) => {
    const validRing = validClosedPolygonRing(ring, 0.01);
    return validRing ? [validRing] : [];
  });
  const sourceAreaSquareMeters = Math.max(
    0,
    polygonAreaSquareMeters(points) - innerRings.reduce((total, ring) => total + polygonAreaSquareMeters(ring), 0)
  );

  if (sourceAreaSquareMeters < TOPOPASS_STREET_ATLAS_STYLE.background.geometry.minimumSourceAreaSquareMeters) {
    return null;
  }

  return {
    id: `osm-context-${feature.id}`,
    kind,
    subtype: "subtype" in feature ? feature.subtype : undefined,
    renderLayer,
    label: feature.name,
    fillColor: style.fillColor,
    strokeColor: style.strokeColor,
    points,
    innerRings,
    sourceBounds: polygonBounds(points),
    sourceAreaSquareMeters,
    sourceMetadata: {
      sourceFeatureId: feature.id,
      sourceElementType: feature.sourceElementType,
      sourceElementId: feature.sourceElementId,
      sourceTags: { ...(feature.sourceTags ?? {}) }
    },
    routable: false
  };
}

function validClosedPolygonRing(points: readonly Vec2[], minimumAreaSquareMeters?: number): Vec2[] | null {
  if (points.length < 4 || points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
    return null;
  }

  const first = points[0];
  const last = points[points.length - 1];

  if (first.x !== last.x || first.y !== last.y) {
    return null;
  }

  const cloned = points.map((point) => ({ ...point }));
  const minimumArea = minimumAreaSquareMeters ?? TOPOPASS_STREET_ATLAS_STYLE.background.geometry.minimumSourceAreaSquareMeters;

  return polygonAreaSquareMeters(cloned) >= minimumArea ? cloned : null;
}

function polygonAreaSquareMeters(points: readonly Vec2[]): number {
  let doubledArea = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    doubledArea += points[index].x * points[index + 1].y - points[index + 1].x * points[index].y;
  }

  return Math.abs(doubledArea) / 2;
}

function polygonBounds(points: readonly Vec2[]): { minX: number; minY: number; maxX: number; maxY: number } {
  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxX: Math.max(bounds.maxX, point.x),
      maxY: Math.max(bounds.maxY, point.y)
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY
    }
  );
}

export function sortSyntheticBackgroundFeaturesForRender(
  features: readonly SyntheticBackgroundFeature[]
): SyntheticBackgroundFeature[] {
  return [...features].sort(compareSyntheticBackgroundFeaturesForRender);
}

export function filterSyntheticBackgroundFeaturesForViewport(
  features: readonly SyntheticBackgroundFeature[],
  viewport: ScreenMapViewport
): SyntheticBackgroundFeature[] {
  const scale = syntheticMapViewportScale(viewport);
  const mapPadding = scale > 0 ? TOPOPASS_STREET_ATLAS_STYLE.background.geometry.viewportPaddingPixels / scale : 0;

  return sortSyntheticBackgroundFeaturesForRender(features).filter((feature) => {
    const style = backgroundPolygonStyleForFeature(feature);

    if (scale < style.minViewportScale) {
      return false;
    }

    if (
      feature.sourceAreaSquareMeters !== undefined &&
      feature.sourceAreaSquareMeters * scale * scale < style.minRenderedAreaPixels
    ) {
      return false;
    }

    if (!feature.sourceBounds) {
      return true;
    }

    return !(
      feature.sourceBounds.maxX < viewport.mapBounds.minX - mapPadding ||
      feature.sourceBounds.minX > viewport.mapBounds.maxX + mapPadding ||
      feature.sourceBounds.maxY < viewport.mapBounds.minY - mapPadding ||
      feature.sourceBounds.minY > viewport.mapBounds.maxY + mapPadding
    );
  });
}

export function syntheticBackgroundFeatureStyleForViewport(
  feature: SyntheticBackgroundFeature,
  viewport: ScreenMapViewport
): { alpha: number; strokeWidth: number; simplifyTolerancePixels: number } {
  const style = backgroundPolygonStyleForFeature(feature);
  const scale = syntheticMapViewportScale(viewport);
  const decluttering = TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering;
  const alpha =
    scale < decluttering.lowDetailViewportScale
      ? style.lowZoomAlpha
      : scale >= decluttering.highDetailViewportScale
        ? style.highZoomAlpha
        : style.mediumZoomAlpha;

  return {
    alpha: clampNumber(alpha, 0, 1),
    strokeWidth: clampNumber(style.strokeWidth, 0, style.maxStrokeWidth),
    simplifyTolerancePixels: scale < style.simplifyBelowViewportScale ? style.simplifyTolerancePixels : 0
  };
}

function compareSyntheticBackgroundFeaturesForRender(
  left: SyntheticBackgroundFeature,
  right: SyntheticBackgroundFeature
): number {
  const layerDifference = backgroundLayerRank(left) - backgroundLayerRank(right);

  if (layerDifference !== 0) {
    return layerDifference;
  }

  const areaDifference = (right.sourceAreaSquareMeters ?? 0) - (left.sourceAreaSquareMeters ?? 0);
  return areaDifference || left.id.localeCompare(right.id);
}

function backgroundLayerRank(feature: SyntheticBackgroundFeature): number {
  const layer = feature.renderLayer ?? defaultBackgroundRenderLayer(feature.kind);
  const rank = TOPOPASS_STREET_ATLAS_STYLE.background.layerOrder.indexOf(layer);
  return rank >= 0 ? rank : TOPOPASS_STREET_ATLAS_STYLE.background.layerOrder.length;
}

function defaultBackgroundRenderLayer(kind: SyntheticBackgroundFeatureKind): SyntheticBackgroundRenderLayer {
  if (kind === "land-use" || kind === "land-block") {
    return "land-use";
  }

  if (kind === "park" || kind === "open-space" || kind === "water") {
    return "parks-water";
  }

  if (kind === "institution") {
    return "institution";
  }

  if (kind === "building") {
    return "building";
  }

  return "pedestrian-area";
}

function backgroundPolygonStyleForFeature(feature: SyntheticBackgroundFeature): TopopassAreaPolygonStyle {
  const background = TOPOPASS_STREET_ATLAS_STYLE.background;

  if (feature.kind === "land-use" && feature.subtype && feature.subtype in background.landUse) {
    return background.landUse[feature.subtype as keyof typeof background.landUse];
  }

  if (feature.kind === "institution" && feature.subtype && feature.subtype in background.institution) {
    return background.institution[feature.subtype as keyof typeof background.institution];
  }

  if (feature.kind === "building" && feature.subtype && feature.subtype in background.building) {
    return background.building[feature.subtype as keyof typeof background.building];
  }

  if (feature.kind === "water") {
    return feature.label?.toLowerCase().includes("thames") ? background.water.river : background.water.basin;
  }

  if (feature.kind === "park") {
    return background.park.garden;
  }

  if (feature.kind === "open-space") {
    return background.openSpace;
  }

  return {
    fillColor: feature.fillColor,
    strokeColor: feature.strokeColor,
    strokeWidth: background.polygonStrokeWidth,
    minViewportScale: 0,
    lowZoomAlpha: 0.68,
    mediumZoomAlpha: 0.82,
    highZoomAlpha: 0.92,
    minRenderedAreaPixels: 0,
    simplifyBelowViewportScale: 0.5,
    simplifyTolerancePixels: 0.8,
    maxStrokeWidth: background.polygonStrokeWidth
  };
}

function buildOsmLinearFeatures(map: MapDefinition, fixture: unknown): SyntheticLinearFeature[] {
  return buildRealLondonContextFeatures(map, fixture)
    .flatMap<SyntheticLinearFeature>((feature) => {
      if (feature.kind === "rail") {
        const style = TOPOPASS_STREET_ATLAS_STYLE.contextFeatures.rail;

        return [
          {
            id: `osm-context-${feature.id}`,
            kind: "rail" as const,
            label: feature.name,
            points: feature.points.map((point) => ({ ...point })),
            casingColor: style.casingColor ?? "",
            strokeColor: style.strokeColor,
            casingWidth: style.casingWidth ?? 0,
            strokeWidth: style.strokeWidth,
            dash: [...(style.dash ?? [])],
            routable: false as const
          }
        ];
      }

      if (feature.kind === "bridge") {
        const style = TOPOPASS_STREET_ATLAS_STYLE.contextFeatures.bridge;

        return [
          {
            id: `osm-context-${feature.id}`,
            kind: "bridge" as const,
            label: feature.name,
            points: feature.points.map((point) => ({ ...point })),
            casingColor: style.casingColor ?? "",
            strokeColor: style.strokeColor,
            casingWidth: style.casingWidth ?? 0,
            strokeWidth: style.strokeWidth,
            dash: [...(style.dash ?? [])],
            routable: false as const
          }
        ];
      }

      if (feature.kind === "water" && feature.subtype === "waterway") {
        const style = TOPOPASS_STREET_ATLAS_STYLE.background.water.linear;

        return [
          {
            id: `osm-context-${feature.id}`,
            kind: "waterway" as const,
            label: feature.name,
            points: feature.points.map((point) => ({ ...point })),
            casingColor: style.casingColor ?? "",
            strokeColor: style.strokeColor,
            casingWidth: style.casingWidth ?? 0,
            strokeWidth: style.strokeWidth,
            routable: false as const
          }
        ];
      }

      return [];
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function buildSyntheticLinearFeatures(
  map: MapDefinition,
  options: BuildSyntheticContextOptions = {}
): SyntheticLinearFeature[] {
  if (isOsmMap(map)) {
    return buildOsmLinearFeatures(map, options.sourceOverpassFixture);
  }

  const bounds = mapBounds(map);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  return [
    {
      id: "marlowe-rail-approach",
      kind: "rail",
      label: "Rail approach",
      points: [
        { x: bounds.minX - width * 0.12, y: bounds.minY + height * 0.22 },
        { x: bounds.minX + width * 0.12, y: bounds.minY + height * 0.24 },
        { x: bounds.minX + width * 0.34, y: bounds.minY + height * 0.27 },
        { x: bounds.minX + width * 0.57, y: bounds.minY + height * 0.34 },
        { x: bounds.maxX + width * 0.1, y: bounds.minY + height * 0.43 }
      ],
      casingColor: TOPOPASS_STREET_ATLAS_STYLE.contextFeatures.rail.casingColor ?? "",
      strokeColor: TOPOPASS_STREET_ATLAS_STYLE.contextFeatures.rail.strokeColor,
      casingWidth: TOPOPASS_STREET_ATLAS_STYLE.contextFeatures.rail.casingWidth ?? 0,
      strokeWidth: TOPOPASS_STREET_ATLAS_STYLE.contextFeatures.rail.strokeWidth,
      dash: [...(TOPOPASS_STREET_ATLAS_STYLE.contextFeatures.rail.dash ?? [])],
      routable: false
    }
  ];
}

export function buildSyntheticLandmarkVisuals(
  map: MapDefinition,
  exercise?: RouteExercise,
  options: BuildSyntheticContextOptions = {}
): SyntheticLandmarkVisual[] {
  const exerciseLandmarkIds = new Set(
    exercise?.stops.flatMap((stop) => (stop.type === "landmark" ? [stop.landmarkId] : [])) ?? []
  );

  const mapLandmarks = map.landmarks
    .map((landmark) => {
      const kind = landmarkVisualKind(landmark);
      const visualStyle = landmarkVisualStyle(kind);
      const isExerciseStop = exerciseLandmarkIds.has(landmark.id);

      return {
        id: landmark.id,
        kind,
        label: landmark.name,
        point: { x: landmark.x, y: landmark.y },
        radius: isExerciseStop ? visualStyle.radius + 2 : visualStyle.radius,
        fillColor: visualStyle.fillColor,
        strokeColor: visualStyle.strokeColor,
        haloColor: visualStyle.haloColor,
        priority: visualStyle.priority,
        isExerciseStop,
        symbolKind: atlasSymbolKindForVisualKind(kind),
        sourceGeometry: [{ x: landmark.x, y: landmark.y }],
        sourceMetadata: {
          provider: "map-definition" as const,
          sourceFeatureId: landmark.id
        },
        routable: false as const
      };
    });

  return [...mapLandmarks, ...buildOsmLandmarkVisuals(map, options.sourceOverpassFixture)].sort(
    (left, right) => left.priority - right.priority || left.id.localeCompare(right.id)
  );
}

export function buildSyntheticBackgroundFeatures(
  map: MapDefinition,
  options: BuildSyntheticContextOptions = {}
): SyntheticBackgroundFeature[] {
  if (isOsmMap(map)) {
    return buildOsmBackgroundFeatures(map, options.sourceOverpassFixture);
  }

  const bounds = mapBounds(map);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const topWaterMaxY = bounds.minY + height * 0.16;
  const lowerParkMinY = bounds.minY + height * 0.42;
  const lowerParkMaxY = bounds.minY + height * 0.68;
  const stationMinX = bounds.minX + width * 0.04;
  const stationMaxX = bounds.minX + width * 0.31;
  const stationMinY = bounds.minY + height * 0.18;
  const stationMaxY = bounds.minY + height * 0.31;
  const background = TOPOPASS_STREET_ATLAS_STYLE.background;

  return [
    {
      id: "marlowe-canal-water",
      kind: "water",
      label: "Marlowe Canal",
      points: [
        { x: bounds.minX - width * 0.1, y: bounds.minY - height * 0.08 },
        { x: bounds.maxX + width * 0.08, y: bounds.minY - height * 0.06 },
        { x: bounds.maxX + width * 0.05, y: topWaterMaxY },
        { x: bounds.minX - width * 0.08, y: topWaterMaxY + height * 0.04 }
      ],
      fillColor: background.water.canal.fillColor,
      strokeColor: background.water.canal.strokeColor,
      routable: false
    },
    {
      id: "marlowe-canal-basin-water",
      kind: "water",
      label: "Canal Basin",
      points: [
        { x: bounds.maxX - width * 0.24, y: bounds.minY + height * 0.12 },
        { x: bounds.maxX + width * 0.03, y: bounds.minY + height * 0.12 },
        { x: bounds.maxX + width * 0.05, y: bounds.minY + height * 0.31 },
        { x: bounds.maxX - width * 0.22, y: bounds.minY + height * 0.3 }
      ],
      fillColor: background.water.basin.fillColor,
      strokeColor: background.water.basin.strokeColor,
      routable: false
    },
    {
      id: "marlowe-station-quarter-block",
      kind: "land-block",
      label: "Station Quarter",
      points: [
        { x: stationMinX, y: stationMinY },
        { x: stationMaxX, y: stationMinY - height * 0.02 },
        { x: stationMaxX + width * 0.02, y: stationMaxY },
        { x: stationMinX - width * 0.01, y: stationMaxY + height * 0.02 }
      ],
      fillColor: background.landBlock.stationQuarter.fillColor,
      strokeColor: background.landBlock.stationQuarter.strokeColor,
      routable: false
    },
    {
      id: "marlowe-goods-yard-block",
      kind: "land-block",
      label: "Goods Yard",
      points: [
        { x: bounds.minX + width * 0.33, y: bounds.minY + height * 0.17 },
        { x: bounds.minX + width * 0.63, y: bounds.minY + height * 0.18 },
        { x: bounds.minX + width * 0.64, y: bounds.minY + height * 0.31 },
        { x: bounds.minX + width * 0.31, y: bounds.minY + height * 0.29 }
      ],
      fillColor: background.landBlock.goodsYard.fillColor,
      strokeColor: background.landBlock.goodsYard.strokeColor,
      routable: false
    },
    {
      id: "royal-oak-gardens-park",
      kind: "park",
      label: "Royal Oak Gardens",
      points: [
        { x: bounds.minX - width * 0.03, y: lowerParkMinY },
        { x: bounds.minX + width * 0.31, y: lowerParkMinY - height * 0.03 },
        { x: bounds.minX + width * 0.34, y: lowerParkMaxY },
        { x: bounds.minX + width * 0.01, y: lowerParkMaxY + height * 0.02 }
      ],
      fillColor: background.park.garden.fillColor,
      strokeColor: background.park.garden.strokeColor,
      routable: false
    },
    {
      id: "argent-square-park",
      kind: "park",
      label: "Argent Square",
      points: [
        { x: bounds.maxX - width * 0.28, y: bounds.minY + height * 0.55 },
        { x: bounds.maxX - width * 0.04, y: bounds.minY + height * 0.52 },
        { x: bounds.maxX - width * 0.02, y: bounds.minY + height * 0.75 },
        { x: bounds.maxX - width * 0.25, y: bounds.minY + height * 0.77 }
      ],
      fillColor: background.park.square.fillColor,
      strokeColor: background.park.square.strokeColor,
      routable: false
    },
    {
      id: "marlowe-market-block",
      kind: "land-block",
      label: "Market Quarter",
      points: [
        { x: bounds.minX + width * 0.36, y: bounds.minY + height * 0.35 },
        { x: bounds.minX + width * 0.63, y: bounds.minY + height * 0.34 },
        { x: bounds.minX + width * 0.64, y: bounds.minY + height * 0.55 },
        { x: bounds.minX + width * 0.35, y: bounds.minY + height * 0.56 }
      ],
      fillColor: background.landBlock.marketQuarter.fillColor,
      strokeColor: background.landBlock.marketQuarter.strokeColor,
      routable: false
    },
    {
      id: "marlowe-civic-quarter-block",
      kind: "land-block",
      label: "Civic Quarter",
      points: [
        { x: bounds.minX + width * 0.38, y: bounds.minY + height * 0.7 },
        { x: bounds.minX + width * 0.62, y: bounds.minY + height * 0.68 },
        { x: bounds.minX + width * 0.64, y: bounds.maxY + height * 0.05 },
        { x: bounds.minX + width * 0.36, y: bounds.maxY + height * 0.03 }
      ],
      fillColor: background.landBlock.civicQuarter.fillColor,
      strokeColor: background.landBlock.civicQuarter.strokeColor,
      routable: false
    }
  ];
}

export function buildSyntheticRouteOverlayVisuals(input: {
  rawRoutePoints?: readonly Vec2[];
  snappedRoutePoints?: readonly Vec2[];
  matchedRoutePoints?: readonly Vec2[];
  shortestLegalRoutePoints?: readonly Vec2[];
  acceptedAlternativeRoutePoints?: readonly Vec2[];
  inefficientRoutePoints?: readonly Vec2[];
  backtrackRoutePoints?: readonly Vec2[];
  illegalRoutePoints?: readonly Vec2[];
}): SyntheticRouteOverlayVisual[] {
  const overlays: SyntheticRouteOverlayVisual[] = [];

  const overlaysStyle = TOPOPASS_STREET_ATLAS_STYLE.routeOverlays;

  addRouteOverlay(overlays, "raw-route", input.rawRoutePoints, overlaysStyle.rawRoute);
  addRouteOverlay(overlays, "snapped-route", input.snappedRoutePoints, overlaysStyle.snappedRoute);
  addRouteOverlay(overlays, "matched-route", input.matchedRoutePoints, overlaysStyle.matchedRoute);
  addRouteOverlay(overlays, "shortest-legal-route", input.shortestLegalRoutePoints, overlaysStyle.shortestLegalRoute);
  addRouteOverlay(
    overlays,
    "accepted-alternative-route",
    input.acceptedAlternativeRoutePoints,
    overlaysStyle.acceptedAlternativeRoute
  );
  addRouteOverlay(overlays, "inefficient-section", input.inefficientRoutePoints, overlaysStyle.inefficientSection);
  addRouteOverlay(overlays, "backtrack-section", input.backtrackRoutePoints, overlaysStyle.backtrackSection);
  addRouteOverlay(overlays, "illegal-movement", input.illegalRoutePoints, overlaysStyle.illegalMovement);

  return overlays;
}

export function buildSyntheticStreetMapLegendItems(): SyntheticStreetMapLegendItem[] {
  return [
    {
      id: "major-road",
      label: "Major / secondary roads",
      description: "Wider orange and yellow roads highlight routable or important road geometry.",
      tone: "road-highlight"
    },
    {
      id: "context-road",
      label: "Grey context roads",
      description: "Grey roads are visible context or de-emphasised road geometry; use signs and route feedback to judge restrictions.",
      tone: "context-road"
    },
    {
      id: "your-route",
      label: "Your route",
      description: "Orange line shows raw drawing; purple line shows matched route.",
      tone: "route"
    },
    {
      id: "shortest-legal-route",
      label: "Shortest legal route",
      description: "Blue dashed line shows the legal comparison route to compare against the attempt.",
      tone: "shortest"
    },
    {
      id: "accepted-alternative-route",
      label: "Also valid",
      description: "Teal dotted line marks an accepted alternative when fixture or review data provides one.",
      tone: "shortest"
    },
    {
      id: "illegal-movement",
      label: "Illegal movement",
      description: "Solid red route section marks the offending attempted movement.",
      tone: "illegal"
    },
    {
      id: "inefficient-section",
      label: "Inefficient section",
      description: "Amber dashed route section marks a non-blocking route-review warning.",
      tone: "restricted"
    },
    {
      id: "no-entry",
      label: "No entry",
      description: "Red barred circle marks a no-entry affected road segment.",
      tone: "restriction"
    },
    {
      id: "one-way",
      label: "One-way",
      description: "Blue arrows show permitted one-way travel direction.",
      tone: "one-way"
    },
    {
      id: "prohibited-turn",
      label: "Prohibited turn",
      description: "Compact turn-ban sign marks a banned junction movement.",
      tone: "turn"
    },
    {
      id: "restricted-road",
      label: "Restricted road",
      description: "Amber treatment marks restricted or closed road segments.",
      tone: "restricted"
    },
    {
      id: "start",
      label: "Start",
      description: "Green pin and START bubble identify the required start.",
      tone: "start"
    },
    {
      id: "checkpoint",
      label: "Checkpoint",
      description: "Blue numbered marker identifies an ordered intermediate stop.",
      tone: "checkpoint"
    },
    {
      id: "finish",
      label: "Finish",
      description: "Red pin and DESTINATION bubble identify the required finish.",
      tone: "finish"
    },
    {
      id: "background",
      label: "Parks / water / blocks",
      description: "Fictional station, canal, goods-yard, park, and civic areas are visual only and are never routed.",
      tone: "background"
    }
  ];
}

function addRouteOverlay(
  overlays: SyntheticRouteOverlayVisual[],
  kind: SyntheticRouteOverlayKind,
  points: readonly Vec2[] | undefined,
  style: {
    strokeColor: string;
    strokeWidth: number;
    casingColor?: string;
    casingWidth?: number;
    dash?: readonly number[];
    alpha?: number;
  }
) {
  if (!points || points.length < 2) {
    return;
  }

  overlays.push({
    id: kind,
    kind,
    points: points.map((point) => ({ ...point })),
    strokeColor: style.strokeColor,
    strokeWidth: style.strokeWidth,
    ...(style.casingColor ? { casingColor: style.casingColor } : {}),
    ...(style.casingWidth ? { casingWidth: style.casingWidth } : {}),
    ...(style.dash ? { dash: [...style.dash] } : {}),
    ...(style.alpha ? { alpha: style.alpha } : {})
  });
}

function hasNoEntryRestriction(map: MapDefinition, roadId: string): boolean {
  return map.restrictions.some((restriction) => restriction.type === "no_entry" && restriction.roadId === roadId);
}

function hasRoadClosedRestriction(map: MapDefinition, roadId: string): boolean {
  return map.restrictions.some((restriction) => restriction.type === "road_closed" && restriction.roadId === roadId);
}

function roadEndpoints(map: MapDefinition, road: MapRoad): { from: Vec2; to: Vec2 } | null {
  const from = map.nodes.find((node) => node.id === road.fromNodeId);
  const to = map.nodes.find((node) => node.id === road.toNodeId);

  if (!from || !to) {
    return null;
  }

  return {
    from: { x: from.x, y: from.y },
    to: { x: to.x, y: to.y }
  };
}

function midpoint(from: Vec2, to: Vec2): Vec2 {
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2
  };
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

function polylineCenter(points: readonly Vec2[]): Vec2 {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  if (points.length === 1) {
    return { ...points[0] };
  }

  const totalLength = points.slice(1).reduce((sum, point, index) => sum + distanceBetweenPoints(points[index], point), 0);
  const targetLength = totalLength / 2;
  let travelledLength = 0;

  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    const segmentLength = distanceBetweenPoints(from, to);

    if (travelledLength + segmentLength >= targetLength) {
      const ratio = segmentLength > 0 ? (targetLength - travelledLength) / segmentLength : 0;

      return {
        x: from.x + (to.x - from.x) * ratio,
        y: from.y + (to.y - from.y) * ratio
      };
    }

    travelledLength += segmentLength;
  }

  return { ...points[points.length - 1] };
}

function polylineLabelPose(points: readonly Vec2[]): { point: Vec2; angleRadians: number } | null {
  return polylineLabelPoseAtFraction(points, 0.5);
}

function polylineLabelPoseAtFraction(
  points: readonly Vec2[],
  fraction: number
): { point: Vec2; angleRadians: number } | null {
  if (points.length < 2) {
    return null;
  }

  const totalLength = polylineLength(points);
  const targetLength = totalLength * clampNumber(fraction, 0.08, 0.92);
  let travelledLength = 0;

  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    const segmentLength = distanceBetweenPoints(from, to);

    if (travelledLength + segmentLength >= targetLength) {
      const ratio = segmentLength > 0 ? (targetLength - travelledLength) / segmentLength : 0;

      return {
        point: {
          x: from.x + (to.x - from.x) * ratio,
          y: from.y + (to.y - from.y) * ratio
        },
        angleRadians: Math.atan2(to.y - from.y, to.x - from.x)
      };
    }

    travelledLength += segmentLength;
  }

  const from = points[points.length - 2];
  const to = points[points.length - 1];

  return {
    point: { ...to },
    angleRadians: Math.atan2(to.y - from.y, to.x - from.x)
  };
}

function polylineLength(points: readonly Vec2[]): number {
  return points.slice(1).reduce((sum, point, index) => sum + distanceBetweenPoints(points[index], point), 0);
}

function isValidRoadReferenceSource(feature: Extract<RealLondonContextFeature, { kind: "road-reference" }>): boolean {
  const highway = feature.sourceTags?.highway?.trim();
  const references = roadReferencesFromRawRef(feature.sourceTags?.ref);

  if (!highway || !references.includes(feature.reference)) {
    return false;
  }

  return feature.subtype === "a-road"
    ? /^A\d{1,4}[A-Z]?(?:\([A-Z0-9]+\))?$/.test(feature.reference)
    : /^B\d{1,4}[A-Z]?$/.test(feature.reference);
}

function roadReferencesFromRawRef(ref: string | undefined): string[] {
  return (ref ?? "")
    .split(/[;,]/)
    .map((reference) => reference.trim().toUpperCase())
    .filter(Boolean);
}

function mapBounds(map: MapDefinition): { minX: number; minY: number; maxX: number; maxY: number } {
  if (map.nodes.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: 1,
      maxY: 1
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
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY
    }
  );
}

function roadLabelPriority(roadClass: SyntheticRoadClass, osmHierarchy?: OsmRoadVisualHierarchy): number {
  const priorities = TOPOPASS_STREET_ATLAS_STYLE.labels.priorities;
  const tier = roadLabelTier({ roadClass, osmHierarchy });

  if (tier === "major") {
    return priorities.majorRoad;
  }

  if (tier === "secondary") {
    return priorities.secondaryRoad;
  }

  if (tier === "restricted") {
    return priorities.restrictedRoad;
  }

  return priorities.localRoad;
}

function landmarkVisualKind(landmark: Landmark): SyntheticLandmarkVisualKind {
  if (landmark.type === "station") {
    return "station";
  }

  if (landmark.type === "hospital") {
    return "hospital";
  }

  if (landmark.type === "park") {
    return "open-space";
  }

  if (landmark.type === "market") {
    return "market";
  }

  if (landmark.type === "civic") {
    return "civic";
  }

  if (landmark.type === "place_of_worship") {
    return "religious";
  }

  if (landmark.type === "museum" || landmark.type === "entertainment") {
    return "museum";
  }

  if (landmark.type === "school") {
    return "education";
  }

  if (landmark.type === "library" || landmark.type === "office") {
    return "public-building";
  }

  if (landmark.type === "dock") {
    return "dock";
  }

  return "generic";
}

function buildLandmarkVisualFromPoint(
  id: string,
  kind: SyntheticLandmarkVisualKind,
  label: string,
  point: Vec2
): SyntheticLandmarkVisual {
  const visualStyle = landmarkVisualStyle(kind);

  return {
    id,
    kind,
    label,
    point: { ...point },
    radius: visualStyle.radius,
    fillColor: visualStyle.fillColor,
    strokeColor: visualStyle.strokeColor,
    haloColor: visualStyle.haloColor,
    priority: visualStyle.priority,
    isExerciseStop: false,
    routable: false
  };
}

function landmarkVisualStyle(kind: SyntheticLandmarkVisualKind): {
  radius: number;
  fillColor: string;
  strokeColor: string;
  haloColor: string;
  priority: number;
} {
  const atlasKind = atlasSymbolKindForVisualKind(kind);
  const atlasStyle = TOPOPASS_STREET_ATLAS_STYLE.atlasSymbols.styles[atlasKind];

  return {
    radius: atlasStyle.size,
    fillColor: atlasStyle.fillColor,
    strokeColor: atlasStyle.strokeColor,
    haloColor: "rgba(255,252,244,0.76)",
    priority: atlasStyle.priority
  };
}

function shouldLabelLandmark(visual: SyntheticLandmarkVisual): boolean {
  return visual.isExerciseStop || visual.priority <= 6;
}

function resolveRouteStopPoint(map: MapDefinition, stop: RouteStop): Vec2 | null {
  if (stop.type === "node") {
    const node = map.nodes.find((candidate) => candidate.id === stop.nodeId);

    return node ? { x: node.x, y: node.y } : null;
  }

  const landmark = map.landmarks.find((candidate) => candidate.id === stop.landmarkId);

  if (!landmark) {
    return null;
  }

  return {
    x: landmark.x,
    y: landmark.y
  };
}
