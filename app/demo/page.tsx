import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Free Demo",
  description:
    "Try short Topographical and SERU-style TopoPass demos before starting the full preparation course.",
  path: "/demo"
});

const demoOptions = [
  {
    title: "Topographical demo",
    description:
      "Try 10 sample topographical-style questions covering map reading, routes, locations, and direction sense.",
    href: "/demo/topographical",
    button: "Start topographical demo",
    details: [
      "10 questions",
      "timed demo",
      "instant feedback",
      "short result summary",
      "no full progress dashboard"
    ],
    accent: "blue"
  },
  {
    title: "SERU demo",
    description:
      "Try 10 sample SERU-style questions covering safety, accessibility, customer service, driver responsibilities, and professional conduct.",
    href: "/demo/seru",
    button: "Start SERU demo",
    details: [
      "10 questions",
      "timed demo",
      "instant feedback",
      "short result summary",
      "no full progress dashboard"
    ],
    accent: "orange"
  }
] as const;

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar />

      <section className="border-b border-slate-200 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Free demo
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Try TopoPass before you start the full course
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-700">
            Answer a short sample of Topographical or SERU-style questions, see
            instant feedback, and get a feel for how TopoPass helps you revise.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-slate-600">
            Demo is a public preview only. It does not include the full learning
            path, topic filters, weak-topic dashboard, full mock exams, or saved
            account progress.
          </p>
        </div>
      </section>

      <section className="px-6 py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
          {demoOptions.map((option) => (
            <article
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              key={option.title}
            >
              <p
                className={`text-sm font-bold uppercase tracking-wide ${
                  option.accent === "orange" ? "text-orange-700" : "text-road"
                }`}
              >
                Short public demo
              </p>
              <h2 className="mt-2 text-2xl font-bold text-ink">
                {option.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {option.description}
              </p>
              <ul className="mt-5 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                {option.details.map((detail) => (
                  <li className="rounded-md bg-slate-50 px-3 py-2" key={detail}>
                    {detail}
                  </li>
                ))}
              </ul>
              <Link
                className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-md px-5 py-3 text-sm font-semibold text-white ${
                  option.accent === "orange"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-road hover:bg-blue-700"
                } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road`}
                href={option.href}
              >
                {option.button}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white px-6 py-12 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink">
              Ready for the full course?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Full practice includes focused topics, explanations, progress
              tracking, mistake review, and topographical mock exams.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              href="/practice"
            >
              Start full practice
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-road hover:text-road"
              href="/auth/sign-up"
            >
              Create account / sign in
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
