import assert from "node:assert/strict";
import test from "node:test";
import {
  scoreDrawnRoute,
  type RouteScoringConfig
} from "./routeScoring.ts";
import type { RouteMapPoint } from "../src/data/maps/routeTypes.ts";

const acceptedRoute: RouteMapPoint[] = Array.from(
  { length: 11 },
  (_, index) => ({ x: index * 10, y: 0 })
);
const bounds = { minX: 0, minY: -20, maxX: 100, maxY: 20 };
const testConfig = {
  mapUnitsToMeters: 1,
  sampleSpacingMeters: 5,
  startToleranceMeters: 10,
  endToleranceMeters: 10,
  routeMatchToleranceMeters: 5,
  boundsToleranceMeters: 0
} satisfies Partial<RouteScoringConfig>;

function score(route: RouteMapPoint[]) {
  return scoreDrawnRoute(route, acceptedRoute, {
    bounds,
    config: testConfig
  });
}

test("empty drawing fails", () => {
  const result = score([]);

  assert.equal(result.passed, false);
  assert.equal(result.score, 0);
  assert.equal(result.hasEnoughPoints, false);
});

test("very short drawing fails with clear feedback", () => {
  const result = score([
    { x: 0, y: 0 },
    { x: 10, y: 0 }
  ]);

  assert.equal(result.passed, false);
  assert.ok(result.feedback.includes("Your route is too short to score."));
});

test("drawing that starts far away is penalised", () => {
  const result = score([
    { x: 0, y: 30 },
    ...acceptedRoute.slice(1)
  ]);

  assert.equal(result.startPassed, false);
  assert.ok(result.penalties.some((penalty) => penalty.startsWith("Start accuracy")));
});

test("drawing that ends far away is penalised", () => {
  const result = score([
    ...acceptedRoute.slice(0, -1),
    { x: 100, y: 30 }
  ]);

  assert.equal(result.endPassed, false);
  assert.ok(result.penalties.some((penalty) => penalty.startsWith("End accuracy")));
});

test("route much shorter than accepted route is flagged", () => {
  const result = score(acceptedRoute.slice(0, 6));

  assert.equal(result.passed, false);
  assert.ok(result.lengthRatio < 0.6);
  assert.ok(result.penalties.some((penalty) => penalty.startsWith("Route length")));
  assert.ok(result.warnings.some((warning) => warning.includes("non-road areas")));
});

test("route much longer than accepted route is penalised", () => {
  const result = score([
    ...acceptedRoute,
    { x: 100, y: 100 },
    { x: 100, y: 0 }
  ]);

  assert.equal(result.passed, false);
  assert.ok(result.lengthRatio > 1.8);
  assert.ok(result.penalties.some((penalty) => penalty.includes("excessive detour")));
});

test("route leaving question bounds is penalised without claiming road invalidity", () => {
  const result = score([
    { x: 0, y: 0 },
    { x: 20, y: 0 },
    { x: 40, y: 50 },
    { x: 60, y: 50 },
    { x: 80, y: 0 },
    { x: 100, y: 0 }
  ]);

  assert.ok(result.outsideBoundsPercent > 10);
  assert.ok(result.warnings.includes("This route may leave the expected map area."));
});

test("reasonable route near accepted geometry passes", () => {
  const result = score(acceptedRoute.map((point) => ({ ...point, y: 1 })));

  assert.equal(result.passed, true);
  assert.equal(result.coverageScore, 100);
  assert.equal(result.lengthRatio, 1);
  assert.ok(result.percentage >= 95);
});
