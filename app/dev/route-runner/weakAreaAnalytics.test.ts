import assert from "node:assert/strict";
import test from "node:test";
import type { SavedRouteAttemptListItem } from "./routeAttemptStorage.ts";
import {
  buildRouteWeakAreaAnalytics,
  extractWeakAreaSignalsFromAttempt,
  type RouteWeakAreaAnalyticsType
} from "./weakAreaAnalytics.ts";

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
    perLegBreakdown: [],
    ...value
  };
}

function failedAttempt(
  id: string,
  createdAt: string,
  issueText: string,
  value: Partial<SavedRouteAttemptListItem> = {}
): SavedRouteAttemptListItem {
  return savedAttempt({
    id,
    createdAt,
    dateLabel: createdAt,
    statusLabel: "Fail",
    passed: false,
    isLegal: false,
    scoreLabel: "0.0%",
    failureReason: issueText,
    reviewTitle: "Route failed",
    reviewPayload: {
      status: "fail",
      title: "Route failed",
      illegalMovements: [
        {
          id: `${id}-issue`,
          label: issueText,
          detail: issueText,
          severity: "error"
        }
      ],
      missedRestrictions: [],
      suggestedFailureReason: issueText
    },
    ...value
  });
}

function weaknessTypes(attempt: SavedRouteAttemptListItem): RouteWeakAreaAnalyticsType[] {
  return extractWeakAreaSignalsFromAttempt(attempt).weaknessTypes;
}

test("weak-area analytics handles empty attempt history", () => {
  const summary = buildRouteWeakAreaAnalytics([]);

  assert.equal(summary.totalAttempts, 0);
  assert.equal(summary.analysedAttempts, 0);
  assert.equal(summary.trend, "insufficient_data");
  assert.deepEqual(summary.topWeakAreas, []);
  assert.match(summary.emptyMessage ?? "", /No saved route attempts/i);
});

test("weak-area analytics detects repeated one-way violations", () => {
  const summary = buildRouteWeakAreaAnalytics([
    failedAttempt("attempt-1", "2026-06-20T10:00:00.000Z", "One-way road ignored on r18 near n12."),
    failedAttempt("attempt-2", "2026-06-21T10:00:00.000Z", "Wrong way on one-way road r18 at n12.")
  ]);

  assert.equal(summary.topWeakAreas[0].type, "one-way");
  assert.equal(summary.topWeakAreas[0].count, 2);
  assert.equal(summary.topWeakAreas[0].message, "You often lose marks on one-way systems.");
  assert.deepEqual(summary.topWeakAreas[0].relatedRoadIds, ["r18"]);
});

test("weak-area analytics detects no-entry violations", () => {
  const summary = buildRouteWeakAreaAnalytics([
    failedAttempt("attempt-1", "2026-06-20T10:00:00.000Z", "No-entry road used on r09 at n04.")
  ]);

  assert.equal(summary.topWeakAreas[0].type, "no-entry");
  assert.match(summary.topWeakAreas[0].message, /no[- ]entry/i);
});

test("weak-area analytics detects prohibited-turn violations", () => {
  const summary = buildRouteWeakAreaAnalytics([
    failedAttempt("attempt-1", "2026-06-20T10:00:00.000Z", "No left turn: r24 -> r22 at n19."),
    failedAttempt("attempt-2", "2026-06-21T10:00:00.000Z", "Prohibited turn from r16 to r13 at n12.")
  ]);

  const prohibitedTurn = summary.topWeakAreas.find((item) => item.type === "prohibited-turn");

  assert.ok(prohibitedTurn);
  assert.equal(prohibitedTurn.count, 2);
  assert.deepEqual(prohibitedTurn.relatedJunctionNodeIds, ["n12", "n19"]);
});

test("weak-area analytics detects off-road and disconnected drawings", () => {
  const summary = buildRouteWeakAreaAnalytics([
    failedAttempt("attempt-1", "2026-06-20T10:00:00.000Z", "Disconnected matched roads between r17 and r04."),
    failedAttempt("attempt-2", "2026-06-21T10:00:00.000Z", "Off-road drawing could not be matched.")
  ]);

  assert.equal(summary.topWeakAreas[0].type, "off-road-disconnected-drawing");
  assert.equal(summary.topWeakAreas[0].priority, "high");
});

test("weak-area analytics detects inefficient legal routes and long-route failures", () => {
  const attempt = savedAttempt({
    id: "attempt-1",
    statusLabel: "Fail",
    passed: false,
    isLegal: true,
    scoreLabel: "62.0%",
    userDistanceMeters: 1600,
    shortestDistanceMeters: 1000,
    extraDistanceMeters: 600,
    failureReason: "below_efficiency_threshold",
    reviewPayload: {
      status: "fail",
      title: "Route failed",
      illegalMovements: [],
      missedRestrictions: [],
      suggestedFailureReason: "Your route was too long."
    }
  });
  const summary = buildRouteWeakAreaAnalytics([attempt]);

  assert.ok(summary.topWeakAreas.some((item) => item.type === "inefficient-legal-route"));
  assert.ok(summary.topWeakAreas.some((item) => item.type === "long-route-failure"));
  assert.ok(weaknessTypes(attempt).includes("inefficient-legal-route"));
});

test("weak-area analytics detects missed checkpoints and wrong checkpoint order", () => {
  const summary = buildRouteWeakAreaAnalytics([
    savedAttempt({
      id: "attempt-1",
      statusLabel: "Fail",
      passed: false,
      isLegal: true,
      failureReason: "missed_required_stop",
      reviewPayload: {
        status: "fail",
        title: "Route failed",
        illegalMovements: [],
        missedRestrictions: [
          {
            id: "missed-checkpoint",
            label: "Missed checkpoint",
            detail: "Required checkpoint n07 was not visited.",
            severity: "error"
          }
        ],
        suggestedFailureReason: "You missed checkpoints in the required route."
      }
    }),
    savedAttempt({
      id: "attempt-2",
      statusLabel: "Fail",
      passed: false,
      isLegal: true,
      failureReason: "wrong checkpoint order",
      reviewPayload: {
        status: "fail",
        title: "Route failed",
        illegalMovements: [],
        missedRestrictions: [
          {
            id: "wrong-order",
            label: "Wrong checkpoint order",
            detail: "Checkpoint n09 was visited before n07.",
            severity: "error"
          }
        ],
        suggestedFailureReason: "Checkpoints were visited out of order."
      }
    })
  ]);

  assert.ok(summary.topWeakAreas.some((item) => item.type === "missed-checkpoint"));
  assert.ok(summary.topWeakAreas.some((item) => item.type === "wrong-checkpoint-order"));
  assert.ok(summary.topWeakAreas.find((item) => item.type === "missed-checkpoint")?.message.includes("checkpoints"));
});

test("weak-area analytics ranks mixed weaknesses using frequency and recency", () => {
  const summary = buildRouteWeakAreaAnalytics(
    [
      failedAttempt("attempt-1", "2026-06-20T10:00:00.000Z", "One-way road ignored on r18."),
      failedAttempt("attempt-2", "2026-06-21T10:00:00.000Z", "One-way road ignored on r18."),
      failedAttempt("attempt-3", "2026-06-22T10:00:00.000Z", "No-entry road used on r09."),
      failedAttempt("attempt-4", "2026-06-23T10:00:00.000Z", "No-entry road used on r09.")
    ],
    {
      recentAttemptWindow: 2
    }
  );

  assert.equal(summary.topWeakAreas[0].type, "no-entry");
  assert.equal(summary.topWeakAreas[0].count, 2);
  assert.equal(summary.topWeakAreas[0].recentCount, 2);
});

test("weak-area analytics reports repeated road and junction failures when ids exist", () => {
  const summary = buildRouteWeakAreaAnalytics(
    [
      failedAttempt("attempt-1", "2026-06-20T10:00:00.000Z", "No-entry road used on r09 at n04."),
      failedAttempt("attempt-2", "2026-06-21T10:00:00.000Z", "Wrong way on r09 at n04.")
    ],
    {
      maxItems: 8
    }
  );

  assert.ok(summary.topWeakAreas.some((item) => item.id === "specific-road:r09"));
  assert.ok(summary.topWeakAreas.some((item) => item.id === "specific-junction:n04"));
});

test("weak-area analytics reports trend from saved attempts", () => {
  const summary = buildRouteWeakAreaAnalytics([
    failedAttempt("attempt-1", "2026-06-20T10:00:00.000Z", "No-entry road used on r09."),
    failedAttempt("attempt-2", "2026-06-21T10:00:00.000Z", "One-way road ignored on r18."),
    savedAttempt({
      id: "attempt-3",
      createdAt: "2026-06-22T10:00:00.000Z"
    }),
    savedAttempt({
      id: "attempt-4",
      createdAt: "2026-06-23T10:00:00.000Z"
    })
  ]);

  assert.equal(summary.trend, "improving");
  assert.match(summary.trendMessage, /fewer weak-area signals/i);
});
