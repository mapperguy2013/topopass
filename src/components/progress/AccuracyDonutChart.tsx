type AccuracyDonutChartProps = {
  correct: number;
  wrong: number;
  accuracyPercent: number;
};

export function AccuracyDonutChart({
  correct,
  wrong,
  accuracyPercent
}: AccuracyDonutChartProps) {
  const total = correct + wrong;
  const correctPercent = total === 0 ? 0 : Math.round((correct / total) * 100);
  const background =
    total === 0
      ? "#e2e8f0"
      : `conic-gradient(#16a34a 0% ${correctPercent}%, #dc2626 ${correctPercent}% 100%)`;

  return (
    <div
      aria-label={`Accuracy ${accuracyPercent} percent, ${correct} correct and ${wrong} wrong`}
      className="relative flex size-40 shrink-0 items-center justify-center rounded-full"
      role="img"
      style={{ background }}
    >
      <div className="flex size-28 flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
        <span className="text-3xl font-bold text-ink">{accuracyPercent}%</span>
        <span className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
          Accuracy
        </span>
      </div>
    </div>
  );
}
