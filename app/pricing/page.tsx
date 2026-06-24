import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { buildPageMetadata } from "@/lib/seo";
import { TrackedLink } from "@/src/components/analytics/TrackedLink";

export const metadata = buildPageMetadata({
  title: "Pricing Preview",
  description:
    "Preview TopoPass pricing plans for free topographical practice and future Topographical plus SERU preparation support.",
  path: "/pricing"
});

const pricingTiers = [
  {
    name: "Free",
    price: "0",
    status: "Available now",
    description:
      "Start practising topographical map skills, route drawing, knowledge questions, mock exams, and browser-local progress.",
    features: [
      "Topographical practice modes",
      "Topographical mock exams",
      "Mistake review and local progress",
      "No payment required"
    ],
    cta: "Continue with free practice",
    href: "/practice"
  },
  {
    name: "Plus",
    price: "Coming soon",
    status: "Payments not live",
    description:
      "Planned account upgrade for learners who want a fuller preparation path across devices.",
    features: [
      "Account-backed progress",
      "Expanded topic recommendations",
      "Topographical and SERU preparation in one account",
      "No Stripe or payment provider connected yet"
    ],
    cta: "View account options",
    href: "/auth/sign-up"
  },
  {
    name: "SERU preparation",
    price: "Included in preview",
    status: "Starter practice live",
    description:
      "A separate SERU-style preparation area is available as starter practice so SERU knowledge does not mix into topographical mock exams.",
    features: [
      "Dedicated SERU-style practice route",
      "Safety and safeguarding topics",
      "Equality, accessibility, and customer service",
      "Same learner login as Topographical practice"
    ],
    cta: "Start SERU practice",
    href: "/practice/seru"
  }
] as const;

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-surface">
      <Navbar />

      <section className="border-b border-slate-200 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-road">
            Pricing preview
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-bold text-ink sm:text-5xl">
            Start free. Paid plans are coming later.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700">
            TopoPass is currently focused on a strong learner experience before
            payments are added. One account is planned to eventually include
            both Topographical and SERU-style preparation support.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
            No payment provider is connected in this stage, and TopoPass is an
            independent learning tool that is not affiliated with or endorsed by
            Transport for London.
          </p>
        </div>
      </section>

      <section className="px-6 py-12 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <article
              className={`flex h-full flex-col rounded-lg border bg-white p-6 shadow-sm ${
                tier.name === "Free" ? "border-road" : "border-slate-200"
              }`}
              key={tier.name}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-road">
                    {tier.status}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-ink">
                    {tier.name}
                  </h2>
                </div>
                <p className="rounded-md bg-slate-100 px-3 py-1 text-sm font-bold text-ink">
                  {tier.price}
                </p>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {tier.description}
              </p>

              <ul className="mt-5 flex-1 space-y-3 text-sm text-slate-700">
                {tier.features.map((feature) => (
                  <li className="flex gap-2" key={feature}>
                    <span
                      aria-hidden="true"
                      className="mt-1 size-2 shrink-0 rounded-full bg-road"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <TrackedLink
                className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-md px-5 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road ${
                  tier.name === "Free"
                    ? "bg-road text-white hover:bg-blue-700"
                    : "border border-slate-300 bg-white text-ink hover:border-road hover:text-road"
                }`}
                eventName="pricing_cta_click"
                eventProperties={{ tier: tier.name, cta: tier.cta }}
                href={tier.href}
              >
                {tier.cta}
              </TrackedLink>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-xl font-bold text-ink">Payment status</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-amber-950">
            Payments are intentionally not implemented yet. The next commercial
            step can connect a real payment provider after pricing, access
            rules, refund handling, and learner support policies are confirmed.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
