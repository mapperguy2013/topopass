import type { Coordinates } from "../distance.ts";
import { knowledgeQuestionBank } from "../knowledgeQuestions.ts";
import { seruQuestionBank } from "../seruQuestions.ts";
import {
  advancedSentenceCompletionQuestions,
  sentenceCompletionQuestions
} from "../seruEnglishQuestions.ts";
import { demoMapClickQuestions } from "../mapClickQuestions.ts";
import type {
  NormalizedMockAttempt,
  NormalizedMockQuestionResult,
  NormalizedPracticeAttempt
} from "../db/progressMigration.ts";
import type { RouteMapPoint } from "../../src/data/maps/routeTypes.ts";
import {
  getActiveRouteQuestions,
  getRouteQuestionById,
  type RouteQuestion
} from "../../src/data/routeQuestions.ts";

export type ReviewQuestionType = "knowledge" | "map-click" | "route-drawing";
export type ReviewSource = "practice" | "mock";
export type ReviewResultFilter = "all" | "correct" | "incorrect";
export type ReviewSourceFilter = "all" | ReviewSource;
export type ReviewQuestionTypeFilter = "all" | ReviewQuestionType;
export type ReviewDateRangeFilter = "all" | "today" | "last-7-days" | "last-30-days";
export type ReviewSortMode = "newest" | "oldest";

export type ReviewHistoryFilters = {
  subject: string;
  questionType: ReviewQuestionTypeFilter;
  result: ReviewResultFilter;
  source: ReviewSourceFilter;
  dateRange: ReviewDateRangeFilter;
  sort: ReviewSortMode;
};

export type ReviewRouteScore = {
  drawnLengthMeters?: number;
  acceptedLengthMeters?: number;
  penalties?: string[];
  warnings?: string[];
  feedback?: string[];
};

export type ReviewHistoryItem = {
  id: string;
  questionId: string;
  title: string;
  category: string | null;
  handbookSection: string | null;
  topic: string | null;
  questionType: ReviewQuestionType;
  source: ReviewSource;
  answeredAt: string;
  passed: boolean;
  learnerAnswer: string;
  correctAnswer: string;
  scoreLabel: string;
  percentage: number | null;
  explanation: string | null;
  tip: string | null;
  acceptedAreaDescription: string | null;
  idealRouteDescription: string | null;
  mapClick: {
    userCoordinates?: Coordinates | null;
    correctCoordinates?: { lat: number; lng: number } | null;
    distanceMeters?: number | null;
  } | null;
  route: {
    userRoutePoints?: RouteMapPoint[] | null;
    acceptedRoutePoints?: RouteMapPoint[] | null;
    fromLabel?: string | null;
    toLabel?: string | null;
    routeScore?: ReviewRouteScore | null;
    suggestedSteps?: string[];
  } | null;
};

export const defaultReviewHistoryFilters: ReviewHistoryFilters = {
  subject: "all",
  questionType: "all",
  result: "all",
  source: "all",
  dateRange: "all",
  sort: "newest"
};

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatScore(score: number | null, maxScore: number | null) {
  if (typeof score !== "number" || typeof maxScore !== "number") return "--";
  return `${score}/${maxScore}`;
}

function passedValue(value: boolean | null, percentage: number | null) {
  if (typeof value === "boolean") return value;
  return typeof percentage === "number" ? percentage >= 70 : false;
}

function coordinatesValue(value: unknown): Coordinates | null {
  const coordinate = objectValue(value);
  const latitude = numberValue(coordinate.latitude ?? coordinate.lat);
  const longitude = numberValue(coordinate.longitude ?? coordinate.lng);

  return latitude === null || longitude === null
    ? null
    : {
        latitude,
        longitude
      };
}

function targetValue(value: unknown): { lat: number; lng: number } | null {
  const coordinate = objectValue(value);
  const lat = numberValue(coordinate.lat ?? coordinate.latitude);
  const lng = numberValue(coordinate.lng ?? coordinate.longitude);

  return lat === null || lng === null ? null : { lat, lng };
}

function routePointArray(value: unknown): RouteMapPoint[] | null {
  if (!Array.isArray(value)) return null;
  const points = value
    .map((point) => objectValue(point))
    .filter(
      (point): point is { x: number; y: number } =>
        typeof point.x === "number" && typeof point.y === "number"
    );

  return points.length > 1 ? points : null;
}

function routeScoreValue(value: unknown): ReviewRouteScore | null {
  const score = objectValue(value);
  if (Object.keys(score).length === 0) return null;

  return {
    drawnLengthMeters: numberValue(score.drawnLengthMeters) ?? undefined,
    acceptedLengthMeters: numberValue(score.acceptedLengthMeters) ?? undefined,
    penalties: Array.isArray(score.penalties)
      ? score.penalties.filter((entry): entry is string => typeof entry === "string")
      : [],
    warnings: Array.isArray(score.warnings)
      ? score.warnings.filter((entry): entry is string => typeof entry === "string")
      : [],
    feedback: Array.isArray(score.feedback)
      ? score.feedback.filter((entry): entry is string => typeof entry === "string")
      : []
  };
}

function routeQuestionForId(questionId: string): RouteQuestion | undefined {
  return getRouteQuestionById(questionId.replace(/^mock-route-/, ""));
}

function mapClickQuestionForId(questionId: string) {
  return demoMapClickQuestions.find(
    (question) => question.id === questionId || `mock-${question.id}` === questionId
  );
}

function knowledgeQuestionForId(questionId: string) {
  return [...knowledgeQuestionBank, ...seruQuestionBank].find(
    (question) => question.id === questionId
  );
}

function englishQuestionForId(questionId: string) {
  return [
    ...sentenceCompletionQuestions,
    ...advancedSentenceCompletionQuestions
  ].find((question) => question.id === questionId);
}

function englishCorrectAnswerForId(questionId: string) {
  const question = englishQuestionForId(questionId);
  if (!question) return null;
  return "correctAnswer" in question
    ? question.correctAnswer
    : question.correctAnswers.join(" / ");
}

function titleForQuestion(questionId: string) {
  return (
    knowledgeQuestionForId(questionId)?.prompt ??
    englishQuestionForId(questionId)?.sentence ??
    mapClickQuestionForId(questionId)?.prompt ??
    routeQuestionForId(questionId)?.title ??
    questionId
  );
}

function categoryForQuestion(questionId: string, type: ReviewQuestionType) {
  if (type === "knowledge") {
    return (
      knowledgeQuestionForId(questionId)?.category ??
      englishQuestionForId(questionId)?.category ??
      null
    );
  }
  if (type === "map-click") return mapClickQuestionForId(questionId)?.category ?? null;
  return routeQuestionForId(questionId)?.tags[0] ?? "Route planning";
}

function routeSuggestedSteps(question?: RouteQuestion | null) {
  if (!question?.acceptedRoute?.geometry) return [];
  return [question.fromLabel, "Suggested route", question.toLabel];
}

function practiceCorrectAnswer(attempt: NormalizedPracticeAttempt) {
  const result = objectValue(attempt.result);

  if (attempt.questionType === "knowledge") {
    return (
      stringValue(result.correctAnswer) ??
      knowledgeQuestionForId(attempt.questionId)?.correctAnswer ??
      englishCorrectAnswerForId(attempt.questionId) ??
      "Correct answer not stored"
    );
  }

  if (attempt.questionType === "map-click") {
    const reviewData = objectValue(attempt.reviewData);
    const target =
      targetValue(reviewData.correctCoordinates) ??
      targetValue(result.target) ??
      mapClickQuestionForId(attempt.questionId)?.answer;

    return target
      ? `${target.lat.toFixed(5)}, ${target.lng.toFixed(5)}`
      : "Target coordinate not stored";
  }

  const routeQuestion = routeQuestionForId(attempt.questionId);
  return routeQuestion
    ? `${routeQuestion.fromLabel} to ${routeQuestion.toLabel}`
    : "Accepted route geometry";
}

function practiceLearnerAnswer(attempt: NormalizedPracticeAttempt) {
  const answer = objectValue(attempt.answer);
  const result = objectValue(attempt.result);
  const reviewData = objectValue(attempt.reviewData);

  if (attempt.questionType === "knowledge") {
    const selectedWords = Array.isArray(answer.selectedWords)
      ? answer.selectedWords
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .join(" / ")
      : null;

    return stringValue(answer.selectedAnswer) ?? selectedWords ?? "No answer stored";
  }

  if (attempt.questionType === "map-click") {
    const distance =
      numberValue(reviewData.distanceMeters) ?? numberValue(result.distance);
    return distance === null
      ? "Clicked location stored"
      : `Clicked location, ${Math.round(distance)}m from target`;
  }

  const points = routePointArray(answer.routePoints);
  return points
    ? `${points.length} route points captured`
    : `${typeof attempt.percentage === "number" ? attempt.percentage : 0}% route score`;
}

function practiceReviewItem(attempt: NormalizedPracticeAttempt): ReviewHistoryItem {
  const type = attempt.questionType;
  const mapQuestion = type === "map-click" ? mapClickQuestionForId(attempt.questionId) : null;
  const knowledgeQuestion =
    type === "knowledge" ? knowledgeQuestionForId(attempt.questionId) : null;
  const englishQuestion =
    type === "knowledge" ? englishQuestionForId(attempt.questionId) : null;
  const routeQuestion =
    type === "route-drawing" ? routeQuestionForId(attempt.questionId) : null;
  const answer = objectValue(attempt.answer);
  const result = objectValue(attempt.result);
  const reviewData = objectValue(attempt.reviewData);
  const routeScore = routeScoreValue(result);

  return {
    id: `practice-${attempt.id}`,
    questionId: attempt.questionId,
    title: titleForQuestion(attempt.questionId),
    category: categoryForQuestion(attempt.questionId, type),
    handbookSection:
      stringValue(result.handbookSection) ?? knowledgeQuestion?.handbookSection ?? null,
    topic: stringValue(result.topic) ?? knowledgeQuestion?.topic ?? null,
    questionType: type,
    source: "practice",
    answeredAt: attempt.createdAt,
    passed: passedValue(attempt.passed, attempt.percentage),
    learnerAnswer: practiceLearnerAnswer(attempt),
    correctAnswer: practiceCorrectAnswer(attempt),
    scoreLabel: formatScore(attempt.score, attempt.maxScore),
    percentage: attempt.percentage,
    explanation:
      stringValue(reviewData.explanation) ??
      stringValue(result.explanation) ??
      knowledgeQuestion?.explanation ??
      englishQuestion?.explanation ??
      mapQuestion?.explanation ??
      routeQuestion?.explanation ??
      null,
    tip:
      stringValue(reviewData.tip) ??
      stringValue(result.tip) ??
      knowledgeQuestion?.tip ??
      mapQuestion?.tip ??
      routeQuestion?.tip ??
      null,
    acceptedAreaDescription:
      stringValue(reviewData.acceptedAreaDescription) ??
      mapQuestion?.acceptedAreaDescription ??
      null,
    idealRouteDescription:
      stringValue(reviewData.idealRouteDescription) ??
      routeQuestion?.idealRouteDescription ??
      null,
    mapClick:
      type === "map-click"
        ? {
            userCoordinates: coordinatesValue(
              reviewData.userCoordinates ?? answer.coordinates
            ),
            correctCoordinates:
              targetValue(reviewData.correctCoordinates) ??
              targetValue(result.target) ??
              mapQuestion?.answer ??
              null,
            distanceMeters:
              numberValue(reviewData.distanceMeters) ?? numberValue(result.distance)
          }
        : null,
    route:
      type === "route-drawing"
        ? {
            userRoutePoints: routePointArray(
              reviewData.userRouteMapPoints ?? answer.routePoints
            ),
            acceptedRoutePoints:
              routePointArray(reviewData.referenceRouteMapPoints) ??
              routeQuestion?.acceptedRoute?.geometry.map(([x, y]) => ({ x, y })) ??
              null,
            fromLabel: routeQuestion?.fromLabel ?? null,
            toLabel: routeQuestion?.toLabel ?? null,
            routeScore,
            suggestedSteps: routeSuggestedSteps(routeQuestion)
          }
        : null
  };
}

function answerForMockQuestion(attempt: NormalizedMockAttempt, questionId: string) {
  return objectValue(attempt.answers[questionId]);
}

function mockReviewItem(
  attempt: NormalizedMockAttempt,
  result: NormalizedMockQuestionResult
): ReviewHistoryItem {
  const type = result.type;
  const questionId = result.questionId;
  const mapQuestion = type === "map-click" ? mapClickQuestionForId(questionId) : null;
  const knowledgeQuestion =
    type === "knowledge" ? knowledgeQuestionForId(questionId) : null;
  const englishQuestion =
    type === "knowledge" ? englishQuestionForId(questionId) : null;
  const routeQuestion =
    type === "route-drawing" ? routeQuestionForId(questionId) : null;
  const answer = answerForMockQuestion(attempt, questionId);
  const details = objectValue(result.details);
  const reviewData = objectValue(result.reviewData ?? details.reviewData ?? answer.reviewData);
  const routeScore = routeScoreValue(details.routeScore);

  return {
    id: `mock-${attempt.id}-${questionId}`,
    questionId,
    title: titleForQuestion(questionId),
    category: categoryForQuestion(questionId, type),
    handbookSection:
      stringValue(details.handbookSection) ?? knowledgeQuestion?.handbookSection ?? null,
    topic: stringValue(details.topic) ?? knowledgeQuestion?.topic ?? null,
    questionType: type,
    source: "mock",
    answeredAt: attempt.submittedAt,
    passed: result.passed,
    learnerAnswer: result.userAnswerSummary,
    correctAnswer: result.acceptedAnswerSummary,
    scoreLabel: formatScore(result.score, result.maxScore),
    percentage: result.percentage,
    explanation:
      stringValue(reviewData.explanation) ??
      stringValue(details.explanation) ??
      knowledgeQuestion?.explanation ??
      englishQuestion?.explanation ??
      mapQuestion?.explanation ??
      routeQuestion?.explanation ??
      null,
    tip:
      stringValue(reviewData.tip) ??
      stringValue(details.tip) ??
      knowledgeQuestion?.tip ??
      mapQuestion?.tip ??
      routeQuestion?.tip ??
      null,
    acceptedAreaDescription:
      stringValue(reviewData.acceptedAreaDescription) ??
      mapQuestion?.acceptedAreaDescription ??
      null,
    idealRouteDescription:
      stringValue(reviewData.idealRouteDescription) ??
      routeQuestion?.idealRouteDescription ??
      null,
    mapClick:
      type === "map-click"
        ? {
            userCoordinates: coordinatesValue(
              reviewData.userCoordinates ?? details.clickedCoordinates ?? answer.coordinates
            ),
            correctCoordinates:
              targetValue(reviewData.correctCoordinates) ??
              targetValue(details.target) ??
              mapQuestion?.answer ??
              null,
            distanceMeters:
              numberValue(reviewData.distanceMeters) ??
              numberValue(details.distanceMeters)
          }
        : null,
    route:
      type === "route-drawing"
        ? {
            userRoutePoints: routePointArray(
              reviewData.userRouteMapPoints ?? answer.routePoints
            ),
            acceptedRoutePoints:
              routePointArray(reviewData.referenceRouteMapPoints) ??
              routeQuestion?.acceptedRoute?.geometry.map(([x, y]) => ({ x, y })) ??
              null,
            fromLabel: routeQuestion?.fromLabel ?? null,
            toLabel: routeQuestion?.toLabel ?? null,
            routeScore,
            suggestedSteps: routeSuggestedSteps(routeQuestion)
          }
        : null
  };
}

export function buildReviewHistory({
  practiceAttempts,
  mockAttempts
}: {
  practiceAttempts: NormalizedPracticeAttempt[];
  mockAttempts: NormalizedMockAttempt[];
}) {
  return [
    ...practiceAttempts.map(practiceReviewItem),
    ...mockAttempts.flatMap((attempt) =>
      attempt.questionResults.map((result) => mockReviewItem(attempt, result))
    )
  ].sort((a, b) => b.answeredAt.localeCompare(a.answeredAt));
}

function inDateRange(
  dateValue: string,
  range: ReviewDateRangeFilter,
  referenceDate = new Date()
) {
  if (range === "all") return true;
  const answeredAt = new Date(dateValue);
  if (Number.isNaN(answeredAt.getTime())) return false;

  if (range === "today") {
    return answeredAt.toDateString() === referenceDate.toDateString();
  }

  const days = range === "last-7-days" ? 7 : 30;
  const earliest = new Date(referenceDate);
  earliest.setDate(referenceDate.getDate() - days);
  earliest.setHours(0, 0, 0, 0);

  return answeredAt >= earliest && answeredAt <= referenceDate;
}

export function filterReviewHistory(
  items: ReviewHistoryItem[],
  filters: ReviewHistoryFilters,
  referenceDate = new Date()
) {
  const filtered = items.filter((item) => {
    if (filters.subject !== "all" && item.category !== filters.subject) {
      return false;
    }
    if (filters.questionType !== "all" && item.questionType !== filters.questionType) {
      return false;
    }
    if (filters.result === "correct" && !item.passed) return false;
    if (filters.result === "incorrect" && item.passed) return false;
    if (filters.source !== "all" && item.source !== filters.source) return false;
    return inDateRange(item.answeredAt, filters.dateRange, referenceDate);
  });

  return filtered.sort((a, b) =>
    filters.sort === "oldest"
      ? a.answeredAt.localeCompare(b.answeredAt)
      : b.answeredAt.localeCompare(a.answeredAt)
  );
}

export function getReviewSubjectOptions(items: ReviewHistoryItem[]) {
  return Array.from(
    new Set(items.map((item) => item.category).filter((item): item is string => Boolean(item)))
  ).sort((a, b) => a.localeCompare(b));
}

export function getReviewQuestionTypeLabel(type: ReviewQuestionType) {
  if (type === "map-click") return "Map-click";
  if (type === "route-drawing") return "Route planning";
  return "Knowledge";
}

export function getReviewSourceLabel(source: ReviewSource) {
  return source === "mock" ? "Mock exam" : "Practice";
}

export function buildReviewQuestionMetadata() {
  return {
    knowledgeCount: knowledgeQuestionBank.length,
    seruCount: seruQuestionBank.length,
    seruEnglishCount:
      sentenceCompletionQuestions.length + advancedSentenceCompletionQuestions.length,
    mapClickCount: demoMapClickQuestions.length,
    routeCount: getActiveRouteQuestions().length
  };
}
