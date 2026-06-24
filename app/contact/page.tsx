import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Contact TopoPass",
  description:
    "Contact TopoPass for account, content, privacy, or general support questions.",
  path: "/contact"
});

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar />
      <section className="border-b border-slate-200 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Contact
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
            Contact TopoPass
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-700">
            For account, content, privacy, or general support questions, contact
            TopoPass by email.
          </p>
        </div>
      </section>
      <section className="px-6 py-12 lg:px-8">
        <div className="mx-auto grid max-w-4xl gap-5">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Email</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              <a className="font-semibold text-road" href="mailto:support@topopass.co.uk">
                support@topopass.co.uk
              </a>
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Location</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              TopoPass, London, United Kingdom.
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Business address to be added before launch.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Launch note</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              This page is beta-ready and should be reviewed before full public
              launch.
            </p>
          </article>
        </div>
      </section>
      <Footer />
    </main>
  );
}
