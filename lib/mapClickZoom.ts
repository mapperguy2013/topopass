import { EXAM_MAP_ZOOM_LIMITS } from "./topographicalAtlasStyle.ts";

export const MAP_CLICK_MOBILE_BREAKPOINT_PX = 640;

export const MAP_CLICK_ZOOM_OFFSETS = {
  desktop: 0.7,
  mobile: 1.8
} as const;

export function clampMapClickZoom(zoom: number) {
  return Math.min(
    Math.max(zoom, EXAM_MAP_ZOOM_LIMITS.minZoom),
    EXAM_MAP_ZOOM_LIMITS.maxZoom
  );
}

export function isMapClickMobileViewport(viewportWidth: number | undefined) {
  return (
    typeof viewportWidth === "number" &&
    Number.isFinite(viewportWidth) &&
    viewportWidth < MAP_CLICK_MOBILE_BREAKPOINT_PX
  );
}

export function mapClickInitialZoomForViewport({
  baseZoom,
  viewportWidth
}: {
  baseZoom: number;
  viewportWidth?: number;
}) {
  const offset = isMapClickMobileViewport(viewportWidth)
    ? MAP_CLICK_ZOOM_OFFSETS.mobile
    : MAP_CLICK_ZOOM_OFFSETS.desktop;

  return clampMapClickZoom(baseZoom - offset);
}
