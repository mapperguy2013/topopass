import {
  classifyRoadAccess,
  isPubliclyDrivable,
  roadAccessClasses,
  type OsmRoadProperties,
  type RoadAccessClass
} from "../map/osmRoadAccess.ts";
import {
  buildMapGraph,
  type DirectedEdge,
  type MapDefinition,
  type MapGraph,
  type MapRestriction,
  type MapRoad
} from "../map-engine/index.ts";
import type { ExerciseDifficulty } from "./learnerDriverTraining.ts";

export type LearnerRouteValidationStatus = "valid" | "invalid" | "warning";
export type LearnerRouteValidationIssueSeverity = "error" | "warning";

export type LearnerRouteValidationRuleCode =
  | "empty-route"
  | "unknown-road-segment"
  | "unknown-route-node"
  | "road-endpoint-mismatch"
  | "start-segment-invalid"
  | "end-segment-invalid"
  | "disconnected-route-jump"
  | "wrong-way-one-way"
  | "no-entry-restriction"
  | "closed-or-restricted-road"
  | "prohibited-turn"
  | "non-drivable-segment"
  | "access-metadata-unavailable"
  | "unknown-road-access"
  | "excessive-route-complexity"
  | "roundabout-complexity"
  | "route-length-out-of-bounds"
  | "estimated-time-out-of-bounds"
  | "duplicate-loop"
  | "unnecessary-backtracking"
  | "author-start-missing"
  | "author-destination-missing"
  | "author-route-missing"
  | "author-route-not-matched"
  | "author-metadata-incomplete"
  | "author-checkpoint-missing";

export type LearnerRouteValidationSegment = {
  id: string;
  roadId: string;
  fromNodeId: string;
  toNodeId: string;
};

export type LearnerRouteValidationIssue = {
  code: LearnerRouteValidationRuleCode;
  severity: LearnerRouteValidationIssueSeverity;
  routeSegmentIds: string[];
  roadIds: string[];
  nodeIds: string[];
  explanation: string;
};

export type LearnerRouteValidationMetrics = {
  routeDistanceMeters: number;
  estimatedTimeMinutes: number;
  segmentCount: number;
  turnCount: number;
  junctionDecisionCount: number;
  roundaboutSegmentCount: number;
  repeatedRoadCount: number;
};

export type LearnerRouteValidationConstraints = {
  minDistanceMeters?: number;
  maxDistanceMeters?: number;
  maxEstimatedTimeMinutes?: number;
  averageSpeedKmh?: number;
  maxSegmentCount?: number;
  maxTurnCount?: number;
  maxJunctionDecisionCount?: number;
  maxRoundaboutSegmentCount?: number;
  maxRepeatedRoadCount?: number;
};

export type ValidateLearnerRouteInput = {
  map: MapDefinition;
  routeSegments: readonly LearnerRouteValidationSegment[];
  difficulty: ExerciseDifficulty;
  constraints?: LearnerRouteValidationConstraints;
};

export type LearnerRouteValidationResult = {
  status: LearnerRouteValidationStatus;
  valid: boolean;
  blockingErrors: LearnerRouteValidationIssue[];
  advisoryWarnings: LearnerRouteValidationIssue[];
  affectedRouteSegmentIds: string[];
  ruleCodes: LearnerRouteValidationRuleCode[];
  explanation: string;
  metrics: LearnerRouteValidationMetrics;
};

type RouteRoadMetadata = {
  highway?: unknown;
  access?: unknown;
  vehicle?: unknown;
  motor_vehicle?: unknown;
  motorcar?: unknown;
  service?: unknown;
  oneway?: unknown;
  junction?: unknown;
  barrier?: unknown;
  rawTags?: Record<string, unknown>;
  rawTagEntries?: readonly [string, unknown][];
};

type RouteRoadWithOptionalMetadata = MapRoad & {
  metadata?: RouteRoadMetadata;
};

type SegmentContext = {
  segment: LearnerRouteValidationSegment;
  segmentIndex: number;
  road?: MapRoad;
  edge?: DirectedEdge;
  followsRoadEndpoints: boolean;
};

type DifficultyPracticalLimits = Required<
  Pick<
    LearnerRouteValidationConstraints,
    | "maxSegmentCount"
    | "maxTurnCount"
    | "maxJunctionDecisionCount"
    | "maxRoundaboutSegmentCount"
    | "maxRepeatedRoadCount"
    | "maxDistanceMeters"
    | "maxEstimatedTimeMinutes"
  >
>;

const DEFAULT_AVERAGE_SPEED_KMH = 20;

const difficultyPracticalLimits: Record<ExerciseDifficulty, DifficultyPracticalLimits> = {
  beginner: {
    maxSegmentCount: 5,
    maxTurnCount: 3,
    maxJunctionDecisionCount: 3,
    maxRoundaboutSegmentCount: 0,
    maxRepeatedRoadCount: 0,
    maxDistanceMeters: 1500,
    maxEstimatedTimeMinutes: 8
  },
  easy: {
    maxSegmentCount: 8,
    maxTurnCount: 5,
    maxJunctionDecisionCount: 5,
    maxRoundaboutSegmentCount: 1,
    maxRepeatedRoadCount: 0,
    maxDistanceMeters: 2500,
    maxEstimatedTimeMinutes: 12
  },
  intermediate: {
    maxSegmentCount: 14,
    maxTurnCount: 10,
    maxJunctionDecisionCount: 9,
    maxRoundaboutSegmentCount: 2,
    maxRepeatedRoadCount: 1,
    maxDistanceMeters: 5000,
    maxEstimatedTimeMinutes: 20
  },
  advanced: {
    maxSegmentCount: 24,
    maxTurnCount: 18,
    maxJunctionDecisionCount: 16,
    maxRoundaboutSegmentCount: 4,
    maxRepeatedRoadCount: 2,
    maxDistanceMeters: 9000,
    maxEstimatedTimeMinutes: 35
  }
};

function isNoEntryRestriction(
  restriction: MapRestriction
): restriction is Extract<MapRestriction, { type: "no_entry" }> {
  return restriction.type === "no_entry";
}

function isRoadClosedRestriction(
  restriction: MapRestriction
): restriction is Extract<MapRestriction, { type: "road_closed" }> {
  return restriction.type === "road_closed";
}

function isProhibitedTurnRestriction(
  restriction: MapRestriction
): restriction is Extract<MapRestriction, { type: "prohibited_turn" }> {
  return restriction.type === "prohibited_turn";
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function issue(input: {
  code: LearnerRouteValidationRuleCode;
  severity: LearnerRouteValidationIssueSeverity;
  routeSegmentIds?: readonly string[];
  roadIds?: readonly string[];
  nodeIds?: readonly string[];
  explanation: string;
}): LearnerRouteValidationIssue {
  return {
    code: input.code,
    severity: input.severity,
    routeSegmentIds: uniqueStrings(input.routeSegmentIds ?? []),
    roadIds: uniqueStrings(input.roadIds ?? []),
    nodeIds: uniqueStrings(input.nodeIds ?? []),
    explanation: input.explanation
  };
}

function roadMetadata(road: MapRoad): RouteRoadMetadata | null {
  const metadata = (road as RouteRoadWithOptionalMetadata).metadata;

  return metadata && typeof metadata === "object" ? metadata : null;
}

function rawTagEntriesToObject(value: unknown): Record<string, unknown> {
  if (!Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    value.filter(
      (entry): entry is [string, unknown] =>
        Array.isArray(entry) && entry.length === 2 && typeof entry[0] === "string"
    )
  );
}

function accessPropertiesForRoad(road: MapRoad): OsmRoadProperties | null {
  const metadata = roadMetadata(road);
  const rawTagEntries = rawTagEntriesToObject((metadata as Record<string, unknown> | null)?.rawTagEntries);
  const rawTags = metadata?.rawTags ?? rawTagEntries;
  const properties: OsmRoadProperties = {
    ...rawTags,
    highway: rawTags.highway ?? metadata?.highway,
    access: rawTags.access ?? metadata?.access,
    vehicle: rawTags.vehicle ?? metadata?.vehicle,
    motor_vehicle: rawTags.motor_vehicle ?? metadata?.motor_vehicle,
    motorcar: rawTags.motorcar ?? metadata?.motorcar,
    service: rawTags.service ?? metadata?.service,
    oneway: rawTags.oneway ?? metadata?.oneway,
    junction: rawTags.junction ?? metadata?.junction,
    barrier: rawTags.barrier ?? metadata?.barrier
  };
  const hasAccessMetadata = [
    properties.highway,
    properties.access,
    properties.vehicle,
    properties.motor_vehicle,
    properties.motorcar,
    properties.service,
    properties.oneway,
    properties.junction,
    properties.barrier
  ].some((value) => typeof value !== "undefined" && value !== null && String(value).trim() !== "");

  return hasAccessMetadata ? properties : null;
}

function routeSegmentFollowsRoadEndpoints(segment: LearnerRouteValidationSegment, road: MapRoad): boolean {
  return (
    (segment.fromNodeId === road.fromNodeId && segment.toNodeId === road.toNodeId) ||
    (segment.fromNodeId === road.toNodeId && segment.toNodeId === road.fromNodeId)
  );
}

function routeSegmentIsWrongWayOnOneWay(segment: LearnerRouteValidationSegment, road: MapRoad): boolean {
  return road.isOneWay && segment.fromNodeId === road.toNodeId && segment.toNodeId === road.fromNodeId;
}

function noEntryBlocksSegment(
  restriction: Extract<MapRestriction, { type: "no_entry" }>,
  segment: LearnerRouteValidationSegment
): boolean {
  if (restriction.roadId !== segment.roadId) {
    return false;
  }

  if (!restriction.fromNodeId || !restriction.toNodeId) {
    return true;
  }

  return restriction.fromNodeId === segment.fromNodeId && restriction.toNodeId === segment.toNodeId;
}

function restrictionDirectionMatchesEdge(
  restriction: Extract<MapRestriction, { type: "no_entry" }>,
  edge: DirectedEdge,
  road: MapRoad | undefined
): boolean {
  if (!restriction.fromNodeId || !restriction.toNodeId) {
    return true;
  }

  if (!road) {
    return restriction.fromNodeId === edge.fromNodeId && restriction.toNodeId === edge.toNodeId;
  }

  if (restriction.fromNodeId === road.fromNodeId && restriction.toNodeId === road.toNodeId) {
    return edge.direction === "forward";
  }

  if (restriction.fromNodeId === road.toNodeId && restriction.toNodeId === road.fromNodeId) {
    return edge.direction === "reverse";
  }

  return restriction.fromNodeId === edge.fromNodeId && restriction.toNodeId === edge.toNodeId;
}

function restrictionHasDistanceRange(restriction: Extract<MapRestriction, { type: "no_entry" }>): boolean {
  return Number.isFinite(restriction.blockedFromDistanceMeters) && Number.isFinite(restriction.blockedToDistanceMeters);
}

function edgeIsInsideBlockedDistanceRange(
  edge: DirectedEdge,
  restriction: Extract<MapRestriction, { type: "no_entry" }>
): boolean {
  if (!restrictionHasDistanceRange(restriction)) {
    return true;
  }

  const blockedStart = restriction.blockedFromDistanceMeters as number;
  const blockedEnd = restriction.blockedToDistanceMeters as number;
  const blockedMin = Math.min(blockedStart, blockedEnd);
  const blockedMax = Math.max(blockedStart, blockedEnd);
  const edgeMin = Math.min(edge.sourceFromDistanceMeters, edge.sourceToDistanceMeters);
  const edgeMax = Math.max(edge.sourceFromDistanceMeters, edge.sourceToDistanceMeters);

  return edgeMin >= blockedMin && edgeMax <= blockedMax;
}

function noEntryBlocksEdge(
  restriction: Extract<MapRestriction, { type: "no_entry" }>,
  edge: DirectedEdge,
  graph: MapGraph
): boolean {
  if (restriction.roadId !== edge.roadId) {
    return false;
  }

  return (
    restrictionDirectionMatchesEdge(restriction, edge, graph.roadsById[edge.roadId]) &&
    edgeIsInsideBlockedDistanceRange(edge, restriction)
  );
}

function noEntryBlocksContext(
  restriction: Extract<MapRestriction, { type: "no_entry" }>,
  context: SegmentContext,
  graph: MapGraph
): boolean {
  if (context.edge) {
    return noEntryBlocksEdge(restriction, context.edge, graph);
  }

  return noEntryBlocksSegment(restriction, context.segment);
}

function prohibitedTurnBlocksTransition(
  restriction: Extract<MapRestriction, { type: "prohibited_turn" }>,
  previousSegment: LearnerRouteValidationSegment,
  currentSegment: LearnerRouteValidationSegment
): boolean {
  return (
    restriction.fromRoadId === previousSegment.roadId &&
    restriction.viaNodeId === previousSegment.toNodeId &&
    restriction.toRoadId === currentSegment.roadId
  );
}

function routeSegmentMatchingEdge(
  graph: MapGraph,
  segment: LearnerRouteValidationSegment
): DirectedEdge | undefined {
  return graph.edges.find(
    (edge) =>
      edge.roadId === segment.roadId &&
      edge.fromNodeId === segment.fromNodeId &&
      edge.toNodeId === segment.toNodeId
  );
}

function segmentContext(
  graph: MapGraph,
  segment: LearnerRouteValidationSegment,
  segmentIndex: number
): SegmentContext {
  const road = graph.roadsById[segment.roadId];
  const edge = routeSegmentMatchingEdge(graph, segment);

  return {
    segment,
    segmentIndex,
    road,
    edge,
    followsRoadEndpoints: road ? routeSegmentFollowsRoadEndpoints(segment, road) || Boolean(edge) : false
  };
}

function unknownNodeIds(graph: MapGraph, segment: LearnerRouteValidationSegment): string[] {
  return [segment.fromNodeId, segment.toNodeId].filter((nodeId) => !graph.nodesById[nodeId]);
}

function accessClassLabel(accessClass: RoadAccessClass): string {
  return accessClass.replaceAll("_", " ");
}

function roadAccessIssue(
  context: SegmentContext,
  accessClass: RoadAccessClass
): LearnerRouteValidationIssue | null {
  const segment = context.segment;

  if (accessClass === roadAccessClasses.unknown) {
    return issue({
      code: "unknown-road-access",
      severity: "warning",
      routeSegmentIds: [segment.id],
      roadIds: [segment.roadId],
      explanation: `Segment ${segment.id} has road access metadata, but it is not specific enough to verify motor-vehicle access.`
    });
  }

  if (!isPubliclyDrivable(accessClass)) {
    return issue({
      code: "non-drivable-segment",
      severity: "error",
      routeSegmentIds: [segment.id],
      roadIds: [segment.roadId],
      explanation: `Segment ${segment.id} uses ${accessClassLabel(accessClass)} road metadata, so it is not valid for learner-driver routing.`
    });
  }

  return null;
}

function validateSingleSegment(
  graph: MapGraph,
  context: SegmentContext,
  restrictions: {
    noEntry: Array<Extract<MapRestriction, { type: "no_entry" }>>;
    roadClosed: Array<Extract<MapRestriction, { type: "road_closed" }>>;
  }
): LearnerRouteValidationIssue[] {
  const segment = context.segment;
  const issues: LearnerRouteValidationIssue[] = [];

  if (!context.road) {
    issues.push(
      issue({
        code: "unknown-road-segment",
        severity: "error",
        routeSegmentIds: [segment.id],
        roadIds: [segment.roadId],
        nodeIds: [segment.fromNodeId, segment.toNodeId],
        explanation: `Segment ${segment.id} references unknown road ${segment.roadId}.`
      })
    );
    return issues;
  }

  const missingNodes = unknownNodeIds(graph, segment);

  if (missingNodes.length > 0) {
    issues.push(
      issue({
        code: "unknown-route-node",
        severity: "error",
        routeSegmentIds: [segment.id],
        roadIds: [segment.roadId],
        nodeIds: missingNodes,
        explanation: `Segment ${segment.id} references unknown route node(s): ${missingNodes.join(", ")}.`
      })
    );
  }

  if (missingNodes.length === 0 && !context.followsRoadEndpoints) {
    issues.push(
      issue({
        code: "road-endpoint-mismatch",
        severity: "error",
        routeSegmentIds: [segment.id],
        roadIds: [segment.roadId],
        nodeIds: [segment.fromNodeId, segment.toNodeId],
        explanation: `Segment ${segment.id} does not follow the endpoints of road ${segment.roadId}.`
      })
    );
  }

  if (context.followsRoadEndpoints && routeSegmentIsWrongWayOnOneWay(segment, context.road)) {
    issues.push(
      issue({
        code: "wrong-way-one-way",
        severity: "error",
        routeSegmentIds: [segment.id],
        roadIds: [segment.roadId],
        nodeIds: [segment.fromNodeId, segment.toNodeId],
        explanation: `Segment ${segment.id} travels the wrong way on one-way road ${segment.roadId}.`
      })
    );
  }

  for (const restriction of restrictions.noEntry) {
    if (noEntryBlocksContext(restriction, context, graph)) {
      issues.push(
        issue({
          code: "no-entry-restriction",
          severity: "error",
          routeSegmentIds: [segment.id],
          roadIds: [segment.roadId],
          nodeIds: [segment.fromNodeId, segment.toNodeId],
          explanation: `Segment ${segment.id} uses a no-entry movement on road ${segment.roadId}.`
        })
      );
    }
  }

  for (const restriction of restrictions.roadClosed) {
    if (restriction.roadId === segment.roadId) {
      issues.push(
        issue({
          code: "closed-or-restricted-road",
          severity: "error",
          routeSegmentIds: [segment.id],
          roadIds: [segment.roadId],
          explanation: `Segment ${segment.id} uses road ${segment.roadId}, which is explicitly closed or restricted in the map data.`
        })
      );
    }
  }

  const accessProperties = accessPropertiesForRoad(context.road);

  if (!accessProperties) {
    issues.push(
      issue({
        code: "access-metadata-unavailable",
        severity: "warning",
        routeSegmentIds: [segment.id],
        roadIds: [segment.roadId],
        explanation: `Segment ${segment.id} has no road access metadata, so private, pedestrian-only, or cycle-only status cannot be verified.`
      })
    );
  } else {
    const accessIssue = roadAccessIssue(context, classifyRoadAccess(accessProperties));

    if (accessIssue) {
      issues.push(accessIssue);
    }
  }

  return issues;
}

function validateTransition(
  previousContext: SegmentContext,
  currentContext: SegmentContext,
  prohibitedTurnRestrictions: Array<Extract<MapRestriction, { type: "prohibited_turn" }>>
): LearnerRouteValidationIssue[] {
  const previousSegment = previousContext.segment;
  const currentSegment = currentContext.segment;
  const issues: LearnerRouteValidationIssue[] = [];

  if (previousSegment.toNodeId !== currentSegment.fromNodeId) {
    issues.push(
      issue({
        code: "disconnected-route-jump",
        severity: "error",
        routeSegmentIds: [previousSegment.id, currentSegment.id],
        roadIds: [previousSegment.roadId, currentSegment.roadId],
        nodeIds: [previousSegment.toNodeId, currentSegment.fromNodeId],
        explanation: `Segment ${currentSegment.id} starts at ${currentSegment.fromNodeId}, but the previous segment ended at ${previousSegment.toNodeId}.`
      })
    );
  }

  if (
    previousSegment.roadId === currentSegment.roadId &&
    previousSegment.fromNodeId === currentSegment.toNodeId &&
    previousSegment.toNodeId === currentSegment.fromNodeId
  ) {
    issues.push(
      issue({
        code: "unnecessary-backtracking",
        severity: "warning",
        routeSegmentIds: [previousSegment.id, currentSegment.id],
        roadIds: [currentSegment.roadId],
        nodeIds: [currentSegment.fromNodeId],
        explanation: `Segment ${currentSegment.id} immediately reverses along road ${currentSegment.roadId}; this is treated as practical backtracking unless a map restriction also forbids it.`
      })
    );
  }

  if (previousSegment.toNodeId === currentSegment.fromNodeId) {
    for (const restriction of prohibitedTurnRestrictions) {
      if (prohibitedTurnBlocksTransition(restriction, previousSegment, currentSegment)) {
        issues.push(
          issue({
            code: "prohibited-turn",
            severity: "error",
            routeSegmentIds: [previousSegment.id, currentSegment.id],
            roadIds: [previousSegment.roadId, currentSegment.roadId],
            nodeIds: [restriction.viaNodeId],
            explanation: `The transition from ${previousSegment.roadId} to ${currentSegment.roadId} at ${restriction.viaNodeId} is explicitly prohibited in the map data.`
          })
        );
      }
    }
  }

  return issues;
}

function isRoundaboutRoad(road: MapRoad | undefined): boolean {
  if (!road) {
    return false;
  }

  const accessProperties = accessPropertiesForRoad(road);

  return String(accessProperties?.junction ?? "").toLowerCase() === "roundabout";
}

function routeMetrics(
  graph: MapGraph,
  contexts: readonly SegmentContext[],
  averageSpeedKmh: number
): LearnerRouteValidationMetrics {
  const routeDistanceMeters = contexts.reduce((sum, context) => sum + (context.road?.distanceMeters ?? 0), 0);
  const turnCount = contexts.slice(1).filter((context, index) => context.segment.roadId !== contexts[index].segment.roadId).length;
  const junctionDecisionCount = contexts.slice(1).filter((context) => {
    const outgoingCount = graph.outgoingEdgesByNodeId[context.segment.fromNodeId]?.length ?? 0;

    return outgoingCount >= 3;
  }).length;
  const roadVisitCounts = contexts.reduce<Map<string, number>>((counts, context) => {
    counts.set(context.segment.roadId, (counts.get(context.segment.roadId) ?? 0) + 1);
    return counts;
  }, new Map());
  const repeatedRoadCount = [...roadVisitCounts.values()].filter((count) => count > 1).length;
  const estimatedTimeMinutes = averageSpeedKmh > 0 ? (routeDistanceMeters / 1000 / averageSpeedKmh) * 60 : 0;

  return {
    routeDistanceMeters,
    estimatedTimeMinutes,
    segmentCount: contexts.length,
    turnCount,
    junctionDecisionCount,
    roundaboutSegmentCount: contexts.filter((context) => isRoundaboutRoad(context.road)).length,
    repeatedRoadCount
  };
}

function validateRouteEndpoints(contexts: readonly SegmentContext[]): LearnerRouteValidationIssue[] {
  const first = contexts[0];
  const last = contexts[contexts.length - 1];
  const issues: LearnerRouteValidationIssue[] = [];

  if (first && (!first.road || !first.followsRoadEndpoints)) {
    issues.push(
      issue({
        code: "start-segment-invalid",
        severity: "error",
        routeSegmentIds: [first.segment.id],
        roadIds: [first.segment.roadId],
        nodeIds: [first.segment.fromNodeId],
        explanation: "The route start is not on a valid drivable road segment in the current map data."
      })
    );
  }

  if (last && (!last.road || !last.followsRoadEndpoints)) {
    issues.push(
      issue({
        code: "end-segment-invalid",
        severity: "error",
        routeSegmentIds: [last.segment.id],
        roadIds: [last.segment.roadId],
        nodeIds: [last.segment.toNodeId],
        explanation: "The route end is not on a valid drivable road segment in the current map data."
      })
    );
  }

  return issues;
}

function configuredLimits(
  difficulty: ExerciseDifficulty,
  constraints: LearnerRouteValidationConstraints = {}
): DifficultyPracticalLimits {
  const defaults = difficultyPracticalLimits[difficulty];

  return {
    maxSegmentCount: constraints.maxSegmentCount ?? defaults.maxSegmentCount,
    maxTurnCount: constraints.maxTurnCount ?? defaults.maxTurnCount,
    maxJunctionDecisionCount: constraints.maxJunctionDecisionCount ?? defaults.maxJunctionDecisionCount,
    maxRoundaboutSegmentCount: constraints.maxRoundaboutSegmentCount ?? defaults.maxRoundaboutSegmentCount,
    maxRepeatedRoadCount: constraints.maxRepeatedRoadCount ?? defaults.maxRepeatedRoadCount,
    maxDistanceMeters: constraints.maxDistanceMeters ?? defaults.maxDistanceMeters,
    maxEstimatedTimeMinutes: constraints.maxEstimatedTimeMinutes ?? defaults.maxEstimatedTimeMinutes
  };
}

function validatePracticalSuitability(input: {
  difficulty: ExerciseDifficulty;
  metrics: LearnerRouteValidationMetrics;
  routeSegments: readonly LearnerRouteValidationSegment[];
  constraints?: LearnerRouteValidationConstraints;
}): LearnerRouteValidationIssue[] {
  const limits = configuredLimits(input.difficulty, input.constraints);
  const routeSegmentIds = input.routeSegments.map((segment) => segment.id);
  const issues: LearnerRouteValidationIssue[] = [];

  if (
    input.metrics.segmentCount > limits.maxSegmentCount ||
    input.metrics.turnCount > limits.maxTurnCount ||
    input.metrics.junctionDecisionCount > limits.maxJunctionDecisionCount
  ) {
    issues.push(
      issue({
        code: "excessive-route-complexity",
        severity: "warning",
        routeSegmentIds,
        roadIds: input.routeSegments.map((segment) => segment.roadId),
        explanation: `This route is more complex than expected for ${input.difficulty} practice: ${input.metrics.segmentCount} segments, ${input.metrics.turnCount} turns, and ${input.metrics.junctionDecisionCount} complex junction decisions.`
      })
    );
  }

  if (input.metrics.roundaboutSegmentCount > limits.maxRoundaboutSegmentCount) {
    issues.push(
      issue({
        code: "roundabout-complexity",
        severity: "warning",
        routeSegmentIds,
        roadIds: input.routeSegments.map((segment) => segment.roadId),
        explanation: `This route includes ${input.metrics.roundaboutSegmentCount} detectable roundabout segment(s), above the ${input.difficulty} practice limit.`
      })
    );
  }

  if (input.metrics.repeatedRoadCount > limits.maxRepeatedRoadCount) {
    issues.push(
      issue({
        code: "duplicate-loop",
        severity: "warning",
        routeSegmentIds,
        roadIds: input.routeSegments.map((segment) => segment.roadId),
        explanation: `This route repeats ${input.metrics.repeatedRoadCount} road segment(s), which may indicate an unnecessary loop or backtracking.`
      })
    );
  }

  if (
    typeof input.constraints?.minDistanceMeters === "number" &&
    input.metrics.routeDistanceMeters < input.constraints.minDistanceMeters
  ) {
    issues.push(
      issue({
        code: "route-length-out-of-bounds",
        severity: "warning",
        routeSegmentIds,
        roadIds: input.routeSegments.map((segment) => segment.roadId),
        explanation: `This route is ${Math.round(input.metrics.routeDistanceMeters)} m, below the configured minimum of ${Math.round(input.constraints.minDistanceMeters)} m.`
      })
    );
  }

  if (input.metrics.routeDistanceMeters > limits.maxDistanceMeters) {
    issues.push(
      issue({
        code: "route-length-out-of-bounds",
        severity: "warning",
        routeSegmentIds,
        roadIds: input.routeSegments.map((segment) => segment.roadId),
        explanation: `This route is ${Math.round(input.metrics.routeDistanceMeters)} m, above the ${input.difficulty} practice limit of ${Math.round(limits.maxDistanceMeters)} m.`
      })
    );
  }

  if (input.metrics.estimatedTimeMinutes > limits.maxEstimatedTimeMinutes) {
    issues.push(
      issue({
        code: "estimated-time-out-of-bounds",
        severity: "warning",
        routeSegmentIds,
        roadIds: input.routeSegments.map((segment) => segment.roadId),
        explanation: `This route is estimated at ${input.metrics.estimatedTimeMinutes.toFixed(1)} minutes, above the ${input.difficulty} practice limit of ${limits.maxEstimatedTimeMinutes} minutes.`
      })
    );
  }

  return issues;
}

function validationStatus(errors: readonly LearnerRouteValidationIssue[], warnings: readonly LearnerRouteValidationIssue[]): LearnerRouteValidationStatus {
  if (errors.length > 0) {
    return "invalid";
  }

  return warnings.length > 0 ? "warning" : "valid";
}

function validationExplanation(status: LearnerRouteValidationStatus, issues: readonly LearnerRouteValidationIssue[]): string {
  if (status === "invalid") {
    return `${issues.filter((candidate) => candidate.severity === "error").length} blocking route validation issue(s) found. ${issues.find((candidate) => candidate.severity === "error")?.explanation ?? ""}`.trim();
  }

  if (status === "warning") {
    return `Route is usable with ${issues.filter((candidate) => candidate.severity === "warning").length} advisory warning(s). ${issues.find((candidate) => candidate.severity === "warning")?.explanation ?? ""}`.trim();
  }

  return "Route passes available legal and practical checks.";
}

export function validateLearnerRoute(input: ValidateLearnerRouteInput): LearnerRouteValidationResult {
  const graph = buildMapGraph(input.map);
  const contexts = input.routeSegments.map((segment, index) => segmentContext(graph, segment, index));
  const issues: LearnerRouteValidationIssue[] = [];

  if (input.routeSegments.length === 0) {
    issues.push(
      issue({
        code: "empty-route",
        severity: "error",
        explanation: "A learner route must contain at least one route segment."
      })
    );
  }

  const restrictions = {
    noEntry: input.map.restrictions.filter(isNoEntryRestriction),
    roadClosed: input.map.restrictions.filter(isRoadClosedRestriction),
    prohibitedTurn: input.map.restrictions.filter(isProhibitedTurnRestriction)
  };

  for (let index = 0; index < contexts.length; index += 1) {
    const context = contexts[index];

    issues.push(...validateSingleSegment(graph, context, restrictions));

    if (index > 0) {
      issues.push(...validateTransition(contexts[index - 1], context, restrictions.prohibitedTurn));
    }
  }

  issues.push(...validateRouteEndpoints(contexts));

  const metrics = routeMetrics(
    graph,
    contexts,
    input.constraints?.averageSpeedKmh ?? DEFAULT_AVERAGE_SPEED_KMH
  );

  issues.push(
    ...validatePracticalSuitability({
      difficulty: input.difficulty,
      metrics,
      routeSegments: input.routeSegments,
      constraints: input.constraints
    })
  );

  const blockingErrors = issues.filter((candidate) => candidate.severity === "error");
  const advisoryWarnings = issues.filter((candidate) => candidate.severity === "warning");
  const status = validationStatus(blockingErrors, advisoryWarnings);

  return {
    status,
    valid: blockingErrors.length === 0,
    blockingErrors,
    advisoryWarnings,
    affectedRouteSegmentIds: uniqueStrings(issues.flatMap((candidate) => candidate.routeSegmentIds)),
    ruleCodes: uniqueStrings(issues.map((candidate) => candidate.code)) as LearnerRouteValidationRuleCode[],
    explanation: validationExplanation(status, issues),
    metrics
  };
}
