import type { ScreenMapViewport, TurnRestrictionVisual, TurnRestrictionVisualKind, Vec2 } from "../../../lib/map-engine/index.ts";
import type { RoadRestrictionOverlay, RouteIssueOverlay } from "./routeRunnerDisplay.ts";
import {
  cartographicRestrictionSymbolScaleForViewport,
  type SyntheticLabelCollisionBox,
  type SyntheticStreetMapLegendItem
} from "./syntheticStreetMapRenderer.ts";
import { TOPOPASS_STREET_ATLAS_STYLE } from "./topopassCartographyStyle.ts";

export type RestrictionMapVisualKind =
  | "no-entry"
  | "one-way"
  | "prohibited-turn"
  | "restricted-road"
  | "illegal-movement"
  | "missed-restriction";

export type RestrictionMapVisualSymbol =
  | "no-entry-sign"
  | "one-way-arrow"
  | "turn-ban-sign"
  | "restricted-road-sign"
  | "illegal-route-section"
  | "disconnected-gap";

export type RestrictionMapVisualItem = {
  id: string;
  kind: RestrictionMapVisualKind;
  symbol: RestrictionMapVisualSymbol;
  label: string;
  point: Vec2;
  points: Vec2[];
  roadIds: string[];
  priority: number;
  sourceId?: string;
  movementIndex?: number;
  fromRoadId?: string;
  toRoadId?: string;
  viaNodeId?: string;
  turnKind?: TurnRestrictionVisualKind;
  direction?: {
    from: Vec2;
    to: Vec2;
  };
};

export type RestrictionZoomTier = "low" | "medium" | "high";

export type RestrictionMapVisualZoomStyle = {
  alpha: number;
  scale: number;
};

export type RestrictionFocusReviewItem = {
  id: string;
  label: string;
  detail?: string;
};

export type RestrictionFocusTarget = {
  id: string;
  reviewItemId: string;
  visualItemId: string;
  kind: RestrictionMapVisualKind;
  label: string;
  point: Vec2;
  points: Vec2[];
  roadIds: string[];
};

export type SelectedRestrictionHighlight = {
  id: string;
  targetId: string;
  label: string;
  point: Vec2;
  points: Vec2[];
  kind: RestrictionMapVisualKind;
};

export type BuildRestrictionMapVisualItemsInput = {
  roadRestrictionOverlays: readonly RoadRestrictionOverlay[];
  turnRestrictionVisuals: readonly TurnRestrictionVisual[];
  routeIssueOverlays: readonly RouteIssueOverlay[];
  viewport?: ScreenMapViewport;
  zoomTier?: RestrictionZoomTier;
};

export type FilterRestrictionMapVisualItemsOptions = {
  reservedBoxes?: readonly SyntheticLabelCollisionBox[];
  currentZoom?: number;
};

const LONG_ROAD_ARROW_THRESHOLD = TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering.longRoadArrowThresholdMeters;
export const ONE_WAY_ARROW_MIN_SPACING_METERS =
  TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering.oneWayArrowMinSpacingMeters;

function viewportScale(viewport: ScreenMapViewport): number {
  const width = viewport.mapBounds.maxX - viewport.mapBounds.minX;
  const height = viewport.mapBounds.maxY - viewport.mapBounds.minY;
  const scaleX = width > 0 ? viewport.width / width : 0;
  const scaleY = height > 0 ? viewport.height / height : 0;
  const scale = Math.min(scaleX, scaleY);

  return Number.isFinite(scale) ? scale : 0;
}

export function restrictionZoomTierForViewport(viewport: ScreenMapViewport): RestrictionZoomTier {
  const scale = viewportScale(viewport);
  const decluttering = TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering;

  if (scale < decluttering.lowDetailViewportScale) {
    return "low";
  }

  if (scale >= decluttering.highDetailViewportScale) {
    return "high";
  }

  return "medium";
}

function clonePoint(point: Vec2): Vec2 {
  return {
    x: point.x,
    y: point.y
  };
}

function distanceBetween(from: Vec2, to: Vec2): number {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

function boxIntersects(left: SyntheticLabelCollisionBox, right: SyntheticLabelCollisionBox): boolean {
  return left.minX <= right.maxX && left.maxX >= right.minX && left.minY <= right.maxY && left.maxY >= right.minY;
}

function polylineLength(points: readonly Vec2[]): number {
  return points.slice(1).reduce((sum, point, index) => sum + distanceBetween(points[index], point), 0);
}

function lerpPoint(from: Vec2, to: Vec2, ratio: number): Vec2 {
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio
  };
}

function offsetPoint(point: Vec2, index: number): Vec2 {
  if (index === 0) {
    return clonePoint(point);
  }

  const offset = 8 * index;

  return {
    x: point.x + offset,
    y: point.y - offset
  };
}

function overlayPoints(overlay: RoadRestrictionOverlay | RouteIssueOverlay): Vec2[] {
  return overlay.points.map(clonePoint);
}

function overlayPoint(overlay: RoadRestrictionOverlay | RouteIssueOverlay, index = 0): Vec2 {
  return offsetPoint(overlay.midpoint, index);
}

function roadRestrictionItemsByKind(
  overlays: readonly RoadRestrictionOverlay[],
  kind: RoadRestrictionOverlay["kind"]
): RoadRestrictionOverlay[] {
  return overlays.filter((overlay) => overlay.kind === kind);
}

export function buildNoEntryVisualItems(overlays: readonly RoadRestrictionOverlay[]): RestrictionMapVisualItem[] {
  return roadRestrictionItemsByKind(overlays, "no-entry").map((overlay, index) => ({
    id: `no-entry:${overlay.roadId}:${index}`,
    kind: "no-entry",
    symbol: "no-entry-sign",
    label: overlay.label,
    point: overlay.direction ? lerpPoint(overlay.direction.from, overlay.direction.to, 0.58) : overlayPoint(overlay, index),
    points: overlayPoints(overlay),
    roadIds: [overlay.roadId],
    priority: 30,
    sourceId: overlay.roadId,
    ...(overlay.direction ? { direction: { from: clonePoint(overlay.direction.from), to: clonePoint(overlay.direction.to) } } : {})
  }));
}

function oneWayArrowSpacingForZoomTier(tier: RestrictionZoomTier): number {
  const decluttering = TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering;

  if (tier === "medium") {
    return decluttering.oneWayArrowMinSpacingMeters * decluttering.mediumOneWayArrowSpacingMultiplier;
  }

  return decluttering.oneWayArrowMinSpacingMeters * decluttering.highOneWayArrowSpacingMultiplier;
}

function oneWayArrowSpacingForViewport(viewport?: ScreenMapViewport): number {
  return oneWayArrowSpacingForZoomTier(viewport ? restrictionZoomTierForViewport(viewport) : "high");
}

export function buildOneWayVisualItems(
  overlays: readonly RoadRestrictionOverlay[],
  options: { viewport?: ScreenMapViewport; zoomTier?: RestrictionZoomTier } = {}
): RestrictionMapVisualItem[] {
  const lastRenderedPointByRoadGroup = new Map<string, Vec2>();
  const items: RestrictionMapVisualItem[] = [];
  const arrowStyle = TOPOPASS_STREET_ATLAS_STYLE.restrictions.oneWay;
  const minSpacingMeters = options.zoomTier
    ? oneWayArrowSpacingForZoomTier(options.zoomTier)
    : oneWayArrowSpacingForViewport(options.viewport);

  for (const overlay of roadRestrictionItemsByKind(overlays, "one-way")) {
    const direction = overlay.direction;

    if (!direction) {
      continue;
    }

    const ratios =
      distanceBetween(direction.from, direction.to) >= LONG_ROAD_ARROW_THRESHOLD
        ? arrowStyle.longRoadRatios
        : [arrowStyle.shortRoadRatio];
    const roadGroupId = overlay.renderGroupId ?? overlay.roadId;

    ratios.forEach((ratio, index) => {
      const point = lerpPoint(direction.from, direction.to, ratio);
      const previousPoint = lastRenderedPointByRoadGroup.get(roadGroupId);

      if (previousPoint && distanceBetween(previousPoint, point) < minSpacingMeters) {
        return;
      }

      lastRenderedPointByRoadGroup.set(roadGroupId, point);
      items.push({
        id: `one-way:${overlay.roadId}:${index}`,
        kind: "one-way",
        symbol: "one-way-arrow",
        label: overlay.label,
        point,
        points: overlayPoints(overlay),
        roadIds: [overlay.roadId],
        priority: 20,
        sourceId: overlay.roadId,
        direction: {
          from: clonePoint(direction.from),
          to: clonePoint(direction.to)
        }
      });
    });
  }

  return items;
}

export function buildRestrictedRoadVisualItems(overlays: readonly RoadRestrictionOverlay[]): RestrictionMapVisualItem[] {
  return roadRestrictionItemsByKind(overlays, "restricted").map((overlay, index) => ({
    id: `restricted-road:${overlay.roadId}:${index}`,
    kind: "restricted-road",
    symbol: "restricted-road-sign",
    label: overlay.label,
    point: overlayPoint(overlay, index),
    points: overlayPoints(overlay),
    roadIds: [overlay.roadId],
    priority: 35,
    sourceId: overlay.roadId
  }));
}

export function buildProhibitedTurnVisualItems(
  visuals: readonly TurnRestrictionVisual[]
): RestrictionMapVisualItem[] {
  const seen = new Set<string>();
  const items: RestrictionMapVisualItem[] = [];

  for (const visual of visuals) {
    const key = `${visual.fromRoadId}:${visual.viaNodeId}:${visual.toRoadId}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    items.push({
      id: `prohibited-turn:${visual.id}`,
      kind: "prohibited-turn",
      symbol: "turn-ban-sign",
      label: visual.label,
      point: clonePoint(visual.signPosition),
      points: [clonePoint(visual.incomingRoadPoint), clonePoint(visual.junction), clonePoint(visual.outgoingRoadPoint)],
      roadIds: [visual.fromRoadId, visual.toRoadId],
      priority: 40,
      sourceId: visual.id,
      fromRoadId: visual.fromRoadId,
      toRoadId: visual.toRoadId,
      viaNodeId: visual.viaNodeId,
      turnKind: visual.turnKind
    });
  }

  return items;
}

export function buildTurnRestrictionVisualItemsOrEmpty(
  visuals?: readonly TurnRestrictionVisual[] | null
): RestrictionMapVisualItem[] {
  return buildProhibitedTurnVisualItems(visuals ?? []);
}

function routeIssueSymbol(overlay: RouteIssueOverlay): RestrictionMapVisualSymbol {
  return overlay.kind === "disconnected" ? "disconnected-gap" : "illegal-route-section";
}

export function buildIllegalMovementVisualItems(overlays: readonly RouteIssueOverlay[]): RestrictionMapVisualItem[] {
  return overlays.map((overlay, index) => ({
    id: `route-issue:${overlay.kind}:${overlay.movementIndex ?? "transition"}:${overlay.roadIds.join(">")}:${index}`,
    kind: overlay.kind === "disconnected" ? "missed-restriction" : "illegal-movement",
    symbol: routeIssueSymbol(overlay),
    label: overlay.label,
    point: clonePoint(overlay.midpoint),
    points: overlayPoints(overlay),
    roadIds: [...overlay.roadIds],
    priority: overlay.kind === "disconnected" ? 80 : 90,
    movementIndex: overlay.movementIndex,
    ...(overlay.direction ? { direction: { from: clonePoint(overlay.direction.from), to: clonePoint(overlay.direction.to) } } : {})
  }));
}

export function buildRestrictionMapVisualItems(
  input: BuildRestrictionMapVisualItemsInput
): RestrictionMapVisualItem[] {
  return [
    ...buildNoEntryVisualItems(input.roadRestrictionOverlays),
    ...buildOneWayVisualItems(input.roadRestrictionOverlays, { viewport: input.viewport, zoomTier: input.zoomTier }),
    ...buildRestrictedRoadVisualItems(input.roadRestrictionOverlays),
    ...buildTurnRestrictionVisualItemsOrEmpty(input.turnRestrictionVisuals),
    ...buildIllegalMovementVisualItems(input.routeIssueOverlays)
  ].sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
}

function isRouteReviewVisualItem(item: RestrictionMapVisualItem): boolean {
  return item.kind === "illegal-movement" || item.kind === "missed-restriction";
}

export function shouldShowRestrictionMapVisualItemAtZoom(
  item: RestrictionMapVisualItem,
  viewport: ScreenMapViewport
): boolean {
  const tier = restrictionZoomTierForViewport(viewport);

  if (isRouteReviewVisualItem(item)) {
    return true;
  }

  if (tier === "low") {
    return false;
  }

  if (tier === "high") {
    return true;
  }

  if (item.kind === "one-way") {
    return polylineLength(item.points) >= TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering.mediumOneWayMinRoadLengthMeters;
  }

  return item.kind === "no-entry" || item.kind === "restricted-road" || item.kind === "prohibited-turn";
}

export function filterRestrictionMapVisualItemsForViewport(
  items: readonly RestrictionMapVisualItem[],
  viewport: ScreenMapViewport,
  options: FilterRestrictionMapVisualItemsOptions = {}
): RestrictionMapVisualItem[] {
  const visibleItems = items.filter((item) => shouldShowRestrictionMapVisualItemAtZoom(item, viewport));
  const reviewItems = visibleItems.filter(isRouteReviewVisualItem);
  const baseItems = visibleItems.filter((item) => !isRouteReviewVisualItem(item));
  const acceptedBaseItems: RestrictionMapVisualItem[] = [];
  const acceptedBoxes: SyntheticLabelCollisionBox[] = [];
  const reviewPoints = reviewItems.map((item) => item.point);

  const rankedBaseItems = [...baseItems].sort((left, right) => {
    const leftPriority = restrictionCollisionPriority(left, reviewPoints);
    const rightPriority = restrictionCollisionPriority(right, reviewPoints);

    return rightPriority - leftPriority || left.id.localeCompare(right.id);
  });

  for (const item of rankedBaseItems) {
    const itemBox = restrictionSymbolCollisionBox(item, viewport, options.currentZoom);

    if (options.reservedBoxes?.some((box) => boxIntersects(itemBox, box))) {
      continue;
    }

    if (acceptedBoxes.some((box) => boxIntersects(itemBox, box))) {
      continue;
    }

    acceptedBaseItems.push(item);
    acceptedBoxes.push(itemBox);
  }

  return [...acceptedBaseItems, ...reviewItems].sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
}

export function restrictionMapVisualStyleForViewport(
  item: RestrictionMapVisualItem,
  viewport: ScreenMapViewport,
  currentZoom?: number
): RestrictionMapVisualZoomStyle {
  if (isRouteReviewVisualItem(item)) {
    return { alpha: 1, scale: 1 };
  }

  const tier = restrictionZoomTierForViewport(viewport);
  const decluttering = TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering;
  const cartographicScale = cartographicRestrictionSymbolScaleForViewport(viewport, currentZoom);

  if (tier === "low") {
    return {
      alpha: decluttering.lowRestrictionSymbolAlpha,
      scale: decluttering.lowRestrictionSymbolScale * cartographicScale
    };
  }

  if (tier === "medium") {
    return {
      alpha: decluttering.mediumRestrictionSymbolAlpha,
      scale: decluttering.mediumRestrictionSymbolScale * cartographicScale
    };
  }

  return {
    alpha: decluttering.highRestrictionSymbolAlpha,
    scale: decluttering.highRestrictionSymbolScale * cartographicScale
  };
}

export function roadRestrictionOverlayAlphaForViewport(
  overlay: RoadRestrictionOverlay,
  viewport: ScreenMapViewport
): number {
  const tier = restrictionZoomTierForViewport(viewport);
  const decluttering = TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering;

  if (tier === "low") {
    return overlay.kind === "no-entry" ? decluttering.mediumRestrictionOverlayAlphaMultiplier : decluttering.lowRestrictionOverlayAlphaMultiplier;
  }

  if (tier === "medium") {
    return decluttering.mediumRestrictionOverlayAlphaMultiplier;
  }

  return decluttering.highRestrictionOverlayAlphaMultiplier;
}

function restrictionCollisionPriority(item: RestrictionMapVisualItem, reviewPoints: readonly Vec2[]): number {
  const reviewProximityMeters = TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering.reviewRestrictionProximityMeters;
  const nearReviewIssue = reviewPoints.some((point) => distanceBetween(item.point, point) <= reviewProximityMeters);

  return item.priority + (nearReviewIssue ? 25 : 0);
}

function restrictionSymbolCollisionBox(
  item: RestrictionMapVisualItem,
  viewport: ScreenMapViewport,
  currentZoom?: number
): SyntheticLabelCollisionBox {
  const point = mapPointToScreen(item.point, viewport);
  const zoomStyle = restrictionMapVisualStyleForViewport(item, viewport, currentZoom);
  const radius = restrictionSymbolRadius(item) * zoomStyle.scale + TOPOPASS_STREET_ATLAS_STYLE.zoom.decluttering.restrictionSymbolCollisionPadding;

  return {
    id: `restriction-symbol-${item.id}`,
    minX: point.x - radius,
    minY: point.y - radius,
    maxX: point.x + radius,
    maxY: point.y + radius
  };
}

function restrictionSymbolRadius(item: RestrictionMapVisualItem): number {
  if (item.symbol === "one-way-arrow") {
    const style = TOPOPASS_STREET_ATLAS_STYLE.restrictions.oneWay;
    return Math.max(style.tipDistance, style.tailDistance) + style.collisionPadding;
  }

  if (item.symbol === "no-entry-sign") {
    return TOPOPASS_STREET_ATLAS_STYLE.restrictions.noEntryMarker.radius;
  }

  if (item.symbol === "restricted-road-sign") {
    return TOPOPASS_STREET_ATLAS_STYLE.restrictions.restrictedMarker.radius;
  }

  if (item.symbol === "turn-ban-sign") {
    return TOPOPASS_STREET_ATLAS_STYLE.restrictions.turnBanMarker.radius;
  }

  return TOPOPASS_STREET_ATLAS_STYLE.review.routeIssue.markerRadius + TOPOPASS_STREET_ATLAS_STYLE.review.routeIssue.markerHaloPadding;
}

function mapPointToScreen(point: Vec2, viewport: ScreenMapViewport): Vec2 {
  const width = viewport.mapBounds.maxX - viewport.mapBounds.minX;
  const height = viewport.mapBounds.maxY - viewport.mapBounds.minY;

  return {
    x: width === 0 ? 0 : ((point.x - viewport.mapBounds.minX) / width) * viewport.width,
    y: height === 0 ? 0 : ((point.y - viewport.mapBounds.minY) / height) * viewport.height
  };
}

function reviewItemText(item: RestrictionFocusReviewItem): string {
  return `${item.id} ${item.label} ${item.detail ?? ""}`.toLowerCase();
}

function movementIndexFromReviewItemId(reviewItemId: string): number | null {
  const match = /^(\d+):/.exec(reviewItemId);

  if (!match) {
    return null;
  }

  const value = Number.parseInt(match[1], 10);

  return Number.isInteger(value) ? value : null;
}

function visualItemMatchesReviewItem(item: RestrictionMapVisualItem, reviewItem: RestrictionFocusReviewItem): boolean {
  const text = reviewItemText(reviewItem);
  const movementIndex = movementIndexFromReviewItemId(reviewItem.id);

  if (movementIndex !== null && item.movementIndex === movementIndex) {
    return true;
  }

  if (item.sourceId && text.includes(item.sourceId.toLowerCase())) {
    return true;
  }

  if (item.roadIds.length > 0 && item.roadIds.every((roadId) => text.includes(roadId.toLowerCase()))) {
    return true;
  }

  if (
    item.kind === "prohibited-turn" &&
    item.fromRoadId &&
    item.toRoadId &&
    text.includes(item.fromRoadId.toLowerCase()) &&
    text.includes(item.toRoadId.toLowerCase())
  ) {
    return true;
  }

  if (item.kind === "missed-restriction" && reviewItem.id.includes("disconnected")) {
    return true;
  }

  return false;
}

export function resolveRestrictionFocusTarget(input: {
  reviewItem: RestrictionFocusReviewItem | null;
  visualItems: readonly RestrictionMapVisualItem[];
}): RestrictionFocusTarget | null {
  if (!input.reviewItem) {
    return null;
  }

  const visualItem = input.visualItems
    .filter((item) => visualItemMatchesReviewItem(item, input.reviewItem as RestrictionFocusReviewItem))
    .sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id))[0];

  if (!visualItem) {
    return null;
  }

  return {
    id: `focus:${input.reviewItem.id}:${visualItem.id}`,
    reviewItemId: input.reviewItem.id,
    visualItemId: visualItem.id,
    kind: visualItem.kind,
    label: visualItem.label,
    point: clonePoint(visualItem.point),
    points: visualItem.points.map(clonePoint),
    roadIds: [...visualItem.roadIds]
  };
}

export function buildSelectedRestrictionHighlight(
  target: RestrictionFocusTarget | null
): SelectedRestrictionHighlight | null {
  if (!target) {
    return null;
  }

  return {
    id: `selected:${target.visualItemId}`,
    targetId: target.visualItemId,
    label: target.label,
    point: clonePoint(target.point),
    points: target.points.map(clonePoint),
    kind: target.kind
  };
}

export function buildRestrictionLegendItems(): SyntheticStreetMapLegendItem[] {
  return [
    {
      id: "major-road",
      label: "Major roads",
      description: "Wider orange roads are the strongest road hierarchy and useful for orientation.",
      tone: "road-highlight"
    },
    {
      id: "secondary-road",
      label: "Secondary roads",
      description: "Yellow roads show important connecting streets below major roads.",
      tone: "secondary-road"
    },
    {
      id: "local-side-streets",
      label: "Local streets",
      description: "Pale side streets stay visible for turn-by-turn reading without overpowering major roads.",
      tone: "local-road"
    },
    {
      id: "highlighted-routable-roads",
      label: "Orange/yellow roads",
      description: "Orange and yellow roads highlight routable or important road geometry.",
      tone: "road-highlight"
    },
    {
      id: "context-roads",
      label: "Grey context roads",
      description: "Grey roads are visible context or de-emphasised road geometry; use signs and route feedback to judge restrictions.",
      tone: "context-road"
    },
    {
      id: "your-route",
      label: "Attempted route",
      description: "Orange is raw drawing; purple is the matched route.",
      tone: "route"
    },
    {
      id: "shortest-legal-route",
      label: "Correct route",
      description: "Blue dashed line is the legal comparison route when available.",
      tone: "shortest"
    },
    {
      id: "accepted-alternative-route",
      label: "Also valid",
      description: "Teal dotted line marks an accepted alternative when review or QA fixture data provides one.",
      tone: "alternative-route"
    },
    {
      id: "illegal-movement",
      label: "Illegal segment",
      description: "Red review marks show the route section or warning that needs attention.",
      tone: "illegal"
    },
    {
      id: "missed-checkpoint",
      label: "Missed checkpoint",
      description: "Red dashed checkpoint ring marks an ordered stop missed during review.",
      tone: "missed-checkpoint"
    },
    {
      id: "no-entry",
      label: "No entry / blocked",
      description: "Red barred-circle symbols mark no-entry or blocked movements.",
      tone: "restriction"
    },
    {
      id: "one-way",
      label: "One-way",
      description: "Blue arrowheads show the permitted one-way travel direction.",
      tone: "one-way"
    },
    {
      id: "no-left-turn",
      label: "No left turn",
      description: "Red turn-ban symbols mark junctions where turning left is not allowed.",
      tone: "turn"
    },
    {
      id: "no-right-turn",
      label: "No right turn",
      description: "Red turn-ban symbols mark junctions where turning right is not allowed.",
      tone: "turn"
    },
    {
      id: "no-u-turn",
      label: "No U-turn",
      description: "Red turn-ban symbols mark junctions where turning back is not allowed.",
      tone: "turn"
    },
    {
      id: "restricted-road",
      label: "Restricted road",
      description: "Amber symbols and dashed treatment mark restricted roads.",
      tone: "restricted"
    },
    {
      id: "selected-focus",
      label: "Selected review item",
      description: "A blue focus halo marks the restriction selected from the review panel.",
      tone: "start"
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
      label: "Destination",
      description: "Dark marker identifies the destination.",
      tone: "finish"
    },
    {
      id: "park",
      label: "Parks",
      description: "Green areas show parks and open spaces for orientation only.",
      tone: "park"
    },
    {
      id: "water",
      label: "Water",
      description: "Blue areas and lines show canals, basins, and water crossings.",
      tone: "water"
    },
    {
      id: "rail",
      label: "Rail",
      description: "Grey dashed rail context helps orient around stations and crossings.",
      tone: "rail"
    },
    {
      id: "station",
      label: "Stations",
      description: "Station markers and labels identify transport context where fixture data provides it.",
      tone: "station"
    }
  ];
}

export function buildLearnerRestrictionLegendItems(): SyntheticStreetMapLegendItem[] {
  return [
    {
      id: "start",
      label: "Start",
      description: "Blue marker identifies the required start.",
      tone: "start"
    },
    {
      id: "finish",
      label: "Destination",
      description: "Dark marker identifies the destination.",
      tone: "finish"
    },
    {
      id: "checkpoint",
      label: "Checkpoint",
      description: "Orange marker identifies an ordered intermediate stop.",
      tone: "checkpoint"
    },
    {
      id: "your-route",
      label: "Your route",
      description: "Orange is raw drawing; purple is the matched route.",
      tone: "route"
    },
    {
      id: "shortest-legal-route",
      label: "Correct route",
      description: "Blue dashed line is the legal comparison route when available.",
      tone: "shortest"
    },
    {
      id: "accepted-alternative-route",
      label: "Accepted alternative",
      description: "Teal dotted line marks another accepted route when available.",
      tone: "alternative-route"
    },
    {
      id: "illegal-movement",
      label: "Illegal / wrong way",
      description: "Red review marks show a route section or warning that needs attention.",
      tone: "illegal"
    },
    {
      id: "missed-checkpoint",
      label: "Missed checkpoint",
      description: "Red dashed checkpoint ring marks an ordered stop missed during review.",
      tone: "missed-checkpoint"
    },
    {
      id: "one-way",
      label: "One-way",
      description: "Blue arrowheads show the permitted one-way travel direction.",
      tone: "one-way"
    },
    {
      id: "no-entry",
      label: "No entry",
      description: "Red barred-circle symbols mark no-entry movements where converted data exists.",
      tone: "restriction"
    },
    {
      id: "restricted-turn",
      label: "Restricted turn",
      description: "Red turn-ban symbols mark banned junction turns where converted data exists.",
      tone: "turn"
    },
    {
      id: "major-road",
      label: "Major road",
      description: "Wider orange roads are the strongest road hierarchy and useful for orientation.",
      tone: "road-highlight"
    },
    {
      id: "secondary-road",
      label: "Secondary road",
      description: "Yellow roads show important connecting streets below major roads.",
      tone: "secondary-road"
    },
    {
      id: "local-side-streets",
      label: "Local street",
      description: "Pale side streets stay visible for turn-by-turn reading.",
      tone: "local-road"
    },
    {
      id: "park",
      label: "Park / open space",
      description: "Green areas show parks and open spaces for orientation only.",
      tone: "park"
    },
    {
      id: "water",
      label: "Water",
      description: "Blue areas and lines show rivers, canals, basins, and water crossings.",
      tone: "water"
    },
    {
      id: "rail-station",
      label: "Rail / station",
      description: "Grey rail lines and station markers help with orientation.",
      tone: "station"
    }
  ];
}
