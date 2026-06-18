import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-road">
            Pricing
          </p>
          <h1 className="mt-3 text-4xl font-bold text-ink sm:text-5xl">
            Pricing will be announced later
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-700">
            TopoPass is currently focused on building a strong practice and
            resource experience. Payment plans are not implemented yet.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center rounded-md bg-road px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700"
              href="/practice"
            >
              Start Practising
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-road hover:text-road"
              href="/resources"
            >
              Explore Resources
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
