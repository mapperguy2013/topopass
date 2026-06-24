import { AppShell } from "@/components/layout/AppShell";
import { MapClickPracticeFlow } from "@/src/components/practice/MapClickPracticeFlow";

type PracticePageProps = {
  searchParams?: Promise<{
    topic?: string;
    difficulty?: string;
  }>;
};

export default async function MapClickPracticePage({
  searchParams
}: PracticePageProps) {
  const filters = await searchParams;

  return (
    <AppShell title="Map-Click Practice">
      <MapClickPracticeFlow
        initialDifficulty={filters?.difficulty}
        initialTopic={filters?.topic}
      />
    </AppShell>
  );
}
