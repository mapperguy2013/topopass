"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  aggregateMistakes,
  filterMistakes,
  getMistakeTypeLabel,
  sortMistakes,
  type AggregatedMistakeView,
  type MistakeReviewType,
  type MistakeSortMode
} from "@/lib/analytics/mistakeReview";
import type { Coordinates } from "@/lib/distance";
import { LOCAL_LEARNER_ID } from "@/lib/db/localPersistence";
import {
  listReviewedMistakeKeys,
  markMistakeReviewed
} from "@/lib/db/mistakeReviewRepository";
import { saveMistakeRetryQueue } from "@/lib/db/mistakeRetryQueue";
import { listMockAttempts } from "@/lib/db/mockAttemptRepository";
import { listPracticeAttempts } from "@/lib/db/practiceAttemptRepository";
import {
  type NormalizedMockAttempt,
  type NormalizedPracticeAttempt
} from "@/lib/db/progressMigration";
import { knowledgeQuestionBank } from "@/lib/knowledgeQuestions";
import { demoMapClickQuestions } from "@/lib/mapClickQuestions";
import {
  getActiveRouteQuestions,
  getRouteQuestionById,
  type RouteQuestion
} from "@/src/data/routeQuestions";
import type { RouteMapPoint } from "@/src/data/maps/routeTypes";
import { QuestionExplanation } from "@/src/components/questions/QuestionExplanation";
import { VisualAnswerReview } from "./VisualAnswerReview";

type MistakeItem = {
  id: string;
  questionId: string;
  type: MistakeReviewType;
  title: string;
  category?: string | null;
  userAnswer: string;
  correctAnswer: string;
  score: string;
  date: string;
  percentage: number | null;
  explanation?: string | null;
  tip?: string | null;
  acceptedAreaDescription?: string | null;
  idealRouteDescription?: string | null;
  mapClick?: {
    userCoordinates?: Coordinates | null;
    correctCoordinates?: { lat: number; lng: number } | null;
    distanceMeters?: number | null;
  } | null;
  route?: {
    userRoutePoints?: RouteMapPoint[] | null;
    acceptedRoutePoints?: RouteMapPoint[] | null;
    fromLabel?: string | null;
    toLabel?: string | null;
    routeScore?: {
      drawnLengthMeters?: number;
      acceptedLengthMeters?: number;
      penalties?: string[];
      warnings?: string[];
      feedback?: string[];
    } | null;
    suggestedSteps?: string[];
  } | null;
};

type RouteScoreReview = NonNullable<NonNullable<MistakeItem["route"]>["routeScore"]>;

type MistakeState = {
  loading: boolean;
  rawMistakes: MistakeItem[];
  reviewedKeys: string[];
  error: string | null;
};

type MistakeTypeFilter = "all" | MistakeReviewType;
type MistakeReviewedFilter = "all" | "reviewed" | "unreviewed";

const initialState: MistakeState = {
  loading: true,
  rawMistakes: [],
  reviewedKeys: [],
  error: null
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatScore(score: number | null, maxScore: number | null) {
  if (typeof score !== "number" || typeof maxScore !== "number") return "--";
  return `${score}/${maxScore}`;
}

function formatScoreLabel(attempt: { percentage: number | null; score: string }) {
  return typeof attempt.percentage === "number"
    ? `${attempt.percentage}%`
    : attempt.score;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
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

function coordinatesValue(value: unknown): Coordinates | null {
  const coordinate = objectValue(value);
  if (
    typeof coordinate.latitude === "number" &&
    typeof coordinate.longitude === "number"
  ) {
    return {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude
    };
  }

  return typeof coordinate.lat === "number" && typeof coordinate.lng === "number"
    ? {
        latitude: coordinate.lat,
        longitude: coordinate.lng
      }
    : null;
}

function targetValue(value: unknown): { lat: number; lng: number } | null {
  const coordinate = objectValue(value);
  return typeof coordinate.lat === "number" && typeof coordinate.lng === "number"
    ? {
        lat: coordinate.lat,
        lng: coordinate.lng
      }
    : null;
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
  return knowledgeQuestionBank.find((question) => question.id === questionId);
}

function routeScoreValue(value: unknown): RouteScoreReview | null {
  const score = objectValue(value);
  if (Object.keys(score).length === 0) return null;

  return {
    drawnLengthMeters:
      typeof score.drawnLengthMeters === "number"
        ? score.drawnLengthMeters
        : undefined,
    acceptedLengthMeters:
      typeof score.acceptedLengthMeters === "number"
        ? score.acceptedLengthMeters
        : undefined,
    penalties: Array.isArray(score.penalties)
      ? score.penalties.filter((item): item is string => typeof item === "string")
      : [],
    warnings: Array.isArray(score.warnings)
      ? score.warnings.filter((item): item is string => typeof item === "string")
      : [],
    feedback: Array.isArray(score.feedback)
      ? score.feedback.filter((item): item is string => typeof item === "string")
      : []
  };
}

function routeSuggestedSteps(question?: RouteQuestion | null) {
  if (!question?.acceptedRoute?.geometry) return [];
  return [question.fromLabel, "Suggested route", question.toLabel];
}

function buildQuestionTitles() {
  const titles = new Map<string, string>();

  knowledgeQuestionBank.forEach((question) => {
    titles.set(question.id, question.prompt);
  });

  demoMapClickQuestions.forEach((question) => {
    titles.set(question.id, question.prompt);
    titles.set(`mock-${question.id}`, question.prompt);
  });

  getActiveRouteQuestions().forEach((question) => {
    titles.set(question.id, question.title);
    titles.set(`mock-route-${question.id}`, question.title);
  });

  return titles;
}

function correctAnswerForPractice(attempt: NormalizedPracticeAttempt) {
  const result = objectValue(attempt.result);

  if (attempt.questionType === "knowledge") {
    return typeof result.correctAnswer === "string"
      ? result.correctAnswer
      : "Correct answer not stored";
  }

  if (attempt.questionType === "map-click") {
    const target = objectValue(result.target);
    return typeof target.lat === "number" && typeof target.lng === "number"
      ? `${target.lat.toFixed(5)}, ${target.lng.toFixed(5)}`
      : "Target coordinate not stored";
  }

  return "Accepted route geometry";
}

function userAnswerForPractice(attempt: NormalizedPracticeAttempt) {
  const answer = objectValue(attempt.answer);
  const result = objectValue(attempt.result);

  if (attempt.questionType === "knowledge") {
    return typeof answer.selectedAnswer === "string"
      ? answer.selectedAnswer
      : "No answer stored";
  }

  if (attempt.questionType === "map-click") {
    const distance = typeof result.distance === "number" ? result.distance : null;
    return distance === null
      ? "Clicked location stored"
      : `Clicked location, ${Math.round(distance)}m from target`;
  }

  return `${typeof attempt.percentage === "number" ? attempt.percentage : 0}% route score`;
}

function practiceMistake(
  attempt: NormalizedPracticeAttempt,
  titles: Map<string, string>
): MistakeItem | null {
  const belowPass =
    attempt.questionType === "route-drawing"
      ? (attempt.percentage ?? 0) < 70
      : attempt.passed === false;

  if (!belowPass) return null;

  const mapQuestion =
    attempt.questionType === "map-click"
      ? mapClickQuestionForId(attempt.questionId)
      : null;
  const knowledgeQuestion =
    attempt.questionType === "knowledge"
      ? knowledgeQuestionForId(attempt.questionId)
      : null;
  const routeQuestion =
    attempt.questionType === "route-drawing"
      ? routeQuestionForId(attempt.questionId)
      : null;
  const answer = objectValue(attempt.answer);
  const result = objectValue(attempt.result);
  const reviewData = objectValue(
    attempt.reviewData ?? result.reviewData ?? answer.reviewData
  );
  const target = objectValue(result.target);
  const routeScore = routeScoreValue(attempt.result);

  return {
    id: attempt.id,
    questionId: attempt.questionId,
    type:
      attempt.questionType === "route-drawing" ? "route" : attempt.questionType,
    title: titles.get(attempt.questionId) ?? attempt.questionId,
    category:
      knowledgeQuestion?.category ?? mapQuestion?.category ?? routeQuestion?.tags[0] ?? null,
    userAnswer: userAnswerForPractice(attempt),
    correctAnswer: correctAnswerForPractice(attempt),
    score: formatScore(attempt.score, attempt.maxScore),
    date: attempt.createdAt,
    percentage: attempt.percentage,
    explanation:
      (typeof reviewData.explanation === "string" ? reviewData.explanation : null) ??
      (typeof result.explanation === "string" ? result.explanation : null) ??
      knowledgeQuestion?.explanation ??
      mapQuestion?.explanation ??
      routeQuestion?.explanation ??
      null,
    tip:
      (typeof reviewData.tip === "string" ? reviewData.tip : null) ??
      (typeof result.tip === "string" ? result.tip : null) ??
      knowledgeQuestion?.tip ??
      mapQuestion?.tip ??
      routeQuestion?.tip ??
      null,
    acceptedAreaDescription:
      (typeof reviewData.acceptedAreaDescription === "string"
        ? reviewData.acceptedAreaDescription
        : null) ??
      mapQuestion?.acceptedAreaDescription ??
      null,
    idealRouteDescription:
      (typeof reviewData.idealRouteDescription === "string"
        ? reviewData.idealRouteDescription
        : null) ??
      routeQuestion?.idealRouteDescription ??
      null,
    mapClick:
      attempt.questionType === "map-click"
        ? {
            userCoordinates: coordinatesValue(
              reviewData.userCoordinates ?? answer.coordinates
            ),
            correctCoordinates:
              targetValue(reviewData.correctCoordinates) ??
              (typeof target.lat === "number" && typeof target.lng === "number"
                ? { lat: target.lat, lng: target.lng }
                : mapQuestion?.answer ?? null),
            distanceMeters:
              typeof reviewData.distanceMeters === "number"
                ? reviewData.distanceMeters
                : typeof result.distance === "number"
                  ? result.distance
                  : null
          }
        : null,
    route:
      attempt.questionType === "route-drawing"
        ? {
            userRoutePoints: routePointArray(
              reviewData.userRouteMapPoints ?? answer.routePoints
            ),
            acceptedRoutePoints:
              routePointArray(reviewData.referenceRouteMapPoints) ??
              routeQuestion?.acceptedRoute?.geometry.map(([x, y]) => ({ x, y })) ??
              null,
            fromLabel: routeQuestion?.fromLabel,
            toLabel: routeQuestion?.toLabel,
            routeScore,
            suggestedSteps: routeSuggestedSteps(routeQuestion)
          }
        : null
  };
}

function mockAnswerForQuestion(attempt: NormalizedMockAttempt, questionId: string) {
  return objectValue(attempt.answers[questionId]);
}

function mockMistakes(
  attempt: NormalizedMockAttempt,
  titles: Map<string, string>
) {
  return attempt.questionResults
    .filter((result) => !result.passed)
    .map((result) => {
      const questionId = result.questionId;
      const mapQuestion =
        result.type === "map-click" ? mapClickQuestionForId(questionId) : null;
      const knowledgeQuestion =
        result.type === "knowledge" ? knowledgeQuestionForId(questionId) : null;
      const routeQuestion =
        result.type === "route-drawing" ? routeQuestionForId(questionId) : null;
      const answer = mockAnswerForQuestion(attempt, questionId);
      const details = objectValue(result.details);
      const reviewData = objectValue(
        result.reviewData ?? details.reviewData ?? answer.reviewData
      );
      const target = objectValue(details.target);
      const routeScore = routeScoreValue(details.routeScore);

      return {
        id: `${attempt.id}-${questionId}`,
        questionId,
        type: result.type === "route-drawing" ? "route" : result.type,
        title: titles.get(questionId) ?? questionId,
        category:
          knowledgeQuestion?.category ?? mapQuestion?.category ?? routeQuestion?.tags[0] ?? null,
        userAnswer: result.userAnswerSummary,
        correctAnswer: result.acceptedAnswerSummary,
        score: formatScore(result.score, result.maxScore),
        date: attempt.submittedAt,
        percentage: result.percentage,
        explanation:
          (typeof reviewData.explanation === "string" ? reviewData.explanation : null) ??
          (typeof details.explanation === "string" ? details.explanation : null) ??
          knowledgeQuestion?.explanation ??
          mapQuestion?.explanation ??
          routeQuestion?.explanation ??
          null,
        tip:
          (typeof reviewData.tip === "string" ? reviewData.tip : null) ??
          (typeof details.tip === "string" ? details.tip : null) ??
          knowledgeQuestion?.tip ??
          mapQuestion?.tip ??
          routeQuestion?.tip ??
          null,
        acceptedAreaDescription:
          (typeof reviewData.acceptedAreaDescription === "string"
            ? reviewData.acceptedAreaDescription
            : null) ??
          mapQuestion?.acceptedAreaDescription ??
          null,
        idealRouteDescription:
          (typeof reviewData.idealRouteDescription === "string"
            ? reviewData.idealRouteDescription
            : null) ??
          routeQuestion?.idealRouteDescription ??
          null,
        mapClick:
          result.type === "map-click"
            ? {
                userCoordinates: coordinatesValue(
                  reviewData.userCoordinates ?? answer.coordinates
                ),
                correctCoordinates:
                  targetValue(reviewData.correctCoordinates) ??
                  (typeof target.lat === "number" && typeof target.lng === "number"
                    ? { lat: target.lat, lng: target.lng }
                    : mapQuestion?.answer ?? null),
                distanceMeters:
                  typeof reviewData.distanceMeters === "number"
                    ? reviewData.distanceMeters
                    : typeof details.distanceMeters === "number"
                      ? details.distanceMeters
                      : null
              }
            : null,
        route:
          result.type === "route-drawing"
            ? {
                userRoutePoints: routePointArray(
                  reviewData.userRouteMapPoints ?? answer.routePoints
                ),
                acceptedRoutePoints:
                  routePointArray(reviewData.referenceRouteMapPoints) ??
                  routeQuestion?.acceptedRoute?.geometry.map(([x, y]) => ({
                    x,
                    y
                  })) ?? null,
                fromLabel: routeQuestion?.fromLabel,
                toLabel: routeQuestion?.toLabel,
                routeScore,
                suggestedSteps: routeSuggestedSteps(routeQuestion)
              }
            : null
      } satisfies MistakeItem;
    });
}

export function MistakeReview() {
  const router = useRouter();
  const [state, setState] = useState<MistakeState>(initialState);
  const [selectedMistakeId, setSelectedMistakeId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<MistakeTypeFilter>("all");
  const [reviewedFilter, setReviewedFilter] =
    useState<MistakeReviewedFilter>("all");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<MistakeSortMode>("newest");
  const titles = useMemo(buildQuestionTitles, []);
  const aggregatedMistakes = useMemo(
    () => aggregateMistakes(state.rawMistakes, state.reviewedKeys),
    [state.rawMistakes, state.reviewedKeys]
  );
  const visibleMistakes = useMemo(
    () =>
      sortMistakes(
        filterMistakes(aggregatedMistakes, {
          type: typeFilter,
          reviewed: reviewedFilter,
          search
        }),
        sortMode
      ),
    [aggregatedMistakes, reviewedFilter, search, sortMode, typeFilter]
  );
  const selectedMistake =
    visibleMistakes.find((mistake) => mistake.id === selectedMistakeId) ??
    visibleMistakes[0] ??
    null;

  useEffect(() => {
    let cancelled = false;

    async function loadMistakes() {
      try {
        const [practiceResult, mockResult] = await Promise.all([
          listPracticeAttempts(LOCAL_LEARNER_ID),
          listMockAttempts(LOCAL_LEARNER_ID)
        ]);
        if (cancelled) return;

        const practiceMistakes = (
          practiceResult.attempts as NormalizedPracticeAttempt[]
        )
          .map((attempt) => practiceMistake(attempt, titles))
          .filter((item): item is MistakeItem => Boolean(item));
        const mockMistakeItems = (mockResult.attempts as NormalizedMockAttempt[])
          .flatMap((attempt) => mockMistakes(attempt, titles));

        const rawMistakes = [...practiceMistakes, ...mockMistakeItems];

        setState({
          loading: false,
          rawMistakes,
          reviewedKeys: listReviewedMistakeKeys(),
          error: practiceResult.error ?? mockResult.error ?? null
        });
        setSelectedMistakeId((current) => current ?? rawMistakes[0]?.id ?? null);
      } catch (error) {
        if (cancelled) return;
        setState({
          loading: false,
          rawMistakes: [],
          reviewedKeys: [],
          error:
            error instanceof Error
              ? error.message
              : "Mistakes could not be loaded."
        });
      }
    }

    loadMistakes();

    return () => {
      cancelled = true;
    };
  }, [titles]);

  function retryMistakes(mistakes: AggregatedMistakeView<MistakeItem>[]) {
    const result = saveMistakeRetryQueue(
      mistakes.map((mistake) => ({
        questionId: mistake.questionId,
        type: mistake.type
      }))
    );

    router.push(result.href);
  }

  function reviewMistake(mistake: AggregatedMistakeView<MistakeItem>) {
    const persisted = markMistakeReviewed({
      questionId: mistake.questionId,
      type: mistake.type
    });

    if (!persisted) return;
    setState((current) => ({
      ...current,
      reviewedKeys: listReviewedMistakeKeys()
    }));
  }

  if (state.loading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Loading mistake review...
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Filter and sort missed questions, review explanations, then retry the
          items that need more practice.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          {visibleMistakes.length > 0 && (
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              onClick={() => retryMistakes(visibleMistakes)}
              type="button"
            >
              Retry all mistakes
            </button>
          )}
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            href="/progress"
          >
            Back to Progress
          </Link>
        </div>
      </div>

      {state.error && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Mistakes loaded with a repository warning: {state.error}
        </section>
      )}

      {aggregatedMistakes.length > 0 && (
        <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto_auto_auto]">
          <label className="block text-sm font-semibold text-slate-700">
            Search
            <input
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Question, category, answer..."
              type="search"
              value={search}
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Type
            <select
              className="mt-1 min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              onChange={(event) =>
                setTypeFilter(event.target.value as MistakeTypeFilter)
              }
              value={typeFilter}
            >
              <option value="all">All</option>
              <option value="knowledge">Knowledge</option>
              <option value="map-click">Map-click</option>
              <option value="route">Route</option>
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Reviewed
            <select
              className="mt-1 min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              onChange={(event) =>
                setReviewedFilter(
                  event.target.value as MistakeReviewedFilter
                )
              }
              value={reviewedFilter}
            >
              <option value="all">Show all</option>
              <option value="unreviewed">Unreviewed only</option>
              <option value="reviewed">Reviewed only</option>
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Sort
            <select
              className="mt-1 min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              onChange={(event) =>
                setSortMode(event.target.value as MistakeSortMode)
              }
              value={sortMode}
            >
              <option value="newest">Newest</option>
              <option value="weakest">Weakest</option>
              <option value="most-repeated">Most repeated</option>
            </select>
          </label>
        </section>
      )}

      {aggregatedMistakes.length === 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-ink">No mistakes saved yet</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Attempts that need review will appear here after you complete
            practice questions or mock exams.
          </p>
        </section>
      ) : visibleMistakes.length === 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-ink">No matching mistakes</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Adjust the filters or search text to see more saved mistakes.
          </p>
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="space-y-3">
            {visibleMistakes.map((mistake) => {
              const isSelected = selectedMistake?.id === mistake.id;
              return (
                <button
                  aria-pressed={isSelected}
                  className={`w-full rounded-lg border p-4 text-left shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road ${
                    isSelected
                      ? "border-road bg-blue-50"
                      : "border-slate-200 bg-white hover:border-road"
                  }`}
                  key={mistake.id}
                  onClick={() => setSelectedMistakeId(mistake.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase text-slate-700">
                        {getMistakeTypeLabel(mistake.type)}
                      </span>
                      {mistake.reviewed && (
                        <span className="rounded-md bg-green-100 px-2.5 py-1 text-xs font-bold uppercase text-green-800">
                          Reviewed
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {formatDate(mistake.latestMissedDate)}
                    </span>
                  </div>
                  <h2 className="mt-3 text-sm font-bold text-ink">
                    {mistake.title}
                  </h2>
                  {mistake.category && (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {mistake.category}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-slate-600">
                    {mistake.userAnswer}
                  </p>
                  <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-700 sm:grid-cols-2">
                    <span>Score: {formatScoreLabel(mistake)}</span>
                    <span>Missed: {mistake.missedCount}x</span>
                  </div>
                </button>
              );
            })}
            <p className="text-center text-xs text-slate-500">
              Showing {visibleMistakes.length} of {aggregatedMistakes.length} saved
              mistake{aggregatedMistakes.length === 1 ? "" : "s"}
            </p>
          </aside>

          {selectedMistake && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {getMistakeTypeLabel(selectedMistake.type)} - Last missed{" "}
                    {formatDate(selectedMistake.latestMissedDate)}
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-ink">
                    {selectedMistake.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedMistake.category && (
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase text-slate-700">
                        {selectedMistake.category}
                      </span>
                    )}
                    <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-bold uppercase text-red-700">
                      Missed {selectedMistake.missedCount}x
                    </span>
                    {selectedMistake.reviewed && (
                      <span className="rounded-md bg-green-100 px-2.5 py-1 text-xs font-bold uppercase text-green-800">
                        Reviewed
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road disabled:cursor-not-allowed disabled:text-slate-400"
                    disabled={selectedMistake.reviewed}
                    onClick={() => reviewMistake(selectedMistake)}
                    type="button"
                  >
                    {selectedMistake.reviewed ? "Reviewed" : "Mark as reviewed"}
                  </button>
                  <button
                    className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                    onClick={() => retryMistakes([selectedMistake])}
                    type="button"
                  >
                    Retry this question
                  </button>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md bg-slate-50 p-3">
                  <dt className="font-semibold text-slate-500">Score</dt>
                  <dd className="mt-1 text-slate-800">
                    {formatScoreLabel(selectedMistake)}
                  </dd>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <dt className="font-semibold text-slate-500">Lowest score</dt>
                  <dd className="mt-1 text-slate-800">
                    {typeof selectedMistake.lowestPercentage === "number"
                      ? `${selectedMistake.lowestPercentage}%`
                      : "--"}
                  </dd>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <dt className="font-semibold text-slate-500">Your answer</dt>
                  <dd className="mt-1 text-slate-800">
                    {selectedMistake.userAnswer}
                  </dd>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <dt className="font-semibold text-slate-500">
                    Correct / accepted answer
                  </dt>
                  <dd className="mt-1 text-slate-800">
                    {selectedMistake.correctAnswer}
                  </dd>
                </div>
              </dl>

              {selectedMistake.type === "knowledge" && (
                <div className="mt-4">
                <QuestionExplanation
                  acceptedAreaDescription={selectedMistake.acceptedAreaDescription}
                  explanation={selectedMistake.explanation}
                  idealRouteDescription={selectedMistake.idealRouteDescription}
                  tip={selectedMistake.tip}
                />
                </div>
              )}

              {selectedMistake.type !== "knowledge" && (
                <VisualAnswerReview
                  key={selectedMistake.id}
                  mapClick={
                    selectedMistake.mapClick
                      ? {
                          ...selectedMistake.mapClick,
                          scoreLabel: formatScoreLabel(selectedMistake),
                          acceptedAreaDescription:
                            selectedMistake.acceptedAreaDescription,
                          explanation: selectedMistake.explanation,
                          tip: selectedMistake.tip
                        }
                      : null
                  }
                  route={
                    selectedMistake.route
                      ? {
                          ...selectedMistake.route,
                          scoreLabel: formatScoreLabel(selectedMistake),
                          explanation: selectedMistake.explanation,
                          idealRouteDescription:
                            selectedMistake.idealRouteDescription,
                          tip: selectedMistake.tip
                        }
                      : null
                  }
                  type={selectedMistake.type}
                />
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
