import assert from "node:assert/strict";
import test from "node:test";
import type { SavedRouteAttemptListItem } from "./routeAttemptStorage.ts";
import {
  buildSavedAttemptHistoryReviewList,
  buildSavedAttemptReview
} from "./routeAttemptHistoryReview.ts";

function savedAttempt(value: Partial<SavedRouteAttemptListItem> = {}): SavedRouteAttemptListItem {
  return {
    id: "attempt-1",
    exerciseId: "fox-lane-to-northgate-hospital",
    exerciseLabel: "Fox Lane Station to Northgate Hospital",
    mapId: "marlowe-district-dev-map",
    mapVersion: "1",
    exerciseVersion: null,
    createdAt: "2026-06-25T10:15:00.000Z",
    dateLabel: "25 Jun 2026, 10:15",
    scoreLabel: "83.3%",
    statusLabel: "Pass",
    passed: true,
    isLegal: true,
    userDistanceMeters: 1200,
    shortestDistanceMeters: 1000,
    extraDistanceMeters: 200,
    userDistanceLabel: "1.20 km",
    shortestDistanceLabel: "1.00 km",
    extraDistanceLabel: "+200 m",
    failureReason: "None",
    reviewTitle: "Route passed",
    reviewPayload: {
      status: "pass",
      title: "Route passed",
      scoreLabel: "83.3% (pass)",
      distanceMetrics: [
        {
          id: "student-route-distance",
          label: "Your route",
          value: "1.20 km"
        },
        {
          id: "shortest-legal-distance",
          label: "Shortest legal route",
          value: "1.00 km"
        }
      ],
      illegalMovements: [],
      missedRestrictions: [],
      suggestedFailureReason: null
    },
    matchedRoute: {
      orderedRoadIds: ["r01", "r02"],
      selectedRoadIds: ["r01", "r02"],
      selectedNodeIds: ["n01", "n02", "n03"],
      directedEdgeIds: ["r01:forward", "r02:forward"]
    },
    perLegBreakdown: [
      {
        legIndex: 0,
        fromNodeId: "n01",
        toNodeId: "n03",
        scorePercent: 83.3,
        userRouteDistanceMeters: 1200,
        shortestLegalRouteDistanceMeters: 1000,
        extraDistanceMeters: 200,
        passed: true,
        automaticFail: false,
        failureReasons: [],
        violations: []
      }
    ],
    ...value
  };
}

test("saved attempt history review list exposes useful empty state", () => {
  const history = buildSavedAttemptHistoryReviewList([]);

  assert.equal(history.isEmpty, true);
  assert.deepEqual(history.attempts, []);
  assert.match(history.emptyMessage, /No saved route attempts/i);
});

test("saved attempt history review list summarizes one saved pass attempt", () => {
  const history = buildSavedAttemptHistoryReviewList([savedAttempt()]);

  assert.equal(history.isEmpty, false);
  assert.equal(history.attempts[0].exerciseLabel, "Fox Lane Station to Northgate Hospital");
  assert.equal(history.attempts[0].scoreLabel, "83.3%");
  assert.equal(history.attempts[0].statusLabel, "Pass");
  assert.equal(history.attempts[0].legalLabel, "Legal");
  assert.equal(history.attempts[0].userDistanceLabel, "1.20 km");
  assert.equal(history.attempts[0].shortestDistanceLabel, "1.00 km");
});

test("saved attempt review renders pass attempt summaries from review payload", () => {
  const review = buildSavedAttemptReview(savedAttempt());

  assert.ok(review);
  assert.equal(review.title, "Route passed");
  assert.equal(review.scoreLabel, "83.3% (pass)");
  assert.equal(review.legalLabel, "Legal");
  assert.match(review.userRouteSummary, /1.20 km/);
  assert.match(review.userRouteSummary, /2 roads/);
  assert.match(review.shortestRouteSummary, /1.00 km/);
  assert.equal(review.violations.length, 0);
  assert.equal(review.missedRestrictions.length, 0);
  assert.equal(review.legBreakdown.length, 1);
  assert.equal(review.legBreakdown[0].scoreLabel, "83.3%");
});

test("saved attempt review renders failed inefficient attempt reason", () => {
  const review = buildSavedAttemptReview(
    savedAttempt({
      statusLabel: "Fail",
      passed: false,
      scoreLabel: "66.7%",
      failureReason: "Your route was too long.",
      reviewPayload: {
        status: "fail",
        title: "Route failed",
        scoreLabel: "66.7% (fail)",
        distanceMetrics: [],
        illegalMovements: [],
        missedRestrictions: [],
        suggestedFailureReason: "Your route was too long."
      },
      perLegBreakdown: []
    })
  );

  assert.ok(review);
  assert.equal(review.statusLabel, "Fail");
  assert.equal(review.failureReason, "Your route was too long.");
  assert.equal(review.scoreExplanation, "Your route was too long.");
});

test("saved attempt review renders illegal attempt violations", () => {
  const review = buildSavedAttemptReview(
    savedAttempt({
      statusLabel: "Fail",
      passed: false,
      isLegal: false,
      scoreLabel: "0.0%",
      failureReason: "Illegal route.",
      reviewPayload: {
        status: "fail",
        title: "Route failed",
        scoreLabel: "0.0% (fail)",
        distanceMetrics: [],
        illegalMovements: [
          {
            id: "illegal-1",
            label: "No-entry road used",
            detail: "Road r09 was used against the restriction.",
            severity: "error"
          }
        ],
        missedRestrictions: [],
        suggestedFailureReason: null
      }
    })
  );

  assert.ok(review);
  assert.equal(review.legalLabel, "Illegal");
  assert.equal(review.violations.length, 1);
  assert.equal(review.violations[0].label, "No-entry road used");
  assert.match(review.scoreExplanation, /illegal movement/i);
});

test("saved attempt review renders multi-stop per-leg breakdowns", () => {
  const review = buildSavedAttemptReview(
    savedAttempt({
      perLegBreakdown: [
        {
          legIndex: 0,
          fromNodeId: "n01",
          toNodeId: "n02",
          scorePercent: 100,
          userRouteDistanceMeters: 400,
          shortestLegalRouteDistanceMeters: 400,
          extraDistanceMeters: 0,
          passed: true,
          automaticFail: false,
          failureReasons: [],
          violations: []
        },
        {
          legIndex: 1,
          fromNodeId: "n02",
          toNodeId: "n03",
          scorePercent: 75,
          userRouteDistanceMeters: 800,
          shortestLegalRouteDistanceMeters: 600,
          extraDistanceMeters: 200,
          passed: false,
          automaticFail: false,
          failureReasons: ["below_efficiency_threshold"],
          violations: []
        }
      ]
    })
  );

  assert.ok(review);
  assert.equal(review.legBreakdown.length, 2);
  assert.equal(review.legBreakdown[0].label, "Leg 1: n01 to n02");
  assert.equal(review.legBreakdown[1].statusLabel, "Fail");
  assert.equal(review.legBreakdown[1].scoreLabel, "75.0%");
  assert.equal(review.legBreakdown[1].issueLabel, "below_efficiency_threshold");
});

test("saved attempt review handles missing exercise title fallback", () => {
  const review = buildSavedAttemptReview(
    savedAttempt({
      exerciseId: "stale-exercise-id",
      exerciseLabel: "stale-exercise-id"
    })
  );

  assert.ok(review);
  assert.match(review.exerciseDataWarning ?? "", /title unavailable/i);
  assert.match(review.subtitle, /stale-exercise-id/);
});

test("saved attempt review returns null when no attempt is selected", () => {
  assert.equal(buildSavedAttemptReview(null), null);
  assert.equal(buildSavedAttemptReview(undefined), null);
});
