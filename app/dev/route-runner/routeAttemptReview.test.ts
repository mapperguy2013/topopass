import assert from "node:assert/strict";
import test from "node:test";
import type { DrawnRoutePipelineResult, IllegalDrawnMovement, RunRouteExerciseResult } from "../../../lib/map-engine/index.ts";
import { buildRouteAttemptReview } from "./routeAttemptReview.ts";

function pipelineResult(value: Partial<DrawnRoutePipelineResult>): DrawnRoutePipelineResult {
  return {
    status: "empty",
    simplifiedTrace: { points: [] },
    snappedRoute: null,
    snappedPoints: [],
    matchResult: null,
    exerciseResult: null,
    warnings: [],
    ...value
  } as DrawnRoutePipelineResult;
}

function exerciseResult(value: Partial<RunRouteExerciseResult> = {}): RunRouteExerciseResult {
  return {
    exerciseId: "exercise",
    normalisedAttempt: {
      exerciseId: "exercise",
      destinationLandmarkIds: [],
      requiredNodeIds: ["a", "b"],
      selectedNodeIds: ["a", "b"],
      selectedRoadIds: ["road-ab"],
      selectedDirectedEdgeIds: ["road-ab:forward"],
      movements: []
    },
    score: {
      passed: true,
      automaticFail: false,
      status: "pass",
      isLegal: true,
      scorePercent: 100,
      efficiencyRatio: 1,
      scoreRatio: 1,
      userRouteDistanceMeters: 100,
      shortestLegalRouteDistanceMeters: 100,
      userDistanceMeters: 100,
      shortestLegalDistanceMeters: 100,
      passThresholdPercent: 80,
      thresholdPercent: 80,
      failureReasons: [],
      legality: {
        isLegal: true,
        automaticFail: false,
        illegalMovements: []
      }
    },
    ...value
  };
}

test("buildRouteAttemptReview returns a pending review before drawing", () => {
  const review = buildRouteAttemptReview({
    pipelineResult: pipelineResult({ status: "empty" }),
    illegalMovements: []
  });

  assert.equal(review.status, "pending");
  assert.equal(review.title, "Draw a route to get feedback");
  assert.equal(review.scoreLabel, "n/a");
  assert.equal(review.suggestedFailureReason, null);
});

test("buildRouteAttemptReview summarizes a passing scored route", () => {
  const review = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult()
    }),
    illegalMovements: []
  });

  assert.equal(review.status, "pass");
  assert.equal(review.title, "Route passed");
  assert.equal(review.scoreLabel, "100.0% (pass)");
  assert.equal(review.distanceLabel, "Your route: 100 m. Shortest legal route: 100 m. Extra distance: +0 m.");
  assert.deepEqual(review.distanceMetrics, [
    {
      id: "student-route-distance",
      label: "Your route",
      value: "100 m"
    },
    {
      id: "shortest-legal-distance",
      label: "Shortest legal route",
      value: "100 m"
    },
    {
      id: "extra-distance",
      label: "Extra distance",
      value: "+0 m"
    }
  ]);
  assert.deepEqual(review.illegalMovements, []);
  assert.deepEqual(review.missedRestrictions, []);
});

test("buildRouteAttemptReview formats kilometre distance breakdowns", () => {
  const review = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult({
        score: {
          ...exerciseResult().score,
          userRouteDistanceMeters: 1420,
          shortestLegalRouteDistanceMeters: 1080,
          userDistanceMeters: 1420,
          shortestLegalDistanceMeters: 1080
        }
      })
    }),
    illegalMovements: []
  });

  assert.deepEqual(review.distanceMetrics, [
    {
      id: "student-route-distance",
      label: "Your route",
      value: "1.42 km"
    },
    {
      id: "shortest-legal-distance",
      label: "Shortest legal route",
      value: "1.08 km"
    },
    {
      id: "extra-distance",
      label: "Extra distance",
      value: "+340 m"
    }
  ]);
});

test("buildRouteAttemptReview explains a legal route that is too long", () => {
  const review = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult({
        score: {
          ...exerciseResult().score,
          passed: false,
          status: "fail",
          scorePercent: 66.7,
          efficiencyRatio: 0.667,
          scoreRatio: 0.667,
          userRouteDistanceMeters: 150,
          shortestLegalRouteDistanceMeters: 100,
          userDistanceMeters: 150,
          shortestLegalDistanceMeters: 100,
          failureReasons: ["below_efficiency_threshold"]
        }
      })
    }),
    illegalMovements: []
  });

  assert.equal(review.status, "fail");
  assert.equal(review.scoreLabel, "66.7% (fail)");
  assert.equal(review.missedRestrictions[0].label, "Route too long");
  assert.match(review.suggestedFailureReason ?? "", /too long/);
});

test("buildRouteAttemptReview explains illegal movements from Stage 69 highlights", () => {
  const illegalMovement: IllegalDrawnMovement = {
    id: "2:no-entry-road:road-bc:c",
    kind: "no-entry-road",
    movementIndex: 2,
    roadId: "road-bc",
    fromNodeId: "b",
    toNodeId: "c",
    message: "Movement 2 uses no-entry road road-bc from b to c."
  };
  const review = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult({
        score: {
          ...exerciseResult().score,
          passed: false,
          automaticFail: true,
          status: "fail",
          isLegal: false,
          scorePercent: 0,
          efficiencyRatio: 0,
          scoreRatio: 0,
          failureReasons: ["illegal_route"],
          legality: {
            isLegal: false,
            automaticFail: true,
            illegalMovements: []
          }
        }
      })
    }),
    illegalMovements: [illegalMovement]
  });

  assert.equal(review.status, "fail");
  assert.equal(review.illegalMovements.length, 1);
  assert.equal(review.illegalMovements[0].label, "No-entry road used on road-bc");
  assert.equal(review.missedRestrictions.length, 0);
  assert.equal(review.suggestedFailureReason, illegalMovement.message);
});

test("buildRouteAttemptReview lists multiple illegal movements with display-friendly labels", () => {
  const illegalMovements: IllegalDrawnMovement[] = [
    {
      id: "1:prohibited-turn:r24:r22",
      kind: "prohibited-turn",
      movementIndex: 1,
      roadId: "r22",
      fromNodeId: "n17",
      toNodeId: "n18",
      viaNodeId: "n17",
      incomingRoadId: "r24",
      outgoingRoadId: "r22",
      message: "Movement 1 makes a prohibited turn from road r24 to road r22 at node n17."
    },
    {
      id: "2:one-way-wrong-direction:r18:n07",
      kind: "one-way-wrong-direction",
      movementIndex: 2,
      roadId: "r18",
      fromNodeId: "n03",
      toNodeId: "n07",
      message: "Movement 2 travels the wrong way on one-way road r18."
    }
  ];
  const review = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult({
        score: {
          ...exerciseResult().score,
          passed: false,
          automaticFail: true,
          status: "fail",
          isLegal: false,
          scorePercent: 0,
          efficiencyRatio: 0,
          scoreRatio: 0,
          failureReasons: ["illegal_route"],
          legality: {
            isLegal: false,
            automaticFail: true,
            illegalMovements: []
          }
        }
      })
    }),
    illegalMovements
  });

  assert.deepEqual(
    review.illegalMovements.map((movement) => movement.label),
    ["Prohibited turn: r24 -> r22", "Wrong way on one-way road r18"]
  );
  assert.equal(review.missedRestrictions.length, 0);
  assert.equal(review.suggestedFailureReason, illegalMovements[0].message);
});

test("buildRouteAttemptReview explains blocked pre-scoring matching failures", () => {
  const review = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "matching_failed",
      warnings: [
        {
          source: "matching",
          code: "disconnected_roads",
          severity: "error",
          message: "Disconnected selected roads.",
          fromRoadId: "r17",
          toRoadId: "r04"
        }
      ]
    }),
    illegalMovements: []
  });

  assert.equal(review.status, "blocked");
  assert.equal(review.scoreLabel, "n/a");
  assert.equal(review.missedRestrictions[0].label, "Disconnected matched roads");
  assert.match(review.suggestedFailureReason ?? "", /matched roads do not connect/);
});
