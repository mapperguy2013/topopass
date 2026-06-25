import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProgressSummaryFromAttempts,
  chooseAccountProgressDisplay,
  emptyAccountProgressSummary
} from "./accountProgress.ts";
import type {
  NormalizedMockAttempt,
  NormalizedPracticeAttempt
} from "../db/progressMigration.ts";

const practiceAttempt: NormalizedPracticeAttempt = {
  id: "practice-1",
  source: "practice",
  questionId: "knowledge-road-atlas-index",
  questionType: "knowledge",
  score: 1,
  maxScore: 1,
  percentage: 100,
  passed: true,
  answer: { selectedAnswer: "A" },
  result: { correctAnswer: "A" },
  reviewData: null,
  createdAt: "2026-06-24T10:00:00.000Z"
};

const mockAttempt: NormalizedMockAttempt = {
  id: "mock-1",
  source: "mock-test",
  questionIds: ["knowledge-road-atlas-index"],
  score: 14,
  maxScore: 20,
  percentage: 70,
  passed: true,
  submittedAt: "2026-06-25T10:00:00.000Z",
  createdAt: "2026-06-25T10:00:00.000Z",
  durationSeconds: 1200,
  mode: "exam",
  questionResults: [],
  answers: {},
  rawResult: null
};

test("account progress display falls back to local browser progress when account is empty", () => {
  const localProgress = buildProgressSummaryFromAttempts({
    practiceAttempts: [practiceAttempt],
    mockAttempts: [mockAttempt]
  });

  const choice = chooseAccountProgressDisplay({
    accountProgress: emptyAccountProgressSummary,
    accountQuestionCount: 0,
    localLoaded: true,
    localProgress,
    localQuestionCount: 2
  });

  assert.equal(choice.kind, "local-browser");
  assert.equal(choice.label, "Local browser progress");
  assert.match(choice.note, /Account sync is still being finalised/);
});

test("account progress display does not prefer local fallback when account data exists", () => {
  const accountProgress = buildProgressSummaryFromAttempts({
    practiceAttempts: [practiceAttempt],
    mockAttempts: []
  });
  const localProgress = buildProgressSummaryFromAttempts({
    practiceAttempts: [practiceAttempt],
    mockAttempts: [mockAttempt]
  });

  const choice = chooseAccountProgressDisplay({
    accountProgress,
    accountQuestionCount: 1,
    localLoaded: true,
    localProgress,
    localQuestionCount: 2
  });

  assert.equal(choice.kind, "account");
  assert.equal(choice.label, "Account progress");
  assert.match(choice.note, /account-backed progress/i);
});

test("account progress display handles no progress without misleading totals", () => {
  const choice = chooseAccountProgressDisplay({
    accountProgress: emptyAccountProgressSummary,
    accountQuestionCount: 0,
    localLoaded: true,
    localProgress: emptyAccountProgressSummary,
    localQuestionCount: 0
  });

  assert.equal(choice.kind, "empty");
  assert.equal(choice.label, "No progress yet");
});

test("account progress display uses a calm local message when account reads fail", () => {
  const localProgress = buildProgressSummaryFromAttempts({
    practiceAttempts: [practiceAttempt],
    mockAttempts: []
  });

  const choice = chooseAccountProgressDisplay({
    accountProgress: emptyAccountProgressSummary,
    accountQuestionCount: 0,
    localLoaded: true,
    localProgress,
    localQuestionCount: 1,
    hasAccountError: true
  });

  assert.equal(choice.kind, "local-browser");
  assert.match(choice.note, /local browser progress is still available/i);
});

test("local progress summary calculates latest activity and average score", () => {
  const progress = buildProgressSummaryFromAttempts({
    practiceAttempts: [practiceAttempt],
    mockAttempts: [mockAttempt]
  });

  assert.equal(progress.practiceAttempts, 1);
  assert.equal(progress.mockAttempts, 1);
  assert.equal(progress.averageScore, 85);
  assert.equal(progress.latestMockScore?.percentage, 70);
  assert.equal(progress.latestAttemptAt, "2026-06-25T10:00:00.000Z");
});
