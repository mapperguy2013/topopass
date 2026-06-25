import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateMockExamResult,
  generateMockExamReview,
  saveMockExamAnswer,
  scoreMockExamQuestion,
  type MockExamAnswers
} from "./mockExamEngine.ts";
import {
  isMockQuestionFlagged,
  normalizeFlaggedQuestionIds,
  toggleMockQuestionFlag
} from "./mockExamFlags.ts";
import { calculateMockScoreRingSummary } from "./mockExamScoreSummary.ts";
import type {
  KnowledgeMockQuestion,
  MapClickMockQuestion,
  MockExamQuestion,
  RouteDrawingMockQuestion
} from "./mockTestQuestions.ts";

const knowledgeQuestion: KnowledgeMockQuestion = {
  id: "knowledge-test",
  type: "knowledge",
  prompt: "Which direction is opposite north?",
  options: ["South", "East"],
  correctAnswer: "South",
  category: "Directions",
  difficulty: "easy",
  explanation: "South is opposite north.",
  tip: "Practise cardinal opposites.",
  maxScore: 100
};

const mapQuestion: MapClickMockQuestion = {
  id: "map-test",
  type: "map-click",
  prompt: "Click the target.",
  target: { lat: 51.5, lng: -0.12 },
  toleranceMeters: 120,
  initialCenter: { lat: 51.5, lng: -0.12 },
  initialZoom: 15,
  category: "Location knowledge",
  difficulty: "medium",
  explanation: "The target is the mapped location.",
  tip: "Use nearby road names to orientate.",
  acceptedAreaDescription: "Within the target entrance area.",
  maxScore: 100
};

const acceptedGeometry: [number, number][] = [
  [0, 0],
  [10, 0],
  [20, 0],
  [30, 0],
  [40, 0],
  [50, 0]
];

const routeQuestion: RouteDrawingMockQuestion = {
  id: "route-test",
  type: "route-drawing",
  prompt: "Draw the test route.",
  category: "Route planning",
  difficulty: "medium",
  maxScore: 100,
  routeQuestion: {
    id: "route-source-test",
    title: "Test route",
    prompt: "Draw the test route.",
    fromLabel: "Start",
    toLabel: "End",
    from: { lat: 51.5, lng: -0.12 },
    to: { lat: 51.51, lng: -0.13 },
    acceptedRoute: {
      geometry: acceptedGeometry,
      source: "manual",
      coordinateSystem: "map",
      reviewed: true
    },
    mapArea: "test-map",
    mapBounds: { minX: 0, minY: -10, maxX: 50, maxY: 10 },
    difficulty: "medium",
    status: "active",
    tags: ["test"],
    explanation: "Test feedback",
    tip: "Use the direct route.",
    idealRouteDescription: "Follow the accepted straight-line test route.",
    createdAt: "2026-06-23T00:00:00.000Z",
    updatedAt: "2026-06-23T00:00:00.000Z"
  }
};

test("answer storage preserves previous answers without mutating input", () => {
  const initial: MockExamAnswers = {};
  const first = saveMockExamAnswer(initial, knowledgeQuestion.id, {
    type: "knowledge",
    selectedAnswer: "South"
  });
  const second = saveMockExamAnswer(first, mapQuestion.id, {
    type: "map-click",
    coordinates: { latitude: 51.5, longitude: -0.12 }
  });

  assert.deepEqual(initial, {});
  assert.equal(first[knowledgeQuestion.id].type, "knowledge");
  assert.equal(Object.keys(second).length, 2);
});

test("knowledge scoring uses exact answer matching", () => {
  const correct = scoreMockExamQuestion(knowledgeQuestion, {
    type: "knowledge",
    selectedAnswer: "South"
  });
  const incorrect = scoreMockExamQuestion(knowledgeQuestion, {
    type: "knowledge",
    selectedAnswer: "East"
  });

  assert.equal(correct.passed, true);
  assert.equal(correct.score, 100);
  assert.equal(correct.details.type, "knowledge");
  assert.equal(correct.details.explanation, "South is opposite north.");
  assert.equal(correct.details.tip, "Practise cardinal opposites.");
  assert.equal(incorrect.passed, false);
  assert.equal(incorrect.score, 0);
});

test("map-click scoring uses target distance and tolerance", () => {
  const correct = scoreMockExamQuestion(mapQuestion, {
    type: "map-click",
    coordinates: { latitude: 51.5, longitude: -0.12 }
  });
  const incorrect = scoreMockExamQuestion(mapQuestion, {
    type: "map-click",
    coordinates: { latitude: 51.52, longitude: -0.12 }
  });

  assert.equal(correct.passed, true);
  assert.equal(correct.details.type, "map-click");
  assert.equal(correct.details.explanation, "The target is the mapped location.");
  assert.equal(correct.details.tip, "Use nearby road names to orientate.");
  assert.equal(correct.details.acceptedAreaDescription, "Within the target entrance area.");
  assert.equal(incorrect.passed, false);
});

test("route-drawing scoring delegates to the hardened route scorer", () => {
  const result = scoreMockExamQuestion(routeQuestion, {
    type: "route-drawing",
    routePoints: acceptedGeometry.map(([x, y]) => ({ x, y }))
  });

  assert.equal(result.passed, true);
  assert.equal(result.details.type, "route-drawing");
  assert.equal(result.details.routeScore?.lengthRatio, 1);
  assert.equal(result.details.explanation, "Test feedback");
  assert.equal(result.details.tip, "Use the direct route.");
  assert.equal(
    result.details.idealRouteDescription,
    "Follow the accepted straight-line test route."
  );
});

test("mixed final result calculates totals and per-type breakdown", () => {
  const questions: MockExamQuestion[] = [
    knowledgeQuestion,
    mapQuestion,
    routeQuestion
  ];
  const answers: MockExamAnswers = {
    [knowledgeQuestion.id]: {
      type: "knowledge",
      selectedAnswer: "South"
    },
    [mapQuestion.id]: {
      type: "map-click",
      coordinates: { latitude: 51.5, longitude: -0.12 }
    },
    [routeQuestion.id]: {
      type: "route-drawing",
      routePoints: acceptedGeometry.map(([x, y]) => ({ x, y }))
    }
  };
  const result = calculateMockExamResult(questions, answers, 70, [
    mapQuestion.id
  ]);

  assert.equal(result.totalQuestions, 3);
  assert.equal(result.answeredQuestions, 3);
  assert.equal(result.passedQuestions, 3);
  assert.equal(result.flaggedQuestions, 1);
  assert.deepEqual(result.flaggedQuestionIds, [mapQuestion.id]);
  assert.equal(result.questionResults[1].flagged, true);
  assert.equal(result.percentage, 100);
  assert.equal(result.passed, true);
  assert.equal(result.breakdown.knowledge.passed, 1);
  assert.equal(result.breakdown["map-click"].passed, 1);
  assert.equal(result.breakdown["route-drawing"].passed, 1);
});

test("final result reports answered and unanswered counts", () => {
  const questions: MockExamQuestion[] = [knowledgeQuestion, mapQuestion];
  const result = calculateMockExamResult(questions, {
    [knowledgeQuestion.id]: {
      type: "knowledge",
      selectedAnswer: "South"
    }
  });

  assert.equal(result.answeredQuestions, 1);
  assert.equal(result.totalQuestions - result.answeredQuestions, 1);
});

test("mock question flags toggle and normalize safely", () => {
  const flagged = toggleMockQuestionFlag([], knowledgeQuestion.id);
  const unflagged = toggleMockQuestionFlag(flagged, knowledgeQuestion.id);

  assert.equal(isMockQuestionFlagged(flagged, knowledgeQuestion.id), true);
  assert.deepEqual(unflagged, []);
  assert.deepEqual(
    normalizeFlaggedQuestionIds(
      [knowledgeQuestion.id, knowledgeQuestion.id, "unknown", 123],
      [knowledgeQuestion.id]
    ),
    [knowledgeQuestion.id]
  );
});

test("score ring summary calculates correct, wrong, percentage, and zero case", () => {
  const result = calculateMockExamResult(
    [knowledgeQuestion, mapQuestion],
    {
      [knowledgeQuestion.id]: {
        type: "knowledge",
        selectedAnswer: "South"
      }
    },
    70
  );
  const summary = calculateMockScoreRingSummary(result);
  const zeroSummary = calculateMockScoreRingSummary(
    calculateMockExamResult([], {}, 70)
  );

  assert.equal(summary.correct, 1);
  assert.equal(summary.wrong, 1);
  assert.equal(summary.percentage, 50);
  assert.equal(summary.resultLabel, "Below pass mark");
  assert.equal(zeroSummary.correct, 0);
  assert.equal(zeroSummary.wrong, 0);
  assert.equal(zeroSummary.percentage, 0);
});

test("map-click review data carries user point and correct point", () => {
  const reviewData = {
    questionId: mapQuestion.id,
    prompt: mapQuestion.prompt,
    userCoordinates: { lat: 51.49, lng: -0.11 },
    correctCoordinates: mapQuestion.target,
    distanceMeters: 400,
    score: 0,
    isCorrect: false
  };
  const result = scoreMockExamQuestion(mapQuestion, {
    type: "map-click",
    coordinates: { latitude: 51.49, longitude: -0.11 },
    reviewData
  });

  assert.equal(result.details.type, "map-click");
  assert.deepEqual(result.details.reviewData?.userCoordinates, {
    lat: 51.49,
    lng: -0.11
  });
  assert.deepEqual(result.details.reviewData?.correctCoordinates, mapQuestion.target);
});

test("route review data carries user route and accepted route", () => {
  const userRoutePoints = acceptedGeometry.map(([x, y]) => ({ x, y }));
  const reviewData = {
    questionId: routeQuestion.routeQuestion.id,
    userRouteMapPoints: userRoutePoints,
    referenceRouteMapPoints: userRoutePoints
  };
  const result = scoreMockExamQuestion(routeQuestion, {
    type: "route-drawing",
    routePoints: userRoutePoints,
    reviewData
  });

  assert.equal(result.details.type, "route-drawing");
  assert.equal(result.details.reviewData?.userRouteMapPoints?.length, 6);
  assert.equal(result.details.reviewData?.referenceRouteMapPoints?.length, 6);
});

test("review generation includes unanswered and accepted-answer summaries", () => {
  const review = generateMockExamReview(
    [knowledgeQuestion, mapQuestion],
    {
      [knowledgeQuestion.id]: {
        type: "knowledge",
        selectedAnswer: "East"
      }
    }
  );

  assert.equal(review.length, 2);
  assert.equal(review[0].userAnswerSummary, "East");
  assert.equal(review[0].acceptedAnswerSummary, "South");
  assert.equal(review[1].answered, false);
  assert.equal(review[1].userAnswerSummary, "Not answered");
});
