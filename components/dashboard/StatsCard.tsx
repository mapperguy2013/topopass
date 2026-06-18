type StatsCardProps = {
  label: string;
  value: string;
  helper: string;
};

export function StatsCard({ label, value, helper }: StatsCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </section>
  );
}
