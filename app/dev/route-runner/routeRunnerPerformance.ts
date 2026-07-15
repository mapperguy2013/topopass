import {
  buildMapGraph,
  createDrawnRouteTrace,
  simplifyDrawnRouteTrace,
  type DrawnRoutePipelineResult,
  type DrawnRouteTrace,
  type MapDefinition,
  type MapGraph,
  type Vec2
} from "../../../lib/map-engine/index.ts";
import {
  ROUTE_RUNNER_PHONE_MAP_CANVAS_HEIGHT,
  ROUTE_RUNNER_PHONE_MAP_CANVAS_WIDTH
} from "./mapViewport.ts";

export type RouteRunnerMapGraphMemo = {
  getGraph(map: MapDefinition): MapGraph;
  clear(): void;
  buildCount(): number;
};

export type RouteTracePerformanceOptions = {
  maxPointCount?: number;
  simplifyTolerance?: number;
};

export type RouteTracePerformanceResult = {
  trace: DrawnRouteTrace;
  originalPointCount: number;
  pointCount: number;
  maxPointCount: number;
  wasReduced: boolean;
};

const DEFAULT_MAX_PIPELINE_POINT_COUNT = 1200;
const DEFAULT_LARGE_TRACE_SIMPLIFY_TOLERANCE = 2;
const ROUTE_RUNNER_DEV_CANVAS_WIDTH = 1120;
const ROUTE_RUNNER_DEV_CANVAS_HEIGHT = 760;
const ROUTE_RUNNER_STUDENT_CANVAS_WIDTH = 1920;
const ROUTE_RUNNER_STUDENT_CANVAS_HEIGHT = 912;

export const ROUTE_RUNNER_MAX_CANVAS_PIXEL_COUNT = 2_000_000;
export const ROUTE_RUNNER_MAX_REPORTED_DEVICE_PIXEL_RATIO = 3;

export type RouteRunnerCanvasBackingStore = {
  profile: "development" | "student" | "student-phone";
  width: number;
  height: number;
  pixelCount: number;
  estimatedRgbaBytes: number;
};

export type RouteRunnerCanvasBudgetAssessment = RouteRunnerCanvasBackingStore & {
  reportedDevicePixelRatio: number;
  boundedDevicePixelRatio: number;
  allocationChangesWithDevicePixelRatio: false;
  withinPixelBudget: boolean;
};

export function getRouteRunnerCanvasBackingStore(input: {
  studentBeta: boolean;
  phone: boolean;
}): RouteRunnerCanvasBackingStore {
  const profile = input.studentBeta ? (input.phone ? "student-phone" : "student") : "development";
  const width =
    profile === "student-phone"
      ? ROUTE_RUNNER_PHONE_MAP_CANVAS_WIDTH
      : profile === "student"
        ? ROUTE_RUNNER_STUDENT_CANVAS_WIDTH
        : ROUTE_RUNNER_DEV_CANVAS_WIDTH;
  const height =
    profile === "student-phone"
      ? ROUTE_RUNNER_PHONE_MAP_CANVAS_HEIGHT
      : profile === "student"
        ? ROUTE_RUNNER_STUDENT_CANVAS_HEIGHT
        : ROUTE_RUNNER_DEV_CANVAS_HEIGHT;
  const pixelCount = width * height;

  return {
    profile,
    width,
    height,
    pixelCount,
    estimatedRgbaBytes: pixelCount * 4
  };
}

export function assessRouteRunnerCanvasBudget(input: {
  studentBeta: boolean;
  phone: boolean;
  devicePixelRatio: number;
}): RouteRunnerCanvasBudgetAssessment {
  const backingStore = getRouteRunnerCanvasBackingStore(input);
  const reportedDevicePixelRatio = Number.isFinite(input.devicePixelRatio)
    ? Math.max(1, input.devicePixelRatio)
    : 1;

  return {
    ...backingStore,
    reportedDevicePixelRatio,
    boundedDevicePixelRatio: Math.min(reportedDevicePixelRatio, ROUTE_RUNNER_MAX_REPORTED_DEVICE_PIXEL_RATIO),
    allocationChangesWithDevicePixelRatio: false,
    withinPixelBudget: backingStore.pixelCount <= ROUTE_RUNNER_MAX_CANVAS_PIXEL_COUNT
  };
}

export function createRouteRunnerMapGraphMemo(
  graphBuilder: (map: MapDefinition) => MapGraph = buildMapGraph
): RouteRunnerMapGraphMemo {
  let cachedMap: MapDefinition | null = null;
  let cachedGraph: MapGraph | null = null;
  let builds = 0;

  return {
    getGraph(map) {
      if (map === cachedMap && cachedGraph) {
        return cachedGraph;
      }

      cachedMap = map;
      cachedGraph = graphBuilder(map);
      builds += 1;

      return cachedGraph;
    },
    clear() {
      cachedMap = null;
      cachedGraph = null;
      builds = 0;
    },
    buildCount() {
      return builds;
    }
  };
}

function pointAt(source: readonly Vec2[], index: number): Vec2 {
  const point = source[Math.max(0, Math.min(source.length - 1, index))];

  return { x: point?.x ?? 0, y: point?.y ?? 0 };
}

function downsamplePoints(points: readonly Vec2[], maxPointCount: number): Vec2[] {
  if (points.length <= maxPointCount) {
    return points.map((point) => ({ ...point }));
  }

  if (maxPointCount <= 1) {
    return points.length > 0 ? [pointAt(points, 0)] : [];
  }

  const lastIndex = points.length - 1;
  const output: Vec2[] = [];

  for (let index = 0; index < maxPointCount; index += 1) {
    output.push(pointAt(points, Math.round((index / (maxPointCount - 1)) * lastIndex)));
  }

  return output;
}

export function prepareTraceForRoutePipeline(
  trace: DrawnRouteTrace,
  options: RouteTracePerformanceOptions = {}
): RouteTracePerformanceResult {
  const maxPointCount = Math.max(2, Math.floor(options.maxPointCount ?? DEFAULT_MAX_PIPELINE_POINT_COUNT));
  const originalPointCount = trace.points.length;

  if (originalPointCount <= maxPointCount) {
    return {
      trace: createDrawnRouteTrace(trace.points),
      originalPointCount,
      pointCount: originalPointCount,
      maxPointCount,
      wasReduced: false
    };
  }

  const simplifiedTrace = simplifyDrawnRouteTrace(
    trace,
    options.simplifyTolerance ?? DEFAULT_LARGE_TRACE_SIMPLIFY_TOLERANCE
  );
  const budgetedPoints =
    simplifiedTrace.points.length <= maxPointCount
      ? simplifiedTrace.points
      : downsamplePoints(simplifiedTrace.points, maxPointCount);

  return {
    trace: createDrawnRouteTrace(budgetedPoints),
    originalPointCount,
    pointCount: budgetedPoints.length,
    maxPointCount,
    wasReduced: true
  };
}

export function createActiveDrawingPipelineResult(drawnTrace: DrawnRouteTrace): DrawnRoutePipelineResult {
  return {
    status: "empty",
    simplifiedTrace: createDrawnRouteTrace(drawnTrace.points),
    snappedRoute: null,
    snappedPoints: [],
    matchResult: null,
    exerciseResult: null,
    warnings: []
  };
}
