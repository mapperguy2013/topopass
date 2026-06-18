import { ClickQuestionMap } from "@/components/map/ClickQuestionMap";

type ClickMapQuestionProps = {
  prompt: string;
};

export function ClickMapQuestion({ prompt }: ClickMapQuestionProps) {
  return (
    <div>
      <h3 className="mb-4 text-base font-semibold text-ink">{prompt}</h3>
      <ClickQuestionMap />
    </div>
  );
}
