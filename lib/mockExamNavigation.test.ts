import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateMockExamResult,
  type MockExamAnswers
} from "./mockExamEngine.ts";
import { validateMockExamQuestionForNext } from "./mockExamNavigation.ts";
import type { MockExamQuestion } from "./mockTestQuestions.ts";

const mapQuestion: MockExamQuestion = {
  id: "mock-map",
  type: "map-click",
  prompt: "Click King's Cross",
  target: { lat: 51.5308, lng: -0.1238 },
  toleranceMeters: 100,
  initialCenter: { lat: 51.5308, lng: -0.1238 },
  initialZoom: 14,
  maxScore: 100
};

const routeQuestion: MockExamQuestion = {
  id: "mock-route",
  type: "route-drawing",
  prompt: "Draw route",
  maxScore: 100,
  routeQuestion: {
    id: "route",
    title: "Route",
    prompt: "Draw route",
    fromLabel: "A",
    toLabel: "B",
    from: { lat: 51.5, lng: -0.13 },
    to: { lat: 51.51, lng: -0.12 },
    mapArea: "Test",
    mapBounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
    difficulty: "easy",
    status: "active",
    acceptedRoute: {
      geometry: [
        [10, 10],
        [50, 50],
        [90, 90]
      ],
      source: "stored",
      coordinateSystem: "map",
      reviewed: true
    },
    tags: ["Route planning"],
    createdAt: "2026-06-24T00:00:00.000Z",
    updatedAt: "2026-06-24T00:00:00.000Z"
  }
};

test("map-click exam question advances with Next after valid input", () => {
  const result = validateMockExamQuestionForNext(mapQuestion, {
    type: "map-click",
    coordinates: { latitude: 51.5308, longitude: -0.1238 }
  });

  assert.equal(result.canAdvance, true);
  assert.equal(result.message, null);
});

test("route-planning exam question advances with Next after valid input", () => {
  const result = validateMockExamQuestionForNext(routeQuestion, {
    type: "route-drawing",
    routePoints: [
      { x: 10, y: 10 },
      { x: 50, y: 50 },
      { x: 90, y: 90 }
    ]
  });

  assert.equal(result.canAdvance, true);
  assert.equal(result.message, null);
});

test("map-click exam question does not advance with Next without an answer", () => {
  const result = validateMockExamQuestionForNext(mapQuestion);

  assert.equal(result.canAdvance, false);
  assert.match(result.message ?? "", /Select a location/);
});

test("route-planning exam question does not advance with Next without a route", () => {
  const result = validateMockExamQuestionForNext(routeQuestion, {
    type: "route-drawing",
    routePoints: [{ x: 10, y: 10 }]
  });

  assert.equal(result.canAdvance, false);
  assert.match(result.message ?? "", /Draw a route/);
});

test("mock score remains correct when map and route answers are saved by Next flow", () => {
  const answers: MockExamAnswers = {
    "mock-map": {
      type: "map-click",
      coordinates: { latitude: 51.5308, longitude: -0.1238 }
    },
    "mock-route": {
      type: "route-drawing",
      routePoints: [
        { x: 10, y: 10 },
        { x: 50, y: 50 },
        { x: 90, y: 90 }
      ]
    }
  };
  const result = calculateMockExamResult([mapQuestion, routeQuestion], answers);
  const summedQuestionScore = result.questionResults.reduce(
    (total, questionResult) => total + questionResult.score,
    0
  );

  assert.equal(result.answeredQuestions, 2);
  assert.equal(result.questionResults.every((questionResult) => questionResult.answered), true);
  assert.equal(result.maxScore, 200);
  assert.equal(result.score, summedQuestionScore);
});
