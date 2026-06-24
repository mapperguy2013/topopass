import assert from "node:assert/strict";
import test from "node:test";
import { knowledgeQuestionBank } from "../knowledgeQuestions.ts";
import { demoMapClickQuestions } from "../mapClickQuestions.ts";
import { getRouteQuestions } from "../../src/data/routeQuestions.ts";
import {
  validateAllQuestionBanks,
  validateKnowledgeQuestion,
  validateMapClickQuestion,
  validateRouteQuestion
} from "./questionValidation.ts";

test("knowledge validation catches missing text and bad options", () => {
  const question = {
    ...knowledgeQuestionBank[0],
    prompt: "",
    options: ["Same", "Same"],
    correctAnswer: "Missing"
  };
  const validation = validateKnowledgeQuestion(question);

  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((entry) => entry.field === "prompt"));
  assert.ok(validation.issues.some((entry) => entry.message.includes("duplicates")));
  assert.ok(validation.issues.some((entry) => entry.field === "correctAnswer"));
});

test("map-click validation catches invalid coordinates and small radius", () => {
  const validation = validateMapClickQuestion({
    ...demoMapClickQuestions[0],
    answer: { lat: 100, lng: -200 },
    toleranceMeters: 5
  });

  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((entry) => entry.field === "answer.lat"));
  assert.ok(validation.issues.some((entry) => entry.field === "answer.lng"));
  assert.ok(validation.issues.some((entry) => entry.field === "toleranceMeters"));
});

test("route validation catches accepted paths with too few points", () => {
  const source = getRouteQuestions()[0];
  const validation = validateRouteQuestion({
    ...source,
    acceptedRoute: source.acceptedRoute
      ? { ...source.acceptedRoute, geometry: [[0, 0], [1, 1]] }
      : undefined
  });

  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((entry) => entry.message.includes("at least three points")));
});

test("duplicate IDs are detected across banks", () => {
  const duplicatedMapQuestion = {
    ...demoMapClickQuestions[0],
    id: knowledgeQuestionBank[0].id
  };
  const validation = validateAllQuestionBanks([
    knowledgeQuestionBank[0],
    duplicatedMapQuestion
  ]);

  assert.equal(validation.valid, false);
  assert.equal(
    validation.issues.filter((entry) => entry.field === "id").length,
    2
  );
});

test("current static question banks validate without hard errors", () => {
  const validation = validateAllQuestionBanks();
  assert.equal(validation.valid, true);
});

test("explanations and tips are optional but whitespace-only values warn", () => {
  const withoutExplanation = validateKnowledgeQuestion({
    ...knowledgeQuestionBank[0],
    explanation: undefined,
    tip: undefined
  });
  const whitespaceTip = validateKnowledgeQuestion({
    ...knowledgeQuestionBank[0],
    tip: "   "
  });

  assert.equal(withoutExplanation.valid, true);
  assert.equal(withoutExplanation.issues.some((entry) => entry.field === "explanation"), false);
  assert.equal(whitespaceTip.valid, true);
  assert.ok(whitespaceTip.issues.some((entry) => entry.field === "tip"));
});
