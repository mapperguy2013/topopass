import { MapClickQuestion } from "@/src/components/questions/MapClickQuestion";

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-surface px-4 py-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-road">
            TopoPass map proof-of-concept
          </p>
        </div>
        <MapClickQuestion
          title={"Click on King\u2019s Cross Station."}
          description="This standalone demo tests map click capture, distance scoring, and mobile-friendly Mapbox interaction. It is not connected to the mock test flow."
          target={{
            lat: 51.5308,
            lng: -0.1238
          }}
          passRadiusMetres={120}
          initialCenter={{
            lat: 51.5308,
            lng: -0.1238
          }}
          initialZoom={15}
        />
      </div>
    </main>
  );
}
