import { AppShell } from "@/components/layout/AppShell";
import { QuestionCard } from "@/components/questions/QuestionCard";
import { MultipleChoiceQuestion } from "@/components/questions/MultipleChoiceQuestion";

export default function PracticePage() {
  return (
    <AppShell title="Practice">
      <QuestionCard
        title="Sample practice question"
        description="Placeholder question flow for map reading and route planning practice."
      >
        <MultipleChoiceQuestion
          question="Which skill would you like to practise first?"
          options={["Map reading", "Directions", "Points of interest", "Routes"]}
        />
      </QuestionCard>
    </AppShell>
  );
}
