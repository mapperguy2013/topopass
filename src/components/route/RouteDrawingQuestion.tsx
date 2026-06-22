"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { scoreDrawnRoute, type RouteScoreResult } from "@/lib/routeScoring";
import type {
  DrawRouteQuestion,
  RouteGraph,
  RouteMapPoint
} from "@/src/data/maps/routeTypes";

type RouteDrawingQuestionProps = {
  graph: RouteGraph;
  question: DrawRouteQuestion;
  mapImagePath: string;
};

function pointsToPath(points: RouteMapPoint[]) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

export function RouteDrawingQuestion({
  graph,
  question,
  mapImagePath
}: RouteDrawingQuestionProps) {
  const overlayRef = useRef<SVGSVGElement | null>(null);
  const drawingPointerId = useRef<number | null>(null);
  const [routePoints, setRoutePoints] = useState<RouteMapPoint[]>([]);
  const [feedback, setFeedback] = useState<RouteScoreResult | null>(null);
  const hasDrawnRoute = routePoints.length > 1;

  function toMapPoint(event: ReactPointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();

    return {
      x: Math.max(
        0,
        Math.min(
          graph.mapWidth,
          ((event.clientX - bounds.left) / bounds.width) * graph.mapWidth
        )
      ),
      y: Math.max(
        0,
        Math.min(
          graph.mapHeight,
          ((event.clientY - bounds.top) / bounds.height) * graph.mapHeight
        )
      )
    };
  }

  function startDrawing(event: ReactPointerEvent<SVGSVGElement>) {
    event.preventDefault();
    drawingPointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setRoutePoints([toMapPoint(event)]);
    setFeedback(null);
  }

  function continueDrawing(event: ReactPointerEvent<SVGSVGElement>) {
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
    if (drawingPointerId.current !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drawingPointerId.current = null;
  }

  function clearRoute() {
    drawingPointerId.current = null;
    setRoutePoints([]);
    setFeedback(null);
  }

  function submitRoute() {
    if (!hasDrawnRoute) {
      return;
    }

    setFeedback(scoreDrawnRoute(routePoints, graph, question));
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-lg border border-slate-300 bg-white p-3 shadow-soft sm:p-5">
        <div className="mb-4 border-b border-slate-200 pb-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-road">
            Route drawing question
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink sm:text-2xl">
            {question.prompt}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Begin at King&apos;s Cross St Pancras and draw continuously along the
            visible roads to Euston.
          </p>
        </div>

        <div className="rounded-md border border-slate-400 bg-[#f6f1df] p-1.5 shadow-inner sm:p-2">
          <div
            className="relative w-full select-none overflow-hidden rounded-sm bg-[#f6f1df]"
            aria-label="Route drawing map from King's Cross to Euston"
            style={{ aspectRatio: `${graph.mapWidth} / ${graph.mapHeight}` }}
          >
            <Image
              alt="Real-data topographical training map from King's Cross to Euston"
              className="pointer-events-none object-contain"
              fill
              priority
              sizes="(max-width: 1279px) 100vw, 900px"
              src={mapImagePath}
              unoptimized
            />
            <svg
              className="absolute inset-0 size-full cursor-crosshair touch-none"
              onPointerCancel={stopDrawing}
              onPointerDown={startDrawing}
              onPointerMove={continueDrawing}
              onPointerUp={stopDrawing}
              ref={overlayRef}
              role="application"
              viewBox={`0 0 ${graph.mapWidth} ${graph.mapHeight}`}
            >
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
                  />
                  <path
                    d={pointsToPath(routePoints)}
                    fill="none"
                    stroke={feedback?.isCorrect ? "#18794e" : "#1769aa"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="10"
                  />
                </>
              )}
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

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
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

        <div
          aria-live="polite"
          className={`mt-5 rounded-md border p-4 ${
            feedback
              ? feedback.isCorrect
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <p className="text-sm font-semibold text-slate-700">Result</p>
          <p
            className={`mt-2 text-xl font-bold ${
              feedback
                ? feedback.isCorrect
                  ? "text-success"
                  : "text-red-700"
                : "text-slate-500"
            }`}
          >
            {feedback?.message ?? "Draw a route to begin"}
          </p>
          {feedback && (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Start offset: {Math.round(feedback.startDistance)} map units.
              Destination offset: {Math.round(feedback.endDistance)} map units.
            </p>
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
