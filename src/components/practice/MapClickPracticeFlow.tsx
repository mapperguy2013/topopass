"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LOCAL_LEARNER_ID } from "@/lib/db/localPersistence";
import { orderQuestionsByRetryQueue } from "@/lib/db/mistakeRetryQueue";
import { savePracticeAttempt } from "@/lib/db/practiceAttemptRepository";
import { demoMapClickQuestions } from "@/lib/mapClickQuestions";
import { createMapClickReviewData } from "@/lib/reviewData";
import {
  MapClickQuestion,
  type MapClickQuestionResult
} from "@/src/components/questions/MapClickQuestion";
import { QuestionExplanation } from "@/src/components/questions/QuestionExplanation";

const basePracticeQuestions = demoMapClickQuestions.filter(
  (question) => question.isActive
);

export function MapClickPracticeFlow() {
  const [practiceQuestions, setPracticeQuestions] = useState(basePracticeQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "failed">(
    "idle"
  );
  const [submittedResult, setSubmittedResult] =
    useState<MapClickQuestionResult | null>(null);
  const currentQuestion = practiceQuestions[currentQuestionIndex];

  useEffect(() => {
    setPracticeQuestions(
      orderQuestionsByRetryQueue(basePracticeQuestions, "map-click")
    );
  }, []);

  if (!currentQuestion) {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        No active map-click questions are available.
      </section>
    );
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
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-road">
          Question {currentQuestionIndex + 1} of {practiceQuestions.length}
        </p>
        <h2 className="mt-1 text-xl font-bold text-ink">
          Map location practice
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Click the requested London location on the map, then submit your
          answer to check the distance.
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
            {submittedResult.isCorrect ? "Correct." : "Try again."} You clicked{" "}
            {Math.round(submittedResult.distance)} metres from the target. The
            accepted radius is {currentQuestion.toleranceMeters} metres.
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
    </div>
  );
}
