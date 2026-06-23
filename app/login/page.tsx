import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 py-12">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-road">
          TopoPass
        </p>
        <h1 className="mt-3 text-3xl font-bold text-ink">Log in</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          User accounts are not connected in the Phase 1 local MVP. You can
          continue to the local dashboard without signing in.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-flex w-full justify-center rounded-md bg-road px-4 py-2.5 text-sm font-semibold text-white"
          >
            Open local dashboard
          </Link>
        </div>
        <p className="mt-5 text-sm text-slate-600">
          New to TopoPass?{" "}
          <Link className="font-semibold text-road" href="/register">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
