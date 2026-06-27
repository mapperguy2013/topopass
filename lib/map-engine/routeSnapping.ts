import { buildMapGraph } from "./graph.ts";
import {
  buildRoadSpatialIndex,
  findCandidateRoadsForPoint,
  type RoadCandidate,
  type Vec2
} from "./geometry.ts";
import type { MapDefinition } from "./types.ts";

export type CandidateRoadMatch = {
  roadId: string;
  directedEdgeId?: string | null;
  snappedPoint: Vec2;
  distanceFromRoad: number;
  confidence: number;
};

export type SnappedRoutePoint = {
  originalPoint: Vec2;
  snappedPoint: Vec2;
  roadId: string | null;
  directedEdgeId?: string | null;
  distanceFromRoad: number;
  confidence: number;
  candidates: CandidateRoadMatch[];
};

export type RouteSnappingDiagnosticCode = "trace_too_short" | "off_road_points";

export type RouteSnappingDiagnostic = {
  code: RouteSnappingDiagnosticCode;
  message: string;
  pointIndex?: number;
};

export type SnapDrawnRouteToRoadsInput = {
  points: readonly Vec2[];
  map: MapDefinition;
  snapTolerance?: number;
  maxCandidatesPerPoint?: number;
};

export type SnappedRouteTraceResult = {
  isValidTrace: boolean;
  hasOffRoadPoints: boolean;
  snapTolerance: number;
  snappedPoints: SnappedRoutePoint[];
  diagnostics: RouteSnappingDiagnostic[];
};

const DEFAULT_SNAP_TOLERANCE = 24;
const DEFAULT_MAX_CANDIDATES_PER_POINT = 3;

function roundConfidence(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function confidenceForDistance(distanceFromRoad: number, snapTolerance: number): number {
  if (!Number.isFinite(distanceFromRoad) || snapTolerance <= 0) {
    return 0;
  }

  return roundConfidence(Math.max(0, Math.min(1, 1 - distanceFromRoad / snapTolerance)));
}

function directedEdgeIdForRoad(map: MapDefinition, roadId: string): string | null {
  const graph = buildMapGraph(map);

  return graph.edges.find((edge) => edge.roadId === roadId)?.id ?? null;
}

function candidateToMatch(map: MapDefinition, candidate: RoadCandidate, snapTolerance: number): CandidateRoadMatch {
  return {
    roadId: candidate.roadId,
    directedEdgeId: directedEdgeIdForRoad(map, candidate.roadId),
    snappedPoint: { ...candidate.projection.point },
    distanceFromRoad: candidate.distanceFromRoad,
    confidence: confidenceForDistance(candidate.distanceFromRoad, snapTolerance)
  };
}

export function snapDrawnRouteToRoads(input: SnapDrawnRouteToRoadsInput): SnappedRouteTraceResult {
  const snapTolerance = input.snapTolerance ?? DEFAULT_SNAP_TOLERANCE;
  const maxCandidatesPerPoint = input.maxCandidatesPerPoint ?? DEFAULT_MAX_CANDIDATES_PER_POINT;
  const points = input.points.map((point) => ({ ...point }));
  const diagnostics: RouteSnappingDiagnostic[] = [];

  if (points.length < 2) {
    return {
      isValidTrace: false,
      hasOffRoadPoints: false,
      snapTolerance,
      snappedPoints: [],
      diagnostics: [
        {
          code: "trace_too_short",
          message: "Draw at least two points before route snapping can be previewed."
        }
      ]
    };
  }

  const index = buildRoadSpatialIndex(input.map);
  const snappedPoints = points.map<SnappedRoutePoint>((point, pointIndex) => {
    const candidates = findCandidateRoadsForPoint({
      point,
      index,
      tolerance: snapTolerance,
      maxCandidates: maxCandidatesPerPoint
    }).map((candidate) => candidateToMatch(input.map, candidate, snapTolerance));
    const bestCandidate = candidates[0];

    if (!bestCandidate) {
      diagnostics.push({
        code: "off_road_points",
        message: "A drawn point is outside the road snap tolerance.",
        pointIndex
      });

      return {
        originalPoint: point,
        snappedPoint: { ...point },
        roadId: null,
        directedEdgeId: null,
        distanceFromRoad: Number.POSITIVE_INFINITY,
        confidence: 0,
        candidates
      };
    }

    return {
      originalPoint: point,
      snappedPoint: { ...bestCandidate.snappedPoint },
      roadId: bestCandidate.roadId,
      directedEdgeId: bestCandidate.directedEdgeId ?? null,
      distanceFromRoad: bestCandidate.distanceFromRoad,
      confidence: bestCandidate.confidence,
      candidates
    };
  });

  return {
    isValidTrace: true,
    hasOffRoadPoints: diagnostics.some((diagnostic) => diagnostic.code === "off_road_points"),
    snapTolerance,
    snappedPoints,
    diagnostics
  };
}
