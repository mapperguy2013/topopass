import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import {
  BETA_FEEDBACK_REVIEW_API_PATH,
  BETA_FEEDBACK_REVIEW_ENABLED_FLAG,
  buildBetaFeedbackReviewReport,
  normaliseBetaFeedbackReviewFilters,
  type BetaFeedbackReviewFilters,
  type BetaFeedbackReviewRecord
} from "@/app/practice/real-london/betaFeedbackReview";

type DevBetaFeedbackPageProps = {
  searchParams?: Promise<{
    mapId?: string;
    exerciseId?: string;
    rating?: string;
    feedbackType?: string;
  }>;
};

export const metadata = buildPageMetadata({
  title: "Beta Feedback Review",
  description: "Internal review and export surface for stored Real London beta feedback.",
  path: "/dev/beta-feedback"
});

export default async function DevBetaFeedbackPage({ searchParams }: DevBetaFeedbackPageProps) {
  const params = await searchParams;
  const filters = readFilters(params);
  const normalisedFilters = normaliseBetaFeedbackReviewFilters(filters);
  const report = await buildBetaFeedbackReviewReport({
    env: process.env,
    filters
  });

  return (
    <AppShell title="Beta Feedback Review" frameClassName="max-w-[1600px]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Internal dev tool</p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-ink">Real London beta feedback review</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
                Review validated stored feedback, filter it for QA triage, and export CSV or JSON for internal beta
                iteration. This page is unavailable unless {BETA_FEEDBACK_REVIEW_ENABLED_FLAG} is enabled.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                Status: {report.status}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                Source: {report.storageSource}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                Records: {report.acceptedRecordCount}
              </span>
            </div>
          </div>
        </section>

        {report.status === "available" ? (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <form className="grid gap-3 md:grid-cols-5" action="/dev/beta-feedback">
                <label className="text-sm font-semibold text-slate-700">
                  Map id
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    defaultValue={normalisedFilters.mapId}
                    name="mapId"
                    placeholder="osm-real-london-pilot"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Exercise id
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    defaultValue={normalisedFilters.exerciseId}
                    name="exerciseId"
                    placeholder="exercise id"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Rating
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    defaultValue={normalisedFilters.rating || ""}
                    name="rating"
                  >
                    <option value="">Any</option>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Feedback type
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    defaultValue={normalisedFilters.feedbackType}
                    name="feedbackType"
                    placeholder="route-unclear"
                  />
                </label>
                <div className="flex items-end gap-2">
                  <button
                    className="min-h-10 rounded-md bg-road px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                    type="submit"
                  >
                    Filter
                  </button>
                  <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" href="/dev/beta-feedback">
                    Clear
                  </Link>
                </div>
              </form>
              <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
                <Link className="rounded-md border border-slate-300 px-3 py-2" href={buildExportHref(filters, "csv")}>
                  Export CSV
                </Link>
                <Link className="rounded-md border border-slate-300 px-3 py-2" href={buildExportHref(filters, "json")}>
                  Export JSON
                </Link>
                <span className="rounded-md bg-slate-50 px-3 py-2 text-slate-600">
                  Newest first
                </span>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-lg font-bold text-ink">Stored feedback</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {report.acceptedRecordCount} validated records shown, {report.rejectedRecordCount} skipped invalid
                  records.
                </p>
              </div>
              {report.records.length === 0 ? (
                <p className="p-5 text-sm text-slate-600">No validated feedback records match these filters.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3">Map</th>
                        <th className="px-4 py-3">Exercise</th>
                        <th className="px-4 py-3">Rating</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Feedback</th>
                        <th className="px-4 py-3">Versions</th>
                        <th className="px-4 py-3">Storage</th>
                        <th className="px-4 py-3">Raw</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.records.map((record) => (
                        <FeedbackRow key={record.id} record={record} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {report.rejectedRecords.length > 0 ? (
              <details className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
                <summary className="cursor-pointer font-bold">Skipped invalid stored records</summary>
                <ul className="mt-3 space-y-2">
                  {report.rejectedRecords.map((record) => (
                    <li key={`${record.storageSource}:${record.id}`}>
                      {record.id}: {record.reasonCodes.join(", ")}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </>
        ) : (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-sm">
            <h2 className="text-xl font-bold">Review unavailable</h2>
            <p className="mt-2 text-sm leading-6">{report.message}</p>
            <p className="mt-2 text-sm leading-6">
              This is intentional unless the internal review flag and safe storage configuration are present.
            </p>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold">Reason</dt>
                <dd>{report.reasonCode}</dd>
              </div>
              <div>
                <dt className="font-semibold">Storage</dt>
                <dd>{report.storageStatus}</dd>
              </div>
            </dl>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function FeedbackRow({ record }: { record: BetaFeedbackReviewRecord }) {
  return (
    <tr className="align-top">
      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{record.createdAt}</td>
      <td className="px-4 py-3 text-slate-700">{record.mapId}</td>
      <td className="px-4 py-3 text-slate-700">
        <p className="font-semibold">{record.exerciseId}</p>
        <p className="text-xs text-slate-500">{record.exerciseTitle}</p>
      </td>
      <td className="px-4 py-3 text-slate-700">{record.rating}</td>
      <td className="px-4 py-3 text-slate-700">{record.feedbackType}</td>
      <td className="max-w-md px-4 py-3 leading-6 text-slate-700">{record.feedbackText}</td>
      <td className="px-4 py-3 text-xs leading-5 text-slate-600">
        <p>Map {record.mapVersion}</p>
        <p>Exercise {record.exerciseVersion}</p>
        {record.appBuildVersion ? <p>App {record.appBuildVersion}</p> : null}
      </td>
      <td className="px-4 py-3 text-xs leading-5 text-slate-600">
        <p>{record.storageSource}</p>
        <p>{record.storageStatus}</p>
      </td>
      <td className="px-4 py-3">
        <details className="max-w-xs rounded-md border border-slate-200 bg-slate-50 p-2 text-xs">
          <summary className="cursor-pointer font-semibold">Payload</summary>
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words">
            {JSON.stringify(record.rawPayload, null, 2)}
          </pre>
        </details>
      </td>
    </tr>
  );
}

function readFilters(
  params: Awaited<DevBetaFeedbackPageProps["searchParams"]>
): BetaFeedbackReviewFilters {
  const rating = Number(params?.rating ?? 0);

  return {
    mapId: params?.mapId,
    exerciseId: params?.exerciseId,
    rating: Number.isInteger(rating) ? rating : undefined,
    feedbackType: params?.feedbackType
  };
}

function buildExportHref(filters: BetaFeedbackReviewFilters, format: "csv" | "json"): string {
  const params = new URLSearchParams();

  if (filters.mapId?.trim()) {
    params.set("mapId", filters.mapId.trim());
  }

  if (filters.exerciseId?.trim()) {
    params.set("exerciseId", filters.exerciseId.trim());
  }

  if (filters.rating) {
    params.set("rating", String(filters.rating));
  }

  if (filters.feedbackType?.trim()) {
    params.set("feedbackType", filters.feedbackType.trim());
  }

  params.set("format", format);

  return `${BETA_FEEDBACK_REVIEW_API_PATH}?${params.toString()}`;
}
