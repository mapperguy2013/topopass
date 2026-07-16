"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  EXAM_PROGRESS_STORAGE_KEY,
  createLocalExamProgressStorage
} from "@/app/practice/exam-mode/examProgressTracking";
import {
  buildExamReadinessSummary,
  type ExamReadinessStatusId,
  type ExamReadinessSummary
} from "@/app/practice/exam-mode/examReadiness";

type ExamReadinessLoadState = {
  loading: boolean;
  summary: ExamReadinessSummary | null;
  storageWarning: string | null;
};

const initialState: ExamReadinessLoadState = {
  loading: true,
  summary: null,
  storageWarning: null
};

function scoreLabel(value: number | null): string {
  return value === null ? "--" : `${value.toFixed(1)}%`;
}

function routeTagLabel(tag: string): string {
  return tag
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function statusClasses(status: ExamReadinessStatusId): string {
  if (status === "ready-for-harder-practice") {
    return "border-green-200 bg-green-50 text-green-900";
  }

  if (status === "nearly-ready") {
    return "border-blue-200 bg-blue-50 text-blue-950";
  }

  if (status === "needs-more-practice") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function trendLabel(summary: ExamReadinessSummary): string {
  if (summary.trend.direction === "insufficient-data") {
    return "More attempts needed";
  }

  if (summary.trend.direction === "steady") {
    return "Steady";
  }

  if (summary.trend.direction === "improving") {
    return `Improving${
      summary.trend.changePercent === null ? "" : ` (+${summary.trend.changePercent.toFixed(1)} points)`
    }`;
  }

  return `Lower than previous${
    summary.trend.changePercent === null ? "" : ` (${summary.trend.changePercent.toFixed(1)} points)`
  }`;
}

export function ExamReadinessDashboard() {
  const storage = useMemo(() => createLocalExamProgressStorage(), []);
  const [state, setState] = useState<ExamReadinessLoadState>(initialState);

  useEffect(() => {
    function loadReadiness() {
      const result = storage.load();

      setState({
        loading: false,
        summary: buildExamReadinessSummary(result.progress),
        storageWarning: result.ok ? null : result.reason ?? "Local exam progress is unavailable."
      });
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === EXAM_PROGRESS_STORAGE_KEY || event.key === null) {
        loadReadiness();
      }
    }

    loadReadiness();
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [storage]);

  if (state.loading || !state.summary) {
    return (
      <section
        id="exam-readiness"
        data-testid="exam-readiness-dashboard"
        className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm"
      >
        Loading exam readiness...
      </section>
    );
  }

  const summary = state.summary;

  return (
    <section
      id="exam-readiness"
      data-testid="exam-readiness-dashboard"
      aria-labelledby="exam-readiness-title"
      className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <div className="min-w-0 p-5 sm:p-6">
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-wide text-road">Exam Mode</p>
            <h2 id="exam-readiness-title" className="mt-2 break-words text-2xl font-bold text-ink">
              Exam readiness
            </h2>
            <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-slate-600">
              A practice signal built from completed, scored exam routes stored in this browser.
            </p>
          </div>
          <span
            data-testid="exam-readiness-status"
            className={`w-fit max-w-full shrink-0 rounded-md border px-3 py-2 text-sm font-bold ${statusClasses(summary.status.id)}`}
          >
            {summary.status.label}
          </span>
        </div>

        <div className="mt-5 min-w-0 border-y border-slate-200 py-4">
          <p className="break-words text-base font-semibold leading-6 text-slate-900">
            {summary.status.summary}
          </p>
          <p className="mt-2 break-words text-xs leading-5 text-slate-600">{summary.disclaimer}</p>
        </div>

        <dl className="grid min-w-0 grid-cols-2 border-b border-slate-200 text-sm md:grid-cols-4">
          <div className="min-w-0 border-b border-r border-slate-200 px-3 py-4 md:border-b-0">
            <dt className="break-words text-xs font-semibold text-slate-500">Completed attempts</dt>
            <dd className="mt-1 break-words text-xl font-bold text-ink">{summary.totalCompletedAttempts}</dd>
          </div>
          <div className="min-w-0 border-b border-slate-200 px-3 py-4 md:border-b-0 md:border-r">
            <dt className="break-words text-xs font-semibold text-slate-500">Latest score</dt>
            <dd className="mt-1 break-words text-xl font-bold text-ink">
              {scoreLabel(summary.latestScorePercent)}
            </dd>
          </div>
          <div className="min-w-0 border-r border-slate-200 px-3 py-4">
            <dt className="break-words text-xs font-semibold text-slate-500">Best score</dt>
            <dd className="mt-1 break-words text-xl font-bold text-ink">
              {scoreLabel(summary.bestScorePercent)}
            </dd>
          </div>
          <div className="min-w-0 px-3 py-4">
            <dt className="break-words text-xs font-semibold text-slate-500">Average score</dt>
            <dd className="mt-1 break-words text-xl font-bold text-ink">
              {scoreLabel(summary.averageScorePercent)}
            </dd>
          </div>
        </dl>

        <dl className="grid min-w-0 gap-x-6 gap-y-3 border-b border-slate-200 py-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-slate-500">Recent average</dt>
            <dd className="mt-1 break-words font-semibold text-slate-900">
              {scoreLabel(summary.recentAverageScorePercent)} from {summary.recentAttemptCount} attempt{summary.recentAttemptCount === 1 ? "" : "s"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-slate-500">Recent pass rate</dt>
            <dd className="mt-1 break-words font-semibold text-slate-900">
              {scoreLabel(summary.recentPassRatePercent)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-slate-500">Recent trend</dt>
            <dd className="mt-1 break-words font-semibold text-slate-900">{trendLabel(summary)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-slate-500">Evidence breadth</dt>
            <dd className="mt-1 break-words font-semibold text-slate-900">
              {summary.distinctTaskCount} tasks | {summary.coveredTagCount} of {summary.availableTagCount} tags
            </dd>
          </div>
        </dl>

        {summary.lowDataReasons.length > 0 ? (
          <div
            data-testid="exam-readiness-low-data"
            className="mt-5 min-w-0 border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            <p className="font-semibold">More evidence needed</p>
            <ul className="mt-2 min-w-0 list-disc space-y-1 pl-5 leading-6">
              {summary.lowDataReasons.map((reason) => (
                <li key={reason} className="break-words">{reason}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold uppercase tracking-wide text-road">Repeated scoring focus</h3>
            {summary.repeatedWeakCategories.length > 0 ? (
              <ul className="mt-3 min-w-0 divide-y divide-slate-200 border-y border-slate-200">
                {summary.repeatedWeakCategories.map((category) => (
                  <li key={category.id} className="min-w-0 py-3">
                    <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <p className="break-words font-semibold text-slate-900">{category.label}</p>
                      <span className="shrink-0 text-xs font-semibold text-amber-900">
                        {category.needsPracticeCount} recent attempts
                      </span>
                    </div>
                    <p className="mt-1 break-words text-xs leading-5 text-slate-600">
                      {category.latestSummary}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 break-words border-y border-slate-200 py-3 text-sm leading-6 text-slate-600">
                No scoring category was marked needs practice on two or more of the latest five attempts.
              </p>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold uppercase tracking-wide text-road">Route skill coverage</h3>
            <p className="mt-2 break-words text-xs leading-5 text-slate-600">
              Tags describe task context. A needs-practice result does not prove that the tag caused the score.
            </p>
            <ul className="mt-3 grid min-w-0 grid-cols-1 border-t border-slate-200 sm:grid-cols-2">
              {summary.tagCoverage.map((coverage) => (
                <li
                  key={coverage.tag}
                  className="min-w-0 border-b border-slate-200 py-3 sm:odd:pr-3 sm:even:pl-3"
                >
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <p className="break-words font-semibold text-slate-900">{routeTagLabel(coverage.tag)}</p>
                    <span className={`shrink-0 text-xs font-semibold ${coverage.covered ? "text-green-800" : "text-slate-500"}`}>
                      {coverage.covered ? "Covered" : "Not tried"}
                    </span>
                  </div>
                  <p className="mt-1 break-words text-xs leading-5 text-slate-600">
                    {coverage.attemptCount} attempt{coverage.attemptCount === 1 ? "" : "s"}
                    {coverage.needsPracticeAttemptCount > 0
                      ? ` | ${coverage.needsPracticeAttemptCount} needs-practice result${coverage.needsPracticeAttemptCount === 1 ? "" : "s"}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex min-w-0 flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next practice step</p>
            <p className="mt-1 max-w-3xl break-words text-sm leading-6 text-slate-800">{summary.nextAction}</p>
          </div>
          <Link
            href="/practice/exam-mode"
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road sm:w-auto"
          >
            Open Exam Mode
          </Link>
        </div>

        {state.storageWarning ? (
          <p className="mt-4 break-words text-xs leading-5 text-amber-900">{state.storageWarning}</p>
        ) : null}
      </div>
    </section>
  );
}
