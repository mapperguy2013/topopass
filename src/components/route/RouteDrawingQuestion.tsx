"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { scoreDrawnRoute, type RouteScoreResult } from "@/lib/routeScoring";
import type { RouteGraph, RouteMapPoint } from "@/src/data/maps/routeTypes";
import type { RouteQuestion } from "@/src/data/routeQuestions";

type RouteDrawingQuestionProps = {
  graph: RouteGraph;
  question: RouteQuestion;
  mapImagePath: string;
  acceptedRoutePoints: RouteMapPoint[];
};

type MapViewBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PanGesture = {
  pointerId: number;
  clientX: number;
  clientY: number;
  viewBox: MapViewBox;
};

const MAX_ZOOM = 4;

function pointsToPath(points: RouteMapPoint[]) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

export function RouteDrawingQuestion({
  graph,
  question,
  mapImagePath,
  acceptedRoutePoints
}: RouteDrawingQuestionProps) {
  const overlayRef = useRef<SVGSVGElement | null>(null);
  const drawingPointerId = useRef<number | null>(null);
  const panGesture = useRef<PanGesture | null>(null);
  const [routePoints, setRoutePoints] = useState<RouteMapPoint[]>([]);
  const [feedback, setFeedback] = useState<RouteScoreResult | null>(null);
  const [showAcceptedRoute, setShowAcceptedRoute] = useState(false);
  const [interactionMode, setInteractionMode] = useState<"draw" | "pan">(
    "draw"
  );
  const [viewBox, setViewBox] = useState<MapViewBox>({
    x: 0,
    y: 0,
    width: graph.mapWidth,
    height: graph.mapHeight
  });
  const hasDrawnRoute = routePoints.length > 1;
  const zoomLevel = graph.mapWidth / viewBox.width;

  function toMapPoint(event: ReactPointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();

    return {
      x: Math.max(
        0,
        Math.min(
          graph.mapWidth,
          viewBox.x +
            ((event.clientX - bounds.left) / bounds.width) * viewBox.width
        )
      ),
      y: Math.max(
        0,
        Math.min(
          graph.mapHeight,
          viewBox.y +
            ((event.clientY - bounds.top) / bounds.height) * viewBox.height
        )
      )
    };
  }

  function startDrawing(event: ReactPointerEvent<SVGSVGElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    if (interactionMode === "pan") {
      panGesture.current = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        viewBox
      };
      return;
    }

    drawingPointerId.current = event.pointerId;
    setRoutePoints([toMapPoint(event)]);
    setFeedback(null);
  }

  function continueDrawing(event: ReactPointerEvent<SVGSVGElement>) {
    if (panGesture.current?.pointerId === event.pointerId) {
      event.preventDefault();
      const bounds = event.currentTarget.getBoundingClientRect();
      const gesture = panGesture.current;
      const nextX =
        gesture.viewBox.x -
        ((event.clientX - gesture.clientX) / bounds.width) *
          gesture.viewBox.width;
      const nextY =
        gesture.viewBox.y -
        ((event.clientY - gesture.clientY) / bounds.height) *
          gesture.viewBox.height;

      setViewBox({
        ...gesture.viewBox,
        x: Math.min(
          graph.mapWidth - gesture.viewBox.width,
          Math.max(0, nextX)
        ),
        y: Math.min(
          graph.mapHeight - gesture.viewBox.height,
          Math.max(0, nextY)
        )
      });
      return;
    }

    if (drawingPointerId.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const nextPoint = toMapPoint(event);

    setRoutePoints((points) => {
      const previousPoint = points[points.length - 1];

      if (
        previousPoint &&
        Math.hypot(nextPoint.x - previousPoint.x, nextPoint.y - previousPoint.y) < 4
      ) {
        return points;
      }

      return [...points, nextPoint];
    });
  }

  function stopDrawing(event: ReactPointerEvent<SVGSVGElement>) {
    if (
      drawingPointerId.current !== event.pointerId &&
      panGesture.current?.pointerId !== event.pointerId
    ) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drawingPointerId.current = null;
    panGesture.current = null;
  }

  function clearRoute() {
    drawingPointerId.current = null;
    panGesture.current = null;
    setRoutePoints([]);
    setFeedback(null);
  }

  function changeZoom(multiplier: number) {
    setViewBox((currentView) => {
      const minimumWidth = graph.mapWidth / MAX_ZOOM;
      const minimumHeight = graph.mapHeight / MAX_ZOOM;
      const nextWidth = Math.min(
        graph.mapWidth,
        Math.max(minimumWidth, currentView.width * multiplier)
      );
      const nextHeight = Math.min(
        graph.mapHeight,
        Math.max(minimumHeight, currentView.height * multiplier)
      );
      const centreX = currentView.x + currentView.width / 2;
      const centreY = currentView.y + currentView.height / 2;

      return {
        x: Math.min(
          graph.mapWidth - nextWidth,
          Math.max(0, centreX - nextWidth / 2)
        ),
        y: Math.min(
          graph.mapHeight - nextHeight,
          Math.max(0, centreY - nextHeight / 2)
        ),
        width: nextWidth,
        height: nextHeight
      };
    });
  }

  function resetView() {
    setViewBox({
      x: 0,
      y: 0,
      width: graph.mapWidth,
      height: graph.mapHeight
    });
  }

  function submitRoute() {
    if (!hasDrawnRoute) {
      return;
    }

    setFeedback(scoreDrawnRoute(routePoints, acceptedRoutePoints));
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-300 bg-white p-3 shadow-soft sm:p-5">
        <div className="mb-4 border-b border-slate-200 pb-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-road">
            Route drawing question
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink sm:text-2xl">
            {question.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {question.prompt}
          </p>
        </div>

        <div className="rounded-md border border-slate-400 bg-[#f6f1df] p-1.5 shadow-inner sm:p-2">
          <div
            className="relative w-full select-none overflow-hidden rounded-sm bg-[#f6f1df]"
            aria-label={`Route drawing map for ${question.title}`}
            style={{ aspectRatio: `${graph.mapWidth} / ${graph.mapHeight}` }}
          >
            <div className="absolute left-2 top-2 z-10 flex overflow-hidden rounded border border-slate-400 bg-white shadow-sm">
              <button
                aria-label="Zoom out"
                className="flex size-10 items-center justify-center border-r border-slate-300 text-xl font-semibold text-slate-700 hover:bg-slate-100 disabled:text-slate-300"
                disabled={zoomLevel <= 1}
                onClick={() => changeZoom(1.5)}
                title="Zoom out"
                type="button"
              >
                -
              </button>
              <button
                aria-label="Zoom in"
                className="flex size-10 items-center justify-center border-r border-slate-300 text-xl font-semibold text-slate-700 hover:bg-slate-100 disabled:text-slate-300"
                disabled={zoomLevel >= MAX_ZOOM}
                onClick={() => changeZoom(2 / 3)}
                title="Zoom in"
                type="button"
              >
                +
              </button>
              <button
                className="flex h-10 min-w-12 items-center justify-center px-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                onClick={resetView}
                title="Fit the full map"
                type="button"
              >
                Fit
              </button>
            </div>
            <div className="absolute right-2 top-2 z-10 flex overflow-hidden rounded border border-slate-400 bg-white p-0.5 shadow-sm">
              {(["draw", "pan"] as const).map((mode) => (
                <button
                  className={`h-9 min-w-12 px-2 text-xs font-bold capitalize transition ${
                    interactionMode === mode
                      ? "bg-ink text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                  key={mode}
                  onClick={() => setInteractionMode(mode)}
                  type="button"
                >
                  {mode}
                </button>
              ))}
            </div>
            <svg
              className={`absolute inset-0 size-full touch-none ${
                interactionMode === "pan"
                  ? "cursor-grab active:cursor-grabbing"
                  : "cursor-crosshair"
              }`}
              onPointerCancel={stopDrawing}
              onPointerDown={startDrawing}
              onPointerMove={continueDrawing}
              onPointerUp={stopDrawing}
              ref={overlayRef}
              role="application"
              viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
            >
              <image
                height={graph.mapHeight}
                href={mapImagePath}
                preserveAspectRatio="none"
                width={graph.mapWidth}
                x="0"
                y="0"
              />
              {showAcceptedRoute && (
                <path
                  d={pointsToPath(acceptedRoutePoints)}
                  fill="none"
                  opacity="0.9"
                  pointerEvents="none"
                  stroke="#166534"
                  strokeDasharray="14 9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="7"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              {hasDrawnRoute && (
                <>
                  <path
                    d={pointsToPath(routePoints)}
                    fill="none"
                    opacity="0.25"
                    stroke="#ffffff"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="20"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d={pointsToPath(routePoints)}
                    fill="none"
                    stroke={feedback?.passed ? "#18794e" : "#1769aa"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="10"
                    vectorEffect="non-scaling-stroke"
                  />
                </>
              )}
              <g pointerEvents="none">
                <circle
                  cx={acceptedRoutePoints[0].x}
                  cy={acceptedRoutePoints[0].y}
                  fill="#166534"
                  r={10 / zoomLevel}
                  stroke="white"
                  strokeWidth={3 / zoomLevel}
                />
                <text
                  fill="white"
                  fontSize={10 / zoomLevel}
                  fontWeight="700"
                  textAnchor="middle"
                  x={acceptedRoutePoints[0].x}
                  y={acceptedRoutePoints[0].y + 3.5 / zoomLevel}
                >
                  S
                </text>
                <circle
                  cx={acceptedRoutePoints[acceptedRoutePoints.length - 1].x}
                  cy={acceptedRoutePoints[acceptedRoutePoints.length - 1].y}
                  fill="#7f1d1d"
                  r={10 / zoomLevel}
                  stroke="white"
                  strokeWidth={3 / zoomLevel}
                />
                <text
                  fill="white"
                  fontSize={10 / zoomLevel}
                  fontWeight="700"
                  textAnchor="middle"
                  x={acceptedRoutePoints[acceptedRoutePoints.length - 1].x}
                  y={
                    acceptedRoutePoints[acceptedRoutePoints.length - 1].y +
                    3.5 / zoomLevel
                  }
                >
                  E
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>

      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-road">
          Route controls
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use a mouse, pen, or finger to trace one continuous route. Starting a
          new line replaces the current attempt.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-road hover:text-road disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={routePoints.length === 0}
            onClick={clearRoute}
            type="button"
          >
            Clear Route
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!hasDrawnRoute}
            onClick={submitRoute}
            type="button"
          >
            Submit Route
          </button>
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-3 border-t border-slate-200 pt-4 text-sm text-slate-700">
          <input
            checked={showAcceptedRoute}
            className="mt-1 size-4 accent-blue-700"
            onChange={(event) => setShowAcceptedRoute(event.target.checked)}
            type="checkbox"
          />
          <span>
            <span className="block font-semibold">Developer overlay</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Show accepted route
            </span>
          </span>
        </label>

        <div
          aria-live="polite"
          className={`mt-5 rounded-md border p-4 ${
            feedback
              ? feedback.passed
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <p className="text-sm font-semibold text-slate-700">Result</p>
          <p
            className={`mt-2 text-xl font-bold ${
              feedback
                ? feedback.passed
                  ? "text-success"
                  : "text-red-700"
                : "text-slate-500"
            }`}
          >
            {feedback
              ? feedback.passed
                ? "Correct"
                : "Incorrect"
              : "Draw a route to begin"}
          </p>
          {feedback && (
            <>
              <p className="mt-1 text-sm font-bold text-slate-800">
                Score: {feedback.score}%
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 text-xs">
                <div>
                  <dt className="font-semibold text-slate-500">Start check</dt>
                  <dd className="mt-1 font-mono text-slate-800">
                    {feedback.startPassed ? "Pass" : "Fail"} -{" "}
                    {feedback.distanceFromStart} units
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">End check</dt>
                  <dd className="mt-1 font-mono text-slate-800">
                    {feedback.endPassed ? "Pass" : "Fail"} -{" "}
                    {feedback.distanceFromEnd} units
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Coverage</dt>
                  <dd className="mt-1 font-mono text-slate-800">
                    {feedback.routeCoveragePercent}%
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Off-route penalty</dt>
                  <dd className="mt-1 font-mono text-slate-800">
                    {feedback.offRoutePenalty} points
                  </dd>
                </div>
              </dl>
              <ul className="mt-4 space-y-2 border-t border-slate-200 pt-3 text-sm leading-5 text-slate-700">
                {feedback.feedbackMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-700">Prototype status</p>
          <p className="mt-2">
            {hasDrawnRoute
              ? `${routePoints.length} route points captured`
              : "No route captured"}
          </p>
        </div>
      </aside>
    </section>
  );
}
