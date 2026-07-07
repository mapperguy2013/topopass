import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmptyLearnerTrainingProgress,
  createLocalLearnerTrainingProgressStorage,
  recordLearnerTrainingAttemptRecord,
  type LearnerTrainingAttemptProgressRecord,
  type LearnerTrainingProgressFaultRecord
} from "./learnerProgressTracking.ts";
import type {
  DrivingFaultCategory,
  DrivingFaultSeverity,
  ExerciseDifficulty,
  ExerciseType,
  HintLevel
} from "./learnerDriverTraining.ts";

class MemoryProgressStorage implements Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  readonly store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

class FailingProgressStorage implements Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  getItem(): string | null {
    return null;
  }

  setItem(): void {
    throw new Error("storage quota exceeded");
  }

  removeItem(): void {
    throw new Error("storage unavailable");
  }
}

function fault(
  category: DrivingFaultCategory,
  severity: DrivingFaultSeverity = "minor",
  blocking = false
): LearnerTrainingProgressFaultRecord {
  return {
    id: `fault-${category}-${severity}`,
    category,
    severity,
    title: category.replaceAll("-", " "),
    blocking
  };
}

function attempt(input: {
  id: string;
  scorePercent?: number;
  passed?: boolean;
  completed?: boolean;
  difficulty?: ExerciseDifficulty;
  exerciseType?: ExerciseType;
  hintCount?: number;
  highestHintLevel?: HintLevel;
  faults?: LearnerTrainingProgressFaultRecord[];
  completedAt?: string;
}): LearnerTrainingAttemptProgressRecord {
  const faults = input.faults ?? [];

  return {
    id: input.id,
    exerciseId: `exercise-${input.id}`,
    exerciseTitle: `Exercise ${input.id}`,
    mapId: "learner-progress-map",
    exerciseType: input.exerciseType ?? "follow-planned-route",
    difficulty: input.difficulty ?? "beginner",
    attemptedAt: input.completedAt ?? "2026-07-07T10:00:00.000Z",
    completedAt: input.completedAt ?? "2026-07-07T10:00:00.000Z",
    status: input.passed === false ? "failed" : "passed",
    scorePercent: input.scorePercent ?? 90,
    passed: input.passed ?? true,
    completed: input.completed ?? true,
    hintCount: input.hintCount ?? 0,
    highestHintLevel: input.highestHintLevel ?? "none",
    hintPenalty: (input.hintCount ?? 0) * 5,
    seriousFaultCount: faults.filter((item) => item.severity === "serious").length,
    dangerousFaultCount: faults.filter((item) => item.severity === "dangerous").length,
    invalidRouteFaultCount: faults.filter((item) => item.blocking || item.severity === "dangerous").length,
    faultCategories: [...new Set(faults.map((item) => item.category))].sort(),
    faults,
    summary: `Summary for ${input.id}`
  };
}

function progressWithAttempts(attempts: readonly LearnerTrainingAttemptProgressRecord[]) {
  return attempts.reduce(
    (progress, item) =>
      recordLearnerTrainingAttemptRecord({
        progress,
        attempt: item,
        updatedAt: item.completedAt
      }),
    createEmptyLearnerTrainingProgress({
      learnerId: "learner-progress-test",
      updatedAt: "2026-07-07T09:00:00.000Z"
    })
  );
}

test("learner training progress stores and loads local browser progress", () => {
  const storage = new MemoryProgressStorage();
  const adapter = createLocalLearnerTrainingProgressStorage({
    storage,
    learnerId: "learner-progress-test"
  });
  const progress = progressWithAttempts([
    attempt({
      id: "stored-1",
      scorePercent: 82,
      completedAt: "2026-07-07T10:00:00.000Z"
    })
  ]);
  const saved = adapter.save(progress);
  const loaded = adapter.load();

  assert.equal(saved.ok, true);
  assert.equal(loaded.ok, true);
  assert.equal(loaded.progress.summary.attemptCount, 1);
  assert.equal(loaded.progress.attempts[0]?.id, "stored-1");
  assert.equal(loaded.progress.learnerProgress.completedExerciseIds.length, 1);
});

test("learner training progress promotes after repeated strong scores", () => {
  const progress = progressWithAttempts([
    attempt({ id: "strong-1", scorePercent: 88, completedAt: "2026-07-07T10:00:00.000Z" }),
    attempt({ id: "strong-2", scorePercent: 91, completedAt: "2026-07-07T11:00:00.000Z" }),
    attempt({ id: "strong-3", scorePercent: 94, completedAt: "2026-07-07T12:00:00.000Z" })
  ]);

  assert.equal(progress.summary.recommendation.kind, "promote");
  assert.equal(progress.summary.recommendedNextDifficulty, "easy");
  assert.equal(progress.learnerProgress.difficultyReadiness.easy, true);
});

test("learner training progress avoids promotion after serious faults", () => {
  const progress = progressWithAttempts([
    attempt({
      id: "serious-1",
      scorePercent: 96,
      passed: false,
      faults: [fault("no-entry", "serious", true)],
      completedAt: "2026-07-07T10:00:00.000Z"
    }),
    attempt({
      id: "serious-2",
      scorePercent: 90,
      passed: false,
      faults: [fault("one-way-direction", "serious", true)],
      completedAt: "2026-07-07T11:00:00.000Z"
    }),
    attempt({ id: "serious-3", scorePercent: 92, completedAt: "2026-07-07T12:00:00.000Z" })
  ]);

  assert.notEqual(progress.summary.recommendation.kind, "promote");
  assert.equal(progress.summary.recommendedNextDifficulty, "beginner");
  assert.match(progress.summary.recommendation.reason, /serious|invalid-route|legal/i);
});

test("learner training progress recommends targeted practice after repeated fault category", () => {
  const progress = progressWithAttempts([
    attempt({
      id: "junction-1",
      scorePercent: 72,
      passed: false,
      faults: [fault("unsafe-junction-decision")],
      completedAt: "2026-07-07T10:00:00.000Z"
    }),
    attempt({
      id: "junction-2",
      scorePercent: 76,
      faults: [fault("unsafe-junction-decision")],
      completedAt: "2026-07-07T11:00:00.000Z"
    })
  ]);

  assert.equal(progress.summary.recommendation.kind, "targeted-practice");
  assert.equal(progress.summary.recommendation.targetFaultCategory, "unsafe-junction-decision");
  assert.equal(progress.summary.recommendedNextExerciseType, "practise-junction-decision-making");
  assert.equal(progress.summary.commonMistakes[0]?.category, "unsafe-junction-decision");
});

test("learner training progress does not over-promote hint-heavy completions", () => {
  const progress = progressWithAttempts([
    attempt({
      id: "hint-heavy-1",
      scorePercent: 92,
      hintCount: 2,
      highestHintLevel: "guided",
      completedAt: "2026-07-07T10:00:00.000Z"
    }),
    attempt({
      id: "hint-heavy-2",
      scorePercent: 94,
      hintCount: 3,
      highestHintLevel: "worked-example",
      completedAt: "2026-07-07T11:00:00.000Z"
    }),
    attempt({
      id: "hint-heavy-3",
      scorePercent: 91,
      hintCount: 2,
      highestHintLevel: "guided",
      completedAt: "2026-07-07T12:00:00.000Z"
    })
  ]);

  assert.equal(progress.summary.recommendation.kind, "hold");
  assert.equal(progress.summary.recommendedNextDifficulty, "beginner");
  assert.equal(progress.summary.recommendedNextExerciseType, "identify-next-safe-turn");
  assert.match(progress.summary.recommendation.reason, /hint/i);
});

test("learner training progress storage failure is handled safely", () => {
  const adapter = createLocalLearnerTrainingProgressStorage({
    storage: new FailingProgressStorage(),
    learnerId: "learner-progress-test"
  });
  const progress = progressWithAttempts([
    attempt({ id: "failure-1", completedAt: "2026-07-07T10:00:00.000Z" })
  ]);
  const saved = adapter.save(progress);
  const cleared = adapter.clear();

  assert.equal(saved.ok, false);
  assert.equal(saved.source, "local");
  assert.match(saved.reason ?? "", /could not be saved/i);
  assert.equal(cleared.ok, false);
  assert.match(cleared.reason ?? "", /could not be reset/i);
});
