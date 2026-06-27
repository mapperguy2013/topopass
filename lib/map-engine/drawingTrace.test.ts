import assert from "node:assert/strict";
import test from "node:test";
import {
  appendDrawnRoutePoint,
  clearDrawnRouteTrace,
  createDrawnRouteTrace,
  drawnRouteTraceDistance,
  isMeaningfulDrawnGesture,
  mapToScreenPoint,
  screenToMapPoint,
  simplifyDrawnRouteTrace,
  validateDrawnRouteGesture,
  type ScreenMapViewport
} from "./index.ts";

const viewport: ScreenMapViewport = {
  width: 200,
  height: 100,
  mapBounds: {
    minX: 10,
    minY: 20,
    maxX: 210,
    maxY: 120
  }
};

test("creates an empty drawn route trace", () => {
  assert.deepEqual(createDrawnRouteTrace(), { points: [] });
});

test("appends drawn points immutably", () => {
  const initial = createDrawnRouteTrace([{ x: 1, y: 2 }]);
  const next = appendDrawnRoutePoint(initial, { x: 3, y: 4 });

  assert.deepEqual(initial.points, [{ x: 1, y: 2 }]);
  assert.deepEqual(next.points, [
    { x: 1, y: 2 },
    { x: 3, y: 4 }
  ]);
});

test("can ignore points that are too close to the previous point", () => {
  const initial = createDrawnRouteTrace([{ x: 1, y: 1 }]);
  const next = appendDrawnRoutePoint(initial, { x: 2, y: 1 }, 5);

  assert.deepEqual(next.points, [{ x: 1, y: 1 }]);
  assert.notEqual(next.points, initial.points);
});

test("clears a drawn route trace", () => {
  assert.deepEqual(clearDrawnRouteTrace(), { points: [] });
});

test("calculates drawn route trace distance from consecutive points", () => {
  const trace = createDrawnRouteTrace([
    { x: 0, y: 0 },
    { x: 3, y: 4 },
    { x: 6, y: 8 }
  ]);

  assert.equal(drawnRouteTraceDistance(trace), 10);
});

test("drawn gesture validation rejects tap-like point counts", () => {
  const trace = createDrawnRouteTrace([
    { x: 10, y: 10 },
    { x: 30, y: 10 }
  ]);
  const validation = validateDrawnRouteGesture(trace);

  assert.equal(validation.isMeaningful, false);
  assert.equal(validation.failureReason, "not_enough_points");
  assert.equal(validation.rawPointCount, 2);
  assert.equal(validation.totalDistance, 20);
});

test("drawn gesture validation rejects tiny movement below threshold", () => {
  const trace = createDrawnRouteTrace([
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 6, y: 0 }
  ]);
  const validation = validateDrawnRouteGesture(trace);

  assert.equal(validation.isMeaningful, false);
  assert.equal(validation.failureReason, "not_enough_movement");
  assert.equal(validation.rawPointCount, 3);
  assert.equal(validation.totalDistance, 6);
});

test("drawn gesture validation accepts routes with enough points and movement", () => {
  const trace = createDrawnRouteTrace([
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 12, y: 0 }
  ]);

  assert.equal(isMeaningfulDrawnGesture(trace), true);
});

test("converts screen coordinates to map coordinates", () => {
  assert.deepEqual(screenToMapPoint({ x: 100, y: 50 }, viewport), { x: 110, y: 70 });
});

test("converts map coordinates to screen coordinates", () => {
  assert.deepEqual(mapToScreenPoint({ x: 110, y: 70 }, viewport), { x: 100, y: 50 });
});

test("screen and map conversions round trip", () => {
  const screenPoint = { x: 80, y: 25 };
  const mapPoint = screenToMapPoint(screenPoint, viewport);

  assert.deepEqual(mapToScreenPoint(mapPoint, viewport), screenPoint);
});

test("simplifies drawn route traces", () => {
  const trace = createDrawnRouteTrace([
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 6, y: 0 },
    { x: 7, y: 0 }
  ]);

  assert.deepEqual(simplifyDrawnRouteTrace(trace, 5), {
    points: [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 7, y: 0 }
    ]
  });
});
