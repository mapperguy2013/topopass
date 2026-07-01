import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { SavedRouteAttemptListItem } from "../../../dev/route-runner/routeAttemptStorage.ts";
import {
  LOCAL_BETA_ATTEMPT_REVIEW_DIR,
  LOCAL_BETA_ATTEMPT_REVIEW_FILE
} from "../../../practice/real-london/betaAttemptReview.ts";
import { handleBetaAttemptReviewRequest } from "./betaAttemptReviewApi.ts";

test("Stage 138 attempt review API returns unavailable when the review flag is disabled", async () => {
  const result = await handleBetaAttemptReviewRequest({
    url: "http://localhost/api/beta-attempts/review",
    env: { NODE_ENV: "test", BETA_ATTEMPT_REVIEW_ENABLED: "false" }
  });
  const body = JSON.parse(result.body) as { status: string; reasonCode: string };

  assert.equal(result.status, 403);
  assert.equal(result.contentType, "application/json");
  assert.equal(body.status, "unavailable");
  assert.equal(body.reasonCode, "beta-attempt-review-disabled");
});

test("Stage 138 attempt review API rejects unsupported methods with a stable JSON error", async () => {
  const result = await handleBetaAttemptReviewRequest({
    url: "http://localhost/api/beta-attempts/review",
    method: "POST",
    env: { NODE_ENV: "test", BETA_ATTEMPT_REVIEW_ENABLED: "true" }
  });
  const body = JSON.parse(result.body) as { status: string; reasonCode: string; message: string };

  assert.equal(result.status, 405);
  assert.equal(result.contentType, "application/json");
  assert.equal(body.status, "rejected");
  assert.equal(body.reasonCode, "unsupported-method");
  assert.match(body.message, /GET/);
});

test("Stage 138 attempt review API reads local JSONL attempts and applies filters", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "topopass-beta-attempt-review-api-"));

  try {
    await writeLocalAttempts(tempDir, [
      storedAttempt(buildSavedAttempt({ id: "attempt-pass", statusLabel: "Pass", passed: true, isLegal: true })),
      storedAttempt(
        buildSavedAttempt({
          id: "attempt-fail",
          exerciseId: "osm-real-pilot-checkpoint-route",
          statusLabel: "Fail",
          passed: false,
          isLegal: false
        })
      )
    ]);

    const result = await handleBetaAttemptReviewRequest({
      url: "http://localhost/api/beta-attempts/review?status=fail&legality=illegal",
      env: { NODE_ENV: "development", BETA_ATTEMPT_REVIEW_ENABLED: "true" },
      cwd: tempDir
    });
    const body = JSON.parse(result.body) as {
      status: string;
      acceptedRecordCount: number;
      records: Array<{ id: string; exerciseId: string; legalityLabel: string }>;
    };

    assert.equal(result.status, 200);
    assert.equal(body.status, "available");
    assert.equal(body.acceptedRecordCount, 1);
    assert.deepEqual(body.records.map((record) => ({
      id: record.id,
      exerciseId: record.exerciseId,
      legalityLabel: record.legalityLabel
    })), [
      {
        id: "attempt-fail",
        exerciseId: "osm-real-pilot-checkpoint-route",
        legalityLabel: "Illegal"
      }
    ]);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("Stage 138 attempt review API reports missing local storage safely", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "topopass-beta-attempt-review-api-empty-"));

  try {
    const result = await handleBetaAttemptReviewRequest({
      url: "http://localhost/api/beta-attempts/review",
      env: { NODE_ENV: "test", BETA_ATTEMPT_REVIEW_ENABLED: "true" },
      cwd: tempDir
    });
    const body = JSON.parse(result.body) as {
      status: string;
      acceptedRecordCount: number;
      hasReviewableAttempts: boolean;
    };

    assert.equal(result.status, 200);
    assert.equal(body.status, "available");
    assert.equal(body.acceptedRecordCount, 0);
    assert.equal(body.hasReviewableAttempts, false);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("Stage 138 attempt review API JSON repro export is stable and hides secrets", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "topopass-beta-attempt-review-api-json-"));

  try {
    await writeLocalAttempts(tempDir, [
      storedAttempt(buildSavedAttempt({ id: "attempt-json", createdAt: "2026-07-01T10:00:00.000Z" }))
    ]);

    const result = await handleBetaAttemptReviewRequest({
      url: "http://localhost/api/beta-attempts/review?format=json",
      env: {
        NODE_ENV: "test",
        BETA_ATTEMPT_REVIEW_ENABLED: "true",
        SUPABASE_SERVICE_ROLE_KEY: "server-secret"
      },
      cwd: tempDir
    });
    const body = JSON.parse(result.body) as Array<{
      attemptId: string;
      mapVersion: string;
      exerciseVersion: string;
      scoringResult: { statusLabel: string };
      legalityResult: { legalityLabel: string };
    }>;

    assert.equal(result.status, 200);
    assert.equal(result.contentType, "application/json");
    assert.deepEqual(body, [
      {
        attemptId: "attempt-json",
        createdAt: "2026-07-01T10:00:00.000Z",
        mapId: "osm-real-london-pilot",
        mapVersion: "1.0.0",
        exerciseId: "osm-real-pilot-short-crossing",
        exerciseVersion: "1.0.0",
        attemptSnapshot: {
          versionSnapshot: {
            mapId: "osm-real-london-pilot",
            mapVersion: "1.0.0",
            exerciseId: "osm-real-pilot-short-crossing",
            exerciseVersion: "1.0.0"
          },
          storageSource: "local-jsonl",
          storageStatus: "stored"
        },
        routeInput: {
          matchedRoute: {
            selectedRoadIds: ["road-1"],
            selectedNodeIds: ["node-1", "node-2"],
            directedEdgeIds: ["edge-1"]
          },
          perLegBreakdown: [],
          rawReviewPayload: {
            status: "pass",
            title: "Route passed",
            versionSnapshot: {
              mapId: "osm-real-london-pilot",
              mapVersion: "1.0.0",
              exerciseId: "osm-real-pilot-short-crossing",
              exerciseVersion: "1.0.0"
            },
            illegalMovements: []
          }
        },
        scoringResult: {
          statusLabel: "Pass",
          scoreLabel: "92.0%",
          passed: true,
          userDistanceMeters: 120,
          shortestDistanceMeters: 100,
          extraDistanceMeters: 20,
          failureReason: "None"
        },
        legalityResult: {
          isLegal: true,
          legalityLabel: "Legal",
          failureReason: "None",
          illegalMovements: []
        },
        appBuildVersion: null
      }
    ]);
    assert.doesNotMatch(result.body, /server-secret/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("Stage 138 attempt review API reports production unavailable", async () => {
  const result = await handleBetaAttemptReviewRequest({
    url: "http://localhost/api/beta-attempts/review",
    env: { NODE_ENV: "production", BETA_ATTEMPT_REVIEW_ENABLED: "true" }
  });
  const body = JSON.parse(result.body) as { status: string; reasonCode: string };

  assert.equal(result.status, 503);
  assert.equal(body.status, "unavailable");
  assert.equal(body.reasonCode, "production-attempt-review-unavailable");
});

async function writeLocalAttempts(tempDir: string, records: unknown[]) {
  const directory = path.join(tempDir, LOCAL_BETA_ATTEMPT_REVIEW_DIR);
  const filePath = path.join(directory, LOCAL_BETA_ATTEMPT_REVIEW_FILE);
  await mkdir(directory, { recursive: true });
  await writeFile(filePath, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`, "utf8");
}

function storedAttempt(attempt: SavedRouteAttemptListItem) {
  return {
    id: attempt.id,
    storedAt: attempt.createdAt,
    attempt
  };
}

function buildSavedAttempt(input: Partial<SavedRouteAttemptListItem> = {}): SavedRouteAttemptListItem {
  const exerciseId = input.exerciseId ?? "osm-real-pilot-short-crossing";
  const mapId = input.mapId ?? "osm-real-london-pilot";

  return {
    id: input.id ?? "attempt-1",
    exerciseId,
    exerciseLabel: input.exerciseLabel ?? "Real London beta route",
    mapId,
    mapVersion: input.mapVersion ?? "1.0.0",
    exerciseVersion: input.exerciseVersion ?? "1.0.0",
    createdAt: input.createdAt ?? "2026-07-01T10:00:00.000Z",
    dateLabel: input.dateLabel ?? "1 Jul 2026, 10:00",
    scoreLabel: input.scoreLabel ?? "92.0%",
    statusLabel: input.statusLabel ?? "Pass",
    passed: input.passed ?? true,
    isLegal: input.isLegal ?? true,
    userDistanceMeters: input.userDistanceMeters ?? 120,
    shortestDistanceMeters: input.shortestDistanceMeters ?? 100,
    extraDistanceMeters: input.extraDistanceMeters ?? 20,
    userDistanceLabel: input.userDistanceLabel ?? "120 m",
    shortestDistanceLabel: input.shortestDistanceLabel ?? "100 m",
    extraDistanceLabel: input.extraDistanceLabel ?? "+20 m",
    failureReason: input.failureReason ?? "None",
    reviewTitle: input.reviewTitle ?? "Route passed",
    reviewPayload:
      input.reviewPayload ??
      ({
        status: "pass",
        title: "Route passed",
        versionSnapshot: {
          mapId,
          mapVersion: "1.0.0",
          exerciseId,
          exerciseVersion: "1.0.0"
        },
        illegalMovements: []
      } satisfies Record<string, unknown>),
    matchedRoute:
      input.matchedRoute ??
      ({
        selectedRoadIds: ["road-1"],
        selectedNodeIds: ["node-1", "node-2"],
        directedEdgeIds: ["edge-1"]
      } satisfies Record<string, unknown>),
    perLegBreakdown: input.perLegBreakdown ?? []
  };
}
