import { AppShell } from "@/components/layout/AppShell";
import { getUpgradeCtaForFeature } from "@/lib/plans/entitlements";
import { buildPageMetadata } from "@/lib/seo";
import { ProgressDashboard } from "@/src/components/progress/ProgressDashboard";

export const metadata = buildPageMetadata({
  title: "Progress",
  description:
    "Review TopoPass practice progress, mock exam history, mistakes, topic strengths, and weak areas.",
  path: "/progress"
});

export default function ProgressPage() {
  return (
    <AppShell title="Progress">
      <section className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-bold uppercase tracking-wide text-amber-900">
          Beta plan note
        </p>
        <h2 className="mt-2 text-lg font-bold text-ink">
          Advanced progress insights are planned
        </h2>
        <p className="mt-2 text-sm leading-6 text-amber-950">
          Current progress, mistakes, review history, and recommendations remain
          available. {getUpgradeCtaForFeature("advanced-progress-insights")} for
          deeper topic analytics and future cross-device progress.
        </p>
      </section>
      <ProgressDashboard />
    </AppShell>
  );
}
