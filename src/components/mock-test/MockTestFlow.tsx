"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_MOCK_EXAM_CONFIG } from "@/lib/mockExamConfig";
import {
  calculateMockExamResult,
  removeMockExamAnswer,
  saveMockExamAnswer,
  scoreMockExamQuestion,
  type MockExamAnswer,
  type MockExamAnswers
} from "@/lib/mockExamEngine";
import {
  clearActiveMockExam,
  loadActiveMockExam,
  saveActiveMockExam
} from "@/lib/mockExamStorage";
import {
  formatExamTime,
  getMockExamTimerLevel,
  getRemainingExamSeconds,
  shouldAutoSubmitMockExam
} from "@/lib/mockExamTimer";
import {
  getMockExamQuestionsById,
  selectMockExamQuestions,
  type KnowledgeMockQuestion,
  type MockExamQuestion,
  type RouteDrawingMockQuestion
} from "@/lib/mockTestQuestions";
import { MockExamIntro } from "@/src/components/mock-test/MockExamIntro";
import { MockExamResults } from "@/src/components/mock-test/MockExamResults";
import { MockExamReview } from "@/src/components/mock-test/MockExamReview";
import {
  MapClickQuestion,
  type MapClickQuestionResult
} from "@/src/components/questions/MapClickQuestion";
import {
  RouteDrawingQuestion,
  type RouteDrawingQuestionAnswer
} from "@/src/components/route/RouteDrawingQuestion";
import { kingsCrossEustonRouteGraph } from "@/src/data/maps/kings-cross-euston/routeGraph";

type MockExamMode = "intro" | "exam" | "results" | "review";
type SubmissionReason = "submitted" | "time-expired";

function KnowledgeQuestion({
  question,
  answer,
  onAnswer
}: {
  question: KnowledgeMockQuestion;
  answer?: MockExamAnswer;
  onAnswer: (answer: MockExamAnswer) => void;
}) {
  const selectedAnswer =
    answer?.type === "knowledge" ? answer.selectedAnswer : null;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-wide text-road">
        Knowledge question
      </p>
      <h2 className="mt-3 text-2xl font-bold text-ink">{question.prompt}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => (
          <button
            aria-pressed={selectedAnswer === option}
            className={`min-h-12 rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
              selectedAnswer === option
                ? "border-road bg-blue-50 text-road"
                : "border-slate-200 bg-white text-slate-700 hover:border-road"
            }`}
            key={option}
            onClick={() =>
              onAnswer({ type: "knowledge", selectedAnswer: option })
            }
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
      {selectedAnswer && (
        <p className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-900">
          Answer saved for this session.
        </p>
      )}
    </section>
  );
}

function RouteMockQuestion({
  question,
  answer,
  onAnswer,
  onAnswerReset
}: {
  question: RouteDrawingMockQuestion;
  answer?: MockExamAnswer;
  onAnswer: (answer: MockExamAnswer) => void;
  onAnswerReset: () => void;
}) {
  const acceptedRoutePoints =
    question.routeQuestion.acceptedRoute?.geometry.map(([x, y]) => ({ x, y })) ??
    [];
  const scoredAnswer = scoreMockExamQuestion(question, answer);
  const initialAnswer: RouteDrawingQuestionAnswer | null =
    answer?.type === "route-drawing" &&
    scoredAnswer.details.type === "route-drawing" &&
    scoredAnswer.details.routeScore
      ? {
          routePoints: answer.routePoints,
          result: scoredAnswer.details.routeScore
        }
      : null;

  return (
    <RouteDrawingQuestion
      acceptedRoutePoints={acceptedRoutePoints}
      graph={kingsCrossEustonRouteGraph}
      initialAnswer={initialAnswer}
      mapImagePath="/maps/kings-cross-euston/map.svg"
      onAnswer={(submittedAnswer) =>
        onAnswer({
          type: "route-drawing",
          routePoints: submittedAnswer.routePoints
        })
      }
      onAnswerReset={onAnswerReset}
      question={question.routeQuestion}
      showDeveloperTools={false}
      showResult={false}
    />
  );
}

function questionTypeLabel(question: MockExamQuestion) {
  if (question.type === "knowledge") return "Knowledge";
  if (question.type === "map-click") return "Map click";
  return "Route drawing";
}

export function MockTestFlow() {
  const [questions, setQuestions] = useState<MockExamQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<MockExamAnswers>({});
  const [mode, setMode] = useState<MockExamMode>("intro");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(
    DEFAULT_MOCK_EXAM_CONFIG.durationMinutes * 60
  );
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [submissionReason, setSubmissionReason] =
    useState<SubmissionReason>("submitted");
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;
  const answeredCount = questions.filter((question) => answers[question.id]).length;
  const unansweredCount = questions.length - answeredCount;
  const result = useMemo(
    () =>
      calculateMockExamResult(
        questions,
        answers,
        DEFAULT_MOCK_EXAM_CONFIG.passPercentage
      ),
    [answers, questions]
  );

  const saveAnswer = useCallback(
    (questionId: string, answer: MockExamAnswer) => {
      setAnswers((current) => saveMockExamAnswer(current, questionId, answer));
    },
    []
  );

  const resetAnswer = useCallback((questionId: string) => {
    setAnswers((current) => removeMockExamAnswer(current, questionId));
  }, []);

  const startNewExam = useCallback(() => {
    const selectedQuestions = selectMockExamQuestions();
    const nextExpiresAt =
      Date.now() + DEFAULT_MOCK_EXAM_CONFIG.durationMinutes * 60 * 1000;

    clearActiveMockExam();
    setQuestions(selectedQuestions);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setExpiresAt(nextExpiresAt);
    setRemainingSeconds(DEFAULT_MOCK_EXAM_CONFIG.durationMinutes * 60);
    setSubmissionReason("submitted");
    setShowSubmitConfirmation(false);
    setMode("exam");
  }, []);

  useEffect(() => {
    const storedAttempt = loadActiveMockExam();
    if (!storedAttempt) return;

    const storedQuestions = getMockExamQuestionsById(storedAttempt.questionIds);
    if (storedQuestions.length !== storedAttempt.questionIds.length) {
      clearActiveMockExam();
      return;
    }

    setQuestions(storedQuestions);
    setAnswers(storedAttempt.answers);
    setCurrentQuestionIndex(
      Math.min(
        Math.max(0, storedAttempt.currentQuestionIndex),
        storedQuestions.length - 1
      )
    );
    setExpiresAt(storedAttempt.expiresAt);

    if (shouldAutoSubmitMockExam(storedAttempt.expiresAt)) {
      setRemainingSeconds(0);
      setSubmissionReason("time-expired");
      setMode("results");
      clearActiveMockExam();
    } else {
      setRemainingSeconds(getRemainingExamSeconds(storedAttempt.expiresAt));
      setMode("exam");
    }
  }, []);

  useEffect(() => {
    if (mode !== "exam" || !expiresAt || questions.length === 0) return;

    saveActiveMockExam({
      version: 1,
      questionIds: questions.map((question) => question.id),
      currentQuestionIndex,
      answers,
      expiresAt
    });
  }, [answers, currentQuestionIndex, expiresAt, mode, questions]);

  useEffect(() => {
    if (mode !== "exam" || !expiresAt) return;

    function updateTimer() {
      const nextRemaining = getRemainingExamSeconds(expiresAt as number);
      setRemainingSeconds(nextRemaining);

      if (nextRemaining === 0) {
        setSubmissionReason("time-expired");
        setShowSubmitConfirmation(false);
        setMode("results");
        clearActiveMockExam();
      }
    }

    updateTimer();
    const timer = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt, mode]);

  function submitExam() {
    setSubmissionReason("submitted");
    setShowSubmitConfirmation(false);
    setMode("results");
    clearActiveMockExam();
  }

  function restartExam() {
    if (
      mode === "exam" &&
      !window.confirm("Clear this attempt and start a new randomized mock exam?")
    ) {
      return;
    }
    startNewExam();
  }

  if (mode === "intro") {
    return (
      <MockExamIntro
        config={DEFAULT_MOCK_EXAM_CONFIG}
        onStart={startNewExam}
      />
    );
  }

  if (mode === "results") {
    return (
      <MockExamResults
        onRestart={restartExam}
        onReview={() => setMode("review")}
        result={result}
        submissionNotice={
          submissionReason === "time-expired"
            ? "The time limit expired and the exam was submitted automatically."
            : undefined
        }
      />
    );
  }

  if (mode === "review") {
    return (
      <MockExamReview
        onBack={() => setMode("results")}
        onRestart={restartExam}
        questions={questions}
        result={result}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        No mock exam questions are available.
      </p>
    );
  }

  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const timerLevel = getMockExamTimerLevel(remainingSeconds);
  const currentMapScore = scoreMockExamQuestion(
    currentQuestion,
    currentAnswer
  );
  const initialMapAnswer: MapClickQuestionResult | null =
    currentQuestion.type === "map-click" &&
    currentMapScore.details.type === "map-click" &&
    currentMapScore.details.clickedCoordinates
      ? {
          coordinates: currentMapScore.details.clickedCoordinates,
          distance: currentMapScore.details.distanceMeters,
          isCorrect: currentMapScore.passed
        }
      : null;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <p className="text-sm font-bold text-ink">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {answeredCount} answered - {unansweredCount} unanswered -{" "}
              {questionTypeLabel(currentQuestion)}
              {currentQuestion.category
                ? ` - ${currentQuestion.category}`
                : ""}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <p
              aria-live="polite"
              className={`rounded-md border px-4 py-2 text-center font-mono text-lg font-bold ${
                timerLevel === "one-minute-warning"
                  ? "border-red-300 bg-red-50 text-red-800"
                  : timerLevel === "five-minute-warning"
                    ? "border-amber-300 bg-amber-50 text-amber-900"
                    : "border-slate-200 bg-slate-50 text-ink"
              }`}
            >
              {formatExamTime(remainingSeconds)}
            </p>
            <button
              className="text-sm font-semibold text-slate-600 hover:text-red-700"
              onClick={restartExam}
              type="button"
            >
              Restart exam
            </button>
          </div>
        </div>

        {timerLevel === "five-minute-warning" && (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            Five minutes remaining. Review unanswered questions before time
            expires.
          </p>
        )}
        {timerLevel === "one-minute-warning" && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">
            One minute remaining. The exam will submit automatically at 0:00.
          </p>
        )}

        <div className="mt-4 h-2 overflow-hidden rounded bg-slate-100">
          <div
            className="h-full bg-road transition-[width]"
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`
            }}
          />
        </div>

        <nav aria-label="Question navigator" className="mt-4">
          <div className="flex flex-wrap gap-2">
            {questions.map((question, index) => {
              const isCurrent = index === currentQuestionIndex;
              const isAnswered = Boolean(answers[question.id]);
              return (
                <button
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Question ${index + 1}: ${isAnswered ? "answered" : "unanswered"}`}
                  className={`flex size-9 items-center justify-center rounded-md border text-sm font-bold transition ${
                    isCurrent
                      ? "border-road bg-road text-white"
                      : isAnswered
                        ? "border-ink bg-ink text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:border-road"
                  }`}
                  key={question.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  type="button"
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
            <span>Outlined: unanswered</span>
            <span>Dark: answered</span>
            <span>Blue: current</span>
          </div>
        </nav>
      </section>

      {currentQuestion.type === "knowledge" && (
        <KnowledgeQuestion
          answer={currentAnswer}
          onAnswer={(answer) => saveAnswer(currentQuestion.id, answer)}
          question={currentQuestion}
        />
      )}

      {currentQuestion.type === "map-click" && (
        <MapClickQuestion
          description="Click or tap the map, then submit the selected location. Results are shown after the exam."
          initialAnswer={initialMapAnswer}
          initialCenter={currentQuestion.initialCenter}
          initialZoom={currentQuestion.initialZoom}
          key={currentQuestion.id}
          onAnswer={(mapAnswer) =>
            saveAnswer(currentQuestion.id, {
              type: "map-click",
              coordinates: mapAnswer.coordinates
            })
          }
          onAnswerReset={() => resetAnswer(currentQuestion.id)}
          passRadiusMetres={currentQuestion.toleranceMeters}
          showResult={false}
          target={currentQuestion.target}
          title={currentQuestion.prompt}
        />
      )}

      {currentQuestion.type === "route-drawing" && (
        <RouteMockQuestion
          answer={currentAnswer}
          key={currentQuestion.id}
          onAnswer={(answer) => saveAnswer(currentQuestion.id, answer)}
          onAnswerReset={() => resetAnswer(currentQuestion.id)}
          question={currentQuestion}
        />
      )}

      <nav
        aria-label="Mock exam navigation"
        className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
      >
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road disabled:cursor-not-allowed disabled:text-slate-300"
          disabled={isFirstQuestion}
          onClick={() => setCurrentQuestionIndex((index) => index - 1)}
          type="button"
        >
          Previous question
        </button>
        <p className="text-center text-sm text-slate-600 sm:mx-auto">
          {currentAnswer ? "Answer saved" : "Not answered"}
        </p>
        {isLastQuestion ? (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            onClick={() => setShowSubmitConfirmation(true)}
            type="button"
          >
            Submit mock exam
          </button>
        ) : (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            onClick={() => setCurrentQuestionIndex((index) => index + 1)}
            type="button"
          >
            Next question
          </button>
        )}
      </nav>

      {showSubmitConfirmation && (
        <div
          aria-labelledby="submit-exam-title"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-ink" id="submit-exam-title">
              Submit mock exam?
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              You have answered {answeredCount} of {questions.length} questions.
              {unansweredCount > 0
                ? ` ${unansweredCount} question${unansweredCount === 1 ? " is" : "s are"} unanswered.`
                : " All questions have an answer."}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              Answers cannot be changed after submission.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road"
                onClick={() => setShowSubmitConfirmation(false)}
                type="button"
              >
                Continue exam
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={submitExam}
                type="button"
              >
                Submit and view results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
