import type { RouteStop, Vec2 } from "../map-engine/index.ts";
import type {
  ExerciseObjective,
  ExerciseDifficulty,
  ExerciseType,
  RouteInstruction,
  RouteLeg
} from "./learnerDriverTraining.ts";
import type {
  GeneratedLearnerExercise,
  LearnerRouteComplexityMetrics
} from "./learnerExerciseGeneration.ts";
import type {
  LearnerRouteValidationMetrics,
  LearnerRouteValidationResult,
  LearnerRouteValidationSegment
} from "./learnerRouteValidation.ts";
import type {
  CuratedTrainingRouteLifecycleStage,
  CuratedTrainingRouteSaveMode
} from "./curatedTrainingRouteSaveNaming.ts";

export type CuratedTrainingRouteStatus = "draft" | "beta" | "approved";
export type CuratedTrainingRouteCheckpointRequirementSetting = "optional" | "required";

export type CuratedShortestRouteComparisonVerdict =
  | "shortest-or-near-shortest"
  | "acceptable-training-variation"
  | "detour-warning"
  | "major-detour-warning"
  | "unknown";

export type CuratedShortestRouteComparisonStatus = "available" | "unknown" | "not-applicable";

export type CuratedShortestRouteComparisonDetail = {
  comparisonStatus: CuratedShortestRouteComparisonStatus;
  verdict: CuratedShortestRouteComparisonVerdict;
  explanation: string;
  authoredLengthMeters: number | null;
  shortestLengthMeters: number | null;
  lengthDeltaMeters: number | null;
  percentageLonger: number | null;
  authoredSegmentCount: number | null;
  shortestSegmentCount: number | null;
  segmentCountDelta: number | null;
  authoredTurnCount: number | null;
  shortestTurnCount: number | null;
  turnCountDelta: number | null;
  authoredDecisionPointCount: number | null;
  shortestDecisionPointCount: number | null;
  decisionPointDelta: number | null;
  shortestRouteSegmentIds: string[];
};

export type CuratedShortestRouteComparison = {
  directComparison: CuratedShortestRouteComparisonDetail;
  checkpointConstrainedComparison: CuratedShortestRouteComparisonDetail;
  routeChoiceJustification: string;
  requiresRouteChoiceJustification: boolean;
  guidance: string[];
};

export type CuratedTrainingRouteMetadata = {
  routeId: string;
  title: string;
  area: string;
  practiceMapId: string;
  areaId: string;
  areaName: string;
  sourceFixture?: string;
  difficulty: Exclude<ExerciseDifficulty, "easy">;
  exerciseType: ExerciseType;
  description: string;
  objective: string;
  skillsPractised: string[];
  expectedLearnerMistakes: string[];
  hintSequence: string[];
  scoringEmphasis: string[];
  instructorFeedbackNotes: string;
  routeChoiceJustification: string;
  checkpointRequirement?: CuratedTrainingRouteCheckpointRequirementSetting;
  status: CuratedTrainingRouteStatus;
};

export type CuratedTrainingRouteComplexitySummary = {
  approximateRouteLengthMeters: number;
  segmentCount: number;
  turnCount: number;
  decisionPointCount: number;
  checkpointCount: number;
  estimatedDifficulty: ExerciseDifficulty;
  warnings: string[];
};

export type CuratedTrainingRouteStopKind = "start" | "checkpoint" | "destination";

export type CuratedTrainingRouteStopDisplay = {
  markerLabel: string;
  markerRole: CuratedTrainingRouteStopKind;
  description: string;
};

export type CuratedTrainingRouteStop = {
  id?: string;
  kind?: CuratedTrainingRouteStopKind;
  order?: number;
  nodeId: string;
  label: string;
  point?: Vec2;
  roadId?: string;
  routeSegmentId?: string;
  required?: boolean;
  display?: CuratedTrainingRouteStopDisplay;
};

export type CuratedTrainingRouteCheckpointRequirement = {
  required: boolean;
  ordered: true;
  checkpointCount: number;
  requiredNodeIds: string[];
  instruction: string;
};

export type CuratedTrainingRouteExport = {
  schemaVersion: 1;
  routeId: string;
  title: string;
  area: string;
  practiceMapId: string;
  areaId: string;
  areaName: string;
  sourceFixture?: string;
  difficulty: Exclude<ExerciseDifficulty, "easy">;
  exerciseType: ExerciseType;
  status: CuratedTrainingRouteStatus;
  saveMode?: CuratedTrainingRouteSaveMode;
  lifecycleStage: CuratedTrainingRouteLifecycleStage;
  metadata: CuratedTrainingRouteMetadata;
  mapId: string;
  mapVersion?: string | number;
  sourceRouteExerciseId?: string;
  sourceRouteExerciseVersion?: string | number;
  start: CuratedTrainingRouteStop;
  destination: CuratedTrainingRouteStop;
  checkpoints: CuratedTrainingRouteStop[];
  checkpointRequirements: CuratedTrainingRouteCheckpointRequirement;
  routeSegmentIds: string[];
  roadIds: string[];
  nodeIds: string[];
  routeGeometry: Vec2[];
  validationSummary: Pick<
    LearnerRouteValidationResult,
    "status" | "valid" | "blockingErrors" | "advisoryWarnings" | "affectedRouteSegmentIds" | "ruleCodes" | "explanation"
  >;
  complexitySummary: CuratedTrainingRouteComplexitySummary;
  shortestRouteComparison: CuratedShortestRouteComparison;
  validationSegments: LearnerRouteValidationSegment[];
  instructorQaNote?: string;
  learnerCard?: {
    area: string;
    approximateLengthMeters: number;
    segmentCount: number;
    turnCount: number;
    decisionPointCount: number;
    checkpointCount: number;
    skillsPractised: string[];
    statusLabel: string;
  };
  routePack?: {
    packId: string;
    packVersion: string;
    sourceExerciseDifficulty?: string;
    sourceRouteType?: string;
    manualQaNote: string;
    knownLimitations: string[];
  };
};

function curatedStopToRouteStop(stop: CuratedTrainingRouteStop): RouteStop {
  return {
    type: "node",
    nodeId: stop.nodeId,
    label: stop.label
  };
}

function orderedCuratedStops(route: CuratedTrainingRouteExport): CuratedTrainingRouteStop[] {
  return [route.start, ...route.checkpoints, route.destination].filter((stop) => stop.nodeId.trim().length > 0);
}

function routeLegsFromCuratedRoute(route: CuratedTrainingRouteExport): RouteLeg[] {
  const stops = orderedCuratedStops(route);

  return stops.slice(0, -1).map((stop, index) => ({
    id: `curated-leg-${String(index + 1).padStart(2, "0")}`,
    from: curatedStopToRouteStop(stop),
    to: curatedStopToRouteStop(stops[index + 1]),
    title: index === 0 ? "Start to first required stop" : "Required stop route leg",
    expectedRoadIds: [...route.roadIds],
    expectedDirectedEdgeIds: [...route.routeSegmentIds],
    distanceMeters:
      route.validationSegments.length > 0
        ? Math.round(route.complexitySummary.approximateRouteLengthMeters / route.validationSegments.length)
        : undefined,
    checkpointOrder: index + 1
  }));
}

function routeInstructionsFromCuratedRoute(route: CuratedTrainingRouteExport): RouteInstruction[] {
  const instructions: RouteInstruction[] = [];
  const checkpointLabelsByNodeId = new Map(route.checkpoints.map((checkpoint) => [checkpoint.nodeId, checkpoint.label]));
  let sequence = 1;

  instructions.push({
    id: "curated-instruction-start",
    sequence,
    kind: "start",
    text: `Start at ${route.start.label}.`,
    nodeId: route.start.nodeId,
    mapPoint: route.start.point
  });
  sequence += 1;

  for (let index = 0; index < route.validationSegments.length; index += 1) {
    const segment = route.validationSegments[index];
    const checkpointLabel = checkpointLabelsByNodeId.get(segment.toNodeId);

    instructions.push({
      id: `curated-instruction-segment-${String(index + 1).padStart(2, "0")}`,
      legId: `curated-leg-${String(Math.min(index + 1, Math.max(1, routeLegsFromCuratedRoute(route).length))).padStart(2, "0")}`,
      sequence,
      kind: "continue",
      text: `Continue on ${segment.roadId}${checkpointLabel ? ` towards ${checkpointLabel}` : ""}.`,
      roadId: segment.roadId,
      nodeId: segment.fromNodeId
    });
    sequence += 1;

    if (checkpointLabel) {
      const checkpoint = route.checkpoints.find((candidate) => candidate.nodeId === segment.toNodeId);

      instructions.push({
        id: `curated-instruction-checkpoint-${String(sequence).padStart(2, "0")}`,
        sequence,
        kind: "checkpoint",
        text: `Visit ${checkpointLabel} before continuing.`,
        nodeId: segment.toNodeId,
        mapPoint: checkpoint?.point
      });
      sequence += 1;
    }
  }

  instructions.push({
    id: "curated-instruction-arrive",
    sequence,
    kind: "arrive",
    text: `Arrive at ${route.destination.label}.`,
    nodeId: route.destination.nodeId,
    mapPoint: route.destination.point
  });

  return instructions;
}

function objectivesFromCuratedRoute(route: CuratedTrainingRouteExport): ExerciseObjective[] {
  const objectives: ExerciseObjective[] = [
    {
      id: "curated-objective-route-validity",
      title: "Follow a valid learner route",
      category: "route-legality",
      description: route.metadata.objective,
      required: true,
      successCriteria: ["Use only route segments that pass the available map validation checks."],
      linkedFaultCategories: ["no-entry", "one-way-direction", "prohibited-turn", "restricted-road", "route-drawing"]
    },
    {
      id: "curated-objective-route-adherence",
      title: "Stay on the curated route",
      category: "map-reading",
      required: true,
      successCriteria: ["Follow the planned route from start to destination."],
      linkedFaultCategories: ["wrong-start", "wrong-destination", "unsafe-junction-decision", "route-drawing"]
    }
  ];

  if (route.checkpointRequirements.required || route.checkpoints.length > 0) {
    objectives.push({
      id: "curated-objective-checkpoint-order",
      title: "Visit checkpoints in order",
      category: "checkpoint-ordering",
      description: route.checkpointRequirements.instruction,
      required: route.checkpointRequirements.required,
      successCriteria: ["Visit each numbered checkpoint before the destination."],
      linkedFaultCategories: ["missed-checkpoint", "wrong-checkpoint-order", "wrong-start", "wrong-destination"]
    });
  }

  return objectives;
}

function validationMetricsFromCuratedRoute(route: CuratedTrainingRouteExport): LearnerRouteValidationMetrics {
  const distance = route.complexitySummary.approximateRouteLengthMeters;

  return {
    routeDistanceMeters: distance,
    estimatedTimeMinutes: Math.max(1, Math.round((distance / 1000 / 20) * 60 * 10) / 10),
    segmentCount: route.complexitySummary.segmentCount,
    turnCount: route.complexitySummary.turnCount,
    junctionDecisionCount: route.complexitySummary.decisionPointCount,
    roundaboutSegmentCount: route.validationSummary.ruleCodes.includes("roundabout-complexity") ? 1 : 0,
    repeatedRoadCount: route.validationSummary.ruleCodes.includes("duplicate-loop") ? 1 : 0
  };
}

function validationFromCuratedRoute(route: CuratedTrainingRouteExport): LearnerRouteValidationResult {
  return {
    ...route.validationSummary,
    metrics: validationMetricsFromCuratedRoute(route)
  };
}

function complexityFromCuratedRoute(route: CuratedTrainingRouteExport): LearnerRouteComplexityMetrics {
  return {
    score: route.complexitySummary.segmentCount + route.complexitySummary.turnCount + route.complexitySummary.decisionPointCount,
    routeSignature: route.routeSegmentIds.join(">"),
    roadChangeCount: route.complexitySummary.turnCount,
    turnCount: route.complexitySummary.turnCount,
    decisionPointCount: route.complexitySummary.decisionPointCount,
    roundaboutExposure: route.validationSummary.ruleCodes.includes("roundabout-complexity") ? 1 : 0,
    restrictionExposure: route.validationSummary.ruleCodes.some((code) =>
      code === "wrong-way-one-way" ||
      code === "no-entry-restriction" ||
      code === "prohibited-turn" ||
      code === "closed-or-restricted-road" ||
      code === "non-drivable-segment"
    )
      ? 1
      : 0,
    instructionCountEstimate: route.validationSegments.length + route.checkpoints.length + 2,
    shapeComplexity: route.complexitySummary.segmentCount,
    repeatedRoadPenalty: route.validationSummary.ruleCodes.includes("duplicate-loop") ? 1 : 0,
    straightnessRatio: 1,
    mostlyStraight: route.complexitySummary.turnCount <= 1
  };
}

export function curatedTrainingRouteToGeneratedLearnerExercise(
  route: CuratedTrainingRouteExport
): GeneratedLearnerExercise {
  return {
    id: route.routeId,
    title: route.title,
    type: route.exerciseType,
    difficulty: route.difficulty,
    mapId: route.mapId,
    routeExerciseId: route.sourceRouteExerciseId,
    mapVersion: route.mapVersion,
    routeExerciseVersion: route.sourceRouteExerciseVersion,
    objectives: objectivesFromCuratedRoute(route),
    routeLegs: routeLegsFromCuratedRoute(route),
    routeInstructions: routeInstructionsFromCuratedRoute(route),
    estimatedMinutes: validationMetricsFromCuratedRoute(route).estimatedTimeMinutes,
    tags: [
      "curated-training-route",
      route.areaId,
      route.status,
      ...route.metadata.skillsPractised.map((skill) => `skill:${skill}`),
      ...route.metadata.scoringEmphasis.map((emphasis) => `score:${emphasis}`)
    ],
    published: route.status === "beta" || route.status === "approved",
    routeGeometry: [...route.routeGeometry],
    checkpoints: orderedCuratedStops(route).map(curatedStopToRouteStop),
    expectedRouteSegments: [...route.validationSegments],
    estimatedDifficulty: route.complexitySummary.estimatedDifficulty,
    validation: validationFromCuratedRoute(route),
    generationMetadata: {
      status: route.validationSummary.valid ? "generated" : "degraded",
      seed: `curated:${route.routeId}`,
      attempts: 1,
      routeSignature: route.routeSegmentIds.join(">"),
      complexity: complexityFromCuratedRoute(route),
      reasonCodes: route.validationSummary.valid ? ["candidate-selected"] : ["validation-warning"],
      constraints: {},
      candidateOptions: []
    }
  };
}
