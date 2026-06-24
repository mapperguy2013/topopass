import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { knowledgeQuestionBank } from "@/lib/knowledgeQuestions";
import { buildPageMetadata } from "@/lib/seo";
import { DemoQuestionFlow } from "@/src/components/demo/DemoQuestionFlow";

export const metadata = buildPageMetadata({
  title: "Topographical Demo",
  description:
    "Try 10 timed topographical-style TopoPass demo questions with instant feedback.",
  path: "/demo/topographical"
});

const demoQuestions = knowledgeQuestionBank
  .filter((question) => question.isActive && question.questionFamily !== "seru")
  .slice(0, 10);

export default function TopographicalDemoPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar />
      <section className="px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            className="text-sm font-semibold text-road hover:text-blue-700"
            href="/demo"
          >
            Back to demo options
          </Link>
          <div className="mt-5">
            <DemoQuestionFlow
              accent="blue"
              description="10 timed topographical-style questions with instant feedback and a short result summary."
              practiceHref="/practice/topographical"
              questions={demoQuestions}
              title="Topographical demo"
            />
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
