import assert from "node:assert/strict";
import test from "node:test";
import type { MapDefinition, MapRoad, RouteStop } from "../map-engine/index.ts";
import {
  buildLearnerTrainingProgressState,
  generateLearnerAttemptFeedback,
  generateLearnerExercise,
  generateLearnerHint,
  scoreLearnerAttempt,
  validateLearnerRoute,
  type DrivingFaultCategory,
  type DrivingFaultSeverity,
  type ExerciseObjective,
  type HintLevel,
  type LearnerRouteValidationSegment,
  type LearnerTrainingAttemptProgressRecord,
  type LearnerTrainingProgressFaultRecord,
  type RouteInstruction,
  type ScorableLearnerExercise
} from "./index.ts";

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
  name?: string;
  isOneWay?: boolean;
  access?: string;
  highway?: string;
}): TestRoad {
  const highway = input.highway ?? (input.access === "private" ? "service" : "residential");

  return {
    id: input.id,
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    distanceMeters: input.distanceMeters ?? 100,
    isOneWay: input.isOneWay ?? false,
    name: input.name ?? input.id,
    metadata: {
      highway,
      rawTags: {
        highway,
        ...(input.access ? { access: input.access } : {}),
        ...(input.isOneWay ? { oneway: "yes" } : {})
      }
    }
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

function legalConstraintMap(): MapDefinition {
  return {
    id: "phase-7-regression-legal-map",
    name: "Phase 7 regression legal map",
    nodes: [
      { id: "a", x: 0, y: 0, label: "Start" },
      { id: "b", x: 100, y: 0, label: "Decision Junction" },
      { id: "c", x: 200, y: 0, label: "Checkpoint" },
      { id: "d", x: 300, y: 0, label: "Destination" },
      { id: "x", x: 100, y: 100, label: "Wrong Turn Recovery" },
      { id: "p", x: 160, y: -90, label: "Private Road" },
      { id: "o", x: 200, y: 100, label: "One-way Entry" },
      { id: "t", x: 100, y: -120, label: "Turn Restricted Road" }
    ],
    roads: [
      road({ id: "road-a-b", fromNodeId: "a", toNodeId: "b", name: "Alpha Street" }),
      road({ id: "road-b-c", fromNodeId: "b", toNodeId: "c", name: "Beacon Street" }),
      road({ id: "road-c-d", fromNodeId: "c", toNodeId: "d", name: "Carter Street" }),
      road({ id: "road-b-x", fromNodeId: "b", toNodeId: "x", name: "Wrong Turn Road", distanceMeters: 130 }),
      road({ id: "road-x-c", fromNodeId: "x", toNodeId: "c", name: "Recovery Road", distanceMeters: 130 }),
      road({ id: "road-b-p-private", fromNodeId: "b", toNodeId: "p", name: "Private Service Road", access: "private" }),
      road({ id: "road-p-c", fromNodeId: "p", toNodeId: "c", name: "Private Exit Road" }),
      road({ id: "road-c-o-one-way", fromNodeId: "c", toNodeId: "o", name: "One-way Street", isOneWay: true }),
      road({ id: "road-b-t", fromNodeId: "b", toNodeId: "t", name: "Banned Turn Road" })
    ],
    restrictions: [
      {
        id: "no-turn-ab-bt",
        type: "prohibited_turn",
        fromRoadId: "road-a-b",
        viaNodeId: "b",
        toRoadId: "road-b-t",
        reason: "No turn from Alpha Street to Banned Turn Road"
      }
    ],
    landmarks: []
  };
}

function plannedSegments(): LearnerRouteValidationSegment[] {
  return [
    segment("planned-1", "road-a-b", "a", "b"),
    segment("planned-2", "road-b-c", "b", "c"),
    segment("planned-3", "road-c-d", "c", "d")
  ];
}

function recoveryAttemptSegments(): LearnerRouteValidationSegment[] {
  return [
    segment("attempt-1", "road-a-b", "a", "b"),
    segment("attempt-2", "road-b-x", "b", "x"),
    segment("attempt-3", "road-x-c", "x", "c"),
    segment("attempt-4", "road-c-d", "c", "d")
  ];
}

function illegalAttemptSegments(): LearnerRouteValidationSegment[] {
  return [
    segment("attempt-1", "road-a-b", "a", "b"),
    segment("attempt-2", "road-b-p-private", "b", "p"),
    segment("attempt-3", "road-p-c", "p", "c"),
    segment("attempt-4", "road-c-d", "c", "d")
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
      title: "Follow the planned route",
      category: "map-reading",
      required: true,
      successCriteria: ["Stay on the planned route from start to destination."],
      linkedFaultCategories: ["unsafe-junction-decision", "route-drawing"]
    },
    {
      id: "objective-legal-route",
      title: "Keep the route legal",
      category: "route-legality",
      required: true,
      successCriteria: ["Avoid mapped one-way, turn-restriction, and private-road faults."],
      linkedFaultCategories: ["one-way-direction", "prohibited-turn", "restricted-road"]
    },
    {
      id: "objective-checkpoint-order",
      title: "Visit the checkpoint",
      category: "checkpoint-ordering",
      required: true,
      successCriteria: ["Visit the checkpoint before the destination."],
      linkedFaultCategories: ["missed-checkpoint", "wrong-start", "wrong-destination"]
    }
  ];
}

function routeInstructions(): RouteInstruction[] {
  return [
    {
      id: "instruction-start",
      sequence: 1,
      kind: "start",
      text: "Start at Alpha Street.",
      nodeId: "a"
    },
    {
      id: "instruction-turn",
      sequence: 2,
      kind: "turn-right",
      text: "Turn right onto Beacon Street.",
      roadName: "Beacon Street",
      roadId: "road-b-c",
      nodeId: "b"
    },
    {
      id: "instruction-checkpoint",
      sequence: 3,
      kind: "checkpoint",
      text: "Pass the checkpoint.",
      nodeId: "c"
    },
    {
      id: "instruction-arrive",
      sequence: 4,
      kind: "arrive",
      text: "Finish at the destination.",
      nodeId: "d"
    }
  ];
}

function scorableExercise(): ScorableLearnerExercise {
  const map = legalConstraintMap();
  const expectedRouteSegments = plannedSegments();

  return {
    id: "phase-7-regression-scorable-exercise",
    title: "Phase 7 regression route",
    type: "follow-planned-route",
    difficulty: "beginner",
    mapId: map.id,
    objectives: objectives(),
    routeLegs: [],
    routeInstructions: routeInstructions(),
    published: false,
    expectedRouteSegments,
    checkpoints: checkpoints(),
    estimatedMinutes: 4,
    validation: validateLearnerRoute({
      map,
      difficulty: "beginner",
      routeSegments: expectedRouteSegments
    })
  };
}

function denseGenerationMap(): MapDefinition {
  const nodes = Array.from({ length: 24 }, (_, index) => ({
    id: `n${String(index).padStart(2, "0")}`,
    x: (index % 8) * 90,
    y: Math.floor(index / 8) * 90 + (index % 2) * 12,
    label: `Node ${index}`
  }));
  const lineRoads = Array.from({ length: nodes.length - 1 }, (_, index) =>
    road({
      id: `road-${String(index).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`,
      fromNodeId: nodes[index].id,
      toNodeId: nodes[index + 1].id,
      distanceMeters: 110
    })
  );
  const connectorRoads = [
    road({ id: "road-02-10", fromNodeId: "n02", toNodeId: "n10", distanceMeters: 140 }),
    road({ id: "road-05-13", fromNodeId: "n05", toNodeId: "n13", distanceMeters: 140 }),
    road({ id: "road-10-18", fromNodeId: "n10", toNodeId: "n18", distanceMeters: 150 }),
    road({ id: "road-13-21", fromNodeId: "n13", toNodeId: "n21", distanceMeters: 150 })
  ];

  return {
    id: "phase-7-regression-generation-map",
    name: "Phase 7 regression generation map",
    nodes,
    roads: [...lineRoads, ...connectorRoads],
    restrictions: [],
    landmarks: []
  };
}

function faultRecord(
  category: DrivingFaultCategory,
  severity: DrivingFaultSeverity = "minor",
  blocking = false
): LearnerTrainingProgressFaultRecord {
  return {
    id: `${category}-${severity}-fault`,
    category,
    severity,
    title: category.replaceAll("-", " "),
    blocking
  };
}

function progressAttempt(input: {
  id: string;
  scorePercent: number;
  difficulty?: "beginner" | "easy" | "intermediate" | "advanced";
  hintCount?: number;
  highestHintLevel?: HintLevel;
  faults?: LearnerTrainingProgressFaultRecord[];
  completedAt: string;
}): LearnerTrainingAttemptProgressRecord {
  const faults = input.faults ?? [];

  return {
    id: input.id,
    exerciseId: `exercise-${input.id}`,
    exerciseTitle: `Exercise ${input.id}`,
    mapId: "phase-7-regression-progress-map",
    exerciseType: "follow-planned-route",
    difficulty: input.difficulty ?? "beginner",
    attemptedAt: input.completedAt,
    completedAt: input.completedAt,
    status: faults.some((fault) => fault.blocking) ? "blocked" : input.scorePercent >= 70 ? "passed" : "failed",
    scorePercent: input.scorePercent,
    passed: input.scorePercent >= 70 && !faults.some((fault) => fault.blocking),
    completed: true,
    hintCount: input.hintCount ?? 0,
    highestHintLevel: input.highestHintLevel ?? "none",
    hintPenalty: (input.hintCount ?? 0) * 5,
    seriousFaultCount: faults.filter((fault) => fault.severity === "serious").length,
    dangerousFaultCount: faults.filter((fault) => fault.severity === "dangerous").length,
    invalidRouteFaultCount: faults.filter((fault) => fault.blocking || fault.severity === "dangerous").length,
    faultCategories: [...new Set(faults.map((fault) => fault.category))].sort(),
    faults,
    summary: `Attempt ${input.id}`
  };
}

test("Phase 7 validation fixtures cover connected, one-way, turn-restricted, and non-drivable routes", () => {
  const map = legalConstraintMap();
  const connected = validateLearnerRoute({
    map,
    difficulty: "beginner",
    routeSegments: plannedSegments()
  });
  const wrongWay = validateLearnerRoute({
    map,
    difficulty: "beginner",
    routeSegments: [segment("wrong-way-1", "road-c-o-one-way", "o", "c")]
  });
  const prohibitedTurn = validateLearnerRoute({
    map,
    difficulty: "beginner",
    routeSegments: [
      segment("turn-1", "road-a-b", "a", "b"),
      segment("turn-2", "road-b-t", "b", "t")
    ]
  });
  const privateRoad = validateLearnerRoute({
    map,
    difficulty: "beginner",
    routeSegments: illegalAttemptSegments()
  });

  assert.equal(connected.status, "valid");
  assert.equal(connected.valid, true);
  assert.deepEqual(connected.blockingErrors, []);
  assert.equal(wrongWay.valid, false);
  assert.ok(wrongWay.ruleCodes.includes("wrong-way-one-way"));
  assert.equal(prohibitedTurn.valid, false);
  assert.ok(prohibitedTurn.ruleCodes.includes("prohibited-turn"));
  assert.equal(privateRoad.valid, false);
  assert.ok(privateRoad.ruleCodes.includes("non-drivable-segment"));
});

test("Phase 7 exercise generation is seeded and honours beginner and advanced constraints", () => {
  const map = denseGenerationMap();
  const beginner = generateLearnerExercise({
    map,
    difficulty: "beginner",
    exerciseType: "follow-planned-route",
    constraints: {
      minDistanceMeters: 80,
      maxDistanceMeters: 650,
      maxSegmentCount: 5,
      maxTurnCount: 4
    },
    seed: "phase-7-regression-generation"
  });
  const repeatedBeginner = generateLearnerExercise({
    map,
    difficulty: "beginner",
    exerciseType: "follow-planned-route",
    constraints: {
      minDistanceMeters: 80,
      maxDistanceMeters: 650,
      maxSegmentCount: 5,
      maxTurnCount: 4
    },
    seed: "phase-7-regression-generation"
  });
  const advanced = generateLearnerExercise({
    map,
    difficulty: "advanced",
    exerciseType: "route-review-mistake-correction",
    constraints: {
      minDistanceMeters: 600,
      maxDistanceMeters: 5000,
      maxSegmentCount: 22,
      maxTurnCount: 18
    },
    seed: "phase-7-regression-generation"
  });

  assert.ok(beginner.exercise);
  assert.ok(repeatedBeginner.exercise);
  assert.equal(beginner.exercise.id, repeatedBeginner.exercise.id);
  assert.deepEqual(beginner.exercise.expectedRouteSegments, repeatedBeginner.exercise.expectedRouteSegments);
  assert.equal(beginner.validation.valid, true);
  assert.ok(beginner.validation.metrics.routeDistanceMeters <= 650);
  assert.ok(beginner.validation.metrics.segmentCount <= 5);
  assert.ok(advanced.exercise);
  assert.equal(advanced.validation.valid, true);
  assert.ok(advanced.validation.metrics.routeDistanceMeters >= beginner.validation.metrics.routeDistanceMeters);
  assert.ok(advanced.validation.metrics.segmentCount >= beginner.validation.metrics.segmentCount);
});

test("Phase 7 scoring distinguishes recovered wrong turns from illegal blocking segments", () => {
  const map = legalConstraintMap();
  const exercise = scorableExercise();
  const recovered = scoreLearnerAttempt({
    map,
    exercise,
    attemptedRouteSegments: recoveryAttemptSegments(),
    attemptId: "phase-7-recovered"
  });
  const illegal = scoreLearnerAttempt({
    map,
    exercise,
    attemptedRouteSegments: illegalAttemptSegments(),
    attemptId: "phase-7-illegal"
  });

  assert.equal(recovered.status, "passed");
  assert.equal(recovered.seriousFaults.length, 0);
  assert.ok(recovered.minorFaults.some((fault) => fault.category === "unsafe-junction-decision"));
  assert.ok(recovered.routeSegmentAnnotations.some((annotation) => annotation.status === "recovered"));
  assert.equal(illegal.status, "blocked");
  assert.equal(illegal.passed, false);
  assert.ok(illegal.dangerousFaults.some((fault) => fault.category === "restricted-road"));
  assert.ok(illegal.faults.some((fault) => fault.blocking));
  assert.ok(illegal.routeSegmentAnnotations.some((annotation) => annotation.status === "illegal"));
});

test("Phase 7 feedback prioritises serious legal issues and gives concrete learner guidance", () => {
  const map = legalConstraintMap();
  const exercise = scorableExercise();
  const scoring = scoreLearnerAttempt({
    map,
    exercise,
    attemptedRouteSegments: illegalAttemptSegments(),
    hintLevels: ["guided"],
    attemptId: "phase-7-feedback-quality"
  });
  const feedback = generateLearnerAttemptFeedback({
    map,
    exercise,
    scoring
  });
  const firstMessage = feedback.messages[0];

  assert.equal(firstMessage.categoryLabel, "Legal validity");
  assert.equal(firstMessage.severity, "dangerous");
  assert.match(firstMessage.whatHappened, /restricted|non-drivable/i);
  assert.match(firstMessage.whyItMatters, /blocking|validity|private|restricted/i);
  assert.match(firstMessage.improvementSuggestion, /choose|road|segment/i);
  assert.doesNotMatch(firstMessage.improvementSuggestion, /^try again\.?$/i);
  assert.ok(feedback.messages.some((message) => message.categoryLabel === "Hint dependence"));
});

test("Phase 7 hint progression remains deterministic and difficulty-aware", () => {
  const exercise = scorableExercise();
  const beginner = generateLearnerHint({
    exercise,
    currentNodeId: "b"
  });
  const advanced = generateLearnerHint({
    exercise: {
      ...exercise,
      difficulty: "advanced"
    },
    currentNodeId: "b"
  });
  const reveal = generateLearnerHint({
    exercise: {
      ...exercise,
      difficulty: "advanced"
    },
    currentNodeId: "b",
    previousHintLevels: ["nudge", "guided", "guided", "worked-example"]
  });

  assert.equal(beginner.status, "generated");
  assert.equal(advanced.status, "generated");
  assert.equal(reveal.status, "generated");

  if (beginner.status === "generated" && advanced.status === "generated" && reveal.status === "generated") {
    assert.equal(beginner.hint.stage, "directional-clue");
    assert.equal(advanced.hint.stage, "general-nudge");
    assert.ok(beginner.hint.specificity > advanced.hint.specificity);
    assert.equal(reveal.hint.stage, "reveal-answer");
    assert.equal(reveal.hint.revealsAnswer, true);
    assert.equal(reveal.hint.targetRouteSegmentId, "planned-2");
  }
});

test("Phase 7 progress recommends targeted practice before promotion when repeated faults persist", () => {
  const progress = buildLearnerTrainingProgressState({
    learnerId: "phase-7-regression-progress",
    updatedAt: "2026-07-07T13:00:00.000Z",
    attempts: [
      progressAttempt({
        id: "strong-1",
        scorePercent: 90,
        completedAt: "2026-07-07T10:00:00.000Z"
      }),
      progressAttempt({
        id: "fault-1",
        scorePercent: 82,
        faults: [faultRecord("no-entry", "serious", true)],
        completedAt: "2026-07-07T11:00:00.000Z"
      }),
      progressAttempt({
        id: "fault-2",
        scorePercent: 84,
        faults: [faultRecord("no-entry", "serious", true)],
        completedAt: "2026-07-07T12:00:00.000Z"
      })
    ]
  });

  assert.equal(progress.summary.recommendation.kind, "targeted-practice");
  assert.equal(progress.summary.recommendation.targetFaultCategory, "no-entry");
  assert.equal(progress.summary.recommendedNextExerciseType, "choose-legal-route");
  assert.equal(progress.summary.recommendedNextDifficulty, "beginner");
  assert.equal(progress.learnerProgress.difficultyReadiness.easy, false);
});
