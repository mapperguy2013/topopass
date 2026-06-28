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
  assert.equal(review.distanceLabel, "Your route: 100m. Shortest legal route: 100m. Extra distance: 0m.");
  assert.deepEqual(review.illegalMovements, []);
  assert.deepEqual(review.missedRestrictions, []);
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
  assert.equal(review.illegalMovements[0].label, "No-entry road used");
  assert.equal(review.missedRestrictions.length, 0);
  assert.equal(review.suggestedFailureReason, illegalMovement.message);
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
