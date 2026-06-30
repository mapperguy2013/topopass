import { simplifyRouteTrace, type BoundingBox, type Vec2 } from "./geometry.ts";

export type DrawnRouteTrace = {
  points: Vec2[];
};

export type DrawnRouteStroke = {
  points: Vec2[];
};

export type DrawnRouteDraft = {
  strokes: DrawnRouteStroke[];
  activeStrokeIndex: number | null;
};

export type DrawnRouteGestureFailureReason = "not_enough_points" | "not_enough_movement";

export type DrawnRouteGestureValidation = {
  isMeaningful: boolean;
  rawPointCount: number;
  totalDistance: number;
  minimumRawPointCount: number;
  minimumTotalDistance: number;
  failureReason?: DrawnRouteGestureFailureReason;
};

export type DrawnRouteGestureValidationOptions = {
  minimumRawPointCount?: number;
  minimumTotalDistance?: number;
};

export type ScreenMapViewport = {
  width: number;
  height: number;
  mapBounds: BoundingBox;
};

export const DEFAULT_MINIMUM_DRAWN_GESTURE_POINT_COUNT = 3;
export const DEFAULT_MINIMUM_DRAWN_GESTURE_DISTANCE = 10;

function clonePoint(point: Vec2): Vec2 {
  return { ...point };
}

function cloneStroke(stroke: DrawnRouteStroke): DrawnRouteStroke {
  return {
    points: stroke.points.map(clonePoint)
  };
}

function cloneDraft(draft: DrawnRouteDraft): DrawnRouteDraft {
  return {
    strokes: draft.strokes.map(cloneStroke),
    activeStrokeIndex: draft.activeStrokeIndex
  };
}

export function createDrawnRouteTrace(points: readonly Vec2[] = []): DrawnRouteTrace {
  return {
    points: points.map(clonePoint)
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
    points: [...trace.points.map(clonePoint), clonePoint(point)]
  };
}

export function clearDrawnRouteTrace(): DrawnRouteTrace {
  return createDrawnRouteTrace();
}

export function createEmptyRouteDraft(strokes: readonly (readonly Vec2[])[] = []): DrawnRouteDraft {
  return {
    strokes: strokes.map((strokePoints) => ({
      points: strokePoints.map(clonePoint)
    })),
    activeStrokeIndex: null
  };
}

export function startRouteStroke(draft: DrawnRouteDraft, point: Vec2): DrawnRouteDraft {
  const strokes = [...draft.strokes.map(cloneStroke), { points: [clonePoint(point)] }];

  return {
    strokes,
    activeStrokeIndex: strokes.length - 1
  };
}

export function appendRouteDraftPoint(
  draft: DrawnRouteDraft,
  point: Vec2,
  minimumPointDistance = 0
): DrawnRouteDraft {
  if (draft.activeStrokeIndex === null || !draft.strokes[draft.activeStrokeIndex]) {
    return cloneDraft(draft);
  }

  const strokes = draft.strokes.map(cloneStroke);
  const activeStroke = strokes[draft.activeStrokeIndex];
  const previousPoint = activeStroke.points[activeStroke.points.length - 1];

  if (
    previousPoint &&
    minimumPointDistance > 0 &&
    Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y) < minimumPointDistance
  ) {
    return {
      strokes,
      activeStrokeIndex: draft.activeStrokeIndex
    };
  }

  activeStroke.points = [...activeStroke.points, clonePoint(point)];

  return {
    strokes,
    activeStrokeIndex: draft.activeStrokeIndex
  };
}

export function finishRouteStroke(draft: DrawnRouteDraft): DrawnRouteDraft {
  return {
    strokes: draft.strokes.map(cloneStroke),
    activeStrokeIndex: null
  };
}

export function undoLastRouteStroke(draft: DrawnRouteDraft): DrawnRouteDraft {
  if (draft.strokes.length === 0) {
    return cloneDraft(draft);
  }

  return {
    strokes: draft.strokes.slice(0, -1).map(cloneStroke),
    activeStrokeIndex: null
  };
}

export function clearRouteDraft(): DrawnRouteDraft {
  return createEmptyRouteDraft();
}

export function getFlattenedRouteDraftPoints(draft: DrawnRouteDraft): Vec2[] {
  return draft.strokes.flatMap((stroke) => stroke.points.map(clonePoint));
}

export function hasUndoableRouteStroke(draft: DrawnRouteDraft): boolean {
  return draft.strokes.length > 0;
}

export function routeDraftToDrawnRouteTrace(draft: DrawnRouteDraft): DrawnRouteTrace {
  return createDrawnRouteTrace(getFlattenedRouteDraftPoints(draft));
}

export function drawnRouteTraceDistance(trace: DrawnRouteTrace): number {
  let totalDistance = 0;

  for (let index = 1; index < trace.points.length; index += 1) {
    const previousPoint = trace.points[index - 1];
    const point = trace.points[index];

    totalDistance += Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y);
  }

  return totalDistance;
}

export function validateDrawnRouteGesture(
  trace: DrawnRouteTrace,
  options: DrawnRouteGestureValidationOptions = {}
): DrawnRouteGestureValidation {
  const minimumRawPointCount = options.minimumRawPointCount ?? DEFAULT_MINIMUM_DRAWN_GESTURE_POINT_COUNT;
  const minimumTotalDistance = options.minimumTotalDistance ?? DEFAULT_MINIMUM_DRAWN_GESTURE_DISTANCE;
  const rawPointCount = trace.points.length;
  const totalDistance = drawnRouteTraceDistance(trace);

  if (rawPointCount < minimumRawPointCount) {
    return {
      isMeaningful: false,
      rawPointCount,
      totalDistance,
      minimumRawPointCount,
      minimumTotalDistance,
      failureReason: "not_enough_points"
    };
  }

  if (totalDistance < minimumTotalDistance) {
    return {
      isMeaningful: false,
      rawPointCount,
      totalDistance,
      minimumRawPointCount,
      minimumTotalDistance,
      failureReason: "not_enough_movement"
    };
  }

  return {
    isMeaningful: true,
    rawPointCount,
    totalDistance,
    minimumRawPointCount,
    minimumTotalDistance
  };
}

export function isMeaningfulDrawnGesture(
  trace: DrawnRouteTrace,
  options: DrawnRouteGestureValidationOptions = {}
): boolean {
  return validateDrawnRouteGesture(trace, options).isMeaningful;
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
