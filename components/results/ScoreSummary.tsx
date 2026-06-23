type ScoreSummaryProps = {
  score: number;
  total: number;
  attemptId: string;
};

export function ScoreSummary({ score, total, attemptId }: ScoreSummaryProps) {
  const hasStoredScore = total > 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Attempt {attemptId}
      </p>
      <h2 className="mt-2 text-3xl font-bold text-ink">
        {hasStoredScore ? `${score}/${total}` : "No saved result"}
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {hasStoredScore
          ? "This attempt score is available for review."
          : "Phase 1 mock exam results are held inside the active browser session and are not loaded by attempt ID yet."}
      </p>
    </section>
  );
}
