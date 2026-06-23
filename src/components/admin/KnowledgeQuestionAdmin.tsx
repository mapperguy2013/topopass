"use client";

import { useEffect, useMemo, useState } from "react";
import { knowledgeQuestionBank, type KnowledgeQuestionData } from "@/lib/knowledgeQuestions";
import { validateKnowledgeQuestion } from "@/lib/admin/questionValidation";
import { clearDraftBank, cloneDraftBank, exportDraftBank, loadDraftBank, saveDraftBank } from "@/lib/admin/questionDraftStorage";

const STORAGE_KEY = "topopass.admin.knowledge-questions.v1";
const inputClass = "mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-road focus:ring-2 focus:ring-blue-100";

function createDraft(): KnowledgeQuestionData {
  return { id: `knowledge-${Date.now()}`, type: "knowledge", prompt: "", options: ["", ""], correctAnswer: "", difficulty: "medium", category: "", sourceNote: "Admin browser draft", isActive: false, explanation: "" };
}

export function KnowledgeQuestionAdmin() {
  const [questions, setQuestions] = useState(() => cloneDraftBank(knowledgeQuestionBank));
  const [editingIndex, setEditingIndex] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<KnowledgeQuestionData | null>(null);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [active, setActive] = useState("all");

  useEffect(() => {
    const stored = loadDraftBank<KnowledgeQuestionData>(STORAGE_KEY);
    if (stored) setQuestions(stored);
  }, []);

  const categories = [...new Set(questions.map((question) => question.category).filter(Boolean))];
  const filtered = useMemo(() => questions.map((question, index) => ({ question, index })).filter(({ question }) => {
    const matchesSearch = `${question.id} ${question.prompt} ${question.category}`.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = difficulty === "all" || question.difficulty === difficulty;
    const matchesActive = active === "all" || question.isActive === (active === "active");
    return matchesSearch && matchesDifficulty && matchesActive;
  }), [active, difficulty, questions, search]);

  function commit(next: KnowledgeQuestionData[]) {
    setQuestions(next);
    saveDraftBank(STORAGE_KEY, next);
  }

  function openEditor(index: number | "new") {
    setEditingIndex(index);
    setDraft(index === "new" ? createDraft() : cloneDraftBank([questions[index]])[0]);
  }

  function save() {
    if (!draft) return;
    const cleaned = { ...draft, id: draft.id.trim(), prompt: draft.prompt.trim(), options: draft.options.map((option) => option.trim()), category: draft.category.trim(), explanation: draft.explanation.trim() };
    commit(editingIndex === "new" ? [...questions, cleaned] : questions.map((question, index) => index === editingIndex ? cleaned : question));
    setEditingIndex(null);
    setDraft(null);
  }

  const duplicateIds = new Set(questions.filter((question, index) => index !== editingIndex && draft && question.id.trim() === draft.id.trim()).map((question) => question.id.trim()));
  const draftValidation = draft ? validateKnowledgeQuestion(draft, duplicateIds) : null;

  return (
    <div className="space-y-6">
      <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Draft edits are saved only in this browser. Export JSON and add reviewed records to <code>lib/knowledgeQuestions.ts</code> to make them permanent.</p>
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-end">
          <label className="flex-1 text-sm font-semibold">Search<input className={inputClass} onChange={(event) => setSearch(event.target.value)} placeholder="ID, prompt, or category" value={search} /></label>
          <label className="text-sm font-semibold">Difficulty<select className={inputClass} onChange={(event) => setDifficulty(event.target.value)} value={difficulty}><option value="all">All</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
          <label className="text-sm font-semibold">Status<select className={inputClass} onChange={(event) => setActive(event.target.value)} value={active}><option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
          <button className="min-h-11 rounded-md border border-slate-300 px-4 text-sm font-semibold" onClick={() => exportDraftBank("topopass-knowledge-questions.json", questions)} type="button">Export JSON</button>
          <button className="min-h-11 rounded-md bg-road px-4 text-sm font-semibold text-white" onClick={() => openEditor("new")} type="button">Create new</button>
        </div>
        <p className="px-4 pt-3 text-xs text-slate-500">Categories: {categories.join(", ") || "None"}</p>
        <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">ID / prompt</th><th>Category</th><th>Difficulty</th><th>Active</th><th>Validation</th><th>Actions</th></tr></thead><tbody className="divide-y divide-slate-200">{filtered.map(({ question, index }) => { const validation = validateKnowledgeQuestion(question); return <tr key={`${question.id}-${index}`}><td className="px-4 py-4"><p className="font-mono text-xs text-slate-500">{question.id}</p><p className="mt-1 max-w-md font-semibold">{question.prompt || "Untitled"}</p></td><td>{question.category}</td><td>{question.difficulty}</td><td>{question.isActive ? "Active" : "Inactive"}</td><td><span className={validation.valid ? "text-green-700" : "text-red-700"}>{validation.valid ? `${validation.issues.length} warnings` : `${validation.issues.filter((entry) => entry.severity === "error").length} errors`}</span></td><td><div className="flex gap-2"><button className="font-bold text-road" onClick={() => openEditor(index)} type="button">Edit / preview</button><button className="font-semibold text-amber-800" onClick={() => commit(questions.map((entry, itemIndex) => itemIndex === index ? { ...entry, isActive: !entry.isActive } : entry))} type="button">{question.isActive ? "Deactivate" : "Activate"}</button><button className="font-semibold text-red-700" onClick={() => window.confirm("Delete this browser draft?") && commit(questions.filter((_, itemIndex) => itemIndex !== index))} type="button">Delete</button></div></td></tr>; })}</tbody></table></div>
        <button className="m-4 text-sm font-semibold text-slate-600 hover:text-red-700" onClick={() => { clearDraftBank(STORAGE_KEY); setQuestions(cloneDraftBank(knowledgeQuestionBank)); }} type="button">Reset browser drafts</button>
      </section>

      {draft && draftValidation && (
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">{editingIndex === "new" ? "Create knowledge question" : "Edit knowledge question"}</h2>
            <label className="block text-sm font-semibold">ID<input className={inputClass} onChange={(event) => setDraft({ ...draft, id: event.target.value })} value={draft.id} /></label>
            <label className="block text-sm font-semibold">Question text<textarea className={`${inputClass} min-h-24`} onChange={(event) => setDraft({ ...draft, prompt: event.target.value })} value={draft.prompt} /></label>
            <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Category<input className={inputClass} onChange={(event) => setDraft({ ...draft, category: event.target.value })} value={draft.category} /></label><label className="text-sm font-semibold">Difficulty<select className={inputClass} onChange={(event) => setDraft({ ...draft, difficulty: event.target.value as KnowledgeQuestionData["difficulty"] })} value={draft.difficulty}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label></div>
            <fieldset><legend className="text-sm font-bold">Answer options</legend><div className="mt-2 space-y-2">{draft.options.map((option, index) => <div className="flex gap-2" key={index}><input className={inputClass} onChange={(event) => setDraft({ ...draft, options: draft.options.map((entry, itemIndex) => itemIndex === index ? event.target.value : entry) })} value={option} /><button className="mt-1 px-2 text-sm font-bold text-red-700" disabled={draft.options.length <= 2} onClick={() => setDraft({ ...draft, options: draft.options.filter((_, itemIndex) => itemIndex !== index), correctAnswer: draft.correctAnswer === option ? "" : draft.correctAnswer })} type="button">Remove</button></div>)}</div><button className="mt-2 text-sm font-bold text-road" onClick={() => setDraft({ ...draft, options: [...draft.options, ""] })} type="button">Add option</button></fieldset>
            <label className="block text-sm font-semibold">Correct answer<select className={inputClass} onChange={(event) => setDraft({ ...draft, correctAnswer: event.target.value })} value={draft.correctAnswer}><option value="">Select answer</option>{draft.options.filter(Boolean).map((option, index) => <option key={`${option}-${index}`} value={option}>{option}</option>)}</select></label>
            <label className="block text-sm font-semibold">Explanation<textarea className={`${inputClass} min-h-24`} onChange={(event) => setDraft({ ...draft, explanation: event.target.value })} value={draft.explanation} /></label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} type="checkbox" /> Active</label>
            {draftValidation.issues.length > 0 && <ul className="space-y-1 rounded-md bg-slate-50 p-3 text-sm">{draftValidation.issues.map((entry, index) => <li className={entry.severity === "error" ? "text-red-700" : "text-amber-800"} key={`${entry.field}-${index}`}>{entry.field}: {entry.message}</li>)}</ul>}
            <div className="flex gap-3"><button className="rounded-md bg-road px-4 py-2 text-sm font-semibold text-white" onClick={save} type="button">Save browser draft</button><button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => { setDraft(null); setEditingIndex(null); }} type="button">Cancel</button></div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase text-road">Learner preview</p><h2 className="mt-3 text-xl font-bold">{draft.prompt || "Question text"}</h2><div className="mt-4 grid gap-2">{draft.options.map((option, index) => <div className="rounded-md border border-slate-200 px-4 py-3 text-sm" key={index}>{option || `Option ${index + 1}`}</div>)}</div><div className="mt-5 border-t border-slate-200 pt-4 text-sm"><p><strong>Correct:</strong> {draft.correctAnswer || "Not selected"}</p><p className="mt-2 text-slate-600">{draft.explanation || "No explanation."}</p></div></div>
        </section>
      )}
    </div>
  );
}
