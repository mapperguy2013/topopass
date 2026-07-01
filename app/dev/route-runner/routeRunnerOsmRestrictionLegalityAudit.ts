import {
  buildMapGraph,
  checkRouteLegality,
  validateDirectedEdgePath,
  type AttemptedRouteMovement,
  type DirectedEdge,
  type IllegalMovementType,
  type MapDefinition,
  type MapGraph,
  type MapRestriction,
  type MapRoad,
  type RouteExercise
} from "../../../lib/map-engine/index.ts";
import { buildFastestRouteOverlay } from "./fastestRouteOverlay.ts";
import { validateOsmManualAttemptQa } from "./routeRunnerOsmManualAttemptQa.ts";

export type OsmRestrictionLegalityAuditCheckId =
  | "legal-osm-movement"
  | "one-way-forward-legality"
  | "one-way-reverse-legality"
  | "blocked-edge-legality"
  | "unknown-reference-legality"
  | "unknown-edge-legality"
  | "mixed-movement-legality"
  | "generated-route-legality"
  | "manual-attempt-illegal-feedback";

export type OsmRestrictionLegalityAuditFailureReason =
  | "missing-graph-edge"
  | "missing-one-way-road"
  | "legal-movement-rejected"
  | "one-way-forward-rejected"
  | "one-way-reverse-accepted"
  | "blocked-edge-accepted"
  | "blocked-edge-path-accepted"
  | "unknown-reference-accepted"
  | "unknown-edge-accepted"
  | "mixed-illegal-movement-missing"
  | "generated-route-unavailable"
  | "generated-route-blocked-edge"
  | "generated-route-illegal-movement"
  | "manual-attempt-unexpectedly-accepted"
  | "manual-attempt-illegal-reason-missing"
  | "manual-attempt-illegal-feedback-missing";

export type OsmRestrictionLegalityAuditCheck = {
  id: OsmRestrictionLegalityAuditCheckId;
  status: "pass" | "fail";
  mapId: string;
  exerciseId?: string;
  checkedRoadId?: string;
  checkedEdgeId?: string;
  failureReasonCodes: OsmRestrictionLegalityAuditFailureReason[];
  illegalMovementTypes: IllegalMovementType[];
  messages: string[];
};

export type OsmRestrictionLegalityAuditReport = {
  isValid: boolean;
  mapId: string;
  exerciseCount: number;
  checks: OsmRestrictionLegalityAuditCheck[];
  failureReasonCodes: OsmRestrictionLegalityAuditFailureReason[];
  failureMessages: string[];
};

type AuditInput = {
  map: MapDefinition;
  exercises: readonly RouteExercise[];
  graph?: MapGraph;
};

type AuditCheckInput = Required<AuditInput>;

function movementFromEdge(edge: DirectedEdge): AttemptedRouteMovement {
  return {
    roadId: edge.roadId,
    fromNodeId: edge.fromNodeId,
    toNodeId: edge.toNodeId
  };
}

function reverseMovementFromRoad(road: MapRoad): AttemptedRouteMovement {
  return {
    roadId: road.id,
    fromNodeId: road.toNodeId,
    toNodeId: road.fromNodeId
  };
}

function edgeForRoad(graph: MapGraph, road: MapRoad): DirectedEdge | null {
  return (
    graph.edges.find(
      (edge) => edge.roadId === road.id && edge.fromNodeId === road.fromNodeId && edge.toNodeId === road.toNodeId
    ) ?? null
  );
}

function firstOneWayRoad(map: MapDefinition): MapRoad | null {
  return map.roads.find((road) => road.isOneWay) ?? null;
}

function firstPlayableEdge(graph: MapGraph): DirectedEdge | null {
  return graph.edges[0] ?? null;
}

function withRoadClosure(map: MapDefinition, road: MapRoad): MapDefinition {
  const closure: Extract<MapRestriction, { type: "road_closed" }> = {
    id: `osm-legality-audit-road-closed-${road.id}`,
    type: "road_closed",
    roadId: road.id
  };

  return {
    ...map,
    restrictions: [...map.restrictions, closure]
  };
}

function check(input: {
  id: OsmRestrictionLegalityAuditCheckId;
  mapId: string;
  exerciseId?: string;
  checkedRoadId?: string;
  checkedEdgeId?: string;
  failureReasonCodes?: OsmRestrictionLegalityAuditFailureReason[];
  illegalMovementTypes?: IllegalMovementType[];
  messages?: string[];
}): OsmRestrictionLegalityAuditCheck {
  const failureReasonCodes = input.failureReasonCodes ?? [];

  return {
    id: input.id,
    status: failureReasonCodes.length === 0 ? "pass" : "fail",
    mapId: input.mapId,
    exerciseId: input.exerciseId,
    checkedRoadId: input.checkedRoadId,
    checkedEdgeId: input.checkedEdgeId,
    failureReasonCodes,
    illegalMovementTypes: input.illegalMovementTypes ?? [],
    messages: input.messages ?? []
  };
}

function legalOsmMovementCheck(input: AuditCheckInput): OsmRestrictionLegalityAuditCheck {
  const edge = firstPlayableEdge(input.graph);

  if (!edge) {
    return check({
      id: "legal-osm-movement",
      mapId: input.map.id,
      failureReasonCodes: ["missing-graph-edge"],
      messages: [`${input.map.id} has no playable directed edge for legality audit.`]
    });
  }

  const result = checkRouteLegality({
    map: input.map,
    movements: [movementFromEdge(edge)]
  });

  return check({
    id: "legal-osm-movement",
    mapId: input.map.id,
    checkedRoadId: edge.roadId,
    checkedEdgeId: edge.id,
    failureReasonCodes: result.isLegal ? [] : ["legal-movement-rejected"],
    illegalMovementTypes: result.illegalMovements.map((movement) => movement.type),
    messages: result.illegalMovements.map((movement) => movement.message)
  });
}

function oneWayForwardLegalityCheck(input: AuditCheckInput): OsmRestrictionLegalityAuditCheck {
  const road = firstOneWayRoad(input.map);
  const edge = road ? edgeForRoad(input.graph, road) : null;

  if (!road || !edge) {
    return check({
      id: "one-way-forward-legality",
      mapId: input.map.id,
      failureReasonCodes: ["missing-one-way-road"],
      messages: [`${input.map.id} has no one-way road with a matching directed edge for legality audit.`]
    });
  }

  const result = checkRouteLegality({
    map: input.map,
    movements: [movementFromEdge(edge)]
  });

  return check({
    id: "one-way-forward-legality",
    mapId: input.map.id,
    checkedRoadId: road.id,
    checkedEdgeId: edge.id,
    failureReasonCodes: result.isLegal ? [] : ["one-way-forward-rejected"],
    illegalMovementTypes: result.illegalMovements.map((movement) => movement.type),
    messages: result.illegalMovements.map((movement) => movement.message)
  });
}

function oneWayReverseLegalityCheck(input: AuditCheckInput): OsmRestrictionLegalityAuditCheck {
  const road = firstOneWayRoad(input.map);

  if (!road) {
    return check({
      id: "one-way-reverse-legality",
      mapId: input.map.id,
      failureReasonCodes: ["missing-one-way-road"],
      messages: [`${input.map.id} has no one-way road for reverse legality audit.`]
    });
  }

  const result = checkRouteLegality({
    map: input.map,
    movements: [reverseMovementFromRoad(road)]
  });
  const hasWrongWay = result.illegalMovements.some((movement) => movement.type === "wrong_way_one_way");

  return check({
    id: "one-way-reverse-legality",
    mapId: input.map.id,
    checkedRoadId: road.id,
    failureReasonCodes: !result.isLegal && hasWrongWay ? [] : ["one-way-reverse-accepted"],
    illegalMovementTypes: result.illegalMovements.map((movement) => movement.type),
    messages: result.illegalMovements.map((movement) => movement.message)
  });
}

function blockedEdgeLegalityCheck(input: AuditCheckInput): OsmRestrictionLegalityAuditCheck {
  const edge = firstPlayableEdge(input.graph);
  const road = edge ? input.graph.roadsById[edge.roadId] : null;

  if (!edge || !road) {
    return check({
      id: "blocked-edge-legality",
      mapId: input.map.id,
      failureReasonCodes: ["missing-graph-edge"],
      messages: [`${input.map.id} has no playable directed edge for blocked-edge legality audit.`]
    });
  }

  const restrictedMap = withRoadClosure(input.map, road);
  const legality = checkRouteLegality({
    map: restrictedMap,
    movements: [movementFromEdge(edge)]
  });
  const edgePath = validateDirectedEdgePath({
    graph: input.graph,
    edgeIds: [edge.id],
    restrictions: restrictedMap.restrictions
  });
  const failureReasonCodes: OsmRestrictionLegalityAuditFailureReason[] = [];

  if (legality.isLegal || !legality.illegalMovements.some((movement) => movement.type === "road_closed")) {
    failureReasonCodes.push("blocked-edge-accepted");
  }

  if (edgePath.valid) {
    failureReasonCodes.push("blocked-edge-path-accepted");
  }

  return check({
    id: "blocked-edge-legality",
    mapId: input.map.id,
    checkedRoadId: road.id,
    checkedEdgeId: edge.id,
    failureReasonCodes,
    illegalMovementTypes: legality.illegalMovements.map((movement) => movement.type),
    messages: [...legality.illegalMovements.map((movement) => movement.message), ...edgePath.invalidEdgeKeys]
  });
}

function unknownReferenceLegalityCheck(input: AuditCheckInput): OsmRestrictionLegalityAuditCheck {
  const edge = firstPlayableEdge(input.graph);

  if (!edge) {
    return check({
      id: "unknown-reference-legality",
      mapId: input.map.id,
      failureReasonCodes: ["missing-graph-edge"],
      messages: [`${input.map.id} has no playable directed edge for unknown-reference legality audit.`]
    });
  }

  const result = checkRouteLegality({
    map: input.map,
    movements: [
      {
        roadId: "osm-legality-audit-missing-road",
        fromNodeId: edge.fromNodeId,
        toNodeId: edge.toNodeId
      },
      {
        roadId: edge.roadId,
        fromNodeId: "osm-legality-audit-missing-node",
        toNodeId: edge.toNodeId
      }
    ]
  });
  const disconnectedCount = result.illegalMovements.filter(
    (movement) => movement.type === "disconnected_road_jump"
  ).length;

  return check({
    id: "unknown-reference-legality",
    mapId: input.map.id,
    checkedEdgeId: edge.id,
    failureReasonCodes: !result.isLegal && disconnectedCount >= 2 ? [] : ["unknown-reference-accepted"],
    illegalMovementTypes: result.illegalMovements.map((movement) => movement.type),
    messages: result.illegalMovements.map((movement) => movement.message)
  });
}

function unknownEdgeLegalityCheck(input: AuditCheckInput): OsmRestrictionLegalityAuditCheck {
  const unknownEdgeId = "osm-legality-audit-missing-edge";
  const edgePath = validateDirectedEdgePath({
    graph: input.graph,
    edgeIds: [unknownEdgeId],
    restrictions: input.map.restrictions
  });

  return check({
    id: "unknown-edge-legality",
    mapId: input.map.id,
    failureReasonCodes: !edgePath.valid && edgePath.invalidEdgeKeys.includes(unknownEdgeId) ? [] : ["unknown-edge-accepted"],
    messages: edgePath.invalidEdgeKeys
  });
}

function mixedMovementLegalityCheck(input: AuditCheckInput): OsmRestrictionLegalityAuditCheck {
  const road = firstOneWayRoad(input.map);
  const edge = road ? edgeForRoad(input.graph, road) : null;

  if (!road || !edge) {
    return check({
      id: "mixed-movement-legality",
      mapId: input.map.id,
      failureReasonCodes: ["missing-one-way-road"],
      messages: [`${input.map.id} has no one-way road with a matching directed edge for mixed legality audit.`]
    });
  }

  const result = checkRouteLegality({
    map: input.map,
    movements: [movementFromEdge(edge), reverseMovementFromRoad(road)]
  });
  const illegalMovementTypes = result.illegalMovements.map((movement) => movement.type);
  const hasExpectedIllegalMovement =
    illegalMovementTypes.includes("wrong_way_one_way") && illegalMovementTypes.includes("no_u_turn");

  return check({
    id: "mixed-movement-legality",
    mapId: input.map.id,
    checkedRoadId: road.id,
    checkedEdgeId: edge.id,
    failureReasonCodes: !result.isLegal && hasExpectedIllegalMovement ? [] : ["mixed-illegal-movement-missing"],
    illegalMovementTypes,
    messages: result.illegalMovements.map((movement) => movement.message)
  });
}

function generatedRouteLegalityCheck(input: AuditCheckInput): OsmRestrictionLegalityAuditCheck {
  const failureReasonCodes: OsmRestrictionLegalityAuditFailureReason[] = [];
  const messages: string[] = [];
  const illegalMovementTypes: IllegalMovementType[] = [];

  for (const exercise of input.exercises) {
    const overlay = buildFastestRouteOverlay({
      map: input.map,
      exercise,
      revealState: { visible: true },
      graph: input.graph
    });

    if (overlay.status !== "available") {
      failureReasonCodes.push("generated-route-unavailable");
      messages.push(`${exercise.id}: ${overlay.message ?? "fastest route unavailable"}`);
      continue;
    }

    const edgePath = validateDirectedEdgePath({
      graph: input.graph,
      edgeIds: overlay.edgeIds,
      restrictions: input.map.restrictions
    });

    if (!edgePath.valid) {
      failureReasonCodes.push("generated-route-blocked-edge");
      messages.push(`${exercise.id}: ${edgePath.invalidEdgeKeys.join(",")}`);
    }

    const legality = checkRouteLegality({
      map: input.map,
      movements: overlay.edgeIds.map((edgeId) => input.graph.edgesById[edgeId]).filter(Boolean).map(movementFromEdge)
    });

    if (!legality.isLegal) {
      failureReasonCodes.push("generated-route-illegal-movement");
      illegalMovementTypes.push(...legality.illegalMovements.map((movement) => movement.type));
      messages.push(...legality.illegalMovements.map((movement) => `${exercise.id}: ${movement.message}`));
    }
  }

  return check({
    id: "generated-route-legality",
    mapId: input.map.id,
    failureReasonCodes: unique(failureReasonCodes),
    illegalMovementTypes: unique(illegalMovementTypes),
    messages
  });
}

function manualAttemptIllegalFeedbackCheck(input: AuditCheckInput): OsmRestrictionLegalityAuditCheck {
  const road = firstOneWayRoad(input.map);
  const exercise = input.exercises[0];

  if (!road || !exercise) {
    return check({
      id: "manual-attempt-illegal-feedback",
      mapId: input.map.id,
      exerciseId: exercise?.id,
      failureReasonCodes: road ? ["generated-route-unavailable"] : ["missing-one-way-road"],
      messages: [`${input.map.id} cannot build manual illegal-attempt audit input.`]
    });
  }

  const report = validateOsmManualAttemptQa({
    map: input.map,
    exercises: input.exercises,
    exerciseId: exercise.id,
    attempt: {
      nodeIds: [road.toNodeId, road.fromNodeId],
      roadIds: [road.id]
    },
    graph: input.graph
  });
  const failureReasonCodes: OsmRestrictionLegalityAuditFailureReason[] = [];

  if (report.isAccepted) {
    failureReasonCodes.push("manual-attempt-unexpectedly-accepted");
  }

  if (
    !report.reasonCodes.includes("manual-attempt-blocked-directed-edge") ||
    !report.illegalMovementTypes.includes("wrong_way_one_way")
  ) {
    failureReasonCodes.push("manual-attempt-illegal-reason-missing");
  }

  if (!report.feedbackItemIds.some((itemId) => itemId.includes("one-way-wrong-direction"))) {
    failureReasonCodes.push("manual-attempt-illegal-feedback-missing");
  }

  return check({
    id: "manual-attempt-illegal-feedback",
    mapId: input.map.id,
    exerciseId: exercise.id,
    checkedRoadId: road.id,
    failureReasonCodes,
    illegalMovementTypes: report.illegalMovementTypes as IllegalMovementType[],
    messages: report.messages
  });
}

export function buildOsmRestrictionLegalityAuditReport(input: AuditInput): OsmRestrictionLegalityAuditReport {
  const graph = input.graph ?? buildMapGraph(input.map);
  const resolvedInput: AuditCheckInput = {
    map: input.map,
    exercises: input.exercises,
    graph
  };
  const checks = [
    legalOsmMovementCheck(resolvedInput),
    oneWayForwardLegalityCheck(resolvedInput),
    oneWayReverseLegalityCheck(resolvedInput),
    blockedEdgeLegalityCheck(resolvedInput),
    unknownReferenceLegalityCheck(resolvedInput),
    unknownEdgeLegalityCheck(resolvedInput),
    mixedMovementLegalityCheck(resolvedInput),
    generatedRouteLegalityCheck(resolvedInput),
    manualAttemptIllegalFeedbackCheck(resolvedInput)
  ];
  const failureReasonCodes = unique(checks.flatMap((entry) => entry.failureReasonCodes));
  const failureMessages = checks.flatMap((entry) =>
    entry.failureReasonCodes.length === 0
      ? []
      : entry.messages.length > 0
        ? entry.messages.map((message) => `${entry.id} | ${message}`)
        : [`${entry.id} | ${entry.failureReasonCodes.join(",")}`]
  );

  return {
    isValid: failureReasonCodes.length === 0,
    mapId: input.map.id,
    exerciseCount: input.exercises.length,
    checks,
    failureReasonCodes,
    failureMessages
  };
}

function unique<TValue extends string>(values: readonly TValue[]): TValue[] {
  const seen = new Set<TValue>();
  const result: TValue[] = [];

  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }

  return result;
}
