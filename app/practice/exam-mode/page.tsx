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
      focusMode={{
        label: "Exam Mode",
        exitHref: model.presentation.exitHref,
        exitLabel: model.presentation.exitLabel
      }}
    >
      <div>
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
