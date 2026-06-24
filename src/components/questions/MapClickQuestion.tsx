"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { EXAM_MAP_ZOOM_LIMITS } from "@/lib/topographicalAtlasStyle";
import type { Coordinates } from "@/lib/distance";
import {
  canSubmitMapClickAnswer,
  mapClickSelectionMessage,
  scoreMapClickAnswer,
  type MapClickScoreResult
} from "@/lib/mapClickInteraction";

const SAFE_MAPBOX_STYLE = "mapbox://styles/mapbox/streets-v12";

export type MapClickQuestionProps = {
  title: string;
  description?: string;
  target: {
    lat: number;
    lng: number;
  };
  passRadiusMetres: number;
  initialCenter?: {
    lat: number;
    lng: number;
  };
  initialZoom?: number;
};

export type MapClickQuestionResult = MapClickScoreResult;

type MapClickQuestionInteractionProps = {
  initialAnswer?: MapClickQuestionResult | null;
  onAnswer?: (result: MapClickQuestionResult) => void;
  onAnswerReset?: () => void;
  showResult?: boolean;
  submitMode?: "manual" | "auto";
};

function createSelectedMarkerElement() {
  const marker = document.createElement("div");
  marker.className = "relative flex flex-col items-center";

  const pin = document.createElement("div");
  pin.className =
    "flex size-9 items-center justify-center rounded-full border-2 border-white bg-road shadow-lg ring-4 ring-road/25";

  const centre = document.createElement("div");
  centre.className = "size-2 rounded-full bg-white";
  pin.appendChild(centre);

  const label = document.createElement("div");
  label.className =
    "mt-1 rounded bg-white/95 px-2 py-1 text-xs font-bold text-slate-800 shadow";
  label.textContent = "Selected";

  marker.append(pin, label);

  return marker;
}

function clampExamZoom(zoom: number) {
  return Math.min(
    Math.max(zoom, EXAM_MAP_ZOOM_LIMITS.minZoom),
    EXAM_MAP_ZOOM_LIMITS.maxZoom
  );
}

export function MapClickQuestion({
  title,
  description,
  target,
  passRadiusMetres,
  initialCenter,
  initialZoom = EXAM_MAP_ZOOM_LIMITS.defaultZoom,
  initialAnswer,
  onAnswer,
  onAnswerReset,
  showResult = true,
  submitMode = "manual"
}: MapClickQuestionProps & MapClickQuestionInteractionProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const clickedMarker = useRef<mapboxgl.Marker | null>(null);
  const restoredAnswer = useRef(initialAnswer);
  const answerHandler = useRef(onAnswer);
  const answerResetHandler = useRef(onAnswerReset);
  restoredAnswer.current = initialAnswer;
  answerHandler.current = onAnswer;
  answerResetHandler.current = onAnswerReset;
  const [selectedCoordinates, setSelectedCoordinates] =
    useState<Coordinates | null>(initialAnswer?.coordinates ?? null);
  const [result, setResult] = useState<MapClickScoreResult | null>(
    initialAnswer ?? null
  );
  const [hasToken] = useState(Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN));
  const canSubmit = canSubmitMapClickAnswer(selectedCoordinates);
  const selectionStatusId = "map-click-selection-status";
  const selectionMessage = mapClickSelectionMessage({
    selectedCoordinates,
    hasSubmittedResult: Boolean(result)
  });

  useEffect(() => {
    setSelectedCoordinates(restoredAnswer.current?.coordinates ?? null);
    setResult(restoredAnswer.current ?? null);
    clickedMarker.current?.remove();
    clickedMarker.current = null;
  }, [target.lat, target.lng, title]);

  useEffect(() => {
    if (!mapContainer.current || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      return;
    }

    const center = initialCenter ?? target;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: SAFE_MAPBOX_STYLE,
      center: [center.lng, center.lat],
      zoom: clampExamZoom(initialZoom),
      minZoom: EXAM_MAP_ZOOM_LIMITS.minZoom,
      maxZoom: EXAM_MAP_ZOOM_LIMITS.maxZoom,
      bearing: 0,
      pitch: 0,
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: true
    });

    map.getCanvas().style.cursor = "crosshair";
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.touchZoomRotate.disableRotation();

    if (restoredAnswer.current) {
      const coordinates = restoredAnswer.current.coordinates;
      clickedMarker.current = new mapboxgl.Marker({
        element: createSelectedMarkerElement(),
        anchor: "center"
      })
        .setLngLat([coordinates.longitude, coordinates.latitude])
        .addTo(map);
    }

    map.on("click", (event) => {
      const clickedCoordinates = {
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng
      };

      clickedMarker.current?.remove();
      clickedMarker.current = new mapboxgl.Marker({
        element: createSelectedMarkerElement(),
        anchor: "center"
      })
        .setLngLat([clickedCoordinates.longitude, clickedCoordinates.latitude])
        .addTo(map);

      setSelectedCoordinates(clickedCoordinates);
      setResult(null);
      if (submitMode === "auto") {
        const answerResult = scoreMapClickAnswer({
          selectedCoordinates: clickedCoordinates,
          target,
          passRadiusMetres
        });

        if (answerResult) {
          setResult(answerResult);
          answerHandler.current?.(answerResult);
        }
      } else {
        answerResetHandler.current?.();
      }
    });

    return () => {
      clickedMarker.current?.remove();
      clickedMarker.current = null;
      map.remove();
    };
  }, [initialCenter, initialZoom, passRadiusMetres, submitMode, target]);

  function submitAnswer() {
    const answerResult = scoreMapClickAnswer({
      selectedCoordinates,
      target,
      passRadiusMetres
    });

    if (!answerResult) {
      return;
    }

    setResult(answerResult);
    onAnswer?.(answerResult);
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-soft">
        <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-road">
              Topographical Map Question
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink">{title}</h2>
            {description && (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {description}
              </p>
            )}
            <p className="mt-3 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-950">
              Click the best location on the map with a mouse, pen, or touch.
              You can change your answer before submitting.
            </p>
          </div>
          <p className="rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
            Within {passRadiusMetres}m
          </p>
        </div>

        <div className="rounded-md border border-slate-300 bg-slate-100 p-2">
          <div className="relative">
            <div
              aria-describedby={selectionStatusId}
              className="min-h-[420px] overflow-hidden rounded border border-slate-400 bg-slate-100 shadow-inner sm:min-h-[540px] lg:min-h-[620px]"
              ref={mapContainer}
            >
              {!hasToken && (
                <div className="flex h-full min-h-[420px] items-center justify-center px-6 text-center text-sm font-medium text-slate-600">
                  Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local to load the Mapbox
                  test map.
                </div>
              )}
            </div>
            <p
              aria-live="polite"
              className="pointer-events-none absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-md border border-slate-200 bg-white/95 px-3 py-2 text-xs font-bold leading-5 text-slate-800 shadow-sm sm:text-sm"
            >
              {selectionMessage}
            </p>
          </div>
        </div>
      </div>

      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-road">
          Answer panel
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {submitMode === "auto"
            ? "Click or tap your chosen location on the map. Your answer is saved automatically; tap the map again to move the selected point before continuing."
            : "Click or tap your chosen location on the map, then submit your answer. Tap the map again to move the selected point."}
        </p>

        <div
          aria-live="polite"
          className={`mt-5 rounded-md border p-4 ${
            selectedCoordinates
              ? "border-blue-200 bg-blue-50 text-blue-950"
              : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
          id="map-click-selection-status"
        >
          <p className="text-sm font-bold">
            {selectedCoordinates ? "Location selected" : "No location selected"}
          </p>
          <p className="mt-1 text-sm">{selectionMessage}</p>
        </div>

        {submitMode === "manual" ? (
          <button
            aria-describedby={selectionStatusId}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-road px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!canSubmit}
            onClick={submitAnswer}
            type="button"
          >
            {canSubmit ? "Submit selected location" : "Select a location to submit"}
          </button>
        ) : (
          <p className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-950">
            {canSubmit
              ? "Selected location saved. Press Next question to continue."
              : "Select a location before pressing Next question."}
          </p>
        )}

        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">Result</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              result && showResult
                ? result.isCorrect
                  ? "text-success"
                  : "text-red-700"
                : "text-slate-500"
            }`}
          >
            {result
              ? showResult
                ? result.isCorrect
                  ? "Correct"
                  : "Try again"
                : "Answer submitted"
              : "Waiting"}
          </p>
          {result && showResult && (
            <p className="mt-2 text-sm text-slate-600">
              Distance from target: {Math.round(result.distance)} metres
            </p>
          )}
        </div>

        <div className="mt-5 space-y-3 text-sm">
          <div>
            <p className="font-semibold text-slate-700">Clicked latitude</p>
            <p className="mt-1 font-mono text-slate-600">
              {selectedCoordinates
                ? selectedCoordinates.latitude.toFixed(6)
                : "--"}
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">Clicked longitude</p>
            <p className="mt-1 font-mono text-slate-600">
              {selectedCoordinates
                ? selectedCoordinates.longitude.toFixed(6)
                : "--"}
            </p>
          </div>
        </div>
      </aside>
    </section>
  );
}
