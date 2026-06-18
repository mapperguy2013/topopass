type ScoreSummaryProps = {
  score: number;
  total: number;
  attemptId: string;
};

export function ScoreSummary({ score, total, attemptId }: ScoreSummaryProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Attempt {attemptId}
      </p>
      <h2 className="mt-2 text-3xl font-bold text-ink">
        {score}/{total}
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Placeholder results summary. Scoring rules will be added later.
      </p>
    </section>
  );
}
