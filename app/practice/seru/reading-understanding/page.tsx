import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import { SERU_READING_UNDERSTANDING_QUESTIONS } from "@/lib/seruReadingQuestions";
import { SeruReadingComprehensionPracticeFlow } from "@/src/components/practice/SeruReadingComprehensionPracticeFlow";

export const metadata = buildPageMetadata({
  title: "SERU Reading and Understanding Practice",
  description:
    "Practise original SERU-style short-passage reading comprehension questions for London private hire preparation.",
  path: "/practice/seru/reading-understanding"
});

export default function SeruReadingUnderstandingPage() {
  return (
    <AppShell title="SERU Reading and Understanding">
      <div className="space-y-5">
        <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm lg:p-7">
          <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
            SERU reading practice
          </p>
          <h2 className="mt-2 text-3xl font-bold text-ink">
            Read short private-hire scenarios
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">
            Each question includes an original passage and one multiple-choice
            question. The aim is to practise careful reading, inference,
            sequence, and meaning in PHV/SERU-style situations.
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-orange-500 hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            href="/practice/seru"
          >
            Back to SERU practice menu
          </Link>
        </section>

        <SeruReadingComprehensionPracticeFlow
          questions={SERU_READING_UNDERSTANDING_QUESTIONS}
        />
      </div>
    </AppShell>
  );
}
