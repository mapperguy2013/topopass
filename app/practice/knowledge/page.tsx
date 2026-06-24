import { AppShell } from "@/components/layout/AppShell";
import { KnowledgePracticeFlow } from "@/src/components/practice/KnowledgePracticeFlow";

export default function KnowledgePracticePage() {
  return (
    <AppShell title="Knowledge Practice">
      <KnowledgePracticeFlow />
    </AppShell>
  );
}
