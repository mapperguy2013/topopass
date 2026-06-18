import { AppShell } from "@/components/layout/AppShell";
import { QuestionReview } from "@/components/results/QuestionReview";
import { ScoreSummary } from "@/components/results/ScoreSummary";

type ResultsPageProps = {
  params: Promise<{
    attemptId: string;
  }>;
};

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { attemptId } = await params;

  return (
    <AppShell title="Results">
      <ScoreSummary score={0} total={0} attemptId={attemptId} />
      <div className="mt-6">
        <QuestionReview />
      </div>
    </AppShell>
  );
}
