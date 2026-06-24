import type { RouteMapPoint } from "@/src/data/maps/routeTypes";

export const MIN_ROUTE_POINTS_FOR_SUBMIT = 2;
export const MIN_DRAWING_POINT_DISTANCE = 6;

export function routePointDistance(a: RouteMapPoint, b: RouteMapPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function appendRoutePoint(
  points: RouteMapPoint[],
  nextPoint: RouteMapPoint,
  minimumDistance = MIN_DRAWING_POINT_DISTANCE
) {
  const previousPoint = points.at(-1);

  if (
    previousPoint &&
    routePointDistance(previousPoint, nextPoint) < minimumDistance
  ) {
    return points;
  }

  return [...points, nextPoint];
}

export function undoLastRoutePoint(points: RouteMapPoint[]) {
  return points.slice(0, -1);
}

export function clearRoutePoints(): RouteMapPoint[] {
  return [];
}

export function canSubmitRoute(points: RouteMapPoint[]) {
  return points.length >= MIN_ROUTE_POINTS_FOR_SUBMIT;
}

export function routeDrawingStatusMessage(points: RouteMapPoint[]) {
  if (canSubmitRoute(points)) {
    return `${points.length} route points captured. You can submit, undo, or clear.`;
  }

  if (points.length === 1) {
    return "Keep drawing to add more of the route before submitting.";
  }

  return "Draw at least two points before submitting.";
}
