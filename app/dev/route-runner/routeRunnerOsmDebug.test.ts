import assert from "node:assert/strict";
import test from "node:test";
import { buildMapGraph } from "../../../lib/map-engine/index.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  getRouteRunnerMapOption,
  mediumLondonOsmRouteExercises,
  mediumLondonOsmRouteMap,
  tinyLondonOsmRouteMap
} from "./routeRunnerMaps.ts";
import {
  buildOsmDebugOverlayModel,
  buildOsmDebugSummary,
  canOfferOsmDebugOverlay,
  createDefaultOsmDebugOverlayState
} from "./routeRunnerOsmDebug.ts";

test("OSM debug overlay state is off by default", () => {
  assert.deepEqual(createDefaultOsmDebugOverlayState(), {
    visible: false,
    showIds: false
  });
});

test("OSM debug overlay is only offered for converted OSM maps", () => {
  const syntheticOption = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);
  const mediumOption = getRouteRunnerMapOption(mediumLondonOsmRouteMap.id);

  assert.ok(syntheticOption);
  assert.ok(mediumOption);
  assert.equal(canOfferOsmDebugOverlay(syntheticOption.source), false);
  assert.equal(canOfferOsmDebugOverlay(mediumOption.source), true);
});

test("medium OSM debug summary is deterministic", () => {
  const graph = buildMapGraph(mediumLondonOsmRouteMap);
  const exercise = mediumLondonOsmRouteExercises[2];
  const summary = buildOsmDebugSummary({
    map: mediumLondonOsmRouteMap,
    graph,
    exercise,
    sourceFixtureName: "mediumLondonOverpass.json"
  });

  assert.equal(summary.mapId, "osm-medium-london-prototype");
  assert.equal(summary.mapName, "Medium London OSM Prototype");
  assert.equal(summary.sourceFixtureName, "mediumLondonOverpass.json");
  assert.equal(summary.nodeCount, 25);
  assert.equal(summary.roadSegmentCount, 48);
  assert.equal(summary.directedEdgeCount, 76);
  assert.equal(summary.oneWayRoadSegmentCount, 20);
  assert.equal(summary.twoWayRoadSegmentCount, 28);
  assert.equal(summary.oneWayDirectedEdgeCount, 20);
  assert.equal(summary.twoWayDirectedEdgeCount, 56);
  assert.equal(summary.selectedExerciseId, "osm-medium-bloomsbury-checkpoint");
  assert.deepEqual(
    summary.stops.map((stop) => [stop.role, stop.nodeId]),
    [
      ["start", "osm-node-5002"],
      ["checkpoint", "osm-node-5023"],
      ["finish", "osm-node-5044"]
    ]
  );
});

test("hidden OSM debug overlay returns summary without visual clutter", () => {
  const graph = buildMapGraph(mediumLondonOsmRouteMap);
  const model = buildOsmDebugOverlayModel({
    map: mediumLondonOsmRouteMap,
    graph,
    exercise: mediumLondonOsmRouteExercises[0],
    state: createDefaultOsmDebugOverlayState()
  });

  assert.equal(model.visible, false);
  assert.equal(model.showIds, false);
  assert.equal(model.summary.nodeCount, 25);
  assert.deepEqual(model.nodes, []);
  assert.deepEqual(model.directedEdges, []);
});

test("visible OSM debug overlay exposes graph nodes and directed edges", () => {
  const graph = buildMapGraph(mediumLondonOsmRouteMap);
  const model = buildOsmDebugOverlayModel({
    map: mediumLondonOsmRouteMap,
    graph,
    exercise: mediumLondonOsmRouteExercises[0],
    state: {
      visible: true,
      showIds: true
    }
  });
  const firstOneWayEdge = model.directedEdges.find((edge) => edge.isOneWayRoad);

  assert.equal(model.visible, true);
  assert.equal(model.showIds, true);
  assert.equal(model.nodes.length, mediumLondonOsmRouteMap.nodes.length);
  assert.equal(model.directedEdges.length, graph.edges.length);
  assert.ok(firstOneWayEdge);
  assert.equal(firstOneWayEdge.points.length, 2);
  assert.notEqual(model.nodes[0].point, mediumLondonOsmRouteMap.nodes[0]);
});

test("tiny and medium converted maps produce different OSM debug summaries", () => {
  const tinySummary = buildOsmDebugSummary({
    map: tinyLondonOsmRouteMap,
    graph: buildMapGraph(tinyLondonOsmRouteMap),
    sourceFixtureName: "tinyLondonOverpass.json"
  });
  const mediumSummary = buildOsmDebugSummary({
    map: mediumLondonOsmRouteMap,
    graph: buildMapGraph(mediumLondonOsmRouteMap),
    sourceFixtureName: "mediumLondonOverpass.json"
  });

  assert.ok(mediumSummary.nodeCount > tinySummary.nodeCount);
  assert.ok(mediumSummary.roadSegmentCount > tinySummary.roadSegmentCount);
  assert.ok(mediumSummary.directedEdgeCount > tinySummary.directedEdgeCount);
});
