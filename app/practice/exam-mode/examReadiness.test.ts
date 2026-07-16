import assert from "node:assert/strict";
import test from "node:test";
import type {
  ExamScoringCategoryId,
  ExamScoringCategoryResult
} from "./examScoringRubric.ts";
import type { ExamRouteTag } from "./examRoutePack.ts";
import {
  EXAM_PROGRESS_SCHEMA_VERSION,
  createLocalExamProgressStorage,
  normaliseExamProgressState,
  type ExamProgressAttemptRecord,
  type ExamProgressState
} from "./examProgressTracking.ts";
import {
  EXAM_READINESS_MIN_ATTEMPTS,
  EXAM_READINESS_MIN_DISTINCT_TAGS,
  EXAM_READINESS_MIN_DISTINCT_TASKS,
  buildExamReadinessSummary
} from "./examReadiness.ts";

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

const CATEGORY_DEFINITIONS: readonly {
  id: ExamScoringCategoryId;
  label: string;
  weightPercent: number;
}[] = [
  { id: "legality", label: "Legality", weightPercent: 30 },
  { id: "destination-completion", label: "Destination completion", weightPercent: 25 },
  { id: "route-efficiency", label: "Route efficiency", weightPercent: 35 },
  { id: "detour-backtracking", label: "Detour and backtracking", weightPercent: 10 },
  { id: "road-suitability", label: "Road hierarchy and suitability", weightPercent: 0 },
  { id: "avoidable-mistakes", label: "Avoidable mistakes", weightPercent: 0 }
];

function buildCategories(input: {
  weakCategoryIds?: readonly ExamScoringCategoryId[];
  unavailableCategoryIds?: readonly ExamScoringCategoryId[];
} = {}): ExamScoringCategoryResult[] {
  const weakIds = new Set(input.weakCategoryIds ?? []);
  const unavailableIds = new Set(input.unavailableCategoryIds ?? [
    "road-suitability",
    "avoidable-mistakes"
  ]);

  return CATEGORY_DEFINITIONS.map((definition) => {
    if (unavailableIds.has(definition.id)) {
      return {
        ...definition,
        assessment: "unavailable",
        outcome: "unavailable",
        scorePercent: null,
        weightedPoints: 0,
        summary: `${definition.label} is unavailable from the current stored evidence.`,
        evidence: []
      };
    }

    const needsPractice = weakIds.has(definition.id);

    return {
      ...definition,
      assessment: "supported",
      outcome: needsPractice ? "needs-practice" : "met",
      scorePercent: needsPractice ? 0 : 100,
      weightedPoints: needsPractice ? 0 : definition.weightPercent,
      summary: needsPractice
        ? `${definition.label} needs more practice based on this attempt.`
        : `${definition.label} met the current practice check.`,
      evidence: []
    };
  });
}

function buildAttempt(input: {
  id: string;
  hour: number;
  scorePercent: number;
  status: "pass" | "needs-practice";
  taskId: string;
  tags: readonly ExamRouteTag[];
  weakCategoryIds?: readonly ExamScoringCategoryId[];
  unavailableCategoryIds?: readonly ExamScoringCategoryId[];
}): ExamProgressAttemptRecord {
  return {
    schemaVersion: EXAM_PROGRESS_SCHEMA_VERSION,
    id: input.id,
    taskId: input.taskId,
    taskTitle: `Route ${input.taskId}`,
    mapId: "test-map",
    taskVersion: "1.0.0",
    originLabel: "Origin",
    destinationLabel: "Destination",
    completedAt: new Date(Date.UTC(2026, 6, 16, input.hour)).toISOString(),
    elapsedSeconds: 300,
    completionState: "submitted",
    scorePercent: input.scorePercent,
    status: input.status,
    statusLabel: input.status === "pass" ? "Pass" : "Needs practice",
    categories: buildCategories({
      weakCategoryIds: input.weakCategoryIds,
      unavailableCategoryIds: input.unavailableCategoryIds
    }),
    routeTags: [...input.tags]
  };
}

function progress(attempts: readonly ExamProgressAttemptRecord[]): ExamProgressState {
  return normaliseExamProgressState({
    schemaVersion: EXAM_PROGRESS_SCHEMA_VERSION,
    attempts
  });
}

test("Stage 9.6 reports an honest empty readiness state", () => {
  const summary = buildExamReadinessSummary(progress([]));

  assert.equal(summary.status.id, "not-enough-attempts");
  assert.equal(summary.status.label, "Not enough attempts yet");
  assert.equal(summary.dataState, "empty");
  assert.equal(summary.totalCompletedAttempts, 0);
  assert.equal(summary.latestScorePercent, null);
  assert.equal(summary.averageScorePercent, null);
  assert.equal(summary.officialTfLReadiness, false);
  assert.match(summary.disclaimer, /not an official TfL assessment or certification/i);
  assert.match(summary.lowDataReasons[0] ?? "", /no completed exam attempts/i);
});

test("Stage 9.6 withholds readiness for low attempt volume or narrow route coverage", () => {
  const lowAttemptSummary = buildExamReadinessSummary(progress([
    buildAttempt({
      id: "low-1",
      hour: 10,
      scorePercent: 90,
      status: "pass",
      taskId: "task-a",
      tags: ["bridge", "central-density"]
    }),
    buildAttempt({
      id: "low-2",
      hour: 11,
      scorePercent: 92,
      status: "pass",
      taskId: "task-b",
      tags: ["station", "landmark"]
    })
  ]));

  assert.equal(lowAttemptSummary.dataState, "low-attempts");
  assert.equal(lowAttemptSummary.status.id, "not-enough-attempts");
  assert.match(lowAttemptSummary.lowDataReasons.join(" "), /complete 1 more/i);

  const lowVarietySummary = buildExamReadinessSummary(progress([
    buildAttempt({
      id: "narrow-1",
      hour: 10,
      scorePercent: 90,
      status: "pass",
      taskId: "task-a",
      tags: ["bridge", "central-density"]
    }),
    buildAttempt({
      id: "narrow-2",
      hour: 11,
      scorePercent: 90,
      status: "pass",
      taskId: "task-a",
      tags: ["bridge", "central-density"]
    }),
    buildAttempt({
      id: "narrow-3",
      hour: 12,
      scorePercent: 90,
      status: "pass",
      taskId: "task-a",
      tags: ["bridge", "central-density"]
    })
  ]));

  assert.equal(lowVarietySummary.dataState, "low-variety");
  assert.equal(lowVarietySummary.status.id, "not-enough-attempts");
  assert.ok(lowVarietySummary.totalCompletedAttempts >= EXAM_READINESS_MIN_ATTEMPTS);
  assert.ok(lowVarietySummary.distinctTaskCount < EXAM_READINESS_MIN_DISTINCT_TASKS);
  assert.ok(lowVarietySummary.coveredTagCount < EXAM_READINESS_MIN_DISTINCT_TAGS);
  assert.match(lowVarietySummary.lowDataReasons.join(" "), /different route tasks/i);
  assert.match(lowVarietySummary.lowDataReasons.join(" "), /route tags/i);
});

test("Stage 9.6 resolves ready, nearly-ready, and needs-practice states deterministically", () => {
  const readyProgress = progress([
    buildAttempt({
      id: "ready-1",
      hour: 10,
      scorePercent: 84,
      status: "pass",
      taskId: "task-a",
      tags: ["bridge", "major-road-choice"]
    }),
    buildAttempt({
      id: "ready-2",
      hour: 11,
      scorePercent: 87,
      status: "pass",
      taskId: "task-b",
      tags: ["central-density", "one-way-awareness"]
    }),
    buildAttempt({
      id: "ready-3",
      hour: 12,
      scorePercent: 91,
      status: "pass",
      taskId: "task-c",
      tags: ["station", "landmark"]
    })
  ]);
  const ready = buildExamReadinessSummary(readyProgress);

  assert.equal(ready.status.id, "ready-for-harder-practice");
  assert.equal(ready.latestScorePercent, 91);
  assert.equal(ready.bestScorePercent, 91);
  assert.equal(ready.averageScorePercent, 87.3);
  assert.equal(ready.recentPassRatePercent, 100);
  assert.equal(ready.trend.direction, "improving");
  assert.deepEqual(buildExamReadinessSummary(readyProgress), ready);

  const nearly = buildExamReadinessSummary(progress([
    buildAttempt({
      id: "nearly-1",
      hour: 10,
      scorePercent: 80,
      status: "pass",
      taskId: "task-a",
      tags: ["bridge", "major-road-choice"]
    }),
    buildAttempt({
      id: "nearly-2",
      hour: 11,
      scorePercent: 82,
      status: "pass",
      taskId: "task-b",
      tags: ["central-density", "one-way-awareness"]
    }),
    buildAttempt({
      id: "nearly-3",
      hour: 12,
      scorePercent: 78,
      status: "needs-practice",
      taskId: "task-c",
      tags: ["station", "landmark"],
      weakCategoryIds: ["route-efficiency"]
    })
  ]));

  assert.equal(nearly.status.id, "nearly-ready");
  assert.equal(nearly.trend.direction, "declining");

  const needsPractice = buildExamReadinessSummary(progress([
    buildAttempt({
      id: "needs-1",
      hour: 10,
      scorePercent: 60,
      status: "needs-practice",
      taskId: "task-a",
      tags: ["bridge", "major-road-choice"],
      weakCategoryIds: ["legality"]
    }),
    buildAttempt({
      id: "needs-2",
      hour: 11,
      scorePercent: 64,
      status: "needs-practice",
      taskId: "task-b",
      tags: ["central-density", "one-way-awareness"],
      weakCategoryIds: ["legality"]
    }),
    buildAttempt({
      id: "needs-3",
      hour: 12,
      scorePercent: 68,
      status: "needs-practice",
      taskId: "task-c",
      tags: ["station", "landmark"],
      weakCategoryIds: ["route-efficiency"]
    })
  ]));

  assert.equal(needsPractice.status.id, "needs-more-practice");
  assert.equal(needsPractice.repeatedWeakCategories[0]?.id, "legality");
  assert.equal(needsPractice.repeatedWeakCategories[0]?.needsPracticeCount, 2);
});

test("Stage 9.6 category and tag summaries use only supported stored evidence", () => {
  const summary = buildExamReadinessSummary(progress([
    buildAttempt({
      id: "evidence-1",
      hour: 10,
      scorePercent: 62,
      status: "needs-practice",
      taskId: "task-a",
      tags: ["bridge", "central-density"],
      weakCategoryIds: ["destination-completion"]
    }),
    buildAttempt({
      id: "evidence-2",
      hour: 11,
      scorePercent: 65,
      status: "needs-practice",
      taskId: "task-b",
      tags: ["bridge", "one-way-awareness"],
      weakCategoryIds: ["destination-completion"]
    }),
    buildAttempt({
      id: "evidence-3",
      hour: 12,
      scorePercent: 82,
      status: "pass",
      taskId: "task-c",
      tags: ["station", "landmark"]
    })
  ]));

  assert.ok(summary.repeatedWeakCategories.some((category) => category.id === "destination-completion"));
  assert.ok(summary.repeatedWeakCategories.every((category) => category.id !== "road-suitability"));
  assert.ok(summary.repeatedWeakCategories.every((category) => category.id !== "avoidable-mistakes"));

  const bridgeCoverage = summary.tagCoverage.find((coverage) => coverage.tag === "bridge");
  const hospitalCoverage = summary.tagCoverage.find((coverage) => coverage.tag === "hospital");

  assert.deepEqual(bridgeCoverage, {
    tag: "bridge",
    attemptCount: 2,
    needsPracticeAttemptCount: 2,
    recentNeedsPracticeAttemptCount: 2,
    covered: true
  });
  assert.equal(hospitalCoverage?.covered, false);
  assert.equal(summary.tagsNeedingMoreEvidence[0]?.tag, "bridge");
});

test("Stage 9.6 builds dashboard output from the Stage 9.5 persisted state", () => {
  const storage = new MemoryStorage();
  const adapter = createLocalExamProgressStorage({ storage });
  const savedProgress = progress([
    buildAttempt({
      id: "stored-1",
      hour: 10,
      scorePercent: 85,
      status: "pass",
      taskId: "task-a",
      tags: ["bridge", "major-road-choice"]
    }),
    buildAttempt({
      id: "stored-2",
      hour: 11,
      scorePercent: 88,
      status: "pass",
      taskId: "task-b",
      tags: ["central-density", "one-way-awareness"]
    }),
    buildAttempt({
      id: "stored-3",
      hour: 12,
      scorePercent: 90,
      status: "pass",
      taskId: "task-c",
      tags: ["station", "landmark"]
    })
  ]);

  assert.equal(adapter.save(savedProgress).ok, true);

  const loaded = createLocalExamProgressStorage({ storage }).load();
  const dashboard = buildExamReadinessSummary(loaded.progress);

  assert.equal(loaded.ok, true);
  assert.equal(dashboard.totalCompletedAttempts, 3);
  assert.equal(dashboard.status.id, "ready-for-harder-practice");
  assert.equal(dashboard.officialTfLReadiness, false);
});
