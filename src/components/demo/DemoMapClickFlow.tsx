"use client";

import { useCallback, useMemo, useState } from "react";
import {
  demoMapClickQuestions,
  type MapClickQuestionData
} from "@/lib/mapClickQuestions";
import {
  MapClickQuestion,
  type MapClickQuestionResult
} from "@/src/components/questions/MapClickQuestion";

type DemoAnswer = {
  question: MapClickQuestionData;
  result: MapClickQuestionResult;
};

export function DemoMapClickFlow() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] =
    useState<MapClickQuestionResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, DemoAnswer>>({});
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = demoMapClickQuestions[currentQuestionIndex];
  const isLastQuestion =
    currentQuestionIndex === demoMapClickQuestions.length - 1;

  const score = useMemo(
    () =>
      Object.values(answers).filter((answer) => answer.result.isCorrect).length,
    [answers]
  );

  const handleAnswer = useCallback(
    (result: MapClickQuestionResult) => {
      setCurrentAnswer(result);
      setAnswers((previousAnswers) => ({
        ...previousAnswers,
        [currentQuestion.id]: {
          question: currentQuestion,
          result
        }
      }));
    },
    [currentQuestion]
  );

  function goToNextQuestion() {
    setCurrentQuestionIndex((index) =>
      Math.min(index + 1, demoMapClickQuestions.length - 1)
    );
    setCurrentAnswer(null);
  }

  function finishTest() {
    setIsFinished(true);
  }

  function tryAgain() {
    setAnswers({});
    setCurrentAnswer(null);
    setCurrentQuestionIndex(0);
    setIsFinished(false);
  }

  if (isFinished) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-road">
          Demo complete
        </p>
        <h1 className="mt-3 text-3xl font-bold text-ink">
          Final score: {score}/{demoMapClickQuestions.length}
        </h1>
        <div className="mt-6 space-y-3">
          {demoMapClickQuestions.map((question, index) => {
            const answer = answers[question.id];

            return (
              <article
                className="rounded-md border border-slate-200 bg-slate-50 p-4"
                key={question.id}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Question {index + 1}
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-ink">
                      {question.prompt}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                      Distance:{" "}
                      {answer
                        ? `${Math.round(answer.result.distance)} metres`
                        : "Not answered"}
                    </p>
                    {answer && (
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        Clicked {answer.result.coordinates.latitude.toFixed(6)}
                        ,{" "}
                        {answer.result.coordinates.longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                  <p
                    className={`text-sm font-bold ${
                      answer?.result.isCorrect ? "text-success" : "text-red-700"
                    }`}
                  >
                    {answer?.result.isCorrect ? "Correct" : "Try again"}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
        <button
          className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-road px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
          onClick={tryAgain}
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
              Question {currentQuestionIndex + 1} of{" "}
              {demoMapClickQuestions.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Score so far: {score}/{demoMapClickQuestions.length}
            </p>
          </div>
          <p className="rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
            Tolerance: {currentQuestion.toleranceMeters} metres
          </p>
        </div>
      </div>

      <MapClickQuestion
        key={currentQuestion.id}
        title={currentQuestion.prompt}
        description="Click or tap the map to answer this temporary proof-of-concept question."
        target={currentQuestion.answer}
        passRadiusMetres={currentQuestion.toleranceMeters}
        initialCenter={currentQuestion.answer}
        initialZoom={15}
        onAnswer={handleAnswer}
      />

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          {currentAnswer
            ? "Answer saved. Continue when ready."
            : "Answer this map question to continue."}
        </p>
        {isLastQuestion ? (
          <button
            className="inline-flex items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!currentAnswer}
            onClick={finishTest}
            type="button"
          >
            Finish test
          </button>
        ) : (
          <button
            className="inline-flex items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!currentAnswer}
            onClick={goToNextQuestion}
            type="button"
          >
            Next question
          </button>
        )}
      </div>
    </div>
  );
}
