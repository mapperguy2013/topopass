"use client";

import Link from "next/link";
import { useState } from "react";
import { LOCAL_LEARNER_ID } from "@/lib/db/localPersistence";
import { savePracticeAttempt } from "@/lib/db/practiceAttemptRepository";
import {
  scoreSeruReadingQuestion,
  type SeruReadingQuestion
} from "@/lib/seruReadingQuestions";
import {
  upsertPracticeSessionResult,
  type PracticeSessionResult
} from "@/lib/practice/practiceSession";
import { PracticeSessionSummaryPanel } from "@/src/components/practice/PracticeSessionPanels";
import { QuestionExplanation } from "@/src/components/questions/QuestionExplanation";

type SaveStatus = "idle" | "saving" | "saved" | "failed";

type SeruReadingComprehensionPracticeFlowProps = {
  questions: SeruReadingQuestion[];
};

function EmptyReadingState() {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
      <h2 className="text-lg font-bold text-amber-950">
        No reading questions are available
      </h2>
      <p className="mt-2 leading-6">
        Try PHV Handbook or SERU English practice while this set is being
        prepared.
      </p>
      <Link
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        href="/practice/seru"
      >
        Back to SERU practice
      </Link>
    </section>
  );
}

export function SeruReadingComprehensionPracticeFlow({
  questions
}: SeruReadingComprehensionPracticeFlowProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [sessionResults, setSessionResults] = useState<PracticeSessionResult[]>(
    []
  );
  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) return <EmptyReadingState />;

  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isCorrect = scoreSeruReadingQuestion(currentQuestion, selectedAnswer);
  const answerStatusId = `${currentQuestion.id}-reading-answer-status`;
  const answerStatusMessage = hasSubmitted
    ? "Answer checked. Review the explanation before moving on."
    : selectedAnswer
      ? "Answer selected. You can change it before checking."
      : "Choose an answer after reading the passage.";

  function resetAnswer() {
    setSelectedAnswer(null);
    setHasSubmitted(false);
    setSaveStatus("idle");
  }

  function selectQuestion(index: number) {
    setCurrentQuestionIndex(index);
    resetAnswer();
  }

  async function submitAnswer() {
    if (!selectedAnswer) return;

    setHasSubmitted(true);
    setSaveStatus("saving");
    const score = isCorrect ? 1 : 0;

    setSessionResults((current) =>
      upsertPracticeSessionResult(current, {
        questionId: currentQuestion.id,
        prompt: currentQuestion.question,
        questionType: "knowledge",
        topic: currentQuestion.category,
        difficulty: currentQuestion.difficulty,
        passed: isCorrect,
        percentage: score * 100,
        learnerAnswer: selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        feedback: currentQuestion.explanation
      })
    );

    const result = await savePracticeAttempt({
      userId: LOCAL_LEARNER_ID,
      practiceMode: "knowledge",
      questionId: currentQuestion.id,
      questionType: "knowledge",
      answer: {
        selectedAnswer,
        questionSubtype: "reading_comprehension"
      },
      result: {
        correctAnswer: currentQuestion.correctAnswer,
        explanation: currentQuestion.explanation,
        handbookSection: currentQuestion.handbookSection,
        passage: currentQuestion.passage,
        passageTitle: currentQuestion.title,
        questionFamily: "seru",
        questionSubtype: "reading_comprehension",
        category: currentQuestion.category,
        source: currentQuestion.source,
        tip: "Read the whole passage first, then match the answer to the exact detail or meaning in the text.",
        topic: currentQuestion.topic
      },
      score,
      maxScore: 1,
      passed: isCorrect
    });

    setSaveStatus(result.persisted ? "saved" : "failed");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-orange-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
              SERU Reading and Understanding
            </p>
            <h2 className="mt-1 text-xl font-bold text-ink">
              Short-passage reading practice
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Read each passage carefully, answer one question, then review the
              explanation and the relevant PHV/SERU topic.
            </p>
          </div>
          <div className="rounded-md bg-orange-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
              Available
            </p>
            <p className="mt-1 text-2xl font-bold text-ink">{questions.length}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-orange-700">
          Question {currentQuestionIndex + 1} of {questions.length}
        </p>
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Passage
          </p>
          <h2 className="mt-2 text-2xl font-bold text-ink">
            {currentQuestion.title}
          </h2>
          <p className="mt-3 text-base leading-8 text-slate-700">
            {currentQuestion.passage}
          </p>
        </div>

        <div className="mt-5">
          <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
            Question
          </p>
          <h3 className="mt-2 text-xl font-bold text-ink">
            {currentQuestion.question}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {currentQuestion.handbookSection} - {currentQuestion.topic}
          </p>
        </div>

        <p
          aria-live="polite"
          className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
          id={answerStatusId}
        >
          {answerStatusMessage}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {currentQuestion.options.map((option) => (
            <button
              aria-pressed={selectedAnswer === option}
              className={`min-h-12 rounded-md border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 ${
                selectedAnswer === option
                  ? "border-orange-500 bg-orange-50 text-orange-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-orange-500"
              }`}
              disabled={hasSubmitted}
              key={option}
              onClick={() => {
                setSelectedAnswer(option);
                setSaveStatus("idle");
              }}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            aria-describedby={answerStatusId}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!selectedAnswer || hasSubmitted}
            onClick={submitAnswer}
            type="button"
          >
            {selectedAnswer ? "Check answer" : "Choose an answer to continue"}
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-orange-500 hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            onClick={resetAnswer}
            type="button"
          >
            Try again
          </button>
        </div>

        {hasSubmitted && (
          <div
            className={`mt-5 rounded-md border p-4 ${
              isCorrect
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <p
              className={`text-xl font-bold ${
                isCorrect ? "text-green-800" : "text-red-800"
              }`}
            >
              {isCorrect ? "Correct" : "Incorrect"}
            </p>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-md bg-white/80 p-3">
                <dt className="font-semibold text-slate-600">Your answer</dt>
                <dd className="mt-1 text-slate-900">{selectedAnswer}</dd>
              </div>
              <div className="rounded-md bg-white/80 p-3">
                <dt className="font-semibold text-slate-600">Correct answer</dt>
                <dd className="mt-1 text-slate-900">
                  {currentQuestion.correctAnswer}
                </dd>
              </div>
            </dl>
            <div className="mt-4">
              <QuestionExplanation
                explanation={currentQuestion.explanation}
                tip="Look back at the passage and underline the sentence that supports the answer."
              />
            </div>
            {saveStatus !== "idle" && (
              <p className="mt-3 text-sm font-semibold text-slate-700">
                {saveStatus === "saving" && "Saving practice attempt..."}
                {saveStatus === "saved" &&
                  "Practice attempt saved to your progress history."}
                {saveStatus === "failed" &&
                  "Practice attempt could not be saved in this browser."}
              </p>
            )}
          </div>
        )}
      </section>

      <nav className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-500 hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          href="/practice/seru"
        >
          Back to SERU practice
        </Link>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-500 hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:text-slate-300"
          disabled={isFirstQuestion}
          onClick={() => selectQuestion(currentQuestionIndex - 1)}
          type="button"
        >
          Previous question
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300 sm:ml-auto"
          disabled={isLastQuestion || !hasSubmitted}
          onClick={() => selectQuestion(currentQuestionIndex + 1)}
          type="button"
        >
          Next question
        </button>
      </nav>

      <PracticeSessionSummaryPanel results={sessionResults} />
    </div>
  );
}
