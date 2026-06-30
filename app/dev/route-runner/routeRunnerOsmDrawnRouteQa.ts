import {
  buildIllegalDrawnMovementHighlights,
  buildMapGraph,
  createDrawnRouteTrace,
  findShortestLegalRouteThroughStops,
  runDrawnRoutePipeline,
  validateDirectedEdgePath,
  type DirectedEdge,
  type DrawnRoutePipelineResult,
  type DrawnRouteTrace,
  type MapDefinition,
  type MapGraph,
  type RouteExercise,
  type Vec2
} from "../../../lib/map-engine/index.ts";
import { buildRouteAttemptReview, type RouteAttemptReview } from "./routeAttemptReview.ts";

export type OsmDrawnRouteQaFailureReason =
  | "missing-exercise"
  | "missing-start-node"
  | "missing-destination-node"
  | "missing-checkpoint-node"
  | "missing-reveal-route"
  | "drawn-route-empty"
  | "drawn-route-unmatched"
  | "unknown-route-edge"
  | "illegal-directed-edge"
  | "checkpoint-order-failed"
  | "accepted-route-expected"
  | "unexpected-illegal-highlight"
  | "non-deterministic-review";

export type OsmDrawnRouteQaReport = {
  isValid: boolean;
  mapId: string;
  exerciseId: string;
  failureReasonCodes: OsmDrawnRouteQaFailureReason[];
  failureMessages: string[];
  expectedRouteEdgeIds: string[];
  drawnPointCount: number;
  pipelineStatus: DrawnRoutePipelineResult["status"] | null;
  matchingStatus: string | null;
  reviewStatus: RouteAttemptReview["status"] | null;
  scorePassed: boolean | null;
  matchedDirectedEdgeIds: string[];
  matchedRoadIds: string[];
  matchedNodeIds: string[];
  illegalMovementTypes: string[];
  illegalHighlightIds: string[];
  illegalHighlightKinds: string[];
  warningCodes: string[];
  reviewSignature: string | null;
  pipelineResult: DrawnRoutePipelineResult | null;
  review: RouteAttemptReview | null;
};

export type OsmDrawnRouteQaSuiteReport = {
  isValid: boolean;
  mapId: string;
  exerciseCount: number;
  reports: OsmDrawnRouteQaReport[];
  failureReasonCodes: OsmDrawnRouteQaFailureReason[];
  failureMessages: string[];
};

export type BuildOsmDrawnRouteQaReportInput = {
  map: MapDefinition;
  exercises: readonly RouteExercise[];
  exerciseId: string;
  graph?: MapGraph;
  drawnTrace?: DrawnRouteTrace;
  routeEdgeIds?: readonly string[];
  expectAccepted?: boolean;
  verifyDeterministicReview?: boolean;
};

const DRAWN_ROUTE_QA_FAILURE_REASON_ORDER: OsmDrawnRouteQaFailureReason[] = [
  "missing-exercise",
  "missing-start-node",
  "missing-destination-node",
  "missing-checkpoint-node",
  "missing-reveal-route",
  "drawn-route-empty",
  "drawn-route-unmatched",
  "unknown-route-edge",
  "illegal-directed-edge",
  "checkpoint-order-failed",
  "accepted-route-expected",
  "unexpected-illegal-highlight",
  "non-deterministic-review"
];

const DRAWN_ROUTE_PIPELINE_OPTIONS = {
  simplifyTolerance: 0,
  maximumSnapDistance: 10,
  maxCandidatesPerPoint: 5
} as const;

type NodeStopFacts =
  | {
      valid: true;
      stopNodeIds: string[];
      startNodeId: string;
      destinationNodeId: string;
      checkpointNodeIds: string[];
    }
  | {
      valid: false;
      stopNodeIds: string[];
      reasonCodes: Set<OsmDrawnRouteQaFailureReason>;
    };

type PipelineRun = {
  pipelineResult: DrawnRoutePipelineResult;
  review: RouteAttemptReview;
  illegalHighlightIds: string[];
  illegalHighlightKinds: string[];
};

export function buildOsmDrawnRouteQaSuiteReport(input: {
  map: MapDefinition;
  exercises: readonly RouteExercise[];
  graph?: MapGraph;
}): OsmDrawnRouteQaSuiteReport {
  const graph = input.graph ?? buildMapGraph(input.map);
  const reports = input.exercises.map((exercise) =>
    buildOsmDrawnRouteQaReport({
      map: input.map,
      exercises: input.exercises,
      exerciseId: exercise.id,
      graph,
      verifyDeterministicReview: true
    })
  );
  const failureReasonCodes = orderedDrawnRouteQaFailureReasonCodes(
    new Set(reports.flatMap((report) => report.failureReasonCodes))
  );
  const failureMessages = reports.flatMap((report) => report.failureMessages);

  return {
    isValid: reports.every((report) => report.isValid),
    mapId: input.map.id,
    exerciseCount: input.exercises.length,
    reports,
    failureReasonCodes,
    failureMessages
  };
}

export function buildOsmDrawnRouteQaReport(input: BuildOsmDrawnRouteQaReportInput): OsmDrawnRouteQaReport {
  const graph = input.graph ?? buildMapGraph(input.map);
  const exercise = input.exercises.find((candidate) => candidate.id === input.exerciseId);
  const expectAccepted = input.expectAccepted ?? true;
  const reasonCodes = new Set<OsmDrawnRouteQaFailureReason>();

  if (!exercise) {
    reasonCodes.add("missing-exercise");

    return buildReport({
      mapId: input.map.id,
      exerciseId: input.exerciseId,
      reasonCodes,
      expectedRouteEdgeIds: [],
      drawnTrace: input.drawnTrace ?? createDrawnRouteTrace(),
      pipelineRun: null
    });
  }

  const stopFacts = buildNodeStopFacts(graph, exercise);

  for (const reasonCode of stopFacts.valid ? [] : stopFacts.reasonCodes) {
    reasonCodes.add(reasonCode);
  }

  const revealRoute = stopFacts.valid
    ? findShortestLegalRouteThroughStops({
        graph,
        stopNodeIds: stopFacts.stopNodeIds,
        restrictions: input.map.restrictions
      })
    : null;

  if (!input.routeEdgeIds && !input.drawnTrace && revealRoute && !revealRoute.found) {
    reasonCodes.add("missing-reveal-route");
  }

  const expectedRouteEdgeIds = input.routeEdgeIds
    ? [...input.routeEdgeIds]
    : revealRoute && revealRoute.found
      ? [...revealRoute.edgeIds]
      : [];
  const unknownRouteEdgeIds = expectedRouteEdgeIds.filter((edgeId) => !graph.edgesById[edgeId]);

  if (unknownRouteEdgeIds.length > 0) {
    reasonCodes.add("unknown-route-edge");

    return buildReport({
      mapId: input.map.id,
      exerciseId: input.exerciseId,
      reasonCodes,
      expectedRouteEdgeIds,
      drawnTrace: input.drawnTrace ?? createDrawnRouteTrace(),
      pipelineRun: null,
      extraMessageDetails: [`unknownEdges=${unknownRouteEdgeIds.join(",")}`]
    });
  }

  if (
    expectedRouteEdgeIds.length > 0 &&
    !validateDirectedEdgePath({
      graph,
      edgeIds: expectedRouteEdgeIds,
      restrictions: input.map.restrictions
    }).valid
  ) {
    reasonCodes.add("illegal-directed-edge");
  }

  const drawnTrace = input.drawnTrace ?? buildOsmDrawnRouteTraceFromEdgeIds(graph, expectedRouteEdgeIds);
  const pipelineRun = runDrawnRouteQaPipeline({
    map: input.map,
    exercises: input.exercises,
    exerciseId: input.exerciseId,
    drawnTrace
  });

  classifyPipelineFailureReasons({
    reasonCodes,
    pipelineRun,
    expectAccepted
  });

  if (input.verifyDeterministicReview) {
    const repeatRun = runDrawnRouteQaPipeline({
      map: input.map,
      exercises: input.exercises,
      exerciseId: input.exerciseId,
      drawnTrace
    });

    if (stableDrawnRouteQaSignature(pipelineRun) !== stableDrawnRouteQaSignature(repeatRun)) {
      reasonCodes.add("non-deterministic-review");
    }
  }

  return buildReport({
    mapId: input.map.id,
    exerciseId: input.exerciseId,
    reasonCodes,
    expectedRouteEdgeIds,
    drawnTrace,
    pipelineRun
  });
}

export function buildOsmDrawnRouteTraceFromEdgeIds(graph: MapGraph, edgeIds: readonly string[]): DrawnRouteTrace {
  const points = edgeIds.flatMap((edgeId) => {
    const edge = graph.edgesById[edgeId];

    if (!edge) {
      return [];
    }

    return interiorPointsForDirectedEdge(graph, edge);
  });

  return createDrawnRouteTrace(points);
}

export function stableOsmDrawnRouteQaReportSummary(report: OsmDrawnRouteQaReport): object {
  return {
    isValid: report.isValid,
    mapId: report.mapId,
    exerciseId: report.exerciseId,
    failureReasonCodes: report.failureReasonCodes,
    expectedRouteEdgeIds: report.expectedRouteEdgeIds,
    drawnPointCount: report.drawnPointCount,
    pipelineStatus: report.pipelineStatus,
    matchingStatus: report.matchingStatus,
    reviewStatus: report.reviewStatus,
    scorePassed: report.scorePassed,
    matchedDirectedEdgeIds: report.matchedDirectedEdgeIds,
    matchedRoadIds: report.matchedRoadIds,
    matchedNodeIds: report.matchedNodeIds,
    illegalMovementTypes: report.illegalMovementTypes,
    illegalHighlightIds: report.illegalHighlightIds,
    illegalHighlightKinds: report.illegalHighlightKinds,
    warningCodes: report.warningCodes,
    reviewSignature: report.reviewSignature
  };
}

export function formatOsmDrawnRouteQaFailure(input: {
  reason: OsmDrawnRouteQaFailureReason;
  mapId: string;
  exerciseId: string;
  report: Pick<
    OsmDrawnRouteQaReport,
    "pipelineStatus" | "matchingStatus" | "reviewStatus" | "scorePassed" | "warningCodes"
  >;
  extraDetails?: readonly string[];
}): string {
  const details = [
    input.reason,
    `map=${input.mapId}`,
    `exercise=${input.exerciseId}`,
    `pipeline=${input.report.pipelineStatus ?? "not-run"}`,
    `matching=${input.report.matchingStatus ?? "not-run"}`,
    `review=${input.report.reviewStatus ?? "not-run"}`,
    `passed=${input.report.scorePassed === null ? "n/a" : input.report.scorePassed ? "yes" : "no"}`
  ];

  if (input.report.warningCodes.length > 0) {
    details.push(`warnings=${input.report.warningCodes.join(",")}`);
  }

  if (input.extraDetails) {
    details.push(...input.extraDetails);
  }

  return details.join(" | ");
}

function runDrawnRouteQaPipeline(input: {
  map: MapDefinition;
  exercises: readonly RouteExercise[];
  exerciseId: string;
  drawnTrace: DrawnRouteTrace;
}): PipelineRun {
  const pipelineResult = runDrawnRoutePipeline({
    map: input.map,
    exercises: [...input.exercises],
    exerciseId: input.exerciseId,
    drawnTrace: input.drawnTrace,
    options: DRAWN_ROUTE_PIPELINE_OPTIONS
  });
  const illegalHighlights = buildIllegalDrawnMovementHighlights({
    map: input.map,
    illegalMovements: pipelineResult.exerciseResult?.score.legality.illegalMovements ?? [],
    scored: Boolean(pipelineResult.exerciseResult)
  });
  const review = buildRouteAttemptReview({
    pipelineResult,
    illegalMovements: illegalHighlights,
    isDrawing: false
  });

  return {
    pipelineResult,
    review,
    illegalHighlightIds: illegalHighlights.map((highlight) => highlight.id),
    illegalHighlightKinds: illegalHighlights.map((highlight) => highlight.kind)
  };
}

function classifyPipelineFailureReasons(input: {
  reasonCodes: Set<OsmDrawnRouteQaFailureReason>;
  pipelineRun: PipelineRun;
  expectAccepted: boolean;
}): void {
  const { pipelineResult, review, illegalHighlightIds } = input.pipelineRun;
  const score = pipelineResult.exerciseResult?.score;

  if (pipelineResult.status === "empty" || pipelineResult.simplifiedTrace.points.length === 0) {
    input.reasonCodes.add("drawn-route-empty");
  }

  if (
    pipelineResult.status === "insufficient_points" ||
    pipelineResult.status === "snapping_failed" ||
    pipelineResult.status === "matching_failed" ||
    pipelineResult.matchResult?.status === "unmatched" ||
    pipelineResult.matchResult?.status === "disconnected"
  ) {
    input.reasonCodes.add("drawn-route-unmatched");
  }

  if (
    score?.legality.illegalMovements.some((movement) =>
      ["wrong_way_one_way", "no_entry", "road_closed", "restricted_road", "prohibited_turn"].includes(movement.type)
    )
  ) {
    input.reasonCodes.add("illegal-directed-edge");
  }

  if (score?.failureReasons.includes("missed_required_stop")) {
    input.reasonCodes.add("checkpoint-order-failed");
  }

  if (input.expectAccepted && (pipelineResult.status !== "scored" || review.status !== "pass" || score?.passed !== true)) {
    input.reasonCodes.add("accepted-route-expected");
  }

  if (input.expectAccepted && illegalHighlightIds.length > 0) {
    input.reasonCodes.add("unexpected-illegal-highlight");
  }
}

function buildReport(input: {
  mapId: string;
  exerciseId: string;
  reasonCodes: Set<OsmDrawnRouteQaFailureReason>;
  expectedRouteEdgeIds: string[];
  drawnTrace: DrawnRouteTrace;
  pipelineRun: PipelineRun | null;
  extraMessageDetails?: readonly string[];
}): OsmDrawnRouteQaReport {
  const pipelineResult = input.pipelineRun?.pipelineResult ?? null;
  const review = input.pipelineRun?.review ?? null;
  const failureReasonCodes = orderedDrawnRouteQaFailureReasonCodes(input.reasonCodes);
  const baseReport = {
    pipelineStatus: pipelineResult?.status ?? null,
    matchingStatus: pipelineResult?.matchResult?.status ?? null,
    reviewStatus: review?.status ?? null,
    scorePassed: pipelineResult?.exerciseResult?.score.passed ?? null,
    warningCodes: pipelineResult?.warnings.map((warning) => warning.code) ?? []
  };

  return {
    isValid: failureReasonCodes.length === 0,
    mapId: input.mapId,
    exerciseId: input.exerciseId,
    failureReasonCodes,
    failureMessages: failureReasonCodes.map((reason) =>
      formatOsmDrawnRouteQaFailure({
        reason,
        mapId: input.mapId,
        exerciseId: input.exerciseId,
        report: baseReport,
        extraDetails: input.extraMessageDetails
      })
    ),
    expectedRouteEdgeIds: [...input.expectedRouteEdgeIds],
    drawnPointCount: input.drawnTrace.points.length,
    pipelineStatus: baseReport.pipelineStatus,
    matchingStatus: baseReport.matchingStatus,
    reviewStatus: baseReport.reviewStatus,
    scorePassed: baseReport.scorePassed,
    matchedDirectedEdgeIds: pipelineResult?.matchResult?.directedEdgeIds ?? [],
    matchedRoadIds: pipelineResult?.matchResult?.orderedRoadIds ?? [],
    matchedNodeIds: pipelineResult?.matchResult?.nodeIds ?? [],
    illegalMovementTypes:
      pipelineResult?.exerciseResult?.score.legality.illegalMovements.map((movement) => movement.type) ?? [],
    illegalHighlightIds: input.pipelineRun?.illegalHighlightIds ?? [],
    illegalHighlightKinds: input.pipelineRun?.illegalHighlightKinds ?? [],
    warningCodes: baseReport.warningCodes,
    reviewSignature: input.pipelineRun ? stableDrawnRouteQaSignature(input.pipelineRun) : null,
    pipelineResult,
    review
  };
}

function buildNodeStopFacts(graph: MapGraph, exercise: RouteExercise): NodeStopFacts {
  const reasonCodes = new Set<OsmDrawnRouteQaFailureReason>();
  const stopNodeIds = exercise.stops
    .map((stop) => (stop.type === "node" ? stop.nodeId : null))
    .filter((nodeId): nodeId is string => Boolean(nodeId));
  const startNodeId = stopNodeIds[0];
  const destinationNodeId = stopNodeIds.at(-1);
  const checkpointNodeIds = stopNodeIds.slice(1, -1);

  if (!startNodeId || !graph.nodesById[startNodeId]) {
    reasonCodes.add("missing-start-node");
  }

  if (!destinationNodeId || !graph.nodesById[destinationNodeId]) {
    reasonCodes.add("missing-destination-node");
  }

  for (const checkpointNodeId of checkpointNodeIds) {
    if (!graph.nodesById[checkpointNodeId]) {
      reasonCodes.add("missing-checkpoint-node");
    }
  }

  if (reasonCodes.size > 0 || !startNodeId || !destinationNodeId) {
    return {
      valid: false,
      stopNodeIds,
      reasonCodes
    };
  }

  return {
    valid: true,
    stopNodeIds,
    startNodeId,
    destinationNodeId,
    checkpointNodeIds
  };
}

function interiorPointsForDirectedEdge(graph: MapGraph, edge: DirectedEdge): Vec2[] {
  const fromNode = graph.nodesById[edge.fromNodeId];
  const toNode = graph.nodesById[edge.toNodeId];

  if (!fromNode || !toNode) {
    return [];
  }

  return [0.12, 0.5, 0.88].map((ratio) => ({
    x: fromNode.x + (toNode.x - fromNode.x) * ratio,
    y: fromNode.y + (toNode.y - fromNode.y) * ratio
  }));
}

function stableDrawnRouteQaSignature(run: PipelineRun): string {
  const score = run.pipelineResult.exerciseResult?.score;

  return JSON.stringify({
    pipelineStatus: run.pipelineResult.status,
    matchingStatus: run.pipelineResult.matchResult?.status ?? null,
    matchedDirectedEdgeIds: run.pipelineResult.matchResult?.directedEdgeIds ?? [],
    matchedRoadIds: run.pipelineResult.matchResult?.orderedRoadIds ?? [],
    matchedNodeIds: run.pipelineResult.matchResult?.nodeIds ?? [],
    warningCodes: run.pipelineResult.warnings.map((warning) => warning.code),
    scorePassed: score?.passed ?? null,
    scorePercent: score?.scorePercent ?? null,
    failureReasons: score?.failureReasons ?? [],
    illegalMovementTypes: score?.legality.illegalMovements.map((movement) => movement.type) ?? [],
    illegalHighlightIds: run.illegalHighlightIds,
    illegalHighlightKinds: run.illegalHighlightKinds,
    review: {
      status: run.review.status,
      title: run.review.title,
      scoreLabel: run.review.scoreLabel,
      distanceLabel: run.review.distanceLabel,
      illegalMovementIds: run.review.illegalMovements.map((item) => item.id),
      missedRestrictionIds: run.review.missedRestrictions.map((item) => item.id),
      suggestedFailureReason: run.review.suggestedFailureReason,
      correctionHints: run.review.correctionHints,
      practiceRecommendationIds: run.review.practiceRecommendations.map((item) => item.id),
      recommendedPracticeQueueIds: run.review.recommendedPracticeQueue.map((item) => item.id)
    }
  });
}

function orderedDrawnRouteQaFailureReasonCodes(
  reasonCodes: ReadonlySet<OsmDrawnRouteQaFailureReason>
): OsmDrawnRouteQaFailureReason[] {
  return DRAWN_ROUTE_QA_FAILURE_REASON_ORDER.filter((reason) => reasonCodes.has(reason));
}
