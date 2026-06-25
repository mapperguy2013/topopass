import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import {
  phvHandbookQuestions,
  phvHandbookSections
} from "@/lib/seruPhvQuestions";
import { KnowledgePracticeFlow } from "@/src/components/practice/KnowledgePracticeFlow";
import { TrackedLink } from "@/src/components/analytics/TrackedLink";

export const metadata = buildPageMetadata({
  title: "PHV Driver Handbook Practice",
  description:
    "Choose PHV Driver Handbook sections and practise original SERU-style private hire knowledge questions.",
  path: "/practice/seru/phv-handbook"
});

type PhvHandbookPageProps = {
  searchParams?: Promise<{
    difficulty?: string;
    topic?: string;
  }>;
};

const handbookDisclaimer =
  "These are original practice questions based on TfL PHV/SERU guidance. They are not official TfL questions. Always read the latest TfL PHV Driver's Handbook before your assessment.";

function topicCount(topic: string) {
  return phvHandbookQuestions.filter(
    (question) => question.isActive && question.category === topic
  ).length;
}

export default async function PhvHandbookPracticePage({
  searchParams
}: PhvHandbookPageProps) {
  const resolvedSearchParams = await searchParams;
  const activePhvQuestions = phvHandbookQuestions.filter(
    (question) => question.isActive
  );
  const selectedTopic = resolvedSearchParams?.topic;
  const hasStarted = Boolean(selectedTopic);

  return (
    <AppShell title="PHV Driver Handbook Practice">
      <div className="space-y-5">
        <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm lg:p-7">
          <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
            PHV Driver Handbook Practice
          </p>
          <h2 className="mt-2 text-3xl font-bold text-ink">
            Choose a handbook section
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">
            Work through the 10 PHV Driver Handbook areas one section at a time,
            or practise all 100 original questions in a mixed session.
          </p>
          <p className="mt-3 max-w-4xl rounded-md bg-orange-50 p-3 text-sm leading-6 text-slate-700">
            {handbookDisclaimer}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <TrackedLink
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
              eventName="practice_start_click"
              eventProperties={{ location: "seru-phv-handbook", practice: "all" }}
              href="/practice/seru/phv-handbook?topic=all#phv-practice"
            >
              Practice all PHV Handbook questions
            </TrackedLink>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-orange-500 hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
              href="/practice/seru"
            >
              Back to SERU practice menu
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
                10 handbook sections
              </p>
              <h2 className="mt-2 text-2xl font-bold text-ink">
                Start one section at a time
              </h2>
            </div>
            <p className="text-sm font-semibold text-slate-600">
              {activePhvQuestions.length} questions
            </p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {phvHandbookSections.map((section) => (
              <Link
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-orange-300 hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                href={`/practice/seru/phv-handbook?topic=${encodeURIComponent(section.name)}#phv-practice`}
                key={section.id}
              >
                <h3 className="text-base font-bold text-ink">{section.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {section.description}
                </p>
                <p className="mt-3 text-sm font-semibold text-orange-700">
                  {topicCount(section.name)} questions
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section id="phv-practice">
          {hasStarted ? (
            <KnowledgePracticeFlow
              baseHref="/practice/seru/phv-handbook"
              emptyQuestionTypeLabel="PHV Handbook"
              initialDifficulty={resolvedSearchParams?.difficulty}
              initialTopic={selectedTopic}
              practiceFamily="seru"
              questionTypeLabel="PHV Handbook"
              questions={activePhvQuestions}
              title="PHV Driver Handbook practice"
            />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
              Choose a section above or use Practice all PHV Handbook questions
              to start.
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
