import { AppShell } from "@/components/layout/AppShell";
import { RouteDemoFlow } from "@/src/components/route/RouteDemoFlow";
import { kingsCrossEustonRouteSource } from "@/src/data/maps/kings-cross-euston/routeGraph";

export default function RouteDemoPage() {
  return (
    <AppShell title="Route Drawing Demo">
      <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm leading-6 text-slate-600">
          This standalone prototype uses real London road geometry rendered as
          a fixed topographical training map. It uses the shared route question
          bank and scoring engine while keeping developer controls in a
          dedicated test page.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Map data: {kingsCrossEustonRouteSource.attribution}
        </p>
      </div>
      <section
        aria-label="Map legend"
        className="mb-5 border-y border-slate-200 bg-white px-4 py-3"
      >
        <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
          Map legend
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-slate-700">
          <li className="flex items-center gap-2">
            <span className="relative block h-3 w-10 rounded bg-slate-600 before:absolute before:inset-x-0 before:top-1 before:h-1 before:bg-[#efc15c]" />
            Major driver road
          </li>
          <li className="flex items-center gap-2">
            <span className="relative block h-2 w-10 rounded bg-slate-400 before:absolute before:inset-x-0 before:top-0.5 before:h-1 before:bg-white" />
            Local named road
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-3 w-9 items-center justify-center border-y border-slate-500 bg-white text-[11px] leading-none text-slate-900">
              &rarr;
            </span>
            One-way
          </li>
          <li className="flex items-center gap-2">
            <span className="block w-9 border-t-2 border-dashed border-red-700" />
            Tagged no motor vehicle
          </li>
          <li className="flex items-center gap-2">
            <span className="block w-9 border-t border-dashed border-slate-500" />
            Pedestrian / private / unknown
          </li>
        </ul>
      </section>
      <RouteDemoFlow />
    </AppShell>
  );
}
