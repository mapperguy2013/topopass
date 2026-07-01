import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMapGraph,
  findShortestLegalRoute,
  findShortestLegalRouteThroughStops,
  marloweDistrictMap
} from "../../../lib/map-engine/index.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  ROUTE_RUNNER_MAP_OPTIONS,
  getRouteRunnerMapOption,
  realLondonOsmPilotRouteMap,
  tinyLondonOsmRouteMap
} from "./routeRunnerMaps.ts";
import { buildRouteExerciseCandidateReviewReport } from "./routeRunnerExerciseCandidateGenerator.ts";

test("Stage 129 generates deterministic real London pilot candidate review output", () => {
  const option = requireMapOption(realLondonOsmPilotRouteMap.id);
  const firstReport = buildRouteExerciseCandidateReviewReport({ mapOption: option, maxCandidates: 6 });
  const secondReport = buildRouteExerciseCandidateReviewReport({ mapOption: option, maxCandidates: 6 });

  assert.deepEqual(secondReport, firstReport);
  assert.equal(firstReport.mapId, realLondonOsmPilotRouteMap.id);
  assert.equal(firstReport.mapVersion, "1.0.0");
  assert.equal(firstReport.hasReviewableCandidates, true);
  assert.equal(firstReport.acceptedCandidateCount, 6);
  assert.equal(firstReport.acceptedCandidates.length, 6);
  assert.ok(firstReport.totalCandidatesConsidered >= firstReport.acceptedCandidateCount);
  assert.deepEqual(
    firstReport.acceptedCandidates.map((candidate) => candidate.reviewStatus),
    Array.from({ length: 6 }, () => "needs-review")
  );
});

test("Stage 129 candidate IDs and ordering are stable", () => {
  const option = requireMapOption(realLondonOsmPilotRouteMap.id);
  const report = buildRouteExerciseCandidateReviewReport({ mapOption: option, maxCandidates: 4 });
  const repeatedReport = buildRouteExerciseCandidateReviewReport({ mapOption: option, maxCandidates: 4 });

  assert.deepEqual(
    report.acceptedCandidates.map((candidate) => candidate.candidateId),
    repeatedReport.acceptedCandidates.map((candidate) => candidate.candidateId)
  );
  assert.equal(new Set(report.acceptedCandidates.map((candidate) => candidate.candidateId)).size, 4);

  for (const candidate of report.acceptedCandidates) {
    assert.match(candidate.candidateId, /^osm-real-london-pilot-candidate-\d{3}-/);
    assert.equal(candidate.mapId, realLondonOsmPilotRouteMap.id);
    assert.equal(candidate.reviewStatus, "needs-review");
    assert.ok(candidate.reasonCodes.includes("candidate:legal-route"));
  }
});

test("Stage 129 candidates use valid committed map nodes and legal reachable routes", () => {
  const option = requireMapOption(realLondonOsmPilotRouteMap.id);
  const graph = buildMapGraph(option.map);
  const report = buildRouteExerciseCandidateReviewReport({ mapOption: option, maxCandidates: 6 });

  for (const candidate of report.acceptedCandidates) {
    assert.ok(graph.nodesById[candidate.startNodeId], candidate.candidateId);
    assert.ok(graph.nodesById[candidate.destinationNodeId], candidate.candidateId);

    for (const checkpointNodeId of candidate.checkpointNodeIds) {
      assert.ok(graph.nodesById[checkpointNodeId], `${candidate.candidateId}:${checkpointNodeId}`);
    }

    const route =
      candidate.checkpointNodeIds.length > 0
        ? findShortestLegalRouteThroughStops({
            graph,
            stopNodeIds: [candidate.startNodeId, ...candidate.checkpointNodeIds, candidate.destinationNodeId],
            restrictions: option.map.restrictions
          })
        : findShortestLegalRoute({
            graph,
            startNodeId: candidate.startNodeId,
            endNodeId: candidate.destinationNodeId,
            restrictions: option.map.restrictions
          });

    assert.equal(route.found, true, candidate.candidateId);

    if (route.found) {
      assert.equal(candidate.fastestRouteEdgeCount, route.edgeIds.length, candidate.candidateId);
      assert.equal(candidate.estimatedDistanceMeters, Math.round(route.distanceMeters * 100) / 100);
      assert.deepEqual(candidate.routeEdgeIds, route.edgeIds);
      assert.deepEqual(candidate.routeNodeIds, route.nodeIds);
    }
  }
});

test("Stage 129 real London candidates include bounded variation where possible", () => {
  const option = requireMapOption(realLondonOsmPilotRouteMap.id);
  const report = buildRouteExerciseCandidateReviewReport({ mapOption: option, maxCandidates: 8 });
  const difficulties = new Set(report.acceptedCandidates.map((candidate) => candidate.difficulty));
  const routeTypes = new Set(report.acceptedCandidates.map((candidate) => candidate.routeType));

  assert.ok(report.acceptedCandidateCount <= 8);
  assert.ok(difficulties.has("easy") || difficulties.has("medium") || difficulties.has("hard"));
  assert.ok(routeTypes.size >= 2, Array.from(routeTypes).join(", "));
  assert.ok(
    report.acceptedCandidates.some((candidate) => candidate.checkpointNodeIds.length > 0),
    "expected at least one checkpoint-style candidate"
  );
});

test("Stage 129 rejects invalid and unreachable candidate inputs with stable reason codes", () => {
  const option = requireMapOption(tinyLondonOsmRouteMap.id);
  const officialExercise = option.exercises[0];
  const report = buildRouteExerciseCandidateReviewReport({
    mapOption: option,
    maxCandidates: 10,
    candidateNodePairs: [
      {
        startNodeId: "missing-start",
        destinationNodeId: "osm-node-1001"
      },
      {
        startNodeId: "osm-node-1001",
        destinationNodeId: "missing-destination"
      },
      {
        startNodeId: "osm-node-1001",
        destinationNodeId: "osm-node-1001"
      },
      {
        startNodeId: officialExercise.stops[0].type === "node" ? officialExercise.stops[0].nodeId : "missing-start",
        destinationNodeId:
          officialExercise.stops[officialExercise.stops.length - 1].type === "node"
            ? officialExercise.stops[officialExercise.stops.length - 1].nodeId
            : "missing-destination"
      },
      {
        startNodeId: "osm-node-1005",
        destinationNodeId: "osm-node-1001"
      }
    ]
  });

  assert.equal(report.rejectedCandidateCount, 5);
  assert.equal(report.acceptedCandidateCount, 0);
  assert.deepEqual(
    report.rejectedCandidates.map((candidate) => candidate.rejectionReasonCodes),
    [
      ["candidate:missing-start-node"],
      ["candidate:missing-destination-node"],
      ["candidate:same-start-destination"],
      ["candidate:duplicate-official-exercise"],
      ["candidate:unreachable-route"]
    ]
  );
  assert.deepEqual(report.rejectionReasonCounts, [
    { reasonCode: "candidate:duplicate-official-exercise", count: 1 },
    { reasonCode: "candidate:missing-destination-node", count: 1 },
    { reasonCode: "candidate:missing-start-node", count: 1 },
    { reasonCode: "candidate:same-start-destination", count: 1 },
    { reasonCode: "candidate:unreachable-route", count: 1 }
  ]);
});

test("Stage 129 generated candidates are not automatically registered as official exercises", () => {
  const option = requireMapOption(realLondonOsmPilotRouteMap.id);
  const officialExerciseIds = new Set(option.exercises.map((exercise) => exercise.id));
  const officialExerciseCount = option.exercises.length;
  const report = buildRouteExerciseCandidateReviewReport({ mapOption: option, maxCandidates: 6 });

  for (const candidate of report.acceptedCandidates) {
    assert.equal(officialExerciseIds.has(candidate.candidateId), false, candidate.candidateId);
    assert.equal(
      option.exercises.some((exercise) => {
        const firstStop = exercise.stops[0];
        const lastStop = exercise.stops[exercise.stops.length - 1];

        return (
          firstStop.type === "node" &&
          lastStop.type === "node" &&
          firstStop.nodeId === candidate.startNodeId &&
          lastStop.nodeId === candidate.destinationNodeId
        );
      }),
      false,
      candidate.candidateId
    );
  }

  assert.equal(option.exercises.length, officialExerciseCount);
});

test("Stage 129 keeps Marlowe as the default map", () => {
  assert.equal(DEFAULT_ROUTE_RUNNER_MAP_ID, marloweDistrictMap.id);
  assert.equal(ROUTE_RUNNER_MAP_OPTIONS[0]?.id, DEFAULT_ROUTE_RUNNER_MAP_ID);
  assert.notEqual(DEFAULT_ROUTE_RUNNER_MAP_ID, realLondonOsmPilotRouteMap.id);
});

test("Stage 129 real London candidate generation remains committed fixture only", () => {
  const option = requireMapOption(realLondonOsmPilotRouteMap.id);
  const report = buildRouteExerciseCandidateReviewReport({ mapOption: option, maxCandidates: 3 });

  assert.equal(option.source, "converted-osm");
  assert.equal(option.fixtureName, "realLondonPilotOverpass.json");
  assert.ok(option.sourceOverpassFixture);
  assert.equal(String(option.fixtureName).includes("http://"), false);
  assert.equal(String(option.fixtureName).includes("https://"), false);
  assert.equal(report.mapId, realLondonOsmPilotRouteMap.id);
});

test("Stage 129 QA review output includes deterministic counts, warnings, and reason codes", () => {
  const option = requireMapOption(realLondonOsmPilotRouteMap.id);
  const firstReport = buildRouteExerciseCandidateReviewReport({ mapOption: option, maxCandidates: 6 });
  const secondReport = buildRouteExerciseCandidateReviewReport({ mapOption: option, maxCandidates: 6 });

  assert.deepEqual(firstReport, secondReport);
  assert.equal(firstReport.totalCandidatesConsidered, firstReport.acceptedCandidateCount + firstReport.rejectedCandidateCount);
  assert.ok(firstReport.acceptedCandidateCount > 0);
  assert.ok(firstReport.acceptedCandidates.every((candidate) => candidate.reasonCodes.length > 0));
  assert.ok(firstReport.acceptedCandidates.every((candidate) => candidate.notes.length > 0));
  assert.ok(firstReport.warningReasonCounts.every((entry) => entry.count > 0));
  assert.deepEqual(
    firstReport.warningReasonCounts,
    [...firstReport.warningReasonCounts].sort((left, right) => left.reasonCode.localeCompare(right.reasonCode))
  );
});

function requireMapOption(mapId: string) {
  const option = getRouteRunnerMapOption(mapId);

  assert.ok(option, mapId);

  return option;
}
