"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LOCAL_LEARNER_ID } from "@/lib/db/localPersistence";
import { orderQuestionsByRetryQueue } from "@/lib/db/mistakeRetryQueue";
import { savePracticeAttempt } from "@/lib/db/practiceAttemptRepository";
import {
  atlasPageToRouteMapBase,
  getAtlasPageById,
  type RouteMapBase
} from "@/lib/map/atlasPages";
import { createRouteReviewData } from "@/lib/reviewData";
import { QuestionExplanation } from "@/src/components/questions/QuestionExplanation";
import { RouteDrawingQuestion } from "@/src/components/route/RouteDrawingQuestion";
import type { RouteDrawingQuestionAnswer } from "@/src/components/route/RouteDrawingQuestion";
import { kingsCrossEustonRouteGraph } from "@/src/data/maps/kings-cross-euston/routeGraph";
import { getActiveRouteQuestions } from "@/src/data/routeQuestions";

// Student practice reads only active questions committed to the source bank.
// Browser-local admin drafts are deliberately not included here.
const basePracticeQuestions = getActiveRouteQuestions();

const fallbackRouteMapBase: RouteMapBase = {
  graph: kingsCrossEustonRouteGraph,
  imagePath: "/maps/kings-cross-euston/map.svg",
  mapAttribution: "(c) OpenStreetMap contributors, ODbL"
};

export function RoutePracticeFlow() {
  const [practiceQuestions, setPracticeQuestions] = useState(basePracticeQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "failed">(
    "idle"
  );
  const [submittedAnswer, setSubmittedAnswer] =
    useState<RouteDrawingQuestionAnswer | null>(null);
  const currentQuestion = practiceQuestions[currentQuestionIndex];

  useEffect(() => {
    setPracticeQuestions(orderQuestionsByRetryQueue(basePracticeQuestions, "route"));
  }, []);

  if (!currentQuestion) {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        No active route questions are available in the route question bank.
      </section>
    );
  }

  const acceptedRoutePoints = currentQuestion.acceptedRoute?.geometry.map(
    ([x, y]) => ({ x, y })
  );
  const atlasPage = getAtlasPageById(currentQuestion.mapPageId);
  const routeMapBase = atlasPage
    ? atlasPageToRouteMapBase(atlasPage)
    : fallbackRouteMapBase;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === practiceQuestions.length - 1;

  if (!acceptedRoutePoints) {
    throw new Error(
      `Accepted route not found for practice question: ${currentQuestion.id}`
    );
  }

  function selectQuestion(index: number) {
    setCurrentQuestionIndex(index);
    setAttemptNumber(0);
    setSaveStatus("idle");
    setSubmittedAnswer(null);
  }

  function tryAgain() {
    setAttemptNumber((attempt) => attempt + 1);
    setSaveStatus("idle");
    setSubmittedAnswer(null);
  }

  async function saveRouteAttempt(answer: RouteDrawingQuestionAnswer) {
    setSaveStatus("saving");
    setSubmittedAnswer(answer);
    const reviewData = createRouteReviewData({
      question: currentQuestion,
      userRoutePoints: answer.routePoints,
      routeScore: answer.result
    });
    const result = await savePracticeAttempt({
      userId: LOCAL_LEARNER_ID,
      practiceMode: "route-drawing",
      questionId: currentQuestion.id,
      questionType: "route-drawing",
      answer: {
        routePoints: answer.routePoints,
        reviewData
      },
      result: {
        ...answer.result,
        explanation: currentQuestion.explanation,
        tip: currentQuestion.tip,
        idealRouteDescription: currentQuestion.idealRouteDescription,
        reviewData
      },
      score: answer.result.score,
      maxScore: answer.result.maxScore,
      passed: answer.result.passed
    });

    setSaveStatus(result.persisted ? "saved" : "failed");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-road">
              Route {currentQuestionIndex + 1} of {practiceQuestions.length}
            </p>
            <h2 className="mt-1 text-lg font-bold text-ink">
              {currentQuestion.title}
            </h2>
          </div>
          <span className="w-fit rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
            {currentQuestion.difficulty ?? "Practice"}
          </span>
        </div>

        <dl className="mt-3 grid gap-2 border-t border-slate-200 pt-3 md:grid-cols-2">
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
              A / Start
            </dt>
            <dd className="mt-1 text-base font-bold text-ink">
              {currentQuestion.fromLabel}
            </dd>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
              B / Destination
            </dt>
            <dd className="mt-1 text-base font-bold text-ink">
              {currentQuestion.toLabel}
            </dd>
          </div>
        </dl>
      </section>

      <RouteDrawingQuestion
        acceptedRoutePoints={acceptedRoutePoints}
        graph={routeMapBase.graph}
        key={`${currentQuestion.id}-${attemptNumber}`}
        mapAttribution={routeMapBase.mapAttribution}
        mapImagePath={routeMapBase.imagePath}
        onAnswer={saveRouteAttempt}
        onAnswerReset={() => {
          setSaveStatus("idle");
          setSubmittedAnswer(null);
        }}
        question={currentQuestion}
        routeScoringConfig={routeMapBase.scoringConfig}
        showDeveloperTools={false}
      />

      {submittedAnswer && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-800">Route feedback</p>
          <p className="mt-2 text-sm text-slate-700">
            {submittedAnswer.result.passed ? "Correct route." : "Route needs work."}{" "}
            Score: {submittedAnswer.result.score}/{submittedAnswer.result.maxScore} (
            {submittedAnswer.result.percentage}%).
          </p>
          <div className="mt-4">
            <QuestionExplanation
              explanation={currentQuestion.explanation}
              idealRouteDescription={currentQuestion.idealRouteDescription}
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

      <nav
        aria-label="Route practice navigation"
        className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center"
      >
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
          Previous route
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road disabled:cursor-not-allowed disabled:bg-slate-300 sm:ml-auto"
          disabled={isLastQuestion}
          onClick={() => selectQuestion(currentQuestionIndex + 1)}
          type="button"
        >
          Next route
        </button>
      </nav>
    </div>
  );
}
