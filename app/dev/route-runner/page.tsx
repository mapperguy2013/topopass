import { AppShell } from "@/components/layout/AppShell";
import { ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON } from "./curatedRealLondonRouteRunnerMaps";
import { RouteRunnerClient } from "./RouteRunnerClient";

export default function DevRouteRunnerPage() {
  return (
    <AppShell title="Route Runner" frameClassName="max-w-[1900px]">
      <RouteRunnerClient mapOptions={ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON} />
    </AppShell>
  );
}
