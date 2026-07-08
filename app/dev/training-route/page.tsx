import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import {
  DEV_TRAINING_ROUTE_AUTHOR_PATH,
  buildTrainingRouteAuthorModel,
  type CuratedShortestRouteComparisonDetail,
  type TrainingRouteAuthorField,
  type TrainingRouteAuthorStatusItem
} from "./trainingRouteAuthor";

export const metadata = buildPageMetadata({
  title: "Curated Training Route Author",
  description: "Dev-only authoring, validation, preview, and export surface for curated learner training routes.",
  path: DEV_TRAINING_ROUTE_AUTHOR_PATH
});

function renderField(field: TrainingRouteAuthorField) {
  const baseClass = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900";

  if (field.input === "textarea") {
    return (
      <textarea
        className={`${baseClass} min-h-24`}
        defaultValue={field.value}
        id={field.id}
        name={field.id}
      />
    );
  }

  if (field.input === "select") {
    return (
      <select className={baseClass} defaultValue={field.value} id={field.id} name={field.id}>
        {field.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return <input className={baseClass} defaultValue={field.value} id={field.id} name={field.id} />;
}

function polylinePoints(points: Array<{ x: number; y: number }>): string {
  return points.map((point) => `${Math.round(point.x)},${Math.round(point.y)}`).join(" ");
}

function statusClass(state: TrainingRouteAuthorStatusItem["state"]): string {
  if (state === "complete" || state === "ready") {
    return "border-green-200 bg-green-50 text-green-900";
  }

  if (state === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function renderComparison(label: string, comparison: CuratedShortestRouteComparisonDetail) {
  const verdictClass =
    comparison.verdict === "major-detour-warning" || comparison.verdict === "detour-warning"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : comparison.verdict === "unknown"
        ? "border-slate-200 bg-slate-50 text-slate-700"
        : "border-green-200 bg-green-50 text-green-900";

  return (
    <div className={`rounded-lg border p-3 ${verdictClass}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
          <p className="mt-2 text-sm leading-6">{comparison.explanation}</p>
        </div>
        <span className="w-fit rounded-full border border-current px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          {comparison.verdict}
        </span>
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold">Authored route length</dt>
          <dd>{comparison.authoredLengthMeters === null ? "unknown" : `${comparison.authoredLengthMeters} m`}</dd>
        </div>
        <div>
          <dt className="font-semibold">Shortest valid route length</dt>
          <dd>{comparison.shortestLengthMeters === null ? "unknown" : `${comparison.shortestLengthMeters} m`}</dd>
        </div>
        <div>
          <dt className="font-semibold">Percentage longer</dt>
          <dd>{comparison.percentageLonger === null ? "unknown" : `${comparison.percentageLonger}%`}</dd>
        </div>
        <div>
          <dt className="font-semibold">Segment delta</dt>
          <dd>{comparison.segmentCountDelta === null ? "unknown" : comparison.segmentCountDelta}</dd>
        </div>
        <div>
          <dt className="font-semibold">Turn delta</dt>
          <dd>{comparison.turnCountDelta === null ? "unknown" : comparison.turnCountDelta}</dd>
        </div>
        <div>
          <dt className="font-semibold">Decision delta</dt>
          <dd>{comparison.decisionPointDelta === null ? "unknown" : comparison.decisionPointDelta}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function DevTrainingRouteAuthorPage() {
  const model = buildTrainingRouteAuthorModel();
  const currentStep = model.authoringSteps.find((step) => step.current) ?? model.authoringSteps[0];

  return (
    <AppShell title="Training Route Author" frameClassName="max-w-[1900px]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Dev/admin only</p>
              <h1 className="mt-2 text-3xl font-bold text-ink">{model.title}</h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">{model.devOnlyNotice}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Current authored draft is seeded from {model.sourceMapName} ({model.sourceMapId}) /{" "}
                {model.sourceExerciseId}. Export uses the route shown in this authoring workspace.
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              href="/dev"
            >
              Back to /dev
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-blue-100 bg-white p-3 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-road">Map authoring workspace</p>
              <h2 className="mt-2 text-2xl font-bold text-ink">Author the training route first</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {currentStep.instruction}
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              href="/dev/route-runner"
            >
              Open full Route Runner diagnostics
            </Link>
          </div>

          <div aria-label="Training route authoring toolbar" className="mt-4 flex flex-wrap gap-2" role="toolbar">
            {model.toolbarActions.map((action) => (
              <button
                className={`min-h-11 rounded-md border px-3 py-2 text-sm font-semibold ${
                  action.primary
                    ? "border-road bg-road text-white disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-500"
                    : "border-slate-300 bg-white text-slate-700 disabled:bg-slate-100 disabled:text-slate-500"
                }`}
                disabled={action.disabled}
                key={action.id}
                type="button"
              >
                {action.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <svg
                aria-label="Training route authoring map showing start, destination, checkpoints, authored route, and shortest route overlay"
                className="h-[420px] w-full touch-pan-x touch-pan-y bg-[#eef6f8] sm:h-[560px]"
                role="img"
                viewBox={model.mapModel.viewBox}
              >
                <rect height="100%" width="100%" fill="#eef6f8" />
                {model.mapModel.showShortestRouteComparison && model.mapModel.shortestRoutePoints.length > 1 ? (
                  <polyline
                    fill="none"
                    points={polylinePoints(model.mapModel.shortestRoutePoints)}
                    stroke="#f59e0b"
                    strokeDasharray="18 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="22"
                  />
                ) : null}
                {model.mapModel.authoredRoutePoints.length > 1 ? (
                  <polyline
                    fill="none"
                    points={polylinePoints(model.mapModel.authoredRoutePoints)}
                    stroke="#2563eb"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="30"
                  />
                ) : null}
                {model.mapModel.markers.map((marker) => (
                  <g key={marker.id}>
                    <circle
                      cx={marker.point.x}
                      cy={marker.point.y}
                      fill={
                        marker.kind === "start" ? "#16a34a" : marker.kind === "destination" ? "#dc2626" : "#7c3aed"
                      }
                      r="34"
                      stroke="#ffffff"
                      strokeWidth="10"
                    />
                    <text
                      fill="#ffffff"
                      fontSize={marker.kind === "checkpoint" ? "30" : "18"}
                      fontWeight="700"
                      textAnchor="middle"
                      x={marker.point.x}
                      y={marker.point.y + (marker.kind === "checkpoint" ? 10 : 6)}
                    >
                      {marker.label}
                    </text>
                  </g>
                ))}
              </svg>
              <div className="flex flex-wrap gap-3 border-t border-slate-200 bg-white p-3 text-xs font-semibold text-slate-700">
                <span className="inline-flex items-center gap-2"><span className="size-3 rounded-full bg-blue-600" />Authored route</span>
                <span className="inline-flex items-center gap-2"><span className="size-3 rounded-full bg-amber-500" />Shortest route overlay</span>
                <span className="inline-flex items-center gap-2"><span className="size-3 rounded-full bg-green-600" />START</span>
                <span className="inline-flex items-center gap-2"><span className="size-3 rounded-full bg-red-600" />DESTINATION</span>
                <span className="inline-flex items-center gap-2"><span className="size-3 rounded-full bg-purple-600" />Checkpoint</span>
              </div>
            </div>

            <aside className="space-y-4">
              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-lg font-bold text-ink">Authoring steps</h3>
                <ol className="mt-3 space-y-2">
                  {model.authoringSteps.map((step) => (
                    <li
                      className={`rounded-lg border p-3 text-sm ${
                        step.current ? "border-road bg-blue-50 text-slate-900" : "border-slate-200 text-slate-700"
                      }`}
                      key={step.index}
                    >
                      <span className="font-bold">Step {step.index}: {step.label}</span>
                      <span className="mt-1 block text-xs">{step.complete ? "Complete" : step.instruction}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-lg font-bold text-ink">Route state summary</h3>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  {model.routeStatusItems.map((item) => (
                    <div className={`rounded-lg border p-3 ${statusClass(item.state)}`} key={item.label}>
                      <dt className="text-xs font-bold uppercase tracking-wide">{item.label}</dt>
                      <dd className="mt-1 text-sm font-semibold">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </aside>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Route metadata</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Complete metadata after the route shape is clear. Major detours should include a route choice justification.
          </p>
          <form className="mt-4 grid gap-4 md:grid-cols-2">
            {model.metadataFields.map((field) => (
              <label
                className={`text-sm font-semibold text-slate-700 ${
                  field.input === "textarea" ? "md:col-span-2" : ""
                }`}
                htmlFor={field.id}
                key={field.id}
              >
                {field.label}
                {renderField(field)}
              </label>
            ))}
          </form>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-ink">Validation panel</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">{model.validation.explanation}</p>
              </div>
              <span
                className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                  model.validation.valid
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {model.validation.status}
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Blocking errors</p>
                {model.validation.blockingErrors.length === 0 ? (
                  <p className="mt-2 text-sm text-green-800">None</p>
                ) : (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-900">
                    {model.validation.blockingErrors.map((issue) => (
                      <li key={`${issue.code}-${issue.explanation}`}>{issue.explanation}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Advisory warnings</p>
                {model.validation.advisoryWarnings.length === 0 ? (
                  <p className="mt-2 text-sm text-green-800">None</p>
                ) : (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
                    {model.validation.advisoryWarnings.map((issue) => (
                      <li key={`${issue.code}-${issue.explanation}`}>{issue.explanation}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-950">Difficulty and complexity checks</p>
              {model.complexitySummary.warnings.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {model.complexitySummary.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">No difficulty mismatch warning for the selected difficulty.</p>
              )}
              <p className="mt-3 break-words font-mono text-xs">
                Affected segment ids:{" "}
                {model.validation.affectedRouteSegmentIds.length > 0
                  ? model.validation.affectedRouteSegmentIds.join(", ")
                  : "none"}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-ink">Shortest route comparison</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              A training route does not always need to be shortest, but major detours need instructor justification.
            </p>
            <div className="mt-4 grid gap-3">
              {renderComparison("Direct shortest route", model.shortestRouteComparison.directComparison)}
              {renderComparison(
                "Checkpoint-constrained shortest route",
                model.shortestRouteComparison.checkpointConstrainedComparison
              )}
            </div>
            <ul className="mt-4 list-disc space-y-1 rounded-lg bg-slate-50 p-3 pl-8 text-sm leading-6 text-slate-700">
              {model.shortestRouteComparison.guidance.map((guidance) => (
                <li key={guidance}>{guidance}</li>
              ))}
            </ul>
          </section>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-ink">Export panel</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Export comes last and uses the currently authored route shown above.
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                Suggested filename: <span className="font-mono">{model.exportReadiness.suggestedFilename}</span>
              </p>
            </div>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:bg-slate-300 disabled:text-slate-600"
              disabled={!model.exportReadiness.ready}
              type="button"
            >
              Copy JSON
            </button>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[360px_1fr]">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-bold text-ink">Export readiness checklist</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {model.exportReadiness.checklist.map((item) => (
                  <li className="flex items-center justify-between gap-3" key={item.label}>
                    <span>{item.label}</span>
                    <span className={item.complete ? "font-semibold text-green-700" : "font-semibold text-slate-500"}>
                      {item.complete ? "ready" : "missing"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <textarea
              aria-label="Curated route JSON export"
              className="h-96 w-full rounded-md border border-slate-300 bg-slate-950 p-3 font-mono text-xs text-slate-50"
              readOnly
              value={model.exportJson}
            />
          </div>
        </section>

        <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-bold text-slate-800">Advanced diagnostics</summary>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Full map QA tables, route-runner diagnostics, manual inputs, attempt review, and beta practice debug panels
            stay in `/dev/route-runner` so this page remains focused on curated route authoring.
          </p>
          <Link
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            href="/dev/route-runner"
          >
            Open /dev/route-runner
          </Link>
        </details>
      </div>
    </AppShell>
  );
}
