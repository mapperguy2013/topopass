import assert from "node:assert/strict";
import test from "node:test";
import {
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  runRouteExercise
} from "../../../lib/map-engine/index.ts";
import {
  EXAM_PROGRESS_MAX_ATTEMPTS,
  EXAM_PROGRESS_SCHEMA_VERSION,
  buildCompletedExamProgressAttempt,
  buildExamProgressSummary,
  createEmptyExamProgressState,
  createLocalExamProgressStorage,
  normaliseExamProgressState,
  recordExamProgressAttempt,
  type BuildCompletedExamProgressAttemptInput,
  type ExamProgressAttemptRecord
} from "./examProgressTracking.ts";
import { buildExamScoringResult, type ExamScoringResult } from "./examScoringRubric.ts";

class MemoryStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const passingExerciseResult = runRouteExercise({
  map: marloweDistrictMap,
  exercises: marloweDistrictRouteExercises,
  exerciseId: "ex-library-market-museum",
  userRoute: {
    nodeIds: ["n02", "n03", "n12", "n17"],
    roadIds: ["r02", "r37", "r24"]
  }
});

const illegalExerciseResult = runRouteExercise({
  map: marloweDistrictMap,
  exercises: marloweDistrictRouteExercises,
  exerciseId: "ex-station-to-hospital",
  userRoute: {
    nodeIds: ["n14", "n13", "n14", "n18", "n17", "n12", "n04", "n05", "n09"],
    roadIds: ["r14", "r14", "r26", "r22", "r24", "r16", "r04", "r15"]
  }
});

const passingScore = buildExamScoringResult(passingExerciseResult);
const needsPracticeScore = buildExamScoringResult(illegalExerciseResult);

function buildAttempt(input: {
  id: string;
  completedAt: string;
  scoringResult?: ExamScoringResult;
  tags?: BuildCompletedExamProgressAttemptInput["routeTags"];
}): ExamProgressAttemptRecord {
  const attempt = buildCompletedExamProgressAttempt({
    mode: "student-exam",
    submitted: true,
    attemptId: input.id,
    taskId: "exam-9-4-test-route",
    taskTitle: "Test origin to test destination",
    mapId: marloweDistrictMap.id,
    taskVersion: "1.0.0",
    originLabel: "Test origin",
    destinationLabel: "Test destination",
    completedAt: input.completedAt,
    elapsedSeconds: 325,
    scoringResult: input.scoringResult ?? passingScore,
    routeTags: input.tags ?? ["central-density"]
  });

  assert.ok(attempt);
  return attempt;
}

test("Stage 9.5 builds completed exam records from submitted rubric and route metadata", () => {
  const attempt = buildAttempt({
    id: "exam-attempt-1",
    completedAt: "2026-07-16T10:00:00.000Z",
    tags: ["bridge", "central-density"]
  });

  assert.equal(attempt.schemaVersion, EXAM_PROGRESS_SCHEMA_VERSION);
  assert.equal(attempt.completionState, "submitted");
  assert.equal(attempt.taskId, "exam-9-4-test-route");
  assert.equal(attempt.taskTitle, "Test origin to test destination");
  assert.equal(attempt.originLabel, "Test origin");
  assert.equal(attempt.destinationLabel, "Test destination");
  assert.equal(attempt.elapsedSeconds, 325);
  assert.equal(attempt.scorePercent, passingScore.scorePercent);
  assert.equal(attempt.status, "pass");
  assert.deepEqual(attempt.categories, passingScore.categories);
  assert.deepEqual(attempt.routeTags, ["bridge", "central-density"]);
});

test("Stage 9.5 records only submitted exam attempts", () => {
  const baseInput: BuildCompletedExamProgressAttemptInput = {
    mode: "student-exam",
    submitted: true,
    attemptId: "gated-attempt",
    taskId: "route-id",
    taskTitle: "Route title",
    mapId: "map-id",
    originLabel: "Origin",
    destinationLabel: "Destination",
    completedAt: "2026-07-16T10:00:00.000Z",
    elapsedSeconds: 60,
    scoringResult: passingScore
  };

  assert.equal(buildCompletedExamProgressAttempt({ ...baseInput, submitted: false }), null);
  assert.equal(buildCompletedExamProgressAttempt({ ...baseInput, mode: "student-beta" }), null);
  assert.equal(buildCompletedExamProgressAttempt({ ...baseInput, mode: "dev" }), null);
  assert.equal(buildCompletedExamProgressAttempt({ ...baseInput, scoringResult: null }), null);
});

test("Stage 9.5 summary derives scores, repeated weak categories, tags, and trend from stored attempts", () => {
  const attempts = [
    buildAttempt({
      id: "latest-pass",
      completedAt: "2026-07-16T12:00:00.000Z",
      tags: ["central-density"]
    }),
    buildAttempt({
      id: "recent-needs-practice",
      completedAt: "2026-07-16T11:00:00.000Z",
      scoringResult: needsPracticeScore,
      tags: ["central-density", "one-way-awareness"]
    }),
    buildAttempt({
      id: "older-needs-practice",
      completedAt: "2026-07-16T10:00:00.000Z",
      scoringResult: needsPracticeScore,
      tags: ["central-density", "one-way-awareness"]
    })
  ];
  const progress = attempts.reduce(recordExamProgressAttempt, createEmptyExamProgressState());
  const summary = buildExamProgressSummary(progress);
  const expectedAverage = Math.round(
    ((passingScore.scorePercent + needsPracticeScore.scorePercent * 2) / 3) * 10
  ) / 10;

  assert.equal(summary.attemptCount, 3);
  assert.equal(summary.latestAttempt?.id, "latest-pass");
  assert.equal(summary.bestAttempt?.id, "latest-pass");
  assert.equal(summary.latestScorePercent, passingScore.scorePercent);
  assert.equal(summary.bestScorePercent, passingScore.scorePercent);
  assert.equal(summary.averageScorePercent, expectedAverage);
  assert.equal(summary.trend.direction, "improving");
  assert.equal(
    summary.trend.changePercent,
    Math.round((passingScore.scorePercent - needsPracticeScore.scorePercent) * 10) / 10
  );
  assert.ok(
    summary.repeatedWeakCategories.some(
      (category) => category.id === "legality" && category.needsPracticeCount === 2
    )
  );
  assert.ok(
    summary.repeatedWeakCategories.every(
      (category) => category.id !== "road-suitability" && category.id !== "avoidable-mistakes"
    )
  );
  assert.deepEqual(summary.routeTagsNeedingPractice[0], {
    tag: "central-density",
    attemptCount: 3,
    needsPracticeAttemptCount: 2
  });
  assert.deepEqual(summary.routeTagsNeedingPractice[1], {
    tag: "one-way-awareness",
    attemptCount: 2,
    needsPracticeAttemptCount: 2
  });
});

test("Stage 9.5 local adapter survives reload and handles unavailable or corrupt storage safely", () => {
  const storage = new MemoryStorage();
  const firstAdapter = createLocalExamProgressStorage({ storage });
  const progress = recordExamProgressAttempt(
    createEmptyExamProgressState(),
    buildAttempt({ id: "persisted-attempt", completedAt: "2026-07-16T10:00:00.000Z" })
  );

  assert.equal(firstAdapter.save(progress).ok, true);

  const reloaded = createLocalExamProgressStorage({ storage }).load();
  assert.equal(reloaded.ok, true);
  assert.deepEqual(reloaded.progress, progress);

  storage.setItem("topopass.examProgress.v1", "{bad-json");
  const corrupt = createLocalExamProgressStorage({ storage }).load();
  assert.equal(corrupt.ok, false);
  assert.deepEqual(corrupt.progress, createEmptyExamProgressState());

  const unavailable = createLocalExamProgressStorage({ storage: null });
  assert.equal(unavailable.load().source, "unavailable");
  assert.equal(unavailable.save(progress).ok, false);
});

test("Stage 9.5 normalisation deduplicates, bounds history, and rejects fabricated stored values", () => {
  const attempts = Array.from({ length: EXAM_PROGRESS_MAX_ATTEMPTS + 2 }, (_, index) =>
    buildAttempt({
      id: `bounded-attempt-${index}`,
      completedAt: new Date(Date.UTC(2026, 6, 16, 10, index)).toISOString()
    })
  );
  const normalised = normaliseExamProgressState({
    schemaVersion: 999,
    attempts: [
      ...attempts,
      attempts[0],
      {
        ...attempts[0],
        id: "invalid-progress-record",
        completionState: "active",
        routeTags: ["fabricated-tag"]
      },
      {
        ...attempts[0],
        id: "invalid-category-record",
        categories: attempts[0].categories.map((category, index) =>
          index === 0 ? { ...category, scorePercent: 999 } : category
        )
      }
    ]
  });

  assert.equal(normalised.schemaVersion, EXAM_PROGRESS_SCHEMA_VERSION);
  assert.equal(normalised.attempts.length, EXAM_PROGRESS_MAX_ATTEMPTS);
  assert.equal(new Set(normalised.attempts.map((attempt) => attempt.id)).size, EXAM_PROGRESS_MAX_ATTEMPTS);
  assert.equal(normalised.attempts[0].id, `bounded-attempt-${EXAM_PROGRESS_MAX_ATTEMPTS + 1}`);
  assert.equal(normalised.attempts.some((attempt) => attempt.id === "invalid-progress-record"), false);
  assert.equal(normalised.attempts.some((attempt) => attempt.id === "invalid-category-record"), false);
});
