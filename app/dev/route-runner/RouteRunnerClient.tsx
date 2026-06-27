"use client";

import { useMemo, useState } from "react";
import {
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  runRouteExercise,
  type RouteExercise,
  type RouteStop,
  type RunRouteExerciseResult
} from "@/lib/map-engine";
import { parseCommaSeparatedIds } from "./routeRunnerInput";

function stopLabel(stop: RouteStop): string {
  if (stop.type === "node") {
    const node = marloweDistrictMap.nodes.find((candidate) => candidate.id === stop.nodeId);

    return `${node?.label ?? stop.nodeId} (${stop.nodeId})`;
  }

  const landmark = marloweDistrictMap.landmarks.find((candidate) => candidate.id === stop.landmarkId);
  const nearestNode = landmark?.nearestNodeId ? `, nearest node ${landmark.nearestNodeId}` : "";

  return `${landmark?.name ?? stop.landmarkId} (${stop.landmarkId}${nearestNode})`;
}

function resultSummary(result: RunRouteExerciseResult): string {
  const score = result.score.scorePercent.toFixed(1);
  const status = result.score.passed ? "Pass" : "Fail";
  const reasons = result.score.failureReasons.length > 0 ? `: ${result.score.failureReasons.join(", ")}` : "";

  return `${status} - ${score}%${reasons}`;
}

export function RouteRunnerClient() {
  const [exerciseId, setExerciseId] = useState(marloweDistrictRouteExercises[0]?.id ?? "");
  const [nodeIdsText, setNodeIdsText] = useState("");
  const [roadIdsText, setRoadIdsText] = useState("");
  const [result, setResult] = useState<RunRouteExerciseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedExercise = useMemo<RouteExercise | undefined>(
    () => marloweDistrictRouteExercises.find((exercise) => exercise.id === exerciseId),
    [exerciseId]
  );

  function handleRunRoute() {
    setResult(null);
    setError(null);

    try {
      const runResult = runRouteExercise({
        map: marloweDistrictMap,
        exercises: marloweDistrictRouteExercises,
        exerciseId,
        userRoute: {
          nodeIds: parseCommaSeparatedIds(nodeIdsText),
          roadIds: parseCommaSeparatedIds(roadIdsText)
        }
      });

      setResult(runResult);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Route runner failed with an unknown error.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Developer route runner</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">Marlowe District route exercise runner</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              This debug page runs manual node and road ID selections through the Stage 55 exercise runner. It uses the
              fictional Marlowe District fixture only; it is not the final drawing or snapping interface.
            </p>
          </div>
          <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-900">
            Map: {marloweDistrictMap.name}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <label htmlFor="route-exercise" className="text-sm font-semibold text-slate-900">
              Route exercise
            </label>
            <select
              id="route-exercise"
              value={exerciseId}
              onChange={(event) => {
                setExerciseId(event.target.value);
                setResult(null);
                setError(null);
              }}
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {marloweDistrictRouteExercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.title}
                </option>
              ))}
            </select>

            {selectedExercise ? (
              <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                <h2 className="font-semibold text-slate-950">{selectedExercise.title}</h2>
                <dl className="mt-3 space-y-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exercise ID</dt>
                    <dd className="mt-1 font-mono text-xs text-slate-700">{selectedExercise.id}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start</dt>
                    <dd className="mt-1">{stopLabel(selectedExercise.stops[0])}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Required stops</dt>
                    <dd className="mt-1">
                      <ol className="list-decimal space-y-1 pl-5">
                        {selectedExercise.stops.slice(1).map((stop, index) => (
                          <li key={`${selectedExercise.id}-stop-${index}`}>{stopLabel(stop)}</li>
                        ))}
                      </ol>
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Manual route input</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Enter comma-separated fixture IDs. If both fields are supplied, each road must connect the matching pair
              of selected nodes.
            </p>

            <label htmlFor="node-ids" className="mt-4 block text-sm font-semibold text-slate-900">
              Node IDs
            </label>
            <textarea
              id="node-ids"
              value={nodeIdsText}
              onChange={(event) => setNodeIdsText(event.target.value)}
              rows={3}
              placeholder="n02, n03, n12, n17"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />

            <label htmlFor="road-ids" className="mt-4 block text-sm font-semibold text-slate-900">
              Road IDs
            </label>
            <textarea
              id="road-ids"
              value={roadIdsText}
              onChange={(event) => setRoadIdsText(event.target.value)}
              rows={3}
              placeholder="r02, r37, r24"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={handleRunRoute}
              className="mt-5 inline-flex items-center justify-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              Run route
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {error ? (
            <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-900 shadow-sm">
              <h2 className="font-semibold">Runner error</h2>
              <p className="mt-2 font-mono text-xs">{error}</p>
            </section>
          ) : null}

          {result ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold text-slate-950">Run result</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    result.score.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {resultSummary(result)}
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{result.score.scorePercent.toFixed(1)}%</p>
                </div>
                <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">User distance</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{result.score.userRouteDistanceMeters}m</p>
                </div>
                <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shortest legal</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {result.score.shortestLegalRouteDistanceMeters}m
                  </p>
                </div>
              </div>

              <h3 className="mt-5 text-sm font-semibold text-slate-950">Normalised attempt</h3>
              <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {JSON.stringify(result.normalisedAttempt, null, 2)}
              </pre>

              <h3 className="mt-5 text-sm font-semibold text-slate-950">Score result</h3>
              <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {JSON.stringify(result.score, null, 2)}
              </pre>
            </section>
          ) : (
            <section className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              Run a route to see the normalised attempt and scoring result.
            </section>
          )}
        </div>
      </section>
    </div>
  );
}
