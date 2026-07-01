import assert from "node:assert/strict";
import test from "node:test";
import type { BetaFeedbackStore } from "../../practice/real-london/betaFeedbackStore.ts";
import {
  buildRealLondonBetaFeedbackMetadata,
  buildStableBetaFeedbackSubmissionId,
  type RealLondonBetaFeedbackPayload
} from "../../practice/real-london/realLondonBetaFeedback.ts";
import { handleBetaFeedbackSubmission } from "./betaFeedbackApi.ts";

test("Stage 134 API accepts valid feedback when beta is enabled and storage is available", async () => {
  const payload = buildPayload();
  const response = await handleBetaFeedbackSubmission({
    body: payload,
    env: { NEXT_PUBLIC_REAL_LONDON_BETA: "true", NODE_ENV: "test" },
    store: successStore()
  });
  const body = response.body;

  assert.equal(response.status, 200);
  assert.equal(body.status, "success");
  assert.equal(body.submissionId, buildStableBetaFeedbackSubmissionId(payload));
  assert.deepEqual(body.payload, payload);
});

test("Stage 134 API rejects invalid feedback with clear 400 response", async () => {
  const response = await handleBetaFeedbackSubmission({
    body: {
      metadata: {},
      rating: 9,
      issueType: "unknown",
      comments: ""
    },
    env: { NEXT_PUBLIC_REAL_LONDON_BETA: "true", NODE_ENV: "test" },
    store: successStore()
  });
  const body = response.body;

  assert.equal(response.status, 400);
  assert.equal(body.status, "rejected");
  assert.ok(body.reasonCodes.includes("invalid-rating"));
  assert.ok(body.reasonCodes.includes("invalid-issue-type"));
  assert.ok(body.reasonCodes.includes("empty-comments"));
});

test("Stage 134 API rejects beta feedback when beta flag is disabled", async () => {
  const response = await handleBetaFeedbackSubmission({
    body: buildPayload(),
    env: { NEXT_PUBLIC_REAL_LONDON_BETA: "false", NODE_ENV: "test" },
    store: successStore()
  });
  const body = response.body;

  assert.equal(response.status, 403);
  assert.equal(body.status, "unavailable");
  assert.equal(body.reasonCode, "real-london-beta-disabled");
});

test("Stage 134 API returns unavailable when production storage is not configured", async () => {
  const response = await handleBetaFeedbackSubmission({
    body: buildPayload(),
    env: { NEXT_PUBLIC_REAL_LONDON_BETA: "true", NODE_ENV: "production" }
  });
  const body = response.body;

  assert.equal(response.status, 503);
  assert.equal(body.status, "unavailable");
  assert.equal(body.reasonCode, "production-store-not-configured");
});

function successStore(): BetaFeedbackStore {
  return {
    async storeBetaFeedback(payload) {
      return {
        status: "stored",
        storage: "local-jsonl",
        submissionId: buildStableBetaFeedbackSubmissionId(payload),
        message: "Thanks. Your beta feedback was saved."
      };
    }
  };
}

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
    rating: 4,
    issueType: "route-unclear",
    comments: "The route instruction was mostly clear."
  };
}
