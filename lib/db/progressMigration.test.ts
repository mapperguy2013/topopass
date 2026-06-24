import assert from "node:assert/strict";
import { test } from "node:test";
import {
  normalizeMockAttempt,
  normalizePracticeAttempt
} from "./progressMigration.ts";

test("normalizePracticeAttempt preserves records while repairing bad fields", () => {
  const attempt = normalizePracticeAttempt({
    id: "",
    question_id: "route-1",
    question_type: "route",
    score: 120,
    max_score: 100,
    passed: "no",
    created_at: "not-a-date"
  });

  assert.equal(attempt.id, "practice-0");
  assert.equal(attempt.questionId, "route-1");
  assert.equal(attempt.questionType, "route-drawing");
  assert.equal(attempt.score, 100);
  assert.equal(attempt.maxScore, 100);
  assert.equal(attempt.percentage, 100);
  assert.equal(attempt.passed, null);
  assert.equal(attempt.createdAt, "1970-01-01T00:00:00.000Z");
});

test("normalizeMockAttempt extracts question results from stored result payload", () => {
  const attempt = normalizeMockAttempt({
    id: "mock-1",
    submitted_at: "2026-06-23T10:00:00.000Z",
    result: {
      score: 70,
      maxScore: 100,
      passed: true,
      questionResults: [
        {
          questionId: "q1",
          type: "map-click",
          score: 0,
          maxScore: 100,
          passed: false,
          userAnswerSummary: "Wrong place",
          acceptedAnswerSummary: "Target"
        }
      ]
    }
  });

  assert.equal(attempt.id, "mock-1");
  assert.equal(attempt.percentage, 70);
  assert.equal(attempt.passed, true);
  assert.equal(attempt.questionResults.length, 1);
  assert.equal(attempt.questionResults[0].type, "map-click");
  assert.equal(attempt.questionResults[0].percentage, 0);
});

test("normalizePracticeAttempt sanitizes malformed visual review data", () => {
  const attempt = normalizePracticeAttempt({
    id: "practice-visual",
    question_id: "map-1",
    question_type: "map-click",
    result: {
      reviewData: {
        userCoordinates: { lat: 999, lng: -0.12 },
        correctCoordinates: { latitude: 51.5308, longitude: -0.1238 },
        userRoute: [{ lat: 51.5, lng: -0.1 }],
        referenceRoute: [
          { lat: 51.5, lng: -0.1 },
          { lat: 51.51, lng: -0.11 }
        ]
      }
    }
  });

  const reviewData = attempt.reviewData as Record<string, unknown>;

  assert.equal(reviewData.userCoordinates, undefined);
  assert.deepEqual(reviewData.correctCoordinates, {
    lat: 51.5308,
    lng: -0.1238
  });
  assert.equal(reviewData.userRoute, undefined);
  assert.deepEqual(reviewData.referenceRoute, [
    { lat: 51.5, lng: -0.1 },
    { lat: 51.51, lng: -0.11 }
  ]);
});

test("normalizeMockAttempt reads visual review data from result details", () => {
  const attempt = normalizeMockAttempt({
    id: "mock-visual",
    answers: {
      "route-1": {
        type: "route-drawing",
        routePoints: []
      }
    },
    result: {
      questionResults: [
        {
          questionId: "route-1",
          type: "route-drawing",
          score: 20,
          maxScore: 100,
          passed: false,
          details: {
            reviewData: {
              start: { lat: 51.5, lng: -0.1, label: "Start" },
              destination: { lat: 51.51, lng: -0.11, label: "End" },
              referenceRoute: [
                { lat: 51.5, lng: -0.1 },
                { lat: 51.51, lng: -0.11 }
              ]
            }
          }
        }
      ]
    }
  });

  const reviewData = attempt.questionResults[0].reviewData as Record<
    string,
    unknown
  >;

  assert.deepEqual(reviewData.start, {
    lat: 51.5,
    lng: -0.1,
    label: "Start"
  });
  assert.deepEqual(reviewData.destination, {
    lat: 51.51,
    lng: -0.11,
    label: "End"
  });
  assert.deepEqual(reviewData.referenceRoute, [
    { lat: 51.5, lng: -0.1 },
    { lat: 51.51, lng: -0.11 }
  ]);
});
