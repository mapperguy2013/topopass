"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Coordinates } from "@/lib/distance";
import { QuestionExplanation } from "@/src/components/questions/QuestionExplanation";

const REVIEW_MAP_STYLE = "mapbox://styles/mapbox/streets-v12";

export type MapClickAnswerReviewProps = {
  userCoordinates?: Coordinates | null;
  correctCoordinates?: { lat: number; lng: number } | null;
  distanceMeters?: number | null;
  scoreLabel: string;
  explanation?: string | null;
  tip?: string | null;
  acceptedAreaDescription?: string | null;
  showAnswer: boolean;
};

function isCoordinate(value: unknown): value is Coordinates {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as Coordinates).latitude === "number" &&
    typeof (value as Coordinates).longitude === "number"
  );
}

function isTarget(value: unknown): value is { lat: number; lng: number } {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as { lat: unknown }).lat === "number" &&
    typeof (value as { lng: unknown }).lng === "number"
  );
}

function createMarkerElement(label: string, variant: "user" | "correct") {
  const wrapper = document.createElement("div");
  wrapper.className = "flex items-center gap-2";

  const marker = document.createElement("div");
  marker.className =
    variant === "user"
      ? "size-5 rounded-full border-2 border-white bg-red-600 shadow-lg"
      : "size-5 rounded-full border-2 border-white bg-green-700 shadow-lg";

  const text = document.createElement("span");
  text.className =
    "rounded bg-white/95 px-2 py-1 text-xs font-bold text-slate-800 shadow";
  text.textContent = label;

  wrapper.append(marker, text);
  return wrapper;
}

function resultLabel(scoreLabel: string) {
  return scoreLabel === "100%" || scoreLabel.startsWith("100/")
    ? "Correct"
    : "Incorrect";
}

export function MapClickAnswerReview({
  userCoordinates,
  correctCoordinates,
  distanceMeters,
  scoreLabel,
  explanation,
  tip,
  acceptedAreaDescription,
  showAnswer
}: MapClickAnswerReviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasUserCoordinate = isCoordinate(userCoordinates);
  const hasCorrectCoordinate = isTarget(correctCoordinates);
  const shouldRenderMap =
    Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN) &&
    (hasUserCoordinate || hasCorrectCoordinate);
  const attemptDetail =
    hasUserCoordinate && typeof distanceMeters === "number"
      ? `You clicked ${Math.round(distanceMeters)} metres from the target.`
      : hasUserCoordinate
        ? "Your clicked location is saved for this attempt."
        : "Your clicked location was not saved for this older attempt.";

  useEffect(() => {
    if (!containerRef.current || !shouldRenderMap) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;
    const visiblePoints: [number, number][] = [];

    if (hasUserCoordinate) {
      visiblePoints.push([userCoordinates.longitude, userCoordinates.latitude]);
    }

    if (showAnswer && hasCorrectCoordinate) {
      visiblePoints.push([correctCoordinates.lng, correctCoordinates.lat]);
    }

    if (visiblePoints.length === 0 && hasCorrectCoordinate) {
      visiblePoints.push([correctCoordinates.lng, correctCoordinates.lat]);
    }

    const firstPoint = visiblePoints[0] ?? [-0.12, 51.52];
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: REVIEW_MAP_STYLE,
      center: firstPoint,
      zoom: 15,
      minZoom: 11,
      maxZoom: 17,
      bearing: 0,
      pitch: 0,
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: true
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.touchZoomRotate.disableRotation();

    if (hasUserCoordinate) {
      new mapboxgl.Marker({
        element: createMarkerElement("Your click", "user"),
        anchor: "center"
      })
        .setLngLat([userCoordinates.longitude, userCoordinates.latitude])
        .addTo(map);
    }

    if (showAnswer && hasCorrectCoordinate) {
      new mapboxgl.Marker({
        element: createMarkerElement("Correct location", "correct"),
        anchor: "center"
      })
        .setLngLat([correctCoordinates.lng, correctCoordinates.lat])
        .addTo(map);
    }

    map.on("load", () => {
      if (visiblePoints.length > 1) {
        const bounds = new mapboxgl.LngLatBounds(visiblePoints[0], visiblePoints[0]);
        visiblePoints.slice(1).forEach((point) => bounds.extend(point));
        map.fitBounds(bounds, { padding: 80, maxZoom: 16, duration: 0 });
      } else if (visiblePoints.length === 1) {
        map.setCenter(visiblePoints[0]);
        map.setZoom(15);
      }
    });

    return () => {
      map.remove();
    };
  }, [
    correctCoordinates,
    hasCorrectCoordinate,
    hasUserCoordinate,
    shouldRenderMap,
    showAnswer,
    userCoordinates
  ]);

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Score
          </dt>
          <dd className="mt-1 text-2xl font-bold text-red-700">{scoreLabel}</dd>
        </div>
        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Result
          </dt>
          <dd className="mt-1 text-base font-bold text-slate-800">
            {resultLabel(scoreLabel)}
          </dd>
        </div>
        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Click distance
          </dt>
          <dd className="mt-1 text-base font-bold text-slate-800">
            {typeof distanceMeters === "number"
              ? `${Math.round(distanceMeters)}m`
              : "Not saved"}
          </dd>
        </div>
      </dl>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800">
        <p className="font-semibold text-slate-500">Attempt detail</p>
        <p className="mt-1">{attemptDetail}</p>
      </div>

      <section>
        <p className="text-sm font-bold text-slate-800">
          {showAnswer ? "Correct answer visual" : "Learner attempt visual"}
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          {showAnswer
            ? "Compare your selected point with the correct location marker."
            : "Your selected point is shown. Reveal the correct location when you are ready to compare."}
        </p>
        {shouldRenderMap ? (
          <div
            className="mt-3 h-[380px] overflow-hidden rounded-md border border-slate-300 bg-slate-100 md:h-[520px]"
            ref={containerRef}
          />
        ) : (
          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
            {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN
              ? "Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local to load the real Mapbox review map."
              : "Map coordinates are unavailable for this attempt."}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {hasUserCoordinate && (
            <span className="inline-flex items-center gap-2 text-red-800">
              <span className="size-3 rounded-full bg-red-600" />
              Red marker: your click
            </span>
          )}
          {showAnswer && hasCorrectCoordinate && (
            <span className="inline-flex items-center gap-2 text-green-800">
              <span className="size-3 rounded-full bg-green-700" />
              Green marker: correct location
            </span>
          )}
        </div>
        {!showAnswer && (
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
            The correct answer is hidden. Show it when you are ready to review.
          </div>
        )}
        {showAnswer && (
          <div className="mt-4">
            {hasCorrectCoordinate ? (
              <QuestionExplanation
                acceptedAreaDescription={acceptedAreaDescription}
                explanation={
                  explanation ||
                  "Review the correct location and compare it with your selected point."
                }
                tip={tip}
              />
            ) : (
              <div className="rounded-md border border-green-100 bg-green-50 p-3 text-sm leading-6 text-green-900">
                Correct location data is unavailable for this attempt.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
