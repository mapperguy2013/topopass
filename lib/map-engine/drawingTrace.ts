import { simplifyRouteTrace, type BoundingBox, type Vec2 } from "./geometry.ts";

export type DrawnRouteTrace = {
  points: Vec2[];
};

export type ScreenMapViewport = {
  width: number;
  height: number;
  mapBounds: BoundingBox;
};

export function createDrawnRouteTrace(points: readonly Vec2[] = []): DrawnRouteTrace {
  return {
    points: points.map((point) => ({ ...point }))
  };
}

export function appendDrawnRoutePoint(trace: DrawnRouteTrace, point: Vec2, minimumPointDistance = 0): DrawnRouteTrace {
  const previousPoint = trace.points[trace.points.length - 1];

  if (
    previousPoint &&
    minimumPointDistance > 0 &&
    Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y) < minimumPointDistance
  ) {
    return {
      points: trace.points.map((existingPoint) => ({ ...existingPoint }))
    };
  }

  return {
    points: [...trace.points.map((existingPoint) => ({ ...existingPoint })), { ...point }]
  };
}

export function clearDrawnRouteTrace(): DrawnRouteTrace {
  return createDrawnRouteTrace();
}

export function screenToMapPoint(point: Vec2, viewport: ScreenMapViewport): Vec2 {
  const widthRatio = viewport.width === 0 ? 0 : point.x / viewport.width;
  const heightRatio = viewport.height === 0 ? 0 : point.y / viewport.height;

  return {
    x: viewport.mapBounds.minX + (viewport.mapBounds.maxX - viewport.mapBounds.minX) * widthRatio,
    y: viewport.mapBounds.minY + (viewport.mapBounds.maxY - viewport.mapBounds.minY) * heightRatio
  };
}

export function mapToScreenPoint(point: Vec2, viewport: ScreenMapViewport): Vec2 {
  const mapWidth = viewport.mapBounds.maxX - viewport.mapBounds.minX;
  const mapHeight = viewport.mapBounds.maxY - viewport.mapBounds.minY;

  return {
    x: mapWidth === 0 ? 0 : ((point.x - viewport.mapBounds.minX) / mapWidth) * viewport.width,
    y: mapHeight === 0 ? 0 : ((point.y - viewport.mapBounds.minY) / mapHeight) * viewport.height
  };
}

export function simplifyDrawnRouteTrace(trace: DrawnRouteTrace, minimumPointDistance = 4): DrawnRouteTrace {
  return createDrawnRouteTrace(simplifyRouteTrace(trace.points, minimumPointDistance));
}
