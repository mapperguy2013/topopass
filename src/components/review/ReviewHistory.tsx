"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  buildReviewHistory,
  defaultReviewHistoryFilters,
  filterReviewHistory,
  getReviewQuestionTypeLabel,
  getReviewSourceLabel,
  getReviewSubjectOptions,
  type ReviewHistoryFilters,
  type ReviewHistoryItem
} from "@/lib/review/reviewHistory";
import {
  listLocalMockAttempts,
  listLocalPracticeAttempts
} from "@/lib/db/localPersistence";
import {
  normalizeMockAttempts,
  normalizePracticeAttempts
} from "@/lib/db/progressMigration";
import { QuestionExplanation } from "@/src/components/questions/QuestionExplanation";
import { VisualAnswerReview } from "@/src/components/progress/VisualAnswerReview";

type ReviewHistoryProps = {
  initialItems: ReviewHistoryItem[];
  isSignedIn: boolean;
  repositoryWarning?: string | null;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatPercent(value: number | null) {
  return typeof value === "number" ? `${value}%` : "--";
}

function sourceDescription(isSignedIn: boolean) {
  return isSignedIn
    ? "Showing account-backed review history for the signed-in learner."
    : "Showing browser-local review history saved on this device.";
}

function emptyStateCopy(isSignedIn: boolean) {
  return isSignedIn
    ? {
        title: "No saved account review history yet",
        body: "Complete practice questions or a mock exam while signed in to build account-backed answer history."
      }
    : {
        title: "No local review history yet",
        body: "Complete practice questions or a mock exam in this browser to build a local answer history."
      };
}

function ReviewItemCard({ item }: { item: ReviewHistoryItem }) {
  const isRoute = item.questionType === "route-drawing";
  const visualType = isRoute ? "route" : "map-click";

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase text-slate-700">
              {getReviewQuestionTypeLabel(item.questionType)}
            </span>
            <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase text-road">
              {getReviewSourceLabel(item.source)}
            </span>
            {item.category && (
              <span className="rounded-md bg-slate-50 px-2.5 py-1 text-xs font-bold uppercase text-slate-600">
                {item.category}
              </span>
            )}
          </div>
          <h2 className="mt-3 text-lg font-bold text-ink">{item.title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Answered {formatDate(item.answeredAt)}
          </p>
        </div>
        <span
          className={`w-fit rounded-md px-3 py-1.5 text-xs font-bold uppercase ${
            item.passed
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {item.passed ? "Correct" : "Incorrect"}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md bg-slate-50 p-3">
          <dt className="font-semibold text-slate-500">Your answer</dt>
          <dd className="mt-1 text-slate-800">{item.learnerAnswer}</dd>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <dt className="font-semibold text-slate-500">
            Correct / accepted answer
          </dt>
          <dd className="mt-1 text-slate-800">{item.correctAnswer}</dd>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <dt className="font-semibold text-slate-500">Score</dt>
          <dd className="mt-1 text-slate-800">
            {item.scoreLabel} ({formatPercent(item.percentage)})
          </dd>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <dt className="font-semibold text-slate-500">Attempt type</dt>
          <dd className="mt-1 text-slate-800">
            {getReviewSourceLabel(item.source)}
          </dd>
        </div>
      </dl>

      {item.questionType === "knowledge" ? (
        <div className="mt-4">
          <QuestionExplanation explanation={item.explanation} tip={item.tip} />
        </div>
      ) : (
        <VisualAnswerReview
          mapClick={
            item.mapClick
              ? {
                  ...item.mapClick,
                  scoreLabel: formatPercent(item.percentage),
                  acceptedAreaDescription: item.acceptedAreaDescription,
                  explanation: item.explanation,
                  tip: item.tip
                }
              : null
          }
          route={
            item.route
              ? {
                  ...item.route,
                  scoreLabel: formatPercent(item.percentage),
                  explanation: item.explanation,
                  idealRouteDescription: item.idealRouteDescription,
                  tip: item.tip
                }
              : null
          }
          type={visualType}
        />
      )}

      {!item.passed && (
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            href="/progress/mistakes"
          >
            Open in mistake review
          </Link>
        </div>
      )}
    </article>
  );
}

export function ReviewHistory({
  initialItems,
  isSignedIn,
  repositoryWarning
}: ReviewHistoryProps) {
  const [items, setItems] = useState(initialItems);
  const [loadingLocal, setLoadingLocal] = useState(!isSignedIn);
  const [filters, setFilters] = useState<ReviewHistoryFilters>(
    defaultReviewHistoryFilters
  );

  useEffect(() => {
    if (isSignedIn) return;

    const localItems = buildReviewHistory({
      practiceAttempts: normalizePracticeAttempts(listLocalPracticeAttempts()),
      mockAttempts: normalizeMockAttempts(listLocalMockAttempts())
    });

    setItems(localItems);
    setLoadingLocal(false);
  }, [isSignedIn]);

  const subjects = useMemo(() => getReviewSubjectOptions(items), [items]);
  const visibleItems = useMemo(
    () => filterReviewHistory(items, filters),
    [filters, items]
  );
  const hasAnyItems = items.length > 0;
  const emptyCopy = emptyStateCopy(isSignedIn);

  function updateFilter<K extends keyof ReviewHistoryFilters>(
    key: K,
    value: ReviewHistoryFilters[K]
  ) {
    setFilters((current) => ({
      ...current,
      [key]: value
    }));
  }

  if (loadingLocal) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Loading local answer history...
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              Answer review history
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink">
              Review every saved answer
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {sourceDescription(isSignedIn)} Use this as the full answer
              history; the mistakes page remains focused on incorrect answers
              only.
            </p>
          </div>
          <span className="w-fit rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-950">
            {isSignedIn ? "Account history" : "Local history"}
          </span>
        </div>
        {repositoryWarning && (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            Review history loaded with a repository warning.
          </p>
        )}
      </section>

      {hasAnyItems && (
        <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-6">
          <label className="block text-sm font-semibold text-slate-700">
            Subject
            <select
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              onChange={(event) => updateFilter("subject", event.target.value)}
              value={filters.subject}
            >
              <option value="all">All subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Type
            <select
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              onChange={(event) =>
                updateFilter(
                  "questionType",
                  event.target.value as ReviewHistoryFilters["questionType"]
                )
              }
              value={filters.questionType}
            >
              <option value="all">All types</option>
              <option value="knowledge">Knowledge</option>
              <option value="map-click">Map-click</option>
              <option value="route-drawing">Route planning</option>
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Result
            <select
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              onChange={(event) =>
                updateFilter(
                  "result",
                  event.target.value as ReviewHistoryFilters["result"]
                )
              }
              value={filters.result}
            >
              <option value="all">All results</option>
              <option value="correct">Correct only</option>
              <option value="incorrect">Incorrect only</option>
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Source
            <select
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              onChange={(event) =>
                updateFilter(
                  "source",
                  event.target.value as ReviewHistoryFilters["source"]
                )
              }
              value={filters.source}
            >
              <option value="all">Practice and mock</option>
              <option value="practice">Practice only</option>
              <option value="mock">Mock exam only</option>
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Date
            <select
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              onChange={(event) =>
                updateFilter(
                  "dateRange",
                  event.target.value as ReviewHistoryFilters["dateRange"]
                )
              }
              value={filters.dateRange}
            >
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="last-7-days">Last 7 days</option>
              <option value="last-30-days">Last 30 days</option>
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Sort
            <select
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              onChange={(event) =>
                updateFilter(
                  "sort",
                  event.target.value as ReviewHistoryFilters["sort"]
                )
              }
              value={filters.sort}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </section>
      )}

      {!hasAnyItems ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-ink">{emptyCopy.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {emptyCopy.body}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href="/practice"
            >
              Start practice
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href="/mock-test"
            >
              Start mock exam
            </Link>
          </div>
        </section>
      ) : visibleItems.length === 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-ink">
            No answers match this filter
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Adjust the subject, result, source, date, or question type filters
            to see more saved answers.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          <p className="text-sm font-semibold text-slate-600">
            Showing {visibleItems.length} of {items.length} saved answer
            {items.length === 1 ? "" : "s"}.
          </p>
          {visibleItems.map((item) => (
            <ReviewItemCard item={item} key={item.id} />
          ))}
        </section>
      )}
    </div>
  );
}
