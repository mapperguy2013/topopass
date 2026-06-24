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
    title: "Topographical map skills",
    label: "Live now",
    description:
      "Practise London locations, route drawing, map-reading decisions, and mixed topographical mock exams.",
    href: "/practice"
  },
  {
    title: "SERU preparation support",
    label: "Separate area planned",
    description:
      "Build confidence with SERU-style private hire knowledge: safety, equality, accessibility, customer service, licensing rules, safeguarding, complaints, lost property, and regulatory awareness.",
    href: "/learn#seru-preparation"
  }
] as const;

const featureCards = [
  {
    title: "Map and route practice",
    description:
      "Find London places, draw routes from start to destination, and compare your work with accepted training answers."
  },
  {
    title: "SERU-style learning",
    description:
      "Prepare for private hire knowledge themes separately from topographical mock exams, using original learning support."
  },
  {
    title: "Mock exams",
    description:
      "Take topographical-only mixed mocks covering knowledge, map-click, and route-planning questions."
  },
  {
    title: "Progress tracking",
    description:
      "Review mistakes, topic strengths, weak areas, and recent activity locally or through your account."
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
  "One account will support both topographical and SERU preparation areas.",
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
      <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-ink">Learning map</p>
          <p className="mt-1 text-xs text-slate-500">
            Route skills, SERU-style topics, and progress in one account.
          </p>
        </div>
        <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase text-road">
          Local-first
        </span>
      </div>

      <div className="relative aspect-[4/3] bg-[#f8fbff]">
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 640 480"
        >
          <rect width="640" height="480" fill="#f8fbff" />
          <path
            d="M40 100 H600 M40 190 H600 M40 280 H600 M40 370 H600"
            stroke="#d8e1ee"
            strokeWidth="3"
          />
          <path
            d="M126 48 V430 M252 48 V430 M378 48 V430 M504 48 V430"
            stroke="#d8e1ee"
            strokeWidth="3"
          />
          <path
            d="M72 382 C148 310 202 332 276 250 C340 178 426 204 484 154 C520 124 552 104 588 86"
            fill="none"
            stroke="#1d4ed8"
            strokeLinecap="round"
            strokeWidth="14"
          />
          <path
            d="M72 382 C148 310 202 332 276 250 C340 178 426 204 484 154 C520 124 552 104 588 86"
            fill="none"
            stroke="#ffffff"
            strokeDasharray="12 14"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <circle cx="72" cy="382" fill="#0f172a" r="17" />
          <circle cx="588" cy="86" fill="#f97316" r="17" />
          <rect
            fill="#ffffff"
            height="62"
            rx="8"
            stroke="#bfdbfe"
            strokeWidth="2"
            width="166"
            x="70"
            y="70"
          />
          <text
            fill="#0f172a"
            fontFamily="Arial, sans-serif"
            fontSize="17"
            fontWeight="700"
            x="88"
            y="100"
          >
            Map practice
          </text>
          <text
            fill="#64748b"
            fontFamily="Arial, sans-serif"
            fontSize="13"
            x="88"
            y="119"
          >
            Locations + routes
          </text>
          <rect
            fill="#fff7ed"
            height="70"
            rx="8"
            stroke="#fed7aa"
            strokeWidth="2"
            width="178"
            x="382"
            y="322"
          />
          <text
            fill="#0f172a"
            fontFamily="Arial, sans-serif"
            fontSize="17"
            fontWeight="700"
            x="400"
            y="352"
          >
            SERU-style
          </text>
          <text
            fill="#64748b"
            fontFamily="Arial, sans-serif"
            fontSize="13"
            x="400"
            y="372"
          >
            Separate practice area
          </text>
        </svg>

        <div className="absolute bottom-4 left-4 right-4 grid gap-3 sm:grid-cols-3">
          {[
            ["74%", "Latest accuracy"],
            ["3", "Weak topics"],
            ["12", "Recent answers"]
          ].map(([value, label]) => (
            <div
              className="rounded-md border border-slate-200 bg-white/95 p-3 shadow-sm"
              key={label}
            >
              <p className="text-xl font-bold text-ink">{value}</p>
              <p className="text-xs font-semibold text-slate-500">{label}</p>
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
              TfL private hire preparation
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl lg:text-6xl">
              Map practice, SERU-style learning, mocks, and progress in one
              place
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
              Prepare for your TfL private hire journey with London map skills,
              route confidence, SERU-style knowledge support, mock exams,
              mistake review, and topic tracking. Start signed out locally or
              sign in to save new progress to your account.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-road px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                eventName="home_cta_click"
                eventProperties={{ cta: "start-practice", location: "hero" }}
                href="/practice"
              >
                Start free practice
              </TrackedLink>
              <TrackedLink
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                eventName="home_cta_click"
                eventProperties={{ cta: "mock-test", location: "hero" }}
                href="/mock-test"
              >
                Take a mock exam
              </TrackedLink>
              <TrackedLink
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                eventName="signup_intent_click"
                eventProperties={{ cta: "create-account", location: "hero" }}
                href="/auth/sign-up"
              >
                Create account
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
              future SERU questions do not get mixed into topographical mocks.
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
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              Map learning
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink">
              Build practical London map confidence
            </h2>
            <p className="mt-3 text-base leading-8 text-slate-700">
              Practise locations, route choices, direction sense, and
              TfL-style map skills in short sessions. These topographical
              practice areas remain separate from future SERU practice.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
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

      <section className="border-b border-slate-200 bg-slate-50 px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-road">
                Learner tools
              </p>
              <h2 className="mt-2 text-3xl font-bold text-ink">
                Designed for nervous learners who need a clear next step
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              The app stays useful signed out. Signing in adds account-backed
              progress for new practice and mock completions.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((feature) => (
              <article
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
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

      <section className="border-b border-slate-200 bg-surface px-6 py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              Why learners use it
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink">
              Built around repeatable private hire preparation
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
