"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import {
  appendDrawnRoutePoint,
  boundingBoxForPoints,
  createInsufficientDrawnGesturePipelineResult,
  createDrawnRouteTrace,
  expandBoundingBox,
  mapToScreenPoint,
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  runDrawnRoutePipeline,
  runRouteExercise,
  screenToMapPoint,
  validateDrawnRouteGesture,
  type DrawnRoutePipelineResult,
  type DrawnRouteTrace,
  type MapNode,
  type MapRoad,
  type RouteExercise,
  type RouteStop,
  type RunRouteExerciseResult,
  type ScreenMapViewport,
  type SnappedRouteTraceResult,
  type Vec2
} from "@/lib/map-engine";
import { parseCommaSeparatedIds } from "./routeRunnerInput";
import {
  buildRoadRestrictionOverlays,
  buildRouteIssueOverlays,
  getDrawnPipelineDisplayStatus,
  getDrawnRouteScoreDisplay,
  getPipelineIssueGroups,
  getPipelineStageBadges,
  getRequiredStopVisitStatuses,
  type DrawnPipelineDisplayStatus,
  type DrawnRouteScoreDisplayState,
  type PipelineStageState,
  type RoadRestrictionOverlay,
  type RouteIssueOverlay
} from "./routeRunnerDisplay";

const CANVAS_WIDTH = 820;
const CANVAS_HEIGHT = 660;
const SNAP_TOLERANCE = 24;
const MIN_DRAWN_GESTURE_POINT_COUNT = 3;
const MIN_DRAWN_GESTURE_DISTANCE = 10;
const ROAD_RESTRICTION_OVERLAYS = buildRoadRestrictionOverlays(marloweDistrictMap);

function emptySnapPreview(): SnappedRouteTraceResult {
  return {
    isValidTrace: false,
    hasOffRoadPoints: false,
    snapTolerance: SNAP_TOLERANCE,
    snappedPoints: [],
    connectivity: {
      selectedCandidateRoadIds: [],
      collapsedRoadIds: [],
      isContinuous: true,
      disconnectedTransitions: [],
      diagnostics: {
        candidateCountsByPoint: [],
        candidates: [],
        selectedCandidates: [],
        totalCost: 0,
        usedDisconnectedPenalty: false
      }
    },
    diagnostics: []
  };
}

function stopLabel(stop: RouteStop): string {
  if (stop.type === "node") {
    const node = marloweDistrictMap.nodes.find((candidate) => candidate.id === stop.nodeId);

    return `${node?.label ?? stop.nodeId} (${stop.nodeId})`;
  }

  const landmark = marloweDistrictMap.landmarks.find((candidate) => candidate.id === stop.landmarkId);
  const nearestNode = landmark?.nearestNodeId ? `, nearest node ${landmark.nearestNodeId}` : "";

  return `${landmark?.name ?? stop.landmarkId} (${stop.landmarkId}${nearestNode})`;
}

function resolveStopNode(stop: RouteStop): MapNode | undefined {
  const nodeId =
    stop.type === "node"
      ? stop.nodeId
      : marloweDistrictMap.landmarks.find((landmark) => landmark.id === stop.landmarkId)?.nearestNodeId;

  return marloweDistrictMap.nodes.find((node) => node.id === nodeId);
}

function resultSummary(result: RunRouteExerciseResult): string {
  const score = result.score.scorePercent.toFixed(1);
  const status = result.score.passed ? "Pass" : "Fail";
  const reasons = result.score.failureReasons.length > 0 ? `: ${result.score.failureReasons.join(", ")}` : "";

  return `${status} - ${score}%${reasons}`;
}

function formatDistance(distanceMeters: number): string {
  if (!Number.isFinite(distanceMeters)) {
    return "n/a";
  }

  return `${Math.round(distanceMeters)}m`;
}

function uniqueOrdered(values: readonly string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function selectedRoadNames(roadIds: readonly string[]): string {
  if (roadIds.length === 0) {
    return "None";
  }

  return roadIds
    .map((roadId) => {
      const road = marloweDistrictMap.roads.find((candidate) => candidate.id === roadId);

      return road?.name ? `${roadId} (${road.name})` : roadId;
    })
    .join(", ");
}

function idList(values: readonly string[]): string {
  return values.length > 0 ? values.join(" -> ") : "None";
}

function nullableIdList(values: ReadonlyArray<string | null>): string {
  return values.length > 0 ? values.map((value) => value ?? "unresolved").join(" -> ") : "None";
}

function pipelineStatusClass(status: DrawnPipelineDisplayStatus): string {
  if (status === "scored") {
    return "bg-green-100 text-green-800";
  }

  if (status === "no drawing") {
    return "bg-slate-100 text-slate-700";
  }

  if (status === "insufficient drawing") {
    return "bg-amber-100 text-amber-900";
  }

  if (status === "drawing") {
    return "bg-blue-100 text-blue-800";
  }

  if (status === "snapped" || status === "matched") {
    return "bg-amber-100 text-amber-900";
  }

  return "bg-red-100 text-red-800";
}

function stageBadgeClass(state: PipelineStageState): string {
  if (state === "complete") {
    return "border-green-200 bg-green-50 text-green-800";
  }

  if (state === "active") {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  if (state === "failed") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-500";
}

function scoreStateClass(state: DrawnRouteScoreDisplayState): string {
  if (state === "pass") {
    return "border-green-200 bg-green-50 text-green-900";
  }

  if (state === "fail") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  if (state === "blocked") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function stopVisitClass(visited: boolean): string {
  return visited ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-900";
}

function displayStatusText(status: DrawnPipelineDisplayStatus): string {
  return status[0].toUpperCase() + status.slice(1);
}

function nodeById(nodeId: string): MapNode | undefined {
  return marloweDistrictMap.nodes.find((node) => node.id === nodeId);
}

function nodeLabel(nodeId: string): string {
  const node = nodeById(nodeId);

  return node?.label ? `${node.label} (${nodeId})` : nodeId;
}

function drawArrowHead(context: CanvasRenderingContext2D, fromPoint: Vec2, toPoint: Vec2): void {
  const angle = Math.atan2(toPoint.y - fromPoint.y, toPoint.x - fromPoint.x);
  const arrowLength = 10;

  context.beginPath();
  context.moveTo(toPoint.x, toPoint.y);
  context.lineTo(
    toPoint.x - arrowLength * Math.cos(angle - Math.PI / 6),
    toPoint.y - arrowLength * Math.sin(angle - Math.PI / 6)
  );
  context.lineTo(
    toPoint.x - arrowLength * Math.cos(angle + Math.PI / 6),
    toPoint.y - arrowLength * Math.sin(angle + Math.PI / 6)
  );
  context.closePath();
  context.fill();
}

function drawNodeMarker(input: {
  context: CanvasRenderingContext2D;
  point: Vec2;
  label: string;
  fillStyle: string;
  radius: number;
}): void {
  input.context.fillStyle = input.fillStyle;
  input.context.beginPath();
  input.context.arc(input.point.x, input.point.y, input.radius, 0, Math.PI * 2);
  input.context.fill();
  input.context.fillStyle = "#ffffff";
  input.context.font = "bold 10px sans-serif";
  input.context.textAlign = "center";
  input.context.textBaseline = "middle";
  input.context.fillText(input.label, input.point.x, input.point.y + 0.5);
}

function scoreSummary(result: RunRouteExerciseResult | null): string {
  if (!result) {
    return "n/a";
  }

  return `${result.score.scorePercent.toFixed(1)}%`;
}

function safeExtraDistance(result: RunRouteExerciseResult | null): number {
  return result ? result.score.userRouteDistanceMeters - result.score.shortestLegalRouteDistanceMeters : 0;
}

function warningSeverityClass(severity: string): string {
  if (severity === "error") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  if (severity === "info") {
    return "border-blue-200 bg-blue-50 text-blue-900";
  }

  return "border-amber-200 bg-amber-50 text-amber-900";
}

function roadEndpoints(road: MapRoad): { from?: MapNode; to?: MapNode } {
  return {
    from: nodeById(road.fromNodeId),
    to: nodeById(road.toNodeId)
  };
}

function restrictionOverlayColour(kind: RoadRestrictionOverlay["kind"]): string {
  if (kind === "no-entry") {
    return "#dc2626";
  }

  if (kind === "restricted") {
    return "#d97706";
  }

  return "#2563eb";
}

function restrictionOverlayShortLabel(kind: RoadRestrictionOverlay["kind"]): string {
  if (kind === "no-entry") {
    return "NO";
  }

  if (kind === "restricted") {
    return "!";
  }

  return "1W";
}

function drawRestrictionBadge(context: CanvasRenderingContext2D, point: Vec2, overlay: RoadRestrictionOverlay): void {
  const colour = restrictionOverlayColour(overlay.kind);

  context.fillStyle = "#ffffff";
  context.strokeStyle = colour;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(point.x, point.y, overlay.kind === "restricted" ? 9 : 11, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  if (overlay.kind === "no-entry") {
    context.strokeStyle = colour;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(point.x - 6, point.y);
    context.lineTo(point.x + 6, point.y);
    context.stroke();
    return;
  }

  context.fillStyle = colour;
  context.font = "bold 9px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(restrictionOverlayShortLabel(overlay.kind), point.x, point.y + 0.5);
}

function drawRoadRestrictionOverlay(
  context: CanvasRenderingContext2D,
  overlay: RoadRestrictionOverlay,
  viewport: ScreenMapViewport
): void {
  if (overlay.points.length < 2) {
    return;
  }

  const colour = restrictionOverlayColour(overlay.kind);
  const screenPoints = overlay.points.map((point) => mapToScreenPoint(point, viewport));
  const midpoint = mapToScreenPoint(overlay.midpoint, viewport);

  context.save();
  context.strokeStyle = colour;
  context.fillStyle = colour;
  context.globalAlpha = overlay.kind === "one-way" ? 0.8 : 0.9;
  context.lineWidth = overlay.kind === "one-way" ? 3 : 5;
  context.setLineDash(overlay.kind === "one-way" ? [10, 6] : []);
  context.beginPath();
  context.moveTo(screenPoints[0].x, screenPoints[0].y);

  for (const point of screenPoints.slice(1)) {
    context.lineTo(point.x, point.y);
  }

  context.stroke();
  context.setLineDash([]);
  context.globalAlpha = 1;

  if (overlay.direction) {
    drawArrowHead(
      context,
      mapToScreenPoint(overlay.direction.from, viewport),
      mapToScreenPoint(overlay.direction.to, viewport)
    );
  }

  drawRestrictionBadge(context, midpoint, overlay);

  context.fillStyle = colour;
  context.font = "bold 10px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "bottom";
  context.fillText(overlay.kind === "one-way" ? overlay.roadId : overlay.label, midpoint.x, midpoint.y - 12);
  context.restore();
}

function routeIssueOverlayColour(kind: RouteIssueOverlay["kind"]): string {
  if (kind === "disconnected") {
    return "#f97316";
  }

  if (kind === "prohibited-turn" || kind === "no-u-turn") {
    return "#be123c";
  }

  return "#dc2626";
}

function routeIssueOverlayShortLabel(kind: RouteIssueOverlay["kind"]): string {
  if (kind === "wrong-way") {
    return "WW";
  }

  if (kind === "no-entry") {
    return "NO";
  }

  if (kind === "prohibited-turn") {
    return "TURN";
  }

  if (kind === "no-u-turn") {
    return "U";
  }

  if (kind === "disconnected") {
    return "GAP";
  }

  return "!";
}

function drawRouteIssueBadge(context: CanvasRenderingContext2D, point: Vec2, overlay: RouteIssueOverlay): void {
  const colour = routeIssueOverlayColour(overlay.kind);

  context.fillStyle = "#ffffff";
  context.strokeStyle = colour;
  context.lineWidth = 3;
  context.beginPath();
  context.arc(point.x, point.y, overlay.kind === "prohibited-turn" ? 15 : 13, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.fillStyle = colour;
  context.font = "bold 9px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(routeIssueOverlayShortLabel(overlay.kind), point.x, point.y + 0.5);
}

function drawRouteIssueOverlay(
  context: CanvasRenderingContext2D,
  overlay: RouteIssueOverlay,
  viewport: ScreenMapViewport
): void {
  const colour = routeIssueOverlayColour(overlay.kind);

  context.save();
  context.strokeStyle = colour;
  context.fillStyle = colour;
  context.lineWidth = overlay.kind === "disconnected" ? 4 : 8;
  context.globalAlpha = 0.82;
  context.setLineDash(overlay.kind === "disconnected" ? [8, 6] : []);

  for (const roadId of overlay.roadIds) {
    const road = marloweDistrictMap.roads.find((candidate) => candidate.id === roadId);

    if (!road) {
      continue;
    }

    const { from, to } = roadEndpoints(road);

    if (!from || !to) {
      continue;
    }

    const fromPoint = mapToScreenPoint(from, viewport);
    const toPoint = mapToScreenPoint(to, viewport);

    context.beginPath();
    context.moveTo(fromPoint.x, fromPoint.y);
    context.lineTo(toPoint.x, toPoint.y);
    context.stroke();
  }

  if (overlay.points.length >= 2) {
    const screenPoints = overlay.points.map((point) => mapToScreenPoint(point, viewport));

    context.lineWidth = overlay.kind === "disconnected" ? 3 : 5;
    context.beginPath();
    context.moveTo(screenPoints[0].x, screenPoints[0].y);

    for (const point of screenPoints.slice(1)) {
      context.lineTo(point.x, point.y);
    }

    context.stroke();
  }

  context.setLineDash([]);
  context.globalAlpha = 1;

  if (overlay.direction) {
    drawArrowHead(
      context,
      mapToScreenPoint(overlay.direction.from, viewport),
      mapToScreenPoint(overlay.direction.to, viewport)
    );
  }

  const midpoint = mapToScreenPoint(overlay.midpoint, viewport);
  drawRouteIssueBadge(context, midpoint, overlay);

  context.font = "bold 11px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "bottom";
  context.fillStyle = colour;
  context.fillText(overlay.label, midpoint.x, midpoint.y - 16);
  context.restore();
}

function drawRouteCanvas(input: {
  canvas: HTMLCanvasElement;
  viewport: ScreenMapViewport;
  selectedExercise?: RouteExercise;
  trace: DrawnRouteTrace;
  snapPreview: SnappedRouteTraceResult;
  pipelineResult: DrawnRoutePipelineResult;
  routeIssueOverlays: RouteIssueOverlay[];
}) {
  const context = input.canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(0, 0, input.canvas.width, input.canvas.height);
  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, input.canvas.width, input.canvas.height);

  context.lineCap = "round";
  context.lineJoin = "round";

  for (const road of marloweDistrictMap.roads) {
    const { from, to } = roadEndpoints(road);

    if (!from || !to) {
      continue;
    }

    const fromPoint = mapToScreenPoint(from, input.viewport);
    const toPoint = mapToScreenPoint(to, input.viewport);

    context.strokeStyle = road.isOneWay ? "#c7d2fe" : "#cbd5e1";
    context.lineWidth = road.isOneWay ? 3 : 2;
    context.beginPath();
    context.moveTo(fromPoint.x, fromPoint.y);
    context.lineTo(toPoint.x, toPoint.y);
    context.stroke();
  }

  for (const overlay of ROAD_RESTRICTION_OVERLAYS) {
    drawRoadRestrictionOverlay(context, overlay, input.viewport);
  }

  input.pipelineResult.matchResult?.attemptedMovements.forEach((movement, index) => {
    const from = nodeById(movement.fromNodeId);
    const to = nodeById(movement.toNodeId);

    if (!from || !to) {
      return;
    }

    const fromPoint = mapToScreenPoint(from, input.viewport);
    const toPoint = mapToScreenPoint(to, input.viewport);
    const midPoint = {
      x: (fromPoint.x + toPoint.x) / 2,
      y: (fromPoint.y + toPoint.y) / 2
    };

    context.strokeStyle = movement.directedEdgeId ? "#7c3aed" : "#ef4444";
    context.fillStyle = movement.directedEdgeId ? "#7c3aed" : "#ef4444";
    context.lineWidth = 7;
    context.globalAlpha = 0.45;
    context.beginPath();
    context.moveTo(fromPoint.x, fromPoint.y);
    context.lineTo(toPoint.x, toPoint.y);
    context.stroke();
    context.globalAlpha = 1;
    drawArrowHead(context, fromPoint, toPoint);

    context.fillStyle = "#ffffff";
    context.strokeStyle = movement.directedEdgeId ? "#6d28d9" : "#dc2626";
    context.lineWidth = 1;
    context.beginPath();
    context.arc(midPoint.x, midPoint.y, 9, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = movement.directedEdgeId ? "#5b21b6" : "#b91c1c";
    context.font = "bold 10px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(index + 1), midPoint.x, midPoint.y + 0.5);
  });

  for (const overlay of input.routeIssueOverlays) {
    drawRouteIssueOverlay(context, overlay, input.viewport);
  }

  for (const node of marloweDistrictMap.nodes) {
    const point = mapToScreenPoint(node, input.viewport);

    context.fillStyle = "#ffffff";
    context.strokeStyle = "#64748b";
    context.lineWidth = 1;
    context.beginPath();
    context.arc(point.x, point.y, 4, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }

  input.pipelineResult.matchResult?.nodeIds.forEach((nodeId, index) => {
    const node = nodeById(nodeId);

    if (!node) {
      return;
    }

    drawNodeMarker({
      context,
      point: mapToScreenPoint(node, input.viewport),
      label: String(index + 1),
      fillStyle: index === 0 ? "#2563eb" : "#7c3aed",
      radius: 7
    });
  });

  if (input.selectedExercise) {
    input.selectedExercise.stops.forEach((stop, index) => {
      const node = resolveStopNode(stop);

      if (!node) {
        return;
      }

      const point = mapToScreenPoint(node, input.viewport);

      drawNodeMarker({
        context,
        point,
        label: String(index + 1),
        fillStyle: index === 0 ? "#2563eb" : "#f97316",
        radius: 8
      });
    });
  }

  if (input.snapPreview.snappedPoints.length > 0) {
    context.strokeStyle = "#22c55e";
    context.lineWidth = 2;
    context.setLineDash([5, 5]);
    input.snapPreview.snappedPoints.forEach((point, index) => {
      const screenPoint = mapToScreenPoint(point.snappedPoint, input.viewport);

      if (index === 0) {
        context.beginPath();
        context.moveTo(screenPoint.x, screenPoint.y);
      } else {
        context.lineTo(screenPoint.x, screenPoint.y);
      }
    });
    context.stroke();
    context.setLineDash([]);
  }

  if (input.trace.points.length > 0) {
    context.strokeStyle = "#ea580c";
    context.lineWidth = 4;
    input.trace.points.forEach((point, index) => {
      const screenPoint = mapToScreenPoint(point, input.viewport);

      if (index === 0) {
        context.beginPath();
        context.moveTo(screenPoint.x, screenPoint.y);
      } else {
        context.lineTo(screenPoint.x, screenPoint.y);
      }
    });
    context.stroke();
  }

  input.snapPreview.snappedPoints.forEach((point) => {
    const screenPoint = mapToScreenPoint(point.originalPoint, input.viewport);

    context.fillStyle = point.roadId ? "#16a34a" : "#dc2626";
    context.beginPath();
    context.arc(screenPoint.x, screenPoint.y, 3, 0, Math.PI * 2);
    context.fill();
  });
}

function createViewport(): ScreenMapViewport {
  const mapBounds = expandBoundingBox(boundingBoxForPoints(marloweDistrictMap.nodes), 45);

  return {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    mapBounds
  };
}

function readableError(caughtError: unknown): string {
  return caughtError instanceof Error ? caughtError.message : "Route runner failed with an unknown error.";
}

export function RouteRunnerClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [exerciseId, setExerciseId] = useState(marloweDistrictRouteExercises[0]?.id ?? "");
  const [nodeIdsText, setNodeIdsText] = useState("");
  const [roadIdsText, setRoadIdsText] = useState("");
  const [result, setResult] = useState<RunRouteExerciseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drawnTrace, setDrawnTrace] = useState<DrawnRouteTrace>(() => createDrawnRouteTrace());
  const [isDrawing, setIsDrawing] = useState(false);

  const viewport = useMemo(() => createViewport(), []);
  const selectedExercise = useMemo<RouteExercise | undefined>(
    () => marloweDistrictRouteExercises.find((exercise) => exercise.id === exerciseId),
    [exerciseId]
  );
  const drawnPipelineResult = useMemo(() => {
    const gestureValidation = validateDrawnRouteGesture(drawnTrace, {
      minimumRawPointCount: MIN_DRAWN_GESTURE_POINT_COUNT,
      minimumTotalDistance: MIN_DRAWN_GESTURE_DISTANCE
    });

    if (drawnTrace.points.length > 0 && !gestureValidation.isMeaningful) {
      return createInsufficientDrawnGesturePipelineResult({
        drawnTrace,
        validation: gestureValidation
      });
    }

    return runDrawnRoutePipeline({
      map: marloweDistrictMap,
      exercises: marloweDistrictRouteExercises,
      exerciseId,
      drawnTrace,
      options: {
        minimumGesturePointCount: MIN_DRAWN_GESTURE_POINT_COUNT,
        minimumGestureDistance: MIN_DRAWN_GESTURE_DISTANCE,
        maximumSnapDistance: SNAP_TOLERANCE
      }
    });
  }, [drawnTrace, exerciseId]);
  const snapPreview = drawnPipelineResult.snappedRoute ?? emptySnapPreview();
  const drawnDisplayStatus = getDrawnPipelineDisplayStatus(drawnPipelineResult, isDrawing);
  const pipelineStageBadges = getPipelineStageBadges(drawnPipelineResult, isDrawing);
  const pipelineIssueGroups = getPipelineIssueGroups(drawnPipelineResult, isDrawing);
  const visibleDrawnExerciseResult = isDrawing ? null : drawnPipelineResult.exerciseResult;
  const visibleDrawnPipelineResult = isDrawing
    ? {
        ...drawnPipelineResult,
        exerciseResult: null
      }
    : drawnPipelineResult;
  const routeIssueOverlays = useMemo(
    () => (isDrawing ? [] : buildRouteIssueOverlays(marloweDistrictMap, drawnPipelineResult)),
    [drawnPipelineResult, isDrawing]
  );
  const hasUsableDrawnMatch =
    drawnPipelineResult.matchResult?.status === "matched" &&
    drawnPipelineResult.matchResult.isReadyForRunRouteExercise;
  const drawnScoreDisplay = getDrawnRouteScoreDisplay(drawnPipelineResult, isDrawing);
  const requiredStopStatuses = getRequiredStopVisitStatuses(visibleDrawnExerciseResult);
  const extraDistanceMeters = result
    ? result.score.userRouteDistanceMeters - result.score.shortestLegalRouteDistanceMeters
    : 0;
  const drawnExtraDistanceMeters = safeExtraDistance(visibleDrawnExerciseResult);
  const snapPreviewRoadIds = uniqueOrdered(
    snapPreview.snappedPoints.map((point) => point.roadId).filter((roadId): roadId is string => Boolean(roadId))
  );

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    drawRouteCanvas({
      canvas,
      viewport,
      selectedExercise,
      trace: drawnTrace,
      snapPreview,
      pipelineResult: drawnPipelineResult,
      routeIssueOverlays
    });
  }, [drawnPipelineResult, drawnTrace, routeIssueOverlays, selectedExercise, snapPreview, viewport]);

  function pointerToMapPoint(canvas: HTMLCanvasElement | null, clientX: number, clientY: number): Vec2 | null {
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      return null;
    }

    const screenPoint = {
      x: ((clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT
    };

    return screenToMapPoint(screenPoint, viewport);
  }

  function clearDrawnAttempt() {
    setIsDrawing(false);
    setDrawnTrace(createDrawnRouteTrace());
  }

  function handleExerciseChange(nextExerciseId: string) {
    setExerciseId(nextExerciseId);
    setResult(null);
    setError(null);
    clearDrawnAttempt();
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;

    if (!canvas) {
      return;
    }

    const point = pointerToMapPoint(canvas, event.clientX, event.clientY);

    if (!point) {
      return;
    }

    if (canvas.isConnected) {
      canvas.setPointerCapture(event.pointerId);
    }

    setIsDrawing(true);
    setDrawnTrace(createDrawnRouteTrace([point]));
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) {
      return;
    }

    const canvas = event.currentTarget;

    if (!canvas) {
      return;
    }

    const point = pointerToMapPoint(canvas, event.clientX, event.clientY);

    if (!point) {
      return;
    }

    setDrawnTrace((currentTrace) => appendDrawnRoutePoint(currentTrace, point, 3));
  }

  function handlePointerEnd(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) {
      return;
    }

    const canvas = event.currentTarget;

    if (!canvas) {
      setIsDrawing(false);
      return;
    }

    const point = pointerToMapPoint(canvas, event.clientX, event.clientY);

    if (point) {
      setDrawnTrace((currentTrace) => appendDrawnRoutePoint(currentTrace, point, 3));
    }

    setIsDrawing(false);

    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  function handleRunRoute() {
    setResult(null);
    setError(null);

    try {
      const runResult = runRouteExercise({
        map: marloweDistrictMap,
        exercises: marloweDistrictRouteExercises,
        exerciseId,
        userRoute: {
          nodeIds: parseCommaSeparatedIds(nodeIdsText),
          roadIds: parseCommaSeparatedIds(roadIdsText)
        }
      });

      setResult(runResult);
    } catch (caughtError) {
      setError(readableError(caughtError));
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Developer route runner</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">Marlowe District route exercise runner</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              This debug page runs manual node and road ID selections through the Stage 55 exercise runner. It also
              captures raw drawn route traces and runs them through the Stage 63.5 drawing, snapping, matching, and
              scoring pipeline.
            </p>
          </div>
          <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-900">
            Map: {marloweDistrictMap.name}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <label htmlFor="route-exercise" className="text-sm font-semibold text-slate-900">
              Route exercise
            </label>
            <select
              id="route-exercise"
              value={exerciseId}
              onChange={(event) => handleExerciseChange(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {marloweDistrictRouteExercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.title}
                </option>
              ))}
            </select>

            {selectedExercise ? (
              <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                <h2 className="font-semibold text-slate-950">{selectedExercise.title}</h2>
                <dl className="mt-3 space-y-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exercise ID</dt>
                    <dd className="mt-1 font-mono text-xs text-slate-700">{selectedExercise.id}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start</dt>
                    <dd className="mt-1">{stopLabel(selectedExercise.stops[0])}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Required stops</dt>
                    <dd className="mt-1">
                      <ol className="list-decimal space-y-1 pl-5">
                        {selectedExercise.stops.slice(1).map((stop, index) => (
                          <li key={`${selectedExercise.id}-stop-${index}`}>{stopLabel(stop)}</li>
                        ))}
                      </ol>
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Drawn attempt</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pipelineStatusClass(drawnDisplayStatus)}`}>
                    {displayStatusText(drawnDisplayStatus)}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Manual route input</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Enter comma-separated fixture IDs. If both fields are supplied, each road must connect the matching pair
              of selected nodes.
            </p>

            <label htmlFor="node-ids" className="mt-4 block text-sm font-semibold text-slate-900">
              Node IDs
            </label>
            <textarea
              id="node-ids"
              value={nodeIdsText}
              onChange={(event) => setNodeIdsText(event.target.value)}
              rows={3}
              placeholder="n02, n03, n12, n17"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />

            <label htmlFor="road-ids" className="mt-4 block text-sm font-semibold text-slate-900">
              Road IDs
            </label>
            <textarea
              id="road-ids"
              value={roadIdsText}
              onChange={(event) => setRoadIdsText(event.target.value)}
              rows={3}
              placeholder="r02, r37, r24"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={handleRunRoute}
              className="mt-5 inline-flex items-center justify-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              Run route
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Drawing capture and snap preview</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Draw with mouse, touch, or stylus. The orange trace is raw input; green preview points are snapped
                  candidates. The panel below shows the dev-only pipeline result.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pipelineStatusClass(drawnDisplayStatus)}`}>
                  {displayStatusText(drawnDisplayStatus)}
                </span>
                <button
                  type="button"
                  onClick={clearDrawnAttempt}
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  Clear drawing
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950">
              {isDrawing ? (
                <p className="font-medium">Drawing active. Release the pointer to score the captured route.</p>
              ) : drawnDisplayStatus === "no drawing" ? (
                <p>
                  Draw from marker 1 through the ordered stop markers. The route runner will simplify, snap, match,
                  and score the captured route.
                </p>
              ) : (
                <p>
                  Trace captured for {selectedExercise?.title ?? "the selected exercise"}. Redraw to replace this
                  attempt, or clear it to reset the overlays and score.
                </p>
              )}
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                className="block h-auto w-full touch-none"
                aria-label="Marlowe District drawing capture canvas"
              />
            </div>

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-5">
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Raw points</p>
                <p className="mt-1 text-lg font-bold text-slate-950">{drawnTrace.points.length}</p>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Simplified</p>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  {drawnPipelineResult.simplifiedTrace.points.length}
                </p>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Snapped</p>
                <p className="mt-1 text-lg font-bold text-slate-950">{drawnPipelineResult.snappedPoints.length}</p>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {hasUsableDrawnMatch ? "Matched roads" : "Road candidates"}
                </p>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  {drawnPipelineResult.matchResult?.orderedRoadIds.length ?? 0}
                </p>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Off-road points</p>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  {snapPreview.diagnostics.filter((diagnostic) => diagnostic.code === "off_road_points").length}
                </p>
              </div>
            </div>

            <dl className="mt-4 grid gap-3 text-sm text-slate-700 lg:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Candidate roads</dt>
                <dd className="mt-1">{selectedRoadNames(snapPreviewRoadIds)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Snap diagnostics</dt>
                <dd className="mt-1">
                  {snapPreview.diagnostics.length > 0
                    ? snapPreview.diagnostics.map((diagnostic) => diagnostic.code).join(", ")
                    : "None"}
                </dd>
              </div>
            </dl>

            <div className="mt-4 rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-950">
              <p className="font-semibold">Restriction overlays</p>
              <p className="mt-1 text-xs leading-5">
                Road-level no-entry, road-closed, and one-way restrictions are drawn from the existing map-engine
                fixture data. Turn-only prohibited turns are still enforced by the engine but are not drawn as junction
                arrows yet.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                {ROAD_RESTRICTION_OVERLAYS.map((overlay, index) => (
                  <span
                    key={`${overlay.kind}-${overlay.roadId}-${index}`}
                    className="rounded-full border border-red-200 bg-white px-3 py-1 text-red-900"
                  >
                    {overlay.roadId}: {overlay.kind}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-700">
              <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1">Orange: raw route</span>
              <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1">Green: snapped points</span>
              <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1">Purple: matched route</span>
              <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1">Red: unresolved direction</span>
              <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1">Red barred: no-entry</span>
              <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1">
                Red issue: illegal section
              </span>
              <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1">
                Orange issue: disconnected gap
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1">Amber: restricted</span>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1">Blue dashed: one-way</span>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1">Numbered: stops/nodes</span>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Drawn route pipeline result</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Raw drawing is simplified, snapped, matched to roads, and then passed to the route exercise runner
                  when the match is usable.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${pipelineStatusClass(
                  drawnDisplayStatus
                )}`}
              >
                {displayStatusText(drawnDisplayStatus)}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {pipelineStageBadges.map((badge) => (
                <span
                  key={badge.id}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${stageBadgeClass(badge.state)}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>

            <div className={`mt-4 rounded-md border p-4 text-sm ${scoreStateClass(drawnScoreDisplay.state)}`}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold">{drawnScoreDisplay.label}</p>
                <p className="text-xs font-semibold uppercase tracking-wide">
                  {visibleDrawnExerciseResult ? resultSummary(visibleDrawnExerciseResult) : drawnDisplayStatus}
                </p>
              </div>
              <p className="mt-2">{drawnScoreDisplay.summary}</p>
            </div>

            {routeIssueOverlays.length > 0 ? (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-950">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="font-semibold">Route issue overlay</h3>
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {routeIssueOverlays.length} visible marker{routeIssueOverlays.length === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5">
                  The highlighted red/orange marker on the map points to the failed movement, illegal section, or
                  disconnected transition reported by the existing pipeline diagnostics.
                </p>
                <ul className="mt-3 space-y-2">
                  {routeIssueOverlays.map((overlay, index) => (
                    <li
                      key={`${overlay.kind}-${overlay.roadIds.join("-")}-${overlay.movementIndex ?? index}`}
                      className="rounded-md border border-red-100 bg-white p-3"
                    >
                      <p className="font-semibold">
                        {overlay.label}
                        {overlay.roadIds.length > 0 ? ` (${overlay.roadIds.join(" -> ")})` : ""}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-red-900">{overlay.message}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Simplified points</p>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  {drawnPipelineResult.simplifiedTrace.points.length}
                </p>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Snapped points</p>
                <p className="mt-1 text-lg font-bold text-slate-950">{drawnPipelineResult.snappedPoints.length}</p>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {hasUsableDrawnMatch ? "Matched roads" : "Road candidates"}
                </p>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  {drawnPipelineResult.matchResult?.orderedRoadIds.length ?? 0}
                </p>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score</p>
                <p className="mt-1 text-lg font-bold text-slate-950">{scoreSummary(visibleDrawnExerciseResult)}</p>
              </div>
            </div>

            {visibleDrawnExerciseResult ? (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-950">Drawn route score summary</h3>
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-5">
                  <div className="rounded-md border border-slate-100 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {visibleDrawnExerciseResult.score.passed ? "Pass" : "Fail"}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-100 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {visibleDrawnExerciseResult.score.scorePercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-100 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shortest legal</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {formatDistance(visibleDrawnExerciseResult.score.shortestLegalRouteDistanceMeters)}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-100 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">User route</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {formatDistance(visibleDrawnExerciseResult.score.userRouteDistanceMeters)}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-100 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Extra distance</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">{formatDistance(drawnExtraDistanceMeters)}</p>
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 text-sm text-slate-700 lg:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Failure reasons</dt>
                    <dd className="mt-1">
                      {visibleDrawnExerciseResult.score.failureReasons.length > 0
                        ? visibleDrawnExerciseResult.score.failureReasons.join(", ")
                        : "None"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Illegal movements</dt>
                    <dd className="mt-1">
                      {visibleDrawnExerciseResult.score.legality.illegalMovements.length > 0
                        ? visibleDrawnExerciseResult.score.legality.illegalMovements
                            .map((movement) => `${movement.type} on ${movement.roadId}`)
                            .join(", ")
                        : "None"}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}

            {requiredStopStatuses.length > 0 ? (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-950">Required stop progress</h3>
                <ol className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  {requiredStopStatuses.map((stop) => (
                    <li
                      key={`${stop.order}-${stop.nodeId}`}
                      className={`rounded-md border p-3 ${stopVisitClass(stop.visited)}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide">
                        {stop.role} {stop.order}
                      </p>
                      <p className="mt-1 font-semibold">{nodeLabel(stop.nodeId)}</p>
                      <p className="mt-1 text-xs">
                        {stop.visited
                          ? `Visited${typeof stop.visitedIndex === "number" ? ` at position ${stop.visitedIndex + 1}` : ""}`
                          : "Missing or out of order"}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <dl className="mt-4 grid gap-3 text-sm text-slate-700 lg:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {hasUsableDrawnMatch ? "Matched road IDs" : "Road candidate IDs"}
                </dt>
                <dd className="mt-1 font-mono text-xs">
                  {idList(drawnPipelineResult.matchResult?.orderedRoadIds ?? [])}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {hasUsableDrawnMatch ? "Matched node IDs" : "Node sequence IDs"}
                </dt>
                <dd className="mt-1 font-mono text-xs">{idList(drawnPipelineResult.matchResult?.nodeIds ?? [])}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Directed edge IDs</dt>
                <dd className="mt-1 font-mono text-xs">
                  {nullableIdList(drawnPipelineResult.matchResult?.directedEdgeSequence ?? [])}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pipeline warnings</dt>
                <dd className="mt-1">
                  {drawnPipelineResult.warnings.length > 0
                    ? drawnPipelineResult.warnings
                        .map((warning) => `${warning.source}:${warning.code}`)
                        .join(", ")
                    : "None"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Drawn result</dt>
                <dd className="mt-1">
                  {visibleDrawnExerciseResult ? resultSummary(visibleDrawnExerciseResult) : "Not scored"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Extra distance</dt>
                <dd className="mt-1">{formatDistance(drawnExtraDistanceMeters)}</dd>
              </div>
            </dl>

            {pipelineIssueGroups.length > 0 ? (
              <div className="mt-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-950">Warnings and scoring notes</h3>
                {pipelineIssueGroups.map((group) => (
                  <div
                    key={group.label}
                    className={`rounded-md border p-3 text-sm ${warningSeverityClass(
                      group.label === "Exercise / scoring" ? "error" : "warning"
                    )}`}
                  >
                    <p className="font-semibold">{group.label}</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {group.messages.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-md border border-green-100 bg-green-50 p-3 text-sm text-green-900">
                No pipeline warnings for the current drawn attempt.
              </div>
            )}

            {visibleDrawnExerciseResult ? (
              <>
                <h3 className="mt-5 text-sm font-semibold text-slate-950">Drawn route score result</h3>
                <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                  {JSON.stringify(visibleDrawnExerciseResult.score, null, 2)}
                </pre>
              </>
            ) : null}

            <h3 className="mt-5 text-sm font-semibold text-slate-950">Pipeline debug result</h3>
            <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
              {JSON.stringify(visibleDrawnPipelineResult, null, 2)}
            </pre>
          </section>

          {error ? (
            <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-900 shadow-sm">
              <h2 className="font-semibold">Runner error</h2>
              <p className="mt-2 font-mono text-xs">{error}</p>
            </section>
          ) : null}

          {result ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold text-slate-950">Manual run result</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    result.score.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {resultSummary(result)}
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
                <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{result.score.scorePercent.toFixed(1)}%</p>
                </div>
                <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">User distance</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {formatDistance(result.score.userRouteDistanceMeters)}
                  </p>
                </div>
                <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shortest legal</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {formatDistance(result.score.shortestLegalRouteDistanceMeters)}
                  </p>
                </div>
                <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Extra distance</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{formatDistance(extraDistanceMeters)}</p>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 text-sm text-slate-700 lg:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Failure reason</dt>
                  <dd className="mt-1">
                    {result.score.failureReasons.length > 0 ? result.score.failureReasons.join(", ") : "None"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Violations</dt>
                  <dd className="mt-1">
                    {result.score.legality.illegalMovements.length > 0
                      ? result.score.legality.illegalMovements
                          .map((movement) => `${movement.type} on ${movement.roadId}`)
                          .join(", ")
                      : "None"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Normalised nodes</dt>
                  <dd className="mt-1 font-mono text-xs">{result.normalisedAttempt.selectedNodeIds.join(" -> ")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Normalised roads</dt>
                  <dd className="mt-1 font-mono text-xs">{result.normalisedAttempt.selectedRoadIds.join(" -> ")}</dd>
                </div>
              </dl>

              <h3 className="mt-5 text-sm font-semibold text-slate-950">Attempted movements</h3>
              <pre className="mt-2 max-h-52 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {JSON.stringify(result.normalisedAttempt.movements, null, 2)}
              </pre>

              <h3 className="mt-5 text-sm font-semibold text-slate-950">Normalised attempt</h3>
              <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {JSON.stringify(result.normalisedAttempt, null, 2)}
              </pre>

              <h3 className="mt-5 text-sm font-semibold text-slate-950">Score result</h3>
              <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {JSON.stringify(result.score, null, 2)}
              </pre>
            </section>
          ) : (
            <section className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              Run a manual node/road route to see the normalised attempt and scoring result.
            </section>
          )}
        </div>
      </section>
    </div>
  );
}
