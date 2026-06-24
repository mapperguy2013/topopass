import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { buildPageMetadata } from "@/lib/seo";
import { TrackedLink } from "@/src/components/analytics/TrackedLink";

export const metadata = buildPageMetadata({
  title: "Topographical Assessment Preparation",
  description:
    "Learn about TfL private-hire topographical assessment preparation and practise London map, route, direction, and location skills with TopoPass.",
  path: "/topographical"
});

const practiceCards = [
  {
    title: "Map reading and orientation",
    description:
      "Practise using maps, identifying areas, and understanding how locations connect."
  },
  {
    title: "Routes and journey planning",
    description:
      "Work on choosing sensible routes between start and destination points."
  },
  {
    title: "Compass and direction sense",
    description:
      "Build confidence with north, south, east, west, and relative location questions."
  },
  {
    title: "Key London locations",
    description:
      "Review stations, hospitals, landmarks, public buildings, bridges, crossings, and common destination areas."
  },
  {
    title: "Mistake review",
    description:
      "Use explanations and saved mistakes to understand what to improve next."
  }
] as const;

const helpCards = [
  "Topic-based practice",
  "Route and location questions",
  "Mock-style preparation",
  "Mistake review",
  "Progress tracking",
  "Signed-out local practice or signed-in account progress"
] as const;

function TopographicalHeroVisual() {
  return (
    <div
      aria-label="Abstract route map illustration for topographical assessment preparation"
      className="relative min-h-72 overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 shadow-soft"
      role="img"
    >
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 720 360">
        <rect width="720" height="360" fill="#f8fbff" />
        <path
          d="M50 84 H674 M50 162 H674 M50 240 H674 M50 318 H674"
          stroke="#e3ecf7"
          strokeLinecap="round"
          strokeWidth="14"
        />
        <path
          d="M128 38 V330 M250 38 V330 M372 38 V330 M494 38 V330 M616 38 V330"
          stroke="#e3ecf7"
          strokeLinecap="round"
          strokeWidth="14"
        />
        <path
          d="M74 292 C146 242 209 257 278 204 C358 142 418 170 492 116 C563 64 614 70 672 42"
          fill="none"
          stroke="#dbeafe"
          strokeLinecap="round"
          strokeWidth="44"
        />
        <path
          d="M74 292 C146 242 209 257 278 204 C358 142 418 170 492 116 C563 64 614 70 672 42"
          fill="none"
          stroke="#2563eb"
          strokeLinecap="round"
          strokeWidth="13"
        />
        <circle cx="74" cy="292" fill="#2563eb" r="20" />
        <circle cx="74" cy="292" fill="#ffffff" r="9" />
        <circle cx="278" cy="204" fill="#2563eb" r="16" />
        <circle cx="278" cy="204" fill="#ffffff" r="7" />
        <circle cx="492" cy="116" fill="#2563eb" r="16" />
        <circle cx="492" cy="116" fill="#ffffff" r="7" />
        <path
          d="M672 12 C652 12 635 29 635 49 C635 82 672 123 672 123 C672 123 709 82 709 49 C709 29 692 12 672 12Z"
          fill="#f97316"
        />
        <circle cx="672" cy="48" fill="#ffffff" r="12" />
      </svg>
      <div className="relative max-w-sm rounded-xl border border-blue-100 bg-white/95 p-5 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-road">
          Map skills
        </p>
        <h2 className="mt-2 text-xl font-bold text-ink">
          Routes, locations, and direction sense
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Practise the practical navigation decisions private-hire learners need
          to revise.
        </p>
      </div>
    </div>
  );
}

export default function TopographicalPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar />

      <section className="border-b border-slate-200 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              Topographical assessment preparation
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-ink sm:text-5xl">
              Build confidence for the TfL topographical assessment
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700">
              The topographical assessment is designed to check whether
              private-hire applicants can use maps, understand routes, recognise
              locations, and make sensible journey-planning decisions. TopoPass
              helps you practise these skills step by step with focused
              questions, route practice, mistake review, and mock-style
              preparation.
            </p>
            <p className="mt-4 max-w-3xl text-xs leading-5 text-slate-500">
              TopoPass is an independent learning tool and is not affiliated
              with or endorsed by Transport for London.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <TrackedLink
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-road px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                eventName="practice_start_click"
                eventProperties={{
                  location: "topographical-public",
                  practice: "topographical"
                }}
                href="/practice/topographical"
              >
                Start topographical practice
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
          <TopographicalHeroVisual />
        </div>
      </section>

      <section className="border-b border-slate-200 bg-surface px-6 py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-ink">
              What is the topographical assessment?
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Before becoming licensed as a London private-hire driver,
              applicants need to show they can understand routes and locations
              across London. The topographical assessment focuses on practical
              navigation skills such as map reading, route planning, direction
              sense, and recognising important places like stations, hospitals,
              landmarks, and key public buildings. TfL describes the
              topographical assessment as computer-based.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-ink">Why it matters</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Professional private-hire drivers need to make safe and efficient
              journey decisions, especially when roads are busy, routes change,
              or a passenger needs help reaching an unfamiliar destination.
              Strong map and route knowledge gives learners more confidence
              before they move into mock exams and test-style practice.
            </p>
          </article>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            What to practise
          </p>
          <h2 className="mt-2 text-3xl font-bold text-ink">
            Build practical London navigation confidence
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
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            How TopoPass helps
          </p>
          <h2 className="mt-2 text-3xl font-bold text-ink">
            Focused practice, review, and progress tracking
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
              Start building your map confidence
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Practise topographical skills in focused sessions, review your
              mistakes, and prepare for mock-style questions when you feel ready.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              href="/practice/topographical"
            >
              Start topographical practice
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
