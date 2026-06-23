import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";

const types = [
  { href: "/admin/questions/knowledge", title: "Knowledge question", text: "Create multiple-choice questions with answer options and explanations." },
  { href: "/admin/questions/map-click", title: "Map-click question", text: "Create location targets with coordinates and accepted radii." },
  { href: "/admin/questions/route", title: "Route question", text: "Create point-to-point route questions with accepted geometry." }
] as const;

export default function NewAdminQuestionPage() {
  return (
    <AppShell title="Create Question">
      <div className="grid gap-4 md:grid-cols-3">
        {types.map((type) => <Link className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-road" href={type.href} key={type.href}><h2 className="text-lg font-bold text-ink">{type.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{type.text}</p><p className="mt-4 text-sm font-bold text-road">Open manager &rarr;</p></Link>)}
      </div>
    </AppShell>
  );
}
