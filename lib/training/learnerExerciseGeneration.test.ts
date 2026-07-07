import assert from "node:assert/strict";
import test from "node:test";
import type { MapDefinition, MapRoad } from "../map-engine/index.ts";
import { generateLearnerExercise } from "./learnerExerciseGeneration.ts";
import { validateLearnerRoute } from "./learnerRouteValidation.ts";

type TestRoad = MapRoad & {
  metadata: {
    highway: string;
    rawTags: Record<string, string>;
  };
};

function residentialRoad(input: {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  distanceMeters?: number;
}): TestRoad {
  return {
    id: input.id,
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    distanceMeters: input.distanceMeters ?? 100,
    isOneWay: false,
    name: `Training Road ${input.id}`,
    metadata: {
      highway: "residential",
      rawTags: {
        highway: "residential"
      }
    }
  };
}

function generationFixtureMap(): MapDefinition {
  const nodes = Array.from({ length: 18 }, (_, index) => ({
    id: `n${String(index).padStart(2, "0")}`,
    x: index * 100,
    y: index % 2 === 0 ? 0 : 20,
    label: `Node ${index}`
  }));
  const lineRoads = Array.from({ length: nodes.length - 1 }, (_, index) =>
    residentialRoad({
      id: `road-${String(index).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`,
      fromNodeId: nodes[index].id,
      toNodeId: nodes[index + 1].id
    })
  );
  const branchRoads = [
    residentialRoad({ id: "road-04-branch", fromNodeId: "n04", toNodeId: "branch-a", distanceMeters: 120 }),
    residentialRoad({ id: "road-09-branch", fromNodeId: "n09", toNodeId: "branch-b", distanceMeters: 120 })
  ];

  return {
    id: "phase-7-generation-fixture",
    name: "Phase 7 generation fixture",
    nodes: [
      ...nodes,
      { id: "branch-a", x: 400, y: 180, label: "Branch A" },
      { id: "branch-b", x: 900, y: 180, label: "Branch B" }
    ],
    roads: [...lineRoads, ...branchRoads],
    restrictions: [],
    landmarks: []
  };
}

function sparseMap(): MapDefinition {
  return {
    id: "phase-7-sparse-map",
    name: "Sparse map",
    nodes: [
      { id: "only-a", x: 0, y: 0 },
      { id: "only-b", x: 100, y: 0 }
    ],
    roads: [],
    restrictions: [],
    landmarks: []
  };
}

test("learner exercise generation is deterministic from seed", () => {
  const first = generateLearnerExercise({
    map: generationFixtureMap(),
    difficulty: "intermediate",
    exerciseType: "follow-planned-route",
    seed: "repeatable-seed"
  });
  const second = generateLearnerExercise({
    map: generationFixtureMap(),
    difficulty: "intermediate",
    exerciseType: "follow-planned-route",
    seed: "repeatable-seed"
  });

  assert.equal(first.status, second.status);
  assert.ok(first.exercise);
  assert.ok(second.exercise);
  assert.equal(first.exercise.id, second.exercise.id);
  assert.deepEqual(first.exercise.expectedRouteSegments, second.exercise.expectedRouteSegments);
  assert.deepEqual(first.exercise.routeGeometry, second.exercise.routeGeometry);
  assert.deepEqual(
    first.exercise.routeInstructions.map((instruction) => instruction.text),
    second.exercise.routeInstructions.map((instruction) => instruction.text)
  );
});

test("generated learner route passes the Phase 7 validator", () => {
  const result = generateLearnerExercise({
    map: generationFixtureMap(),
    difficulty: "intermediate",
    exerciseType: "choose-legal-route",
    seed: "validator-seed"
  });

  assert.equal(result.status, "generated");
  assert.ok(result.exercise);
  assert.equal(result.validation.valid, true);

  const validation = validateLearnerRoute({
    map: generationFixtureMap(),
    difficulty: result.exercise.difficulty,
    routeSegments: result.exercise.expectedRouteSegments,
    constraints: result.exercise.generationMetadata.constraints
  });

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.blockingErrors, []);
});

test("beginner route generation is simpler than advanced route generation", () => {
  const map = generationFixtureMap();
  const beginner = generateLearnerExercise({
    map,
    difficulty: "beginner",
    exerciseType: "follow-planned-route",
    seed: "difficulty-comparison"
  });
  const advanced = generateLearnerExercise({
    map,
    difficulty: "advanced",
    exerciseType: "route-review-mistake-correction",
    seed: "difficulty-comparison"
  });

  assert.ok(beginner.exercise);
  assert.ok(advanced.exercise);
  assert.equal(beginner.validation.valid, true);
  assert.equal(advanced.validation.valid, true);
  assert.ok(advanced.validation.metrics.segmentCount > beginner.validation.metrics.segmentCount);
  assert.ok(advanced.validation.metrics.routeDistanceMeters > beginner.validation.metrics.routeDistanceMeters);
});

test("learner exercise generator handles insufficient candidate data gracefully", () => {
  const result = generateLearnerExercise({
    map: sparseMap(),
    difficulty: "beginner",
    exerciseType: "follow-planned-route",
    seed: "sparse"
  });

  assert.equal(result.status, "failed");
  assert.equal(result.exercise, null);
  assert.equal(result.validation, null);
  assert.ok(result.reasonCodes.includes("insufficient-map-data"));
  assert.match(result.explanation, /does not contain enough/);
});

test("generated exercise includes objectives checkpoints instructions and validation metadata", () => {
  const result = generateLearnerExercise({
    map: generationFixtureMap(),
    difficulty: "advanced",
    exerciseType: "practise-junction-decision-making",
    seed: "exercise-shape"
  });

  assert.ok(result.exercise);
  assert.ok(result.exercise.objectives.length >= 3);
  assert.ok(result.exercise.checkpoints.length >= 3);
  assert.ok(result.exercise.routeLegs.length >= 2);
  assert.ok(result.exercise.routeInstructions.length > result.exercise.expectedRouteSegments.length);
  assert.ok(result.exercise.routeGeometry.length >= 2);
  assert.equal(result.exercise.validation.valid, true);
  assert.equal(result.exercise.generationMetadata.seed, "exercise-shape");
  assert.ok(result.exercise.estimatedDifficulty);
});
