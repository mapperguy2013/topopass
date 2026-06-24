import assert from "node:assert/strict";
import { test } from "node:test";
import { getPracticeRecommendations } from "./recommendationEngine.ts";

const referenceDate = new Date("2026-06-23T12:00:00.000Z");

function practiceAttempt({
  id,
  questionType,
  score,
  passed,
  createdAt
}: {
  id: string;
  questionType: "knowledge" | "map-click" | "route-drawing";
  score: number;
  passed: boolean;
  createdAt: string;
}) {
  return {
    id,
    questionId: `${questionType}-${id}`,
    questionType,
    score,
    maxScore: 100,
    passed,
    createdAt
  };
}

function mockAttempt({
  id,
  percentage,
  passed,
  submittedAt,
  questionResults = []
}: {
  id: string;
  percentage: number;
  passed: boolean;
  submittedAt: string;
  questionResults?: Array<{
    questionId: string;
    type: "knowledge" | "map-click" | "route-drawing";
    percentage: number;
    passed: boolean;
  }>;
}) {
  return {
    id,
    score: percentage,
    maxScore: 100,
    percentage,
    passed,
    submittedAt,
    result: {
      percentage,
      passed,
      questionResults: questionResults.map((result) => ({
        ...result,
        score: result.percentage,
        maxScore: 100,
        userAnswerSummary: "Learner answer",
        acceptedAnswerSummary: "Accepted answer"
      }))
    }
  };
}

test("recommendationEngine returns beginner recommendations with no attempts", () => {
  const recommendations = getPracticeRecommendations({ referenceDate });

  assert.equal(recommendations[0].id, "beginner-knowledge");
  assert.equal(recommendations[0].suggestedHref, "/practice/knowledge");
  assert.ok(recommendations.some((item) => item.id === "beginner-map-click"));
  assert.ok(recommendations.some((item) => item.id === "beginner-route"));
});

test("recommendationEngine prioritises weak route performance", () => {
  const recommendations = getPracticeRecommendations({
    referenceDate,
    practiceAttempts: [
      practiceAttempt({
        id: "route-1",
        questionType: "route-drawing",
        score: 45,
        passed: false,
        createdAt: "2026-06-22T09:00:00.000Z"
      }),
      practiceAttempt({
        id: "knowledge-1",
        questionType: "knowledge",
        score: 90,
        passed: true,
        createdAt: "2026-06-21T09:00:00.000Z"
      })
    ]
  });

  assert.equal(recommendations[0].id, "weak-route");
  assert.equal(recommendations[0].suggestedHref, "/practice/routes");
});

test("recommendationEngine prioritises weak map-click performance", () => {
  const recommendations = getPracticeRecommendations({
    referenceDate,
    practiceAttempts: [
      practiceAttempt({
        id: "map-1",
        questionType: "map-click",
        score: 30,
        passed: false,
        createdAt: "2026-06-22T09:00:00.000Z"
      }),
      practiceAttempt({
        id: "route-1",
        questionType: "route-drawing",
        score: 85,
        passed: true,
        createdAt: "2026-06-21T09:00:00.000Z"
      })
    ]
  });

  assert.equal(recommendations[0].id, "weak-map-click");
  assert.equal(recommendations[0].suggestedHref, "/practice/map-click");
});

test("recommendationEngine recommends mistake review after a failed mock", () => {
  const recommendations = getPracticeRecommendations({
    referenceDate,
    mockAttempts: [
      mockAttempt({
        id: "mock-1",
        percentage: 55,
        passed: false,
        submittedAt: "2026-06-22T09:00:00.000Z"
      })
    ]
  });

  assert.equal(recommendations[0].id, "failed-latest-mock");
  assert.equal(recommendations[0].suggestedHref, "/progress/mistakes");
});

test("recommendationEngine recommends reviewing recent mistakes", () => {
  const recommendations = getPracticeRecommendations({
    referenceDate,
    practiceAttempts: [
      practiceAttempt({
        id: "knowledge-1",
        questionType: "knowledge",
        score: 0,
        passed: false,
        createdAt: "2026-06-22T09:00:00.000Z"
      })
    ]
  });

  assert.ok(
    recommendations.some((item) => item.id === "review-recent-mistakes")
  );
});

test("recommendationEngine recognises improving recent performance", () => {
  const recommendations = getPracticeRecommendations({
    referenceDate,
    practiceAttempts: [
      practiceAttempt({
        id: "knowledge-1",
        questionType: "knowledge",
        score: 40,
        passed: false,
        createdAt: "2026-06-18T09:00:00.000Z"
      }),
      practiceAttempt({
        id: "knowledge-2",
        questionType: "knowledge",
        score: 55,
        passed: false,
        createdAt: "2026-06-19T09:00:00.000Z"
      }),
      practiceAttempt({
        id: "knowledge-3",
        questionType: "knowledge",
        score: 75,
        passed: true,
        createdAt: "2026-06-20T09:00:00.000Z"
      }),
      practiceAttempt({
        id: "knowledge-4",
        questionType: "knowledge",
        score: 85,
        passed: true,
        createdAt: "2026-06-21T09:00:00.000Z"
      })
    ]
  });

  assert.ok(
    recommendations.some((item) => item.id === "continue-improving-trend")
  );
});

test("recommendationEngine suggests a mock exam for strong performance", () => {
  const recommendations = getPracticeRecommendations({
    referenceDate,
    practiceAttempts: [
      practiceAttempt({
        id: "knowledge-1",
        questionType: "knowledge",
        score: 90,
        passed: true,
        createdAt: "2026-06-18T09:00:00.000Z"
      }),
      practiceAttempt({
        id: "knowledge-2",
        questionType: "knowledge",
        score: 85,
        passed: true,
        createdAt: "2026-06-19T09:00:00.000Z"
      }),
      practiceAttempt({
        id: "map-1",
        questionType: "map-click",
        score: 82,
        passed: true,
        createdAt: "2026-06-20T09:00:00.000Z"
      }),
      practiceAttempt({
        id: "route-1",
        questionType: "route-drawing",
        score: 88,
        passed: true,
        createdAt: "2026-06-21T09:00:00.000Z"
      }),
      practiceAttempt({
        id: "route-2",
        questionType: "route-drawing",
        score: 92,
        passed: true,
        createdAt: "2026-06-22T09:00:00.000Z"
      })
    ]
  });

  assert.ok(
    recommendations.some((item) => item.id === "strong-performance-mock")
  );
});
