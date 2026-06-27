import assert from "node:assert/strict";
import test from "node:test";
import {
  boundingBoxForPoints,
  boundingBoxesIntersect,
  buildRoadSpatialIndex,
  calculateHeadingDegrees,
  distanceBetweenPoints,
  distanceFromPointToRoadCentreline,
  expandBoundingBox,
  findCandidateRoadsForPoint,
  marloweDistrictMap,
  projectPointToPolyline,
  projectPointToSegment,
  roadGeometryFromMapRoad,
  simplifyRouteTrace,
  type Vec2
} from "./index.ts";

test("projects a point onto a horizontal segment", () => {
  const projection = projectPointToSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 });

  assert.deepEqual(projection.point, { x: 5, y: 0 });
  assert.equal(projection.distance, 3);
  assert.equal(projection.t, 0.5);
});

test("projects a point onto a vertical segment", () => {
  const projection = projectPointToSegment({ x: 4, y: 6 }, { x: 1, y: 0 }, { x: 1, y: 10 });

  assert.deepEqual(projection.point, { x: 1, y: 6 });
  assert.equal(projection.distance, 3);
  assert.equal(projection.t, 0.6);
});

test("projects a point onto a diagonal segment", () => {
  const projection = projectPointToSegment({ x: 10, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 10 });

  assert.deepEqual(projection.point, { x: 5, y: 5 });
  assert.equal(Math.round(projection.distance * 1000) / 1000, 7.071);
});

test("projects a point to the nearest segment in a polyline", () => {
  const projection = projectPointToPolyline(
    { x: 9, y: 7 },
    [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 }
    ]
  );

  assert.equal(projection?.segmentStartIndex, 1);
  assert.deepEqual(projection?.point, { x: 10, y: 7 });
  assert.equal(projection?.distance, 1);
});

test("calculates distance and heading deterministically", () => {
  assert.equal(distanceBetweenPoints({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  assert.equal(calculateHeadingDegrees({ x: 0, y: 0 }, { x: 10, y: 0 }), 0);
  assert.equal(calculateHeadingDegrees({ x: 0, y: 0 }, { x: 0, y: 10 }), 90);
  assert.equal(calculateHeadingDegrees({ x: 0, y: 0 }, { x: -10, y: 0 }), 180);
});

test("builds and expands bounding boxes", () => {
  const box = boundingBoxForPoints([
    { x: 5, y: 10 },
    { x: -1, y: 4 },
    { x: 9, y: 20 }
  ]);

  assert.deepEqual(box, { minX: -1, minY: 4, maxX: 9, maxY: 20 });
  assert.deepEqual(expandBoundingBox(box, 2), { minX: -3, minY: 2, maxX: 11, maxY: 22 });
  assert.equal(boundingBoxesIntersect(box, { minX: 8, minY: 19, maxX: 12, maxY: 30 }), true);
  assert.equal(boundingBoxesIntersect(box, { minX: 10, minY: 21, maxX: 12, maxY: 30 }), false);
});

test("simplifies a route trace without dropping the final point", () => {
  const points: Vec2[] = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 6, y: 0 },
    { x: 7, y: 0 }
  ];

  assert.deepEqual(simplifyRouteTrace(points, 5), [
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 7, y: 0 }
  ]);
});

test("builds road geometry and centreline distance for the Marlowe fixture", () => {
  const road = marloweDistrictMap.roads.find((candidate) => candidate.id === "r02");
  assert.ok(road);

  const geometry = roadGeometryFromMapRoad(marloweDistrictMap, road);
  const distance = distanceFromPointToRoadCentreline({ x: 190, y: 185 }, geometry);

  assert.equal(geometry.roadId, "r02");
  assert.equal(Math.round(distance), 5);
});

test("candidate lookup returns nearby roads and rejects distant points", () => {
  const index = buildRoadSpatialIndex(marloweDistrictMap);
  const candidates = findCandidateRoadsForPoint({
    point: { x: 190, y: 185 },
    index,
    tolerance: 20
  });
  const distantCandidates = findCandidateRoadsForPoint({
    point: { x: -200, y: -200 },
    index,
    tolerance: 20
  });

  assert.equal(candidates[0]?.roadId, "r02");
  assert.deepEqual(distantCandidates, []);
});
