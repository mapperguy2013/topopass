"use client";

import { useEffect, useMemo, useState } from "react";
import {
  clearAdminRouteQuestionDrafts,
  cloneRouteQuestionBank,
  createRouteQuestionDraft,
  loadAdminRouteQuestionDrafts,
  saveAdminRouteQuestionDrafts
} from "@/lib/adminRouteQuestionStorage";
import { validateRouteQuestionBank } from "@/lib/routeQuestionValidation";
import { RouteQuestionForm } from "@/src/components/admin/RouteQuestionForm";
import { RouteQuestionPreview } from "@/src/components/admin/RouteQuestionPreview";
import {
  getRouteQuestions,
  type RouteQuestion
} from "@/src/data/routeQuestions";

type EditorState =
  | { mode: "create" }
  | { mode: "edit"; questionIndex: number }
  | null;

const staticQuestions = getRouteQuestions();

function statusBadgeClass(status: RouteQuestion["status"]) {
  if (status === "active") {
    return "bg-green-100 text-green-800";
  }
  if (status === "archived") {
    return "bg-slate-200 text-slate-700";
  }
  return "bg-amber-100 text-amber-900";
}

export function RouteQuestionAdmin() {
  const [questions, setQuestions] = useState(() =>
    cloneRouteQuestionBank(staticQuestions)
  );
  const [editor, setEditor] = useState<EditorState>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [storageMessage, setStorageMessage] = useState(
    "Loading browser drafts..."
  );
  const validation = useMemo(
    () => validateRouteQuestionBank(questions),
    [questions]
  );
  const activeCount = questions.filter(
    (question) => question.status === "active"
  ).length;

  useEffect(() => {
    const storedQuestions = loadAdminRouteQuestionDrafts();

    if (storedQuestions) {
      setQuestions(storedQuestions);
      setStorageMessage("Loaded browser-local admin drafts.");
    } else {
      setStorageMessage("Using the static route-question bank.");
    }
  }, []);

  function commitQuestions(nextQuestions: RouteQuestion[], message: string) {
    setQuestions(nextQuestions);
    saveAdminRouteQuestionDrafts(nextQuestions);
    setStorageMessage(message);
  }

  function saveQuestion(question: RouteQuestion) {
    if (editor?.mode === "edit") {
      const nextQuestions = questions.map((current, index) =>
        index === editor.questionIndex ? question : current
      );
      commitQuestions(nextQuestions, `Saved browser draft: ${question.id}`);
    } else {
      commitQuestions(
        [...questions, question],
        `Created browser draft: ${question.id}`
      );
    }

    setEditor(null);
  }

  function toggleArchived(questionIndex: number) {
    const question = questions[questionIndex];
    const nextStatus: RouteQuestion["status"] =
      question.status === "archived" ? "active" : "archived";
    const nextQuestions = questions.map((current, index) =>
      index === questionIndex
        ? { ...current, status: nextStatus, updatedAt: new Date().toISOString() }
        : current
    );

    commitQuestions(
      nextQuestions,
      `${nextStatus === "archived" ? "Disabled" : "Restored"}: ${question.id}`
    );
    if (previewIndex === questionIndex) {
      setPreviewIndex(null);
    }
  }

  function deleteQuestion(questionIndex: number) {
    const question = questions[questionIndex];

    if (!window.confirm(`Delete the browser draft for "${question.title || question.id}"?`)) {
      return;
    }

    commitQuestions(
      questions.filter((_, index) => index !== questionIndex),
      `Deleted browser draft: ${question.id}`
    );
    setEditor(null);
    setPreviewIndex(null);
  }

  function resetToStaticBank() {
    if (!window.confirm("Discard all browser-local route question drafts?")) {
      return;
    }

    clearAdminRouteQuestionDrafts();
    setQuestions(cloneRouteQuestionBank(staticQuestions));
    setEditor(null);
    setPreviewIndex(null);
    setStorageMessage("Browser drafts cleared. Using the static route-question bank.");
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(questions, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "topopass-route-questions.json";
    link.click();
    URL.revokeObjectURL(url);
    setStorageMessage("Exported the current admin question bank as JSON.");
  }

  const editorQuestion =
    editor?.mode === "edit"
      ? cloneRouteQuestionBank([questions[editor.questionIndex]])[0]
      : editor?.mode === "create"
        ? createRouteQuestionDraft()
        : null;

  return (
    <div className="space-y-6">
      <section className="border-y border-amber-200 bg-amber-50 px-5 py-4">
        <h2 className="text-base font-bold text-amber-950">
          Browser-local admin prototype
        </h2>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          Draft routes are saved locally in this browser only. Export JSON and
          add it to the route question bank to make it permanent.
        </p>
        <p className="mt-2 text-xs leading-5 text-amber-900">
          The permanent bank is
          <code className="mx-1 rounded bg-amber-100 px-1 py-0.5">
            src/data/routeQuestions.ts
          </code>
          . Practice loads active questions from that file only. Supabase and
          other databases are not connected to this admin tool.
        </p>
        <p className="mt-2 text-xs font-semibold text-amber-900">
          {storageMessage}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Questions
          </p>
          <p className="mt-2 text-2xl font-bold text-ink">{questions.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Active
          </p>
          <p className="mt-2 text-2xl font-bold text-ink">{activeCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Bank validation
          </p>
          <p
            className={`mt-2 text-lg font-bold ${validation.valid ? "text-green-700" : "text-red-700"}`}
          >
            {validation.valid
              ? "Valid"
              : `${validation.errors.length} errors`}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">Route questions</h2>
            <p className="mt-1 text-sm text-slate-600">
              Review validation, edit metadata, preview geometry, or disable a
              question without changing the student Practice flow.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road"
              onClick={exportJson}
              type="button"
            >
              Export JSON
            </button>
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              onClick={() => {
                setEditor({ mode: "create" });
                setPreviewIndex(null);
              }}
              type="button"
            >
              Create new
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Question</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Difficulty</th>
                <th className="px-4 py-3">Validation</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {questions.map((question, index) => {
                const questionValidation = validation.results[index];

                return (
                  <tr className="align-top" key={`${question.id}-${index}`}>
                    <td className="px-4 py-4">
                      <p className="font-bold text-ink">
                        {question.title || "Untitled question"}
                      </p>
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {question.id || "No ID"}
                      </p>
                      <p className="mt-2 text-xs text-slate-600">
                        {question.fromLabel || "Start not set"} &rarr;{" "}
                        {question.toLabel || "End not set"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase ${statusBadgeClass(question.status)}`}
                      >
                        {question.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold uppercase text-slate-700">
                        {question.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase ${
                          questionValidation.valid
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {questionValidation.valid
                          ? "Valid"
                          : `${questionValidation.errors.length} errors`}
                      </span>
                      {questionValidation.warnings.length > 0 && (
                        <p className="mt-2 text-xs text-amber-800">
                          {questionValidation.warnings.length} warnings
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-road hover:text-road"
                          onClick={() => {
                            setEditor({ mode: "edit", questionIndex: index });
                            setPreviewIndex(null);
                          }}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-road hover:text-road"
                          onClick={() => {
                            setPreviewIndex(index);
                            setEditor(null);
                          }}
                          type="button"
                        >
                          Preview
                        </button>
                        <button
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-amber-500 hover:text-amber-800"
                          onClick={() => toggleArchived(index)}
                          type="button"
                        >
                          {question.status === "archived" ? "Restore" : "Disable"}
                        </button>
                        <button
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:border-red-500 hover:bg-red-50"
                          onClick={() => deleteQuestion(index)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 p-4">
          <button
            className="text-sm font-semibold text-slate-600 hover:text-red-700"
            onClick={resetToStaticBank}
            type="button"
          >
            Discard browser drafts and reset to static bank
          </button>
        </div>
      </section>

      {editor && editorQuestion && (
        <RouteQuestionForm
          initialQuestion={editorQuestion}
          key={`${editor.mode}-${editor.mode === "edit" ? editor.questionIndex : "new"}`}
          onCancel={() => setEditor(null)}
          onSave={saveQuestion}
          questionIndex={editor.mode === "edit" ? editor.questionIndex : null}
          questions={questions}
        />
      )}

      {previewIndex !== null && questions[previewIndex] && (
        <RouteQuestionPreview
          question={questions[previewIndex]}
          validation={validation.results[previewIndex]}
        />
      )}
    </div>
  );
}
