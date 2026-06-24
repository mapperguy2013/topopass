import assert from "node:assert/strict";
import test from "node:test";

import { knowledgeQuestionBank } from "../knowledgeQuestions.ts";
import { seruQuestionBank } from "../seruQuestions.ts";
import { demoMapClickQuestions } from "../mapClickQuestions.ts";
import {
  getActiveRouteQuestions,
  routeQuestions
} from "../../src/data/routeQuestions.ts";
import { DEFAULT_MOCK_EXAM_CONFIG } from "../mockExamConfig.ts";
import { selectMockExamQuestions } from "../mockTestQuestions.ts";
import {
  isQuestionTopic,
  isSeruQuestionTopic,
  QUESTION_TOPICS,
  SERU_QUESTION_TOPICS
} from "./topics.ts";

function assertUniqueIds(label: string, ids: string[]) {
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

  assert.deepEqual(
    [...new Set(duplicates)],
    [],
    `${label} contains duplicate IDs: ${[...new Set(duplicates)].join(", ")}`
  );
}

function isValidLatitude(value: number) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

test("question banks have unique stable IDs", () => {
  assertUniqueIds(
    "knowledge question bank",
    knowledgeQuestionBank.map((question) => question.id)
  );
  assertUniqueIds(
    "SERU question bank",
    seruQuestionBank.map((question) => question.id)
  );
  assertUniqueIds(
    "map-click question bank",
    demoMapClickQuestions.map((question) => question.id)
  );
  assertUniqueIds(
    "route question bank",
    routeQuestions.map((question) => question.id)
  );
});

test("knowledge questions have valid options, answers, explanations, and tips", () => {
  assert.ok(
    knowledgeQuestionBank.length >= 40,
    "Stage 23 should keep the knowledge bank meaningfully expanded"
  );

  knowledgeQuestionBank.forEach((question) => {
    assert.equal(question.type, "knowledge", question.id);
    assert.ok(question.id.startsWith("knowledge-"), question.id);
    assert.ok(question.prompt.trim().length > 0, question.id);
    assert.ok(question.options.length >= 2, question.id);
    assertUniqueIds(
      `knowledge options for ${question.id}`,
      question.options.map((option) => option.trim())
    );
    assert.ok(
      question.options.includes(question.correctAnswer),
      `${question.id} correct answer must appear in options`
    );
    assert.ok(question.category.trim().length > 0, question.id);
    assert.ok(isQuestionTopic(question.category), question.id);
    assert.ok(question.explanation?.trim(), `${question.id} needs explanation`);
    assert.ok(question.tip?.trim(), `${question.id} needs tip`);
  });
});

test("SERU questions are original active starter content with valid topics", () => {
  assert.ok(
    seruQuestionBank.length >= 20 && seruQuestionBank.length <= 30,
    "Stage 39.5 should add a starter SERU question bank without overbuilding"
  );

  seruQuestionBank.forEach((question) => {
    assert.equal(question.type, "knowledge", question.id);
    assert.equal(question.questionFamily, "seru", question.id);
    assert.ok(question.id.startsWith("seru-"), question.id);
    assert.ok(question.prompt.trim().length > 0, question.id);
    assert.ok(question.options.length >= 2, question.id);
    assertUniqueIds(
      `SERU options for ${question.id}`,
      question.options.map((option) => option.trim())
    );
    assert.ok(
      question.options.includes(question.correctAnswer),
      `${question.id} correct answer must appear in options`
    );
    assert.ok(isSeruQuestionTopic(question.category), question.id);
    assert.ok(question.isActive, question.id);
    assert.ok(question.explanation?.trim(), `${question.id} needs explanation`);
    assert.ok(question.tip?.trim(), `${question.id} needs tip`);
    assert.match(
      question.sourceNote ?? "",
      /Original SERU-style private hire learning content/
    );
  });

  assert.ok(
    SERU_QUESTION_TOPICS.every((topic) =>
      seruQuestionBank.some((question) => question.category === topic)
    ),
    "SERU starter bank should cover every SERU topic"
  );
});

test("map-click questions have valid coordinates, tolerances, explanations, and tips", () => {
  assert.ok(
    demoMapClickQuestions.length >= 30,
    "Stage 23 should keep the map-click bank meaningfully expanded"
  );

  demoMapClickQuestions.forEach((question) => {
    assert.equal(question.type, "map-click", question.id);
    assert.ok(question.prompt.trim().length > 0, question.id);
    assert.ok(question.targetName.trim().length > 0, question.id);
    assert.ok(isValidLatitude(question.answer.lat), `${question.id} latitude`);
    assert.ok(isValidLongitude(question.answer.lng), `${question.id} longitude`);
    assert.ok(question.toleranceMeters > 0, `${question.id} tolerance`);
    assert.ok(question.category.trim().length > 0, question.id);
    assert.ok(isQuestionTopic(question.category), question.id);
    assert.ok(question.explanation?.trim(), `${question.id} needs explanation`);
    assert.ok(question.tip?.trim(), `${question.id} needs tip`);
    assert.ok(
      question.acceptedAreaDescription?.trim(),
      `${question.id} needs accepted area description`
    );
  });
});

test("route questions have valid endpoints, stored geometry, explanations, and tips", () => {
  assert.ok(
    routeQuestions.length >= 10,
    "Stage 23 should keep the route bank expanded from the original prototype set"
  );

  routeQuestions.forEach((question) => {
    assert.ok(question.id.trim().length > 0, question.id);
    assert.ok(question.title.trim().length > 0, question.id);
    assert.ok(question.prompt.trim().length > 0, question.id);
    assert.ok(question.fromLabel.trim().length > 0, question.id);
    assert.ok(question.toLabel.trim().length > 0, question.id);
    assert.ok(isValidLatitude(question.from.lat), `${question.id} from lat`);
    assert.ok(isValidLongitude(question.from.lng), `${question.id} from lng`);
    assert.ok(isValidLatitude(question.to.lat), `${question.id} to lat`);
    assert.ok(isValidLongitude(question.to.lng), `${question.id} to lng`);
    assert.ok(
      question.acceptedRoute?.geometry.length &&
        question.acceptedRoute.geometry.length > 1,
      `${question.id} needs accepted route geometry`
    );
    assert.ok(question.explanation?.trim(), `${question.id} needs explanation`);
    assert.ok(question.tip?.trim(), `${question.id} needs tip`);
    assert.ok(question.idealRouteDescription?.trim(), question.id);
    assert.ok(isQuestionTopic(question.tags[0]), question.id);
  });
});

test("static question banks use the Stage 36 topic structure", () => {
  const staticTopics = new Set([
    ...knowledgeQuestionBank.map((question) => question.category),
    ...demoMapClickQuestions.map((question) => question.category),
    ...routeQuestions.map((question) => question.tags[0])
  ]);

  assert.ok(staticTopics.size >= 8);
  assert.ok(staticTopics.has("Route planning"));
  assert.ok(staticTopics.has("Stations and transport hubs"));
  assert.ok(staticTopics.has("Map interpretation"));
  for (const topic of staticTopics) {
    assert.ok(
      QUESTION_TOPICS.includes(topic as (typeof QUESTION_TOPICS)[number]),
      `Unexpected topic: ${topic}`
    );
  }
});

test("topographical knowledge and SERU knowledge banks stay separated", () => {
  assert.ok(
    knowledgeQuestionBank.every(
      (question) =>
        question.questionFamily !== "seru" &&
        question.id.startsWith("knowledge-") &&
        isQuestionTopic(question.category)
    )
  );
  assert.ok(
    seruQuestionBank.every(
      (question) =>
        question.questionFamily === "seru" &&
        question.id.startsWith("seru-") &&
        isSeruQuestionTopic(question.category)
    )
  );
});

test("mock exam selection still works with expanded banks", () => {
  const questions = selectMockExamQuestions(
    DEFAULT_MOCK_EXAM_CONFIG,
    () => 0.42
  );
  const expectedTotal =
    DEFAULT_MOCK_EXAM_CONFIG.questionCounts.knowledge +
    DEFAULT_MOCK_EXAM_CONFIG.questionCounts["map-click"] +
    DEFAULT_MOCK_EXAM_CONFIG.questionCounts["route-drawing"];

  assert.equal(questions.length, expectedTotal);
  assert.equal(
    questions.filter((question) => question.type === "knowledge").length,
    DEFAULT_MOCK_EXAM_CONFIG.questionCounts.knowledge
  );
  assert.equal(
    questions.filter((question) => question.type === "map-click").length,
    DEFAULT_MOCK_EXAM_CONFIG.questionCounts["map-click"]
  );
  assert.equal(
    questions.filter((question) => question.type === "route-drawing").length,
    DEFAULT_MOCK_EXAM_CONFIG.questionCounts["route-drawing"]
  );
  assert.ok(
    questions.every((question) => !question.id.startsWith("seru-")),
    "Topographical mock exam selection must not include SERU questions"
  );
  assert.ok(getActiveRouteQuestions().length >= 10);
});
