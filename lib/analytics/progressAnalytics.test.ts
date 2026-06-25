import assert from "node:assert/strict";
import { test } from "node:test";
import { getQuestionStatsFromAttempts } from "./questionStats.ts";
import {
  getAreaBreakdown,
  getStrongestArea,
  getWeakestArea
} from "./weakAreaAnalyzer.ts";
import { getProgressTrend, getRecentTrendSummary } from "./progressTrends.ts";
import { calculateLearningStreak } from "./streakCalculator.ts";
import {
  calculateAccuracySummary,
  calculateRecentTrend,
  getLongestStreak,
  getRecentActivityCount,
  getRecentScoredAttempts,
  type ProgressSummaryAttempt
} from "./progressSummary.ts";

const practiceAttempts = [
  {
    id: "p1",
    questionId: "knowledge-cardinal-direction",
    questionType: "knowledge",
    score: 1,
    maxScore: 1,
    passed: true,
    createdAt: "2026-06-20T09:00:00.000Z"
  },
  {
    id: "p2",
    questionId: "map-kings-cross",
    questionType: "map-click",
    score: 0,
    maxScore: 1,
    passed: false,
    createdAt: "2026-06-21T09:00:00.000Z"
  },
  {
    id: "p3",
    questionId: "route-kings-cross-euston",
    questionType: "route-drawing",
    score: 50,
    maxScore: 100,
    passed: false,
    createdAt: "2026-06-22T09:00:00.000Z"
  }
];

const mockAttempts = [
  {
    id: "m1",
    submittedAt: "2026-06-23T09:00:00.000Z",
    result: {
      percentage: 80,
      passed: true,
      questionResults: [
        {
          questionId: "knowledge-cardinal-direction",
          type: "knowledge",
          score: 100,
          maxScore: 100,
          percentage: 100,
          passed: true,
          userAnswerSummary: "South",
          acceptedAnswerSummary: "South"
        },
        {
          questionId: "map-kings-cross",
          type: "map-click",
          score: 0,
          maxScore: 100,
          percentage: 0,
          passed: false,
          userAnswerSummary: "Far away",
          acceptedAnswerSummary: "King's Cross"
        }
      ]
    }
  }
];

function scoredPracticeAttempt({
  id,
  percentage,
  passed = typeof percentage === "number" ? percentage >= 60 : null,
  createdAt
}: {
  id: string;
  percentage: number | null;
  passed?: boolean | null;
  createdAt: string;
}): ProgressSummaryAttempt {
  return {
    id,
    source: "practice",
    questionId: `question-${id}`,
    questionType: "knowledge",
    score: percentage,
    maxScore: percentage === null ? null : 100,
    percentage,
    passed,
    answer: null,
    result: null,
    reviewData: null,
    createdAt
  };
}

function scoredMockAttempt({
  id,
  percentage,
  passed = percentage >= 60,
  submittedAt,
  questionPercentages = []
}: {
  id: string;
  percentage: number;
  passed?: boolean | null;
  submittedAt: string;
  questionPercentages?: number[];
}): ProgressSummaryAttempt {
  return {
    id,
    source: "mock-test",
    questionIds: questionPercentages.map((_, index) => `mock-${id}-${index}`),
    score: percentage,
    maxScore: 100,
    percentage,
    passed,
    submittedAt,
    createdAt: submittedAt,
    durationSeconds: null,
    mode: "practice",
    questionResults: questionPercentages.map((score, index) => ({
      questionId: `mock-${id}-${index}`,
      type: "knowledge",
      score,
      maxScore: 100,
      percentage: score,
      passed: score >= 60,
      userAnswerSummary: "Learner answer",
      acceptedAnswerSummary: "Accepted answer",
      details: null,
      reviewData: null
    })),
    answers: {},
    rawResult: null
  };
}

test("questionStats counts attempts and correct answers across practice and mock attempts", () => {
  const stats = getQuestionStatsFromAttempts(practiceAttempts, mockAttempts);
  const knowledge = stats.find(
    (stat) => stat.questionId === "knowledge-cardinal-direction"
  );
  const map = stats.find((stat) => stat.questionId === "map-kings-cross");

  assert.deepEqual(knowledge, {
    questionId: "knowledge-cardinal-direction",
    attempts: 2,
    correct: 2,
    successRate: 100
  });
  assert.deepEqual(map, {
    questionId: "map-kings-cross",
    attempts: 2,
    correct: 0,
    successRate: 0
  });
});

test("weakAreaAnalyzer sorts areas from weakest to strongest", () => {
  const breakdown = getAreaBreakdown(practiceAttempts, mockAttempts);

  assert.equal(breakdown[0].area, "Map-click");
  assert.equal(getWeakestArea(practiceAttempts, mockAttempts)?.area, "Map-click");
  assert.equal(
    getStrongestArea(practiceAttempts, mockAttempts)?.area,
    "Knowledge"
  );
});

test("progressTrends returns chronological score points and summary", () => {
  const trend = getProgressTrend(practiceAttempts, mockAttempts);
  const summary = getRecentTrendSummary(practiceAttempts, mockAttempts);

  assert.deepEqual(
    trend.map((point) => point.score),
    [100, 0, 50, 80]
  );
  assert.equal(summary.direction, "declining");
});

test("streakCalculator reports current and longest consecutive attempt days", () => {
  const streak = calculateLearningStreak(
    practiceAttempts,
    mockAttempts,
    new Date("2026-06-23T12:00:00.000Z")
  );

  assert.deepEqual(streak, { current: 4, longest: 4 });
});

test("progressSummary returns zero summary and not-enough-data trend with no attempts", () => {
  assert.deepEqual(calculateAccuracySummary([]), {
    totalAttempts: 0,
    correct: 0,
    wrong: 0,
    totalQuestions: 0,
    accuracyPercent: 0
  });
  assert.deepEqual(calculateRecentTrend([]), {
    status: "not-enough-data",
    label: "Not enough data",
    description: "Complete more scored attempts to see your recent trend.",
    olderAverage: null,
    newerAverage: null
  });
});

test("progressSummary requires at least three scored attempts for trend", () => {
  const trend = calculateRecentTrend([
    scoredPracticeAttempt({
      id: "p1",
      percentage: 80,
      createdAt: "2026-06-21T09:00:00.000Z"
    }),
    scoredPracticeAttempt({
      id: "p2",
      percentage: 90,
      createdAt: "2026-06-22T09:00:00.000Z"
    })
  ]);

  assert.equal(trend.status, "not-enough-data");
});

test("progressSummary detects improving, declining, and stable recent trends", () => {
  const dates = [
    "2026-06-15T09:00:00.000Z",
    "2026-06-16T09:00:00.000Z",
    "2026-06-17T09:00:00.000Z",
    "2026-06-18T09:00:00.000Z",
    "2026-06-19T09:00:00.000Z"
  ];
  const attempts = (scores: number[]) =>
    scores.map((score, index) =>
      scoredPracticeAttempt({
        id: `trend-${index}`,
        percentage: score,
        createdAt: dates[index]
      })
    );

  assert.equal(
    calculateRecentTrend(attempts([40, 45, 50, 70, 75])).status,
    "improving"
  );
  assert.equal(
    calculateRecentTrend(attempts([80, 75, 70, 55, 50])).status,
    "declining"
  );
  assert.equal(
    calculateRecentTrend(attempts([65, 67, 66, 69, 68])).status,
    "stable"
  );
});

test("progressSummary calculates correct and wrong totals with accuracy percent", () => {
  const summary = calculateAccuracySummary([
    scoredPracticeAttempt({
      id: "p1",
      percentage: 100,
      passed: true,
      createdAt: "2026-06-20T09:00:00.000Z"
    }),
    scoredPracticeAttempt({
      id: "p2",
      percentage: 20,
      passed: false,
      createdAt: "2026-06-21T09:00:00.000Z"
    }),
    scoredMockAttempt({
      id: "m1",
      percentage: 67,
      submittedAt: "2026-06-22T09:00:00.000Z",
      questionPercentages: [100, 80, 20]
    })
  ]);

  assert.deepEqual(summary, {
    totalAttempts: 3,
    correct: 3,
    wrong: 2,
    totalQuestions: 5,
    accuracyPercent: 60
  });
});

test("progressSummary counts recent scored activity only within the date window", () => {
  const attempts = [
    scoredPracticeAttempt({
      id: "old",
      percentage: 80,
      createdAt: "2026-06-10T09:00:00.000Z"
    }),
    scoredPracticeAttempt({
      id: "recent",
      percentage: 80,
      createdAt: "2026-06-20T09:00:00.000Z"
    }),
    scoredPracticeAttempt({
      id: "unscored",
      percentage: null,
      createdAt: "2026-06-22T09:00:00.000Z"
    })
  ];

  assert.equal(
    getRecentActivityCount(
      attempts,
      7,
      new Date("2026-06-23T12:00:00.000Z")
    ),
    1
  );
});

test("progressSummary returns recent scored attempts oldest to newest", () => {
  const recent = getRecentScoredAttempts(
    [
      scoredPracticeAttempt({
        id: "p1",
        percentage: 80,
        createdAt: "2026-06-20T09:00:00.000Z"
      }),
      scoredPracticeAttempt({
        id: "p2",
        percentage: null,
        createdAt: "2026-06-21T09:00:00.000Z"
      }),
      scoredPracticeAttempt({
        id: "p3",
        percentage: 70,
        createdAt: "2026-06-22T09:00:00.000Z"
      })
    ],
    9
  );

  assert.deepEqual(
    recent.map((attempt) => attempt.id),
    ["p1", "p3"]
  );
});

test("progressSummary calculates longest scored pass streak", () => {
  const streak = getLongestStreak([
    scoredPracticeAttempt({
      id: "p1",
      percentage: 80,
      createdAt: "2026-06-20T09:00:00.000Z"
    }),
    scoredPracticeAttempt({
      id: "p2",
      percentage: 65,
      createdAt: "2026-06-21T09:00:00.000Z"
    }),
    scoredPracticeAttempt({
      id: "p3",
      percentage: 30,
      createdAt: "2026-06-22T09:00:00.000Z"
    }),
    scoredPracticeAttempt({
      id: "p4",
      percentage: 90,
      createdAt: "2026-06-23T09:00:00.000Z"
    })
  ]);

  assert.equal(streak, 2);
});
