import {
  buildMapGraph,
  findShortestLegalRoute,
  type DirectedEdge,
  type MapDefinition,
  type MapGraph,
  type MapNode,
  type RouteStop,
  type ShortestLegalRouteResult,
  type Vec2
} from "../map-engine/index.ts";
import {
  type ExerciseDifficulty,
  type ExerciseObjective,
  type ExerciseType,
  type LearnerExercise,
  type RouteInstruction,
  type RouteInstructionKind,
  type RouteLeg
} from "./learnerDriverTraining.ts";
import {
  validateLearnerRoute,
  type LearnerRouteValidationConstraints,
  type LearnerRouteValidationResult,
  type LearnerRouteValidationRuleCode,
  type LearnerRouteValidationSegment,
  type LearnerRouteValidationStatus
} from "./learnerRouteValidation.ts";

export type LearnerExerciseTargetBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type LearnerExerciseGenerationStatus = "generated" | "degraded" | "failed";

export type LearnerExerciseGenerationReasonCode =
  | "insufficient-map-data"
  | "no-candidate-pairs"
  | "no-legal-route"
  | "route-outside-target-bounds"
  | "validation-blocked"
  | "validation-warning"
  | "difficulty-profile-warning"
  | "difficulty-too-simple"
  | "duplicate-route-signature"
  | "candidate-selected"
  | "candidate-degraded";

export type LearnerExerciseGenerationAttemptStatus = "accepted" | "rejected";

export type LearnerExerciseGenerationAttempt = {
  sequence: number;
  status: LearnerExerciseGenerationAttemptStatus;
  startNodeId?: string;
  destinationNodeId?: string;
  distanceMeters?: number;
  segmentCount?: number;
  validationStatus?: LearnerRouteValidationStatus;
  blockingRuleCodes?: LearnerRouteValidationRuleCode[];
  reasonCodes: LearnerExerciseGenerationReasonCode[];
};

export type LearnerRouteComplexityMetrics = {
  score: number;
  routeSignature: string;
  roadChangeCount: number;
  turnCount: number;
  decisionPointCount: number;
  roundaboutExposure: number;
  restrictionExposure: number;
  instructionCountEstimate: number;
  shapeComplexity: number;
  repeatedRoadPenalty: number;
  straightnessRatio: number;
  mostlyStraight: boolean;
};

export type LearnerExerciseCandidateOption = {
  id: string;
  routeSignature: string;
  difficulty: ExerciseDifficulty;
  exerciseType: ExerciseType;
  distanceMeters: number;
  segmentCount: number;
  turnCount: number;
  decisionPointCount: number;
  complexityScore: number;
  estimatedMinutes: number;
  skillTags: string[];
  selected: boolean;
};

export type GeneratedLearnerExercise = LearnerExercise & {
  routeGeometry: Vec2[];
  checkpoints: RouteStop[];
  expectedRouteSegments: LearnerRouteValidationSegment[];
  estimatedDifficulty: ExerciseDifficulty;
  validation: LearnerRouteValidationResult;
  generationMetadata: {
    status: Exclude<LearnerExerciseGenerationStatus, "failed">;
    seed: string;
    attempts: number;
    routeSignature: string;
    complexity: LearnerRouteComplexityMetrics;
    reasonCodes: LearnerExerciseGenerationReasonCode[];
    targetBounds?: LearnerExerciseTargetBounds;
    constraints: LearnerRouteValidationConstraints;
    candidateOptions: LearnerExerciseCandidateOption[];
  };
};

export type GenerateLearnerExerciseInput = {
  map: MapDefinition;
  difficulty: ExerciseDifficulty;
  exerciseType: ExerciseType;
  targetAreaBounds?: LearnerExerciseTargetBounds;
  constraints?: LearnerRouteValidationConstraints;
  seed?: string | number;
  maxAttempts?: number;
  avoidRouteSignatures?: readonly string[];
  candidateOptionCount?: number;
  published?: boolean;
};

export type LearnerExerciseGenerationResult =
  | {
      status: "generated" | "degraded";
      exercise: GeneratedLearnerExercise;
      validation: LearnerRouteValidationResult;
      attempts: LearnerExerciseGenerationAttempt[];
      candidateOptions: LearnerExerciseCandidateOption[];
      reasonCodes: LearnerExerciseGenerationReasonCode[];
      explanation: string;
    }
  | {
      status: "failed";
      exercise: null;
      validation: null;
      attempts: LearnerExerciseGenerationAttempt[];
      reasonCodes: LearnerExerciseGenerationReasonCode[];
      explanation: string;
    };

type FoundShortestLegalRoute = Extract<ShortestLegalRouteResult, { found: true }>;

type DifficultyGenerationProfile = {
  minDistanceMeters: number;
  maxDistanceMeters: number;
  targetDistanceMeters: number;
  minComplexityScore: number;
  targetComplexityScore: number;
  minTurnCount: number;
  minJunctionDecisionCount: number;
  minRoadChangeCount: number;
  targetSegmentCount: number;
  minSegmentCount: number;
  maxSegmentCount: number;
  maxTurnCount: number;
  maxJunctionDecisionCount: number;
  maxRoundaboutSegmentCount: number;
  maxRepeatedRoadCount: number;
  maxEstimatedTimeMinutes: number;
  pairOffsets: readonly number[];
  defaultMaxAttempts: number;
};

type CandidateRoute = {
  route: FoundShortestLegalRoute;
  routeSegments: LearnerRouteValidationSegment[];
  validation: LearnerRouteValidationResult;
  complexity: LearnerRouteComplexityMetrics;
  routeSignature: string;
  score: number;
  profileFit: boolean;
  reasonCodes: LearnerExerciseGenerationReasonCode[];
};

const DEFAULT_SEED = "phase-7-learner-exercise";
const DEFAULT_AVERAGE_SPEED_KMH = 20;

const difficultyProfiles: Record<ExerciseDifficulty, DifficultyGenerationProfile> = {
  beginner: {
    minDistanceMeters: 80,
    maxDistanceMeters: 1100,
    targetDistanceMeters: 520,
    minComplexityScore: 8,
    targetComplexityScore: 22,
    minTurnCount: 0,
    minJunctionDecisionCount: 0,
    minRoadChangeCount: 1,
    targetSegmentCount: 5,
    minSegmentCount: 1,
    maxSegmentCount: 8,
    maxTurnCount: 5,
    maxJunctionDecisionCount: 4,
    maxRoundaboutSegmentCount: 0,
    maxRepeatedRoadCount: 0,
    maxEstimatedTimeMinutes: 6,
    pairOffsets: [2, 3, 4, 5, 6, 8],
    defaultMaxAttempts: 120
  },
  easy: {
    minDistanceMeters: 120,
    maxDistanceMeters: 1700,
    targetDistanceMeters: 850,
    minComplexityScore: 16,
    targetComplexityScore: 34,
    minTurnCount: 0,
    minJunctionDecisionCount: 0,
    minRoadChangeCount: 2,
    targetSegmentCount: 7,
    minSegmentCount: 2,
    maxSegmentCount: 10,
    maxTurnCount: 7,
    maxJunctionDecisionCount: 5,
    maxRoundaboutSegmentCount: 1,
    maxRepeatedRoadCount: 0,
    maxEstimatedTimeMinutes: 9,
    pairOffsets: [3, 5, 6, 8, 10, 13],
    defaultMaxAttempts: 130
  },
  intermediate: {
    minDistanceMeters: 300,
    maxDistanceMeters: 4200,
    targetDistanceMeters: 1800,
    minComplexityScore: 28,
    targetComplexityScore: 52,
    minTurnCount: 1,
    minJunctionDecisionCount: 0,
    minRoadChangeCount: 4,
    targetSegmentCount: 12,
    minSegmentCount: 3,
    maxSegmentCount: 18,
    maxTurnCount: 13,
    maxJunctionDecisionCount: 10,
    maxRoundaboutSegmentCount: 2,
    maxRepeatedRoadCount: 1,
    maxEstimatedTimeMinutes: 18,
    pairOffsets: [5, 8, 10, 13, 17, 21, 26],
    defaultMaxAttempts: 170
  },
  advanced: {
    minDistanceMeters: 900,
    maxDistanceMeters: 9000,
    targetDistanceMeters: 3600,
    minComplexityScore: 48,
    targetComplexityScore: 82,
    minTurnCount: 2,
    minJunctionDecisionCount: 1,
    minRoadChangeCount: 7,
    targetSegmentCount: 20,
    minSegmentCount: 8,
    maxSegmentCount: 34,
    maxTurnCount: 26,
    maxJunctionDecisionCount: 22,
    maxRoundaboutSegmentCount: 4,
    maxRepeatedRoadCount: 2,
    maxEstimatedTimeMinutes: 32,
    pairOffsets: [8, 13, 17, 21, 26, 34, 42, 55, 89, 144],
    defaultMaxAttempts: 240
  }
};

function stableHash(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededRandom(seed: string): () => number {
  let state = stableHash(seed);

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<TValue>(values: readonly TValue[], random: () => number): TValue[] {
  const copy = [...values];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function stableUnique<TValue extends string>(values: readonly TValue[]): TValue[] {
  return [...new Set(values)].sort();
}

function nodeInsideBounds(node: MapNode, bounds: LearnerExerciseTargetBounds | undefined): boolean {
  if (!bounds) {
    return true;
  }

  return node.x >= bounds.minX && node.x <= bounds.maxX && node.y >= bounds.minY && node.y <= bounds.maxY;
}

function candidateNodeIds(graph: MapGraph, bounds: LearnerExerciseTargetBounds | undefined): string[] {
  return Object.values(graph.nodesById)
    .filter((node) => {
      const outgoingCount = graph.outgoingEdgesByNodeId[node.id]?.length ?? 0;
      const incomingCount = graph.incomingEdgesByNodeId[node.id]?.length ?? 0;

      return outgoingCount > 0 && incomingCount > 0 && nodeInsideBounds(node, bounds);
    })
    .map((node) => node.id)
    .sort();
}

function normalisedOffsets(nodeCount: number, offsets: readonly number[], random: () => number): number[] {
  return shuffled(
    stableUnique(
      offsets
        .map((offset) => offset % nodeCount)
        .filter((offset) => offset > 0)
        .map((offset) => String(offset))
    ).map(Number),
    random
  );
}

function buildCandidatePairs(input: {
  nodeIds: readonly string[];
  profile: DifficultyGenerationProfile;
  maxAttempts: number;
  random: () => number;
}): Array<{ startNodeId: string; destinationNodeId: string }> {
  if (input.nodeIds.length < 2) {
    return [];
  }

  const starts = shuffled(input.nodeIds, input.random);
  const offsets = normalisedOffsets(input.nodeIds.length, input.profile.pairOffsets, input.random);
  const pairs: Array<{ startNodeId: string; destinationNodeId: string }> = [];
  const seen = new Set<string>();

  for (const startNodeId of starts) {
    const startIndex = input.nodeIds.indexOf(startNodeId);

    for (const offset of offsets) {
      if (pairs.length >= input.maxAttempts) {
        return pairs;
      }

      const destinationNodeId = input.nodeIds[(startIndex + offset) % input.nodeIds.length];
      const key = `${startNodeId}->${destinationNodeId}`;

      if (startNodeId === destinationNodeId || seen.has(key)) {
        continue;
      }

      seen.add(key);
      pairs.push({ startNodeId, destinationNodeId });
    }
  }

  return pairs;
}

function constraintsForGeneration(
  difficulty: ExerciseDifficulty,
  constraints: LearnerRouteValidationConstraints | undefined
): LearnerRouteValidationConstraints {
  const profile = difficultyProfiles[difficulty];

  return {
    minDistanceMeters: constraints?.minDistanceMeters ?? profile.minDistanceMeters,
    maxDistanceMeters: constraints?.maxDistanceMeters ?? profile.maxDistanceMeters,
    maxEstimatedTimeMinutes: constraints?.maxEstimatedTimeMinutes ?? profile.maxEstimatedTimeMinutes,
    averageSpeedKmh: constraints?.averageSpeedKmh ?? DEFAULT_AVERAGE_SPEED_KMH,
    maxSegmentCount: constraints?.maxSegmentCount ?? profile.maxSegmentCount,
    maxTurnCount: constraints?.maxTurnCount ?? profile.maxTurnCount,
    maxJunctionDecisionCount: constraints?.maxJunctionDecisionCount ?? profile.maxJunctionDecisionCount,
    maxRoundaboutSegmentCount: constraints?.maxRoundaboutSegmentCount ?? profile.maxRoundaboutSegmentCount,
    maxRepeatedRoadCount: constraints?.maxRepeatedRoadCount ?? profile.maxRepeatedRoadCount
  };
}

function routeSegmentsFromEdges(graph: MapGraph, edgeIds: readonly string[]): LearnerRouteValidationSegment[] {
  return edgeIds
    .map((edgeId) => graph.edgesById[edgeId])
    .filter((edge): edge is DirectedEdge => Boolean(edge))
    .map((edge, index) => ({
      id: `segment-${String(index + 1).padStart(2, "0")}`,
      roadId: edge.roadId,
      fromNodeId: edge.fromNodeId,
      toNodeId: edge.toNodeId
    }));
}

function routeNodesInsideBounds(
  graph: MapGraph,
  route: FoundShortestLegalRoute,
  bounds: LearnerExerciseTargetBounds | undefined
): boolean {
  if (!bounds) {
    return true;
  }

  return route.nodeIds.every((nodeId) => {
    const node = graph.nodesById[nodeId];

    return node ? nodeInsideBounds(node, bounds) : false;
  });
}

function distanceBetweenPoints(left: Vec2, right: Vec2): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function headingDeltaScore(previous: Vec2, current: Vec2, next: Vec2): number {
  const incoming = headingDegrees(previous, current);
  const outgoing = headingDegrees(current, next);
  const delta = Math.abs(normaliseTurnDegrees(outgoing - incoming));

  if (delta < 25) {
    return 0;
  }

  if (delta < 55) {
    return 1;
  }

  if (delta < 105) {
    return 2;
  }

  return 3;
}

function routeSignature(routeSegments: readonly LearnerRouteValidationSegment[]): string {
  const roadPath = routeSegments.map((segment) => `${segment.roadId}:${segment.fromNodeId}>${segment.toNodeId}`);

  return stableHash(roadPath.join("|")).toString(36);
}

function routeRestrictionExposure(map: MapDefinition, routeSegments: readonly LearnerRouteValidationSegment[]): number {
  const routeRoadIds = new Set(routeSegments.map((segment) => segment.roadId));
  const routeNodeIds = new Set(routeSegments.flatMap((segment) => [segment.fromNodeId, segment.toNodeId]));

  return map.restrictions.filter((restriction) => {
    if ("roadId" in restriction && typeof restriction.roadId === "string" && routeRoadIds.has(restriction.roadId)) {
      return true;
    }

    if ("fromRoadId" in restriction && "toRoadId" in restriction) {
      return (
        (typeof restriction.fromRoadId === "string" && routeRoadIds.has(restriction.fromRoadId)) ||
        (typeof restriction.toRoadId === "string" && routeRoadIds.has(restriction.toRoadId))
      );
    }

    if ("viaNodeId" in restriction && typeof restriction.viaNodeId === "string") {
      return routeNodeIds.has(restriction.viaNodeId);
    }

    return false;
  }).length;
}

function calculateLearnerRouteComplexity(input: {
  map: MapDefinition;
  graph: MapGraph;
  route: FoundShortestLegalRoute;
  routeSegments: readonly LearnerRouteValidationSegment[];
  validation: LearnerRouteValidationResult;
}): LearnerRouteComplexityMetrics {
  const geometry = routeGeometry(input.graph, input.route);
  const directDistance =
    geometry.length >= 2 ? distanceBetweenPoints(geometry[0], geometry[geometry.length - 1]) : 0;
  const roadChangeCount = input.routeSegments.slice(1).filter(
    (segment, index) => segment.roadId !== input.routeSegments[index].roadId
  ).length;
  const shapeComplexity = geometry.slice(1, -1).reduce((sum, point, index) => {
    const previous = geometry[index];
    const next = geometry[index + 2];

    return previous && next ? sum + headingDeltaScore(previous, point, next) : sum;
  }, 0);
  const straightnessRatio =
    input.validation.metrics.routeDistanceMeters > 0
      ? directDistance / input.validation.metrics.routeDistanceMeters
      : 1;
  const restrictionExposure = routeRestrictionExposure(input.map, input.routeSegments);
  const repeatedRoadPenalty = input.validation.metrics.repeatedRoadCount * 6;
  const score = Math.max(
    0,
    input.validation.metrics.segmentCount * 2.4 +
      roadChangeCount * 3.2 +
      input.validation.metrics.turnCount * 3.4 +
      input.validation.metrics.junctionDecisionCount * 5.5 +
      input.validation.metrics.roundaboutSegmentCount * 5 +
      restrictionExposure * 4 +
      shapeComplexity * 2.1 +
      Math.max(0, 0.92 - straightnessRatio) * 12 -
      repeatedRoadPenalty
  );

  return {
    score: Math.round(score * 10) / 10,
    routeSignature: routeSignature(input.routeSegments),
    roadChangeCount,
    turnCount: input.validation.metrics.turnCount,
    decisionPointCount: input.validation.metrics.junctionDecisionCount,
    roundaboutExposure: input.validation.metrics.roundaboutSegmentCount,
    restrictionExposure,
    instructionCountEstimate: input.routeSegments.length + 2,
    shapeComplexity,
    repeatedRoadPenalty,
    straightnessRatio: Math.round(straightnessRatio * 1000) / 1000,
    mostlyStraight: straightnessRatio > 0.92 && input.validation.metrics.turnCount <= 1
  };
}

function routeFitsProfile(
  validation: LearnerRouteValidationResult,
  complexity: LearnerRouteComplexityMetrics,
  profile: DifficultyGenerationProfile,
  constraints: LearnerRouteValidationConstraints
): boolean {
  const minDistanceMeters = constraints.minDistanceMeters ?? profile.minDistanceMeters;
  const maxDistanceMeters = constraints.maxDistanceMeters ?? profile.maxDistanceMeters;
  const metrics = validation.metrics;

  return (
    metrics.routeDistanceMeters >= minDistanceMeters &&
    metrics.routeDistanceMeters <= maxDistanceMeters &&
    metrics.segmentCount >= profile.minSegmentCount &&
    metrics.segmentCount <= (constraints.maxSegmentCount ?? profile.maxSegmentCount) &&
    complexity.score >= profile.minComplexityScore &&
    complexity.roadChangeCount >= profile.minRoadChangeCount &&
    metrics.turnCount >= profile.minTurnCount &&
    metrics.junctionDecisionCount >= profile.minJunctionDecisionCount &&
    metrics.turnCount <= (constraints.maxTurnCount ?? profile.maxTurnCount) &&
    metrics.junctionDecisionCount <= (constraints.maxJunctionDecisionCount ?? profile.maxJunctionDecisionCount) &&
    metrics.roundaboutSegmentCount <= (constraints.maxRoundaboutSegmentCount ?? profile.maxRoundaboutSegmentCount) &&
    metrics.repeatedRoadCount <= (constraints.maxRepeatedRoadCount ?? profile.maxRepeatedRoadCount)
  );
}

function candidateScore(input: {
  validation: LearnerRouteValidationResult;
  complexity: LearnerRouteComplexityMetrics;
  profile: DifficultyGenerationProfile;
  constraints: LearnerRouteValidationConstraints;
  profileFit: boolean;
  avoidedSignature: boolean;
}): number {
  const metrics = input.validation.metrics;
  const minDistanceMeters = input.constraints.minDistanceMeters ?? input.profile.minDistanceMeters;
  const maxDistanceMeters = input.constraints.maxDistanceMeters ?? input.profile.maxDistanceMeters;
  const distanceOutOfBoundsPenalty =
    metrics.routeDistanceMeters < minDistanceMeters
      ? (minDistanceMeters - metrics.routeDistanceMeters) * 3
      : metrics.routeDistanceMeters > maxDistanceMeters
        ? (metrics.routeDistanceMeters - maxDistanceMeters) * 3
        : 0;
  const warningPenalty = input.validation.advisoryWarnings.length * 5000;
  const profilePenalty = input.profileFit ? 0 : 2500;
  const tooSimplePenalty =
    input.complexity.score < input.profile.minComplexityScore
      ? (input.profile.minComplexityScore - input.complexity.score) * 360
      : 0;
  const missingTurnPenalty = Math.max(0, input.profile.minTurnCount - metrics.turnCount) * 1400;
  const missingDecisionPenalty =
    Math.max(0, input.profile.minJunctionDecisionCount - metrics.junctionDecisionCount) * 1600;
  const missingRoadChangePenalty = Math.max(0, input.profile.minRoadChangeCount - input.complexity.roadChangeCount) * 900;
  const duplicatePenalty = input.avoidedSignature ? 12000 : 0;

  return (
    Math.abs(metrics.routeDistanceMeters - input.profile.targetDistanceMeters) +
    Math.abs(metrics.segmentCount - input.profile.targetSegmentCount) * 90 +
    Math.abs(input.complexity.score - input.profile.targetComplexityScore) * 55 +
    metrics.roundaboutSegmentCount * 180 +
    metrics.repeatedRoadCount * 600 +
    (input.complexity.mostlyStraight ? 1100 : 0) +
    distanceOutOfBoundsPenalty +
    warningPenalty +
    profilePenalty +
    tooSimplePenalty +
    missingTurnPenalty +
    missingDecisionPenalty +
    missingRoadChangePenalty +
    duplicatePenalty
  );
}

function buildAttempt(input: {
  sequence: number;
  status: LearnerExerciseGenerationAttemptStatus;
  startNodeId?: string;
  destinationNodeId?: string;
  route?: FoundShortestLegalRoute;
  validation?: LearnerRouteValidationResult;
  reasonCodes: LearnerExerciseGenerationReasonCode[];
}): LearnerExerciseGenerationAttempt {
  return {
    sequence: input.sequence,
    status: input.status,
    startNodeId: input.startNodeId,
    destinationNodeId: input.destinationNodeId,
    distanceMeters: input.route?.distanceMeters,
    segmentCount: input.validation?.metrics.segmentCount,
    validationStatus: input.validation?.status,
    blockingRuleCodes: input.validation?.blockingErrors.map((error) => error.code),
    reasonCodes: stableUnique(input.reasonCodes)
  };
}

function evaluateCandidate(input: {
  map: MapDefinition;
  graph: MapGraph;
  startNodeId: string;
  destinationNodeId: string;
  difficulty: ExerciseDifficulty;
  profile: DifficultyGenerationProfile;
  constraints: LearnerRouteValidationConstraints;
  avoidRouteSignatures: ReadonlySet<string>;
  targetAreaBounds?: LearnerExerciseTargetBounds;
}): CandidateRoute | null {
  const route = findShortestLegalRoute({
    graph: input.graph,
    startNodeId: input.startNodeId,
    endNodeId: input.destinationNodeId,
    restrictions: input.map.restrictions
  });

  if (!route.found || route.edgeIds.length === 0) {
    return null;
  }

  const routeSegments = routeSegmentsFromEdges(input.graph, route.edgeIds);
  const validation = validateLearnerRoute({
    map: input.map,
    difficulty: input.difficulty,
    routeSegments,
    constraints: input.constraints
  });
  const complexity = calculateLearnerRouteComplexity({
    map: input.map,
    graph: input.graph,
    route,
    routeSegments,
    validation
  });
  const avoidedSignature = input.avoidRouteSignatures.has(complexity.routeSignature);

  if (!routeNodesInsideBounds(input.graph, route, input.targetAreaBounds)) {
    return {
      route,
      routeSegments,
      validation,
      complexity,
      routeSignature: complexity.routeSignature,
      score: Number.POSITIVE_INFINITY,
      profileFit: false,
      reasonCodes: ["route-outside-target-bounds"]
    };
  }

  if (!validation.valid) {
    return {
      route,
      routeSegments,
      validation,
      complexity,
      routeSignature: complexity.routeSignature,
      score: Number.POSITIVE_INFINITY,
      profileFit: false,
      reasonCodes: ["validation-blocked"]
    };
  }

  const profileFit = routeFitsProfile(validation, complexity, input.profile, input.constraints);
  const reasonCodes: LearnerExerciseGenerationReasonCode[] = [];

  if (validation.status === "warning") {
    reasonCodes.push("validation-warning");
  }

  if (!profileFit) {
    reasonCodes.push("difficulty-profile-warning");
  }

  if (complexity.score < input.profile.minComplexityScore) {
    reasonCodes.push("difficulty-too-simple");
  }

  if (avoidedSignature) {
    reasonCodes.push("duplicate-route-signature");
  }

  return {
    route,
    routeSegments,
    validation,
    complexity,
    routeSignature: complexity.routeSignature,
    profileFit,
    score: candidateScore({
      validation,
      complexity,
      profile: input.profile,
      constraints: input.constraints,
      profileFit,
      avoidedSignature
    }),
    reasonCodes
  };
}

function bestCandidate(
  left: CandidateRoute | null,
  right: CandidateRoute | null
): CandidateRoute | null {
  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  return right.score < left.score ? right : left;
}

function skillTagsForCandidate(input: {
  exerciseType: ExerciseType;
  complexity: LearnerRouteComplexityMetrics;
}): string[] {
  const tags = [input.exerciseType.replaceAll("-", " ")];

  if (input.complexity.decisionPointCount > 0) {
    tags.push("junction planning");
  }

  if (input.complexity.roundaboutExposure > 0) {
    tags.push("roundabout practice");
  }

  if (input.complexity.restrictionExposure > 0) {
    tags.push("legal route choice");
  }

  if (!input.complexity.mostlyStraight && input.complexity.turnCount >= 2) {
    tags.push("turn sequencing");
  }

  if (input.complexity.score >= difficultyProfiles.advanced.minComplexityScore) {
    tags.push("multi-decision route");
  }

  return stableUnique(tags);
}

function candidateOption(input: {
  candidate: CandidateRoute;
  difficulty: ExerciseDifficulty;
  exerciseType: ExerciseType;
  selected: boolean;
}): LearnerExerciseCandidateOption {
  return {
    id: `option-${input.candidate.routeSignature}`,
    routeSignature: input.candidate.routeSignature,
    difficulty: input.difficulty,
    exerciseType: input.exerciseType,
    distanceMeters: Math.round(input.candidate.validation.metrics.routeDistanceMeters),
    segmentCount: input.candidate.validation.metrics.segmentCount,
    turnCount: input.candidate.validation.metrics.turnCount,
    decisionPointCount: input.candidate.validation.metrics.junctionDecisionCount,
    complexityScore: input.candidate.complexity.score,
    estimatedMinutes: Math.max(1, Math.ceil(input.candidate.validation.metrics.estimatedTimeMinutes)),
    skillTags: skillTagsForCandidate({
      exerciseType: input.exerciseType,
      complexity: input.candidate.complexity
    }),
    selected: input.selected
  };
}

function buildCandidateOptions(input: {
  candidates: readonly CandidateRoute[];
  selectedCandidate: CandidateRoute;
  difficulty: ExerciseDifficulty;
  exerciseType: ExerciseType;
  count: number;
}): LearnerExerciseCandidateOption[] {
  const options: LearnerExerciseCandidateOption[] = [];
  const seen = new Set<string>();
  const orderedCandidates = [
    input.selectedCandidate,
    ...input.candidates.filter((candidate) => candidate.routeSignature !== input.selectedCandidate.routeSignature)
  ].sort((left, right) => {
    if (left.routeSignature === input.selectedCandidate.routeSignature) {
      return -1;
    }

    if (right.routeSignature === input.selectedCandidate.routeSignature) {
      return 1;
    }

    return left.score - right.score;
  });

  for (const candidate of orderedCandidates) {
    if (options.length >= input.count) {
      break;
    }

    if (seen.has(candidate.routeSignature)) {
      continue;
    }

    seen.add(candidate.routeSignature);
    options.push(
      candidateOption({
        candidate,
        difficulty: input.difficulty,
        exerciseType: input.exerciseType,
        selected: candidate.routeSignature === input.selectedCandidate.routeSignature
      })
    );
  }

  return options;
}

function mapPointForNode(graph: MapGraph, nodeId: string): Vec2 | undefined {
  const node = graph.nodesById[nodeId];

  return node ? { x: node.x, y: node.y } : undefined;
}

function nodeLabel(graph: MapGraph, nodeId: string, fallback: string): string {
  return graph.nodesById[nodeId]?.label ?? fallback;
}

function stopForNode(graph: MapGraph, nodeId: string, label: string): RouteStop {
  return {
    type: "node",
    nodeId,
    label: nodeLabel(graph, nodeId, label)
  };
}

function checkpointStops(input: {
  graph: MapGraph;
  route: FoundShortestLegalRoute;
  difficulty: ExerciseDifficulty;
  exerciseType: ExerciseType;
}): RouteStop[] {
  const startNodeId = input.route.startNodeId;
  const destinationNodeId = input.route.endNodeId;
  const shouldAddMidpoint =
    input.difficulty === "intermediate" ||
    input.difficulty === "advanced" ||
    input.exerciseType === "identify-next-safe-turn" ||
    input.exerciseType === "practise-junction-decision-making" ||
    input.exerciseType === "route-review-mistake-correction";
  const stops = [stopForNode(input.graph, startNodeId, "Start")];

  if (shouldAddMidpoint && input.route.nodeIds.length >= 5) {
    const midpointNodeId = input.route.nodeIds[Math.floor(input.route.nodeIds.length / 2)];

    if (midpointNodeId !== startNodeId && midpointNodeId !== destinationNodeId) {
      stops.push(stopForNode(input.graph, midpointNodeId, "Checkpoint"));
    }
  }

  stops.push(stopForNode(input.graph, destinationNodeId, "Destination"));

  return stops;
}

function stopNodeId(stop: RouteStop): string | null {
  return stop.type === "node" ? stop.nodeId : null;
}

function routeNodeIndexAfter(routeNodeIds: readonly string[], nodeId: string, afterIndex: number): number {
  for (let index = afterIndex + 1; index < routeNodeIds.length; index += 1) {
    if (routeNodeIds[index] === nodeId) {
      return index;
    }
  }

  return -1;
}

function buildLegRanges(input: {
  route: FoundShortestLegalRoute;
  checkpoints: readonly RouteStop[];
}): Array<{ legId: string; fromStop: RouteStop; toStop: RouteStop; startNodeIndex: number; endNodeIndex: number }> {
  const ranges: Array<{
    legId: string;
    fromStop: RouteStop;
    toStop: RouteStop;
    startNodeIndex: number;
    endNodeIndex: number;
  }> = [];
  let currentStartIndex = 0;

  for (let index = 0; index < input.checkpoints.length - 1; index += 1) {
    const fromStop = input.checkpoints[index];
    const toStop = input.checkpoints[index + 1];
    const toNodeId = stopNodeId(toStop);
    const endNodeIndex = toNodeId ? routeNodeIndexAfter(input.route.nodeIds, toNodeId, currentStartIndex - 1) : -1;

    if (endNodeIndex < 0) {
      continue;
    }

    ranges.push({
      legId: `leg-${String(index + 1).padStart(2, "0")}`,
      fromStop,
      toStop,
      startNodeIndex: currentStartIndex,
      endNodeIndex
    });
    currentStartIndex = endNodeIndex;
  }

  return ranges;
}

function buildRouteLegs(input: {
  graph: MapGraph;
  route: FoundShortestLegalRoute;
  checkpoints: readonly RouteStop[];
}): RouteLeg[] {
  return buildLegRanges({ route: input.route, checkpoints: input.checkpoints }).map((range, index) => {
    const legEdges = input.route.edgeIds
      .slice(range.startNodeIndex, range.endNodeIndex)
      .map((edgeId) => input.graph.edgesById[edgeId])
      .filter((edge): edge is DirectedEdge => Boolean(edge));

    return {
      id: range.legId,
      from: range.fromStop,
      to: range.toStop,
      title: index === 0 ? "Start to first checkpoint" : "Checkpoint route leg",
      expectedRoadIds: stableUnique(legEdges.map((edge) => edge.roadId)),
      expectedDirectedEdgeIds: legEdges.map((edge) => edge.id),
      distanceMeters: legEdges.reduce((sum, edge) => sum + edge.distanceMeters, 0),
      checkpointOrder: index + 1
    };
  });
}

function roadName(graph: MapGraph, edge: DirectedEdge): string {
  return graph.roadsById[edge.roadId]?.name ?? "the next road";
}

function roadIsRoundabout(graph: MapGraph, edge: DirectedEdge): boolean {
  const road = graph.roadsById[edge.roadId] as (typeof graph.roadsById)[string] & {
    metadata?: {
      junction?: unknown;
      rawTags?: Record<string, unknown>;
    };
  };
  const junction = road?.metadata?.rawTags?.junction ?? road?.metadata?.junction;

  return String(junction ?? "").toLowerCase() === "roundabout";
}

function headingDegrees(from: Vec2, to: Vec2): number {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}

function normaliseTurnDegrees(value: number): number {
  let normalised = value;

  while (normalised <= -180) {
    normalised += 360;
  }

  while (normalised > 180) {
    normalised -= 360;
  }

  return normalised;
}

function turnKind(input: {
  graph: MapGraph;
  previousEdge: DirectedEdge | null;
  edge: DirectedEdge;
}): RouteInstructionKind {
  if (roadIsRoundabout(input.graph, input.edge)) {
    return "roundabout-exit";
  }

  const outgoingCount = input.graph.outgoingEdgesByNodeId[input.edge.fromNodeId]?.length ?? 0;

  if (outgoingCount >= 3 && input.previousEdge) {
    return "junction-decision";
  }

  if (!input.previousEdge) {
    return "continue";
  }

  const previousFrom = mapPointForNode(input.graph, input.previousEdge.fromNodeId);
  const previousTo = mapPointForNode(input.graph, input.previousEdge.toNodeId);
  const currentTo = mapPointForNode(input.graph, input.edge.toNodeId);

  if (!previousFrom || !previousTo || !currentTo) {
    return "continue";
  }

  const previousHeading = headingDegrees(previousFrom, previousTo);
  const currentHeading = headingDegrees(previousTo, currentTo);
  const delta = normaliseTurnDegrees(currentHeading - previousHeading);

  if (Math.abs(delta) < 30) {
    return "straight-on";
  }

  return delta > 0 ? "turn-right" : "turn-left";
}

function instructionText(kind: RouteInstructionKind, road: string): string {
  if (kind === "turn-left") {
    return `Turn left onto ${road}.`;
  }

  if (kind === "turn-right") {
    return `Turn right onto ${road}.`;
  }

  if (kind === "straight-on") {
    return `Continue straight onto ${road}.`;
  }

  if (kind === "roundabout-exit") {
    return `Use the roundabout and leave onto ${road}.`;
  }

  if (kind === "junction-decision") {
    return `At the junction, choose the legal movement onto ${road}.`;
  }

  return `Continue onto ${road}.`;
}

function legIdForEdgeIndex(
  legRanges: readonly { legId: string; startNodeIndex: number; endNodeIndex: number }[],
  edgeIndex: number
): string | undefined {
  return legRanges.find((range) => edgeIndex >= range.startNodeIndex && edgeIndex < range.endNodeIndex)?.legId;
}

function buildRouteInstructions(input: {
  graph: MapGraph;
  route: FoundShortestLegalRoute;
  checkpoints: readonly RouteStop[];
}): RouteInstruction[] {
  const instructions: RouteInstruction[] = [];
  const checkpointNodeIds = new Set(
    input.checkpoints
      .slice(1, -1)
      .map(stopNodeId)
      .filter((nodeId): nodeId is string => Boolean(nodeId))
  );
  const legRanges = buildLegRanges({ route: input.route, checkpoints: input.checkpoints });
  let sequence = 1;

  instructions.push({
    id: "instruction-start",
    sequence,
    kind: "start",
    text: `Start at ${nodeLabel(input.graph, input.route.startNodeId, "the start point")}.`,
    nodeId: input.route.startNodeId,
    mapPoint: mapPointForNode(input.graph, input.route.startNodeId)
  });
  sequence += 1;

  for (let edgeIndex = 0; edgeIndex < input.route.edgeIds.length; edgeIndex += 1) {
    const edge = input.graph.edgesById[input.route.edgeIds[edgeIndex]];

    if (!edge) {
      continue;
    }

    const previousEdgeId = input.route.edgeIds[edgeIndex - 1];
    const previousEdge = previousEdgeId ? input.graph.edgesById[previousEdgeId] ?? null : null;
    const kind = turnKind({ graph: input.graph, previousEdge, edge });

    instructions.push({
      id: `instruction-${String(sequence).padStart(2, "0")}`,
      legId: legIdForEdgeIndex(legRanges, edgeIndex),
      sequence,
      kind,
      text: instructionText(kind, roadName(input.graph, edge)),
      roadName: roadName(input.graph, edge),
      roadId: edge.roadId,
      nodeId: edge.fromNodeId,
      mapPoint: mapPointForNode(input.graph, edge.fromNodeId),
      decisionPoint:
        kind === "junction-decision"
          ? {
              nodeId: edge.fromNodeId,
              allowedRoadIds: stableUnique((input.graph.outgoingEdgesByNodeId[edge.fromNodeId] ?? []).map((candidate) => candidate.roadId))
            }
          : undefined
    });
    sequence += 1;

    if (checkpointNodeIds.has(edge.toNodeId)) {
      instructions.push({
        id: `instruction-${String(sequence).padStart(2, "0")}`,
        legId: legIdForEdgeIndex(legRanges, edgeIndex),
        sequence,
        kind: "checkpoint",
        text: `Pass checkpoint at ${nodeLabel(input.graph, edge.toNodeId, "the checkpoint")}.`,
        nodeId: edge.toNodeId,
        mapPoint: mapPointForNode(input.graph, edge.toNodeId)
      });
      sequence += 1;
    }
  }

  instructions.push({
    id: `instruction-${String(sequence).padStart(2, "0")}`,
    sequence,
    kind: "arrive",
    text: `Arrive at ${nodeLabel(input.graph, input.route.endNodeId, "the destination")}.`,
    nodeId: input.route.endNodeId,
    mapPoint: mapPointForNode(input.graph, input.route.endNodeId)
  });

  return instructions;
}

function objectiveForType(exerciseType: ExerciseType): ExerciseObjective {
  if (exerciseType === "choose-legal-route") {
    return {
      id: "objective-legal-route-choice",
      title: "Choose a legal route",
      category: "route-legality",
      required: true,
      successCriteria: ["Avoid one-way, no-entry, prohibited-turn, and restricted-road failures present in the map data."],
      linkedFaultCategories: ["no-entry", "one-way-direction", "prohibited-turn", "restricted-road"]
    };
  }

  if (exerciseType === "identify-next-safe-turn") {
    return {
      id: "objective-next-safe-turn",
      title: "Identify the next safe turn",
      category: "junction-decision",
      required: true,
      successCriteria: ["Select the next legal movement at each mapped decision point."],
      linkedFaultCategories: ["unsafe-junction-decision", "map-reading"]
    };
  }

  if (exerciseType === "practise-roundabouts") {
    return {
      id: "objective-roundabout-control",
      title: "Practise roundabout decisions",
      category: "roundabout-control",
      required: true,
      successCriteria: ["Follow the route through detectable roundabout segments without illegal turns."],
      linkedFaultCategories: ["roundabout-decision"]
    };
  }

  if (exerciseType === "practise-junction-decision-making") {
    return {
      id: "objective-junction-decisions",
      title: "Practise junction decision-making",
      category: "junction-decision",
      required: true,
      successCriteria: ["Use mapped road connectivity to choose safe turns at junctions."],
      linkedFaultCategories: ["unsafe-junction-decision"]
    };
  }

  if (exerciseType === "route-review-mistake-correction") {
    return {
      id: "objective-mistake-correction",
      title: "Correct route-review mistakes",
      category: "mistake-correction",
      required: true,
      successCriteria: ["Compare the planned route with validation feedback and correct illegal or inefficient movements."],
      linkedFaultCategories: ["route-efficiency", "route-drawing"]
    };
  }

  return {
    id: "objective-follow-planned-route",
    title: "Follow the planned route",
    category: "map-reading",
    required: true,
    successCriteria: ["Follow each generated instruction in order from start to destination."],
    linkedFaultCategories: ["map-reading", "route-drawing"]
  };
}

function buildObjectives(input: {
  exerciseType: ExerciseType;
  difficulty: ExerciseDifficulty;
  validation: LearnerRouteValidationResult;
}): ExerciseObjective[] {
  return [
    objectiveForType(input.exerciseType),
    {
      id: "objective-route-legality",
      title: "Keep the route legal",
      category: "restriction-awareness",
      required: true,
      description: "Only legal restrictions available in the map data are treated as blocking.",
      successCriteria: ["Submit a route with no blocking validation errors."],
      linkedFaultCategories: ["no-entry", "one-way-direction", "prohibited-turn", "restricted-road"]
    },
    {
      id: "objective-difficulty-fit",
      title: `Complete a ${input.difficulty} route`,
      category: input.validation.metrics.junctionDecisionCount > 0 ? "junction-decision" : "route-efficiency",
      required: false,
      successCriteria: [
        `Stay within the ${input.difficulty} practice distance and complexity limits where the map data supports them.`
      ],
      linkedFaultCategories: ["route-efficiency", "unsafe-junction-decision"]
    }
  ];
}

function routeGeometry(graph: MapGraph, route: FoundShortestLegalRoute): Vec2[] {
  return route.nodeIds
    .map((nodeId) => graph.nodesById[nodeId])
    .filter((node): node is MapNode => Boolean(node))
    .map((node) => ({ x: node.x, y: node.y }));
}

function estimatedDifficultyFromValidation(validation: LearnerRouteValidationResult): ExerciseDifficulty {
  const metrics = validation.metrics;

  if (
    metrics.segmentCount >= 10 ||
    metrics.routeDistanceMeters >= 2200 ||
    metrics.junctionDecisionCount >= 7 ||
    metrics.roundaboutSegmentCount >= 3
  ) {
    return "advanced";
  }

  if (
    metrics.segmentCount >= 6 ||
    metrics.routeDistanceMeters >= 900 ||
    metrics.junctionDecisionCount >= 3 ||
    metrics.roundaboutSegmentCount >= 1
  ) {
    return "intermediate";
  }

  if (metrics.segmentCount >= 3 || metrics.routeDistanceMeters >= 400) {
    return "easy";
  }

  return "beginner";
}

function exerciseTypeLabel(type: ExerciseType): string {
  return type.replaceAll("-", " ");
}

function titleCase(value: string): string {
  return value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildGeneratedExercise(input: {
  map: MapDefinition;
  graph: MapGraph;
  difficulty: ExerciseDifficulty;
  exerciseType: ExerciseType;
  candidate: CandidateRoute;
  seed: string;
  attempts: number;
  generationStatus: Exclude<LearnerExerciseGenerationStatus, "failed">;
  reasonCodes: LearnerExerciseGenerationReasonCode[];
  targetAreaBounds?: LearnerExerciseTargetBounds;
  constraints: LearnerRouteValidationConstraints;
  candidateOptions: LearnerExerciseCandidateOption[];
  published: boolean;
}): GeneratedLearnerExercise {
  const checkpoints = checkpointStops({
    graph: input.graph,
    route: input.candidate.route,
    difficulty: input.difficulty,
    exerciseType: input.exerciseType
  });
  const routeLegs = buildRouteLegs({
    graph: input.graph,
    route: input.candidate.route,
    checkpoints
  });
  const exerciseId = slug(
    [
      "learner",
      input.map.id,
      input.exerciseType,
      input.difficulty,
      input.seed,
      input.candidate.route.startNodeId,
      input.candidate.route.endNodeId
    ].join("-")
  );

  return {
    id: exerciseId,
    title: `${titleCase(input.difficulty)} ${titleCase(exerciseTypeLabel(input.exerciseType))}`,
    type: input.exerciseType,
    difficulty: input.difficulty,
    mapId: input.map.id,
    mapVersion: input.map.mapVersion ?? input.map.version,
    objectives: buildObjectives({
      exerciseType: input.exerciseType,
      difficulty: input.difficulty,
      validation: input.candidate.validation
    }),
    routeLegs,
    routeInstructions: buildRouteInstructions({
      graph: input.graph,
      route: input.candidate.route,
      checkpoints
    }),
    estimatedMinutes: Math.max(1, Math.ceil(input.candidate.validation.metrics.estimatedTimeMinutes)),
    tags: stableUnique([
      "phase-7",
      "learner-generated",
      input.difficulty,
      input.exerciseType,
      ...input.candidate.validation.ruleCodes.map((code) => `validation-${code}`)
    ]),
    published: input.published,
    routeGeometry: routeGeometry(input.graph, input.candidate.route),
    checkpoints,
    expectedRouteSegments: input.candidate.routeSegments,
    estimatedDifficulty: estimatedDifficultyFromValidation(input.candidate.validation),
    validation: input.candidate.validation,
    generationMetadata: {
      status: input.generationStatus,
      seed: input.seed,
      attempts: input.attempts,
      routeSignature: input.candidate.routeSignature,
      complexity: input.candidate.complexity,
      reasonCodes: stableUnique(input.reasonCodes),
      targetBounds: input.targetAreaBounds,
      constraints: input.constraints,
      candidateOptions: input.candidateOptions
    }
  };
}

export function generateLearnerExercise(input: GenerateLearnerExerciseInput): LearnerExerciseGenerationResult {
  const seed = String(input.seed ?? DEFAULT_SEED);
  const profile = difficultyProfiles[input.difficulty];
  const random = seededRandom(`${seed}:${input.map.id}:${input.difficulty}:${input.exerciseType}`);
  const graph = buildMapGraph(input.map);
  const nodes = candidateNodeIds(graph, input.targetAreaBounds);
  const attempts: LearnerExerciseGenerationAttempt[] = [];

  if (nodes.length < 2 || graph.edges.length === 0) {
    return {
      status: "failed",
      exercise: null,
      validation: null,
      attempts,
      reasonCodes: ["insufficient-map-data"],
      explanation: "The map does not contain enough connected drivable candidate nodes to generate a learner exercise."
    };
  }

  const maxAttempts = Math.max(1, Math.floor(input.maxAttempts ?? profile.defaultMaxAttempts));
  const pairs = buildCandidatePairs({
    nodeIds: nodes,
    profile,
    maxAttempts,
    random
  });

  if (pairs.length === 0) {
    return {
      status: "failed",
      exercise: null,
      validation: null,
      attempts,
      reasonCodes: ["no-candidate-pairs"],
      explanation: "No candidate start and destination pairs were available inside the requested target area."
    };
  }

  const constraints = constraintsForGeneration(input.difficulty, input.constraints);
  const avoidRouteSignatures = new Set(input.avoidRouteSignatures ?? []);
  const candidateOptionCount = Math.max(1, Math.floor(input.candidateOptionCount ?? 3));
  let bestStrictCandidate: CandidateRoute | null = null;
  let bestValidCandidate: CandidateRoute | null = null;
  const validCandidates: CandidateRoute[] = [];
  let sawNoLegalRoute = false;

  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];
    const candidate = evaluateCandidate({
      map: input.map,
      graph,
      startNodeId: pair.startNodeId,
      destinationNodeId: pair.destinationNodeId,
      difficulty: input.difficulty,
      profile,
      constraints,
      avoidRouteSignatures,
      targetAreaBounds: input.targetAreaBounds
    });

    if (!candidate) {
      sawNoLegalRoute = true;
      attempts.push(
        buildAttempt({
          sequence: index + 1,
          status: "rejected",
          startNodeId: pair.startNodeId,
          destinationNodeId: pair.destinationNodeId,
          reasonCodes: ["no-legal-route"]
        })
      );
      continue;
    }

    const accepted = candidate.validation.valid && !candidate.reasonCodes.includes("route-outside-target-bounds");

    attempts.push(
      buildAttempt({
        sequence: index + 1,
        status: accepted ? "accepted" : "rejected",
        startNodeId: pair.startNodeId,
        destinationNodeId: pair.destinationNodeId,
        route: candidate.route,
        validation: candidate.validation,
        reasonCodes: candidate.reasonCodes.length > 0 ? candidate.reasonCodes : ["candidate-selected"]
      })
    );

    if (!accepted) {
      continue;
    }

    bestValidCandidate = bestCandidate(bestValidCandidate, candidate);
    validCandidates.push(candidate);

    if (
      candidate.validation.status === "valid" &&
      candidate.profileFit &&
      !candidate.reasonCodes.includes("duplicate-route-signature")
    ) {
      bestStrictCandidate = bestCandidate(bestStrictCandidate, candidate);
    }
  }

  const selectedCandidate = bestStrictCandidate ?? bestValidCandidate;

  if (!selectedCandidate) {
    const reasonCodes: LearnerExerciseGenerationReasonCode[] = sawNoLegalRoute ? ["no-legal-route"] : ["validation-blocked"];

    return {
      status: "failed",
      exercise: null,
      validation: null,
      attempts,
      reasonCodes,
      explanation: "No route candidate passed the available validation checks for the requested exercise settings."
    };
  }

  const generationStatus: Exclude<LearnerExerciseGenerationStatus, "failed"> =
    selectedCandidate === bestStrictCandidate &&
    !selectedCandidate.reasonCodes.includes("duplicate-route-signature") &&
    !selectedCandidate.reasonCodes.includes("difficulty-too-simple")
      ? "generated"
      : "degraded";
  const reasonCodes: LearnerExerciseGenerationReasonCode[] =
    generationStatus === "generated"
      ? ["candidate-selected"]
      : stableUnique(["candidate-degraded", ...selectedCandidate.reasonCodes]);
  const candidateOptions = buildCandidateOptions({
    candidates: validCandidates,
    selectedCandidate,
    difficulty: input.difficulty,
    exerciseType: input.exerciseType,
    count: candidateOptionCount
  });
  const exercise = buildGeneratedExercise({
    map: input.map,
    graph,
    difficulty: input.difficulty,
    exerciseType: input.exerciseType,
    candidate: selectedCandidate,
    seed,
    attempts: attempts.length,
    generationStatus,
    reasonCodes,
    targetAreaBounds: input.targetAreaBounds,
    constraints,
    candidateOptions,
    published: input.published ?? false
  });

  return {
    status: generationStatus,
    exercise,
    validation: selectedCandidate.validation,
    attempts,
    candidateOptions,
    reasonCodes: stableUnique(reasonCodes),
    explanation:
      generationStatus === "generated"
        ? "Generated a learner exercise that fits the requested validation and difficulty profile."
        : "Generated the best available learner exercise, but returned advisory validation or difficulty-fit metadata."
  };
}
