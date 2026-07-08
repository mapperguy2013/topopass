import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import { ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON } from "./curatedRealLondonRouteRunnerMaps";
import { RouteRunnerClient } from "./RouteRunnerClient";

export const metadata = buildPageMetadata({
  title: "Dev Route Runner",
  description: "Development route-runner map, drawing, QA overlay, and Training Mode test surface.",
  path: "/dev/route-runner"
});

export default function DevRouteRunnerPage() {
  return (
    <AppShell title="Dev Route Runner" frameClassName="max-w-[1900px]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Internal dev tool</p>
              <h1 className="mt-2 text-3xl font-bold text-ink">Dev Route Runner</h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">
                Use the existing route-runner map, drawing, QA overlays, route review, and Training Mode test surface.
                This page remains a development-only fixture workspace and is not linked from learner navigation.
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

        <RouteRunnerClient mapOptions={ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON} />
      </div>
    </AppShell>
  );
}
