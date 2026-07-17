import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import { buildDevContentLibraryModel } from "./devContentLibrary";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "Dev Content Library",
  description: "Dev-only content library manager for PCO Ready maps and curated training routes.",
  path: "/dev/library"
});

export default async function DevContentLibraryPage() {
  const model = await buildDevContentLibraryModel();

  return (
    <AppShell title="Dev Content Library" frameClassName="max-w-[1500px]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Internal dev tools</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">{model.title}</h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">{model.description}</p>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{model.devOnlyNotice}</p>
          <nav aria-label="Content library tabs" className="mt-4 flex flex-wrap gap-2">
            {model.tabs.map((tab) => (
              <a
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                href={`#${tab.id}`}
                key={tab.id}
              >
                {tab.label}
              </a>
            ))}
          </nav>
        </section>

        <section className="grid gap-4 md:grid-cols-5" id="diagnostics">
          {[
            ["Route files", model.diagnostics.totalRouteFiles],
            ["Learner-facing", model.diagnostics.learnerFacingRouteCount],
            ["Drafts", model.diagnostics.draftCount],
            ["Review", model.diagnostics.reviewCount],
            ["Complete", model.diagnostics.completeCount],
            ["Archived", model.diagnostics.archivedCount],
            ["Maps", model.diagnostics.totalMaps],
            ["Authoring maps", model.diagnostics.authoringSupportedMapCount],
            ["Manifest entries", model.diagnostics.manifestIncludedCount],
            ["Manifest gaps", model.diagnostics.manifestMissingCompleteRoutes.length]
          ].map(([label, value]) => (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" key={label}>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" id="routes">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Routes</p>
              <h2 className="mt-1 text-2xl font-bold text-ink">Curated Route Files</h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Filters available: status, difficulty, exercise type, map, learner-facing, and validation status.
            </p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  {[
                    "File",
                    "Route",
                    "Area / map",
                    "Difficulty",
                    "Exercise",
                    "Status",
                    "Lifecycle",
                    "Checkpoints",
                    "Validation",
                    "Learner",
                    "Manifest",
                    "Updated"
                  ].map((heading) => (
                    <th className="border-b border-slate-200 px-3 py-2" key={heading}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {model.routes.map((route) => (
                  <tr className="align-top" key={route.relativePath}>
                    <td className="border-b border-slate-100 px-3 py-3 font-mono text-xs">{route.relativePath}</td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      <p className="font-semibold text-slate-900">{route.title}</p>
                      <p className="font-mono text-xs text-slate-500">{route.routeId}</p>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      <p>{route.areaName}</p>
                      <p className="font-mono text-xs text-slate-500">{route.mapId}</p>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">{route.difficulty}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{route.exerciseType}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{route.status}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{route.lifecycleStage}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{route.checkpointCount}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{route.validationStatus}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{route.learnerFacing ? "yes" : "no"}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{route.manifestIncluded ? "yes" : "no"}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{route.lastUpdated ?? "unknown"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" id="maps">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Maps</p>
              <h2 className="mt-1 text-2xl font-bold text-ink">Map Registry</h2>
            </div>
            <Link className="text-sm font-semibold text-blue-700 hover:text-blue-900" href="/dev/training-route">
              Open Training Route Author
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  {[
                    "Map id",
                    "Display name",
                    "Area",
                    "Fixture",
                    "Authoring",
                    "Learner",
                    "Status",
                    "Viewport",
                    "Routes"
                  ].map((heading) => (
                    <th className="border-b border-slate-200 px-3 py-2" key={heading}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {model.maps.map((map) => (
                  <tr className="align-top" key={map.areaId}>
                    <td className="border-b border-slate-100 px-3 py-3 font-mono text-xs">{map.mapId}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{map.displayName}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{map.areaName}</td>
                    <td className="border-b border-slate-100 px-3 py-3 font-mono text-xs">{map.sourceFixturePath}</td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {map.authoringSupported ? "yes" : `no - ${map.unsupportedReason ?? "unsupported"}`}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">{map.learnerSupported ? "yes" : "no"}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{map.status}</td>
                    <td className="border-b border-slate-100 px-3 py-3 font-mono text-xs">{map.defaultViewportLabel}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{map.routeCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2" id="imports">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Imports</p>
            <h2 className="mt-1 text-2xl font-bold text-ink">Route Import Workflow</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
              <li>Choose a JSON export from `/dev/training-route`.</li>
              <li>Preview schema, metadata, validation, and learner-facing status.</li>
              <li>Save to drafts, review, or complete using the dev-only API.</li>
              <li>For complete learner-facing files, add the manifest snippet if reported below.</li>
            </ol>
            <p className="mt-4 text-sm font-semibold text-slate-800">Accepted targets: {model.importTargets.join(", ")}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Archive</p>
            <h2 className="mt-1 text-2xl font-bold text-ink">Archive Instead Of Delete</h2>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              Route removal moves JSON into `data/training-routes/archive/`. Restores move archived JSON back to drafts,
              review, or complete. The library does not permanently delete content by default.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Diagnostics</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">Manifest And Schema Health</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">Manifest health: {model.diagnostics.manifestHealth}</p>
          {model.manifestUpdateInstructions.length > 0 ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-950">Manual manifest updates needed</p>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-amber-950">
                {model.manifestUpdateInstructions.join("\n")}
              </pre>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">No route manifest update is currently needed.</p>
          )}
          {model.diagnostics.excludedRoutes.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {model.diagnostics.excludedRoutes.map((route) => (
                <li key={route.routeId}>
                  <span className="font-mono">{route.routeId}</span>: {route.message}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
