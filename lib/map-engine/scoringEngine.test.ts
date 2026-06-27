import assert from "node:assert/strict";
import test from "node:test";
import { marloweDistrictMap, scoreRouteAttempt, type AttemptedRouteMovement, type MapDefinition } from "./index.ts";

const scoringMap: MapDefinition = {
  id: "scoring-test-map",
  name: "Scoring Test Map",
  nodes: [
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 500, y: 0 },
    { id: "c", x: 1000, y: 0 },
    { id: "d", x: 500, y: 100 },
    { id: "e", x: 500, y: 200 },
    { id: "f", x: 500, y: 300 },
    { id: "g", x: 500, y: 400 }
  ],
  roads: [
    { id: "road-ab", fromNodeId: "a", toNodeId: "b", distanceMeters: 500, isOneWay: false },
    { id: "road-bc", fromNodeId: "b", toNodeId: "c", distanceMeters: 500, isOneWay: false },
    { id: "road-cd", fromNodeId: "c", toNodeId: "d", distanceMeters: 100, isOneWay: true },
    { id: "road-bd", fromNodeId: "b", toNodeId: "d", distanceMeters: 800, isOneWay: false },
    { id: "road-ad", fromNodeId: "a", toNodeId: "d", distanceMeters: 600, isOneWay: false },
    { id: "road-dc", fromNodeId: "d", toNodeId: "c", distanceMeters: 600, isOneWay: false },
    { id: "road-ae", fromNodeId: "a", toNodeId: "e", distanceMeters: 750, isOneWay: false },
    { id: "road-ec", fromNodeId: "e", toNodeId: "c", distanceMeters: 750, isOneWay: false },
    { id: "road-af", fromNodeId: "a", toNodeId: "f", distanceMeters: 625, isOneWay: false },
    { id: "road-fc", fromNodeId: "f", toNodeId: "c", distanceMeters: 625, isOneWay: false },
    { id: "road-ag", fromNodeId: "a", toNodeId: "g", distanceMeters: 630, isOneWay: false },
    { id: "road-gc", fromNodeId: "g", toNodeId: "c", distanceMeters: 630, isOneWay: false }
  ],
  restrictions: [],
  landmarks: []
};

function score(movements: AttemptedRouteMovement[], requiredStopNodeIds = ["a", "c"], map: MapDefinition = scoringMap) {
  return scoreRouteAttempt({
    map,
    movements,
    requiredStopNodeIds
  });
}

function assertClose(actual: number, expected: number, tolerance = 0.001): void {
  assert(Math.abs(actual - expected) <= tolerance, `${actual} was not within ${tolerance} of ${expected}`);
}

test("scoreRouteAttempt requires at least two ordered required stops", () => {
  assert.throws(
    () =>
      scoreRouteAttempt({
        map: scoringMap,
        movements: [],
        requiredStopNodeIds: ["a"]
      }),
    /requiredStopNodeIds must contain at least two node IDs/
  );
});

test("scoreRouteAttempt passes an exact shortest route at 100 percent", () => {
  const result = score([
    { roadId: "road-ab", fromNodeId: "a", toNodeId: "b" },
    { roadId: "road-bc", fromNodeId: "b", toNodeId: "c" }
  ]);

  assert.equal(result.passed, true);
  assert.equal(result.automaticFail, false);
  assert.equal(result.status, "pass");
  assert.equal(result.shortestLegalRouteDistanceMeters, 1000);
  assert.equal(result.userRouteDistanceMeters, 1000);
  assert.equal(result.efficiencyRatio, 1);
  assert.equal(result.scorePercent, 100);
  assert.deepEqual(result.failureReasons, []);
});

test("scoreRouteAttempt passes an efficient route above the threshold", () => {
  const result = score([
    { roadId: "road-ad", fromNodeId: "a", toNodeId: "d" },
    { roadId: "road-dc", fromNodeId: "d", toNodeId: "c" }
  ]);

  assert.equal(result.passed, true);
  assert.equal(result.automaticFail, false);
  assert.equal(result.shortestLegalRouteDistanceMeters, 1000);
  assert.equal(result.userRouteDistanceMeters, 1200);
  assertClose(result.efficiencyRatio, 0.833333);
  assert.equal(result.scorePercent, 83.3);
});

test("scoreRouteAttempt fails an inefficient legal route below the threshold", () => {
  const result = score([
    { roadId: "road-ae", fromNodeId: "a", toNodeId: "e" },
    { roadId: "road-ec", fromNodeId: "e", toNodeId: "c" }
  ]);

  assert.equal(result.passed, false);
  assert.equal(result.automaticFail, false);
  assert.equal(result.scorePercent, 66.7);
  assert.deepEqual(result.failureReasons, ["below_efficiency_threshold"]);
});

test("scoreRouteAttempt passes exactly at 80 percent", () => {
  const result = score([
    { roadId: "road-af", fromNodeId: "a", toNodeId: "f" },
    { roadId: "road-fc", fromNodeId: "f", toNodeId: "c" }
  ]);

  assert.equal(result.passed, true);
  assert.equal(result.scorePercent, 80);
  assert.deepEqual(result.failureReasons, []);
});

test("scoreRouteAttempt fails below 80 percent", () => {
  const result = score([
    { roadId: "road-ag", fromNodeId: "a", toNodeId: "g" },
    { roadId: "road-gc", fromNodeId: "g", toNodeId: "c" }
  ]);

  assert.equal(result.passed, false);
  assert.equal(result.scorePercent, 79.4);
  assert.deepEqual(result.failureReasons, ["below_efficiency_threshold"]);
});

test("scoreRouteAttempt automatically fails illegal routes before efficiency scoring", () => {
  const map: MapDefinition = {
    id: "illegal-shorter-map",
    name: "Illegal Shorter Map",
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 900, y: 0 },
      { id: "c", x: 450, y: 100 }
    ],
    roads: [
      { id: "road-ab", fromNodeId: "a", toNodeId: "b", distanceMeters: 900, isOneWay: true },
      { id: "road-bc", fromNodeId: "b", toNodeId: "c", distanceMeters: 500, isOneWay: false },
      { id: "road-ca", fromNodeId: "c", toNodeId: "a", distanceMeters: 500, isOneWay: false }
    ],
    restrictions: [],
    landmarks: []
  };
  const result = score([{ roadId: "road-ab", fromNodeId: "b", toNodeId: "a" }], ["b", "a"], map);

  assert.equal(result.passed, false);
  assert.equal(result.automaticFail, true);
  assert.equal(result.scorePercent, 0);
  assert.equal(result.efficiencyRatio, 0);
  assert.deepEqual(result.failureReasons, ["illegal_route"]);
  assert(result.legality.illegalMovements.some((movement) => movement.type === "wrong_way_one_way"));
});

test("scoreRouteAttempt automatically fails disconnected road jumps", () => {
  const result = score([
    { roadId: "road-ab", fromNodeId: "a", toNodeId: "b" },
    { roadId: "road-dc", fromNodeId: "d", toNodeId: "c" }
  ]);

  assert.equal(result.passed, false);
  assert.equal(result.automaticFail, true);
  assert.deepEqual(result.failureReasons, ["illegal_route"]);
  assert(result.legality.illegalMovements.some((movement) => movement.type === "disconnected_road_jump"));
});

test("scoreRouteAttempt automatically fails Marlowe no-entry and prohibited-turn routes", () => {
  const noEntry = scoreRouteAttempt({
    map: marloweDistrictMap,
    movements: [{ roadId: "r12", fromNodeId: "n12", toNodeId: "n11" }],
    requiredStopNodeIds: ["n12", "n11"]
  });
  const prohibitedTurn = scoreRouteAttempt({
    map: marloweDistrictMap,
    movements: [
      { roadId: "r16", fromNodeId: "n04", toNodeId: "n12" },
      { roadId: "r13", fromNodeId: "n12", toNodeId: "n13" }
    ],
    requiredStopNodeIds: ["n04", "n13"]
  });

  assert.deepEqual(noEntry.failureReasons, ["illegal_route"]);
  assert(noEntry.legality.illegalMovements.some((movement) => movement.type === "no_entry"));
  assert.deepEqual(prohibitedTurn.failureReasons, ["illegal_route"]);
  assert(prohibitedTurn.legality.illegalMovements.some((movement) => movement.type === "prohibited_turn"));
});

test("scoreRouteAttempt fails wrong start", () => {
  const result = score([{ roadId: "road-bc", fromNodeId: "b", toNodeId: "c" }]);

  assert.equal(result.passed, false);
  assert.equal(result.automaticFail, false);
  assert(result.failureReasons.includes("wrong_start"));
});

test("scoreRouteAttempt fails wrong destination", () => {
  const result = score([{ roadId: "road-ab", fromNodeId: "a", toNodeId: "b" }]);

  assert.equal(result.passed, false);
  assert.equal(result.automaticFail, false);
  assert(result.failureReasons.includes("wrong_destination"));
});

test("scoreRouteAttempt fails when a required intermediate stop is missed", () => {
  const result = score(
    [
      { roadId: "road-ad", fromNodeId: "a", toNodeId: "d" },
      { roadId: "road-dc", fromNodeId: "d", toNodeId: "c" }
    ],
    ["a", "b", "c"]
  );

  assert.equal(result.passed, false);
  assert(result.failureReasons.includes("missed_required_stop"));
});

test("scoreRouteAttempt passes when required stops are visited in order", () => {
  const result = score(
    [
      { roadId: "road-ab", fromNodeId: "a", toNodeId: "b" },
      { roadId: "road-bc", fromNodeId: "b", toNodeId: "c" }
    ],
    ["a", "b", "c"]
  );

  assert.equal(result.passed, true);
  assert.deepEqual(result.failureReasons, []);
});

test("scoreRouteAttempt fails when required stops are visited out of order", () => {
  const result = score(
    [
      { roadId: "road-ad", fromNodeId: "a", toNodeId: "d" },
      { roadId: "road-dc", fromNodeId: "d", toNodeId: "c" },
      { roadId: "road-bc", fromNodeId: "c", toNodeId: "b" },
      { roadId: "road-bd", fromNodeId: "b", toNodeId: "d" }
    ],
    ["a", "b", "c", "d"]
  );

  assert.equal(result.passed, false);
  assert.deepEqual(result.failureReasons, ["missed_required_stop"]);
});

test("scoreRouteAttempt sums shortest legal leg distances for multi-stop routes", () => {
  const result = score(
    [
      { roadId: "road-ab", fromNodeId: "a", toNodeId: "b" },
      { roadId: "road-bc", fromNodeId: "b", toNodeId: "c" },
      { roadId: "road-cd", fromNodeId: "c", toNodeId: "d" }
    ],
    ["a", "b", "c", "d"]
  );

  assert.equal(result.passed, true);
  assert.equal(result.shortestLegalRouteDistanceMeters, 1100);
  assert.equal(result.userRouteDistanceMeters, 1100);
  assert.equal(result.scorePercent, 100);
});

test("scoreRouteAttempt fails zero-distance routes without divide-by-zero", () => {
  const result = scoreRouteAttempt({
    map: scoringMap,
    movements: [],
    requiredStopNodeIds: ["a", "c"]
  });

  assert.equal(result.passed, false);
  assert.equal(result.scorePercent, 0);
  assert.equal(result.efficiencyRatio, 0);
  assert(result.failureReasons.includes("zero_distance_route"));
});

test("scoreRouteAttempt returns deterministic failure reason ordering", () => {
  const result = scoreRouteAttempt({
    map: scoringMap,
    movements: [],
    requiredStopNodeIds: ["a", "b", "c"]
  });

  assert.deepEqual(result.failureReasons, [
    "wrong_start",
    "wrong_destination",
    "missed_required_stop",
    "zero_distance_route"
  ]);
});
