import Link from "next/link";
import { DemoMapClickFlow } from "@/src/components/demo/DemoMapClickFlow";

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-surface px-4 py-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Short public demo
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink">
            Try a quick TopoPass preview
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Demo is a short public preview for visitors. It shows how a small
            Topographical map-click question works, then encourages learners to
            start full practice or create an account when they want saved
            progress.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Practice is the real learning area. It includes full topographical
            and SERU-style practice, explanations, local signed-out progress,
            signed-in account progress, weak-topic guidance, and review links.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href="/practice"
            >
              Start full practice
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href="/auth/sign-up"
            >
              Create account to save progress
            </Link>
          </div>
        </section>
        <DemoMapClickFlow />
      </div>
    </main>
  );
}
