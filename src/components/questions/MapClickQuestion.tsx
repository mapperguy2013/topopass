"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { distanceInMetres, type Coordinates } from "@/lib/distance";

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

export function MapClickQuestion({
  title,
  description,
  target,
  passRadiusMetres,
  initialCenter,
  initialZoom = 15,
  onAnswer
}: MapClickQuestionProps & {
  onAnswer?: (result: MapClickQuestionResult) => void;
}) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const clickedMarker = useRef<mapboxgl.Marker | null>(null);
  const [result, setResult] = useState<ClickResult | null>(null);
  const [hasToken] = useState(Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN));

  useEffect(() => {
    if (!mapContainer.current || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      return;
    }

    const targetCoordinates: Coordinates = {
      latitude: target.lat,
      longitude: target.lng
    };
    const center = initialCenter ?? target;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [center.lng, center.lat],
      zoom: initialZoom
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    const targetMarker = new mapboxgl.Marker({ color: "#172033" })
      .setLngLat([target.lng, target.lat])
      .setPopup(new mapboxgl.Popup().setText("Target location"))
      .addTo(map);

    map.on("click", (event) => {
      const clickedCoordinates = {
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng
      };
      const distance = distanceInMetres(clickedCoordinates, targetCoordinates);

      clickedMarker.current?.remove();
      clickedMarker.current = new mapboxgl.Marker({ color: "#1F6FEB" })
        .setLngLat([clickedCoordinates.longitude, clickedCoordinates.latitude])
        .addTo(map);

      const answerResult = {
        coordinates: clickedCoordinates,
        distance,
        isCorrect: distance <= passRadiusMetres
      };

      setResult(answerResult);
      onAnswer?.(answerResult);
    });

    return () => {
      targetMarker.remove();
      clickedMarker.current?.remove();
      clickedMarker.current = null;
      map.remove();
    };
  }, [initialCenter, initialZoom, onAnswer, passRadiusMetres, target]);

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div
        className="min-h-[420px] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm sm:min-h-[560px]"
        ref={mapContainer}
      >
        {!hasToken && (
          <div className="flex h-full min-h-[420px] items-center justify-center px-6 text-center text-sm font-medium text-slate-600">
            Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local to load the Mapbox demo
            map.
          </div>
        )}
      </div>

      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-road">
          Map click question
        </p>
        <h2 className="mt-3 text-2xl font-bold text-ink">{title}</h2>
        {description && (
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {description}
          </p>
        )}
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Click or tap the map. A click within {passRadiusMetres} metres of the
          target coordinate counts as correct.
        </p>

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
        </div>

        <div className="mt-5 space-y-3 text-sm">
          <div>
            <p className="font-semibold text-slate-700">Clicked latitude</p>
            <p className="mt-1 font-mono text-slate-600">
              {result ? result.coordinates.latitude.toFixed(6) : "--"}
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">Clicked longitude</p>
            <p className="mt-1 font-mono text-slate-600">
              {result ? result.coordinates.longitude.toFixed(6) : "--"}
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">Distance to target</p>
            <p className="mt-1 font-mono text-slate-600">
              {result ? `${Math.round(result.distance)} metres` : "--"}
            </p>
          </div>
        </div>
      </aside>
    </section>
  );
}
