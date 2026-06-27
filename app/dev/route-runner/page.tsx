import { AppShell } from "@/components/layout/AppShell";
import { RouteRunnerClient } from "./RouteRunnerClient";

export default function DevRouteRunnerPage() {
  return (
    <AppShell title="Route Runner">
      <RouteRunnerClient />
    </AppShell>
  );
}
