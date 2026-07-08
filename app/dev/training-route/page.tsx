import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import { ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON } from "../route-runner/curatedRealLondonRouteRunnerMaps";
import { RouteRunnerClient } from "../route-runner/RouteRunnerClient";
import {
  DEV_TRAINING_ROUTE_AUTHOR_PATH,
  buildTrainingRouteAuthorModel,
  type TrainingRouteAuthorField
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

export default function DevTrainingRouteAuthorPage() {
  const model = buildTrainingRouteAuthorModel();

  return (
    <AppShell title="Training Route Author" frameClassName="max-w-[1900px]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Internal dev tool</p>
              <h1 className="mt-2 text-3xl font-bold text-ink">{model.title}</h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">{model.devOnlyNotice}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Source: {model.sourceMapName} ({model.sourceMapId}) / {model.sourceExerciseId}
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              href="/dev"
            >
              Back to dev tools
            </Link>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(420px,0.95fr)_minmax(420px,1.05fr)]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-ink">Authoring workflow</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
                {model.authoringWorkflow.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-ink">Route metadata</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Edit these fields before copying the export into the future curated route library.
              </p>
              <form className="mt-4 grid gap-4">
                {model.metadataFields.map((field) => (
                  <label className="text-sm font-semibold text-slate-700" htmlFor={field.id} key={field.id}>
                    {field.label}
                    {renderField(field)}
                  </label>
                ))}
              </form>
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
                Invalid routes must stay draft or beta. Approval should happen only after validation is clean and an
                instructor has reviewed any advisory warnings.
              </p>
            </section>
          </div>

          <div className="space-y-5">
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

              {model.approvalWarning ? (
                <p
                  className={`mt-4 rounded-lg border p-3 text-sm leading-6 ${
                    model.approvalWarning.blocking
                      ? "border-red-200 bg-red-50 text-red-950"
                      : "border-amber-200 bg-amber-50 text-amber-950"
                  }`}
                >
                  {model.approvalWarning.message}
                </p>
              ) : null}

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
                <p className="font-semibold text-slate-950">Affected route segment ids</p>
                <p className="mt-1 break-words font-mono text-xs">
                  {model.validation.affectedRouteSegmentIds.length > 0
                    ? model.validation.affectedRouteSegmentIds.join(", ")
                    : "none"}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-ink">Route complexity summary</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Approx length</dt>
                  <dd className="mt-1 font-semibold text-slate-950">
                    {model.complexitySummary.approximateRouteLengthMeters} m
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Segments</dt>
                  <dd className="mt-1 font-semibold text-slate-950">{model.complexitySummary.segmentCount}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Turns</dt>
                  <dd className="mt-1 font-semibold text-slate-950">{model.complexitySummary.turnCount}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Decision points</dt>
                  <dd className="mt-1 font-semibold text-slate-950">{model.complexitySummary.decisionPointCount}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Checkpoints</dt>
                  <dd className="mt-1 font-semibold text-slate-950">{model.complexitySummary.checkpointCount}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Estimate</dt>
                  <dd className="mt-1 font-semibold text-slate-950">{model.complexitySummary.estimatedDifficulty}</dd>
                </div>
              </dl>
              {model.complexitySummary.warnings.length > 0 ? (
                <ul className="mt-4 list-disc space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 pl-8 text-sm text-amber-950">
                  {model.complexitySummary.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-ink">Export panel</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Copy this JSON into a future file under data/training-routes/. Browser file writing is intentionally
                not required.
              </p>
              <textarea
                aria-label="Curated route JSON export"
                className="mt-4 h-96 w-full rounded-md border border-slate-300 bg-slate-950 p-3 font-mono text-xs text-slate-50"
                readOnly
                value={model.exportJson}
              />
            </section>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-ink">Real London map preview</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Use the existing Route Runner drawing and preview tools to inspect the route before exporting curated
                metadata. This does not alter learner-facing Training Mode defaults.
              </p>
            </div>
          </div>
          <RouteRunnerClient
            initialExerciseId={model.sourceExerciseId}
            initialMapOptionId={model.sourceMapId}
            mapOptions={ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON}
          />
        </section>
      </div>
    </AppShell>
  );
}
