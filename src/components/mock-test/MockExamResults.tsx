import type { MockExamResult } from "@/lib/mockExamEngine";
import { calculateMockScoreRingSummary } from "@/lib/mockExamScoreSummary";
import type { MockExamModeMetadata } from "@/lib/mockExamModes";
import type { MockExamQuestion } from "@/lib/mockTestQuestions";
import {
  getMockExamNextStep,
  getMockExamTopicBreakdown
} from "@/lib/mockExamReview";
import { MockScoreRing } from "./MockScoreRing";

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
  const scoreSummary = calculateMockScoreRingSummary(result);

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <MockScoreRing summary={scoreSummary} />
            <div>
              <h2 className="text-2xl font-bold text-ink">
                {scoreSummary.resultLabel}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                {nextStep}
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4 lg:min-w-[520px]">
            <div>
              <dt className="font-semibold text-slate-500">Score</dt>
              <dd className="mt-1 font-bold text-ink">
                {scoreSummary.score}/{scoreSummary.maxScore}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Answered</dt>
              <dd className="mt-1 font-bold text-ink">
                {scoreSummary.answeredQuestions}/{scoreSummary.totalQuestions}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Passed questions</dt>
              <dd className="mt-1 font-bold text-ink">
                {scoreSummary.correct}/{scoreSummary.totalQuestions}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Pass mark</dt>
              <dd className="mt-1 font-bold text-ink">
                {scoreSummary.passPercentage}%
              </dd>
            </div>
          </dl>
        </div>
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
