"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { EXAM_MAP_ZOOM_LIMITS } from "@/lib/topographicalAtlasStyle";
import { distanceInMetres, type Coordinates } from "@/lib/distance";

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

type ClickResult = {
  coordinates: Coordinates;
  distance: number;
  isCorrect: boolean;
};

export type MapClickQuestionResult = ClickResult;

function createSelectedMarkerElement() {
  const marker = document.createElement("div");
  marker.className =
    "relative flex size-8 items-center justify-center rounded-full border-2 border-white bg-road shadow-lg ring-4 ring-road/25";

  const centre = document.createElement("div");
  centre.className = "size-2 rounded-full bg-white";
  marker.appendChild(centre);

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
  onAnswer,
  onAnswerReset
}: MapClickQuestionProps & {
  onAnswer?: (result: MapClickQuestionResult) => void;
  onAnswerReset?: () => void;
}) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const clickedMarker = useRef<mapboxgl.Marker | null>(null);
  const [selectedCoordinates, setSelectedCoordinates] =
    useState<Coordinates | null>(null);
  const [result, setResult] = useState<ClickResult | null>(null);
  const [hasToken] = useState(Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN));

  useEffect(() => {
    setSelectedCoordinates(null);
    setResult(null);
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
      onAnswerReset?.();
    });

    return () => {
      clickedMarker.current?.remove();
      clickedMarker.current = null;
      map.remove();
    };
  }, [initialCenter, initialZoom, onAnswerReset, target]);

  function submitAnswer() {
    if (!selectedCoordinates) {
      return;
    }

    const targetCoordinates: Coordinates = {
      latitude: target.lat,
      longitude: target.lng
    };
    const distance = distanceInMetres(selectedCoordinates, targetCoordinates);
    const answerResult = {
      coordinates: selectedCoordinates,
      distance,
      isCorrect: distance <= passRadiusMetres
    };

    setResult(answerResult);
    onAnswer?.(answerResult);
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
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
          </div>
          <p className="rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
            Within {passRadiusMetres}m
          </p>
        </div>

        <div className="rounded-md border border-slate-300 bg-slate-100 p-2">
          <div
            className="min-h-[460px] overflow-hidden rounded border border-slate-400 bg-slate-100 shadow-inner sm:min-h-[560px] lg:min-h-[620px]"
            ref={mapContainer}
          >
            {!hasToken && (
              <div className="flex h-full min-h-[460px] items-center justify-center px-6 text-center text-sm font-medium text-slate-600">
                Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local to load the Mapbox
                test map.
              </div>
            )}
          </div>
        </div>
      </div>

      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-road">
          Answer panel
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Click or tap your chosen location on the map, then submit your answer.
        </p>

        <button
          className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-road px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!selectedCoordinates}
          onClick={submitAnswer}
          type="button"
        >
          Submit answer
        </button>

        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">Result</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              result
                ? result.isCorrect
                  ? "text-success"
                  : "text-red-700"
                : "text-slate-500"
            }`}
          >
            {result ? (result.isCorrect ? "Correct" : "Try again") : "Waiting"}
          </p>
          {result && (
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
