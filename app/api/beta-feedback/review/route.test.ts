import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  LOCAL_BETA_FEEDBACK_DIR,
  LOCAL_BETA_FEEDBACK_FILE
} from "../../../practice/real-london/betaFeedbackStore.ts";
import {
  buildRealLondonBetaFeedbackMetadata,
  type RealLondonBetaFeedbackPayload
} from "../../../practice/real-london/realLondonBetaFeedback.ts";
import { handleBetaFeedbackReviewRequest } from "./betaFeedbackReviewApi.ts";

test("Stage 136 review API returns unavailable when the review flag is disabled", async () => {
  const result = await handleBetaFeedbackReviewRequest({
    url: "http://localhost/api/beta-feedback/review",
    env: { NODE_ENV: "test", BETA_FEEDBACK_REVIEW_ENABLED: "false" }
  });
  const body = JSON.parse(result.body) as { status: string; reasonCode: string };

  assert.equal(result.status, 403);
  assert.equal(result.contentType, "application/json");
  assert.equal(body.status, "unavailable");
  assert.equal(body.reasonCode, "beta-feedback-review-disabled");
});

test("Stage 137 review API rejects unsupported methods with a stable JSON error", async () => {
  const result = await handleBetaFeedbackReviewRequest({
    url: "http://localhost/api/beta-feedback/review",
    method: "POST",
    env: { NODE_ENV: "test", BETA_FEEDBACK_REVIEW_ENABLED: "true" }
  });
  const body = JSON.parse(result.body) as { status: string; reasonCode: string; message: string };

  assert.equal(result.status, 405);
  assert.equal(result.contentType, "application/json");
  assert.equal(body.status, "rejected");
  assert.equal(body.reasonCode, "unsupported-method");
  assert.match(body.message, /GET/);
});

test("Stage 136 review API reads local JSONL feedback in development and applies filters", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "topopass-beta-feedback-review-api-"));

  try {
    await writeLocalRecords(tempDir, [
      storedRecord(buildPayload({ timestamp: "2026-07-01T08:00:00.000Z", rating: 4 })),
      storedRecord(
        buildPayload({
          timestamp: "2026-07-01T09:00:00.000Z",
          exerciseId: "osm-real-pilot-checkpoint-route",
          rating: 2,
          issueType: "route-unclear"
        })
      )
    ]);

    const result = await handleBetaFeedbackReviewRequest({
      url: "http://localhost/api/beta-feedback/review?rating=2&feedbackType=route-unclear",
      env: { NODE_ENV: "development", BETA_FEEDBACK_REVIEW_ENABLED: "true" },
      cwd: tempDir
    });
    const body = JSON.parse(result.body) as {
      status: string;
      acceptedRecordCount: number;
      records: Array<{ exerciseId: string; rating: number }>;
    };

    assert.equal(result.status, 200);
    assert.equal(body.status, "available");
    assert.equal(body.acceptedRecordCount, 1);
    assert.deepEqual(body.records.map((record) => ({ exerciseId: record.exerciseId, rating: record.rating })), [
      {
        exerciseId: "osm-real-pilot-checkpoint-route",
        rating: 2
      }
    ]);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("Stage 137 review API failures do not leak stack traces or service secrets", async () => {
  const result = await handleBetaFeedbackReviewRequest({
    url: "http://localhost/api/beta-feedback/review",
    method: "GET",
    env: {
      NODE_ENV: "production",
      BETA_FEEDBACK_REVIEW_ENABLED: "true",
      BETA_FEEDBACK_STORAGE: "supabase",
      BETA_FEEDBACK_TABLE: "beta_feedback",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "server-secret"
    },
    fetcher: async () => {
      throw new Error("server-secret stack trace from review export");
    }
  });

  assert.equal(result.status, 500);
  assert.equal(result.contentType, "application/json");
  assert.doesNotMatch(result.body, /server-secret/);
  assert.doesNotMatch(result.body, /stack trace/);
  assert.doesNotMatch(result.body, /review export/);
  assert.match(result.body, /feedback-review-read-failed/);
});

test("Stage 136 review API reports production unavailable when Supabase config is missing", async () => {
  const result = await handleBetaFeedbackReviewRequest({
    url: "http://localhost/api/beta-feedback/review",
    env: { NODE_ENV: "production", BETA_FEEDBACK_REVIEW_ENABLED: "true" }
  });
  const body = JSON.parse(result.body) as { status: string; reasonCode: string };

  assert.equal(result.status, 503);
  assert.equal(body.status, "unavailable");
  assert.equal(body.reasonCode, "production-store-not-configured");
});

test("Stage 136 review API reads production Supabase feedback when configured", async () => {
  const calls: Array<{ url: string; headers: Record<string, string> }> = [];
  const payload = buildPayload({ timestamp: "2026-07-01T10:00:00.000Z" });
  const result = await handleBetaFeedbackReviewRequest({
    url: "http://localhost/api/beta-feedback/review?format=json",
    env: {
      NODE_ENV: "production",
      BETA_FEEDBACK_REVIEW_ENABLED: "true",
      BETA_FEEDBACK_STORAGE: "supabase",
      BETA_FEEDBACK_TABLE: "beta_feedback",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "server-secret"
    },
    fetcher: async (url, init) => {
      calls.push({ url, headers: init.headers });

      return {
        ok: true,
        status: 200,
        async json() {
          return [
            {
              id: "feedback-row-1",
              created_at: "2026-07-01T10:01:00.000Z",
              payload,
              map_id: payload.metadata.mapId,
              exercise_id: payload.metadata.exerciseId,
              rating: payload.rating,
              feedback_type: payload.issueType
            }
          ];
        }
      };
    }
  });
  const body = JSON.parse(result.body) as Array<{ id: string; storageSource: string }>;

  assert.equal(result.status, 200);
  assert.equal(result.contentType, "application/json");
  assert.equal(calls[0]?.url, "https://example.supabase.co/rest/v1/beta_feedback?select=id,created_at,payload,map_id,exercise_id,rating,feedback_type&order=created_at.desc");
  assert.equal(calls[0]?.headers.apikey, "server-secret");
  assert.equal(calls[0]?.headers.Authorization, "Bearer server-secret");
  assert.deepEqual(body.map((record) => ({ id: record.id, storageSource: record.storageSource })), [
    {
      id: "feedback-row-1",
      storageSource: "supabase-rest"
    }
  ]);
  assert.doesNotMatch(result.body, /server-secret/);
});

test("Stage 136 review API CSV export is stable", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "topopass-beta-feedback-review-api-csv-"));

  try {
    await writeLocalRecords(tempDir, [
      storedRecord(
        buildPayload({
          timestamp: "2026-07-01T08:00:00.000Z",
          comments: "Useful beta feedback."
        })
      )
    ]);

    const result = await handleBetaFeedbackReviewRequest({
      url: "http://localhost/api/beta-feedback/review?format=csv",
      env: { NODE_ENV: "test", BETA_FEEDBACK_REVIEW_ENABLED: "true" },
      cwd: tempDir
    });

    assert.equal(result.status, 200);
    assert.equal(result.contentType, "text/csv");
    assert.equal(
      result.body,
      [
        "createdAt,mapId,exerciseId,rating,feedbackType,feedbackText,mapVersion,exerciseVersion,exerciseTitle,appBuildVersion,storageSource,storageStatus,recordId",
        "2026-07-01T08:00:00.000Z,osm-real-london-pilot,osm-real-pilot-short-route,5,map-display-issue,Useful beta feedback.,1.0.0,1.0.0,Short route,,local-jsonl,stored,beta-feedback:2026-07-01T08:00:00.000Z"
      ].join("\n")
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
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
  exerciseId?: string;
  rating?: 1 | 2 | 3 | 4 | 5;
  issueType?: RealLondonBetaFeedbackPayload["issueType"];
  comments?: string;
}): RealLondonBetaFeedbackPayload {
  return {
    metadata: buildRealLondonBetaFeedbackMetadata({
      mapId: "osm-real-london-pilot",
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
