import { knowledgeQuestionBank } from "./knowledgeQuestions.ts";
import { demoMapClickQuestions } from "./mapClickQuestions.ts";
import { DEFAULT_MOCK_EXAM_CONFIG, type MockExamConfig } from "./mockExamConfig.ts";
import { EXAM_MAP_ZOOM_LIMITS } from "./topographicalAtlasStyle.ts";
import {
  getActiveRouteQuestions,
  type RouteQuestion,
  type RouteQuestionDifficulty
} from "../src/data/routeQuestions.ts";

export type MockQuestionType = "knowledge" | "map-click" | "route-drawing";

type MockQuestionBase = {
  id: string;
  type: MockQuestionType;
  prompt: string;
  difficulty?: RouteQuestionDifficulty;
  category?: string;
  sourceNote?: string;
  maxScore: number;
};

export type KnowledgeMockQuestion = MockQuestionBase & {
  type: "knowledge";
  options: string[];
  correctAnswer: string;
};

export type MapClickMockQuestion = MockQuestionBase & {
  type: "map-click";
  target: { lat: number; lng: number };
  toleranceMeters: number;
  initialCenter: { lat: number; lng: number };
  initialZoom: number;
};

export type RouteDrawingMockQuestion = MockQuestionBase & {
  type: "route-drawing";
  routeQuestion: RouteQuestion;
};

export type MockExamQuestion =
  | KnowledgeMockQuestion
  | MapClickMockQuestion
  | RouteDrawingMockQuestion;

export const knowledgeMockQuestionBank: KnowledgeMockQuestion[] =
  knowledgeQuestionBank.filter((question) => question.isActive).map((question) => ({
    ...question,
    maxScore: 100
  }));

export const mapClickMockQuestionBank: MapClickMockQuestion[] =
  demoMapClickQuestions.filter((question) => question.isActive).map((question) => ({
    id: `mock-${question.id}`,
    type: "map-click",
    prompt: question.prompt,
    difficulty: question.difficulty,
    category: question.category,
    sourceNote: question.sourceNote,
    target: question.answer,
    toleranceMeters: question.toleranceMeters,
    initialCenter: question.answer,
    initialZoom: EXAM_MAP_ZOOM_LIMITS.defaultZoom,
    maxScore: 100
  }));

export const routeDrawingMockQuestionBank: RouteDrawingMockQuestion[] =
  getActiveRouteQuestions().map((routeQuestion) => ({
    id: `mock-route-${routeQuestion.id}`,
    type: "route-drawing",
    prompt: routeQuestion.prompt,
    difficulty: routeQuestion.difficulty,
    category: "Route planning",
    sourceNote: `Active route bank question: ${routeQuestion.id}`,
    routeQuestion,
    maxScore: 100
  }));

export const mockQuestionBank: MockExamQuestion[] = [
  ...knowledgeMockQuestionBank,
  ...mapClickMockQuestionBank,
  ...routeDrawingMockQuestionBank
];

function shuffled<T>(items: T[], random: () => number) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function selectFromBank<T>(
  bank: T[],
  count: number,
  type: MockQuestionType,
  random: () => number
) {
  if (count > bank.length) {
    throw new Error(
      `Mock exam requests ${count} ${type} questions, but only ${bank.length} are available.`
    );
  }

  return shuffled(bank, random).slice(0, count);
}

export function selectMockExamQuestions(
  config: MockExamConfig = DEFAULT_MOCK_EXAM_CONFIG,
  random: () => number = Math.random
) {
  const selected: MockExamQuestion[] = [
    ...selectFromBank(
      knowledgeMockQuestionBank,
      config.questionCounts.knowledge,
      "knowledge",
      random
    ),
    ...selectFromBank(
      mapClickMockQuestionBank,
      config.questionCounts["map-click"],
      "map-click",
      random
    ),
    ...selectFromBank(
      routeDrawingMockQuestionBank,
      config.questionCounts["route-drawing"],
      "route-drawing",
      random
    )
  ];

  return shuffled(selected, random);
}

export function getMockExamQuestionsById(ids: string[]) {
  const questionsById = new Map(
    mockQuestionBank.map((question) => [question.id, question])
  );

  return ids
    .map((id) => questionsById.get(id))
    .filter((question): question is MockExamQuestion => Boolean(question));
}
