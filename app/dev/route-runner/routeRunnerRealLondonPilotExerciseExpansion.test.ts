import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMapGraph,
  findShortestLegalRouteThroughStops,
  marloweDistrictMap,
  type MapGraph,
  type RouteExercise,
  type ShortestLegalRouteThroughStopsResult
} from "../../../lib/map-engine/index.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  mediumLondonOsmRouteExercises,
  mediumLondonOsmRouteMap,
  realLondonOsmPilotRouteExercises,
  realLondonOsmPilotRouteMap,
  tinyLondonOsmRouteExercises,
  tinyLondonOsmRouteMap
} from "./routeRunnerMaps.ts";
import { validateOsmRouteExerciseQaSuite } from "./routeRunnerOsmExerciseQa.ts";

type FoundShortestRoute = Extract<ShortestLegalRouteThroughStopsResult, { found: true }>;

const STAGE_122_EXERCISE_IDS = [
  "osm-real-pilot-store-street-short-hop",
  "osm-real-pilot-gower-to-torrington",
  "osm-real-pilot-goodge-chenies-ridgmount",
  "osm-real-pilot-torrington-byng",
  "osm-real-pilot-south-crescent-ridgmount-multistop",
  "osm-real-pilot-tottenham-to-gower-detour",
  "osm-real-pilot-torrington-reverse-loop",
  "osm-real-pilot-mortimer-goodge-options"
] as const;

test("Stage 122 adds eight real London pilot exercises in stable fixture order", () => {
  assert.equal(realLondonOsmPilotRouteExercises.length, 13);
  assert.deepEqual(
    realLondonOsmPilotRouteExercises.slice(-STAGE_122_EXERCISE_IDS.length).map((exercise) => exercise.id),
    STAGE_122_EXERCISE_IDS
  );
});

test("Stage 122 real London pilot exercises cover the requested route shapes", () => {
  const shortRoute = requireRealPilotExercise("osm-real-pilot-store-street-short-hop");
  const mediumRoute = requireRealPilotExercise("osm-real-pilot-gower-to-torrington");
  const checkpointRoute = requireRealPilotExercise("osm-real-pilot-goodge-chenies-ridgmount");
  const multistopRoute = requireRealPilotExercise("osm-real-pilot-south-crescent-ridgmount-multistop");
  const oneWayRoute = requireRealPilotExercise("osm-real-pilot-torrington-reverse-loop");
  const longerLegalRoute = requireRealPilotExercise("osm-real-pilot-tottenham-to-gower-detour");
  const multipleOptionsRoute = requireRealPilotExercise("osm-real-pilot-mortimer-goodge-options");

  assert.equal(shortRoute.difficulty, "easy");
  assert.equal(shortRoute.stops.length, 2);
  assert.equal(mediumRoute.difficulty, "medium");
  assert.equal(mediumRoute.stops.length, 2);
  assert.equal(checkpointRoute.stops.length, 3);
  assert.deepEqual(nodeStopIds(checkpointRoute), ["osm-node-107319", "osm-node-108025", "osm-node-108030"]);
  assert.equal(multistopRoute.stops.length, 4);
  assert.deepEqual(nodeStopIds(multistopRoute), [
    "osm-node-25472045",
    "osm-node-25472056",
    "osm-node-10845640242",
    "osm-node-108030"
  ]);
  assert.match(oneWayRoute.description ?? "", /without reversing one-way segments/);
  assert.match(longerLegalRoute.description ?? "", /one-way detour/);
  assert.match(multipleOptionsRoute.description ?? "", /plausible route choices/);
});

test("Stage 122 real London pilot exercises are legal through every required stop", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);

  for (const exerciseId of STAGE_122_EXERCISE_IDS) {
    const exercise = requireRealPilotExercise(exerciseId);
    const route = findApprovedRoute(graph, exercise);

    assert.deepEqual(route.stopNodeIds, nodeStopIds(exercise), exercise.id);
    assert.ok(route.edgeIds.length > 0, exercise.id);
    assert.ok(route.distanceMeters > 0, exercise.id);
  }
});

test("Stage 122 reverse one-way exercise is longer than the legal forward direction", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const forwardRoute = findApprovedRoute(graph, requireRealPilotExercise("osm-real-pilot-one-way-detour"));
  const reverseRoute = findApprovedRoute(graph, requireRealPilotExercise("osm-real-pilot-torrington-reverse-loop"));

  assert.ok(reverseRoute.edgeIds.length > forwardRoute.edgeIds.length, `${reverseRoute.edgeIds.length}`);
  assert.ok(reverseRoute.distanceMeters > forwardRoute.distanceMeters * 2, `${reverseRoute.distanceMeters}`);
});

test("expanded real London pilot exercise set passes deterministic QA as a suite", () => {
  const suite = validateOsmRouteExerciseQaSuite({
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises,
    graph: buildMapGraph(realLondonOsmPilotRouteMap)
  });

  assert.equal(suite.exerciseCount, realLondonOsmPilotRouteExercises.length);
  assert.equal(suite.isValid, true, suite.failures.map((failure) => failure.message).join("\n"));
  assert.deepEqual(suite.failures, []);
});

test("Stage 122 leaves Marlowe and tiny/medium OSM guardrails unchanged", () => {
  assert.equal(DEFAULT_ROUTE_RUNNER_MAP_ID, marloweDistrictMap.id);
  assert.notEqual(DEFAULT_ROUTE_RUNNER_MAP_ID, realLondonOsmPilotRouteMap.id);

  for (const { map, exercises } of [
    { map: tinyLondonOsmRouteMap, exercises: tinyLondonOsmRouteExercises },
    { map: mediumLondonOsmRouteMap, exercises: mediumLondonOsmRouteExercises }
  ]) {
    const suite = validateOsmRouteExerciseQaSuite({
      map,
      exercises,
      graph: buildMapGraph(map)
    });

    assert.equal(suite.exerciseCount, exercises.length, map.id);
    assert.equal(suite.isValid, true, suite.failures.map((failure) => failure.message).join("\n"));
  }
});

function requireRealPilotExercise(id: string): RouteExercise {
  const exercise = realLondonOsmPilotRouteExercises.find((candidate) => candidate.id === id);

  assert.ok(exercise, `Missing real London pilot exercise ${id}`);

  return exercise;
}

function findApprovedRoute(graph: MapGraph, exercise: RouteExercise): FoundShortestRoute {
  const route = findShortestLegalRouteThroughStops({
    graph,
    stopNodeIds: nodeStopIds(exercise),
    restrictions: realLondonOsmPilotRouteMap.restrictions
  });

  assert.equal(route.found, true, exercise.id);

  return route;
}

function nodeStopIds(exercise: RouteExercise): string[] {
  return exercise.stops.map((stop, index) => {
    assert.equal(stop.type, "node", `${exercise.id} stop ${index + 1} must be a node stop`);

    return stop.nodeId;
  });
}
