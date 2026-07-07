import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { RouteRunnerClient } from "@/app/dev/route-runner/RouteRunnerClient";
import { buildPageMetadata } from "@/lib/seo";
import {
  LEARNER_TRAINING_PRACTICE_PATH,
  buildLearnerTrainingPracticePageModel
} from "./learnerTrainingPractice";

export const metadata = buildPageMetadata({
  title: "Learner Training",
  description:
    "Open TopoPass Training Mode for learner-driver route practice with exercises, hints, scoring, and feedback.",
  path: LEARNER_TRAINING_PRACTICE_PATH
});

export default function LearnerTrainingPracticePage() {
  const model = buildLearnerTrainingPracticePageModel();

  return (
    <AppShell title={model.title} frameClassName="max-w-[1900px]">
      <div className="space-y-4 sm:space-y-5">
        <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-road">Training Mode</p>
              <h1 className="mt-2 text-2xl font-bold text-ink">Learner Training</h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">
                Practise learner-driver route decisions with generated exercises, checkpoints, progressive hints,
                scoring, and instructor-style feedback. The map below uses the same route runner and Training Mode
                implementation used in development.
              </p>
              <p className="mt-3 max-w-4xl rounded-md bg-blue-50 p-3 text-sm leading-6 text-slate-700">
                {model.betaStatus === "enabled"
                  ? "Real London beta routes are available in the map selector."
                  : `Standard training is available now. Enable ${model.betaFlagName} to include Real London beta routes.`}
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href="/practice"
            >
              Back to practice
            </Link>
          </div>
        </section>

        <RouteRunnerClient
          allowDevQaToggle={false}
          initialMapOptionId={model.initialMapOptionId}
          mapOptions={model.mapOptions}
          mode={model.routeRunnerMode}
        />
      </div>
    </AppShell>
  );
}
