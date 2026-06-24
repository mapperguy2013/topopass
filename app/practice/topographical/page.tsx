import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import { TrackedLink } from "@/src/components/analytics/TrackedLink";
import { PracticeTopicSelectorShell } from "@/src/components/practice/PracticeTopicSelector";

export const metadata = buildPageMetadata({
  title: "Topographical Practice",
  description:
    "Build London map, route, location, direction sense, and journey planning confidence with focused topographical practice.",
  path: "/practice/topographical"
});

function TopographicalVisual() {
  return (
    <div
      aria-label="Abstract map illustration for topographical route practice"
      className="relative min-h-64 overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"
      role="img"
    >
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 680 320">
        <rect width="680" height="320" fill="#f8fbff" />
        <path
          d="M40 70 H640 M40 145 H640 M40 220 H640 M40 295 H640"
          stroke="#e4edf8"
          strokeLinecap="round"
          strokeWidth="13"
        />
        <path
          d="M110 30 V300 M230 30 V300 M350 30 V300 M470 30 V300 M590 30 V300"
          stroke="#e4edf8"
          strokeLinecap="round"
          strokeWidth="13"
        />
        <path
          d="M62 262 C128 224 172 235 228 196 C296 150 337 166 400 122 C473 70 552 88 620 48"
          fill="none"
          stroke="#dbeafe"
          strokeLinecap="round"
          strokeWidth="42"
        />
        <path
          d="M62 262 C128 224 172 235 228 196 C296 150 337 166 400 122 C473 70 552 88 620 48"
          fill="none"
          stroke="#2563eb"
          strokeLinecap="round"
          strokeWidth="12"
        />
        <circle cx="62" cy="262" fill="#2563eb" r="18" />
        <circle cx="62" cy="262" fill="#ffffff" r="8" />
        <circle cx="400" cy="122" fill="#2563eb" r="14" />
        <circle cx="400" cy="122" fill="#ffffff" r="6" />
        <path
          d="M620 18 C601 18 586 33 586 52 C586 82 620 121 620 121 C620 121 654 82 654 52 C654 33 639 18 620 18Z"
          fill="#f97316"
        />
        <circle cx="620" cy="51" fill="#ffffff" r="11" />
      </svg>
      <div className="relative max-w-sm rounded-xl border border-blue-100 bg-white/95 p-4 shadow-sm">
        <p className="text-sm font-bold text-road">Routes / locations / map reading</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Practise one topic at a time, then review mistakes before a mock exam.
        </p>
      </div>
    </div>
  );
}

export default function TopographicalPracticePage() {
  return (
    <AppShell title="Topographical Practice">
      <div className="space-y-6">
        <section className="grid gap-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm lg:grid-cols-[1fr_0.85fr] lg:p-7">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              Topographical practice
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink">
              Build your London map and route confidence
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">
              Topographical practice helps you revise London locations, route
              choices, direction sense, map interpretation, and journey planning
              skills. Use focused sessions to practise one topic at a time,
              review mistakes, and prepare for topographical-style mock exams.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <TrackedLink
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                eventName="practice_start_click"
                eventProperties={{
                  location: "topographical-page",
                  practice: "mixed-knowledge"
                }}
                href="/practice/knowledge"
              >
                Start topographical practice
              </TrackedLink>
              <TrackedLink
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                eventName="practice_start_click"
                eventProperties={{
                  location: "topographical-page",
                  practice: "mistakes"
                }}
                href="/progress/mistakes"
              >
                Review mistakes
              </TrackedLink>
              <TrackedLink
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                eventName="mock_exam_start_click"
                eventProperties={{
                  location: "topographical-page",
                  mode: "topographical"
                }}
                href="/mock-test"
              >
                Try mock exam
              </TrackedLink>
            </div>
          </div>
          <TopographicalVisual />
        </section>

        <PracticeTopicSelectorShell />
      </div>
    </AppShell>
  );
}
