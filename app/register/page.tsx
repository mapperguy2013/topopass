import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 py-12">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-road">
          TopoPass
        </p>
        <h1 className="mt-3 text-3xl font-bold text-ink">Create account</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Placeholder registration screen for private hire driver applicants.
        </p>
        <div className="mt-6 space-y-4">
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Full name"
            type="text"
          />
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Email address"
            type="email"
          />
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Password"
            type="password"
          />
          <Link
            href="/dashboard"
            className="inline-flex w-full justify-center rounded-md bg-road px-4 py-2.5 text-sm font-semibold text-white"
          >
            Register
          </Link>
        </div>
        <p className="mt-5 text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-semibold text-road" href="/login">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
