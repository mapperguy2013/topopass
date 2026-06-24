import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Disclaimer - TopoPass",
  description:
    "Read the TopoPass disclaimer about independent learning support, original SERU-style questions, and no pass guarantee.",
  path: "/disclaimer"
});

const sections = [
  {
    title: "Independent learning support",
    text: "TopoPass is independent and is not affiliated with, endorsed by, sponsored by, or approved by Transport for London."
  },
  {
    title: "Original SERU-style questions",
    text: "SERU-style questions on TopoPass are original learning questions and are not official TfL questions."
  },
  {
    title: "Topographical preparation",
    text: "Topographical practice is for preparation only and is not official exam material."
  },
  {
    title: "No pass guarantee",
    text: "TopoPass can help learners practise and review, but it does not guarantee that any learner will pass any assessment."
  },
  {
    title: "Official materials",
    text: "Learners should use official TfL guidance and materials where appropriate. TopoPass content may be updated over time."
  }
] as const;

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar />
      <section className="border-b border-slate-200 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Last updated: 2026
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
            Disclaimer
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-700">
            This page explains the limits of TopoPass learning content and
            should be reviewed before full public launch.
          </p>
        </div>
      </section>
      <section className="px-6 py-12 lg:px-8">
        <div className="mx-auto grid max-w-4xl gap-5">
          {sections.map((section) => (
            <article
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              key={section.title}
            >
              <h2 className="text-2xl font-bold">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {section.text}
              </p>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
