import { AppShell } from "@/components/layout/AppShell";
import { MistakeReview } from "@/src/components/progress/MistakeReview";

export default function ProgressMistakesPage() {
  return (
    <AppShell title="Mistake Review">
      <MistakeReview />
    </AppShell>
  );
}
