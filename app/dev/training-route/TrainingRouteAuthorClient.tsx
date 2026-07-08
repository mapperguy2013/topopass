"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type ChangeEvent, type PointerEvent, type WheelEvent } from "react";
import {
  buildRoadRenderPasses,
  buildSyntheticMapLabels,
  buildSyntheticRoadVisuals,
  filterSyntheticMapLabelsForViewport,
  labelStyleForSyntheticMapLabel,
  roadStyleForViewport
} from "../route-runner/syntheticStreetMapRenderer";
import {
  getRouteRunnerMapViewportBounds,
  type RouteRunnerMapBounds
} from "../route-runner/routeRunnerMapOptionUtils";
import {
  addTrainingRouteAuthorCheckpoint,
  appendTrainingRouteAuthorStrokePoint,
  buildTrainingRouteAuthorModel,
  clearTrainingRouteAuthorCheckpoints,
  clearTrainingRouteAuthorRoute,
  compareTrainingRouteAuthorShortestRoute,
  createEmptyTrainingRouteAuthorState,
  createSampleTrainingRouteAuthorState,
  finishTrainingRouteAuthorStroke,
  getTrainingRouteAuthorMap,
  removeLastTrainingRouteAuthorCheckpoint,
  resolveNearestTrainingRouteAuthorNode,
  setTrainingRouteAuthorDestination,
  setTrainingRouteAuthorMode,
  setTrainingRouteAuthorStart,
  startTrainingRouteAuthorStroke,
  TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT,
  TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH,
  undoTrainingRouteAuthorAction,
  updateTrainingRouteAuthorMetadataField,
  validateTrainingRouteAuthorState,
  type CuratedShortestRouteComparisonDetail,
  type TrainingRouteAuthorField,
  type TrainingRouteAuthorMode,
  type TrainingRouteAuthorStatusItem,
  type TrainingRouteAuthorToolbarAction,
  type TrainingRouteAuthorState
} from "./trainingRouteAuthor";
import type { Vec2 } from "../../../lib/map-engine/index.ts";

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
  | null;

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
  const dragStateRef = useRef<DragState>(null);
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
  const markerRadius = model.mapModel.markerRadiusPixels * mapUnitsPerPixel;

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

  function handleMapPointerDown(event: PointerEvent<SVGSVGElement>) {
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
      event.preventDefault();
      dragStateRef.current = {
        kind: "draw",
        pointerId: event.pointerId
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setState((currentState) => startTrainingRouteAuthorStroke(currentState, point));
      return;
    }

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

    event.preventDefault();
    setState((currentState) => appendTrainingRouteAuthorStrokePoint(currentState, point));
  }

  function handleMapPointerEnd(event: PointerEvent<SVGSVGElement>) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (dragState.kind !== "draw") {
      return;
    }

    const point = pointFromPointer(event.currentTarget, event.clientX, event.clientY) ?? undefined;

    setState((currentState) => finishTrainingRouteAuthorStroke(currentState, point));
  }

  function handleMapWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault();

    const zoomFactor = event.deltaY > 0 ? 1.15 : 0.87;
    const pointerPoint = pointFromPointer(event.currentTarget, event.clientX, event.clientY);
    const center = pointerPoint ?? {
      x: (viewBounds.minX + viewBounds.maxX) / 2,
      y: (viewBounds.minY + viewBounds.maxY) / 2
    };
    const nextWidth = Math.min(boundsWidth(initialBounds) * 2.4, Math.max(boundsWidth(initialBounds) * 0.08, boundsWidth(viewBounds) * zoomFactor));
    const nextHeight = nextWidth * (TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT / TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH);

    setViewBounds({
      minX: center.x - nextWidth / 2,
      maxX: center.x + nextWidth / 2,
      minY: center.y - nextHeight / 2,
      maxY: center.y + nextHeight / 2
    });
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
              className={`block h-[420px] w-full touch-none select-none bg-[#eef6f8] sm:h-[560px] ${
                model.activeMode === "pan" ? "cursor-grab" : model.activeMode === "draw-route" ? "cursor-crosshair" : "cursor-pointer"
              }`}
              onPointerCancel={handleMapPointerEnd}
              onPointerDown={handleMapPointerDown}
              onPointerLeave={handleMapPointerEnd}
              onPointerMove={handleMapPointerMove}
              onPointerUp={handleMapPointerEnd}
              onWheel={handleMapWheel}
              role="img"
              viewBox={`${viewBounds.minX} ${viewBounds.minY} ${boundsWidth(viewBounds)} ${boundsHeight(viewBounds)}`}
            >
              <rect fill="#eef6f8" height={boundsHeight(viewBounds)} width={boundsWidth(viewBounds)} x={viewBounds.minX} y={viewBounds.minY} />
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
                ? roadVisuals.filter((visual) => visual.isOneWay || visual.hasNoEntryRestriction || visual.hasRoadClosedRestriction).map((visual) => (
                    <text
                      fill={visual.hasNoEntryRestriction || visual.hasRoadClosedRestriction ? "#b91c1c" : "#0369a1"}
                      fontSize={12 * mapUnitsPerPixel}
                      fontWeight="800"
                      key={`restriction-${visual.roadId}`}
                      textAnchor="middle"
                      transform={`rotate(${(visual.labelAngleRadians * 180) / Math.PI} ${visual.midpoint.x} ${visual.midpoint.y})`}
                      x={visual.midpoint.x}
                      y={visual.midpoint.y - 6 * mapUnitsPerPixel}
                    >
                      {visual.hasNoEntryRestriction || visual.hasRoadClosedRestriction ? "!" : ">"}
                    </text>
                  ))
                : null}
              {model.mapModel.showShortestRouteComparison && model.mapModel.shortestRoutePoints.length > 1 ? (
                <polyline
                  fill="none"
                  points={polylinePoints(model.mapModel.shortestRoutePoints)}
                  stroke="#f59e0b"
                  strokeDasharray="10 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="5"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
              {model.mapModel.authoredRoutePoints.length > 1 ? (
                <polyline
                  fill="none"
                  opacity="0.74"
                  points={polylinePoints(model.mapModel.authoredRoutePoints)}
                  stroke="#f97316"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
              {model.mapModel.matchedRoutePoints.length > 1 ? (
                <polyline
                  fill="none"
                  points={polylinePoints(model.mapModel.matchedRoutePoints)}
                  stroke="#2563eb"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="6"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
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
              {model.mapModel.markers.map((marker) => (
                <g key={marker.id}>
                  <circle
                    cx={marker.point.x}
                    cy={marker.point.y}
                    fill={
                      marker.kind === "start" ? "#16a34a" : marker.kind === "destination" ? "#dc2626" : "#7c3aed"
                    }
                    r={markerRadius}
                    stroke="#ffffff"
                    strokeWidth={3 * mapUnitsPerPixel}
                  />
                  <text
                    fill="#ffffff"
                    fontSize={(marker.kind === "checkpoint" ? 10 : 6.5) * mapUnitsPerPixel}
                    fontWeight="800"
                    textAnchor="middle"
                    x={marker.point.x}
                    y={marker.point.y + 2.5 * mapUnitsPerPixel}
                  >
                    {marker.label}
                  </text>
                </g>
              ))}
            </svg>
            <div className="flex flex-wrap gap-3 border-t border-slate-200 bg-white p-3 text-xs font-semibold text-slate-700">
              <span className="inline-flex items-center gap-2"><span className="size-3 rounded-full bg-orange-500" />Raw drawing</span>
              <span className="inline-flex items-center gap-2"><span className="size-3 rounded-full bg-blue-600" />Matched route</span>
              <span className="inline-flex items-center gap-2"><span className="size-3 rounded-full bg-amber-500" />Shortest overlay</span>
              <span className="inline-flex items-center gap-2"><span className="size-3 rounded-full bg-green-600" />START</span>
              <span className="inline-flex items-center gap-2"><span className="size-3 rounded-full bg-red-600" />DEST</span>
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
              Export comes last and uses only the currently authored route data.
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              Suggested filename: <span className="font-mono">{model.exportReadiness.suggestedFilename}</span>
            </p>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:bg-slate-300 disabled:text-slate-600"
            disabled={!model.exportReadiness.ready}
            onClick={copyExportJson}
            type="button"
          >
            Copy JSON
          </button>
        </div>
        {copyStatus ? <p className="mt-3 text-sm font-semibold text-slate-700">{copyStatus}</p> : null}
        <div className="mt-4 grid gap-4 lg:grid-cols-[360px_1fr]">
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
