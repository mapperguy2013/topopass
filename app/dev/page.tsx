import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import { buildDevToolsHomeModel } from "./devTools";

export const metadata = buildPageMetadata({
  title: "PCO Ready Dev Tools",
  description: "Development and admin QA tools for PCO Ready route maps and learner training.",
  path: "/dev"
});

export default function DevToolsPage() {
  const model = buildDevToolsHomeModel();

  return (
    <AppShell title="Dev Tools" frameClassName="max-w-[1500px]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Internal dev tools</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">{model.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">{model.devOnlyNotice}</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {model.cards.map((card) => (
            <Link
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href={card.href}
              key={card.href}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-ink">{card.title}</h2>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {card.status === "available" ? "Available" : "Flag gated"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{card.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
