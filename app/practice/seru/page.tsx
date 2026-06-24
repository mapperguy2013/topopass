import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import { seruQuestionBank } from "@/lib/seruQuestions";
import { SERU_QUESTION_TOPICS } from "@/lib/questions/topics";
import { KnowledgePracticeFlow } from "@/src/components/practice/KnowledgePracticeFlow";
import { TrackedLink } from "@/src/components/analytics/TrackedLink";

export const metadata = buildPageMetadata({
  title: "SERU Preparation Practice",
  description:
    "Practise original SERU-style private hire knowledge questions covering safety, equality, accessibility, customer service, safeguarding, licensing, and driver responsibilities.",
  path: "/practice/seru"
});

type SeruPracticePageProps = {
  searchParams?: Promise<{
    topic?: string;
    difficulty?: string;
  }>;
};

function topicCount(topic: string) {
  return seruQuestionBank.filter(
    (question) => question.isActive && question.category === topic
  ).length;
}

function SeruPracticeVisual() {
  return (
    <div
      aria-label="Illustration of SERU-style learning cards and checklist progress"
      className="relative min-h-64 overflow-hidden rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
      role="img"
    >
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 640 320">
        <rect width="640" height="320" fill="#fffaf5" />
        <circle cx="520" cy="66" r="96" fill="#ffedd5" opacity="0.8" />
        <circle cx="108" cy="258" r="88" fill="#dbeafe" opacity="0.72" />
        <rect x="78" y="78" width="220" height="178" rx="18" fill="#ffffff" stroke="#fed7aa" strokeWidth="2" />
        <rect x="342" y="54" width="220" height="222" rx="18" fill="#ffffff" stroke="#fed7aa" strokeWidth="2" />
        <path d="M118 128h70M118 168h118M118 208h82" stroke="#fb923c" strokeLinecap="round" strokeWidth="11" />
        <path d="M382 113h108M382 156h132M382 199h92" stroke="#cbd5e1" strokeLinecap="round" strokeWidth="11" />
        <circle cx="382" cy="113" r="18" fill="#ffedd5" />
        <path d="M374 113l6 6 12-14" fill="none" stroke="#f97316" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        <circle cx="382" cy="156" r="18" fill="#ffedd5" />
        <path d="M374 156l6 6 12-14" fill="none" stroke="#f97316" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        <circle cx="382" cy="199" r="18" fill="#ffedd5" />
        <path d="M374 199l6 6 12-14" fill="none" stroke="#f97316" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
      </svg>
      <div className="relative max-w-sm rounded-xl border border-orange-100 bg-white/95 p-4 shadow-sm">
        <p className="text-sm font-bold text-orange-700">
          Safety / accessibility / customer care
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Learn with original SERU-style questions and clear explanations.
        </p>
      </div>
    </div>
  );
}

export default async function SeruPracticePage({
  searchParams
}: SeruPracticePageProps) {
  const resolvedSearchParams = await searchParams;
  const activeQuestions = seruQuestionBank.filter((question) => question.isActive);
  const topicCounts = new Map(
    SERU_QUESTION_TOPICS.map((topic) => [topic, topicCount(topic)] as const)
  );

  return (
    <AppShell title="SERU Preparation">
      <div className="space-y-5">
        <section className="grid gap-6 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm lg:grid-cols-[1fr_0.85fr] lg:p-7">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
              SERU-style practice
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink">
              Practise private-hire knowledge with clear explanations
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">
              SERU-style practice helps you revise key private-hire knowledge
              areas such as passenger safety, equality and accessibility,
              customer service, safeguarding, licensing awareness, driver
              responsibilities, and professional conduct. Answer original
              practice questions, read explanations, and focus on topics that
              need more work.
            </p>
            <p className="mt-3 max-w-4xl rounded-md bg-orange-50 p-3 text-sm leading-6 text-slate-700">
              This is separate from Topographical Skills, so SERU-style
              questions are not included in topographical mock exams. TopoPass
              is independent and is not affiliated with or endorsed by Transport
              for London.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <TrackedLink
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                eventName="practice_start_click"
                eventProperties={{ location: "seru-page", practice: "seru" }}
                href="#seru-practice"
              >
                Start SERU practice
              </TrackedLink>
              <TrackedLink
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                eventName="practice_start_click"
                eventProperties={{
                  location: "seru-page",
                  practice: "seru-mistakes"
                }}
                href="/progress/mistakes?type=knowledge"
              >
                Review SERU mistakes
              </TrackedLink>
              <span className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-500">
                SERU mock coming soon
              </span>
            </div>
          </div>
          <SeruPracticeVisual />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
                SERU topics
              </p>
              <h2 className="mt-2 text-2xl font-bold text-ink">
                Choose a topic, then answer practice questions
              </h2>
            </div>
            <p className="text-sm font-semibold text-slate-600">
              {activeQuestions.length} active starter questions
            </p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {SERU_QUESTION_TOPICS.map((topic) => (
              <Link
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-road hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                href={`/practice/seru?topic=${encodeURIComponent(topic)}`}
                key={topic}
              >
                <h3 className="text-base font-bold text-ink">{topic}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {topicCounts.get(topic) ?? 0} question
                  {topicCounts.get(topic) === 1 ? "" : "s"}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section id="seru-practice">
          <KnowledgePracticeFlow
            baseHref="/practice/seru"
            emptyQuestionTypeLabel="SERU-style knowledge"
            initialDifficulty={resolvedSearchParams?.difficulty}
            initialTopic={resolvedSearchParams?.topic}
            practiceFamily="seru"
            questionTypeLabel="SERU-style knowledge"
            questions={activeQuestions}
            title="SERU-style practice"
          />
        </section>
      </div>
    </AppShell>
  );
}
