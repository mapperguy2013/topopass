import type { Landmark, MapDefinition, MapRoad, RouteExercise, RouteStop, Vec2 } from "../../../lib/map-engine/index.ts";

export type SyntheticRoadClass =
  | "major"
  | "secondary"
  | "local"
  | "service"
  | "one-way"
  | "no-entry"
  | "restricted";

export type SyntheticBackgroundFeatureKind = "park" | "water" | "land-block";

export type SyntheticLinearFeatureKind = "rail";

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

export function deriveSyntheticRoadClass(map: MapDefinition, road: MapRoad): SyntheticRoadClass {
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

  if (road.distanceMeters >= 155) {
    return "major";
  }

  if (road.distanceMeters >= 135) {
    return "secondary";
  }

  if (road.distanceMeters <= 126) {
    return "service";
  }

  return "local";
}

export function roadStyleForOsmHierarchy(hierarchy: OsmRoadVisualHierarchy): SyntheticRoadStyle {
  if (hierarchy === "primary") {
    return {
      casingColor: "#fff7ed",
      strokeColor: "#f5c84c",
      casingWidth: 14,
      strokeWidth: 8
    };
  }

  if (hierarchy === "secondary" || hierarchy === "tertiary") {
    return {
      casingColor: "#ffffff",
      strokeColor: "#f4d27c",
      casingWidth: 11,
      strokeWidth: 6
    };
  }

  if (hierarchy === "service") {
    return {
      casingColor: "#ffffff",
      strokeColor: "#d8e0ea",
      casingWidth: 6,
      strokeWidth: 2.5
    };
  }

  if (hierarchy === "residential") {
    return {
      casingColor: "#ffffff",
      strokeColor: "#cbd5e1",
      casingWidth: 8,
      strokeWidth: 4
    };
  }

  return {
    casingColor: "#ffffff",
    strokeColor: "#cbd5e1",
    casingWidth: 7,
    strokeWidth: 3.5
  };
}

export function roadStyleForSyntheticClass(roadClass: SyntheticRoadClass): SyntheticRoadStyle {
  if (roadClass === "major") {
    return {
      casingColor: "#fff7ed",
      strokeColor: "#f3c44f",
      casingWidth: 15,
      strokeWidth: 9
    };
  }

  if (roadClass === "secondary") {
    return {
      casingColor: "#ffffff",
      strokeColor: "#f6d58a",
      casingWidth: 12,
      strokeWidth: 7
    };
  }

  if (roadClass === "one-way") {
    return {
      casingColor: "#ffffff",
      strokeColor: "#bfdbfe",
      casingWidth: 11,
      strokeWidth: 6
    };
  }

  if (roadClass === "no-entry") {
    return {
      casingColor: "#fee2e2",
      strokeColor: "#fecaca",
      casingWidth: 11,
      strokeWidth: 6
    };
  }

  if (roadClass === "restricted") {
    return {
      casingColor: "#fed7aa",
      strokeColor: "#fdba74",
      casingWidth: 11,
      strokeWidth: 5,
      dash: [10, 6]
    };
  }

  if (roadClass === "service") {
    return {
      casingColor: "#ffffff",
      strokeColor: "#dbe2ea",
      casingWidth: 8,
      strokeWidth: 3
    };
  }

  return {
    casingColor: "#ffffff",
    strokeColor: "#cbd5e1",
    casingWidth: 9,
    strokeWidth: 4.5
  };
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

  for (const feature of buildSyntheticBackgroundFeatures(map)) {
    if (!feature.label) {
      continue;
    }

    labels.push({
      id: `area-label-${feature.id}`,
      kind: "area",
      text: feature.label,
      point: polygonCenter(feature.points),
      priority: 2
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
        priority: 10
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

export function buildSyntheticLinearFeatures(map: MapDefinition): SyntheticLinearFeature[] {
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
      casingColor: "rgba(255,255,255,0.86)",
      strokeColor: "#64748b",
      casingWidth: 9,
      strokeWidth: 4,
      dash: [8, 7],
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

export function buildSyntheticBackgroundFeatures(map: MapDefinition): SyntheticBackgroundFeature[] {
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
      fillColor: "#dbeafe",
      strokeColor: "#bfdbfe",
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
      fillColor: "#c7ddf8",
      strokeColor: "#93c5fd",
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
      fillColor: "#e0e7ff",
      strokeColor: "#c7d2fe",
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
      fillColor: "#f1f5f9",
      strokeColor: "#cbd5e1",
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
      fillColor: "#dcfce7",
      strokeColor: "#bbf7d0",
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
      fillColor: "#bbf7d0",
      strokeColor: "#86efac",
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
      fillColor: "#f8fafc",
      strokeColor: "#e2e8f0",
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
      fillColor: "#e0f2fe",
      strokeColor: "#bae6fd",
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

  addRouteOverlay(overlays, "raw-route", input.rawRoutePoints, "#f97316", 4);
  addRouteOverlay(overlays, "snapped-route", input.snappedRoutePoints, "#22c55e", 3, [6, 5]);
  addRouteOverlay(overlays, "matched-route", input.matchedRoutePoints, "#7c3aed", 8);
  addRouteOverlay(overlays, "shortest-legal-route", input.shortestLegalRoutePoints, "#0ea5e9", 4, [10, 6]);
  addRouteOverlay(overlays, "illegal-movement", input.illegalRoutePoints, "#dc2626", 9);

  return overlays;
}

export function buildSyntheticStreetMapLegendItems(): SyntheticStreetMapLegendItem[] {
  return [
    {
      id: "major-road",
      label: "Major / secondary roads",
      description: "Wider warm roads show the main synthetic street hierarchy.",
      tone: "road"
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
      description: "Blue arrows show one-way travel direction.",
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
  strokeColor: string,
  strokeWidth: number,
  dash?: number[]
) {
  if (!points || points.length < 2) {
    return;
  }

  overlays.push({
    id: kind,
    kind,
    points: points.map((point) => ({ ...point })),
    strokeColor,
    strokeWidth,
    ...(dash ? { dash: [...dash] } : {})
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
  if (roadClass === "major") {
    return 3;
  }

  if (roadClass === "secondary" || roadClass === "one-way") {
    return 4;
  }

  if (roadClass === "no-entry" || roadClass === "restricted") {
    return 5;
  }

  return 6;
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
  if (kind === "station") {
    return {
      radius: 10,
      fillColor: "#ffffff",
      strokeColor: "#dc2626",
      haloColor: "rgba(220,38,38,0.14)",
      priority: 2
    };
  }

  if (kind === "hospital") {
    return {
      radius: 9,
      fillColor: "#eff6ff",
      strokeColor: "#2563eb",
      haloColor: "rgba(37,99,235,0.13)",
      priority: 3
    };
  }

  if (kind === "park") {
    return {
      radius: 8,
      fillColor: "#ecfdf5",
      strokeColor: "#16a34a",
      haloColor: "rgba(22,163,74,0.13)",
      priority: 4
    };
  }

  if (kind === "market" || kind === "dock") {
    return {
      radius: 8,
      fillColor: "#fff7ed",
      strokeColor: "#ea580c",
      haloColor: "rgba(234,88,12,0.13)",
      priority: 5
    };
  }

  if (kind === "civic" || kind === "church" || kind === "museum") {
    return {
      radius: 8,
      fillColor: "#f8fafc",
      strokeColor: "#475569",
      haloColor: "rgba(71,85,105,0.12)",
      priority: 5
    };
  }

  return {
    radius: 6,
    fillColor: "#ffffff",
    strokeColor: "#64748b",
    haloColor: "rgba(100,116,139,0.1)",
    priority: 7
  };
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
