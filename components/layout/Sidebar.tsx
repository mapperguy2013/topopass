import Link from "next/link";

const linkGroups = [
  {
    title: "Study",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/learn", label: "Learn" }
    ]
  },
  {
    title: "Practice",
    links: [
      { href: "/practice/topographical", label: "Topographical" },
      { href: "/practice/seru", label: "SERU" },
      { href: "/mock-test", label: "Mock Test" }
    ]
  },
  {
    title: "Review",
    links: [
      { href: "/progress/mistakes", label: "Mistakes / Review" },
      { href: "/progress", label: "Progress" }
    ]
  },
  {
    title: "Account",
    links: [
      { href: "/account", label: "Profile" },
      { href: "/pricing", label: "Pricing / Upgrade" }
    ]
  }
];

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-6 rounded-lg border border-slate-200 bg-white p-3">
        <div className="space-y-4">
          {linkGroups.map((group) => (
            <div key={group.title}>
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.links.map((link) => (
                  <Link
                    className="flex min-h-10 items-center rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                    href={link.href}
                    key={link.href}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
