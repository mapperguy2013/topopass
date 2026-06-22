import { AppShell } from "@/components/layout/AppShell";
import { RouteDrawingQuestion } from "@/src/components/route/RouteDrawingQuestion";
import {
  kingsCrossEustonRouteGraph,
  kingsCrossEustonRouteQuestion,
  kingsCrossEustonRouteSource
} from "@/src/data/maps/kings-cross-euston/routeGraph";

export default function RouteDemoPage() {
  return (
    <AppShell title="Route Drawing Demo">
      <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm leading-6 text-slate-600">
          This standalone prototype uses real London road geometry rendered as
          a fixed topographical training map. It remains separate from the live
          mock-test question flow.
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
            <span className="relative block h-2 w-9 bg-slate-500 before:absolute before:inset-x-0 before:top-0.5 before:h-1 before:bg-amber-200" />
            Normal road
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-3 w-9 items-center justify-center border-y border-slate-500 bg-white text-[11px] leading-none text-slate-900">
              &rarr;
            </span>
            One-way
          </li>
          <li className="flex items-center gap-2">
            <span className="block w-9 border-t-2 border-dashed border-red-700" />
            Restricted / no motor vehicle
          </li>
          <li className="flex items-center gap-2">
            <span className="block w-9 border-t border-dashed border-slate-500" />
            Pedestrian / private / service
          </li>
        </ul>
      </section>
      <RouteDrawingQuestion
        graph={kingsCrossEustonRouteGraph}
        mapImagePath="/maps/kings-cross-euston/map.svg"
        question={kingsCrossEustonRouteQuestion}
      />
    </AppShell>
  );
}
