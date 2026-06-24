"use client";

import Link from "next/link";

type StatusPageProps = {
  eyebrow?: string;
  title: string;
  message: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function StatusPage({
  eyebrow = "TopoPass",
  title,
  message,
  primaryHref = "/",
  primaryLabel = "Go home",
  secondaryHref,
  secondaryLabel,
  actionLabel,
  onAction
}: StatusPageProps) {
  return (
    <main className="min-h-screen bg-surface px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-road">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-ink">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {onAction && actionLabel && (
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              onClick={onAction}
              type="button"
            >
              {actionLabel}
            </button>
          )}
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            href={primaryHref}
          >
            {primaryLabel}
          </Link>
          {secondaryHref && secondaryLabel && (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href={secondaryHref}
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

export function LoadingPage({
  title,
  message
}: {
  title: string;
  message: string;
}) {
  return (
    <main className="min-h-screen bg-surface px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-road">
          TopoPass
        </p>
        <h1 className="mt-3 text-3xl font-bold text-ink">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-6 space-y-3">
          <div className="h-3 w-2/3 rounded bg-slate-200" />
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-5/6 rounded bg-slate-100" />
        </div>
      </section>
    </main>
  );
}
