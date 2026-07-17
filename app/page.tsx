import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { buildPageMetadata } from "@/lib/seo";
import { TrackedLink } from "@/src/components/analytics/TrackedLink";

export const metadata = buildPageMetadata({
  title: "PCO Ready - TfL Topographical & SERU Practice",
  description:
    "Prepare for the TfL Topographical and SERU assessments with focused practice, mock-style questions, route learning, explanations, and progress tracking.",
  path: "/"
});

const learningJourneys = [
  {
    eyebrow: "Maps, routes and locations",
    title: "Topographical practice",
    description:
      "Build confidence reading London maps, choosing sensible routes, recognising locations, and applying direction skills through focused practice.",
    href: "/practice/topographical",
    cta: "Start topographical practice"
  },
  {
    eyebrow: "Safety, equality and responsibilities",
    title: "SERU practice",
    description:
      "Work through original SERU-style learning questions covering the PHV Driver Handbook, customer care, accessibility, safety, and professional responsibilities.",
    href: "/practice/seru",
    cta: "Start SERU practice"
  }
] as const;

const howItWorks = [
  {
    title: "Practise",
    description:
      "Choose a focused Topographical or SERU topic and answer questions at your own pace."
  },
  {
    title: "Understand",
    description:
      "Use clear explanations and mistake review to understand why an answer needs more work."
  },
  {
    title: "Check your readiness",
    description:
      "Move into mock-style tests and use your progress history to decide what to revise next."
  }
] as const;

const learningTools = [
  {
    title: "Mock tests and review",
    description:
      "Practise under mock-style conditions, revisit mistakes, and use explanations to turn weak answers into useful revision."
  },
  {
    title: "Progress tracking",
    description:
      "See recent answers, accuracy, developing strengths, and topics that need more attention across both learning journeys."
  }
] as const;

function HeroLearningVisual() {
  return (
    <div className="relative">
      <Image
        alt="PCO Ready learning dashboard showing Topographical skills, SERU preparation, route practice, and progress"
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
              PCO Ready
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl lg:text-6xl">
              Learn, practise, and build confidence for your TfL private hire
              assessments
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700 sm:text-lg">
              Prepare for the Topographical Assessment and SERU with focused
              practice, mock-style questions, route learning, explanations,
              and progress tracking.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
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
                eventProperties={{ cta: "explore-platform", location: "hero" }}
                href="#learning-platform"
              >
                Explore the learning platform
              </TrackedLink>
            </div>

            <p className="mt-5 max-w-2xl text-xs leading-5 text-slate-500">
              PCO Ready is an independent learning tool and is not affiliated
              with or endorsed by Transport for London.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-6xl">
            <HeroLearningVisual />
          </div>
        </div>
      </section>

      <section
        className="border-b border-slate-200 bg-surface px-6 py-14 lg:px-8"
        id="learning-platform"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              Learning first
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink">
              Learn for your TfL private hire assessments
            </h2>
            <p className="mt-3 text-base leading-8 text-slate-700">
              Choose the assessment you want to work on. Each journey keeps
              practice focused while explanations, review, and progress tools
              help you decide what to learn next.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {learningJourneys.map((journey) => (
              <article
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                key={journey.title}
              >
                <p className="text-xs font-bold uppercase tracking-wide text-road">
                  {journey.eyebrow}
                </p>
                <h3 className="mt-3 text-2xl font-bold text-ink">
                  {journey.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                  {journey.description}
                </p>
                <Link
                  className="mt-6 inline-flex min-h-11 items-center justify-center self-start rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                  href={journey.href}
                >
                  {journey.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              Map-based learning
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink">
              Learn routes by working with the map
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-700">
              Topographical learning is easier to understand when streets,
              junctions, stations, one-way roads, landmarks, and route choices
              are visible together. PCO Ready uses detailed atlas-style maps
              to make route learning practical, not abstract.
            </p>
            <Link
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md border border-road px-4 py-2 text-sm font-semibold text-road transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href="/practice/routes"
            >
              Explore route practice
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-[#f2ead7] shadow-soft">
            <Image
              alt="Detailed PCO Ready training atlas showing roads and landmarks around King's Cross and Euston"
              className="h-auto w-full"
              height="1600"
              loading="lazy"
              sizes="(min-width: 1024px) 58vw, calc(100vw - 48px)"
              src="/maps/generated/kings-cross-euston-driver-training-atlas.png"
              width="2400"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              Practise, review, improve
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink">
              Mock tests and progress that support your revision
            </h2>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {learningTools.map((tool) => (
              <article
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                key={tool.title}
              >
                <h3 className="text-xl font-bold text-ink">{tool.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {tool.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {howItWorks.map((step, index) => (
              <article
                className="rounded-lg border border-slate-200 bg-white p-5"
                key={step.title}
              >
                <p className="flex size-9 items-center justify-center rounded-md bg-road text-sm font-bold text-white">
                  {index + 1}
                </p>
                <h3 className="mt-4 text-lg font-bold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-xl border border-blue-200 bg-blue-50 p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Coming later
          </p>
          <h2 className="mt-2 text-2xl font-bold text-ink">
            Built for the wider PCO journey
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
            PCO Ready is learning-first today. In a future expansion, the
            platform will also guide learners through the wider PCO application
            journey, from getting started through to receiving a licence.
            Application guidance is not available yet.
          </p>
        </div>
      </section>

      <section className="bg-ink px-6 py-14 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-blue-200">
              Start today
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              Choose what you want to practise
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Build Topographical route confidence or work through focused
              SERU-style learning questions.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <TrackedLink
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              eventName="home_cta_click"
              eventProperties={{ cta: "topographical-practice", location: "footer" }}
              href="/practice/topographical"
            >
              Topographical practice
            </TrackedLink>
            <TrackedLink
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              eventName="home_cta_click"
              eventProperties={{ cta: "seru-practice", location: "footer" }}
              href="/practice/seru"
            >
              SERU practice
            </TrackedLink>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
