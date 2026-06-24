import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "About TopoPass",
  description:
    "Learn what TopoPass is and how it supports private hire learners with topographical and SERU-style preparation.",
  path: "/about"
});

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar />
      <section className="border-b border-slate-200 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            About
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
            About TopoPass
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-700">
            TopoPass is a preparation tool for London private-hire learners. It
            helps learners practise topographical skills, route confidence,
            location knowledge, SERU-style private hire knowledge, explanations,
            mock-style revision, and progress review.
          </p>
        </div>
      </section>
      <section className="px-6 py-12 lg:px-8">
        <div className="mx-auto grid max-w-4xl gap-5">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">What TopoPass does</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              TopoPass is designed for confidence-building: practise in focused
              sessions, read explanations, review mistakes, and track what needs
              more work before test day.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Independent project</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              TopoPass is independent and is not affiliated with or endorsed by
              Transport for London. It is a sole trader project for now.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Contact</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Contact{" "}
              <a className="font-semibold text-road" href="mailto:support@topopass.co.uk">
                support@topopass.co.uk
              </a>{" "}
              for account, content, privacy, or general support questions.
            </p>
          </article>
        </div>
      </section>
      <Footer />
    </main>
  );
}
