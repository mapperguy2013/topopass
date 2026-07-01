import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import {
  BETA_ATTEMPT_REVIEW_API_PATH,
  BETA_ATTEMPT_REVIEW_ENABLED_FLAG,
  buildBetaAttemptReviewReport,
  normaliseBetaAttemptReviewFilters,
  type BetaAttemptReviewFilters,
  type BetaAttemptReviewRecord
} from "@/app/practice/real-london/betaAttemptReview";

type DevBetaAttemptsPageProps = {
  searchParams?: Promise<{
    mapId?: string;
    exerciseId?: string;
    status?: string;
    legality?: string;
  }>;
};

export const metadata = buildPageMetadata({
  title: "Beta Attempt Review",
  description: "Internal review and repro export surface for stored Real London beta route attempts.",
  path: "/dev/beta-attempts"
});

export default async function DevBetaAttemptsPage({ searchParams }: DevBetaAttemptsPageProps) {
  const params = await searchParams;
  const filters = readFilters(params);
  const normalisedFilters = normaliseBetaAttemptReviewFilters(filters);
  const report = await buildBetaAttemptReviewReport({
    env: process.env,
    filters
  });

  return (
    <AppShell title="Beta Attempt Review" frameClassName="max-w-[1700px]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Internal dev tool</p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-ink">Real London beta attempt review</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
                Review stored beta route attempts, inspect captured map and exercise versions, and export deterministic
                JSON repro payloads for QA. This page is unavailable unless {BETA_ATTEMPT_REVIEW_ENABLED_FLAG} is
                enabled.
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
                Attempts: {report.acceptedRecordCount}
              </span>
            </div>
          </div>
        </section>

        {report.status === "available" ? (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <form className="grid gap-3 md:grid-cols-5" action="/dev/beta-attempts">
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
                  Result
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    defaultValue={normalisedFilters.status}
                    name="status"
                  >
                    <option value="">Any</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                    <option value="blocked">Blocked</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Legality
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    defaultValue={normalisedFilters.legality}
                    name="legality"
                  >
                    <option value="">Any</option>
                    <option value="legal">Legal</option>
                    <option value="illegal">Illegal</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </label>
                <div className="flex items-end gap-2">
                  <button
                    className="min-h-10 rounded-md bg-road px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                    type="submit"
                  >
                    Filter
                  </button>
                  <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" href="/dev/beta-attempts">
                    Clear
                  </Link>
                </div>
              </form>
              <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
                <Link className="rounded-md border border-slate-300 px-3 py-2" href={buildExportHref(filters)}>
                  Export JSON repro
                </Link>
                <span className="rounded-md bg-slate-50 px-3 py-2 text-slate-600">Newest first</span>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-lg font-bold text-ink">Stored beta attempts</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {report.acceptedRecordCount} validated attempts shown, {report.rejectedRecordCount} skipped invalid
                  records.
                </p>
              </div>
              {report.records.length === 0 ? (
                <p className="p-5 text-sm text-slate-600">No validated beta attempts match these filters.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3">Attempt</th>
                        <th className="px-4 py-3">Map / exercise</th>
                        <th className="px-4 py-3">Route</th>
                        <th className="px-4 py-3">Result</th>
                        <th className="px-4 py-3">Legality</th>
                        <th className="px-4 py-3">Route summary</th>
                        <th className="px-4 py-3">Storage</th>
                        <th className="px-4 py-3">Raw</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.records.map((record) => (
                        <AttemptRow key={record.id} record={record} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {report.rejectedRecords.length > 0 ? (
              <details className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
                <summary className="cursor-pointer font-bold">Skipped invalid stored attempts</summary>
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
            <h2 className="text-xl font-bold">Attempt review unavailable</h2>
            <p className="mt-2 text-sm leading-6">{report.message}</p>
            <p className="mt-2 text-sm leading-6">
              This is intentional unless the internal review flag and safe local review storage are present.
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

function AttemptRow({ record }: { record: BetaAttemptReviewRecord }) {
  return (
    <tr className="align-top">
      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{record.createdAt ?? "Unknown"}</td>
      <td className="px-4 py-3 text-slate-700">
        <p className="font-semibold">{record.id}</p>
        <p className="text-xs text-slate-500">{record.reviewTitle}</p>
      </td>
      <td className="px-4 py-3 text-slate-700">
        <p className="font-semibold">{record.mapId ?? "Unknown map"}</p>
        <p className="text-xs text-slate-500">Map version {record.mapVersion ?? "missing"}</p>
        <p className="mt-2 font-semibold">{record.exerciseId}</p>
        <p className="text-xs text-slate-500">{record.exerciseTitle}</p>
        <p className="text-xs text-slate-500">Exercise version {record.exerciseVersion ?? "missing"}</p>
        <p className="mt-2 text-xs text-slate-500">
          {[record.difficulty, record.routeType].filter(Boolean).join(" / ") || "No exercise metadata"}
        </p>
      </td>
      <td className="px-4 py-3 text-slate-700">
        <p>Start: {record.startLabel}</p>
        <p>Destination: {record.destinationLabel}</p>
        {record.checkpointLabels.length > 0 ? (
          <p className="mt-1 text-xs text-slate-500">Checkpoints: {record.checkpointLabels.join(", ")}</p>
        ) : null}
      </td>
      <td className="px-4 py-3 text-slate-700">
        <p className="font-semibold">{record.statusLabel}</p>
        <p>{record.scoreLabel}</p>
        <p className="text-xs text-slate-500">{record.failureReason}</p>
      </td>
      <td className="px-4 py-3 text-slate-700">
        <p className="font-semibold">{record.legalityLabel}</p>
        <p className="text-xs text-slate-500">{record.isLegal === null ? "No stored legality flag" : "Stored result"}</p>
      </td>
      <td className="px-4 py-3 text-slate-700">
        <p>{record.routeDistanceLabel}</p>
        <p className="text-xs text-slate-500">{record.drawnManualRouteSummary}</p>
      </td>
      <td className="px-4 py-3 text-xs leading-5 text-slate-600">
        <p>{record.storageSource}</p>
        <p>{record.storageStatus}</p>
      </td>
      <td className="px-4 py-3">
        <details className="max-w-xs rounded-md border border-slate-200 bg-slate-50 p-2 text-xs">
          <summary className="cursor-pointer font-semibold">Snapshot</summary>
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words">
            {JSON.stringify(record.rawAttemptSnapshot, null, 2)}
          </pre>
        </details>
      </td>
    </tr>
  );
}

function readFilters(params: Awaited<DevBetaAttemptsPageProps["searchParams"]>): BetaAttemptReviewFilters {
  return {
    mapId: params?.mapId,
    exerciseId: params?.exerciseId,
    status: params?.status,
    legality: params?.legality
  };
}

function buildExportHref(filters: BetaAttemptReviewFilters): string {
  const params = new URLSearchParams();

  if (filters.mapId?.trim()) {
    params.set("mapId", filters.mapId.trim());
  }

  if (filters.exerciseId?.trim()) {
    params.set("exerciseId", filters.exerciseId.trim());
  }

  if (filters.status?.trim()) {
    params.set("status", filters.status.trim());
  }

  if (filters.legality?.trim()) {
    params.set("legality", filters.legality.trim());
  }

  params.set("format", "json");

  return `${BETA_ATTEMPT_REVIEW_API_PATH}?${params.toString()}`;
}
