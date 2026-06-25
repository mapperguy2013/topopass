import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import { phvHandbookQuestions } from "@/lib/seruPhvQuestions";
import {
  advancedSentenceCompletionQuestions,
  sentenceCompletionQuestions
} from "@/lib/seruEnglishQuestions";
import { SERU_READING_UNDERSTANDING_QUESTIONS } from "@/lib/seruReadingQuestions";
import { TrackedLink } from "@/src/components/analytics/TrackedLink";

export const metadata = buildPageMetadata({
  title: "SERU and PHV Practice",
  description:
    "Choose original PHV Driver Handbook, SERU-style English, and reading-understanding practice for London private hire preparation.",
  path: "/practice/seru"
});

const handbookDisclaimer =
  "These are original practice questions based on TfL PHV/SERU guidance. They are not official TfL questions. Always read the latest TfL PHV Driver's Handbook before your assessment.";

const activePhvQuestionCount = phvHandbookQuestions.filter(
  (question) => question.isActive
).length;

const practiceCards = [
  {
    title: "PHV Driver Handbook Practice",
    description:
      "Work through 10 handbook sections covering licensing, bookings, safety, driver behaviour, parking, equality, safeguarding, and ridesharing.",
    href: "/practice/seru/phv-handbook",
    count: `${activePhvQuestionCount} questions`,
    badge: "Highest priority",
    emphasis: true
  },
  {
    title: "SERU English - Complete the Sentence",
    description:
      "Complete one missing word in each sentence using an inline blank, dropdown selection, or drag-and-drop.",
    href: "/practice/seru/english-complete-sentence",
    count: `${sentenceCompletionQuestions.length} questions`,
    badge: "Single blank",
    emphasis: false
  },
  {
    title: "SERU English - Advanced Sentence Completion",
    description:
      "Fill three inline blanks from seven options. Each blank is reviewed separately and all three must be correct.",
    href: "/practice/seru/english-advanced",
    count: `${advancedSentenceCompletionQuestions.length} questions`,
    badge: "Advanced English",
    emphasis: false
  },
  {
    title: "SERU Reading and Understanding",
    description:
      "Read short private-hire scenarios, answer comprehension questions, and review the explanation after each answer.",
    href: "/practice/seru/reading-understanding",
    count: `${SERU_READING_UNDERSTANDING_QUESTIONS.length} questions`,
    badge: "Reading practice",
    emphasis: false
  }
];

function SeruPracticeVisual() {
  return (
    <div
      aria-label="Illustration of separate SERU practice choices"
      className="relative min-h-64 overflow-hidden rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
      role="img"
    >
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 640 320">
        <rect width="640" height="320" fill="#fffaf5" />
        <circle cx="520" cy="70" r="105" fill="#ffedd5" opacity="0.82" />
        <circle cx="110" cy="260" r="92" fill="#dbeafe" opacity="0.72" />
        <path d="M56 245c80-44 136-26 198-72s98-92 188-78c46 7 82 31 142 8" fill="none" stroke="#2563eb" strokeLinecap="round" strokeWidth="12" />
        <path d="M56 245c80-44 136-26 198-72s98-92 188-78c46 7 82 31 142 8" fill="none" stroke="#93c5fd" strokeLinecap="round" strokeWidth="20" opacity="0.45" />
        <rect x="60" y="54" width="236" height="156" rx="18" fill="#ffffff" stroke="#fed7aa" strokeWidth="2" />
        <rect x="356" y="118" width="220" height="132" rx="18" fill="#ffffff" stroke="#fed7aa" strokeWidth="2" />
        <rect x="94" y="88" width="92" height="18" rx="9" fill="#fb923c" />
        <rect x="94" y="124" width="158" height="14" rx="7" fill="#cbd5e1" />
        <rect x="94" y="153" width="126" height="14" rx="7" fill="#cbd5e1" />
        <circle cx="398" cy="158" r="17" fill="#ffedd5" />
        <path d="M390 158l6 6 13-15" fill="none" stroke="#f97316" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        <circle cx="398" cy="203" r="17" fill="#ffedd5" />
        <path d="M390 203l6 6 13-15" fill="none" stroke="#f97316" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        <circle cx="258" cy="178" r="19" fill="#ffffff" stroke="#2563eb" strokeWidth="8" />
        <circle cx="442" cy="100" r="19" fill="#ffffff" stroke="#2563eb" strokeWidth="8" />
      </svg>
      <div className="relative max-w-sm rounded-xl border border-orange-100 bg-white/95 p-4 shadow-sm">
        <p className="text-sm font-bold text-orange-700">
          Choose a SERU practice type
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Start with PHV handbook sections, then build English and reading
          confidence in separate focused sessions.
        </p>
      </div>
    </div>
  );
}

function SeruPracticeCard({
  badge,
  count,
  description,
  emphasis,
  href,
  title
}: {
  badge: string;
  count: string;
  description: string;
  emphasis: boolean;
  href: string;
  title: string;
}) {
  return (
    <article
      className={`rounded-lg border bg-white p-5 shadow-sm ${
        emphasis ? "border-orange-300 ring-2 ring-orange-100" : "border-slate-200"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
            {badge}
          </p>
          <h3 className="mt-2 text-xl font-bold text-ink">{title}</h3>
        </div>
        <span className="inline-flex w-fit rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-800">
          {count}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <TrackedLink
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
        eventName="practice_start_click"
        eventProperties={{ location: "seru-menu", practice: title }}
        href={href}
      >
        Start practice
      </TrackedLink>
    </article>
  );
}

export default function SeruPracticePage() {
  return (
    <AppShell title="SERU and PHV Practice">
      <div className="space-y-5">
        <section className="grid gap-6 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm lg:grid-cols-[1fr_0.85fr] lg:p-7">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
              SERU and PHV preparation
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink">
              Choose a focused SERU practice area
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">
              Practise PHV handbook knowledge, SERU-style English sentence
              completion, and reading-understanding questions in separate
              sessions. Your progress continues to save through the same
              TopoPass practice history.
            </p>
            <p className="mt-3 max-w-4xl rounded-md bg-orange-50 p-3 text-sm leading-6 text-slate-700">
              {handbookDisclaimer} TopoPass is independent and is not
              affiliated with or endorsed by Transport for London.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <TrackedLink
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                eventName="practice_start_click"
                eventProperties={{ location: "seru-menu", practice: "phv-handbook" }}
                href="/practice/seru/phv-handbook"
              >
                Start PHV Handbook practice
              </TrackedLink>
              <TrackedLink
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-orange-500 hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                eventName="practice_start_click"
                eventProperties={{ location: "seru-menu", practice: "reading" }}
                href="/practice/seru/reading-understanding"
              >
                Try reading practice
              </TrackedLink>
              <TrackedLink
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-orange-500 hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                eventName="practice_start_click"
                eventProperties={{ location: "seru-menu", practice: "seru-mistakes" }}
                href="/progress/mistakes?type=knowledge"
              >
                Review SERU mistakes
              </TrackedLink>
            </div>
          </div>
          <SeruPracticeVisual />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {practiceCards.map((card) => (
            <SeruPracticeCard key={card.href} {...card} />
          ))}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-ink">
            Keep SERU separate from topographical practice
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            SERU-style questions stay in this dedicated practice area. They do
            not appear in topographical mock exams, route planning, or map-click
            practice.
          </p>
          <Link
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-orange-500 hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            href="/practice"
          >
            Back to practice choices
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
