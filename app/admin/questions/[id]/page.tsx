import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getQuestionById, getQuestionCategory, getQuestionPrompt, isQuestionActive } from "@/lib/admin/questionAdminHelpers";
import { validateAllQuestionBanks } from "@/lib/admin/questionValidation";

export default async function AdminQuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const question = getQuestionById(decodeURIComponent(id));
  if (!question) notFound();
  const validation = validateAllQuestionBanks().results.find((entry) => entry.question.id === question.id && entry.question.type === question.type);
  const managerHref = question.type === "route" ? "/admin/questions/route" : `/admin/questions/${question.type}`;

  return (
    <AppShell title="Question Detail">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-xs text-slate-500">{question.id}</p><h2 className="mt-2 text-xl font-bold text-ink">{getQuestionPrompt(question)}</h2></div><span className="w-fit rounded bg-slate-100 px-3 py-1 text-xs font-bold uppercase">{question.type}</span></div>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="font-semibold text-slate-500">Category</dt><dd className="mt-1">{getQuestionCategory(question)}</dd></div><div><dt className="font-semibold text-slate-500">Difficulty</dt><dd className="mt-1">{question.difficulty}</dd></div><div><dt className="font-semibold text-slate-500">Status</dt><dd className="mt-1">{isQuestionActive(question) ? "Active" : "Inactive"}</dd></div></dl>
        <div className="mt-5 border-t border-slate-200 pt-4"><h3 className="font-bold text-ink">Validation</h3>{validation?.issues.length ? <ul className="mt-2 space-y-2 text-sm">{validation.issues.map((entry, index) => <li className={entry.severity === "error" ? "text-red-700" : "text-amber-800"} key={`${entry.field}-${index}`}>{entry.field}: {entry.message}</li>)}</ul> : <p className="mt-2 text-sm text-green-700">No validation issues.</p>}</div>
        <div className="mt-6 flex gap-3"><Link className="rounded-md bg-road px-4 py-2 text-sm font-semibold text-white" href={managerHref}>Open editor</Link><Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" href="/admin/questions">Back to inventory</Link></div>
      </section>
    </AppShell>
  );
}
