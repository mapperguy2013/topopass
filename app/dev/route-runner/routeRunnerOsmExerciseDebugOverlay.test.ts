import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBlockedDirectedEdgeKeys,
  buildMapGraph,
  directedEdgeKey,
  validateDirectedEdgePath,
  type DirectedEdge,
  type RouteExercise
} from "../../../lib/map-engine/index.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  getRouteRunnerMapOption,
  realLondonOsmPilotRouteExercises,
  realLondonOsmPilotRouteMap
} from "./routeRunnerMaps.ts";
import realLondonPilotOverpassFixture from "../../../lib/map-engine/osm/fixtures/realLondonPilotOverpass.json" with { type: "json" };
import {
  buildOsmExerciseDebugOverlayModel,
  canOfferOsmExerciseDebugOverlay,
  createDefaultOsmExerciseDebugOverlayState
} from "./routeRunnerOsmExerciseDebugOverlay.ts";

test("OSM exercise debug overlay state is off by default", () => {
  assert.deepEqual(createDefaultOsmExerciseDebugOverlayState(), {
    visible: false
  });
});

test("OSM exercise debug overlay is only offered for converted OSM maps", () => {
  const syntheticOption = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);
  const realPilotOption = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.ok(syntheticOption);
  assert.ok(realPilotOption);
  assert.equal(canOfferOsmExerciseDebugOverlay(syntheticOption.source), false);
  assert.equal(canOfferOsmExerciseDebugOverlay(realPilotOption.source), true);
});

test("real London pilot exercises expose visual QA overlay data", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);

  for (const exercise of realLondonOsmPilotRouteExercises) {
    const model = buildOsmExerciseDebugOverlayModel({
      map: realLondonOsmPilotRouteMap,
      graph,
      exercise,
      enabled: true,
      isConvertedOsmMap: true,
      sourceOverpassFixture: realLondonPilotOverpassFixture
    });

    assert.ok(model, exercise.id);
    assert.equal(model.visible, true);
    assert.equal(model.mapId, "osm-real-london-pilot");
    assert.equal(model.exerciseId, exercise.id);
    assert.equal(model.exerciseTitle, exercise.title);
    assert.equal(model.qa.status, "pass", model.qa.failureMessages.join("\n"));
    assert.equal(model.stopMarkers.length, exercise.stops.length);
    assert.equal(model.route.status, "found");
    assert.ok(model.route.segmentCount > 0, exercise.id);
    assert.ok(model.route.points.length >= 2, exercise.id);
    assert.ok(model.route.distanceMeters && model.route.distanceMeters > 0, exercise.id);
  }
});

test("checkpoint overlay markers are labelled and resolved in route order", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const exercise = realLondonOsmPilotRouteExercises.find(
    (candidate) => candidate.id === "osm-real-pilot-checkpoint-route"
  );

  assert.ok(exercise);

  const model = buildOsmExerciseDebugOverlayModel({
    map: realLondonOsmPilotRouteMap,
    graph,
    exercise,
    enabled: true,
    isConvertedOsmMap: true,
    sourceOverpassFixture: realLondonPilotOverpassFixture
  });

  assert.ok(model);
  assert.deepEqual(
    model.stopMarkers.map((marker) => [marker.role, marker.label, marker.nodeId, marker.resolved]),
    [
      ["start", "Start", "osm-node-14725979", true],
      ["checkpoint", "CP 1", "osm-node-108025", true],
      ["finish", "Finish", "osm-node-108030", true]
    ]
  );
  assert.deepEqual(model.metadata.checkpointNodeIds, ["osm-node-108025"]);
  assert.equal(model.metadata.startNodeId, "osm-node-14725979");
  assert.equal(model.metadata.destinationNodeId, "osm-node-108030");
});

test("overlay fastest route is legal and avoids blocked directed edges", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const model = buildOsmExerciseDebugOverlayModel({
    map: realLondonOsmPilotRouteMap,
    graph,
    exercise: realLondonOsmPilotRouteExercises[1],
    enabled: true,
    isConvertedOsmMap: true,
    sourceOverpassFixture: realLondonPilotOverpassFixture
  });

  assert.ok(model);

  const validation = validateDirectedEdgePath({
    graph,
    edgeIds: model.route.edgeIds,
    restrictions: realLondonOsmPilotRouteMap.restrictions
  });
  const blockedEdgeKeys = buildBlockedDirectedEdgeKeys(graph, realLondonOsmPilotRouteMap.restrictions);

  assert.equal(validation.valid, true);
  assert.equal(model.qa.hasBlockedRouteEdges, false);
  assert.deepEqual(model.qa.blockedRouteDirectedEdgeKeys, []);

  for (const edgeId of model.route.edgeIds) {
    const edge = graph.edgesById[edgeId];

    assert.ok(edge);
    assert.equal(blockedEdgeKeys.has(directedEdgeKey(edge)), false, edgeId);
  }
});

test("blocked and no-entry conflicts are surfaced as debug-only visuals", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const model = buildOsmExerciseDebugOverlayModel({
    map: realLondonOsmPilotRouteMap,
    graph,
    exercise: realLondonOsmPilotRouteExercises[3],
    enabled: true,
    isConvertedOsmMap: true,
    sourceOverpassFixture: realLondonPilotOverpassFixture
  });

  assert.ok(model);
  assert.ok(model.blockedEdges.length > 0);
  assert.equal(model.metadata.blockedEdgeCount, model.blockedEdges.length);
  assert.equal(model.blockedEdges.every((edge) => edge.points.length === 2), true);
  assert.equal(model.blockedEdges.every((edge) => edge.usedByRoute === false), true);
  assert.equal(model.qa.hasBlockedRouteEdges, false);
  assert.deepEqual(
    [...new Set(model.blockedEdges.map((edge) => edge.osmWayId))].sort(),
    ["58987876", "779180492"]
  );
  assert.ok(model.blockedEdges.some((edge) => edge.restrictionType === "blocked_access"));
});

test("invalid selected exercises still produce deterministic failure metadata", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const brokenExercise: RouteExercise = {
    id: "osm-overlay-missing-destination",
    title: "Overlay missing destination",
    mapId: realLondonOsmPilotRouteMap.id,
    stops: [
      { type: "node", nodeId: "osm-node-107319" },
      { type: "node", nodeId: "osm-node-missing-destination" }
    ]
  };
  const model = buildOsmExerciseDebugOverlayModel({
    map: realLondonOsmPilotRouteMap,
    graph,
    exercise: brokenExercise,
    enabled: true,
    isConvertedOsmMap: true,
    sourceOverpassFixture: realLondonPilotOverpassFixture
  });

  assert.ok(model);
  assert.equal(model.qa.status, "fail");
  assert.deepEqual(model.qa.failureReasons, ["missing-destination-node"]);
  assert.equal(model.route.status, "missing");
  assert.equal(model.stopMarkers[1].resolved, false);
  assert.equal(
    model.qa.failureMessages[0],
    "missing-destination-node | map=osm-real-london-pilot | exercise=osm-overlay-missing-destination | node=osm-node-missing-destination | finish node osm-node-missing-destination does not exist in osm-real-london-pilot."
  );
});

test("overlay helper does not mutate map, graph, or exercise inputs", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const exercise = realLondonOsmPilotRouteExercises[2];
  const mapNodesBefore = JSON.stringify(realLondonOsmPilotRouteMap.nodes);
  const mapRoadsBefore = JSON.stringify(realLondonOsmPilotRouteMap.roads);
  const graphEdgesBefore = graph.edges.map((edge: DirectedEdge) => ({ ...edge }));
  const exerciseBefore = JSON.stringify(exercise);

  buildOsmExerciseDebugOverlayModel({
    map: realLondonOsmPilotRouteMap,
    graph,
    exercise,
    enabled: true,
    isConvertedOsmMap: true,
    sourceOverpassFixture: realLondonPilotOverpassFixture
  });

  assert.equal(JSON.stringify(realLondonOsmPilotRouteMap.nodes), mapNodesBefore);
  assert.equal(JSON.stringify(realLondonOsmPilotRouteMap.roads), mapRoadsBefore);
  assert.deepEqual(graph.edges, graphEdgesBefore);
  assert.equal(JSON.stringify(exercise), exerciseBefore);
});

test("overlay model is not generated when disabled or for the synthetic default map", () => {
  const syntheticOption = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const disabledModel = buildOsmExerciseDebugOverlayModel({
    map: realLondonOsmPilotRouteMap,
    graph,
    exercise: realLondonOsmPilotRouteExercises[0],
    enabled: false,
    isConvertedOsmMap: true
  });

  assert.ok(syntheticOption);
  assert.equal(disabledModel, null);
  assert.equal(DEFAULT_ROUTE_RUNNER_MAP_ID, syntheticOption.map.id);
  assert.equal(
    buildOsmExerciseDebugOverlayModel({
      map: syntheticOption.map,
      graph: buildMapGraph(syntheticOption.map),
      exercise: syntheticOption.exercises[0],
      enabled: true,
      isConvertedOsmMap: false
    }),
    null
  );
});
