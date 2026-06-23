import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";

const routeSkills = [
  {
    title: "Read the full journey",
    description:
      "Locate the start and destination before comparing the roads that connect them."
  },
  {
    title: "Build a continuous route",
    description:
      "Follow connected streets carefully and keep junctions, road hierarchy, and direction in view."
  },
  {
    title: "Review route accuracy",
    description:
      "Use feedback on your start, destination, route coverage, and off-route movement to improve."
  }
] as const;

export default function LearnPage() {
  return (
    <AppShell title="Learn">
      <section className="border-y border-slate-200 bg-white px-5 py-7 sm:px-7">
        <p className="text-sm font-semibold uppercase tracking-wide text-road">
          Route study
        </p>
        <h2 className="mt-2 text-2xl font-bold text-ink">
          Route Planning Skills
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
          Practise planning point-to-point journeys between London locations on
          a detailed street map. Route questions help develop the road-reading,
          location awareness, and continuous route selection needed for
          topographical assessment preparation.
        </p>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {routeSkills.map((skill) => (
            <article
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              key={skill.title}
            >
              <h3 className="text-base font-bold text-ink">{skill.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {skill.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            href="/practice/routes"
          >
            Start Route Planning Practice
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-road hover:text-road"
            href="/practice"
          >
            View all practice areas
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
