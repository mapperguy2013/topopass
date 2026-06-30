import type { ScreenMapViewport } from "../../../lib/map-engine/index.ts";

export type MapInteractionMode = "draw" | "pan";

export type MapViewportState = {
  zoom: number;
  panX: number;
  panY: number;
  interactionMode: MapInteractionMode;
};

export type MapZoomLimits = {
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  step: number;
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

export type MapPointerInput = {
  button: number;
  buttons?: number;
  pointerType?: string;
};

export type MapScrollLockState = {
  pointerInsideMap: boolean;
};

export type MapWheelInput = {
  deltaX?: number;
  deltaY?: number;
};

export const ROUTE_RUNNER_MAP_ZOOM_LIMITS: MapZoomLimits = {
  defaultZoom: 1,
  minZoom: 0.75,
  maxZoom: 10,
  step: 0.25,
  panMargin: 80
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

export function getMapPanLimitsForZoom(
  zoom: number,
  bounds: MapPanBounds,
  limits: MapZoomLimits
): MapPanLimits {
  const clampedZoom = clampMapZoom(zoom, limits);
  const width = safeAxisSize(bounds.width);
  const height = safeAxisSize(bounds.height);

  if (clampedZoom <= 1 || (width === 0 && height === 0)) {
    return {
      maxPanX: 0,
      maxPanY: 0
    };
  }

  return {
    maxPanX: width > 0 ? ((clampedZoom - 1) * width) / 2 + panMarginForAxis(width, limits) : 0,
    maxPanY: height > 0 ? ((clampedZoom - 1) * height) / 2 + panMarginForAxis(height, limits) : 0
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
  const nextState = {
    ...state,
    zoom: clampMapZoom(state.zoom + limits.step, limits)
  };

  return bounds ? clampMapPan(nextState, bounds, limits) : nextState;
}

export function zoomOutMapView(
  state: MapViewportState,
  limits: MapZoomLimits = ROUTE_RUNNER_MAP_ZOOM_LIMITS,
  bounds?: MapPanBounds
): MapViewportState {
  const nextState = {
    ...state,
    zoom: clampMapZoom(state.zoom - limits.step, limits)
  };

  return bounds ? clampMapPan(nextState, bounds, limits) : nextState;
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

  const zoomDirection = deltaY < 0 ? 1 : -1;

  return zoomMapViewAroundPoint(state, state.zoom + limits.step * zoomDirection, focusPoint, bounds, limits);
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
  const halfWidth = mapWidth / 2 / zoom;
  const halfHeight = mapHeight / 2 / zoom;
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
