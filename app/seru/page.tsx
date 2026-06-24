import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { buildPageMetadata } from "@/lib/seo";
import { TrackedLink } from "@/src/components/analytics/TrackedLink";

export const metadata = buildPageMetadata({
  title: "SERU Course",
  description:
    "Use the TopoPass SERU-style preparation course to practise safety, equality, accessibility, customer care, safeguarding, licensing, and professional conduct topics.",
  path: "/seru"
});

const practiceCards = [
  {
    title: "Passenger safety",
    description:
      "Practise questions around safe journeys, passenger care, and driver responsibility."
  },
  {
    title: "Equality and accessibility",
    description:
      "Review how to support passengers fairly, including disabled passengers and passengers with accessibility needs."
  },
  {
    title: "Safeguarding",
    description:
      "Build awareness around vulnerable passengers and appropriate professional conduct."
  },
  {
    title: "Customer service",
    description:
      "Practise scenarios involving communication, complaints, lost property, and professionalism."
  },
  {
    title: "Licensing and regulations",
    description:
      "Review private-hire responsibilities, rules, and regulatory awareness."
  },
  {
    title: "Professional conduct",
    description:
      "Understand expectations around behaviour, responsibility, and trust."
  }
] as const;

const helpCards = [
  "Original SERU-style questions",
  "Clear explanations after answers",
  "Topic-based learning",
  "Difficulty filters",
  "Mistake review",
  "Progress tracking"
] as const;

function SeruHeroVisual() {
  return (
    <div
      aria-label="Illustration of SERU-style checklist and private-hire learning cards"
      className="relative min-h-72 overflow-hidden rounded-2xl border border-orange-100 bg-white p-5 shadow-soft"
      role="img"
    >
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 720 360">
        <rect width="720" height="360" fill="#fffaf5" />
        <circle cx="564" cy="82" r="108" fill="#ffedd5" opacity="0.85" />
        <circle cx="134" cy="292" r="92" fill="#dbeafe" opacity="0.72" />
        <rect x="86" y="68" width="246" height="218" rx="22" fill="#ffffff" stroke="#fed7aa" strokeWidth="2" />
        <rect x="388" y="42" width="244" height="266" rx="22" fill="#ffffff" stroke="#fed7aa" strokeWidth="2" />
        <path d="M130 128h84M130 176h140M130 224h106" stroke="#fb923c" strokeLinecap="round" strokeWidth="12" />
        <circle cx="428" cy="112" r="19" fill="#ffedd5" />
        <path d="M420 112l6 6 13-15" fill="none" stroke="#f97316" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        <circle cx="428" cy="166" r="19" fill="#ffedd5" />
        <path d="M420 166l6 6 13-15" fill="none" stroke="#f97316" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        <circle cx="428" cy="220" r="19" fill="#ffedd5" />
        <path d="M420 220l6 6 13-15" fill="none" stroke="#f97316" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        <path d="M464 112h106M464 166h128M464 220h86" stroke="#cbd5e1" strokeLinecap="round" strokeWidth="12" />
      </svg>
      <div className="relative max-w-sm rounded-xl border border-orange-100 bg-white/95 p-5 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
          SERU-style learning
        </p>
        <h2 className="mt-2 text-xl font-bold text-ink">
          Safety, equality, and professional standards
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Revise private-hire knowledge topics with original questions and clear
          explanations.
        </p>
      </div>
    </div>
  );
}

export default function SeruPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar />

      <section className="border-b border-slate-200 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
              SERU Course
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-ink sm:text-5xl">
              Follow a SERU-style preparation course with clear explanations
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700">
              SERU-style preparation helps private-hire learners build
              confidence with safety, equality, accessibility, customer service,
              safeguarding, licensing awareness, driver responsibilities, and
              professional conduct. TopoPass gives you a guided learning path
              with original practice questions, explanations, and topic-based
              review so you can focus on the areas that need more work.
            </p>
            <p className="mt-4 max-w-3xl text-xs leading-5 text-slate-500">
              TopoPass is an independent learning tool. Its SERU-style practice
              is original revision content, not official TfL questions.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <TrackedLink
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                eventName="practice_start_click"
                eventProperties={{
                  location: "seru-public",
                  practice: "seru"
                }}
                href="/practice/seru"
              >
                Start SERU practice
              </TrackedLink>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                href="/demo"
              >
                Try a demo
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                href="/pricing"
              >
                View pricing
              </Link>
            </div>
          </div>
          <SeruHeroVisual />
        </div>
      </section>

      <section className="border-b border-slate-200 bg-surface px-6 py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-ink">What is SERU?</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              SERU stands for Safety, Equality and Regulatory Understanding. It
              forms part of the TfL private-hire licensing journey and focuses
              on the knowledge and understanding expected of professional
              private-hire drivers. This includes passenger safety, equality
              duties, accessibility, regulatory awareness, and professional
              standards. TfL public guidance also expects applicants to
              undertake Safeguarding Awareness training before the SERU
              assessment.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-ink">Why SERU matters</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Private-hire drivers do more than drive from A to B. They are
              expected to treat passengers fairly, understand safety
              responsibilities, support disabled and vulnerable passengers, act
              professionally, and follow licensing rules. SERU-style practice
              helps learners revise these areas in a structured way.
            </p>
          </article>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
            What to practise
          </p>
          <h2 className="mt-2 text-3xl font-bold text-ink">
            Build confidence with private-hire knowledge topics
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {practiceCards.map((card) => (
              <article
                className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                key={card.title}
              >
                <h3 className="text-lg font-bold text-ink">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-surface px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
            How TopoPass helps
          </p>
          <h2 className="mt-2 text-3xl font-bold text-ink">
            Original practice with review tools
          </h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {helpCards.map((item) => (
              <div
                className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink px-6 py-14 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold">
              Start SERU-style practice today
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Build confidence with private-hire knowledge topics and clear
              explanations before moving into mock-style revision.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              href="/practice/seru"
            >
              Start SERU practice
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
