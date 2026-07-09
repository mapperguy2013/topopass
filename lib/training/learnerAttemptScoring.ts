import type { MapDefinition, RouteStop } from "../map-engine/index.ts";
import type {
  AttemptScore,
  DrivingFault,
  DrivingFaultCategory,
  DrivingFaultSeverity,
  ExerciseObjective,
  Hint,
  HintLevel,
  LearnerExercise
} from "./learnerDriverTraining.ts";
import type { GeneratedLearnerExercise } from "./learnerExerciseGeneration.ts";
import {
  validateLearnerRoute,
  type LearnerRouteValidationConstraints,
  type LearnerRouteValidationIssue,
  type LearnerRouteValidationResult,
  type LearnerRouteValidationRuleCode,
  type LearnerRouteValidationSegment
} from "./learnerRouteValidation.ts";

export type ScorableLearnerExercise = LearnerExercise & {
  expectedRouteSegments: readonly LearnerRouteValidationSegment[];
  checkpoints?: readonly RouteStop[];
  validation?: LearnerRouteValidationResult;
  generationMetadata?: {
    constraints?: LearnerRouteValidationConstraints;
  };
};

export type LearnerAttemptScoringStatus = "passed" | "failed" | "incomplete" | "blocked";

export type LearnerAttemptRouteAnnotationStatus =
  | "on-route"
  | "recovered"
  | "off-route"
  | "illegal"
  | "unattempted";

export type LearnerAttemptObjectiveScore = {
  objectiveId: string;
  title: string;
  category: ExerciseObjective["category"];
  scorePercent: number;
  achieved: boolean;
  faultIds: string[];
  explanation: string;
};

export type LearnerAttemptRouteSegmentAnnotation = {
  routeSegmentId: string;
  attemptedSegmentIndex: number | null;
  expectedSegmentIndex?: number;
  roadId: string;
  status: LearnerAttemptRouteAnnotationStatus;
  severity?: DrivingFaultSeverity;
  faultIds: string[];
  explanation: string;
};

export type LearnerAttemptScoredFault = DrivingFault & {
  blocking: boolean;
  scorePenalty: number;
  routeSegmentIds: string[];
  ruleCodes?: LearnerRouteValidationRuleCode[];
};

export type LearnerAttemptScoringMetrics = {
  expectedDistanceMeters: number;
  attemptedDistanceMeters: number;
  extraDistanceMeters: number;
  efficiencyPercent: number;
  expectedTimeMinutes?: number;
  elapsedTimeMinutes?: number;
  timeEfficiencyPercent?: number;
  routeAdherencePercent: number;
  completedCheckpointCount: number;
  totalCheckpointCount: number;
  hintPenalty: number;
};

export type ScoreLearnerAttemptInput = {
  map: MapDefinition;
  exercise: ScorableLearnerExercise | GeneratedLearnerExercise;
  attemptedRouteSegments: readonly LearnerRouteValidationSegment[];
  attemptId?: string;
  hintsUsed?: readonly Hint[];
  hintLevels?: readonly HintLevel[];
  elapsedTimeMinutes?: number;
  previousFaults?: readonly DrivingFault[];
  passScorePercent?: number;
};

export type LearnerAttemptScoringResult = {
  attemptId: string;
  status: LearnerAttemptScoringStatus;
  passed: boolean;
  completed: boolean;
  totalScore: number;
  scorePercent: number;
  attemptScore: AttemptScore;
  minorFaults: LearnerAttemptScoredFault[];
  seriousFaults: LearnerAttemptScoredFault[];
  dangerousFaults: LearnerAttemptScoredFault[];
  faults: LearnerAttemptScoredFault[];
  objectiveScores: LearnerAttemptObjectiveScore[];
  routeSegmentAnnotations: LearnerAttemptRouteSegmentAnnotation[];
  summaryExplanation: string;
  validation: LearnerRouteValidationResult;
  metrics: LearnerAttemptScoringMetrics;
};

type SegmentKey = string;

type RouteAdherenceResult = {
  annotations: LearnerAttemptRouteSegmentAnnotation[];
  faults: LearnerAttemptScoredFault[];
  matchedExpectedIndexes: Set<number>;
  routeAdherencePercent: number;
};

type CheckpointResult = {
  completed: boolean;
  completedCheckpointCount: number;
  totalCheckpointCount: number;
  faults: LearnerAttemptScoredFault[];
};

const DEFAULT_PASS_SCORE_PERCENT = 70;
const DETOUR_WARNING_RATIO = 1.2;
const EXCESSIVE_DETOUR_RATIO = 1.6;
const TIME_WARNING_RATIO = 1.35;
const EXCESSIVE_TIME_RATIO = 1.75;

const faultPenaltyBySeverity: Record<DrivingFaultSeverity, number> = {
  observation: 1,
  minor: 6,
  serious: 24,
  dangerous: 40
};

const severityRank: Record<DrivingFaultSeverity, number> = {
  observation: 0,
  minor: 1,
  serious: 2,
  dangerous: 3
};

const hintPenaltyByLevel: Record<HintLevel, number> = {
  none: 0,
  nudge: 2,
  guided: 5,
  "worked-example": 10,
  "show-answer": 15
};

const validationRuleFaults: Record<
  LearnerRouteValidationRuleCode,
  {
    category: DrivingFaultCategory;
    severity: DrivingFaultSeverity;
    title: string;
    blocking: boolean;
  }
> = {
  "empty-route": {
    category: "route-drawing",
    severity: "serious",
    title: "No usable route submitted",
    blocking: true
  },
  "unknown-road-segment": {
    category: "route-drawing",
    severity: "serious",
    title: "Unknown road segment",
    blocking: true
  },
  "unknown-route-node": {
    category: "route-drawing",
    severity: "serious",
    title: "Unknown route node",
    blocking: true
  },
  "road-endpoint-mismatch": {
    category: "route-drawing",
    severity: "serious",
    title: "Invalid road movement",
    blocking: true
  },
  "start-segment-invalid": {
    category: "wrong-start",
    severity: "serious",
    title: "Wrong start",
    blocking: true
  },
  "end-segment-invalid": {
    category: "wrong-destination",
    severity: "serious",
    title: "Wrong destination",
    blocking: true
  },
  "disconnected-route-jump": {
    category: "route-drawing",
    severity: "serious",
    title: "Impossible route jump",
    blocking: true
  },
  "wrong-way-one-way": {
    category: "one-way-direction",
    severity: "serious",
    title: "Wrong-way one-way movement",
    blocking: true
  },
  "no-entry-restriction": {
    category: "no-entry",
    severity: "serious",
    title: "No-entry movement",
    blocking: true
  },
  "closed-or-restricted-road": {
    category: "restricted-road",
    severity: "dangerous",
    title: "Closed or restricted road",
    blocking: true
  },
  "prohibited-turn": {
    category: "prohibited-turn",
    severity: "serious",
    title: "Prohibited turn",
    blocking: true
  },
  "non-drivable-segment": {
    category: "restricted-road",
    severity: "dangerous",
    title: "Non-drivable segment",
    blocking: true
  },
  "access-metadata-unavailable": {
    category: "map-reading",
    severity: "observation",
    title: "Access metadata unavailable",
    blocking: false
  },
  "unknown-road-access": {
    category: "map-reading",
    severity: "observation",
    title: "Road access could not be verified",
    blocking: false
  },
  "excessive-route-complexity": {
    category: "route-efficiency",
    severity: "minor",
    title: "Route complexity is high",
    blocking: false
  },
  "roundabout-complexity": {
    category: "roundabout-decision",
    severity: "minor",
    title: "Roundabout complexity is high",
    blocking: false
  },
  "route-length-out-of-bounds": {
    category: "route-efficiency",
    severity: "minor",
    title: "Route length outside target range",
    blocking: false
  },
  "estimated-time-out-of-bounds": {
    category: "route-efficiency",
    severity: "minor",
    title: "Estimated time outside target range",
    blocking: false
  },
  "duplicate-loop": {
    category: "route-efficiency",
    severity: "minor",
    title: "Duplicate loop",
    blocking: false
  },
  "unnecessary-backtracking": {
    category: "route-efficiency",
    severity: "minor",
    title: "Unnecessary backtracking",
    blocking: false
  },
  "author-start-missing": {
    category: "wrong-start",
    severity: "serious",
    title: "Authoring start missing",
    blocking: true
  },
  "author-destination-missing": {
    category: "wrong-destination",
    severity: "serious",
    title: "Authoring destination missing",
    blocking: true
  },
  "author-route-missing": {
    category: "route-drawing",
    severity: "serious",
    title: "Authoring route missing",
    blocking: true
  },
  "author-route-not-matched": {
    category: "route-drawing",
    severity: "serious",
    title: "Authoring route not matched",
    blocking: true
  },
  "author-metadata-incomplete": {
    category: "map-reading",
    severity: "observation",
    title: "Authoring metadata incomplete",
    blocking: false
  },
  "author-checkpoint-missing": {
    category: "missed-checkpoint",
    severity: "serious",
    title: "Authoring checkpoint missing",
    blocking: true
  },
  "author-checkpoint-missed": {
    category: "missed-checkpoint",
    severity: "serious",
    title: "Authored checkpoint not on route",
    blocking: true
  },
  "author-checkpoint-out-of-order": {
    category: "wrong-checkpoint-order",
    severity: "serious",
    title: "Authored checkpoint out of order",
    blocking: true
  }
};

function segmentKey(segment: Pick<LearnerRouteValidationSegment, "roadId" | "fromNodeId" | "toNodeId">): SegmentKey {
  return `${segment.roadId}:${segment.fromNodeId}->${segment.toNodeId}`;
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function roundScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

function routeNodeSequence(routeSegments: readonly LearnerRouteValidationSegment[]): string[] {
  if (routeSegments.length === 0) {
    return [];
  }

  return [routeSegments[0].fromNodeId, ...routeSegments.map((segment) => segment.toNodeId)];
}

function stopNodeId(stop: RouteStop): string | null {
  return stop.type === "node" ? stop.nodeId : null;
}

function exerciseCheckpointNodeIds(exercise: ScorableLearnerExercise | GeneratedLearnerExercise): string[] {
  const checkpointNodeIds = (exercise.checkpoints ?? [])
    .map(stopNodeId)
    .filter((nodeId): nodeId is string => Boolean(nodeId));

  if (checkpointNodeIds.length >= 2) {
    return checkpointNodeIds;
  }

  const firstSegment = exercise.expectedRouteSegments[0];
  const lastSegment = exercise.expectedRouteSegments[exercise.expectedRouteSegments.length - 1];

  return firstSegment && lastSegment ? [firstSegment.fromNodeId, lastSegment.toNodeId] : [];
}

function makeFaultFactory(attemptId: string): (input: {
  category: DrivingFaultCategory;
  severity: DrivingFaultSeverity;
  title: string;
  detail?: string;
  relatedRoadIds?: readonly string[];
  relatedNodeIds?: readonly string[];
  routeSegmentIds?: readonly string[];
  ruleCodes?: readonly LearnerRouteValidationRuleCode[];
  blocking?: boolean;
  scorePenalty?: number;
}) => LearnerAttemptScoredFault {
  let nextFaultNumber = 1;

  return (input) => {
    const severityPenalty = faultPenaltyBySeverity[input.severity];
    const id = `${attemptId}-fault-${String(nextFaultNumber).padStart(2, "0")}`;
    nextFaultNumber += 1;

    return {
      id,
      attemptId,
      category: input.category,
      severity: input.severity,
      title: input.title,
      detail: input.detail,
      relatedRoadIds: uniqueStrings([...(input.relatedRoadIds ?? [])]),
      relatedNodeIds: uniqueStrings([...(input.relatedNodeIds ?? [])]),
      source: "system",
      blocking: input.blocking ?? false,
      scorePenalty: input.scorePenalty ?? severityPenalty,
      routeSegmentIds: uniqueStrings([...(input.routeSegmentIds ?? [])]),
      ruleCodes: input.ruleCodes ? uniqueStrings([...input.ruleCodes]) as LearnerRouteValidationRuleCode[] : undefined
    };
  };
}

function constraintsForExercise(
  exercise: ScorableLearnerExercise | GeneratedLearnerExercise
): LearnerRouteValidationConstraints | undefined {
  return exercise.generationMetadata?.constraints;
}

function validationFaults(input: {
  validation: LearnerRouteValidationResult;
  makeFault: ReturnType<typeof makeFaultFactory>;
}): LearnerAttemptScoredFault[] {
  return [...input.validation.blockingErrors, ...input.validation.advisoryWarnings]
    .filter((issue) => issue.severity === "error" || issue.code !== "access-metadata-unavailable")
    .map((issue) => {
      const mapping = validationRuleFaults[issue.code];

      return input.makeFault({
        category: mapping.category,
        severity: mapping.severity,
        title: mapping.title,
        detail: issue.explanation,
        relatedRoadIds: issue.roadIds,
        relatedNodeIds: issue.nodeIds,
        routeSegmentIds: issue.routeSegmentIds,
        ruleCodes: [issue.code],
        blocking: mapping.blocking,
        scorePenalty: issue.severity === "warning" ? Math.min(faultPenaltyBySeverity[mapping.severity], 6) : undefined
      });
    });
}

function faultForOffRouteRun(input: {
  makeFault: ReturnType<typeof makeFaultFactory>;
  recovered: boolean;
  routeSegmentIds: readonly string[];
  roadIds: readonly string[];
  fromNodeId?: string;
  toNodeId?: string;
}): LearnerAttemptScoredFault {
  return input.makeFault({
    category: "unsafe-junction-decision",
    severity: input.recovered ? "minor" : "serious",
    title: input.recovered ? "Wrong turn recovered" : "Wrong turn not recovered",
    detail: input.recovered
      ? "The attempt left the planned route but recovered onto a later expected segment."
      : "The attempt left the planned route and did not recover before the route ended.",
    relatedRoadIds: input.roadIds,
    relatedNodeIds: [input.fromNodeId, input.toNodeId].filter((nodeId): nodeId is string => Boolean(nodeId)),
    routeSegmentIds: input.routeSegmentIds,
    blocking: false
  });
}

function applyFaultToAnnotations(
  annotations: LearnerAttemptRouteSegmentAnnotation[],
  routeSegmentIds: readonly string[],
  fault: LearnerAttemptScoredFault,
  status?: LearnerAttemptRouteAnnotationStatus
): void {
  for (const annotation of annotations) {
    if (!routeSegmentIds.includes(annotation.routeSegmentId)) {
      continue;
    }

    annotation.faultIds = uniqueStrings([...annotation.faultIds, fault.id]);
    annotation.severity =
      annotation.severity && severityRank[annotation.severity] > severityRank[fault.severity]
        ? annotation.severity
        : fault.severity;

    if (status) {
      annotation.status = status;
    }
  }
}

function analyseRouteAdherence(input: {
  expectedSegments: readonly LearnerRouteValidationSegment[];
  attemptedSegments: readonly LearnerRouteValidationSegment[];
  makeFault: ReturnType<typeof makeFaultFactory>;
}): RouteAdherenceResult {
  const expectedKeys = input.expectedSegments.map(segmentKey);
  const annotations: LearnerAttemptRouteSegmentAnnotation[] = [];
  const faults: LearnerAttemptScoredFault[] = [];
  const matchedExpectedIndexes = new Set<number>();
  let expectedCursor = 0;
  let currentOffRouteIndexes: number[] = [];

  function closeOffRouteRun(recovered: boolean): void {
    if (currentOffRouteIndexes.length === 0) {
      return;
    }

    const routeSegmentIds = currentOffRouteIndexes.map((index) => annotations[index].routeSegmentId);
    const roadIds = currentOffRouteIndexes.map((index) => annotations[index].roadId);
    const firstSegment = input.attemptedSegments[currentOffRouteIndexes[0]];
    const lastSegment = input.attemptedSegments[currentOffRouteIndexes[currentOffRouteIndexes.length - 1]];
    const fault = faultForOffRouteRun({
      makeFault: input.makeFault,
      recovered,
      routeSegmentIds,
      roadIds,
      fromNodeId: firstSegment?.fromNodeId,
      toNodeId: lastSegment?.toNodeId
    });

    faults.push(fault);
    applyFaultToAnnotations(annotations, routeSegmentIds, fault, recovered ? "recovered" : "off-route");
    currentOffRouteIndexes = [];
  }

  for (let index = 0; index < input.attemptedSegments.length; index += 1) {
    const segment = input.attemptedSegments[index];
    const key = segmentKey(segment);
    const directExpectedIndex = expectedKeys[expectedCursor] === key ? expectedCursor : -1;
    const futureExpectedIndex =
      directExpectedIndex >= 0 ? directExpectedIndex : expectedKeys.findIndex((candidate, candidateIndex) => candidateIndex > expectedCursor && candidate === key);
    const matchedExpectedIndex = futureExpectedIndex >= 0 ? futureExpectedIndex : directExpectedIndex;

    annotations.push({
      routeSegmentId: segment.id,
      attemptedSegmentIndex: index,
      expectedSegmentIndex: matchedExpectedIndex >= 0 ? matchedExpectedIndex : undefined,
      roadId: segment.roadId,
      status: matchedExpectedIndex >= 0 ? "on-route" : "off-route",
      faultIds: [],
      explanation:
        matchedExpectedIndex >= 0
          ? "Segment follows the generated route."
          : "Segment leaves the generated route."
    });

    if (matchedExpectedIndex >= 0) {
      closeOffRouteRun(true);
      matchedExpectedIndexes.add(matchedExpectedIndex);
      expectedCursor = matchedExpectedIndex + 1;
    } else {
      currentOffRouteIndexes.push(index);
    }
  }

  closeOffRouteRun(false);

  input.expectedSegments.forEach((segment, expectedIndex) => {
    if (matchedExpectedIndexes.has(expectedIndex)) {
      return;
    }

    annotations.push({
      routeSegmentId: segment.id,
      attemptedSegmentIndex: null,
      expectedSegmentIndex: expectedIndex,
      roadId: segment.roadId,
      status: "unattempted",
      faultIds: [],
      explanation: "Expected route segment was not attempted."
    });
  });

  const routeAdherencePercent =
    input.expectedSegments.length > 0 ? (matchedExpectedIndexes.size / input.expectedSegments.length) * 100 : 0;

  return {
    annotations,
    faults,
    matchedExpectedIndexes,
    routeAdherencePercent
  };
}

function visitIndexAfter(visitedNodeIds: readonly string[], nodeId: string, afterIndex: number): number {
  for (let index = afterIndex + 1; index < visitedNodeIds.length; index += 1) {
    if (visitedNodeIds[index] === nodeId) {
      return index;
    }
  }

  return -1;
}

function visitIndexAtOrBefore(visitedNodeIds: readonly string[], nodeId: string, beforeOrAtIndex: number): number {
  for (let index = 0; index <= beforeOrAtIndex && index < visitedNodeIds.length; index += 1) {
    if (visitedNodeIds[index] === nodeId) {
      return index;
    }
  }

  return -1;
}

function analyseCheckpoints(input: {
  exercise: ScorableLearnerExercise | GeneratedLearnerExercise;
  attemptedSegments: readonly LearnerRouteValidationSegment[];
  makeFault: ReturnType<typeof makeFaultFactory>;
}): CheckpointResult {
  const requiredNodeIds = exerciseCheckpointNodeIds(input.exercise);
  const visitedNodeIds = routeNodeSequence(input.attemptedSegments);
  const faults: LearnerAttemptScoredFault[] = [];
  let completedCheckpointCount = 0;
  let previousVisitIndex = -1;

  for (let index = 0; index < requiredNodeIds.length; index += 1) {
    const requiredNodeId = requiredNodeIds[index];
    const visitIndex = visitIndexAfter(visitedNodeIds, requiredNodeId, previousVisitIndex);

    if (visitIndex >= 0) {
      completedCheckpointCount += 1;
      previousVisitIndex = visitIndex;
      continue;
    }

    const outOfOrderVisitIndex = visitIndexAtOrBefore(visitedNodeIds, requiredNodeId, previousVisitIndex);

    if (outOfOrderVisitIndex >= 0 && index > 0 && index < requiredNodeIds.length - 1) {
      faults.push(
        input.makeFault({
          category: "wrong-checkpoint-order",
          severity: "serious",
          title: "Checkpoint visited out of order",
          detail: `The attempt visited checkpoint node ${requiredNodeId} before completing the earlier required checkpoint sequence.`,
          relatedNodeIds: [requiredNodeId],
          blocking: false
        })
      );
      continue;
    }

    if (index === 0) {
      faults.push(
        input.makeFault({
          category: "wrong-start",
          severity: "serious",
          title: "Wrong start",
          detail: `The attempt did not start at required node ${requiredNodeId}.`,
          relatedNodeIds: [requiredNodeId],
          blocking: true
        })
      );
    } else if (index === requiredNodeIds.length - 1) {
      faults.push(
        input.makeFault({
          category: "wrong-destination",
          severity: "serious",
          title: "Route incomplete",
          detail: `The attempt did not reach required destination node ${requiredNodeId}.`,
          relatedNodeIds: [requiredNodeId],
          blocking: true
        })
      );
    } else {
      faults.push(
        input.makeFault({
          category: "missed-checkpoint",
          severity: "serious",
          title: "Missed checkpoint",
          detail: `The attempt missed checkpoint node ${requiredNodeId}.`,
          relatedNodeIds: [requiredNodeId],
          blocking: false
        })
      );
    }
  }

  return {
    completed:
      requiredNodeIds.length > 0 &&
      visitedNodeIds[0] === requiredNodeIds[0] &&
      visitedNodeIds[visitedNodeIds.length - 1] === requiredNodeIds[requiredNodeIds.length - 1],
    completedCheckpointCount,
    totalCheckpointCount: requiredNodeIds.length,
    faults
  };
}

function hintLevels(input: ScoreLearnerAttemptInput): HintLevel[] {
  return [
    ...(input.hintLevels ?? []),
    ...(input.hintsUsed ?? []).map((hint) => hint.level)
  ].filter((level) => level !== "none");
}

function hintFault(input: {
  levels: readonly HintLevel[];
  makeFault: ReturnType<typeof makeFaultFactory>;
}): LearnerAttemptScoredFault | null {
  const penalty = input.levels.reduce((total, level) => total + hintPenaltyByLevel[level], 0);

  if (penalty <= 0) {
    return null;
  }

  const highestHintLevel = input.levels.reduce<HintLevel>(
    (highest, level) => (hintPenaltyByLevel[level] > hintPenaltyByLevel[highest] ? level : highest),
    "none"
  );

  return input.makeFault({
    category: "map-reading",
    severity: highestHintLevel === "show-answer" || highestHintLevel === "worked-example" ? "minor" : "observation",
    title: "Hints used",
    detail: `${input.levels.length} hint(s) used during the attempt.`,
    blocking: false,
    scorePenalty: penalty
  });
}

function repeatedMistakeFaults(input: {
  currentFaults: readonly LearnerAttemptScoredFault[];
  previousFaults: readonly DrivingFault[];
  makeFault: ReturnType<typeof makeFaultFactory>;
}): LearnerAttemptScoredFault[] {
  const previousCategories = new Set(input.previousFaults.map((fault) => fault.category));
  const repeatedCategories = uniqueStrings(
    input.currentFaults
      .filter((fault) => fault.severity !== "observation" && previousCategories.has(fault.category))
      .map((fault) => fault.category)
  ) as DrivingFaultCategory[];

  return repeatedCategories.map((category) =>
    input.makeFault({
      category,
      severity: "minor",
      title: "Repeated mistake pattern",
      detail: `This attempt repeats a previous ${category.replaceAll("-", " ")} fault.`,
      blocking: false,
      scorePenalty: 4
    })
  );
}

function detourFault(input: {
  expectedDistanceMeters: number;
  attemptedDistanceMeters: number;
  makeFault: ReturnType<typeof makeFaultFactory>;
}): LearnerAttemptScoredFault | null {
  if (input.expectedDistanceMeters <= 0 || input.attemptedDistanceMeters <= input.expectedDistanceMeters) {
    return null;
  }

  const ratio = input.attemptedDistanceMeters / input.expectedDistanceMeters;

  if (ratio < DETOUR_WARNING_RATIO) {
    return null;
  }

  const excessive = ratio >= EXCESSIVE_DETOUR_RATIO;

  return input.makeFault({
    category: "route-efficiency",
    severity: excessive ? "serious" : "minor",
    title: excessive ? "Excessive detour" : "Small detour",
    detail: `The attempt was ${Math.round(input.attemptedDistanceMeters - input.expectedDistanceMeters)} m longer than the generated route.`,
    blocking: false,
    scorePenalty: excessive ? 22 : 6
  });
}

function timeEfficiencyFault(input: {
  expectedTimeMinutes: number | undefined;
  elapsedTimeMinutes: number | undefined;
  makeFault: ReturnType<typeof makeFaultFactory>;
}): LearnerAttemptScoredFault | null {
  if (
    typeof input.expectedTimeMinutes !== "number" ||
    typeof input.elapsedTimeMinutes !== "number" ||
    input.expectedTimeMinutes <= 0 ||
    input.elapsedTimeMinutes <= input.expectedTimeMinutes
  ) {
    return null;
  }

  const ratio = input.elapsedTimeMinutes / input.expectedTimeMinutes;

  if (ratio < TIME_WARNING_RATIO) {
    return null;
  }

  const excessive = ratio >= EXCESSIVE_TIME_RATIO;

  return input.makeFault({
    category: "route-efficiency",
    severity: excessive ? "serious" : "minor",
    title: excessive ? "Excessive time taken" : "Time efficiency warning",
    detail: `The attempt took ${input.elapsedTimeMinutes.toFixed(1)} minutes against an expected ${input.expectedTimeMinutes.toFixed(1)} minutes.`,
    blocking: false,
    scorePenalty: excessive ? 18 : 5
  });
}

function validationIssueSegmentIds(issues: readonly LearnerRouteValidationIssue[]): Set<string> {
  return new Set(issues.flatMap((issue) => issue.routeSegmentIds));
}

function applyValidationAnnotations(input: {
  annotations: LearnerAttemptRouteSegmentAnnotation[];
  validationFaults: readonly LearnerAttemptScoredFault[];
  validation: LearnerRouteValidationResult;
}): void {
  const invalidSegmentIds = validationIssueSegmentIds(input.validation.blockingErrors);

  for (const fault of input.validationFaults) {
    applyFaultToAnnotations(
      input.annotations,
      fault.routeSegmentIds,
      fault,
      fault.routeSegmentIds.some((routeSegmentId) => invalidSegmentIds.has(routeSegmentId)) ? "illegal" : undefined
    );
  }
}

function objectiveScore(input: {
  objective: ExerciseObjective;
  faults: readonly LearnerAttemptScoredFault[];
  validation: LearnerRouteValidationResult;
  completed: boolean;
  metrics: LearnerAttemptScoringMetrics;
}): LearnerAttemptObjectiveScore {
  const linkedFaults = input.faults.filter((fault) => {
    if (input.objective.linkedFaultCategories?.includes(fault.category)) {
      return true;
    }

    if (input.objective.category === "route-legality" || input.objective.category === "restriction-awareness") {
      return fault.blocking || ["no-entry", "one-way-direction", "prohibited-turn", "restricted-road"].includes(fault.category);
    }

    if (input.objective.category === "checkpoint-ordering") {
      return (
        fault.category === "missed-checkpoint" ||
        fault.category === "wrong-checkpoint-order" ||
        fault.category === "wrong-start" ||
        fault.category === "wrong-destination"
      );
    }

    if (input.objective.category === "route-efficiency") {
      return fault.category === "route-efficiency";
    }

    return false;
  });
  const baseScore = input.objective.category === "checkpoint-ordering"
    ? input.metrics.totalCheckpointCount > 0
      ? (input.metrics.completedCheckpointCount / input.metrics.totalCheckpointCount) * 100
      : 0
    : 100;
  const scorePercent = roundScore(baseScore - linkedFaults.reduce((total, fault) => total + fault.scorePenalty, 0));
  const hasSevereFault = linkedFaults.some((fault) => fault.severity === "serious" || fault.severity === "dangerous");
  const achieved = scorePercent >= 70 && !hasSevereFault && (input.objective.required ? input.completed : true);

  return {
    objectiveId: input.objective.id,
    title: input.objective.title,
    category: input.objective.category,
    scorePercent,
    achieved,
    faultIds: linkedFaults.map((fault) => fault.id),
    explanation: achieved
      ? "Objective achieved within the learner scoring tolerance."
      : "Objective needs review based on the recorded attempt faults."
  };
}

function expectedValidation(input: {
  map: MapDefinition;
  exercise: ScorableLearnerExercise | GeneratedLearnerExercise;
}): LearnerRouteValidationResult {
  return input.exercise.validation ??
    validateLearnerRoute({
      map: input.map,
      difficulty: input.exercise.difficulty,
      routeSegments: input.exercise.expectedRouteSegments,
      constraints: constraintsForExercise(input.exercise)
    });
}

function severityBuckets(faults: readonly LearnerAttemptScoredFault[]): {
  minorFaults: LearnerAttemptScoredFault[];
  seriousFaults: LearnerAttemptScoredFault[];
  dangerousFaults: LearnerAttemptScoredFault[];
} {
  return {
    minorFaults: faults.filter((fault) => fault.severity === "minor" || fault.severity === "observation"),
    seriousFaults: faults.filter((fault) => fault.severity === "serious"),
    dangerousFaults: faults.filter((fault) => fault.severity === "dangerous")
  };
}

function summaryExplanation(input: {
  status: LearnerAttemptScoringStatus;
  score: number;
  faults: readonly LearnerAttemptScoredFault[];
}): string {
  const dangerousCount = input.faults.filter((fault) => fault.severity === "dangerous").length;
  const seriousCount = input.faults.filter((fault) => fault.severity === "serious").length;
  const minorCount = input.faults.filter((fault) => fault.severity === "minor" || fault.severity === "observation").length;

  if (input.status === "passed" && input.faults.length === 0) {
    return `Pass at ${input.score.toFixed(1)}%. Perfect attempt with no recorded faults.`;
  }

  if (input.status === "passed") {
    return `Pass at ${input.score.toFixed(1)}%. Completed safely with ${minorCount} minor/advisory fault(s).`;
  }

  if (input.status === "incomplete") {
    return `Incomplete attempt at ${input.score.toFixed(1)}%. The route did not reach all required checkpoints.`;
  }

  if (input.status === "blocked") {
    return `Blocked attempt at ${input.score.toFixed(1)}%. ${dangerousCount + seriousCount} serious or dangerous validation fault(s) require review.`;
  }

  return `Fail at ${input.score.toFixed(1)}%. ${seriousCount} serious and ${minorCount} minor/advisory fault(s) recorded.`;
}

function attemptReviewStatus(status: LearnerAttemptScoringStatus): AttemptScore["reviewStatus"] {
  if (status === "passed") {
    return "pass";
  }

  if (status === "blocked") {
    return "blocked";
  }

  return "fail";
}

function finalStatus(input: {
  score: number;
  completed: boolean;
  validation: LearnerRouteValidationResult;
  faults: readonly LearnerAttemptScoredFault[];
  passScorePercent: number;
}): LearnerAttemptScoringStatus {
  const hasSerious = input.faults.some((fault) => fault.severity === "serious");
  const hasDangerous = input.faults.some((fault) => fault.severity === "dangerous");
  const hasBlockingValidationFault = input.validation.blockingErrors.length > 0;

  if (!input.completed) {
    return "incomplete";
  }

  if (hasDangerous || hasBlockingValidationFault) {
    return "blocked";
  }

  if (hasSerious || input.score < input.passScorePercent) {
    return "failed";
  }

  return "passed";
}

export function scoreLearnerAttempt(input: ScoreLearnerAttemptInput): LearnerAttemptScoringResult {
  const attemptId = input.attemptId ?? `${input.exercise.id}-attempt`;
  const makeFault = makeFaultFactory(attemptId);
  const constraints = constraintsForExercise(input.exercise);
  const validation = validateLearnerRoute({
    map: input.map,
    difficulty: input.exercise.difficulty,
    routeSegments: input.attemptedRouteSegments,
    constraints
  });
  const expected = expectedValidation({
    map: input.map,
    exercise: input.exercise
  });
  const adherence = analyseRouteAdherence({
    expectedSegments: input.exercise.expectedRouteSegments,
    attemptedSegments: input.attemptedRouteSegments,
    makeFault
  });
  const checkpoint = analyseCheckpoints({
    exercise: input.exercise,
    attemptedSegments: input.attemptedRouteSegments,
    makeFault
  });
  const hintUse = hintLevels(input);
  const validationBasedFaults = validationFaults({
    validation,
    makeFault
  });
  const expectedDistanceMeters = expected.metrics.routeDistanceMeters;
  const attemptedDistanceMeters = validation.metrics.routeDistanceMeters;
  const expectedTimeMinutes = input.exercise.estimatedMinutes ?? expected.metrics.estimatedTimeMinutes;
  const detour = detourFault({
    expectedDistanceMeters,
    attemptedDistanceMeters,
    makeFault
  });
  const timeEfficiency = timeEfficiencyFault({
    expectedTimeMinutes,
    elapsedTimeMinutes: input.elapsedTimeMinutes,
    makeFault
  });
  const hint = hintFault({
    levels: hintUse,
    makeFault
  });
  const initialFaults = [
    ...validationBasedFaults,
    ...adherence.faults,
    ...checkpoint.faults,
    ...(detour ? [detour] : []),
    ...(timeEfficiency ? [timeEfficiency] : []),
    ...(hint ? [hint] : [])
  ];
  const repeatedFaults = repeatedMistakeFaults({
    currentFaults: initialFaults,
    previousFaults: input.previousFaults ?? [],
    makeFault
  });
  const faults = [...initialFaults, ...repeatedFaults];
  const hintPenalty = hintUse.reduce((total, level) => total + hintPenaltyByLevel[level], 0);
  const efficiencyPercent =
    attemptedDistanceMeters > 0 && expectedDistanceMeters > 0
      ? Math.min(100, (expectedDistanceMeters / attemptedDistanceMeters) * 100)
      : 0;
  const timeEfficiencyPercent =
    typeof input.elapsedTimeMinutes === "number" && input.elapsedTimeMinutes > 0 && expectedTimeMinutes > 0
      ? Math.min(100, (expectedTimeMinutes / input.elapsedTimeMinutes) * 100)
      : undefined;
  const metrics: LearnerAttemptScoringMetrics = {
    expectedDistanceMeters,
    attemptedDistanceMeters,
    extraDistanceMeters: Math.max(0, attemptedDistanceMeters - expectedDistanceMeters),
    efficiencyPercent: roundScore(efficiencyPercent),
    expectedTimeMinutes,
    elapsedTimeMinutes: input.elapsedTimeMinutes,
    timeEfficiencyPercent: typeof timeEfficiencyPercent === "number" ? roundScore(timeEfficiencyPercent) : undefined,
    routeAdherencePercent: roundScore(adherence.routeAdherencePercent),
    completedCheckpointCount: checkpoint.completedCheckpointCount,
    totalCheckpointCount: checkpoint.totalCheckpointCount,
    hintPenalty
  };
  const totalScore = roundScore(100 - faults.reduce((total, fault) => total + fault.scorePenalty, 0));
  const status = finalStatus({
    score: totalScore,
    completed: checkpoint.completed,
    validation,
    faults,
    passScorePercent: input.passScorePercent ?? DEFAULT_PASS_SCORE_PERCENT
  });
  const passed = status === "passed";

  applyValidationAnnotations({
    annotations: adherence.annotations,
    validationFaults: validationBasedFaults,
    validation
  });

  const objectiveScores = input.exercise.objectives.map((objective) =>
    objectiveScore({
      objective,
      faults,
      validation,
      completed: checkpoint.completed,
      metrics
    })
  );
  const buckets = severityBuckets(faults);
  const attemptScore: AttemptScore = {
    attemptId,
    scorePercent: totalScore,
    passed,
    legalRoute: validation.valid,
    objectiveResults: objectiveScores.map((objective) => ({
      objectiveId: objective.objectiveId,
      achieved: objective.achieved,
      detail: objective.explanation
    })),
    routeDistanceMeters: attemptedDistanceMeters,
    shortestLegalRouteDistanceMeters: expectedDistanceMeters,
    efficiencyPercent: metrics.efficiencyPercent,
    drivingFaultCount: faults.length,
    seriousFaultCount: buckets.seriousFaults.length,
    dangerousFaultCount: buckets.dangerousFaults.length,
    reviewStatus: attemptReviewStatus(status)
  };

  return {
    attemptId,
    status,
    passed,
    completed: checkpoint.completed,
    totalScore,
    scorePercent: totalScore,
    attemptScore,
    minorFaults: buckets.minorFaults,
    seriousFaults: buckets.seriousFaults,
    dangerousFaults: buckets.dangerousFaults,
    faults,
    objectiveScores,
    routeSegmentAnnotations: adherence.annotations,
    summaryExplanation: summaryExplanation({
      status,
      score: totalScore,
      faults
    }),
    validation,
    metrics
  };
}
