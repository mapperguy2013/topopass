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
  buildTrainingRouteAuthorModel,
  canContinueTrainingRouteAuthorDrawPointer,
  canStartTrainingRouteAuthorPointer,
  clearTrainingRouteAuthorCheckpoints,
  clearTrainingRouteAuthorRoute,
  compareTrainingRouteAuthorShortestRoute,
  createEmptyTrainingRouteAuthorState,
  createSampleTrainingRouteAuthorState,
  dominantTrainingRouteAuthorWheelDelta,
  finishTrainingRouteAuthorStroke,
  getTrainingRouteAuthorMap,
  removeLastTrainingRouteAuthorCheckpoint,
  resolveNearestTrainingRouteAuthorNode,
  setTrainingRouteAuthorDestination,
  setTrainingRouteAuthorMode,
  setTrainingRouteAuthorStart,
  shouldIsolateTrainingRouteAuthorMapWheel,
  shouldIsolateTrainingRouteAuthorPointer,
  shouldPreventTrainingRouteAuthorAuxiliaryClick,
  startTrainingRouteAuthorStroke,
  TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT,
  TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH,
  trainingRouteAuthorWheelZoomFactor,
  undoTrainingRouteAuthorAction,
  updateTrainingRouteAuthorMetadataField,
  validateTrainingRouteAuthorState,
  zoomTrainingRouteAuthorBoundsAroundScreenPoint,
  type CuratedShortestRouteComparisonDetail,
  type TrainingRouteAuthorDraftSaveReadiness,
  type TrainingRouteAuthorField,
  type TrainingRouteAuthorMode,
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
  relativePath?: string;
  savedAt?: string;
  missingItems?: string[];
};

type TrainingRouteAuthorAutosavePayload = {
  state: TrainingRouteAuthorState;
  savedAt: string;
};

type CuratedTrainingRouteDraftSaveResponse = {
  ok?: boolean;
  message?: string;
  relativePath?: string;
  savedAt?: string;
  errors?: string[];
};

const TRAINING_ROUTE_AUTHOR_AUTOSAVE_KEY = "topopass.devTrainingRouteAuthor.autosave.v1";
const TRAINING_ROUTE_DRAFT_SAVE_ENDPOINT = "/api/dev/training-routes/drafts";

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

function readinessMissingItems(readiness: TrainingRouteAuthorDraftSaveReadiness): string[] {
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
  const map = useMemo(() => getTrainingRouteAuthorMap(), []);
  const initialBounds = useMemo(
    () => getRouteRunnerMapViewportBounds(map, TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH, TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT),
    [map]
  );
  const [state, setState] = useState<TrainingRouteAuthorState>(() => createEmptyTrainingRouteAuthorState());
  const [viewBounds, setViewBounds] = useState<RouteRunnerMapBounds>(initialBounds);
  const [showRestrictions, setShowRestrictions] = useState(true);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [fileSaveStatus, setFileSaveStatus] = useState<TrainingRouteAuthorFileSaveStatus>({
    state: "idle",
    message: "No file save has run in this session."
  });
  const [lastAutosavedAt, setLastAutosavedAt] = useState<string | null>(null);
  const [autosaveNotice, setAutosaveNotice] = useState<string | null>(null);
  const [lastSavedExportJson, setLastSavedExportJson] = useState<string | null>(null);
  const dragStateRef = useRef<DragState>(null);
  const mapSvgRef = useRef<SVGSVGElement | null>(null);
  const model = useMemo(() => buildTrainingRouteAuthorModel({ state }), [state]);
  const currentStep = model.authoringSteps.find((step) => step.current) ?? model.authoringSteps[0];
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
      width: TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH,
      height: TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT,
      mapBounds: viewBounds
    }),
    [viewBounds]
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
  const mapUnitsPerPixel = boundsWidth(viewBounds) / TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH;

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
          ? {
              width: TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH,
              height: TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT
            }
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
  }, [initialBounds, viewBounds]);

  function pointFromPointer(
    element: SVGSVGElement,
    clientX: number,
    clientY: number
  ): Vec2 | null {
    const rect = element.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      return null;
    }

    return {
      x: viewBounds.minX + ((clientX - rect.left) / rect.width) * boundsWidth(viewBounds),
      y: viewBounds.minY + ((clientY - rect.top) / rect.height) * boundsHeight(viewBounds)
    };
  }

  function panBy(deltaX: number, deltaY: number) {
    const xScale = boundsWidth(viewBounds) / TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH;
    const yScale = boundsHeight(viewBounds) / TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT;

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

    if (!canStartTrainingRouteAuthorPointer(pointerButtonInput(event))) {
      dragStateRef.current = null;
      return;
    }

    const point = pointFromPointer(event.currentTarget, event.clientX, event.clientY);

    if (!point) {
      return;
    }

    if (state.activeMode === "pan") {
      dragStateRef.current = {
        kind: "pan",
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
      return;
    }

    if (state.activeMode === "draw-route") {
      dragStateRef.current = {
        kind: "draw",
        pointerId: event.pointerId
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setState((currentState) => startTrainingRouteAuthorStroke(currentState, point));
      return;
    }

    dragStateRef.current = {
      kind: "select",
      pointerId: event.pointerId
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const node = resolveNearestTrainingRouteAuthorNode(point);

    if (!node) {
      return;
    }

    if (state.activeMode === "set-start") {
      setState((currentState) => setTrainingRouteAuthorStart(currentState, node.id));
    } else if (state.activeMode === "set-destination") {
      setState((currentState) => setTrainingRouteAuthorDestination(currentState, node.id));
    } else if (state.activeMode === "add-checkpoint") {
      setState((currentState) => addTrainingRouteAuthorCheckpoint(currentState, node.id));
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

    if (!canContinueTrainingRouteAuthorDrawPointer(pointerButtonInput(event))) {
      return;
    }

    if (dragState.kind === "pan") {
      panBy(event.clientX - dragState.clientX, event.clientY - dragState.clientY);
      dragStateRef.current = {
        ...dragState,
        clientX: event.clientX,
        clientY: event.clientY
      };
      return;
    }

    const point = pointFromPointer(event.currentTarget, event.clientX, event.clientY);

    if (!point) {
      return;
    }

    setState((currentState) => appendTrainingRouteAuthorStrokePoint(currentState, point));
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

    const point = pointFromPointer(event.currentTarget, event.clientX, event.clientY) ?? undefined;

    setState((currentState) => finishTrainingRouteAuthorStroke(currentState, point));
  }

  function handleToolbarAction(action: TrainingRouteAuthorToolbarAction) {
    if (action.disabled) {
      return;
    }

    setCopyStatus(null);

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
    } else if (action.id === "compare-shortest-route") {
      setState((currentState) => compareTrainingRouteAuthorShortestRoute(currentState));
    }
  }

  function handleMetadataChange(field: TrainingRouteAuthorField, event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setState((currentState) => updateTrainingRouteAuthorMetadataField(currentState, field.id, event.target.value));
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

  async function saveTrainingRouteDraft(saveMode: "draft" | "validated-draft") {
    const readiness = saveMode === "validated-draft" ? model.validatedDraftSaveReadiness : model.draftSaveReadiness;
    const missingItems = readinessMissingItems(readiness);

    if (!readiness.ready) {
      setFileSaveStatus({
        state: "error",
        message:
          saveMode === "validated-draft"
            ? "Validated draft cannot be saved until the route, validation, and comparison checks are complete."
            : "Draft cannot be saved until the required route data exists.",
        missingItems
      });
      return;
    }

    setFileSaveStatus({
      state: "saving",
      message: saveMode === "validated-draft" ? "Saving validated draft..." : "Saving draft..."
    });

    try {
      const response = await fetch(TRAINING_ROUTE_DRAFT_SAVE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          saveMode,
          route: model.exportData
        })
      });
      const responseBody = (await response.json().catch(() => null)) as CuratedTrainingRouteDraftSaveResponse | null;

      if (!response.ok || !responseBody?.ok) {
        setFileSaveStatus({
          state: "error",
          message: responseBody?.message ?? "Training route draft could not be saved.",
          missingItems: responseBody?.errors
        });
        return;
      }

      setFileSaveStatus({
        state: "saved",
        message: responseBody.message ?? "Training route draft saved.",
        relativePath: responseBody.relativePath,
        savedAt: responseBody.savedAt
      });
      setLastSavedExportJson(model.exportJson);
    } catch {
      setFileSaveStatus({
        state: "error",
        message: "Training route draft could not be saved because the dev save endpoint was unavailable."
      });
    }
  }

  function clearAutosaveDraft() {
    try {
      window.localStorage.removeItem(TRAINING_ROUTE_AUTHOR_AUTOSAVE_KEY);
      setAutosaveNotice("Autosave recovery draft cleared.");
      setLastAutosavedAt(null);
    } catch {
      setAutosaveNotice("Autosave recovery could not be cleared in this browser session.");
    }
  }

  function renderField(field: TrainingRouteAuthorField) {
    const baseClass = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900";

    if (field.input === "textarea") {
      return (
        <textarea
          className={`${baseClass} min-h-24`}
          id={field.id}
          name={field.id}
          onChange={(event) => handleMetadataChange(field, event)}
          value={fieldValueForInput(field)}
        />
      );
    }

    if (field.input === "select") {
      return (
        <select
          className={baseClass}
          id={field.id}
          name={field.id}
          onChange={(event) => handleMetadataChange(field, event)}
          value={fieldValueForInput(field)}
        >
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        className={baseClass}
        id={field.id}
        name={field.id}
        onChange={(event) => handleMetadataChange(field, event)}
        value={fieldValueForInput(field)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Dev/admin only</p>
            <h1 className="mt-2 text-3xl font-bold text-ink">{model.title}</h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">{model.devOnlyNotice}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {model.sampleLoaded
                ? `Sample loaded from ${model.sourceMapName} (${model.sourceMapId}) / ${model.sourceExerciseId}.`
                : `No sample route is loaded. Author from scratch on ${model.sourceMapName} (${model.sourceMapId}).`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-950 hover:bg-blue-100"
              onClick={() => {
                setState(createSampleTrainingRouteAuthorState());
                setCopyStatus(null);
              }}
              type="button"
            >
              Load sample route
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => {
                setState(createEmptyTrainingRouteAuthorState());
                setCopyStatus(null);
              }}
              type="button"
            >
              New empty route
            </button>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              href="/dev"
            >
              Back to /dev
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-white p-3 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-road">Map authoring workspace</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">Author the training route first</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{currentStep.instruction}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{model.routeMatchMessage}</p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            href="/dev/route-runner"
          >
            Open full Route Runner diagnostics
          </Link>
        </div>

        <div aria-label="Training route authoring toolbar" className="mt-4 flex flex-wrap gap-2" role="toolbar">
          {model.toolbarActions.map((action) => (
            <button
              aria-pressed={action.pressed}
              className={`min-h-11 rounded-md border px-3 py-2 text-sm font-semibold ${
                action.pressed
                  ? "border-blue-700 bg-blue-700 text-white"
                  : action.primary
                    ? "border-road bg-road text-white disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-500"
                    : "border-slate-300 bg-white text-slate-700 disabled:bg-slate-100 disabled:text-slate-500"
              }`}
              disabled={action.disabled}
              key={action.id}
              onClick={() => handleToolbarAction(action)}
              title={readableActionTitle(action)}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <div className="flex flex-wrap gap-3 border-b border-slate-200 bg-white p-3 text-sm text-slate-700">
              <label className="inline-flex items-center gap-2 font-semibold">
                <input
                  checked={showRestrictions}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-200"
                  onChange={(event) => setShowRestrictions(event.target.checked)}
                  type="checkbox"
                />
                Show one-way/restriction cues
              </label>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold">
                Active mode: {model.activeMode.replaceAll("-", " ")}
              </span>
            </div>
            <svg
              aria-label="Interactive Real London training route authoring map"
              className={`block h-[420px] w-full touch-none select-none overscroll-contain sm:h-[560px] ${
                model.activeMode === "pan" ? "cursor-grab" : model.activeMode === "draw-route" ? "cursor-crosshair" : "cursor-pointer"
              }`}
              onAuxClick={handleMapAuxClick}
              onContextMenu={handleMapContextMenu}
              onMouseDown={handleMapMouseDown}
              onPointerCancel={handleMapPointerEnd}
              onPointerDown={handleMapPointerDown}
              onPointerLeave={handleMapPointerEnd}
              onPointerMove={handleMapPointerMove}
              onPointerUp={handleMapPointerEnd}
              ref={mapSvgRef}
              role="img"
              style={{ backgroundColor: TOPOPASS_STREET_ATLAS_STYLE.canvas.backgroundColor }}
              viewBox={`${viewBounds.minX} ${viewBounds.minY} ${boundsWidth(viewBounds)} ${boundsHeight(viewBounds)}`}
            >
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
              {showRestrictions
                ? visibleRestrictionMapVisualItems.map((item) =>
                    renderRestrictionSymbol(item, viewport, currentZoom, mapUnitsPerPixel)
                  )
                : null}
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
              {model.mapModel.markers.map((marker) => renderAuthorMarker(marker, currentZoom, mapUnitsPerPixel))}
              {model.mapModel.markers.map((marker) =>
                renderAuthorMarkerLabel(marker, viewport, currentZoom, mapUnitsPerPixel)
              )}
            </svg>
            <div className="flex flex-wrap gap-3 border-t border-slate-200 bg-white p-3 text-xs font-semibold text-slate-700">
              <span className="inline-flex items-center gap-2"><span className="size-3 rounded-full bg-orange-500" />Raw drawing</span>
              <span className="inline-flex items-center gap-2"><span className="size-3 rounded-full bg-purple-600" />Matched route</span>
              <span className="inline-flex items-center gap-2"><span className="size-3 rounded-full bg-sky-600" />Shortest overlay</span>
              <span className="inline-flex items-center gap-2"><span className="h-0.5 w-5 rounded-full bg-blue-700" />One-way arrows</span>
              <span className="inline-flex items-center gap-2"><span className="size-3 rounded-full bg-green-600" />START</span>
              <span className="inline-flex items-center gap-2"><span className="size-3 rounded-full bg-red-600" />DESTINATION</span>
              <span className="inline-flex items-center gap-2"><span className="size-3 rounded-full bg-purple-600" />Checkpoint</span>
            </div>
          </div>

          <aside className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-lg font-bold text-ink">Authoring steps</h3>
              <ol className="mt-3 space-y-2">
                {model.authoringSteps.map((step) => (
                  <li
                    className={`rounded-lg border p-3 text-sm ${
                      step.current ? "border-road bg-blue-50 text-slate-900" : "border-slate-200 text-slate-700"
                    }`}
                    key={step.index}
                  >
                    <span className="font-bold">Step {step.index}: {step.label}</span>
                    <span className="mt-1 block text-xs">
                      {step.optional ? step.instruction : step.complete ? "Complete" : step.instruction}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-lg font-bold text-ink">Route state summary</h3>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {model.routeStatusItems.map((item) => (
                  <div className={`rounded-lg border p-3 ${statusClass(item.state)}`} key={item.label}>
                    <dt className="text-xs font-bold uppercase tracking-wide">{item.label}</dt>
                    <dd className="mt-1 text-sm font-semibold">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </aside>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Route metadata</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Complete metadata after the route shape is clear. These fields update the export JSON live.
        </p>
        <form className="mt-4 grid gap-4 md:grid-cols-2">
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

      <section className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-ink">Validation panel</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {model.validationRunStatus === "not-run"
                  ? "Validation has not been run for the current authored route."
                  : model.validation.explanation}
              </p>
            </div>
            <span
              className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                model.validationRunStatus === "not-run"
                  ? "border-slate-200 bg-slate-50 text-slate-700"
                  : model.validation.valid
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {model.validationRunStatus}
            </span>
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
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Blocking errors</p>
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
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Advisory warnings</p>
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
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Shortest route comparison</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Run this after the authored route is matched. Unknown results are advisory when map data cannot prove a shortest legal route.
          </p>
          <div className="mt-4 grid gap-3">
            {renderComparison("Direct shortest route", model.shortestRouteComparison.directComparison)}
            {renderComparison(
              "Checkpoint-constrained shortest route",
              model.shortestRouteComparison.checkpointConstrainedComparison
            )}
          </div>
        </section>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">Export panel</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Save dev drafts under data/training-routes/drafts or export the current JSON for review.
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              Suggested filename: <span className="font-mono">{model.exportReadiness.suggestedFilename}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-950 shadow-sm disabled:bg-slate-100 disabled:text-slate-500"
              disabled={fileSaveStatus.state === "saving"}
              onClick={() => void saveTrainingRouteDraft("draft")}
              type="button"
            >
              Save draft
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-950 shadow-sm disabled:bg-slate-100 disabled:text-slate-500"
              disabled={fileSaveStatus.state === "saving"}
              onClick={() => void saveTrainingRouteDraft("validated-draft")}
              type="button"
            >
              Save validated draft
            </button>
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
        {autosaveNotice ? <p className="mt-3 text-sm font-semibold text-slate-700">{autosaveNotice}</p> : null}
        <div className="mt-4 grid gap-4 lg:grid-cols-[400px_1fr]">
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-bold text-ink">Save status</p>
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
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-bold text-ink">Draft save readiness</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {model.draftSaveReadiness.checklist.map((item) => (
                  <li className="flex items-center justify-between gap-3" key={item.label}>
                    <span>{item.label}</span>
                    <span className={item.complete ? "font-semibold text-green-700" : "font-semibold text-slate-500"}>
                      {item.complete ? "ready" : "missing"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-bold text-ink">Validated draft readiness</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {model.validatedDraftSaveReadiness.checklist.map((item) => (
                  <li className="flex items-center justify-between gap-3" key={item.label}>
                    <span>{item.label}</span>
                    <span className={item.complete ? "font-semibold text-green-700" : "font-semibold text-slate-500"}>
                      {item.complete ? "ready" : "missing"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-bold text-ink">Export readiness checklist</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {model.exportReadiness.checklist.map((item) => (
                  <li className="flex items-center justify-between gap-3" key={item.label}>
                    <span>{item.label}</span>
                    <span className={item.complete ? "font-semibold text-green-700" : "font-semibold text-slate-500"}>
                      {item.complete ? "ready" : "missing"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <textarea
            aria-label="Curated route JSON export"
            className="h-96 w-full rounded-md border border-slate-300 bg-slate-950 p-3 font-mono text-xs text-slate-50"
            readOnly
            value={model.exportJson}
          />
        </div>
      </section>

      <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
