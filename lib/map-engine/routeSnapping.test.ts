import assert from "node:assert/strict";
import test from "node:test";
import { marloweDistrictMap, snapDrawnRouteToRoads, type Vec2 } from "./index.ts";

const cleanTraceNearAlbionStreet: Vec2[] = [
  { x: 122, y: 190 },
  { x: 190, y: 184 },
  { x: 258, y: 170 }
];

test("clean drawing close to roads snaps to expected Marlowe roads", () => {
  const result = snapDrawnRouteToRoads({
    map: marloweDistrictMap,
    points: cleanTraceNearAlbionStreet,
    snapTolerance: 18
  });

  assert.equal(result.isValidTrace, true);
  assert.equal(result.hasOffRoadPoints, false);
  assert.deepEqual(
    result.snappedPoints.map((point) => point.roadId),
    ["r02", "r02", "r02"]
  );
  assert.ok(result.snappedPoints.every((point) => point.confidence > 0));
});

test("off-road drawing points are diagnosed", () => {
  const result = snapDrawnRouteToRoads({
    map: marloweDistrictMap,
    points: [
      { x: -200, y: -200 },
      { x: -180, y: -180 }
    ],
    snapTolerance: 18
  });

  assert.equal(result.isValidTrace, true);
  assert.equal(result.hasOffRoadPoints, true);
  assert.deepEqual(
    result.snappedPoints.map((point) => point.roadId),
    [null, null]
  );
  assert.equal(result.diagnostics[0]?.code, "off_road_points");
});

test("repeated points do not break snapping", () => {
  const result = snapDrawnRouteToRoads({
    map: marloweDistrictMap,
    points: [
      { x: 190, y: 184 },
      { x: 190, y: 184 },
      { x: 190, y: 184 }
    ],
    snapTolerance: 18
  });

  assert.equal(result.isValidTrace, true);
  assert.deepEqual(
    result.snappedPoints.map((point) => point.roadId),
    ["r02", "r02", "r02"]
  );
});

test("very short traces return a clear diagnostic", () => {
  const result = snapDrawnRouteToRoads({
    map: marloweDistrictMap,
    points: [{ x: 190, y: 184 }],
    snapTolerance: 18
  });

  assert.equal(result.isValidTrace, false);
  assert.deepEqual(result.snappedPoints, []);
  assert.equal(result.diagnostics[0]?.code, "trace_too_short");
});

test("snapping result is deterministic", () => {
  const firstResult = snapDrawnRouteToRoads({
    map: marloweDistrictMap,
    points: cleanTraceNearAlbionStreet,
    snapTolerance: 18
  });
  const secondResult = snapDrawnRouteToRoads({
    map: marloweDistrictMap,
    points: cleanTraceNearAlbionStreet,
    snapTolerance: 18
  });

  assert.deepEqual(secondResult, firstResult);
});
