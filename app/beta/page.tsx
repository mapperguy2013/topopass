import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import {
  BETA_TESTER_ENTRY_PATH,
  buildBetaTesterEntryModel
} from "./betaTesterEntry";

export const metadata = buildPageMetadata({
  title: "TopoPass Beta",
  description:
    "Beta-gated entry point for selected TopoPass real London route practice testers.",
  path: BETA_TESTER_ENTRY_PATH
});

export default function BetaTesterEntryPage() {
  const model = buildBetaTesterEntryModel();

  return (
    <AppShell title={model.title}>
      <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm font-bold uppercase tracking-wide text-road">
          {model.label}
        </p>
        <h2 className="mt-2 text-3xl font-bold text-ink">
          {model.state === "available"
            ? "Try the real London beta practice pilot"
            : model.unavailableTitle}
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">
          {model.state === "available" ? model.betaCopy : model.unavailableMessage}
        </p>

        {model.state === "available" ? (
          <>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-blue-800">
                {model.practiceLabel}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                Map version {model.mapVersion}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                Data: {model.attribution}
              </span>
            </div>
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Known limitations</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                {model.knownLimitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </div>
            <Link
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href={model.practiceHref}
            >
              {model.ctaLabel}
            </Link>
          </>
        ) : (
          <div className="mt-5">
            <p className="max-w-3xl rounded-md bg-amber-50 p-3 text-sm leading-6 text-amber-950">
              This page is intentionally gated by {model.betaFlagName}. Real London practice is not the default
              practice experience.
            </p>
            <Link
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-amber-900 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900"
              href={model.defaultPracticeHref}
            >
              {model.ctaLabel}
            </Link>
          </div>
        )}
      </section>
    </AppShell>
  );
}
