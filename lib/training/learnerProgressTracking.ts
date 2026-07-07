import { getLocalStorage } from "../db/localDatabase.ts";
import {
  EXERCISE_DIFFICULTIES,
  HINT_LEVELS,
  compareExerciseDifficulty,
  createEmptyLearnerProgress,
  isExerciseDifficulty,
  isExerciseType,
  nextExerciseDifficulty,
  type DrivingFaultCategory,
  type DrivingFaultSeverity,
  type ExerciseDifficulty,
  type ExerciseType,
  type Hint,
  type HintLevel,
  type LearnerProgress
} from "./learnerDriverTraining.ts";
import type { GeneratedLearnerExercise } from "./learnerExerciseGeneration.ts";
import type { LearnerAttemptFeedbackResult } from "./learnerAttemptFeedback.ts";
import type { LearnerAttemptScoredFault, LearnerAttemptScoringResult } from "./learnerAttemptScoring.ts";

export const LEARNER_TRAINING_PROGRESS_SCHEMA_VERSION = 1;
export const LEARNER_TRAINING_PROGRESS_STORAGE_KEY = "topopass.learner-training-progress.v1";
export const DEFAULT_LEARNER_TRAINING_PROGRESS_LEARNER_ID = "local-learner";

export type LearnerTrainingProgressTrend = "not-enough-data" | "improving" | "stable" | "declining";

export type LearnerTrainingProgressRecommendationKind =
  | "build-history"
  | "promote"
  | "hold"
  | "targeted-practice";

export type LearnerTrainingProgressFaultRecord = {
  id: string;
  category: DrivingFaultCategory;
  severity: DrivingFaultSeverity;
  title: string;
  blocking: boolean;
};

export type LearnerTrainingAttemptProgressRecord = {
  id: string;
  exerciseId: string;
  exerciseTitle: string;
  mapId: string;
  exerciseType: ExerciseType;
  difficulty: ExerciseDifficulty;
  attemptedAt: string;
  completedAt: string;
  status: LearnerAttemptScoringResult["status"];
  scorePercent: number;
  passed: boolean;
  completed: boolean;
  hintCount: number;
  highestHintLevel: HintLevel;
  hintPenalty: number;
  seriousFaultCount: number;
  dangerousFaultCount: number;
  invalidRouteFaultCount: number;
  faultCategories: DrivingFaultCategory[];
  faults: LearnerTrainingProgressFaultRecord[];
  summary: string;
};

export type LearnerTrainingProgressMistakeSummary = {
  category: DrivingFaultCategory;
  label: string;
  count: number;
  attemptCount: number;
  seriousOrDangerousCount: number;
  latestAttemptId: string;
  latestAttemptAt: string;
};

export type LearnerTrainingProgressRecommendation = {
  kind: LearnerTrainingProgressRecommendationKind;
  recommendedDifficulty: ExerciseDifficulty;
  recommendedExerciseType: ExerciseType;
  reason: string;
  targetFaultCategory?: DrivingFaultCategory;
  promotedFromDifficulty?: ExerciseDifficulty;
};

export type LearnerTrainingProgressSummary = {
  attemptCount: number;
  completedExerciseCount: number;
  averageScorePercent: number | null;
  passRatePercent: number | null;
  recentTrend: LearnerTrainingProgressTrend;
  currentDifficulty: ExerciseDifficulty;
  recommendedNextDifficulty: ExerciseDifficulty;
  recommendedNextExerciseType: ExerciseType;
  commonMistakes: LearnerTrainingProgressMistakeSummary[];
  recentAttempts: LearnerTrainingAttemptProgressRecord[];
  recommendation: LearnerTrainingProgressRecommendation;
};

export type LearnerTrainingProgressState = {
  schemaVersion: typeof LEARNER_TRAINING_PROGRESS_SCHEMA_VERSION;
  learnerId: string;
  updatedAt: string;
  attempts: LearnerTrainingAttemptProgressRecord[];
  summary: LearnerTrainingProgressSummary;
  learnerProgress: LearnerProgress;
};

export type LearnerTrainingProgressStorageResult = {
  ok: boolean;
  source: "local" | "unavailable";
  progress: LearnerTrainingProgressState;
  reason?: string;
  error?: string;
};

export type LearnerTrainingProgressStorageWriteResult = {
  ok: boolean;
  source: "local" | "unavailable";
  reason?: string;
  error?: string;
};

export type LearnerTrainingProgressStorageAdapter = {
  load: () => LearnerTrainingProgressStorageResult;
  save: (progress: LearnerTrainingProgressState) => LearnerTrainingProgressStorageWriteResult;
  clear: () => LearnerTrainingProgressStorageWriteResult;
};

type LearnerTrainingProgressStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const MAX_STORED_ATTEMPTS = 60;
const RECENT_ATTEMPT_LIMIT = 5;
const STRONG_SCORE_THRESHOLD = 85;
const TREND_SCORE_DELTA = 5;

const seriousFaultCategories = new Set<DrivingFaultCategory>([
  "no-entry",
  "one-way-direction",
  "prohibited-turn",
  "restricted-road",
  "wrong-start",
  "wrong-destination"
]);

export const LEARNER_TRAINING_FAULT_CATEGORY_LABELS: Record<DrivingFaultCategory, string> = {
  "wrong-start": "Wrong start",
  "wrong-destination": "Wrong destination",
  "missed-checkpoint": "Missed checkpoint",
  "no-entry": "No entry",
  "one-way-direction": "One-way direction",
  "prohibited-turn": "Prohibited turn",
  "restricted-road": "Restricted road",
  "unsafe-junction-decision": "Junction decision",
  "roundabout-decision": "Roundabout decision",
  "route-efficiency": "Route efficiency",
  "route-drawing": "Route drawing",
  "map-reading": "Map reading"
};

const hintLevelRank: Record<HintLevel, number> = {
  none: 0,
  nudge: 1,
  guided: 2,
  "worked-example": 3,
  "show-answer": 4
};

function nowIso(): string {
  return new Date().toISOString();
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isDrivingFaultSeverity(value: unknown): value is DrivingFaultSeverity {
  return value === "observation" || value === "minor" || value === "serious" || value === "dangerous";
}

function isDrivingFaultCategory(value: unknown): value is DrivingFaultCategory {
  return typeof value === "string" && value in LEARNER_TRAINING_FAULT_CATEGORY_LABELS;
}

function isHintLevel(value: unknown): value is HintLevel {
  return typeof value === "string" && HINT_LEVELS.includes(value as HintLevel);
}

function uniqueStrings<TValue extends string>(values: readonly TValue[]): TValue[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function attemptTime(attempt: Pick<LearnerTrainingAttemptProgressRecord, "completedAt" | "attemptedAt">): number {
  return new Date(attempt.completedAt || attempt.attemptedAt).getTime();
}

function sortAttemptsNewest(
  attempts: readonly LearnerTrainingAttemptProgressRecord[]
): LearnerTrainingAttemptProgressRecord[] {
  return [...attempts].sort((left, right) => attemptTime(right) - attemptTime(left));
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function roundPercent(value: number | null): number | null {
  return value === null ? null : Math.round(value * 10) / 10;
}

function latestDifficulty(attempts: readonly LearnerTrainingAttemptProgressRecord[]): ExerciseDifficulty {
  return sortAttemptsNewest(attempts)[0]?.difficulty ?? "beginner";
}

function exerciseTypeForFaultCategory(category: DrivingFaultCategory): ExerciseType {
  if (
    category === "no-entry" ||
    category === "one-way-direction" ||
    category === "prohibited-turn" ||
    category === "restricted-road"
  ) {
    return "choose-legal-route";
  }

  if (category === "unsafe-junction-decision") {
    return "practise-junction-decision-making";
  }

  if (category === "roundabout-decision") {
    return "practise-roundabouts";
  }

  if (category === "missed-checkpoint" || category === "wrong-start" || category === "wrong-destination") {
    return "follow-planned-route";
  }

  if (category === "route-efficiency" || category === "route-drawing") {
    return "route-review-mistake-correction";
  }

  return "identify-next-safe-turn";
}

function mostDemandingHintLevel(hints: readonly Hint[]): HintLevel {
  return hints.reduce<HintLevel>(
    (highest, hint) => (hintLevelRank[hint.level] > hintLevelRank[highest] ? hint.level : highest),
    "none"
  );
}

function invalidRouteFaultCount(faults: readonly LearnerAttemptScoredFault[]): number {
  return faults.filter(
    (fault) =>
      fault.blocking ||
      fault.severity === "dangerous" ||
      seriousFaultCategories.has(fault.category)
  ).length;
}

function normaliseFaultRecord(value: unknown): LearnerTrainingProgressFaultRecord | null {
  if (!isObject(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    !isDrivingFaultCategory(value.category) ||
    !isDrivingFaultSeverity(value.severity) ||
    typeof value.title !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    category: value.category,
    severity: value.severity,
    title: value.title,
    blocking: value.blocking === true
  };
}

function normaliseAttemptRecord(value: unknown): LearnerTrainingAttemptProgressRecord | null {
  if (!isObject(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.exerciseId !== "string" ||
    typeof value.exerciseTitle !== "string" ||
    typeof value.mapId !== "string" ||
    !isExerciseType(value.exerciseType) ||
    !isExerciseDifficulty(value.difficulty) ||
    !isValidDate(value.attemptedAt) ||
    !isValidDate(value.completedAt)
  ) {
    return null;
  }

  const scorePercent = finiteNumber(value.scorePercent);

  if (scorePercent === null) {
    return null;
  }

  const faultCategories = Array.isArray(value.faultCategories)
    ? uniqueStrings(value.faultCategories.filter(isDrivingFaultCategory))
    : [];
  const faults = Array.isArray(value.faults)
    ? value.faults.map(normaliseFaultRecord).filter((fault): fault is LearnerTrainingProgressFaultRecord => Boolean(fault))
    : [];

  return {
    id: value.id,
    exerciseId: value.exerciseId,
    exerciseTitle: value.exerciseTitle,
    mapId: value.mapId,
    exerciseType: value.exerciseType,
    difficulty: value.difficulty,
    attemptedAt: value.attemptedAt,
    completedAt: value.completedAt,
    status:
      value.status === "passed" || value.status === "failed" || value.status === "incomplete" || value.status === "blocked"
        ? value.status
        : value.passed === true
          ? "passed"
          : "failed",
    scorePercent,
    passed: value.passed === true,
    completed: value.completed === true,
    hintCount: Math.max(0, Math.floor(finiteNumber(value.hintCount) ?? 0)),
    highestHintLevel: isHintLevel(value.highestHintLevel) ? value.highestHintLevel : "none",
    hintPenalty: Math.max(0, finiteNumber(value.hintPenalty) ?? 0),
    seriousFaultCount: Math.max(0, Math.floor(finiteNumber(value.seriousFaultCount) ?? 0)),
    dangerousFaultCount: Math.max(0, Math.floor(finiteNumber(value.dangerousFaultCount) ?? 0)),
    invalidRouteFaultCount: Math.max(0, Math.floor(finiteNumber(value.invalidRouteFaultCount) ?? 0)),
    faultCategories,
    faults,
    summary: typeof value.summary === "string" ? value.summary : ""
  };
}

function commonMistakes(
  attempts: readonly LearnerTrainingAttemptProgressRecord[]
): LearnerTrainingProgressMistakeSummary[] {
  const summariesByCategory = new Map<
    DrivingFaultCategory,
    {
      category: DrivingFaultCategory;
      count: number;
      attemptIds: Set<string>;
      seriousOrDangerousCount: number;
      latestAttemptId: string;
      latestAttemptAt: string;
    }
  >();

  for (const attempt of sortAttemptsNewest(attempts)) {
    for (const fault of attempt.faults) {
      const existing = summariesByCategory.get(fault.category);
      const summary = existing ?? {
        category: fault.category,
        count: 0,
        attemptIds: new Set<string>(),
        seriousOrDangerousCount: 0,
        latestAttemptId: attempt.id,
        latestAttemptAt: attempt.completedAt
      };

      summary.count += 1;
      summary.attemptIds.add(attempt.id);

      if (fault.severity === "serious" || fault.severity === "dangerous" || fault.blocking) {
        summary.seriousOrDangerousCount += 1;
      }

      if (attemptTime(attempt) >= new Date(summary.latestAttemptAt).getTime()) {
        summary.latestAttemptId = attempt.id;
        summary.latestAttemptAt = attempt.completedAt;
      }

      summariesByCategory.set(fault.category, summary);
    }
  }

  return [...summariesByCategory.values()]
    .map((summary) => ({
      category: summary.category,
      label: LEARNER_TRAINING_FAULT_CATEGORY_LABELS[summary.category],
      count: summary.count,
      attemptCount: summary.attemptIds.size,
      seriousOrDangerousCount: summary.seriousOrDangerousCount,
      latestAttemptId: summary.latestAttemptId,
      latestAttemptAt: summary.latestAttemptAt
    }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      if (right.seriousOrDangerousCount !== left.seriousOrDangerousCount) {
        return right.seriousOrDangerousCount - left.seriousOrDangerousCount;
      }

      return left.label.localeCompare(right.label);
    });
}

function recentTrend(attempts: readonly LearnerTrainingAttemptProgressRecord[]): LearnerTrainingProgressTrend {
  const chronological = [...attempts].sort((left, right) => attemptTime(left) - attemptTime(right));

  if (chronological.length < 4) {
    return "not-enough-data";
  }

  const recent = chronological.slice(-3);
  const previous = chronological.slice(Math.max(0, chronological.length - 6), chronological.length - 3);
  const recentAverage = average(recent.map((attempt) => attempt.scorePercent));
  const previousAverage = average(previous.map((attempt) => attempt.scorePercent));

  if (recentAverage === null || previousAverage === null) {
    return "not-enough-data";
  }

  const delta = recentAverage - previousAverage;

  if (delta >= TREND_SCORE_DELTA) {
    return "improving";
  }

  if (delta <= -TREND_SCORE_DELTA) {
    return "declining";
  }

  return "stable";
}

function recentSeriousOrInvalidCount(attempts: readonly LearnerTrainingAttemptProgressRecord[]): number {
  return sortAttemptsNewest(attempts)
    .slice(0, RECENT_ATTEMPT_LIMIT)
    .filter(
      (attempt) =>
        attempt.status === "blocked" ||
        attempt.seriousFaultCount > 0 ||
        attempt.dangerousFaultCount > 0 ||
        attempt.invalidRouteFaultCount > 0
    ).length;
}

function hintHeavy(attempts: readonly LearnerTrainingAttemptProgressRecord[]): boolean {
  const recent = sortAttemptsNewest(attempts).slice(0, 3);

  if (recent.length < 3) {
    return false;
  }

  return recent.filter(
    (attempt) =>
      attempt.hintCount >= 2 ||
      attempt.hintPenalty >= 10 ||
      attempt.highestHintLevel === "worked-example" ||
      attempt.highestHintLevel === "show-answer"
  ).length >= 2;
}

function strongAttemptsAtCurrentDifficulty(
  attempts: readonly LearnerTrainingAttemptProgressRecord[],
  difficulty: ExerciseDifficulty
): LearnerTrainingAttemptProgressRecord[] {
  return sortAttemptsNewest(attempts)
    .filter((attempt) => attempt.difficulty === difficulty)
    .slice(0, 3)
    .filter(
      (attempt) =>
        attempt.passed &&
        attempt.completed &&
        attempt.scorePercent >= STRONG_SCORE_THRESHOLD &&
        attempt.seriousFaultCount === 0 &&
        attempt.dangerousFaultCount === 0 &&
        attempt.invalidRouteFaultCount === 0 &&
        attempt.hintCount <= 1 &&
        hintLevelRank[attempt.highestHintLevel] <= hintLevelRank.guided
    );
}

function recommendationForProgress(input: {
  attempts: readonly LearnerTrainingAttemptProgressRecord[];
  commonMistakes: readonly LearnerTrainingProgressMistakeSummary[];
  currentDifficulty: ExerciseDifficulty;
}): LearnerTrainingProgressRecommendation {
  if (input.attempts.length === 0) {
    return {
      kind: "build-history",
      recommendedDifficulty: "beginner",
      recommendedExerciseType: "follow-planned-route",
      reason: "Complete a first learner route so TopoPass can build a training baseline."
    };
  }

  const repeatedFault = input.commonMistakes.find((mistake) => mistake.attemptCount >= 2);

  if (repeatedFault) {
    return {
      kind: "targeted-practice",
      recommendedDifficulty: input.currentDifficulty,
      recommendedExerciseType: exerciseTypeForFaultCategory(repeatedFault.category),
      targetFaultCategory: repeatedFault.category,
      reason: `${repeatedFault.label} has appeared in ${repeatedFault.attemptCount} attempt(s), so the next exercise should target that pattern before increasing difficulty.`
    };
  }

  if (recentSeriousOrInvalidCount(input.attempts) >= 2) {
    return {
      kind: "hold",
      recommendedDifficulty: input.currentDifficulty,
      recommendedExerciseType: "choose-legal-route",
      reason: "Recent serious or invalid-route faults mean the next exercise should stay at the current difficulty and reinforce legal route choice."
    };
  }

  if (hintHeavy(input.attempts)) {
    return {
      kind: "hold",
      recommendedDifficulty: input.currentDifficulty,
      recommendedExerciseType: "identify-next-safe-turn",
      reason: "Recent completions used several hints, so keep the same difficulty and practise independent next-turn planning."
    };
  }

  const strongRecentAttempts = strongAttemptsAtCurrentDifficulty(input.attempts, input.currentDifficulty);
  const nextDifficulty = nextExerciseDifficulty(input.currentDifficulty);

  if (strongRecentAttempts.length >= 3 && nextDifficulty) {
    return {
      kind: "promote",
      recommendedDifficulty: nextDifficulty,
      recommendedExerciseType: "follow-planned-route",
      promotedFromDifficulty: input.currentDifficulty,
      reason: `The last ${strongRecentAttempts.length} ${input.currentDifficulty} attempt(s) were strong passes with low hint use, so the next exercise can move up.`
    };
  }

  return {
    kind: "hold",
    recommendedDifficulty: input.currentDifficulty,
    recommendedExerciseType: "follow-planned-route",
    reason: "Performance is mixed or still building history, so keep the next exercise at the current difficulty."
  };
}

function difficultyReadiness(input: {
  attempts: readonly LearnerTrainingAttemptProgressRecord[];
  recommendation: LearnerTrainingProgressRecommendation;
}): Record<ExerciseDifficulty, boolean> {
  const readiness: Record<ExerciseDifficulty, boolean> = {
    beginner: true,
    easy: false,
    intermediate: false,
    advanced: false
  };

  for (const difficulty of EXERCISE_DIFFICULTIES) {
    readiness[difficulty] = compareExerciseDifficulty(difficulty, input.recommendation.recommendedDifficulty) <= 0;
  }

  if (input.attempts.length === 0) {
    readiness.easy = false;
    readiness.intermediate = false;
    readiness.advanced = false;
  }

  return readiness;
}

function learnerProgressSnapshot(input: {
  learnerId: string;
  updatedAt: string;
  attempts: readonly LearnerTrainingAttemptProgressRecord[];
  summary: LearnerTrainingProgressSummary;
}): LearnerProgress {
  const base = createEmptyLearnerProgress({
    learnerId: input.learnerId,
    updatedAt: input.updatedAt
  });
  const completedExerciseIds = uniqueStrings(
    input.attempts.filter((attempt) => attempt.completed).map((attempt) => attempt.exerciseId)
  );
  const attemptedExerciseIds = uniqueStrings(input.attempts.map((attempt) => attempt.exerciseId));

  return {
    ...base,
    completedExerciseIds,
    attemptedExerciseIds,
    weakFaultCategories: input.summary.commonMistakes.slice(0, 4).map((mistake) => mistake.category),
    difficultyReadiness: difficultyReadiness({
      attempts: input.attempts,
      recommendation: input.summary.recommendation
    }),
    averageScorePercent: input.summary.averageScorePercent ?? undefined,
    latestAttemptId: sortAttemptsNewest(input.attempts)[0]?.id,
    attemptCount: input.summary.attemptCount,
    completedAttemptCount: input.summary.completedExerciseCount,
    hintUsageCount: input.attempts.reduce((total, attempt) => total + attempt.hintCount, 0),
    recentTrend: input.summary.recentTrend,
    recommendedNextDifficulty: input.summary.recommendedNextDifficulty,
    recommendedNextExerciseType: input.summary.recommendedNextExerciseType,
    commonMistakeCategories: input.summary.commonMistakes.map((mistake) => ({
      category: mistake.category,
      count: mistake.count,
      seriousOrDangerousCount: mistake.seriousOrDangerousCount,
      latestAttemptId: mistake.latestAttemptId
    })),
    scoreHistory: sortAttemptsNewest(input.attempts).map((attempt) => ({
      attemptId: attempt.id,
      exerciseId: attempt.exerciseId,
      difficulty: attempt.difficulty,
      exerciseType: attempt.exerciseType,
      scorePercent: attempt.scorePercent,
      passed: attempt.passed,
      completed: attempt.completed,
      attemptedAt: attempt.attemptedAt,
      hintCount: attempt.hintCount
    }))
  };
}

function buildSummary(attempts: readonly LearnerTrainingAttemptProgressRecord[]): LearnerTrainingProgressSummary {
  const sortedAttempts = sortAttemptsNewest(attempts);
  const currentDifficulty = latestDifficulty(sortedAttempts);
  const mistakes = commonMistakes(sortedAttempts);
  const recommendation = recommendationForProgress({
    attempts: sortedAttempts,
    commonMistakes: mistakes,
    currentDifficulty
  });
  const averageScorePercent = roundPercent(average(sortedAttempts.map((attempt) => attempt.scorePercent)));
  const passRatePercent = roundPercent(
    sortedAttempts.length > 0
      ? (sortedAttempts.filter((attempt) => attempt.passed).length / sortedAttempts.length) * 100
      : null
  );

  return {
    attemptCount: sortedAttempts.length,
    completedExerciseCount: sortedAttempts.filter((attempt) => attempt.completed).length,
    averageScorePercent,
    passRatePercent,
    recentTrend: recentTrend(sortedAttempts),
    currentDifficulty,
    recommendedNextDifficulty: recommendation.recommendedDifficulty,
    recommendedNextExerciseType: recommendation.recommendedExerciseType,
    commonMistakes: mistakes,
    recentAttempts: sortedAttempts.slice(0, RECENT_ATTEMPT_LIMIT),
    recommendation
  };
}

export function createEmptyLearnerTrainingProgress(input: {
  learnerId?: string;
  updatedAt?: string;
} = {}): LearnerTrainingProgressState {
  return buildLearnerTrainingProgressState({
    learnerId: input.learnerId ?? DEFAULT_LEARNER_TRAINING_PROGRESS_LEARNER_ID,
    updatedAt: input.updatedAt ?? new Date(0).toISOString(),
    attempts: []
  });
}

export function buildLearnerTrainingProgressState(input: {
  learnerId: string;
  updatedAt?: string;
  attempts: readonly LearnerTrainingAttemptProgressRecord[];
}): LearnerTrainingProgressState {
  const updatedAt = input.updatedAt ?? nowIso();
  const attempts = sortAttemptsNewest(input.attempts).slice(0, MAX_STORED_ATTEMPTS);
  const summary = buildSummary(attempts);

  return {
    schemaVersion: LEARNER_TRAINING_PROGRESS_SCHEMA_VERSION,
    learnerId: input.learnerId,
    updatedAt,
    attempts,
    summary,
    learnerProgress: learnerProgressSnapshot({
      learnerId: input.learnerId,
      updatedAt,
      attempts,
      summary
    })
  };
}

export function buildLearnerTrainingAttemptProgressRecord(input: {
  exercise: GeneratedLearnerExercise;
  scoring: LearnerAttemptScoringResult;
  feedback?: LearnerAttemptFeedbackResult;
  hintsUsed?: readonly Hint[];
  attemptedAt?: string;
  completedAt?: string;
}): LearnerTrainingAttemptProgressRecord {
  const completedAt = input.completedAt ?? nowIso();
  const hintsUsed = input.hintsUsed ?? [];
  const faults = input.scoring.faults.map((fault) => ({
    id: fault.id,
    category: fault.category,
    severity: fault.severity,
    title: fault.title,
    blocking: fault.blocking
  }));

  return {
    id: input.scoring.attemptId,
    exerciseId: input.exercise.id,
    exerciseTitle: input.exercise.title,
    mapId: input.exercise.mapId,
    exerciseType: input.exercise.type,
    difficulty: input.exercise.difficulty,
    attemptedAt: input.attemptedAt ?? completedAt,
    completedAt,
    status: input.scoring.status,
    scorePercent: input.scoring.scorePercent,
    passed: input.scoring.passed,
    completed: input.scoring.completed,
    hintCount: hintsUsed.length,
    highestHintLevel: mostDemandingHintLevel(hintsUsed),
    hintPenalty: input.scoring.metrics.hintPenalty,
    seriousFaultCount: input.scoring.seriousFaults.length,
    dangerousFaultCount: input.scoring.dangerousFaults.length,
    invalidRouteFaultCount: invalidRouteFaultCount(input.scoring.faults),
    faultCategories: uniqueStrings(input.scoring.faults.map((fault) => fault.category)),
    faults,
    summary: input.feedback?.summary ?? input.scoring.summaryExplanation
  };
}

export function recordLearnerTrainingAttempt(input: {
  progress: LearnerTrainingProgressState;
  exercise: GeneratedLearnerExercise;
  scoring: LearnerAttemptScoringResult;
  feedback?: LearnerAttemptFeedbackResult;
  hintsUsed?: readonly Hint[];
  attemptedAt?: string;
  completedAt?: string;
}): LearnerTrainingProgressState {
  const record = buildLearnerTrainingAttemptProgressRecord({
    exercise: input.exercise,
    scoring: input.scoring,
    feedback: input.feedback,
    hintsUsed: input.hintsUsed,
    attemptedAt: input.attemptedAt,
    completedAt: input.completedAt
  });

  return recordLearnerTrainingAttemptRecord({
    progress: input.progress,
    attempt: record,
    updatedAt: input.completedAt
  });
}

export function recordLearnerTrainingAttemptRecord(input: {
  progress: LearnerTrainingProgressState;
  attempt: LearnerTrainingAttemptProgressRecord;
  updatedAt?: string;
}): LearnerTrainingProgressState {
  const attempts = [
    input.attempt,
    ...input.progress.attempts.filter((attempt) => attempt.id !== input.attempt.id)
  ];

  return buildLearnerTrainingProgressState({
    learnerId: input.progress.learnerId,
    updatedAt: input.updatedAt ?? input.attempt.completedAt,
    attempts
  });
}

export function normaliseLearnerTrainingProgress(
  value: unknown,
  options: { learnerId?: string; updatedAt?: string } = {}
): LearnerTrainingProgressState {
  if (!isObject(value)) {
    return createEmptyLearnerTrainingProgress(options);
  }

  const learnerId = typeof value.learnerId === "string" ? value.learnerId : options.learnerId;
  const updatedAt = isValidDate(value.updatedAt) ? value.updatedAt : options.updatedAt;
  const attempts = Array.isArray(value.attempts)
    ? value.attempts
        .map(normaliseAttemptRecord)
        .filter((attempt): attempt is LearnerTrainingAttemptProgressRecord => Boolean(attempt))
    : [];

  return buildLearnerTrainingProgressState({
    learnerId: learnerId ?? DEFAULT_LEARNER_TRAINING_PROGRESS_LEARNER_ID,
    updatedAt: updatedAt ?? new Date(0).toISOString(),
    attempts
  });
}

function resolveStore(input: {
  storage?: LearnerTrainingProgressStore | null;
} = {}): LearnerTrainingProgressStore | null {
  if (Object.prototype.hasOwnProperty.call(input, "storage")) {
    return input.storage ?? null;
  }

  return getLocalStorage();
}

export function createLocalLearnerTrainingProgressStorage(input: {
  storage?: LearnerTrainingProgressStore | null;
  key?: string;
  learnerId?: string;
} = {}): LearnerTrainingProgressStorageAdapter {
  const key = input.key ?? LEARNER_TRAINING_PROGRESS_STORAGE_KEY;
  const learnerId = input.learnerId ?? DEFAULT_LEARNER_TRAINING_PROGRESS_LEARNER_ID;

  return {
    load() {
      const store = resolveStore(input);

      if (!store) {
        return {
          ok: false,
          source: "unavailable",
          progress: createEmptyLearnerTrainingProgress({ learnerId }),
          reason: "Browser localStorage is unavailable, so learner training progress is only kept for this session."
        };
      }

      try {
        const rawValue = store.getItem(key);

        if (!rawValue) {
          return {
            ok: true,
            source: "local",
            progress: createEmptyLearnerTrainingProgress({ learnerId }),
            reason: "No learner training progress has been saved yet."
          };
        }

        return {
          ok: true,
          source: "local",
          progress: normaliseLearnerTrainingProgress(JSON.parse(rawValue), { learnerId })
        };
      } catch (error) {
        return {
          ok: false,
          source: "local",
          progress: createEmptyLearnerTrainingProgress({ learnerId }),
          reason: "Saved learner training progress could not be read, so a fresh progress state was used.",
          error: error instanceof Error ? error.message : "Unknown storage read failure."
        };
      }
    },
    save(progress) {
      const store = resolveStore(input);

      if (!store) {
        return {
          ok: false,
          source: "unavailable",
          reason: "Browser localStorage is unavailable, so learner training progress was not saved."
        };
      }

      try {
        store.setItem(key, JSON.stringify(normaliseLearnerTrainingProgress(progress, { learnerId: progress.learnerId })));

        return {
          ok: true,
          source: "local"
        };
      } catch (error) {
        return {
          ok: false,
          source: "local",
          reason: "Learner training progress could not be saved in this browser.",
          error: error instanceof Error ? error.message : "Unknown storage write failure."
        };
      }
    },
    clear() {
      const store = resolveStore(input);

      if (!store) {
        return {
          ok: false,
          source: "unavailable",
          reason: "Browser localStorage is unavailable, so there was no saved learner training progress to reset."
        };
      }

      try {
        store.removeItem(key);

        return {
          ok: true,
          source: "local"
        };
      } catch (error) {
        return {
          ok: false,
          source: "local",
          reason: "Saved learner training progress could not be reset in this browser.",
          error: error instanceof Error ? error.message : "Unknown storage reset failure."
        };
      }
    }
  };
}
