import Link from "next/link";
import Image from "next/image";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

const featureCards = [
  {
    title: "Map learning",
    description:
      "Practise London locations, transport hubs, landmarks, and TfL-style map skills."
  },
  {
    title: "Route drawing practice",
    description:
      "Draw point-to-point routes, compare your route with an accepted journey, and learn from route feedback."
  },
  {
    title: "Knowledge questions",
    description:
      "Build confidence with directions, street-atlas use, major roads, bridges, and passenger scenarios."
  },
  {
    title: "Mock exams",
    description:
      "Try mixed timed sessions across knowledge, map-click, and route-planning questions."
  },
  {
    title: "Progress tracking",
    description:
      "Review accuracy, recent activity, mistakes, and topic strengths after practice."
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
    title: "Knowledge drills",
    description: "Answer focused topographical and route-planning questions."
  }
] as const;

const stats = [
  { label: "Practice modes", value: "3" },
  { label: "Mock modes", value: "4" },
  { label: "Local practice", value: "No login" }
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[0.98fr_1.02fr] lg:px-8 lg:py-16">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              London topographical skills practice
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl lg:text-6xl">
              Practise map skills, routes, and mock exams for the TfL test
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
              TopoPass helps London private-hire learners build practical map
              confidence with focused location practice, route drawing,
              knowledge questions, mock exams, and progress review.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-road px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                href="/practice"
              >
                Start practice
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                href="/mock-test"
              >
                Take a mock exam
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                href="/progress"
              >
                View progress
              </Link>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {stats.map((item) => (
                <div
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  key={item.label}
                >
                  <p className="text-2xl font-bold text-ink">{item.value}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-soft">
              <div className="border-b border-slate-200 bg-white px-4 py-3">
                <p className="text-sm font-bold text-ink">
                  Driver-training map practice
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Local map assets, route drawing, and location practice.
                </p>
              </div>
              <div className="relative aspect-[4/3] bg-white">
                <Image
                  alt="Generated London driver-training atlas map preview"
                  className="h-full w-full object-cover"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  src="/maps/generated/kings-cross-euston-driver-training-atlas.svg"
                />
                <div className="absolute bottom-4 left-4 right-4 rounded-md border border-slate-200 bg-white/95 p-4 shadow-sm">
                  <p className="text-sm font-bold text-ink">
                    Draw routes and review mistakes
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Use local practice without signing in. Sign in later to keep
                    new progress across devices when Supabase is configured.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-surface px-6 py-14 lg:px-8">
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
              TfL-style map skills in short sessions. Start with map-click
              locations, then move into route drawing and mixed mock exams.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {practiceRoutes.map((route) => (
              <Link
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-road/50 hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
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
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-road">
                Learner tools
              </p>
              <h2 className="mt-2 text-3xl font-bold text-ink">
                Everything points back to exam-ready practice
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              The app stays useful signed out. Signing in adds account-backed
              progress for new practice and mock completions.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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

      <section className="border-y border-slate-200 bg-slate-50 px-6 py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-road">
              Progress loop
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink">
              Know what to practise next
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Review scores, recent activity, topic strengths, mistakes, and
              mock exam results so the next session has a clear purpose.
            </p>
            <Link
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href="/progress"
            >
              Open progress dashboard
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["1", "Practise a focused topic"],
              ["2", "Read feedback and explanations"],
              ["3", "Review weak areas before a mock"]
            ].map(([step, text]) => (
              <article
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                key={step}
              >
                <p className="flex size-10 items-center justify-center rounded-md bg-road text-sm font-bold text-white">
                  {step}
                </p>
                <h3 className="mt-5 text-lg font-bold text-ink">{text}</h3>
              </article>
            ))}
          </div>
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
              Signed-out learners can complete practice and mock exams with
              browser-local progress. Signed-in learners can save new progress
              to their account when Supabase is configured.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              href="/practice"
            >
              Start practice
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              href="/auth/sign-up"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
