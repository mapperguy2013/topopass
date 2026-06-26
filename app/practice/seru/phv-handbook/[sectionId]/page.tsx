import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import {
  phvHandbookQuestions,
  phvHandbookSections
} from "@/lib/seruPhvQuestions";
import { KnowledgePracticeFlow } from "@/src/components/practice/KnowledgePracticeFlow";

type PhvHandbookSectionPageProps = {
  params: Promise<{
    sectionId: string;
  }>;
};

export const metadata = buildPageMetadata({
  title: "PHV Handbook Section Practice",
  description:
    "Practise a focused PHV Driver Handbook section with original SERU-style private hire questions.",
  path: "/practice/seru/phv-handbook"
});

export function generateStaticParams() {
  return phvHandbookSections.map((section) => ({
    sectionId: section.id
  }));
}

export default async function PhvHandbookSectionPracticePage({
  params
}: PhvHandbookSectionPageProps) {
  const { sectionId } = await params;
  const section = phvHandbookSections.find((entry) => entry.id === sectionId);

  if (!section) notFound();

  const sectionQuestions = phvHandbookQuestions.filter(
    (question) => question.isActive && question.sectionId === section.id
  );

  return (
    <AppShell title={section.name}>
      <div className="space-y-4">
        <header className="max-w-4xl">
          <Link
            className="text-sm font-semibold text-orange-700 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            href="/practice/seru/phv-handbook"
          >
            Back to PHV Handbook sections
          </Link>
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-orange-700">
            PHV Handbook section
          </p>
          <h2 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">
            {section.name}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {section.description}
          </p>
        </header>

        <KnowledgePracticeFlow
          backHref="/practice/seru/phv-handbook"
          backLabel="Back to PHV Handbook sections"
          baseHref={`/practice/seru/phv-handbook/${section.id}`}
          emptyQuestionTypeLabel="PHV Handbook"
          practiceFamily="seru"
          questionTypeLabel="PHV Handbook"
          questions={sectionQuestions}
          showSessionIntro={false}
          title={`${section.name} practice`}
        />
      </div>
    </AppShell>
  );
}
