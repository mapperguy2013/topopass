"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import {
  commitQuestionImportAction,
  previewQuestionImportAction
} from "@/app/admin/questions/import-export/actions";
import {
  initialQuestionImportState
} from "@/lib/db/questionImportActionState";
import type { QuestionImportMode } from "@/lib/db/questionImportExport";

const exportOptions = [
  { status: "all", label: "All questions" },
  { status: "published", label: "Published only" },
  { status: "draft", label: "Draft only" },
  { status: "archived", label: "Archived only" }
] as const;

function statusTone(status: string) {
  if (status === "published") return "bg-green-100 text-green-800";
  if (status === "archived") return "bg-slate-200 text-slate-700";
  return "bg-amber-100 text-amber-900";
}

export function QuestionImportExportPanel() {
  const [previewState, previewAction, isPreviewPending] = useActionState(
    previewQuestionImportAction,
    initialQuestionImportState
  );
  const [commitState, commitAction, isCommitPending] = useActionState(
    commitQuestionImportAction,
    initialQuestionImportState
  );
  const [rawJson, setRawJson] = useState("");
  const [mode, setMode] = useState<QuestionImportMode>("create");

  useEffect(() => {
    if (previewState.rawJson) {
      setRawJson(previewState.rawJson);
      setMode(previewState.mode);
    }
  }, [previewState.rawJson, previewState.mode]);

  const canCommit =
    previewState.status === "preview" &&
    previewState.validCount > 0 &&
    previewState.errors.length === 0 &&
    rawJson.trim().length > 0;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">Export question bank</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Download JSON directly from Supabase question_bank_items. Exports
              use the TopoPass question_bank_items envelope and keep current
              publishing status.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road"
            href="/admin/questions"
          >
            Back to inventory
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {exportOptions.map((option) => (
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              href={`/admin/questions/import-export/export?status=${option.status}`}
              key={option.status}
            >
              {option.label}
            </a>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Import question bank</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
          Paste a TopoPass question_bank_items export or choose a JSON file.
          Preview validates every record before anything is written.
        </p>

        <form action={previewAction} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700" htmlFor="json">
              Pasted JSON
            </label>
            <textarea
              className="mt-2 min-h-56 w-full rounded-md border border-slate-300 p-3 font-mono text-xs text-slate-800 focus:border-road focus:outline-none focus:ring-2 focus:ring-blue-100"
              id="json"
              name="json"
              onChange={(event) => setRawJson(event.target.value)}
              placeholder='{"format":"topopass-question-bank-items","version":1,"question_bank_items":[...]}'
              value={rawJson}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div>
              <label className="text-sm font-bold text-slate-700" htmlFor="file">
                JSON file
              </label>
              <input
                accept="application/json,.json"
                className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700"
                id="file"
                name="file"
                type="file"
              />
            </div>

            <fieldset>
              <legend className="text-sm font-bold text-slate-700">
                Import mode
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
                  <input
                    checked={mode === "create"}
                    name="mode"
                    onChange={() => setMode("create")}
                    type="radio"
                    value="create"
                  />
                  Create new only
                </label>
                <label className="flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
                  <input
                    checked={mode === "upsert"}
                    name="mode"
                    onChange={() => setMode("upsert")}
                    type="radio"
                    value="upsert"
                  />
                  Upsert matching IDs
                </label>
              </div>
            </fieldset>
          </div>

          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isPreviewPending}
            type="submit"
          >
            {isPreviewPending ? "Validating..." : "Preview import"}
          </button>
        </form>
      </section>

      {(previewState.status !== "idle" || commitState.status !== "idle") && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Import preview</h2>
          {previewState.message && (
            <p
              className={`mt-3 rounded-md border px-3 py-2 text-sm font-semibold ${
                previewState.status === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-blue-200 bg-blue-50 text-blue-900"
              }`}
            >
              {previewState.message}
            </p>
          )}
          {commitState.message && (
            <p
              className={`mt-3 rounded-md border px-3 py-2 text-sm font-semibold ${
                commitState.status === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-green-200 bg-green-50 text-green-800"
              }`}
            >
              {commitState.message}
            </p>
          )}

          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-slate-50 p-3">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Valid records
              </dt>
              <dd className="mt-1 text-2xl font-bold text-ink">
                {previewState.validCount}
              </dd>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Invalid records
              </dt>
              <dd className="mt-1 text-2xl font-bold text-ink">
                {previewState.invalidCount}
              </dd>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Mode
              </dt>
              <dd className="mt-1 text-base font-bold text-ink">
                {previewState.mode === "upsert"
                  ? "Upsert matching IDs"
                  : "Create new only"}
              </dd>
            </div>
          </dl>

          {previewState.errors.length > 0 && (
            <div className="mt-5">
              <h3 className="font-bold text-red-800">Validation errors</h3>
              <ul className="mt-2 max-h-64 space-y-2 overflow-auto rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                {previewState.errors.map((error, index) => (
                  <li key={`${error.index}-${error.field}-${index}`}>
                    <span className="font-bold">
                      Record {error.index >= 0 ? error.index + 1 : "root"}
                      {error.id ? ` (${error.id})` : ""}, {error.field}:
                    </span>{" "}
                    {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {previewState.previewItems.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Prompt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {previewState.previewItems.slice(0, 25).map((item) => (
                    <tr key={`${item.questionType}-${item.id}`}>
                      <td className="px-3 py-3 font-mono text-xs text-slate-600">
                        {item.id}
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-800">
                        {item.questionType}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded px-2 py-1 text-xs font-bold ${statusTone(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{item.prompt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewState.previewItems.length > 25 && (
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Showing first 25 valid records.
                </p>
              )}
            </div>
          )}

          <form action={commitAction} className="mt-5">
            <input name="mode" type="hidden" value={mode} />
            <textarea
              className="hidden"
              name="json"
              readOnly
              value={rawJson}
            />
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!canCommit || isCommitPending}
              type="submit"
            >
              {isCommitPending ? "Importing..." : "Commit import"}
            </button>
            {!canCommit && (
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Preview valid records before committing.
              </p>
            )}
          </form>
        </section>
      )}
    </div>
  );
}
