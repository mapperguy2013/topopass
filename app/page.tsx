import Link from "next/link";
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
    <div
      aria-label="Illustration of route practice, SERU preparation, and progress tracking"
      className="relative overflow-hidden rounded-[2rem] border border-blue-100/80 bg-white shadow-[0_28px_80px_rgba(37,99,235,0.12)]"
      role="img"
    >
      <div className="relative min-h-[590px] bg-[radial-gradient(circle_at_50%_10%,#ffffff_0%,#f7fbff_44%,#edf6ff_100%)] p-5 sm:min-h-[640px] sm:p-8 lg:min-h-[705px] lg:p-10">
        <div className="pointer-events-none absolute inset-x-10 top-8 h-40 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Practice overview
          </h2>
          <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
            Build confidence with map skills and SERU-style learning
          </p>
        </div>

        <svg
          aria-hidden="true"
          className="absolute inset-x-0 top-16 h-[455px] w-full opacity-95 sm:h-[525px] lg:top-20 lg:h-[575px]"
          viewBox="0 0 920 520"
        >
          <defs>
            <linearGradient id="mapFade" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#f8fbff" stopOpacity="0.45" />
              <stop offset="0.55" stopColor="#edf6ff" stopOpacity="0.72" />
              <stop offset="1" stopColor="#f8fbff" stopOpacity="0.55" />
            </linearGradient>
            <filter id="routeShadow" x="-8%" y="-20%" width="116%" height="140%">
              <feDropShadow
                dx="0"
                dy="8"
                floodColor="#2563eb"
                floodOpacity="0.18"
                stdDeviation="6"
              />
            </filter>
            <filter id="pinShadow" x="-40%" y="-20%" width="180%" height="170%">
              <feDropShadow
                dx="0"
                dy="7"
                floodColor="#0f172a"
                floodOpacity="0.16"
                stdDeviation="4"
              />
            </filter>
          </defs>
          <rect width="920" height="520" fill="url(#mapFade)" />
          <path
            d="M40 122 H880 M40 212 H880 M40 302 H880 M40 392 H880"
            stroke="#e1eaf4"
            strokeLinecap="round"
            strokeWidth="13"
          />
          <path
            d="M106 70 V476 M220 70 V476 M334 70 V476 M448 70 V476 M562 70 V476 M676 70 V476 M790 70 V476"
            stroke="#e1eaf4"
            strokeLinecap="round"
            strokeWidth="13"
          />
          <path
            d="M64 474 C144 410 236 428 320 382 C400 338 432 374 520 330 C612 284 698 302 844 248"
            fill="none"
            stroke="#ffffff"
            strokeLinecap="round"
            strokeOpacity="0.84"
            strokeWidth="14"
          />
          <path
            d="M150 66 C216 116 298 92 374 138 C446 182 524 132 594 174 C676 224 752 178 846 210"
            fill="none"
            stroke="#ffffff"
            strokeLinecap="round"
            strokeOpacity="0.72"
            strokeWidth="12"
          />
          <path
            d="M28 450 C98 412 130 352 210 344 C304 334 332 242 426 240 C520 238 526 168 626 154 C722 140 776 112 880 94"
            fill="none"
            stroke="#eff6ff"
            strokeLinecap="round"
            strokeWidth="42"
          />
          <path
            d="M34 438 C112 412 138 354 220 344 C314 332 338 248 426 246 C526 244 526 174 632 160 C724 148 782 122 872 104"
            fill="none"
            filter="url(#routeShadow)"
            stroke="#2f74f7"
            strokeLinecap="round"
            strokeWidth="14"
          />
          <path
            d="M34 438 C112 412 138 354 220 344 C314 332 338 248 426 246 C526 244 526 174 632 160 C724 148 782 122 872 104"
            fill="none"
            stroke="#1d4ed8"
            strokeLinecap="round"
            strokeWidth="5"
          />
          <path
            d="M80 380 L178 312 L270 330 L340 250 L460 266 L538 186 L650 204 L746 134"
            fill="none"
            stroke="#ffffff"
            strokeLinecap="round"
            strokeOpacity="0.9"
            strokeWidth="8"
          />
          <path
            d="M40 190 C118 176 164 116 252 126 C326 136 364 74 440 82"
            fill="none"
            stroke="#dff5e7"
            strokeLinecap="round"
            strokeWidth="34"
          />
          <path
            d="M494 350 C576 312 634 326 720 282"
            fill="none"
            stroke="#d7eef8"
            strokeLinecap="round"
            strokeWidth="34"
          />
          <circle cx="34" cy="438" fill="#2563eb" r="20" />
          <circle cx="34" cy="438" fill="none" stroke="#bfdbfe" strokeWidth="7" r="28" />
          <circle cx="34" cy="438" fill="#ffffff" r="9" />
          <circle cx="314" cy="332" fill="#2563eb" r="15" />
          <circle cx="314" cy="332" fill="none" stroke="#bfdbfe" strokeWidth="6" r="23" />
          <circle cx="314" cy="332" fill="#ffffff" r="7" />
          <circle cx="526" cy="244" fill="#2563eb" r="15" />
          <circle cx="526" cy="244" fill="none" stroke="#bfdbfe" strokeWidth="6" r="23" />
          <circle cx="526" cy="244" fill="#ffffff" r="7" />
          <g filter="url(#pinShadow)">
            <path
              d="M872 60 C856 60 842 74 842 90 C842 116 872 150 872 150 C872 150 902 116 902 90 C902 74 888 60 872 60Z"
              fill="#f97316"
            />
            <circle cx="872" cy="89" fill="#ffffff" r="11" />
          </g>
        </svg>

        <div className="relative z-10 mt-9 grid min-h-[385px] gap-6 md:grid-cols-[0.92fr_1fr] md:items-center lg:min-h-[455px]">
          <div className="max-w-sm rounded-[1.35rem] border border-blue-100 bg-white/95 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur lg:p-6">
            <div className="flex items-start gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-road">
                <svg
                  aria-hidden="true"
                  className="size-8"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 6v14l5-3 6 3 5-3V3l-5 3-6-3-5 3z" />
                  <path d="M9 3v14" />
                  <path d="M15 6v14" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold leading-tight tracking-tight text-ink">
                  Topographical practice
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Practise locations, routes, and map-reading skills.
                </p>
              </div>
            </div>

            <ul className="mt-6 space-y-3 border-t border-slate-200 pt-5 text-sm text-slate-700">
              {[
                "Identify locations",
                "Review routes",
                "Build map confidence"
              ].map((item) => (
                <li className="flex items-center gap-3" key={item}>
                  <span
                    aria-hidden="true"
                    className="flex size-5 items-center justify-center rounded-full border border-road"
                  >
                    <span className="size-2 rounded-full bg-road" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="ml-auto max-w-sm rounded-[1.35rem] border border-orange-100 bg-white/95 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur lg:p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <svg
                    aria-hidden="true"
                    className="size-8"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 5h6" />
                    <path d="M9 11h6" />
                    <path d="M9 17h3" />
                    <path d="M5 7l1.5 1.5L9 6" />
                    <path d="M5 13l1.5 1.5L9 12" />
                    <rect height="18" rx="2" width="14" x="5" y="3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold leading-tight text-ink">
                    SERU Preparation
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Targeted practice for SERU-style questions and scenarios.
                  </p>
                </div>
              </div>

              <ul className="mt-6 space-y-3 border-t border-slate-200 pt-5 text-sm text-slate-700">
                {[
                  "SERU-style questions",
                  "Topic practice",
                  "Track improvement"
                ].map((item) => (
                  <li className="flex items-center gap-3" key={item}>
                    <span
                      aria-hidden="true"
                      className="flex size-5 items-center justify-center rounded-full border border-orange-500"
                    >
                      <span className="size-2 rounded-full bg-orange-500" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-6 grid gap-0 overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white/95 p-3 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur sm:grid-cols-3 lg:p-5">
          {[
            {
              value: "74%",
              label: "Accuracy",
              helper: "Keep practising",
              accent: "text-road",
              background: "bg-blue-100",
              icon: (
                <svg
                  aria-hidden="true"
                  className="size-16"
                  fill="none"
                  viewBox="0 0 64 64"
                >
                  <circle
                    cx="32"
                    cy="32"
                    r="25"
                    stroke="#dbeafe"
                    strokeWidth="8"
                  />
                  <path
                    d="M32 7a25 25 0 1 1-20.5 39.3"
                    stroke="#3b82f6"
                    strokeLinecap="round"
                    strokeWidth="8"
                  />
                </svg>
              )
            },
            {
              value: "3",
              label: "Weak topics",
              helper: "Focus areas to improve",
              accent: "text-road",
              background: "bg-blue-100",
              icon: (
                <svg
                  aria-hidden="true"
                  className="size-10"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="4"
                  viewBox="0 0 48 48"
                >
                  <path d="M12 34V24" />
                  <path d="M24 34V14" />
                  <path d="M36 34V20" />
                </svg>
              )
            },
            {
              value: "12",
              label: "Recent answers",
              helper: "Keep the momentum",
              accent: "text-emerald-600",
              background: "bg-emerald-100",
              icon: (
                <svg
                  aria-hidden="true"
                  className="size-10"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  viewBox="0 0 48 48"
                >
                  <circle cx="24" cy="24" r="15" />
                  <path d="M24 14v11l8 5" />
                </svg>
              )
            }
          ].map((stat) => (
            <div
              className="flex items-center gap-4 border-slate-200 p-4 sm:border-r sm:last:border-r-0 lg:px-6"
              key={stat.label}
            >
              <div
                className={`flex size-20 shrink-0 items-center justify-center rounded-full ${stat.background} ${stat.accent}`}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold leading-none text-ink">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm font-bold text-ink">{stat.label}</p>
                <p className="mt-1 text-xs text-slate-500">{stat.helper}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
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
