import assert from "node:assert/strict";
import test from "node:test";
import {
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  type MapDefinition,
  type RouteExercise
} from "../../../lib/map-engine/index.ts";
import {
  INVALID_EXERCISE_ROUTE_MESSAGE,
  formatExerciseAvailabilityOptionLabel,
  validateExerciseReachability,
  validateExerciseReachabilityList
} from "./exerciseValidation.ts";
import { buildFastestRouteOverlay, createHiddenFastestRouteRevealState, toggleFastestRouteReveal } from "./fastestRouteOverlay.ts";

test("exercise with legal start-to-finish route is valid", () => {
  const availability = validateExerciseReachability({
    map: linearMap(),
    exercise: routeExercise("start-finish", ["a", "b"])
  });

  assert.equal(availability.isValid, true);
  assert.equal(availability.reason, null);
  assert.equal(availability.startToFinishAvailable, true);
  assert.equal(availability.shortestRouteDistanceMeters, 100);
  assert.deepEqual(availability.missingLegs, []);
});

test("exercise with legal start-checkpoint-finish route is valid", () => {
  const availability = validateExerciseReachability({
    map: linearMap(),
    exercise: routeExercise("checkpoint", ["a", "b", "c"])
  });

  assert.equal(availability.isValid, true);
  assert.equal(availability.startToCheckpointAvailable, true);
  assert.equal(availability.checkpointToFinishAvailable, true);
  assert.equal(availability.shortestRouteDistanceMeters, 200);
});

test("exercise with no legal route because of no-entry is invalid", () => {
  const map = linearMap({
    restrictions: [
      {
        id: "no-a-to-b",
        type: "no_entry",
        roadId: "ab",
        fromNodeId: "a",
        toNodeId: "b"
      }
    ]
  });
  const availability = validateExerciseReachability({
    map,
    exercise: routeExercise("no-entry", ["a", "b"])
  });

  assert.equal(availability.isValid, false);
  assert.equal(availability.reason, INVALID_EXERCISE_ROUTE_MESSAGE);
  assert.equal(availability.startToFinishAvailable, false);
  assert.deepEqual(
    availability.missingLegs.map((leg) => `${leg.fromNodeId}->${leg.toNodeId}`),
    ["a->b"]
  );
});

test("exercise with no legal route because of one-way direction is invalid", () => {
  const map = linearMap({
    roads: [
      {
        id: "ab",
        fromNodeId: "b",
        toNodeId: "a",
        distanceMeters: 100,
        isOneWay: true,
        name: "One Way Road"
      }
    ]
  });
  const availability = validateExerciseReachability({
    map,
    exercise: routeExercise("wrong-way", ["a", "b"])
  });

  assert.equal(availability.isValid, false);
  assert.equal(availability.reason, INVALID_EXERCISE_ROUTE_MESSAGE);
  assert.equal(availability.startToFinishAvailable, false);
});

test("exercise with no legal route because of prohibited turn is invalid", () => {
  const map = linearMap({
    restrictions: [
      {
        id: "no-ab-bc",
        type: "prohibited_turn",
        fromRoadId: "ab",
        viaNodeId: "b",
        toRoadId: "bc"
      }
    ]
  });
  const availability = validateExerciseReachability({
    map,
    exercise: routeExercise("prohibited-turn", ["a", "b", "c"])
  });

  assert.equal(availability.isValid, false);
  assert.equal(availability.startToCheckpointAvailable, true);
  assert.equal(availability.checkpointToFinishAvailable, true);
  assert.match(availability.errors.join("\n"), /no valid legal route/i);
});

test("exercise with no legal route because of a restricted road is invalid", () => {
  const map = linearMap({
    restrictions: [
      {
        id: "closed-bc",
        type: "road_closed",
        roadId: "bc"
      }
    ]
  });
  const availability = validateExerciseReachability({
    map,
    exercise: routeExercise("closed-road", ["a", "b", "c"])
  });

  assert.equal(availability.isValid, false);
  assert.equal(availability.startToCheckpointAvailable, true);
  assert.equal(availability.checkpointToFinishAvailable, false);
});

test("invalid exercise prevents fastest-route reveal from returning a route", () => {
  const map = linearMap({
    restrictions: [
      {
        id: "no-a-to-b",
        type: "no_entry",
        roadId: "ab",
        fromNodeId: "a",
        toNodeId: "b"
      }
    ]
  });
  const overlay = buildFastestRouteOverlay({
    map,
    exercise: routeExercise("no-entry", ["a", "b"]),
    revealState: toggleFastestRouteReveal(createHiddenFastestRouteRevealState())
  });

  assert.equal(overlay.status, "unavailable");
  assert.equal(overlay.points.length, 0);
  assert.match(overlay.message ?? "", /No legal fastest route/);
});

test("Marlowe invalid exercise is labelled clearly", () => {
  const invalidExercise = marloweDistrictRouteExercises.find(
    (exercise) => exercise.id === "ex-no-entry-eastgate-market"
  );

  assert(invalidExercise);

  const availability = validateExerciseReachability({
    map: marloweDistrictMap,
    exercise: invalidExercise
  });

  assert.equal(availability.isValid, false);
  assert.equal(formatExerciseAvailabilityOptionLabel(invalidExercise, availability), `${invalidExercise.title} (Invalid - no legal route)`);
});

test("switching from invalid to valid exercise clears invalid availability in derived list", () => {
  const [invalidAvailability, validAvailability] = validateExerciseReachabilityList({
    map: marloweDistrictMap,
    exercises: [
      routeExerciseById("ex-no-entry-eastgate-market"),
      routeExerciseById("ex-central-grid-library-clocktower")
    ]
  });

  assert.equal(invalidAvailability.isValid, false);
  assert.equal(validAvailability.isValid, true);
  assert.equal(validAvailability.reason, null);
});

function routeExerciseById(exerciseId: string): RouteExercise {
  const exercise = marloweDistrictRouteExercises.find((candidate) => candidate.id === exerciseId);

  if (!exercise) {
    throw new Error(`Expected exercise ${exerciseId}`);
  }

  return exercise;
}

function routeExercise(id: string, nodeIds: readonly string[]): RouteExercise {
  return {
    id,
    title: id,
    mapId: "test-map",
    stops: nodeIds.map((nodeId) => ({
      type: "node",
      nodeId
    }))
  };
}

function linearMap(overrides: Partial<MapDefinition> = {}): MapDefinition {
  return {
    id: "test-map",
    name: "Test Map",
    nodes: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 100, y: 0 },
      { id: "c", x: 200, y: 0 }
    ],
    roads: [
      {
        id: "ab",
        fromNodeId: "a",
        toNodeId: "b",
        distanceMeters: 100,
        isOneWay: false,
        name: "A B Road"
      },
      {
        id: "bc",
        fromNodeId: "b",
        toNodeId: "c",
        distanceMeters: 100,
        isOneWay: false,
        name: "B C Road"
      }
    ],
    restrictions: [],
    landmarks: [],
    ...overrides
  };
}
