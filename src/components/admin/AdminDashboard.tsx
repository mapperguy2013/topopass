import Link from "next/link";
import {
  getAllQuestions,
  getQuestionsByType,
  isQuestionActive
} from "@/lib/admin/questionAdminHelpers";
import { validateAllQuestionBanks } from "@/lib/admin/questionValidation";

const managerLinks = [
  {
    href: "/admin/questions/knowledge",
    title: "Knowledge questions",
    description: "Manage answer options, correct answers, explanations, and metadata."
  },
  {
    href: "/admin/questions/map-click",
    title: "Map-click questions",
    description: "Manage targets, coordinates, accepted radii, and map scoring previews."
  },
  {
    href: "/admin/questions/route",
    title: "Route questions",
    description: "Manage endpoints, accepted geometry, route validation, and scoring previews."
  }
] as const;

export function AdminDashboard() {
  const questions = getAllQuestions();
  const validation = validateAllQuestionBanks(questions);
  const errors = validation.issues.filter((entry) => entry.severity === "error").length;
  const warnings = validation.issues.filter((entry) => entry.severity === "warning").length;
  const active = questions.filter(isQuestionActive).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Knowledge</p>
          <p className="mt-2 text-2xl font-bold text-ink">{getQuestionsByType("knowledge").length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Map click</p>
          <p className="mt-2 text-2xl font-bold text-ink">{getQuestionsByType("map-click").length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Route</p>
          <p className="mt-2 text-2xl font-bold text-ink">{getQuestionsByType("route").length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Active / inactive</p>
          <p className="mt-2 text-2xl font-bold text-ink">{active} / {questions.length - active}</p>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Bank validation</h2>
            <p className="mt-1 text-sm text-slate-600">{errors} errors and {warnings} warnings across {questions.length} static questions.</p>
          </div>
          <Link className="text-sm font-bold text-road hover:text-blue-800" href="/admin/questions">
            View complete inventory
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-ink">Question managers</h2>
          <Link className="rounded-md bg-road px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" href="/admin/questions/new">
            Create question
          </Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {managerLinks.map((manager) => (
            <Link className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-road" href={manager.href} key={manager.href}>
              <h3 className="text-lg font-bold text-ink">{manager.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{manager.description}</p>
              <p className="mt-4 text-sm font-bold text-road">Open manager &rarr;</p>
            </Link>
          ))}
        </div>
      </section>

      <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        Admin edits are browser-local prototypes. Export edited banks and deliberately add them to the TypeScript source banks to make changes permanent.
      </p>
    </div>
  );
}
