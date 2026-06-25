"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildLearnerDashboardSummary } from "@/lib/analytics/learnerDashboard";
import { getProgressInsights } from "@/lib/analytics/progressInsights";
import {
  calculateAccuracySummary,
  calculateRecentTrend,
  getLongestStreak,
  getRecentActivityCount,
  getRecentScoredAttempts
} from "@/lib/analytics/progressSummary";
import { getPracticeRecommendations } from "@/lib/analytics/recommendationEngine";
import { LOCAL_LEARNER_ID } from "@/lib/db/localPersistence";
import { listMistakeRetryQueue } from "@/lib/db/mistakeRetryQueue";
import { listReviewedMistakeKeys } from "@/lib/db/mistakeReviewRepository";
import { listMockAttempts } from "@/lib/db/mockAttemptRepository";
import { listPracticeAttempts } from "@/lib/db/practiceAttemptRepository";
import {
  normalizeMockAttempts,
  normalizePracticeAttempts,
  type NormalizedMockAttempt,
  type NormalizedPracticeAttempt
} from "@/lib/db/progressMigration";
import { PracticeRecommendations } from "./PracticeRecommendations";
import { ProgressDataManager } from "./ProgressDataManager";
import { AccuracyDonutChart } from "./AccuracyDonutChart";
import { RecentScoresChart } from "./RecentScoresChart";

type ProgressState = {
  loading: boolean;
  source: "local-storage" | "supabase";
  practiceAttempts: NormalizedPracticeAttempt[];
  mockAttempts: NormalizedMockAttempt[];
  reviewedMistakeKeys: string[];
  retryQueueCount: number;
  error: string | null;
};

const initialState: ProgressState = {
  loading: true,
  source: "local-storage",
  practiceAttempts: [],
  mockAttempts: [],
  reviewedMistakeKeys: [],
  retryQueueCount: 0,
  error: null
};

function formatPercent(value: number | null | undefined) {
  return typeof value === "number" ? `${value}%` : "--";
}

function formatDate(value: unknown) {
  if (typeof value !== "string") return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function attemptDate(attempt: NormalizedPracticeAttempt | NormalizedMockAttempt) {
  return attempt.source === "mock-test" ? attempt.submittedAt : attempt.createdAt;
}

function questionType(attempt: NormalizedPracticeAttempt | NormalizedMockAttempt) {
  return attempt.source === "mock-test" ? "mock-test" : attempt.questionType;
}

function questionId(attempt: NormalizedPracticeAttempt | NormalizedMockAttempt) {
  return attempt.source === "mock-test" ? "Mock exam" : attempt.questionId;
}

function attemptPercentage(
  attempt: NormalizedPracticeAttempt | NormalizedMockAttempt
) {
  return attempt.percentage;
}

function attemptPassed(attempt: NormalizedPracticeAttempt | NormalizedMockAttempt) {
  return attempt.passed;
}

function sourceLabel(source: ProgressState["source"]) {
  return source === "supabase"
    ? "Account-backed Supabase progress"
    : "Browser-local progress";
}

function StatCard({
  label,
  value,
  helper
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{helper}</p>
    </article>
  );
}

function trendStatusClasses(status: string) {
  if (status === "improving") return "border-green-200 bg-green-50 text-green-900";
  if (status === "declining") return "border-red-200 bg-red-50 text-red-900";
  if (status === "stable") return "border-blue-200 bg-blue-50 text-blue-950";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function percentOf(part: number, total: number) {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

export function ProgressDashboard() {
  const [state, setState] = useState<ProgressState>(initialState);

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      setState((current) => ({ ...current, loading: true, error: null }));

      try {
        const [practiceResult, mockResult] = await Promise.all([
          listPracticeAttempts(LOCAL_LEARNER_ID),
          listMockAttempts(LOCAL_LEARNER_ID)
        ]);

        if (cancelled) return;

        setState({
          loading: false,
          source:
            practiceResult.source === "supabase" || mockResult.source === "supabase"
              ? "supabase"
              : "local-storage",
          practiceAttempts: normalizePracticeAttempts(practiceResult.attempts),
          mockAttempts: normalizeMockAttempts(mockResult.attempts),
          reviewedMistakeKeys: listReviewedMistakeKeys(),
          retryQueueCount: listMistakeRetryQueue().length,
          error: practiceResult.error ?? mockResult.error ?? null
        });
      } catch (error) {
        if (cancelled) return;
        setState({
          ...initialState,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Progress could not be loaded."
        });
      }
    }

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, []);

  const recentActivity = useMemo(
    () =>
      [...state.practiceAttempts, ...state.mockAttempts]
        .sort((a, b) => attemptDate(b).localeCompare(attemptDate(a)))
        .slice(0, 10),
    [state.mockAttempts, state.practiceAttempts]
  );
  const insights = useMemo(
    () =>
      getProgressInsights({
        practiceAttempts: state.practiceAttempts,
        mockAttempts: state.mockAttempts,
        reviewedMistakeKeys: state.reviewedMistakeKeys
      }),
    [state.mockAttempts, state.practiceAttempts, state.reviewedMistakeKeys]
  );
  const dashboardSummary = useMemo(
    () =>
      buildLearnerDashboardSummary({
        practiceAttempts: state.practiceAttempts,
        mockAttempts: state.mockAttempts,
        minTopicAttempts: 2,
        recentLimit: 8
      }),
    [state.mockAttempts, state.practiceAttempts]
  );
  const allAttempts = useMemo(
    () => [...state.practiceAttempts, ...state.mockAttempts],
    [state.mockAttempts, state.practiceAttempts]
  );
  const recentScoredAttempts = useMemo(
    () => getRecentScoredAttempts(allAttempts, 9),
    [allAttempts]
  );
  const recentTrend = useMemo(
    () => calculateRecentTrend(allAttempts),
    [allAttempts]
  );
  const accuracySummary = useMemo(
    () => calculateAccuracySummary(allAttempts),
    [allAttempts]
  );
  const longestStreak = useMemo(() => getLongestStreak(allAttempts), [allAttempts]);
  const scoredActivityCount = useMemo(
    () => getRecentActivityCount(allAttempts, 7),
    [allAttempts]
  );
  const practiceRecommendations = getPracticeRecommendations({
    practiceAttempts: state.practiceAttempts,
    mockAttempts: state.mockAttempts
  });

  if (state.loading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Loading progress...
      </section>
    );
  }

  const hasAttempts = insights.totalAttempts > 0;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              Learner progress
            </p>
            <h2 className="mt-1 text-2xl font-bold text-ink">
              {sourceLabel(state.source)}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Signed-out learners see saved browser-local attempts. Signed-in
              learners use account-scoped Supabase progress when available, with
              local fallback kept intact.
            </p>
          </div>
          <span className="w-fit rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-950">
            {state.source === "supabase" ? "Signed-in data" : "Local data"}
          </span>
        </div>
      </section>

      {state.error && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Progress loaded with a repository warning: {state.error}
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-road">
                Recent trend
              </p>
              <h2 className="mt-2 text-3xl font-bold text-ink">
                {recentTrend.label}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {recentTrend.description}
              </p>
            </div>
            <span
              className={`w-fit rounded-md border px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${trendStatusClasses(recentTrend.status)}`}
            >
              {recentTrend.status === "not-enough-data"
                ? "More data needed"
                : recentTrend.status}
            </span>
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Longest streak
              </dt>
              <dd className="mt-1 text-2xl font-bold text-ink">
                {longestStreak} day{longestStreak === 1 ? "" : "s"}
              </dd>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Recent activity
              </dt>
              <dd className="mt-1 text-2xl font-bold text-ink">
                {scoredActivityCount}
              </dd>
              <p className="mt-1 text-xs text-slate-600">
                Scored attempt{scoredActivityCount === 1 ? "" : "s"} in the
                last 7 days
              </p>
            </div>
          </dl>

          <RecentScoresChart
            scores={recentScoredAttempts.map((attempt) => attempt.percentage)}
          />
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Correct vs wrong
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">
            Accuracy and answer summary
          </h2>
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
            <AccuracyDonutChart
              accuracyPercent={accuracySummary.accuracyPercent}
              correct={accuracySummary.correct}
              wrong={accuracySummary.wrong}
            />
            <div className="min-w-0 flex-1 space-y-4">
              <div className="rounded-md border border-green-200 bg-green-50 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-green-900">
                  <span className="size-3 rounded-full bg-green-600" />
                  Correct: {accuracySummary.correct} (
                  {percentOf(
                    accuracySummary.correct,
                    accuracySummary.totalQuestions
                  )}
                  %)
                </p>
              </div>
              <div className="rounded-md border border-red-200 bg-red-50 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-red-900">
                  <span className="size-3 rounded-full bg-red-600" />
                  Wrong: {accuracySummary.wrong} (
                  {percentOf(
                    accuracySummary.wrong,
                    accuracySummary.totalQuestions
                  )}
                  %)
                </p>
              </div>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Total attempts
              </dt>
              <dd className="mt-1 text-2xl font-bold text-ink">
                {accuracySummary.totalAttempts}
              </dd>
              <p className="mt-1 text-xs text-slate-600">
                Across all question types
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Scored answers
              </dt>
              <dd className="mt-1 text-2xl font-bold text-ink">
                {accuracySummary.totalQuestions}
              </dd>
              <p className="mt-1 text-xs text-slate-600">
                Correct plus wrong answers
              </p>
            </div>
          </dl>
        </article>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Recent saved attempts</h2>
        {hasAttempts ? (
          <div className="mt-4 divide-y divide-slate-200">
            {recentActivity.map((attempt, index) => (
              <article
                className="grid gap-2 py-4 text-sm sm:grid-cols-[1fr_auto]"
                key={`${questionId(attempt)}-${attemptDate(attempt)}-${index}`}
              >
                <div>
                  <p className="font-bold text-ink">
                    {questionType(attempt) === "mock-test"
                      ? "Mock exam"
                      : questionId(attempt)}
                  </p>
                  <p className="mt-1 text-slate-600">
                    {questionType(attempt)} - {formatDate(attemptDate(attempt))}
                    {" - "}
                    {attemptPassed(attempt) ? "Passed" : "Needs review"}
                  </p>
                </div>
                <p
                  className={`w-fit rounded-md px-3 py-1.5 text-xs font-bold uppercase ${
                    attemptPassed(attempt)
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {formatPercent(attemptPercentage(attempt))}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
            No recent attempts yet. Start a practice session or mock exam to
            populate this list.
          </p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          helper="Practice answers plus mock question results"
          label="Questions attempted"
          value={String(dashboardSummary.totalQuestionsAttempted)}
        />
        <StatCard
          helper="Saved correct answers across review history"
          label="Correct answers"
          value={String(dashboardSummary.correctAnswers)}
        />
        <StatCard
          helper="Correct answers divided by answered questions"
          label="Accuracy"
          value={formatPercent(dashboardSummary.accuracy)}
        />
        <StatCard
          helper="Saved knowledge, map-click, and route attempts"
          label="Total practice attempts"
          value={String(insights.totalPracticeAttempts)}
        />
        <StatCard
          helper="Completed timed mock exams"
          label="Mock exams completed"
          value={String(insights.totalMockAttempts)}
        />
        <StatCard
          helper="Highest saved attempt score"
          label="Best score"
          value={formatPercent(insights.bestScore)}
        />
        <StatCard
          helper="Completed mock exams passed"
          label="Mock pass rate"
          value={formatPercent(insights.mockPassRate)}
        />
        <StatCard
          helper="Lowest average question type"
          label="Current weakest area"
          value={insights.weakestType?.label ?? "--"}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-road">
          Preparation areas
        </p>
        <h2 className="mt-2 text-xl font-bold text-ink">
          Topographical and SERU progress are tracked separately
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Object.values(dashboardSummary.familyBreakdown).map((family) => (
            <article
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              key={family.family}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink">
                    {family.label}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {family.totalQuestionsAttempted} saved answer
                    {family.totalQuestionsAttempted === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="w-fit rounded-md bg-white px-3 py-1 text-sm font-bold text-road">
                  {formatPercent(family.accuracy)}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Correct
                  </p>
                  <p className="mt-1 text-xl font-bold text-ink">
                    {family.correctAnswers}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Weak topics
                  </p>
                  <p className="mt-1 text-xl font-bold text-ink">
                    {family.weakTopics.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Strong topics
                  </p>
                  <p className="mt-1 text-xl font-bold text-ink">
                    {family.strongTopics.length}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {family.weakTopics[0]
                  ? `Focus next on ${family.weakTopics[0].topic}.`
                  : family.totalQuestionsAttempted > 0
                    ? "Keep building a wider topic spread."
                    : family.family === "seru"
                      ? "Start SERU-style practice to build this section."
                      : "Start topographical practice to build this section."}
              </p>
            </article>
          ))}
        </div>
      </section>

      <PracticeRecommendations recommendations={practiceRecommendations} />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Topic strengths and weaknesses
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">
            {dashboardSummary.guidance}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Topic percentages are highlighted only after at least two saved
            answers in that topic. Low-data topics stay marked as developing.
          </p>

          {dashboardSummary.topicPerformance.length === 0 ? (
            <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
              No topic data yet. Complete knowledge, map-click, route, or mock
              questions to build a topic picture.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {dashboardSummary.topicPerformance.slice(0, 8).map((topic) => (
                <div
                  className={`rounded-md border p-4 ${
                    topic.status === "strong"
                      ? "border-green-200 bg-green-50"
                      : topic.status === "weak"
                        ? "border-red-200 bg-red-50"
                        : "border-slate-200 bg-slate-50"
                  }`}
                  key={topic.topic}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold text-ink">{topic.topic}</p>
                    <span className="rounded bg-white/80 px-2 py-1 text-xs font-bold uppercase text-slate-600">
                      {topic.status}
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-road">
                    {topic.enoughData ? formatPercent(topic.accuracy) : "Building"}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {topic.correct}/{topic.attempts} correct
                    {!topic.enoughData ? " - more attempts needed" : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Recent activity
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">
            Latest saved answers
          </h2>
          {dashboardSummary.recentActivity.length === 0 ? (
            <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
              No recent activity yet. Start a practice session or mock exam to
              populate this list.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-slate-200">
              {dashboardSummary.recentActivity.map((item) => (
                <article
                  className="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_auto]"
                  key={item.id}
                >
                  <div>
                    <Link
                      className="font-bold text-ink hover:text-road"
                      href={item.href}
                    >
                      {item.title}
                    </Link>
                    <p className="mt-1 text-slate-600">
                      {item.sourceLabel}
                      {item.topic ? ` - ${item.topic}` : ""} -{" "}
                      {formatDate(item.date)}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-md px-3 py-1.5 text-xs font-bold uppercase ${
                      item.passed
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.scoreLabel}
                  </span>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>

      <section>
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Study insights
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">
            {insights.studyRecommendation}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            These suggestions are based on saved practice and mock attempts.
            They are study guidance, not an official assessment prediction.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <dt className="text-xs font-semibold text-slate-500">
                Weakest type
              </dt>
              <dd className="mt-1 text-lg font-bold text-ink">
                {insights.weakestType
                  ? `${insights.weakestType.label} (${insights.weakestType.averageScore}%)`
                  : "--"}
              </dd>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <dt className="text-xs font-semibold text-slate-500">
                Strongest type
              </dt>
              <dd className="mt-1 text-lg font-bold text-ink">
                {insights.strongestType
                  ? `${insights.strongestType.label} (${insights.strongestType.averageScore}%)`
                  : "--"}
              </dd>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <dt className="text-xs font-semibold text-slate-500">
                Unreviewed mistakes
              </dt>
              <dd className="mt-1 text-lg font-bold text-ink">
                {insights.mistakeSummary.unreviewedMistakes}
              </dd>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <dt className="text-xs font-semibold text-slate-500">
                Most repeated miss
              </dt>
              <dd className="mt-1 text-lg font-bold text-ink">
                {insights.mistakeSummary.mostRepeatedMistake
                  ? `${insights.mistakeSummary.mostRepeatedMistake.missedCount}x`
                  : "--"}
              </dd>
            </div>
          </dl>
          {insights.mistakeSummary.mostRepeatedMistake && (
            <p className="mt-3 text-sm text-slate-600">
              Most repeated:{" "}
              <span className="font-semibold text-ink">
                {insights.mistakeSummary.mostRepeatedMistake.questionId}
              </span>{" "}
              ({insights.mistakeSummary.mostRepeatedMistake.type}).
            </p>
          )}
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Question type breakdown
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {insights.typeBreakdown.map((item) => (
              <div
                className="rounded-md border border-slate-200 bg-slate-50 p-4"
                key={item.type}
              >
                <p className="text-sm font-bold text-ink">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-road">
                  {formatPercent(item.averageScore)}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {item.attempts} attempt{item.attempts === 1 ? "" : "s"} -{" "}
                  {item.failedAttempts} below target
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Quick actions
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {state.retryQueueCount > 0
              ? `${state.retryQueueCount} retry queue item${state.retryQueueCount === 1 ? "" : "s"} saved from mistake review.`
              : "Use these actions to continue from the current progress picture."}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href="/progress/mistakes"
            >
              Review mistakes
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href="/progress/mistakes"
            >
              Retry mistakes
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href="/practice/knowledge"
            >
              Start knowledge practice
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href="/practice/map-click"
            >
              Start map-click practice
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href="/practice/routes"
            >
              Start route practice
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href="/mock-test"
            >
              Start mock test
            </Link>
          </div>
        </article>
      </section>

      <ProgressDataManager />

      {!hasAttempts && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-ink">No progress yet</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Complete a practice question or submit a mock exam to create your
            first local progress record.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href="/practice/knowledge"
            >
              Start knowledge practice
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href="/practice/map-click"
            >
              Try map-click practice
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href="/practice/routes"
            >
              Try route practice
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href="/mock-test"
            >
              Start mock test
            </Link>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Mock exam history</h2>
        {state.mockAttempts.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            No completed mock exams have been saved yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Completed</th>
                  <th className="py-3 pr-4">Score</th>
                  <th className="py-3 pr-4">Result</th>
                  <th className="py-3 pr-4">Questions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.mockAttempts.map((attempt, index) => (
                    <tr key={`${attemptDate(attempt)}-${index}`}>
                      <td className="py-3 pr-4">
                        {formatDate(attemptDate(attempt))}
                      </td>
                      <td className="py-3 pr-4">
                        {formatPercent(attemptPercentage(attempt))}
                      </td>
                      <td className="py-3 pr-4">
                        {attemptPassed(attempt) ? "Pass" : "Not passed"}
                      </td>
                      <td className="py-3 pr-4">
                        {attempt.questionResults.length ||
                          attempt.questionIds.length ||
                          "--"}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
