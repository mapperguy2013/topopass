import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { SavedRouteAttemptListItem } from "../../dev/route-runner/routeAttemptStorage.ts";
import {
  LOCAL_BETA_ATTEMPT_REVIEW_DIR,
  LOCAL_BETA_ATTEMPT_REVIEW_FILE,
  buildBetaAttemptReviewReport,
  exportBetaAttemptReviewJson
} from "./betaAttemptReview.ts";

test("Stage 138 attempt review report is unavailable when the internal flag is disabled", async () => {
  const report = await buildBetaAttemptReviewReport({
    env: { NODE_ENV: "test", BETA_ATTEMPT_REVIEW_ENABLED: "false" }
  });

  assert.equal(report.status, "unavailable");
  assert.equal(report.reasonCode, "beta-attempt-review-disabled");
  assert.equal(report.hasReviewableAttempts, false);
});

test("Stage 138 attempt review reads local JSONL attempts and sorts newest first", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "topopass-beta-attempt-review-"));

  try {
    await writeLocalAttempts(tempDir, [
      storedAttempt(buildSavedAttempt({ id: "attempt-old", createdAt: "2026-07-01T09:00:00.000Z" })),
      storedAttempt(
        buildSavedAttempt({
          id: "attempt-new",
          createdAt: "2026-07-01T11:00:00.000Z",
          exerciseId: "osm-real-pilot-checkpoint-route",
          statusLabel: "Fail",
          passed: false,
          isLegal: false,
          scoreLabel: "38.0%",
          failureReason: "Wrong-way movement detected"
        })
      )
    ]);

    const report = await buildBetaAttemptReviewReport({
      env: { NODE_ENV: "test", BETA_ATTEMPT_REVIEW_ENABLED: "true" },
      cwd: tempDir
    });

    assert.equal(report.status, "available");
    assert.equal(report.storageSource, "local-jsonl");
    assert.equal(report.acceptedRecordCount, 2);
    assert.deepEqual(report.records.map((record) => record.id), ["attempt-new", "attempt-old"]);
    assert.equal(report.records[0]?.exerciseId, "osm-real-pilot-checkpoint-route");
    assert.equal(report.records[0]?.legalityLabel, "Illegal");
    assert.equal(report.records[0]?.difficulty, "medium");
    assert.equal(report.records[0]?.routeType, "checkpoint");
    assert.equal(report.records[0]?.mapVersion, "1.0.0");
    assert.equal(report.records[0]?.exerciseVersion, "1.0.0");
    assert.notEqual(report.records[0]?.startLabel, "Start unavailable");
    assert.notEqual(report.records[0]?.destinationLabel, "Destination unavailable");
    assert.ok((report.records[0]?.checkpointLabels.length ?? 0) > 0);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("Stage 138 attempt filters and rejected local records are deterministic", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "topopass-beta-attempt-review-filter-"));

  try {
    await writeLocalAttempts(tempDir, [
      storedAttempt(buildSavedAttempt({ id: "attempt-pass", statusLabel: "Pass", passed: true, isLegal: true })),
      storedAttempt(
        buildSavedAttempt({
          id: "attempt-illegal",
          exerciseId: "osm-real-pilot-checkpoint-route",
          statusLabel: "Fail",
          passed: false,
          isLegal: false
        })
      ),
      {
        id: "invalid-attempt",
        storedAt: "2026-07-01T12:00:00.000Z",
        attempt: {
          id: "invalid-attempt"
        }
      },
      "{not valid json"
    ]);

    const report = await buildBetaAttemptReviewReport({
      env: { NODE_ENV: "test", BETA_ATTEMPT_REVIEW_ENABLED: "enabled" },
      cwd: tempDir,
      filters: {
        status: "fail",
        legality: "illegal"
      }
    });

    assert.equal(report.status, "available");
    assert.equal(report.totalRecordsConsidered, 4);
    assert.equal(report.acceptedRecordCount, 1);
    assert.equal(report.rejectedRecordCount, 2);
    assert.deepEqual(report.records.map((record) => record.id), ["attempt-illegal"]);
    assert.deepEqual(report.rejectedRecords, [
      {
        id: "invalid-attempt",
        storageSource: "local-jsonl",
        reasonCodes: ["invalid-attempt-record"]
      },
      {
        id: "line-4",
        storageSource: "local-jsonl",
        reasonCodes: ["invalid-jsonl-record"]
      }
    ]);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("Stage 138 attempt JSON repro export is stable and includes version, scoring, and legality summaries", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "topopass-beta-attempt-review-export-"));

  try {
    await writeLocalAttempts(tempDir, [
      storedAttempt(
        buildSavedAttempt({
          id: "attempt-export",
          createdAt: "2026-07-01T10:00:00.000Z",
          reviewPayload: {
            status: "pass",
            title: "Route passed",
            versionSnapshot: {
              mapId: "osm-real-london-pilot",
              mapVersion: "1.0.0",
              exerciseId: "osm-real-pilot-short-crossing",
              exerciseVersion: "1.0.0"
            },
            appBuildVersion: "test-build",
            illegalMovements: []
          }
        })
      )
    ]);

    const report = await buildBetaAttemptReviewReport({
      env: { NODE_ENV: "test", BETA_ATTEMPT_REVIEW_ENABLED: "true" },
      cwd: tempDir
    });

    assert.equal(report.status, "available");
    assert.deepEqual(JSON.parse(exportBetaAttemptReviewJson(report.records)), [
      {
        attemptId: "attempt-export",
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
            selectedRoadIds: ["road-1", "road-2"],
            selectedNodeIds: ["node-1", "node-2", "node-3"],
            directedEdgeIds: ["edge-1", "edge-2"]
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
            appBuildVersion: "test-build",
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
        appBuildVersion: "test-build"
      }
    ]);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("Stage 138 production attempt review is unavailable without a safe admin storage path", async () => {
  const report = await buildBetaAttemptReviewReport({
    env: { NODE_ENV: "production", BETA_ATTEMPT_REVIEW_ENABLED: "true" }
  });

  assert.equal(report.status, "unavailable");
  assert.equal(report.reasonCode, "production-attempt-review-unavailable");
});

test("Stage 138 client attempt review page does not read service-role environment variables", async () => {
  const source = await readFile(path.join(process.cwd(), "app/dev/beta-attempts/page.tsx"), "utf8");

  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE|SERVICE_ROLE_KEY/i);
});

async function writeLocalAttempts(tempDir: string, records: unknown[]) {
  const directory = path.join(tempDir, LOCAL_BETA_ATTEMPT_REVIEW_DIR);
  const filePath = path.join(directory, LOCAL_BETA_ATTEMPT_REVIEW_FILE);
  await mkdir(directory, { recursive: true });
  await writeFile(
    filePath,
    `${records.map((record) => (typeof record === "string" ? record : JSON.stringify(record))).join("\n")}\n`,
    "utf8"
  );
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
        selectedRoadIds: ["road-1", "road-2"],
        selectedNodeIds: ["node-1", "node-2", "node-3"],
        directedEdgeIds: ["edge-1", "edge-2"]
      } satisfies Record<string, unknown>),
    perLegBreakdown: input.perLegBreakdown ?? []
  };
}
