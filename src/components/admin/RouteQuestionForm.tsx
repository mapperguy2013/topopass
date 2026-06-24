"use client";

import { useState, type FormEvent } from "react";
import { validateRouteQuestion } from "@/lib/routeQuestionValidation";
import { AdminCoordinatePicker } from "@/src/components/admin/AdminCoordinatePicker";
import type { RouteQuestion } from "@/src/data/routeQuestions";

type RouteQuestionFormProps = {
  initialQuestion: RouteQuestion;
  questionIndex: number | null;
  questions: RouteQuestion[];
  onCancel: () => void;
  onSave: (question: RouteQuestion) => void;
};

const inputClassName =
  "mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-road focus:ring-2 focus:ring-blue-100";
const labelClassName = "text-sm font-semibold text-slate-700";

function numericInputValue(value: number) {
  return Number.isFinite(value) ? value : "";
}

export function RouteQuestionForm({
  initialQuestion,
  questionIndex,
  questions,
  onCancel,
  onSave
}: RouteQuestionFormProps) {
  const [draft, setDraft] = useState(initialQuestion);
  const [geometryText, setGeometryText] = useState(
    JSON.stringify(initialQuestion.acceptedRoute?.geometry ?? [], null, 2)
  );
  const [geometryError, setGeometryError] = useState<string | null>(null);
  const [coordinatePoint, setCoordinatePoint] = useState<"start" | "end">("start");
  const duplicateId = questions.some(
    (question, index) =>
      index !== questionIndex &&
      question.id.trim() === draft.id.trim() &&
      draft.id.trim().length > 0
  );
  const validation = validateRouteQuestion(draft, duplicateId);

  function updateGeometry(value: string) {
    setGeometryText(value);

    try {
      const geometry = JSON.parse(value) as unknown;
      if (!Array.isArray(geometry)) {
        throw new Error("Geometry must be a JSON array.");
      }

      setDraft((current) => ({
        ...current,
        acceptedRoute: {
          ...(current.acceptedRoute ?? {
            source: "manual",
            coordinateSystem: "map",
            reviewed: false
          }),
          geometry: geometry as [number, number][]
        }
      }));
      setGeometryError(null);
    } catch (error) {
      setGeometryError(
        error instanceof Error ? error.message : "Geometry is not valid JSON."
      );
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (geometryError) {
      return;
    }

    onSave({
      ...draft,
      id: draft.id.trim(),
      title: draft.title.trim(),
      prompt: draft.prompt.trim(),
      fromLabel: draft.fromLabel.trim(),
      toLabel: draft.toLabel.trim(),
      mapArea: draft.mapArea.trim(),
      tags: draft.tags.map((tag) => tag.trim()).filter(Boolean),
      explanation: draft.explanation?.trim(),
      tip: draft.tip?.trim(),
      idealRouteDescription: draft.idealRouteDescription?.trim(),
      updatedAt: new Date().toISOString()
    });
  }

  return (
    <form
      className="space-y-6 rounded-lg border border-slate-300 bg-white p-5 shadow-sm"
      onSubmit={submit}
    >
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-road">
            {questionIndex === null ? "Create question" : "Edit question"}
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">
            {draft.title || "New route question"}
          </h2>
        </div>
        <span
          className={`w-fit rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
            validation.valid && !geometryError
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {validation.valid && !geometryError ? "Valid" : "Needs attention"}
        </span>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-base font-bold text-ink">
          Question details
        </legend>
        <label className={labelClassName}>
          ID
          <input
            className={inputClassName}
            onChange={(event) =>
              setDraft((current) => ({ ...current, id: event.target.value }))
            }
            required
            value={draft.id}
          />
        </label>
        <label className={labelClassName}>
          Title
          <input
            className={inputClassName}
            onChange={(event) =>
              setDraft((current) => ({ ...current, title: event.target.value }))
            }
            required
            value={draft.title}
          />
        </label>
        <label className={`${labelClassName} sm:col-span-2`}>
          Prompt / question text
          <textarea
            className={`${inputClassName} min-h-24 resize-y`}
            onChange={(event) =>
              setDraft((current) => ({ ...current, prompt: event.target.value }))
            }
            required
            value={draft.prompt}
          />
        </label>
        <label className={labelClassName}>
          Status
          <select
            className={inputClassName}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                status: event.target.value as RouteQuestion["status"]
              }))
            }
            value={draft.status}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className={labelClassName}>
          Difficulty
          <select
            className={inputClassName}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                difficulty: event.target.value as RouteQuestion["difficulty"]
              }))
            }
            value={draft.difficulty}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <label className={labelClassName}>
          Map area
          <input
            className={inputClassName}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                mapArea: event.target.value
              }))
            }
            required
            value={draft.mapArea}
          />
        </label>
        <label className={labelClassName}>
          Tags / category
          <input
            className={inputClassName}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                tags: event.target.value.split(",")
              }))
            }
            placeholder="route-planning, london"
            value={draft.tags.join(", ")}
          />
        </label>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="mb-3 text-base font-bold text-ink">
          Start and destination
        </legend>
        <label className={`${labelClassName} lg:col-span-2`}>
          Start location name
          <input
            className={inputClassName}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                fromLabel: event.target.value
              }))
            }
            required
            value={draft.fromLabel}
          />
        </label>
        <label className={`${labelClassName} lg:col-span-2`}>
          End location name
          <input
            className={inputClassName}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                toLabel: event.target.value
              }))
            }
            required
            value={draft.toLabel}
          />
        </label>
        <label className={labelClassName}>
          Start latitude
          <input
            className={inputClassName}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                from: { ...current.from, lat: event.target.valueAsNumber }
              }))
            }
            step="any"
            type="number"
            value={numericInputValue(draft.from.lat)}
          />
        </label>
        <label className={labelClassName}>
          Start longitude
          <input
            className={inputClassName}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                from: { ...current.from, lng: event.target.valueAsNumber }
              }))
            }
            step="any"
            type="number"
            value={numericInputValue(draft.from.lng)}
          />
        </label>
        <label className={labelClassName}>
          End latitude
          <input
            className={inputClassName}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                to: { ...current.to, lat: event.target.valueAsNumber }
              }))
            }
            step="any"
            type="number"
            value={numericInputValue(draft.to.lat)}
          />
        </label>
        <label className={labelClassName}>
          End longitude
          <input
            className={inputClassName}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                to: { ...current.to, lng: event.target.valueAsNumber }
              }))
            }
            step="any"
            type="number"
            value={numericInputValue(draft.to.lng)}
          />
        </label>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-base font-bold text-ink">Endpoint picker</legend>
        <div className="flex gap-2">
          {(["start", "end"] as const).map((point) => (
            <button
              className={`rounded-md border px-4 py-2 text-sm font-semibold ${coordinatePoint === point ? "border-road bg-blue-50 text-road" : "border-slate-300 text-slate-700"}`}
              key={point}
              onClick={() => setCoordinatePoint(point)}
              type="button"
            >
              Set {point}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-600">Select the start or end mode, then click the map to update that coordinate.</p>
        <AdminCoordinatePicker
          activePointId={coordinatePoint}
          onPointChange={(id, coordinates) =>
            setDraft((current) => ({
              ...current,
              [id === "start" ? "from" : "to"]: coordinates
            }))
          }
          points={[
            { id: "start", label: draft.fromLabel || "Start", lat: draft.from.lat, lng: draft.from.lng, colour: "#166534" },
            { id: "end", label: draft.toLabel || "End", lat: draft.to.lat, lng: draft.to.lng, colour: "#991b1b" }
          ]}
        />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="mb-3 text-base font-bold text-ink">Map bounds</legend>
        {(["minX", "minY", "maxX", "maxY"] as const).map((field) => (
          <label className={labelClassName} key={field}>
            {field}
            <input
              className={inputClassName}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  mapBounds: {
                    ...current.mapBounds,
                    [field]: event.target.valueAsNumber
                  }
                }))
              }
              step="any"
              type="number"
              value={numericInputValue(draft.mapBounds[field])}
            />
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-3 text-base font-bold text-ink">
          Accepted route and feedback
        </legend>
        <label className={labelClassName}>
          Accepted route geometry
          <span className="mt-1 block text-xs font-normal text-slate-500">
            JSON array of map-coordinate pairs, for example [[100, 200], [120,
            230], [150, 250]].
          </span>
          <textarea
            className={`${inputClassName} min-h-52 resize-y font-mono text-xs`}
            onChange={(event) => updateGeometry(event.target.value)}
            spellCheck={false}
            value={geometryText}
          />
        </label>
        {geometryError && (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            Geometry JSON: {geometryError}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClassName}>
            Geometry source
            <select
              className={inputClassName}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  acceptedRoute: {
                    ...(current.acceptedRoute ?? {
                      geometry: [],
                      coordinateSystem: "map",
                      reviewed: false
                    }),
                    source: event.target.value as "osrm" | "manual" | "stored"
                  }
                }))
              }
              value={draft.acceptedRoute?.source ?? "manual"}
            >
              <option value="stored">Stored</option>
              <option value="osrm">OSRM</option>
              <option value="manual">Manual</option>
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-3 self-end rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
            <input
              checked={draft.acceptedRoute?.reviewed ?? false}
              className="size-4 accent-blue-700"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  acceptedRoute: {
                    ...(current.acceptedRoute ?? {
                      geometry: [],
                      source: "manual",
                      coordinateSystem: "map"
                    }),
                    reviewed: event.target.checked
                  }
                }))
              }
              type="checkbox"
            />
            Accepted route reviewed
          </label>
        </div>
        <label className={labelClassName}>
          Explanation / feedback text
          <textarea
            className={`${inputClassName} min-h-28 resize-y`}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                explanation: event.target.value
              }))
            }
            value={draft.explanation ?? ""}
          />
        </label>
        <label className={labelClassName}>
          Ideal route description
          <textarea
            className={`${inputClassName} min-h-24 resize-y`}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                idealRouteDescription: event.target.value
              }))
            }
            value={draft.idealRouteDescription ?? ""}
          />
        </label>
        <label className={labelClassName}>
          Learning tip
          <textarea
            className={`${inputClassName} min-h-24 resize-y`}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                tip: event.target.value
              }))
            }
            value={draft.tip ?? ""}
          />
        </label>
      </fieldset>

      <div className="grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
        <div className="text-xs leading-5 text-slate-500">
          <p>Created: {draft.createdAt}</p>
          <p>Updated: {draft.updatedAt}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-road hover:text-road"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-road px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={Boolean(geometryError)}
            type="submit"
          >
            Save browser draft
          </button>
        </div>
      </div>

      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="grid gap-3 border-t border-slate-200 pt-5 lg:grid-cols-2">
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-bold text-red-800">
              Errors ({validation.errors.length})
            </p>
            <ul className="mt-2 space-y-1 text-sm text-red-800">
              {validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
              {validation.errors.length === 0 && <li>No validation errors.</li>}
            </ul>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-bold text-amber-900">
              Warnings ({validation.warnings.length})
            </p>
            <ul className="mt-2 space-y-1 text-sm text-amber-900">
              {validation.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
              {validation.warnings.length === 0 && <li>No warnings.</li>}
            </ul>
          </div>
        </div>
      )}
    </form>
  );
}
