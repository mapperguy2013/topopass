"use client";

import Link from "next/link";
import { useState } from "react";
import { RouteDrawingQuestion } from "@/src/components/route/RouteDrawingQuestion";
import { kingsCrossEustonRouteGraph } from "@/src/data/maps/kings-cross-euston/routeGraph";
import { getActiveRouteQuestions } from "@/src/data/routeQuestions";

// Student practice reads only active questions committed to the source bank.
// Browser-local admin drafts are deliberately not included here.
const practiceQuestions = getActiveRouteQuestions();

export function RoutePracticeFlow() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const currentQuestion = practiceQuestions[currentQuestionIndex];

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
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-road">
              Route {currentQuestionIndex + 1} of {practiceQuestions.length}
            </p>
            <h2 className="mt-1 text-xl font-bold text-ink">
              Point-to-point route practice
            </h2>
          </div>
          <span className="w-fit rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
            {currentQuestion.difficulty ?? "Practice"}
          </span>
        </div>

        <dl className="mt-4 grid border-t border-slate-200 pt-4 sm:grid-cols-2">
          <div className="pb-3 sm:border-r sm:border-slate-200 sm:pb-0 sm:pr-5">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Pickup / start
            </dt>
            <dd className="mt-1 text-base font-bold text-ink">
              {currentQuestion.fromLabel}
            </dd>
          </div>
          <div className="border-t border-slate-200 pt-3 sm:border-t-0 sm:pl-5 sm:pt-0">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Destination / end
            </dt>
            <dd className="mt-1 text-base font-bold text-ink">
              {currentQuestion.toLabel}
            </dd>
          </div>
        </dl>
      </section>

      <RouteDrawingQuestion
        acceptedRoutePoints={acceptedRoutePoints}
        graph={kingsCrossEustonRouteGraph}
        key={`${currentQuestion.id}-${attemptNumber}`}
        mapImagePath="/maps/kings-cross-euston/map.svg"
        question={currentQuestion}
        showDeveloperTools={false}
      />

      <nav
        aria-label="Route practice navigation"
        className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-road hover:text-road"
          href="/practice"
        >
          Back to Practice
        </Link>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-road hover:text-road"
          onClick={() => setAttemptNumber((attempt) => attempt + 1)}
          type="button"
        >
          Try again
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-road hover:text-road disabled:cursor-not-allowed disabled:text-slate-300"
          disabled={isFirstQuestion}
          onClick={() => selectQuestion(currentQuestionIndex - 1)}
          type="button"
        >
          Previous route
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:ml-auto"
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
