import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import { RouteRunnerClient } from "@/app/dev/route-runner/RouteRunnerClient";
import {
  REAL_LONDON_BETA_PRACTICE_DISPLAY_LABEL,
  REAL_LONDON_BETA_PRACTICE_PATH,
  buildRealLondonBetaPracticeScreenModel
} from "./realLondonBetaPracticeScreen";

export const metadata = buildPageMetadata({
  title: "Real London Practice Beta",
  description:
    "Beta-gated real London route practice for selected TopoPass testers, using committed local OSM fixture data.",
  path: REAL_LONDON_BETA_PRACTICE_PATH
});

export default function RealLondonBetaPracticePage() {
  const model = buildRealLondonBetaPracticeScreenModel();

  if (model.state === "unavailable") {
    return (
      <AppShell title="Real London Practice">
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide">Beta access required</p>
          <h1 className="mt-2 text-2xl font-bold">{model.unavailableState.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6">{model.unavailableState.message}</p>
          <p className="mt-3 max-w-3xl text-sm leading-6">
            This screen is intentionally hidden unless {model.betaFlagName} is enabled. The standard Marlowe practice
            map remains the default route-runner experience.
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-amber-900 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900"
            href="/practice"
          >
            Back to practice
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title="Real London Practice" frameClassName="max-w-[1900px]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.5fr)]">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-road">
                {REAL_LONDON_BETA_PRACTICE_DISPLAY_LABEL}
              </p>
              <h1 className="mt-2 text-3xl font-bold text-ink">Practise route drawing on a real London pilot map</h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">
                Choose a beta exercise, read the start and destination instructions, draw your route on the map, and
                submit it for the existing TopoPass route feedback. This beta screen uses committed local OSM fixture
                data only.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-blue-800">
                  {model.exerciseRows.length} exercises
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                  Map version {model.mapVersion}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                  Data: {model.attribution}
                </span>
              </div>
            </div>

            <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <p className="font-semibold text-slate-950">Current exercise</p>
              <p className="mt-2">{model.selectedExercise.title}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full border border-blue-100 bg-white px-2 py-0.5 text-blue-700">
                  {model.selectedExercise.difficulty}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5">
                  {model.selectedExercise.routeType.replaceAll("-", " ")}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5">
                  {model.selectedExercise.estimatedDistanceLabel}
                </span>
              </div>
              <details className="mt-3 rounded-md border border-slate-200 bg-white p-3 text-xs leading-5">
                <summary className="cursor-pointer font-semibold">Known limitations</summary>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  {model.knownLimitations.map((limitation) => (
                    <li key={limitation}>{limitation}</li>
                  ))}
                </ul>
              </details>
            </aside>
          </div>
        </section>

        <RouteRunnerClient
          allowDevQaToggle={false}
          initialExerciseId={model.selectedExercise.id}
          initialMapOptionId={model.mapId}
          mode={model.routeRunnerMode}
        />
      </div>
    </AppShell>
  );
}
