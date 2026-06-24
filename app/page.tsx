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
    title: "Topographical Skills Practice",
    label: "Live now",
    description:
      "Build map-reading confidence with London routes, locations, direction sense, mistake review, and topographical mock preparation.",
    href: "/practice"
  },
  {
    title: "SERU Preparation",
    label: "Live starter practice",
    description:
      "Practise original SERU-style questions covering safety, equality, accessibility, customer service, passenger care, driver responsibilities, and regulatory awareness.",
    href: "/practice/seru"
  }
] as const;

const progressFeatures = [
  {
    title: "Local progress first",
    description:
      "Practise signed out and keep browser-local progress for current learning sessions."
  },
  {
    title: "Account progress when ready",
    description:
      "Sign in when you want new practice and mock exam completions saved to your learner account."
  },
  {
    title: "Mistakes and review",
    description:
      "Use mistake review, full answer history, and topic summaries to choose the next focused session."
  }
] as const;

const practiceRoutes = [
  {
    href: "/practice/map-click",
    title: "Map-click locations",
    description: "Find stations, hospitals, bridges, and landmarks on the map."
  },
  {
    href: "/practice/routes",
    title: "Route practice",
    description: "Draw journeys between London points and review your route."
  },
  {
    href: "/practice/knowledge",
    title: "Topographical knowledge",
    description: "Answer focused map-reading and route-planning questions."
  },
  {
    href: "/practice/seru",
    title: "SERU-style practice",
    description: "Answer private hire knowledge questions in a separate SERU area."
  },
  {
    href: "/mock-test",
    title: "Topographical mock exams",
    description: "Test knowledge, map-click, and route planning in one timed flow."
  }
] as const;

const howItWorks = [
  "Start with focused map, route, or knowledge practice.",
  "Read explanations and review mistakes after each attempt.",
  "Use progress insights to choose the next weak topic.",
  "Move into timed topographical mock exams when ready."
] as const;

const learnerReasons = [
  "No login needed to start browser-local practice.",
  "One account supports both topographical and SERU preparation areas.",
  "Original learning content only, with no claim of endorsement from Transport for London.",
  "Designed for short, repeatable study sessions on desktop and mobile."
] as const;

function HeroLearningVisual() {
  return (
    <div
      aria-label="Illustration of route practice, SERU preparation, and progress tracking"
      className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft"
      role="img"
    >
      <div className="relative min-h-[520px] bg-[#f7fbff] p-5 sm:p-7">
        <div className="relative z-10">
          <p className="text-xl font-bold text-ink">Practice overview</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Build confidence with Topographical Skills and SERU Preparation
          </p>
        </div>

        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 760 560"
        >
          <rect width="760" height="560" fill="#f7fbff" />
          <path
            d="M40 96 H720 M40 178 H720 M40 260 H720 M40 342 H720 M40 424 H720"
            stroke="#e1e8f2"
            strokeWidth="8"
          />
          <path
            d="M116 48 V492 M238 48 V492 M360 48 V492 M482 48 V492 M604 48 V492"
            stroke="#e1e8f2"
            strokeWidth="8"
          />
          <path
            d="M70 410 C150 408 182 356 246 350 C332 342 322 244 418 252 C492 258 482 178 570 166 C638 156 652 122 692 108"
            fill="none"
            stroke="#2f74f7"
            strokeLinecap="round"
            strokeWidth="10"
          />
          <path
            d="M70 410 C150 408 182 356 246 350 C332 342 322 244 418 252 C492 258 482 178 570 166 C638 156 652 122 692 108"
            fill="none"
            stroke="#1d4ed8"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <circle cx="70" cy="410" fill="#2f74f7" r="16" />
          <circle cx="70" cy="410" fill="#ffffff" r="8" />
          <circle cx="246" cy="350" fill="#2f74f7" r="13" />
          <circle cx="246" cy="350" fill="#ffffff" r="6" />
          <circle cx="418" cy="252" fill="#2f74f7" r="13" />
          <circle cx="418" cy="252" fill="#ffffff" r="6" />
          <path
            d="M692 76 C678 76 666 88 666 102 C666 124 692 154 692 154 C692 154 718 124 718 102 C718 88 706 76 692 76Z"
            fill="#f97316"
          />
          <circle cx="692" cy="101" fill="#ffffff" r="9" />
        </svg>

        <div className="relative z-10 mt-10 grid gap-5 md:grid-cols-[0.9fr_1fr] md:items-center">
          <div className="rounded-lg border border-blue-100 bg-white/95 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-road">
                <span className="text-2xl font-bold">M</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-ink">
                  Topographical Skills
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Practise locations, draw routes, and sharpen map skills.
                </p>
              </div>
            </div>
            <ul className="mt-6 space-y-3 border-t border-slate-200 pt-5 text-sm text-slate-700">
              {[
                "Identify locations",
                "Draw and review routes",
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

          <div className="flex justify-end">
            <div className="w-full max-w-sm rounded-lg border border-orange-100 bg-white/95 p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                  <span className="text-2xl font-bold">S</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-ink">
                    SERU Preparation
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Targeted practice for SERU-style questions and scenarios.
                  </p>
                </div>
              </div>
              <ul className="mt-6 space-y-3 border-t border-slate-200 pt-5 text-sm text-slate-700">
                {[
                  "SERU-style questions",
                  "Timed practice later",
                  "Track and improve"
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

        <div className="relative z-10 mt-8 grid gap-3 rounded-lg border border-slate-200 bg-white/95 p-4 shadow-sm sm:grid-cols-3">
          {[
            ["74%", "Accuracy", "Keep practising"],
            ["3", "Weak topics", "Focus areas to improve"],
            ["12", "Recent answers", "Keep the momentum"]
          ].map(([value, label, helper]) => (
            <div className="rounded-md bg-slate-50 p-4" key={label}>
              <p className="text-2xl font-bold text-ink">{value}</p>
              <p className="mt-1 text-sm font-bold text-ink">{label}</p>
              <p className="mt-1 text-xs text-slate-500">{helper}</p>
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
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-16">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              Private hire preparation, made clearer
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl lg:text-6xl">
              Build confidence for your TfL private hire journey
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
              TopoPass helps private-hire learners prepare with structured
              topographical practice, SERU-style learning, mock exams, mistake
              review, and progress tracking. Start practising straight away,
              then sign in when you want to save your progress across devices.
            </p>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              One account. Two clear learning areas: Topographical Skills and
              SERU Preparation.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
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
                Explore SERU preparation
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

          <div className="flex items-center">
            <HeroLearningVisual />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-surface px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              Two preparation areas
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink">
              Topographical skills now, SERU support as a separate category
            </h2>
            <p className="mt-3 text-base leading-8 text-slate-700">
              Topographical practice stays focused on maps, routes, and London
              locations. SERU-style preparation is positioned separately so
              SERU questions do not get mixed into topographical mocks.
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
                  <span className="w-fit rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase text-road">
                    {area.label}
                  </span>
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
              How TopoPass works
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink">
              Practise, review, repeat
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The learning loop is intentionally simple: answer questions, read
              feedback, review weak areas, and return to focused practice.
            </p>
          </div>

          <ol className="grid gap-4 sm:grid-cols-2">
            {howItWorks.map((step, index) => (
              <li
                className="rounded-lg border border-slate-200 bg-slate-50 p-5"
                key={step}
              >
                <p className="flex size-10 items-center justify-center rounded-md bg-road text-sm font-bold text-white">
                  {index + 1}
                </p>
                <h3 className="mt-5 text-lg font-bold text-ink">{step}</h3>
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
                Practice modes and mock exams
              </p>
              <h2 className="mt-2 text-3xl font-bold text-ink">
                Choose the next session by learning area
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              Topographical mock exams stay topographical-only. SERU-style
              practice is available as a separate starter question set.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {practiceRoutes.map((route) => (
              <TrackedLink
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-road/50 hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                eventName="practice_start_click"
                eventProperties={{ location: "home", practice: route.title }}
                href={route.href}
                key={route.href}
              >
                <h3 className="text-lg font-bold text-ink">{route.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {route.description}
                </p>
                <p className="mt-4 text-sm font-bold text-road">
                  Open practice
                </p>
              </TrackedLink>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              Progress tracking
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink">
              Review what you answered and what to practise next
            </h2>
            <p className="mt-3 text-base leading-8 text-slate-700">
              Progress, mistakes, and review history keep topographical and
              SERU preparation understandable without forcing learners to sign
              in before trying the app.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {progressFeatures.map((feature) => (
              <article
                className="rounded-lg border border-slate-200 bg-slate-50 p-5"
                key={feature.title}
              >
                <h3 className="text-lg font-bold text-ink">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-lg border border-blue-200 bg-blue-50 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              Pricing preview
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink">
              Free practice now. Plus plans will come later.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Payments are not live yet. The future account plan is intended to
              include both Topographical and SERU preparation areas under the
              same learner login.
            </p>
          </div>
          <TrackedLink
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            eventName="pricing_cta_click"
            eventProperties={{ cta: "pricing-preview", location: "home" }}
            href="/pricing"
          >
            View pricing preview
          </TrackedLink>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-surface px-6 py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              Independent preparation
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink">
              Built around repeatable private hire study
            </h2>
          </div>
          <ul className="grid gap-3">
            {learnerReasons.map((reason) => (
              <li
                className="rounded-md border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700"
                key={reason}
              >
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-ink px-6 py-14 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-blue-200">
              Start local-first
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              Practise now, sign in when you want account progress
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Signed-out learners can complete practice and topographical mock
              exams with browser-local progress. Signed-in learners can save new
              progress to their account when Supabase is configured.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <TrackedLink
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              eventName="home_cta_click"
              eventProperties={{ cta: "start-practice", location: "footer" }}
              href="/practice"
            >
              Start practice
            </TrackedLink>
            <TrackedLink
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              eventName="signup_intent_click"
              eventProperties={{ cta: "create-account", location: "footer" }}
              href="/auth/sign-up"
            >
              Create account
            </TrackedLink>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
