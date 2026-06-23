import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_MOCK_EXAM_CONFIG } from "./mockExamConfig.ts";
import {
  selectMockExamQuestions,
  knowledgeMockQuestionBank,
  mapClickMockQuestionBank,
  routeDrawingMockQuestionBank
} from "./mockTestQuestions.ts";
import {
  getMockExamTimerLevel,
  getRemainingExamSeconds,
  shouldAutoSubmitMockExam
} from "./mockExamTimer.ts";

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

test("expanded banks contain enough questions for configured exam counts", () => {
  assert.ok(
    knowledgeMockQuestionBank.length >=
      DEFAULT_MOCK_EXAM_CONFIG.questionCounts.knowledge
  );
  assert.ok(
    mapClickMockQuestionBank.length >=
      DEFAULT_MOCK_EXAM_CONFIG.questionCounts["map-click"]
  );
  assert.ok(
    routeDrawingMockQuestionBank.length >=
      DEFAULT_MOCK_EXAM_CONFIG.questionCounts["route-drawing"]
  );
});

test("question selector returns configured mixed counts without duplicates", () => {
  const questions = selectMockExamQuestions(
    DEFAULT_MOCK_EXAM_CONFIG,
    seededRandom(12)
  );
  const ids = questions.map((question) => question.id);

  assert.equal(questions.length, 8);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(
    questions.filter((question) => question.type === "knowledge").length,
    3
  );
  assert.equal(
    questions.filter((question) => question.type === "map-click").length,
    3
  );
  assert.equal(
    questions.filter((question) => question.type === "route-drawing").length,
    2
  );
});

test("new attempts can select a different ordered question set", () => {
  const first = selectMockExamQuestions(
    DEFAULT_MOCK_EXAM_CONFIG,
    seededRandom(1)
  ).map((question) => question.id);
  const second = selectMockExamQuestions(
    DEFAULT_MOCK_EXAM_CONFIG,
    seededRandom(2)
  ).map((question) => question.id);

  assert.notDeepEqual(first, second);
});

test("timer helpers identify warnings and automatic expiry", () => {
  const now = 1_000_000;

  assert.equal(getRemainingExamSeconds(now + 90_000, now), 90);
  assert.equal(getMockExamTimerLevel(301), "normal");
  assert.equal(getMockExamTimerLevel(300), "five-minute-warning");
  assert.equal(getMockExamTimerLevel(60), "one-minute-warning");
  assert.equal(shouldAutoSubmitMockExam(now + 1, now + 1), true);
});
