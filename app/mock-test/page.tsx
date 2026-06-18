import { AppShell } from "@/components/layout/AppShell";
import { QuestionCard } from "@/components/questions/QuestionCard";
import { ClickMapQuestion } from "@/components/questions/ClickMapQuestion";

export default function MockTestPage() {
  return (
    <AppShell title="Mock Test">
      <QuestionCard
        title="Demo mock test"
        description="Placeholder timed test experience using the same components as practice mode."
      >
        <ClickMapQuestion prompt="Click the requested location on the map." />
      </QuestionCard>
    </AppShell>
  );
}
