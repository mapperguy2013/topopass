import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { planDefinitions } from "@/lib/plans/plans";
import { buildPageMetadata } from "@/lib/seo";
import { PricingViewedTracker } from "@/src/components/pricing/PricingViewedTracker";
import { UpgradeInterestButton } from "@/src/components/pricing/UpgradeInterestButton";
import { TrackedLink } from "@/src/components/analytics/TrackedLink";

export const metadata = buildPageMetadata({
  title: "Pricing Preview",
  description:
    "Preview TopoPass free and coming-soon upgrade plans for Topographical and SERU-style private hire preparation.",
  path: "/pricing"
});

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-surface">
      <PricingViewedTracker />
      <Navbar />

      <section className="border-b border-slate-200 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-road">
            Pricing preview
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-bold text-ink sm:text-5xl">
            Start free. Upgrade options are being prepared for beta.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700">
            TopoPass is available as a free preparation course while paid
            upgrades are still being shaped. One TopoPass account is planned to
            support both Topographical map preparation and SERU-style private
            hire knowledge practice.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
            No live payment provider is connected yet. Upgrade buttons only
            register beta interest and do not take payment.
          </p>
        </div>
      </section>

      <section className="px-6 py-12 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-3">
          {planDefinitions.map((plan) => (
            <article
              className={`flex h-full flex-col rounded-lg border bg-white p-6 shadow-sm ${
                plan.id === "free" ? "border-road" : "border-slate-200"
              }`}
              key={plan.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-road">
                    {plan.badge}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-ink">
                    {plan.label}
                  </h2>
                </div>
                <p className="rounded-md bg-slate-100 px-3 py-1 text-sm font-bold text-ink">
                  {plan.priceLabel}
                </p>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {plan.description}
              </p>

              <div className="mt-5 flex-1 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-ink">Included</h3>
                  <ul className="mt-3 space-y-3 text-sm text-slate-700">
                    {plan.included.map((feature) => (
                      <li className="flex gap-2" key={feature}>
                        <span
                          aria-hidden="true"
                          className="mt-1 size-2 shrink-0 rounded-full bg-road"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.comingSoon.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-ink">Coming soon</h3>
                    <ul className="mt-3 space-y-3 text-sm text-slate-700">
                      {plan.comingSoon.map((feature) => (
                        <li className="flex gap-2" key={feature}>
                          <span
                            aria-hidden="true"
                            className="mt-1 size-2 shrink-0 rounded-full bg-amber-400"
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {plan.id === "free" ? (
                <TrackedLink
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                  eventName="free_practice_continued"
                  eventProperties={{ plan: plan.id, cta: plan.ctaLabel }}
                  href={plan.ctaHref}
                >
                  {plan.ctaLabel}
                </TrackedLink>
              ) : (
                <UpgradeInterestButton
                  analyticsProperties={{ plan: plan.id, cta: plan.ctaLabel }}
                  className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                  label={plan.ctaLabel}
                />
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-6 py-12 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-3">
          <article className="rounded-lg border border-blue-200 bg-blue-50 p-5">
            <h2 className="text-lg font-bold text-blue-950">
              One account, two learning areas
            </h2>
            <p className="mt-2 text-sm leading-6 text-blue-950">
              Topographical and SERU-style practice stay separate in the product
              so mock exams and review remain clear, but one account is planned
              to support both areas.
            </p>
          </article>
          <article className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-lg font-bold text-amber-950">
              Upgrade coming soon
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-950">
              Paid access is not active. Beta upgrade interest is used only to
              understand demand before billing, support, and refund policies are
              finalised.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-bold text-ink">
              Independent preparation
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              TopoPass is an independent learning tool. Practice content is for
              preparation only, and SERU-style questions are original learning
              questions, not official TfL questions.
            </p>
          </article>
        </div>
      </section>

      <Footer />
    </main>
  );
}
