import type { Vec2 } from "../map-engine/index.ts";
import type {
  ExerciseDifficulty,
  ExerciseType
} from "./learnerDriverTraining.ts";
import type {
  LearnerRouteValidationResult,
  LearnerRouteValidationSegment
} from "./learnerRouteValidation.ts";

export type CuratedTrainingRouteStatus = "draft" | "beta" | "approved";

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
  validationSegments: LearnerRouteValidationSegment[];
};
