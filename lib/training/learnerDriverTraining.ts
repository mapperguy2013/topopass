import type { RouteScoringFailureReason, RouteStop, Vec2 } from "../map-engine/index.ts";

export const EXERCISE_TYPES = [
  "follow-planned-route",
  "choose-legal-route",
  "identify-next-safe-turn",
  "practise-roundabouts",
  "practise-junction-decision-making",
  "route-review-mistake-correction"
] as const;

export type ExerciseType = (typeof EXERCISE_TYPES)[number];

export const EXERCISE_DIFFICULTIES = ["beginner", "easy", "intermediate", "advanced"] as const;

export type ExerciseDifficulty = (typeof EXERCISE_DIFFICULTIES)[number];

export const EXERCISE_OBJECTIVE_CATEGORIES = [
  "map-reading",
  "route-legality",
  "route-efficiency",
  "junction-decision",
  "roundabout-control",
  "restriction-awareness",
  "checkpoint-ordering",
  "mistake-correction"
] as const;

export type ExerciseObjectiveCategory = (typeof EXERCISE_OBJECTIVE_CATEGORIES)[number];

export const HINT_LEVELS = ["none", "nudge", "guided", "worked-example", "show-answer"] as const;

export type HintLevel = (typeof HINT_LEVELS)[number];

export const DRIVING_FAULT_CATEGORIES = [
  "wrong-start",
  "wrong-destination",
  "missed-checkpoint",
  "no-entry",
  "one-way-direction",
  "prohibited-turn",
  "restricted-road",
  "unsafe-junction-decision",
  "roundabout-decision",
  "route-efficiency",
  "route-drawing",
  "map-reading"
] as const;

export type DrivingFaultCategory = (typeof DRIVING_FAULT_CATEGORIES)[number];

export type DrivingFaultSeverity = "observation" | "minor" | "serious" | "dangerous";

export type LearnerAttemptStatus = "not-started" | "in-progress" | "submitted" | "reviewed" | "completed" | "abandoned";

export type ObjectiveMasteryLevel = "new" | "practising" | "developing" | "secure";

export type RouteInstructionKind =
  | "start"
  | "continue"
  | "turn-left"
  | "turn-right"
  | "straight-on"
  | "roundabout-exit"
  | "junction-decision"
  | "checkpoint"
  | "avoid-restriction"
  | "arrive";

export type ExerciseObjective = {
  id: string;
  title: string;
  category: ExerciseObjectiveCategory;
  description?: string;
  required: boolean;
  successCriteria: string[];
  linkedFaultCategories?: DrivingFaultCategory[];
};

export type RouteLeg = {
  id: string;
  from: RouteStop;
  to: RouteStop;
  title?: string;
  expectedRoadIds?: string[];
  expectedDirectedEdgeIds?: string[];
  distanceMeters?: number;
  instructionIds?: string[];
  checkpointOrder?: number;
};

export type RouteInstruction = {
  id: string;
  legId?: string;
  sequence: number;
  kind: RouteInstructionKind;
  text: string;
  roadName?: string;
  roadId?: string;
  nodeId?: string;
  mapPoint?: Vec2;
  roundaboutExitNumber?: number;
  decisionPoint?: {
    nodeId?: string;
    allowedRoadIds?: string[];
    blockedRoadIds?: string[];
  };
};

export type LearnerExercise = {
  id: string;
  title: string;
  type: ExerciseType;
  difficulty: ExerciseDifficulty;
  mapId: string;
  routeExerciseId?: string;
  mapVersion?: string | number;
  routeExerciseVersion?: string | number;
  objectives: ExerciseObjective[];
  routeLegs: RouteLeg[];
  routeInstructions: RouteInstruction[];
  estimatedMinutes?: number;
  prerequisiteExerciseIds?: string[];
  nextExerciseIds?: string[];
  tags?: string[];
  published: boolean;
};

type AttemptEventBase<TType extends string> = {
  id: string;
  attemptId: string;
  type: TType;
  occurredAt: string;
  note?: string;
};

export type AttemptEvent =
  | (AttemptEventBase<"attempt-started"> & {
      exerciseId: string;
    })
  | (AttemptEventBase<"instruction-viewed"> & {
      instructionId: string;
    })
  | (AttemptEventBase<"hint-requested"> & {
      hintId: string;
      hintLevel: HintLevel;
    })
  | (AttemptEventBase<"route-drawn"> & {
      routePointCount: number;
    })
  | (AttemptEventBase<"route-submitted"> & {
      routeLegIds?: string[];
    })
  | (AttemptEventBase<"route-reviewed"> & {
      reviewStatus: "pass" | "fail" | "blocked";
      routeReviewId?: string;
    })
  | (AttemptEventBase<"fault-recorded"> & {
      faultId: string;
    })
  | (AttemptEventBase<"feedback-added"> & {
      feedbackId: string;
    })
  | (AttemptEventBase<"attempt-completed"> & {
      passed: boolean;
    });

export type AttemptScore = {
  attemptId: string;
  scorePercent: number;
  passed: boolean;
  legalRoute: boolean;
  objectiveResults: {
    objectiveId: string;
    achieved: boolean;
    detail?: string;
  }[];
  routeDistanceMeters?: number;
  shortestLegalRouteDistanceMeters?: number;
  efficiencyPercent?: number;
  drivingFaultCount: number;
  seriousFaultCount: number;
  dangerousFaultCount: number;
  reviewStatus?: "pass" | "fail" | "blocked";
};

export type DrivingFault = {
  id: string;
  attemptId: string;
  category: DrivingFaultCategory;
  severity: DrivingFaultSeverity;
  title: string;
  detail?: string;
  routeLegId?: string;
  instructionId?: string;
  relatedRoadIds?: string[];
  relatedNodeIds?: string[];
  routeReviewItemId?: string;
  scoringFailureReason?: RouteScoringFailureReason;
  source: "route-review" | "overlay-signal" | "instructor" | "system";
  occurredAt?: string;
};

export type Hint = {
  id: string;
  exerciseId: string;
  level: HintLevel;
  title: string;
  text: string;
  objectiveId?: string;
  instructionId?: string;
  routeLegId?: string;
  revealsAnswer: boolean;
};

export type LearnerAttempt = {
  id: string;
  learnerId: string;
  exerciseId: string;
  mapId: string;
  routeExerciseId?: string;
  status: LearnerAttemptStatus;
  startedAt: string;
  submittedAt?: string;
  completedAt?: string;
  events: AttemptEvent[];
  score?: AttemptScore;
  faults: DrivingFault[];
  hintsUsed: Hint[];
  routeAttemptReviewId?: string;
  savedRouteAttemptId?: string;
  instructorFeedbackIds?: string[];
};

export type LearnerProgress = {
  learnerId: string;
  updatedAt: string;
  activeExerciseId?: string;
  completedExerciseIds: string[];
  attemptedExerciseIds: string[];
  objectiveMastery: {
    objectiveId: string;
    category: ExerciseObjectiveCategory;
    level: ObjectiveMasteryLevel;
    attemptCount: number;
    latestAttemptId?: string;
  }[];
  weakFaultCategories: DrivingFaultCategory[];
  difficultyReadiness: Record<ExerciseDifficulty, boolean>;
  averageScorePercent?: number;
  latestAttemptId?: string;
};

export type InstructorFeedback = {
  id: string;
  attemptId: string;
  learnerId: string;
  instructorId?: string;
  createdAt: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  faultIds?: string[];
  objectiveIds?: string[];
  recommendedExerciseIds?: string[];
  recommendedHintLevel?: HintLevel;
  visibility: "learner" | "instructor-only";
};

const exerciseDifficultyRank: Record<ExerciseDifficulty, number> = {
  beginner: 0,
  easy: 1,
  intermediate: 2,
  advanced: 3
};

function isReadonlyStringMember<TValue extends string>(
  values: readonly TValue[],
  value: unknown
): value is TValue {
  return typeof value === "string" && values.includes(value as TValue);
}

export function isExerciseType(value: unknown): value is ExerciseType {
  return isReadonlyStringMember(EXERCISE_TYPES, value);
}

export function isExerciseDifficulty(value: unknown): value is ExerciseDifficulty {
  return isReadonlyStringMember(EXERCISE_DIFFICULTIES, value);
}

export function compareExerciseDifficulty(left: ExerciseDifficulty, right: ExerciseDifficulty): number {
  return exerciseDifficultyRank[left] - exerciseDifficultyRank[right];
}

export function nextExerciseDifficulty(difficulty: ExerciseDifficulty): ExerciseDifficulty | null {
  const currentIndex = EXERCISE_DIFFICULTIES.indexOf(difficulty);
  const nextDifficulty = EXERCISE_DIFFICULTIES[currentIndex + 1];

  return nextDifficulty ?? null;
}

export function createEmptyLearnerProgress(input: {
  learnerId: string;
  updatedAt: string;
}): LearnerProgress {
  return {
    learnerId: input.learnerId,
    updatedAt: input.updatedAt,
    completedExerciseIds: [],
    attemptedExerciseIds: [],
    objectiveMastery: [],
    weakFaultCategories: [],
    difficultyReadiness: {
      beginner: true,
      easy: false,
      intermediate: false,
      advanced: false
    }
  };
}
