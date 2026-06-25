"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildLearnerDashboardSummary,
  type LearnerDashboardSummary
} from "@/lib/analytics/learnerDashboard";
import {
  buildProgressSummaryFromAttempts,
  chooseAccountProgressDisplay,
  emptyAccountProgressSummary,
  type AccountProgressChoice
} from "@/lib/account/accountProgress";
import type { UserProgressSummary } from "@/lib/db/progressRepository";
import {
  listLocalMockAttempts,
  listLocalPracticeAttempts
} from "@/lib/db/localPersistence";
import {
  normalizeMockAttempts,
  normalizePracticeAttempts,
  type NormalizedMockAttempt,
  type NormalizedPracticeAttempt
} from "@/lib/db/progressMigration";

type AccountProgressSummaryProps = {
  accountProgress: UserProgressSummary;
  accountPracticeAttempts: NormalizedPracticeAttempt[];
  accountMockAttempts: NormalizedMockAttempt[];
  hasAccountError?: boolean;
};

type LocalProgressState = {
  loaded: boolean;
  practiceAttempts: NormalizedPracticeAttempt[];
  mockAttempts: NormalizedMockAttempt[];
};

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function formatPercent(value: number | null) {
  return typeof value === "number" ? `${value}%` : "--";
}

function formatLatestMockScore(score: UserProgressSummary["latestMockScore"]) {
  if (!score) return "No mock attempts yet";
  if (score.percentage !== null) return `${score.percentage}%`;
  if (score.score !== null && score.maxScore !== null) {
    return `${score.score}/${score.maxScore}`;
  }

  return "Saved";
}

function sourceBadgeClass(choice: AccountProgressChoice) {
  if (choice.kind === "account") {
    return "border-blue-200 bg-blue-50 text-blue-950";
  }

  if (choice.kind === "local-browser") {
    return "border-orange-200 bg-orange-50 text-orange-900";
  }

  return "border-slate-200 bg-white text-slate-600";
}

export function AccountProgressSummary({
  accountMockAttempts,
  accountPracticeAttempts,
  accountProgress,
  hasAccountError = false
}: AccountProgressSummaryProps) {
  const [localState, setLocalState] = useState<LocalProgressState>({
    loaded: false,
    practiceAttempts: [],
    mockAttempts: []
  });

  useEffect(() => {
    setLocalState({
      loaded: true,
      practiceAttempts: normalizePracticeAttempts(listLocalPracticeAttempts()),
      mockAttempts: normalizeMockAttempts(listLocalMockAttempts())
    });
  }, []);

  const accountDashboardSummary = useMemo(
    () =>
      buildLearnerDashboardSummary({
        practiceAttempts: accountPracticeAttempts,
        mockAttempts: accountMockAttempts,
        minTopicAttempts: 2,
        recentLimit: 5
      }),
    [accountMockAttempts, accountPracticeAttempts]
  );
  const localProgress = useMemo(
    () =>
      localState.loaded
        ? buildProgressSummaryFromAttempts({
            practiceAttempts: localState.practiceAttempts,
            mockAttempts: localState.mockAttempts
          })
        : emptyAccountProgressSummary,
    [localState]
  );
  const localDashboardSummary = useMemo(
    () =>
      buildLearnerDashboardSummary({
        practiceAttempts: localState.practiceAttempts,
        mockAttempts: localState.mockAttempts,
        minTopicAttempts: 2,
        recentLimit: 5
      }),
    [localState.mockAttempts, localState.practiceAttempts]
  );
  const progressChoice = chooseAccountProgressDisplay({
    accountProgress,
    accountQuestionCount: accountDashboardSummary.totalQuestionsAttempted,
    localLoaded: localState.loaded,
    localProgress,
    localQuestionCount: localDashboardSummary.totalQuestionsAttempted,
    hasAccountError
  });
  const isLocalFallback = progressChoice.kind === "local-browser";
  const displayProgress = isLocalFallback ? localProgress : accountProgress;
  const displayDashboardSummary: LearnerDashboardSummary = isLocalFallback
    ? localDashboardSummary
    : accountDashboardSummary;
  const wrongAnswers =
    displayDashboardSummary.totalQuestionsAttempted -
    displayDashboardSummary.correctAnswers;

  return (
    <>
      <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink">
              Visible progress summary
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {progressChoice.note}
            </p>
          </div>
          <span
            className={`w-fit rounded-md border px-3 py-1 text-xs font-bold uppercase tracking-wide ${sourceBadgeClass(progressChoice)}`}
          >
            {progressChoice.label}
          </span>
        </div>

        {isLocalFallback && (
          <p className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-semibold text-orange-950">
            Local progress has not yet been synced to your account. It has not
            been deleted or migrated.
          </p>
        )}

        <dl className="mt-4 grid gap-4 sm:grid-cols-4">
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Practice attempts
            </dt>
            <dd className="mt-2 text-2xl font-bold text-ink">
              {displayProgress.practiceAttempts}
            </dd>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Mock attempts
            </dt>
            <dd className="mt-2 text-2xl font-bold text-ink">
              {displayProgress.mockAttempts}
            </dd>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Latest mock score
            </dt>
            <dd className="mt-2 text-lg font-bold text-ink">
              {formatLatestMockScore(displayProgress.latestMockScore)}
            </dd>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Latest activity
            </dt>
            <dd className="mt-2 text-sm font-bold text-ink">
              {formatDate(displayProgress.latestAttemptAt)}
            </dd>
          </div>
        </dl>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              Accuracy
            </p>
            <dl className="mt-3 grid gap-3 sm:grid-cols-4">
              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  Scored
                </dt>
                <dd className="mt-1 text-xl font-bold text-ink">
                  {displayDashboardSummary.totalQuestionsAttempted}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  Correct
                </dt>
                <dd className="mt-1 text-xl font-bold text-green-700">
                  {displayDashboardSummary.correctAnswers}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">Wrong</dt>
                <dd className="mt-1 text-xl font-bold text-red-700">
                  {wrongAnswers}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  Average
                </dt>
                <dd className="mt-1 text-xl font-bold text-ink">
                  {formatPercent(displayProgress.averageScore)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {displayDashboardSummary.guidance}
            </p>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              Learning areas
            </p>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {Object.values(displayDashboardSummary.familyBreakdown).map(
                (family) => (
                  <div className="rounded-md bg-slate-50 p-3" key={family.family}>
                    <dt className="text-sm font-semibold text-slate-600">
                      {family.label}
                    </dt>
                    <dd className="mt-1 text-xl font-bold text-ink">
                      {family.totalQuestionsAttempted}
                    </dd>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {formatPercent(family.accuracy)} accuracy
                    </p>
                  </div>
                )
              )}
            </dl>
          </article>
        </div>

        <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-bold text-ink">Recent activity</h3>
          {displayDashboardSummary.recentActivity.length === 0 ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              No progress activity yet. Complete a practice question or mock
              exam to build this summary.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-slate-200">
              {displayDashboardSummary.recentActivity.map((activity) => (
                <article
                  className="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_auto]"
                  key={activity.id}
                >
                  <div>
                    <p className="font-semibold text-ink">{activity.title}</p>
                    <p className="mt-1 text-slate-600">
                      {activity.sourceLabel}
                      {activity.topic ? ` - ${activity.topic}` : ""} -{" "}
                      {formatDate(activity.date)}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-md px-3 py-1.5 text-xs font-bold uppercase ${
                      activity.passed
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {activity.scoreLabel}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <div className="mt-6 rounded-md border border-blue-200 bg-blue-50 p-4">
        <h3 className="text-sm font-bold text-blue-950">
          Local progress stays in place
        </h3>
        <p className="mt-2 text-sm leading-6 text-blue-950">
          This stage does not migrate or delete existing browser-local progress.
          A guided local-to-account sync can be added later once the production
          sync rules are settled.
        </p>
      </div>
    </>
  );
}
