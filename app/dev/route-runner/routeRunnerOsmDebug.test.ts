import assert from "node:assert/strict";
import test from "node:test";
import { buildMapGraph } from "../../../lib/map-engine/index.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  getRouteRunnerMapOption,
  largeLondonOsmRouteExercises,
  largeLondonOsmRouteMap,
  mediumLondonOsmRouteExercises,
  mediumLondonOsmRouteMap,
  realLondonOsmPilotRouteExercises,
  realLondonOsmPilotRouteMap,
  tinyLondonOsmRouteMap
} from "./routeRunnerMaps.ts";
import {
  buildOsmDebugOverlayModel,
  buildOsmDebugOverlayStyle,
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
  assert.equal(summary.sourceKind, "osm");
  assert.equal(summary.nodeCount, 25);
  assert.equal(summary.roadSegmentCount, 48);
  assert.equal(summary.directedEdgeCount, 76);
  assert.equal(summary.oneWayRoadSegmentCount, 20);
  assert.equal(summary.twoWayRoadSegmentCount, 28);
  assert.equal(summary.oneWayDirectedEdgeCount, 20);
  assert.equal(summary.twoWayDirectedEdgeCount, 56);
  assert.equal(summary.blockedOsmWayCount, 1);
  assert.deepEqual(summary.blockedOsmWayIds, ["6016"]);
  assert.deepEqual(summary.bounds, {
    minX: -221.603785,
    minY: -200.376,
    maxX: 221.603785,
    maxY: 200.376
  });
  assert.deepEqual(summary.extent, {
    width: 443.20757,
    height: 400.752,
    centerX: 0,
    centerY: 0
  });
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
  assert.equal(model.style.showTwoWayDirectionArrows, false);
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
  assert.equal(model.style.nodeRadius, 3.2);
  assert.equal(model.style.showTwoWayDirectionArrows, false);
  assert.ok(firstOneWayEdge);
  assert.equal(firstOneWayEdge.points.length, 2);
  assert.equal(firstOneWayEdge.osmHighway, "secondary");
  assert.equal(firstOneWayEdge.originalDirection, "forward");
  assert.notEqual(model.nodes[0].point, mediumLondonOsmRouteMap.nodes[0]);
});

test("visible OSM debug overlay exposes reverse imported one-way metadata", () => {
  const model = buildOsmDebugOverlayModel({
    map: mediumLondonOsmRouteMap,
    graph: buildMapGraph(mediumLondonOsmRouteMap),
    state: {
      visible: true,
      showIds: false
    }
  });
  const reverseImportedEdge = model.directedEdges.find(
    (edge) => edge.originalDirection === "reverse" && edge.roadName === "Gower Street"
  );

  assert.ok(reverseImportedEdge);
  assert.equal(reverseImportedEdge.isOneWayRoad, true);
  assert.equal(reverseImportedEdge.roadName, "Gower Street");
  assert.equal(reverseImportedEdge.osmHighway, "secondary");
  assert.equal(reverseImportedEdge.osmWayId, "6004");
});

test("medium OSM debug overlay style keeps graph QA readable without dense two-way arrows", () => {
  const summary = buildOsmDebugSummary({
    map: mediumLondonOsmRouteMap,
    graph: buildMapGraph(mediumLondonOsmRouteMap),
    sourceFixtureName: "mediumLondonOverpass.json"
  });
  const style = buildOsmDebugOverlayStyle(summary);

  assert.equal(style.nodeRadius, 3.2);
  assert.equal(style.nodeInnerRadius, 1.35);
  assert.equal(style.twoWayEdgeAlpha, 0.24);
  assert.equal(style.oneWayEdgeAlpha, 0.68);
  assert.deepEqual(style.twoWayEdgeDash, [3, 5]);
  assert.equal(style.showTwoWayDirectionArrows, false);
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

test("real London OSM pilot debug summary is deterministic", () => {
  const summary = buildOsmDebugSummary({
    map: realLondonOsmPilotRouteMap,
    graph: buildMapGraph(realLondonOsmPilotRouteMap),
    exercise: realLondonOsmPilotRouteExercises[3],
    sourceFixtureName: "realLondonPilotOverpass.json"
  });

  assert.equal(summary.mapId, "real-london-osm-pilot");
  assert.equal(summary.mapName, "Real London OSM Pilot");
  assert.equal(summary.sourceFixtureName, "realLondonPilotOverpass.json");
  assert.equal(summary.sourceKind, "osm");
  assert.equal(summary.nodeCount, 12);
  assert.equal(summary.roadSegmentCount, 20);
  assert.equal(summary.directedEdgeCount, 32);
  assert.equal(summary.oneWayRoadSegmentCount, 8);
  assert.equal(summary.twoWayRoadSegmentCount, 12);
  assert.equal(summary.oneWayDirectedEdgeCount, 8);
  assert.equal(summary.twoWayDirectedEdgeCount, 24);
  assert.equal(summary.blockedOsmWayCount, 1);
  assert.deepEqual(summary.blockedOsmWayIds, ["9111"]);
  assert.equal(summary.selectedExerciseId, "osm-real-one-way-detour");
  assert.deepEqual(
    summary.stops.map((stop) => [stop.role, stop.nodeId]),
    [
      ["start", "osm-node-9006"],
      ["finish", "osm-node-9004"]
    ]
  );
});

test("real London OSM pilot debug overlay exposes reverse one-way and road metadata", () => {
  const model = buildOsmDebugOverlayModel({
    map: realLondonOsmPilotRouteMap,
    graph: buildMapGraph(realLondonOsmPilotRouteMap),
    state: {
      visible: true,
      showIds: false
    }
  });
  const reverseImportedEdge = model.directedEdges.find(
    (edge) => edge.originalDirection === "reverse" && edge.roadName === "Gower Street"
  );
  const tavistockEdge = model.directedEdges.find((edge) => edge.roadName === "Tavistock Place");

  assert.equal(model.visible, true);
  assert.equal(model.nodes.length, 12);
  assert.equal(model.directedEdges.length, 32);
  assert.ok(reverseImportedEdge);
  assert.equal(reverseImportedEdge.roadName, "Gower Street");
  assert.equal(reverseImportedEdge.osmHighway, "secondary");
  assert.equal(reverseImportedEdge.osmWayId, "9102");
  assert.ok(tavistockEdge);
  assert.equal(tavistockEdge.isOneWayRoad, true);
  assert.equal(tavistockEdge.originalDirection, "forward");
});

test("large London OSM debug summary is deterministic", () => {
  const summary = buildOsmDebugSummary({
    map: largeLondonOsmRouteMap,
    graph: buildMapGraph(largeLondonOsmRouteMap),
    exercise: largeLondonOsmRouteExercises[2],
    sourceFixtureName: "largeLondonOverpass.json"
  });

  assert.equal(summary.mapId, "osm-large-london");
  assert.equal(summary.mapName, "OSM Large London");
  assert.equal(summary.sourceFixtureName, "largeLondonOverpass.json");
  assert.equal(summary.sourceKind, "osm");
  assert.equal(summary.nodeCount, 63);
  assert.equal(summary.roadSegmentCount, 122);
  assert.equal(summary.directedEdgeCount, 202);
  assert.equal(summary.oneWayRoadSegmentCount, 42);
  assert.equal(summary.twoWayRoadSegmentCount, 80);
  assert.equal(summary.oneWayDirectedEdgeCount, 42);
  assert.equal(summary.twoWayDirectedEdgeCount, 160);
  assert.equal(summary.blockedOsmWayCount, 1);
  assert.deepEqual(summary.blockedOsmWayIds, ["11022"]);
  assert.deepEqual(summary.bounds, {
    minX: -623.318144,
    minY: -445.28,
    maxX: 623.318144,
    maxY: 445.28
  });
  assert.deepEqual(summary.extent, {
    width: 1246.636288,
    height: 890.56,
    centerX: 0,
    centerY: 0
  });
  assert.equal(summary.selectedExerciseId, "osm-large-checkpoint-route");
  assert.deepEqual(
    summary.stops.map((stop) => [stop.role, stop.nodeId]),
    [
      ["start", "osm-node-10001"],
      ["checkpoint", "osm-node-10044"],
      ["finish", "osm-node-10066"]
    ]
  );
});

test("large London OSM debug overlay exposes reverse one-way and hierarchy metadata", () => {
  const model = buildOsmDebugOverlayModel({
    map: largeLondonOsmRouteMap,
    graph: buildMapGraph(largeLondonOsmRouteMap),
    state: {
      visible: true,
      showIds: false
    }
  });
  const reverseImportedEdge = model.directedEdges.find(
    (edge) => edge.originalDirection === "reverse" && edge.roadName === "Gower Street"
  );
  const tavistockEdge = model.directedEdges.find((edge) => edge.roadName === "Tavistock Place");
  const storeStreetEdge = model.directedEdges.find((edge) => edge.roadName === "Store Street");

  assert.equal(model.visible, true);
  assert.equal(model.nodes.length, 63);
  assert.equal(model.directedEdges.length, 202);
  assert.ok(reverseImportedEdge);
  assert.equal(reverseImportedEdge.roadName, "Gower Street");
  assert.equal(reverseImportedEdge.osmHighway, "secondary");
  assert.equal(reverseImportedEdge.osmWayId, "11010");
  assert.ok(tavistockEdge);
  assert.equal(tavistockEdge.isOneWayRoad, true);
  assert.equal(tavistockEdge.originalDirection, "forward");
  assert.equal(tavistockEdge.osmWayId, "11003");
  assert.ok(storeStreetEdge);
  assert.equal(storeStreetEdge.osmHighway, "service");
});
