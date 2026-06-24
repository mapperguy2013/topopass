import assert from "node:assert/strict";
import test from "node:test";

import {
  appendRoutePoint,
  canSubmitRoute,
  clearRoutePoints,
  routeDrawingStatusMessage,
  undoLastRoutePoint
} from "./routeDrawingControls.ts";

test("appendRoutePoint prevents accidental tiny duplicate points", () => {
  const points = [{ x: 10, y: 10 }];
  const unchanged = appendRoutePoint(points, { x: 12, y: 12 });

  assert.equal(unchanged, points);
  assert.deepEqual(appendRoutePoint(points, { x: 30, y: 30 }), [
    { x: 10, y: 10 },
    { x: 30, y: 30 }
  ]);
});

test("undoLastRoutePoint removes only the latest route point", () => {
  assert.deepEqual(
    undoLastRoutePoint([
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 }
    ]),
    [
      { x: 1, y: 1 },
      { x: 2, y: 2 }
    ]
  );
});

test("clearRoutePoints clears the current drawing", () => {
  assert.deepEqual(clearRoutePoints(), []);
});

test("canSubmitRoute requires at least two captured points", () => {
  assert.equal(canSubmitRoute([]), false);
  assert.equal(canSubmitRoute([{ x: 1, y: 1 }]), false);
  assert.equal(
    canSubmitRoute([
      { x: 1, y: 1 },
      { x: 2, y: 2 }
    ]),
    true
  );
});

test("routeDrawingStatusMessage explains empty, short, and valid routes", () => {
  assert.equal(
    routeDrawingStatusMessage([]),
    "Draw at least two points before submitting."
  );
  assert.equal(
    routeDrawingStatusMessage([{ x: 1, y: 1 }]),
    "Keep drawing to add more of the route before submitting."
  );
  assert.equal(
    routeDrawingStatusMessage([
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 }
    ]),
    "3 route points captured. You can submit, undo, or clear."
  );
});
