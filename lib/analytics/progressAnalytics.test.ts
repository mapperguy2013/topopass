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
