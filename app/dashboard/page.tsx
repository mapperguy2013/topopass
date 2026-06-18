import { AppShell } from "@/components/layout/AppShell";
import { StatsCard } from "@/components/dashboard/StatsCard";

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard">
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard label="Practice sessions" value="0" helper="Ready to begin" />
        <StatsCard label="Average score" value="--" helper="No attempts yet" />
        <StatsCard label="Mock tests" value="0" helper="Try a demo test" />
      </div>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Today&apos;s focus</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Placeholder dashboard content for progress, recommendations, and
          recent activity.
        </p>
      </section>
    </AppShell>
  );
}
