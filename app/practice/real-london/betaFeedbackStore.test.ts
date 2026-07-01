import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  createDefaultBetaFeedbackStore,
  createLocalJsonlBetaFeedbackStore,
  createSupabaseRestBetaFeedbackStore,
  getSupabaseBetaFeedbackConfig
} from "./betaFeedbackStore.ts";
import { buildRealLondonBetaFeedbackMetadata } from "./realLondonBetaFeedback.ts";
import type { RealLondonBetaFeedbackPayload } from "./realLondonBetaFeedback.ts";

test("Stage 134 local development JSONL store writes one valid JSON line", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "topopass-beta-feedback-"));
  const filePath = path.join(tempDir, "feedback.jsonl");

  try {
    const store = createLocalJsonlBetaFeedbackStore({ filePath });
    const payload = buildPayload();
    const result = await store.storeBetaFeedback(payload);
    const contents = await readFile(filePath, "utf8");
    const lines = contents.trim().split("\n");
    const record = JSON.parse(lines[0] ?? "{}") as {
      submissionId?: string;
      storedAt?: string;
      payload?: RealLondonBetaFeedbackPayload;
    };

    assert.equal(result.status, "stored");
    assert.equal(result.storage, "local-jsonl");
    assert.equal(lines.length, 1);
    assert.equal(record.submissionId, result.submissionId);
    assert.ok(Number.isFinite(Date.parse(record.storedAt ?? "")));
    assert.deepEqual(record.payload, payload);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("Stage 135 default store keeps local development JSONL behavior and requires production config", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "topopass-beta-feedback-default-"));

  try {
    const developmentStore = createDefaultBetaFeedbackStore({
      env: { NODE_ENV: "development" },
      cwd: tempDir
    });
    const productionStore = createDefaultBetaFeedbackStore({
      env: { NODE_ENV: "production" },
      cwd: tempDir
    });

    const developmentResult = await developmentStore.storeBetaFeedback(buildPayload());
    const productionResult = await productionStore.storeBetaFeedback(buildPayload());

    assert.equal(developmentResult.status, "stored");
    assert.equal(productionResult.status, "unavailable");
    assert.equal(productionResult.reasonCode, "production-store-not-configured");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("Stage 135 production storage config detection is deterministic", () => {
  assert.deepEqual(getSupabaseBetaFeedbackConfig({}), {
    status: "missing",
    storage: "none",
    reasonCode: "production-store-not-configured",
    missingKeys: ["BETA_FEEDBACK_STORAGE"]
  });
  assert.deepEqual(
    getSupabaseBetaFeedbackConfig({
      BETA_FEEDBACK_STORAGE: "supabase",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key"
    }),
    {
      status: "configured",
      storage: "supabase",
      url: "https://example.supabase.co",
      serviceRoleKey: "service-role-key",
      table: "beta_feedback"
    }
  );
  assert.deepEqual(
    getSupabaseBetaFeedbackConfig({
      BETA_FEEDBACK_STORAGE: "supabase",
      SUPABASE_URL: "https://example.supabase.co/"
    }),
    {
      status: "missing",
      storage: "supabase",
      reasonCode: "production-store-not-configured",
      missingKeys: ["SUPABASE_SERVICE_ROLE_KEY"]
    }
  );
  assert.deepEqual(getSupabaseBetaFeedbackConfig({ BETA_FEEDBACK_STORAGE: "email" }), {
    status: "unsupported",
    storage: "email",
    reasonCode: "unsupported-production-feedback-storage"
  });
});

test("Stage 135 Supabase REST store writes the validated payload without exposing secrets in result", async () => {
  const payload = buildPayload();
  const config = getSupabaseBetaFeedbackConfig({
    BETA_FEEDBACK_STORAGE: "supabase",
    SUPABASE_URL: "https://example.supabase.co/",
    SUPABASE_SERVICE_ROLE_KEY: "server-secret",
    BETA_FEEDBACK_TABLE: "custom_feedback"
  });

  assert.equal(config.status, "configured");

  const calls: Array<{
    url: string;
    headers: Record<string, string>;
    body: string;
  }> = [];
  const store = createSupabaseRestBetaFeedbackStore({
    config,
    fetcher: async (url, init) => {
      calls.push({
        url,
        headers: init.headers,
        body: init.body
      });

      return {
        ok: true,
        status: 201,
        async text() {
          return "";
        }
      };
    }
  });
  const result = await store.storeBetaFeedback(payload);
  const inserted = JSON.parse(calls[0]?.body ?? "{}") as {
    payload?: RealLondonBetaFeedbackPayload;
    map_id?: string;
    exercise_id?: string;
    rating?: number;
    feedback_type?: string;
  };

  assert.equal(result.status, "stored");
  assert.equal(result.storage, "supabase-rest");
  assert.equal(calls[0]?.url, "https://example.supabase.co/rest/v1/custom_feedback");
  assert.equal(calls[0]?.headers.apikey, "server-secret");
  assert.equal(calls[0]?.headers.Authorization, "Bearer server-secret");
  assert.equal(calls[0]?.headers.Prefer, "return=minimal");
  assert.deepEqual(inserted.payload, payload);
  assert.equal(inserted.map_id, payload.metadata.mapId);
  assert.equal(inserted.exercise_id, payload.metadata.exerciseId);
  assert.equal(inserted.rating, payload.rating);
  assert.equal(inserted.feedback_type, payload.issueType);
  assert.equal("serviceRoleKey" in result, false);
});

test("Stage 135 Supabase REST store reports failed writes without fake success", async () => {
  const config = getSupabaseBetaFeedbackConfig({
    BETA_FEEDBACK_STORAGE: "supabase",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "server-secret"
  });

  assert.equal(config.status, "configured");

  const store = createSupabaseRestBetaFeedbackStore({
    config,
    fetcher: async () => ({
      ok: false,
      status: 500,
      async text() {
        return "database unavailable";
      }
    })
  });
  const result = await store.storeBetaFeedback(buildPayload());

  assert.equal(result.status, "failed");
  assert.equal(result.storage, "supabase-rest");
  assert.equal(result.reasonCode, "feedback-supabase-write-failed");
});

test("Stage 135 default production store uses Supabase when configured", async () => {
  const calls: string[] = [];
  const store = createDefaultBetaFeedbackStore({
    env: {
      NODE_ENV: "production",
      BETA_FEEDBACK_STORAGE: "supabase",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "server-secret"
    },
    fetcher: async (url) => {
      calls.push(url);

      return {
        ok: true,
        status: 201,
        async text() {
          return "";
        }
      };
    }
  });
  const result = await store.storeBetaFeedback(buildPayload());

  assert.equal(result.status, "stored");
  assert.equal(result.storage, "supabase-rest");
  assert.deepEqual(calls, ["https://example.supabase.co/rest/v1/beta_feedback"]);
});

function buildPayload(): RealLondonBetaFeedbackPayload {
  return {
    metadata: buildRealLondonBetaFeedbackMetadata({
      mapId: "osm-real-london-pilot",
      mapVersion: "1.0.0",
      exerciseId: "osm-real-pilot-short-route",
      exerciseVersion: "1.0.0",
      exerciseTitle: "Short route",
      timestamp: "2026-07-01T10:30:00.000Z",
      betaEnabled: true
    }),
    rating: 5,
    issueType: "map-display-issue",
    comments: "The map was readable and feedback saved."
  };
}
