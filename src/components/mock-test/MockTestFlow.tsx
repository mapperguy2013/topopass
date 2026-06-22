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
  summary: string;
};

function MultipleChoiceMockQuestion({
  question,
  onAnswer
}: {
  question: Extract<MockTestQuestion, { type: "multiple-choice" }>;
  onAnswer: (isCorrect: boolean, summary: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(option: string) {
    const isCorrect = option === question.correctOption;

    setSelected(option);
    onAnswer(isCorrect, `Selected: ${option}`);
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

function getQuestionLabel(question: MockTestQuestion) {
  return question.type === "multiple-choice" ? question.title : question.prompt;
}

export function MockTestFlow() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [isFinished, setIsFinished] = useState(false);
  const currentQuestion = mockTestQuestions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id];
  const isLastQuestion = currentQuestionIndex === mockTestQuestions.length - 1;

  const score = useMemo(
    () =>
      Object.values(answers).filter((answer) => answer.isCorrect).length,
    [answers]
  );

  const saveAnswer = useCallback(
    (questionId: string, isCorrect: boolean, summary: string) => {
      setAnswers((previousAnswers) => ({
        ...previousAnswers,
        [questionId]: {
          answered: true,
          isCorrect,
          summary
        }
      }));
    },
    []
  );

  const handleMapAnswer = useCallback(
    (result: MapClickQuestionResult) => {
      saveAnswer(
        currentQuestion.id,
        result.isCorrect,
        `Distance: ${Math.round(result.distance)} metres`
      );
    },
    [currentQuestion.id, saveAnswer]
  );

  const resetCurrentAnswer = useCallback(() => {
    setAnswers((previousAnswers) => {
      const nextAnswers = { ...previousAnswers };
      delete nextAnswers[currentQuestion.id];
      return nextAnswers;
    });
  }, [currentQuestion.id]);

  function goToNextQuestion() {
    setCurrentQuestionIndex((index) =>
      Math.min(index + 1, mockTestQuestions.length - 1)
    );
  }

  function finishMockTest() {
    setIsFinished(true);
  }

  function restartMockTest() {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setIsFinished(false);
  }

  if (isFinished) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-road">
          Mock test complete
        </p>
        <h2 className="mt-3 text-3xl font-bold text-ink">
          Final score: {score}/{mockTestQuestions.length}
        </h2>
        <div className="mt-6 space-y-3">
          {mockTestQuestions.map((question, index) => {
            const answer = answers[question.id];

            return (
              <article
                className="rounded-md border border-slate-200 bg-slate-50 p-4"
                key={question.id}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Question {index + 1} -{" "}
                      {question.type === "multiple-choice"
                        ? "Multiple choice"
                        : "Map click"}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-ink">
                      {getQuestionLabel(question)}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {answer?.summary ?? "Not answered"}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-bold ${
                      answer?.isCorrect ? "text-success" : "text-red-700"
                    }`}
                  >
                    {answer?.isCorrect ? "Correct" : "Try again"}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
        <button
          className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-road px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
          onClick={restartMockTest}
          type="button"
        >
          Try again
        </button>
      </section>
    );
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
          onAnswer={(isCorrect, summary) =>
            saveAnswer(currentQuestion.id, isCorrect, summary)
          }
        />
      ) : (
        <MapClickQuestion
          key={currentQuestion.id}
          title={currentQuestion.prompt}
          description={currentQuestion.description}
          target={currentQuestion.target}
          passRadiusMetres={currentQuestion.allowedDistanceMeters}
          initialCenter={currentQuestion.initialCenter}
          initialZoom={currentQuestion.initialZoom}
          onAnswer={handleMapAnswer}
          onAnswerReset={resetCurrentAnswer}
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
            onClick={finishMockTest}
            type="button"
          >
            Finish test
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
