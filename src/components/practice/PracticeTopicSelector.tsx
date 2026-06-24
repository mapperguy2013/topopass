"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  buildReviewHistory,
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
import {
  getPracticeTopicStats,
  topicHref,
  type PracticeTopicStat
} from "@/lib/practice/practiceSession";

type PracticeTopicSelectorProps = {
  topicStats: PracticeTopicStat[];
};

function weakTopicCounts(items: ReviewHistoryItem[]) {
  return items
    .filter((item) => !item.passed && item.category)
    .reduce<Record<string, number>>((counts, item) => {
      const category = item.category as string;
      counts[category] = (counts[category] ?? 0) + 1;
      return counts;
    }, {});
}

function modeLink(
  href: string,
  count: number,
  label: string,
  topic: PracticeTopicStat["topic"]
) {
  const isAvailable = count > 0;
  const className = `inline-flex min-h-10 items-center justify-center rounded-md px-3 py-2 text-sm font-semibold ${
    isAvailable
      ? "border border-slate-300 bg-white text-slate-700 hover:border-road hover:text-road"
      : "border border-slate-200 bg-slate-50 text-slate-400"
  }`;

  if (!isAvailable) {
    return (
      <span aria-disabled="true" className={className}>
        {label} (0)
      </span>
    );
  }

  return (
    <Link className={className} href={topicHref(href, { topic })}>
      {label} ({count})
    </Link>
  );
}

export function PracticeTopicSelector({
  topicStats
}: PracticeTopicSelectorProps) {
  const [reviewItems, setReviewItems] = useState<ReviewHistoryItem[]>([]);

  useEffect(() => {
    const localItems = buildReviewHistory({
      practiceAttempts: normalizePracticeAttempts(listLocalPracticeAttempts()),
      mockAttempts: normalizeMockAttempts(listLocalMockAttempts())
    });
    setReviewItems(localItems);
  }, []);

  const weakCounts = useMemo(() => weakTopicCounts(reviewItems), [reviewItems]);
  const weakTopics = useMemo(
    () =>
      topicStats
        .filter((topic) => (weakCounts[topic.topic] ?? 0) > 0)
        .sort(
          (a, b) =>
            (weakCounts[b.topic] ?? 0) - (weakCounts[a.topic] ?? 0) ||
            a.topic.localeCompare(b.topic)
        ),
    [topicStats, weakCounts]
  );
  const orderedTopics = useMemo(() => {
    const weakSet = new Set(weakTopics.map((topic) => topic.topic));
    return [
      ...weakTopics,
      ...topicStats.filter((topic) => !weakSet.has(topic.topic))
    ];
  }, [topicStats, weakTopics]);
  const totalQuestions = topicStats.reduce((total, topic) => total + topic.total, 0);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Topic-based practice
          </p>
          <h2 className="mt-1 text-2xl font-bold text-ink">
            Choose a focused session
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Pick a topic, then choose the question style. Weak topics are
            highlighted from saved local/account-synced attempts on this device.
          </p>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Published/local questions
          </p>
          <p className="mt-1 text-2xl font-bold text-ink">{totalQuestions}</p>
        </div>
      </div>

      {weakTopics.length > 0 && (
        <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm font-bold text-ink">Suggested focus</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            Start with{" "}
            <span className="font-semibold">{weakTopics[0].topic}</span>. It has{" "}
            {weakCounts[weakTopics[0].topic]} saved incorrect answer
            {weakCounts[weakTopics[0].topic] === 1 ? "" : "s"}.
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {orderedTopics.map((topic) => (
          <article
            className="rounded-lg border border-slate-200 bg-white p-4"
            key={topic.topic}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink">{topic.topic}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {topic.total} available question
                  {topic.total === 1 ? "" : "s"}
                  {weakCounts[topic.topic]
                    ? ` - ${weakCounts[topic.topic]} saved mistake${weakCounts[topic.topic] === 1 ? "" : "s"}`
                    : ""}
                </p>
              </div>
              {weakCounts[topic.topic] ? (
                <span className="w-fit rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase text-road">
                  Focus area
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {modeLink(
                "/practice/knowledge",
                topic.knowledge,
                "Knowledge",
                topic.topic
              )}
              {modeLink(
                "/practice/map-click",
                topic.mapClick,
                "Map-click",
                topic.topic
              )}
              {modeLink(
                "/practice/routes",
                topic.routeDrawing,
                "Routes",
                topic.topic
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:flex-wrap">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          href="/practice/knowledge"
        >
          Mixed knowledge
        </Link>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road"
          href="/practice/map-click"
        >
          Mixed map-click
        </Link>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road"
          href="/practice/routes"
        >
          Mixed routes
        </Link>
      </div>
    </section>
  );
}

export function PracticeTopicSelectorShell() {
  return <PracticeTopicSelector topicStats={getPracticeTopicStats()} />;
}
