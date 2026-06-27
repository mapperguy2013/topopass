import {
  createDrawnRouteTrace,
  simplifyDrawnRouteTrace,
  validateDrawnRouteGesture,
  type DrawnRouteGestureValidation,
  type DrawnRouteTrace
} from "./drawingTrace.ts";
import { runRouteExercise, type RunRouteExerciseResult } from "./exerciseRunner.ts";
import { matchSnappedRouteToSelection, type RouteMatchingResult } from "./routeMatching.ts";
import {
  snapDrawnRouteToRoads,
  type RouteSnappingDiagnostic,
  type SnappedRoutePoint,
  type SnappedRouteTraceResult
} from "./routeSnapping.ts";
import type { MapDefinition, RouteExercise } from "./types.ts";

export type DrawnRoutePipelineStatus =
  | "scored"
  | "empty"
  | "insufficient_points"
  | "snapping_failed"
  | "matching_failed"
  | "exercise_failed";

export type DrawnRoutePipelineWarningSource = "pipeline" | "snapping" | "matching" | "exercise";

export type DrawnRoutePipelineWarningSeverity = "info" | "warning" | "error";

export type DrawnRoutePipelineWarning = {
  source: DrawnRoutePipelineWarningSource;
  code: string;
  severity: DrawnRoutePipelineWarningSeverity;
  message: string;
  pointIndex?: number;
  roadId?: string;
  fromRoadId?: string;
  toRoadId?: string;
};

export type RunDrawnRoutePipelineOptions = {
  simplifyTolerance?: number;
  minimumPointCount?: number;
  minimumGesturePointCount?: number;
  minimumGestureDistance?: number;
  maximumSnapDistance?: number;
  maxCandidatesPerPoint?: number;
  passThresholdPercent?: number;
};

export type RunDrawnRoutePipelineInput = {
  map: MapDefinition;
  exercises: RouteExercise[];
  exerciseId: string;
  drawnTrace: DrawnRouteTrace;
  options?: RunDrawnRoutePipelineOptions;
};

export type DrawnRoutePipelineResult = {
  status: DrawnRoutePipelineStatus;
  simplifiedTrace: DrawnRouteTrace;
  snappedRoute: SnappedRouteTraceResult | null;
  snappedPoints: SnappedRoutePoint[];
  matchResult: RouteMatchingResult | null;
  exerciseResult: RunRouteExerciseResult | null;
  warnings: DrawnRoutePipelineWarning[];
};

const DEFAULT_SIMPLIFY_TOLERANCE = 4;
const DEFAULT_MINIMUM_POINT_COUNT = 2;
const DEFAULT_MAXIMUM_SNAP_DISTANCE = 24;

function pipelineWarning(warning: DrawnRoutePipelineWarning): DrawnRoutePipelineWarning {
  return warning;
}

function warningFromSnappingDiagnostic(diagnostic: RouteSnappingDiagnostic): DrawnRoutePipelineWarning {
  return pipelineWarning({
    source: "snapping",
    code: diagnostic.code,
    severity: diagnostic.code === "trace_too_short" ? "info" : "warning",
    message: diagnostic.message,
    pointIndex: diagnostic.pointIndex,
    fromRoadId: diagnostic.fromRoadId,
    toRoadId: diagnostic.toRoadId
  });
}

function warningFromMatchingDiagnostic(diagnostic: RouteMatchingResult["diagnostics"][number]): DrawnRoutePipelineWarning {
  return pipelineWarning({
    source: "matching",
    code: diagnostic.code,
    severity: diagnostic.severity,
    message: diagnostic.message,
    pointIndex: diagnostic.pointIndex,
    roadId: diagnostic.roadId,
    fromRoadId: diagnostic.fromRoadId,
    toRoadId: diagnostic.toRoadId
  });
}

function result(input: {
  status: DrawnRoutePipelineStatus;
  simplifiedTrace: DrawnRouteTrace;
  snappedRoute?: SnappedRouteTraceResult | null;
  matchResult?: RouteMatchingResult | null;
  exerciseResult?: RunRouteExerciseResult | null;
  warnings?: DrawnRoutePipelineWarning[];
}): DrawnRoutePipelineResult {
  return {
    status: input.status,
    simplifiedTrace: createDrawnRouteTrace(input.simplifiedTrace.points),
    snappedRoute: input.snappedRoute ?? null,
    snappedPoints: input.snappedRoute?.snappedPoints.map((point) => ({
      ...point,
      originalPoint: { ...point.originalPoint },
      snappedPoint: { ...point.snappedPoint },
      candidates: point.candidates.map((candidate) => ({
        ...candidate,
        snappedPoint: { ...candidate.snappedPoint }
      }))
    })) ?? [],
    matchResult: input.matchResult ?? null,
    exerciseResult: input.exerciseResult ?? null,
    warnings: input.warnings ?? []
  };
}

export function createInsufficientDrawnGesturePipelineResult(input: {
  drawnTrace: DrawnRouteTrace;
  validation: DrawnRouteGestureValidation;
}): DrawnRoutePipelineResult {
  const code =
    input.validation.failureReason === "not_enough_movement" ? "insufficient_movement" : "insufficient_raw_points";
  const message =
    input.validation.failureReason === "not_enough_movement"
      ? `Tap ignored: not enough movement. Draw at least ${input.validation.minimumTotalDistance} map units before scoring.`
      : `Draw at least ${input.validation.minimumRawPointCount} route points before scoring.`;

  return result({
    status: "insufficient_points",
    simplifiedTrace: createDrawnRouteTrace(input.drawnTrace.points),
    warnings: [
      pipelineWarning({
        source: "pipeline",
        code,
        severity: "info",
        message
      })
    ]
  });
}

export function runDrawnRoutePipeline(input: RunDrawnRoutePipelineInput): DrawnRoutePipelineResult {
  const minimumPointCount = input.options?.minimumPointCount ?? DEFAULT_MINIMUM_POINT_COUNT;
  const rawTrace = createDrawnRouteTrace(input.drawnTrace.points);

  if (rawTrace.points.length === 0) {
    return result({
      status: "empty",
      simplifiedTrace: rawTrace,
      warnings: [
        pipelineWarning({
          source: "pipeline",
          code: "empty_trace",
          severity: "info",
          message: "Draw a route before running the route pipeline."
        })
      ]
    });
  }

  const gestureValidation = validateDrawnRouteGesture(rawTrace, {
    minimumRawPointCount: input.options?.minimumGesturePointCount,
    minimumTotalDistance: input.options?.minimumGestureDistance
  });

  if (!gestureValidation.isMeaningful) {
    return createInsufficientDrawnGesturePipelineResult({
      drawnTrace: rawTrace,
      validation: gestureValidation
    });
  }

  if (rawTrace.points.length < minimumPointCount) {
    return result({
      status: "insufficient_points",
      simplifiedTrace: rawTrace,
      warnings: [
        pipelineWarning({
          source: "pipeline",
          code: "insufficient_points",
          severity: "info",
          message: `Draw at least ${minimumPointCount} points before running the route pipeline.`
        })
      ]
    });
  }

  const simplifiedTrace = simplifyDrawnRouteTrace(
    rawTrace,
    input.options?.simplifyTolerance ?? DEFAULT_SIMPLIFY_TOLERANCE
  );

  if (simplifiedTrace.points.length < minimumPointCount) {
    return result({
      status: "insufficient_points",
      simplifiedTrace,
      warnings: [
        pipelineWarning({
          source: "pipeline",
          code: "insufficient_points_after_simplification",
          severity: "info",
          message: `Route simplification left fewer than ${minimumPointCount} points to process.`
        })
      ]
    });
  }

  const snappedRoute = snapDrawnRouteToRoads({
    map: input.map,
    points: simplifiedTrace.points,
    snapTolerance: input.options?.maximumSnapDistance ?? DEFAULT_MAXIMUM_SNAP_DISTANCE,
    maxCandidatesPerPoint: input.options?.maxCandidatesPerPoint
  });
  const snappingWarnings = snappedRoute.diagnostics.map(warningFromSnappingDiagnostic);

  if (!snappedRoute.isValidTrace || snappedRoute.hasOffRoadPoints) {
    return result({
      status: snappedRoute.isValidTrace ? "snapping_failed" : "insufficient_points",
      simplifiedTrace,
      snappedRoute,
      warnings:
        snappingWarnings.length > 0
          ? snappingWarnings
          : [
              pipelineWarning({
                source: "snapping",
                code: "snapping_failed",
                severity: "warning",
                message: "The drawn route could not be snapped to map roads."
              })
            ]
    });
  }

  const matchResult = matchSnappedRouteToSelection({
    map: input.map,
    snappedRoute,
    options: {
      minimumSnappedPoints: minimumPointCount
    }
  });
  const matchingWarnings = matchResult.diagnostics.map(warningFromMatchingDiagnostic);

  if (matchResult.status !== "matched" || !matchResult.isReadyForRunRouteExercise) {
    return result({
      status: "matching_failed",
      simplifiedTrace,
      snappedRoute,
      matchResult,
      warnings: [...snappingWarnings, ...matchingWarnings]
    });
  }

  try {
    const exerciseResult = runRouteExercise({
      map: input.map,
      exercises: input.exercises,
      exerciseId: input.exerciseId,
      userRoute: matchResult.selection,
      passThresholdPercent: input.options?.passThresholdPercent
    });

    return result({
      status: "scored",
      simplifiedTrace,
      snappedRoute,
      matchResult,
      exerciseResult,
      warnings: [...snappingWarnings, ...matchingWarnings]
    });
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : "Route exercise scoring failed.";

    return result({
      status: "exercise_failed",
      simplifiedTrace,
      snappedRoute,
      matchResult,
      warnings: [
        ...snappingWarnings,
        ...matchingWarnings,
        pipelineWarning({
          source: "exercise",
          code: "exercise_failed",
          severity: "error",
          message
        })
      ]
    });
  }
}
