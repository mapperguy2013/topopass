import { distanceInMetres } from "./distance.ts";
import { scoreDrawnRoute, type RouteScoreResult } from "./routeScoring.ts";
import type { Coordinates } from "./distance.ts";
import type {
  MockExamQuestion,
  MockQuestionType
} from "./mockTestQuestions.ts";
import type { RouteMapPoint } from "../src/data/maps/routeTypes.ts";

export type KnowledgeMockAnswer = {
  type: "knowledge";
  selectedAnswer: string;
};

export type MapClickMockAnswer = {
  type: "map-click";
  coordinates: Coordinates;
};

export type RouteDrawingMockAnswer = {
  type: "route-drawing";
  routePoints: RouteMapPoint[];
};

export type MockExamAnswer =
  | KnowledgeMockAnswer
  | MapClickMockAnswer
  | RouteDrawingMockAnswer;

export type MockExamAnswers = Record<string, MockExamAnswer>;

export type KnowledgeScoreDetails = {
  type: "knowledge";
  selectedAnswer: string | null;
  correctAnswer: string;
};

export type MapClickScoreDetails = {
  type: "map-click";
  clickedCoordinates: Coordinates | null;
  target: { lat: number; lng: number };
  distanceMeters: number;
  toleranceMeters: number;
};

export type RouteDrawingScoreDetails = {
  type: "route-drawing";
  routePointCount: number;
  routeScore: RouteScoreResult | null;
};

export type MockQuestionScoreResult = {
  questionId: string;
  type: MockQuestionType;
  answered: boolean;
  passed: boolean;
  score: number;
  maxScore: number;
  percentage: number;
  userAnswerSummary: string;
  acceptedAnswerSummary: string;
  details:
    | KnowledgeScoreDetails
    | MapClickScoreDetails
    | RouteDrawingScoreDetails;
};

export type MockTypeBreakdown = {
  type: MockQuestionType;
  total: number;
  answered: number;
  passed: number;
  score: number;
  maxScore: number;
  percentage: number;
};

export type MockExamResult = {
  totalQuestions: number;
  answeredQuestions: number;
  passedQuestions: number;
  score: number;
  maxScore: number;
  percentage: number;
  passPercentage: number;
  passed: boolean;
  breakdown: Record<MockQuestionType, MockTypeBreakdown>;
  questionResults: MockQuestionScoreResult[];
};

export function saveMockExamAnswer(
  answers: MockExamAnswers,
  questionId: string,
  answer: MockExamAnswer
) {
  return { ...answers, [questionId]: answer };
}

export function removeMockExamAnswer(
  answers: MockExamAnswers,
  questionId: string
) {
  const nextAnswers = { ...answers };
  delete nextAnswers[questionId];
  return nextAnswers;
}

function unansweredResult(
  question: MockExamQuestion,
  acceptedAnswerSummary: string,
  details: MockQuestionScoreResult["details"]
): MockQuestionScoreResult {
  return {
    questionId: question.id,
    type: question.type,
    answered: false,
    passed: false,
    score: 0,
    maxScore: question.maxScore,
    percentage: 0,
    userAnswerSummary: "Not answered",
    acceptedAnswerSummary,
    details
  };
}

export function scoreMockExamQuestion(
  question: MockExamQuestion,
  answer?: MockExamAnswer
): MockQuestionScoreResult {
  if (question.type === "knowledge") {
    const acceptedSummary = question.correctAnswer;
    if (!answer || answer.type !== "knowledge") {
      return unansweredResult(question, acceptedSummary, {
        type: "knowledge",
        selectedAnswer: null,
        correctAnswer: question.correctAnswer
      });
    }

    const passed = answer.selectedAnswer === question.correctAnswer;
    return {
      questionId: question.id,
      type: question.type,
      answered: true,
      passed,
      score: passed ? question.maxScore : 0,
      maxScore: question.maxScore,
      percentage: passed ? 100 : 0,
      userAnswerSummary: answer.selectedAnswer,
      acceptedAnswerSummary: acceptedSummary,
      details: {
        type: "knowledge",
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.correctAnswer
      }
    };
  }

  if (question.type === "map-click") {
    const acceptedSummary = `${question.target.lat.toFixed(5)}, ${question.target.lng.toFixed(5)} within ${question.toleranceMeters}m`;
    if (!answer || answer.type !== "map-click") {
      return unansweredResult(question, acceptedSummary, {
        type: "map-click",
        clickedCoordinates: null,
        target: question.target,
        distanceMeters: Number.POSITIVE_INFINITY,
        toleranceMeters: question.toleranceMeters
      });
    }

    const distanceMeters = distanceInMetres(answer.coordinates, {
      latitude: question.target.lat,
      longitude: question.target.lng
    });
    const passed = distanceMeters <= question.toleranceMeters;
    return {
      questionId: question.id,
      type: question.type,
      answered: true,
      passed,
      score: passed ? question.maxScore : 0,
      maxScore: question.maxScore,
      percentage: passed ? 100 : 0,
      userAnswerSummary: `${answer.coordinates.latitude.toFixed(6)}, ${answer.coordinates.longitude.toFixed(6)}`,
      acceptedAnswerSummary: acceptedSummary,
      details: {
        type: "map-click",
        clickedCoordinates: answer.coordinates,
        target: question.target,
        distanceMeters: Math.round(distanceMeters * 10) / 10,
        toleranceMeters: question.toleranceMeters
      }
    };
  }

  const acceptedGeometry = question.routeQuestion.acceptedRoute?.geometry ?? [];
  const acceptedPoints = acceptedGeometry.map(([x, y]) => ({ x, y }));
  const acceptedSummary = `${question.routeQuestion.fromLabel} to ${question.routeQuestion.toLabel}`;
  if (!answer || answer.type !== "route-drawing") {
    return unansweredResult(question, acceptedSummary, {
      type: "route-drawing",
      routePointCount: 0,
      routeScore: null
    });
  }

  const routeScore = scoreDrawnRoute(answer.routePoints, acceptedPoints, {
    bounds: question.routeQuestion.mapBounds
  });
  const score = Math.round(
    (routeScore.percentage / 100) * question.maxScore
  );

  return {
    questionId: question.id,
    type: question.type,
    answered: true,
    passed: routeScore.passed,
    score,
    maxScore: question.maxScore,
    percentage: routeScore.percentage,
    userAnswerSummary: `${answer.routePoints.length} route points captured`,
    acceptedAnswerSummary: acceptedSummary,
    details: {
      type: "route-drawing",
      routePointCount: answer.routePoints.length,
      routeScore
    }
  };
}

export function generateMockExamReview(
  questions: MockExamQuestion[],
  answers: MockExamAnswers
) {
  return questions.map((question) =>
    scoreMockExamQuestion(question, answers[question.id])
  );
}

function emptyBreakdown(type: MockQuestionType): MockTypeBreakdown {
  return {
    type,
    total: 0,
    answered: 0,
    passed: 0,
    score: 0,
    maxScore: 0,
    percentage: 0
  };
}

export function calculateMockExamResult(
  questions: MockExamQuestion[],
  answers: MockExamAnswers,
  passPercentage = 70
): MockExamResult {
  const questionResults = generateMockExamReview(questions, answers);
  const breakdown: Record<MockQuestionType, MockTypeBreakdown> = {
    knowledge: emptyBreakdown("knowledge"),
    "map-click": emptyBreakdown("map-click"),
    "route-drawing": emptyBreakdown("route-drawing")
  };

  questionResults.forEach((result) => {
    const typeResult = breakdown[result.type];
    typeResult.total += 1;
    typeResult.answered += result.answered ? 1 : 0;
    typeResult.passed += result.passed ? 1 : 0;
    typeResult.score += result.score;
    typeResult.maxScore += result.maxScore;
  });

  Object.values(breakdown).forEach((typeResult) => {
    typeResult.percentage =
      typeResult.maxScore === 0
        ? 0
        : Math.round((typeResult.score / typeResult.maxScore) * 100);
  });

  const score = questionResults.reduce(
    (total, result) => total + result.score,
    0
  );
  const maxScore = questionResults.reduce(
    (total, result) => total + result.maxScore,
    0
  );
  const percentage =
    maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);

  return {
    totalQuestions: questions.length,
    answeredQuestions: questionResults.filter((result) => result.answered)
      .length,
    passedQuestions: questionResults.filter((result) => result.passed).length,
    score,
    maxScore,
    percentage,
    passPercentage,
    passed: percentage >= passPercentage,
    breakdown,
    questionResults
  };
}
