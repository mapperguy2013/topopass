"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LOCAL_LEARNER_ID } from "@/lib/db/localPersistence";
import { orderQuestionsByRetryQueue } from "@/lib/db/mistakeRetryQueue";
import { savePracticeAttempt } from "@/lib/db/practiceAttemptRepository";
import {
  knowledgeQuestionBank,
  type KnowledgeQuestionData
} from "@/lib/knowledgeQuestions";
import {
  filterByPracticeFilter,
  normalizePracticeQuestionFilter,
  upsertPracticeSessionResult,
  type PracticeSessionResult
} from "@/lib/practice/practiceSession";
import {
  PracticeEmptyState,
  PracticeSessionIntro,
  PracticeSessionSummaryPanel
} from "@/src/components/practice/PracticeSessionPanels";
import { QuestionExplanation } from "@/src/components/questions/QuestionExplanation";

const basePracticeQuestions = knowledgeQuestionBank.filter(
  (question) => question.isActive
);

type KnowledgePracticeFlowProps = {
  initialTopic?: string;
  initialDifficulty?: string;
  questions?: KnowledgeQuestionData[];
  baseHref?: string;
  title?: string;
  questionTypeLabel?: string;
  emptyQuestionTypeLabel?: string;
  retryQueueType?: "knowledge";
  practiceFamily?: "topographical" | "seru";
};

export function KnowledgePracticeFlow({
  baseHref = "/practice/knowledge",
  emptyQuestionTypeLabel = "knowledge",
  practiceFamily = "topographical",
  questionTypeLabel = "knowledge",
  questions = basePracticeQuestions,
  initialTopic,
  initialDifficulty,
  retryQueueType = "knowledge",
  title = "Knowledge practice"
}: KnowledgePracticeFlowProps) {
  const filter = useMemo(
    () => normalizePracticeQuestionFilter(initialTopic, initialDifficulty),
    [initialDifficulty, initialTopic]
  );
  const filteredBaseQuestions = useMemo(
    () => filterByPracticeFilter(questions, filter),
    [filter, questions]
  );
  const [practiceQuestions, setPracticeQuestions] =
    useState(filteredBaseQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [sessionResults, setSessionResults] = useState<PracticeSessionResult[]>(
    []
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "failed">(
    "idle"
  );
  const currentQuestion = practiceQuestions[currentQuestionIndex];

  useEffect(() => {
    setPracticeQuestions(
      orderQuestionsByRetryQueue(filteredBaseQuestions, retryQueueType)
    );
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setHasSubmitted(false);
    setSaveStatus("idle");
  }, [filteredBaseQuestions, retryQueueType]);

  if (!currentQuestion) {
    return (
      <PracticeEmptyState
        filter={filter}
        questionTypeLabel={emptyQuestionTypeLabel}
      />
    );
  }

  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === practiceQuestions.length - 1;
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
  const answerStatusId = `${currentQuestion.id}-knowledge-answer-status`;
  const answerStatusMessage = hasSubmitted
    ? "Answer checked. Review the feedback before moving on."
    : selectedAnswer
      ? "Answer selected. You can change it before checking."
      : "Choose an answer before checking.";

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
        prompt: currentQuestion.prompt,
        questionType: "knowledge",
        topic: currentQuestion.category,
        difficulty: currentQuestion.difficulty,
        passed: isCorrect,
        percentage: score * 100,
        learnerAnswer: selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        feedback: isCorrect
          ? "This answer matches the accepted response."
          : (currentQuestion.incorrectExplanations?.[selectedAnswer] ??
            currentQuestion.explanation ??
            null)
      })
    );
    const result = await savePracticeAttempt({
      userId: LOCAL_LEARNER_ID,
      practiceMode: "knowledge",
      questionId: currentQuestion.id,
      questionType: "knowledge",
      answer: { selectedAnswer },
      result: {
        correctAnswer: currentQuestion.correctAnswer,
        explanation: currentQuestion.explanation,
        handbookSection: currentQuestion.handbookSection,
        questionFamily: currentQuestion.questionFamily ?? practiceFamily,
        source: currentQuestion.source,
        tip: currentQuestion.tip,
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
      <PracticeSessionIntro
        baseHref={baseHref}
        filter={filter}
        questionCount={practiceQuestions.length}
        questionType={questionTypeLabel}
        title={title}
      />

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-road">
          Question {currentQuestionIndex + 1} of {practiceQuestions.length}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-ink">
          {currentQuestion.prompt}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {currentQuestion.category} - {currentQuestion.difficulty}
        </p>
        {currentQuestion.handbookSection && (
          <p className="mt-2 rounded-md bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-900">
            {currentQuestion.handbookSection}
            {currentQuestion.topic ? ` - ${currentQuestion.topic}` : ""}
          </p>
        )}
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
              className={`min-h-12 rounded-md border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road ${
                selectedAnswer === option
                  ? "border-road bg-blue-50 text-road"
                  : "border-slate-200 bg-white text-slate-700 hover:border-road"
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
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!selectedAnswer || hasSubmitted}
            onClick={submitAnswer}
            type="button"
          >
            {selectedAnswer ? "Check answer" : "Choose an answer to continue"}
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
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
            <p className="mt-2 text-sm text-slate-700">
              Correct answer:{" "}
              <span className="font-semibold">
                {currentQuestion.correctAnswer}
              </span>
            </p>
            {!isCorrect &&
              selectedAnswer &&
              currentQuestion.incorrectExplanations?.[selectedAnswer] && (
                <p className="mt-3 rounded-md border border-red-200 bg-white/80 p-3 text-sm text-red-900">
                  {currentQuestion.incorrectExplanations[selectedAnswer]}
                </p>
              )}
            <div className="mt-4">
              <QuestionExplanation
                explanation={currentQuestion.explanation}
                tip={currentQuestion.tip}
              />
            </div>
            {currentQuestion.source && (
              <p className="mt-3 rounded-md border border-orange-100 bg-white/80 p-3 text-sm text-orange-900">
                Source area: {currentQuestion.source}
                {currentQuestion.handbookSection
                  ? ` - ${currentQuestion.handbookSection}`
                  : ""}
              </p>
            )}
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
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
          href="/practice"
        >
          Back to Practice
        </Link>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road disabled:cursor-not-allowed disabled:text-slate-300"
          disabled={isFirstQuestion}
          onClick={() => selectQuestion(currentQuestionIndex - 1)}
          type="button"
        >
          Previous question
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road disabled:cursor-not-allowed disabled:bg-slate-300 sm:ml-auto"
          disabled={isLastQuestion}
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
