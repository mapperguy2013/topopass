import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { QuestionCard } from "@/components/questions/QuestionCard";

const practiceOptions = [
  {
    title: "Knowledge Questions",
    description:
      "Answer focused map-reading and route-planning knowledge questions.",
    href: "/practice/knowledge",
    available: true
  },
  {
    title: "Map-Click Locations",
    description:
      "Practise finding stations and important London locations on the map.",
    href: "/practice/map-click",
    available: true
  },
  {
    title: "Route Planning",
    description:
      "Draw point-to-point routes between London locations and check your route against the accepted journey.",
    href: "/practice/routes",
    available: true
  },
  {
    title: "Points of Interest",
    description:
      "Review important London stations, hospitals, landmarks, and public places.",
    available: false
  }
] as const;

export default function PracticePage() {
  return (
    <AppShell title="Practice">
      <QuestionCard
        title="What do you want to practise?"
        description="Choose a focused study area. Completed practice attempts are saved locally in this browser for your progress page."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {practiceOptions.map((option) => {
            const content = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold text-ink">
                    {option.title}
                  </h3>
                  <span
                    className={`shrink-0 text-xs font-bold uppercase tracking-wide ${
                      option.available ? "text-road" : "text-slate-400"
                    }`}
                  >
                    {option.available ? "Start" : "Coming soon"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {option.description}
                </p>
                {option.available && (
                  <p className="mt-4 text-sm font-semibold text-road">
                    Open practice &rarr;
                  </p>
                )}
              </>
            );

            if (option.available) {
              return (
                <Link
                  className="rounded-lg border border-road/40 bg-blue-50/40 p-4 transition hover:border-road hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                  href={option.href}
                  key={option.title}
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                aria-disabled="true"
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                key={option.title}
              >
                {content}
              </div>
            );
          })}
        </div>
      </QuestionCard>
    </AppShell>
  );
}
