"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_MOCK_EXAM_CONFIG } from "@/lib/mockExamConfig";
import {
  createMapClickReviewData,
  createRouteReviewData
} from "@/lib/reviewData";
import {
  calculateMockExamResult,
  removeMockExamAnswer,
  saveMockExamAnswer,
  scoreMockExamQuestion,
  type MockExamAnswer,
  type MockExamAnswers
} from "@/lib/mockExamEngine";
import {
  isMockQuestionFlagged,
  normalizeFlaggedQuestionIds,
  toggleMockQuestionFlag
} from "@/lib/mockExamFlags";
import { validateMockExamQuestionForNext } from "@/lib/mockExamNavigation";
import {
  listLocalMockAttempts,
  listLocalPracticeAttempts,
  LOCAL_LEARNER_ID
} from "@/lib/db/localPersistence";
import { saveMockAttempt } from "@/lib/db/mockAttemptRepository";
import { buildMockExamForMode } from "@/lib/mockExamModeBuilder";
import {
  getMockExamModeMetadata,
  normalizeMockExamMode,
  type MockExamModeId
} from "@/lib/mockExamModes";
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
  type KnowledgeMockQuestion,
  type MockExamQuestion,
  type RouteDrawingMockQuestion
} from "@/lib/mockTestQuestions";
import { MockModeSelection } from "@/src/components/mock-test/MockModeSelection";
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

type MockExamScreen = "selection" | "exam" | "results" | "review";
type SubmissionReason = "submitted" | "time-expired";

function createAttemptId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

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
            className={`min-h-12 rounded-md border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road ${
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
          routePoints: submittedAnswer.routePoints,
          reviewData: createRouteReviewData({
            question: question.routeQuestion,
            userRoutePoints: submittedAnswer.routePoints,
            routeScore: submittedAnswer.result
          })
        })
      }
      onAnswerReset={onAnswerReset}
      question={question.routeQuestion}
      showDeveloperTools={false}
      showResult={false}
      submitMode="auto"
    />
  );
}

function FlagIcon({ active = false }: { active?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M6 4v16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={2}
      />
      <path
        d="M7 5h10l-2.5 4L17 13H7z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </svg>
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
  const [flaggedQuestionIds, setFlaggedQuestionIds] = useState<string[]>([]);
  const [mode, setMode] = useState<MockExamScreen>("selection");
  const [selectedMode, setSelectedMode] =
    useState<MockExamModeId>("practice");
  const [modeMessage, setModeMessage] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(
    DEFAULT_MOCK_EXAM_CONFIG.durationMinutes * 60
  );
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [submissionReason, setSubmissionReason] =
    useState<SubmissionReason>("submitted");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [persistedAttemptId, setPersistedAttemptId] = useState<string | null>(
    null
  );
  const [persistenceStatus, setPersistenceStatus] = useState<
    "idle" | "saving" | "saved" | "failed"
  >("idle");
  const [navigationMessage, setNavigationMessage] = useState<string | null>(
    null
  );
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;
  const currentQuestionFlagged = currentQuestion
    ? isMockQuestionFlagged(flaggedQuestionIds, currentQuestion.id)
    : false;
  const answeredCount = questions.filter((question) => answers[question.id]).length;
  const unansweredCount = questions.length - answeredCount;
  const flaggedCount = flaggedQuestionIds.length;
  const result = useMemo(
    () =>
      calculateMockExamResult(
        questions,
        answers,
        DEFAULT_MOCK_EXAM_CONFIG.passPercentage,
        flaggedQuestionIds
      ),
    [answers, flaggedQuestionIds, questions]
  );
  const selectedModeMetadata = getMockExamModeMetadata(selectedMode);

  const saveAnswer = useCallback(
    (questionId: string, answer: MockExamAnswer) => {
      setNavigationMessage(null);
      setAnswers((current) => saveMockExamAnswer(current, questionId, answer));
    },
    []
  );

  const resetAnswer = useCallback((questionId: string) => {
    setNavigationMessage(null);
    setAnswers((current) => removeMockExamAnswer(current, questionId));
  }, []);

  const toggleQuestionFlag = useCallback((questionId: string) => {
    setNavigationMessage(null);
    setFlaggedQuestionIds((current) =>
      toggleMockQuestionFlag(current, questionId)
    );
  }, []);

  const startNewExam = useCallback((mockMode: MockExamModeId = selectedMode) => {
    const builtExam = buildMockExamForMode({
      mode: mockMode,
      practiceAttempts: listLocalPracticeAttempts(),
      mockAttempts: listLocalMockAttempts()
    });

    if (builtExam.emptyStateReason || builtExam.questions.length === 0) {
      setModeMessage(
        builtExam.emptyStateReason ??
          "This mock mode could not find enough questions to start."
      );
      setMode("selection");
      return;
    }

    const selectedQuestions = builtExam.questions;
    const nextAttemptId = createAttemptId();
    const nextStartedAt = Date.now();
    const nextExpiresAt =
      nextStartedAt + DEFAULT_MOCK_EXAM_CONFIG.durationMinutes * 60 * 1000;

    clearActiveMockExam();
    setSelectedMode(mockMode);
    setModeMessage(builtExam.fallbackMessage ?? null);
    setQuestions(selectedQuestions);
    setAnswers({});
    setFlaggedQuestionIds([]);
    setCurrentQuestionIndex(0);
    setAttemptId(nextAttemptId);
    setStartedAt(nextStartedAt);
    setExpiresAt(nextExpiresAt);
    setPersistedAttemptId(null);
    setPersistenceStatus("idle");
    setRemainingSeconds(DEFAULT_MOCK_EXAM_CONFIG.durationMinutes * 60);
    setSubmissionReason("submitted");
    setShowSubmitConfirmation(false);
    setNavigationMessage(null);
    setMode("exam");
  }, [selectedMode]);

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
    setFlaggedQuestionIds(
      normalizeFlaggedQuestionIds(
        storedAttempt.flaggedQuestionIds,
        storedQuestions.map((question) => question.id)
      )
    );
    setSelectedMode(normalizeMockExamMode(storedAttempt.mode));
    setAttemptId(storedAttempt.attemptId ?? createAttemptId());
    setStartedAt(
      storedAttempt.startedAt ??
        storedAttempt.expiresAt -
          DEFAULT_MOCK_EXAM_CONFIG.durationMinutes * 60 * 1000
    );
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
      attemptId: attemptId ?? undefined,
      questionIds: questions.map((question) => question.id),
      currentQuestionIndex,
      answers,
      flaggedQuestionIds,
      startedAt: startedAt ?? undefined,
      expiresAt,
      mode: selectedMode
    });
  }, [
    answers,
    attemptId,
    currentQuestionIndex,
    expiresAt,
    flaggedQuestionIds,
    mode,
    questions,
    selectedMode,
    startedAt
  ]);

  useEffect(() => {
    if (
      mode !== "results" ||
      questions.length === 0 ||
      persistedAttemptId ||
      persistenceStatus === "saving"
    ) {
      return;
    }

    let cancelled = false;
    const submittedAt = Date.now();
    const durationSeconds = startedAt
      ? Math.max(0, Math.round((submittedAt - startedAt) / 1000))
      : null;

    setPersistenceStatus("saving");
    saveMockAttempt({
      id: attemptId ?? undefined,
      userId: LOCAL_LEARNER_ID,
      questionIds: questions.map((question) => question.id),
      answers,
      result,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      durationSeconds,
      mode: selectedMode
    }).then((saveResult) => {
      if (cancelled) return;
      setPersistedAttemptId(saveResult.id ?? attemptId);
      setPersistenceStatus(saveResult.persisted ? "saved" : "failed");
    });

    return () => {
      cancelled = true;
    };
  }, [
    answers,
    attemptId,
    expiresAt,
    mode,
    persistedAttemptId,
    persistenceStatus,
    questions,
    result,
    selectedMode,
    startedAt
  ]);

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
    startNewExam(selectedMode);
  }

  function goToQuestion(index: number) {
    setNavigationMessage(null);
    setCurrentQuestionIndex(index);
  }

  function goToNextQuestion() {
    if (!currentQuestion) return;

    const navigation = validateMockExamQuestionForNext(
      currentQuestion,
      currentAnswer
    );

    if (!navigation.canAdvance) {
      setNavigationMessage(navigation.message);
      return;
    }

    goToQuestion(currentQuestionIndex + 1);
  }

  function requestSubmitExam() {
    if (!currentQuestion) return;

    const navigation = validateMockExamQuestionForNext(
      currentQuestion,
      currentAnswer
    );

    if (!navigation.canAdvance) {
      setNavigationMessage(navigation.message);
      return;
    }

    setNavigationMessage(null);
    setShowSubmitConfirmation(true);
  }

  if (mode === "selection") {
    return (
      <MockModeSelection message={modeMessage} onStart={startNewExam} />
    );
  }

  if (mode === "results") {
    return (
      <MockExamResults
        onRestart={restartExam}
        onReview={() => setMode("review")}
        persistenceStatus={persistenceStatus}
        questions={questions}
        result={result}
        mode={selectedModeMetadata}
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
        mode={selectedModeMetadata}
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
      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">
              {selectedModeMetadata.label}: Question {currentQuestionIndex + 1}{" "}
              of {questions.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {answeredCount} answered - {unansweredCount} unanswered -{" "}
              {flaggedCount} flagged -{" "}
              {questionTypeLabel(currentQuestion)}
              {currentQuestion.category
                ? ` - ${currentQuestion.category}`
                : ""}
            </p>
          </div>
          <p
            aria-live="polite"
            className={`w-fit rounded-md border px-3 py-1.5 text-center font-mono text-base font-bold sm:shrink-0 ${
              timerLevel === "one-minute-warning"
                ? "border-red-300 bg-red-50 text-red-800"
                : timerLevel === "five-minute-warning"
                  ? "border-amber-300 bg-amber-50 text-amber-900"
                  : "border-slate-200 bg-slate-50 text-ink"
            }`}
          >
            {formatExamTime(remainingSeconds)}
          </p>
        </div>

        {modeMessage && (
          <p className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-900">
            {modeMessage}
          </p>
        )}

        {selectedModeMetadata.examStyle && (
          <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-700">
            Exam Simulation is running under exam-style conditions. Feedback,
            answers, explanations, and tips appear only after final submission.
          </p>
        )}

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

        <div className="mt-3 h-2 overflow-hidden rounded bg-slate-100">
          <div
            className="h-full bg-road transition-[width]"
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`
            }}
          />
        </div>
        <div className="mt-2 flex justify-end">
          <button
            className="inline-flex min-h-9 items-center justify-center rounded-md px-2 text-xs font-semibold text-slate-500 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            onClick={restartExam}
            type="button"
          >
            Restart exam
          </button>
        </div>

        <nav aria-label="Question navigator" className="mt-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {questions.map((question, index) => {
                const isCurrent = index === currentQuestionIndex;
                const isAnswered = Boolean(answers[question.id]);
                const isFlagged = isMockQuestionFlagged(
                  flaggedQuestionIds,
                  question.id
                );
                return (
                  <button
                    aria-current={isCurrent ? "step" : undefined}
                    aria-label={`Question ${index + 1}: ${isAnswered ? "answered" : "unanswered"}${isFlagged ? ", flagged" : ""}`}
                    className={`relative flex size-11 items-center justify-center rounded-md border text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road ${
                      isCurrent
                        ? "border-road bg-road text-white"
                        : isAnswered
                          ? "border-ink bg-ink text-white"
                          : "border-slate-300 bg-white text-slate-600 hover:border-road"
                    }`}
                    key={question.id}
                    onClick={() => goToQuestion(index)}
                    type="button"
                  >
                    {index + 1}
                    {isFlagged && (
                      <span className="absolute -right-1 -top-1 size-3 rounded-full border border-white bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>
            <button
              aria-label={
                currentQuestionFlagged
                  ? "Remove flag from this question"
                  : "Flag this question"
              }
              aria-pressed={currentQuestionFlagged}
              className={`inline-flex min-h-10 w-fit shrink-0 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road ${
                currentQuestionFlagged
                  ? "border-amber-300 bg-amber-100 text-amber-950 hover:bg-amber-200"
                  : "border-slate-300 bg-white text-slate-700 hover:border-amber-400 hover:text-amber-900"
              }`}
              onClick={() => toggleQuestionFlag(currentQuestion.id)}
              type="button"
            >
              <FlagIcon active={currentQuestionFlagged} />
              {currentQuestionFlagged ? "Flagged" : "Flag"}
            </button>
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
          description="Click or tap the map to save the selected location. Results are shown after the exam."
          initialAnswer={initialMapAnswer}
          initialCenter={currentQuestion.initialCenter}
          initialZoom={currentQuestion.initialZoom}
          key={currentQuestion.id}
          onAnswer={(mapAnswer) =>
            saveAnswer(currentQuestion.id, {
              type: "map-click",
              coordinates: mapAnswer.coordinates,
              reviewData: createMapClickReviewData({
                questionId: currentQuestion.id,
                prompt: currentQuestion.prompt,
                userCoordinates: mapAnswer.coordinates,
                correctCoordinates: currentQuestion.target,
                distanceMeters: mapAnswer.distance,
                score: mapAnswer.isCorrect ? 100 : 0,
                isCorrect: mapAnswer.isCorrect,
                explanation: currentQuestion.explanation,
                tip: currentQuestion.tip,
                acceptedAreaDescription: currentQuestion.acceptedAreaDescription
              })
            })
          }
          onAnswerReset={() => resetAnswer(currentQuestion.id)}
          passRadiusMetres={currentQuestion.toleranceMeters}
          showResult={false}
          submitMode="auto"
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

      {navigationMessage && (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          {navigationMessage}
        </p>
      )}

      <nav
        aria-label="Mock exam navigation"
        className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
      >
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road disabled:cursor-not-allowed disabled:text-slate-300"
          disabled={isFirstQuestion}
          onClick={() => goToQuestion(currentQuestionIndex - 1)}
          type="button"
        >
          Previous question
        </button>
        <p className="text-center text-sm text-slate-600 sm:mx-auto">
          {currentAnswer ? "Answer saved" : "Not answered"}
        </p>
        {isLastQuestion ? (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            onClick={requestSubmitExam}
            type="button"
          >
            Submit mock exam
          </button>
        ) : (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            onClick={goToNextQuestion}
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
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                onClick={() => setShowSubmitConfirmation(false)}
                type="button"
              >
                Continue exam
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
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
