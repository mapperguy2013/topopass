import type { MockScoreRingSummary } from "@/lib/mockExamScoreSummary";

type MockScoreRingProps = {
  summary: MockScoreRingSummary;
};

export function MockScoreRing({ summary }: MockScoreRingProps) {
  const correctPercent =
    summary.totalQuestions === 0
      ? 0
      : Math.round((summary.correct / summary.totalQuestions) * 100);
  const background =
    summary.totalQuestions === 0
      ? "#e2e8f0"
      : `conic-gradient(#16a34a 0% ${correctPercent}%, #dc2626 ${correctPercent}% 100%)`;

  return (
    <div
      aria-label={`Mock score ${summary.percentage} percent, ${summary.correct} passed and ${summary.wrong} not passed`}
      className="relative flex size-44 shrink-0 items-center justify-center rounded-full"
      role="img"
      style={{ background }}
    >
      <div className="flex size-32 flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
        <span className="text-3xl font-bold text-ink">
          {summary.percentage}%
        </span>
        <span
          className={`mt-1 text-xs font-bold uppercase tracking-wide ${
            summary.passed ? "text-green-700" : "text-red-700"
          }`}
        >
          {summary.resultLabel}
        </span>
      </div>
    </div>
  );
}
