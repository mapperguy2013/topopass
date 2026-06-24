"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";
import {
  appendRoutePoint,
  canSubmitRoute,
  clearRoutePoints,
  routeDrawingStatusMessage,
  undoLastRoutePoint
} from "@/lib/routeDrawingControls";
import {
  scoreDrawnRoute,
  type RouteScoreResult,
  type RouteScoringConfig
} from "@/lib/routeScoring";
import { AtlasPageBaseImage } from "@/src/components/map/AtlasPageMap";
import type { RouteGraph, RouteMapPoint } from "@/src/data/maps/routeTypes";
import type { RouteQuestion } from "@/src/data/routeQuestions";

type RouteDrawingQuestionProps = {
  graph: RouteGraph;
  question: RouteQuestion;
  mapImagePath: string;
  mapAttribution?: string;
  acceptedRoutePoints: RouteMapPoint[];
  routeScoringConfig?: Partial<RouteScoringConfig>;
  showDeveloperTools?: boolean;
  initialAnswer?: RouteDrawingQuestionAnswer | null;
  onAnswer?: (answer: RouteDrawingQuestionAnswer) => void;
  onAnswerReset?: () => void;
  showResult?: boolean;
  submitMode?: "manual" | "auto";
};

export type RouteDrawingQuestionAnswer = {
  routePoints: RouteMapPoint[];
  result: RouteScoreResult;
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

function formatMetres(value: number) {
  return Number.isFinite(value) ? `${Math.round(value)} m` : "Not available";
}

export function RouteDrawingQuestion({
  graph,
  question,
  mapImagePath,
  mapAttribution,
  acceptedRoutePoints,
  routeScoringConfig,
  showDeveloperTools = true,
  initialAnswer,
  onAnswer,
  onAnswerReset,
  showResult = true,
  submitMode = "manual"
}: RouteDrawingQuestionProps) {
  const overlayRef = useRef<SVGSVGElement | null>(null);
  const drawingPointerId = useRef<number | null>(null);
  const panGesture = useRef<PanGesture | null>(null);
  const answerHandler = useRef(onAnswer);
  const acceptedRoutePointsRef = useRef(acceptedRoutePoints);
  const routeScoringConfigRef = useRef(routeScoringConfig);
  const questionRef = useRef(question);
  const [routePoints, setRoutePoints] = useState<RouteMapPoint[]>(
    initialAnswer?.routePoints ?? []
  );
  const [feedback, setFeedback] = useState<RouteScoreResult | null>(
    initialAnswer?.result ?? null
  );
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
  const hasDrawnRoute = canSubmitRoute(routePoints);
  const zoomLevel = graph.mapWidth / viewBox.width;
  const routeHelpId = `${question.id}-route-map-help`;
  const routeStatusId = `${question.id}-route-status`;
  const interactionModeLabel =
    interactionMode === "draw" ? "Draw route" : "Move map";
  const routeStatusMessage = routeDrawingStatusMessage(routePoints);
  answerHandler.current = onAnswer;
  acceptedRoutePointsRef.current = acceptedRoutePoints;
  routeScoringConfigRef.current = routeScoringConfig;
  questionRef.current = question;

  useEffect(() => {
    if (submitMode !== "auto" || !canSubmitRoute(routePoints)) return;

    const result = scoreDrawnRoute(
      routePoints,
      acceptedRoutePointsRef.current,
      {
        bounds: questionRef.current.mapBounds,
        config: routeScoringConfigRef.current
      }
    );

    setFeedback(result);
    answerHandler.current?.({ routePoints, result });
  }, [routePoints, submitMode]);

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
    onAnswerReset?.();
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
      return appendRoutePoint(points, nextPoint);
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
    setRoutePoints(clearRoutePoints());
    setFeedback(null);
    onAnswerReset?.();
  }

  function undoLastPoint() {
    setRoutePoints((points) => undoLastRoutePoint(points));
    setFeedback(null);
    onAnswerReset?.();
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

    const result = scoreDrawnRoute(routePoints, acceptedRoutePoints, {
      bounds: question.mapBounds,
      config: routeScoringConfig
    });

    setFeedback(result);
    onAnswer?.({ routePoints, result });
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-slate-300 bg-white p-3 shadow-soft sm:p-5">
        <div className="mb-3 border-b border-slate-200 pb-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-road">
            Route drawing question - printed street-atlas training map
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink sm:text-2xl">
            {question.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {question.prompt}
          </p>
          <p
            className="mt-3 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-950"
            id={routeHelpId}
          >
            Draw the route from the start point to the destination. Use Move map
            to pan, then switch back to Draw route before tracing.
          </p>
        </div>

        <div className="rounded-md border border-slate-500 bg-[#f6f1df] p-1.5 shadow-inner sm:p-2">
          <div
            className="relative w-full select-none overflow-hidden rounded-sm bg-[#f6f1df]"
            aria-label={`Route drawing map for ${question.title}`}
            style={{ aspectRatio: `${graph.mapWidth} / ${graph.mapHeight}` }}
          >
            <div className="absolute left-2 top-2 z-10 flex overflow-hidden rounded border border-slate-400 bg-white shadow-sm">
              <button
                aria-label="Zoom out"
                className="flex size-11 items-center justify-center border-r border-slate-300 text-xl font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road disabled:text-slate-300"
                disabled={zoomLevel <= 1}
                onClick={() => changeZoom(1.5)}
                title="Zoom out"
                type="button"
              >
                -
              </button>
              <button
                aria-label="Zoom in"
                className="flex size-11 items-center justify-center border-r border-slate-300 text-xl font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road disabled:text-slate-300"
                disabled={zoomLevel >= MAX_ZOOM}
                onClick={() => changeZoom(2 / 3)}
                title="Zoom in"
                type="button"
              >
                +
              </button>
              <button
                className="flex min-h-11 min-w-14 items-center justify-center px-2 text-xs font-bold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                onClick={resetView}
                title="Fit the full map"
                type="button"
              >
                Fit
              </button>
            </div>
            <div className="absolute right-2 top-2 z-10 flex overflow-hidden rounded border border-slate-400 bg-white p-0.5 shadow-sm">
              {(["draw", "pan"] as const).map((mode) => {
                const label = mode === "draw" ? "Draw route" : "Move map";

                return (
                  <button
                    aria-pressed={interactionMode === mode}
                    className={`min-h-11 min-w-[5.75rem] px-2 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road ${
                      interactionMode === mode
                        ? "bg-ink text-white"
                        : "bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                    key={mode}
                    onClick={() => setInteractionMode(mode)}
                    title={label}
                    type="button"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <svg
              aria-describedby={`${routeHelpId} ${routeStatusId}`}
              aria-label={`Route drawing map for ${question.title}. Current mode: ${interactionModeLabel}.`}
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
              <AtlasPageBaseImage
                imagePath={mapImagePath}
                pixelHeight={graph.mapHeight}
                pixelWidth={graph.mapWidth}
                title={question.mapPageId ? question.title : undefined}
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
                    opacity="0.72"
                    pointerEvents="none"
                    stroke="#fff7df"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="16"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d={pointsToPath(routePoints)}
                    fill="none"
                    pointerEvents="none"
                    stroke={showResult && feedback?.passed ? "#18794e" : "#8a2432"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="7"
                    vectorEffect="non-scaling-stroke"
                  />
                </>
              )}
              <g pointerEvents="none">
                <rect
                  fill="#155f3b"
                  height={24 / zoomLevel}
                  rx={3 / zoomLevel}
                  stroke="#ffffff"
                  strokeWidth={2 / zoomLevel}
                  width={72 / zoomLevel}
                  x={acceptedRoutePoints[0].x - 36 / zoomLevel}
                  y={acceptedRoutePoints[0].y - 12 / zoomLevel}
                />
                <text
                  fill="white"
                  fontSize={8.5 / zoomLevel}
                  fontWeight="700"
                  textAnchor="middle"
                  x={acceptedRoutePoints[0].x}
                  y={acceptedRoutePoints[0].y + 3 / zoomLevel}
                >
                  A START
                </text>
                <rect
                  fill="#7f1d1d"
                  height={24 / zoomLevel}
                  rx={3 / zoomLevel}
                  stroke="#ffffff"
                  strokeWidth={2 / zoomLevel}
                  width={62 / zoomLevel}
                  x={
                    acceptedRoutePoints[acceptedRoutePoints.length - 1].x -
                    31 / zoomLevel
                  }
                  y={
                    acceptedRoutePoints[acceptedRoutePoints.length - 1].y -
                    12 / zoomLevel
                  }
                />
                <text
                  fill="white"
                  fontSize={8.5 / zoomLevel}
                  fontWeight="700"
                  textAnchor="middle"
                  x={acceptedRoutePoints[acceptedRoutePoints.length - 1].x}
                  y={
                    acceptedRoutePoints[acceptedRoutePoints.length - 1].y +
                    3.5 / zoomLevel
                  }
                >
                  B END
                </text>
              </g>
            </svg>
            <p className="pointer-events-none absolute bottom-8 left-1 max-w-[70%] rounded-sm bg-white/90 px-2 py-1 text-[10px] font-semibold leading-tight text-slate-700 shadow-sm sm:text-xs">
              {interactionMode === "draw"
                ? "Draw route: drag to trace one continuous line."
                : "Move map: drag to pan without drawing."}
            </p>
            {mapAttribution && (
              <p className="pointer-events-none absolute bottom-1 right-1 max-w-[80%] rounded-sm bg-white/85 px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-slate-600 shadow-sm">
                {mapAttribution}
              </p>
            )}
          </div>
        </div>
      </div>

      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-road">
          Route controls
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use a mouse, pen, or finger to trace one continuous route. Starting a
          new line replaces the current attempt. Switch to Move map when you
          need to pan.
        </p>
        <p
          aria-live="polite"
          className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700"
          id={routeStatusId}
        >
          Current mode: {interactionModeLabel}. {routeStatusMessage}
        </p>

        <div
          className={`mt-5 grid gap-3 ${
            submitMode === "auto" ? "sm:grid-cols-3" : "sm:grid-cols-4"
          }`}
        >
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={routePoints.length === 0}
            onClick={undoLastPoint}
            type="button"
          >
            Undo last point
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={routePoints.length === 0}
            onClick={clearRoute}
            type="button"
          >
            Clear Route
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            onClick={resetView}
            type="button"
          >
            Reset View
          </button>
          {submitMode === "manual" && (
            <button
              aria-describedby={routeStatusId}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!hasDrawnRoute}
              onClick={submitRoute}
              type="button"
            >
              Finish / Submit
            </button>
          )}
        </div>
        <p className="mt-3 text-xs font-semibold text-slate-500">
          {submitMode === "auto"
            ? hasDrawnRoute
              ? "Route saved. You can still undo or clear before pressing Next question."
              : "Draw at least two route points before pressing Next question."
            : hasDrawnRoute
              ? "Ready to submit. You can still undo or clear before finishing."
              : "Submit is enabled after the route has at least two captured points."}
        </p>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200 pt-4 text-sm text-slate-700">
          <span className="inline-flex items-center gap-2">
            <span className="rounded-sm bg-[#155f3b] px-2 py-1 text-[10px] font-bold text-white">
              A
            </span>
            Start point
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="rounded-sm bg-[#7f1d1d] px-2 py-1 text-[10px] font-bold text-white">
              B
            </span>
            Destination
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-8 rounded-full bg-[#8a2432]" />
            Your route
          </span>
          {showDeveloperTools && (
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-8 rounded-full border-t-2 border-dashed border-green-700" />
              Accepted route overlay
            </span>
          )}
        </div>

        {showDeveloperTools && (
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
        )}

        <div
          aria-live="polite"
          className={`mt-5 rounded-md border p-4 ${
            feedback && showResult
              ? feedback.passed
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <p className="text-sm font-semibold text-slate-700">Result</p>
          <p
            className={`mt-2 text-xl font-bold ${
              feedback && showResult
                ? feedback.passed
                  ? "text-success"
                  : "text-red-700"
                : "text-slate-500"
            }`}
          >
            {feedback
              ? showResult
                ? feedback.passed
                  ? "Correct"
                  : "Incorrect"
                : "Answer submitted"
              : "Draw a route to begin"}
          </p>
          {feedback && showResult && (
            <>
              <p className="mt-1 text-sm font-bold text-slate-800">
                Score: {feedback.score}/{feedback.maxScore} ({feedback.percentage}%)
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 text-xs sm:grid-cols-3">
                <div>
                  <dt className="font-semibold text-slate-500">Start check</dt>
                  <dd className="mt-1 text-slate-800">
                    <span className="font-semibold">
                      {feedback.startPassed ? "Pass" : "Fail"}
                    </span>{" "}
                    - {formatMetres(feedback.startDistanceMeters)}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">End check</dt>
                  <dd className="mt-1 text-slate-800">
                    <span className="font-semibold">
                      {feedback.endPassed ? "Pass" : "Fail"}
                    </span>{" "}
                    - {formatMetres(feedback.endDistanceMeters)}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Coverage</dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    {feedback.coverageScore}%
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Route length</dt>
                  <dd className="mt-1 text-slate-800">
                    {formatMetres(feedback.drawnLengthMeters)} /{" "}
                    {formatMetres(feedback.acceptedLengthMeters)}
                    <span className="mt-0.5 block text-slate-500">
                      {Math.round(feedback.lengthRatio * 100)}% of accepted
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Off route</dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    {feedback.offRoutePercent}%
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Outside bounds</dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    {feedback.outsideBoundsPercent}%
                  </dd>
                </div>
              </dl>
              {feedback.penalties.length > 0 && (
                <div className="mt-4 border-t border-red-200 pt-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                    Penalties
                  </p>
                  <ul className="mt-2 space-y-1 text-sm leading-5 text-red-800">
                    {feedback.penalties.map((penalty) => (
                      <li key={penalty}>{penalty}</li>
                    ))}
                  </ul>
                </div>
              )}
              {feedback.warnings.length > 0 && (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-900">
                    Warnings
                  </p>
                  <ul className="mt-2 space-y-1 text-sm leading-5 text-amber-900">
                    {feedback.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              <ul className="mt-4 space-y-2 border-t border-slate-200 pt-3 text-sm leading-5 text-slate-700">
                {feedback.feedback.map((message) => (
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
