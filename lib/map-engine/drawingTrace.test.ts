import assert from "node:assert/strict";
import test from "node:test";
import {
  appendDrawnRoutePoint,
  clearDrawnRouteTrace,
  createDrawnRouteTrace,
  mapToScreenPoint,
  screenToMapPoint,
  simplifyDrawnRouteTrace,
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
