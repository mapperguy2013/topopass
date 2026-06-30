import {
  buildIllegalDrawnMovementHighlights,
  buildMapGraph,
  createDrawnRouteTrace,
  runRouteExercise,
  type DirectedEdge,
  type DrawnRoutePipelineResult,
  type MapDefinition,
  type MapGraph,
  type RouteExercise,
  type RunRouteExerciseResult,
  type UserRouteSelectionInput
} from "../../../lib/map-engine/index.ts";
import {
  buildRouteAttemptReview,
  type RouteAttemptReview
} from "./routeAttemptReview.ts";
import { getRouteRunnerMapFitBounds, type RouteRunnerMapBounds } from "./routeRunnerMaps.ts";

export type OSMManualAttemptQaReason =
  | "manual-attempt-valid"
  | "manual-attempt-missing-start"
  | "manual-attempt-incomplete"
  | "manual-attempt-skipped-checkpoint"
  | "manual-attempt-checkpoint-order"
  | "manual-attempt-blocked-directed-edge"
  | "manual-attempt-unknown-edge"
  | "manual-attempt-outside-bounds";

export type OsmManualAttemptPath = {
  edgeIds?: string[];
  nodeIds?: string[];
  roadIds?: string[];
};

export type OsmManualAttemptQaReport = {
  isAccepted: boolean;
  mapId: string;
  exerciseId: string;
  reasonCodes: OSMManualAttemptQaReason[];
  feedbackStatus: RouteAttemptReview["status"];
  selectedNodeIds: string[];
  selectedRoadIds: string[];
  selectedDirectedEdgeIds: string[];
  scorePassed: boolean | null;
  scoringFailureReasons: string[];
  illegalMovementTypes: string[];
  feedbackItemIds: string[];
  messages: string[];
  review: RouteAttemptReview;
};

export type ValidateOsmManualAttemptQaInput = {
  map: MapDefinition;
  exercises: readonly RouteExercise[];
  exerciseId: string;
  attempt: OsmManualAttemptPath;
  graph?: MapGraph;
  renderBounds?: RouteRunnerMapBounds;
};

type ResolvedManualAttempt = {
  userRoute: UserRouteSelectionInput;
  selectedNodeIds: string[];
  selectedRoadIds: string[];
  selectedDirectedEdgeIds: string[];
  unknownEdgeIds: string[];
};

type AttemptStopFacts = {
  requiredNodeIds: string[];
  visitedNodeIds: string[];
  startsAtRequiredNode: boolean;
  endsAtRequiredNode: boolean;
  checkpointNodeIds: string[];
  checkpointsVisited: boolean;
  checkpointsVisitedOutOfOrder: boolean;
  destinationVisitedBeforeCheckpointCompletion: boolean;
};

const MANUAL_ATTEMPT_REASON_ORDER: OSMManualAttemptQaReason[] = [
  "manual-attempt-valid",
  "manual-attempt-unknown-edge",
  "manual-attempt-outside-bounds",
  "manual-attempt-blocked-directed-edge",
  "manual-attempt-missing-start",
  "manual-attempt-checkpoint-order",
  "manual-attempt-skipped-checkpoint",
  "manual-attempt-incomplete"
];

export function validateOsmManualAttemptQa(input: ValidateOsmManualAttemptQaInput): OsmManualAttemptQaReport {
  const graph = input.graph ?? buildMapGraph(input.map);
  const renderBounds = input.renderBounds ?? getRouteRunnerMapFitBounds(input.map);
  const resolvedAttempt = resolveManualAttemptPath(graph, input.attempt);
  const exercise = input.exercises.find((candidate) => candidate.id === input.exerciseId);
  const preScoringReasonCodes = new Set<OSMManualAttemptQaReason>();

  if (resolvedAttempt.unknownEdgeIds.length > 0) {
    preScoringReasonCodes.add("manual-attempt-unknown-edge");
  }

  if (attemptLeavesRenderBounds(graph, renderBounds, resolvedAttempt.selectedNodeIds)) {
    preScoringReasonCodes.add("manual-attempt-outside-bounds");
  }

  let exerciseResult: RunRouteExerciseResult | null = null;
  let thrownError: Error | null = null;

  if (exercise && resolvedAttempt.unknownEdgeIds.length === 0) {
    try {
      exerciseResult = runRouteExercise({
        map: input.map,
        exercises: [...input.exercises],
        exerciseId: input.exerciseId,
        userRoute: resolvedAttempt.userRoute
      });
    } catch (error) {
      thrownError = error instanceof Error ? error : new Error(String(error));
    }
  }

  if (!exercise) {
    thrownError = new Error(`Unknown route exercise id: ${input.exerciseId}`);
  }

  if (thrownError && /unknown edge|unknown road|unknown node/i.test(thrownError.message)) {
    preScoringReasonCodes.add("manual-attempt-unknown-edge");
  }

  const pipelineResult = buildManualAttemptPipelineResult(exerciseResult, thrownError);
  const illegalDrawnMovements = buildIllegalDrawnMovementHighlights({
    map: input.map,
    illegalMovements: exerciseResult?.score.legality.illegalMovements ?? [],
    scored: Boolean(exerciseResult)
  });
  const review = buildRouteAttemptReview({
    pipelineResult,
    illegalMovements: illegalDrawnMovements,
    isDrawing: false
  });
  const facts = exerciseResult
    ? buildAttemptStopFacts(exerciseResult)
    : exercise
      ? buildUnscoredAttemptStopFacts(exercise, resolvedAttempt.selectedNodeIds)
      : null;
  const reasonCodes = orderedManualAttemptReasonCodes(
    classifyManualAttemptReasonCodes({
      review,
      exerciseResult,
      facts,
      preScoringReasonCodes
    })
  );

  return {
    isAccepted: reasonCodes.length === 1 && reasonCodes[0] === "manual-attempt-valid",
    mapId: input.map.id,
    exerciseId: input.exerciseId,
    reasonCodes,
    feedbackStatus: review.status,
    selectedNodeIds: exerciseResult?.normalisedAttempt.selectedNodeIds ?? resolvedAttempt.selectedNodeIds,
    selectedRoadIds: exerciseResult?.normalisedAttempt.selectedRoadIds ?? resolvedAttempt.selectedRoadIds,
    selectedDirectedEdgeIds:
      exerciseResult?.normalisedAttempt.selectedDirectedEdgeIds ?? resolvedAttempt.selectedDirectedEdgeIds,
    scorePassed: exerciseResult?.score.passed ?? null,
    scoringFailureReasons: exerciseResult?.score.failureReasons ?? [],
    illegalMovementTypes: exerciseResult?.score.legality.illegalMovements.map((movement) => movement.type) ?? [],
    feedbackItemIds: [...review.illegalMovements, ...review.missedRestrictions].map((item) => item.id),
    messages: reasonCodes.map((reason) =>
      formatOsmManualAttemptQaReason({
        reason,
        mapId: input.map.id,
        exerciseId: input.exerciseId,
        review,
        exerciseResult,
        thrownError,
        unknownEdgeIds: resolvedAttempt.unknownEdgeIds
      })
    ),
    review
  };
}

export function formatOsmManualAttemptQaReason(input: {
  reason: OSMManualAttemptQaReason;
  mapId: string;
  exerciseId: string;
  review: RouteAttemptReview;
  exerciseResult: RunRouteExerciseResult | null;
  thrownError?: Error | null;
  unknownEdgeIds?: readonly string[];
}): string {
  const details: string[] = [
    input.reason,
    `map=${input.mapId}`,
    `exercise=${input.exerciseId}`,
    `feedback=${input.review.status}`
  ];

  if (input.exerciseResult) {
    details.push(`passed=${input.exerciseResult.score.passed ? "yes" : "no"}`);
  }

  if (input.unknownEdgeIds && input.unknownEdgeIds.length > 0) {
    details.push(`unknownEdges=${input.unknownEdgeIds.join(",")}`);
  }

  if (input.thrownError) {
    details.push(input.thrownError.message);
  } else if (input.review.suggestedFailureReason) {
    details.push(input.review.suggestedFailureReason);
  } else {
    details.push(input.review.title);
  }

  return details.join(" | ");
}

function resolveManualAttemptPath(graph: MapGraph, attempt: OsmManualAttemptPath): ResolvedManualAttempt {
  if (attempt.edgeIds) {
    const edges = attempt.edgeIds.map((edgeId) => graph.edgesById[edgeId]);
    const knownEdges = edges.filter((edge): edge is DirectedEdge => Boolean(edge));
    const firstEdge = knownEdges[0];

    return {
      userRoute: {
        nodeIds: firstEdge ? [firstEdge.fromNodeId, ...knownEdges.map((edge) => edge.toNodeId)] : [],
        roadIds: knownEdges.map((edge) => edge.roadId)
      },
      selectedNodeIds: firstEdge ? [firstEdge.fromNodeId, ...knownEdges.map((edge) => edge.toNodeId)] : [],
      selectedRoadIds: knownEdges.map((edge) => edge.roadId),
      selectedDirectedEdgeIds: knownEdges.map((edge) => edge.id),
      unknownEdgeIds: attempt.edgeIds.filter((edgeId) => !graph.edgesById[edgeId])
    };
  }

  return {
    userRoute: {
      nodeIds: attempt.nodeIds ? [...attempt.nodeIds] : undefined,
      roadIds: attempt.roadIds ? [...attempt.roadIds] : undefined
    },
    selectedNodeIds: attempt.nodeIds ? [...attempt.nodeIds] : [],
    selectedRoadIds: attempt.roadIds ? [...attempt.roadIds] : [],
    selectedDirectedEdgeIds: [],
    unknownEdgeIds: []
  };
}

function buildManualAttemptPipelineResult(
  exerciseResult: RunRouteExerciseResult | null,
  thrownError: Error | null
): DrawnRoutePipelineResult {
  return {
    status: exerciseResult ? "scored" : "exercise_failed",
    simplifiedTrace: createDrawnRouteTrace([]),
    snappedRoute: null,
    snappedPoints: [],
    matchResult: null,
    exerciseResult,
    warnings: thrownError
      ? [
          {
            source: "exercise",
            code: "exercise_failed",
            severity: "error",
            message: thrownError.message
          }
        ]
      : []
  };
}

function classifyManualAttemptReasonCodes(input: {
  review: RouteAttemptReview;
  exerciseResult: RunRouteExerciseResult | null;
  facts: AttemptStopFacts | null;
  preScoringReasonCodes: Set<OSMManualAttemptQaReason>;
}): Set<OSMManualAttemptQaReason> {
  const reasonCodes = new Set<OSMManualAttemptQaReason>(input.preScoringReasonCodes);
  const score = input.exerciseResult?.score;

  if (input.review.status === "pass" && score?.passed === true && reasonCodes.size === 0) {
    reasonCodes.add("manual-attempt-valid");
    return reasonCodes;
  }

  if (
    score?.legality.illegalMovements.some((movement) =>
      ["wrong_way_one_way", "no_entry", "road_closed"].includes(movement.type)
    )
  ) {
    reasonCodes.add("manual-attempt-blocked-directed-edge");
  }

  if (score?.failureReasons.includes("wrong_start")) {
    reasonCodes.add("manual-attempt-missing-start");
  }

  if (input.facts?.destinationVisitedBeforeCheckpointCompletion || input.facts?.checkpointsVisitedOutOfOrder) {
    reasonCodes.add("manual-attempt-checkpoint-order");
  } else if (
    input.facts?.startsAtRequiredNode &&
    input.facts.checkpointNodeIds.length > 0 &&
    !input.facts.checkpointsVisited
  ) {
    reasonCodes.add("manual-attempt-skipped-checkpoint");
  }

  if (
    input.facts?.startsAtRequiredNode &&
    !input.facts.endsAtRequiredNode &&
    !reasonCodes.has("manual-attempt-checkpoint-order") &&
    !reasonCodes.has("manual-attempt-skipped-checkpoint")
  ) {
    reasonCodes.add("manual-attempt-incomplete");
  }

  return reasonCodes;
}

function orderedManualAttemptReasonCodes(
  reasonCodes: ReadonlySet<OSMManualAttemptQaReason>
): OSMManualAttemptQaReason[] {
  return MANUAL_ATTEMPT_REASON_ORDER.filter((reason) => reasonCodes.has(reason));
}

function buildAttemptStopFacts(exerciseResult: RunRouteExerciseResult): AttemptStopFacts {
  return buildStopFacts({
    requiredNodeIds: exerciseResult.normalisedAttempt.requiredNodeIds,
    visitedNodeIds: exerciseResult.normalisedAttempt.selectedNodeIds
  });
}

function buildUnscoredAttemptStopFacts(exercise: RouteExercise, visitedNodeIds: readonly string[]): AttemptStopFacts {
  return buildStopFacts({
    requiredNodeIds: exercise.stops
      .map((stop) => (stop.type === "node" ? stop.nodeId : null))
      .filter((nodeId): nodeId is string => Boolean(nodeId)),
    visitedNodeIds: [...visitedNodeIds]
  });
}

function buildStopFacts(input: {
  requiredNodeIds: readonly string[];
  visitedNodeIds: readonly string[];
}): AttemptStopFacts {
  const requiredNodeIds = [...input.requiredNodeIds];
  const visitedNodeIds = [...input.visitedNodeIds];
  const checkpointNodeIds = requiredNodeIds.slice(1, -1);
  const destinationNodeId = requiredNodeIds.at(-1);
  const destinationIndex = destinationNodeId ? visitedNodeIds.indexOf(destinationNodeId) : -1;
  const checkpointsVisited = checkpointNodeIds.every((checkpointNodeId) => visitedNodeIds.includes(checkpointNodeId));
  const checkpointVisitIndexes = checkpointNodeIds.map((checkpointNodeId) => visitedNodeIds.indexOf(checkpointNodeId));
  const checkpointsVisitedOutOfOrder =
    checkpointVisitIndexes.every((index) => index !== -1) &&
    checkpointVisitIndexes.some((index, checkpointIndex) => {
      const previousCheckpointIndex = checkpointVisitIndexes[checkpointIndex - 1];

      return checkpointIndex > 0 && previousCheckpointIndex !== undefined && index <= previousCheckpointIndex;
    });
  const destinationVisitedBeforeCheckpointCompletion =
    destinationIndex !== -1 &&
    checkpointNodeIds.some((checkpointNodeId) => {
      const checkpointIndex = visitedNodeIds.indexOf(checkpointNodeId);

      return checkpointIndex === -1 || destinationIndex < checkpointIndex;
    });

  return {
    requiredNodeIds,
    visitedNodeIds,
    startsAtRequiredNode: visitedNodeIds[0] === requiredNodeIds[0],
    endsAtRequiredNode: visitedNodeIds.at(-1) === destinationNodeId,
    checkpointNodeIds,
    checkpointsVisited,
    checkpointsVisitedOutOfOrder,
    destinationVisitedBeforeCheckpointCompletion
  };
}

function attemptLeavesRenderBounds(
  graph: MapGraph,
  renderBounds: RouteRunnerMapBounds,
  nodeIds: readonly string[]
): boolean {
  return nodeIds.some((nodeId) => {
    const node = graph.nodesById[nodeId];

    return (
      node &&
      (node.x < renderBounds.minX ||
        node.x > renderBounds.maxX ||
        node.y < renderBounds.minY ||
        node.y > renderBounds.maxY)
    );
  });
}
