import {
  getMockExamQuestionTotal,
  type MockExamConfig
} from "@/lib/mockExamConfig";

type MockExamIntroProps = {
  config: MockExamConfig;
  onStart: () => void;
};

export function MockExamIntro({ config, onStart }: MockExamIntroProps) {
  const totalQuestions = getMockExamQuestionTotal(config);

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-6 sm:px-7">
        <p className="text-sm font-bold uppercase tracking-wide text-road">
          Timed practice assessment
        </p>
        <h2 className="mt-2 text-3xl font-bold text-ink">
          Topographical Mock Exam
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Complete a mixed set of knowledge, location, and route-planning
          questions under timed conditions. Correct answers and scoring are
          shown only after submission.
        </p>
      </div>

      <dl className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-5">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Questions
          </dt>
          <dd className="mt-2 text-2xl font-bold text-ink">{totalQuestions}</dd>
        </div>
        <div className="bg-white p-5">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Time limit
          </dt>
          <dd className="mt-2 text-2xl font-bold text-ink">
            {config.durationMinutes} minutes
          </dd>
        </div>
        <div className="bg-white p-5">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Pass mark
          </dt>
          <dd className="mt-2 text-2xl font-bold text-ink">
            {config.passPercentage}%
          </dd>
        </div>
        <div className="bg-white p-5">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Review
          </dt>
          <dd className="mt-2 text-base font-bold text-ink">
            After submission
          </dd>
        </div>
      </dl>

      <div className="px-5 py-6 sm:px-7">
        <h3 className="text-lg font-bold text-ink">Question types</h3>
        <ul className="mt-3 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
          <li className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <span className="font-bold">Knowledge</span>
            <span className="mt-1 block text-slate-500">
              {config.questionCounts.knowledge} questions
            </span>
          </li>
          <li className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <span className="font-bold">Map click</span>
            <span className="mt-1 block text-slate-500">
              {config.questionCounts["map-click"]} questions
            </span>
          </li>
          <li className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <span className="font-bold">Route drawing</span>
            <span className="mt-1 block text-slate-500">
              {config.questionCounts["route-drawing"]} questions
            </span>
          </li>
        </ul>
        <p className="mt-5 text-sm leading-6 text-slate-600">
          You can move between questions and change saved answers until you
          submit or the timer expires. A refresh will restore the active attempt
          in this browser where possible.
        </p>
        <button
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-road px-6 py-3 text-base font-bold text-white hover:bg-blue-700 sm:w-auto"
          onClick={onStart}
          type="button"
        >
          Start mock exam
        </button>
      </div>
    </section>
  );
}
