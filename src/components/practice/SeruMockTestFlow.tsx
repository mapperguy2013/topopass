"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LOCAL_LEARNER_ID } from "@/lib/db/localPersistence";
import { savePracticeAttempt } from "@/lib/db/practiceAttemptRepository";
import {
  buildSeruMockQuestions,
  isSeruMockAnswerComplete,
  scoreSeruMockAnswers,
  SERU_MOCK_CONFIG,
  type SeruMockAnswer,
  type SeruMockQuestion,
  type SeruMockQuestionScore,
  type SeruMockResult
} from "@/lib/seruMockTest";
import { QuestionExplanation } from "@/src/components/questions/QuestionExplanation";

type SaveStatus = "idle" | "saving" | "saved" | "failed";

function sentenceParts(sentence: string) {
  return sentence.split("___");
}

function answerForSelect(answer: SeruMockAnswer, index: number) {
  if (Array.isArray(answer)) return answer[index] ?? "";
  return typeof answer === "string" ? answer : "";
}

function questionPrompt(question: SeruMockQuestion) {
  if (question.type === "seru_phv") return question.question.prompt;
  if (question.type === "seru_reading") return question.question.question;
  return question.question.sentence;
}

function questionMeta(question: SeruMockQuestion) {
  if (question.type === "seru_phv") {
    return `${question.question.handbookSection} - ${question.question.topic}`;
  }

  if (question.type === "seru_reading") {
    return `${question.question.handbookSection} - ${question.question.topic}`;
  }

  return question.question.category;
}

function optionsForQuestion(question: SeruMockQuestion) {
  if (question.type === "seru_phv" || question.type === "seru_reading") {
    return question.question.options;
  }

  return question.question.options;
}

function selectedAnswerForQuestion(
  question: SeruMockQuestion,
  answers: Record<string, SeruMockAnswer>
) {
  return answers[question.id] ?? (question.type === "seru_english_advanced" ? [null, null, null] : null);
}

function setBlankAnswer(
  answer: SeruMockAnswer,
  blankIndex: number,
  value: string
) {
  const current = Array.isArray(answer) ? answer : [null, null, null];
  return current.map((entry, index) => (index === blankIndex ? value : entry));
}

function buildAttemptPayload(
  question: SeruMockQuestion,
  answer: SeruMockAnswer,
  score: SeruMockQuestionScore
) {
  if (question.type === "seru_phv") {
    return {
      answer: { selectedAnswer: typeof answer === "string" ? answer : null },
      result: {
        correctAnswer: score.correctAnswer,
        explanation: score.explanation,
        handbookSection: question.question.handbookSection,
        questionFamily: "seru",
        questionSubtype: "multiple_choice",
        source: question.question.source,
        tip: question.question.tip,
        topic: question.question.topic
      }
    };
  }

  if (question.type === "seru_english_advanced") {
    const selectedWords = Array.isArray(answer) ? answer : [null, null, null];
    return {
      answer: {
        selectedWords,
        questionSubtype: "multi_sentence_completion"
      },
      result: {
        correctAnswer: score.correctAnswer,
        correctAnswers: question.question.correctAnswers,
        blankResults: score.blankResults,
        explanation: question.question.explanation,
        questionFamily: "seru",
        questionSubtype: "multi_sentence_completion",
        category: question.question.category,
        tip: "Read the sentence carefully and check each blank against the full sentence meaning."
      }
    };
  }

  if (question.type === "seru_english_single") {
    return {
      answer: {
        selectedAnswer: typeof answer === "string" ? answer : null,
        selectedWords: [typeof answer === "string" ? answer : null],
        questionSubtype: "sentence_completion"
      },
      result: {
        correctAnswer: score.correctAnswer,
        explanation: question.question.explanation,
        questionFamily: "seru",
        questionSubtype: "sentence_completion",
        category: question.question.category,
        tip: "Read the sentence carefully and choose the word that fits the meaning and grammar."
      }
    };
  }

  return {
    answer: {
      selectedAnswer: typeof answer === "string" ? answer : null,
      questionSubtype: "reading_comprehension"
    },
    result: {
      correctAnswer: score.correctAnswer,
      explanation: question.question.explanation,
      handbookSection: question.question.handbookSection,
      passage: question.question.passage,
      passageTitle: question.question.title,
      questionFamily: "seru",
      questionSubtype: "reading_comprehension",
      category: question.question.category,
      source: question.question.source,
      tip: "Read the whole passage first, then match the answer to the exact detail or meaning in the text.",
      topic: question.question.topic
    }
  };
}

function ResultBreakdown({ result }: { result: SeruMockResult }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Object.entries(result.breakdown).map(([type, breakdown]) => (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={type}>
          <dt className="text-sm font-semibold text-slate-600">
            {breakdown.label}
          </dt>
          <dd className="mt-2 text-2xl font-bold text-ink">
            {breakdown.correct}/{breakdown.total}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ReviewList({
  questions,
  result
}: {
  questions: SeruMockQuestion[];
  result: SeruMockResult;
}) {
  const questionsById = new Map(questions.map((question) => [question.id, question]));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-ink">Review answers</h2>
      <div className="mt-4 space-y-4">
        {result.questionResults.map((score, index) => {
          const question = questionsById.get(score.questionId);
          return (
            <article
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              key={score.questionId}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
                    Question {index + 1} - {score.label}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-ink">
                    {question ? questionPrompt(question) : score.questionId}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {score.handbookSection ?? score.category}
                    {score.topic ? ` - ${score.topic}` : ""}
                  </p>
                </div>
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                    score.correct
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {score.correct ? "Correct" : "Incorrect"}
                </span>
              </div>
              {question?.type === "seru_reading" && (
                <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Passage
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {question.question.passage}
                  </p>
                </div>
              )}
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-md bg-white p-3">
                  <dt className="font-semibold text-slate-600">Your answer</dt>
                  <dd className="mt-1 text-slate-900">{score.userAnswer}</dd>
                </div>
                <div className="rounded-md bg-white p-3">
                  <dt className="font-semibold text-slate-600">Correct answer</dt>
                  <dd className="mt-1 text-slate-900">{score.correctAnswer}</dd>
                </div>
              </dl>
              {score.blankResults && (
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {score.blankResults.map((blankCorrect, blankIndex) => (
                    <p
                      className={`rounded-md px-3 py-2 text-sm font-semibold ${
                        blankCorrect
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                      key={`${score.questionId}-blank-${blankIndex}`}
                    >
                      Blank {blankIndex + 1}:{" "}
                      {blankCorrect ? "correct" : "incorrect"}
                    </p>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <QuestionExplanation explanation={score.explanation} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function SeruMockTestFlow() {
  const [questions, setQuestions] = useState<SeruMockQuestion[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, SeruMockAnswer>>({});
  const [validationMessage, setValidationMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [result, setResult] = useState<SeruMockResult | null>(null);
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion
    ? selectedAnswerForQuestion(currentQuestion, answers)
    : null;
  const completedCount = useMemo(
    () =>
      questions.filter((question) =>
        isSeruMockAnswerComplete(question, answers[question.id])
      ).length,
    [answers, questions]
  );

  function startMock() {
    setQuestions(buildSeruMockQuestions());
    setHasStarted(true);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setValidationMessage("");
    setSaveStatus("idle");
    setResult(null);
  }

  function setAnswer(questionId: string, answer: SeruMockAnswer) {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
    setValidationMessage("");
    setSaveStatus("idle");
  }

  function goToQuestion(index: number) {
    setCurrentQuestionIndex(index);
    setValidationMessage("");
  }

  function nextQuestion() {
    if (!currentQuestion) return;
    if (!isSeruMockAnswerComplete(currentQuestion, currentAnswer)) {
      setValidationMessage("Choose an answer before continuing.");
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      goToQuestion(currentQuestionIndex + 1);
    }
  }

  async function submitMock() {
    const firstIncompleteIndex = questions.findIndex(
      (question) => !isSeruMockAnswerComplete(question, answers[question.id])
    );

    if (firstIncompleteIndex >= 0) {
      setCurrentQuestionIndex(firstIncompleteIndex);
      setValidationMessage("Answer every question before submitting the mock.");
      return;
    }

    const nextResult = scoreSeruMockAnswers(questions, answers);
    setSaveStatus("saving");
    await Promise.all(
      nextResult.questionResults.map((score) => {
        const question = questions.find((entry) => entry.id === score.questionId);
        if (!question) return Promise.resolve(null);
        const attempt = buildAttemptPayload(question, answers[question.id], score);
        return savePracticeAttempt({
          userId: LOCAL_LEARNER_ID,
          practiceMode: "knowledge",
          questionId: question.id,
          questionType: "knowledge",
          answer: attempt.answer,
          result: attempt.result,
          score: score.score,
          maxScore: score.maxScore,
          passed: score.correct
        });
      })
    );
    setResult(nextResult);
    setSaveStatus("saved");
  }

  if (result) {
    return (
      <div className="space-y-5">
        <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm lg:p-7">
          <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
            SERU Mock Test result
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-ink">
                {result.percentage}% - {result.score}/{result.maxScore} correct
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {result.passed
                  ? "You reached the SERU mock pass-level threshold."
                  : "Review the missed areas below, then try another mixed mock."}
              </p>
            </div>
            <span
              className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${
                result.passed
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {result.passed ? "Pass level" : "Below pass level"}
            </span>
          </div>
          <div className="mt-5">
            <ResultBreakdown result={result} />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-700">
            {saveStatus === "saved" &&
              "Answers were saved to your TopoPass practice history where persistence is available."}
            {saveStatus === "failed" &&
              "Some answers could not be saved in this browser."}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700"
              onClick={startMock}
              type="button"
            >
              Start another SERU mock
            </button>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-orange-500 hover:text-orange-700"
              href="/practice/seru"
            >
              Back to SERU practice
            </Link>
          </div>
        </section>
        <ReviewList questions={questions} result={result} />
      </div>
    );
  }

  if (!hasStarted || !currentQuestion) {
    return (
      <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm lg:p-7">
        <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
          SERU Mock Test
        </p>
        <h2 className="mt-2 text-3xl font-bold text-ink">
          Take a mixed 20-question SERU mock
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
          This mock keeps SERU separate from topographical practice. It uses 5
          PHV handbook questions, 5 advanced English questions, 5 complete-the-
          sentence questions, and 5 reading-understanding questions.
        </p>
        <p className="mt-3 max-w-3xl rounded-md bg-orange-50 p-3 text-sm leading-6 text-slate-700">
          Questions are original TopoPass practice content. They are not
          official TfL questions and TopoPass is not affiliated with or endorsed
          by Transport for London.
        </p>
        <button
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          onClick={startMock}
          type="button"
        >
          Start SERU mock test
        </button>
      </section>
    );
  }

  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
              SERU Mock Test: Question {currentQuestionIndex + 1} of{" "}
              {questions.length}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink">
              {currentQuestion.label}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {completedCount}/{questions.length} answered. Pass-level threshold:{" "}
              {SERU_MOCK_CONFIG.passPercentage}%.
            </p>
          </div>
          <span className="w-fit rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-orange-800">
            {questionMeta(currentQuestion)}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {questions.map((question, index) => {
            const isCurrent = index === currentQuestionIndex;
            const isComplete = isSeruMockAnswerComplete(question, answers[question.id]);
            return (
              <button
                aria-current={isCurrent ? "step" : undefined}
                className={`flex h-10 w-10 items-center justify-center rounded-md border text-sm font-bold ${
                  isCurrent
                    ? "border-orange-600 bg-orange-600 text-white"
                    : isComplete
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-700"
                }`}
                key={question.id}
                onClick={() => goToQuestion(index)}
                type="button"
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        {currentQuestion.type === "seru_reading" && (
          <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Passage
            </p>
            <h3 className="mt-2 text-xl font-bold text-ink">
              {currentQuestion.question.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              {currentQuestion.question.passage}
            </p>
          </div>
        )}

        {currentQuestion.type === "seru_english_advanced" ||
        currentQuestion.type === "seru_english_single" ? (
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
              Complete the sentence
            </p>
            <p className="mt-3 text-xl font-semibold leading-10 text-ink">
              {sentenceParts(currentQuestion.question.sentence).map((part, index) => (
                <span key={`${currentQuestion.id}-${index}`}>
                  {part}
                  {index < sentenceParts(currentQuestion.question.sentence).length - 1 && (
                    <select
                      aria-label={`Blank ${index + 1}`}
                      className="mx-1 inline-flex min-h-11 min-w-32 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                      onChange={(event) => {
                        const nextAnswer =
                          currentQuestion.type === "seru_english_advanced"
                            ? setBlankAnswer(currentAnswer, index, event.target.value)
                            : event.target.value;
                        setAnswer(currentQuestion.id, nextAnswer);
                      }}
                      value={answerForSelect(currentAnswer, index)}
                    >
                      <option value="">Select</option>
                      {currentQuestion.question.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                </span>
              ))}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
              Question
            </p>
            <h3 className="mt-2 text-2xl font-bold text-ink">
              {questionPrompt(currentQuestion)}
            </h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {optionsForQuestion(currentQuestion).map((option) => (
                <button
                  aria-pressed={currentAnswer === option}
                  className={`min-h-12 rounded-md border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 ${
                    currentAnswer === option
                      ? "border-orange-500 bg-orange-50 text-orange-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-orange-500"
                  }`}
                  key={option}
                  onClick={() => setAnswer(currentQuestion.id, option)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {validationMessage && (
          <p
            aria-live="polite"
            className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900"
          >
            {validationMessage}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-orange-500 hover:text-orange-700 disabled:cursor-not-allowed disabled:text-slate-300"
            disabled={currentQuestionIndex === 0}
            onClick={() => goToQuestion(currentQuestionIndex - 1)}
            type="button"
          >
            Previous
          </button>
          {isLastQuestion ? (
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:ml-auto"
              disabled={saveStatus === "saving"}
              onClick={submitMock}
              type="button"
            >
              {saveStatus === "saving" ? "Saving..." : "Submit SERU mock"}
            </button>
          ) : (
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 sm:ml-auto"
              onClick={nextQuestion}
              type="button"
            >
              Next question
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
