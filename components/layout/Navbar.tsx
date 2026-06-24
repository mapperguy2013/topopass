import Link from "next/link";
import { signOutAction } from "@/app/auth/actions";
import { getCurrentAuthState } from "@/lib/auth/session";

const courseItems = [
  { href: "/topographical", label: "Topographical Course" },
  { href: "/seru", label: "SERU Course" },
  { href: "/course", label: "How the course works" }
];

const publicNavItems = [
  { href: "/demo", label: "Demo" },
  { href: "/resources", label: "Resources" },
  { href: "/pricing", label: "Pricing" }
];

const learnerNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/practice", label: "Practice" },
  { href: "/mock-test", label: "Mock Test" },
  { href: "/review", label: "Review" },
  { href: "/progress", label: "Progress" },
  { href: "/account", label: "Account" }
];

export async function Navbar() {
  const { user, profile } = await getCurrentAuthState();
  const accountLabel = profile?.display_name || user?.email || "Account";
  const navItems = user ? learnerNavItems : publicNavItems;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex min-h-[72px] max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          className="inline-flex min-h-11 items-center gap-3 rounded-md text-xl font-bold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
          href="/"
        >
          <span className="flex size-9 items-center justify-center rounded-md bg-ink text-sm font-bold text-white">
            TP
          </span>
          <span>TopoPass</span>
        </Link>
        <div className="order-3 flex w-full items-center gap-2 overflow-x-auto pb-1 md:order-2 md:w-auto md:overflow-visible md:pb-0">
          {!user && (
            <details className="group relative shrink-0">
              <summary className="inline-flex min-h-11 cursor-pointer list-none items-center whitespace-nowrap rounded-md px-2.5 text-sm font-medium text-slate-600 transition hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road">
                Course
              </summary>
              <div className="mt-1 min-w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-soft md:absolute md:left-0 md:top-full md:z-50">
                {courseItems.map((item) => (
                  <Link
                    className="block rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
          )}
          {navItems.map((item) => (
            <Link
              className="inline-flex min-h-11 items-center whitespace-nowrap rounded-md px-2.5 text-sm font-medium text-slate-600 transition hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="order-2 flex items-center gap-2 md:order-3">
          {user ? (
            <>
              <Link
                className="inline-flex min-h-11 max-w-40 items-center justify-center truncate rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                href="/account"
                title={accountLabel}
              >
                {accountLabel}
              </Link>
              <form action={signOutAction}>
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                  type="submit"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                href="/auth/log-in"
              >
                Sign in
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                href="/practice"
              >
                Start practising
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
