import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  LOCAL_BETA_FEEDBACK_DIR,
  LOCAL_BETA_FEEDBACK_FILE
} from "./betaFeedbackStore.ts";
import {
  buildBetaFeedbackReviewReport,
  exportBetaFeedbackReviewCsv,
  exportBetaFeedbackReviewJson
} from "./betaFeedbackReview.ts";
import { buildRealLondonBetaFeedbackMetadata } from "./realLondonBetaFeedback.ts";
import type { RealLondonBetaFeedbackPayload } from "./realLondonBetaFeedback.ts";

test("Stage 136 review report is unavailable when the internal flag is disabled", async () => {
  const report = await buildBetaFeedbackReviewReport({
    env: { NODE_ENV: "test", BETA_FEEDBACK_REVIEW_ENABLED: "false" }
  });

  assert.equal(report.status, "unavailable");
  assert.equal(report.reasonCode, "beta-feedback-review-disabled");
  assert.equal(report.hasReviewableFeedback, false);
});

test("Stage 136 review report reads local JSONL feedback and sorts newest first", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "topopass-beta-feedback-review-"));

  try {
    await writeLocalRecords(tempDir, [
      storedRecord(buildPayload({ timestamp: "2026-07-01T09:00:00.000Z", rating: 5 })),
      storedRecord(
        buildPayload({
          timestamp: "2026-07-01T11:00:00.000Z",
          exerciseId: "osm-real-pilot-medium-route",
          rating: 2,
          issueType: "route-unclear",
          comments: "The instruction could be clearer."
        })
      )
    ]);

    const report = await buildBetaFeedbackReviewReport({
      env: { NODE_ENV: "test", BETA_FEEDBACK_REVIEW_ENABLED: "true" },
      cwd: tempDir
    });

    assert.equal(report.status, "available");
    assert.equal(report.storageSource, "local-jsonl");
    assert.equal(report.acceptedRecordCount, 2);
    assert.deepEqual(
      report.records.map((record) => record.exerciseId),
      ["osm-real-pilot-medium-route", "osm-real-pilot-short-route"]
    );
    assert.equal(report.records[0]?.feedbackText, "The instruction could be clearer.");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("Stage 136 review filters and rejected local records are deterministic", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "topopass-beta-feedback-review-filter-"));

  try {
    await writeLocalRecords(tempDir, [
      storedRecord(buildPayload({ timestamp: "2026-07-01T09:00:00.000Z", rating: 5 })),
      storedRecord(
        buildPayload({
          timestamp: "2026-07-01T10:00:00.000Z",
          exerciseId: "osm-real-pilot-medium-route",
          rating: 2,
          issueType: "route-unclear"
        })
      ),
      {
        submissionId: "invalid-record",
        storedAt: "2026-07-01T12:00:00.000Z",
        payload: {
          metadata: {},
          rating: 9,
          issueType: "unknown",
          comments: ""
        }
      }
    ]);

    const report = await buildBetaFeedbackReviewReport({
      env: { NODE_ENV: "test", BETA_FEEDBACK_REVIEW_ENABLED: "enabled" },
      cwd: tempDir,
      filters: {
        rating: 2,
        feedbackType: "route-unclear"
      }
    });

    assert.equal(report.status, "available");
    assert.equal(report.totalRecordsConsidered, 3);
    assert.equal(report.acceptedRecordCount, 1);
    assert.equal(report.rejectedRecordCount, 1);
    assert.deepEqual(report.records.map((record) => record.exerciseId), ["osm-real-pilot-medium-route"]);
    assert.deepEqual(report.rejectedRecords, [
      {
        id: "invalid-record",
        storageSource: "local-jsonl",
        reasonCodes: ["invalid-rating", "invalid-issue-type", "empty-comments", "invalid-metadata"]
      }
    ]);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("Stage 136 CSV and JSON exports are stable and include only validated records", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "topopass-beta-feedback-review-export-"));

  try {
    await writeLocalRecords(tempDir, [
      storedRecord(
        buildPayload({
          timestamp: "2026-07-01T11:00:00.000Z",
          comments: "Needs \"quote\" and comma, please."
        })
      ),
      {
        submissionId: "invalid-record",
        storedAt: "2026-07-01T12:00:00.000Z",
        payload: {
          metadata: {},
          rating: 9,
          issueType: "unknown",
          comments: ""
        }
      }
    ]);

    const report = await buildBetaFeedbackReviewReport({
      env: { NODE_ENV: "test", BETA_FEEDBACK_REVIEW_ENABLED: "true" },
      cwd: tempDir
    });

    assert.equal(report.status, "available");

    const csv = exportBetaFeedbackReviewCsv(report.records);
    const json = exportBetaFeedbackReviewJson(report.records);

    assert.equal(
      csv,
      [
        "createdAt,mapId,exerciseId,rating,feedbackType,feedbackText,mapVersion,exerciseVersion,exerciseTitle,appBuildVersion,storageSource,storageStatus,recordId",
        '2026-07-01T11:00:00.000Z,osm-real-london-pilot,osm-real-pilot-short-route,5,map-display-issue,"Needs ""quote"" and comma, please.",1.0.0,1.0.0,Short route,,local-jsonl,stored,beta-feedback:2026-07-01T11:00:00.000Z'
      ].join("\n")
    );
    assert.deepEqual(JSON.parse(json), [
      {
        id: "beta-feedback:2026-07-01T11:00:00.000Z",
        createdAt: "2026-07-01T11:00:00.000Z",
        mapId: "osm-real-london-pilot",
        exerciseId: "osm-real-pilot-short-route",
        rating: 5,
        feedbackType: "map-display-issue",
        feedbackText: 'Needs "quote" and comma, please.',
        mapVersion: "1.0.0",
        exerciseVersion: "1.0.0",
        exerciseTitle: "Short route",
        appBuildVersion: null,
        storageSource: "local-jsonl",
        storageStatus: "stored",
        rawPayload: buildPayload({
          timestamp: "2026-07-01T11:00:00.000Z",
          comments: 'Needs "quote" and comma, please.'
        })
      }
    ]);
    assert.doesNotMatch(csv, /invalid-record/);
    assert.doesNotMatch(json, /invalid-record/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("Stage 136 client review page does not read service-role environment variables", async () => {
  const source = await readFile(
    path.join(process.cwd(), "app/dev/beta-feedback/page.tsx"),
    "utf8"
  );

  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE|SERVICE_ROLE_KEY/i);
});

async function writeLocalRecords(tempDir: string, records: unknown[]) {
  const directory = path.join(tempDir, LOCAL_BETA_FEEDBACK_DIR);
  const filePath = path.join(directory, LOCAL_BETA_FEEDBACK_FILE);
  await mkdir(directory, { recursive: true });
  await writeFile(filePath, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`, "utf8");
}

function storedRecord(payload: RealLondonBetaFeedbackPayload) {
  return {
    submissionId: `beta-feedback:${payload.metadata.timestamp}`,
    storedAt: payload.metadata.timestamp,
    payload
  };
}

function buildPayload(input: {
  timestamp: string;
  mapId?: string;
  exerciseId?: string;
  rating?: 1 | 2 | 3 | 4 | 5;
  issueType?: RealLondonBetaFeedbackPayload["issueType"];
  comments?: string;
}): RealLondonBetaFeedbackPayload {
  return {
    metadata: buildRealLondonBetaFeedbackMetadata({
      mapId: input.mapId ?? "osm-real-london-pilot",
      mapVersion: "1.0.0",
      exerciseId: input.exerciseId ?? "osm-real-pilot-short-route",
      exerciseVersion: "1.0.0",
      exerciseTitle: "Short route",
      timestamp: input.timestamp,
      betaEnabled: true
    }),
    rating: input.rating ?? 5,
    issueType: input.issueType ?? "map-display-issue",
    comments: input.comments ?? "The map was readable."
  };
}
