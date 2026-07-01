"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  REAL_LONDON_BETA_FEEDBACK_ISSUE_TYPES,
  buildRealLondonBetaFeedbackMetadata,
  submitRealLondonBetaFeedbackToApi,
  type RealLondonBetaFeedbackIssueType,
  type RealLondonBetaFeedbackSubmissionResult
} from "./realLondonBetaFeedback";

type RealLondonBetaFeedbackFormProps = {
  mapId: string;
  mapVersion: string;
  exerciseId: string;
  exerciseVersion: string;
  exerciseTitle: string;
  betaEnabled: boolean;
};

const issueTypeLabels: Record<RealLondonBetaFeedbackIssueType, string> = {
  "route-unclear": "Route unclear",
  "map-display-issue": "Map display issue",
  "control-touch-issue": "Control or touch issue",
  "exercise-difficulty-issue": "Exercise difficulty issue",
  "wrong-restriction-legality-concern": "Wrong restriction or legality concern",
  bug: "Bug",
  other: "Other"
};

export function RealLondonBetaFeedbackForm({
  mapId,
  mapVersion,
  exerciseId,
  exerciseVersion,
  exerciseTitle,
  betaEnabled
}: RealLondonBetaFeedbackFormProps) {
  const [rating, setRating] = useState("5");
  const [issueType, setIssueType] = useState<RealLondonBetaFeedbackIssueType>("route-unclear");
  const [comments, setComments] = useState("");
  const [result, setResult] = useState<RealLondonBetaFeedbackSubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const metadataPreview = useMemo(
    () => ({
      mapId,
      mapVersion,
      exerciseId,
      exerciseVersion
    }),
    [exerciseId, exerciseVersion, mapId, mapVersion]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const metadata = buildRealLondonBetaFeedbackMetadata({
      mapId,
      mapVersion,
      exerciseId,
      exerciseVersion,
      exerciseTitle,
      betaEnabled
    });

    try {
      const submitResult = await submitRealLondonBetaFeedbackToApi({
        metadata,
        draft: {
          rating: Number(rating),
          issueType,
          comments
        }
      });

      setResult(submitResult);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm font-bold uppercase tracking-wide text-road">
        Beta feedback
      </p>
      <h2 className="mt-2 text-xl font-bold text-ink">Share what happened</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
        This form saves feedback through the beta feedback API when storage is available. If storage is unavailable,
        your typed comment stays here so you can try again later.
      </p>

      <form className="mt-4 grid gap-4 lg:grid-cols-[220px_260px_minmax(0,1fr)]" onSubmit={handleSubmit}>
        <label className="text-sm font-semibold text-slate-800">
          Rating
          <select
            className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            onChange={(event) => setRating(event.target.value)}
            value={rating}
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} / 5
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-800">
          Issue type
          <select
            className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            onChange={(event) => setIssueType(event.target.value as RealLondonBetaFeedbackIssueType)}
            value={issueType}
          >
            {REAL_LONDON_BETA_FEEDBACK_ISSUE_TYPES.map((value) => (
              <option key={value} value={value}>
                {issueTypeLabels[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-800">
          Comments
          <textarea
            className="mt-2 block min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            onChange={(event) => setComments(event.target.value)}
            placeholder="Tell us what was confusing, broken, too easy, too hard, or hard to use."
            value={comments}
          />
        </label>

        <div className="lg:col-span-3">
          <details className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            <summary className="cursor-pointer font-semibold text-slate-800">Feedback metadata</summary>
            <dl className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="font-semibold">Map</dt>
                <dd>{metadataPreview.mapId}</dd>
              </div>
              <div>
                <dt className="font-semibold">Map version</dt>
                <dd>{metadataPreview.mapVersion}</dd>
              </div>
              <div>
                <dt className="font-semibold">Exercise</dt>
                <dd>{metadataPreview.exerciseId}</dd>
              </div>
              <div>
                <dt className="font-semibold">Exercise version</dt>
                <dd>{metadataPreview.exerciseVersion}</dd>
              </div>
            </dl>
          </details>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:col-span-3">
          <button
            aria-busy={isSubmitting}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Saving feedback..." : "Submit beta feedback"}
          </button>
          {result ? (
            <p
              className={`text-sm font-semibold ${
                result.status === "success" ? "text-success" : "text-red-700"
              }`}
            >
              {result.message}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
