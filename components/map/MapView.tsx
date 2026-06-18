"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

type MapViewProps = {
  className?: string;
};

export function MapView({ className = "" }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      return;
    }

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-0.1276, 51.5072],
      zoom: 10
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div
      className={`flex min-h-[320px] items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-sm text-slate-600 ${className}`}
      ref={mapContainer}
    >
      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && "Mapbox token required"}
    </div>
  );
}
