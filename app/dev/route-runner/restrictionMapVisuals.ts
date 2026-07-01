import type { TurnRestrictionVisual, TurnRestrictionVisualKind, Vec2 } from "../../../lib/map-engine/index.ts";
import type { RoadRestrictionOverlay, RouteIssueOverlay } from "./routeRunnerDisplay.ts";
import type { SyntheticStreetMapLegendItem } from "./syntheticStreetMapRenderer.ts";

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
};

const LONG_ROAD_ARROW_THRESHOLD = 180;
export const ONE_WAY_ARROW_MIN_SPACING_METERS = 50;

function clonePoint(point: Vec2): Vec2 {
  return {
    x: point.x,
    y: point.y
  };
}

function distanceBetween(from: Vec2, to: Vec2): number {
  return Math.hypot(to.x - from.x, to.y - from.y);
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

export function buildOneWayVisualItems(overlays: readonly RoadRestrictionOverlay[]): RestrictionMapVisualItem[] {
  const lastRenderedPointByRoadGroup = new Map<string, Vec2>();
  const items: RestrictionMapVisualItem[] = [];

  for (const overlay of roadRestrictionItemsByKind(overlays, "one-way")) {
    const direction = overlay.direction;

    if (!direction) {
      continue;
    }

    const ratios = distanceBetween(direction.from, direction.to) >= LONG_ROAD_ARROW_THRESHOLD ? [0.34, 0.66] : [0.5];
    const roadGroupId = overlay.renderGroupId ?? overlay.roadId;

    ratios.forEach((ratio, index) => {
      const point = lerpPoint(direction.from, direction.to, ratio);
      const previousPoint = lastRenderedPointByRoadGroup.get(roadGroupId);

      if (previousPoint && distanceBetween(previousPoint, point) < ONE_WAY_ARROW_MIN_SPACING_METERS) {
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
    ...buildOneWayVisualItems(input.roadRestrictionOverlays),
    ...buildRestrictedRoadVisualItems(input.roadRestrictionOverlays),
    ...buildProhibitedTurnVisualItems(input.turnRestrictionVisuals),
    ...buildIllegalMovementVisualItems(input.routeIssueOverlays)
  ].sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
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
      label: "Your route",
      description: "Orange is raw drawing; purple is the matched route.",
      tone: "route"
    },
    {
      id: "shortest-legal-route",
      label: "Shortest legal route",
      description: "Blue dashed line is the legal comparison route when available.",
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
      label: "No Entry",
      description: "Red barred-circle symbols mark no-entry movements.",
      tone: "restriction"
    },
    {
      id: "one-way",
      label: "Blue one-way arrows",
      description: "Blue arrowheads show the permitted one-way travel direction.",
      tone: "one-way"
    },
    {
      id: "prohibited-turn",
      label: "Prohibited Turn",
      description: "Compact turn-ban symbols mark banned junction turns.",
      tone: "turn"
    },
    {
      id: "restricted-road",
      label: "Restricted Road",
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
      label: "Finish",
      description: "Dark marker identifies the destination.",
      tone: "finish"
    }
  ];
}
