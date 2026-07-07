import type { ScreenMapViewport } from "../../../lib/map-engine/index.ts";
import { TOPOPASS_STREET_ATLAS_STYLE } from "./topopassCartographyStyle.ts";

export type MapInteractionMode = "draw" | "pan";

export type MapViewportState = {
  zoom: number;
  panX: number;
  panY: number;
  interactionMode: MapInteractionMode;
};

export type MapZoomLimits = {
  baselineZoomFactor?: number;
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  stepRatio: number;
  wheelSensitivity: number;
  panMargin?: number;
};

export type MapPanBounds = {
  width: number;
  height: number;
};

export type PanDelta = {
  deltaX: number;
  deltaY: number;
};

export type MapPanLimits = {
  maxPanX: number;
  maxPanY: number;
};

export type MapViewportScreenPoint = {
  x: number;
  y: number;
};

export type MapPinchPointer = MapViewportScreenPoint;

export type MapPinchGesture = {
  startDistance: number;
  startMidpoint: MapViewportScreenPoint;
  startState: MapViewportState;
};

export type MapPointerInput = {
  button: number;
  buttons?: number;
  pointerType?: string;
};

export type MapPointerCaptureTarget = {
  isConnected?: boolean;
  setPointerCapture?: (pointerId: number) => void;
  hasPointerCapture?: (pointerId: number) => boolean;
  releasePointerCapture?: (pointerId: number) => void;
};

export type MapScrollLockState = {
  pointerInsideMap: boolean;
};

export type MapWheelInput = {
  deltaX?: number;
  deltaY?: number;
};

export const ROUTE_RUNNER_MAP_ZOOM_LIMITS: MapZoomLimits = {
  ...TOPOPASS_STREET_ATLAS_STYLE.zoom.thresholds
};
export const ROUTE_RUNNER_ZOOM_BASELINE_FACTOR = TOPOPASS_STREET_ATLAS_STYLE.zoom.thresholds.baselineZoomFactor;
export const ROUTE_RUNNER_PHONE_VIEWPORT_MAX_WIDTH_PX = 640;
export const ROUTE_RUNNER_PHONE_DEFAULT_ZOOM = 3;
export const ROUTE_RUNNER_PHONE_MAP_CANVAS_WIDTH = 900;
export const ROUTE_RUNNER_PHONE_MAP_CANVAS_HEIGHT = 2160;
export const ROUTE_RUNNER_PHONE_MAP_ZOOM_LIMITS: MapZoomLimits = {
  ...ROUTE_RUNNER_MAP_ZOOM_LIMITS,
  defaultZoom: ROUTE_RUNNER_PHONE_DEFAULT_ZOOM
};

const ZOOM_EPSILON = 0.000001;
const MIDDLE_MOUSE_BUTTON = 1;
const MIDDLE_MOUSE_BUTTONS_MASK = 4;

function panMargin(limits: MapZoomLimits): number {
  const margin = limits.panMargin ?? 0;

  return Number.isFinite(margin) ? Math.max(0, margin) : 0;
}

function safeAxisSize(size: number): number {
  return Number.isFinite(size) ? Math.max(0, size) : 0;
}

function safeCoordinate(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

function panMarginForAxis(axisSize: number, limits: MapZoomLimits): number {
  if (axisSize <= 0) {
    return 0;
  }

  return Math.min(panMargin(limits), axisSize * 0.1);
}

function normalizeZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

function hasUsableWheelDelta(delta: number | undefined): boolean {
  return Number.isFinite(delta) && delta !== 0;
}

function safeZoomStepRatio(limits: MapZoomLimits): number {
  return Number.isFinite(limits.stepRatio) && limits.stepRatio > 1 ? limits.stepRatio : 1.25;
}

function safeWheelSensitivity(limits: MapZoomLimits): number {
  return Number.isFinite(limits.wheelSensitivity) && limits.wheelSensitivity > 0 ? limits.wheelSensitivity : 0.002;
}

function zoomBaselineFactor(limits: MapZoomLimits): number {
  const baselineZoomFactor = limits.baselineZoomFactor ?? 1;

  return Number.isFinite(baselineZoomFactor) && baselineZoomFactor > 0 ? baselineZoomFactor : 1;
}

export function displayedMapZoomToInternalScale(
  zoom: number,
  limits: MapZoomLimits = ROUTE_RUNNER_MAP_ZOOM_LIMITS
): number {
  return clampMapZoom(zoom, limits) * zoomBaselineFactor(limits);
}

export function internalMapZoomScaleToDisplayedZoom(
  internalScale: number,
  limits: MapZoomLimits = ROUTE_RUNNER_MAP_ZOOM_LIMITS
): number {
  if (!Number.isFinite(internalScale)) {
    return limits.defaultZoom;
  }

  return clampMapZoom(internalScale / zoomBaselineFactor(limits), limits);
}

export function mapZoomDisplayPercent(zoom: number, limits: MapZoomLimits = ROUTE_RUNNER_MAP_ZOOM_LIMITS): number {
  return Math.round(clampMapZoom(zoom, limits) * 100);
}

function multiplyMapZoom(zoom: number, ratio: number, limits: MapZoomLimits): number {
  if (!Number.isFinite(zoom) || !Number.isFinite(ratio) || ratio <= 0) {
    return clampMapZoom(zoom, limits);
  }

  return clampMapZoom(zoom * ratio, limits);
}

function isMouseLikePointer(input: Pick<MapPointerInput, "pointerType">): boolean {
  return !input.pointerType || input.pointerType === "mouse";
}

function clampScreenPoint(point: MapViewportScreenPoint, bounds: MapPanBounds): MapViewportScreenPoint {
  const width = safeAxisSize(bounds.width);
  const height = safeAxisSize(bounds.height);
  const fallbackX = width / 2;
  const fallbackY = height / 2;
  const x = safeCoordinate(point.x, fallbackX);
  const y = safeCoordinate(point.y, fallbackY);

  return {
    x: normalizeZero(Math.min(width, Math.max(0, x))),
    y: normalizeZero(Math.min(height, Math.max(0, y)))
  };
}

function pinchDistance(pointers: readonly [MapPinchPointer, MapPinchPointer]): number {
  const [first, second] = pointers;

  return Math.hypot(second.x - first.x, second.y - first.y);
}

function pinchMidpoint(pointers: readonly [MapPinchPointer, MapPinchPointer]): MapViewportScreenPoint {
  const [first, second] = pointers;

  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2
  };
}

export function getMapPanLimitsForZoom(
  zoom: number,
  bounds: MapPanBounds,
  limits: MapZoomLimits
): MapPanLimits {
  const visualZoom = displayedMapZoomToInternalScale(zoom, limits);
  const width = safeAxisSize(bounds.width);
  const height = safeAxisSize(bounds.height);

  if (visualZoom <= 1 || (width === 0 && height === 0)) {
    return {
      maxPanX: 0,
      maxPanY: 0
    };
  }

  return {
    maxPanX: width > 0 ? ((visualZoom - 1) * width) / 2 + panMarginForAxis(width, limits) : 0,
    maxPanY: height > 0 ? ((visualZoom - 1) * height) / 2 + panMarginForAxis(height, limits) : 0
  };
}

export function clampMapZoom(zoom: number, limits: MapZoomLimits = ROUTE_RUNNER_MAP_ZOOM_LIMITS): number {
  if (!Number.isFinite(zoom)) {
    return limits.defaultZoom;
  }

  return Math.min(limits.maxZoom, Math.max(limits.minZoom, zoom));
}

export function clampMapPan(
  state: MapViewportState,
  bounds: MapPanBounds,
  limits: MapZoomLimits = ROUTE_RUNNER_MAP_ZOOM_LIMITS
): MapViewportState {
  const zoom = clampMapZoom(state.zoom, limits);
  const { maxPanX, maxPanY } = getMapPanLimitsForZoom(zoom, bounds, limits);
  const panX = Number.isFinite(state.panX) ? state.panX : 0;
  const panY = Number.isFinite(state.panY) ? state.panY : 0;

  return {
    ...state,
    zoom,
    panX: normalizeZero(Math.min(maxPanX, Math.max(-maxPanX, panX))),
    panY: normalizeZero(Math.min(maxPanY, Math.max(-maxPanY, panY)))
  };
}

export const clampPanToBounds = clampMapPan;

export function createDefaultMapViewportState(
  limits: MapZoomLimits = ROUTE_RUNNER_MAP_ZOOM_LIMITS
): MapViewportState {
  return {
    zoom: clampMapZoom(limits.defaultZoom, limits),
    panX: 0,
    panY: 0,
    interactionMode: "draw"
  };
}

export const createDefaultMapZoomState = createDefaultMapViewportState;

export function zoomInMapView(
  state: MapViewportState,
  limits: MapZoomLimits = ROUTE_RUNNER_MAP_ZOOM_LIMITS,
  bounds?: MapPanBounds
): MapViewportState {
  const zoom = multiplyMapZoom(state.zoom, safeZoomStepRatio(limits), limits);

  return bounds
    ? zoomMapViewAroundPoint(state, zoom, { x: safeAxisSize(bounds.width) / 2, y: safeAxisSize(bounds.height) / 2 }, bounds, limits)
    : {
        ...state,
        zoom
      };
}

export function zoomOutMapView(
  state: MapViewportState,
  limits: MapZoomLimits = ROUTE_RUNNER_MAP_ZOOM_LIMITS,
  bounds?: MapPanBounds
): MapViewportState {
  const zoom = multiplyMapZoom(state.zoom, 1 / safeZoomStepRatio(limits), limits);

  return bounds
    ? zoomMapViewAroundPoint(state, zoom, { x: safeAxisSize(bounds.width) / 2, y: safeAxisSize(bounds.height) / 2 }, bounds, limits)
    : {
        ...state,
        zoom
      };
}

export function zoomMapViewAroundPoint(
  state: MapViewportState,
  nextZoom: number,
  focusPoint: MapViewportScreenPoint,
  bounds: MapPanBounds,
  limits: MapZoomLimits = ROUTE_RUNNER_MAP_ZOOM_LIMITS
): MapViewportState {
  const previousState = clampMapPan(state, bounds, limits);
  const zoom = clampMapZoom(nextZoom, limits);
  const width = safeAxisSize(bounds.width);
  const height = safeAxisSize(bounds.height);

  if (width === 0 || height === 0 || Math.abs(zoom - previousState.zoom) < ZOOM_EPSILON) {
    return clampMapPan({ ...previousState, zoom }, bounds, limits);
  }

  const focus = clampScreenPoint(focusPoint, bounds);
  const focusOffsetX = focus.x - width / 2;
  const focusOffsetY = focus.y - height / 2;
  const zoomRatio = zoom / previousState.zoom;

  return clampMapPan(
    {
      ...previousState,
      zoom,
      panX: focusOffsetX - (focusOffsetX - previousState.panX) * zoomRatio,
      panY: focusOffsetY - (focusOffsetY - previousState.panY) * zoomRatio
    },
    bounds,
    limits
  );
}

export function shouldPreventMapWheelDefault(deltaY: number): boolean {
  return hasUsableWheelDelta(deltaY);
}

export function applyWheelZoomToMapView(
  state: MapViewportState,
  deltaY: number,
  focusPoint: MapViewportScreenPoint,
  bounds: MapPanBounds,
  limits: MapZoomLimits = ROUTE_RUNNER_MAP_ZOOM_LIMITS
): MapViewportState {
  if (!shouldPreventMapWheelDefault(deltaY)) {
    return clampMapPan(state, bounds, limits);
  }

  const ratio = Math.exp(-deltaY * safeWheelSensitivity(limits));
  const zoom = multiplyMapZoom(state.zoom, ratio, limits);

  return zoomMapViewAroundPoint(state, zoom, focusPoint, bounds, limits);
}

export function createMapPinchGesture(
  state: MapViewportState,
  pointers: readonly [MapPinchPointer, MapPinchPointer],
  limits: MapZoomLimits = ROUTE_RUNNER_MAP_ZOOM_LIMITS
): MapPinchGesture | null {
  const startDistance = pinchDistance(pointers);

  if (startDistance <= ZOOM_EPSILON) {
    return null;
  }

  return {
    startDistance,
    startMidpoint: pinchMidpoint(pointers),
    startState: {
      ...state,
      zoom: clampMapZoom(state.zoom, limits)
    }
  };
}

export function applyPinchZoomToMapView(
  gesture: MapPinchGesture,
  pointers: readonly [MapPinchPointer, MapPinchPointer],
  bounds: MapPanBounds,
  limits: MapZoomLimits = ROUTE_RUNNER_MAP_ZOOM_LIMITS
): MapViewportState {
  const currentDistance = pinchDistance(pointers);

  if (currentDistance <= ZOOM_EPSILON) {
    return clampMapPan(gesture.startState, bounds, limits);
  }

  const currentMidpoint = pinchMidpoint(pointers);
  const zoomed = zoomMapViewAroundPoint(
    gesture.startState,
    gesture.startState.zoom * (currentDistance / gesture.startDistance),
    gesture.startMidpoint,
    bounds,
    limits
  );

  return applyPanToMapView(
    zoomed,
    {
      deltaX: currentMidpoint.x - gesture.startMidpoint.x,
      deltaY: currentMidpoint.y - gesture.startMidpoint.y
    },
    bounds,
    limits
  );
}

export function createDefaultMapScrollLockState(): MapScrollLockState {
  return {
    pointerInsideMap: false
  };
}

export function enterMapScrollLockState(state: MapScrollLockState): MapScrollLockState {
  return state.pointerInsideMap
    ? state
    : {
        pointerInsideMap: true
      };
}

export function leaveMapScrollLockState(state: MapScrollLockState): MapScrollLockState {
  return state.pointerInsideMap
    ? {
        pointerInsideMap: false
      }
    : state;
}

export function updateMapScrollLockForOutsidePointerDown(
  state: MapScrollLockState,
  pointerDownInsideMap: boolean
): MapScrollLockState {
  return pointerDownInsideMap ? state : leaveMapScrollLockState(state);
}

export function shouldPreventWheelPageScrollOverMap(
  wheel: number | MapWheelInput,
  state: MapScrollLockState = {
    pointerInsideMap: true
  }
): boolean {
  const hasWheelDelta =
    typeof wheel === "number"
      ? hasUsableWheelDelta(wheel)
      : hasUsableWheelDelta(wheel.deltaY) || hasUsableWheelDelta(wheel.deltaX);

  return state.pointerInsideMap && hasWheelDelta;
}

export function resetMapViewport(limits: MapZoomLimits = ROUTE_RUNNER_MAP_ZOOM_LIMITS): MapViewportState {
  return createDefaultMapViewportState(limits);
}

export const resetMapViewZoom = resetMapViewport;

export function routeRunnerMapZoomLimitsForViewport(input: {
  studentBeta: boolean;
  viewportWidth: number | null | undefined;
}): MapZoomLimits {
  const viewportWidth = input.viewportWidth;

  if (
    input.studentBeta &&
    Number.isFinite(viewportWidth) &&
    (viewportWidth as number) <= ROUTE_RUNNER_PHONE_VIEWPORT_MAX_WIDTH_PX
  ) {
    return ROUTE_RUNNER_PHONE_MAP_ZOOM_LIMITS;
  }

  return ROUTE_RUNNER_MAP_ZOOM_LIMITS;
}

export function setMapInteractionMode(state: MapViewportState, interactionMode: MapInteractionMode): MapViewportState {
  return {
    ...state,
    interactionMode
  };
}

export function canDrawInMapInteractionMode(state: Pick<MapViewportState, "interactionMode">): boolean {
  return state.interactionMode === "draw";
}

export function canPanInMapInteractionMode(state: Pick<MapViewportState, "interactionMode">): boolean {
  return state.interactionMode === "pan";
}

export function isMiddleButtonMapPanPointer(input: MapPointerInput): boolean {
  return isMouseLikePointer(input) && input.button === MIDDLE_MOUSE_BUTTON;
}

export function isMiddleButtonMapPanActive(input: Pick<MapPointerInput, "buttons" | "pointerType">): boolean {
  return isMouseLikePointer(input) && Boolean((input.buttons ?? 0) & MIDDLE_MOUSE_BUTTONS_MASK);
}

export function canStartDrawingWithMapPointer(input: MapPointerInput): boolean {
  return !isMiddleButtonMapPanPointer(input) && (!isMouseLikePointer(input) || input.button === 0);
}

export function trySetMapPointerCapture(target: MapPointerCaptureTarget | null, pointerId: number): boolean {
  if (!target?.isConnected || typeof target.setPointerCapture !== "function" || !Number.isFinite(pointerId)) {
    return false;
  }

  try {
    target.setPointerCapture(pointerId);
    return true;
  } catch {
    return false;
  }
}

export function tryReleaseMapPointerCapture(target: MapPointerCaptureTarget | null, pointerId: number): boolean {
  if (
    !target?.isConnected ||
    typeof target.hasPointerCapture !== "function" ||
    typeof target.releasePointerCapture !== "function" ||
    !Number.isFinite(pointerId)
  ) {
    return false;
  }

  try {
    if (!target.hasPointerCapture(pointerId)) {
      return false;
    }

    target.releasePointerCapture(pointerId);
    return true;
  } catch {
    return false;
  }
}

export function setMapPanMode(state: MapViewportState, isPanModeEnabled: boolean): MapViewportState {
  return setMapInteractionMode(state, isPanModeEnabled ? "pan" : "draw");
}

export function toggleMapPanMode(state: MapViewportState): MapViewportState {
  return setMapPanMode(state, state.interactionMode !== "pan");
}

export function applyPanToMapView(
  state: MapViewportState,
  delta: PanDelta,
  bounds: MapPanBounds,
  limits: MapZoomLimits = ROUTE_RUNNER_MAP_ZOOM_LIMITS
): MapViewportState {
  return clampMapPan(
    {
      ...state,
      panX: state.panX + delta.deltaX,
      panY: state.panY + delta.deltaY
    },
    bounds,
    limits
  );
}

export function canZoomInMapView(
  state: MapViewportState,
  limits: MapZoomLimits = ROUTE_RUNNER_MAP_ZOOM_LIMITS
): boolean {
  return state.zoom < limits.maxZoom - ZOOM_EPSILON;
}

export function canZoomOutMapView(
  state: MapViewportState,
  limits: MapZoomLimits = ROUTE_RUNNER_MAP_ZOOM_LIMITS
): boolean {
  return state.zoom > limits.minZoom + ZOOM_EPSILON;
}

export function buildZoomedMapViewport(
  baseViewport: ScreenMapViewport,
  state: MapViewportState,
  limits: MapZoomLimits = ROUTE_RUNNER_MAP_ZOOM_LIMITS
): ScreenMapViewport {
  const clampedState = clampMapPan(state, baseViewport, limits);
  const zoom = clampedState.zoom;
  const viewportWidth = safeAxisSize(baseViewport.width);
  const viewportHeight = safeAxisSize(baseViewport.height);
  const mapBounds = {
    minX: safeCoordinate(baseViewport.mapBounds.minX),
    minY: safeCoordinate(baseViewport.mapBounds.minY),
    maxX: safeCoordinate(baseViewport.mapBounds.maxX, safeCoordinate(baseViewport.mapBounds.minX)),
    maxY: safeCoordinate(baseViewport.mapBounds.maxY, safeCoordinate(baseViewport.mapBounds.minY))
  };
  const mapWidth = Math.max(0, mapBounds.maxX - mapBounds.minX);
  const mapHeight = Math.max(0, mapBounds.maxY - mapBounds.minY);

  if (viewportWidth === 0 || viewportHeight === 0 || mapWidth === 0 || mapHeight === 0) {
    return {
      width: viewportWidth,
      height: viewportHeight,
      mapBounds
    };
  }

  const centerX = (mapBounds.minX + mapBounds.maxX) / 2;
  const centerY = (mapBounds.minY + mapBounds.maxY) / 2;
  const visualZoom = displayedMapZoomToInternalScale(zoom, limits);
  const halfWidth = mapWidth / 2 / visualZoom;
  const halfHeight = mapHeight / 2 / visualZoom;
  const mapUnitsPerScreenX = (halfWidth * 2) / viewportWidth;
  const mapUnitsPerScreenY = (halfHeight * 2) / viewportHeight;
  const panMapX = clampedState.panX * mapUnitsPerScreenX;
  const panMapY = clampedState.panY * mapUnitsPerScreenY;

  return {
    width: viewportWidth,
    height: viewportHeight,
    mapBounds: {
      minX: centerX - halfWidth - panMapX,
      minY: centerY - halfHeight - panMapY,
      maxX: centerX + halfWidth - panMapX,
      maxY: centerY + halfHeight - panMapY
    }
  };
}
