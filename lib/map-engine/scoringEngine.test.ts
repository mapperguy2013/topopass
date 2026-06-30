import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateRouteEfficiencyScore,
  marloweDistrictMap,
  scoreRouteAttempt,
  type AttemptedRouteMovement,
  type MapDefinition
} from "./index.ts";

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

test("calculateRouteEfficiencyScore calibrates the required scoring examples", () => {
  const exact = calculateRouteEfficiencyScore({
    shortestLegalRouteDistanceMeters: 1000,
    userRouteDistanceMeters: 1000
  });
  const efficient = calculateRouteEfficiencyScore({
    shortestLegalRouteDistanceMeters: 1000,
    userRouteDistanceMeters: 1200
  });
  const threshold = calculateRouteEfficiencyScore({
    shortestLegalRouteDistanceMeters: 1000,
    userRouteDistanceMeters: 1250
  });
  const belowThreshold = calculateRouteEfficiencyScore({
    shortestLegalRouteDistanceMeters: 1000,
    userRouteDistanceMeters: 1300
  });
  const veryLong = calculateRouteEfficiencyScore({
    shortestLegalRouteDistanceMeters: 1000,
    userRouteDistanceMeters: 5000
  });

  assert.deepEqual(
    [
      [exact.scorePercent, exact.passed],
      [efficient.scorePercent, efficient.passed],
      [threshold.scorePercent, threshold.passed],
      [belowThreshold.scorePercent, belowThreshold.passed],
      [veryLong.scorePercent, veryLong.passed]
    ],
    [
      [100, true],
      [83.3, true],
      [80, true],
      [76.9, false],
      [20, false]
    ]
  );
});

test("calculateRouteEfficiencyScore automatically fails illegal routes regardless of distance", () => {
  const result = calculateRouteEfficiencyScore({
    shortestLegalRouteDistanceMeters: 1000,
    userRouteDistanceMeters: 900,
    automaticFail: true,
    isLegal: false,
    failureReason: "illegal_route"
  });

  assert.equal(result.passed, false);
  assert.equal(result.automaticFail, true);
  assert.equal(result.scorePercent, 0);
  assert.equal(result.efficiencyRatio, 0);
  assert.equal(result.grade, "automatic_fail");
  assert.equal(result.gradeLabel, "Automatic fail");
  assert.equal(result.failureReason, "illegal_route");
});

test("calculateRouteEfficiencyScore fails empty and invalid distances safely", () => {
  const zeroUserRoute = calculateRouteEfficiencyScore({
    shortestLegalRouteDistanceMeters: 1000,
    userRouteDistanceMeters: 0
  });
  const missingShortestRoute = calculateRouteEfficiencyScore({
    shortestLegalRouteDistanceMeters: 0,
    userRouteDistanceMeters: 1000
  });

  assert.equal(zeroUserRoute.passed, false);
  assert.equal(zeroUserRoute.scorePercent, 0);
  assert.equal(zeroUserRoute.failureReason, "zero_distance_route");
  assert.equal(missingShortestRoute.passed, false);
  assert.equal(missingShortestRoute.scorePercent, 0);
  assert.equal(missingShortestRoute.failureReason, "no_valid_shortest_route");
});

test("calculateRouteEfficiencyScore clamps user routes shorter than shortest to 100 percent", () => {
  const result = calculateRouteEfficiencyScore({
    shortestLegalRouteDistanceMeters: 1000,
    userRouteDistanceMeters: 900
  });

  assert.equal(result.passed, true);
  assert.equal(result.scorePercent, 100);
  assert.equal(result.efficiencyRatio, 1);
  assert.equal(result.grade, "excellent");
});

test("calculateRouteEfficiencyScore returns deterministic grading bands", () => {
  const excellent = calculateRouteEfficiencyScore({
    shortestLegalRouteDistanceMeters: 1000,
    userRouteDistanceMeters: 1053
  });
  const veryGood = calculateRouteEfficiencyScore({
    shortestLegalRouteDistanceMeters: 1000,
    userRouteDistanceMeters: 1100
  });
  const pass = calculateRouteEfficiencyScore({
    shortestLegalRouteDistanceMeters: 1000,
    userRouteDistanceMeters: 1200
  });
  const fail = calculateRouteEfficiencyScore({
    shortestLegalRouteDistanceMeters: 1000,
    userRouteDistanceMeters: 1300
  });

  assert.deepEqual(
    [excellent.gradeLabel, veryGood.gradeLabel, pass.gradeLabel, fail.gradeLabel],
    ["Excellent", "Very good", "Pass", "Fail"]
  );
});

test("calculateRouteEfficiencyScore returns stable UI explanation strings", () => {
  const pass = calculateRouteEfficiencyScore({
    shortestLegalRouteDistanceMeters: 1000,
    userRouteDistanceMeters: 1200
  });
  const fail = calculateRouteEfficiencyScore({
    shortestLegalRouteDistanceMeters: 1000,
    userRouteDistanceMeters: 1300
  });
  const illegal = calculateRouteEfficiencyScore({
    shortestLegalRouteDistanceMeters: 1000,
    userRouteDistanceMeters: 900,
    automaticFail: true
  });

  assert.equal(pass.explanation, "Your route was legal and within the pass threshold.");
  assert.equal(fail.explanation, "Your route was legal but too long.");
  assert.equal(illegal.explanation, "Your route failed because it used a restricted movement.");
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
  assert.equal(result.gradeLabel, "Excellent");
  assert.equal(result.scoringExplanation, "Your route was legal and within the pass threshold.");
  assert.deepEqual(
    result.legBreakdown.map((leg) => ({
      legIndex: leg.legIndex,
      fromNodeId: leg.fromNodeId,
      toNodeId: leg.toNodeId,
      shortestLegalRouteDistanceMeters: leg.shortestLegalRouteDistanceMeters,
      userRouteDistanceMeters: leg.userRouteDistanceMeters,
      scorePercent: leg.scorePercent,
      passed: leg.passed,
      failureReasons: leg.failureReasons
    })),
    [
      {
        legIndex: 0,
        fromNodeId: "a",
        toNodeId: "c",
        shortestLegalRouteDistanceMeters: 1000,
        userRouteDistanceMeters: 1000,
        scorePercent: 100,
        passed: true,
        failureReasons: []
      }
    ]
  );
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
  assert.equal(result.gradeLabel, "Pass");
});

test("scoreRouteAttempt fails an inefficient legal route below the threshold", () => {
  const result = score([
    { roadId: "road-ae", fromNodeId: "a", toNodeId: "e" },
    { roadId: "road-ec", fromNodeId: "e", toNodeId: "c" }
  ]);

  assert.equal(result.passed, false);
  assert.equal(result.automaticFail, false);
  assert.equal(result.scorePercent, 66.7);
  assert.equal(result.gradeLabel, "Fail");
  assert.equal(result.scoringExplanation, "Your route was legal but too long.");
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
  assert.equal(result.gradeLabel, "Automatic fail");
  assert.equal(result.scoringExplanation, "Your route failed because it used a restricted movement.");
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
  assert.deepEqual(
    result.legBreakdown.map((leg) => [
      leg.fromNodeId,
      leg.toNodeId,
      leg.shortestLegalRouteDistanceMeters,
      leg.userRouteDistanceMeters,
      leg.scorePercent,
      leg.passed
    ]),
    [
      ["a", "b", 500, 500, 100, true],
      ["b", "c", 500, 500, 100, true],
      ["c", "d", 100, 100, 100, true]
    ]
  );
});

test("scoreRouteAttempt scores A to B to C to D legal passes with per-leg breakdown", () => {
  const result = score(
    [
      { roadId: "road-ab", fromNodeId: "a", toNodeId: "b" },
      { roadId: "road-bc", fromNodeId: "b", toNodeId: "c" },
      { roadId: "road-cd", fromNodeId: "c", toNodeId: "d" }
    ],
    ["a", "b", "c", "d"]
  );

  assert.equal(result.passed, true);
  assert.equal(result.automaticFail, false);
  assert.equal(result.scorePercent, 100);
  assert.equal(result.legBreakdown.length, 3);
  assert(result.legBreakdown.every((leg) => leg.passed));
});

test("scoreRouteAttempt scores A to B to C to D legal failures from total route distance", () => {
  const result = score(
    [
      { roadId: "road-ab", fromNodeId: "a", toNodeId: "b" },
      { roadId: "road-bd", fromNodeId: "b", toNodeId: "d" },
      { roadId: "road-dc", fromNodeId: "d", toNodeId: "c" },
      { roadId: "road-cd", fromNodeId: "c", toNodeId: "d" }
    ],
    ["a", "b", "c", "d"]
  );

  assert.equal(result.passed, false);
  assert.equal(result.automaticFail, false);
  assert.equal(result.shortestLegalRouteDistanceMeters, 1100);
  assert.equal(result.userRouteDistanceMeters, 2000);
  assert.equal(result.scorePercent, 55);
  assert.deepEqual(result.failureReasons, ["below_efficiency_threshold"]);
  assert.deepEqual(
    result.legBreakdown.map((leg) => [
      leg.fromNodeId,
      leg.toNodeId,
      leg.shortestLegalRouteDistanceMeters,
      leg.userRouteDistanceMeters,
      leg.scorePercent,
      leg.failureReasons
    ]),
    [
      ["a", "b", 500, 500, 100, []],
      ["b", "c", 500, 1400, 35.7, ["below_efficiency_threshold"]],
      ["c", "d", 100, 100, 100, []]
    ]
  );
});

test("scoreRouteAttempt records missed intermediate checkpoint legs", () => {
  const result = score(
    [
      { roadId: "road-ad", fromNodeId: "a", toNodeId: "d" },
      { roadId: "road-dc", fromNodeId: "d", toNodeId: "c" }
    ],
    ["a", "b", "c"]
  );

  assert.equal(result.passed, false);
  assert(result.failureReasons.includes("missed_required_stop"));
  assert.deepEqual(
    result.legBreakdown.map((leg) => [leg.fromNodeId, leg.toNodeId, leg.userRouteDistanceMeters, leg.failureReasons]),
    [
      ["a", "b", 0, ["missed_required_stop"]],
      ["b", "c", 0, ["missed_required_stop"]]
    ]
  );
});

test("scoreRouteAttempt records wrong checkpoint order in per-leg results", () => {
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
  assert.deepEqual(
    result.legBreakdown.map((leg) => [leg.fromNodeId, leg.toNodeId, leg.userRouteDistanceMeters, leg.failureReasons]),
    [
      ["a", "b", 1700, ["below_efficiency_threshold"]],
      ["b", "c", 0, ["missed_required_stop"]],
      ["c", "d", 0, ["missed_required_stop"]]
    ]
  );
});

test("scoreRouteAttempt automatically fails when one multi-stop leg contains an illegal movement", () => {
  const illegalLegMap: MapDefinition = {
    id: "illegal-leg-map",
    name: "Illegal Leg Map",
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 100, y: 0 },
      { id: "c", x: 200, y: 0 },
      { id: "d", x: 100, y: 100 }
    ],
    roads: [
      { id: "road-ab", fromNodeId: "a", toNodeId: "b", distanceMeters: 100, isOneWay: false },
      { id: "road-bc", fromNodeId: "c", toNodeId: "b", distanceMeters: 100, isOneWay: true },
      { id: "road-bd", fromNodeId: "b", toNodeId: "d", distanceMeters: 100, isOneWay: false },
      { id: "road-dc", fromNodeId: "d", toNodeId: "c", distanceMeters: 100, isOneWay: false }
    ],
    restrictions: [],
    landmarks: []
  };
  const result = score(
    [
      { roadId: "road-ab", fromNodeId: "a", toNodeId: "b" },
      { roadId: "road-bc", fromNodeId: "b", toNodeId: "c" }
    ],
    ["a", "b", "c"],
    illegalLegMap
  );

  assert.equal(result.passed, false);
  assert.equal(result.automaticFail, true);
  assert.equal(result.scorePercent, 0);
  assert.deepEqual(result.failureReasons, ["illegal_route"]);
  assert.deepEqual(
    result.legBreakdown.map((leg) => [leg.fromNodeId, leg.toNodeId, leg.automaticFail, leg.failureReasons]),
    [
      ["a", "b", false, []],
      ["b", "c", true, ["illegal_route"]]
    ]
  );
  assert(result.legBreakdown[1].violations.some((violation) => violation.type === "wrong_way_one_way"));
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
