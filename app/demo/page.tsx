import { DemoMapClickFlow } from "@/src/components/demo/DemoMapClickFlow";

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-surface px-4 py-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-road">
            TopoPass map proof-of-concept
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink">
            Map-click demo test
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Answer one real map-click question at a time. This standalone demo
            tests map click capture, distance scoring, and mobile-friendly
            Mapbox interaction.
          </p>
        </div>
        <DemoMapClickFlow />
      </div>
    </main>
  );
}
