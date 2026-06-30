import assert from "node:assert/strict";
import test from "node:test";
import type { DrawnRoutePipelineResult, RunRouteExerciseResult } from "../../../lib/map-engine/index.ts";
import { marloweDistrictMap } from "../../../lib/map-engine/index.ts";
import { buildRouteAttemptReview } from "./routeAttemptReview.ts";
import { buildSavedAttemptReview } from "./routeAttemptHistoryReview.ts";
import { buildRouteAttemptInsert, mapRouteAttemptRow, type SavedRouteAttemptListItem } from "./routeAttemptStorage.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  ROUTE_RUNNER_MAP_OPTIONS,
  getRouteRunnerMapOption,
  realLondonOsmPilotRouteMap
} from "./routeRunnerMaps.ts";
import {
  createRouteAttemptVersionSnapshot,
  formatRouteAttemptVersionSnapshot
} from "./routeAttemptVersionSnapshot.ts";

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
    exerciseId: "snapshot-exercise",
    normalisedAttempt: {
      exerciseId: "snapshot-exercise",
      destinationLandmarkIds: [],
      requiredNodeIds: ["n01", "n02"],
      selectedNodeIds: ["n01", "n02"],
      selectedRoadIds: ["r01"],
      selectedDirectedEdgeIds: ["r01:forward"],
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
      legBreakdown: [],
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

function savedAttempt(value: Partial<SavedRouteAttemptListItem> = {}): SavedRouteAttemptListItem {
  return {
    id: "attempt-1",
    exerciseId: "snapshot-exercise",
    exerciseLabel: "Snapshot Exercise",
    mapId: "snapshot-map",
    mapVersion: "1.0.0",
    exerciseVersion: "1.0.0",
    createdAt: "2026-06-25T10:15:00.000Z",
    dateLabel: "25 Jun 2026, 10:15",
    scoreLabel: "100.0%",
    statusLabel: "Pass",
    passed: true,
    isLegal: true,
    userDistanceMeters: 100,
    shortestDistanceMeters: 100,
    extraDistanceMeters: 0,
    userDistanceLabel: "100 m",
    shortestDistanceLabel: "100 m",
    extraDistanceLabel: "+0 m",
    failureReason: "None",
    reviewTitle: "Route passed",
    reviewPayload: {
      status: "pass",
      title: "Route passed",
      scoreLabel: "100.0% (pass)",
      distanceMetrics: [],
      illegalMovements: [],
      missedRestrictions: [],
      suggestedFailureReason: null
    },
    matchedRoute: null,
    perLegBreakdown: [],
    ...value
  };
}

test("Stage 125 route attempt captures selected map and exercise versions", () => {
  const snapshot = createRouteAttemptVersionSnapshot({
    map: { id: "snapshot-map", mapVersion: "2.3.4" },
    exercise: { id: "snapshot-exercise", exerciseVersion: "5.6.7" }
  });
  const review = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult()
    }),
    illegalMovements: [],
    versionSnapshot: snapshot
  });

  assert.deepEqual(review.versionSnapshot, {
    mapId: "snapshot-map",
    mapVersion: "2.3.4",
    exerciseId: "snapshot-exercise",
    exerciseVersion: "5.6.7"
  });
});

test("Stage 125 captured snapshot remains stable after source metadata changes", () => {
  const map = { id: "snapshot-map", mapVersion: "1.0.0" };
  const exercise = { id: "snapshot-exercise", exerciseVersion: "1.0.0" };
  const review = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult()
    }),
    illegalMovements: [],
    versionSnapshot: createRouteAttemptVersionSnapshot({ map, exercise })
  });

  map.mapVersion = "9.9.9";
  exercise.exerciseVersion = "8.8.8";

  assert.deepEqual(review.versionSnapshot, {
    mapId: "snapshot-map",
    mapVersion: "1.0.0",
    exerciseId: "snapshot-exercise",
    exerciseVersion: "1.0.0"
  });
});

test("Stage 125 storage insert prefers the stored review snapshot", () => {
  const review = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult()
    }),
    illegalMovements: [],
    versionSnapshot: {
      mapId: "snapshotted-map",
      mapVersion: "1.2.3",
      exerciseId: "snapshotted-exercise",
      exerciseVersion: "4.5.6"
    }
  });
  const row = buildRouteAttemptInsert({
    exerciseId: "snapshot-exercise",
    review,
    score: exerciseResult().score
  });

  assert.equal(row.map_id, "snapshotted-map");
  assert.equal(row.map_version, "1.2.3");
  assert.equal(row.exercise_version, "4.5.6");
  assert.deepEqual((row.review_payload as { versionSnapshot?: unknown }).versionSnapshot, review.versionSnapshot);
});

test("Stage 125 attempt review display uses stored snapshot and handles legacy attempts", () => {
  const reviewed = buildSavedAttemptReview(
    savedAttempt({
      mapId: "stored-map",
      mapVersion: "2.0.0",
      exerciseVersion: "3.0.0",
      reviewPayload: {
        status: "pass",
        title: "Route passed",
        versionSnapshot: {
          mapId: "stale-map",
          mapVersion: "9.9.9",
          exerciseId: "snapshot-exercise",
          exerciseVersion: "9.9.9"
        }
      }
    })
  );
  const legacy = buildSavedAttemptReview(
    savedAttempt({
      mapId: null,
      mapVersion: null,
      exerciseVersion: null,
      reviewPayload: {
        status: "pass",
        title: "Route passed"
      }
    })
  );

  assert.ok(reviewed);
  assert.equal(reviewed.versionLabel, "map 2.0.0 | exercise 3.0.0");
  assert.deepEqual(reviewed.versionSnapshot, {
    mapId: "stored-map",
    mapVersion: "2.0.0",
    exerciseId: "snapshot-exercise",
    exerciseVersion: "3.0.0"
  });
  assert.ok(legacy);
  assert.equal(legacy.versionLabel, "map version unavailable | exercise version unavailable");
});

test("Stage 125 row mapping and display preserve legacy missing version state", () => {
  const mapped = mapRouteAttemptRow({
    id: "attempt-legacy",
    user_id: null,
    exercise_id: "legacy-exercise",
    map_id: null,
    map_version: null,
    exercise_version: null,
    score: null,
    passed: null,
    is_legal: null,
    failure_reason: null,
    user_distance_m: null,
    shortest_distance_m: null,
    extra_distance_m: null,
    violations: [],
    missed_restrictions: [],
    correction_hints: [],
    practice_recommendations: [],
    matched_route: null,
    per_leg_breakdown: [],
    review_payload: {},
    review_schema_version: 1,
    created_at: null
  });
  const review = buildSavedAttemptReview(mapped);

  assert.equal(mapped.mapVersion, null);
  assert.equal(mapped.exerciseVersion, null);
  assert.ok(review);
  assert.equal(review.versionLabel, "map version unavailable | exercise version unavailable");
});

test("Stage 125 snapshot metadata is presentation-only for scoring outputs", () => {
  const baseInput = {
    pipelineResult: pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult()
    }),
    illegalMovements: []
  };
  const withoutSnapshot = buildRouteAttemptReview(baseInput);
  const withSnapshot = buildRouteAttemptReview({
    ...baseInput,
    versionSnapshot: {
      mapId: "snapshot-map",
      mapVersion: "1.0.0",
      exerciseId: "snapshot-exercise",
      exerciseVersion: "1.0.0"
    }
  });

  assert.equal(withSnapshot.status, withoutSnapshot.status);
  assert.equal(withSnapshot.scoreLabel, withoutSnapshot.scoreLabel);
  assert.equal(withSnapshot.distanceLabel, withoutSnapshot.distanceLabel);
  assert.deepEqual(withSnapshot.distanceMetrics, withoutSnapshot.distanceMetrics);
  assert.deepEqual(withSnapshot.illegalMovements, withoutSnapshot.illegalMovements);
  assert.deepEqual(withSnapshot.missedRestrictions, withoutSnapshot.missedRestrictions);
});

test("Stage 125 preserves Marlowe default and real London committed fixture source", () => {
  const realPilotOption = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.equal(DEFAULT_ROUTE_RUNNER_MAP_ID, marloweDistrictMap.id);
  assert.equal(ROUTE_RUNNER_MAP_OPTIONS[0]?.id, marloweDistrictMap.id);
  assert.notEqual(DEFAULT_ROUTE_RUNNER_MAP_ID, realLondonOsmPilotRouteMap.id);
  assert.equal(realPilotOption?.fixtureName, "realLondonPilotOverpass.json");
  assert.ok(realPilotOption?.sourceOverpassFixture);
});

test("Stage 125 snapshot formatter uses deterministic missing labels", () => {
  assert.deepEqual(formatRouteAttemptVersionSnapshot(null), {
    mapLabel: "Map version unavailable",
    exerciseLabel: "Exercise version unavailable",
    compactLabel: "map version unavailable | exercise version unavailable"
  });
});
