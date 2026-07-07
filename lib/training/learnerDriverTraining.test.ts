import assert from "node:assert/strict";
import test from "node:test";
import {
  compareExerciseDifficulty,
  createEmptyLearnerProgress,
  EXERCISE_DIFFICULTIES,
  EXERCISE_TYPES,
  HINT_LEVELS,
  isExerciseDifficulty,
  isExerciseType,
  nextExerciseDifficulty,
  type LearnerAttempt,
  type LearnerExercise
} from "./learnerDriverTraining.ts";

test("Phase 7 exercise types cover the learner-driver training modes", () => {
  assert.deepEqual(EXERCISE_TYPES, [
    "follow-planned-route",
    "choose-legal-route",
    "identify-next-safe-turn",
    "practise-roundabouts",
    "practise-junction-decision-making",
    "route-review-mistake-correction"
  ]);

  for (const exerciseType of EXERCISE_TYPES) {
    assert.equal(isExerciseType(exerciseType), true);
  }

  assert.equal(isExerciseType("parallel-parking"), false);
});

test("Phase 7 exercise difficulty progresses from beginner to advanced", () => {
  assert.deepEqual(EXERCISE_DIFFICULTIES, ["beginner", "easy", "intermediate", "advanced"]);
  assert.equal(isExerciseDifficulty("beginner"), true);
  assert.equal(isExerciseDifficulty("advanced"), true);
  assert.equal(isExerciseDifficulty("expert"), false);
  assert.ok(compareExerciseDifficulty("beginner", "advanced") < 0);
  assert.ok(compareExerciseDifficulty("advanced", "easy") > 0);
  assert.equal(nextExerciseDifficulty("beginner"), "easy");
  assert.equal(nextExerciseDifficulty("easy"), "intermediate");
  assert.equal(nextExerciseDifficulty("intermediate"), "advanced");
  assert.equal(nextExerciseDifficulty("advanced"), null);
});

test("empty learner progress starts at beginner readiness without attempt history", () => {
  const progress = createEmptyLearnerProgress({
    learnerId: "learner-1",
    updatedAt: "2026-07-07T10:00:00.000Z"
  });

  assert.equal(progress.learnerId, "learner-1");
  assert.equal(progress.updatedAt, "2026-07-07T10:00:00.000Z");
  assert.deepEqual(progress.completedExerciseIds, []);
  assert.deepEqual(progress.attemptedExerciseIds, []);
  assert.deepEqual(progress.objectiveMastery, []);
  assert.deepEqual(progress.weakFaultCategories, []);
  assert.deepEqual(progress.difficultyReadiness, {
    beginner: true,
    easy: false,
    intermediate: false,
    advanced: false
  });
});

test("learner exercise and attempt models reference Phase 6 route-runner concepts without UI state", () => {
  const exercise: LearnerExercise = {
    id: "phase-7-safe-turns-1",
    title: "Next safe turn at a restricted junction",
    type: "identify-next-safe-turn",
    difficulty: "beginner",
    mapId: "marlowe-district-dev-map",
    routeExerciseId: "ex-prohibited-turn-albion-theatre",
    objectives: [
      {
        id: "objective-check-turn-restriction",
        title: "Check the turn restriction before choosing the next road",
        category: "junction-decision",
        required: true,
        successCriteria: ["Select a legal outgoing road", "Avoid the prohibited turn"],
        linkedFaultCategories: ["prohibited-turn", "unsafe-junction-decision"]
      }
    ],
    routeLegs: [
      {
        id: "leg-1",
        from: { type: "node", nodeId: "albion-square" },
        to: { type: "node", nodeId: "theatre-arcade" },
        instructionIds: ["instruction-1", "instruction-2"]
      }
    ],
    routeInstructions: [
      {
        id: "instruction-1",
        legId: "leg-1",
        sequence: 1,
        kind: "junction-decision",
        text: "Pause at the junction and identify the legal next road.",
        nodeId: "market-cross"
      },
      {
        id: "instruction-2",
        legId: "leg-1",
        sequence: 2,
        kind: "turn-left",
        text: "Turn left only if the restriction overlay allows it.",
        decisionPoint: {
          nodeId: "market-cross",
          allowedRoadIds: ["road-legal-left"],
          blockedRoadIds: ["road-prohibited-right"]
        }
      }
    ],
    estimatedMinutes: 4,
    tags: ["junctions", "turn-restrictions"],
    published: false
  };
  const attempt: LearnerAttempt = {
    id: "attempt-1",
    learnerId: "learner-1",
    exerciseId: exercise.id,
    mapId: exercise.mapId,
    routeExerciseId: exercise.routeExerciseId,
    status: "reviewed",
    startedAt: "2026-07-07T10:00:00.000Z",
    submittedAt: "2026-07-07T10:04:00.000Z",
    events: [
      {
        id: "event-1",
        attemptId: "attempt-1",
        type: "attempt-started",
        occurredAt: "2026-07-07T10:00:00.000Z",
        exerciseId: exercise.id
      },
      {
        id: "event-2",
        attemptId: "attempt-1",
        type: "hint-requested",
        occurredAt: "2026-07-07T10:02:00.000Z",
        hintId: "hint-1",
        hintLevel: "nudge"
      },
      {
        id: "event-3",
        attemptId: "attempt-1",
        type: "route-reviewed",
        occurredAt: "2026-07-07T10:04:30.000Z",
        reviewStatus: "fail",
        routeReviewId: "route-review-1"
      }
    ],
    score: {
      attemptId: "attempt-1",
      scorePercent: 62,
      passed: false,
      legalRoute: false,
      objectiveResults: [
        {
          objectiveId: "objective-check-turn-restriction",
          achieved: false,
          detail: "The selected turn was prohibited."
        }
      ],
      drivingFaultCount: 1,
      seriousFaultCount: 1,
      dangerousFaultCount: 0,
      reviewStatus: "fail"
    },
    faults: [
      {
        id: "fault-1",
        attemptId: "attempt-1",
        category: "prohibited-turn",
        severity: "serious",
        title: "Used a prohibited turn",
        routeLegId: "leg-1",
        routeReviewItemId: "review-item-1",
        source: "route-review"
      }
    ],
    hintsUsed: [
      {
        id: "hint-1",
        exerciseId: exercise.id,
        level: "nudge",
        title: "Check the sign",
        text: "Look for the turn restriction before choosing the next road.",
        revealsAnswer: false
      }
    ],
    routeAttemptReviewId: "route-review-1"
  };

  assert.equal(exercise.type, "identify-next-safe-turn");
  assert.equal(exercise.routeInstructions[1]?.kind, "turn-left");
  assert.equal(attempt.events[1]?.type, "hint-requested");
  assert.equal(attempt.faults[0]?.source, "route-review");
  assert.ok(HINT_LEVELS.includes(attempt.hintsUsed[0]?.level ?? "none"));
});
