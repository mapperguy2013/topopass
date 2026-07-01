import assert from "node:assert/strict";
import test from "node:test";
import { buildMapGraph, type RouteExercise } from "../../../lib/map-engine/index.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  getRouteRunnerMapOption,
  largeLondonOsmRouteExercises,
  largeLondonOsmRouteMap,
  mediumLondonOsmRouteExercises,
  mediumLondonOsmRouteMap,
  realLondonOsmPilotRouteExercises,
  realLondonOsmPilotRouteMap,
  tinyLondonOsmRouteExercises,
  tinyLondonOsmRouteMap
} from "./routeRunnerMaps.ts";
import { buildOsmQaStatusPanelModel } from "./routeRunnerOsmQaStatus.ts";

test("OSM QA status panel data is generated for the tiny converted OSM map", () => {
  const graph = buildMapGraph(tinyLondonOsmRouteMap);
  const model = buildOsmQaStatusPanelModel({
    map: tinyLondonOsmRouteMap,
    graph,
    exercises: tinyLondonOsmRouteExercises,
    selectedExercise: tinyLondonOsmRouteExercises[0],
    enabled: true,
    isConvertedOsmMap: true
  });

  assert.ok(model);
  assert.equal(model.mapId, tinyLondonOsmRouteMap.id);
  assert.equal(model.mapName, "Tiny London OSM Prototype");
  assert.equal(model.nodeCount, tinyLondonOsmRouteMap.nodes.length);
  assert.equal(model.directedEdgeCount, graph.edges.length);
  assert.equal(model.exerciseCount, tinyLondonOsmRouteExercises.length);
  assert.equal(model.qaState, "pass");
  assert.equal(model.failedExerciseCount, 0);
  assert.deepEqual(model.failureMessages, []);
  assert.equal(model.selectedExercise?.qaState, "pass");
  assert.ok(model.selectedExercise?.checks.every((check) => check.state === "pass"));
});

test("OSM QA status panel data is generated for the medium converted OSM map", () => {
  const graph = buildMapGraph(mediumLondonOsmRouteMap);
  const model = buildOsmQaStatusPanelModel({
    map: mediumLondonOsmRouteMap,
    graph,
    exercises: mediumLondonOsmRouteExercises,
    selectedExercise: mediumLondonOsmRouteExercises[0],
    enabled: true,
    isConvertedOsmMap: true
  });

  assert.ok(model);
  assert.equal(model.mapId, mediumLondonOsmRouteMap.id);
  assert.equal(model.mapName, "Medium London OSM Prototype");
  assert.equal(model.nodeCount, 25);
  assert.equal(model.directedEdgeCount, 76);
  assert.equal(model.exerciseCount, 5);
  assert.equal(model.qaState, "pass");
  assert.equal(model.passedExerciseCount, 5);
  assert.equal(model.failedExerciseCount, 0);
  assert.equal(model.selectedExercise?.id, "osm-medium-euston-crossing");
});

test("valid OSM selected exercise shows individual pass checks", () => {
  const graph = buildMapGraph(mediumLondonOsmRouteMap);
  const model = buildOsmQaStatusPanelModel({
    map: mediumLondonOsmRouteMap,
    graph,
    exercises: mediumLondonOsmRouteExercises,
    selectedExercise: mediumLondonOsmRouteExercises[2],
    enabled: true,
    isConvertedOsmMap: true
  });

  assert.ok(model?.selectedExercise);
  assert.equal(model.selectedExercise.id, "osm-medium-bloomsbury-checkpoint");
  assert.deepEqual(
    model.selectedExercise.checks.map((check) => [check.id, check.state]),
    [
      ["stop-nodes", "pass"],
      ["ordered-leg-reachability", "pass"],
      ["fastest-route", "pass"],
      ["directed-edge-legality", "pass"],
      ["render-bounds", "pass"]
    ]
  );
  assert.ok(model.selectedExercise.routeEdgeCount > 0);
  assert.ok(model.selectedExercise.routeDistanceMeters && model.selectedExercise.routeDistanceMeters > 0);
});

test("OSM QA status panel data is generated for the real London pilot map", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const model = buildOsmQaStatusPanelModel({
    map: realLondonOsmPilotRouteMap,
    graph,
    exercises: realLondonOsmPilotRouteExercises,
    selectedExercise: realLondonOsmPilotRouteExercises[1],
    enabled: true,
    isConvertedOsmMap: true
  });

  assert.ok(model);
  assert.equal(model.mapId, realLondonOsmPilotRouteMap.id);
  assert.equal(model.mapName, "Real London pilot map");
  assert.equal(model.nodeCount, 390);
  assert.equal(model.directedEdgeCount, 588);
  assert.equal(model.exerciseCount, realLondonOsmPilotRouteExercises.length);
  assert.equal(model.qaState, "pass");
  assert.equal(model.passedExerciseCount, realLondonOsmPilotRouteExercises.length);
  assert.equal(model.failedExerciseCount, 0);
  assert.equal(model.selectedExercise?.id, "osm-real-pilot-one-way-detour");
  assert.ok(model.selectedExercise?.checks.every((check) => check.state === "pass"));
});

test("OSM QA status panel data is generated for the large London OSM map", () => {
  const graph = buildMapGraph(largeLondonOsmRouteMap);
  const model = buildOsmQaStatusPanelModel({
    map: largeLondonOsmRouteMap,
    graph,
    exercises: largeLondonOsmRouteExercises,
    selectedExercise: largeLondonOsmRouteExercises[2],
    enabled: true,
    isConvertedOsmMap: true
  });

  assert.ok(model);
  assert.equal(model.mapId, largeLondonOsmRouteMap.id);
  assert.equal(model.mapName, "OSM Large London");
  assert.equal(model.nodeCount, 63);
  assert.equal(model.directedEdgeCount, 202);
  assert.equal(model.exerciseCount, 5);
  assert.equal(model.qaState, "pass");
  assert.equal(model.passedExerciseCount, 5);
  assert.equal(model.failedExerciseCount, 0);
  assert.equal(model.selectedExercise?.id, "osm-large-checkpoint-route");
  assert.ok(model.selectedExercise?.checks.every((check) => check.state === "pass"));
});

test("invalid OSM exercise surfaces deterministic QA failure text", () => {
  const graph = buildMapGraph(mediumLondonOsmRouteMap);
  const brokenExercise: RouteExercise = {
    id: "osm-status-missing-destination",
    title: "Broken status missing destination",
    mapId: mediumLondonOsmRouteMap.id,
    stops: [
      { type: "node", nodeId: "osm-node-5001" },
      { type: "node", nodeId: "osm-node-missing" }
    ]
  };
  const model = buildOsmQaStatusPanelModel({
    map: mediumLondonOsmRouteMap,
    graph,
    exercises: [brokenExercise],
    selectedExercise: brokenExercise,
    enabled: true,
    isConvertedOsmMap: true
  });

  assert.ok(model?.selectedExercise);
  assert.equal(model.qaState, "fail");
  assert.equal(model.failedExerciseCount, 1);
  assert.equal(model.selectedExercise.qaState, "fail");
  assert.deepEqual(
    model.selectedExercise.checks.map((check) => [check.id, check.state]),
    [
      ["stop-nodes", "fail"],
      ["ordered-leg-reachability", "pass"],
      ["fastest-route", "fail"],
      ["directed-edge-legality", "pass"],
      ["render-bounds", "pass"]
    ]
  );
  assert.equal(
    model.selectedExercise.failureMessages[0],
    "missing-destination-node | map=osm-medium-london-prototype | exercise=osm-status-missing-destination | node=osm-node-missing | finish node osm-node-missing does not exist in osm-medium-london-prototype."
  );
});

test("OSM QA status panel model is not generated when QA mode is disabled", () => {
  const model = buildOsmQaStatusPanelModel({
    map: tinyLondonOsmRouteMap,
    graph: buildMapGraph(tinyLondonOsmRouteMap),
    exercises: tinyLondonOsmRouteExercises,
    selectedExercise: tinyLondonOsmRouteExercises[0],
    enabled: false,
    isConvertedOsmMap: true
  });

  assert.equal(model, null);
});

test("synthetic maps do not receive OSM QA status panel metadata", () => {
  const syntheticOption = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);

  assert.ok(syntheticOption);

  const model = buildOsmQaStatusPanelModel({
    map: syntheticOption.map,
    graph: buildMapGraph(syntheticOption.map),
    exercises: syntheticOption.exercises,
    selectedExercise: syntheticOption.exercises[0],
    enabled: true,
    isConvertedOsmMap: false
  });

  assert.equal(model, null);
});
