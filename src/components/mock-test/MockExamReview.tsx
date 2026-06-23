import type {
  MockExamResult,
  MockQuestionScoreResult
} from "@/lib/mockExamEngine";
import type { MockExamQuestion } from "@/lib/mockTestQuestions";

type MockExamReviewProps = {
  questions: MockExamQuestion[];
  result: MockExamResult;
  onBack: () => void;
  onRestart: () => void;
};

const typeLabels = {
  knowledge: "Knowledge",
  "map-click": "Map click",
  "route-drawing": "Route drawing"
} as const;

function formatMetres(value: number) {
  return Number.isFinite(value) ? `${Math.round(value)}m` : "Not available";
}

function ScoreDetails({ result }: { result: MockQuestionScoreResult }) {
  if (result.details.type === "map-click") {
    return (
      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-slate-500">Distance from target</dt>
          <dd className="mt-1 text-slate-800">
            {formatMetres(result.details.distanceMeters)}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Tolerance</dt>
          <dd className="mt-1 text-slate-800">
            {result.details.toleranceMeters}m
          </dd>
        </div>
      </dl>
    );
  }

  if (result.details.type === "route-drawing" && result.details.routeScore) {
    const routeScore = result.details.routeScore;
    return (
      <div className="mt-3 border-t border-slate-200 pt-3">
        <dl className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="font-semibold text-slate-500">Start distance</dt>
            <dd className="mt-1 text-slate-800">
              {formatMetres(routeScore.startDistanceMeters)}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">End distance</dt>
            <dd className="mt-1 text-slate-800">
              {formatMetres(routeScore.endDistanceMeters)}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Length ratio</dt>
            <dd className="mt-1 text-slate-800">
              {Math.round(routeScore.lengthRatio * 100)}%
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Route score</dt>
            <dd className="mt-1 text-slate-800">{routeScore.percentage}%</dd>
          </div>
        </dl>
        {routeScore.penalties.length > 0 && (
          <div className="mt-3 text-xs text-red-800">
            <p className="font-bold">Penalties</p>
            <ul className="mt-1 space-y-1">
              {routeScore.penalties.map((penalty) => (
                <li key={penalty}>{penalty}</li>
              ))}
            </ul>
          </div>
        )}
        {routeScore.warnings.length > 0 && (
          <div className="mt-3 text-xs text-amber-900">
            <p className="font-bold">Warnings</p>
            <ul className="mt-1 space-y-1">
              {routeScore.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
        {routeScore.feedback.length > 0 && (
          <div className="mt-3 text-xs text-slate-700">
            <p className="font-bold">Feedback</p>
            <ul className="mt-1 space-y-1">
              {routeScore.feedback.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export function MockExamReview({
  questions,
  result,
  onBack,
  onRestart
}: MockExamReviewProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-y border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Answer review
          </p>
          <h2 className="mt-1 text-2xl font-bold text-ink">
            Review all questions
          </h2>
        </div>
        <p className="text-sm font-semibold text-slate-600">
          Final score: {result.percentage}%
        </p>
      </div>

      <div className="space-y-4">
        {result.questionResults.map((questionResult, index) => {
          const question = questions[index];
          return (
            <article
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              key={questionResult.questionId}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Question {index + 1} - {typeLabels[questionResult.type]}
                  </p>
                  <h3 className="mt-2 text-base font-bold text-ink">
                    {question.prompt}
                  </h3>
                </div>
                <span
                  className={`w-fit rounded-md px-3 py-1.5 text-xs font-bold uppercase ${
                    questionResult.passed
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {questionResult.passed ? "Passed" : "Not passed"}
                </span>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-md bg-slate-50 p-3">
                  <dt className="font-semibold text-slate-500">Your answer</dt>
                  <dd className="mt-1 text-slate-800">
                    {questionResult.userAnswerSummary}
                  </dd>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <dt className="font-semibold text-slate-500">
                    Correct / accepted answer
                  </dt>
                  <dd className="mt-1 text-slate-800">
                    {questionResult.acceptedAnswerSummary}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-sm font-bold text-slate-700">
                Score: {questionResult.score}/{questionResult.maxScore} ({questionResult.percentage}%)
              </p>
              <ScoreDetails result={questionResult} />
            </article>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road"
          onClick={onBack}
          type="button"
        >
          Back to results
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          onClick={onRestart}
          type="button"
        >
          Restart mock exam
        </button>
      </div>
    </section>
  );
}
