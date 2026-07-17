import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import { RouteRunnerClient } from "@/app/dev/route-runner/RouteRunnerClient";
import { RealLondonBetaFeedbackForm } from "./RealLondonBetaFeedbackForm";
import {
  REAL_LONDON_BETA_PRACTICE_PATH,
  REAL_LONDON_BETA_MAP_OPTIONS,
  buildRealLondonBetaPracticeScreenModel
} from "./realLondonBetaPracticeScreen";
import {
  LEARNER_TRAINING_PRACTICE_CARD_CTA,
  LEARNER_TRAINING_PRACTICE_PATH
} from "../training/learnerTrainingPractice";

export const metadata = buildPageMetadata({
  title: "Real London Practice Beta",
  description:
    "Beta-gated real London route practice for selected PCO Ready testers, using local map data.",
  path: REAL_LONDON_BETA_PRACTICE_PATH
});

type RealLondonBetaPracticeSearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstSearchParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RealLondonBetaPracticePage({
  searchParams
}: {
  searchParams?: RealLondonBetaPracticeSearchParams;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const model = buildRealLondonBetaPracticeScreenModel({
    requestedMapId: firstSearchParamValue(resolvedSearchParams.map),
    selectedExerciseId: firstSearchParamValue(resolvedSearchParams.exercise)
  });

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
    <AppShell
      title="Real London Practice"
      frameClassName="max-w-[1900px]"
      framePaddingClassName="px-2 py-3 sm:px-6 sm:py-6 lg:px-8"
    >
      <div className="space-y-3 sm:space-y-5">
        <section className="hidden rounded-lg border border-blue-100 bg-white p-3 shadow-sm sm:rounded-xl sm:p-5 xl:block">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-road">Learner Training</p>
              <h1 className="mt-2 text-xl font-bold text-ink">Training Mode has its own page</h1>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
                Generate routes, get hints, complete exercises, and receive instructor-style feedback in the dedicated
                learner training workspace.
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href={LEARNER_TRAINING_PRACTICE_PATH}
            >
              {LEARNER_TRAINING_PRACTICE_CARD_CTA}
            </Link>
          </div>
        </section>

        <RouteRunnerClient
          allowDevQaToggle={false}
          initialExerciseId={model.selectedExercise?.id}
          initialMapOptionId={model.mapId}
          mapOptions={REAL_LONDON_BETA_MAP_OPTIONS}
          mode={model.routeRunnerMode}
          showTrainingModePanel={false}
        />

        <RealLondonBetaFeedbackForm
          betaEnabled
          exerciseId={model.selectedExercise?.id ?? "map-visual-qa"}
          exerciseTitle={model.selectedExercise?.title ?? model.selectedMap.label}
          exerciseVersion={model.selectedExercise?.exerciseVersion ?? "map-only"}
          mapId={model.mapId}
          mapVersion={model.mapVersion}
        />
      </div>
    </AppShell>
  );
}
