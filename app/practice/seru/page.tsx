import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import { seruQuestionBank } from "@/lib/seruQuestions";
import { SERU_QUESTION_TOPICS } from "@/lib/questions/topics";
import { KnowledgePracticeFlow } from "@/src/components/practice/KnowledgePracticeFlow";

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
        <section className="rounded-lg border border-orange-200 bg-orange-50 p-5 shadow-sm sm:p-7">
          <p className="text-sm font-bold uppercase tracking-wide text-orange-900">
            Separate practice area
          </p>
          <h2 className="mt-2 text-3xl font-bold text-ink">
            SERU-style private hire knowledge practice
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">
            Build confidence with original SERU-style questions and
            explanations. This practice area is separate from Topographical
            Skills, so SERU questions are not included in topographical mock
            exams.
          </p>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">
            TopoPass is an independent learning tool and is not affiliated with
            or endorsed by Transport for London.
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-road">
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
      </div>
    </AppShell>
  );
}
