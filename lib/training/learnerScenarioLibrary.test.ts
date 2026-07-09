import assert from "node:assert/strict";
import test from "node:test";
import type { MapDefinition, MapRoad, RouteStop } from "../map-engine/index.ts";
import type { ExerciseObjective, RouteInstruction } from "./learnerDriverTraining.ts";
import {
  LEARNER_SCENARIO_TEMPLATES,
  applyLearnerScenarioTemplateToExercise,
  generateLearnerScenarioExercise,
  generateLearnerScenarioHint,
  learnerScenarioHintStylePrompt,
  scoreLearnerScenarioAttempt,
  validateLearnerScenarioLibrary
} from "./learnerScenarioLibrary.ts";
import { validateLearnerRoute, type LearnerRouteValidationSegment } from "./learnerRouteValidation.ts";
import type { ScorableLearnerExercise } from "./learnerAttemptScoring.ts";

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
  junction?: string;
}): TestRoad {
  return {
    id: input.id,
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    distanceMeters: input.distanceMeters ?? 90,
    isOneWay: false,
    name: input.name ?? `Scenario Road ${input.id}`,
    metadata: {
      highway: "residential",
      rawTags: {
        highway: "residential",
        ...(input.junction ? { junction: input.junction } : {})
      }
    }
  };
}

function scenarioFixtureMap(): MapDefinition {
  const nodes = Array.from({ length: 28 }, (_, index) => ({
    id: `n${String(index).padStart(2, "0")}`,
    x: (index % 7) * 110,
    y: Math.floor(index / 7) * 95 + (index % 2) * 10,
    label: `Node ${index}`
  }));
  const lineRoads = Array.from({ length: nodes.length - 1 }, (_, index) =>
    road({
      id: `road-${String(index).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`,
      fromNodeId: nodes[index].id,
      toNodeId: nodes[index + 1].id,
      junction: index === 17 || index === 18 ? "roundabout" : undefined
    })
  );
  const branchRoads = [
    road({ id: "road-04-11", fromNodeId: "n04", toNodeId: "n11", distanceMeters: 160 }),
    road({ id: "road-09-16", fromNodeId: "n09", toNodeId: "n16", distanceMeters: 170 }),
    road({ id: "road-14-21", fromNodeId: "n14", toNodeId: "n21", distanceMeters: 175 }),
    road({ id: "road-10-17", fromNodeId: "n10", toNodeId: "n17", distanceMeters: 155 }),
    road({ id: "road-17-24", fromNodeId: "n17", toNodeId: "n24", distanceMeters: 180 })
  ];

  return {
    id: "phase-7-scenario-fixture",
    name: "Phase 7 scenario fixture",
    nodes,
    roads: [...lineRoads, ...branchRoads],
    restrictions: [],
    landmarks: []
  };
}

function scoringMap(): MapDefinition {
  return {
    id: "phase-7-scenario-scoring-map",
    name: "Phase 7 scenario scoring map",
    nodes: [
      { id: "a", x: 0, y: 0, label: "Start" },
      { id: "b", x: 100, y: 0, label: "Decision Junction" },
      { id: "c", x: 200, y: 0, label: "Checkpoint" },
      { id: "d", x: 300, y: 0, label: "Destination" }
    ],
    roads: [
      road({ id: "road-a-b", fromNodeId: "a", toNodeId: "b", name: "Start Road" }),
      road({ id: "road-b-c", fromNodeId: "b", toNodeId: "c", name: "Checkpoint Road" }),
      road({ id: "road-c-d", fromNodeId: "c", toNodeId: "d", name: "Finish Road" }),
      road({ id: "road-b-d", fromNodeId: "b", toNodeId: "d", name: "Bypass Road", distanceMeters: 180 })
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
      linkedFaultCategories: ["missed-checkpoint", "wrong-checkpoint-order", "wrong-start", "wrong-destination"]
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
      text: "Turn left onto Checkpoint Road.",
      roadName: "Checkpoint Road",
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
      text: "Arrive at the destination.",
      nodeId: "d"
    }
  ];
}

function baseScorableExercise(): ScorableLearnerExercise {
  const map = scoringMap();
  const routeSegments = expectedSegments();

  return {
    id: "phase-7-scenario-scoring-exercise",
    title: "Scenario scoring exercise",
    type: "follow-planned-route",
    difficulty: "intermediate",
    mapId: map.id,
    objectives: objectives(),
    routeLegs: [],
    routeInstructions: routeInstructions(),
    published: false,
    expectedRouteSegments: routeSegments,
    checkpoints: checkpoints(),
    validation: validateLearnerRoute({
      map,
      difficulty: "intermediate",
      routeSegments
    })
  };
}

test("every learner scenario template is valid", () => {
  const validation = validateLearnerScenarioLibrary();

  assert.equal(validation.valid, true, validation.errors.join("\n"));
  assert.equal(validation.errors.length, 0);
});

test("learner scenario templates map to the expected difficulties", () => {
  const expectedDifficulties = {
    "first-route-following-practice": "beginner",
    "simple-left-right-turn-sequence": "easy",
    "roundabout-introduction": "easy",
    "missed-turn-recovery": "intermediate",
    "choose-the-legal-route": "intermediate",
    "junction-planning": "intermediate",
    "one-way-awareness": "intermediate",
    "checkpoint-navigation": "intermediate",
    "route-review-challenge": "advanced",
    "advanced-dense-network-navigation": "advanced",
    "advanced-multi-decision-route": "advanced"
  } as const;

  for (const template of LEARNER_SCENARIO_TEMPLATES) {
    assert.equal(template.targetDifficulty, expectedDifficulties[template.id]);
  }
});

test("every learner scenario can generate or fail gracefully", () => {
  const map = scenarioFixtureMap();

  for (const template of LEARNER_SCENARIO_TEMPLATES) {
    const result = generateLearnerScenarioExercise({
      map,
      scenarioId: template.id,
      seed: `scenario-library-${template.id}`
    });

    assert.equal(result.scenarioTemplate.id, template.id);
    assert.match(result.explanation, new RegExp(template.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

    if (result.status === "failed") {
      assert.equal(result.exercise, null);
      assert.equal(result.validation, null);
      assert.ok(result.reasonCodes.length > 0);
      continue;
    }

    assert.equal(result.exercise.scenarioMetadata.templateId, template.id);
    assert.equal(result.exercise.difficulty, template.targetDifficulty);
    assert.equal(result.exercise.type, template.exerciseType);
    assert.equal(result.validation.valid, true);
    assert.ok(result.exercise.objectives[0].id.startsWith("scenario-objective-"));
    assert.ok(result.exercise.tags?.includes(`scenario-${template.id}`));
  }
});

test("scenario scoring emphasis is reflected in attempt score details", () => {
  const result = scoreLearnerScenarioAttempt({
    map: scoringMap(),
    exercise: baseScorableExercise(),
    scenarioId: "checkpoint-navigation",
    attemptedRouteSegments: [
      segment("attempt-1", "road-a-b", "a", "b"),
      segment("attempt-2", "road-b-d", "b", "d")
    ],
    attemptId: "scenario-missed-checkpoint"
  });
  const checkpointDetail = result.scenarioScoringDetails.find(
    (detail) => detail.emphasis === "checkpoint-ordering"
  );

  assert.ok(checkpointDetail);
  assert.equal(checkpointDetail.achieved, false);
  assert.ok(checkpointDetail.faultIds.length > 0);
  assert.ok(result.faults.some((fault) => fault.category === "missed-checkpoint"));
  assert.equal(
    result.attemptScore.objectiveResults.find(
      (objective) => objective.objectiveId === "scenario-objective-checkpoint-navigation"
    )?.achieved,
    false
  );
});

test("scenario hint style is reflected in hint output", () => {
  const template = LEARNER_SCENARIO_TEMPLATES.find((candidate) => candidate.id === "missed-turn-recovery");

  assert.ok(template);

  const exercise = applyLearnerScenarioTemplateToExercise(baseScorableExercise(), template);
  const result = generateLearnerScenarioHint({
    exercise,
    scenarioTemplate: template,
    currentNodeId: "b",
    attemptId: "scenario-hint-attempt",
    occurredAt: "2026-07-07T12:00:00.000Z"
  });

  assert.equal(result.status, "generated");

  if (result.status === "generated") {
    assert.equal(result.scenarioTemplate.hintStyle, "recovery-coaching");
    assert.match(result.hint.title, /Missed-turn recovery/);
    assert.ok(result.hint.text.startsWith(learnerScenarioHintStylePrompt("recovery-coaching")));
    assert.match(result.hint.text, /Recovery plan/);
    assert.equal(result.attemptEvent?.type, "hint-requested");
    assert.equal(result.attemptEvent?.type === "hint-requested" ? result.attemptEvent.hintId : null, result.hint.id);
  }
});
