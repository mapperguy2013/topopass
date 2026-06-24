import { AppShell } from "@/components/layout/AppShell";
import { KnowledgePracticeFlow } from "@/src/components/practice/KnowledgePracticeFlow";

type PracticePageProps = {
  searchParams?: Promise<{
    topic?: string;
    difficulty?: string;
  }>;
};

export default async function KnowledgePracticePage({
  searchParams
}: PracticePageProps) {
  const filters = await searchParams;

  return (
    <AppShell title="Knowledge Practice">
      <KnowledgePracticeFlow
        initialDifficulty={filters?.difficulty}
        initialTopic={filters?.topic}
      />
    </AppShell>
  );
}
