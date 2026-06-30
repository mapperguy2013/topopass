import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMapGraph,
  findShortestLegalRouteThroughStops,
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  validateMapDefinition,
  validateRouteExercise,
  type RouteExercise,
  type RouteStop
} from "../../../lib/map-engine/index.ts";
import {
  MARLOWE_DISTRICT_EXERCISE_METADATA,
  MARLOWE_DISTRICT_METADATA_CATALOGUE,
  getExerciseMetadata,
  validateExerciseMapMetadata
} from "./exerciseMapMetadata.ts";
import {
  MARLOWE_SYNTHETIC_MAP_BOUNDS,
  REALISTIC_SYNTHETIC_EXERCISE_SCENARIOS,
  getRealisticSyntheticScenarioForExercise
} from "./realisticSyntheticExercises.ts";
import { buildSyntheticBackgroundFeatures } from "./syntheticStreetMapRenderer.ts";

const REQUIRED_SCENARIO_IDS = [
  "central-grid",
  "one-way-heavy",
  "no-entry-heavy",
  "prohibited-turn",
  "restricted-road",
  "checkpoint-order",
  "efficiency-trap",
  "mixed-difficulty"
];

test("Stage 84 synthetic scenario catalogue covers the required exercise types", () => {
  assert.deepEqual(
    REALISTIC_SYNTHETIC_EXERCISE_SCENARIOS.map((scenario) => scenario.id),
    REQUIRED_SCENARIO_IDS
  );

  assert.deepEqual(scenario("central-grid").scenarioTags, [
    "general-planning",
    "no-entry-recognition",
    "one-way-direction"
  ]);
  assert.deepEqual(scenario("one-way-heavy").scenarioTags, ["one-way-direction", "route-continuity"]);
  assert.ok(scenario("no-entry-heavy").scenarioTags.includes("no-entry-recognition"));
  assert.ok(scenario("prohibited-turn").scenarioTags.includes("prohibited-turns"));
  assert.ok(scenario("restricted-road").scenarioTags.includes("restricted-roads"));
  assert.ok(scenario("checkpoint-order").scenarioTags.includes("checkpoints"));
  assert.ok(scenario("checkpoint-order").scenarioTags.includes("route-continuity"));
  assert.ok(scenario("efficiency-trap").scenarioTags.includes("route-efficiency"));
  assert.ok(scenario("mixed-difficulty").scenarioTags.includes("checkpoints"));
  assert.ok(scenario("mixed-difficulty").scenarioTags.includes("restricted-roads"));
});

test("Stage 84 scenario exercise ids are unique and backed by valid route exercises", () => {
  const exerciseIds = REALISTIC_SYNTHETIC_EXERCISE_SCENARIOS.map((scenario) => scenario.exerciseId);
  const exerciseById = new Map(marloweDistrictRouteExercises.map((exercise) => [exercise.id, exercise]));

  assert.equal(new Set(exerciseIds).size, exerciseIds.length);
  assert.deepEqual(validateMapDefinition(marloweDistrictMap), { valid: true, errors: [] });

  for (const exerciseId of exerciseIds) {
    const exercise = exerciseById.get(exerciseId);

    assert(exercise, `${exerciseId} should exist in the Marlowe route exercises`);
    assert.deepEqual(validateRouteExercise(exercise, marloweDistrictMap), { valid: true, errors: [] });
    assert.equal(exercise.mapId, marloweDistrictMap.id);
    assert(exercise.stops.length >= 2, `${exercise.id} should include start and finish stops`);
  }
});

test("Stage 84 checkpoint exercises include ordered intermediate stops", () => {
  assert.equal(intermediateStopCount(routeExercise("ex-checkpoint-order-library-dock")), 3);
  assert.equal(intermediateStopCount(routeExercise("ex-mixed-difficulty-church-market-theatre-dock")), 3);
});

test("Stage 84 exercises have matching metadata and adaptive weak-area tags", () => {
  const validation = validateExerciseMapMetadata({
    maps: MARLOWE_DISTRICT_METADATA_CATALOGUE.maps,
    exercises: MARLOWE_DISTRICT_METADATA_CATALOGUE.exercises,
    routeExercises: marloweDistrictRouteExercises,
    mapDefinitions: [marloweDistrictMap]
  });

  assert.equal(validation.isValid, true);
  assert.deepEqual(validation.issues, []);

  for (const stageScenario of REALISTIC_SYNTHETIC_EXERCISE_SCENARIOS) {
    const metadata = getExerciseMetadata(MARLOWE_DISTRICT_EXERCISE_METADATA, stageScenario.exerciseId);

    assert(metadata, `${stageScenario.exerciseId} should have metadata`);
    assert.equal(metadata.difficulty, stageScenario.difficulty);
    for (const weakAreaTag of stageScenario.weakAreaTags) {
      assert.ok(
        metadata.weakAreaTags.includes(weakAreaTag),
        `${stageScenario.exerciseId} metadata should include weak area ${weakAreaTag}`
      );
    }
  }
});

test("Stage 84 scenario road names and restriction summaries point at fixture concepts", () => {
  const roadNames = new Set(marloweDistrictMap.roads.map((road) => road.name));

  assert.ok(marloweDistrictMap.restrictions.some((restriction) => restriction.type === "no_entry"));
  assert.ok(marloweDistrictMap.restrictions.some((restriction) => restriction.type === "prohibited_turn"));
  assert.ok(marloweDistrictMap.restrictions.some((restriction) => restriction.type === "road_closed"));

  for (const stageScenario of REALISTIC_SYNTHETIC_EXERCISE_SCENARIOS) {
    assert(stageScenario.featuredRoadNames.length > 0, `${stageScenario.id} should identify road names`);
    assert(stageScenario.restrictionSummary.length > 0, `${stageScenario.id} should explain restrictions`);

    for (const roadName of stageScenario.featuredRoadNames) {
      assert(roadNames.has(roadName), `${stageScenario.id} should reference real fixture road ${roadName}`);
    }
  }
});

test("Stage 84 scenario shortest-distance estimates match the current legal route engine", () => {
  const graph = buildMapGraph(marloweDistrictMap);

  for (const stageScenario of REALISTIC_SYNTHETIC_EXERCISE_SCENARIOS) {
    const exercise = routeExercise(stageScenario.exerciseId);
    const nodeIds = exercise.stops.map((stop) => resolveStopNodeId(stop));
    const route = findShortestLegalRouteThroughStops({
      graph,
      stopNodeIds: nodeIds,
      restrictions: marloweDistrictMap.restrictions
    });

    if (stageScenario.estimatedShortestDistanceMeters === undefined) {
      assert.equal(route.found, false, `${stageScenario.id} should be unavailable when no legal route exists`);
      continue;
    }

    assert.equal(route.found, true, `${stageScenario.id} should have a legal route through required stops`);
    assert.equal(route.distanceMeters, stageScenario.estimatedShortestDistanceMeters);
  }
});

test("Stage 84 renderer metadata stays visual-only and uses Marlowe map bounds", () => {
  const backgrounds = buildSyntheticBackgroundFeatures(marloweDistrictMap);

  assert.deepEqual(MARLOWE_SYNTHETIC_MAP_BOUNDS, {
    minX: 0,
    minY: 55,
    maxX: 755,
    maxY: 610
  });
  assert(backgrounds.length > 0);
  assert(backgrounds.every((feature) => feature.routable === false));

  for (const stageScenario of REALISTIC_SYNTHETIC_EXERCISE_SCENARIOS) {
    assert.deepEqual(stageScenario.renderer.mapBounds, MARLOWE_SYNTHETIC_MAP_BOUNDS);
    assert.equal(stageScenario.renderer.routeRunnerRenderer, "synthetic-street-map");
    assert.equal(stageScenario.renderer.visualBackground, "marlowe-district-soft-context");
  }
});

test("Stage 84 scenario lookup returns defensive copies", () => {
  const firstLookup = getRealisticSyntheticScenarioForExercise("ex-central-grid-library-clocktower");
  const secondLookup = getRealisticSyntheticScenarioForExercise("ex-central-grid-library-clocktower");

  assert(firstLookup);
  assert(secondLookup);

  firstLookup.scenarioTags.push("route-efficiency");
  firstLookup.renderer.mapBounds.maxX = 999;

  assert.notDeepEqual(firstLookup.scenarioTags, secondLookup.scenarioTags);
  assert.equal(secondLookup.renderer.mapBounds.maxX, 755);
  assert.equal(getRealisticSyntheticScenarioForExercise("unknown-exercise"), null);
});

function scenario(id: string) {
  const stageScenario = REALISTIC_SYNTHETIC_EXERCISE_SCENARIOS.find((candidate) => candidate.id === id);

  if (!stageScenario) {
    throw new Error(`Expected scenario ${id}`);
  }

  return stageScenario;
}

function routeExercise(exerciseId: string): RouteExercise {
  const exercise = marloweDistrictRouteExercises.find((candidate) => candidate.id === exerciseId);

  if (!exercise) {
    throw new Error(`Expected route exercise ${exerciseId}`);
  }

  return exercise;
}

function intermediateStopCount(exercise: RouteExercise): number {
  return Math.max(0, exercise.stops.length - 2);
}

function resolveStopNodeId(stop: RouteStop): string {
  if (stop.type === "node") {
    return stop.nodeId;
  }

  const landmark = marloweDistrictMap.landmarks.find((candidate) => candidate.id === stop.landmarkId);

  if (!landmark?.nearestNodeId) {
    throw new Error(`Expected landmark ${stop.landmarkId} to have a nearest node`);
  }

  return landmark.nearestNodeId;
}
