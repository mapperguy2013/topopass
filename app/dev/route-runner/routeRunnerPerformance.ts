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
