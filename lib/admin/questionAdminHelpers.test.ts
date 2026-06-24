import assert from "node:assert/strict";
import test from "node:test";
import {
  getAllQuestions,
  getQuestionById,
  getQuestionsByType,
  isQuestionActive
} from "./questionAdminHelpers.ts";
import { seruQuestionBank } from "../seruQuestions.ts";

test("admin helpers return all supported question types", () => {
  const questions = getAllQuestions();
  assert.ok(questions.length > 0);
  assert.ok(getQuestionsByType("knowledge").length > 0);
  assert.ok(getQuestionsByType("map-click").length > 0);
  assert.ok(getQuestionsByType("route").length > 0);
});

test("admin helpers include SERU questions in the knowledge inventory", () => {
  const seruIds = new Set(seruQuestionBank.map((question) => question.id));
  const knowledgeIds = new Set(
    getQuestionsByType("knowledge").map((question) => question.id)
  );

  assert.ok(seruQuestionBank.length >= 20);
  assert.ok([...seruIds].every((id) => knowledgeIds.has(id)));
});

test("admin lookup returns a stable question by ID", () => {
  const question = getAllQuestions()[0];
  assert.equal(getQuestionById(question.id)?.id, question.id);
});

test("active helper adapts route status and shared isActive metadata", () => {
  const activeQuestions = getAllQuestions().filter(isQuestionActive);
  assert.ok(activeQuestions.length > 0);
  assert.ok(activeQuestions.length <= getAllQuestions().length);
});
