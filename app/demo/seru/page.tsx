import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { buildPageMetadata } from "@/lib/seo";
import { seruQuestionBank } from "@/lib/seruQuestions";
import { DemoQuestionFlow } from "@/src/components/demo/DemoQuestionFlow";

export const metadata = buildPageMetadata({
  title: "SERU Demo",
  description:
    "Try 10 timed SERU-style TopoPass demo questions with instant feedback.",
  path: "/demo/seru"
});

const demoQuestions = seruQuestionBank
  .filter((question) => question.isActive)
  .slice(0, 10);

export default function SeruDemoPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar />
      <section className="px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            className="text-sm font-semibold text-orange-700 hover:text-orange-800"
            href="/demo"
          >
            Back to demo options
          </Link>
          <div className="mt-5">
            <DemoQuestionFlow
              accent="orange"
              description="10 timed SERU-style questions with instant feedback and a short result summary."
              practiceHref="/practice/seru"
              questions={demoQuestions}
              title="SERU demo"
            />
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
