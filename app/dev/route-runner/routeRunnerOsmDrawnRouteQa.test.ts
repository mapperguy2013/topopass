import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMapGraph,
  createDrawnRouteTrace,
  findShortestLegalRouteThroughStops,
  marloweDistrictMap,
  type MapGraph,
  type MapRoad,
  type RouteExercise
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
import { buildOsmRouteExerciseQaAcceptanceSuiteReport } from "./routeRunnerOsmExerciseQa.ts";
import {
  buildOsmDrawnRouteQaReport,
  buildOsmDrawnRouteQaSuiteReport,
  stableOsmDrawnRouteQaReportSummary,
  type OsmDrawnRouteQaReport
} from "./routeRunnerOsmDrawnRouteQa.ts";

test("all real London pilot exercises pass end-to-end drawn-route QA", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const suite = buildOsmDrawnRouteQaSuiteReport({
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises,
    graph
  });

  assert.equal(suite.isValid, true, suite.failureMessages.join("\n"));
  assert.equal(suite.mapId, "osm-real-london-pilot");
  assert.equal(suite.exerciseCount, 5);
  assert.deepEqual(suite.failureReasonCodes, []);
  assert.deepEqual(suite.failureMessages, []);

  for (const report of suite.reports) {
    assertValidDrawnRouteReport(report);
  }
});

test("generated real pilot drawn attempts contain route geometry and match legal route edges", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);

  for (const exercise of realLondonOsmPilotRouteExercises) {
    const expectedRoute = findApprovedRoute(graph, exercise);
    const report = buildOsmDrawnRouteQaReport({
      map: realLondonOsmPilotRouteMap,
      exercises: realLondonOsmPilotRouteExercises,
      exerciseId: exercise.id,
      graph
    });

    assert.equal(report.isValid, true, report.failureMessages.join("\n"));
    assert.equal(report.drawnPointCount, expectedRoute.edgeIds.length * 3, exercise.id);
    assert.deepEqual(report.expectedRouteEdgeIds, expectedRoute.edgeIds, exercise.id);
    assert.deepEqual(report.matchedDirectedEdgeIds, expectedRoute.edgeIds, exercise.id);
    assert.deepEqual(report.matchedRoadIds, expectedRoute.roadIds, exercise.id);
    assert.deepEqual(report.matchedNodeIds, expectedRoute.nodeIds, exercise.id);
  }
});

test("real pilot drawn-route QA respects ordered checkpoints and keeps valid illegal highlights empty", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const exercise = realLondonOsmPilotRouteExercises.find(
    (candidate) => candidate.id === "osm-real-pilot-checkpoint-route"
  );

  assert.ok(exercise);

  const report = buildOsmDrawnRouteQaReport({
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises,
    exerciseId: exercise.id,
    graph
  });
  const checkpointIndex = report.matchedNodeIds.indexOf("osm-node-108025");
  const destinationIndex = report.matchedNodeIds.indexOf("osm-node-108030");

  assert.equal(report.isValid, true, report.failureMessages.join("\n"));
  assert.ok(checkpointIndex > 0, report.matchedNodeIds.join(" > "));
  assert.ok(destinationIndex > checkpointIndex, report.matchedNodeIds.join(" > "));
  assert.deepEqual(report.illegalMovementTypes, []);
  assert.deepEqual(report.illegalHighlightIds, []);
  assert.deepEqual(report.illegalHighlightKinds, []);
});

test("empty real pilot drawn route fails deterministically", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const report = buildOsmDrawnRouteQaReport({
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises,
    exerciseId: realLondonOsmPilotRouteExercises[0].id,
    graph,
    drawnTrace: createDrawnRouteTrace(),
    expectAccepted: false
  });

  assert.equal(report.isValid, false);
  assert.deepEqual(report.failureReasonCodes, ["drawn-route-empty"]);
  assert.equal(report.pipelineStatus, "empty");
  assert.equal(report.reviewStatus, "pending");
  assert.equal(report.scorePassed, null);
});

test("unknown real pilot drawn-route edge fails deterministically", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const report = buildOsmDrawnRouteQaReport({
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises,
    exerciseId: realLondonOsmPilotRouteExercises[0].id,
    graph,
    routeEdgeIds: ["osm-stage-118-missing-edge"],
    expectAccepted: false
  });

  assert.equal(report.isValid, false);
  assert.deepEqual(report.failureReasonCodes, ["unknown-route-edge"]);
  assert.equal(report.pipelineStatus, null);
  assert.ok(report.failureMessages[0].includes("unknownEdges=osm-stage-118-missing-edge"));
});

test("reversed one-way real pilot drawn route fails with illegal directed-edge QA", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const oneWayRoad = findOneWayRoad(realLondonOsmPilotRouteMap.roads);
  const report = buildOsmDrawnRouteQaReport({
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises,
    exerciseId: realLondonOsmPilotRouteExercises[0].id,
    graph,
    drawnTrace: buildReverseRoadTrace(graph, oneWayRoad),
    expectAccepted: false
  });

  assert.equal(report.isValid, false);
  assert.ok(report.failureReasonCodes.includes("illegal-directed-edge"), report.failureMessages.join("\n"));
  assert.equal(report.pipelineStatus, "scored");
  assert.equal(report.reviewStatus, "fail");
  assert.equal(report.scorePassed, false);
  assert.ok(report.illegalMovementTypes.includes("wrong_way_one_way"), report.illegalMovementTypes.join(","));
  assert.ok(report.illegalHighlightKinds.includes("one-way-wrong-direction"), report.illegalHighlightKinds.join(","));
});

test("real pilot drawn-route QA reports are deterministic across repeated runs", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const firstReports = realLondonOsmPilotRouteExercises.map((exercise) =>
    stableOsmDrawnRouteQaReportSummary(
      buildOsmDrawnRouteQaReport({
        map: realLondonOsmPilotRouteMap,
        exercises: realLondonOsmPilotRouteExercises,
        exerciseId: exercise.id,
        graph,
        verifyDeterministicReview: true
      })
    )
  );
  const secondReports = realLondonOsmPilotRouteExercises.map((exercise) =>
    stableOsmDrawnRouteQaReportSummary(
      buildOsmDrawnRouteQaReport({
        map: realLondonOsmPilotRouteMap,
        exercises: realLondonOsmPilotRouteExercises,
        exerciseId: exercise.id,
        graph,
        verifyDeterministicReview: true
      })
    )
  );

  assert.deepEqual(secondReports, firstReports);
});

test("tiny and medium OSM exercise QA still passes with drawn-route QA present", () => {
  const cases = [
    { map: tinyLondonOsmRouteMap, exercises: tinyLondonOsmRouteExercises },
    { map: mediumLondonOsmRouteMap, exercises: mediumLondonOsmRouteExercises }
  ];

  for (const { map, exercises } of cases) {
    const suite = buildOsmRouteExerciseQaAcceptanceSuiteReport({
      map,
      exercises,
      graph: buildMapGraph(map)
    });

    assert.equal(suite.isValid, true, suite.failureMessages.join("\n"));
    assert.deepEqual(suite.failureReasonCodes, [], map.id);
  }
});

test("drawn-route QA leaves Marlowe as the default synthetic route-runner map", () => {
  assert.equal(DEFAULT_ROUTE_RUNNER_MAP_ID, marloweDistrictMap.id);
  assert.notEqual(DEFAULT_ROUTE_RUNNER_MAP_ID, realLondonOsmPilotRouteMap.id);
});

function assertValidDrawnRouteReport(report: OsmDrawnRouteQaReport): void {
  assert.equal(report.isValid, true, report.failureMessages.join("\n"));
  assert.deepEqual(report.failureReasonCodes, [], report.exerciseId);
  assert.ok(report.drawnPointCount > 0, report.exerciseId);
  assert.equal(report.pipelineStatus, "scored", report.exerciseId);
  assert.equal(report.matchingStatus, "matched", report.exerciseId);
  assert.equal(report.reviewStatus, "pass", report.exerciseId);
  assert.equal(report.scorePassed, true, report.exerciseId);
  assert.deepEqual(report.illegalMovementTypes, [], report.exerciseId);
  assert.deepEqual(report.illegalHighlightIds, [], report.exerciseId);
  assert.deepEqual(report.illegalHighlightKinds, [], report.exerciseId);
  assert.deepEqual(report.warningCodes, [], report.exerciseId);
  assert.deepEqual(report.matchedDirectedEdgeIds, report.expectedRouteEdgeIds, report.exerciseId);
}

function findApprovedRoute(graph: MapGraph, exercise: RouteExercise) {
  const route = findShortestLegalRouteThroughStops({
    graph,
    stopNodeIds: exercise.stops.map((stop) => {
      assert.equal(stop.type, "node", `${exercise.id} must use node stops`);

      return stop.nodeId;
    }),
    restrictions: realLondonOsmPilotRouteMap.restrictions
  });

  assert.equal(route.found, true, exercise.id);

  return route;
}

function findOneWayRoad(roads: readonly MapRoad[]): MapRoad {
  const road = [...roads]
    .filter((candidate) => candidate.isOneWay)
    .sort((left, right) => right.distanceMeters - left.distanceMeters)[0];

  assert.ok(road, "Real London pilot should contain a one-way road for Stage 118 QA.");

  return road;
}

function buildReverseRoadTrace(graph: MapGraph, road: MapRoad) {
  const fromNode = graph.nodesById[road.fromNodeId];
  const toNode = graph.nodesById[road.toNodeId];

  assert.ok(fromNode);
  assert.ok(toNode);

  return createDrawnRouteTrace(
    [0.88, 0.5, 0.12].map((ratio) => ({
      x: fromNode.x + (toNode.x - fromNode.x) * ratio,
      y: fromNode.y + (toNode.y - fromNode.y) * ratio
    }))
  );
}
