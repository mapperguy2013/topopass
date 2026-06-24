import type { Json, QuestionType } from "./types.ts";
import {
  normalizeMockExamMode,
  type MockExamModeId
} from "../mockExamModes.ts";

export type NormalizedAttemptType = QuestionType | "mock-test";

export type NormalizedPracticeAttempt = {
  id: string;
  source: "practice";
  questionId: string;
  questionType: QuestionType;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  passed: boolean | null;
  answer: Json | null;
  result: Json | null;
  reviewData: Json | null;
  createdAt: string;
};

export type NormalizedMockQuestionResult = {
  questionId: string;
  type: QuestionType;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  userAnswerSummary: string;
  acceptedAnswerSummary: string;
  details: Json | null;
  reviewData: Json | null;
};

export type NormalizedMockAttempt = {
  id: string;
  source: "mock-test";
  questionIds: string[];
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  passed: boolean | null;
  submittedAt: string;
  createdAt: string;
  durationSeconds: number | null;
  mode: MockExamModeId;
  questionResults: NormalizedMockQuestionResult[];
  answers: Record<string, Json>;
  rawResult: Json | null;
};

const FALLBACK_DATE = "1970-01-01T00:00:00.000Z";

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function booleanValue(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string") return FALLBACK_DATE;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? FALLBACK_DATE : date.toISOString();
}

function normalizeQuestionType(value: unknown): QuestionType {
  if (value === "knowledge" || value === "map-click") return value;
  if (value === "route" || value === "route-drawing") return "route-drawing";
  return "knowledge";
}

function normalizeScore(scoreValue: unknown, maxScoreValue: unknown) {
  const maxScore = numberValue(maxScoreValue);
  const score = numberValue(scoreValue);

  if (maxScore === null || maxScore <= 0 || score === null) {
    return {
      score: score === null ? null : Math.max(0, score),
      maxScore: maxScore === null || maxScore <= 0 ? null : maxScore,
      percentage: null
    };
  }

  const safeScore = Math.min(Math.max(0, score), maxScore);
  return {
    score: safeScore,
    maxScore,
    percentage: Math.round((safeScore / maxScore) * 100)
  };
}

function jsonValue(value: unknown): Json | null {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    Array.isArray(value) ||
    (typeof value === "object" && value !== null)
  ) {
    return value as Json;
  }

  return null;
}

function latLngValue(value: unknown) {
  const point = objectValue(value);
  const lat = numberValue(point.lat ?? point.latitude);
  const lng = numberValue(point.lng ?? point.longitude);

  if (
    lat === null ||
    lng === null ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return { lat, lng };
}

function latLngRouteValue(value: unknown) {
  if (!Array.isArray(value)) return null;
  const route = value
    .map(latLngValue)
    .filter((point): point is { lat: number; lng: number } => Boolean(point));

  return route.length > 1 ? route : null;
}

function sanitizeReviewData(value: unknown): Json | null {
  const data = objectValue(value);
  if (Object.keys(data).length === 0) return null;
  const start = latLngValue(data.start);
  const destination = latLngValue(data.destination);

  return {
    ...data,
    userCoordinates: latLngValue(data.userCoordinates) ?? undefined,
    correctCoordinates: latLngValue(data.correctCoordinates) ?? undefined,
    start: start ? { ...objectValue(data.start), ...start } : undefined,
    destination: destination
      ? { ...objectValue(data.destination), ...destination }
      : undefined,
    userRoute: latLngRouteValue(data.userRoute) ?? undefined,
    referenceRoute: latLngRouteValue(data.referenceRoute) ?? undefined
  } as Json;
}

export function normalizePracticeAttempt(
  value: unknown,
  index = 0
): NormalizedPracticeAttempt {
  const attempt = objectValue(value);
  const score = normalizeScore(
    attempt.score,
    attempt.maxScore ?? attempt.max_score
  );
  const answer = jsonValue(attempt.answer);
  const result = jsonValue(attempt.result);
  const answerObject = objectValue(answer);
  const resultObject = objectValue(result);

  return {
    id: stringValue(attempt.id, `practice-${index}`),
    source: "practice",
    questionId: stringValue(
      attempt.questionId ?? attempt.question_id,
      "unknown-question"
    ),
    questionType: normalizeQuestionType(
      attempt.questionType ?? attempt.question_type
    ),
    score: score.score,
    maxScore: score.maxScore,
    percentage: score.percentage,
    passed: booleanValue(attempt.passed),
    answer,
    result,
    reviewData: sanitizeReviewData(
      resultObject.reviewData ?? answerObject.reviewData
    ),
    createdAt: normalizeDate(attempt.createdAt ?? attempt.created_at)
  };
}

export function normalizePracticeAttempts(values: unknown[]) {
  return values
    .map((value, index) => normalizePracticeAttempt(value, index))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function normalizeMockQuestionResult(
  value: unknown,
  index = 0
): NormalizedMockQuestionResult {
  const result = objectValue(value);
  const score = normalizeScore(result.score, result.maxScore ?? result.max_score);
  const details = jsonValue(result.details);
  const percentage =
    numberValue(result.percentage) ?? score.percentage ?? 0;

  return {
    questionId: stringValue(result.questionId ?? result.question_id, `q-${index}`),
    type: normalizeQuestionType(result.type),
    score: score.score ?? 0,
    maxScore: score.maxScore ?? 1,
    percentage,
    passed: booleanValue(result.passed) ?? percentage >= 70,
    userAnswerSummary: stringValue(result.userAnswerSummary, "Not available"),
    acceptedAnswerSummary: stringValue(
      result.acceptedAnswerSummary,
      "Not available"
    ),
    details,
    reviewData: sanitizeReviewData(
      result.reviewData ?? objectValue(details).reviewData
    )
  };
}

function normalizeAnswerMap(value: unknown) {
  const answers = objectValue(value);
  return Object.fromEntries(
    Object.entries(answers).map(([key, answer]) => [key, jsonValue(answer)])
  ) as Record<string, Json>;
}

export function normalizeMockAttempt(
  value: unknown,
  index = 0
): NormalizedMockAttempt {
  const attempt = objectValue(value);
  const result = objectValue(attempt.result);
  const score = normalizeScore(
    attempt.score ?? result.score,
    attempt.maxScore ?? attempt.max_score ?? result.maxScore
  );
  const percentage =
    numberValue(attempt.percentage ?? result.percentage) ?? score.percentage;
  const questionResults = Array.isArray(result.questionResults)
    ? result.questionResults.map(normalizeMockQuestionResult)
    : [];

  return {
    id: stringValue(attempt.id, `mock-${index}`),
    source: "mock-test",
    questionIds: Array.isArray(attempt.questionIds ?? attempt.question_ids)
      ? ((attempt.questionIds ?? attempt.question_ids) as unknown[])
          .filter((id): id is string => typeof id === "string")
      : questionResults.map((question) => question.questionId),
    score: score.score,
    maxScore: score.maxScore,
    percentage,
    passed: booleanValue(attempt.passed ?? result.passed),
    submittedAt: normalizeDate(
      attempt.submittedAt ?? attempt.submitted_at ?? attempt.createdAt
    ),
    createdAt: normalizeDate(attempt.createdAt ?? attempt.created_at),
    durationSeconds: numberValue(attempt.durationSeconds),
    mode: normalizeMockExamMode(attempt.mode ?? result.mode),
    questionResults,
    answers: normalizeAnswerMap(attempt.answers),
    rawResult: jsonValue(attempt.result)
  };
}

export function normalizeMockAttempts(values: unknown[]) {
  return values
    .map((value, index) => normalizeMockAttempt(value, index))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}
