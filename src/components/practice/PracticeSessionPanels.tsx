import Link from "next/link";
import {
  buildPracticeSessionSummary,
  topicHref,
  type PracticeQuestionFilter,
  type PracticeQuestionType,
  type PracticeSessionResult
} from "@/lib/practice/practiceSession";
import { QUESTION_DIFFICULTIES } from "@/lib/questions/topics";

type PracticeSessionIntroProps = {
  title: string;
  questionCount: number;
  filter: PracticeQuestionFilter;
  baseHref: string;
  questionType: PracticeQuestionType;
};

type PracticeSessionSummaryPanelProps = {
  results: PracticeSessionResult[];
};

const questionTypeLabels: Record<PracticeQuestionType, string> = {
  knowledge: "knowledge",
  "map-click": "map-click",
  "route-drawing": "route planning"
};

function filterLabel(filter: PracticeQuestionFilter) {
  const topic =
    filter.topic === "all" ? "all topics" : filter.topic.toLocaleLowerCase();
  const difficulty =
    filter.difficulty === "all"
      ? "all difficulties"
      : `${filter.difficulty} difficulty`;

  return `${topic}, ${difficulty}`;
}

export function PracticeSessionIntro({
  title,
  questionCount,
  filter,
  baseHref,
  questionType
}: PracticeSessionIntroProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Focused practice session
          </p>
          <h2 className="mt-1 text-xl font-bold text-ink">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            This session is filtered to {filterLabel(filter)}. Answer each{" "}
            {questionTypeLabels[questionType]} question, read the feedback, and
            use the session summary to decide what to practise next.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:min-w-64">
          <div className="rounded-md bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Available
            </p>
            <p className="mt-1 text-2xl font-bold text-ink">{questionCount}</p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            href="/practice"
          >
            Change topic
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        <Link
          className={`rounded-md border px-3 py-2 text-sm font-semibold ${
            filter.difficulty === "all"
              ? "border-road bg-blue-50 text-road"
              : "border-slate-300 text-slate-700 hover:border-road hover:text-road"
          }`}
          href={topicHref(baseHref, { topic: filter.topic, difficulty: "all" })}
        >
          All difficulty
        </Link>
        {QUESTION_DIFFICULTIES.map((difficulty) => (
          <Link
            className={`rounded-md border px-3 py-2 text-sm font-semibold ${
              filter.difficulty === difficulty
                ? "border-road bg-blue-50 text-road"
                : "border-slate-300 text-slate-700 hover:border-road hover:text-road"
            }`}
            href={topicHref(baseHref, { topic: filter.topic, difficulty })}
            key={difficulty}
          >
            {difficulty}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function PracticeEmptyState({
  filter,
  questionTypeLabel
}: {
  filter: PracticeQuestionFilter;
  questionTypeLabel: string;
}) {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
      <h2 className="text-lg font-bold text-amber-950">
        No {questionTypeLabel} questions match this filter
      </h2>
      <p className="mt-2 leading-6">
        Try all topics or another difficulty. Draft and archived admin content
        remains hidden from learner practice until it is published.
      </p>
      <Link
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        href="/practice"
      >
        Back to topic selection
      </Link>
      <p className="mt-3 text-xs font-semibold text-amber-800">
        Current filter: {filterLabel(filter)}.
      </p>
    </section>
  );
}

export function PracticeSessionSummaryPanel({
  results
}: PracticeSessionSummaryPanelProps) {
  if (results.length === 0) return null;

  const summary = buildPracticeSessionSummary(results);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Session summary
          </p>
          <h2 className="mt-1 text-xl font-bold text-ink">
            {summary.correct}/{summary.answered} correct ({summary.percentage}%)
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {summary.recommendation}
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road"
          href={
            summary.incorrect > 0
              ? "/review?result=incorrect&source=practice"
              : "/mock-test"
          }
        >
          {summary.incorrect > 0 ? "Open wrong-answer review" : "Try a mock exam"}
        </Link>
      </div>

      {summary.topicBreakdown.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summary.topicBreakdown.map((topic) => (
            <div className="rounded-md bg-slate-50 p-3" key={topic.topic}>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {topic.topic}
              </p>
              <p className="mt-1 text-lg font-bold text-ink">
                {topic.correct}/{topic.answered} correct
              </p>
              <p className="mt-1 text-sm text-slate-600">{topic.percentage}%</p>
            </div>
          ))}
        </div>
      )}

      {summary.wrongAnswers.length > 0 && (
        <div className="mt-5 border-t border-slate-200 pt-4">
          <h3 className="font-bold text-ink">Wrong answers this session</h3>
          <div className="mt-3 space-y-3">
            {summary.wrongAnswers.map((item) => (
              <article
                className="rounded-md border border-red-100 bg-red-50 p-3 text-sm"
                key={item.questionId}
              >
                <p className="font-semibold text-red-950">{item.prompt}</p>
                <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-red-800">Your answer</dt>
                    <dd className="text-red-950">{item.learnerAnswer}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-red-800">
                      Accepted answer
                    </dt>
                    <dd className="text-red-950">{item.correctAnswer}</dd>
                  </div>
                </dl>
                {item.feedback && (
                  <p className="mt-2 text-red-900">{item.feedback}</p>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
