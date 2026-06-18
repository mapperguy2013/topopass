"use client";

import { useCallback, useMemo, useState } from "react";
import {
  mockTestQuestions,
  type MockTestQuestion
} from "@/lib/mockTestQuestions";
import { QuestionFeedback } from "@/components/questions/QuestionFeedback";
import {
  MapClickQuestion,
  type MapClickQuestionResult
} from "@/src/components/questions/MapClickQuestion";

type AnswerState = {
  answered: boolean;
  isCorrect: boolean;
};

function MultipleChoiceMockQuestion({
  question,
  onAnswer
}: {
  question: Extract<MockTestQuestion, { type: "multiple-choice" }>;
  onAnswer: (isCorrect: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(option: string) {
    const isCorrect = option === question.correctOption;

    setSelected(option);
    onAnswer(isCorrect);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-wide text-road">
        Multiple choice
      </p>
      <h2 className="mt-3 text-2xl font-bold text-ink">{question.title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {question.description}
      </p>
      <h3 className="mt-5 text-base font-semibold text-ink">
        {question.question}
      </h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => (
          <button
            className={`rounded-md border px-4 py-3 text-left text-sm font-medium transition ${
              selected === option
                ? "border-road bg-blue-50 text-road"
                : "border-slate-200 bg-white text-slate-700 hover:border-road"
            }`}
            key={option}
            onClick={() => handleSelect(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
      {selected && (
        <QuestionFeedback
          status={selected === question.correctOption ? "correct" : "incorrect"}
          message={
            selected === question.correctOption ? "Correct" : "Try again"
          }
        />
      )}
    </section>
  );
}

export function MockTestFlow() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const currentQuestion = mockTestQuestions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id];
  const isLastQuestion = currentQuestionIndex === mockTestQuestions.length - 1;

  const score = useMemo(
    () =>
      Object.values(answers).filter((answer) => answer.isCorrect).length,
    [answers]
  );

  const saveAnswer = useCallback(
    (questionId: string, isCorrect: boolean) => {
      setAnswers((previousAnswers) => ({
        ...previousAnswers,
        [questionId]: {
          answered: true,
          isCorrect
        }
      }));
    },
    []
  );

  const handleMapAnswer = useCallback(
    (result: MapClickQuestionResult) => {
      saveAnswer(currentQuestion.id, result.isCorrect);
    },
    [currentQuestion.id, saveAnswer]
  );

  function goToNextQuestion() {
    setCurrentQuestionIndex((index) =>
      Math.min(index + 1, mockTestQuestions.length - 1)
    );
  }

  function restartMockTest() {
    setAnswers({});
    setCurrentQuestionIndex(0);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-600">
              Question {currentQuestionIndex + 1} of {mockTestQuestions.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Score so far: {score}/{mockTestQuestions.length}
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-road hover:text-road"
            onClick={restartMockTest}
            type="button"
          >
            Restart
          </button>
        </div>
      </div>

      {currentQuestion.type === "multiple-choice" ? (
        <MultipleChoiceMockQuestion
          question={currentQuestion}
          onAnswer={(isCorrect) => saveAnswer(currentQuestion.id, isCorrect)}
        />
      ) : (
        <MapClickQuestion
          title={currentQuestion.title}
          description={currentQuestion.description}
          target={currentQuestion.target}
          passRadiusMetres={currentQuestion.passRadiusMetres}
          initialCenter={currentQuestion.initialCenter}
          initialZoom={currentQuestion.initialZoom}
          onAnswer={handleMapAnswer}
        />
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          {currentAnswer?.answered
            ? "Answer saved. You can continue when ready."
            : "Answer this question to continue."}
        </p>
        {isLastQuestion ? (
          <button
            className="inline-flex items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!currentAnswer?.answered}
            onClick={restartMockTest}
            type="button"
          >
            Finish and restart
          </button>
        ) : (
          <button
            className="inline-flex items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!currentAnswer?.answered}
            onClick={goToNextQuestion}
            type="button"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
