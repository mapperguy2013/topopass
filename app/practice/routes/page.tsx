import { AppShell } from "@/components/layout/AppShell";
import { RoutePracticeFlow } from "@/src/components/practice/RoutePracticeFlow";

type PracticePageProps = {
  searchParams?: Promise<{
    topic?: string;
    difficulty?: string;
  }>;
};

export default async function RoutePracticePage({
  searchParams
}: PracticePageProps) {
  const filters = await searchParams;

  return (
    <AppShell title="Route Planning Practice">
      <RoutePracticeFlow
        initialDifficulty={filters?.difficulty}
        initialTopic={filters?.topic}
      />
    </AppShell>
  );
}
