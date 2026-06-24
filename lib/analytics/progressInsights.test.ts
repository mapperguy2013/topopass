import assert from "node:assert/strict";
import { test } from "node:test";
import { getProgressInsights } from "./progressInsights.ts";

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

test("progressInsights returns an empty-state analytics model", () => {
  const insights = getProgressInsights({ referenceDate });

  assert.equal(insights.totalAttempts, 0);
  assert.equal(insights.averageScore, null);
  assert.equal(insights.bestScore, null);
  assert.equal(insights.latestScore, null);
  assert.equal(insights.mockPassRate, null);
  assert.equal(insights.trendDirection, "insufficient-data");
  assert.match(insights.studyRecommendation, /Start with/);
});

test("progressInsights calculates average, best, latest, and mock pass rate", () => {
  const insights = getProgressInsights({
    referenceDate,
    practiceAttempts: [
      practiceAttempt({
        id: "p1",
        questionType: "knowledge",
        score: 80,
        passed: true,
        createdAt: "2026-06-20T09:00:00.000Z"
      })
    ],
    mockAttempts: [
      mockAttempt({
        id: "m1",
        percentage: 60,
        passed: false,
        submittedAt: "2026-06-21T09:00:00.000Z"
      }),
      mockAttempt({
        id: "m2",
        percentage: 90,
        passed: true,
        submittedAt: "2026-06-22T09:00:00.000Z"
      })
    ]
  });

  assert.equal(insights.totalPracticeAttempts, 1);
  assert.equal(insights.totalMockAttempts, 2);
  assert.equal(insights.averageScore, 77);
  assert.equal(insights.bestScore, 90);
  assert.equal(insights.latestScore, 90);
  assert.equal(insights.mockPassRate, 50);
  assert.deepEqual(
    insights.trendPoints.map((point) => [point.attemptId, point.source]),
    [
      ["p1", "practice"],
      ["m1", "mock"],
      ["m2", "mock"]
    ]
  );
});

test("progressInsights calculates type breakdown and weakest/strongest type", () => {
  const insights = getProgressInsights({
    referenceDate,
    practiceAttempts: [
      practiceAttempt({
        id: "p1",
        questionType: "knowledge",
        score: 90,
        passed: true,
        createdAt: "2026-06-20T09:00:00.000Z"
      }),
      practiceAttempt({
        id: "p2",
        questionType: "map-click",
        score: 30,
        passed: false,
        createdAt: "2026-06-21T09:00:00.000Z"
      }),
      practiceAttempt({
        id: "p3",
        questionType: "route-drawing",
        score: 70,
        passed: true,
        createdAt: "2026-06-22T09:00:00.000Z"
      })
    ]
  });

  assert.deepEqual(
    insights.typeBreakdown.map((item) => [item.type, item.averageScore]),
    [
      ["knowledge", 90],
      ["map-click", 30],
      ["route", 70]
    ]
  );
  assert.equal(insights.weakestType?.type, "map-click");
  assert.equal(insights.strongestType?.type, "knowledge");
});

test("progressInsights detects improving, declining, stable, and insufficient trends", () => {
  const improving = getProgressInsights({
    referenceDate,
    practiceAttempts: [
      practiceAttempt({
        id: "p1",
        questionType: "knowledge",
        score: 40,
        passed: false,
        createdAt: "2026-06-20T09:00:00.000Z"
      }),
      practiceAttempt({
        id: "p2",
        questionType: "knowledge",
        score: 60,
        passed: false,
        createdAt: "2026-06-21T09:00:00.000Z"
      })
    ]
  });
  const declining = getProgressInsights({
    referenceDate,
    practiceAttempts: [
      practiceAttempt({
        id: "p1",
        questionType: "knowledge",
        score: 80,
        passed: true,
        createdAt: "2026-06-20T09:00:00.000Z"
      }),
      practiceAttempt({
        id: "p2",
        questionType: "knowledge",
        score: 60,
        passed: false,
        createdAt: "2026-06-21T09:00:00.000Z"
      })
    ]
  });
  const stable = getProgressInsights({
    referenceDate,
    practiceAttempts: [
      practiceAttempt({
        id: "p1",
        questionType: "knowledge",
        score: 72,
        passed: true,
        createdAt: "2026-06-20T09:00:00.000Z"
      }),
      practiceAttempt({
        id: "p2",
        questionType: "knowledge",
        score: 74,
        passed: true,
        createdAt: "2026-06-21T09:00:00.000Z"
      })
    ]
  });

  assert.equal(improving.trendDirection, "improving");
  assert.equal(declining.trendDirection, "declining");
  assert.equal(stable.trendDirection, "stable");
  assert.equal(
    getProgressInsights({
      referenceDate,
      practiceAttempts: [
        practiceAttempt({
          id: "p1",
          questionType: "knowledge",
          score: 72,
          passed: true,
          createdAt: "2026-06-20T09:00:00.000Z"
        })
      ]
    }).trendDirection,
    "insufficient-data"
  );
});

test("progressInsights summarizes mistakes and reviewed state", () => {
  const insights = getProgressInsights({
    referenceDate,
    reviewedMistakeKeys: ["knowledge:knowledge-p1"],
    practiceAttempts: [
      practiceAttempt({
        id: "p1",
        questionType: "knowledge",
        score: 0,
        passed: false,
        createdAt: "2026-06-20T09:00:00.000Z"
      }),
      practiceAttempt({
        id: "p1",
        questionType: "knowledge",
        score: 20,
        passed: false,
        createdAt: "2026-06-21T09:00:00.000Z"
      }),
      practiceAttempt({
        id: "p2",
        questionType: "map-click",
        score: 0,
        passed: false,
        createdAt: "2026-06-22T09:00:00.000Z"
      })
    ]
  });

  assert.equal(insights.mistakeSummary.totalMistakes, 3);
  assert.equal(insights.mistakeSummary.uniqueMistakes, 2);
  assert.equal(insights.mistakeSummary.unreviewedMistakes, 1);
  assert.equal(insights.mistakeSummary.mostRepeatedMistake?.questionId, "knowledge-p1");
  assert.match(insights.studyRecommendation, /Review 1 unreviewed mistake/);
});

test("progressInsights recommendation prioritises weak type when mistakes are reviewed", () => {
  const insights = getProgressInsights({
    referenceDate,
    reviewedMistakeKeys: ["map-click:map-click-p1"],
    practiceAttempts: [
      practiceAttempt({
        id: "p1",
        questionType: "map-click",
        score: 40,
        passed: false,
        createdAt: "2026-06-22T09:00:00.000Z"
      })
    ]
  });

  assert.match(insights.studyRecommendation, /Map-click questions/);
});
