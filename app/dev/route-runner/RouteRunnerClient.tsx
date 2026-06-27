"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import {
  appendDrawnRoutePoint,
  boundingBoxForPoints,
  createDrawnRouteTrace,
  expandBoundingBox,
  mapToScreenPoint,
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  runRouteExercise,
  screenToMapPoint,
  snapDrawnRouteToRoads,
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

const CANVAS_WIDTH = 820;
const CANVAS_HEIGHT = 660;
const SNAP_TOLERANCE = 24;

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

function roadEndpoints(road: MapRoad): { from?: MapNode; to?: MapNode } {
  return {
    from: marloweDistrictMap.nodes.find((node) => node.id === road.fromNodeId),
    to: marloweDistrictMap.nodes.find((node) => node.id === road.toNodeId)
  };
}

function drawRouteCanvas(input: {
  canvas: HTMLCanvasElement;
  viewport: ScreenMapViewport;
  selectedExercise?: RouteExercise;
  trace: DrawnRouteTrace;
  snapPreview: SnappedRouteTraceResult;
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

  if (input.selectedExercise) {
    input.selectedExercise.stops.forEach((stop, index) => {
      const node = resolveStopNode(stop);

      if (!node) {
        return;
      }

      const point = mapToScreenPoint(node, input.viewport);

      context.fillStyle = index === 0 ? "#2563eb" : "#f97316";
      context.beginPath();
      context.arc(point.x, point.y, 8, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#ffffff";
      context.font = "bold 10px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String(index + 1), point.x, point.y + 0.5);
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
  const snapPreview = useMemo(
    () =>
      snapDrawnRouteToRoads({
        map: marloweDistrictMap,
        points: drawnTrace.points,
        snapTolerance: SNAP_TOLERANCE
      }),
    [drawnTrace.points]
  );
  const extraDistanceMeters = result
    ? result.score.userRouteDistanceMeters - result.score.shortestLegalRouteDistanceMeters
    : 0;
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
      snapPreview
    });
  }, [drawnTrace, selectedExercise, snapPreview, viewport]);

  function pointerEventToMapPoint(event: PointerEvent<HTMLCanvasElement>): Vec2 {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const screenPoint = {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT
    };

    return screenToMapPoint(screenPoint, viewport);
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDrawing(true);
    setDrawnTrace(createDrawnRouteTrace([pointerEventToMapPoint(event)]));
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) {
      return;
    }

    const point = pointerEventToMapPoint(event);
    setDrawnTrace((currentTrace) => appendDrawnRoutePoint(currentTrace, point, 3));
  }

  function handlePointerEnd(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) {
      return;
    }

    setDrawnTrace((currentTrace) => appendDrawnRoutePoint(currentTrace, pointerEventToMapPoint(event), 3));
    setIsDrawing(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
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
              captures raw drawn route traces and previews road snapping for Stage 60-62 development; drawn traces are
              not scored yet.
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
              onChange={(event) => {
                setExerciseId(event.target.value);
                setResult(null);
                setError(null);
              }}
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
                  candidates only and are not scored.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawnTrace(createDrawnRouteTrace())}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                Clear drawing
              </button>
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

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Raw points</p>
                <p className="mt-1 text-lg font-bold text-slate-950">{drawnTrace.points.length}</p>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Snapped roads</p>
                <p className="mt-1 text-lg font-bold text-slate-950">{snapPreviewRoadIds.length}</p>
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
