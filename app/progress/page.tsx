import { AppShell } from "@/components/layout/AppShell";
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
      <ProgressDashboard />
    </AppShell>
  );
}
