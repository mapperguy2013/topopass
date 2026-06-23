import type { MockExamResult } from "@/lib/mockExamEngine";

type MockExamResultsProps = {
  result: MockExamResult;
  submissionNotice?: string;
  onReview: () => void;
  onRestart: () => void;
};

const typeLabels = {
  knowledge: "Knowledge",
  "map-click": "Map click",
  "route-drawing": "Route drawing"
} as const;

export function MockExamResults({
  result,
  submissionNotice,
  onReview,
  onRestart
}: MockExamResultsProps) {
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
          Mock exam complete
        </p>
        {submissionNotice && (
          <p className="mt-2 text-sm font-semibold text-slate-700">
            {submissionNotice}
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
              {result.passed ? "Pass" : "Not passed"}
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          onClick={onReview}
          type="button"
        >
          Review answers
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road"
          onClick={onRestart}
          type="button"
        >
          Restart mock exam
        </button>
      </div>
    </section>
  );
}
