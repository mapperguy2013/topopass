import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMapGraph,
  findShortestLegalRouteThroughStops,
  marloweDistrictMap,
  marloweDistrictRouteExercises,
  type MapDefinition,
  type MapGraph,
  type MapRoad,
  type RouteExercise,
  type ShortestLegalRouteThroughStopsResult
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
import { buildOsmRouteExerciseQaAcceptanceSuiteReport } from "./routeRunnerOsmExerciseQa.ts";
import {
  validateOsmManualAttemptQa,
  type OSMManualAttemptQaReason,
  type OsmManualAttemptPath,
  type OsmManualAttemptQaReport
} from "./routeRunnerOsmManualAttemptQa.ts";

type FoundShortestRoute = Extract<ShortestLegalRouteThroughStopsResult, { found: true }>;

test("real London pilot manual fastest attempts are accepted for every exercise", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const renderBounds = getRouteRunnerMapFitBounds(realLondonOsmPilotRouteMap);

  for (const exercise of realLondonOsmPilotRouteExercises) {
    const fastestRoute = findApprovedRoute(graph, realLondonOsmPilotRouteMap, exercise);
    const report = validateRealPilotAttempt({
      graph,
      renderBounds,
      exerciseId: exercise.id,
      attempt: {
        edgeIds: fastestRoute.edgeIds
      }
    });

    assert.equal(report.isAccepted, true, report.messages.join("\n"));
    assert.equal(report.feedbackStatus, "pass", exercise.id);
    assert.equal(report.scorePassed, true, exercise.id);
    assert.deepEqual(report.reasonCodes, ["manual-attempt-valid"], exercise.id);
    assert.deepEqual(report.scoringFailureReasons, [], exercise.id);
    assert.deepEqual(report.illegalMovementTypes, [], exercise.id);
    assert.deepEqual(report.selectedNodeIds, fastestRoute.nodeIds, exercise.id);
    assert.deepEqual(report.selectedRoadIds, fastestRoute.roadIds, exercise.id);
    assert.deepEqual(report.selectedDirectedEdgeIds, fastestRoute.edgeIds, exercise.id);
  }
});

test("real London pilot manual blocked one-way movement is rejected", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const blockedRoad = findOneWayRoad(realLondonOsmPilotRouteMap);
  const report = validateRealPilotAttempt({
    graph,
    exerciseId: realLondonOsmPilotRouteExercises[0].id,
    attempt: {
      nodeIds: [blockedRoad.toNodeId, blockedRoad.fromNodeId],
      roadIds: [blockedRoad.id]
    }
  });

  assert.equal(report.isAccepted, false);
  assertReason(report, "manual-attempt-blocked-directed-edge");
  assert.equal(report.scorePassed, false);
  assert.ok(report.illegalMovementTypes.includes("wrong_way_one_way"), report.messages.join("\n"));
  assert.ok(
    report.feedbackItemIds.some((itemId) => itemId.includes("one-way-wrong-direction")),
    report.feedbackItemIds.join("\n")
  );
});

test("real London pilot manual attempt with an unknown edge is rejected deterministically", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const report = validateRealPilotAttempt({
    graph,
    exerciseId: realLondonOsmPilotRouteExercises[0].id,
    attempt: {
      edgeIds: ["osm-edge-stage-117-does-not-exist"]
    }
  });

  assert.equal(report.isAccepted, false);
  assert.equal(report.feedbackStatus, "blocked");
  assert.equal(report.scorePassed, null);
  assert.deepEqual(report.reasonCodes, ["manual-attempt-unknown-edge"]);
  assert.ok(report.messages[0].includes("unknownEdges=osm-edge-stage-117-does-not-exist"));
});

test("real London pilot manual attempt that skips a checkpoint is rejected", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const exercise = realLondonOsmPilotRouteExercises.find(
    (candidate) => candidate.id === "osm-real-pilot-checkpoint-route"
  );

  assert.ok(exercise);

  const fastestRoute = findApprovedRoute(graph, realLondonOsmPilotRouteMap, exercise);
  const report = validateRealPilotAttempt({
    graph,
    exerciseId: exercise.id,
    attempt: {
      edgeIds: fastestRoute.edgeIds.slice(0, -2)
    }
  });

  assert.equal(report.isAccepted, false);
  assertReason(report, "manual-attempt-skipped-checkpoint");
  assert.equal(report.scorePassed, false);
  assert.ok(report.scoringFailureReasons.includes("missed_required_stop"), report.messages.join("\n"));
  assert.ok(report.feedbackItemIds.includes("failure-missed-required-stop"), report.feedbackItemIds.join("\n"));
});

test("real London pilot manual checkpoint order failures get a stable reason code", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const sourceExercise = realLondonOsmPilotRouteExercises.find(
    (candidate) => candidate.id === "osm-real-pilot-longer-route"
  );

  assert.ok(sourceExercise);

  const fastestRoute = findApprovedRoute(graph, realLondonOsmPilotRouteMap, sourceExercise);
  const orderFixtureExercise: RouteExercise = {
    ...sourceExercise,
    id: "osm-real-pilot-stage-117-checkpoint-order-fixture",
    stops: [
      {
        type: "node",
        nodeId: "osm-node-107319",
        label: "Goodge Street west"
      },
      {
        type: "node",
        nodeId: "osm-node-108030",
        label: "Ridgmount Gardens checkpoint"
      },
      {
        type: "node",
        nodeId: "osm-node-108025",
        label: "Chenies Street checkpoint"
      },
      {
        type: "node",
        nodeId: "osm-node-273194",
        label: "Byng Place"
      }
    ]
  };
  const report = validateOsmManualAttemptQa({
    map: realLondonOsmPilotRouteMap,
    exercises: [...realLondonOsmPilotRouteExercises, orderFixtureExercise],
    exerciseId: orderFixtureExercise.id,
    attempt: {
      edgeIds: fastestRoute.edgeIds
    },
    graph,
    renderBounds: getRouteRunnerMapFitBounds(realLondonOsmPilotRouteMap)
  });

  assert.equal(report.isAccepted, false);
  assertReason(report, "manual-attempt-checkpoint-order");
  assert.equal(report.scorePassed, false);
  assert.ok(report.scoringFailureReasons.includes("missed_required_stop"), report.messages.join("\n"));
});

test("real London pilot incomplete manual attempt is rejected", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const exercise = realLondonOsmPilotRouteExercises[0];
  const fastestRoute = findApprovedRoute(graph, realLondonOsmPilotRouteMap, exercise);
  const report = validateRealPilotAttempt({
    graph,
    exerciseId: exercise.id,
    attempt: {
      edgeIds: fastestRoute.edgeIds.slice(0, -1)
    }
  });

  assert.equal(report.isAccepted, false);
  assertReason(report, "manual-attempt-incomplete");
  assert.equal(report.scorePassed, false);
  assert.ok(report.scoringFailureReasons.includes("wrong_destination"), report.messages.join("\n"));
});

test("real London pilot wrong-start manual attempt is rejected", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const exercise = realLondonOsmPilotRouteExercises[0];
  const fastestRoute = findApprovedRoute(graph, realLondonOsmPilotRouteMap, exercise);
  const report = validateRealPilotAttempt({
    graph,
    exerciseId: exercise.id,
    attempt: {
      edgeIds: fastestRoute.edgeIds.slice(1)
    }
  });

  assert.equal(report.isAccepted, false);
  assertReason(report, "manual-attempt-missing-start");
  assert.equal(report.scorePassed, false);
  assert.ok(report.scoringFailureReasons.includes("wrong_start"), report.messages.join("\n"));
  assert.ok(report.feedbackItemIds.includes("failure-wrong-start"), report.feedbackItemIds.join("\n"));
});

test("real London pilot manual attempt outside render bounds is rejected by the QA harness", () => {
  const graph = buildMapGraph(realLondonOsmPilotRouteMap);
  const exercise = realLondonOsmPilotRouteExercises[0];
  const fastestRoute = findApprovedRoute(graph, realLondonOsmPilotRouteMap, exercise);
  const report = validateRealPilotAttempt({
    graph,
    renderBounds: {
      minX: -1,
      minY: -1,
      maxX: -0.5,
      maxY: -0.5
    },
    exerciseId: exercise.id,
    attempt: {
      edgeIds: fastestRoute.edgeIds
    }
  });

  assert.equal(report.isAccepted, false);
  assertReason(report, "manual-attempt-outside-bounds");
  assert.equal(report.scorePassed, true);
  assert.equal(report.feedbackStatus, "pass");
});

test("tiny and medium converted OSM exercise acceptance still passes with manual QA present", () => {
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
  }
});

test("manual attempt QA leaves the Marlowe synthetic default unchanged", () => {
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

function validateRealPilotAttempt(input: {
  graph: MapGraph;
  renderBounds?: RouteRunnerMapBounds;
  exerciseId: string;
  attempt: OsmManualAttemptPath;
}): OsmManualAttemptQaReport {
  return validateOsmManualAttemptQa({
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises,
    exerciseId: input.exerciseId,
    attempt: input.attempt,
    graph: input.graph,
    renderBounds: input.renderBounds ?? getRouteRunnerMapFitBounds(realLondonOsmPilotRouteMap)
  });
}

function findApprovedRoute(
  graph: MapGraph,
  map: MapDefinition,
  exercise: RouteExercise
): FoundShortestRoute {
  const route = findShortestLegalRouteThroughStops({
    graph,
    stopNodeIds: nodeStopIds(exercise),
    restrictions: map.restrictions
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

function findOneWayRoad(map: MapDefinition): MapRoad {
  const road = map.roads.find((candidate) => candidate.isOneWay);

  assert.ok(road, `${map.id} should contain a one-way road for manual-attempt QA`);

  return road;
}

function assertReason(report: OsmManualAttemptQaReport, reason: OSMManualAttemptQaReason): void {
  assert.ok(report.reasonCodes.includes(reason), report.messages.join("\n"));
}
