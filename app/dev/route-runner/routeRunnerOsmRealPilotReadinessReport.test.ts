import assert from "node:assert/strict";
import test from "node:test";
import { buildMapGraph, marloweDistrictMap } from "../../../lib/map-engine/index.ts";
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
  type RouteRunnerMapOption
} from "./routeRunnerMaps.ts";
import { buildOsmRouteExerciseQaAcceptanceSuiteReport } from "./routeRunnerOsmExerciseQa.ts";
import {
  buildOsmPilotReadinessReport,
  buildRealLondonPilotReadinessReport,
  stableOsmPilotReadinessReportSummary
} from "./routeRunnerOsmRealPilotReadinessReport.ts";

const EXPECTED_STAGE_119_SECTION_IDS = [
  "fixture-source",
  "exercise-count",
  "acceptance-qa",
  "manual-attempt-qa",
  "drawn-route-qa",
  "render-bounds-sanity",
  "fastest-legal-route-availability",
  "illegal-movement-detection-coverage"
];

test("real London pilot readiness report passes when existing QA passes", () => {
  const report = buildRealLondonPilotReadinessReport();

  assert.equal(report.mapId, "osm-real-london-pilot");
  assert.equal(report.fixtureSource.source, "committed-local-overpass-fixture");
  assert.equal(report.fixtureSource.fixtureName, "realLondonPilotOverpass.json");
  assert.equal(report.fixtureSource.path, "lib/map-engine/osm/fixtures/realLondonPilotOverpass.json");
  assert.equal(report.exerciseCount, 5);
  assert.equal(report.overallReadinessStatus, "ready", report.failureMessages.join("\n"));
  assert.equal(report.isReady, true);
  assert.deepEqual(report.failureReasonCodes, []);
  assert.deepEqual(report.failureMessages, []);
  assert.equal(report.acceptanceQa.status, "pass");
  assert.equal(report.manualAttemptQa.status, "pass");
  assert.equal(report.drawnRouteQa.status, "pass");
  assert.equal(report.renderBoundsSanity.status, "pass");
  assert.equal(report.fastestLegalRouteAvailability.status, "pass");
  assert.equal(report.illegalMovementDetectionCoverage.status, "pass");
  assert.equal(report.acceptanceQa.passedExerciseCount, realLondonOsmPilotRouteExercises.length);
  assert.equal(report.manualAttemptQa.acceptedAttemptCount, realLondonOsmPilotRouteExercises.length);
  assert.equal(report.drawnRouteQa.passedDrawnRouteCount, realLondonOsmPilotRouteExercises.length);
  assert.equal(report.fastestLegalRouteAvailability.availableExerciseCount, realLondonOsmPilotRouteExercises.length);
  assert.ok(report.fastestLegalRouteAvailability.totalFastestRouteEdgeCount > 0);
  assert.ok(report.illegalMovementDetectionCoverage.checkedRoadId);
});

test("real London pilot readiness report includes every Stage 119 section", () => {
  const report = buildRealLondonPilotReadinessReport();

  assert.deepEqual(
    report.passFailSummary.sections.map((section) => section.id),
    EXPECTED_STAGE_119_SECTION_IDS
  );
  assert.deepEqual(report.passFailSummary.failedSections, []);
  assert.deepEqual(report.passFailSummary.passedSections, EXPECTED_STAGE_119_SECTION_IDS);
  assert.equal(report.fixtureSource.id, "fixture-source");
  assert.equal(report.acceptanceQa.id, "acceptance-qa");
  assert.equal(report.manualAttemptQa.id, "manual-attempt-qa");
  assert.equal(report.drawnRouteQa.id, "drawn-route-qa");
  assert.equal(report.renderBoundsSanity.id, "render-bounds-sanity");
  assert.equal(report.fastestLegalRouteAvailability.id, "fastest-legal-route-availability");
  assert.equal(report.illegalMovementDetectionCoverage.id, "illegal-movement-detection-coverage");
});

test("readiness report failure statuses are deterministic", () => {
  const option = realPilotMapOption();
  const firstReport = buildOsmPilotReadinessReport({
    mapOption: option,
    expectedFixtureName: "stage-119-unexpected-fixture.json"
  });
  const secondReport = buildOsmPilotReadinessReport({
    mapOption: option,
    expectedFixtureName: "stage-119-unexpected-fixture.json"
  });

  assert.equal(firstReport.overallReadinessStatus, "not-ready");
  assert.equal(firstReport.isReady, false);
  assert.equal(firstReport.fixtureSource.status, "fail");
  assert.deepEqual(firstReport.passFailSummary.failedSections, ["fixture-source"]);
  assert.deepEqual(firstReport.failureReasonCodes, ["fixture-source:unexpected-fixture"]);
  assert.deepEqual(stableOsmPilotReadinessReportSummary(secondReport), stableOsmPilotReadinessReportSummary(firstReport));
});

test("tiny and medium OSM regression acceptance remains unchanged", () => {
  const cases = [
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
    assert.ok(suite.reports.every((report) => report.hasLegalRoute), map.id);
  }
});

test("Stage 119 readiness report leaves Marlowe as the default synthetic map", () => {
  const defaultOption = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);

  assert.equal(DEFAULT_ROUTE_RUNNER_MAP_ID, marloweDistrictMap.id);
  assert.notEqual(DEFAULT_ROUTE_RUNNER_MAP_ID, realLondonOsmPilotRouteMap.id);
  assert.equal(ROUTE_RUNNER_MAP_OPTIONS[0]?.id, marloweDistrictMap.id);
  assert.equal(defaultOption?.source, "synthetic-dev");
  assert.equal(defaultOption?.map, marloweDistrictMap);
});

function realPilotMapOption(): RouteRunnerMapOption {
  const option = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.ok(option);

  return option;
}
