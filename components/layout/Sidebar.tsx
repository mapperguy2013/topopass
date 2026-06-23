import Link from "next/link";

const links = [
  { href: "/learn", label: "Learn" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/practice", label: "Practice" },
  { href: "/mock-test", label: "Mock Test" },
  { href: "/review", label: "Review" }
];

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-6 rounded-lg border border-slate-200 bg-white p-3">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Study
        </p>
        <div className="space-y-1">
          {links.map((link) => (
            <Link
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-road"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
