import Link from "next/link";
import { getQuestionCategory, getQuestionPrompt, isQuestionActive } from "@/lib/admin/questionAdminHelpers";
import { validateAllQuestionBanks } from "@/lib/admin/questionValidation";

export function AdminQuestionInventory() {
  const validation = validateAllQuestionBanks();

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">All questions</h2>
          <p className="mt-1 text-sm text-slate-600">Static source-bank inventory across every supported type.</p>
        </div>
        <Link className="rounded-md bg-road px-4 py-2 text-sm font-semibold text-white" href="/admin/questions/new">Create question</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-3">ID / prompt</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Difficulty</th><th className="px-4 py-3">Active</th><th className="px-4 py-3">Validation</th><th className="px-4 py-3">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {validation.results.map(({ question, valid, issues }) => (
              <tr key={`${question.type}-${question.id}`}>
                <td className="px-4 py-4"><p className="font-mono text-xs text-slate-500">{question.id}</p><p className="mt-1 max-w-md font-semibold text-ink">{getQuestionPrompt(question)}</p></td>
                <td className="px-4 py-4 font-semibold">{question.type}</td>
                <td className="px-4 py-4 text-slate-600">{getQuestionCategory(question)}</td>
                <td className="px-4 py-4 text-slate-600">{question.difficulty}</td>
                <td className="px-4 py-4">{isQuestionActive(question) ? "Active" : "Inactive"}</td>
                <td className="px-4 py-4"><span className={`rounded px-2 py-1 text-xs font-bold ${valid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{valid ? `${issues.length} warnings` : `${issues.filter((entry) => entry.severity === "error").length} errors`}</span></td>
                <td className="px-4 py-4"><Link className="font-bold text-road" href={`/admin/questions/${encodeURIComponent(question.id)}`}>Inspect</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
