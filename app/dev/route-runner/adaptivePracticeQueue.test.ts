import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAdaptivePracticeQueue,
  buildAttemptHistoryInsights,
  type AdaptivePracticeExercise,
  type SavedRouteAttemptSummary
} from "./adaptivePracticeQueue.ts";
import type {
  LearnerWeakAreaProfile,
  RouteAttemptHistoryItem,
  RouteAttemptReview,
  RoutePracticeWeaknessType
} from "./routeAttemptReview.ts";
import type { AdaptivePracticeOutcomeFeedback } from "./adaptivePracticeLauncher.ts";

const now = new Date("2026-06-25T10:00:00.000Z");
const exercises: AdaptivePracticeExercise[] = [
  {
    id: "ex-restrictions",
    title: "Restriction focus route",
    focusAreas: ["no-entry", "one-way-direction", "prohibited-turn", "restricted-road", "restriction-focus"],
    difficulty: "medium"
  },
  {
    id: "ex-checkpoints",
    title: "Checkpoint route",
    focusAreas: ["missed-checkpoint", "wrong-start", "wrong-destination", "checkpoint-focus"],
    difficulty: "easy"
  },
  {
    id: "ex-efficiency",
    title: "Efficiency route",
    focusAreas: ["route-efficiency", "efficiency-focus"],
    difficulty: "medium"
  },
  {
    id: "ex-drawing",
    title: "Drawing confidence route",
    focusAreas: ["disconnected-drawing", "insufficient-drawing", "route-drawing-focus", "confidence-builder"],
    difficulty: "easy"
  }
];

function review(value: Partial<RouteAttemptReview> = {}): RouteAttemptReview {
  return {
    status: "pass",
    title: "Route passed",
    scoreLabel: "100.0% (pass)",
    distanceLabel: "Your route: 100 m. Shortest legal route: 100 m. Extra distance: +0 m.",
    distanceMetrics: [
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
    ],
    illegalMovements: [],
    missedRestrictions: [],
    suggestedFailureReason: null,
    correctionHints: [],
    practiceRecommendations: [],
    recommendedPracticeQueue: [],
    ...value
  };
}

function failedReviewForWeakness(weaknessType: RoutePracticeWeaknessType): RouteAttemptReview {
  if (weaknessType === "no-entry") {
    return review({
      status: "fail",
      title: "Route failed",
      scoreLabel: "0.0% (fail)",
      illegalMovements: [
        {
          id: "no-entry",
          label: "No-entry road used on r09",
          severity: "error"
        }
      ],
      suggestedFailureReason: "The route entered a no-entry road."
    });
  }

  if (weaknessType === "one-way-direction") {
    return review({
      status: "fail",
      title: "Route failed",
      scoreLabel: "0.0% (fail)",
      illegalMovements: [
        {
          id: "one-way",
          label: "Wrong way on one-way road r18",
          severity: "error"
        }
      ],
      suggestedFailureReason: "The route went the wrong way on a one-way road."
    });
  }

  if (weaknessType === "prohibited-turn") {
    return review({
      status: "fail",
      title: "Route failed",
      scoreLabel: "0.0% (fail)",
      illegalMovements: [
        {
          id: "prohibited-turn",
          label: "Prohibited turn: r24 -> r22",
          severity: "error"
        }
      ],
      suggestedFailureReason: "The route used a prohibited turn."
    });
  }

  if (weaknessType === "restricted-road") {
    return review({
      status: "fail",
      title: "Route failed",
      scoreLabel: "0.0% (fail)",
      illegalMovements: [
        {
          id: "restricted",
          label: "Restricted road used on r30",
          severity: "error"
        }
      ],
      suggestedFailureReason: "The route used a restricted road."
    });
  }

  if (weaknessType === "route-efficiency") {
    return review({
      status: "fail",
      title: "Route failed",
      scoreLabel: "66.0% (fail)",
      missedRestrictions: [
        {
          id: "too-long",
          label: "Route too long",
          severity: "warning"
        }
      ],
      suggestedFailureReason: "The route was too long compared with the shortest legal route."
    });
  }

  if (weaknessType === "disconnected-drawing") {
    return review({
      status: "blocked",
      title: "Route was not scored",
      scoreLabel: "n/a",
      missedRestrictions: [
        {
          id: "disconnected",
          label: "Disconnected matched roads",
          severity: "error"
        }
      ],
      suggestedFailureReason: "The matched roads do not connect."
    });
  }

  if (weaknessType === "insufficient-drawing") {
    return review({
      status: "blocked",
      title: "Route was not scored",
      scoreLabel: "n/a",
      missedRestrictions: [
        {
          id: "insufficient",
          label: "Insufficient drawing",
          severity: "error"
        }
      ],
      suggestedFailureReason: "The drawn route was too short."
    });
  }

  return review({
    status: "fail",
    title: "Route failed",
    scoreLabel: "0.0% (fail)",
    missedRestrictions: [
      {
        id: "checkpoint",
        label: "Missed required stop",
        severity: "error"
      }
    ],
    suggestedFailureReason: "A required checkpoint was missed."
  });
}

function historyItem(value: Partial<RouteAttemptHistoryItem> = {}): RouteAttemptHistoryItem {
  const sourceReview = value.review ?? review();

  return {
    id: "attempt-1",
    attemptNumber: 1,
    status: sourceReview.status === "pending" ? "pass" : sourceReview.status,
    title: sourceReview.title,
    scoreLabel: sourceReview.scoreLabel.replace(/\s+\((?:pass|fail)\)$/i, ""),
    studentRouteDistanceLabel: "100 m",
    extraDistanceLabel: "+0 m",
    illegalMovementCount: sourceReview.illegalMovements.length,
    missedRestrictionCount: sourceReview.missedRestrictions.length,
    primaryFailureReason: sourceReview.suggestedFailureReason,
    review: sourceReview,
    ...value
  };
}

function savedAttempt(value: SavedRouteAttemptSummary = {}): SavedRouteAttemptSummary {
  return {
    id: "saved-1",
    exerciseId: "ex-restrictions",
    exerciseLabel: "Restriction focus route",
    scoreLabel: "0.0%",
    statusLabel: "Fail",
    passed: false,
    failureReason: "No-entry road used.",
    reviewPayload: {
      status: "fail",
      title: "Route failed",
      illegalMovements: [
        {
          label: "No-entry road used on r09"
        }
      ]
    },
    ...value
  };
}

function topId(result: ReturnType<typeof buildAdaptivePracticeQueue>): string {
  return result.items[0]?.id ?? "";
}

function outcomeFeedback(value: Partial<AdaptivePracticeOutcomeFeedback> = {}): AdaptivePracticeOutcomeFeedback {
  return {
    id: "adaptive-no-entry-roads:2026-06-25T10:00:00.000Z",
    practiceItemId: "adaptive-no-entry-roads",
    exerciseId: "ex-restrictions",
    completedAt: "2026-06-25T10:00:00.000Z",
    outcome: "repeated-issue",
    summary: "Same issue repeated: no-entry still appears in the review.",
    evidence: {
      scorePercent: 42,
      passed: false,
      illegalMovementCount: 1,
      missedRestrictionCount: 0,
      extraDistance: "+120 m",
      strongestWeaknessCategories: ["no-entry"]
    },
    reinforcedWeakAreas: ["no-entry"],
    deprioritizedWeakAreas: [],
    recommendedNextAction: "Repeat this focus before moving on.",
    ...value
  };
}

test("latest no-entry violation queues no-entry practice highly", () => {
  const result = buildAdaptivePracticeQueue({
    latestReview: failedReviewForWeakness("no-entry"),
    availableExercises: exercises,
    now
  });

  assert.equal(topId(result), "adaptive-no-entry-roads");
  assert.equal(result.items[0]?.type, "restriction-focus");
  assert.equal(result.items[0]?.priority, "high");
  assert.equal(result.items[0]?.sourceSignals.latestReview, true);
  assert.deepEqual(result.items[0]?.relatedExerciseIds, ["ex-restrictions"]);
});

test("latest one-way violation queues one-way practice highly", () => {
  const result = buildAdaptivePracticeQueue({
    latestReview: failedReviewForWeakness("one-way-direction"),
    now
  });

  assert.equal(topId(result), "adaptive-one-way-direction");
  assert.equal(result.items[0]?.priority, "high");
});

test("latest prohibited turn queues prohibited-turn practice highly", () => {
  const result = buildAdaptivePracticeQueue({
    latestReview: failedReviewForWeakness("prohibited-turn"),
    now
  });

  assert.equal(topId(result), "adaptive-prohibited-turns");
  assert.equal(result.items[0]?.priority, "high");
});

test("latest restricted-road violation queues restricted-road practice highly", () => {
  const result = buildAdaptivePracticeQueue({
    latestReview: failedReviewForWeakness("restricted-road"),
    now
  });

  assert.equal(topId(result), "adaptive-restricted-roads");
  assert.equal(result.items[0]?.priority, "high");
});

test("legal but inefficient latest attempt queues efficiency practice", () => {
  const result = buildAdaptivePracticeQueue({
    latestReview: failedReviewForWeakness("route-efficiency"),
    now
  });

  assert.equal(topId(result), "adaptive-route-efficiency");
  assert.equal(result.items[0]?.type, "efficiency-focus");
});

test("blocked disconnected and insufficient drawings queue route drawing practice", () => {
  const disconnected = buildAdaptivePracticeQueue({
    latestReview: failedReviewForWeakness("disconnected-drawing"),
    now
  });
  const insufficient = buildAdaptivePracticeQueue({
    latestReview: failedReviewForWeakness("insufficient-drawing"),
    now
  });

  assert.equal(topId(disconnected), "adaptive-continuous-drawing");
  assert.equal(disconnected.items[0]?.type, "route-drawing-focus");
  assert.equal(topId(insufficient), "adaptive-complete-drawing");
  assert.equal(insufficient.items[0]?.type, "route-drawing-focus");
});

test("missed checkpoint queues checkpoint practice", () => {
  const result = buildAdaptivePracticeQueue({
    latestReview: failedReviewForWeakness("missed-checkpoint"),
    availableExercises: exercises,
    now
  });

  assert.equal(topId(result), "adaptive-required-checkpoints");
  assert.equal(result.items[0]?.type, "checkpoint-focus");
  assert.deepEqual(result.items[0]?.relatedExerciseIds, ["ex-checkpoints"]);
});

test("repeated weak area increases priority and can become primary focus after a clean attempt", () => {
  const profile: LearnerWeakAreaProfile = {
    attemptsReviewed: 4,
    totalWeaknessCount: 4,
    weaknesses: [
      {
        weaknessType: "one-way-direction",
        label: "One-way direction",
        count: 4,
        priority: "high",
        lastSeenAttemptNumber: 4
      }
    ]
  };
  const result = buildAdaptivePracticeQueue({
    latestReview: review(),
    weakAreaProfile: profile,
    now
  });

  assert.equal(topId(result), "adaptive-one-way-direction");
  assert.equal(result.summary.primaryFocus, "Practise one-way direction");
  assert.equal(result.items[0]?.sourceSignals.weakAreaProfile, true);
});

test("declining attempt history recommends simpler focused practice", () => {
  const insights = buildAttemptHistoryInsights([
    historyItem({ attemptNumber: 1, scoreLabel: "90.0", status: "pass" }),
    historyItem({ attemptNumber: 2, scoreLabel: "70.0", status: "fail", primaryFailureReason: "Route was too long." }),
    historyItem({ attemptNumber: 3, scoreLabel: "40.0", status: "fail", primaryFailureReason: "Route was too long." })
  ]);
  const result = buildAdaptivePracticeQueue({
    attemptHistoryInsights: insights,
    now
  });

  assert.equal(insights.trend, "declining");
  assert.ok(result.items.some((item) => item.id === "adaptive-confidence-builder"));
  assert.equal(result.items.find((item) => item.id === "adaptive-confidence-builder")?.type, "confidence-builder");
});

test("improving but still failing history recommends mixed focused practice", () => {
  const insights = buildAttemptHistoryInsights([
    historyItem({ attemptNumber: 1, scoreLabel: "45.0", status: "fail", primaryFailureReason: "Route was too long." }),
    historyItem({ attemptNumber: 2, scoreLabel: "60.0", status: "fail", primaryFailureReason: "Route was too long." }),
    historyItem({ attemptNumber: 3, scoreLabel: "75.0", status: "fail", primaryFailureReason: "Route was too long." })
  ]);
  const result = buildAdaptivePracticeQueue({
    attemptHistoryInsights: insights,
    now
  });

  assert.equal(insights.trend, "improving");
  assert.ok(result.items.some((item) => item.id === "adaptive-improving-mixed-practice"));
});

test("attempt history repeated failure produces review-prior-attempt item", () => {
  const insights = buildAttemptHistoryInsights([
    historyItem({ attemptNumber: 1, status: "fail", scoreLabel: "60.0", primaryFailureReason: "Wrong destination." }),
    historyItem({ attemptNumber: 2, status: "fail", scoreLabel: "62.0", primaryFailureReason: "Wrong destination." })
  ]);
  const result = buildAdaptivePracticeQueue({
    attemptHistoryInsights: insights,
    now
  });

  assert.ok(result.items.some((item) => item.id === "adaptive-review-prior-failures"));
});

test("consistent legal but inefficient attempts produce efficiency item", () => {
  const inefficientReview = failedReviewForWeakness("route-efficiency");
  const insights = buildAttemptHistoryInsights([
    historyItem({ attemptNumber: 1, status: "fail", scoreLabel: "66.0", review: inefficientReview }),
    historyItem({ attemptNumber: 2, status: "fail", scoreLabel: "68.0", review: inefficientReview })
  ]);
  const result = buildAdaptivePracticeQueue({
    attemptHistoryInsights: insights,
    now
  });

  assert.ok(result.items.some((item) => item.id === "adaptive-route-efficiency"));
});

test("saved failed attempts influence the queue", () => {
  const result = buildAdaptivePracticeQueue({
    savedAttempts: [savedAttempt()],
    now
  });

  assert.equal(topId(result), "adaptive-no-entry-roads");
  assert.equal(result.items[0]?.sourceSignals.savedAttempts, true);
});

test("repeated saved exercise failure produces review item", () => {
  const result = buildAdaptivePracticeQueue({
    savedAttempts: [
      savedAttempt({ id: "saved-1", exerciseId: "ex-restrictions" }),
      savedAttempt({ id: "saved-2", exerciseId: "ex-restrictions" })
    ],
    now
  });

  const reviewItem = result.items.find((item) => item.id === "adaptive-review-ex-restrictions");
  assert.ok(reviewItem);
  assert.equal(reviewItem.type, "review-prior-attempt");
  assert.deepEqual(reviewItem.relatedExerciseIds, ["ex-restrictions"]);
});

test("repeated saved violation type increases priority", () => {
  const single = buildAdaptivePracticeQueue({
    savedAttempts: [savedAttempt({ id: "saved-1" })],
    now
  });
  const repeated = buildAdaptivePracticeQueue({
    savedAttempts: [savedAttempt({ id: "saved-1" }), savedAttempt({ id: "saved-2" })],
    now
  });

  assert.ok((repeated.items.find((item) => item.id === "adaptive-no-entry-roads")?.score ?? 0) > (single.items[0]?.score ?? 0));
});

test("empty and malformed saved attempts are handled safely", () => {
  const result = buildAdaptivePracticeQueue({
    savedAttempts: [null, undefined, "bad" as unknown as SavedRouteAttemptSummary],
    now
  });

  assert.equal(topId(result), "adaptive-mixed-practice");
  assert.equal(result.signals.savedAttemptsUsed, false);
});

test("no dominant weakness recommends mixed practice", () => {
  const result = buildAdaptivePracticeQueue({
    latestReview: null,
    weakAreaProfile: {
      attemptsReviewed: 0,
      totalWeaknessCount: 0,
      weaknesses: []
    },
    savedAttempts: [],
    now
  });

  assert.equal(topId(result), "adaptive-mixed-practice");
  assert.equal(result.items[0]?.type, "mixed-practice");
});

test("duplicates are merged when the latest review and saved attempts show the same issue", () => {
  const result = buildAdaptivePracticeQueue({
    latestReview: failedReviewForWeakness("no-entry"),
    savedAttempts: [savedAttempt()],
    now
  });

  assert.equal(result.items.filter((item) => item.id === "adaptive-no-entry-roads").length, 1);
  assert.equal(result.items[0]?.sourceSignals.latestReview, true);
  assert.equal(result.items[0]?.sourceSignals.savedAttempts, true);
});

test("same input returns stable ids and order", () => {
  const input = {
    latestReview: failedReviewForWeakness("prohibited-turn"),
    savedAttempts: [savedAttempt({ failureReason: "Prohibited turn used.", reviewPayload: { illegalMovements: [{ label: "Prohibited turn" }] } })],
    availableExercises: exercises,
    now
  };
  const first = buildAdaptivePracticeQueue(input);
  const second = buildAdaptivePracticeQueue(input);

  assert.deepEqual(
    first.items.map((item) => [item.id, item.priority, item.score]),
    second.items.map((item) => [item.id, item.priority, item.score])
  );
  assert.equal(first.generatedAt, second.generatedAt);
});

test("repeated outcome feedback boosts related practice focus", () => {
  const baseline = buildAdaptivePracticeQueue({
    latestReview: failedReviewForWeakness("no-entry"),
    now
  });
  const boosted = buildAdaptivePracticeQueue({
    latestReview: failedReviewForWeakness("no-entry"),
    outcomeFeedbackHistory: [outcomeFeedback()],
    now
  });
  const baselineItem = baseline.items.find((item) => item.id === "adaptive-no-entry-roads");
  const boostedItem = boosted.items.find((item) => item.id === "adaptive-no-entry-roads");

  assert.ok(boostedItem);
  assert.ok(baselineItem);
  assert.ok(boostedItem.score > baselineItem.score);
  assert.equal(boostedItem.sourceSignals.outcomeFeedback, true);
  assert.ok(boostedItem.reasons.includes("Boosted because this issue repeated after practice."));
});

test("resolved outcome feedback deprioritizes related practice focus", () => {
  const baseline = buildAdaptivePracticeQueue({
    latestReview: failedReviewForWeakness("no-entry"),
    now
  });
  const reduced = buildAdaptivePracticeQueue({
    latestReview: failedReviewForWeakness("no-entry"),
    outcomeFeedbackHistory: [
      outcomeFeedback({
        outcome: "resolved",
        reinforcedWeakAreas: [],
        deprioritizedWeakAreas: ["no-entry"],
        evidence: {
          scorePercent: 100,
          passed: true,
          illegalMovementCount: 0,
          missedRestrictionCount: 0,
          extraDistance: "+0 m",
          strongestWeaknessCategories: []
        }
      })
    ],
    now
  });
  const baselineItem = baseline.items.find((item) => item.id === "adaptive-no-entry-roads");
  const reducedItem = reduced.items.find((item) => item.id === "adaptive-no-entry-roads");

  assert.ok(reducedItem);
  assert.ok(baselineItem);
  assert.ok(reducedItem.score < baselineItem.score);
  assert.equal(reducedItem.sourceSignals.outcomeFeedback, true);
  assert.ok(reducedItem.reasons.includes("Lower priority because recent practice resolved this focus."));
});

test("adaptive queue remains unchanged without outcome feedback history", () => {
  const first = buildAdaptivePracticeQueue({
    latestReview: failedReviewForWeakness("no-entry"),
    now
  });
  const second = buildAdaptivePracticeQueue({
    latestReview: failedReviewForWeakness("no-entry"),
    outcomeFeedbackHistory: [],
    now
  });

  assert.deepEqual(first.items, second.items);
  assert.equal(first.signals.outcomeFeedbackUsed, false);
  assert.equal(second.signals.outcomeFeedbackUsed, false);
});
