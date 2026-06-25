"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type DragEvent } from "react";
import { LOCAL_LEARNER_ID } from "@/lib/db/localPersistence";
import { savePracticeAttempt } from "@/lib/db/practiceAttemptRepository";
import {
  clearAllBlanks,
  clearBlank,
  placeWordInBlank,
  scoreMultiSentenceCompletion,
  scoreSentenceCompletion,
  type MultiSentenceCompletionQuestion,
  type SentenceCompletionQuestion
} from "@/lib/seruEnglishQuestions";
import {
  upsertPracticeSessionResult,
  type PracticeSessionResult
} from "@/lib/practice/practiceSession";
import { PracticeSessionSummaryPanel } from "@/src/components/practice/PracticeSessionPanels";
import { QuestionExplanation } from "@/src/components/questions/QuestionExplanation";

type SingleFlowProps = {
  mode: "single";
  questions: SentenceCompletionQuestion[];
  title: string;
};

type AdvancedFlowProps = {
  mode: "advanced";
  questions: MultiSentenceCompletionQuestion[];
  title: string;
};

type SeruSentenceCompletionPracticeFlowProps = SingleFlowProps | AdvancedFlowProps;

type SaveStatus = "idle" | "saving" | "saved" | "failed";

function sentenceParts(sentence: string) {
  return sentence.split("___");
}

function answerSummary(answers: Array<string | null>) {
  return answers.map((answer) => answer ?? "Blank").join(" / ");
}

function statusMessage({
  answered,
  hasSubmitted,
  isComplete
}: {
  answered: boolean;
  hasSubmitted: boolean;
  isComplete: boolean;
}) {
  if (hasSubmitted) return "Answer checked. Review the feedback before moving on.";
  if (isComplete) return "All blanks are filled. You can check your answer.";
  if (answered) return "Answer in progress. Fill every blank before checking.";
  return "Choose or drag words into the blanks before checking.";
}

function WordOptionButton({
  disabled,
  isSelected,
  onChoose,
  option
}: {
  disabled?: boolean;
  isSelected?: boolean;
  onChoose: () => void;
  option: string;
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={`min-h-11 rounded-md border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
          : isSelected
            ? "border-orange-500 bg-orange-50 text-orange-800"
            : "border-slate-300 bg-white text-slate-700 hover:border-orange-500 hover:text-orange-700"
      }`}
      disabled={disabled}
      draggable={!disabled}
      onClick={onChoose}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", option);
        event.dataTransfer.effectAllowed = "copy";
      }}
      type="button"
    >
      {option}
    </button>
  );
}

function BlankSelect({
  answer,
  disabled,
  index,
  isCorrect,
  onClear,
  onDropWord,
  onSelectWord,
  onTapBlank,
  options,
  showFeedback
}: {
  answer: string | null;
  disabled?: boolean;
  index: number;
  isCorrect?: boolean;
  onClear?: () => void;
  onDropWord: (word: string) => void;
  onSelectWord: (word: string) => void;
  onTapBlank: () => void;
  options: string[];
  showFeedback?: boolean;
}) {
  const feedbackClass = showFeedback
    ? isCorrect
      ? "border-green-500 bg-green-50 text-green-900"
      : "border-red-500 bg-red-50 text-red-900"
    : answer
      ? "border-orange-500 bg-orange-50 text-orange-900"
      : "border-slate-300 bg-white text-slate-500";

  return (
    <span className="inline-flex items-center gap-2 align-middle">
      <select
        aria-label={`Blank ${index + 1}${answer ? ` filled with ${answer}` : ""}`}
        className={`mx-1 inline-flex min-h-11 min-w-32 rounded-md border px-3 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 ${feedbackClass}`}
        data-inline-blank="true"
        disabled={disabled}
        onChange={(event) => {
          if (event.target.value) onSelectWord(event.target.value);
        }}
        onClick={onTapBlank}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(event: DragEvent<HTMLSelectElement>) => {
          event.preventDefault();
          const word = event.dataTransfer.getData("text/plain");
          if (word) onDropWord(word);
        }}
        value={answer ?? ""}
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {answer && !disabled && onClear && (
        <button
          className="rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          onClick={onClear}
          type="button"
        >
          Clear
        </button>
      )}
    </span>
  );
}

function SentenceRenderer({
  answers,
  blankResults,
  disabled,
  onClearBlank,
  onDropWord,
  options,
  onTapBlank,
  sentence,
  showFeedback
}: {
  answers: Array<string | null>;
  blankResults?: boolean[];
  disabled?: boolean;
  onClearBlank?: (index: number) => void;
  onDropWord: (index: number, word: string) => void;
  options: string[];
  onTapBlank: (index: number) => void;
  sentence: string;
  showFeedback?: boolean;
}) {
  const parts = sentenceParts(sentence);

  return (
    <p className="text-xl font-semibold leading-10 text-ink">
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {part}
          {index < parts.length - 1 && (
            <BlankSelect
              answer={answers[index] ?? null}
              disabled={disabled}
              index={index}
              isCorrect={blankResults?.[index]}
              onClear={
                onClearBlank ? () => onClearBlank(index) : undefined
              }
              onDropWord={(word) => onDropWord(index, word)}
              onSelectWord={(word) => onDropWord(index, word)}
              onTapBlank={() => onTapBlank(index)}
              options={options}
              showFeedback={showFeedback}
            />
          )}
        </span>
      ))}
    </p>
  );
}

function EmptyEnglishState() {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
      <h2 className="text-lg font-bold text-amber-950">
        No SERU English questions are available
      </h2>
      <p className="mt-2 leading-6">
        Try PHV Handbook practice while this set is being prepared.
      </p>
      <Link
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        href="/practice/seru"
      >
        Open PHV Handbook practice
      </Link>
    </section>
  );
}

export function SeruSentenceCompletionPracticeFlow(
  props: SeruSentenceCompletionPracticeFlowProps
) {
  const { mode, questions, title } = props;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<string | null>>(
    mode === "advanced" ? clearAllBlanks(3) : [null]
  );
  const [pendingWord, setPendingWord] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [sessionResults, setSessionResults] = useState<PracticeSessionResult[]>(
    []
  );
  const currentQuestion = questions[currentQuestionIndex];
  const blankCount = mode === "advanced" ? 3 : 1;

  useEffect(() => {
    setCurrentQuestionIndex(0);
    setAnswers(mode === "advanced" ? clearAllBlanks(3) : [null]);
    setPendingWord(null);
    setHasSubmitted(false);
    setSaveStatus("idle");
  }, [mode, questions]);

  const usedWords = useMemo(
    () => new Set(answers.filter((answer): answer is string => Boolean(answer))),
    [answers]
  );
  const blankResults = useMemo(() => {
    if (!currentQuestion || mode !== "advanced") return [];
    return scoreMultiSentenceCompletion(
      currentQuestion as MultiSentenceCompletionQuestion,
      answers
    ).blankResults;
  }, [answers, currentQuestion, mode]);
  const isComplete = answers.length === blankCount && answers.every(Boolean);
  const hasAnyAnswer = answers.some(Boolean);
  const statusId = currentQuestion
    ? `${currentQuestion.id}-sentence-answer-status`
    : "seru-sentence-answer-status";
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  if (!currentQuestion) return <EmptyEnglishState />;

  const isCorrect =
    mode === "single"
      ? scoreSentenceCompletion(
          currentQuestion as SentenceCompletionQuestion,
          answers[0]
        )
      : scoreMultiSentenceCompletion(
          currentQuestion as MultiSentenceCompletionQuestion,
          answers
        ).correct;

  function resetForQuestion(index: number) {
    setCurrentQuestionIndex(index);
    setAnswers(mode === "advanced" ? clearAllBlanks(3) : [null]);
    setPendingWord(null);
    setHasSubmitted(false);
    setSaveStatus("idle");
  }

  function placeAnswer(blankIndex: number, word: string) {
    if (hasSubmitted || !currentQuestion.options.includes(word)) return;
    setAnswers((current) =>
      mode === "advanced" ? placeWordInBlank(current, blankIndex, word) : [word]
    );
    setPendingWord(null);
    setSaveStatus("idle");
  }

  function chooseWord(word: string) {
    if (hasSubmitted) return;
    if (mode === "single") {
      placeAnswer(0, word);
      return;
    }
    setPendingWord((current) => (current === word ? null : word));
  }

  function tapBlank(blankIndex: number) {
    if (!pendingWord) return;
    placeAnswer(blankIndex, pendingWord);
  }

  function clearAnswer(blankIndex: number) {
    if (hasSubmitted) return;
    setAnswers((current) => clearBlank(current, blankIndex));
    setSaveStatus("idle");
  }

  function resetCurrentAnswer() {
    setAnswers(mode === "advanced" ? clearAllBlanks(3) : [null]);
    setPendingWord(null);
    setHasSubmitted(false);
    setSaveStatus("idle");
  }

  async function submitAnswer() {
    if (!isComplete) return;

    setHasSubmitted(true);
    setSaveStatus("saving");
    const correctAnswer =
      mode === "single"
        ? (currentQuestion as SentenceCompletionQuestion).correctAnswer
        : (currentQuestion as MultiSentenceCompletionQuestion).correctAnswers.join(
            " / "
          );
    const learnerAnswer = answerSummary(answers);
    const score = isCorrect ? 1 : 0;
    const questionSubtype =
      mode === "single" ? "sentence_completion" : "multi_sentence_completion";

    setSessionResults((current) =>
      upsertPracticeSessionResult(current, {
        questionId: currentQuestion.id,
        prompt: currentQuestion.sentence,
        questionType: "knowledge",
        topic: currentQuestion.category,
        difficulty: currentQuestion.difficulty,
        passed: isCorrect,
        percentage: score * 100,
        learnerAnswer,
        correctAnswer,
        feedback: currentQuestion.explanation
      })
    );

    const result = await savePracticeAttempt({
      userId: LOCAL_LEARNER_ID,
      practiceMode: "knowledge",
      questionId: currentQuestion.id,
      questionType: "knowledge",
      answer: {
        selectedAnswer: mode === "single" ? answers[0] : undefined,
        selectedWords: answers,
        questionSubtype
      },
      result: {
        correctAnswer,
        correctAnswers:
          mode === "advanced"
            ? (currentQuestion as MultiSentenceCompletionQuestion).correctAnswers
            : undefined,
        blankResults: mode === "advanced" ? blankResults : undefined,
        explanation: currentQuestion.explanation,
        questionFamily: "seru",
        questionSubtype,
        category: currentQuestion.category,
        tip: "Read the sentence carefully and check which word fits the meaning and grammar."
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
              SERU English practice
            </p>
            <h2 className="mt-1 text-xl font-bold text-ink">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Tap a word to use it, or drag a word into a blank. Advanced
              questions have three blanks and score as correct only when every
              blank is filled correctly.
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
          <SentenceRenderer
            answers={answers}
            blankResults={blankResults}
            disabled={hasSubmitted}
            onClearBlank={clearAnswer}
            onDropWord={placeAnswer}
            options={currentQuestion.options}
            onTapBlank={tapBlank}
            sentence={currentQuestion.sentence}
            showFeedback={hasSubmitted}
          />
        </div>

        <p
          aria-live="polite"
          className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
          id={statusId}
        >
          {statusMessage({ answered: hasAnyAnswer, hasSubmitted, isComplete })}
        </p>

        <div className="mt-5">
          <p className="text-sm font-bold text-slate-700">Answer options</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {currentQuestion.options.map((option) => (
              <WordOptionButton
                disabled={mode === "advanced" && usedWords.has(option)}
                isSelected={pendingWord === option}
                key={option}
                onChoose={() => chooseWord(option)}
                option={option}
              />
            ))}
          </div>
          {mode === "advanced" && pendingWord && !hasSubmitted && (
            <p className="mt-3 text-sm font-semibold text-orange-800">
              Selected word: {pendingWord}. Tap a blank to place it.
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            aria-describedby={statusId}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!isComplete || hasSubmitted}
            onClick={submitAnswer}
            type="button"
          >
            {isComplete ? "Check answer" : "Fill every blank to continue"}
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-orange-500 hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            onClick={resetCurrentAnswer}
            type="button"
          >
            {mode === "advanced" ? "Clear all" : "Clear answer"}
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
                <dd className="mt-1 text-slate-900">{answerSummary(answers)}</dd>
              </div>
              <div className="rounded-md bg-white/80 p-3">
                <dt className="font-semibold text-slate-600">Correct answer</dt>
                <dd className="mt-1 text-slate-900">
                  {mode === "single"
                    ? (currentQuestion as SentenceCompletionQuestion).correctAnswer
                    : (
                        currentQuestion as MultiSentenceCompletionQuestion
                      ).correctAnswers.join(" / ")}
                </dd>
              </div>
            </dl>
            {mode === "advanced" && (
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {blankResults.map((result, index) => (
                  <p
                    className={`rounded-md px-3 py-2 text-sm font-semibold ${
                      result
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                    key={`${currentQuestion.id}-blank-${index}`}
                  >
                    Blank {index + 1}: {result ? "correct" : "incorrect"}
                  </p>
                ))}
              </div>
            )}
            <div className="mt-4">
              <QuestionExplanation
                explanation={currentQuestion.explanation}
                tip="Read the sentence aloud if needed, then check the meaning and grammar of each option."
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
          onClick={() => resetForQuestion(currentQuestionIndex - 1)}
          type="button"
        >
          Previous question
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300 sm:ml-auto"
          disabled={isLastQuestion || !hasSubmitted}
          onClick={() => resetForQuestion(currentQuestionIndex + 1)}
          type="button"
        >
          Next question
        </button>
      </nav>

      <PracticeSessionSummaryPanel results={sessionResults} />
    </div>
  );
}
