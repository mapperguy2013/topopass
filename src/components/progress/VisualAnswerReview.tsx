"use client";

import Link from "next/link";
import { useState } from "react";
import {
  getInitialAnswerVisibility,
  retryHrefForMistakeType,
  toggleAnswerVisibility,
  type ReviewMistakeType
} from "./visualAnswerReviewHelpers";
import {
  MapClickAnswerReview,
  type MapClickAnswerReviewProps
} from "./MapClickAnswerReview";
import {
  RouteAnswerReview,
  type RouteAnswerReviewProps
} from "./RouteAnswerReview";

export type VisualAnswerReviewProps = {
  type: ReviewMistakeType;
  mapClick?: Omit<MapClickAnswerReviewProps, "showAnswer"> | null;
  route?: Omit<RouteAnswerReviewProps, "showAnswer"> | null;
};

export function VisualAnswerReview({
  type,
  mapClick,
  route
}: VisualAnswerReviewProps) {
  const [showAnswer, setShowAnswer] = useState(getInitialAnswerVisibility);
  const retryHref = retryHrefForMistakeType(type);

  return (
    <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Visual answer review
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Correct answers are hidden by default so you can retry first.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            aria-pressed={showAnswer}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            onClick={() => setShowAnswer((current) => toggleAnswerVisibility(current))}
            type="button"
          >
            {showAnswer ? "Hide Answer" : "Show Answer"}
          </button>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            href={retryHref}
          >
            Try This Question Again
          </Link>
        </div>
      </div>

      <div className="mt-4">
        {type === "map-click" && mapClick && (
          <MapClickAnswerReview {...mapClick} showAnswer={showAnswer} />
        )}
        {type === "route" && route && (
          <RouteAnswerReview {...route} showAnswer={showAnswer} />
        )}
      </div>
    </section>
  );
}
