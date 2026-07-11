"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent, type PointerEvent } from "react";
import {
  buildRoadRenderPasses,
  buildSyntheticMapLabels,
  buildSyntheticRoadVisuals,
  cartographicCustomMarkerAssetScaleForZoom,
  filterSyntheticMapLabelsForViewport,
  labelStyleForSyntheticMapLabel,
  roadStyleForViewport,
  type SyntheticMapLabel
} from "../route-runner/syntheticStreetMapRenderer";
import {
  buildRestrictionMapVisualItems,
  filterRestrictionMapVisualItemsForViewport,
  restrictionMapVisualStyleForViewport,
  type RestrictionMapVisualItem
} from "../route-runner/restrictionMapVisuals";
import { buildRoadRestrictionOverlays } from "../route-runner/routeRunnerDisplay";
import {
  getRouteRunnerMapViewportBounds,
  type RouteRunnerMapBounds
} from "../route-runner/routeRunnerMapOptionUtils";
import { TOPOPASS_STREET_ATLAS_STYLE } from "../route-runner/topopassCartographyStyle";
import {
  addTrainingRouteAuthorCheckpoint,
  appendTrainingRouteAuthorStrokePoint,
  buildTrainingRouteAuthorViewportLayout,
  buildTrainingRouteAuthorModel,
  canContinueTrainingRouteAuthorDrawPointer,
  canContinueTrainingRouteAuthorPanPointer,
  canStartTrainingRouteAuthorPointer,
  clearTrainingRouteAuthorCheckpoints,
  clearTrainingRouteAuthorRoute,
  compareTrainingRouteAuthorShortestRoute,
  createEmptyTrainingRouteAuthorState,
  createSampleTrainingRouteAuthorState,
  dominantTrainingRouteAuthorWheelDelta,
  finishTrainingRouteAuthorStroke,
  getTrainingRouteAuthorMap,
  isTrainingRouteAuthorMiddlePanPointer,
  removeLastTrainingRouteAuthorCheckpoint,
  resolveNearestTrainingRouteAuthorNodeSnap,
  selectTrainingRouteAuthorArea,
  setTrainingRouteAuthorDestination,
  setTrainingRouteAuthorMode,
  setTrainingRouteAuthorStart,
  shouldIsolateTrainingRouteAuthorMapWheel,
  shouldIsolateTrainingRouteAuthorPointer,
  shouldPreventTrainingRouteAuthorAuxiliaryClick,
  startTrainingRouteAuthorStroke,
  TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT,
  TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH,
  TRAINING_ROUTE_AUTHOR_MAP_LEGEND_ITEMS,
  trainingRouteAuthorMapPointForClientPoint,
  trainingRouteAuthorStateHasUnsavedChanges,
  trainingRouteAuthorViewportAspectRatioCss,
  trainingRouteAuthorWheelZoomFactor,
  undoTrainingRouteAuthorAction,
  updateTrainingRouteAuthorMetadataField,
  validateTrainingRouteAuthorState,
  zoomTrainingRouteAuthorBoundsAroundScreenPoint,
  type CuratedShortestRouteComparisonDetail,
  type TrainingRouteAuthorDraftSaveReadiness,
  type TrainingRouteAuthorField,
  type TrainingRouteAuthorMode,
  type TrainingRouteAuthorNodeSnapResult,
  type TrainingRouteAuthorPointerMapConversion,
  type TrainingRouteAuthorSaveTarget,
  type TrainingRouteAuthorStatusItem,
  type TrainingRouteAuthorToolbarAction,
  type TrainingRouteAuthorState
} from "./trainingRouteAuthor";
import { getTurnRestrictionVisuals, type Vec2 } from "../../../lib/map-engine/index.ts";

type DragState =
  | {
      kind: "pan";
      pointerId: number;
      clientX: number;
      clientY: number;
      source: "primary" | "middle";
    }
  | {
      kind: "draw";
      pointerId: number;
    }
  | {
      kind: "select";
      pointerId: number;
    }
  | null;

type TrainingRouteAuthorFileSaveStatus = {
  state: "idle" | "saving" | "saved" | "error";
  message: string;
  saveMode?: TrainingRouteAuthorSaveTarget["mode"];
  relativePath?: string;
  savedAt?: string;
  missingItems?: string[];
};

type TrainingRouteAuthorClickDiagnostic = {
  mode: TrainingRouteAuthorMode;
  message: string;
  clientPoint: Vec2;
  localPoint: Vec2;
  screenPoint: Vec2;
  mapPoint: Vec2;
  contentRect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  snap?: {
    nodeId: string;
    roadId: string;
    roadName?: string;
    roadPoint: Vec2;
    nodePoint: Vec2;
    roadDistance: number;
    nodeDistance: number;
  };
};

type TrainingRouteAuthorAutosavePayload = {
  state: TrainingRouteAuthorState;
  savedAt: string;
};

type TrainingRouteAuthorDrawerTabId = "authoring-steps" | "route-state" | "validation" | "metadata" | "export";

const TRAINING_ROUTE_AUTHOR_DRAWER_TABS: Array<{
  id: TrainingRouteAuthorDrawerTabId;
  label: string;
}> = [
  { id: "authoring-steps", label: "Authoring steps" },
  { id: "route-state", label: "Route state" },
  { id: "validation", label: "Validation" },
  { id: "metadata", label: "Metadata" },
  { id: "export", label: "Export" }
];

const TRAINING_ROUTE_AUTHOR_PRIMARY_TOOLBAR_ACTION_IDS: readonly TrainingRouteAuthorToolbarAction["id"][] = [
  "pan",
  "set-start",
  "draw-route",
  "add-checkpoint",
  "set-destination",
  "undo"
];

const TRAINING_ROUTE_AUTHOR_MORE_TOOLBAR_ACTION_IDS: readonly TrainingRouteAuthorToolbarAction["id"][] = [
  "redo",
  "remove-last-checkpoint",
  "clear-route",
  "clear-checkpoints",
  "reset-view"
];

type CuratedTrainingRouteDraftSaveResponse = {
  ok?: boolean;
  message?: string;
  relativePath?: string;
  savedAt?: string;
  errors?: string[];
};

const TRAINING_ROUTE_AUTHOR_AUTOSAVE_KEY = "topopass.devTrainingRouteAuthor.autosave.v1";
const TRAINING_ROUTE_SAVE_ENDPOINT = "/api/dev/training-routes/drafts";
const CLICK_DIAGNOSTIC_RAW_STROKE = "#f59e0b";
const CLICK_DIAGNOSTIC_SNAP_STROKE = "#0f766e";

function polylinePoints(points: readonly Vec2[]): string {
  return points.map((point) => `${Math.round(point.x)},${Math.round(point.y)}`).join(" ");
}

function boundsWidth(bounds: RouteRunnerMapBounds): number {
  return bounds.maxX - bounds.minX;
}

function boundsHeight(bounds: RouteRunnerMapBounds): number {
  return bounds.maxY - bounds.minY;
}

function statusClass(state: TrainingRouteAuthorStatusItem["state"]): string {
  if (state === "complete" || state === "ready") {
    return "border-green-200 bg-green-50 text-green-900";
  }

  if (state === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function fieldValueForInput(field: TrainingRouteAuthorField): string {
  return field.value;
}

function parseTrainingRouteAuthorAutosave(raw: string | null): TrainingRouteAuthorAutosavePayload | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      state?: unknown;
      savedAt?: unknown;
    };

    if (!isAutosavedTrainingRouteAuthorState(parsed.state) || typeof parsed.savedAt !== "string") {
      return null;
    }

    return {
      state: parsed.state,
      savedAt: parsed.savedAt
    };
  } catch {
    return null;
  }
}

function isAutosavedTrainingRouteAuthorState(value: unknown): value is TrainingRouteAuthorState {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as { activeMode?: unknown }).activeMode === "string" &&
    Boolean((value as { metadata?: unknown }).metadata) &&
    typeof (value as { routeDraft?: unknown }).routeDraft === "object"
  );
}

function readinessMissingItems(readiness: Pick<TrainingRouteAuthorDraftSaveReadiness, "checklist">): string[] {
  return readiness.checklist.filter((item) => !item.complete).map((item) => item.label);
}

function readableTimestamp(timestamp: string | null | undefined): string {
  if (!timestamp) {
    return "Not yet";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function readableActionTitle(action: TrainingRouteAuthorToolbarAction): string {
  if (action.disabled) {
    return `${action.label} unavailable until required route state exists`;
  }

  return action.label;
}

function toolbarActionClass(action: TrainingRouteAuthorToolbarAction): string {
  if (action.pressed) {
    return "border-blue-700 bg-blue-700 text-white shadow-sm";
  }

  if (action.primary) {
    return "border-blue-200 bg-white text-slate-900 hover:border-blue-300 hover:bg-blue-50 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400";
  }

  return "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-400";
}

function drawerTabClass(active: boolean): string {
  return active
    ? "border-blue-700 text-blue-700"
    : "border-transparent text-slate-700 hover:border-slate-300 hover:text-slate-950";
}

function isTrainingRouteAuthorMode(id: TrainingRouteAuthorToolbarAction["id"]): id is TrainingRouteAuthorMode {
  return (
    id === "pan" ||
    id === "set-start" ||
    id === "draw-route" ||
    id === "add-checkpoint" ||
    id === "set-destination"
  );
}

function fontSizeFromFont(font: string, fallback = 11): number {
  const fontSizeMatch = /(\d+(?:\.\d+)?)px/.exec(font);

  return fontSizeMatch ? Number(fontSizeMatch[1]) : fallback;
}

function markerLabelForAuthorMarker(marker: { id: string; kind: "start" | "destination" | "checkpoint"; label: string; point: Vec2 }): SyntheticMapLabel {
  return {
    id: `author-${marker.id}-label`,
    kind: marker.kind === "destination" ? "finish" : marker.kind,
    text: marker.label,
    point: marker.point,
    priority: TOPOPASS_STREET_ATLAS_STYLE.labels.priorities.exerciseStop
  };
}

function markerAssetForAuthorMarker(marker: { kind: "start" | "destination" | "checkpoint" }) {
  if (marker.kind === "start") {
    return TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.start.asset;
  }

  if (marker.kind === "destination") {
    return TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.destination.asset;
  }

  return TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.checkpointBase.asset;
}

function markerToneForAuthorMarker(marker: { kind: "start" | "destination" | "checkpoint" }) {
  if (marker.kind === "start") {
    return TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.start;
  }

  if (marker.kind === "destination") {
    return TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.destination;
  }

  return TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.markers.checkpointBase;
}

function scaledDash(dash: readonly number[] | undefined, mapUnitsPerPixel: number): string | undefined {
  return dash?.map((value) => value * mapUnitsPerPixel).join(" ");
}

function renderStyledRoutePolyline(
  id: string,
  points: readonly Vec2[],
  style: {
    strokeColor: string;
    strokeWidth: number;
    casingColor?: string;
    casingWidth?: number;
    dash?: readonly number[];
    alpha?: number;
  },
  mapUnitsPerPixel: number
) {
  if (points.length < 2) {
    return null;
  }

  return (
    <g key={id} opacity={style.alpha ?? 1}>
      {style.casingColor && style.casingWidth ? (
        <polyline
          fill="none"
          points={polylinePoints(points)}
          stroke={style.casingColor}
          strokeDasharray={scaledDash(style.dash, mapUnitsPerPixel)}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={style.casingWidth * mapUnitsPerPixel}
        />
      ) : null}
      <polyline
        fill="none"
        points={polylinePoints(points)}
        stroke={style.strokeColor}
        strokeDasharray={scaledDash(style.dash, mapUnitsPerPixel)}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={style.strokeWidth * mapUnitsPerPixel}
      />
    </g>
  );
}

function restrictionDirectionAngle(item: RestrictionMapVisualItem): number {
  const direction = item.direction;

  if (!direction) {
    return 0;
  }

  return Math.atan2(direction.to.y - direction.from.y, direction.to.x - direction.from.x);
}

function renderOneWayRestrictionArrow(
  item: RestrictionMapVisualItem,
  mapUnitsPerPixel: number,
  zoomStyle: { alpha: number; scale: number }
) {
  const direction = item.direction;

  if (!direction) {
    return null;
  }

  const angle = restrictionDirectionAngle(item);
  const style = TOPOPASS_STREET_ATLAS_STYLE.restrictions.oneWay;
  const tip = {
    x: item.point.x + style.tipDistance * zoomStyle.scale * mapUnitsPerPixel * Math.cos(angle),
    y: item.point.y + style.tipDistance * zoomStyle.scale * mapUnitsPerPixel * Math.sin(angle)
  };
  const tail = {
    x: item.point.x - style.tailDistance * zoomStyle.scale * mapUnitsPerPixel * Math.cos(angle),
    y: item.point.y - style.tailDistance * zoomStyle.scale * mapUnitsPerPixel * Math.sin(angle)
  };
  const arrowLength = 10 * zoomStyle.scale * mapUnitsPerPixel;
  const headPoints = [
    tip,
    {
      x: tip.x - arrowLength * Math.cos(angle - Math.PI / 6),
      y: tip.y - arrowLength * Math.sin(angle - Math.PI / 6)
    },
    {
      x: tip.x - arrowLength * Math.cos(angle + Math.PI / 6),
      y: tip.y - arrowLength * Math.sin(angle + Math.PI / 6)
    }
  ];

  return (
    <g key={item.id} opacity={zoomStyle.alpha}>
      <line
        stroke={style.haloColor}
        strokeLinecap="round"
        strokeWidth={style.haloLineWidth * zoomStyle.scale * mapUnitsPerPixel}
        x1={tail.x}
        x2={tip.x}
        y1={tail.y}
        y2={tip.y}
      />
      <line
        stroke={style.color}
        strokeLinecap="round"
        strokeWidth={style.lineWidth * zoomStyle.scale * mapUnitsPerPixel}
        x1={tail.x}
        x2={tip.x}
        y1={tail.y}
        y2={tip.y}
      />
      <polygon fill={style.color} points={polylinePoints(headPoints)} />
    </g>
  );
}

function renderRestrictionSymbol(item: RestrictionMapVisualItem, viewport: { width: number; height: number; mapBounds: RouteRunnerMapBounds }, currentZoom: number, mapUnitsPerPixel: number) {
  const zoomStyle = restrictionMapVisualStyleForViewport(item, viewport, currentZoom);

  if (item.symbol === "one-way-arrow") {
    return renderOneWayRestrictionArrow(item, mapUnitsPerPixel, zoomStyle);
  }

  if (item.symbol === "no-entry-sign") {
    const style = TOPOPASS_STREET_ATLAS_STYLE.restrictions.noEntryMarker;
    const radius = style.radius * zoomStyle.scale * mapUnitsPerPixel;

    return (
      <g key={item.id} opacity={zoomStyle.alpha}>
        <circle
          cx={item.point.x}
          cy={item.point.y}
          fill={style.fillColor}
          r={radius}
          stroke={style.strokeColor}
          strokeWidth={style.strokeWidth * zoomStyle.scale * mapUnitsPerPixel}
        />
        <line
          stroke={style.strokeColor}
          strokeLinecap="round"
          strokeWidth={style.barWidth * zoomStyle.scale * mapUnitsPerPixel}
          x1={item.point.x - radius * style.barRadiusRatio}
          x2={item.point.x + radius * style.barRadiusRatio}
          y1={item.point.y}
          y2={item.point.y}
        />
      </g>
    );
  }

  if (item.symbol === "restricted-road-sign") {
    const style = TOPOPASS_STREET_ATLAS_STYLE.restrictions.restrictedMarker;
    const radius = style.radius * zoomStyle.scale * mapUnitsPerPixel;
    const points = [
      { x: item.point.x, y: item.point.y - radius },
      { x: item.point.x + radius, y: item.point.y },
      { x: item.point.x, y: item.point.y + radius },
      { x: item.point.x - radius, y: item.point.y }
    ];

    return (
      <g key={item.id} opacity={zoomStyle.alpha}>
        <polygon
          fill={style.fillColor}
          points={polylinePoints(points)}
          stroke={style.strokeColor}
          strokeWidth={style.strokeWidth * zoomStyle.scale * mapUnitsPerPixel}
        />
        <line
          stroke={style.symbolColor}
          strokeLinecap="round"
          strokeWidth={style.symbolLineWidth * zoomStyle.scale * mapUnitsPerPixel}
          x1={item.point.x}
          x2={item.point.x}
          y1={item.point.y - 7 * zoomStyle.scale * mapUnitsPerPixel}
          y2={item.point.y + 2 * zoomStyle.scale * mapUnitsPerPixel}
        />
        <circle
          cx={item.point.x}
          cy={item.point.y + 7 * zoomStyle.scale * mapUnitsPerPixel}
          fill={style.symbolColor}
          r={style.dotRadius * zoomStyle.scale * mapUnitsPerPixel}
        />
      </g>
    );
  }

  if (item.symbol === "turn-ban-sign") {
    const style = TOPOPASS_STREET_ATLAS_STYLE.restrictions.turnBanMarker;
    const scale = zoomStyle.scale * mapUnitsPerPixel;
    const radius = style.radius * scale;
    const direction = item.turnKind === "no-left-turn" ? -1 : 1;

    return (
      <g key={item.id} opacity={zoomStyle.alpha}>
        <circle
          cx={item.point.x}
          cy={item.point.y}
          fill={style.fillColor}
          r={radius}
          stroke={style.strokeColor}
          strokeWidth={style.strokeWidth * scale}
        />
        <g transform={`translate(${item.point.x} ${item.point.y}) scale(${scale})`}>
          {item.turnKind === "no-u-turn" ? (
            <>
              <path
                d="M -8 -1 L -3 -3 L -4 3"
                fill="none"
                stroke={style.arrowColor}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={style.arrowLineWidth}
              />
              <path
                d="M 6.7 4.2 A 7 7 0 1 0 -6.2 5.1"
                fill="none"
                stroke={style.arrowColor}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={style.arrowLineWidth}
              />
            </>
          ) : (
            <path
              d={`M ${-6 * direction} 6 L ${-6 * direction} 0 Q ${-6 * direction} -6 0 -6 L ${7 * direction} -6 M ${4 * direction} -10 L ${8 * direction} -6 L ${4 * direction} -2`}
              fill="none"
              stroke={style.arrowColor}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={style.arrowLineWidth}
            />
          )}
          <path
            d="M -9 9 L 9 -9"
            fill="none"
            stroke={style.strokeColor}
            strokeLinecap="round"
            strokeWidth={style.strokeWidth}
          />
        </g>
      </g>
    );
  }

  return null;
}

function renderAuthorMarker(marker: { id: string; kind: "start" | "destination" | "checkpoint"; label: string; point: Vec2 }, currentZoom: number, mapUnitsPerPixel: number) {
  const asset = markerAssetForAuthorMarker(marker);
  const tone = markerToneForAuthorMarker(marker);
  const assetScale = cartographicCustomMarkerAssetScaleForZoom(currentZoom) * mapUnitsPerPixel;

  if (!asset) {
    return (
      <circle
        cx={marker.point.x}
        cy={marker.point.y}
        fill={tone.fillColor}
        key={marker.id}
        r={tone.radius * mapUnitsPerPixel}
        stroke={tone.strokeColor}
        strokeWidth={tone.strokeWidth * mapUnitsPerPixel}
      />
    );
  }

  const width = asset.displayWidth * assetScale;
  const height = asset.displayHeight * assetScale;
  const anchorX = (asset.anchorX / asset.sourceWidth) * width;
  const anchorY = (asset.anchorY / asset.sourceHeight) * height;

  return (
    <image
      aria-hidden="true"
      height={height}
      href={asset.src}
      key={marker.id}
      preserveAspectRatio="xMidYMid meet"
      width={width}
      x={marker.point.x - anchorX}
      y={marker.point.y - anchorY}
    />
  );
}

function renderAuthorMarkerLabel(marker: { id: string; kind: "start" | "destination" | "checkpoint"; label: string; point: Vec2 }, viewport: { width: number; height: number; mapBounds: RouteRunnerMapBounds }, currentZoom: number, mapUnitsPerPixel: number) {
  const label = markerLabelForAuthorMarker(marker);
  const style = labelStyleForSyntheticMapLabel(label, viewport, currentZoom);
  const fontSize = fontSizeFromFont(style.font, 13) * mapUnitsPerPixel;
  const bubble = TOPOPASS_STREET_ATLAS_STYLE.exerciseMarkers.labelBubble;
  const paddingX = bubble.paddingX * mapUnitsPerPixel;
  const paddingY = bubble.paddingY * mapUnitsPerPixel;
  const textWidth = Math.max(bubble.minWidth * mapUnitsPerPixel, label.text.length * fontSize * 0.58 + paddingX * 2);
  const textHeight = fontSize + paddingY * 2;
  const x = label.point.x - textWidth / 2;
  const y = label.point.y + (style.yOffset ?? -58) * mapUnitsPerPixel - textHeight / 2;

  return (
    <g key={`${marker.id}-label`}>
      <rect
        fill={bubble.fillColor}
        height={textHeight}
        rx={bubble.borderRadius * mapUnitsPerPixel}
        stroke={style.color}
        strokeOpacity={0.28}
        strokeWidth={bubble.strokeWidth * mapUnitsPerPixel}
        width={textWidth}
        x={x}
        y={y}
      />
      <text
        fill={style.color}
        fontFamily="Arial, sans-serif"
        fontSize={fontSize}
        fontWeight="800"
        textAnchor="middle"
        x={label.point.x}
        y={y + textHeight / 2 + fontSize * 0.34}
      >
        {label.text}
      </text>
    </g>
  );
}

function formatDiagnosticPoint(point: Vec2): string {
  return `${point.x.toFixed(1)}, ${point.y.toFixed(1)}`;
}

function renderClickDiagnosticOverlay(
  diagnostic: TrainingRouteAuthorClickDiagnostic | null,
  mapUnitsPerPixel: number
) {
  if (!diagnostic) {
    return null;
  }

  const rawRadius = 5 * mapUnitsPerPixel;
  const snapRadius = 6 * mapUnitsPerPixel;
  const lineWidth = 1.75 * mapUnitsPerPixel;

  return (
    <g aria-hidden="true" key="click-diagnostic-overlay">
      <circle
        cx={diagnostic.mapPoint.x}
        cy={diagnostic.mapPoint.y}
        fill="rgba(245,158,11,0.18)"
        r={rawRadius}
        stroke={CLICK_DIAGNOSTIC_RAW_STROKE}
        strokeDasharray={`${3 * mapUnitsPerPixel} ${3 * mapUnitsPerPixel}`}
        strokeWidth={lineWidth}
      />
      {diagnostic.snap ? (
        <>
          <line
            stroke={CLICK_DIAGNOSTIC_SNAP_STROKE}
            strokeDasharray={`${4 * mapUnitsPerPixel} ${3 * mapUnitsPerPixel}`}
            strokeLinecap="round"
            strokeWidth={lineWidth}
            x1={diagnostic.mapPoint.x}
            x2={diagnostic.snap.nodePoint.x}
            y1={diagnostic.mapPoint.y}
            y2={diagnostic.snap.nodePoint.y}
          />
          <circle
            cx={diagnostic.snap.roadPoint.x}
            cy={diagnostic.snap.roadPoint.y}
            fill="#ffffff"
            r={rawRadius * 0.72}
            stroke={CLICK_DIAGNOSTIC_SNAP_STROKE}
            strokeWidth={lineWidth}
          />
          <circle
            cx={diagnostic.snap.nodePoint.x}
            cy={diagnostic.snap.nodePoint.y}
            fill="rgba(20,184,166,0.24)"
            r={snapRadius}
            stroke={CLICK_DIAGNOSTIC_SNAP_STROKE}
            strokeWidth={lineWidth}
          />
        </>
      ) : null}
    </g>
  );
}

function renderAuthorLegendSwatch(itemId: (typeof TRAINING_ROUTE_AUTHOR_MAP_LEGEND_ITEMS)[number]["id"]) {
  if (itemId === "one-way-arrows") {
    return (
      <span className="relative inline-flex h-3 w-7 items-center" aria-hidden="true">
        <span className="h-0.5 w-6 rounded-full bg-blue-700" />
        <span className="-ml-1 text-[10px] font-black leading-none text-blue-700">{">"}</span>
      </span>
    );
  }

  const swatchClass =
    itemId === "raw-drawing"
      ? "bg-orange-500"
      : itemId === "matched-route" || itemId === "checkpoint"
        ? "bg-purple-600"
        : itemId === "shortest-overlay"
          ? "bg-sky-600"
          : itemId === "start"
            ? "bg-green-600"
            : "bg-red-600";

  return <span className={`size-3 shrink-0 rounded-full ${swatchClass}`} aria-hidden="true" />;
}

function renderComparison(label: string, comparison: CuratedShortestRouteComparisonDetail) {
  const verdictClass =
    comparison.verdict === "major-detour-warning" || comparison.verdict === "detour-warning"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : comparison.verdict === "unknown"
        ? "border-slate-200 bg-slate-50 text-slate-700"
        : "border-green-200 bg-green-50 text-green-900";

  return (
    <div className={`rounded-lg border p-3 ${verdictClass}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
          <p className="mt-2 text-sm leading-6">{comparison.explanation}</p>
        </div>
        <span className="w-fit rounded-full border border-current px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          {comparison.verdict}
        </span>
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold">Authored route length</dt>
          <dd>{comparison.authoredLengthMeters === null ? "unknown" : `${comparison.authoredLengthMeters} m`}</dd>
        </div>
        <div>
          <dt className="font-semibold">Shortest valid route length</dt>
          <dd>{comparison.shortestLengthMeters === null ? "unknown" : `${comparison.shortestLengthMeters} m`}</dd>
        </div>
        <div>
          <dt className="font-semibold">Percentage longer</dt>
          <dd>{comparison.percentageLonger === null ? "unknown" : `${comparison.percentageLonger}%`}</dd>
        </div>
        <div>
          <dt className="font-semibold">Segment delta</dt>
          <dd>{comparison.segmentCountDelta === null ? "unknown" : comparison.segmentCountDelta}</dd>
        </div>
      </dl>
    </div>
  );
}

export function TrainingRouteAuthorClient() {
  const [state, setState] = useState<TrainingRouteAuthorState>(() => createEmptyTrainingRouteAuthorState());
  const selectedAreaId = state.metadata.areaId;
  const map = useMemo(() => getTrainingRouteAuthorMap(selectedAreaId), [selectedAreaId]);
  const initialMapBounds = useMemo(
    () => getRouteRunnerMapViewportBounds(map, TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH, TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT),
    [map]
  );
  const initialViewportLayout = useMemo(
    () =>
      buildTrainingRouteAuthorViewportLayout({
        mapBounds: initialMapBounds
      }),
    [initialMapBounds]
  );
  const initialBounds = initialViewportLayout.mapBounds;
  const [viewBounds, setViewBounds] = useState<RouteRunnerMapBounds>(initialBounds);
  const [showRestrictions, setShowRestrictions] = useState(true);
  const [showClickDiagnostics, setShowClickDiagnostics] = useState(false);
  const [clickDiagnostic, setClickDiagnostic] = useState<TrainingRouteAuthorClickDiagnostic | null>(null);
  const [mapInteractionMessage, setMapInteractionMessage] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [fileSaveStatus, setFileSaveStatus] = useState<TrainingRouteAuthorFileSaveStatus>({
    state: "idle",
    message: "No file save has run in this session."
  });
  const [lastAutosavedAt, setLastAutosavedAt] = useState<string | null>(null);
  const [autosaveNotice, setAutosaveNotice] = useState<string | null>(null);
  const [lastSavedExportJson, setLastSavedExportJson] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<TrainingRouteAuthorDrawerTabId>("authoring-steps");
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);
  const dragStateRef = useRef<DragState>(null);
  const mapSvgRef = useRef<SVGSVGElement | null>(null);
  const model = useMemo(() => buildTrainingRouteAuthorModel({ state }), [state]);
  const boundsForState = (nextState: TrainingRouteAuthorState): RouteRunnerMapBounds =>
    getRouteRunnerMapViewportBounds(
      getTrainingRouteAuthorMap(nextState),
      TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH,
      TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT
    );
  const resetTransientAuthoringUi = (nextState: TrainingRouteAuthorState, message?: string) => {
    setViewBounds(boundsForState(nextState));
    setCopyStatus(null);
    setClickDiagnostic(null);
    setMapInteractionMessage(message ?? null);
    setFileSaveStatus({
      state: "idle",
      message: "No file save has run in this session."
    });
    setLastSavedExportJson(null);
    dragStateRef.current = null;
  };
  const currentStep = model.authoringSteps.find((step) => step.current) ?? model.authoringSteps[0];
  const toolbarActionsById = useMemo(
    () => new Map(model.toolbarActions.map((action) => [action.id, action])),
    [model.toolbarActions]
  );
  const primaryToolbarActions = TRAINING_ROUTE_AUTHOR_PRIMARY_TOOLBAR_ACTION_IDS
    .map((id) => toolbarActionsById.get(id))
    .filter((action): action is TrainingRouteAuthorToolbarAction => Boolean(action));
  const moreToolbarActions = TRAINING_ROUTE_AUTHOR_MORE_TOOLBAR_ACTION_IDS
    .map((id) => toolbarActionsById.get(id))
    .filter((action): action is TrainingRouteAuthorToolbarAction => Boolean(action));
  const roadVisuals = useMemo(() => buildSyntheticRoadVisuals(map), [map]);
  const roadRenderPasses = useMemo(() => buildRoadRenderPasses(roadVisuals), [roadVisuals]);
  const mapLabels = useMemo(
    () =>
      buildSyntheticMapLabels(map, undefined, {
        includeOsmRoadLabels: true
      }),
    [map]
  );
  const viewport = useMemo(
    () => ({
      width: initialViewportLayout.screenSize.width,
      height: initialViewportLayout.screenSize.height,
      mapBounds: viewBounds
    }),
    [initialViewportLayout.screenSize.height, initialViewportLayout.screenSize.width, viewBounds]
  );
  const currentZoom = boundsWidth(initialBounds) / Math.max(1, boundsWidth(viewBounds));
  const roadRestrictionOverlays = useMemo(() => buildRoadRestrictionOverlays(map), [map]);
  const turnRestrictionVisuals = useMemo(() => getTurnRestrictionVisuals(map), [map]);
  const restrictionMapVisualItems = useMemo(
    () =>
      buildRestrictionMapVisualItems({
        roadRestrictionOverlays,
        turnRestrictionVisuals,
        routeIssueOverlays: [],
        viewport
      }),
    [roadRestrictionOverlays, turnRestrictionVisuals, viewport]
  );
  const visibleRestrictionMapVisualItems = useMemo(
    () =>
      filterRestrictionMapVisualItemsForViewport(restrictionMapVisualItems, viewport, {
        currentZoom
      }),
    [currentZoom, restrictionMapVisualItems, viewport]
  );
  const labels = useMemo(
    () =>
      filterSyntheticMapLabelsForViewport({
        labels: mapLabels,
        viewport,
        reservedBoxes: [],
        currentZoom
      }).slice(0, 260),
    [currentZoom, mapLabels, viewport]
  );
  const mapUnitsPerPixel = boundsWidth(viewBounds) / initialViewportLayout.screenSize.width;

  useEffect(() => {
    let recovered: TrainingRouteAuthorAutosavePayload | null = null;

    try {
      recovered = parseTrainingRouteAuthorAutosave(window.localStorage.getItem(TRAINING_ROUTE_AUTHOR_AUTOSAVE_KEY));
    } catch {
      setAutosaveNotice("Autosave recovery is unavailable in this browser session.");
      return;
    }

    if (!recovered) {
      return;
    }

    setState(recovered.state);
    setViewBounds(boundsForState(recovered.state));
    setLastAutosavedAt(recovered.savedAt);
    setAutosaveNotice(`Recovered autosaved route from ${readableTimestamp(recovered.savedAt)}.`);
  }, []);

  useEffect(() => {
    const savedAt = new Date().toISOString();
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          TRAINING_ROUTE_AUTHOR_AUTOSAVE_KEY,
          JSON.stringify({
            state,
            savedAt
          })
        );
        setLastAutosavedAt(savedAt);
      } catch {
        setAutosaveNotice("Autosave could not be written in this browser session.");
      }
    }, 500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [state]);

  useEffect(() => {
    const svg = mapSvgRef.current;

    if (!svg) {
      return undefined;
    }

    const svgElement = svg;

    function handleNativeWheel(event: globalThis.WheelEvent) {
      const targetInsideMap = event.target instanceof Node && svgElement.contains(event.target);

      if (
        !shouldIsolateTrainingRouteAuthorMapWheel({
          targetInsideMap,
          deltaX: event.deltaX,
          deltaY: event.deltaY
        })
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const rect = svgElement.getBoundingClientRect();
      const screenSize =
        rect.width === 0 || rect.height === 0
          ? initialViewportLayout.screenSize
          : {
              width: rect.width,
              height: rect.height
            };
      const screenPoint =
        rect.width === 0 || rect.height === 0
          ? {
              x: screenSize.width / 2,
              y: screenSize.height / 2
            }
          : {
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
            };
      const zoomDelta = dominantTrainingRouteAuthorWheelDelta({
        deltaX: event.deltaX,
        deltaY: event.deltaY
      });

      setViewBounds(
        zoomTrainingRouteAuthorBoundsAroundScreenPoint({
          currentBounds: viewBounds,
          initialBounds,
          screenPoint,
          screenSize,
          zoomFactor: trainingRouteAuthorWheelZoomFactor(zoomDelta)
        })
      );
    }

    svgElement.addEventListener("wheel", handleNativeWheel, { passive: false });

    return () => {
      svgElement.removeEventListener("wheel", handleNativeWheel);
    };
  }, [initialBounds, initialViewportLayout.screenSize, viewBounds]);

  function pointerMapConversionFromClientPoint(
    element: SVGSVGElement,
    clientX: number,
    clientY: number
  ): TrainingRouteAuthorPointerMapConversion | null {
    const rect = element.getBoundingClientRect();

    return trainingRouteAuthorMapPointForClientPoint({
      bounds: viewBounds,
      clientPoint: {
        clientX,
        clientY
      },
      viewportRect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      },
      screenSize: initialViewportLayout.screenSize
    });
  }

  function recordClickDiagnostic(input: {
    mode: TrainingRouteAuthorMode;
    conversion: TrainingRouteAuthorPointerMapConversion;
    snap?: TrainingRouteAuthorNodeSnapResult | null;
    message: string;
  }) {
    if (!showClickDiagnostics) {
      return;
    }

    setClickDiagnostic({
      mode: input.mode,
      message: input.message,
      clientPoint: {
        x: input.conversion.clientPoint.clientX,
        y: input.conversion.clientPoint.clientY
      },
      localPoint: input.conversion.localPoint,
      screenPoint: input.conversion.screenPoint,
      mapPoint: input.conversion.mapPoint,
      contentRect: input.conversion.contentRect,
      snap: input.snap
        ? {
            nodeId: input.snap.node.id,
            roadId: input.snap.roadId,
            roadName: input.snap.roadName,
            roadPoint: input.snap.roadPoint,
            nodePoint: input.snap.nodePoint,
            roadDistance: input.snap.roadDistance,
            nodeDistance: input.snap.nodeDistance
          }
        : undefined
    });
  }

  function panBy(deltaX: number, deltaY: number) {
    const xScale = boundsWidth(viewBounds) / initialViewportLayout.screenSize.width;
    const yScale = boundsHeight(viewBounds) / initialViewportLayout.screenSize.height;

    setViewBounds((currentBounds) => ({
      minX: currentBounds.minX - deltaX * xScale,
      maxX: currentBounds.maxX - deltaX * xScale,
      minY: currentBounds.minY - deltaY * yScale,
      maxY: currentBounds.maxY - deltaY * yScale
    }));
  }

  function isolateMapPointerEvent(event: PointerEvent<SVGSVGElement>) {
    if (
      shouldIsolateTrainingRouteAuthorPointer({
        targetInsideMap: true,
        activeMode: state.activeMode
      })
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function pointerButtonInput(event: PointerEvent<SVGSVGElement>) {
    return {
      button: event.button,
      buttons: event.buttons,
      pointerType: event.pointerType,
      isPrimary: event.isPrimary
    };
  }

  function handleMapMouseDown(event: MouseEvent<SVGSVGElement>) {
    if (
      shouldPreventTrainingRouteAuthorAuxiliaryClick({
        button: event.button,
        buttons: event.buttons,
        pointerType: "mouse"
      })
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function handleMapAuxClick(event: MouseEvent<SVGSVGElement>) {
    if (
      shouldPreventTrainingRouteAuthorAuxiliaryClick({
        button: event.button,
        buttons: event.buttons,
        pointerType: "mouse"
      })
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function handleMapContextMenu(event: MouseEvent<SVGSVGElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleMapPointerDown(event: PointerEvent<SVGSVGElement>) {
    isolateMapPointerEvent(event);
    const pointerInput = pointerButtonInput(event);

    if (isTrainingRouteAuthorMiddlePanPointer(pointerInput)) {
      dragStateRef.current = {
        kind: "pan",
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        source: "middle"
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
      return;
    }

    if (!canStartTrainingRouteAuthorPointer(pointerInput)) {
      dragStateRef.current = null;
      return;
    }

    if (state.activeMode === "pan") {
      dragStateRef.current = {
        kind: "pan",
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        source: "primary"
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
      return;
    }

    const conversion = pointerMapConversionFromClientPoint(event.currentTarget, event.clientX, event.clientY);

    if (!conversion) {
      setMapInteractionMessage("Click inside the visible map area.");
      return;
    }

    if (state.activeMode === "draw-route") {
      dragStateRef.current = {
        kind: "draw",
        pointerId: event.pointerId
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setMapInteractionMessage(null);
      recordClickDiagnostic({
        mode: state.activeMode,
        conversion,
        message: "Started drawing at the converted map point."
      });
      setState((currentState) => startTrainingRouteAuthorStroke(currentState, conversion.mapPoint));
      return;
    }

    dragStateRef.current = {
      kind: "select",
      pointerId: event.pointerId
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const snap = resolveNearestTrainingRouteAuthorNodeSnap(conversion.mapPoint, undefined, state);

    if (!snap) {
      const message = "Click closer to a road segment.";
      setMapInteractionMessage(message);
      recordClickDiagnostic({
        mode: state.activeMode,
        conversion,
        snap,
        message
      });
      return;
    }

    setMapInteractionMessage(null);
    recordClickDiagnostic({
      mode: state.activeMode,
      conversion,
      snap,
      message: `Snapped to ${snap.roadName ?? snap.roadId}.`
    });

    if (state.activeMode === "set-start") {
      setState((currentState) => setTrainingRouteAuthorStart(currentState, snap.node.id));
    } else if (state.activeMode === "set-destination") {
      setState((currentState) => setTrainingRouteAuthorDestination(currentState, snap.node.id));
    } else if (state.activeMode === "add-checkpoint") {
      setState((currentState) => addTrainingRouteAuthorCheckpoint(currentState, snap.node.id));
    }
  }

  function handleMapPointerMove(event: PointerEvent<SVGSVGElement>) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    isolateMapPointerEvent(event);

    if (dragState.kind === "select") {
      return;
    }

    if (dragState.kind === "pan") {
      if (!canContinueTrainingRouteAuthorPanPointer(pointerButtonInput(event), dragState.source)) {
        return;
      }

      panBy(event.clientX - dragState.clientX, event.clientY - dragState.clientY);
      dragStateRef.current = {
        ...dragState,
        clientX: event.clientX,
        clientY: event.clientY
      };
      return;
    }

    if (!canContinueTrainingRouteAuthorDrawPointer(pointerButtonInput(event))) {
      return;
    }

    const conversion = pointerMapConversionFromClientPoint(event.currentTarget, event.clientX, event.clientY);

    if (!conversion) {
      return;
    }

    recordClickDiagnostic({
      mode: state.activeMode,
      conversion,
      message: "Added a drawn route point at the converted map position."
    });
    setState((currentState) => appendTrainingRouteAuthorStrokePoint(currentState, conversion.mapPoint));
  }

  function handleMapPointerEnd(event: PointerEvent<SVGSVGElement>) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    isolateMapPointerEvent(event);
    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (dragState.kind !== "draw") {
      return;
    }

    const conversion = pointerMapConversionFromClientPoint(event.currentTarget, event.clientX, event.clientY);

    if (conversion) {
      recordClickDiagnostic({
        mode: state.activeMode,
        conversion,
        message: "Finished drawing at the converted map point."
      });
    }

    setState((currentState) => finishTrainingRouteAuthorStroke(currentState, conversion?.mapPoint));
  }

  function handleToolbarAction(action: TrainingRouteAuthorToolbarAction) {
    if (action.disabled) {
      return;
    }

    setCopyStatus(null);
    setMapInteractionMessage(null);

    if (isTrainingRouteAuthorMode(action.id)) {
      const nextMode = action.id;

      setState((currentState) => setTrainingRouteAuthorMode(currentState, nextMode));
      return;
    }

    if (action.id === "undo") {
      setState((currentState) => undoTrainingRouteAuthorAction(currentState));
    } else if (action.id === "remove-last-checkpoint") {
      setState((currentState) => removeLastTrainingRouteAuthorCheckpoint(currentState));
    } else if (action.id === "clear-route") {
      setState((currentState) => clearTrainingRouteAuthorRoute(currentState));
    } else if (action.id === "clear-checkpoints") {
      setState((currentState) => clearTrainingRouteAuthorCheckpoints(currentState));
    } else if (action.id === "reset-view") {
      setViewBounds(initialBounds);
    } else if (action.id === "validate-route") {
      setState((currentState) => validateTrainingRouteAuthorState(currentState));
      setDrawerCollapsed(false);
      setDrawerTab("validation");
    } else if (action.id === "compare-shortest-route") {
      setState((currentState) => compareTrainingRouteAuthorShortestRoute(currentState));
      setDrawerCollapsed(false);
      setDrawerTab("validation");
    } else if (action.id === "export-json") {
      setDrawerCollapsed(false);
      setDrawerTab("export");
    }
  }

  function handleMetadataChange(field: TrainingRouteAuthorField, event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    if (field.id === "areaId") {
      handleAreaSelectionChange(event.target.value);
      return;
    }

    setState((currentState) => updateTrainingRouteAuthorMetadataField(currentState, field.id, event.target.value));
  }

  function handleAreaSelectionChange(areaId: string) {
    if (!areaId || areaId === state.metadata.areaId) {
      return;
    }

    if (
      trainingRouteAuthorStateHasUnsavedChanges(state) &&
      !window.confirm("Changing map will clear the current route. Continue?")
    ) {
      return;
    }

    const nextState = selectTrainingRouteAuthorArea(state, areaId);

    setState(nextState);
    resetTransientAuthoringUi(nextState, "Map changed. Current route data has been cleared.");
    setAutosaveNotice(null);
    setLastAutosavedAt(null);
  }

  async function copyExportJson() {
    if (!model.exportReadiness.ready) {
      return;
    }

    try {
      await navigator.clipboard.writeText(model.exportJson);
      setCopyStatus("Export JSON copied.");
    } catch {
      setCopyStatus("Clipboard unavailable. Select the JSON text manually.");
    }
  }

  function downloadExportJson() {
    if (!model.exportReadiness.ready) {
      return;
    }

    const blob = new Blob([model.exportJson], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = model.exportReadiness.suggestedFilename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async function saveTrainingRoute(target: TrainingRouteAuthorSaveTarget) {
    const missingItems = readinessMissingItems(target);

    if (!target.ready) {
      setFileSaveStatus({
        state: "error",
        saveMode: target.mode,
        message: target.unavailableMessage ?? `${target.label} is not ready.`,
        missingItems
      });
      return;
    }

    setFileSaveStatus({
      state: "saving",
      saveMode: target.mode,
      message: `${target.label}...`
    });

    try {
      const response = await fetch(TRAINING_ROUTE_SAVE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          saveMode: target.mode,
          route: model.exportData
        })
      });
      const responseBody = (await response.json().catch(() => null)) as CuratedTrainingRouteDraftSaveResponse | null;

      if (!response.ok || !responseBody?.ok) {
        setFileSaveStatus({
          state: "error",
          saveMode: target.mode,
          message: responseBody?.message ?? `${target.label} could not be saved.`,
          missingItems: responseBody?.errors
        });
        return;
      }

      setFileSaveStatus({
        state: "saved",
        saveMode: target.mode,
        message: responseBody.message ?? `${target.label} saved.`,
        relativePath: responseBody.relativePath,
        savedAt: responseBody.savedAt
      });
      setLastSavedExportJson(model.exportJson);
    } catch {
      setFileSaveStatus({
        state: "error",
        saveMode: target.mode,
        message: `${target.label} could not be saved because the dev save endpoint was unavailable.`
      });
    }
  }

  function clearAutosaveDraft() {
    try {
      window.localStorage.removeItem(TRAINING_ROUTE_AUTHOR_AUTOSAVE_KEY);
      setAutosaveNotice("Temporary autosave recovery cleared. No route library file was changed.");
      setLastAutosavedAt(null);
    } catch {
      setAutosaveNotice("Autosave recovery could not be cleared in this browser session.");
    }
  }

  function renderField(field: TrainingRouteAuthorField) {
    const baseClass = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900";

    if (field.input === "textarea") {
      return (
        <>
          <textarea
            className={`${baseClass} min-h-24`}
            id={field.id}
            name={field.id}
            onChange={(event) => handleMetadataChange(field, event)}
            value={fieldValueForInput(field)}
          />
          {field.helpText ? <span className="mt-1 block text-xs font-normal text-slate-500">{field.helpText}</span> : null}
        </>
      );
    }

    if (field.input === "select") {
      return (
        <>
          <select
            className={baseClass}
            id={field.id}
            name={field.id}
            onChange={(event) => handleMetadataChange(field, event)}
            value={fieldValueForInput(field)}
          >
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {field.optionLabels?.[option] ?? option}
              </option>
            ))}
          </select>
          {field.helpText ? <span className="mt-1 block text-xs font-normal text-slate-500">{field.helpText}</span> : null}
        </>
      );
    }

    return (
      <>
        <input
          className={baseClass}
          id={field.id}
          name={field.id}
          onChange={(event) => handleMetadataChange(field, event)}
          value={fieldValueForInput(field)}
        />
        {field.helpText ? <span className="mt-1 block text-xs font-normal text-slate-500">{field.helpText}</span> : null}
      </>
    );
  }

  function renderToolbarButton(action: TrainingRouteAuthorToolbarAction) {
    return (
      <button
        aria-pressed={action.pressed}
        className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border px-4 py-2 text-sm font-semibold ${toolbarActionClass(action)}`}
        disabled={action.disabled}
        key={action.id}
        onClick={() => handleToolbarAction(action)}
        title={readableActionTitle(action)}
        type="button"
      >
        {action.label}
      </button>
    );
  }

  function openDrawerTab(tab: TrainingRouteAuthorDrawerTabId) {
    setDrawerCollapsed(false);
    setDrawerTab(tab);
  }

  function renderAuthoringStepsDrawer() {
    return (
      <section aria-labelledby="training-author-drawer-authoring-steps" data-testid="training-author-drawer-panel-authoring-steps">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink" id="training-author-drawer-authoring-steps">
              Authoring steps
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{currentStep.instruction}</p>
          </div>
          <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-900">
            Active mode: {model.activeMode.replaceAll("-", " ")}
          </span>
        </div>
        <ol className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          {model.authoringSteps.map((step) => (
            <li
              className={`rounded-lg border p-3 text-sm ${
                step.current
                  ? "border-blue-700 bg-blue-50 text-slate-950"
                  : step.complete
                    ? "border-green-200 bg-green-50 text-green-950"
                    : "border-slate-200 bg-white text-slate-700"
              }`}
              key={step.index}
            >
              <div className="flex items-start gap-2">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                  {step.index}
                </span>
                <div>
                  <p className="font-bold">{step.label}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide">
                    {step.complete ? "Complete" : step.current ? "Current" : "Pending"}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs leading-5">{step.complete ? "Ready" : step.instruction}</p>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  function renderRouteStateDrawer() {
    const routeStateActions = (["clear-route", "clear-checkpoints", "reset-view"] as const)
      .map((id) => toolbarActionsById.get(id))
      .filter((action): action is TrainingRouteAuthorToolbarAction => Boolean(action));

    return (
      <section aria-labelledby="training-author-drawer-route-state" data-testid="training-author-drawer-panel-route-state">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink" id="training-author-drawer-route-state">
              Route state
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{model.routeMatchMessage}</p>
          </div>
          <button
            className="inline-flex min-h-11 w-fit items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-950 hover:bg-blue-100"
            onClick={() => openDrawerTab("validation")}
            type="button"
          >
            Review validation
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Route state quick actions">
          {routeStateActions.map(renderToolbarButton)}
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {model.routeStatusItems.map((item) => (
            <div className={`rounded-lg border p-3 ${statusClass(item.state)}`} key={item.label}>
              <dt className="text-xs font-bold uppercase tracking-wide">{item.label}</dt>
              <dd className="mt-2 text-base font-bold">{item.value}</dd>
            </div>
          ))}
        </dl>
        <div
          className="mt-4 rounded-lg border border-slate-200 bg-white p-3"
          data-testid="training-author-checkpoint-state"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink">Ordered checkpoints</h3>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                {model.exportData.checkpointRequirements.required
                  ? "This route requires numbered checkpoints before the destination."
                  : "Checkpoints are optional unless the selected objective makes them required."}
              </p>
            </div>
            <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              {model.exportData.checkpointRequirements.checkpointCount} checkpoint(s)
            </span>
          </div>
          <ol className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2 xl:grid-cols-4">
            <li className="rounded-md border border-green-100 bg-green-50 p-2">
              <span className="font-bold text-green-800">Start</span>
              <span className="ml-2 font-mono text-xs">{model.exportData.start.nodeId}</span>
            </li>
            {model.exportData.checkpoints.map((checkpoint) => (
              <li className="rounded-md border border-amber-100 bg-amber-50 p-2" key={checkpoint.id ?? checkpoint.nodeId}>
                <span className="font-bold text-amber-900">{checkpoint.label}</span>
                <span className="ml-2 font-mono text-xs">{checkpoint.nodeId}</span>
              </li>
            ))}
            <li className="rounded-md border border-red-100 bg-red-50 p-2">
              <span className="font-bold text-red-800">Destination</span>
              <span className="ml-2 font-mono text-xs">{model.exportData.destination.nodeId}</span>
            </li>
          </ol>
          <p className="mt-3 text-xs leading-5 text-slate-500">{model.exportData.checkpointRequirements.instruction}</p>
        </div>
      </section>
    );
  }

  function renderValidationDrawer() {
    const validateAction = toolbarActionsById.get("validate-route");
    const compareAction = toolbarActionsById.get("compare-shortest-route");
    const affectedSegmentIds = model.validationRunStatus === "not-run" ? [] : model.validation.affectedRouteSegmentIds;

    return (
      <section aria-labelledby="training-author-drawer-validation" data-testid="training-author-drawer-panel-validation">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink" id="training-author-drawer-validation">
              Validation panel
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
              {model.validationRunStatus === "not-run"
                ? "Validation has not been run for the current authored route."
                : model.validation.explanation}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {validateAction ? (
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-950 hover:bg-blue-100"
                onClick={() => handleToolbarAction(validateAction)}
                type="button"
              >
                Validate route
              </button>
            ) : null}
            {compareAction ? (
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                onClick={() => handleToolbarAction(compareAction)}
                type="button"
              >
                Compare shortest route
              </button>
            ) : null}
          </div>
        </div>
        {model.approvalWarning ? (
          <p
            className={`mt-4 rounded-lg border p-3 text-sm leading-6 ${
              model.approvalWarning.blocking
                ? "border-red-200 bg-red-50 text-red-950"
                : "border-amber-200 bg-amber-50 text-amber-950"
            }`}
          >
            {model.approvalWarning.message}
          </p>
        ) : null}
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Blocking errors</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Must be fixed before complete route save.</p>
            {model.validationRunStatus === "not-run" || model.validation.blockingErrors.length === 0 ? (
              <p className="mt-2 text-sm text-slate-700">None shown</p>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-900">
                {model.validation.blockingErrors.map((issue) => (
                  <li key={`${issue.code}-${issue.explanation}`}>{issue.explanation}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Advisory warnings</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Review before approving. This does not block export.</p>
            {model.validationRunStatus === "not-run" || model.validation.advisoryWarnings.length === 0 ? (
              <p className="mt-2 text-sm text-slate-700">None shown</p>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
                {model.validation.advisoryWarnings.map((issue) => (
                  <li key={`${issue.code}-${issue.explanation}`}>{issue.explanation}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Affected segments</p>
            {affectedSegmentIds.length === 0 ? (
              <p className="mt-2 text-sm text-slate-700">None shown</p>
            ) : (
              <p className="mt-2 break-all font-mono text-xs text-slate-700">{affectedSegmentIds.join(", ")}</p>
            )}
          </div>
        </div>
        <p className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-950">
          Author decisions: learner suitability warnings may be intentional. Add route choice justification if the route is
          deliberately long, complex, or includes practice-specific detours.
        </p>
        <div className="mt-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Shortest route comparison</h3>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {renderComparison("Direct shortest route", model.shortestRouteComparison.directComparison)}
            {renderComparison(
              "Checkpoint-constrained shortest route",
              model.shortestRouteComparison.checkpointConstrainedComparison
            )}
          </div>
        </div>
      </section>
    );
  }

  function renderMetadataDrawer() {
    return (
      <section aria-labelledby="training-author-drawer-metadata" data-testid="training-author-drawer-panel-metadata">
        <h2 className="text-lg font-bold text-ink" id="training-author-drawer-metadata">
          Route metadata
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Complete metadata after the route shape is clear. These fields update the export JSON live.
        </p>
        <form className="mt-4 grid gap-4 md:grid-cols-2" data-testid="training-author-metadata-form">
          {model.metadataFields.map((field) => (
            <label
              className={`text-sm font-semibold text-slate-700 ${field.input === "textarea" ? "md:col-span-2" : ""}`}
              htmlFor={field.id}
              key={field.id}
            >
              {field.label}
              {renderField(field)}
            </label>
          ))}
        </form>
      </section>
    );
  }

  function renderExportDrawer() {
    return (
      <section aria-labelledby="training-author-drawer-export" data-testid="training-author-drawer-panel-export">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink" id="training-author-drawer-export">
              Export panel
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Explicit saves write route JSON to the selected training-route folder. Browser autosave is only temporary recovery.
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              Suggested route id: <span className="font-mono">{model.effectiveRouteId}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {model.saveTargets.map((target) => (
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-950 shadow-sm disabled:bg-slate-100 disabled:text-slate-500"
                disabled={fileSaveStatus.state === "saving" || !target.ready}
                key={target.mode}
                onClick={() => void saveTrainingRoute(target)}
                title={target.unavailableMessage ?? target.relativePath}
                type="button"
              >
                {target.actionLabel}
              </button>
            ))}
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm disabled:bg-slate-100 disabled:text-slate-500"
              disabled={!model.exportReadiness.ready}
              onClick={downloadExportJson}
              type="button"
            >
              Download JSON
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:bg-slate-300 disabled:text-slate-600"
              disabled={!model.exportReadiness.ready}
              onClick={copyExportJson}
              type="button"
            >
              Copy JSON
            </button>
          </div>
        </div>
        {copyStatus ? <p className="mt-3 text-sm font-semibold text-slate-700">{copyStatus}</p> : null}
        {autosaveNotice ? (
          <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
            Autosave recovery: {autosaveNotice}
          </p>
        ) : null}
        {model.validationRunStatus === "warning" ? (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-950">
            Complete route has advisory warnings. Review before approving. This does not block export.
          </p>
        ) : null}
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3" data-testid="training-author-checkpoint-export">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink">Checkpoint export</h3>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                Required: {model.exportData.checkpointRequirements.required ? "Yes" : "No"}; ordered:
                {model.exportData.checkpointRequirements.ordered ? " Yes" : " No"}.
              </p>
            </div>
            <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              {model.exportData.checkpointRequirements.requiredNodeIds.length} required stop node(s)
            </span>
          </div>
          {model.exportData.checkpoints.length === 0 ? (
            <p className="mt-3 text-sm text-slate-700">No intermediate checkpoints selected.</p>
          ) : (
            <dl className="mt-3 grid gap-2 text-xs text-slate-700 md:grid-cols-2 xl:grid-cols-3">
              {model.exportData.checkpoints.map((checkpoint) => (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-2" key={checkpoint.id ?? checkpoint.nodeId}>
                  <dt className="font-bold text-slate-900">
                    {checkpoint.display?.markerLabel ?? checkpoint.label} - {checkpoint.label}
                  </dt>
                  <dd className="mt-1 break-all font-mono">{checkpoint.nodeId}</dd>
                  <dd className="mt-1">
                    Segment: <span className="font-mono">{checkpoint.routeSegmentId ?? "unmatched"}</span>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className="mt-4 grid gap-3 xl:grid-cols-3">
          {model.saveTargets.map((target) => (
            <section className="rounded-lg border border-slate-200 bg-white p-3" key={target.mode}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-ink">{target.label}</h3>
                  <p className="mt-1 break-all font-mono text-xs text-slate-700">{target.relativePath}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                    target.ready ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-900"
                  }`}
                >
                  {target.ready ? "Ready" : "Blocked"}
                </span>
              </div>
              <dl className="mt-3 grid gap-2 text-xs text-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <dt className="font-semibold">Save mode</dt>
                  <dd>{target.mode}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="font-semibold">JSON status</dt>
                  <dd>{target.jsonStatus}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="font-semibold">Suggested filename</dt>
                  <dd className="break-all font-mono">{target.suggestedFilename}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="font-semibold">Learner-facing later</dt>
                  <dd>{target.learnerFacingLater ? "Yes" : "No"}</dd>
                </div>
              </dl>
              {target.unavailableMessage ? (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs font-semibold leading-5 text-amber-950">
                  {target.unavailableMessage}
                </p>
              ) : null}
            </section>
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[400px_1fr]">
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-sm font-bold text-ink">Explicit route save status</p>
              <dl className="mt-3 space-y-2 text-sm text-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <dt className="font-semibold">Unsaved changes</dt>
                  <dd className={lastSavedExportJson === model.exportJson ? "text-green-700" : "text-amber-800"}>
                    {lastSavedExportJson === null
                      ? "Not saved to file yet"
                      : lastSavedExportJson === model.exportJson
                        ? "No"
                        : "Yes"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="font-semibold">Last autosave</dt>
                  <dd>{readableTimestamp(lastAutosavedAt)}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="font-semibold">Last file save</dt>
                  <dd>{readableTimestamp(fileSaveStatus.savedAt)}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="font-semibold">Saved path</dt>
                  <dd className="break-all font-mono text-xs">{fileSaveStatus.relativePath ?? "Not yet"}</dd>
                </div>
              </dl>
              <p
                className={`mt-3 rounded-md border p-3 text-sm leading-6 ${
                  fileSaveStatus.state === "saved"
                    ? "border-green-200 bg-green-50 text-green-900"
                    : fileSaveStatus.state === "error"
                      ? "border-red-200 bg-red-50 text-red-950"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {fileSaveStatus.message}
              </p>
              {fileSaveStatus.missingItems?.length ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-red-900">
                  {fileSaveStatus.missingItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              <button
                className="mt-3 inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={clearAutosaveDraft}
                type="button"
              >
                Clear autosave recovery
              </button>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Autosave recovery is browser-local and temporary. Explicit saves write route JSON to the folder shown above.
              </p>
            </div>

            {model.saveTargets.map((target) => (
              <div className="rounded-lg border border-slate-200 bg-white p-3" key={`checklist-${target.mode}`}>
                <p className="text-sm font-bold text-ink">{target.label} checklist</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {target.checklist.map((item) => (
                    <li className="flex items-center justify-between gap-3" key={item.label}>
                      <span>{item.label}</span>
                      <span className={item.complete ? "font-semibold text-green-700" : "font-semibold text-slate-500"}>
                        {item.complete ? "ready" : "missing"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <textarea
            aria-label="Curated route JSON export"
            className="h-96 w-full rounded-md border border-slate-300 bg-slate-950 p-3 font-mono text-xs text-slate-50"
            readOnly
            value={model.exportJson}
          />
        </div>
      </section>
    );
  }

  function renderDrawerContent() {
    if (drawerTab === "route-state") {
      return renderRouteStateDrawer();
    }

    if (drawerTab === "validation") {
      return renderValidationDrawer();
    }

    if (drawerTab === "metadata") {
      return renderMetadataDrawer();
    }

    if (drawerTab === "export") {
      return renderExportDrawer();
    }

    return renderAuthoringStepsDrawer();
  }

  return (
    <div className="space-y-3" data-testid="training-author-map-first-shell">
      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Dev/admin only</p>
            <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">{model.title}</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
              Map authoring workspace for curated learner routes. {model.devOnlyNotice}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {model.sampleLoaded
                ? `Sample loaded from ${model.sourceMapName} (${model.sourceMapId}) / ${model.sourceExerciseId}.`
                : `No sample route is loaded. Author from scratch on ${model.sourceMapName} (${model.sourceMapId}).`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              href="/dev"
            >
              Back to /dev
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4" data-testid="training-author-map-selector">
        <label className="block text-sm font-bold text-slate-900" htmlFor="training-author-area-select">
          Map / training area
        </label>
        <div className="mt-2 grid gap-3 lg:grid-cols-[minmax(18rem,28rem)_1fr] lg:items-start">
          <select
            className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
            id="training-author-area-select"
            onChange={(event) => handleAreaSelectionChange(event.target.value)}
            value={model.selectedArea?.areaId ?? ""}
          >
            {model.areaOptions.map((option) => (
              <option key={option.areaId} value={option.areaId}>
                {option.label}
              </option>
            ))}
          </select>
          <dl className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="font-semibold text-slate-900">Map id</dt>
              <dd className="font-mono">{model.selectedArea?.mapId ?? "unselected"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Area</dt>
              <dd>{model.selectedArea?.areaName ?? "unselected"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Fixture</dt>
              <dd>{model.selectedArea?.sourceFixture ?? "none"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Status</dt>
              <dd>{model.selectedArea?.status ?? "unsupported"}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          aria-label="Training route authoring toolbar"
          className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white p-3"
          data-testid="training-author-top-toolbar"
          role="toolbar"
        >
          {primaryToolbarActions.map(renderToolbarButton)}
          <details className="shrink-0">
            <summary
              aria-label="More authoring actions"
              className="inline-flex min-h-11 cursor-pointer select-none items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              More
            </summary>
            <div className="mt-2 grid min-w-72 gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
              {moreToolbarActions.map(renderToolbarButton)}
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-950 hover:bg-blue-100"
                onClick={() => {
                  const nextState = createSampleTrainingRouteAuthorState(state.metadata.areaId);

                  setState(nextState);
                  resetTransientAuthoringUi(nextState);
                }}
                type="button"
              >
                Load sample route
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                onClick={() => {
                  const nextState = createEmptyTrainingRouteAuthorState(state.metadata.areaId);

                  setState(nextState);
                  resetTransientAuthoringUi(nextState);
                }}
                type="button"
              >
                New empty route
              </button>
              <label className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                <input
                  checked={showRestrictions}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-200"
                  onChange={(event) => setShowRestrictions(event.target.checked)}
                  type="checkbox"
                />
                Show one-way/restriction cues
              </label>
              <label className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                <input
                  checked={showClickDiagnostics}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-200"
                  onChange={(event) => setShowClickDiagnostics(event.target.checked)}
                  type="checkbox"
                />
                Show click diagnostics
              </label>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                href="/dev/route-runner"
              >
                Open /dev/route-runner
              </Link>
            </div>
          </details>
        </div>
            {mapInteractionMessage ? (
              <p className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950" role="status">
                {mapInteractionMessage}
              </p>
            ) : null}
            {showClickDiagnostics ? (
              <div className="border-b border-slate-200 bg-white px-3 py-3 text-xs text-slate-700">
                <p className="font-bold uppercase tracking-wide text-slate-500">Click diagnostics</p>
                {clickDiagnostic ? (
                  <dl className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <dt className="font-semibold">Client</dt>
                      <dd>{formatDiagnosticPoint(clickDiagnostic.clientPoint)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Local SVG</dt>
                      <dd>{formatDiagnosticPoint(clickDiagnostic.localPoint)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Canonical screen</dt>
                      <dd>{formatDiagnosticPoint(clickDiagnostic.screenPoint)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Map point</dt>
                      <dd>{formatDiagnosticPoint(clickDiagnostic.mapPoint)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Content box</dt>
                      <dd>
                        {`${clickDiagnostic.contentRect.left.toFixed(1)}, ${clickDiagnostic.contentRect.top.toFixed(1)} / ${clickDiagnostic.contentRect.width.toFixed(1)} x ${clickDiagnostic.contentRect.height.toFixed(1)}`}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Snap</dt>
                      <dd>
                        {clickDiagnostic.snap
                          ? `${clickDiagnostic.snap.nodeId} via ${clickDiagnostic.snap.roadName ?? clickDiagnostic.snap.roadId}`
                          : "none"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Road distance</dt>
                      <dd>{clickDiagnostic.snap ? `${clickDiagnostic.snap.roadDistance.toFixed(1)} map units` : "n/a"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Node distance</dt>
                      <dd>{clickDiagnostic.snap ? `${clickDiagnostic.snap.nodeDistance.toFixed(1)} map units` : "n/a"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Message</dt>
                      <dd>{clickDiagnostic.message}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-2">No map click recorded yet.</p>
                )}
              </div>
            ) : null}
            <div className="bg-slate-100" data-testid="training-author-map-workspace">
            <div className="relative overflow-hidden" data-training-author-layer="map-viewport">
              <svg
                aria-label={`Interactive ${model.sourceMapName} training route authoring map`}
                className={`block h-auto w-full touch-none select-none overscroll-contain ${
                  model.activeMode === "pan" ? "cursor-grab" : model.activeMode === "draw-route" ? "cursor-crosshair" : "cursor-pointer"
                }`}
                data-testid="training-route-author-map-viewport"
                data-training-author-layer="interaction"
                height={initialViewportLayout.screenSize.height}
                onAuxClick={handleMapAuxClick}
                onContextMenu={handleMapContextMenu}
                onMouseDown={handleMapMouseDown}
                onPointerCancel={handleMapPointerEnd}
                onPointerDown={handleMapPointerDown}
                onPointerLeave={handleMapPointerEnd}
                onPointerMove={handleMapPointerMove}
                onPointerUp={handleMapPointerEnd}
                preserveAspectRatio="xMidYMid meet"
                ref={mapSvgRef}
                role="img"
                style={{
                  aspectRatio: trainingRouteAuthorViewportAspectRatioCss(initialViewportLayout),
                  backgroundColor: TOPOPASS_STREET_ATLAS_STYLE.canvas.backgroundColor
                }}
                viewBox={`${viewBounds.minX} ${viewBounds.minY} ${boundsWidth(viewBounds)} ${boundsHeight(viewBounds)}`}
                width={initialViewportLayout.screenSize.width}
              >
                <g data-training-author-layer="base-map">
                  <rect
                    fill={TOPOPASS_STREET_ATLAS_STYLE.canvas.backgroundColor}
                    height={boundsHeight(viewBounds)}
                    width={boundsWidth(viewBounds)}
                    x={viewBounds.minX}
                    y={viewBounds.minY}
                  />
                  {roadRenderPasses.map((pass) => {
                    const style = roadStyleForViewport(pass.visual, viewport, currentZoom);
                    const strokeWidth = pass.layer === "casing" ? style.casingWidth : style.strokeWidth;

                    return (
                      <polyline
                        fill="none"
                        key={`${pass.layer}-${pass.visual.roadId}`}
                        opacity={style.alpha ?? 1}
                        points={polylinePoints(pass.visual.points)}
                        stroke={pass.layer === "casing" ? style.casingColor : style.strokeColor}
                        strokeDasharray={pass.layer === "fill" && style.dash ? style.dash.join(" ") : undefined}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={strokeWidth}
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}
                </g>
                <g data-training-author-layer="restriction-overlays">
                  {showRestrictions
                    ? visibleRestrictionMapVisualItems.map((item) =>
                        renderRestrictionSymbol(item, viewport, currentZoom, mapUnitsPerPixel)
                      )
                    : null}
                </g>
                <g data-training-author-layer="route-overlays">
                  {model.mapModel.showShortestRouteComparison
                    ? renderStyledRoutePolyline(
                        "shortest-route-overlay",
                        model.mapModel.shortestRoutePoints,
                        TOPOPASS_STREET_ATLAS_STYLE.routeOverlays.shortestLegalRoute,
                        mapUnitsPerPixel
                      )
                    : null}
                  {renderStyledRoutePolyline(
                    "authored-route-overlay",
                    model.mapModel.authoredRoutePoints,
                    TOPOPASS_STREET_ATLAS_STYLE.routeOverlays.rawRoute,
                    mapUnitsPerPixel
                  )}
                  {renderStyledRoutePolyline(
                    "matched-route-overlay",
                    model.mapModel.matchedRoutePoints,
                    TOPOPASS_STREET_ATLAS_STYLE.routeOverlays.matchedRoute,
                    mapUnitsPerPixel
                  )}
                </g>
                <g data-training-author-layer="map-labels">
                  {labels.map((label) => {
                    const style = labelStyleForSyntheticMapLabel(label, viewport, currentZoom);
                    const fontSizeMatch = /(\d+(?:\.\d+)?)px/.exec(style.font);
                    const fontSize = (fontSizeMatch ? Number(fontSizeMatch[1]) : 11) * mapUnitsPerPixel;
                    const haloWidth = (style.haloWidth ?? 2) * mapUnitsPerPixel;

                    return (
                      <text
                        fill={style.color}
                        fontFamily="Arial, sans-serif"
                        fontSize={fontSize}
                        fontWeight="700"
                        key={label.id}
                        paintOrder="stroke"
                        stroke={style.haloColor}
                        strokeLinejoin="round"
                        strokeWidth={haloWidth}
                        textAnchor="middle"
                        transform={
                          label.kind === "road" && typeof label.angleRadians === "number"
                            ? `rotate(${(label.angleRadians * 180) / Math.PI} ${label.point.x} ${label.point.y})`
                            : undefined
                        }
                        x={label.point.x}
                        y={label.point.y}
                      >
                        {label.text}
                      </text>
                    );
                  })}
                </g>
                <g data-training-author-layer="markers">
                  {model.mapModel.markers.map((marker) => renderAuthorMarker(marker, currentZoom, mapUnitsPerPixel))}
                  {model.mapModel.markers.map((marker) =>
                    renderAuthorMarkerLabel(marker, viewport, currentZoom, mapUnitsPerPixel)
                  )}
                </g>
                {showClickDiagnostics ? renderClickDiagnosticOverlay(clickDiagnostic, mapUnitsPerPixel) : null}
              </svg>
              <div className="pointer-events-none absolute bottom-2 left-2 z-20 max-w-[min(19rem,calc(100%-5.75rem))] sm:bottom-4 sm:left-4 sm:max-w-[min(24rem,calc(100%-7rem))]">
                <details className="pointer-events-auto max-w-full rounded-lg border border-slate-200 bg-white/95 text-xs text-slate-800 shadow-md">
                  <summary className="min-h-11 cursor-pointer select-none px-3 py-3 font-semibold text-slate-900 sm:min-h-0 sm:py-2">
                    Map legend
                  </summary>
                  <div
                    className="grid max-h-48 gap-1 overflow-y-auto border-t border-slate-100 p-2 sm:grid-cols-2"
                    style={{
                      maxHeight: TOPOPASS_STREET_ATLAS_STYLE.learnerOverlays.mobileReadability.legendMaxHeightPx
                    }}
                  >
                    {TRAINING_ROUTE_AUTHOR_MAP_LEGEND_ITEMS.map((item) => (
                      <span
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-800"
                        key={item.id}
                        title={item.description}
                      >
                        {renderAuthorLegendSwatch(item.id)}
                        {item.label}
                      </span>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          </div>
      </section>

      <section
        aria-label="Training route author bottom drawer"
        className="relative z-20 -mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg sm:p-4"
        data-testid="training-author-bottom-drawer"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Route authoring drawer</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{currentStep.label}</p>
          </div>
          <button
            aria-expanded={!drawerCollapsed}
            className="inline-flex min-h-11 w-fit items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            onClick={() => setDrawerCollapsed((collapsed) => !collapsed)}
            type="button"
          >
            {drawerCollapsed ? "Expand drawer" : "Collapse drawer"}
          </button>
        </div>

        {drawerCollapsed ? (
          <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Drawer collapsed. The map remains active for route authoring.
          </p>
        ) : (
          <>
            <div
              aria-label="Training route author drawer tabs"
              className="mt-4 flex gap-4 overflow-x-auto border-b border-slate-200"
              role="tablist"
            >
              {TRAINING_ROUTE_AUTHOR_DRAWER_TABS.map((tab) => (
                <button
                  aria-controls={`training-author-drawer-panel-${tab.id}`}
                  aria-selected={drawerTab === tab.id}
                  className={`min-h-11 shrink-0 border-b-2 px-1 py-3 text-sm font-semibold ${drawerTabClass(
                    drawerTab === tab.id
                  )}`}
                  id={`training-author-drawer-tab-${tab.id}`}
                  key={tab.id}
                  onClick={() => setDrawerTab(tab.id)}
                  role="tab"
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div
              aria-labelledby={`training-author-drawer-tab-${drawerTab}`}
              className="pt-4"
              id={`training-author-drawer-panel-${drawerTab}`}
              role="tabpanel"
            >
              {renderDrawerContent()}
            </div>
          </>
        )}
      </section>

      <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="training-author-advanced-diagnostics">
        <summary className="cursor-pointer text-sm font-bold text-slate-800">Advanced diagnostics</summary>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Full Route Runner diagnostics, manual inputs, attempt review, adaptive practice diagnostics, and OSM QA stay in
          `/dev/route-runner` so this page remains focused on curated route authoring.
        </p>
        <Link
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          href="/dev/route-runner"
        >
          Open /dev/route-runner
        </Link>
      </details>
    </div>
  );
}
