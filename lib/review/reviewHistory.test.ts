import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { knowledgeQuestionBank } from "../knowledgeQuestions.ts";
import { seruQuestionBank } from "../seruQuestions.ts";
import { phvHandbookQuestions } from "../seruPhvQuestions.ts";
import {
  sentenceCompletionQuestions,
  advancedSentenceCompletionQuestions
} from "../seruEnglishQuestions.ts";
import { demoMapClickQuestions } from "../mapClickQuestions.ts";
import type {
  NormalizedMockAttempt,
  NormalizedPracticeAttempt
} from "../db/progressMigration.ts";
import {
  buildReviewHistory,
  defaultReviewHistoryFilters,
  filterReviewHistory
} from "./reviewHistory.ts";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "../..");
const knowledgeQuestion = knowledgeQuestionBank[0];
const seruQuestion = seruQuestionBank[0];
const phvQuestion = phvHandbookQuestions[0];
const englishSingleQuestion = sentenceCompletionQuestions[0];
const englishAdvancedQuestion = advancedSentenceCompletionQuestions[0];
const mapQuestion = demoMapClickQuestions[0];

function practiceAttempt(
  overrides: Partial<NormalizedPracticeAttempt>
): NormalizedPracticeAttempt {
  return {
    id: "practice-1",
    source: "practice",
    questionId: knowledgeQuestion.id,
    questionType: "knowledge",
    score: 1,
    maxScore: 1,
    percentage: 100,
    passed: true,
    answer: { selectedAnswer: knowledgeQuestion.correctAnswer },
    result: { correctAnswer: knowledgeQuestion.correctAnswer },
    reviewData: null,
    createdAt: "2026-06-24T10:00:00.000Z",
    ...overrides
  };
}

const mockAttempt: NormalizedMockAttempt = {
  id: "mock-1",
  source: "mock-test",
  questionIds: [`mock-${mapQuestion.id}`],
  score: 0,
  maxScore: 100,
  percentage: 0,
  passed: false,
  submittedAt: "2026-06-22T10:00:00.000Z",
  createdAt: "2026-06-22T10:00:00.000Z",
  durationSeconds: 120,
  mode: "practice",
  answers: {
    [`mock-${mapQuestion.id}`]: {
      type: "map-click",
      coordinates: { latitude: 51.5, longitude: -0.12 }
    }
  },
  rawResult: null,
  questionResults: [
    {
      questionId: `mock-${mapQuestion.id}`,
      type: "map-click",
      score: 0,
      maxScore: 100,
      percentage: 0,
      passed: false,
      userAnswerSummary: "Clicked location",
      acceptedAnswerSummary: "Accepted target",
      details: {
        type: "map-click",
        clickedCoordinates: { latitude: 51.5, longitude: -0.12 },
        target: mapQuestion.answer,
        distanceMeters: 500,
        toleranceMeters: mapQuestion.toleranceMeters
      },
      reviewData: null
    }
  ]
};

test("review route renders real review UI instead of the old placeholder", () => {
  const pageSource = readFileSync(
    path.join(projectRoot, "app/review/page.tsx"),
    "utf8"
  );
  const placeholderSource = readFileSync(
    path.join(projectRoot, "components/results/QuestionReview.tsx"),
    "utf8"
  );

  assert.match(pageSource, /ReviewHistory/);
  assert.match(pageSource, /buildReviewHistory/);
  assert.doesNotMatch(pageSource, /Saved review history is not persisted in Phase 1/);
  assert.doesNotMatch(placeholderSource, /Saved review history is not persisted in Phase 1/);
});

test("review history includes correct and incorrect answers", () => {
  const history = buildReviewHistory({
    practiceAttempts: [practiceAttempt({})],
    mockAttempts: [mockAttempt]
  });

  assert.equal(history.length, 2);
  assert.ok(history.some((item) => item.passed));
  assert.ok(history.some((item) => !item.passed));
});

test("review history includes SERU-style practice answers from the SERU bank", () => {
  const history = buildReviewHistory({
    practiceAttempts: [
      practiceAttempt({
        id: "seru-practice",
        questionId: seruQuestion.id,
        questionType: "knowledge",
        answer: { selectedAnswer: seruQuestion.correctAnswer },
        result: {
          correctAnswer: seruQuestion.correctAnswer,
          questionFamily: "seru"
        },
        passed: true
      })
    ],
    mockAttempts: []
  });

  assert.equal(history.length, 1);
  assert.equal(history[0].questionId, seruQuestion.id);
  assert.equal(history[0].category, seruQuestion.category);
  assert.equal(history[0].source, "practice");
  assert.match(history[0].title, /private hire|driver|passenger/i);
});

test("review history includes PHV handbook section and topic metadata", () => {
  const history = buildReviewHistory({
    practiceAttempts: [
      practiceAttempt({
        id: "phv-practice",
        questionId: phvQuestion.id,
        questionType: "knowledge",
        answer: { selectedAnswer: phvQuestion.correctAnswer },
        result: {
          correctAnswer: phvQuestion.correctAnswer,
          explanation: phvQuestion.explanation,
          handbookSection: phvQuestion.handbookSection,
          questionFamily: "seru",
          topic: phvQuestion.topic
        },
        passed: true
      })
    ],
    mockAttempts: []
  });

  assert.equal(history.length, 1);
  assert.equal(history[0].category, phvQuestion.category);
  assert.equal(history[0].handbookSection, phvQuestion.handbookSection);
  assert.equal(history[0].topic, phvQuestion.topic);
});

test("review history resolves SERU English sentence completion answers", () => {
  const history = buildReviewHistory({
    practiceAttempts: [
      practiceAttempt({
        id: "seru-english-single",
        questionId: englishSingleQuestion.id,
        questionType: "knowledge",
        answer: { selectedAnswer: englishSingleQuestion.correctAnswer },
        result: {
          correctAnswer: englishSingleQuestion.correctAnswer,
          explanation: englishSingleQuestion.explanation,
          questionFamily: "seru",
          questionSubtype: "sentence_completion"
        },
        passed: true
      }),
      practiceAttempt({
        id: "seru-english-advanced",
        questionId: englishAdvancedQuestion.id,
        questionType: "knowledge",
        answer: { selectedWords: englishAdvancedQuestion.correctAnswers },
        result: {
          correctAnswer: englishAdvancedQuestion.correctAnswers.join(" / "),
          explanation: englishAdvancedQuestion.explanation,
          questionFamily: "seru",
          questionSubtype: "multi_sentence_completion"
        },
        passed: true
      })
    ],
    mockAttempts: []
  });

  assert.equal(history.length, 2);
  assert.equal(history[0].questionType, "knowledge");
  assert.match(history[0].title, /___/);
  assert.ok(
    history.every((item) => item.category?.startsWith("SERU English"))
  );
  assert.ok(
    history.some((item) =>
      item.learnerAnswer.includes(englishAdvancedQuestion.correctAnswers[0])
    )
  );
});

test("review filters by subject", () => {
  const history = buildReviewHistory({
    practiceAttempts: [practiceAttempt({})],
    mockAttempts: [mockAttempt]
  });
  const subject = history.find((item) => item.category)?.category;
  assert.ok(subject);

  const filtered = filterReviewHistory(history, {
    ...defaultReviewHistoryFilters,
    subject
  });

  assert.ok(filtered.length > 0);
  assert.ok(filtered.every((item) => item.category === subject));
});

test("review filters by correct and incorrect result", () => {
  const history = buildReviewHistory({
    practiceAttempts: [practiceAttempt({})],
    mockAttempts: [mockAttempt]
  });

  assert.deepEqual(
    filterReviewHistory(history, {
      ...defaultReviewHistoryFilters,
      result: "correct"
    }).map((item) => item.passed),
    [true]
  );
  assert.deepEqual(
    filterReviewHistory(history, {
      ...defaultReviewHistoryFilters,
      result: "incorrect"
    }).map((item) => item.passed),
    [false]
  );
});

test("review filters by date range", () => {
  const history = buildReviewHistory({
    practiceAttempts: [
      practiceAttempt({
        id: "recent",
        createdAt: "2026-06-24T10:00:00.000Z"
      }),
      practiceAttempt({
        id: "old",
        createdAt: "2026-05-01T10:00:00.000Z"
      })
    ],
    mockAttempts: []
  });
  const filtered = filterReviewHistory(
    history,
    {
      ...defaultReviewHistoryFilters,
      dateRange: "last-7-days"
    },
    new Date("2026-06-24T12:00:00.000Z")
  );

  assert.deepEqual(
    filtered.map((item) => item.answeredAt),
    ["2026-06-24T10:00:00.000Z"]
  );
});

test("review filters by question type and source", () => {
  const history = buildReviewHistory({
    practiceAttempts: [practiceAttempt({})],
    mockAttempts: [mockAttempt]
  });

  assert.deepEqual(
    filterReviewHistory(history, {
      ...defaultReviewHistoryFilters,
      questionType: "knowledge"
    }).map((item) => item.questionType),
    ["knowledge"]
  );
  assert.deepEqual(
    filterReviewHistory(history, {
      ...defaultReviewHistoryFilters,
      source: "mock"
    }).map((item) => item.source),
    ["mock"]
  );
});

test("review sorts newest and oldest", () => {
  const history = buildReviewHistory({
    practiceAttempts: [practiceAttempt({})],
    mockAttempts: [mockAttempt]
  });

  assert.deepEqual(
    filterReviewHistory(history, {
      ...defaultReviewHistoryFilters,
      sort: "newest"
    }).map((item) => item.answeredAt),
    ["2026-06-24T10:00:00.000Z", "2026-06-22T10:00:00.000Z"]
  );
  assert.deepEqual(
    filterReviewHistory(history, {
      ...defaultReviewHistoryFilters,
      sort: "oldest"
    }).map((item) => item.answeredAt),
    ["2026-06-22T10:00:00.000Z", "2026-06-24T10:00:00.000Z"]
  );
});
