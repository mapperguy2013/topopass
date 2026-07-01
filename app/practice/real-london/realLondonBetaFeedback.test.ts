import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRealLondonBetaPracticeScreenModel
} from "./realLondonBetaPracticeScreen.ts";
import {
  REAL_LONDON_BETA_FEEDBACK_STAGE,
  buildRealLondonBetaFeedbackMetadata,
  buildRealLondonBetaFeedbackMetadataFromModel,
  submitRealLondonBetaFeedbackLocally,
  validateRealLondonBetaFeedbackPayload
} from "./realLondonBetaFeedback.ts";

const fixedTimestamp = "2026-07-01T10:30:00.000Z";

test("Stage 133 feedback metadata includes map exercise version beta and timestamp fields", () => {
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

test("Stage 133 feedback metadata can be built from the beta practice screen model", () => {
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
  assert.equal(metadata.stage, 133);
  assert.equal(metadata.mapId, "osm-real-london-pilot");
  assert.equal(metadata.mapVersion, "1.0.0");
  assert.equal(metadata.exerciseId, "osm-real-pilot-checkpoint-route");
  assert.equal(metadata.exerciseVersion, "1.0.0");
  assert.equal(metadata.betaAccessState, "enabled");
});

test("Stage 133 unavailable beta practice model does not produce feedback metadata", () => {
  const model = buildRealLondonBetaPracticeScreenModel({ betaEnabled: false });
  const metadata = buildRealLondonBetaFeedbackMetadataFromModel({
    model,
    timestamp: fixedTimestamp,
    betaEnabled: false
  });

  assert.equal(metadata, null);
});

test("Stage 133 invalid or empty feedback is rejected deterministically", () => {
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

  const submission = submitRealLondonBetaFeedbackLocally({
    metadata,
    draft: {
      rating: 0,
      issueType: "invalid",
      comments: ""
    }
  });

  assert.equal(submission.status, "rejected");
  assert.deepEqual(submission.reasonCodes, [
    "invalid-rating",
    "invalid-issue-type",
    "empty-comments",
    "invalid-timestamp"
  ]);
});

test("Stage 133 successful local feedback submission returns a stable no-op result", () => {
  const metadata = buildRealLondonBetaFeedbackMetadata({
    mapId: "osm-real-london-pilot",
    mapVersion: "1.0.0",
    exerciseId: "osm-real-pilot-short-route",
    exerciseVersion: "1.0.0",
    exerciseTitle: "Short route",
    timestamp: fixedTimestamp,
    betaEnabled: true
  });
  const result = submitRealLondonBetaFeedbackLocally({
    metadata,
    draft: {
      rating: 4,
      issueType: "route-unclear",
      comments: "The checkpoint instruction was clear, but the road label was hard to read."
    }
  });

  assert.equal(result.status, "success");
  assert.equal(result.submissionMode, "local-noop");
  assert.equal(
    result.submissionId,
    "local-feedback:stage-133:osm-real-london-pilot:osm-real-pilot-short-route:2026-07-01T10:30:00.000Z"
  );
  assert.equal(result.payload.rating, 4);
  assert.equal(result.payload.issueType, "route-unclear");
  assert.equal(
    result.payload.comments,
    "The checkpoint instruction was clear, but the road label was hard to read."
  );
});
