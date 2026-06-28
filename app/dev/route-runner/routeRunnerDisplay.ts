import type {
  DrawnRoutePipelineResult,
  IllegalDrawnMovement,
  MapDefinition,
  MapRoad,
  RunRouteExerciseResult,
  TurnRestrictionVisual,
  TurnRestrictionVisualKind,
  Vec2
} from "../../../lib/map-engine/index.ts";
import { buildIllegalDrawnMovementHighlights } from "../../../lib/map-engine/index.ts";

export type DrawnPipelineDisplayStatus =
  | "no drawing"
  | "drawing"
  | "insufficient drawing"
  | "snapped"
  | "matching failed"
  | "matched"
  | "scored"
  | "cannot score";

export type PipelineStageState = "pending" | "active" | "complete" | "failed";

export type PipelineStageBadge = {
  id: "drawing" | "simplification" | "snapping" | "matching" | "scoring";
  label: string;
  state: PipelineStageState;
};

export type PipelineIssueGroup = {
  label: "Drawing" | "Simplification" | "Snapping" | "Matching" | "Exercise / scoring";
  messages: string[];
};

export type DrawnRouteScoreDisplayState = "pending" | "blocked" | "pass" | "fail";

export type DrawnRouteScoreDisplay = {
  state: DrawnRouteScoreDisplayState;
  label: string;
  summary: string;
};

export type RequiredStopVisitStatus = {
  nodeId: string;
  order: number;
  role: "start" | "checkpoint" | "destination";
  visited: boolean;
  visitedIndex?: number;
};

export type RoadRestrictionOverlayKind = "no-entry" | "one-way" | "restricted";

export type RoadRestrictionOverlay = {
  roadId: string;
  kind: RoadRestrictionOverlayKind;
  label: string;
  points: Vec2[];
  midpoint: Vec2;
  direction?: {
    from: Vec2;
    to: Vec2;
  };
};

export type RouteIssueOverlayKind =
  | "wrong-way"
  | "no-entry"
  | "restricted"
  | "prohibited-turn"
  | "no-u-turn"
  | "disconnected"
  | "illegal";

export type RouteIssueOverlay = {
  kind: RouteIssueOverlayKind;
  label: string;
  message: string;
  points: Vec2[];
  midpoint: Vec2;
  roadIds: string[];
  movementIndex?: number;
  direction?: {
    from: Vec2;
    to: Vec2;
  };
};

export type TurnRestrictionDisplayItem = {
  id: string;
  label: string;
  turnKind: TurnRestrictionVisualKind;
  visualTurnKind: TurnRestrictionVisualKind;
  fromRoadId: string;
  toRoadId: string;
  viaNodeId: string;
  signFaceRotationRadians: number;
};

export type RouteIssueLineStyle = "solid-red" | "dashed-red";

export type CanvasOverlayDisplayOptions = {
  showTextLabels: boolean;
};

export function getDefaultCanvasOverlayDisplayOptions(): CanvasOverlayDisplayOptions {
  return {
    showTextLabels: false
  };
}

export function getRoadRestrictionSignFaceRotationRadians(overlay: RoadRestrictionOverlay): number {
  void overlay;

  return 0;
}

export function getRoadRestrictionDirectionAngleRadians(overlay: RoadRestrictionOverlay): number | null {
  if (!overlay.direction) {
    return null;
  }

  return Math.atan2(
    overlay.direction.to.y - overlay.direction.from.y,
    overlay.direction.to.x - overlay.direction.from.x
  );
}

function oppositeTurnKind(turnKind: TurnRestrictionVisualKind): TurnRestrictionVisualKind {
  if (turnKind === "no-left-turn") {
    return "no-right-turn";
  }

  if (turnKind === "no-right-turn") {
    return "no-left-turn";
  }

  return turnKind;
}

export function getVisualTurnRestrictionTurnKind(visual: TurnRestrictionVisual): TurnRestrictionVisualKind {
  if (visual.turnKind === "no-u-turn") {
    return visual.turnKind;
  }

  const approachVector = {
    x: visual.junction.x - visual.incomingRoadPoint.x,
    y: visual.junction.y - visual.incomingRoadPoint.y
  };
  const isMostlyVertical = Math.abs(approachVector.y) >= Math.abs(approachVector.x);
  const isDownward = approachVector.y > 0;

  return isMostlyVertical && isDownward ? oppositeTurnKind(visual.turnKind) : visual.turnKind;
}

function roadNodes(map: MapDefinition, road: MapRoad): { from?: Vec2; to?: Vec2 } {
  return {
    from: map.nodes.find((node) => node.id === road.fromNodeId),
    to: map.nodes.find((node) => node.id === road.toNodeId)
  };
}

function roadMidpoint(from: Vec2, to: Vec2): Vec2 {
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2
  };
}

function directionFromNodeIds(map: MapDefinition, fromNodeId: string, toNodeId: string): RoadRestrictionOverlay["direction"] {
  const from = map.nodes.find((node) => node.id === fromNodeId);
  const to = map.nodes.find((node) => node.id === toNodeId);

  if (!from || !to) {
    return undefined;
  }

  return {
    from: { x: from.x, y: from.y },
    to: { x: to.x, y: to.y }
  };
}

function roadOverlayBase(road: MapRoad, from: Vec2, to: Vec2): Pick<RoadRestrictionOverlay, "roadId" | "points" | "midpoint"> {
  return {
    roadId: road.id,
    points: [
      { x: from.x, y: from.y },
      { x: to.x, y: to.y }
    ],
    midpoint: roadMidpoint(from, to)
  };
}

export function buildRoadRestrictionOverlays(map: MapDefinition): RoadRestrictionOverlay[] {
  const overlays: RoadRestrictionOverlay[] = [];
  const roadsById = Object.fromEntries(map.roads.map((road) => [road.id, road]));

  for (const road of map.roads) {
    const { from, to } = roadNodes(map, road);

    if (!from || !to) {
      continue;
    }

    const base = roadOverlayBase(road, from, to);
    const roadRestrictions = map.restrictions.filter(
      (restriction) =>
        (restriction.type === "no_entry" || restriction.type === "road_closed") && restriction.roadId === road.id
    );

    for (const restriction of roadRestrictions) {
      if (restriction.type === "no_entry") {
        overlays.push({
          ...base,
          kind: "no-entry",
          label: restriction.reason ? `No entry: ${restriction.reason}` : "No entry",
          direction:
            restriction.fromNodeId && restriction.toNodeId
              ? directionFromNodeIds(map, restriction.fromNodeId, restriction.toNodeId)
              : {
                  from: { x: from.x, y: from.y },
                  to: { x: to.x, y: to.y }
                }
        });
      } else {
        overlays.push({
          ...base,
          kind: "restricted",
          label: restriction.reason ? `Restricted: ${restriction.reason}` : "Restricted road"
        });
      }
    }

    if (road.isOneWay && roadsById[road.id]) {
      overlays.push({
        ...base,
        kind: "one-way",
        label: "One-way",
        direction: {
          from: { x: from.x, y: from.y },
          to: { x: to.x, y: to.y }
        }
      });
    }
  }

  return overlays;
}

function mapNodeById(map: MapDefinition, nodeId: string): Vec2 | undefined {
  const node = map.nodes.find((candidate) => candidate.id === nodeId);

  return node ? { x: node.x, y: node.y } : undefined;
}

function mapRoadById(map: MapDefinition, roadId: string): MapRoad | undefined {
  return map.roads.find((road) => road.id === roadId);
}

function roadPointsById(map: MapDefinition, roadId: string): Vec2[] {
  const road = mapRoadById(map, roadId);

  if (!road) {
    return [];
  }

  const from = mapNodeById(map, road.fromNodeId);
  const to = mapNodeById(map, road.toNodeId);

  return from && to ? [from, to] : [];
}

function midpointForPoints(points: readonly Vec2[]): Vec2 {
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

function roadMidpointById(map: MapDefinition, roadId: string): Vec2 | undefined {
  const points = roadPointsById(map, roadId);

  return points.length === 2 ? roadMidpoint(points[0], points[1]) : undefined;
}

function routeIssueKindForIllegalDrawnMovement(kind: IllegalDrawnMovement["kind"]): RouteIssueOverlayKind {
  if (kind === "one-way-wrong-direction") {
    return "wrong-way";
  }

  if (kind === "no-entry-road") {
    return "no-entry";
  }

  if (kind === "closed-road" || kind === "restricted-road") {
    return "restricted";
  }

  if (kind === "prohibited-turn") {
    return "prohibited-turn";
  }

  return "illegal";
}

function routeIssueLabelForKind(kind: RouteIssueOverlayKind): string {
  if (kind === "wrong-way") {
    return "Wrong way";
  }

  if (kind === "no-entry") {
    return "No entry";
  }

  if (kind === "restricted") {
    return "Restricted road";
  }

  if (kind === "prohibited-turn") {
    return "Prohibited turn";
  }

  if (kind === "no-u-turn") {
    return "No U-turn";
  }

  if (kind === "disconnected") {
    return "Disconnected";
  }

  return "Illegal movement";
}

function overlayFromIllegalRoadHighlight(
  map: MapDefinition,
  highlight: IllegalDrawnMovement,
  kind: RouteIssueOverlayKind
): RouteIssueOverlay | null {
  if (!highlight.roadId || !highlight.fromNodeId || !highlight.toNodeId) {
    return null;
  }

  const from = mapNodeById(map, highlight.fromNodeId);
  const to = mapNodeById(map, highlight.toNodeId);

  if (!from || !to) {
    return null;
  }

  const points = [from, to];

  return {
    kind,
    label: routeIssueLabelForKind(kind),
    message: highlight.message,
    points,
    midpoint: roadMidpoint(from, to),
    roadIds: [highlight.roadId],
    movementIndex: highlight.movementIndex,
    direction: { from, to }
  };
}

function overlayFromRoadTransition(input: {
  map: MapDefinition;
  kind: RouteIssueOverlayKind;
  label?: string;
  message: string;
  previousRoadId?: string;
  nextRoadId?: string;
  fromRoadId?: string;
  toRoadId?: string;
  movementIndex?: number;
}): RouteIssueOverlay | null {
  const firstRoadId = input.previousRoadId ?? input.fromRoadId;
  const secondRoadId = input.nextRoadId ?? input.toRoadId;

  if (!firstRoadId || !secondRoadId) {
    return null;
  }

  const firstMidpoint = roadMidpointById(input.map, firstRoadId);
  const secondMidpoint = roadMidpointById(input.map, secondRoadId);

  if (!firstMidpoint || !secondMidpoint) {
    return null;
  }

  const points = [firstMidpoint, secondMidpoint];

  return {
    kind: input.kind,
    label: input.label ?? routeIssueLabelForKind(input.kind),
    message: input.message,
    points,
    midpoint: midpointForPoints(points),
    roadIds: [firstRoadId, secondRoadId],
    ...(typeof input.movementIndex === "number" ? { movementIndex: input.movementIndex } : {})
  };
}

function overlayFromIllegalDrawnMovement(map: MapDefinition, highlight: IllegalDrawnMovement): RouteIssueOverlay | null {
  const kind = routeIssueKindForIllegalDrawnMovement(highlight.kind);

  if (highlight.kind === "prohibited-turn") {
    return overlayFromRoadTransition({
      map,
      kind,
      message: highlight.message,
      previousRoadId: highlight.incomingRoadId,
      nextRoadId: highlight.outgoingRoadId,
      movementIndex: highlight.movementIndex
    });
  }

  return overlayFromIllegalRoadHighlight(map, highlight, kind);
}

function routeIssueKey(overlay: RouteIssueOverlay): string {
  return [
    overlay.kind,
    overlay.movementIndex ?? "transition",
    overlay.roadIds.join(">"),
    overlay.label
  ].join(":");
}

function dedupeRouteIssueOverlays(overlays: RouteIssueOverlay[]): RouteIssueOverlay[] {
  const seen = new Set<string>();

  return overlays.filter((overlay) => {
    const key = routeIssueKey(overlay);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function buildRouteIssueOverlays(map: MapDefinition, result: DrawnRoutePipelineResult): RouteIssueOverlay[] {
  if (result.exerciseResult?.score.passed) {
    return [];
  }

  const overlays: RouteIssueOverlay[] = [];

  for (const warning of result.warnings) {
    if (warning.code !== "disconnected_roads" && warning.code !== "disconnected_selected_roads") {
      continue;
    }

    const overlay = overlayFromRoadTransition({
      map,
      kind: "disconnected",
      label: "Disconnected roads",
      message: warning.fromRoadId && warning.toRoadId
        ? `Disconnected between ${warning.fromRoadId} and ${warning.toRoadId}.`
        : warning.message,
      fromRoadId: warning.fromRoadId,
      toRoadId: warning.toRoadId
    });

    if (overlay) {
      overlays.push(overlay);
    }
  }

  const illegalHighlights = buildIllegalDrawnMovementHighlights({
    map,
    illegalMovements: result.exerciseResult?.score.legality.illegalMovements ?? [],
    scored: Boolean(result.exerciseResult)
  });

  for (const illegalHighlight of illegalHighlights) {
    const overlay = overlayFromIllegalDrawnMovement(map, illegalHighlight);

    if (overlay) {
      overlays.push(overlay);
    }
  }

  return dedupeRouteIssueOverlays(overlays);
}

export function getRouteIssueLineStyle(kind: RouteIssueOverlayKind): RouteIssueLineStyle {
  return kind === "disconnected" ? "dashed-red" : "solid-red";
}

export function getTurnRestrictionDisplayItems(
  visuals: readonly TurnRestrictionVisual[]
): TurnRestrictionDisplayItem[] {
  return visuals.map((visual) => ({
    id: visual.id,
    label: `${visual.label}: ${visual.fromRoadId} -> ${visual.toRoadId} at ${visual.viaNodeId}`,
    turnKind: visual.turnKind,
    visualTurnKind: getVisualTurnRestrictionTurnKind(visual),
    fromRoadId: visual.fromRoadId,
    toRoadId: visual.toRoadId,
    viaNodeId: visual.viaNodeId,
    signFaceRotationRadians: 0
  }));
}

export function getDrawnPipelineDisplayStatus(
  result: DrawnRoutePipelineResult,
  isDrawing: boolean
): DrawnPipelineDisplayStatus {
  if (isDrawing) {
    return "drawing";
  }

  if (result.status === "empty") {
    return "no drawing";
  }

  if (result.status === "insufficient_points") {
    return "insufficient drawing";
  }

  if (result.status === "snapping_failed") {
    return result.snappedPoints.length > 0 ? "snapped" : "cannot score";
  }

  if (result.status === "matching_failed") {
    return "matching failed";
  }

  if (result.status === "exercise_failed") {
    return "cannot score";
  }

  return "scored";
}

export function getPipelineStageBadges(
  result: DrawnRoutePipelineResult,
  isDrawing: boolean
): PipelineStageBadge[] {
  const hasTrace = result.simplifiedTrace.points.length > 0;
  const hasSimplifiedTrace = result.simplifiedTrace.points.length >= 2;
  const hasSnappedPoints = result.snappedPoints.length > 0;
  const hasMatch = Boolean(result.matchResult);
  const hasScore = Boolean(result.exerciseResult);

  return [
    {
      id: "drawing",
      label: "Drawing",
      state: isDrawing ? "active" : hasTrace ? "complete" : "pending"
    },
    {
      id: "simplification",
      label: "Simplified",
      state:
        result.status === "insufficient_points" && hasTrace
          ? "failed"
          : hasSimplifiedTrace
            ? "complete"
            : "pending"
    },
    {
      id: "snapping",
      label: "Snapped",
      state:
        result.status === "snapping_failed"
          ? "failed"
          : hasSnappedPoints
            ? "complete"
            : "pending"
    },
    {
      id: "matching",
      label:
        result.status === "matching_failed"
          ? "Matching failed"
          : hasMatch
            ? "Matched"
            : "Matching",
      state:
        result.status === "matching_failed"
          ? "failed"
          : hasMatch
            ? "complete"
            : "pending"
    },
    {
      id: "scoring",
      label: "Scored",
      state:
        result.status === "exercise_failed"
          ? "failed"
          : hasScore
            ? "complete"
            : "pending"
    }
  ];
}

function messageForPipelineWarning(warning: DrawnRoutePipelineResult["warnings"][number]): string {
  if (warning.code === "empty_trace") {
    return "No route has been drawn yet.";
  }

  if (warning.code === "insufficient_points" || warning.code === "trace_too_short") {
    return "Add more drawn points before the route can be processed.";
  }

  if (warning.code === "insufficient_raw_points") {
    return "Draw a route before scoring. A tap or click is not enough to create a route attempt.";
  }

  if (warning.code === "insufficient_movement") {
    return "Tap ignored: not enough movement. Draw a longer route before scoring.";
  }

  if (warning.code === "insufficient_points_after_simplification") {
    return "The simplified trace is too short to process.";
  }

  if (warning.code === "off_road_points") {
    return "One or more drawn points are too far from a road to snap.";
  }

  if (warning.code === "unmatched_point" || warning.code === "unknown_road") {
    return "No usable snapped road sequence is available for the drawn route.";
  }

  if (warning.code === "disconnected_roads" || warning.code === "disconnected_selected_roads") {
    if (warning.fromRoadId && warning.toRoadId) {
      return `Disconnected between ${warning.fromRoadId} and ${warning.toRoadId}. The matched roads do not connect into one continuous route.`;
    }

    return "The matched roads do not connect into one continuous route.";
  }

  if (warning.code === "unresolved_direction") {
    return "A matched movement has no legal directed edge, usually because it is wrong-way or restricted.";
  }

  if (warning.code === "exercise_failed") {
    return `The matched route could not be scored: ${warning.message}`;
  }

  return warning.message;
}

function groupLabelForWarning(source: string, code: string): PipelineIssueGroup["label"] {
  if (source === "pipeline" && code === "insufficient_points_after_simplification") {
    return "Simplification";
  }

  if (source === "pipeline") {
    return "Drawing";
  }

  if (source === "snapping") {
    return "Snapping";
  }

  if (source === "matching") {
    return "Matching";
  }

  return "Exercise / scoring";
}

function scoreFailureMessage(reason: string): string {
  if (reason === "wrong_start") {
    return "The route does not start at the required start node.";
  }

  if (reason === "wrong_destination") {
    return "The route does not finish at the required destination.";
  }

  if (reason === "missed_required_stop") {
    return "A required checkpoint was missed or visited out of order.";
  }

  if (reason === "illegal_route") {
    return "The existing scoring engine found an illegal route movement.";
  }

  if (reason === "below_efficiency_threshold") {
    return "The route is too long for the pass mark; it is legal but below the efficiency threshold.";
  }

  if (reason === "zero_distance_route") {
    return "The route has no usable distance and cannot be scored.";
  }

  if (reason === "no_valid_shortest_route") {
    return "No valid shortest legal route is available for this exercise.";
  }

  return reason.replaceAll("_", " ");
}

function illegalMovementMessage(type: string): string {
  if (type === "wrong_way_one_way") {
    return "The existing legality engine found a wrong-way movement on a one-way road.";
  }

  if (type === "prohibited_turn") {
    return "The existing legality engine found a prohibited turn.";
  }

  if (type === "no_entry") {
    return "The existing legality engine found a no-entry movement.";
  }

  if (type === "disconnected_road_jump") {
    return "The existing legality engine found a disconnected road jump.";
  }

  if (type === "no_u_turn") {
    return "The existing legality engine found a U-turn restriction.";
  }

  return `The existing legality engine found ${type.replaceAll("_", " ")}.`;
}

function addGroupedMessage(groups: Map<PipelineIssueGroup["label"], string[]>, label: PipelineIssueGroup["label"], message: string) {
  const messages = groups.get(label) ?? [];

  if (!messages.includes(message)) {
    groups.set(label, [...messages, message]);
  }
}

export function getPipelineIssueGroups(
  result: DrawnRoutePipelineResult,
  isDrawing: boolean
): PipelineIssueGroup[] {
  const groups = new Map<PipelineIssueGroup["label"], string[]>();

  if (isDrawing) {
    addGroupedMessage(groups, "Drawing", "Finish the current drawing before reading the score result.");
  }

  for (const warning of result.warnings) {
    addGroupedMessage(
      groups,
      groupLabelForWarning(warning.source, warning.code),
      messageForPipelineWarning(warning)
    );
  }

  for (const reason of result.exerciseResult?.score.failureReasons ?? []) {
    addGroupedMessage(groups, "Exercise / scoring", scoreFailureMessage(reason));
  }

  for (const illegalMovement of result.exerciseResult?.score.legality.illegalMovements ?? []) {
    addGroupedMessage(groups, "Exercise / scoring", illegalMovementMessage(illegalMovement.type));
  }

  return Array.from(groups.entries()).map(([label, messages]) => ({
    label,
    messages
  }));
}

export function getDrawnRouteScoreDisplay(
  result: DrawnRoutePipelineResult,
  isDrawing: boolean
): DrawnRouteScoreDisplay {
  if (isDrawing) {
    return {
      state: "pending",
      label: "Drawing in progress",
      summary: "Release the pointer to run snapping, matching, and scoring for the current attempt."
    };
  }

  if (!result.exerciseResult) {
    if (result.status === "empty") {
      return {
        state: "pending",
        label: "No drawing yet",
        summary: "Draw a route for the selected exercise to receive a score."
      };
    }

    if (result.status === "insufficient_points") {
      return {
        state: "blocked",
        label: "Not scored",
        summary: "Insufficient drawn route. Draw a longer route before scoring."
      };
    }

    return {
      state: "blocked",
      label: "Blocked before scoring",
      summary: "The drawn route could not reach scoring because drawing, snapping, or matching failed."
    };
  }

  if (result.exerciseResult.score.passed) {
    return {
      state: "pass",
      label: "Route scored: pass",
      summary: "The drawn route passed using the existing route exercise scoring engine."
    };
  }

  return {
    state: "fail",
    label: "Route scored: fail",
    summary: "The drawn route reached scoring but did not meet the pass rules."
  };
}

function stopRole(index: number, stopCount: number): RequiredStopVisitStatus["role"] {
  if (index === 0) {
    return "start";
  }

  if (index === stopCount - 1) {
    return "destination";
  }

  return "checkpoint";
}

export function getRequiredStopVisitStatuses(result: RunRouteExerciseResult | null): RequiredStopVisitStatus[] {
  if (!result) {
    return [];
  }

  let searchStartIndex = 0;

  return result.normalisedAttempt.requiredNodeIds.map((nodeId, index, requiredNodeIds) => {
    const visitedIndex = result.normalisedAttempt.selectedNodeIds.findIndex(
      (selectedNodeId, selectedNodeIndex) => selectedNodeIndex >= searchStartIndex && selectedNodeId === nodeId
    );
    const visited = visitedIndex >= 0;

    if (visited) {
      searchStartIndex = visitedIndex + 1;
    }

    return {
      nodeId,
      order: index + 1,
      role: stopRole(index, requiredNodeIds.length),
      visited,
      ...(visited ? { visitedIndex } : {})
    };
  });
}
