"use client";

import { useEffect, useState } from "react";
import { EXAM_MAP_ZOOM_LIMITS } from "@/lib/topographicalAtlasStyle";
import { demoMapClickQuestions, type MapClickQuestionData } from "@/lib/mapClickQuestions";
import { validateMapClickQuestion } from "@/lib/admin/questionValidation";
import { clearDraftBank, cloneDraftBank, exportDraftBank, loadDraftBank, saveDraftBank } from "@/lib/admin/questionDraftStorage";
import { AdminCoordinatePicker } from "@/src/components/admin/AdminCoordinatePicker";
import { MapClickQuestion } from "@/src/components/questions/MapClickQuestion";

const STORAGE_KEY = "topopass.admin.map-click-questions.v1";
const inputClass = "mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-road focus:ring-2 focus:ring-blue-100";

function createDraft(): MapClickQuestionData {
  return { id: `map-target-${Date.now()}`, type: "map-click", prompt: "", answer: { lat: 51.52, lng: -0.12 }, toleranceMeters: 120, difficulty: "medium", category: "Location knowledge", sourceNote: "Admin browser draft", targetName: "", isActive: false, explanation: "" };
}

export function MapClickQuestionAdmin() {
  const [questions, setQuestions] = useState(() => cloneDraftBank(demoMapClickQuestions));
  const [editingIndex, setEditingIndex] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<MapClickQuestionData | null>(null);

  useEffect(() => { const stored = loadDraftBank<MapClickQuestionData>(STORAGE_KEY); if (stored) setQuestions(stored); }, []);
  function commit(next: MapClickQuestionData[]) { setQuestions(next); saveDraftBank(STORAGE_KEY, next); }
  function openEditor(index: number | "new") { setEditingIndex(index); setDraft(index === "new" ? createDraft() : cloneDraftBank([questions[index]])[0]); }
  function save() { if (!draft) return; const cleaned = { ...draft, id: draft.id.trim(), prompt: draft.prompt.trim(), targetName: draft.targetName.trim(), explanation: draft.explanation.trim() }; commit(editingIndex === "new" ? [...questions, cleaned] : questions.map((question, index) => index === editingIndex ? cleaned : question)); setDraft(null); setEditingIndex(null); }
  const duplicateIds = new Set(questions.filter((question, index) => index !== editingIndex && draft && question.id.trim() === draft.id.trim()).map((question) => question.id.trim()));
  const validation = draft ? validateMapClickQuestion(draft, duplicateIds) : null;

  return (
    <div className="space-y-6">
      <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Draft edits are saved only in this browser. Export JSON and add reviewed records to <code>lib/mapClickQuestions.ts</code> to make them permanent.</p>
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold">Map-click questions</h2><p className="mt-1 text-sm text-slate-600">Targets, accepted radii, validation, and scoring previews.</p></div><div className="flex gap-2"><button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => exportDraftBank("topopass-map-click-questions.json", questions)} type="button">Export JSON</button><button className="rounded-md bg-road px-4 py-2 text-sm font-semibold text-white" onClick={() => openEditor("new")} type="button">Create new</button></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">ID / prompt</th><th>Target</th><th>Radius</th><th>Difficulty</th><th>Active</th><th>Validation</th><th>Actions</th></tr></thead><tbody className="divide-y divide-slate-200">{questions.map((question, index) => { const itemValidation = validateMapClickQuestion(question); return <tr key={`${question.id}-${index}`}><td className="px-4 py-4"><p className="font-mono text-xs text-slate-500">{question.id}</p><p className="mt-1 max-w-sm font-semibold">{question.prompt || "Untitled"}</p></td><td>{question.targetName}</td><td>{question.toleranceMeters}m</td><td>{question.difficulty}</td><td>{question.isActive ? "Active" : "Inactive"}</td><td className={itemValidation.valid ? "text-green-700" : "text-red-700"}>{itemValidation.valid ? `${itemValidation.issues.length} warnings` : `${itemValidation.issues.filter((entry) => entry.severity === "error").length} errors`}</td><td><div className="flex gap-2"><button className="font-bold text-road" onClick={() => openEditor(index)} type="button">Edit / preview</button><button className="font-semibold text-amber-800" onClick={() => commit(questions.map((entry, itemIndex) => itemIndex === index ? { ...entry, isActive: !entry.isActive } : entry))} type="button">{question.isActive ? "Deactivate" : "Activate"}</button><button className="font-semibold text-red-700" onClick={() => window.confirm("Delete this browser draft?") && commit(questions.filter((_, itemIndex) => itemIndex !== index))} type="button">Delete</button></div></td></tr>; })}</tbody></table></div>
        <button className="m-4 text-sm font-semibold text-slate-600 hover:text-red-700" onClick={() => { clearDraftBank(STORAGE_KEY); setQuestions(cloneDraftBank(demoMapClickQuestions)); }} type="button">Reset browser drafts</button>
      </section>

      {draft && validation && (
        <section className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">{editingIndex === "new" ? "Create map-click question" : "Edit map-click question"}</h2>
              <label className="block text-sm font-semibold">ID<input className={inputClass} onChange={(event) => setDraft({ ...draft, id: event.target.value })} value={draft.id} /></label>
              <label className="block text-sm font-semibold">Prompt<textarea className={`${inputClass} min-h-24`} onChange={(event) => setDraft({ ...draft, prompt: event.target.value })} value={draft.prompt} /></label>
              <label className="block text-sm font-semibold">Target name<input className={inputClass} onChange={(event) => setDraft({ ...draft, targetName: event.target.value })} value={draft.targetName} /></label>
              <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Latitude<input className={inputClass} step="any" type="number" onChange={(event) => setDraft({ ...draft, answer: { ...draft.answer, lat: event.target.valueAsNumber } })} value={Number.isFinite(draft.answer.lat) ? draft.answer.lat : ""} /></label><label className="text-sm font-semibold">Longitude<input className={inputClass} step="any" type="number" onChange={(event) => setDraft({ ...draft, answer: { ...draft.answer, lng: event.target.valueAsNumber } })} value={Number.isFinite(draft.answer.lng) ? draft.answer.lng : ""} /></label></div>
              <div className="grid gap-3 sm:grid-cols-3"><label className="text-sm font-semibold">Radius (m)<input className={inputClass} min="1" type="number" onChange={(event) => setDraft({ ...draft, toleranceMeters: event.target.valueAsNumber })} value={draft.toleranceMeters} /></label><label className="text-sm font-semibold">Difficulty<select className={inputClass} onChange={(event) => setDraft({ ...draft, difficulty: event.target.value as MapClickQuestionData["difficulty"] })} value={draft.difficulty}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label><label className="text-sm font-semibold">Category<input className={inputClass} onChange={(event) => setDraft({ ...draft, category: event.target.value })} value={draft.category} /></label></div>
              <label className="block text-sm font-semibold">Explanation<textarea className={`${inputClass} min-h-24`} onChange={(event) => setDraft({ ...draft, explanation: event.target.value })} value={draft.explanation} /></label>
              <label className="flex items-center gap-2 text-sm font-semibold"><input checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} type="checkbox" /> Active</label>
              {validation.issues.length > 0 && <ul className="space-y-1 rounded-md bg-slate-50 p-3 text-sm">{validation.issues.map((entry, index) => <li className={entry.severity === "error" ? "text-red-700" : "text-amber-800"} key={`${entry.field}-${index}`}>{entry.field}: {entry.message}</li>)}</ul>}
              <div className="flex gap-3"><button className="rounded-md bg-road px-4 py-2 text-sm font-semibold text-white" onClick={save} type="button">Save browser draft</button><button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => { setDraft(null); setEditingIndex(null); }} type="button">Cancel</button></div>
            </div>
            <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div><p className="text-xs font-bold uppercase text-road">Target picker</p><p className="mt-1 text-sm text-slate-600">Click the map to move the target marker.</p></div><AdminCoordinatePicker activePointId="target" onPointChange={(_, coordinates) => setDraft({ ...draft, answer: coordinates })} points={[{ id: "target", label: draft.targetName || "Target", lat: draft.answer.lat, lng: draft.answer.lng, colour: "#b91c1c" }]} /></div>
          </div>
          <div className="border-t border-slate-200 pt-5"><p className="mb-3 text-sm font-bold uppercase tracking-wide text-road">Learner preview and sample scoring</p><MapClickQuestion initialCenter={draft.answer} initialZoom={EXAM_MAP_ZOOM_LIMITS.defaultZoom} passRadiusMetres={draft.toleranceMeters} target={draft.answer} title={draft.prompt || "Map-click question preview"} description="Click a sample answer and submit it to test distance scoring against the configured target." /></div>
        </section>
      )}
    </div>
  );
}
