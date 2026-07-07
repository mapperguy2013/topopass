import assert from "node:assert/strict";
import test from "node:test";
import type { MapDefinition, MapRoad, RouteStop } from "../map-engine/index.ts";
import type { ExerciseObjective } from "./learnerDriverTraining.ts";
import { scoreLearnerAttempt, type ScorableLearnerExercise } from "./learnerAttemptScoring.ts";
import { validateLearnerRoute, type LearnerRouteValidationSegment } from "./learnerRouteValidation.ts";

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
  distanceMeters?: number;
  access?: string;
}): TestRoad {
  return {
    id: input.id,
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    distanceMeters: input.distanceMeters ?? 100,
    isOneWay: false,
    name: input.id,
    metadata: {
      highway: input.access === "private" ? "service" : "residential",
      rawTags: {
        highway: input.access === "private" ? "service" : "residential",
        ...(input.access ? { access: input.access } : {})
      }
    }
  };
}

function scoringMap(): MapDefinition {
  return {
    id: "phase-7-scoring-map",
    name: "Phase 7 scoring map",
    nodes: [
      { id: "a", x: 0, y: 0, label: "Start" },
      { id: "b", x: 100, y: 0, label: "B" },
      { id: "c", x: 200, y: 0, label: "Checkpoint" },
      { id: "d", x: 300, y: 0, label: "Destination" },
      { id: "e", x: 150, y: 60, label: "Short detour" },
      { id: "l1", x: 100, y: 300, label: "Long detour 1" },
      { id: "l2", x: 200, y: 300, label: "Long detour 2" },
      { id: "p", x: 150, y: -80, label: "Private road" }
    ],
    roads: [
      road({ id: "road-a-b", fromNodeId: "a", toNodeId: "b" }),
      road({ id: "road-b-c", fromNodeId: "b", toNodeId: "c" }),
      road({ id: "road-c-d", fromNodeId: "c", toNodeId: "d" }),
      road({ id: "road-b-e", fromNodeId: "b", toNodeId: "e", distanceMeters: 60 }),
      road({ id: "road-e-c", fromNodeId: "e", toNodeId: "c", distanceMeters: 60 }),
      road({ id: "road-b-d", fromNodeId: "b", toNodeId: "d", distanceMeters: 180 }),
      road({ id: "road-b-l1", fromNodeId: "b", toNodeId: "l1", distanceMeters: 300 }),
      road({ id: "road-l1-l2", fromNodeId: "l1", toNodeId: "l2", distanceMeters: 300 }),
      road({ id: "road-l2-c", fromNodeId: "l2", toNodeId: "c", distanceMeters: 300 }),
      road({ id: "road-b-p-private", fromNodeId: "b", toNodeId: "p", distanceMeters: 80, access: "private" }),
      road({ id: "road-p-c", fromNodeId: "p", toNodeId: "c", distanceMeters: 80 })
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
    segment("expected-1", "road-a-b", "a", "b"),
    segment("expected-2", "road-b-c", "b", "c"),
    segment("expected-3", "road-c-d", "c", "d")
  ];
}

function checkpoints(): RouteStop[] {
  return [
    { type: "node", nodeId: "a", label: "Start" },
    { type: "node", nodeId: "c", label: "Checkpoint" },
    { type: "node", nodeId: "d", label: "Destination" }
  ];
}

function objectives(): ExerciseObjective[] {
  return [
    {
      id: "objective-follow-route",
      title: "Follow the generated route",
      category: "map-reading",
      required: true,
      successCriteria: ["Stay on the generated route."],
      linkedFaultCategories: ["map-reading", "unsafe-junction-decision", "route-drawing"]
    },
    {
      id: "objective-checkpoints",
      title: "Visit checkpoints in order",
      category: "checkpoint-ordering",
      required: true,
      successCriteria: ["Visit all checkpoints in order."],
      linkedFaultCategories: ["missed-checkpoint", "wrong-start", "wrong-destination"]
    },
    {
      id: "objective-legality",
      title: "Keep the route legal",
      category: "route-legality",
      required: true,
      successCriteria: ["Avoid illegal or restricted segments."],
      linkedFaultCategories: ["restricted-road", "no-entry", "one-way-direction", "prohibited-turn"]
    },
    {
      id: "objective-efficiency",
      title: "Avoid unnecessary detours",
      category: "route-efficiency",
      required: false,
      successCriteria: ["Keep the route close to the generated distance."],
      linkedFaultCategories: ["route-efficiency"]
    }
  ];
}

function exercise(): ScorableLearnerExercise {
  const map = scoringMap();
  const routeSegments = expectedSegments();

  return {
    id: "phase-7-scoring-exercise",
    title: "Scoring exercise",
    type: "follow-planned-route",
    difficulty: "beginner",
    mapId: map.id,
    objectives: objectives(),
    routeLegs: [],
    routeInstructions: [],
    published: false,
    expectedRouteSegments: routeSegments,
    checkpoints: checkpoints(),
    validation: validateLearnerRoute({
      map,
      difficulty: "beginner",
      routeSegments
    })
  };
}

function perfectAttempt(): LearnerRouteValidationSegment[] {
  return [
    segment("attempt-1", "road-a-b", "a", "b"),
    segment("attempt-2", "road-b-c", "b", "c"),
    segment("attempt-3", "road-c-d", "c", "d")
  ];
}

test("learner attempt scoring passes a perfect attempt", () => {
  const result = scoreLearnerAttempt({
    map: scoringMap(),
    exercise: exercise(),
    attemptedRouteSegments: perfectAttempt(),
    attemptId: "perfect"
  });

  assert.equal(result.status, "passed");
  assert.equal(result.passed, true);
  assert.equal(result.totalScore, 100);
  assert.deepEqual(result.faults, []);
  assert.equal(result.metrics.routeAdherencePercent, 100);
  assert.ok(result.objectiveScores.every((objective) => objective.achieved));
});

test("learner attempt scoring records a wrong turn and recovered route", () => {
  const result = scoreLearnerAttempt({
    map: scoringMap(),
    exercise: exercise(),
    attemptedRouteSegments: [
      segment("attempt-1", "road-a-b", "a", "b"),
      segment("attempt-2", "road-b-e", "b", "e"),
      segment("attempt-3", "road-e-c", "e", "c"),
      segment("attempt-4", "road-c-d", "c", "d")
    ],
    attemptId: "wrong-turn-recovery"
  });

  assert.equal(result.status, "passed");
  assert.equal(result.completed, true);
  assert.equal(result.seriousFaults.length, 0);
  assert.ok(result.minorFaults.some((fault) => fault.title === "Wrong turn recovered"));
  assert.ok(result.routeSegmentAnnotations.some((annotation) => annotation.status === "recovered"));
  assert.ok(result.totalScore < 100);
});

test("learner attempt scoring fails a missed checkpoint", () => {
  const result = scoreLearnerAttempt({
    map: scoringMap(),
    exercise: exercise(),
    attemptedRouteSegments: [
      segment("attempt-1", "road-a-b", "a", "b"),
      segment("attempt-2", "road-b-d", "b", "d")
    ],
    attemptId: "missed-checkpoint"
  });

  assert.equal(result.status, "failed");
  assert.equal(result.completed, true);
  assert.ok(result.seriousFaults.some((fault) => fault.category === "missed-checkpoint"));
  assert.equal(
    result.objectiveScores.find((objective) => objective.objectiveId === "objective-checkpoints")?.achieved,
    false
  );
});

test("learner attempt scoring blocks an illegal route segment", () => {
  const result = scoreLearnerAttempt({
    map: scoringMap(),
    exercise: exercise(),
    attemptedRouteSegments: [
      segment("attempt-1", "road-a-b", "a", "b"),
      segment("attempt-2", "road-b-p-private", "b", "p"),
      segment("attempt-3", "road-p-c", "p", "c"),
      segment("attempt-4", "road-c-d", "c", "d")
    ],
    attemptId: "illegal"
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.validation.valid, false);
  assert.ok(result.dangerousFaults.some((fault) => fault.category === "restricted-road"));
  assert.ok(result.routeSegmentAnnotations.some((annotation) => annotation.status === "illegal"));
  assert.equal(result.attemptScore.reviewStatus, "blocked");
});

test("learner attempt scoring fails an excessive detour", () => {
  const result = scoreLearnerAttempt({
    map: scoringMap(),
    exercise: exercise(),
    attemptedRouteSegments: [
      segment("attempt-1", "road-a-b", "a", "b"),
      segment("attempt-2", "road-b-l1", "b", "l1"),
      segment("attempt-3", "road-l1-l2", "l1", "l2"),
      segment("attempt-4", "road-l2-c", "l2", "c"),
      segment("attempt-5", "road-c-d", "c", "d")
    ],
    attemptId: "detour"
  });

  assert.equal(result.status, "failed");
  assert.ok(result.seriousFaults.some((fault) => fault.title === "Excessive detour"));
  assert.ok(result.metrics.efficiencyPercent < 50);
});

test("learner attempt scoring applies progressive hint penalty", () => {
  const result = scoreLearnerAttempt({
    map: scoringMap(),
    exercise: exercise(),
    attemptedRouteSegments: perfectAttempt(),
    hintLevels: ["nudge", "guided", "worked-example"],
    attemptId: "hints"
  });

  assert.equal(result.status, "passed");
  assert.equal(result.metrics.hintPenalty, 17);
  assert.equal(result.totalScore, 83);
  assert.ok(result.minorFaults.some((fault) => fault.title === "Hints used"));
});

test("learner attempt scoring marks an incomplete route", () => {
  const result = scoreLearnerAttempt({
    map: scoringMap(),
    exercise: exercise(),
    attemptedRouteSegments: [
      segment("attempt-1", "road-a-b", "a", "b"),
      segment("attempt-2", "road-b-c", "b", "c")
    ],
    attemptId: "incomplete"
  });

  assert.equal(result.status, "incomplete");
  assert.equal(result.completed, false);
  assert.ok(result.seriousFaults.some((fault) => fault.category === "wrong-destination"));
  assert.equal(result.passed, false);
});

test("learner attempt scoring preserves severity ordering across multiple faults", () => {
  const result = scoreLearnerAttempt({
    map: scoringMap(),
    exercise: exercise(),
    attemptedRouteSegments: [
      segment("attempt-1", "road-a-b", "a", "b"),
      segment("attempt-2", "road-b-p-private", "b", "p"),
      segment("attempt-3", "road-b-d", "b", "d")
    ],
    hintLevels: ["nudge"],
    previousFaults: [
      {
        id: "previous-1",
        attemptId: "previous",
        category: "restricted-road",
        severity: "serious",
        title: "Previous restricted road",
        source: "system"
      }
    ],
    attemptId: "severity"
  });

  assert.equal(result.status, "blocked");
  assert.ok(result.dangerousFaults.length > 0);
  assert.ok(result.seriousFaults.length > 0);
  assert.ok(result.minorFaults.length > 0);
  assert.ok(
    result.dangerousFaults.every((fault) =>
      result.faults.findIndex((candidate) => candidate.id === fault.id) >= 0
    )
  );
  assert.ok(result.totalScore < 60);
});
