"use client";

import { useRef, useState } from "react";
import {
  clearLocalDatabase,
  exportLocalDatabaseSnapshot,
  importLocalDatabaseSnapshot
} from "@/lib/db/localDatabase";

export function ProgressDataManager() {
  const [jsonText, setJsonText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function refreshPage() {
    window.setTimeout(() => window.location.reload(), 300);
  }

  function exportProgress() {
    const snapshot = exportLocalDatabaseSnapshot();
    const json = JSON.stringify(snapshot, null, 2);
    setJsonText(json);
    setStatus("Progress export is ready. Store this JSON somewhere safe.");
  }

  function downloadExport() {
    const json =
      jsonText.trim() || JSON.stringify(exportLocalDatabaseSnapshot(), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `topopass-progress-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importProgress() {
    if (!jsonText.trim()) {
      setStatus("Paste progress JSON before importing.");
      return;
    }

    const confirmed = window.confirm(
      "Importing will replace progress saved in this browser. Continue?"
    );
    if (!confirmed) return;

    const result = importLocalDatabaseSnapshot(jsonText);
    if (!result.ok) {
      setStatus(result.error);
      return;
    }

    setStatus("Progress imported. Reloading dashboard...");
    refreshPage();
  }

  function resetProgress() {
    const confirmed = window.confirm(
      "Reset all progress saved in this browser? Export a backup first if you want to keep it."
    );
    if (!confirmed) return;

    const cleared = clearLocalDatabase();
    setStatus(
      cleared
        ? "Local progress reset. Reloading dashboard..."
        : "Local progress could not be reset in this browser."
    );
    if (cleared) refreshPage();
  }

  function importFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setJsonText(typeof reader.result === "string" ? reader.result : "");
      setStatus("Import file loaded. Review the JSON, then choose Import progress.");
    };
    reader.readAsText(file);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-road">
            Local progress data
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">
            Export, import, or reset progress
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            This only affects progress saved on this device. Local progress is
            stored in this browser. Export a backup before clearing browser data
            or switching devices.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            onClick={exportProgress}
            type="button"
          >
            Export progress
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            onClick={downloadExport}
            type="button"
          >
            Download JSON
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
            onClick={resetProgress}
            type="button"
          >
            Reset progress
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <label className="block text-sm font-semibold text-slate-700">
          Progress JSON
          <textarea
            className="mt-2 min-h-40 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs font-normal text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            onChange={(event) => setJsonText(event.target.value)}
            placeholder="Paste exported TopoPass progress JSON here."
            value={jsonText}
          />
        </label>
        <div className="flex flex-col gap-2 lg:pt-7">
          <input
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => importFile(event.target.files?.[0])}
            ref={fileInputRef}
            type="file"
          />
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            Choose JSON file
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
            onClick={importProgress}
            type="button"
          >
            Import progress
          </button>
        </div>
      </div>

      {status && (
        <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-700">
          {status}
        </p>
      )}
    </section>
  );
}
