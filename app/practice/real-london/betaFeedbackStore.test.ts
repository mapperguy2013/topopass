import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  createDefaultBetaFeedbackStore,
  createLocalJsonlBetaFeedbackStore
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

test("Stage 134 default store is local in development and unavailable in production", async () => {
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
