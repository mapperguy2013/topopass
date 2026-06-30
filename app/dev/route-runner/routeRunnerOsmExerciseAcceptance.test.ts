import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMapGraph,
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  type MapDefinition,
  type MapGraph,
  type RouteExercise
} from "../../../lib/map-engine/index.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  ROUTE_RUNNER_MAP_OPTIONS,
  getRouteRunnerMapFitBounds,
  getRouteRunnerMapOption,
  mediumLondonOsmRouteExercises,
  mediumLondonOsmRouteMap,
  realLondonOsmPilotRouteExercises,
  realLondonOsmPilotRouteMap,
  tinyLondonOsmRouteExercises,
  tinyLondonOsmRouteMap,
  type RouteRunnerMapBounds
} from "./routeRunnerMaps.ts";
import {
  buildOsmRouteExerciseQaAcceptanceReport,
  buildOsmRouteExerciseQaAcceptanceSuiteReport,
  type OsmExerciseQaAcceptanceReport
} from "./routeRunnerOsmExerciseQa.ts";

const REAL_PILOT_ACCEPTANCE_SUMMARIES = [
  {
    exerciseId: "osm-real-pilot-short-crossing",
    startNodeId: "osm-node-107319",
    destinationNodeId: "osm-node-107320",
    checkpointNodeIds: [],
    checkpointCount: 0,
    hasLegalRoute: true,
    fastestRouteEdgeCount: 9,
    fastestRouteDistanceMeters: 154.16,
    failureReasonCodes: []
  },
  {
    exerciseId: "osm-real-pilot-one-way-detour",
    startNodeId: "osm-node-108034",
    destinationNodeId: "osm-node-108044",
    checkpointNodeIds: [],
    checkpointCount: 0,
    hasLegalRoute: true,
    fastestRouteEdgeCount: 26,
    fastestRouteDistanceMeters: 209.11,
    failureReasonCodes: []
  },
  {
    exerciseId: "osm-real-pilot-checkpoint-route",
    startNodeId: "osm-node-14725979",
    destinationNodeId: "osm-node-108030",
    checkpointNodeIds: ["osm-node-108025"],
    checkpointCount: 1,
    hasLegalRoute: true,
    fastestRouteEdgeCount: 9,
    fastestRouteDistanceMeters: 181.27,
    failureReasonCodes: []
  },
  {
    exerciseId: "osm-real-pilot-longer-route",
    startNodeId: "osm-node-107319",
    destinationNodeId: "osm-node-273194",
    checkpointNodeIds: [],
    checkpointCount: 0,
    hasLegalRoute: true,
    fastestRouteEdgeCount: 50,
    fastestRouteDistanceMeters: 660.84,
    failureReasonCodes: []
  },
  {
    exerciseId: "osm-real-pilot-turn-choice",
    startNodeId: "osm-node-9791489",
    destinationNodeId: "osm-node-107320",
    checkpointNodeIds: [],
    checkpointCount: 0,
    hasLegalRoute: true,
    fastestRouteEdgeCount: 12,
    fastestRouteDistanceMeters: 159.33,
    failureReasonCodes: []
  }
];

test("real London pilot acceptance report locks every exercise against the committed fixture", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const renderBounds = getRouteRunnerMapFitBounds(realLondonOsmPilotRouteMap);
  const suite = buildOsmRouteExerciseQaAcceptanceSuiteReport({
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises,
    graph,
    renderBounds
  });

  assert.equal(suite.isValid, true, suite.failureMessages.join("\n"));
  assert.equal(suite.mapId, "osm-real-london-pilot");
  assert.equal(suite.exerciseCount, 5);
  assert.deepEqual(suite.failureReasonCodes, []);
  assert.deepEqual(suite.failureMessages, []);
  assert.deepEqual(suite.reports.map(stableAcceptanceSummary), REAL_PILOT_ACCEPTANCE_SUMMARIES);

  for (const report of suite.reports) {
    const exercise = realLondonOsmPilotRouteExercises.find((candidate) => candidate.id === report.exerciseId);

    assert.ok(exercise, `Missing locked exercise ${report.exerciseId}`);
    assert.equal(report.mapId, realLondonOsmPilotRouteMap.id, report.exerciseId);
    assert.equal(report.isValid, true, report.failureMessages.join("\n"));
    assert.equal(report.hasLegalRoute, true, report.exerciseId);
    assert.ok(report.fastestRouteEdgeCount > 0, report.exerciseId);
    assert.ok(report.fastestRouteDistanceMeters !== null && report.fastestRouteDistanceMeters > 0, report.exerciseId);
    assertResolvedStopInsideRenderBounds(graph, renderBounds, report.startNodeId, `${report.exerciseId} start`);
    assertResolvedStopInsideRenderBounds(
      graph,
      renderBounds,
      report.destinationNodeId,
      `${report.exerciseId} destination`
    );
    assert.notEqual(report.startNodeId, report.destinationNodeId, report.exerciseId);
    assert.equal(report.checkpointCount, Math.max(0, exercise.stops.length - 2), report.exerciseId);

    for (const [index, checkpointNodeId] of report.checkpointNodeIds.entries()) {
      assertResolvedStopInsideRenderBounds(
        graph,
        renderBounds,
        checkpointNodeId,
        `${report.exerciseId} checkpoint ${index + 1}`
      );
    }
  }

  const realPilotOption = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.equal(realPilotOption?.fixtureName, "realLondonPilotOverpass.json");
  assert.ok(realPilotOption?.sourceOverpassFixture);
});

test("tiny and medium converted OSM exercise acceptance still passes", () => {
  const cases: Array<{ map: MapDefinition; exercises: readonly RouteExercise[] }> = [
    { map: tinyLondonOsmRouteMap, exercises: tinyLondonOsmRouteExercises },
    { map: mediumLondonOsmRouteMap, exercises: mediumLondonOsmRouteExercises }
  ];

  for (const { map, exercises } of cases) {
    const suite = buildOsmRouteExerciseQaAcceptanceSuiteReport({
      map,
      exercises,
      graph: buildMapGraph(map),
      renderBounds: getRouteRunnerMapFitBounds(map)
    });

    assert.equal(suite.isValid, true, suite.failureMessages.join("\n"));
    assert.equal(suite.exerciseCount, exercises.length, map.id);
    assert.deepEqual(suite.failureReasonCodes, [], map.id);

    for (const report of suite.reports) {
      assert.equal(report.hasLegalRoute, true, report.exerciseId);
      assert.ok(report.fastestRouteEdgeCount > 0, report.exerciseId);
      assert.ok(report.fastestRouteDistanceMeters !== null && report.fastestRouteDistanceMeters > 0, report.exerciseId);
    }
  }
});

test("real pilot acceptance pass leaves the Marlowe synthetic default unchanged", () => {
  const defaultOption = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);
  const realPilotOption = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.equal(DEFAULT_ROUTE_RUNNER_MAP_ID, marloweDistrictMap.id);
  assert.notEqual(DEFAULT_ROUTE_RUNNER_MAP_ID, realLondonOsmPilotRouteMap.id);
  assert.equal(ROUTE_RUNNER_MAP_OPTIONS[0]?.id, marloweDistrictMap.id);
  assert.equal(defaultOption?.source, "synthetic-dev");
  assert.equal(defaultOption?.map, marloweDistrictMap);
  assert.equal(defaultOption?.defaultExerciseId, marloweDistrictRouteExercises[0]?.id);
  assert.equal(realPilotOption?.source, "converted-osm");
  assert.equal(realPilotOption?.defaultExerciseId, realLondonOsmPilotRouteExercises[0]?.id);
});

test("real pilot acceptance report emits deterministic failure reason codes", () => {
  const sourceExercise = realLondonOsmPilotRouteExercises[0];
  const start = sourceExercise?.stops[0];

  assert.ok(sourceExercise);
  assert.ok(start && start.type === "node");

  const brokenExercise: RouteExercise = {
    ...sourceExercise,
    id: "osm-real-pilot-acceptance-missing-destination",
    stops: [start, { type: "node", nodeId: "osm-node-does-not-exist" }]
  };
  const report = buildOsmRouteExerciseQaAcceptanceReport({
    map: realLondonOsmPilotRouteMap,
    exercise: brokenExercise,
    graph: buildMapGraph(realLondonOsmPilotRouteMap),
    renderBounds: getRouteRunnerMapFitBounds(realLondonOsmPilotRouteMap)
  });

  assert.equal(report.isValid, false);
  assert.equal(report.hasLegalRoute, false);
  assert.equal(report.fastestRouteEdgeCount, 0);
  assert.equal(report.fastestRouteDistanceMeters, null);
  assert.deepEqual(report.failureReasonCodes, ["missing-destination-node"]);
  assert.deepEqual(report.failureMessages, [
    "missing-destination-node | map=osm-real-london-pilot | exercise=osm-real-pilot-acceptance-missing-destination | node=osm-node-does-not-exist | finish node osm-node-does-not-exist does not exist in osm-real-london-pilot."
  ]);
});

function stableAcceptanceSummary(report: OsmExerciseQaAcceptanceReport) {
  return {
    exerciseId: report.exerciseId,
    startNodeId: report.startNodeId,
    destinationNodeId: report.destinationNodeId,
    checkpointNodeIds: report.checkpointNodeIds,
    checkpointCount: report.checkpointCount,
    hasLegalRoute: report.hasLegalRoute,
    fastestRouteEdgeCount: report.fastestRouteEdgeCount,
    fastestRouteDistanceMeters: roundDistance(report.fastestRouteDistanceMeters),
    failureReasonCodes: report.failureReasonCodes
  };
}

function assertResolvedStopInsideRenderBounds(
  graph: MapGraph,
  renderBounds: RouteRunnerMapBounds,
  nodeId: string | null,
  message: string
): asserts nodeId is string {
  assert.ok(nodeId, `${message} is unresolved`);

  const node = graph.nodesById[nodeId];

  assert.ok(node, `${message} node ${nodeId} is missing from the graph`);
  assert.equal(pointInsideBounds(node, renderBounds), true, `${message} node ${nodeId} is outside render bounds`);
}

function pointInsideBounds(point: { x: number; y: number }, bounds: RouteRunnerMapBounds): boolean {
  return point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY;
}

function roundDistance(distanceMeters: number | null): number | null {
  return distanceMeters === null ? null : Number(distanceMeters.toFixed(2));
}
