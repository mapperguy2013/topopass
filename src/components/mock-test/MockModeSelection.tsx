import { DEFAULT_MOCK_EXAM_CONFIG, getMockExamQuestionTotal } from "@/lib/mockExamConfig";
import { trackEvent } from "@/lib/analytics/events";
import {
  MOCK_EXAM_MODES,
  type MockExamModeId
} from "@/lib/mockExamModes";

type MockModeSelectionProps = {
  message?: string | null;
  onStart: (mode: MockExamModeId) => void;
};

export function MockModeSelection({ message, onStart }: MockModeSelectionProps) {
  const totalQuestions = getMockExamQuestionTotal(DEFAULT_MOCK_EXAM_CONFIG);
  function handleStart(mode: MockExamModeId) {
    trackEvent("mock_exam_start_click", {
      mode,
      location: "mock-mode-selection"
    });
    onStart(mode);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-road">
          Mock exam modes
        </p>
        <h2 className="mt-2 text-3xl font-bold text-ink">
          Choose your mock exam mode
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Pick a standard mixed mock, a stricter exam simulation, or a focused
          mock based on saved progress and previous mistakes.
        </p>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <dt className="font-bold text-ink">Questions</dt>
            <dd className="mt-1 text-slate-600">{totalQuestions} per mock</dd>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <dt className="font-bold text-ink">Time limit</dt>
            <dd className="mt-1 text-slate-600">
              {DEFAULT_MOCK_EXAM_CONFIG.durationMinutes} minutes
            </dd>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <dt className="font-bold text-ink">Pass mark</dt>
            <dd className="mt-1 text-slate-600">
              {DEFAULT_MOCK_EXAM_CONFIG.passPercentage}%
            </dd>
          </div>
        </dl>
      </div>

      {message && (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          {message}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {Object.values(MOCK_EXAM_MODES).map((mode) => (
          <article
            className={`rounded-lg border bg-white p-5 shadow-sm ${
              mode.examStyle ? "border-ink" : "border-slate-200"
            }`}
            key={mode.id}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {mode.examStyle ? "Exam-style" : "Practice"}
                </p>
                <h3 className="mt-2 text-xl font-bold text-ink">
                  {mode.label}
                </h3>
              </div>
              {mode.id === "weak-areas" || mode.id === "mistakes" ? (
                <span className="w-fit rounded-md bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-road">
                  Uses progress
                </span>
              ) : null}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {mode.description}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>Timer visible during the mock</li>
              <li>Feedback and explanations shown after final submission</li>
              {mode.id === "weak-areas" && (
                <li>Falls back to a mixed mock if progress data is limited</li>
              )}
              {mode.id === "mistakes" && (
                <li>Requires saved incorrect answers to start</li>
              )}
            </ul>
            <button
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-road px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 sm:w-auto"
              onClick={() => handleStart(mode.id)}
              type="button"
            >
              Start {mode.label}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
