"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LOCAL_LEARNER_ID } from "@/lib/db/localPersistence";
import { orderQuestionsByRetryQueue } from "@/lib/db/mistakeRetryQueue";
import { savePracticeAttempt } from "@/lib/db/practiceAttemptRepository";
import { demoMapClickQuestions } from "@/lib/mapClickQuestions";
import {
  filterByPracticeFilter,
  normalizePracticeQuestionFilter,
  upsertPracticeSessionResult,
  type PracticeSessionResult
} from "@/lib/practice/practiceSession";
import { createMapClickReviewData } from "@/lib/reviewData";
import {
  PracticeEmptyState,
  PracticeSessionIntro,
  PracticeSessionSummaryPanel
} from "@/src/components/practice/PracticeSessionPanels";
import {
  MapClickQuestion,
  type MapClickQuestionResult
} from "@/src/components/questions/MapClickQuestion";
import { QuestionExplanation } from "@/src/components/questions/QuestionExplanation";

const basePracticeQuestions = demoMapClickQuestions.filter(
  (question) => question.isActive
);

type MapClickPracticeFlowProps = {
  initialTopic?: string;
  initialDifficulty?: string;
};

export function MapClickPracticeFlow({
  initialTopic,
  initialDifficulty
}: MapClickPracticeFlowProps) {
  const filter = useMemo(
    () => normalizePracticeQuestionFilter(initialTopic, initialDifficulty),
    [initialDifficulty, initialTopic]
  );
  const filteredBaseQuestions = useMemo(
    () => filterByPracticeFilter(basePracticeQuestions, filter),
    [filter]
  );
  const [practiceQuestions, setPracticeQuestions] =
    useState(filteredBaseQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [sessionResults, setSessionResults] = useState<PracticeSessionResult[]>(
    []
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "failed">(
    "idle"
  );
  const [submittedResult, setSubmittedResult] =
    useState<MapClickQuestionResult | null>(null);
  const currentQuestion = practiceQuestions[currentQuestionIndex];

  useEffect(() => {
    setPracticeQuestions(
      orderQuestionsByRetryQueue(filteredBaseQuestions, "map-click")
    );
    setCurrentQuestionIndex(0);
    setAttemptNumber(0);
    setSaveStatus("idle");
    setSubmittedResult(null);
  }, [filteredBaseQuestions]);

  if (!currentQuestion) {
    return <PracticeEmptyState filter={filter} questionTypeLabel="map-click" />;
  }

  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === practiceQuestions.length - 1;

  function selectQuestion(index: number) {
    setCurrentQuestionIndex(index);
    setAttemptNumber(0);
    setSaveStatus("idle");
    setSubmittedResult(null);
  }

  function tryAgain() {
    setAttemptNumber((attempt) => attempt + 1);
    setSaveStatus("idle");
    setSubmittedResult(null);
  }

  async function saveMapClickAttempt(answer: MapClickQuestionResult) {
    setSaveStatus("saving");
    setSubmittedResult(answer);
    const roundedDistance = Math.round(answer.distance);
    setSessionResults((current) =>
      upsertPracticeSessionResult(current, {
        questionId: currentQuestion.id,
        prompt: currentQuestion.prompt,
        questionType: "map-click",
        topic: currentQuestion.category,
        difficulty: currentQuestion.difficulty,
        passed: answer.isCorrect,
        percentage: answer.isCorrect ? 100 : 0,
        learnerAnswer: `${roundedDistance}m from target`,
        correctAnswer: currentQuestion.targetName,
        feedback: answer.isCorrect
          ? "Your click landed inside the accepted target area."
          : `Use ${currentQuestion.targetName} as the anchor and aim within ${currentQuestion.toleranceMeters}m.`
      })
    );
    const reviewData = createMapClickReviewData({
      questionId: currentQuestion.id,
      prompt: currentQuestion.prompt,
      userCoordinates: answer.coordinates,
      correctCoordinates: currentQuestion.answer,
      distanceMeters: answer.distance,
      score: answer.isCorrect ? 100 : 0,
      isCorrect: answer.isCorrect,
      explanation: currentQuestion.explanation,
      tip: currentQuestion.tip,
      acceptedAreaDescription: currentQuestion.acceptedAreaDescription
    });
    const result = await savePracticeAttempt({
      userId: LOCAL_LEARNER_ID,
      practiceMode: "map-click",
      questionId: currentQuestion.id,
      questionType: "map-click",
      answer: {
        coordinates: answer.coordinates
      },
      result: {
        distance: answer.distance,
        toleranceMeters: currentQuestion.toleranceMeters,
        target: currentQuestion.answer,
        targetName: currentQuestion.targetName,
        acceptedAreaDescription: currentQuestion.acceptedAreaDescription,
        explanation: currentQuestion.explanation,
        tip: currentQuestion.tip,
        reviewData
      },
      score: answer.isCorrect ? 1 : 0,
      maxScore: 1,
      passed: answer.isCorrect
    });

    setSaveStatus(result.persisted ? "saved" : "failed");
  }

  return (
    <div className="space-y-5">
      <PracticeSessionIntro
        baseHref="/practice/map-click"
        filter={filter}
        questionCount={practiceQuestions.length}
        questionType="map-click"
        title="Map-click location practice"
      />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-road">
          Question {currentQuestionIndex + 1} of {practiceQuestions.length}
        </p>
        <h2 className="mt-1 text-xl font-bold text-ink">
          {currentQuestion.prompt}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Click or tap the requested location. You can adjust the marker before
          submitting your answer.
        </p>
      </section>

      <MapClickQuestion
        description="Click or tap the requested location on the map, then submit your answer."
        initialCenter={currentQuestion.answer}
        initialZoom={15}
        key={`${currentQuestion.id}-${attemptNumber}`}
        onAnswer={saveMapClickAttempt}
        onAnswerReset={() => {
          setSaveStatus("idle");
          setSubmittedResult(null);
        }}
        passRadiusMetres={currentQuestion.toleranceMeters}
        target={currentQuestion.answer}
        title={currentQuestion.prompt}
      />

      {submittedResult && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-800">Answer feedback</p>
          <p className="mt-2 text-sm text-slate-700">
            {submittedResult.isCorrect
              ? "Correct. Your click was inside the accepted area."
              : "Not quite. Check the target area and try again if needed."}{" "}
            You clicked {Math.round(submittedResult.distance)} metres from the
            target. The accepted radius is {currentQuestion.toleranceMeters}{" "}
            metres.
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Expected target:{" "}
            <span className="font-semibold">{currentQuestion.targetName}</span>
          </p>
          <div className="mt-4">
            <QuestionExplanation
              acceptedAreaDescription={currentQuestion.acceptedAreaDescription}
              explanation={currentQuestion.explanation}
              tip={currentQuestion.tip}
            />
          </div>
        </section>
      )}

      {saveStatus !== "idle" && (
        <p
          className={`rounded-md border p-3 text-sm font-semibold ${
            saveStatus === "failed"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-blue-200 bg-blue-50 text-blue-900"
          }`}
        >
          {saveStatus === "saving" && "Saving practice attempt..."}
          {saveStatus === "saved" &&
            "Practice attempt saved to your progress history."}
          {saveStatus === "failed" &&
            "Practice attempt could not be saved in this browser."}
        </p>
      )}

      <nav className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
          href="/practice"
        >
          Back to Practice
        </Link>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
          onClick={tryAgain}
          type="button"
        >
          Try again
        </button>
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
