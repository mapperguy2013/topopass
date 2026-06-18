import Link from "next/link";

const navItems = [
  { href: "/practice", label: "Practice" },
  { href: "/mock-test", label: "Mock Test" },
  { href: "/resources", label: "Resources" },
  { href: "/pricing", label: "Pricing" }
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex min-h-[72px] max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-3 text-xl font-bold text-ink" href="/">
          <span className="flex size-9 items-center justify-center rounded-md bg-ink text-sm font-bold text-white">
            TP
          </span>
          <span>TopoPass</span>
        </Link>
        <div className="order-3 flex w-full items-center gap-4 overflow-x-auto md:order-2 md:w-auto md:overflow-visible">
          {navItems.map((item) => (
            <Link
              className="whitespace-nowrap text-sm font-medium text-slate-600 transition hover:text-road"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="order-2 flex items-center gap-2 md:order-3">
          <Link
            className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:text-road"
            href="/login"
          >
            Login
          </Link>
          <Link
            className="hidden rounded-md bg-road px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:inline-flex"
            href="/practice"
          >
            Start Practising
          </Link>
        </div>
      </nav>
    </header>
  );
}
