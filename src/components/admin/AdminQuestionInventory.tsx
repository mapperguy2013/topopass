import Link from "next/link";
import { getQuestionCategory, getQuestionPrompt, isQuestionActive } from "@/lib/admin/questionAdminHelpers";
import { validateAllQuestionBanks } from "@/lib/admin/questionValidation";
import {
  publishQuestionAction,
  saveQuestionDraftAction,
  setQuestionStatusAction
} from "@/app/admin/questions/actions";
import {
  readAdminQuestionItems,
  type QuestionBankItemSummary
} from "@/lib/db/questionRepository";
import { logger } from "@/lib/logging/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function statusClass(status?: QuestionBankItemSummary["status"]) {
  if (status === "published") return "bg-green-100 text-green-800";
  if (status === "archived") return "bg-slate-200 text-slate-700";
  if (status === "draft") return "bg-amber-100 text-amber-900";
  return "bg-slate-100 text-slate-600";
}

export async function AdminQuestionInventory() {
  const validation = validateAllQuestionBanks();
  const supabase = await createSupabaseServerClient();
  const publishing = await readAdminQuestionItems({ client: supabase });
  if (publishing.error) {
    logger.warn("Admin question inventory publishing status unavailable", {
      feature: "admin-question-inventory",
      action: "read-publishing-status",
      route: "/admin/questions",
      error: publishing.error
    });
  }
  const statusById = new Map(
    publishing.items.map((item) => [item.id, item] as const)
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">All questions</h2>
          <p className="mt-1 text-sm text-slate-600">Static source-bank inventory with Supabase publishing controls.</p>
          {publishing.error && (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
              Publishing status is temporarily unavailable. Existing admin
              validation is still shown.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road" href="/admin/questions/import-export">Import / export</Link>
          <Link className="inline-flex min-h-10 items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white" href="/admin/questions/new">Create question</Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-3">ID / prompt</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Difficulty</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Published status</th><th className="px-4 py-3">Validation</th><th className="px-4 py-3">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {validation.results.map(({ question, valid, issues }) => {
              const publishedItem = statusById.get(question.id);
              const status = publishedItem?.status;

              return (
                <tr key={`${question.type}-${question.id}`}>
                  <td className="px-4 py-4"><p className="font-mono text-xs text-slate-500">{question.id}</p><p className="mt-1 max-w-md font-semibold text-ink">{getQuestionPrompt(question)}</p></td>
                  <td className="px-4 py-4 font-semibold">{question.type}</td>
                  <td className="px-4 py-4 text-slate-600">{getQuestionCategory(question)}</td>
                  <td className="px-4 py-4 text-slate-600">{question.difficulty}</td>
                  <td className="px-4 py-4">{isQuestionActive(question) ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded px-2 py-1 text-xs font-bold ${statusClass(status)}`}>
                      {status ?? "not saved"}
                    </span>
                    {publishedItem?.published_at && (
                      <p className="mt-2 text-xs text-slate-500">
                        Published {new Date(publishedItem.published_at).toLocaleDateString("en-GB")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4"><span className={`rounded px-2 py-1 text-xs font-bold ${valid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{valid ? `${issues.length} warnings` : `${issues.filter((entry) => entry.severity === "error").length} errors`}</span></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link className="inline-flex min-h-10 items-center rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:border-road hover:text-road" href={`/admin/questions/${encodeURIComponent(question.id)}`}>Inspect</Link>
                      <form action={saveQuestionDraftAction}>
                        <input name="questionId" type="hidden" value={question.id} />
                        <button className="inline-flex min-h-10 items-center rounded-md border border-amber-300 px-3 py-2 text-xs font-bold text-amber-900 hover:border-amber-500" type="submit">Save draft</button>
                      </form>
                      <form action={publishQuestionAction}>
                        <input name="questionId" type="hidden" value={question.id} />
                        <button className="inline-flex min-h-10 items-center rounded-md border border-green-300 px-3 py-2 text-xs font-bold text-green-800 hover:border-green-500" type="submit">Publish</button>
                      </form>
                      <form action={setQuestionStatusAction}>
                        <input name="questionId" type="hidden" value={question.id} />
                        <input name="status" type="hidden" value="archived" />
                        <button className="inline-flex min-h-10 items-center rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:border-slate-500" type="submit">Archive</button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
