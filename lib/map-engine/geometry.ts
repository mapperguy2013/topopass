import type { MapDefinition, MapNode, MapRoad } from "./types.ts";

export type Vec2 = {
  x: number;
  y: number;
};

export type BoundingBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type SegmentProjection = {
  point: Vec2;
  distance: number;
  t: number;
};

export type PolylineProjection = SegmentProjection & {
  segmentStartIndex: number;
  segmentEndIndex: number;
};

export type RoadGeometry = {
  roadId: string;
  roadName?: string;
  fromNodeId: string;
  toNodeId: string;
  polyline: Vec2[];
  boundingBox: BoundingBox;
  length: number;
};

export type RoadCandidate = {
  roadId: string;
  roadName?: string;
  projection: PolylineProjection;
  distanceFromRoad: number;
  geometry: RoadGeometry;
};

export type RoadSpatialIndex = {
  mapId: string;
  roads: RoadGeometry[];
};

export type FindCandidateRoadsInput = {
  point: Vec2;
  map?: MapDefinition;
  index?: RoadSpatialIndex;
  tolerance: number;
  maxCandidates?: number;
};

export function distanceBetweenPoints(a: Vec2, b: Vec2): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function projectPointToSegment(point: Vec2, segmentStart: Vec2, segmentEnd: Vec2): SegmentProjection {
  const dx = segmentEnd.x - segmentStart.x;
  const dy = segmentEnd.y - segmentStart.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return {
      point: { ...segmentStart },
      distance: distanceBetweenPoints(point, segmentStart),
      t: 0
    };
  }

  const rawT = ((point.x - segmentStart.x) * dx + (point.y - segmentStart.y) * dy) / lengthSquared;
  const t = Math.max(0, Math.min(1, rawT));
  const projectedPoint = {
    x: segmentStart.x + dx * t,
    y: segmentStart.y + dy * t
  };

  return {
    point: projectedPoint,
    distance: distanceBetweenPoints(point, projectedPoint),
    t
  };
}

export function projectPointToPolyline(point: Vec2, polyline: readonly Vec2[]): PolylineProjection | null {
  if (polyline.length < 2) {
    return null;
  }

  let nearestProjection: PolylineProjection | null = null;

  for (let index = 0; index < polyline.length - 1; index += 1) {
    const projection = projectPointToSegment(point, polyline[index], polyline[index + 1]);
    const polylineProjection: PolylineProjection = {
      ...projection,
      segmentStartIndex: index,
      segmentEndIndex: index + 1
    };

    if (!nearestProjection || polylineProjection.distance < nearestProjection.distance) {
      nearestProjection = polylineProjection;
    }
  }

  return nearestProjection;
}

export function polylineLength(polyline: readonly Vec2[]): number {
  let length = 0;

  for (let index = 0; index < polyline.length - 1; index += 1) {
    length += distanceBetweenPoints(polyline[index], polyline[index + 1]);
  }

  return length;
}

export function calculateHeadingDegrees(from: Vec2, to: Vec2): number {
  const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;

  return (angle + 360) % 360;
}

export function boundingBoxForPoints(points: readonly Vec2[]): BoundingBox {
  if (points.length === 0) {
    throw new Error("Cannot build a bounding box for an empty point list.");
  }

  return points.reduce<BoundingBox>(
    (box, point) => ({
      minX: Math.min(box.minX, point.x),
      minY: Math.min(box.minY, point.y),
      maxX: Math.max(box.maxX, point.x),
      maxY: Math.max(box.maxY, point.y)
    }),
    {
      minX: points[0].x,
      minY: points[0].y,
      maxX: points[0].x,
      maxY: points[0].y
    }
  );
}

export function expandBoundingBox(box: BoundingBox, padding: number): BoundingBox {
  return {
    minX: box.minX - padding,
    minY: box.minY - padding,
    maxX: box.maxX + padding,
    maxY: box.maxY + padding
  };
}

export function boundingBoxesIntersect(a: BoundingBox, b: BoundingBox): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}

function pointBoundingBox(point: Vec2): BoundingBox {
  return {
    minX: point.x,
    minY: point.y,
    maxX: point.x,
    maxY: point.y
  };
}

function findNode(map: MapDefinition, nodeId: string): MapNode {
  const node = map.nodes.find((candidate) => candidate.id === nodeId);

  if (!node) {
    throw new Error(`Road geometry references unknown node id: ${nodeId}`);
  }

  return node;
}

export function roadPolylineFromMapRoad(map: MapDefinition, road: MapRoad): Vec2[] {
  const fromNode = findNode(map, road.fromNodeId);
  const toNode = findNode(map, road.toNodeId);

  return [
    { x: fromNode.x, y: fromNode.y },
    { x: toNode.x, y: toNode.y }
  ];
}

export function roadGeometryFromMapRoad(map: MapDefinition, road: MapRoad): RoadGeometry {
  const polyline = roadPolylineFromMapRoad(map, road);

  return {
    roadId: road.id,
    roadName: road.name,
    fromNodeId: road.fromNodeId,
    toNodeId: road.toNodeId,
    polyline,
    boundingBox: boundingBoxForPoints(polyline),
    length: polylineLength(polyline)
  };
}

export function buildRoadSpatialIndex(map: MapDefinition): RoadSpatialIndex {
  return {
    mapId: map.id,
    roads: map.roads.map((road) => roadGeometryFromMapRoad(map, road))
  };
}

export function distanceFromPointToRoadCentreline(point: Vec2, road: RoadGeometry): number {
  return projectPointToPolyline(point, road.polyline)?.distance ?? Number.POSITIVE_INFINITY;
}

export function simplifyRouteTrace(points: readonly Vec2[], minimumDistance = 4): Vec2[] {
  if (points.length <= 2) {
    return points.map((point) => ({ ...point }));
  }

  const simplified: Vec2[] = [{ ...points[0] }];

  for (let index = 1; index < points.length - 1; index += 1) {
    if (distanceBetweenPoints(simplified[simplified.length - 1], points[index]) >= minimumDistance) {
      simplified.push({ ...points[index] });
    }
  }

  const finalPoint = points[points.length - 1];
  if (distanceBetweenPoints(simplified[simplified.length - 1], finalPoint) > 0) {
    simplified.push({ ...finalPoint });
  }

  return simplified;
}

export function findCandidateRoadsForPoint(input: FindCandidateRoadsInput): RoadCandidate[] {
  const index = input.index ?? (input.map ? buildRoadSpatialIndex(input.map) : undefined);

  if (!index) {
    throw new Error("findCandidateRoadsForPoint requires a map or road spatial index.");
  }

  const searchBox = expandBoundingBox(pointBoundingBox(input.point), input.tolerance);
  const candidates = index.roads
    .filter((road) => boundingBoxesIntersect(expandBoundingBox(road.boundingBox, input.tolerance), searchBox))
    .map<RoadCandidate | null>((road) => {
      const projection = projectPointToPolyline(input.point, road.polyline);

      if (!projection) {
        return null;
      }

      const candidate: RoadCandidate = {
        roadId: road.roadId,
        projection,
        distanceFromRoad: projection.distance,
        geometry: road
      };

      if (road.roadName) {
        candidate.roadName = road.roadName;
      }

      return candidate;
    })
    .filter((candidate): candidate is RoadCandidate => Boolean(candidate))
    .filter((candidate) => candidate.distanceFromRoad <= input.tolerance)
    .sort((a, b) => a.distanceFromRoad - b.distanceFromRoad || a.roadId.localeCompare(b.roadId));

  return input.maxCandidates ? candidates.slice(0, input.maxCandidates) : candidates;
}
