import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import {
  phvHandbookQuestions,
  phvHandbookSections
} from "@/lib/seruPhvQuestions";
import {
  advancedSentenceCompletionQuestions,
  sentenceCompletionQuestions
} from "@/lib/seruEnglishQuestions";
import { KnowledgePracticeFlow } from "@/src/components/practice/KnowledgePracticeFlow";
import { SeruSentenceCompletionPracticeFlow } from "@/src/components/practice/SeruSentenceCompletionPracticeFlow";
import { TrackedLink } from "@/src/components/analytics/TrackedLink";

export const metadata = buildPageMetadata({
  title: "SERU and PHV Practice",
  description:
    "Practise original PHV Driver Handbook knowledge and SERU-style English sentence completion questions for London private hire preparation.",
  path: "/practice/seru"
});

type SeruPracticePageProps = {
  searchParams?: Promise<{
    difficulty?: string;
    mode?: string;
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

function SeruPracticeVisual() {
  return (
    <div
      aria-label="Illustration of PHV handbook practice and SERU English sentence completion"
      className="relative min-h-72 overflow-hidden rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
      role="img"
    >
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 640 340">
        <rect width="640" height="340" fill="#fffaf5" />
        <circle cx="520" cy="70" r="105" fill="#ffedd5" opacity="0.82" />
        <circle cx="110" cy="282" r="92" fill="#dbeafe" opacity="0.72" />
        <path d="M56 260c80-44 136-26 198-72s98-98 188-84c46 7 82 31 142 8" fill="none" stroke="#2563eb" strokeLinecap="round" strokeWidth="12" />
        <path d="M56 260c80-44 136-26 198-72s98-98 188-84c46 7 82 31 142 8" fill="none" stroke="#93c5fd" strokeLinecap="round" strokeWidth="20" opacity="0.45" />
        <rect x="62" y="58" width="236" height="184" rx="18" fill="#ffffff" stroke="#fed7aa" strokeWidth="2" />
        <rect x="354" y="116" width="220" height="154" rx="18" fill="#ffffff" stroke="#fed7aa" strokeWidth="2" />
        <rect x="94" y="95" width="78" height="18" rx="9" fill="#fb923c" />
        <rect x="94" y="132" width="158" height="14" rx="7" fill="#cbd5e1" />
        <rect x="94" y="162" width="126" height="14" rx="7" fill="#cbd5e1" />
        <circle cx="396" cy="158" r="17" fill="#ffedd5" />
        <path d="M388 158l6 6 13-15" fill="none" stroke="#f97316" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        <circle cx="396" cy="203" r="17" fill="#ffedd5" />
        <path d="M388 203l6 6 13-15" fill="none" stroke="#f97316" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        <circle cx="258" cy="188" r="19" fill="#ffffff" stroke="#2563eb" strokeWidth="8" />
        <circle cx="442" cy="104" r="19" fill="#ffffff" stroke="#2563eb" strokeWidth="8" />
      </svg>
      <div className="relative max-w-sm rounded-xl border border-orange-100 bg-white/95 p-4 shadow-sm">
        <p className="text-sm font-bold text-orange-700">
          PHV Handbook and SERU English
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Work through private hire responsibilities, passenger care, safety,
          accessibility, safeguarding, and sentence completion practice.
        </p>
      </div>
    </div>
  );
}

function PracticeAreaCard({
  count,
  description,
  href,
  label,
  title
}: {
  count: string;
  description: string;
  href: string;
  label: string;
  title: string;
}) {
  return (
    <Link
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
      href={href}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
        {label}
      </p>
      <h3 className="mt-2 text-xl font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <p className="mt-4 text-sm font-bold text-orange-700">{count}</p>
    </Link>
  );
}

export default async function SeruPracticePage({
  searchParams
}: SeruPracticePageProps) {
  const resolvedSearchParams = await searchParams;
  const mode = resolvedSearchParams?.mode ?? "phv";
  const activePhvQuestions = phvHandbookQuestions.filter(
    (question) => question.isActive
  );

  return (
    <AppShell title="SERU and PHV Practice">
      <div className="space-y-5">
        <section className="grid gap-6 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm lg:grid-cols-[1fr_0.85fr] lg:p-7">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
              SERU and PHV preparation
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink">
              Practise PHV handbook knowledge and SERU-style English
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">
              Build confidence with original private-hire practice covering the
              PHV Driver Handbook, passenger safety, equality and accessibility,
              customer care, safeguarding, professional responsibilities, and
              sentence-completion English tasks.
            </p>
            <p className="mt-3 max-w-4xl rounded-md bg-orange-50 p-3 text-sm leading-6 text-slate-700">
              {handbookDisclaimer} TopoPass is independent and is not
              affiliated with or endorsed by Transport for London.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <TrackedLink
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                eventName="practice_start_click"
                eventProperties={{ location: "seru-page", practice: "phv-handbook" }}
                href="#seru-practice"
              >
                Start PHV Handbook practice
              </TrackedLink>
              <TrackedLink
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-orange-500 hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                eventName="practice_start_click"
                eventProperties={{ location: "seru-page", practice: "seru-english" }}
                href="/practice/seru?mode=english"
              >
                Try SERU English
              </TrackedLink>
              <TrackedLink
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-orange-500 hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                eventName="practice_start_click"
                eventProperties={{
                  location: "seru-page",
                  practice: "seru-mistakes"
                }}
                href="/progress/mistakes?type=knowledge"
              >
                Review SERU mistakes
              </TrackedLink>
            </div>
          </div>
          <SeruPracticeVisual />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <PracticeAreaCard
            count={`${activePhvQuestions.length} questions`}
            description="Practise the core areas of PHV driver responsibilities, safety, licensing, journeys, equality, safeguarding, and ridesharing."
            href="/practice/seru"
            label="Highest priority"
            title="PHV Driver Handbook Practice"
          />
          <PracticeAreaCard
            count={`${sentenceCompletionQuestions.length} questions`}
            description="Complete one missing word in each sentence using drag-and-drop or tap/click controls."
            href="/practice/seru?mode=english"
            label="SERU English"
            title="Complete the Sentence"
          />
          <PracticeAreaCard
            count={`${advancedSentenceCompletionQuestions.length} questions`}
            description="Fill three blanks from seven options. Each blank is reviewed separately, and full credit requires all three correct."
            href="/practice/seru?mode=advanced-english"
            label="Advanced English"
            title="3-blank Sentence Completion"
          />
        </section>

        {mode !== "english" && mode !== "advanced-english" && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
                  PHV handbook sections
                </p>
                <h2 className="mt-2 text-2xl font-bold text-ink">
                  Choose a handbook section, then answer practice questions
                </h2>
              </div>
              <p className="text-sm font-semibold text-slate-600">
                10 sections, 100 original questions
              </p>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {phvHandbookSections.map((section) => (
                <Link
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-orange-300 hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                  href={`/practice/seru?topic=${encodeURIComponent(section.name)}#seru-practice`}
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
        )}

        <section id="seru-practice">
          {mode === "english" ? (
            <SeruSentenceCompletionPracticeFlow
              mode="single"
              questions={sentenceCompletionQuestions}
              title="SERU English - Complete the Sentence"
            />
          ) : mode === "advanced-english" ? (
            <SeruSentenceCompletionPracticeFlow
              mode="advanced"
              questions={advancedSentenceCompletionQuestions}
              title="SERU English - Advanced Sentence Completion"
            />
          ) : (
            <KnowledgePracticeFlow
              baseHref="/practice/seru"
              emptyQuestionTypeLabel="PHV Handbook"
              initialDifficulty={resolvedSearchParams?.difficulty}
              initialTopic={resolvedSearchParams?.topic}
              practiceFamily="seru"
              questionTypeLabel="PHV Handbook"
              questions={activePhvQuestions}
              title="PHV Driver Handbook practice"
            />
          )}
        </section>
      </div>
    </AppShell>
  );
}
