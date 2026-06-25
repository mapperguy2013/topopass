import { distanceInMetres } from "./distance.ts";
import { scoreDrawnRoute, type RouteScoreResult } from "./routeScoring.ts";
import type { Coordinates } from "./distance.ts";
import type { MapClickReviewData, RouteReviewData } from "./reviewData.ts";
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
  reviewData?: MapClickReviewData;
};

export type RouteDrawingMockAnswer = {
  type: "route-drawing";
  routePoints: RouteMapPoint[];
  reviewData?: RouteReviewData;
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
  explanation?: string;
  tip?: string;
};

export type MapClickScoreDetails = {
  type: "map-click";
  clickedCoordinates: Coordinates | null;
  target: { lat: number; lng: number };
  distanceMeters: number;
  toleranceMeters: number;
  reviewData?: MapClickReviewData;
  explanation?: string;
  tip?: string;
  acceptedAreaDescription?: string;
};

export type RouteDrawingScoreDetails = {
  type: "route-drawing";
  routePointCount: number;
  routeScore: RouteScoreResult | null;
  reviewData?: RouteReviewData;
  explanation?: string;
  tip?: string;
  idealRouteDescription?: string;
};

export type MockQuestionScoreResult = {
  questionId: string;
  type: MockQuestionType;
  answered: boolean;
  flagged: boolean;
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
  flaggedQuestionIds: string[];
  flaggedQuestions: number;
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
  details: MockQuestionScoreResult["details"],
  flagged = false
): MockQuestionScoreResult {
  return {
    questionId: question.id,
    type: question.type,
    answered: false,
    flagged,
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
  answer?: MockExamAnswer,
  flagged = false
): MockQuestionScoreResult {
  if (question.type === "knowledge") {
    const acceptedSummary = question.correctAnswer;
    if (!answer || answer.type !== "knowledge") {
      return unansweredResult(
        question,
        acceptedSummary,
        {
          type: "knowledge",
          selectedAnswer: null,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          tip: question.tip
        },
        flagged
      );
    }

    const passed = answer.selectedAnswer === question.correctAnswer;
    return {
      questionId: question.id,
      type: question.type,
      answered: true,
      flagged,
      passed,
      score: passed ? question.maxScore : 0,
      maxScore: question.maxScore,
      percentage: passed ? 100 : 0,
      userAnswerSummary: answer.selectedAnswer,
      acceptedAnswerSummary: acceptedSummary,
      details: {
        type: "knowledge",
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        tip: question.tip
      }
    };
  }

  if (question.type === "map-click") {
    const acceptedSummary = `${question.target.lat.toFixed(5)}, ${question.target.lng.toFixed(5)} within ${question.toleranceMeters}m`;
    if (!answer || answer.type !== "map-click") {
      return unansweredResult(
        question,
        acceptedSummary,
        {
          type: "map-click",
          clickedCoordinates: null,
          target: question.target,
          distanceMeters: Number.POSITIVE_INFINITY,
          toleranceMeters: question.toleranceMeters,
          explanation: question.explanation,
          tip: question.tip,
          acceptedAreaDescription: question.acceptedAreaDescription
        },
        flagged
      );
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
      flagged,
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
        toleranceMeters: question.toleranceMeters,
        reviewData: answer.reviewData,
        explanation: question.explanation,
        tip: question.tip,
        acceptedAreaDescription: question.acceptedAreaDescription
      }
    };
  }

  const acceptedGeometry = question.routeQuestion.acceptedRoute?.geometry ?? [];
  const acceptedPoints = acceptedGeometry.map(([x, y]) => ({ x, y }));
  const acceptedSummary = `${question.routeQuestion.fromLabel} to ${question.routeQuestion.toLabel}`;
  if (!answer || answer.type !== "route-drawing") {
    return unansweredResult(
      question,
      acceptedSummary,
      {
        type: "route-drawing",
        routePointCount: 0,
        routeScore: null,
        explanation: question.routeQuestion.explanation,
        tip: question.routeQuestion.tip,
        idealRouteDescription: question.routeQuestion.idealRouteDescription
      },
      flagged
    );
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
    flagged,
    passed: routeScore.passed,
    score,
    maxScore: question.maxScore,
    percentage: routeScore.percentage,
    userAnswerSummary: `${answer.routePoints.length} route points captured`,
    acceptedAnswerSummary: acceptedSummary,
    details: {
      type: "route-drawing",
      routePointCount: answer.routePoints.length,
      routeScore,
      reviewData: answer.reviewData,
      explanation: question.routeQuestion.explanation,
      tip: question.routeQuestion.tip,
      idealRouteDescription: question.routeQuestion.idealRouteDescription
    }
  };
}

export function generateMockExamReview(
  questions: MockExamQuestion[],
  answers: MockExamAnswers,
  flaggedQuestionIds: string[] = []
) {
  const flaggedQuestionIdSet = new Set(flaggedQuestionIds);

  return questions.map((question) =>
    scoreMockExamQuestion(
      question,
      answers[question.id],
      flaggedQuestionIdSet.has(question.id)
    )
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
  passPercentage = 70,
  flaggedQuestionIds: string[] = []
): MockExamResult {
  const validQuestionIds = new Set(questions.map((question) => question.id));
  const seenFlaggedQuestionIds = new Set<string>();
  const normalizedFlaggedQuestionIds = flaggedQuestionIds.filter((questionId) => {
    if (!validQuestionIds.has(questionId)) return false;
    if (seenFlaggedQuestionIds.has(questionId)) return false;
    seenFlaggedQuestionIds.add(questionId);
    return true;
  });
  const questionResults = generateMockExamReview(
    questions,
    answers,
    normalizedFlaggedQuestionIds
  );
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
    flaggedQuestionIds: normalizedFlaggedQuestionIds,
    flaggedQuestions: normalizedFlaggedQuestionIds.length,
    score,
    maxScore,
    percentage,
    passPercentage,
    passed: percentage >= passPercentage,
    breakdown,
    questionResults
  };
}
