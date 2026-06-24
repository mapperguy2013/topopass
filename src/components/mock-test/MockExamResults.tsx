import type { MockExamResult } from "@/lib/mockExamEngine";
import type { MockExamModeMetadata } from "@/lib/mockExamModes";
import type { MockExamQuestion } from "@/lib/mockTestQuestions";
import {
  getMockExamNextStep,
  getMockExamTopicBreakdown
} from "@/lib/mockExamReview";

type MockExamResultsProps = {
  result: MockExamResult;
  mode: MockExamModeMetadata;
  questions: MockExamQuestion[];
  submissionNotice?: string;
  persistenceStatus?: "idle" | "saving" | "saved" | "failed";
  onReview: () => void;
  onRestart: () => void;
};

const typeLabels = {
  knowledge: "Knowledge",
  "map-click": "Map click",
  "route-drawing": "Route drawing"
} as const;

export function MockExamResults({
  mode,
  questions,
  result,
  persistenceStatus = "idle",
  submissionNotice,
  onReview,
  onRestart
}: MockExamResultsProps) {
  const topicBreakdown = getMockExamTopicBreakdown(questions, result);
  const nextStep = getMockExamNextStep(result, topicBreakdown);

  return (
    <section className="space-y-6">
      <div
        className={`border-y px-5 py-7 ${
          result.passed
            ? "border-green-200 bg-green-50"
            : "border-red-200 bg-red-50"
        }`}
      >
        <p className="text-sm font-bold uppercase tracking-wide text-slate-600">
          {mode.label} complete
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-700">
          {mode.resultSummary}
        </p>
        {submissionNotice && (
          <p className="mt-2 text-sm font-semibold text-slate-700">
            {submissionNotice}
          </p>
        )}
        {persistenceStatus !== "idle" && (
          <p className="mt-2 text-sm font-semibold text-slate-700">
            {persistenceStatus === "saving" && "Saving result..."}
            {persistenceStatus === "saved" &&
              "Result saved to your progress history."}
            {persistenceStatus === "failed" &&
              "Result could not be saved in this browser."}
          </p>
        )}
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              className={`text-4xl font-bold ${result.passed ? "text-green-800" : "text-red-800"}`}
            >
              {result.percentage}%
            </h2>
            <p className="mt-2 text-lg font-bold text-ink">
              {result.passed ? "Pass-level result" : "Below pass mark"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Pass mark: {result.passPercentage}%
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-semibold text-slate-500">Score</dt>
              <dd className="mt-1 font-bold text-ink">
                {result.score}/{result.maxScore}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Answered</dt>
              <dd className="mt-1 font-bold text-ink">
                {result.answeredQuestions}/{result.totalQuestions}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Passed questions</dt>
              <dd className="mt-1 font-bold text-ink">
                {result.passedQuestions}/{result.totalQuestions}
              </dd>
            </div>
          </dl>
        </div>
        <p className="mt-4 rounded-md border border-white/70 bg-white/70 p-3 text-sm font-semibold text-slate-800">
          {nextStep}
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-xl font-bold text-ink">Question-type breakdown</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {Object.values(result.breakdown).map((breakdown) => (
            <article
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              key={breakdown.type}
            >
              <p className="text-sm font-bold text-ink">
                {typeLabels[breakdown.type]}
              </p>
              <p className="mt-2 text-2xl font-bold text-road">
                {breakdown.passed}/{breakdown.total}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {breakdown.percentage}% score - {breakdown.answered} answered
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-xl font-bold text-ink">Topic breakdown</h3>
        {topicBreakdown.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            Topic breakdown is not available for this attempt.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {topicBreakdown.map((topic) => (
              <article
                className={`rounded-lg border p-4 ${
                  topic.percentage >= result.passPercentage
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
                key={topic.topic}
              >
                <p className="text-sm font-bold text-ink">{topic.topic}</p>
                <p className="mt-2 text-2xl font-bold text-road">
                  {topic.percentage}%
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {topic.passed}/{topic.total} passed - {topic.answered} answered
                </p>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
          onClick={onReview}
          type="button"
        >
          Review answers
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
          onClick={onRestart}
          type="button"
        >
          Restart mock exam
        </button>
      </div>
    </section>
  );
}
