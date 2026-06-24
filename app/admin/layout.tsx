import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { signOutAction } from "@/app/auth/actions";
import { requireAdmin } from "@/lib/auth/admin";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const accessState = await requireAdmin("/admin");

  if (accessState.status !== "admin") {
    const email = accessState.user.email ?? "this account";

    return (
      <AppShell title="Admin access">
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-900">
            Not authorised
          </p>
          <h2 className="mt-2 text-2xl font-bold text-ink">
            Admin access is required
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-950">
            You are signed in as {email}, but this profile is not marked as an
            admin in the current TopoPass role model.
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-950">
            Learner practice, mock tests, progress, and account pages remain
            available.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href="/account"
            >
              Go to account
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href="/practice"
            >
              Continue practice
            </Link>
            <form action={signOutAction}>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>
        </section>
      </AppShell>
    );
  }

  return children;
}
