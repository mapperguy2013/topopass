import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSeruMockQuestions,
  scoreSeruMockAnswers,
  scoreSeruMockQuestion,
  SERU_MOCK_CONFIG,
  type SeruMockAnswer
} from "./seruMockTest.ts";
import { selectMockExamQuestions } from "./mockTestQuestions.ts";
import { DEFAULT_MOCK_EXAM_CONFIG } from "./mockExamConfig.ts";

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

test("SERU mock builder returns the required 20 question mix", () => {
  const questions = buildSeruMockQuestions(seededRandom(10));

  assert.equal(questions.length, 20);
  assert.deepEqual(SERU_MOCK_CONFIG.questionCounts, {
    seru_phv: 5,
    seru_english_advanced: 5,
    seru_english_single: 5,
    seru_reading: 5
  });
  assert.equal(questions.filter((question) => question.type === "seru_phv").length, 5);
  assert.equal(
    questions.filter((question) => question.type === "seru_english_advanced").length,
    5
  );
  assert.equal(
    questions.filter((question) => question.type === "seru_english_single").length,
    5
  );
  assert.equal(questions.filter((question) => question.type === "seru_reading").length, 5);
});

test("SERU mock keeps fixed blocks by question type", () => {
  const questions = buildSeruMockQuestions(seededRandom(11));

  assert.deepEqual(
    questions.map((question) => question.type),
    [
      ...Array(5).fill("seru_phv"),
      ...Array(5).fill("seru_english_advanced"),
      ...Array(5).fill("seru_english_single"),
      ...Array(5).fill("seru_reading")
    ]
  );
});

test("SERU mock does not include topographical question types", () => {
  const questions = buildSeruMockQuestions(seededRandom(12));

  assert.ok(
    questions.every(
      (question) =>
        question.type !== "map-click" && question.type !== "route-drawing"
    )
  );

  const topographicalMock = selectMockExamQuestions(
    DEFAULT_MOCK_EXAM_CONFIG,
    seededRandom(12)
  );
  assert.ok(topographicalMock.every((question) => !question.id.startsWith("seru-")));
});

test("SERU mock answer checking works for every supported type", () => {
  const questions = buildSeruMockQuestions(seededRandom(13));
  const phv = questions.find((question) => question.type === "seru_phv");
  const advanced = questions.find(
    (question) => question.type === "seru_english_advanced"
  );
  const single = questions.find(
    (question) => question.type === "seru_english_single"
  );
  const reading = questions.find((question) => question.type === "seru_reading");

  assert.ok(phv);
  assert.ok(advanced);
  assert.ok(single);
  assert.ok(reading);

  assert.equal(
    scoreSeruMockQuestion(phv, phv.question.correctAnswer).correct,
    true
  );
  assert.equal(scoreSeruMockQuestion(phv, "wrong").correct, false);
  assert.equal(
    scoreSeruMockQuestion(advanced, advanced.question.correctAnswers).correct,
    true
  );
  assert.deepEqual(
    scoreSeruMockQuestion(advanced, [
      advanced.question.correctAnswers[0],
      "wrong",
      advanced.question.correctAnswers[2]
    ]).blankResults,
    [true, false, true]
  );
  assert.equal(
    scoreSeruMockQuestion(single, single.question.correctAnswer).correct,
    true
  );
  assert.equal(
    scoreSeruMockQuestion(reading, reading.question.correctAnswer).correct,
    true
  );
});

test("SERU mock result breakdown and review metadata are calculated", () => {
  const questions = buildSeruMockQuestions(seededRandom(14));
  const answers: Record<string, SeruMockAnswer> = {};

  questions.forEach((question, index) => {
    if (index === 0) {
      answers[question.id] = "wrong";
      return;
    }

    if (question.type === "seru_phv") {
      answers[question.id] = question.question.correctAnswer;
    } else if (question.type === "seru_english_advanced") {
      answers[question.id] = question.question.correctAnswers;
    } else if (question.type === "seru_english_single") {
      answers[question.id] = question.question.correctAnswer;
    } else {
      answers[question.id] = question.question.correctAnswer;
    }
  });

  const result = scoreSeruMockAnswers(questions, answers);

  assert.equal(result.totalQuestions, 20);
  assert.equal(result.score, 19);
  assert.equal(result.percentage, 95);
  assert.equal(result.passed, true);
  assert.deepEqual(result.breakdown.seru_phv, {
    label: "PHV Handbook",
    correct: 4,
    total: 5
  });
  assert.equal(result.breakdown.seru_english_advanced.total, 5);
  assert.equal(result.breakdown.seru_english_single.total, 5);
  assert.equal(result.breakdown.seru_reading.total, 5);
  assert.ok(result.questionResults.every((entry) => entry.explanation.length > 0));
  assert.ok(result.questionResults.every((entry) => entry.correctAnswer.length > 0));
});
