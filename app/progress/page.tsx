import { AppShell } from "@/components/layout/AppShell";
import { ProgressDashboard } from "@/src/components/progress/ProgressDashboard";

export default function ProgressPage() {
  return (
    <AppShell title="Progress">
      <ProgressDashboard />
    </AppShell>
  );
}
