import assert from "node:assert/strict";
import test from "node:test";
import type { MapDefinition, MapRoad, RouteStop } from "../map-engine/index.ts";
import type { ExerciseDifficulty, ExerciseObjective, RouteInstruction } from "./learnerDriverTraining.ts";
import { generateLearnerHint } from "./learnerProgressiveHints.ts";
import { scoreLearnerAttempt, type ScorableLearnerExercise } from "./learnerAttemptScoring.ts";
import type { LearnerRouteValidationSegment } from "./learnerRouteValidation.ts";

type TestRoad = MapRoad & {
  metadata: {
    highway: string;
    rawTags: Record<string, string>;
  };
};

function road(input: {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  name: string;
  distanceMeters?: number;
}): TestRoad {
  return {
    id: input.id,
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    name: input.name,
    distanceMeters: input.distanceMeters ?? 100,
    isOneWay: false,
    metadata: {
      highway: "residential",
      rawTags: {
        highway: "residential"
      }
    }
  };
}

function hintMap(): MapDefinition {
  return {
    id: "phase-7-hint-map",
    name: "Phase 7 hint map",
    nodes: [
      { id: "a", x: 0, y: 0, label: "Start" },
      { id: "b", x: 100, y: 0, label: "Decision Junction" },
      { id: "c", x: 200, y: 0, label: "Checkpoint" },
      { id: "d", x: 300, y: 0, label: "Destination" },
      { id: "x", x: 100, y: 100, label: "Blocked Road" }
    ],
    roads: [
      road({ id: "road-a-b", fromNodeId: "a", toNodeId: "b", name: "Start Road" }),
      road({ id: "road-b-c", fromNodeId: "b", toNodeId: "c", name: "Baker Street" }),
      road({ id: "road-c-d", fromNodeId: "c", toNodeId: "d", name: "Finish Road" }),
      road({ id: "road-b-d", fromNodeId: "b", toNodeId: "x", name: "Blocked Road" })
    ],
    restrictions: [],
    landmarks: []
  };
}

function segment(id: string, roadId: string, fromNodeId: string, toNodeId: string): LearnerRouteValidationSegment {
  return {
    id,
    roadId,
    fromNodeId,
    toNodeId
  };
}

function expectedSegments(): LearnerRouteValidationSegment[] {
  return [
    segment("segment-01", "road-a-b", "a", "b"),
    segment("segment-02", "road-b-c", "b", "c"),
    segment("segment-03", "road-c-d", "c", "d")
  ];
}

function checkpoints(): RouteStop[] {
  return [
    { type: "node", nodeId: "a", label: "Start" },
    { type: "node", nodeId: "c", label: "Midpoint checkpoint" },
    { type: "node", nodeId: "d", label: "Destination" }
  ];
}

function objectives(): ExerciseObjective[] {
  return [
    {
      id: "objective-legal-route",
      title: "Choose the legal route",
      category: "route-legality",
      required: true,
      successCriteria: ["Choose the legal road at the junction."],
      linkedFaultCategories: ["no-entry", "one-way-direction", "prohibited-turn", "restricted-road"]
    },
    {
      id: "objective-checkpoints",
      title: "Visit the checkpoint",
      category: "checkpoint-ordering",
      required: true,
      successCriteria: ["Reach the midpoint checkpoint before the destination."],
      linkedFaultCategories: ["missed-checkpoint", "wrong-checkpoint-order"]
    }
  ];
}

function routeInstructions(): RouteInstruction[] {
  return [
    {
      id: "instruction-start",
      sequence: 1,
      kind: "start",
      text: "Start at the first marker.",
      nodeId: "a"
    },
    {
      id: "instruction-turn",
      sequence: 2,
      kind: "turn-left",
      text: "Turn left onto Baker Street.",
      roadName: "Baker Street",
      roadId: "road-b-c",
      nodeId: "b",
      decisionPoint: {
        nodeId: "b",
        allowedRoadIds: ["road-b-c"],
        blockedRoadIds: ["road-b-d"]
      }
    },
    {
      id: "instruction-checkpoint",
      sequence: 3,
      kind: "checkpoint",
      text: "Pass the midpoint checkpoint.",
      nodeId: "c"
    },
    {
      id: "instruction-arrive",
      sequence: 4,
      kind: "arrive",
      text: "Arrive at the destination.",
      nodeId: "d"
    }
  ];
}

function exercise(difficulty: ExerciseDifficulty = "intermediate"): ScorableLearnerExercise {
  return {
    id: `hint-exercise-${difficulty}`,
    title: "Progressive hint exercise",
    type: "choose-legal-route",
    difficulty,
    mapId: "phase-7-hint-map",
    objectives: objectives(),
    routeLegs: [],
    routeInstructions: routeInstructions(),
    published: false,
    expectedRouteSegments: expectedSegments(),
    checkpoints: checkpoints()
  };
}

function perfectAttempt(): LearnerRouteValidationSegment[] {
  return [
    segment("attempt-01", "road-a-b", "a", "b"),
    segment("attempt-02", "road-b-c", "b", "c"),
    segment("attempt-03", "road-c-d", "c", "d")
  ];
}

test("progressive hints increase specificity through the available stages", () => {
  const hintLevels = [
    [],
    ["nudge"],
    ["nudge", "guided"],
    ["nudge", "guided", "guided"],
    ["nudge", "guided", "guided", "worked-example"]
  ] as const;
  const hints = hintLevels.map((previousHintLevels) =>
    generateLearnerHint({
      exercise: exercise(),
      currentNodeId: "b",
      previousHintLevels
    })
  );

  assert.ok(hints.every((result) => result.status === "generated"));
  assert.deepEqual(
    hints.map((result) => result.status === "generated" ? result.hint.specificity : 0),
    [1, 2, 3, 4, 5]
  );
  assert.deepEqual(
    hints.map((result) => result.status === "generated" ? result.hint.stage : "fallback"),
    ["general-nudge", "directional-clue", "road-junction-clue", "specific-next-action", "reveal-answer"]
  );
  assert.equal(hints[4]?.status === "generated" ? hints[4].hint.revealsAnswer : false, true);
});

test("repeated hint requests advance the level and record a deterministic attempt event", () => {
  const first = generateLearnerHint({
    exercise: exercise(),
    currentNodeId: "b",
    attemptId: "attempt-1",
    occurredAt: "2026-07-07T10:00:00.000Z"
  });

  assert.equal(first.status, "generated");

  const second = generateLearnerHint({
    exercise: exercise(),
    currentNodeId: "b",
    hintsAlreadyUsed: first.status === "generated" ? [first.hint] : []
  });

  assert.equal(second.status, "generated");

  if (first.status === "generated" && second.status === "generated") {
    assert.equal(second.hint.specificity, first.hint.specificity + 1);
    assert.equal(first.attemptEvent?.type, "hint-requested");
    assert.equal(first.attemptEvent?.hintId, first.hint.id);
    assert.equal(first.attemptEvent?.hintLevel, first.hint.level);
    assert.equal(first.attemptEvent?.occurredAt, "2026-07-07T10:00:00.000Z");
  }
});

test("generated hint usage affects learner attempt scoring", () => {
  const hint = generateLearnerHint({
    exercise: exercise("beginner"),
    currentNodeId: "b"
  });
  const withoutHint = scoreLearnerAttempt({
    map: hintMap(),
    exercise: exercise("beginner"),
    attemptedRouteSegments: perfectAttempt(),
    attemptId: "without-hint"
  });
  const withHint = scoreLearnerAttempt({
    map: hintMap(),
    exercise: exercise("beginner"),
    attemptedRouteSegments: perfectAttempt(),
    hintsUsed: hint.status === "generated" ? [hint.hint] : [],
    attemptId: "with-hint"
  });

  assert.equal(hint.status, "generated");
  assert.equal(withoutHint.totalScore, 100);
  assert.ok(withHint.totalScore < withoutHint.totalScore);
  assert.equal(withHint.metrics.hintPenalty, 5);
  assert.ok(withHint.minorFaults.some((fault) => fault.title === "Hints used"));
});

test("beginner hints are more direct than advanced hints at the same request count", () => {
  const beginner = generateLearnerHint({
    exercise: exercise("beginner"),
    currentNodeId: "b"
  });
  const advanced = generateLearnerHint({
    exercise: exercise("advanced"),
    currentNodeId: "b"
  });

  assert.equal(beginner.status, "generated");
  assert.equal(advanced.status, "generated");

  if (beginner.status === "generated" && advanced.status === "generated") {
    assert.equal(beginner.hint.stage, "directional-clue");
    assert.equal(advanced.hint.stage, "general-nudge");
    assert.ok(beginner.hint.specificity > advanced.hint.specificity);
    assert.match(beginner.hint.text, /left/);
    assert.doesNotMatch(advanced.hint.text, /left/);
  }
});

test("final hint reveals the correct action and only then exposes blocked-road context", () => {
  const early = generateLearnerHint({
    exercise: exercise("advanced"),
    objectiveId: "objective-legal-route",
    currentNodeId: "b"
  });
  const final = generateLearnerHint({
    exercise: exercise("advanced"),
    objectiveId: "objective-legal-route",
    currentNodeId: "b",
    previousHintLevels: ["nudge", "guided", "guided", "worked-example"]
  });

  assert.equal(early.status, "generated");
  assert.equal(final.status, "generated");

  if (early.status === "generated" && final.status === "generated") {
    assert.equal(final.hint.stage, "reveal-answer");
    assert.equal(final.hint.level, "show-answer");
    assert.equal(final.hint.revealsAnswer, true);
    assert.equal(final.hint.targetRouteSegmentId, "segment-02");
    assert.match(final.hint.text, /Reveal/);
    assert.match(final.hint.text, /road-b-c/);
    assert.match(final.hint.text, /road-b-d/);
    assert.doesNotMatch(early.hint.text, /road-b-d/);
  }
});

test("checkpoint objective hints name the next required checkpoint", () => {
  const hint = generateLearnerHint({
    exercise: exercise("advanced"),
    objectiveId: "objective-checkpoints",
    currentCheckpointIndex: 0,
    previousMistakes: [
      {
        id: "fault-1",
        attemptId: "attempt-1",
        category: "wrong-checkpoint-order",
        severity: "serious",
        title: "Checkpoint visited out of order",
        source: "system"
      }
    ]
  });
  const reveal = generateLearnerHint({
    exercise: exercise("advanced"),
    objectiveId: "objective-checkpoints",
    currentCheckpointIndex: 0,
    previousHintLevels: ["nudge", "guided", "guided", "worked-example"]
  });

  assert.equal(hint.status, "generated");
  assert.equal(reveal.status, "generated");

  if (hint.status === "generated" && reveal.status === "generated") {
    assert.equal(hint.hint.checkpointLabel, "Midpoint checkpoint");
    assert.match(hint.hint.text, /checkpoint/i);
    assert.match(hint.hint.text, /confirm the next checkpoint/i);
    assert.match(reveal.hint.text, /Midpoint checkpoint/);
    assert.equal(reveal.hint.revealsAnswer, true);
  }
});

test("safe fallback is returned when route context is insufficient", () => {
  const result = generateLearnerHint({
    exercise: {
      id: "no-context",
      title: "No route context",
      type: "follow-planned-route",
      difficulty: "beginner",
      mapId: "phase-7-hint-map",
      objectives: objectives(),
      routeLegs: [],
      routeInstructions: [],
      published: false,
      expectedRouteSegments: [],
      checkpoints: []
    },
    currentNodeId: "b"
  });

  assert.equal(result.status, "fallback");
  assert.equal(result.hint, null);
  assert.equal(result.fallback?.reason, "missing-route-context");
  assert.match(result.fallback?.text ?? "", /not enough route context/i);
});
