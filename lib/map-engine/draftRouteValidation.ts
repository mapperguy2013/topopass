import { runRouteExercise, type NormalisedRouteAttempt, type UserRouteSelectionInput } from "./exerciseRunner.ts";
import { buildMapGraph } from "./graph.ts";
import type { MapDefinition, MapGraph, MapRoad, RouteExercise, RouteStop } from "./types.ts";

export type DraftRouteValidationIssueCode =
  | "unknown_exercise"
  | "empty_route"
  | "unknown_node"
  | "unknown_road"
  | "wrong_start"
  | "disconnected_route"
  | "missing_destination"
  | "missing_required_stop"
  | "out_of_order_stop";

export type DraftRouteValidationIssueSeverity = "info" | "warning" | "error";

export type DraftRouteValidationIssue = {
  code: DraftRouteValidationIssueCode;
  severity: DraftRouteValidationIssueSeverity;
  message: string;
  nodeId?: string;
  roadId?: string;
  expectedNodeId?: string;
  actualNodeId?: string;
};

export type ValidateDraftRouteSelectionInput = {
  map: MapDefinition;
  exercises: readonly RouteExercise[];
  exerciseId: string;
  draftNodeIds?: readonly string[];
  draftRoadIds?: readonly string[];
};

export type DraftRouteProgressPreview = {
  selectedNodeIds: string[];
  selectedRoadIds: string[];
  currentNodeId?: string;
  requiredStopNodeIds: string[];
  requiredStopsVisited: number;
  requiredStopsTotal: number;
  nextRequiredStopNodeId?: string;
  hasCorrectStart: boolean;
  hasReachedDestination: boolean;
  totalSelectedDistance: number;
};

export type DraftRouteValidationResult = {
  exerciseId: string;
  isValidDraft: boolean;
  isReadyToSubmit: boolean;
  issues: DraftRouteValidationIssue[];
  preview: DraftRouteProgressPreview;
  normalisedAttempt?: NormalisedRouteAttempt;
};

type ResolvedExerciseStops = {
  requiredNodeIds: string[];
};

type DraftRouteStructure = {
  selectedNodeIds: string[];
  selectedRoadIds: string[];
  totalSelectedDistance: number;
};

function createIssue(issue: DraftRouteValidationIssue): DraftRouteValidationIssue {
  return issue;
}

function roadConnectsNodes(road: MapRoad, fromNodeId: string, toNodeId: string): boolean {
  return (
    (road.fromNodeId === fromNodeId && road.toNodeId === toNodeId) ||
    (road.fromNodeId === toNodeId && road.toNodeId === fromNodeId)
  );
}

function findRoadBetweenNodes(graph: MapGraph, fromNodeId: string, toNodeId: string): MapRoad | undefined {
  return Object.values(graph.roadsById).find((road) => roadConnectsNodes(road, fromNodeId, toNodeId));
}

function resolveRouteStop(map: MapDefinition, graph: MapGraph, stop: RouteStop): string | undefined {
  if (stop.type === "node") {
    return graph.nodesById[stop.nodeId] ? stop.nodeId : undefined;
  }

  const landmark = map.landmarks.find((candidate) => candidate.id === stop.landmarkId);

  if (!landmark?.nearestNodeId || !graph.nodesById[landmark.nearestNodeId]) {
    return undefined;
  }

  return landmark.nearestNodeId;
}

function resolveExerciseStops(
  map: MapDefinition,
  graph: MapGraph,
  exercise: RouteExercise
): ResolvedExerciseStops | undefined {
  const requiredNodeIds = exercise.stops.map((stop) => resolveRouteStop(map, graph, stop));

  if (requiredNodeIds.some((nodeId) => !nodeId)) {
    return undefined;
  }

  return {
    requiredNodeIds: requiredNodeIds as string[]
  };
}

function routeIssueExists(issues: DraftRouteValidationIssue[], code: DraftRouteValidationIssueCode): boolean {
  return issues.some((issue) => issue.code === code);
}

function inspectKnownIds(
  graph: MapGraph,
  nodeIds: readonly string[],
  roadIds: readonly string[]
): DraftRouteValidationIssue[] {
  const issues: DraftRouteValidationIssue[] = [];

  for (const nodeId of nodeIds) {
    if (!graph.nodesById[nodeId]) {
      issues.push(
        createIssue({
          code: "unknown_node",
          severity: "error",
          message: `Unknown node ID: ${nodeId}.`,
          nodeId
        })
      );
    }
  }

  for (const roadId of roadIds) {
    if (!graph.roadsById[roadId]) {
      issues.push(
        createIssue({
          code: "unknown_road",
          severity: "error",
          message: `Unknown road ID: ${roadId}.`,
          roadId
        })
      );
    }
  }

  return issues;
}

function inspectRouteStructure(
  graph: MapGraph,
  nodeIds: readonly string[],
  roadIds: readonly string[],
  issues: DraftRouteValidationIssue[]
): DraftRouteStructure {
  if (nodeIds.length > 0) {
    const selectedRoadIds = [...roadIds];
    let totalSelectedDistance = 0;

    if (roadIds.length > 0 && roadIds.length !== nodeIds.length - 1) {
      issues.push(
        createIssue({
          code: "disconnected_route",
          severity: "error",
          message: "When node IDs and road IDs are both supplied, road IDs must have one fewer item than node IDs."
        })
      );
    }

    for (let index = 0; index < nodeIds.length - 1; index += 1) {
      const fromNodeId = nodeIds[index];
      const toNodeId = nodeIds[index + 1];
      const road = roadIds.length > 0 ? graph.roadsById[roadIds[index]] : findRoadBetweenNodes(graph, fromNodeId, toNodeId);

      if (!road) {
        issues.push(
          createIssue({
            code: "disconnected_route",
            severity: "error",
            message: `Selected nodes ${fromNodeId} and ${toNodeId} are not connected by a known road.`,
            expectedNodeId: fromNodeId,
            actualNodeId: toNodeId
          })
        );
        continue;
      }

      if (!roadConnectsNodes(road, fromNodeId, toNodeId)) {
        issues.push(
          createIssue({
            code: "disconnected_route",
            severity: "error",
            message: `Road ${road.id} does not connect selected nodes ${fromNodeId} and ${toNodeId}.`,
            roadId: road.id,
            expectedNodeId: fromNodeId,
            actualNodeId: toNodeId
          })
        );
        continue;
      }

      totalSelectedDistance += road.distanceMeters;
      if (roadIds.length === 0) {
        selectedRoadIds.push(road.id);
      }
    }

    return {
      selectedNodeIds: [...nodeIds],
      selectedRoadIds,
      totalSelectedDistance
    };
  }

  const selectedNodeIds: string[] = [];
  let totalSelectedDistance = 0;

  for (let index = 0; index < roadIds.length; index += 1) {
    const road = graph.roadsById[roadIds[index]];

    if (!road) {
      continue;
    }

    if (index === 0) {
      selectedNodeIds.push(road.fromNodeId);
    } else {
      const previousNodeId = selectedNodeIds[selectedNodeIds.length - 1];
      if (previousNodeId !== road.fromNodeId) {
        issues.push(
          createIssue({
            code: "disconnected_route",
            severity: "error",
            message: `Selected road ${road.id} starts at ${road.fromNodeId}, but the draft is currently at ${previousNodeId}.`,
            roadId: road.id,
            expectedNodeId: previousNodeId,
            actualNodeId: road.fromNodeId
          })
        );
      }
    }

    selectedNodeIds.push(road.toNodeId);
    totalSelectedDistance += road.distanceMeters;
  }

  return {
    selectedNodeIds,
    selectedRoadIds: [...roadIds],
    totalSelectedDistance
  };
}

function inspectRequiredStopProgress(
  requiredStopNodeIds: readonly string[],
  selectedNodeIds: readonly string[]
): {
  requiredStopsVisited: number;
  outOfOrderIssue?: DraftRouteValidationIssue;
} {
  if (requiredStopNodeIds.length === 0 || selectedNodeIds.length === 0) {
    return { requiredStopsVisited: 0 };
  }

  if (selectedNodeIds[0] !== requiredStopNodeIds[0]) {
    return { requiredStopsVisited: 0 };
  }

  let requiredStopIndex = 1;
  let outOfOrderIssue: DraftRouteValidationIssue | undefined;

  for (const nodeId of selectedNodeIds.slice(1)) {
    if (nodeId === requiredStopNodeIds[requiredStopIndex]) {
      requiredStopIndex += 1;
      continue;
    }

    const matchedRequiredIndex = requiredStopNodeIds.indexOf(nodeId);
    if (matchedRequiredIndex > requiredStopIndex && !outOfOrderIssue) {
      outOfOrderIssue = createIssue({
        code: "out_of_order_stop",
        severity: "error",
        message: `Required stop ${nodeId} was visited before ${requiredStopNodeIds[requiredStopIndex]}.`,
        expectedNodeId: requiredStopNodeIds[requiredStopIndex],
        actualNodeId: nodeId,
        nodeId
      });
    }
  }

  return {
    requiredStopsVisited: requiredStopIndex,
    outOfOrderIssue
  };
}

function createPreview(
  structure: DraftRouteStructure,
  requiredStopNodeIds: readonly string[],
  issues: DraftRouteValidationIssue[]
): DraftRouteProgressPreview {
  const currentNodeId = structure.selectedNodeIds.at(-1);
  const startNodeId = requiredStopNodeIds[0];
  const destinationNodeId = requiredStopNodeIds.at(-1);
  const hasCorrectStart = Boolean(startNodeId && structure.selectedNodeIds[0] === startNodeId);
  const hasReachedDestination = Boolean(destinationNodeId && currentNodeId === destinationNodeId);
  const progress = inspectRequiredStopProgress(requiredStopNodeIds, structure.selectedNodeIds);

  if (progress.outOfOrderIssue) {
    issues.push(progress.outOfOrderIssue);
  }

  const nextRequiredStopNodeId = requiredStopNodeIds[progress.requiredStopsVisited];

  return {
    selectedNodeIds: [...structure.selectedNodeIds],
    selectedRoadIds: [...structure.selectedRoadIds],
    currentNodeId,
    requiredStopNodeIds: [...requiredStopNodeIds],
    requiredStopsVisited: progress.requiredStopsVisited,
    requiredStopsTotal: requiredStopNodeIds.length,
    nextRequiredStopNodeId,
    hasCorrectStart,
    hasReachedDestination,
    totalSelectedDistance: structure.totalSelectedDistance
  };
}

function hasError(issues: readonly DraftRouteValidationIssue[]): boolean {
  return issues.some((issue) => issue.severity === "error");
}

function createEmptyPreview(
  nodeIds: readonly string[],
  roadIds: readonly string[],
  requiredStopNodeIds: readonly string[] = []
): DraftRouteProgressPreview {
  return {
    selectedNodeIds: [...nodeIds],
    selectedRoadIds: [...roadIds],
    requiredStopNodeIds: [...requiredStopNodeIds],
    requiredStopsVisited: 0,
    requiredStopsTotal: requiredStopNodeIds.length,
    nextRequiredStopNodeId: requiredStopNodeIds[0],
    hasCorrectStart: false,
    hasReachedDestination: false,
    totalSelectedDistance: 0
  };
}

export function validateDraftRouteSelection(input: ValidateDraftRouteSelectionInput): DraftRouteValidationResult {
  const graph = buildMapGraph(input.map);
  const draftNodeIds = [...(input.draftNodeIds ?? [])];
  const draftRoadIds = [...(input.draftRoadIds ?? [])];
  const issues: DraftRouteValidationIssue[] = [];
  const exercise = input.exercises.find((candidate) => candidate.id === input.exerciseId);

  if (!exercise) {
    issues.push(
      createIssue({
        code: "unknown_exercise",
        severity: "error",
        message: `Unknown route exercise ID: ${input.exerciseId}.`
      })
    );

    return {
      exerciseId: input.exerciseId,
      isValidDraft: false,
      isReadyToSubmit: false,
      issues,
      preview: createEmptyPreview(draftNodeIds, draftRoadIds)
    };
  }

  const resolvedStops = resolveExerciseStops(input.map, graph, exercise);

  if (!resolvedStops) {
    issues.push(
      createIssue({
        code: "unknown_exercise",
        severity: "error",
        message: `Route exercise ${input.exerciseId} references stops that cannot be resolved.`
      })
    );

    return {
      exerciseId: input.exerciseId,
      isValidDraft: false,
      isReadyToSubmit: false,
      issues,
      preview: createEmptyPreview(draftNodeIds, draftRoadIds)
    };
  }

  if (draftNodeIds.length === 0 && draftRoadIds.length === 0) {
    issues.push(
      createIssue({
        code: "empty_route",
        severity: "info",
        message: "Select at least one node or road to start the route preview."
      })
    );

    return {
      exerciseId: input.exerciseId,
      isValidDraft: true,
      isReadyToSubmit: false,
      issues,
      preview: createEmptyPreview(draftNodeIds, draftRoadIds, resolvedStops.requiredNodeIds)
    };
  }

  issues.push(...inspectKnownIds(graph, draftNodeIds, draftRoadIds));
  const structure = inspectRouteStructure(graph, draftNodeIds, draftRoadIds, issues);
  const preview = createPreview(structure, resolvedStops.requiredNodeIds, issues);

  if (structure.selectedNodeIds.length > 0 && !preview.hasCorrectStart) {
    issues.push(
      createIssue({
        code: "wrong_start",
        severity: "error",
        message: `Route should start at ${resolvedStops.requiredNodeIds[0]}, but starts at ${structure.selectedNodeIds[0]}.`,
        expectedNodeId: resolvedStops.requiredNodeIds[0],
        actualNodeId: structure.selectedNodeIds[0]
      })
    );
  }

  if (
    preview.hasReachedDestination &&
    preview.requiredStopsVisited < preview.requiredStopsTotal &&
    !routeIssueExists(issues, "missing_required_stop")
  ) {
    issues.push(
      createIssue({
        code: "missing_required_stop",
        severity: "error",
        message: `Visit required stop ${preview.nextRequiredStopNodeId} before finishing this route.`,
        expectedNodeId: preview.nextRequiredStopNodeId
      })
    );
  }

  if (
    !preview.hasReachedDestination &&
    preview.hasCorrectStart &&
    !routeIssueExists(issues, "disconnected_route") &&
    !routeIssueExists(issues, "out_of_order_stop")
  ) {
    issues.push(
      createIssue({
        code: "missing_destination",
        severity: "warning",
        message: `Continue the route to destination ${resolvedStops.requiredNodeIds.at(-1)}.`,
        expectedNodeId: resolvedStops.requiredNodeIds.at(-1),
        actualNodeId: preview.currentNodeId
      })
    );
  }

  const isValidDraft = !hasError(issues);
  const isReadyToSubmit =
    isValidDraft &&
    issues.length === 0 &&
    preview.hasCorrectStart &&
    preview.hasReachedDestination &&
    preview.requiredStopsVisited === preview.requiredStopsTotal;
  let normalisedAttempt: NormalisedRouteAttempt | undefined;

  if (isReadyToSubmit) {
    normalisedAttempt = runRouteExercise({
      map: input.map,
      exercises: [...input.exercises],
      exerciseId: input.exerciseId,
      userRoute: {
        nodeIds: draftNodeIds,
        roadIds: draftRoadIds
      } satisfies UserRouteSelectionInput
    }).normalisedAttempt;
  }

  return {
    exerciseId: input.exerciseId,
    isValidDraft,
    isReadyToSubmit,
    issues,
    preview,
    normalisedAttempt
  };
}

export function canSubmitDraftRoute(result: DraftRouteValidationResult): boolean {
  return result.isReadyToSubmit;
}
