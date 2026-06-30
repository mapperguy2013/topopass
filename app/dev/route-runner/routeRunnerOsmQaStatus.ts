import type { MapDefinition, MapGraph, RouteExercise } from "../../../lib/map-engine/index.ts";
import {
  formatOsmExerciseQaFailure,
  validateOsmRouteExerciseQaSuite,
  type OsmExerciseQaFailure,
  type OsmExerciseQaFailureReason,
  type OsmExerciseQaResult
} from "./routeRunnerOsmExerciseQa.ts";

export type OsmQaStatusState = "pass" | "fail" | "not-run";

export type OsmQaStatusCheckId =
  | "stop-nodes"
  | "ordered-leg-reachability"
  | "fastest-route"
  | "directed-edge-legality"
  | "render-bounds";

export type OsmQaStatusCheck = {
  id: OsmQaStatusCheckId;
  label: string;
  state: OsmQaStatusState;
  detail: string;
};

export type OsmQaStatusPanelModel = {
  mapId: string;
  mapName: string;
  nodeCount: number;
  directedEdgeCount: number;
  exerciseCount: number;
  qaState: Exclude<OsmQaStatusState, "not-run">;
  passedExerciseCount: number;
  failedExerciseCount: number;
  failureMessages: string[];
  selectedExercise: {
    id: string;
    title: string;
    qaState: Exclude<OsmQaStatusState, "not-run">;
    stopNodeIds: Array<string | null>;
    routeEdgeCount: number;
    routeDistanceMeters: number | null;
    checks: OsmQaStatusCheck[];
    failureMessages: string[];
  } | null;
};

export function buildOsmQaStatusPanelModel(input: {
  map: MapDefinition;
  graph: MapGraph;
  exercises: readonly RouteExercise[];
  selectedExercise?: RouteExercise | null;
  enabled: boolean;
  isConvertedOsmMap: boolean;
}): OsmQaStatusPanelModel | null {
  if (!input.enabled || !input.isConvertedOsmMap) {
    return null;
  }

  const suite = validateOsmRouteExerciseQaSuite({
    map: input.map,
    graph: input.graph,
    exercises: input.exercises
  });
  const selectedResult = input.selectedExercise
    ? suite.results.find((result) => result.exerciseId === input.selectedExercise?.id) ?? null
    : null;
  const passedExerciseCount = suite.results.filter((result) => result.isValid).length;

  return {
    mapId: input.map.id,
    mapName: input.map.name,
    nodeCount: input.map.nodes.length,
    directedEdgeCount: input.graph.edges.length,
    exerciseCount: suite.exerciseCount,
    qaState: suite.isValid ? "pass" : "fail",
    passedExerciseCount,
    failedExerciseCount: suite.exerciseCount - passedExerciseCount,
    failureMessages: suite.failures.map(formatOsmExerciseQaFailure),
    selectedExercise:
      input.selectedExercise && selectedResult
        ? {
            id: input.selectedExercise.id,
            title: input.selectedExercise.title,
            qaState: selectedResult.isValid ? "pass" : "fail",
            stopNodeIds: [...selectedResult.stopNodeIds],
            routeEdgeCount: selectedResult.routeEdgeIds.length,
            routeDistanceMeters: selectedResult.routeDistanceMeters,
            checks: buildSelectedExerciseChecks(selectedResult),
            failureMessages: selectedResult.failures.map(formatOsmExerciseQaFailure)
          }
        : null
  };
}

export function buildSelectedExerciseChecks(result: OsmExerciseQaResult): OsmQaStatusCheck[] {
  return [
    {
      id: "stop-nodes",
      label: "Start / checkpoint / destination nodes",
      state: hasFailureReason(result.failures, [
        "missing-start-node",
        "missing-checkpoint-node",
        "missing-destination-node",
        "same-start-destination"
      ])
        ? "fail"
        : "pass",
      detail: hasFailureReason(result.failures, [
        "missing-start-node",
        "missing-checkpoint-node",
        "missing-destination-node",
        "same-start-destination"
      ])
        ? "One or more required exercise stops cannot be resolved in this converted graph."
        : "Start, checkpoint, and destination stops resolve to converted graph nodes."
    },
    {
      id: "ordered-leg-reachability",
      label: "Ordered leg reachability",
      state: hasFailureReason(result.failures, ["unreachable-leg"]) ? "fail" : "pass",
      detail: hasFailureReason(result.failures, ["unreachable-leg"])
        ? "At least one ordered exercise leg has no legal route."
        : "Every ordered exercise leg is legally reachable."
    },
    {
      id: "fastest-route",
      label: "Legal fastest / reveal route",
      state: result.routeEdgeIds.length > 0 && !hasFailureReason(result.failures, ["unreachable-leg"]) ? "pass" : "fail",
      detail:
        result.routeEdgeIds.length > 0 && !hasFailureReason(result.failures, ["unreachable-leg"])
          ? `Legal reveal route contains ${result.routeEdgeIds.length} directed edge${result.routeEdgeIds.length === 1 ? "" : "s"}.`
          : "No legal reveal route is available for this exercise."
    },
    {
      id: "directed-edge-legality",
      label: "Directed edge legality",
      state: hasFailureReason(result.failures, ["illegal-directed-edge", "unknown-route-edge"]) ? "fail" : "pass",
      detail: hasFailureReason(result.failures, ["illegal-directed-edge", "unknown-route-edge"])
        ? "The route contains blocked, unknown, or illegal directed edges."
        : "Returned route edges are known and legal."
    },
    {
      id: "render-bounds",
      label: "Render bounds sanity",
      state: hasFailureReason(result.failures, ["outside-render-bounds"]) ? "fail" : "pass",
      detail: hasFailureReason(result.failures, ["outside-render-bounds"])
        ? "Exercise stops or route geometry fall outside the fitted map bounds."
        : "Exercise stops and route geometry sit inside the fitted map bounds."
    }
  ];
}

function hasFailureReason(
  failures: readonly OsmExerciseQaFailure[],
  reasons: readonly OsmExerciseQaFailureReason[]
): boolean {
  return failures.some((failure) => reasons.includes(failure.reason));
}
