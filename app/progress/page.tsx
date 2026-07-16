import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import { ExamReadinessDashboard } from "@/src/components/progress/ExamReadinessDashboard";
import { ProgressDashboard } from "@/src/components/progress/ProgressDashboard";

export const metadata = buildPageMetadata({
  title: "Progress",
  description:
    "Review TopoPass practice progress, exam readiness, score trends, and latest attempts.",
  path: "/progress"
});

export default function ProgressPage() {
  return (
    <AppShell title="Progress">
      <div className="min-w-0 space-y-5">
        <ExamReadinessDashboard />
        <ProgressDashboard />
      </div>
    </AppShell>
  );
}
