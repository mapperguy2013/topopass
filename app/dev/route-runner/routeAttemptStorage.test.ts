import assert from "node:assert/strict";
import test from "node:test";
import type { DrawnRoutePipelineResult, RunRouteExerciseResult } from "../../../lib/map-engine/index.ts";
import { buildRouteAttemptReview } from "./routeAttemptReview.ts";
import {
  buildRouteAttemptInsert,
  listRouteAttempts,
  mapRouteAttemptRow,
  mapRouteAttemptRows,
  ROUTE_ATTEMPT_REVIEW_SCHEMA_VERSION,
  saveRouteAttempt
} from "./routeAttemptStorage.ts";
import type { TableRow } from "../../../lib/db/types.ts";

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
    exerciseId: "fox-lane-to-northgate-hospital",
    normalisedAttempt: {
      exerciseId: "fox-lane-to-northgate-hospital",
      destinationLandmarkIds: ["northgate-hospital"],
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
      userRouteDistanceMeters: 1000,
      shortestLegalRouteDistanceMeters: 1000,
      userDistanceMeters: 1000,
      shortestLegalDistanceMeters: 1000,
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

type RecordedDbCall = {
  table: string;
  operation: "eq" | "insert" | "is" | "limit" | "order" | "select";
  column?: string;
  value?: unknown;
  values?: unknown;
  options?: unknown;
};

class RecordingQuery {
  private readonly table: string;
  private readonly calls: RecordedDbCall[];
  private readonly rows: unknown[] | null;
  private readonly errorMessage: string | null;
  private values: unknown;

  constructor(table: string, calls: RecordedDbCall[], rows: unknown[] | null, errorMessage: string | null) {
    this.table = table;
    this.calls = calls;
    this.rows = rows;
    this.errorMessage = errorMessage;
  }

  insert(values: unknown) {
    this.values = values;
    this.calls.push({ table: this.table, operation: "insert", values });
    return this;
  }

  select() {
    this.calls.push({ table: this.table, operation: "select" });
    return this;
  }

  eq(column: string, value: unknown) {
    this.calls.push({ table: this.table, operation: "eq", column, value });
    return this;
  }

  is(column: string, value: unknown) {
    this.calls.push({ table: this.table, operation: "is", column, value });
    return this;
  }

  order(column: string, options?: unknown) {
    this.calls.push({ table: this.table, operation: "order", column, options });
    return this;
  }

  limit(value: number) {
    this.calls.push({ table: this.table, operation: "limit", value });
    return this;
  }

  single<T = unknown>() {
    return Promise.resolve({
      data: { id: "route-attempt-id" } as T,
      error: null
    });
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return Promise.resolve({
      data: this.rows ?? this.values,
      error: this.errorMessage ? { message: this.errorMessage } : null
    }).then(onfulfilled, onrejected);
  }
}

class RecordingClient {
  calls: RecordedDbCall[] = [];
  rows: unknown[] | null;
  errorMessage: string | null;
  auth = {
    getUser: async () => ({
      data: {
        user: {
          id: "11111111-1111-4111-8111-111111111111"
        }
      }
    })
  };

  constructor(options: { rows?: unknown[]; errorMessage?: string } = {}) {
    this.rows = options.rows ?? null;
    this.errorMessage = options.errorMessage ?? null;
  }

  from(table: string) {
    return new RecordingQuery(table, this.calls, this.rows, this.errorMessage);
  }
}

function routeAttemptRow(value: Partial<TableRow<"route_attempts">> = {}): TableRow<"route_attempts"> {
  return {
    id: "attempt-1",
    user_id: null,
    exercise_id: "fox-lane-to-northgate-hospital",
    score: 83.3,
    passed: true,
    failure_reason: null,
    user_distance_m: 1200,
    shortest_distance_m: 1000,
    extra_distance_m: 200,
    violations: [],
    missed_restrictions: [],
    correction_hints: ["Keep checking signs."],
    practice_recommendations: [],
    matched_route: { orderedRoadIds: ["r01"] },
    review_payload: {
      status: "pass",
      title: "Route passed",
      scoreLabel: "83.3% (pass)"
    },
    review_schema_version: 1,
    created_at: "2026-06-25T10:15:00.000Z",
    ...value
  };
}

test("buildRouteAttemptInsert stores score, pass/fail, distances, and review payload", () => {
  const result = exerciseResult({
    score: {
      ...exerciseResult().score,
      passed: false,
      status: "fail",
      scorePercent: 62.4,
      efficiencyRatio: 0.624,
      scoreRatio: 0.624,
      userRouteDistanceMeters: 1420,
      shortestLegalRouteDistanceMeters: 1080,
      userDistanceMeters: 1420,
      shortestLegalDistanceMeters: 1080,
      failureReasons: ["below_efficiency_threshold"]
    }
  });
  const review = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "scored",
      exerciseResult: result
    }),
    illegalMovements: []
  });
  const row = buildRouteAttemptInsert({
    userId: "11111111-1111-4111-8111-111111111111",
    exerciseId: result.exerciseId,
    review,
    score: result.score,
    matchedRoute: {
      orderedRoadIds: ["r01", "r02"],
      selectedNodeIds: ["n01", "n02", "n03"]
    }
  });

  assert.equal(row.user_id, "11111111-1111-4111-8111-111111111111");
  assert.equal(row.exercise_id, "fox-lane-to-northgate-hospital");
  assert.equal(row.score, 62.4);
  assert.equal(row.passed, false);
  assert.equal(row.user_distance_m, 1420);
  assert.equal(row.shortest_distance_m, 1080);
  assert.equal(row.extra_distance_m, 340);
  assert.match(row.failure_reason ?? "", /too long/i);
  assert.deepEqual(row.matched_route, {
    orderedRoadIds: ["r01", "r02"],
    selectedNodeIds: ["n01", "n02", "n03"]
  });
  assert.equal(row.review_schema_version, ROUTE_ATTEMPT_REVIEW_SCHEMA_VERSION);
  assert.equal((row.review_payload as { title?: string }).title, review.title);
});

test("buildRouteAttemptInsert stores violations, hints, and recommendations", () => {
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
  const row = buildRouteAttemptInsert({
    exerciseId: "no-entry-exercise",
    review,
    score: {
      scorePercent: 0,
      passed: false,
      userRouteDistanceMeters: 900,
      shortestLegalRouteDistanceMeters: 1000,
      failureReasons: ["illegal_route"]
    }
  });

  assert.equal(row.user_id, null);
  assert.equal((row.violations as unknown[]).length, 1);
  assert.equal((row.correction_hints as string[]).length > 0, true);
  assert.equal((row.practice_recommendations as unknown[]).length > 0, true);
  assert.equal((row.missed_restrictions as unknown[]).length, 0);
  assert.equal((row.review_payload as { suggestedFailureReason?: string }).suggestedFailureReason, review.suggestedFailureReason);
});

test("buildRouteAttemptInsert handles missing optional score and matched route safely", () => {
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
  const row = buildRouteAttemptInsert({
    exerciseId: "disconnected-exercise",
    review
  });

  assert.equal(row.score, null);
  assert.equal(row.passed, false);
  assert.equal(row.user_distance_m, null);
  assert.equal(row.shortest_distance_m, null);
  assert.equal(row.extra_distance_m, null);
  assert.equal(row.matched_route, null);
  assert.equal((row.missed_restrictions as unknown[]).length, 1);
  assert.match(row.failure_reason ?? "", /matched roads do not connect/i);
});

test("buildRouteAttemptInsert rejects pending reviews", () => {
  const review = buildRouteAttemptReview({
    pipelineResult: pipelineResult({ status: "empty" }),
    illegalMovements: []
  });

  assert.throws(
    () =>
      buildRouteAttemptInsert({
        exerciseId: "pending-exercise",
        review
      }),
    /pending route attempt review/
  );
});

test("saveRouteAttempt inserts route attempts through the supplied client", async () => {
  const client = new RecordingClient();
  const result = exerciseResult();
  const review = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "scored",
      exerciseResult: result
    }),
    illegalMovements: []
  });

  const saveResult = await saveRouteAttempt(
    {
      exerciseId: result.exerciseId,
      review,
      score: result.score,
      matchedRoute: {
        orderedRoadIds: ["r01"]
      }
    },
    { client }
  );

  assert.equal(saveResult.persisted, true);
  assert.equal(saveResult.id, "route-attempt-id");
  const insert = client.calls.find((call) => call.table === "route_attempts" && call.operation === "insert");

  assert.ok(insert);
  assert.equal((insert.values as { user_id?: string }).user_id, "11111111-1111-4111-8111-111111111111");
});

test("saveRouteAttempt returns a non-blocking result when Supabase is unavailable", async () => {
  const review = buildRouteAttemptReview({
    pipelineResult: pipelineResult({
      status: "scored",
      exerciseResult: exerciseResult()
    }),
    illegalMovements: []
  });

  const result = await saveRouteAttempt(
    {
      exerciseId: "no-client",
      review
    },
    { client: null }
  );

  assert.equal(result.persisted, false);
  assert.equal(result.source, "not-configured");
  assert.match(result.reason ?? "", /not saved/i);
});

test("mapRouteAttemptRow formats pass and fail display values", () => {
  const passAttempt = mapRouteAttemptRow(routeAttemptRow(), {
    exerciseTitleById: {
      "fox-lane-to-northgate-hospital": "Fox Lane Station to Northgate Hospital"
    }
  });
  const failAttempt = mapRouteAttemptRow(
    routeAttemptRow({
      id: "attempt-2",
      score: 62,
      passed: false,
      failure_reason: "Route was too long.",
      review_payload: {
        status: "fail",
        title: "Route failed"
      }
    })
  );

  assert.equal(passAttempt.exerciseLabel, "Fox Lane Station to Northgate Hospital");
  assert.match(passAttempt.dateLabel, /25 Jun 2026/);
  assert.equal(passAttempt.scoreLabel, "83.3%");
  assert.equal(passAttempt.statusLabel, "Pass");
  assert.equal(passAttempt.failureReason, "None");
  assert.equal(failAttempt.scoreLabel, "62.0%");
  assert.equal(failAttempt.statusLabel, "Fail");
  assert.equal(failAttempt.failureReason, "Route was too long.");
});

test("mapRouteAttemptRow falls back to review payload reason and unavailable dates", () => {
  const attempt = mapRouteAttemptRow(
    routeAttemptRow({
      created_at: "not-a-date",
      passed: false,
      failure_reason: null,
      review_payload: {
        status: "blocked",
        title: "Route was not scored",
        suggestedFailureReason: "The matched roads do not connect."
      }
    })
  );

  assert.equal(attempt.dateLabel, "Date unavailable");
  assert.equal(attempt.statusLabel, "Blocked");
  assert.equal(attempt.failureReason, "The matched roads do not connect.");
});

test("mapRouteAttemptRows sorts newest attempts first locally", () => {
  const attempts = mapRouteAttemptRows([
    routeAttemptRow({
      id: "old",
      created_at: "2026-06-20T10:00:00.000Z"
    }),
    routeAttemptRow({
      id: "new",
      created_at: "2026-06-25T10:00:00.000Z"
    })
  ]);

  assert.deepEqual(
    attempts.map((attempt) => attempt.id),
    ["new", "old"]
  );
});

test("listRouteAttempts maps rows and queries newest saved attempts", async () => {
  const client = new RecordingClient({
    rows: [
      routeAttemptRow({
        id: "attempt-old",
        created_at: "2026-06-20T10:00:00.000Z"
      }),
      routeAttemptRow({
        id: "attempt-new",
        created_at: "2026-06-25T10:00:00.000Z"
      })
    ]
  });

  const result = await listRouteAttempts(
    {
      exerciseId: "fox-lane-to-northgate-hospital",
      limit: 10
    },
    {
      client,
      exerciseTitleById: {
        "fox-lane-to-northgate-hospital": "Fox Lane Station to Northgate Hospital"
      }
    }
  );

  assert.equal(result.source, "supabase");
  assert.deepEqual(
    result.attempts.map((attempt) => attempt.id),
    ["attempt-new", "attempt-old"]
  );
  assert.equal(result.attempts[0].exerciseLabel, "Fox Lane Station to Northgate Hospital");
  assert.ok(client.calls.some((call) => call.operation === "eq" && call.column === "user_id"));
  assert.ok(client.calls.some((call) => call.operation === "eq" && call.column === "exercise_id"));
  assert.ok(client.calls.some((call) => call.operation === "order" && call.column === "created_at"));
  assert.ok(client.calls.some((call) => call.operation === "limit" && call.value === 10));
});

test("listRouteAttempts reads nullable dev attempts when no auth user exists", async () => {
  const client = new RecordingClient({ rows: [] });
  client.auth.getUser = async () => ({
    data: {
      user: null
    }
  });

  const result = await listRouteAttempts({}, { client });

  assert.deepEqual(result.attempts, []);
  assert.ok(client.calls.some((call) => call.operation === "is" && call.column === "user_id" && call.value === null));
});

test("listRouteAttempts returns empty and error states", async () => {
  const emptyResult = await listRouteAttempts({}, { client: new RecordingClient({ rows: [] }) });
  const errorResult = await listRouteAttempts({}, { client: new RecordingClient({ errorMessage: "database unavailable" }) });
  const notConfiguredResult = await listRouteAttempts({}, { client: null });

  assert.deepEqual(emptyResult.attempts, []);
  assert.equal(emptyResult.error, undefined);
  assert.deepEqual(errorResult.attempts, []);
  assert.equal(errorResult.error, "database unavailable");
  assert.match(errorResult.reason ?? "", /could not be loaded/i);
  assert.deepEqual(notConfiguredResult.attempts, []);
  assert.equal(notConfiguredResult.source, "not-configured");
});
