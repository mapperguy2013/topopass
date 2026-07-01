import assert from "node:assert/strict";
import test from "node:test";
import type { BetaFeedbackStore } from "../../practice/real-london/betaFeedbackStore.ts";
import {
  buildRealLondonBetaFeedbackMetadata,
  buildStableBetaFeedbackSubmissionId,
  type RealLondonBetaFeedbackPayload
} from "../../practice/real-london/realLondonBetaFeedback.ts";
import { createInMemoryBetaFeedbackRateLimiter } from "./betaFeedbackApiSafety.ts";
import { handleBetaFeedbackRequest, handleBetaFeedbackSubmission } from "./betaFeedbackApi.ts";

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
  let called = false;
  const response = await handleBetaFeedbackSubmission({
    body: {
      metadata: {},
      rating: 9,
      issueType: "unknown",
      comments: ""
    },
    env: { NEXT_PUBLIC_REAL_LONDON_BETA: "true", NODE_ENV: "test" },
    store: {
      async storeBetaFeedback() {
        called = true;
        return successStoreResult(buildPayload());
      }
    }
  });
  const body = response.body;

  assert.equal(response.status, 400);
  assert.equal(body.status, "rejected");
  assert.ok(body.reasonCodes.includes("invalid-rating"));
  assert.ok(body.reasonCodes.includes("invalid-issue-type"));
  assert.ok(body.reasonCodes.includes("empty-comments"));
  assert.equal(called, false);
});

test("Stage 134 API rejects beta feedback when beta flag is disabled", async () => {
  let called = false;
  const response = await handleBetaFeedbackSubmission({
    body: buildPayload(),
    env: { NEXT_PUBLIC_REAL_LONDON_BETA: "false", NODE_ENV: "test" },
    store: {
      async storeBetaFeedback() {
        called = true;
        return successStoreResult(buildPayload());
      }
    }
  });
  const body = response.body;

  assert.equal(response.status, 403);
  assert.equal(body.status, "unavailable");
  assert.equal(body.reasonCode, "real-london-beta-disabled");
  assert.equal(called, false);
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

test("Stage 137 API rejects unsupported methods before storage", async () => {
  let called = false;
  const response = await handleBetaFeedbackRequest({
    request: requestWithBody("GET", buildPayload()),
    env: { NEXT_PUBLIC_REAL_LONDON_BETA: "true", NODE_ENV: "test" },
    store: {
      async storeBetaFeedback() {
        called = true;
        return successStoreResult(buildPayload());
      }
    }
  });

  assert.equal(response.status, 405);
  assert.equal(response.body.status, "rejected");
  assert.equal(response.body.reasonCode, "unsupported-method");
  assert.equal(called, false);
});

test("Stage 137 API rejects malformed JSON before storage", async () => {
  let called = false;
  const response = await handleBetaFeedbackRequest({
    request: new Request("http://localhost/api/beta-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{bad json"
    }),
    env: { NEXT_PUBLIC_REAL_LONDON_BETA: "true", NODE_ENV: "test" },
    store: {
      async storeBetaFeedback() {
        called = true;
        return successStoreResult(buildPayload());
      }
    }
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.status, "rejected");
  assert.equal(response.body.reasonCode, "invalid-json");
  assert.equal(called, false);
});

test("Stage 137 API rejects oversized request bodies before storage", async () => {
  let called = false;
  const response = await handleBetaFeedbackRequest({
    request: new Request("http://localhost/api/beta-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comments: "x".repeat(80) })
    }),
    env: {
      NEXT_PUBLIC_REAL_LONDON_BETA: "true",
      NODE_ENV: "test",
      BETA_FEEDBACK_REQUEST_BODY_MAX_BYTES: "32"
    },
    store: {
      async storeBetaFeedback() {
        called = true;
        return successStoreResult(buildPayload());
      }
    }
  });

  assert.equal(response.status, 413);
  assert.equal(response.body.status, "rejected");
  assert.equal(response.body.reasonCode, "request-body-too-large");
  assert.equal(called, false);
});

test("Stage 137 API rejects unsupported content types before storage", async () => {
  let called = false;
  const response = await handleBetaFeedbackRequest({
    request: new Request("http://localhost/api/beta-feedback", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(buildPayload())
    }),
    env: { NEXT_PUBLIC_REAL_LONDON_BETA: "true", NODE_ENV: "test" },
    store: {
      async storeBetaFeedback() {
        called = true;
        return successStoreResult(buildPayload());
      }
    }
  });

  assert.equal(response.status, 415);
  assert.equal(response.body.status, "rejected");
  assert.equal(response.body.reasonCode, "unsupported-content-type");
  assert.equal(called, false);
});

test("Stage 137 API rejects excessive feedback text before storage", async () => {
  let called = false;
  const response = await handleBetaFeedbackSubmission({
    body: buildPayload({ comments: "x".repeat(11) }),
    env: {
      NEXT_PUBLIC_REAL_LONDON_BETA: "true",
      NODE_ENV: "test",
      BETA_FEEDBACK_COMMENTS_MAX_LENGTH: "10"
    },
    store: {
      async storeBetaFeedback() {
        called = true;
        return successStoreResult(buildPayload());
      }
    }
  });

  assert.equal(response.status, 413);
  assert.equal(response.body.status, "rejected");
  assert.equal(response.body.reasonCode, "feedback-comments-too-long");
  assert.equal(called, false);
});

test("Stage 137 rate limit rejects after the configured threshold before storage", async () => {
  let calls = 0;
  const rateLimiter = createInMemoryBetaFeedbackRateLimiter();
  const store: BetaFeedbackStore = {
    async storeBetaFeedback(payload) {
      calls += 1;
      return successStoreResult(payload);
    }
  };
  const env = {
    NEXT_PUBLIC_REAL_LONDON_BETA: "true",
    NODE_ENV: "test",
    BETA_FEEDBACK_RATE_LIMIT_ENABLED: "true",
    BETA_FEEDBACK_RATE_LIMIT_WINDOW_MS: "60000",
    BETA_FEEDBACK_RATE_LIMIT_MAX: "1"
  };
  const first = await handleBetaFeedbackRequest({
    request: requestWithBody("POST", buildPayload()),
    env,
    store,
    rateLimiter,
    nowMs: 1000
  });
  const second = await handleBetaFeedbackRequest({
    request: requestWithBody("POST", buildPayload({ comments: "Second valid comment." }), "198.51.100.10"),
    env,
    store,
    rateLimiter,
    nowMs: 1001
  });

  assert.equal(first.status, 200);
  assert.equal(second.status, 429);
  assert.equal(second.body.status, "rejected");
  assert.equal(second.body.reasonCode, "beta-feedback-rate-limited");
  assert.equal(calls, 1);
});

test("Stage 137 storage failures return safe errors without stack traces or secrets", async () => {
  const response = await handleBetaFeedbackSubmission({
    body: buildPayload(),
    env: { NEXT_PUBLIC_REAL_LONDON_BETA: "true", NODE_ENV: "test" },
    store: {
      async storeBetaFeedback() {
        return {
          status: "failed",
          storage: "local-jsonl",
          reasonCode: "feedback-storage-write-failed",
          message: "Error: server-secret stack trace at writeFeedback"
        };
      }
    }
  });
  const serialized = JSON.stringify(response.body);

  assert.equal(response.status, 503);
  assert.equal(response.body.status, "failed");
  assert.equal(response.body.reasonCode, "feedback-storage-write-failed");
  assert.doesNotMatch(serialized, /server-secret/);
  assert.doesNotMatch(serialized, /stack trace/);
  assert.doesNotMatch(serialized, /writeFeedback/);
});

function successStore(): BetaFeedbackStore {
  return {
    async storeBetaFeedback(payload) {
      return successStoreResult(payload);
    }
  };
}

function successStoreResult(payload: RealLondonBetaFeedbackPayload) {
  return {
    status: "stored" as const,
    storage: "local-jsonl" as const,
    submissionId: buildStableBetaFeedbackSubmissionId(payload),
    message: "Thanks. Your beta feedback was saved."
  };
}

function buildPayload(input: { comments?: string } = {}): RealLondonBetaFeedbackPayload {
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
    comments: input.comments ?? "The route instruction was mostly clear."
  };
}

function requestWithBody(method: string, payload: RealLondonBetaFeedbackPayload, identity = "198.51.100.10"): Request {
  return new Request("http://localhost/api/beta-feedback", {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": identity
    },
    body: method === "GET" ? undefined : JSON.stringify(payload)
  });
}
