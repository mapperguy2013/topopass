import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

const features = [
  {
    title: "Map reading",
    description:
      "Build confidence reading street layouts, symbols, grids, and location references."
  },
  {
    title: "Direction awareness",
    description:
      "Practise north, south, east, west, left and right decisions in realistic prompts."
  },
  {
    title: "Route choice",
    description:
      "Work through sensible route planning questions with a focus on London journeys."
  },
  {
    title: "Points of interest",
    description:
      "Revise airports, stations, hospitals, landmarks, boroughs, and key destinations."
  },
  {
    title: "Mock test practice",
    description:
      "Complete mixed knowledge, map-click, and route-drawing questions in one scored mock exam."
  },
  {
    title: "Mistake review",
    description:
      "Review weak spots and turn repeated mistakes into focused study sessions."
  }
];

const steps = [
  "Practise realistic questions",
  "Get instant feedback",
  "Track weak areas before your assessment"
];

const trustBadges = [
  "TfL Topographical Test",
  "Uber Driver Applicants",
  "Bolt Driver Applicants",
  "FREENOW Driver Applicants",
  "London PHV Licence",
  "Private Hire Prep"
];

const audienceCards = [
  {
    title: "TfL test preparation",
    description:
      "Practise map reading, directions, route choice, and London location knowledge."
  },
  {
    title: "Private hire focused",
    description:
      "Built around the skills private hire applicants need before they can start working."
  },
  {
    title: "Works on desktop and mobile",
    description:
      "Study at home on a laptop or practise on your phone whenever you have time."
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar />
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.9)_46%,rgba(255,255,255,0.55)_100%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[linear-gradient(135deg,#dbeafe_1px,transparent_1px),linear-gradient(45deg,#cbd5e1_1px,transparent_1px)] bg-[length:42px_42px] opacity-70 lg:block" />
        <div className="relative mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-road">
              TopoPass
            </p>
            <h1 className="text-4xl font-bold leading-tight text-ink sm:text-5xl lg:text-6xl">
              Pass your TfL Topographical Test with interactive map practice
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
              Built for London private hire applicants preparing for the TfL
              Topographical Skills Assessment — including drivers planning to
              work with Uber, Bolt, FREENOW, local minicab firms, and other
              licensed PHV operators.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/practice"
                className="inline-flex items-center justify-center rounded-md bg-road px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700"
              >
                Start Practising
              </Link>
              <Link
                href="/resources"
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-road hover:text-road"
              >
                Explore Resources
              </Link>
            </div>
            <div className="mt-10 border-t border-slate-200 pt-6">
              <p className="text-sm font-semibold text-slate-600">
                Practice built around the audience and assessment:
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {trustBadges.map((badge) => (
                  <span
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
                    key={badge}
                  >
                    {badge}
                  </span>
              ))}
              </div>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="rounded-lg border border-slate-200 bg-white/95 p-5 shadow-soft">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Practice workspace
                  </p>
                  <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-success">
                    Ready
                  </span>
                </div>
                <div className="relative min-h-[320px] overflow-hidden rounded-md border border-slate-200 bg-white">
                  <div className="absolute left-10 top-8 h-56 w-1 rounded-full bg-slate-300" />
                  <div className="absolute left-24 top-0 h-full w-1 rotate-12 rounded-full bg-slate-200" />
                  <div className="absolute left-0 top-28 h-1 w-full bg-slate-300" />
                  <div className="absolute left-0 top-48 h-1 w-full -rotate-6 bg-slate-200" />
                  <div className="absolute bottom-8 right-10 rounded-md border border-road/20 bg-blue-50 px-4 py-3">
                    <p className="text-xs font-semibold text-road">
                      Question 04
                    </p>
                    <p className="mt-1 max-w-48 text-sm font-semibold text-ink">
                      Choose the most sensible route across central London.
                    </p>
                  </div>
                  <div className="absolute left-20 top-20 size-4 rounded-full border-4 border-road bg-white" />
                  <div className="absolute right-32 top-40 size-4 rounded-full border-4 border-success bg-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-surface px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-road">
              Clear preparation focus
            </p>
            <h2 className="mt-3 text-3xl font-bold text-ink">
              Made for private hire applicants
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-700">
              TopoPass is designed for people preparing for their London private
              hire licence and the TfL Topographical Skills Assessment. Whether
              you plan to drive with Uber, Bolt, FREENOW, a local minicab
              company, or another licensed PHV operator, the core map-reading
              skills are the same.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {audienceCards.map((card) => (
              <article
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                key={card.title}
              >
                <h3 className="text-lg font-semibold text-ink">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-road">
              Practise the skills that matter
            </p>
            <h2 className="mt-3 text-3xl font-bold text-ink">
              Study with a clear purpose
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-road/40 hover:shadow-soft"
                key={feature.title}
              >
                <h3 className="text-lg font-semibold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-road">
              How TopoPass works
            </p>
            <h2 className="mt-3 text-3xl font-bold text-ink">
              A simple study loop before assessment day
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <article
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                key={step}
              >
                <p className="flex size-10 items-center justify-center rounded-md bg-road text-sm font-bold text-white">
                  {index + 1}
                </p>
                <h3 className="mt-5 text-lg font-semibold text-ink">{step}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Work through focused practice, learn from each response, and
                  use your review history to decide what to study next.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-road">
              Why candidates need practice
            </p>
            <h2 className="mt-3 text-3xl font-bold text-ink">
              The assessment rewards practical map confidence
            </h2>
          </div>
          <p className="text-base leading-8 text-slate-700">
            The test asks candidates to understand maps, identify locations, and
            think through sensible route planning. Regular practice helps turn
            unfamiliar London geography into repeatable decisions under time
            pressure.
          </p>
        </div>
      </section>

      <section className="bg-ink px-6 py-16 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">
              Resource hub
            </p>
            <h2 className="mt-3 text-3xl font-bold">Keep useful links close</h2>
            <p className="mt-4 text-base leading-7 text-slate-200">
              Find useful links for booking, official TfL information, map study
              materials, and video guides.
            </p>
          </div>
          <Link
            className="inline-flex items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-blue-50"
            href="/resources"
          >
            View Resources
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
