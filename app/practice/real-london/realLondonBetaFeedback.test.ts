import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRealLondonBetaPracticeScreenModel
} from "./realLondonBetaPracticeScreen.ts";
import {
  REAL_LONDON_BETA_FEEDBACK_API_PATH,
  REAL_LONDON_BETA_FEEDBACK_SOURCE_STAGE,
  REAL_LONDON_BETA_FEEDBACK_STAGE,
  buildRealLondonBetaFeedbackMetadata,
  buildRealLondonBetaFeedbackMetadataFromModel,
  buildStableBetaFeedbackSubmissionId,
  submitRealLondonBetaFeedbackToApi,
  validateRealLondonBetaFeedbackPayload,
  validateRealLondonBetaFeedbackSubmissionPayload,
  type RealLondonBetaFeedbackPayload
} from "./realLondonBetaFeedback.ts";

const fixedTimestamp = "2026-07-01T10:30:00.000Z";

test("Stage 134 feedback metadata includes map exercise version beta and source-stage fields", () => {
  const metadata = buildRealLondonBetaFeedbackMetadata({
    mapId: "osm-real-london-pilot",
    mapVersion: "1.0.0",
    exerciseId: "osm-real-pilot-short-route",
    exerciseVersion: "1.0.0",
    exerciseTitle: "Short route",
    timestamp: fixedTimestamp,
    betaEnabled: true
  });

  assert.deepEqual(metadata, {
    stage: REAL_LONDON_BETA_FEEDBACK_STAGE,
    sourceStage: REAL_LONDON_BETA_FEEDBACK_SOURCE_STAGE,
    mapId: "osm-real-london-pilot",
    mapVersion: "1.0.0",
    exerciseId: "osm-real-pilot-short-route",
    exerciseVersion: "1.0.0",
    exerciseTitle: "Short route",
    timestamp: fixedTimestamp,
    betaFlagName: "NEXT_PUBLIC_REAL_LONDON_BETA",
    betaAccessState: "enabled"
  });
});

test("Stage 134 feedback metadata can be built from the beta practice screen model", () => {
  const model = buildRealLondonBetaPracticeScreenModel({
    betaEnabled: true,
    selectedExerciseId: "osm-real-pilot-checkpoint-route"
  });
  const metadata = buildRealLondonBetaFeedbackMetadataFromModel({
    model,
    timestamp: fixedTimestamp,
    betaEnabled: true
  });

  assert.ok(metadata);
  assert.equal(metadata.stage, 134);
  assert.equal(metadata.sourceStage, 133);
  assert.equal(metadata.mapId, "osm-real-london-pilot");
  assert.equal(metadata.mapVersion, "1.0.0");
  assert.equal(metadata.exerciseId, "osm-real-pilot-checkpoint-route");
  assert.equal(metadata.exerciseVersion, "1.0.0");
  assert.equal(metadata.betaAccessState, "enabled");
});

test("Stage 134 unavailable beta practice model does not produce feedback metadata", () => {
  const model = buildRealLondonBetaPracticeScreenModel({ betaEnabled: false });
  const metadata = buildRealLondonBetaFeedbackMetadataFromModel({
    model,
    timestamp: fixedTimestamp,
    betaEnabled: false
  });

  assert.equal(metadata, null);
});

test("Stage 134 invalid or empty feedback is rejected deterministically", () => {
  const metadata = buildRealLondonBetaFeedbackMetadata({
    mapId: "osm-real-london-pilot",
    mapVersion: "1.0.0",
    exerciseId: "osm-real-pilot-short-route",
    exerciseVersion: "1.0.0",
    exerciseTitle: "Short route",
    timestamp: "not-a-date",
    betaEnabled: true
  });
  const validation = validateRealLondonBetaFeedbackPayload({
    metadata,
    draft: {
      rating: 0,
      issueType: "invalid",
      comments: "   "
    }
  });

  assert.equal(validation.isValid, false);
  assert.deepEqual(
    validation.errors.map((error) => error.code),
    ["invalid-rating", "invalid-issue-type", "empty-comments", "invalid-timestamp"]
  );
});

test("Stage 134 API payload validation rejects malformed payloads", () => {
  const validation = validateRealLondonBetaFeedbackSubmissionPayload({
    metadata: {},
    rating: 3,
    issueType: "route-unclear",
    comments: "Missing required metadata."
  });

  assert.equal(validation.isValid, false);
  assert.deepEqual(
    validation.errors.map((error) => error.code),
    ["invalid-metadata"]
  );
});

test("Stage 134 feedback form submit helper posts to the API and handles success", async () => {
  const payload = buildPayload();
  const result = await submitRealLondonBetaFeedbackToApi({
    metadata: payload.metadata,
    draft: {
      rating: payload.rating,
      issueType: payload.issueType,
      comments: payload.comments
    },
    fetcher: async (url, init) => {
      assert.equal(url, REAL_LONDON_BETA_FEEDBACK_API_PATH);
      assert.equal(init.method, "POST");
      assert.deepEqual(JSON.parse(init.body), payload);

      return {
        ok: true,
        status: 200,
        async json() {
          return {
            status: "success",
            message: "Thanks. Your beta feedback was saved.",
            submissionId: buildStableBetaFeedbackSubmissionId(payload),
            payload
          };
        }
      };
    }
  });

  assert.equal(result.status, "success");
  assert.equal(result.submissionMode, "api");
  assert.equal(result.submissionId, buildStableBetaFeedbackSubmissionId(payload));
});

test("Stage 134 feedback form submit helper handles API failure without losing draft comments", async () => {
  const payload = buildPayload();
  const draft = {
    rating: payload.rating,
    issueType: payload.issueType,
    comments: payload.comments
  };
  const result = await submitRealLondonBetaFeedbackToApi({
    metadata: payload.metadata,
    draft,
    fetcher: async () => ({
      ok: false,
      status: 503,
      async json() {
        return {
          status: "unavailable",
          message: "Beta feedback storage is not configured.",
          reasonCode: "production-store-not-configured"
        };
      }
    })
  });

  assert.equal(result.status, "unavailable");
  assert.equal(result.reasonCode, "production-store-not-configured");
  assert.equal(draft.comments, payload.comments);
});

test("Stage 134 feedback form submit helper reports network failure without fake success", async () => {
  const payload = buildPayload();
  const result = await submitRealLondonBetaFeedbackToApi({
    metadata: payload.metadata,
    draft: {
      rating: payload.rating,
      issueType: payload.issueType,
      comments: payload.comments
    },
    fetcher: async () => {
      throw new Error("network down");
    }
  });

  assert.equal(result.status, "failed");
  assert.equal(result.submissionMode, "network");
  assert.equal(result.reasonCode, "feedback-network-error");
});

function buildPayload(): RealLondonBetaFeedbackPayload {
  return {
    metadata: buildRealLondonBetaFeedbackMetadata({
      mapId: "osm-real-london-pilot",
      mapVersion: "1.0.0",
      exerciseId: "osm-real-pilot-short-route",
      exerciseVersion: "1.0.0",
      exerciseTitle: "Short route",
      timestamp: fixedTimestamp,
      betaEnabled: true
    }),
    rating: 4,
    issueType: "route-unclear",
    comments: "The checkpoint instruction was clear, but the road label was hard to read."
  };
}
