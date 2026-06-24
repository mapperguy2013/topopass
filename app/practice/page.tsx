import { AppShell } from "@/components/layout/AppShell";
import { QuestionCard } from "@/components/questions/QuestionCard";
import { buildPageMetadata } from "@/lib/seo";
import { TrackedLink } from "@/src/components/analytics/TrackedLink";
import { PracticeTopicSelectorShell } from "@/src/components/practice/PracticeTopicSelector";

export const metadata = buildPageMetadata({
  title: "Practice",
  description:
    "Practise TfL-style topographical knowledge, map-click location questions, and route drawing with local or account-backed progress.",
  path: "/practice"
});

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
  },
  {
    title: "SERU Preparation",
    description:
      "Practise original SERU-style questions covering safety, equality, accessibility, customer service, safeguarding, and regulatory awareness.",
    href: "/practice/seru",
    available: true
  }
] as const;

export default function PracticePage() {
  return (
    <AppShell title="Practice">
      <div className="space-y-5">
        <PracticeTopicSelectorShell />

        <QuestionCard
          title="Or choose by question style"
          description="Use these mixed sessions when you want a broader practice set. Completed practice attempts are saved locally first, and signed-in learners also sync to Supabase."
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
                  <TrackedLink
                    className="rounded-lg border border-road/40 bg-blue-50/40 p-4 transition hover:border-road hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                    eventName="practice_start_click"
                    eventProperties={{
                      location: "practice-index",
                      practice: option.title
                    }}
                    href={option.href}
                    key={option.title}
                  >
                    {content}
                  </TrackedLink>
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
      </div>
    </AppShell>
  );
}
