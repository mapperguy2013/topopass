import assert from "node:assert/strict";
import test from "node:test";
import { buildMapGraph, type MapDefinition, type MapRestriction, type RouteExercise } from "../../../lib/map-engine/index.ts";
import {
  largeLondonOsmRouteExercises,
  largeLondonOsmRouteMap,
  mediumLondonOsmRouteExercises,
  mediumLondonOsmRouteMap,
  realLondonOsmPilotRouteExercises,
  realLondonOsmPilotRouteMap,
  tinyLondonOsmRouteExercises,
  tinyLondonOsmRouteMap
} from "./routeRunnerMaps.ts";
import {
  formatOsmExerciseQaFailure,
  validateOsmRouteExerciseDirectedEdgePath,
  validateOsmRouteExerciseQa,
  validateOsmRouteExerciseQaSuite
} from "./routeRunnerOsmExerciseQa.ts";

test("tiny converted OSM exercises pass the QA harness", () => {
  const suite = validateOsmRouteExerciseQaSuite({
    map: tinyLondonOsmRouteMap,
    exercises: tinyLondonOsmRouteExercises
  });

  assert.equal(suite.isValid, true, suite.failures.map(formatOsmExerciseQaFailure).join("\n"));
  assert.equal(suite.exerciseCount, tinyLondonOsmRouteExercises.length);
  assert.deepEqual(suite.failures, []);

  for (const result of suite.results) {
    assert.ok(result.routeEdgeIds.length > 0, result.exerciseId);
    assert.ok(result.routeNodeIds.length >= 2, result.exerciseId);
    assert.ok(result.routeDistanceMeters && result.routeDistanceMeters > 0, result.exerciseId);
  }
});

test("medium converted OSM exercises pass the QA harness", () => {
  const suite = validateOsmRouteExerciseQaSuite({
    map: mediumLondonOsmRouteMap,
    exercises: mediumLondonOsmRouteExercises
  });

  assert.equal(suite.isValid, true, suite.failures.map(formatOsmExerciseQaFailure).join("\n"));
  assert.equal(suite.exerciseCount, mediumLondonOsmRouteExercises.length);
  assert.deepEqual(suite.failures, []);

  for (const result of suite.results) {
    assert.ok(result.routeEdgeIds.length > 0, result.exerciseId);
    assert.ok(result.routeNodeIds.length >= 2, result.exerciseId);
    assert.ok(result.routeDistanceMeters && result.routeDistanceMeters > 0, result.exerciseId);
  }
});

test("real London OSM pilot exercises pass the QA harness", () => {
  const suite = validateOsmRouteExerciseQaSuite({
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises
  });

  assert.equal(suite.isValid, true, suite.failures.map(formatOsmExerciseQaFailure).join("\n"));
  assert.equal(suite.exerciseCount, realLondonOsmPilotRouteExercises.length);
  assert.deepEqual(suite.failures, []);

  for (const result of suite.results) {
    assert.ok(result.routeEdgeIds.length > 0, result.exerciseId);
    assert.ok(result.routeNodeIds.length >= 2, result.exerciseId);
    assert.ok(result.routeDistanceMeters && result.routeDistanceMeters > 0, result.exerciseId);
  }
});

test("large London OSM exercises pass the QA harness", () => {
  const suite = validateOsmRouteExerciseQaSuite({
    map: largeLondonOsmRouteMap,
    exercises: largeLondonOsmRouteExercises
  });

  assert.equal(suite.isValid, true, suite.failures.map(formatOsmExerciseQaFailure).join("\n"));
  assert.equal(suite.exerciseCount, largeLondonOsmRouteExercises.length);
  assert.deepEqual(suite.failures, []);

  for (const result of suite.results) {
    assert.ok(result.routeEdgeIds.length > 0, result.exerciseId);
    assert.ok(result.routeNodeIds.length >= 2, result.exerciseId);
    assert.ok(result.routeDistanceMeters && result.routeDistanceMeters > 0, result.exerciseId);
  }
});

test("missing OSM exercise destination node fails with a stable reason code", () => {
  const brokenExercise: RouteExercise = {
    id: "osm-qa-missing-node-test",
    title: "Broken missing node test",
    mapId: mediumLondonOsmRouteMap.id,
    stops: [
      { type: "node", nodeId: "osm-node-5001" },
      { type: "node", nodeId: "osm-node-does-not-exist" }
    ]
  };
  const result = validateOsmRouteExerciseQa({
    map: mediumLondonOsmRouteMap,
    exercise: brokenExercise
  });

  assert.equal(result.isValid, false);
  assert.deepEqual(
    result.failures.map((failure) => failure.reason),
    ["missing-destination-node"]
  );
  assert.equal(
    formatOsmExerciseQaFailure(result.failures[0]),
    "missing-destination-node | map=osm-medium-london-prototype | exercise=osm-qa-missing-node-test | node=osm-node-does-not-exist | finish node osm-node-does-not-exist does not exist in osm-medium-london-prototype."
  );
});

test("unreachable converted OSM exercise leg fails with a deterministic diagnostic", () => {
  const reverseOneWayExercise: RouteExercise = {
    id: "osm-qa-unreachable-reverse-one-way-test",
    title: "Broken reverse one-way test",
    mapId: tinyLondonOsmRouteMap.id,
    stops: [
      { type: "node", nodeId: "osm-node-1005" },
      { type: "node", nodeId: "osm-node-1003" }
    ]
  };
  const result = validateOsmRouteExerciseQa({
    map: tinyLondonOsmRouteMap,
    exercise: reverseOneWayExercise
  });

  assert.equal(result.isValid, false);
  assert.deepEqual(
    result.failures.map((failure) => failure.reason),
    ["unreachable-leg"]
  );
  assert.equal(result.failures[0].legIndex, 1);
  assert.equal(result.failures[0].legStartNodeId, "osm-node-1005");
  assert.equal(result.failures[0].legEndNodeId, "osm-node-1003");
});

test("QA directed-edge validation catches a blocked no-entry edge", () => {
  const graph = buildMapGraph(tinyLondonOsmRouteMap);
  const edge = graph.edgesById["osm-way-2001-segment-0:forward"];

  assert.ok(edge);

  const noEntryRestriction: MapRestriction = {
    id: "osm-qa-no-entry-edge",
    type: "no_entry",
    roadId: edge.roadId,
    fromNodeId: edge.fromNodeId,
    toNodeId: edge.toNodeId,
    reason: "QA blocked edge"
  };
  const restrictedMap: MapDefinition = {
    ...tinyLondonOsmRouteMap,
    restrictions: [...tinyLondonOsmRouteMap.restrictions, noEntryRestriction]
  };
  const exercise: RouteExercise = {
    id: "osm-qa-illegal-edge-test",
    title: "Illegal edge test",
    mapId: restrictedMap.id,
    stops: [
      { type: "node", nodeId: edge.fromNodeId },
      { type: "node", nodeId: edge.toNodeId }
    ]
  };
  const result = validateOsmRouteExerciseDirectedEdgePath({
    map: restrictedMap,
    graph,
    exercise,
    edgeIds: [edge.id]
  });

  assert.equal(result.isValid, false);
  assert.deepEqual(
    result.failures.map((failure) => failure.reason),
    ["illegal-directed-edge"]
  );
  assert.equal(result.failures[0].edgeId, edge.id);
  assert.equal(result.failures[0].directedEdgeKey, `${edge.fromNodeId}->${edge.toNodeId}`);
});

test("QA directed-edge validation rejects a one-way reverse edge that is not in the legal graph", () => {
  const graph = buildMapGraph(tinyLondonOsmRouteMap);
  const exercise: RouteExercise = {
    id: "osm-qa-wrong-way-edge-test",
    title: "Wrong-way edge test",
    mapId: tinyLondonOsmRouteMap.id,
    stops: [
      { type: "node", nodeId: "osm-node-1004" },
      { type: "node", nodeId: "osm-node-1003" }
    ]
  };
  const result = validateOsmRouteExerciseDirectedEdgePath({
    map: tinyLondonOsmRouteMap,
    graph,
    exercise,
    edgeIds: ["osm-way-2002-segment-0:reverse"]
  });

  assert.equal(result.isValid, false);
  assert.deepEqual(
    result.failures.map((failure) => failure.reason),
    ["unknown-route-edge"]
  );
  assert.equal(result.failures[0].edgeId, "osm-way-2002-segment-0:reverse");
});

test("QA directed-edge validation catches route geometry outside render bounds", () => {
  const graph = buildMapGraph(tinyLondonOsmRouteMap);
  const exercise = tinyLondonOsmRouteExercises[0];
  const result = validateOsmRouteExerciseDirectedEdgePath({
    map: tinyLondonOsmRouteMap,
    graph,
    exercise,
    edgeIds: ["osm-way-2001-segment-0:forward"],
    renderBounds: {
      minX: 0,
      minY: 0,
      maxX: 1,
      maxY: 1
    }
  });

  assert.equal(result.isValid, false);
  assert.ok(result.failures.some((failure) => failure.reason === "outside-render-bounds"));
});

test("QA diagnostics stay deterministic across repeated suite runs", () => {
  const brokenExercise: RouteExercise = {
    id: "osm-qa-deterministic-reason-test",
    title: "Deterministic reason test",
    mapId: tinyLondonOsmRouteMap.id,
    stops: [
      { type: "node", nodeId: "osm-node-1001" },
      { type: "node", nodeId: "osm-node-missing-checkpoint" },
      { type: "node", nodeId: "osm-node-1005" }
    ]
  };
  const first = validateOsmRouteExerciseQa({
    map: tinyLondonOsmRouteMap,
    exercise: brokenExercise
  });
  const second = validateOsmRouteExerciseQa({
    map: tinyLondonOsmRouteMap,
    exercise: brokenExercise
  });

  assert.deepEqual(first.failures, second.failures);
  assert.deepEqual(
    first.failures.map((failure) => failure.reason),
    ["missing-checkpoint-node"]
  );
});
