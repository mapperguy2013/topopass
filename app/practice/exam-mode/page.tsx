import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { RouteRunnerClient } from "@/app/dev/route-runner/RouteRunnerClient";
import { buildPageMetadata } from "@/lib/seo";
import {
  EXAM_MODE_PRACTICE_PATH,
  buildExamModePracticePageModel
} from "./examModePractice";

export const metadata = buildPageMetadata({
  title: "Exam Mode",
  description:
    "Practise topographical route planning in a timed exam-style route runner without active hints.",
  path: EXAM_MODE_PRACTICE_PATH
});

export default function ExamModePracticePage() {
  const model = buildExamModePracticePageModel();

  return (
    <AppShell
      title={model.title}
      frameClassName="max-w-[1900px]"
      framePaddingClassName="px-2 py-3 sm:px-6 sm:py-6 lg:px-8"
    >
      <div className="space-y-4 sm:space-y-5">
        <section className="hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:block">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-road">Exam Mode</p>
              <h1 className="mt-2 text-2xl font-bold text-ink">Timed Route Attempt</h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">
                Read the atlas map, identify the origin and destination, draw the route, and submit without live hints.
                Review appears only after submission and the submitted drawing is locked.
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
          initialExerciseId={model.initialExerciseId}
          initialMapOptionId={model.initialMapOptionId}
          mapOptions={model.mapOptions}
          mode={model.routeRunnerMode}
          showTrainingModePanel={false}
        />
      </div>
    </AppShell>
  );
}
