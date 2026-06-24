import Link from "next/link";
import Image from "next/image";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { buildPageMetadata } from "@/lib/seo";
import { TrackedLink } from "@/src/components/analytics/TrackedLink";

export const metadata = buildPageMetadata({
  title: "TopoPass - TfL Topographical & SERU Practice",
  description:
    "Practise London map skills, SERU-style knowledge, mock exams, and progress tracking for TfL private hire preparation.",
  path: "/"
});

const productAreas = [
  {
    title: "Topographical practice",
    description:
      "Build confidence with London map reading, routes, locations, and topographical-style mock preparation.",
    href: "/practice"
  },
  {
    title: "SERU-style preparation",
    description:
      "Practise questions on safety, equality, accessibility, customer care, licensing awareness, and professional responsibilities.",
    href: "/practice/seru"
  }
] as const;

const howItWorks = [
  {
    title: "Practise",
    description:
      "Answer focused topographical and SERU-style questions."
  },
  {
    title: "Review",
    description:
      "Read explanations, revisit mistakes, and understand what to improve."
  },
  {
    title: "Build confidence",
    description:
      "Track progress over time and move into mock exams when you feel ready."
  }
] as const;

const benefitCards = [
  {
    title: "Focused map and route practice",
    description:
      "Work on locations, route choices, map reading, and London direction sense in short sessions."
  },
  {
    title: "SERU-style learning support",
    description:
      "Revise safety, equality, accessibility, customer care, licensing awareness, and driver responsibilities."
  },
  {
    title: "Mock exams and review",
    description:
      "Use mock-style practice, explanations, and answer review to understand what needs more work."
  },
  {
    title: "Progress tracking",
    description:
      "See recent answers, accuracy, mistakes, and weak areas as your revision history grows."
  },
  {
    title: "One account for your revision",
    description:
      "Use the same login for topographical practice and SERU-style preparation when you want account progress."
  }
] as const;

function HeroLearningVisual() {
  return (
    <div className="relative">
      <Image
        alt="Practice overview dashboard showing topographical skills, SERU preparation, route practice, and progress stats"
        className="block h-auto w-full"
        height="1100"
        priority
        sizes="(min-width: 1280px) 1152px, calc(100vw - 48px)"
        src="/images/home-practice-overview-hero.svg"
        width="1600"
      />
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              TfL private hire and PCO preparation
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl lg:text-6xl">
              Prepare for your TfL private hire assessment with confidence
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
              TopoPass helps private-hire learners practise topographical map
              skills, SERU-style knowledge, mock exams, and progress review in
              one clear place. Build confidence step by step, learn from
              mistakes, and focus on the areas that need more work.
            </p>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              Designed for focused revision before test day.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              <TrackedLink
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-road px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                eventName="home_cta_click"
                eventProperties={{ cta: "start-practice", location: "hero" }}
                href="/practice"
              >
                Start practising
              </TrackedLink>
              <TrackedLink
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                eventName="home_cta_click"
                eventProperties={{ cta: "seru-practice", location: "hero" }}
                href="/practice/seru"
              >
                Try SERU practice
              </TrackedLink>
              <TrackedLink
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                eventName="home_cta_click"
                eventProperties={{ cta: "progress", location: "hero" }}
                href="/progress"
              >
                View progress
              </TrackedLink>
            </div>

            <p className="mt-5 max-w-2xl text-xs leading-5 text-slate-500">
              TopoPass is an independent learning tool and is not affiliated
              with or endorsed by Transport for London.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-6xl">
            <HeroLearningVisual />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-surface px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              Practice coverage
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink">
              What TopoPass helps you prepare for
            </h2>
            <p className="mt-3 text-base leading-8 text-slate-700">
              Build confidence across the key areas private-hire learners need
              to revise, then use review tools to focus your next session.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {productAreas.map((area) => (
              <Link
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-road/50 hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                href={area.href}
                key={area.title}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-xl font-bold text-ink">{area.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {area.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              How it works
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink">
              Practise, review, build confidence
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The learning loop is simple: start with focused questions, learn
              from feedback, and keep practising the areas that need attention.
            </p>
          </div>

          <ol className="grid gap-4 sm:grid-cols-2">
            {howItWorks.map((step, index) => (
              <li
                className="rounded-lg border border-slate-200 bg-slate-50 p-5"
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

      <section className="border-b border-slate-200 bg-slate-50 px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-road">
                Why learners use TopoPass
              </p>
              <h2 className="mt-2 text-3xl font-bold text-ink">
                Focused practice without the clutter
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              Practise quickly, review clearly, and keep track of what to work
              on next.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {benefitCards.map((benefit) => (
              <article
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                key={benefit.title}
              >
                <h3 className="text-lg font-bold text-ink">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink px-6 py-14 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-blue-200">
              Start today
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              Start preparing today
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Practise topographical skills, improve SERU-style knowledge, and
              build confidence for your TfL private hire journey.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <TrackedLink
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              eventName="home_cta_click"
              eventProperties={{ cta: "start-practice", location: "footer" }}
              href="/practice"
            >
              Start practising
            </TrackedLink>
            <TrackedLink
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              eventName="home_cta_click"
              eventProperties={{ cta: "seru-practice", location: "footer" }}
              href="/practice/seru"
            >
              Try SERU practice
            </TrackedLink>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
