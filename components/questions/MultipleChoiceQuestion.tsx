"use client";

import { useState } from "react";
import { QuestionFeedback } from "@/components/questions/QuestionFeedback";

type MultipleChoiceQuestionProps = {
  question: string;
  options: string[];
};

export function MultipleChoiceQuestion({
  question,
  options
}: MultipleChoiceQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div>
      <h3 className="text-base font-semibold text-ink">{question}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <button
            className={`rounded-md border px-4 py-3 text-left text-sm font-medium transition ${
              selected === option
                ? "border-road bg-blue-50 text-road"
                : "border-slate-200 bg-white text-slate-700 hover:border-road"
            }`}
            key={option}
            onClick={() => setSelected(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
      {selected && (
        <QuestionFeedback
          status="neutral"
          message="Answer selected for this local session."
        />
      )}
    </div>
  );
}
