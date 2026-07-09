import type { Vec2 } from "../map-engine/index.ts";
import type {
  ExerciseDifficulty,
  ExerciseType
} from "./learnerDriverTraining.ts";
import type {
  LearnerRouteValidationResult,
  LearnerRouteValidationSegment
} from "./learnerRouteValidation.ts";
import type {
  CuratedTrainingRouteLifecycleStage,
  CuratedTrainingRouteSaveMode
} from "./curatedTrainingRouteSaveNaming.ts";

export type CuratedTrainingRouteStatus = "draft" | "beta" | "approved";

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

export type CuratedTrainingRouteStop = {
  nodeId: string;
  label: string;
  point?: Vec2;
};

export type CuratedTrainingRouteExport = {
  schemaVersion: 1;
  routeId: string;
  title: string;
  area: string;
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
};
