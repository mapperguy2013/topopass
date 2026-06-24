import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Privacy Policy - TopoPass",
  description:
    "Read the TopoPass beta privacy policy for account data, progress data, newsletter signups, and technical logs.",
  path: "/privacy"
});

const sections = [
  {
    title: "What data may be collected",
    text: "TopoPass may collect account email if you sign in, learner progress, practice activity, newsletter email if you sign up, and technical logs needed to run the service."
  },
  {
    title: "Why data is used",
    text: "Data is used for account access, saving progress, improving the product, newsletter updates where consent is given, and security or abuse prevention."
  },
  {
    title: "Newsletter updates",
    text: "Newsletter emails are used for TopoPass updates and are not sold. You can ask to be removed by contacting support@topopass.co.uk."
  },
  {
    title: "Analytics and logs",
    text: "Analytics is currently no-op and structured unless a provider is deliberately configured. Logs are designed to avoid passwords, tokens, cookies, learner answers, and raw sensitive payloads."
  },
  {
    title: "Your questions",
    text: "Contact support@topopass.co.uk to ask about privacy or to request removal from the newsletter."
  }
] as const;

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar />
      <section className="border-b border-slate-200 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Last updated: 2026
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-700">
            This practical beta privacy page explains how TopoPass handles data.
            It should be reviewed before full public launch.
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
