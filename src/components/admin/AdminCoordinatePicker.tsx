"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

export type AdminCoordinatePoint = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  colour: string;
};

type AdminCoordinatePickerProps = {
  points: AdminCoordinatePoint[];
  activePointId: string;
  onPointChange: (id: string, coordinates: { lat: number; lng: number }) => void;
};

export function AdminCoordinatePicker({ points, activePointId, onPointChange }: AdminCoordinatePickerProps) {
  const container = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const initialPoints = useRef(points);
  const activeId = useRef(activePointId);
  const changeHandler = useRef(onPointChange);
  activeId.current = activePointId;
  changeHandler.current = onPointChange;

  useEffect(() => {
    if (!container.current || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return;
    const initial = initialPoints.current.find((point) => point.id === activeId.current) ?? initialPoints.current[0];
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const map = new mapboxgl.Map({ container: container.current, style: "mapbox://styles/mapbox/streets-v12", center: initial ? [initial.lng, initial.lat] : [-0.12, 51.52], zoom: 14, dragRotate: false, pitchWithRotate: false });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.on("click", (event) => changeHandler.current(activeId.current, { lat: event.lngLat.lat, lng: event.lngLat.lng }));
    mapRef.current = map;
    return () => { markers.current.forEach((marker) => marker.remove()); markers.current = []; mapRef.current = null; map.remove(); };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markers.current.forEach((marker) => marker.remove());
    markers.current = points.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng)).map((point) => {
      const element = document.createElement("div");
      element.className = "flex size-7 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-lg";
      element.style.backgroundColor = point.colour;
      element.textContent = point.label.slice(0, 1).toUpperCase();
      element.title = point.label;
      return new mapboxgl.Marker({ element }).setLngLat([point.lng, point.lat]).addTo(map);
    });
  }, [points]);

  return <div className="min-h-[360px] overflow-hidden rounded-md border border-slate-300 bg-slate-100" ref={container}>{!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && <div className="flex min-h-[360px] items-center justify-center p-5 text-center text-sm text-slate-600">Add NEXT_PUBLIC_MAPBOX_TOKEN to use the coordinate picker.</div>}</div>;
}
