import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import { phvHandbookQuestions } from "@/lib/seruPhvQuestions";
import { KnowledgePracticeFlow } from "@/src/components/practice/KnowledgePracticeFlow";

export const metadata = buildPageMetadata({
  title: "All PHV Handbook Questions",
  description:
    "Practise all original PHV Driver Handbook questions across the 10 SERU private hire sections.",
  path: "/practice/seru/phv-handbook/all"
});

const activePhvQuestions = phvHandbookQuestions.filter(
  (question) => question.isActive
);

export default function AllPhvHandbookPracticePage() {
  return (
    <AppShell title="All PHV Handbook Questions">
      <div className="space-y-5">
        <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm lg:p-7">
          <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
            PHV Driver Handbook Practice
          </p>
          <h2 className="mt-2 text-3xl font-bold text-ink">
            Practice all PHV Handbook questions
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">
            Work through all {activePhvQuestions.length} original TopoPass PHV
            Handbook questions across licensing, journeys, safety, behaviour,
            parking, equality, safeguarding, and ridesharing.
          </p>
          <p className="mt-3 max-w-4xl rounded-md bg-orange-50 p-3 text-sm leading-6 text-slate-700">
            These are original practice questions, not official TfL questions.
            Always read the latest TfL PHV Driver&apos;s Handbook before your
            assessment.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-orange-500 hover:text-orange-700"
              href="/practice/seru/phv-handbook"
            >
              Back to PHV Handbook sections
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-orange-500 hover:text-orange-700"
              href="/practice/seru"
            >
              Back to SERU practice
            </Link>
          </div>
        </section>

        <KnowledgePracticeFlow
          baseHref="/practice/seru/phv-handbook/all"
          emptyQuestionTypeLabel="PHV Handbook"
          practiceFamily="seru"
          questionTypeLabel="PHV Handbook"
          questions={activePhvQuestions}
          title="PHV Driver Handbook practice"
        />
      </div>
    </AppShell>
  );
}
