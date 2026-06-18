import { AppShell } from "@/components/layout/AppShell";
import { QuestionReview } from "@/components/results/QuestionReview";

export default function ReviewPage() {
  return (
    <AppShell title="Review">
      <QuestionReview />
    </AppShell>
  );
}
