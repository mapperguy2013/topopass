import Link from "next/link";
import { signUpAction } from "@/app/auth/actions";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

type SignUpPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const hasConfig = hasSupabasePublicConfig();

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10 sm:px-6">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-road">
          TopoPass account
        </p>
        <h1 className="mt-3 text-3xl font-bold text-ink">Create account</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Create an optional learner account. Local practice still works when
          signed out; database progress sync will arrive in a later Phase 3
          stage.
        </p>

        {!hasConfig && (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            Supabase authentication is not configured in this environment.
          </p>
        )}
        {params.error && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
            {params.error}
          </p>
        )}
        {params.message && (
          <p className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-900">
            {params.message}
          </p>
        )}

        <form action={signUpAction} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input
              autoComplete="email"
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              disabled={!hasConfig}
              name="email"
              required
              type="email"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Password
            <input
              autoComplete="new-password"
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              disabled={!hasConfig}
              minLength={6}
              name="password"
              required
              type="password"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Display name
            <input
              autoComplete="name"
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              disabled={!hasConfig}
              name="displayName"
              type="text"
            />
          </label>
          <button
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!hasConfig}
            type="submit"
          >
            Create account
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            className="font-semibold text-road hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            href="/login"
          >
            Log in
          </Link>
        </p>
        <Link
          className="mt-4 inline-flex text-sm font-semibold text-slate-600 hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
          href="/dashboard"
        >
          Continue without signing in
        </Link>
        <Link
          className="mt-4 inline-flex text-sm font-semibold text-slate-600 hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
          href="/"
        >
          Back to home
        </Link>
      </section>
    </main>
  );
}
