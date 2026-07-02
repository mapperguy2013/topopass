import type { Landmark, MapDefinition, MapRoad, RouteExercise, RouteStop, Vec2 } from "../../../lib/map-engine/index.ts";
import { projectOsmCoordinateToLocalMeters } from "../../../lib/map-engine/osm/index.ts";
import type {
  OsmLocalProjection,
  OverpassElementId,
  OverpassJsonResponse,
  OverpassNodeElement,
  OverpassTags,
  OverpassWayElement
} from "../../../lib/map-engine/osm/index.ts";
import { TOPOPASS_STREET_ATLAS_STYLE } from "./topopassCartographyStyle.ts";

export type SyntheticRoadClass =
  | "major"
  | "secondary"
  | "local"
  | "service"
  | "one-way"
  | "no-entry"
  | "restricted";

export type SyntheticBackgroundFeatureKind = "park" | "water" | "land-block" | "open-space" | "pedestrian-area";

export type SyntheticLinearFeatureKind = "rail" | "waterway";

export type SyntheticLandmarkVisualKind =
  | "station"
  | "hospital"
  | "park"
  | "market"
  | "civic"
  | "church"
  | "museum"
  | "dock"
  | "generic";

export type SyntheticMapLabelKind = "road" | "area" | "landmark" | "start" | "checkpoint" | "finish";

export type SyntheticRouteOverlayKind =
  | "raw-route"
  | "snapped-route"
  | "matched-route"
  | "shortest-legal-route"
  | "illegal-movement";

export type SyntheticLegendTone =
  | "route"
  | "shortest"
  | "illegal"
  | "restriction"
  | "one-way"
  | "turn"
  | "restricted"
  | "start"
  | "checkpoint"
  | "finish"
  | "road"
  | "road-highlight"
  | "context-road"
  | "background";

export type SyntheticRoadStyle = {
  casingColor: string;
  strokeColor: string;
  casingWidth: number;
  strokeWidth: number;
  dash?: number[];
};

export type OsmRoadVisualHierarchy =
  | "primary"
  | "secondary"
  | "tertiary"
  | "residential"
  | "service"
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
  routable: false;
};

export type SyntheticMapLabel = {
  id: string;
  kind: SyntheticMapLabelKind;
  text: string;
  point: Vec2;
  angleRadians?: number;
  priority: number;
};

export type SyntheticRouteOverlayVisual = {
  id: string;
  kind: SyntheticRouteOverlayKind;
  points: Vec2[];
  strokeColor: string;
  strokeWidth: number;
  dash?: number[];
};

export type SyntheticStreetMapLegendItem = {
  id: string;
  label: string;
  description: string;
  tone: SyntheticLegendTone;
};

export type BuildSyntheticMapLabelOptions = {
  includeOsmRoadLabels?: boolean;
  backgroundFeatures?: readonly SyntheticBackgroundFeature[];
};

export type BuildSyntheticContextOptions = {
  sourceOverpassFixture?: unknown;
};

type RoadWithOptionalOsmMetadata = MapRoad & {
  metadata?: {
    source?: string;
    highway?: string;
    osmWayId?: string | number;
  };
};

function osmRoadMetadata(road: MapRoad): RoadWithOptionalOsmMetadata["metadata"] | null {
  const metadata = (road as RoadWithOptionalOsmMetadata).metadata;

  return metadata?.source === "osm" ? metadata : null;
}

function isOsmMap(map: MapDefinition): boolean {
  const metadata = (map as { metadata?: { source?: unknown } }).metadata;

  return metadata?.source === "osm" || map.roads.some((road) => osmRoadMetadata(road) !== null);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isTagRecord(value: unknown): value is OverpassTags {
  return (
    isRecord(value) &&
    Object.values(value).every((tagValue) => typeof tagValue === "string")
  );
}

function isOverpassNodeElement(value: unknown): value is OverpassNodeElement {
  return (
    isRecord(value) &&
    value.type === "node" &&
    typeof value.id === "number" &&
    typeof value.lat === "number" &&
    typeof value.lon === "number"
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

function osmProjectionForMap(map: MapDefinition): OsmLocalProjection | null {
  const metadata = (map as { metadata?: { source?: unknown; projection?: unknown } }).metadata;
  const projection = metadata?.projection;

  if (metadata?.source !== "osm" || !isRecord(projection)) {
    return null;
  }

  return projection as OsmLocalProjection;
}

function overpassContextFromFixture(
  fixture: unknown
): { nodesById: Map<OverpassElementId, OverpassNodeElement>; ways: OverpassWayElement[] } | null {
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

export function deriveOsmRoadVisualHierarchy(road: MapRoad): OsmRoadVisualHierarchy | null {
  const highway = osmRoadMetadata(road)?.highway;

  if (!highway) {
    return osmRoadMetadata(road) ? "unknown" : null;
  }

  if (highway === "primary" || highway === "primary_link") {
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

  if (highway === "residential" || highway === "living_street" || highway === "unclassified") {
    return "residential";
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

  return "local";
}

function cloneRoadStyle(style: TopopassRoadStyleToken): SyntheticRoadStyle {
  return {
    casingColor: style.casingColor,
    strokeColor: style.strokeColor,
    casingWidth: style.casingWidth,
    strokeWidth: style.strokeWidth,
    ...(style.dash ? { dash: [...style.dash] } : {})
  };
}

type TopopassRoadStyleToken = {
  casingColor: string;
  strokeColor: string;
  casingWidth: number;
  strokeWidth: number;
  dash?: readonly number[];
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

export function buildSyntheticRoadVisuals(map: MapDefinition): SyntheticRoadVisual[] {
  return map.roads.flatMap((road) => {
    const endpoints = roadEndpoints(map, road);

    if (!endpoints) {
      return [];
    }

    const roadClass = deriveSyntheticRoadClass(map, road);
    const label = deriveRoadLabelPosition(map, road);
    const osmMetadata = deriveOsmRoadRenderMetadata(road);
    const style = osmMetadata ? roadStyleForOsmHierarchy(osmMetadata.hierarchy) : roadStyleForSyntheticClass(roadClass);

    return [
      {
        roadId: road.id,
        name: road.name ?? road.id,
        roadClass,
        source: osmMetadata ? "osm" : "synthetic",
        ...(osmMetadata?.highway ? { osmHighway: osmMetadata.highway } : {}),
        ...(osmMetadata ? { osmHierarchy: osmMetadata.hierarchy } : {}),
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
      priority: roadLabelPriority(visual.roadClass)
    });
  }

  if (options.includeOsmRoadLabels) {
    labels.push(...buildOsmRoadLabels(roadVisuals));
  }

  for (const feature of options.backgroundFeatures ?? buildSyntheticBackgroundFeatures(map)) {
    if (!feature.label) {
      continue;
    }

    labels.push({
      id: `area-label-${feature.id}`,
      kind: "area",
      text: feature.label,
      point: polygonCenter(feature.points),
      priority: TOPOPASS_STREET_ATLAS_STYLE.labels.priorities.area
    });
  }

  const labelledLandmarks = buildSyntheticLandmarkVisuals(map, exercise).filter((visual) => shouldLabelLandmark(visual));

  for (const visual of labelledLandmarks) {
    labels.push({
      id: `landmark-label-${visual.id}`,
      kind: "landmark",
      text: visual.label,
      point: { x: visual.point.x, y: visual.point.y - 18 },
      priority: visual.isExerciseStop ? 8 : visual.priority
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
        text: isStart ? "START" : isFinish ? "FINISH" : `CHECKPOINT ${index}`,
        point,
        priority: TOPOPASS_STREET_ATLAS_STYLE.labels.priorities.exerciseStop
      });
    });
  }

  return labels.sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
}

function buildOsmRoadLabels(roadVisuals: readonly SyntheticRoadVisual[]): SyntheticMapLabel[] {
  const labelsByName = new Map<string, SyntheticRoadVisual[]>();

  for (const visual of roadVisuals) {
    if (visual.source !== "osm" || visual.name === visual.roadId || visual.name.trim().length === 0) {
      continue;
    }

    const group = labelsByName.get(visual.name) ?? [];

    group.push(visual);
    labelsByName.set(visual.name, group);
  }

  return [...labelsByName.entries()].map(([name, visuals]) => {
    const selectedVisual = selectOsmRoadLabelVisual(visuals);

    return {
      id: `road-label-osm-${slugifyLabelId(name)}`,
      kind: "road",
      text: name,
      point: { ...selectedVisual.midpoint },
      angleRadians: selectedVisual.labelAngleRadians,
      priority: roadLabelPriority(selectedVisual.roadClass)
    };
  });
}

function selectOsmRoadLabelVisual(visuals: readonly SyntheticRoadVisual[]): SyntheticRoadVisual {
  return [...visuals].sort((left, right) => {
    const classPriority = roadLabelPriority(left.roadClass) - roadLabelPriority(right.roadClass);

    if (classPriority !== 0) {
      return classPriority;
    }

    const lengthDifference = roadVisualLength(right) - roadVisualLength(left);

    if (lengthDifference !== 0) {
      return lengthDifference;
    }

    return left.roadId.localeCompare(right.roadId);
  })[0];
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

function namedContextLabel(tags: OverpassTags): string | undefined {
  const name = tags.name?.trim();

  return name && name.length > 0 ? name : undefined;
}

function osmBackgroundStyleForTags(tags: OverpassTags): Pick<
  SyntheticBackgroundFeature,
  "kind" | "fillColor" | "strokeColor" | "label"
> | null {
  const background = TOPOPASS_STREET_ATLAS_STYLE.background;

  if (tags.natural === "water" || tags.water) {
    return {
      kind: "water",
      label: namedContextLabel(tags),
      fillColor: background.water.basin.fillColor,
      strokeColor: background.water.basin.strokeColor
    };
  }

  if (tags.leisure === "park" || tags.leisure === "garden") {
    return {
      kind: "park",
      label: namedContextLabel(tags),
      fillColor: background.park.garden.fillColor,
      strokeColor: background.park.garden.strokeColor
    };
  }

  if (
    tags.leisure === "recreation_ground" ||
    tags.landuse === "grass" ||
    tags.landuse === "recreation_ground" ||
    tags.landuse === "village_green" ||
    tags.landuse === "meadow" ||
    tags.landuse === "forest" ||
    tags.natural === "wood" ||
    tags.natural === "grassland"
  ) {
    return {
      kind: "open-space",
      label: namedContextLabel(tags),
      fillColor: background.openSpace.fillColor,
      strokeColor: background.openSpace.strokeColor
    };
  }

  if (tags.highway === "pedestrian" && tags.area === "yes") {
    return {
      kind: "pedestrian-area",
      label: namedContextLabel(tags),
      fillColor: background.pedestrianArea.fillColor,
      strokeColor: background.pedestrianArea.strokeColor
    };
  }

  return null;
}

function buildOsmBackgroundFeatures(map: MapDefinition, fixture: unknown): SyntheticBackgroundFeature[] {
  const projection = osmProjectionForMap(map);
  const overpassContext = overpassContextFromFixture(fixture);

  if (!projection || !overpassContext) {
    return [];
  }

  return overpassContext.ways.flatMap((way) => {
    const tags = way.tags ?? {};
    const style = osmBackgroundStyleForTags(tags);

    if (!style || !isClosedWay(way)) {
      return [];
    }

    const points = projectedWayPoints({
      way,
      nodesById: overpassContext.nodesById,
      projection
    });

    if (points.length < 4) {
      return [];
    }

    return [
      {
        id: `osm-context-way-${way.id}`,
        ...style,
        points,
        routable: false as const
      }
    ];
  });
}

function osmLinearFeatureStyleForTags(tags: OverpassTags): Pick<
  SyntheticLinearFeature,
  "kind" | "casingColor" | "strokeColor" | "casingWidth" | "strokeWidth" | "dash" | "label"
> | null {
  if (tags.railway === "rail" || tags.railway === "light_rail") {
    return {
      kind: "rail",
      label: namedContextLabel(tags),
      casingColor: TOPOPASS_STREET_ATLAS_STYLE.rail.casingColor ?? "",
      strokeColor: TOPOPASS_STREET_ATLAS_STYLE.rail.strokeColor,
      casingWidth: TOPOPASS_STREET_ATLAS_STYLE.rail.casingWidth ?? 0,
      strokeWidth: TOPOPASS_STREET_ATLAS_STYLE.rail.strokeWidth,
      dash: [...(TOPOPASS_STREET_ATLAS_STYLE.rail.dash ?? [])]
    };
  }

  if (tags.waterway && !tags.area) {
    const style = TOPOPASS_STREET_ATLAS_STYLE.background.water.linear;

    return {
      kind: "waterway",
      label: namedContextLabel(tags),
      casingColor: style.casingColor ?? "",
      strokeColor: style.strokeColor,
      casingWidth: style.casingWidth ?? 0,
      strokeWidth: style.strokeWidth
    };
  }

  return null;
}

function buildOsmLinearFeatures(map: MapDefinition, fixture: unknown): SyntheticLinearFeature[] {
  const projection = osmProjectionForMap(map);
  const overpassContext = overpassContextFromFixture(fixture);

  if (!projection || !overpassContext) {
    return [];
  }

  return overpassContext.ways.flatMap((way) => {
    const style = osmLinearFeatureStyleForTags(way.tags ?? {});

    if (!style || isClosedWay(way)) {
      return [];
    }

    const points = projectedWayPoints({
      way,
      nodesById: overpassContext.nodesById,
      projection
    });

    if (points.length < 2) {
      return [];
    }

    return [
      {
        id: `osm-context-way-${way.id}`,
        ...style,
        points,
        routable: false as const
      }
    ];
  });
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
      casingColor: TOPOPASS_STREET_ATLAS_STYLE.rail.casingColor ?? "",
      strokeColor: TOPOPASS_STREET_ATLAS_STYLE.rail.strokeColor,
      casingWidth: TOPOPASS_STREET_ATLAS_STYLE.rail.casingWidth ?? 0,
      strokeWidth: TOPOPASS_STREET_ATLAS_STYLE.rail.strokeWidth,
      dash: [...(TOPOPASS_STREET_ATLAS_STYLE.rail.dash ?? [])],
      routable: false
    }
  ];
}

export function buildSyntheticLandmarkVisuals(
  map: MapDefinition,
  exercise?: RouteExercise
): SyntheticLandmarkVisual[] {
  const exerciseLandmarkIds = new Set(
    exercise?.stops.flatMap((stop) => (stop.type === "landmark" ? [stop.landmarkId] : [])) ?? []
  );

  return map.landmarks
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
        routable: false as const
      };
    })
    .sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
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
  illegalRoutePoints?: readonly Vec2[];
}): SyntheticRouteOverlayVisual[] {
  const overlays: SyntheticRouteOverlayVisual[] = [];

  const overlaysStyle = TOPOPASS_STREET_ATLAS_STYLE.routeOverlays;

  addRouteOverlay(overlays, "raw-route", input.rawRoutePoints, overlaysStyle.rawRoute);
  addRouteOverlay(overlays, "snapped-route", input.snappedRoutePoints, overlaysStyle.snappedRoute);
  addRouteOverlay(overlays, "matched-route", input.matchedRoutePoints, overlaysStyle.matchedRoute);
  addRouteOverlay(overlays, "shortest-legal-route", input.shortestLegalRoutePoints, overlaysStyle.shortestLegalRoute);
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
      description: "Blue dashed line when a shortest-route overlay is available.",
      tone: "shortest"
    },
    {
      id: "illegal-movement",
      label: "Illegal movement",
      description: "Solid red route section marks the offending attempted movement.",
      tone: "illegal"
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
      description: "Blue marker identifies the required start.",
      tone: "start"
    },
    {
      id: "checkpoint",
      label: "Checkpoint",
      description: "Orange marker identifies an ordered intermediate stop.",
      tone: "checkpoint"
    },
    {
      id: "finish",
      label: "Finish",
      description: "Dark marker identifies the destination.",
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
  style: { strokeColor: string; strokeWidth: number; dash?: readonly number[] }
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
    ...(style.dash ? { dash: [...style.dash] } : {})
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

function roadLabelPriority(roadClass: SyntheticRoadClass): number {
  const priorities = TOPOPASS_STREET_ATLAS_STYLE.labels.priorities;

  if (roadClass === "major") {
    return priorities.majorRoad;
  }

  if (roadClass === "secondary" || roadClass === "one-way") {
    return priorities.secondaryRoad;
  }

  if (roadClass === "no-entry" || roadClass === "restricted") {
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
    return "park";
  }

  if (landmark.type === "market") {
    return "market";
  }

  if (landmark.type === "civic") {
    return "civic";
  }

  if (landmark.type === "place_of_worship") {
    return "church";
  }

  if (landmark.type === "museum" || landmark.type === "entertainment") {
    return "museum";
  }

  if (landmark.type === "dock") {
    return "dock";
  }

  return "generic";
}

function landmarkVisualStyle(kind: SyntheticLandmarkVisualKind): {
  radius: number;
  fillColor: string;
  strokeColor: string;
  haloColor: string;
  priority: number;
} {
  const style = TOPOPASS_STREET_ATLAS_STYLE;

  if (kind === "station") {
    return {
      radius: style.station.radius,
      fillColor: style.station.fillColor,
      strokeColor: style.station.strokeColor,
      haloColor: style.station.haloColor,
      priority: style.station.priority
    };
  }

  if (kind === "hospital") {
    return { ...style.landmarks.hospital };
  }

  if (kind === "park") {
    return { ...style.landmarks.park };
  }

  if (kind === "market" || kind === "dock") {
    return { ...(kind === "market" ? style.landmarks.market : style.landmarks.dock) };
  }

  if (kind === "civic" || kind === "church" || kind === "museum") {
    return { ...style.landmarks[kind] };
  }

  return { ...style.landmarks.generic };
}

function shouldLabelLandmark(visual: SyntheticLandmarkVisual): boolean {
  return visual.isExerciseStop || visual.priority <= 5;
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
