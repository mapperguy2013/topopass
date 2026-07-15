import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { RouteRunnerClient } from "../../RouteRunnerClient";
import { ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON } from "../../curatedRealLondonRouteRunnerMaps";
import { getPhase8VisualRegressionFixture } from "../../phase8VisualRegressionFixtures";

export const dynamic = "force-dynamic";

export default async function Phase8VisualRegressionFixturePage({
  params
}: {
  params: Promise<{ fixtureId: string }>;
}) {
  const { fixtureId } = await params;
  const fixture = getPhase8VisualRegressionFixture(fixtureId);

  if (!fixture) {
    notFound();
  }

  const selectedMapOption = ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON.find(
    (option) => option.id === fixture.mapId
  );

  if (!selectedMapOption) {
    notFound();
  }

  const fixtureMapOption = { ...selectedMapOption, visibleInBeta: true };

  return (
    <AppShell
      title={fixture.state === "hint" ? "Learner Training" : "Real London Practice"}
      frameClassName="max-w-[1900px]"
      framePaddingClassName="px-2 py-3 sm:px-6 sm:py-6 lg:px-8"
    >
      <style>{`*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }`}</style>
      <RouteRunnerClient
        allowDevQaToggle={false}
        initialExerciseId={fixture.exerciseId ?? undefined}
        initialMapOptionId={fixture.mapId}
        mapOptions={[fixtureMapOption]}
        mode="student-beta"
        showTrainingModePanel={fixture.state === "hint"}
        trainingModeOnly={fixture.state === "hint"}
        visualRegressionFixture={{
          id: fixture.id,
          state: fixture.state,
          routeSeed: fixture.routeSeed,
          openFeedback: fixture.openFeedback,
          scrollTarget: fixture.scrollTarget
        }}
      />
    </AppShell>
  );
}
