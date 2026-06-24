import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import { TrackedLink } from "@/src/components/analytics/TrackedLink";

export const metadata = buildPageMetadata({
  title: "Practice",
  description:
    "Choose focused TopoPass practice for topographical map skills or SERU-style private hire knowledge.",
  path: "/practice"
});

const practiceAreas = [
  {
    title: "Topographical practice",
    description:
      "Practise the map-reading and route skills used in topographical-style preparation. Work on London locations, routes, direction sense, map interpretation, and common weak areas before trying a mock exam.",
    primaryLabel: "Start topographical practice",
    primaryHref: "/practice/topographical",
    secondaryLabel: "View topographical topics",
    secondaryHref: "/practice/topographical",
    accent: "road",
    eventKey: "topographical"
  },
  {
    title: "SERU-style practice",
    description:
      "Practise private-hire knowledge topics with original SERU-style questions and explanations. Build confidence around passenger safety, equality, accessibility, customer service, driver responsibilities, and professional conduct.",
    primaryLabel: "Start SERU practice",
    primaryHref: "/practice/seru",
    secondaryLabel: "View SERU topics",
    secondaryHref: "/practice/seru",
    accent: "orange",
    eventKey: "seru"
  }
] as const;

function PracticeHubVisual() {
  return (
    <div
      aria-label="Illustration showing separate topographical and SERU-style practice paths"
      className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 shadow-soft"
      role="img"
    >
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 720 360">
        <rect width="720" height="360" fill="#f8fbff" />
        <path
          d="M58 82 H666 M58 154 H666 M58 226 H666 M58 298 H666"
          stroke="#e4edf8"
          strokeLinecap="round"
          strokeWidth="12"
        />
        <path
          d="M124 42 V328 M246 42 V328 M368 42 V328 M490 42 V328 M612 42 V328"
          stroke="#e4edf8"
          strokeLinecap="round"
          strokeWidth="12"
        />
        <path
          d="M90 278 C182 250 216 184 298 188 C392 192 390 118 482 116 C556 114 590 82 646 70"
          fill="none"
          stroke="#dbeafe"
          strokeLinecap="round"
          strokeWidth="36"
        />
        <path
          d="M90 278 C182 250 216 184 298 188 C392 192 390 118 482 116 C556 114 590 82 646 70"
          fill="none"
          stroke="#2563eb"
          strokeLinecap="round"
          strokeWidth="12"
        />
        <circle cx="90" cy="278" fill="#2563eb" r="20" />
        <circle cx="90" cy="278" fill="#ffffff" r="9" />
        <circle cx="298" cy="188" fill="#2563eb" r="15" />
        <circle cx="298" cy="188" fill="#ffffff" r="7" />
        <path
          d="M646 34 C625 34 608 51 608 72 C608 105 646 147 646 147 C646 147 684 105 684 72 C684 51 667 34 646 34Z"
          fill="#f97316"
        />
        <circle cx="646" cy="71" fill="#ffffff" r="13" />
      </svg>

      <div className="relative grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-blue-100 bg-white/95 p-5 shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-full bg-blue-100 text-road">
            <span className="text-lg font-bold">M</span>
          </div>
          <h3 className="mt-4 text-lg font-bold text-ink">
            Topographical practice
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Routes, locations, map reading, and journey-planning confidence.
          </p>
        </div>
        <div className="rounded-xl border border-orange-100 bg-white/95 p-5 shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-full bg-orange-100 text-orange-700">
            <span className="text-lg font-bold">S</span>
          </div>
          <h3 className="mt-4 text-lg font-bold text-ink">
            SERU-style practice
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Safety, accessibility, customer care, and responsibilities.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <AppShell title="Practice">
      <div className="space-y-6">
        <section className="grid gap-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm lg:grid-cols-[1fr_0.9fr] lg:p-7">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              Practice
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink">
              Choose what you want to practise today
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">
              Build confidence step by step with focused practice for your TfL
              private hire preparation. Use TopoPass to revise topographical map
              skills, route and location knowledge, SERU-style topics, mistakes,
              and weak areas before moving into mock exams.
            </p>
            <p className="mt-3 max-w-4xl rounded-md bg-blue-50 p-3 text-sm leading-6 text-slate-700">
              Topographical and SERU-style practice are kept separate, so you
              always know what you are revising.
            </p>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
              Private-hire learners often need to prepare for both
              topographical skills and SERU-style knowledge as part of their TfL
              private hire journey.
            </p>
          </div>
          <PracticeHubVisual />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {practiceAreas.map((area) => (
            <article
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              key={area.title}
            >
              <p
                className={`text-sm font-bold uppercase tracking-wide ${
                  area.accent === "road" ? "text-road" : "text-orange-700"
                }`}
              >
                {area.title}
              </p>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-700">
                {area.description}
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <TrackedLink
                  className={`inline-flex min-h-11 items-center justify-center rounded-md px-5 py-3 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    area.accent === "road"
                      ? "bg-road hover:bg-blue-700 focus-visible:outline-road"
                      : "bg-orange-600 hover:bg-orange-700 focus-visible:outline-orange-600"
                  }`}
                  eventName="practice_start_click"
                  eventProperties={{
                    location: "practice-hub",
                    practice: area.eventKey
                  }}
                  href={area.primaryHref}
                >
                  {area.primaryLabel}
                </TrackedLink>
                <TrackedLink
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                  eventName="practice_start_click"
                  eventProperties={{
                    location: "practice-hub",
                    practice: `${area.eventKey}-topics`
                  }}
                  href={area.secondaryHref}
                >
                  {area.secondaryLabel}
                </TrackedLink>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <TrackedLink
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 transition hover:border-road hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            eventName="practice_start_click"
            eventProperties={{ location: "practice-hub", practice: "mistakes" }}
            href="/progress/mistakes"
          >
            <span className="font-bold text-ink">Review mistakes</span>
            <span className="mt-1 block">
              Revisit saved mistakes and choose what to practise next.
            </span>
          </TrackedLink>
          <TrackedLink
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 transition hover:border-road hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            eventName="mock_exam_start_click"
            eventProperties={{ location: "practice-hub", mode: "topographical" }}
            href="/mock-test"
          >
            <span className="font-bold text-ink">Try mock exam</span>
            <span className="mt-1 block">
              Move into topographical mock exams when you feel ready.
            </span>
          </TrackedLink>
          <TrackedLink
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 transition hover:border-road hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            eventName="home_cta_click"
            eventProperties={{ cta: "demo", location: "practice-hub" }}
            href="/demo"
          >
            <span className="font-bold text-ink">Try the short demo</span>
            <span className="mt-1 block">
              Preview how TopoPass works before starting full practice.
            </span>
          </TrackedLink>
        </section>
      </div>
    </AppShell>
  );
}
