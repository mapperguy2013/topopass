import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  NormalizedMockAttempt,
  NormalizedPracticeAttempt
} from "../db/progressMigration.ts";
import { knowledgeQuestionBank } from "../knowledgeQuestions.ts";
import { buildLearnerDashboardSummary } from "./learnerDashboard.ts";

const directionQuestion = knowledgeQuestionBank.find(
  (question) => question.category === "Direction sense"
);
const routeQuestion = knowledgeQuestionBank.find(
  (question) => question.category === "Route planning"
);

if (!directionQuestion || !routeQuestion) {
  throw new Error("Expected seeded knowledge questions for dashboard tests.");
}

function practiceAttempt(
  overrides: Partial<NormalizedPracticeAttempt>
): NormalizedPracticeAttempt {
  return {
    id: "practice-1",
    source: "practice",
    questionId: directionQuestion.id,
    questionType: "knowledge",
    score: 1,
    maxScore: 1,
    percentage: 100,
    passed: true,
    answer: { selectedAnswer: directionQuestion.correctAnswer },
    result: { correctAnswer: directionQuestion.correctAnswer },
    reviewData: null,
    createdAt: "2026-06-24T10:00:00.000Z",
    ...overrides
  };
}

const mockAttempt: NormalizedMockAttempt = {
  id: "mock-1",
  source: "mock-test",
  questionIds: [routeQuestion.id],
  score: 0,
  maxScore: 100,
  percentage: 0,
  passed: false,
  submittedAt: "2026-06-24T11:00:00.000Z",
  createdAt: "2026-06-24T10:45:00.000Z",
  durationSeconds: 900,
  mode: "practice",
  answers: {},
  rawResult: null,
  questionResults: [
    {
      questionId: routeQuestion.id,
      type: "knowledge",
      score: 0,
      maxScore: 100,
      percentage: 0,
      passed: false,
      userAnswerSummary: "Wrong answer",
      acceptedAnswerSummary: routeQuestion.correctAnswer,
      details: {
        type: "knowledge",
        correctAnswer: routeQuestion.correctAnswer
      },
      reviewData: null
    }
  ]
};

test("learner dashboard summary calculates core progress totals", () => {
  const summary = buildLearnerDashboardSummary({
    practiceAttempts: [practiceAttempt({})],
    mockAttempts: [mockAttempt]
  });

  assert.equal(summary.totalQuestionsAttempted, 2);
  assert.equal(summary.correctAnswers, 1);
  assert.equal(summary.accuracy, 50);
  assert.equal(summary.mockExamsCompleted, 1);
});

test("learner dashboard detects topic strengths and weaknesses only with enough data", () => {
  const summary = buildLearnerDashboardSummary({
    minTopicAttempts: 2,
    practiceAttempts: [
      practiceAttempt({
        id: "direction-1",
        questionId: directionQuestion.id,
        passed: true,
        score: 1,
        maxScore: 1
      }),
      practiceAttempt({
        id: "direction-2",
        questionId: directionQuestion.id,
        passed: true,
        score: 1,
        maxScore: 1
      }),
      practiceAttempt({
        id: "route-1",
        questionId: routeQuestion.id,
        passed: false,
        score: 0,
        maxScore: 1
      }),
      practiceAttempt({
        id: "route-2",
        questionId: routeQuestion.id,
        passed: false,
        score: 0,
        maxScore: 1
      })
    ],
    mockAttempts: []
  });

  assert.equal(summary.strongTopics[0].topic, "Direction sense");
  assert.equal(summary.weakTopics[0].topic, "Route planning");
  assert.match(summary.guidance, /Route planning/);
});

test("learner dashboard keeps low-data topics as developing", () => {
  const summary = buildLearnerDashboardSummary({
    minTopicAttempts: 3,
    practiceAttempts: [practiceAttempt({})],
    mockAttempts: []
  });

  assert.equal(summary.topicPerformance[0].topic, "Direction sense");
  assert.equal(summary.topicPerformance[0].enoughData, false);
  assert.equal(summary.topicPerformance[0].status, "developing");
  assert.match(summary.guidance, /few more attempts/);
});

test("learner dashboard recent activity includes review links and fallback labels", () => {
  const summary = buildLearnerDashboardSummary({
    practiceAttempts: [practiceAttempt({})],
    mockAttempts: [mockAttempt],
    recentLimit: 2
  });

  assert.equal(summary.recentActivity.length, 2);
  assert.equal(summary.recentActivity[0].href, "/review?source=mock");
  assert.match(summary.recentActivity[0].sourceLabel, /Mock exam/);
  assert.equal(summary.recentActivity[1].href, "/review?source=practice");
});
