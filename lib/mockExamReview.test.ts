import assert from "node:assert/strict";
import { test } from "node:test";
import type { MockExamResult } from "./mockExamEngine.ts";
import type { KnowledgeMockQuestion, MapClickMockQuestion } from "./mockTestQuestions.ts";
import {
  formatMockExamReviewItems,
  getMockExamNextStep,
  getMockExamTopicBreakdown
} from "./mockExamReview.ts";

const knowledgeQuestion: KnowledgeMockQuestion = {
  id: "knowledge-1",
  type: "knowledge",
  prompt: "Which way is south?",
  options: ["North", "South"],
  correctAnswer: "South",
  difficulty: "easy",
  category: "Direction sense",
  explanation: "South is opposite north.",
  maxScore: 100
};

const mapQuestion: MapClickMockQuestion = {
  id: "map-1",
  type: "map-click",
  prompt: "Click a station.",
  target: { lat: 51.5, lng: -0.1 },
  toleranceMeters: 100,
  initialCenter: { lat: 51.5, lng: -0.1 },
  initialZoom: 14,
  difficulty: "medium",
  category: "Stations and transport hubs",
  explanation: "The target is the station.",
  maxScore: 100
};

const result: MockExamResult = {
  totalQuestions: 2,
  answeredQuestions: 2,
  passedQuestions: 1,
  flaggedQuestionIds: [mapQuestion.id],
  flaggedQuestions: 1,
  score: 100,
  maxScore: 200,
  percentage: 50,
  passPercentage: 70,
  passed: false,
  breakdown: {
    knowledge: {
      type: "knowledge",
      total: 1,
      answered: 1,
      passed: 1,
      score: 100,
      maxScore: 100,
      percentage: 100
    },
    "map-click": {
      type: "map-click",
      total: 1,
      answered: 1,
      passed: 0,
      score: 0,
      maxScore: 100,
      percentage: 0
    },
    "route-drawing": {
      type: "route-drawing",
      total: 0,
      answered: 0,
      passed: 0,
      score: 0,
      maxScore: 0,
      percentage: 0
    }
  },
  questionResults: [
    {
      questionId: knowledgeQuestion.id,
      type: "knowledge",
      answered: true,
      flagged: false,
      passed: true,
      score: 100,
      maxScore: 100,
      percentage: 100,
      userAnswerSummary: "South",
      acceptedAnswerSummary: "South",
      details: {
        type: "knowledge",
        selectedAnswer: "South",
        correctAnswer: "South",
        explanation: "South is opposite north."
      }
    },
    {
      questionId: mapQuestion.id,
      type: "map-click",
      answered: true,
      flagged: true,
      passed: false,
      score: 0,
      maxScore: 100,
      percentage: 0,
      userAnswerSummary: "Clicked location",
      acceptedAnswerSummary: "Accepted target",
      details: {
        type: "map-click",
        clickedCoordinates: { latitude: 51.49, longitude: -0.11 },
        target: mapQuestion.target,
        distanceMeters: 400,
        toleranceMeters: 100,
        explanation: "The target is the station."
      }
    }
  ]
};

test("mock exam topic breakdown groups results by question topic", () => {
  const breakdown = getMockExamTopicBreakdown(
    [knowledgeQuestion, mapQuestion],
    result
  );

  assert.deepEqual(
    breakdown.map((topic) => [topic.topic, topic.percentage]),
    [
      ["Stations and transport hubs", 0],
      ["Direction sense", 100]
    ]
  );
});

test("mock exam next step uses pass/fail and weakest topic", () => {
  const breakdown = getMockExamTopicBreakdown(
    [knowledgeQuestion, mapQuestion],
    result
  );

  assert.match(getMockExamNextStep(result, breakdown), /Stations and transport hubs/);
  assert.match(
    getMockExamNextStep({ ...result, passed: true, percentage: 80 }, breakdown),
    /passed overall/
  );
});

test("mock exam review formatting includes learner answer, accepted answer, topic, and difficulty", () => {
  const items = formatMockExamReviewItems([knowledgeQuestion, mapQuestion], result);

  assert.equal(items.length, 2);
  assert.equal(items[0].topic, "Direction sense");
  assert.equal(items[0].difficulty, "easy");
  assert.equal(items[0].learnerAnswer, "South");
  assert.equal(items[0].acceptedAnswer, "South");
  assert.equal(items[1].passed, false);
  assert.equal(items[1].flagged, true);
  assert.equal(items[1].explanation, "The target is the station.");
});
