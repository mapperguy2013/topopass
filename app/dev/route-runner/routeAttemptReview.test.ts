import assert from "node:assert/strict";
import test from "node:test";
import type { DrawnRoutePipelineResult, IllegalDrawnMovement, RunRouteExerciseResult } from "../../../lib/map-engine/index.ts";
import {
  appendRouteAttemptToHistory,
  buildAdaptivePracticeRecommendations,
  buildRouteAttemptHistoryItem,
  createEmptyLearnerWeakAreaProfile,
  createRouteAttemptHistoryState,
  extractWeaknessCountersFromReview,
  getLearnerWeakAreaPracticeFocus,
  getSelectedRouteAttemptHistoryItem,
  getStrongestWeakAreas,
  buildRecommendedPracticeQueue,
  buildRouteAttemptReview,
  buildStudentCorrectionHints,
  selectRouteAttemptHistoryItem,
  updateLearnerWeakAreaProfile
} from "./routeAttemptReview.ts";

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
      grade: "excellent",
      gradeLabel: "Excellent",
      scoringExplanation: "Your route was legal and within the pass threshold.",
      userRouteDistanceMeters: 100,
      shortestLegalRouteDistanceMeters: 100,
      userDistanceMeters: 100,
      shortestLegalDistanceMeters: 100,
      extraDistanceMeters: 0,
      passThresholdPercent: 80,
      thresholdPercent: 80,
      legBreakdown: [
        {
          legIndex: 0,
          fromNodeId: "a",
          toNodeId: "b",
          userRouteDistanceMeters: 100,
          shortestLegalRouteDistanceMeters: 100,
          extraDistanceMeters: 0,
          scorePercent: 100,
          efficiencyRatio: 1,
          grade: "excellent",
          gradeLabel: "Excellent",
          passed: true,
          automaticFail: false,
          isLegal: true,
          failureReasons: [],
          violations: [],
          movementStartIndex: 0,
          movementEndIndex: 0
        }
      ],
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

function recommendationIds(review: ReturnType<typeof buildRouteAttemptReview>): string[] {
  return review.practiceRecommendations.map((recommendation) => recommendation.id);
}

function queueIds(review: ReturnType<typeof buildRouteAttemptReview>): string[] {
  return review.recommendedPracticeQueue.map((recommendation) => recommendation.id);
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
  assert.deepEqual(review.correctionHints, ["Draw and score a route to see what to improve next."]);
  assert.deepEqual(recommendationIds(review), ["draw-and-score-route"]);
  assert.deepEqual(review.recommendedPracticeQueue, []);
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
  assert.deepEqual(review.correctionHints, [
    "Good route. Keep those legal choices and look for any shorter legal alternative."
  ]);
  assert.deepEqual(recommendationIds(review), ["try-harder-route"]);
  assert.equal(review.practiceRecommendations[0].priority, "low");
  assert.deepEqual(queueIds(review), ["queue-try-harder-route"]);
  assert.equal(review.recommendedPracticeQueue[0].weaknessType, "advanced-route");
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
  assert.ok(review.correctionHints.some((hint) => hint.includes("too long")));
  assert.deepEqual(recommendationIds(review), ["practice-route-efficiency"]);
  assert.equal(review.practiceRecommendations[0].priority, "medium");
  assert.deepEqual(queueIds(review), ["queue-practice-route-efficiency"]);
  assert.equal(review.recommendedPracticeQueue[0].weaknessType, "route-efficiency");
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
  assert.ok(review.correctionHints.some((hint) => hint.includes("Do not enter no-entry roads")));
  assert.deepEqual(recommendationIds(review), ["practice-no-entry-roads"]);
  assert.equal(review.practiceRecommendations[0].priority, "high");
  assert.deepEqual(queueIds(review), ["queue-practice-no-entry-roads"]);
  assert.deepEqual(
    {
      reason: review.recommendedPracticeQueue[0].reason,
      weaknessType: review.recommendedPracticeQueue[0].weaknessType,
      priority: review.recommendedPracticeQueue[0].priority,
      suggestedExerciseId: review.recommendedPracticeQueue[0].suggestedExerciseId
    },
    {
      reason: "This attempt entered a road from a direction that is marked no entry.",
      weaknessType: "no-entry",
      priority: "high",
      suggestedExerciseId: undefined
    }
  );
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
  assert.ok(review.correctionHints.some((hint) => hint.includes("Avoid the prohibited turn")));
  assert.ok(review.correctionHints.some((hint) => hint.includes("Follow the one-way arrows")));
  assert.deepEqual(recommendationIds(review), ["practice-prohibited-turns", "practice-one-way-direction"]);
  assert.ok(review.practiceRecommendations.every((recommendation) => recommendation.priority === "high"));
  assert.deepEqual(queueIds(review), ["queue-practice-one-way-direction", "queue-practice-prohibited-turns"]);
  assert.deepEqual(
    review.recommendedPracticeQueue.map((recommendation) => recommendation.weaknessType).sort(),
    ["one-way-direction", "prohibited-turn"]
  );
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
  assert.ok(review.correctionHints.some((hint) => hint.includes("one continuous path")));
  assert.deepEqual(recommendationIds(review), ["practice-continuous-drawing"]);
  assert.equal(review.practiceRecommendations[0].priority, "high");
  assert.deepEqual(queueIds(review), ["queue-practice-continuous-drawing"]);
  assert.equal(review.recommendedPracticeQueue[0].weaknessType, "disconnected-drawing");
});

test("buildRouteAttemptReview recommends practice for restricted roads", () => {
  const illegalMovement: IllegalDrawnMovement = {
    id: "3:restricted-road:road-cd:d",
    kind: "restricted-road",
    movementIndex: 3,
    roadId: "road-cd",
    fromNodeId: "c",
    toNodeId: "d",
    message: "Movement 3 uses restricted road road-cd from c to d."
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

  assert.deepEqual(recommendationIds(review), ["practice-restricted-roads"]);
  assert.equal(review.practiceRecommendations[0].priority, "high");
  assert.equal(review.recommendedPracticeQueue[0].weaknessType, "restricted-road");
});

test("buildRouteAttemptReview recommends practice for wrong starts, destinations, and checkpoints", () => {
  const review = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult({
        score: {
          ...exerciseResult().score,
          passed: false,
          status: "fail",
          scorePercent: 0,
          efficiencyRatio: 0,
          scoreRatio: 0,
          failureReasons: ["wrong_start", "wrong_destination", "missed_required_stop"]
        }
      })
    }),
    illegalMovements: []
  });
  const hints = buildStudentCorrectionHints(review);

  assert.ok(hints.some((hint) => hint.includes("required checkpoint")));
  assert.ok(hints.some((hint) => hint.includes("required destination")));
  assert.deepEqual(recommendationIds(review), [
    "practice-required-start",
    "practice-required-destination",
    "practice-required-checkpoints"
  ]);
  assert.ok(review.practiceRecommendations.every((recommendation) => recommendation.priority === "high"));
  assert.deepEqual(queueIds(review), [
    "queue-practice-required-checkpoints",
    "queue-practice-required-destination",
    "queue-practice-required-start"
  ]);
  assert.deepEqual(
    review.recommendedPracticeQueue.map((recommendation) => recommendation.weaknessType).sort(),
    ["missed-checkpoint", "wrong-destination", "wrong-start"]
  );
});

test("buildRouteAttemptReview recommends drawing practice for insufficient drawings", () => {
  const review = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "insufficient_points",
      warnings: [
        {
          source: "drawing",
          code: "insufficient_points",
          severity: "info",
          message: "The trace needs more points."
        }
      ]
    }),
    illegalMovements: []
  });

  assert.equal(review.status, "blocked");
  assert.deepEqual(recommendationIds(review), ["practice-longer-drawn-route"]);
  assert.equal(review.practiceRecommendations[0].priority, "high");
  assert.deepEqual(queueIds(review), ["queue-practice-longer-drawn-route"]);
  assert.equal(review.recommendedPracticeQueue[0].weaknessType, "insufficient-drawing");
});

test("buildAdaptivePracticeRecommendations returns the same derived recommendation model", () => {
  const review = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult()
    }),
    illegalMovements: []
  });

  assert.deepEqual(buildAdaptivePracticeRecommendations(review), review.practiceRecommendations);
});

test("buildRecommendedPracticeQueue sorts items by priority and stable id", () => {
  const queue = buildRecommendedPracticeQueue({
    status: "fail",
    practiceRecommendations: [
      {
        id: "practice-route-efficiency",
        title: "Practise shorter legal routes",
        explanation: "The route was legal, but too long.",
        practiceFocus: "Remove detours.",
        priority: "medium"
      },
      {
        id: "practice-no-entry-roads",
        title: "Practise no-entry roads",
        explanation: "The route used a no-entry road.",
        practiceFocus: "Approach from an allowed direction.",
        priority: "high"
      },
      {
        id: "try-harder-route",
        title: "Try a harder route",
        explanation: "This route passed.",
        practiceFocus: "Try more junctions.",
        priority: "low"
      }
    ]
  });

  assert.deepEqual(
    queue.map((item) => item.id),
    ["queue-practice-no-entry-roads", "queue-practice-route-efficiency", "queue-try-harder-route"]
  );
});

test("buildRecommendedPracticeQueue returns an empty queue when no submitted recommendation exists", () => {
  assert.deepEqual(
    buildRecommendedPracticeQueue({
      status: "fail",
      practiceRecommendations: []
    }),
    []
  );
});

test("extractWeaknessCountersFromReview converts review queue items into weakness counters", () => {
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
    illegalMovements: [
      {
        id: "1:no-entry-road:r01:n02",
        kind: "no-entry-road",
        movementIndex: 1,
        roadId: "r01",
        fromNodeId: "n01",
        toNodeId: "n02",
        message: "Movement 1 uses no-entry road r01."
      }
    ]
  });

  assert.deepEqual(extractWeaknessCountersFromReview(review), [
    {
      weaknessType: "no-entry",
      label: "No-entry roads",
      count: 1,
      priority: "high"
    }
  ]);
});

test("updateLearnerWeakAreaProfile merges repeated weaknesses across attempts", () => {
  const noEntryReview = buildRouteAttemptReview({
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
    illegalMovements: [
      {
        id: "1:no-entry-road:r01:n02",
        kind: "no-entry-road",
        movementIndex: 1,
        roadId: "r01",
        fromNodeId: "n01",
        toNodeId: "n02",
        message: "Movement 1 uses no-entry road r01."
      }
    ]
  });
  const wrongStartReview = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult({
        score: {
          ...exerciseResult().score,
          passed: false,
          status: "fail",
          scorePercent: 0,
          efficiencyRatio: 0,
          scoreRatio: 0,
          failureReasons: ["wrong_start"]
        }
      })
    }),
    illegalMovements: []
  });
  const cleanReview = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult()
    }),
    illegalMovements: []
  });

  let profile = createEmptyLearnerWeakAreaProfile();
  profile = updateLearnerWeakAreaProfile(profile, noEntryReview);
  profile = updateLearnerWeakAreaProfile(profile, cleanReview);
  profile = updateLearnerWeakAreaProfile(profile, noEntryReview);
  profile = updateLearnerWeakAreaProfile(profile, wrongStartReview);

  assert.equal(profile.attemptsReviewed, 4);
  assert.equal(profile.totalWeaknessCount, 3);
  assert.deepEqual(
    profile.weaknesses.map((weakness) => [weakness.weaknessType, weakness.count, weakness.lastSeenAttemptNumber]),
    [
      ["no-entry", 2, 3],
      ["wrong-start", 1, 4]
    ]
  );
});

test("updateLearnerWeakAreaProfile ignores pending reviews", () => {
  const profile = updateLearnerWeakAreaProfile(createEmptyLearnerWeakAreaProfile(), {
    ...buildRouteAttemptReview({
      pipelineResult: pipelineResult({ status: "empty" }),
      illegalMovements: []
    }),
    recommendedPracticeQueue: []
  });

  assert.deepEqual(profile, createEmptyLearnerWeakAreaProfile());
});

test("getStrongestWeakAreas sorts by repeated count and priority", () => {
  const profile = {
    attemptsReviewed: 4,
    totalWeaknessCount: 4,
    weaknesses: [
      {
        weaknessType: "wrong-start" as const,
        label: "Wrong start",
        count: 1,
        priority: "high" as const,
        lastSeenAttemptNumber: 4
      },
      {
        weaknessType: "route-efficiency" as const,
        label: "Route efficiency",
        count: 2,
        priority: "medium" as const,
        lastSeenAttemptNumber: 3
      },
      {
        weaknessType: "no-entry" as const,
        label: "No-entry roads",
        count: 2,
        priority: "high" as const,
        lastSeenAttemptNumber: 2
      }
    ]
  };

  assert.deepEqual(
    getStrongestWeakAreas(profile, 2).map((weakness) => weakness.weaknessType),
    ["no-entry", "route-efficiency"]
  );
});

test("getLearnerWeakAreaPracticeFocus returns the strongest weakness focus", () => {
  const profile = {
    attemptsReviewed: 2,
    totalWeaknessCount: 2,
    weaknesses: [
      {
        weaknessType: "one-way-direction" as const,
        label: "One-way direction",
        count: 2,
        priority: "high" as const,
        lastSeenAttemptNumber: 2
      }
    ]
  };

  assert.match(getLearnerWeakAreaPracticeFocus(profile), /one-way arrows/);
  assert.match(getLearnerWeakAreaPracticeFocus(createEmptyLearnerWeakAreaProfile()), /Complete a drawn route attempt/);
});

test("buildRouteAttemptHistoryItem summarizes a clean successful attempt", () => {
  const review = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult({
        score: {
          ...exerciseResult().score,
          userRouteDistanceMeters: 1200,
          shortestLegalRouteDistanceMeters: 1200,
          userDistanceMeters: 1200,
          shortestLegalDistanceMeters: 1200
        }
      })
    }),
    illegalMovements: []
  });

  const item = buildRouteAttemptHistoryItem(review, 1);

  assert.equal(item.id, "attempt-1");
  assert.equal(item.attemptNumber, 1);
  assert.equal(item.status, "pass");
  assert.equal(item.scoreLabel, "100.0%");
  assert.equal(item.studentRouteDistanceLabel, "1.20 km");
  assert.equal(item.extraDistanceLabel, "+0 m");
  assert.equal(item.illegalMovementCount, 0);
  assert.equal(item.missedRestrictionCount, 0);
  assert.equal(item.primaryFailureReason, null);
  assert.equal(item.review, review);
});

test("buildRouteAttemptHistoryItem summarizes failed attempts with illegal movement and restriction counts", () => {
  const review = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult({
        score: {
          ...exerciseResult().score,
          passed: false,
          status: "fail",
          scorePercent: 0,
          efficiencyRatio: 0,
          scoreRatio: 0,
          userRouteDistanceMeters: 1420,
          shortestLegalRouteDistanceMeters: 1080,
          userDistanceMeters: 1420,
          shortestLegalDistanceMeters: 1080,
          failureReasons: ["illegal_route", "wrong_destination"],
          legality: {
            isLegal: false,
            automaticFail: true,
            illegalMovements: [
              {
                movementIndex: 0,
                fromNodeId: "n01",
                toNodeId: "n02",
                roadId: "r09",
                reason: "no_entry"
              }
            ]
          }
        }
      })
    }),
    illegalMovements: [
      {
        id: "0:no-entry-road:r09:n02",
        kind: "no-entry-road",
        movementIndex: 0,
        roadId: "r09",
        fromNodeId: "n01",
        toNodeId: "n02",
        message: "Movement 0 uses no-entry road r09."
      }
    ]
  });

  const item = buildRouteAttemptHistoryItem(review, 3);

  assert.equal(item.id, "attempt-3");
  assert.equal(item.status, "fail");
  assert.equal(item.studentRouteDistanceLabel, "1.42 km");
  assert.equal(item.extraDistanceLabel, "+340 m");
  assert.equal(item.illegalMovementCount, 1);
  assert.equal(item.missedRestrictionCount, 1);
  assert.match(item.primaryFailureReason ?? "", /no-entry road r09/i);
});

test("route attempt history appends attempts in stable order and selects the latest attempt", () => {
  const cleanReview = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult()
    }),
    illegalMovements: []
  });
  const failedReview = buildRouteAttemptReview({
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
          userRouteDistanceMeters: 1500,
          shortestLegalRouteDistanceMeters: 1000,
          userDistanceMeters: 1500,
          shortestLegalDistanceMeters: 1000,
          failureReasons: ["below_efficiency_threshold"]
        }
      })
    }),
    illegalMovements: []
  });

  let history = createRouteAttemptHistoryState();
  history = appendRouteAttemptToHistory(history, cleanReview);
  history = appendRouteAttemptToHistory(history, failedReview);

  assert.deepEqual(
    history.items.map((item) => item.attemptNumber),
    [1, 2]
  );
  assert.equal(history.selectedAttemptNumber, 2);
  assert.equal(history.nextAttemptNumber, 3);
  assert.equal(getSelectedRouteAttemptHistoryItem(history)?.scoreLabel, "66.7%");
});

test("route attempt history can select previous attempts without recalculating summaries", () => {
  const firstReview = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult()
    }),
    illegalMovements: []
  });
  const secondReview = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "blocked",
      warnings: [
        {
          source: "drawing",
          code: "insufficient_points",
          severity: "info",
          message: "Draw a route before scoring."
        }
      ]
    }),
    illegalMovements: []
  });

  let history = createRouteAttemptHistoryState();
  history = appendRouteAttemptToHistory(history, firstReview);
  history = appendRouteAttemptToHistory(history, secondReview);

  const selectedFirst = selectRouteAttemptHistoryItem(history, 1);

  assert.equal(getSelectedRouteAttemptHistoryItem(selectedFirst)?.review, firstReview);
  assert.equal(getSelectedRouteAttemptHistoryItem(selectedFirst)?.status, "pass");

  const unchanged = selectRouteAttemptHistoryItem(selectedFirst, 99);

  assert.equal(unchanged, selectedFirst);
  assert.equal(getSelectedRouteAttemptHistoryItem(unchanged)?.attemptNumber, 1);
});

test("buildRouteAttemptHistoryItem rejects pending reviews", () => {
  const pendingReview = buildRouteAttemptReview({
    pipelineResult: pipelineResult({ status: "empty" }),
    illegalMovements: []
  });

  assert.throws(() => buildRouteAttemptHistoryItem(pendingReview, 1), /pending route review/);
  assert.throws(() => buildRouteAttemptHistoryItem(pendingReview, 0), /positive integer/);
});
