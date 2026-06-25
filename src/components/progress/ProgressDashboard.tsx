"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  calculateAccuracySummary,
  calculateRecentTrend,
  getLongestStreak,
  getRecentActivityCount,
  getRecentScoredAttempts
} from "@/lib/analytics/progressSummary";
import { LOCAL_LEARNER_ID } from "@/lib/db/localPersistence";
import { listMockAttempts } from "@/lib/db/mockAttemptRepository";
import { listPracticeAttempts } from "@/lib/db/practiceAttemptRepository";
import {
  normalizeMockAttempts,
  normalizePracticeAttempts,
  type NormalizedMockAttempt,
  type NormalizedPracticeAttempt
} from "@/lib/db/progressMigration";
import { AccuracyDonutChart } from "./AccuracyDonutChart";
import { formatAttemptTitle, formatAttemptType } from "./progressDisplayHelpers";
import { RecentScoresChart } from "./RecentScoresChart";

type ProgressState = {
  loading: boolean;
  source: "local-storage" | "supabase";
  practiceAttempts: NormalizedPracticeAttempt[];
  mockAttempts: NormalizedMockAttempt[];
  error: string | null;
};

const initialState: ProgressState = {
  loading: true,
  source: "local-storage",
  practiceAttempts: [],
  mockAttempts: [],
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
  return source === "supabase" ? "Account data" : "Local data";
}

function trendStatusClasses(status: string) {
  if (status === "improving") return "border-green-200 bg-green-50 text-green-900";
  if (status === "declining") return "border-red-200 bg-red-50 text-red-900";
  if (status === "stable") return "border-blue-200 bg-blue-50 text-blue-950";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function attemptBadgeClasses(
  passed: boolean | null
) {
  if (passed === true) return "bg-green-100 text-green-800";
  if (passed === false) return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-700";
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

  const allAttempts = useMemo(
    () => [...state.practiceAttempts, ...state.mockAttempts],
    [state.mockAttempts, state.practiceAttempts]
  );
  const allRecentAttempts = useMemo(
    () =>
      [...allAttempts].sort((a, b) => attemptDate(b).localeCompare(attemptDate(a))),
    [allAttempts]
  );
  const recentAttempts = useMemo(
    () => allRecentAttempts.slice(0, 5),
    [allRecentAttempts]
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

  if (state.loading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Loading progress...
      </section>
    );
  }

  const hasAttempts = allRecentAttempts.length > 0;
  const hasMoreAttempts = allRecentAttempts.length > recentAttempts.length;

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Track your recent practice, accuracy, and latest attempts.
        </p>
        <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
          {sourceLabel(state.source)}
        </span>
      </section>

      {state.error && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Progress loaded with a repository warning: {state.error}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <AccuracyDonutChart
              accuracyPercent={accuracySummary.accuracyPercent}
              correct={accuracySummary.correct}
              wrong={accuracySummary.wrong}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold uppercase tracking-wide text-road">
                Accuracy
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Based on scored answers from practice and mock exams.
              </p>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-slate-500">Correct</dt>
                  <dd className="mt-1 text-2xl font-bold text-green-700">
                    {accuracySummary.correct}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Wrong</dt>
                  <dd className="mt-1 text-2xl font-bold text-red-700">
                    {accuracySummary.wrong}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Scored</dt>
                  <dd className="mt-1 text-2xl font-bold text-ink">
                    {accuracySummary.totalQuestions}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-road">
                Recent trend
              </p>
              <h2 className="mt-2 text-2xl font-bold text-ink">
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

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-500">Longest streak</dt>
              <dd className="mt-1 text-xl font-bold text-ink">
                {longestStreak} day{longestStreak === 1 ? "" : "s"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Last 7 days</dt>
              <dd className="mt-1 text-xl font-bold text-ink">
                {scoredActivityCount} attempt
                {scoredActivityCount === 1 ? "" : "s"}
              </dd>
            </div>
          </dl>

          <RecentScoresChart
            scores={recentScoredAttempts.map((attempt) => attempt.percentage)}
          />
        </article>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">Recent attempts</h2>
            {hasMoreAttempts && (
              <p className="mt-1 text-sm text-slate-600">Latest 5 attempts</p>
            )}
          </div>
          {hasMoreAttempts && (
            <Link
              className="text-sm font-semibold text-road hover:text-blue-700"
              href="/review"
            >
              View more
            </Link>
          )}
        </div>

        {hasAttempts ? (
          <div className="mt-3 divide-y divide-slate-200">
            {recentAttempts.map((attempt, index) => {
              const type = questionType(attempt);
              const passed = attemptPassed(attempt);

              return (
                <article
                  className="grid gap-2 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto]"
                  key={`${questionId(attempt)}-${attemptDate(attempt)}-${index}`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">
                      {formatAttemptTitle(questionId(attempt), type)}
                    </p>
                    <p className="mt-1 text-slate-600">
                      {formatAttemptType(type)} - {formatDate(attemptDate(attempt))}
                      {" - "}
                      {passed === true
                        ? "Passed"
                        : passed === false
                          ? "Needs review"
                          : "Saved"}
                    </p>
                  </div>
                  <p
                    className={`w-fit rounded-md px-3 py-1.5 text-xs font-bold uppercase ${attemptBadgeClasses(passed)}`}
                  >
                    {formatPercent(attemptPercentage(attempt))}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
            No attempts yet. Start a practice session or mock exam to build your
            progress summary.
          </p>
        )}
      </section>
    </div>
  );
}
