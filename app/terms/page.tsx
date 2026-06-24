import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Terms - TopoPass",
  description:
    "Read the TopoPass beta terms for educational practice, content use, access rules, and launch limitations.",
  path: "/terms"
});

const sections = [
  {
    title: "Educational practice tool",
    text: "TopoPass is provided as an educational practice tool for private hire preparation. It does not guarantee that any learner will pass an assessment."
  },
  {
    title: "Content and intellectual property",
    text: "Practice questions, explanations, design, branding, and content belong to TopoPass unless stated otherwise. Users must not copy, scrape, resell, redistribute, or reproduce TopoPass content or questions."
  },
  {
    title: "Fair use of the service",
    text: "Users must not attempt to bypass account limits, security, access controls, or any future paid-access rules."
  },
  {
    title: "Official guidance",
    text: "Users should refer to official TfL guidance and materials where appropriate. TopoPass is independent and is not official TfL exam material."
  },
  {
    title: "Beta changes",
    text: "The service may change, pause, or remove features during beta. Paid features are not live yet."
  },
  {
    title: "Contact",
    text: "Contact support@topopass.co.uk with questions about these terms."
  }
] as const;

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar />
      <section className="border-b border-slate-200 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Last updated: 2026
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
            Terms
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-700">
            These plain-English beta terms explain the basic rules for using
            TopoPass. They should be reviewed before full public launch.
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
