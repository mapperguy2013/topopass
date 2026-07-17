import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { RouteMatchingResult } from "../../../lib/map-engine/index.ts";
import type { GeneratedLearnerExercise } from "../../../lib/training/learnerExerciseGeneration.ts";
import type { LearnerTrainingModeReview } from "./learnerTrainingModeUi.ts";
import {
  SHARED_ROUTE_SUBMIT_LABEL,
  SHARED_ROUTE_SUBMISSION_MINIMUM_FEEDBACK_MS,
  beginSharedRouteSubmission,
  createIdleSharedRouteSubmissionState,
  dedupeSharedRouteFeedbackItems,
  failSharedRouteSubmission,
  matchedRouteToLearnerSegments,
  resolveSharedRouteSubmission,
  trainingExerciseToRouteExercise,
  trainingReviewToRouteAttemptReview
} from "./sharedRouteSubmission.ts";

test("shared route submission rejects duplicates and stale completions", () => {
  const idle = createIdleSharedRouteSubmissionState();
  const started = beginSharedRouteSubmission({ current: idle, requestId: 1, attemptKey: "attempt-a" });

  assert.equal(started.accepted, true);
  assert.equal(started.state.state, "submitting");
  assert.equal(
    beginSharedRouteSubmission({ current: started.state, requestId: 2, attemptKey: "attempt-a" }).accepted,
    false
  );

  const stale = resolveSharedRouteSubmission({
    current: started.state,
    requestId: 2,
    attemptKey: "attempt-b",
    submitted: true,
    code: null,
    learnerMessage: null,
    devMessage: null
  });

  assert.deepEqual(stale, started.state);

  const submitted = resolveSharedRouteSubmission({
    current: started.state,
    requestId: 1,
    attemptKey: "attempt-a",
    submitted: true,
    code: null,
    learnerMessage: "Route submitted.",
    devMessage: null
  });

  assert.equal(submitted.state, "submitted");
  assert.equal(submitted.attemptKey, "attempt-a");
});

test("shared route feedback groups repeated learner-facing issues", () => {
  const grouped = dedupeSharedRouteFeedbackItems([
    { id: "first", label: "Disconnected matched roads", detail: "Could not snap to roads", severity: "warning" },
    { id: "second", label: "Disconnected matched roads", detail: "Could not snap to roads", severity: "warning" },
    { id: "third", label: "Wrong destination", detail: "The destination was not reached", severity: "error" }
  ]);

  assert.equal(SHARED_ROUTE_SUBMISSION_MINIMUM_FEEDBACK_MS, 120);
  assert.deepEqual(grouped.map((item) => item.id), ["first", "third"]);
});

test("shared route submission exposes a retryable failure without accepting stale errors", () => {
  const started = beginSharedRouteSubmission({
    current: createIdleSharedRouteSubmissionState(),
    requestId: 4,
    attemptKey: "attempt-current"
  }).state;
  const stale = failSharedRouteSubmission({
    current: started,
    requestId: 3,
    attemptKey: "attempt-old",
    message: "old failure"
  });

  assert.deepEqual(stale, started);

  const failed = failSharedRouteSubmission({
    current: started,
    requestId: 4,
    attemptKey: "attempt-current",
    message: "network failure"
  });

  assert.equal(failed.state, "failed");
  assert.match(failed.message ?? "", /Try submitting it again/);
  assert.equal(failed.devMessage, "network failure");
});

test("generated Training exercises use the route runner submission contract", () => {
  const exercise = {
    id: "training-route-1",
    title: "Victoria to Vauxhall",
    mapId: "london",
    mapVersion: "8.9",
    difficulty: "intermediate",
    checkpoints: [
      { type: "node", nodeId: "start", label: "Victoria" },
      { type: "node", nodeId: "finish", label: "Vauxhall" }
    ],
    objectives: [{ required: true, description: "Reach Vauxhall legally." }]
  } as unknown as GeneratedLearnerExercise;

  assert.deepEqual(trainingExerciseToRouteExercise(exercise), {
    id: "training-route-1",
    title: "Victoria to Vauxhall",
    mapId: "london",
    exerciseVersion: "8.9",
    stops: [
      { type: "node", nodeId: "start", label: "Victoria" },
      { type: "node", nodeId: "finish", label: "Vauxhall" }
    ],
    description: "Reach Vauxhall legally.",
    difficulty: "medium"
  });
});

test("matched learner geometry becomes the Training attempt without fabricating segments", () => {
  const match = {
    status: "matched",
    isReadyForRunRouteExercise: true,
    attemptedMovements: [
      { roadId: "road-a", fromNodeId: "a", toNodeId: "b" },
      { roadId: "road-b", fromNodeId: "b", toNodeId: "c" }
    ]
  } as unknown as RouteMatchingResult;

  assert.deepEqual(matchedRouteToLearnerSegments(match), [
    { id: "learner-attempt-segment-1", roadId: "road-a", fromNodeId: "a", toNodeId: "b" },
    { id: "learner-attempt-segment-2", roadId: "road-b", fromNodeId: "b", toNodeId: "c" }
  ]);
  assert.deepEqual(matchedRouteToLearnerSegments(null), []);
});

test("Training scoring adapts to beta feedback without exposing diagnostic identifiers", () => {
  const review = {
    scoring: {
      status: "failed",
      passed: false,
      scorePercent: 62.5,
      metrics: {
        attemptedDistanceMeters: 1320,
        expectedDistanceMeters: 1000,
        extraDistanceMeters: 320
      }
    },
    feedback: {
      summary: "The route needs review.",
      improvements: ["Choose the shorter legal corridor."],
      messages: [
        {
          id: "feedback-osm-way-123-segment-7",
          issueType: "efficiency",
          severity: "minor",
          whatHappened: "The route included an avoidable detour.",
          whyItMatters: "The detour added distance.",
          improvementSuggestion: "Rejoin at the next legal junction."
        }
      ]
    }
  } as unknown as LearnerTrainingModeReview;
  const adapted = trainingReviewToRouteAttemptReview(review);
  const learnerText = JSON.stringify({
    title: adapted.title,
    scoreLabel: adapted.scoreLabel,
    distanceMetrics: adapted.distanceMetrics,
    illegalMovements: adapted.illegalMovements,
    missedRestrictions: adapted.missedRestrictions,
    correctionHints: adapted.correctionHints
  });

  assert.equal(adapted.status, "fail");
  assert.equal(adapted.scoreLabel, "62.5% (fail)");
  assert.equal(adapted.distanceMetrics[2].value, "+320 m");
  assert.equal(adapted.missedRestrictions[0].label, "Route too long");
  assert.doesNotMatch(learnerText, /osm-way|segment-7|feedback-osm/);
});

test("Training feedback replaces raw route graph identifiers with learner-safe text", () => {
  const review = {
    scoring: {
      status: "blocked",
      passed: false,
      scorePercent: 0,
      metrics: {
        attemptedDistanceMeters: Number.NaN,
        expectedDistanceMeters: Number.NaN,
        extraDistanceMeters: Number.NaN
      }
    },
    feedback: {
      summary: "The route could not be scored.",
      improvements: [],
      messages: [
        {
          id: "feedback-route-matching",
          issueType: "route-drawing",
          severity: "serious",
          whatHappened: "Movement n13 to n12 on road r13 has no legal directed edge.",
          whyItMatters: "Pipeline matching stopped at osm-way-123-segment-7.",
          improvementSuggestion: "Draw one continuous line along connected roads."
        }
      ]
    }
  } as unknown as LearnerTrainingModeReview;

  const adapted = trainingReviewToRouteAttemptReview(review);
  const learnerText = JSON.stringify(adapted);

  assert.equal(adapted.missedRestrictions[0].label, "Route matching issue");
  assert.equal(
    adapted.missedRestrictions[0].detail,
    "The submitted line could not be matched to a continuous legal road sequence."
  );
  assert.doesNotMatch(learnerText, /n13|n12|r13|osm-way|segment-7|directed edge|pipeline/i);
});

test("beta and Learner Training pages use the same authoritative submission implementation", () => {
  const betaPage = readFileSync(new URL("../../practice/real-london/page.tsx", import.meta.url), "utf8");
  const trainingPage = readFileSync(new URL("../../practice/training/page.tsx", import.meta.url), "utf8");
  const client = readFileSync(new URL("./RouteRunnerClient.tsx", import.meta.url), "utf8");

  for (const page of [betaPage, trainingPage]) {
    assert.match(page, /<RouteRunnerClient/);
    assert.doesNotMatch(page, /Route feedback|shortest legal route|drawnSubmitState/);
  }

  assert.equal(SHARED_ROUTE_SUBMIT_LABEL, "Submit route");
  assert.match(client, /trainingExerciseToRouteExercise/);
  assert.match(client, /matchedRouteToLearnerSegments/);
  assert.match(client, /trainingReviewToRouteAttemptReview/);
  assert.doesNotMatch(client, /Learner attempt review/);
  assert.doesNotMatch(client, /Road segment:/);
  assert.doesNotMatch(client, /Current instruction/);
  assert.match(client, /showLearnerTrainingHintPanel/);
  assert.match(client, /showAttemptFeedbackPanel \|\| isSubmittingCurrentDrawnAttempt/);
  assert.equal(
    client.match(
      /aria-label=\{\s*isExamRouteRunner\s*\?\s*"Exam result"\s*:\s*isStudentBetaRouteRunner\s*\?\s*"Route feedback details"/g
    )?.length,
    1
  );
  assert.equal(client.match(/onClick=\{submitDrawnAttempt\}/g)?.length, 3);
});
