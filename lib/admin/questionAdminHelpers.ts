import { knowledgeQuestionBank, type KnowledgeQuestionData } from "../knowledgeQuestions.ts";
import { demoMapClickQuestions, type MapClickQuestionData } from "../mapClickQuestions.ts";
import { getRouteQuestions, type RouteQuestion } from "../../src/data/routeQuestions.ts";

export type AdminQuestionType = "knowledge" | "map-click" | "route";

export type AdminRouteQuestion = RouteQuestion & { type: "route" };
export type AdminQuestion =
  | KnowledgeQuestionData
  | MapClickQuestionData
  | AdminRouteQuestion;

export function getAllQuestions(): AdminQuestion[] {
  return [
    ...knowledgeQuestionBank,
    ...demoMapClickQuestions,
    ...getRouteQuestions().map((question) => ({
      ...question,
      type: "route" as const
    }))
  ];
}

export function getQuestionsByType(type: AdminQuestionType) {
  return getAllQuestions().filter((question) => question.type === type);
}

export function getQuestionById(id: string) {
  return getAllQuestions().find((question) => question.id === id);
}

export function isQuestionActive(question: AdminQuestion) {
  return question.type === "route"
    ? question.status === "active"
    : question.isActive;
}

export function getQuestionPrompt(question: AdminQuestion) {
  return question.type === "route" ? question.title : question.prompt;
}

export function getQuestionExplanation(question: AdminQuestion) {
  return question.explanation;
}

export function getQuestionCategory(question: AdminQuestion) {
  return question.type === "route"
    ? question.tags[0] ?? "Route planning"
    : question.category;
}
