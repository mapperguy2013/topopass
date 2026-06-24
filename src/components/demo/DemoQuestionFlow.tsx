"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { KnowledgeQuestionData } from "@/lib/knowledgeQuestions";

type DemoQuestion = Pick<
  KnowledgeQuestionData,
  | "category"
  | "correctAnswer"
  | "difficulty"
  | "explanation"
  | "id"
  | "options"
  | "prompt"
  | "tip"
>;

type DemoQuestionFlowProps = {
  accent: "blue" | "orange";
  description: string;
  practiceHref: string;
  questions: DemoQuestion[];
  title: string;
};

type SavedAnswer = {
  selectedAnswer: string;
  isCorrect: boolean;
};

const DEMO_SECONDS = 10 * 60;

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function DemoQuestionFlow({
  accent,
  description,
  practiceHref,
  questions,
  title
}: DemoQuestionFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, SavedAnswer>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(DEMO_SECONDS);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const tone =
    accent === "orange"
      ? {
          bg: "bg-orange-600 hover:bg-orange-700",
          border: "border-orange-200",
          light: "bg-orange-50",
          text: "text-orange-700"
        }
      : {
          bg: "bg-road hover:bg-blue-700",
          border: "border-blue-200",
          light: "bg-blue-50",
          text: "text-road"
        };

  useEffect(() => {
    if (isFinished) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsRemaining((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          setIsFinished(true);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isFinished]);

  const score = useMemo(
    () => Object.values(answers).filter((answer) => answer.isCorrect).length,
    [answers]
  );

  function submitAnswer() {
    if (!selectedAnswer || !currentQuestion) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: {
        selectedAnswer,
        isCorrect: selectedAnswer === currentQuestion.correctAnswer
      }
    }));
    setHasSubmitted(true);
  }

  function goNext() {
    if (isLastQuestion) {
      setIsFinished(true);
      return;
    }

    setCurrentIndex((index) => index + 1);
    setSelectedAnswer("");
    setHasSubmitted(false);
  }

  function resetDemo() {
    setCurrentIndex(0);
    setSelectedAnswer("");
    setHasSubmitted(false);
    setAnswers({});
    setSecondsRemaining(DEMO_SECONDS);
    setIsFinished(false);
  }

  if (!currentQuestion) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-ink">Demo unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          There are no demo questions available for this area yet.
        </p>
        <Link
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-3 text-sm font-semibold text-white"
          href="/demo"
        >
          Back to demos
        </Link>
      </section>
    );
  }

  if (isFinished) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className={`text-sm font-bold uppercase tracking-wide ${tone.text}`}>
          Demo complete
        </p>
        <h1 className="mt-3 text-3xl font-bold text-ink">
          Score: {score}/{questions.length}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This short demo is only a preview. Full practice includes topic
          filters, review history, explanations, saved progress, and more
          focused revision tools.
        </p>
        <div className="mt-6 space-y-3">
          {questions.map((question, index) => {
            const answer = answers[question.id];

            return (
              <article
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                key={question.id}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Question {index + 1} - {question.category}
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-ink">
                      {question.prompt}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                      Your answer: {answer?.selectedAnswer ?? "Not answered"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Correct answer: {question.correctAnswer}
                    </p>
                    {question.explanation && (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {question.explanation}
                      </p>
                    )}
                  </div>
                  <p
                    className={`text-sm font-bold ${
                      answer?.isCorrect ? "text-success" : "text-red-700"
                    }`}
                  >
                    {answer?.isCorrect ? "Correct" : "Review"}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            className={`inline-flex min-h-11 items-center justify-center rounded-md px-5 py-3 text-sm font-semibold text-white ${tone.bg}`}
            href={practiceHref}
          >
            Start full practice
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-road hover:text-road"
            href="/auth/sign-up"
          >
            Create account / sign in to save progress
          </Link>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-road hover:text-road"
            onClick={resetDemo}
            type="button"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  const savedAnswer = answers[currentQuestion.id];
  const isCorrect = savedAnswer?.isCorrect ?? false;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-sm font-bold uppercase tracking-wide ${tone.text}`}>
            {title}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
        <div className={`rounded-xl border ${tone.border} ${tone.light} px-4 py-3`}>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Time left
          </p>
          <p className="text-xl font-bold text-ink">
            {formatTime(secondsRemaining)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-600">
          Question {currentIndex + 1} of {questions.length}
        </p>
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
          {currentQuestion.category} - {currentQuestion.difficulty}
        </p>
      </div>

      <h1 className="mt-5 text-2xl font-bold leading-tight text-ink">
        {currentQuestion.prompt}
      </h1>

      <div className="mt-5 grid gap-3">
        {currentQuestion.options.map((option) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOption = hasSubmitted && option === currentQuestion.correctAnswer;
          const isWrongSelection =
            hasSubmitted && isSelected && option !== currentQuestion.correctAnswer;

          return (
            <button
              className={`min-h-12 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road ${
                isCorrectOption
                  ? "border-green-500 bg-green-50 text-green-900"
                  : isWrongSelection
                    ? "border-red-300 bg-red-50 text-red-900"
                    : isSelected
                      ? `${tone.border} ${tone.light} text-ink`
                      : "border-slate-200 bg-white text-slate-700 hover:border-road/50"
              }`}
              disabled={hasSubmitted}
              key={option}
              onClick={() => setSelectedAnswer(option)}
              type="button"
            >
              {option}
            </button>
          );
        })}
      </div>

      {hasSubmitted && (
        <div
          className={`mt-5 rounded-xl border p-4 ${
            isCorrect
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <p
            className={`text-sm font-bold ${
              isCorrect ? "text-green-800" : "text-red-800"
            }`}
          >
            {isCorrect ? "Correct" : "Not quite"}
          </p>
          {currentQuestion.explanation && (
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {currentQuestion.explanation}
            </p>
          )}
          {currentQuestion.tip && (
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Tip: {currentQuestion.tip}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          {hasSubmitted
            ? "Feedback shown. Continue when ready."
            : "Choose one answer to continue."}
        </p>
        {hasSubmitted ? (
          <button
            className={`inline-flex min-h-11 items-center justify-center rounded-md px-5 py-3 text-sm font-semibold text-white ${tone.bg}`}
            onClick={goNext}
            type="button"
          >
            {isLastQuestion ? "Finish demo" : "Next question"}
          </button>
        ) : (
          <button
            className={`inline-flex min-h-11 items-center justify-center rounded-md px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 ${tone.bg}`}
            disabled={!selectedAnswer}
            onClick={submitAnswer}
            type="button"
          >
            Check answer
          </button>
        )}
      </div>
    </section>
  );
}
