import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { buildPageMetadata } from "@/lib/seo";
import { TrackedLink } from "@/src/components/analytics/TrackedLink";

export const metadata = buildPageMetadata({
  title: "How the TopoPass Course Works",
  description:
    "See how the TopoPass preparation course combines topographical practice, SERU-style learning, mock exams, explanations, mistake review, and progress tracking.",
  path: "/course"
});

const journeySteps = [
  {
    title: "Choose your area",
    description:
      "Start with Topographical practice or SERU-style preparation."
  },
  {
    title: "Practise focused questions",
    description:
      "Work through short sessions based on topics, question types, and difficulty."
  },
  {
    title: "Review explanations",
    description:
      "See why an answer is right or wrong, then learn from mistakes."
  },
  {
    title: "Track weak areas",
    description:
      "Use saved progress to understand which topics need more attention."
  },
  {
    title: "Move into mock exams",
    description:
      "When ready, try topographical mock exams and review your results."
  }
] as const;

const includedCards = [
  "Topographical map skills",
  "SERU-style knowledge practice",
  "Topic-based sessions",
  "Mock exams",
  "Mistake review",
  "Progress tracking",
  "Signed-out local practice",
  "Signed-in account progress"
] as const;

const previewCards = [
  {
    title: "Choose your practice area",
    eyebrow: "Practice dashboard",
    rows: ["Topographical Course", "SERU Course", "Short demo preview"]
  },
  {
    title: "Practise topographical topics",
    eyebrow: "Map skills",
    rows: ["Direction sense", "Routes and locations", "Map-click practice"]
  },
  {
    title: "Learn with SERU-style questions",
    eyebrow: "SERU course",
    rows: ["Safety", "Accessibility", "Customer service"]
  },
  {
    title: "Review mistakes",
    eyebrow: "Answer review",
    rows: ["Explanation", "Correct answer", "Try similar questions"]
  },
  {
    title: "Track your progress",
    eyebrow: "Progress",
    rows: ["Accuracy", "Weak topics", "Recent answers"]
  }
] as const;

function ProductPreviewCard({
  eyebrow,
  rows,
  title
}: {
  eyebrow: string;
  rows: readonly string[];
  title: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="rounded-xl border border-blue-100 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-road">
          {eyebrow}
        </p>
        <h3 className="mt-2 text-lg font-bold text-ink">{title}</h3>
        <div className="mt-4 space-y-2">
          {rows.map((row, index) => (
            <div
              className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
              key={row}
            >
              <span>{row}</span>
              <span
                aria-hidden="true"
                className={`size-2 rounded-full ${
                  index === 0 ? "bg-road" : "bg-slate-300"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function CoursePage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar />

      <section className="border-b border-slate-200 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            How the course works
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-ink sm:text-5xl">
            A guided preparation course for TfL private hire learners
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-700">
            TopoPass brings topographical practice, SERU-style learning, mock
            exams, explanations, mistake review, and progress tracking into one
            structured course. Work through focused topics, review what you get
            wrong, and build confidence step by step before test day.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <TrackedLink
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-road px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              eventName="home_cta_click"
              eventProperties={{ cta: "start-practice", location: "hero" }}
              href="/practice"
            >
              Start practising
            </TrackedLink>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href="/demo"
            >
              Try the demo
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-road"
              href="/pricing"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-surface px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Your course journey
          </p>
          <h2 className="mt-2 text-3xl font-bold text-ink">
            Build confidence step by step
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {journeySteps.map((step, index) => (
              <li
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                key={step.title}
              >
                <p className="flex size-10 items-center justify-center rounded-md bg-road text-sm font-bold text-white">
                  {index + 1}
                </p>
                <h3 className="mt-5 text-lg font-bold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Course contents
          </p>
          <h2 className="mt-2 text-3xl font-bold text-ink">
            What is included in the course?
          </h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {includedCards.map((item) => (
              <div
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-surface px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Product preview
          </p>
          <h2 className="mt-2 text-3xl font-bold text-ink">
            See what the course looks like
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {previewCards.map((card) => (
              <ProductPreviewCard
                eyebrow={card.eyebrow}
                key={card.title}
                rows={card.rows}
                title={card.title}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-2xl font-bold text-ink">
              Built for focused revision
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              TopoPass is designed for short, focused study sessions. You can
              practise signed out with local progress, or sign in to save new
              progress across devices.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-2xl font-bold text-ink">
              Independent learning support
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              TopoPass is an independent learning tool. It is not affiliated
              with, endorsed by, or sponsored by Transport for London, Uber,
              Bolt, FREENOW, or any private hire operator.
            </p>
          </article>
        </div>
      </section>

      <section className="bg-ink px-6 py-14 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold">
              Start your preparation course today
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Choose Topographical or SERU-style practice and begin building
              confidence with guided revision.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              href="/practice"
            >
              Start practising
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              href="/demo"
            >
              Try demo
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
