import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import { advancedSentenceCompletionQuestions } from "@/lib/seruEnglishQuestions";
import { SeruSentenceCompletionPracticeFlow } from "@/src/components/practice/SeruSentenceCompletionPracticeFlow";

export const metadata = buildPageMetadata({
  title: "SERU English Advanced Sentence Completion",
  description:
    "Practise original three-blank SERU-style sentence completion questions with inline selectable blanks.",
  path: "/practice/seru/english-advanced"
});

export default function SeruEnglishAdvancedPage() {
  return (
    <AppShell title="SERU English - Advanced Sentence Completion">
      <div className="space-y-5">
        <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm lg:p-7">
          <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
            Advanced SERU English
          </p>
          <h2 className="mt-2 text-3xl font-bold text-ink">
            Fill three inline blanks
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">
            These questions test broader grammar, vocabulary, sequence, and
            meaning in private-hire situations. All three blanks must be correct
            for the answer to score as correct.
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-orange-500 hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            href="/practice/seru"
          >
            Back to SERU practice menu
          </Link>
        </section>

        <SeruSentenceCompletionPracticeFlow
          mode="advanced"
          questions={advancedSentenceCompletionQuestions}
          title="SERU English - Advanced Sentence Completion"
        />
      </div>
    </AppShell>
  );
}
