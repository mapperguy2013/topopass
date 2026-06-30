import { AppShell } from "@/components/layout/AppShell";
import { RouteRunnerClient } from "./RouteRunnerClient";

export default function DevRouteRunnerPage() {
  return (
    <AppShell title="Route Runner" frameClassName="max-w-[1900px]">
      <RouteRunnerClient />
    </AppShell>
  );
}
