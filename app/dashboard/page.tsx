import { AppShell } from "@/components/layout/AppShell";
import { StatsCard } from "@/components/dashboard/StatsCard";
import Link from "next/link";

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
          Completed practice attempts and mock exams now save to local browser
          progress. Use Practice or Mock Test to create new records.
        </p>
        <Link
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          href="/progress"
        >
          View progress
        </Link>
      </section>
    </AppShell>
  );
}
