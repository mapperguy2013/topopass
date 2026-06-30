import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  getRouteRunnerMapOption,
  mediumLondonOsmRouteMap,
  realLondonOsmPilotRouteExercises,
  realLondonOsmPilotRouteMap,
  tinyLondonOsmRouteMap,
  type RouteRunnerMapOption
} from "./routeRunnerMaps.ts";
import {
  buildOsmPilotReadinessReport,
  buildRealLondonPilotReadinessReport
} from "./routeRunnerOsmRealPilotReadinessReport.ts";
import {
  buildRealLondonPilotQaPanelModel,
  buildRealLondonPilotQaPanelModelForMap,
  shouldShowRealLondonPilotQaPanel
} from "./routeRunnerRealLondonPilotQaPanel.ts";

test("valid Stage 119 report formats as ready for the real London pilot panel", () => {
  const model = buildRealLondonPilotQaPanelModel(buildRealLondonPilotReadinessReport());
  const exerciseCount = realLondonOsmPilotRouteExercises.length;

  assert.equal(model.title, "Real London Pilot QA");
  assert.equal(model.mapId, "osm-real-london-pilot");
  assert.equal(model.fixtureName, "realLondonPilotOverpass.json");
  assert.equal(model.status, "ready");
  assert.equal(model.statusLabel, "Ready");
  assert.equal(model.statusTone, "pass");
  assert.equal(model.exerciseCount, exerciseCount);
  assert.equal(model.passedExerciseCount, exerciseCount);
  assert.equal(model.failedExerciseCount, 0);
  assert.equal(model.exerciseProgressText, `${exerciseCount}/${exerciseCount} passing`);
});

test("real London pilot panel displays all expanded exercise ids in fixture order", () => {
  const model = buildRealLondonPilotQaPanelModel(buildRealLondonPilotReadinessReport());

  assert.equal(model.exerciseIds.length, realLondonOsmPilotRouteExercises.length);
  assert.deepEqual(
    model.exerciseIds,
    realLondonOsmPilotRouteExercises.map((exercise) => exercise.id)
  );
});

test("real London pilot panel summaries are shown in stable order", () => {
  const model = buildRealLondonPilotQaPanelModel(buildRealLondonPilotReadinessReport());
  const exerciseCount = realLondonOsmPilotRouteExercises.length;

  assert.deepEqual(
    model.summaryRows.map((row) => [row.id, row.label, row.value, row.detail, row.status]),
    [
      ["acceptance-qa", "Acceptance QA", "passing", `${exerciseCount}/${exerciseCount} exercises passing`, "pass"],
      ["manual-attempt-qa", "Manual Attempt QA", "passing", `${exerciseCount}/${exerciseCount} attempts accepted`, "pass"],
      ["drawn-route-qa", "Drawn Route QA", "passing", `${exerciseCount}/${exerciseCount} drawn routes passing`, "pass"]
    ]
  );
});

test("real London pilot panel displays empty failure reasons as none", () => {
  const model = buildRealLondonPilotQaPanelModel(buildRealLondonPilotReadinessReport());

  assert.deepEqual(model.failureReasons, ["none"]);
  assert.equal(model.failureReasonText, "none");
});

test("broken real London pilot panel reports deterministic failure reasons", () => {
  const firstModel = buildRealLondonPilotQaPanelModel(
    buildOsmPilotReadinessReport({
      mapOption: realPilotMapOption(),
      expectedFixtureName: "stage-120-unexpected-fixture.json"
    })
  );
  const secondModel = buildRealLondonPilotQaPanelModel(
    buildOsmPilotReadinessReport({
      mapOption: realPilotMapOption(),
      expectedFixtureName: "stage-120-unexpected-fixture.json"
    })
  );

  assert.equal(firstModel.status, "not-ready");
  assert.equal(firstModel.statusLabel, "Not ready");
  assert.equal(firstModel.statusTone, "fail");
  assert.deepEqual(firstModel.failureReasons, ["fixture-source:unexpected-fixture"]);
  assert.equal(firstModel.failureReasonText, "fixture-source:unexpected-fixture");
  assert.deepEqual(secondModel, firstModel);
});

test("repeated real London pilot panel formatting produces identical output", () => {
  const report = buildRealLondonPilotReadinessReport();

  assert.deepEqual(buildRealLondonPilotQaPanelModel(report), buildRealLondonPilotQaPanelModel(report));
});

test("Marlowe default synthetic map does not show the real London pilot readiness panel", () => {
  const report = buildRealLondonPilotReadinessReport();

  assert.equal(shouldShowRealLondonPilotQaPanel(DEFAULT_ROUTE_RUNNER_MAP_ID), false);
  assert.equal(buildRealLondonPilotQaPanelModelForMap({ mapId: DEFAULT_ROUTE_RUNNER_MAP_ID, report }), null);
});

test("tiny and medium OSM maps do not show the real London pilot readiness panel", () => {
  const report = buildRealLondonPilotReadinessReport();

  assert.equal(shouldShowRealLondonPilotQaPanel(tinyLondonOsmRouteMap.id), false);
  assert.equal(shouldShowRealLondonPilotQaPanel(mediumLondonOsmRouteMap.id), false);
  assert.equal(buildRealLondonPilotQaPanelModelForMap({ mapId: tinyLondonOsmRouteMap.id, report }), null);
  assert.equal(buildRealLondonPilotQaPanelModelForMap({ mapId: mediumLondonOsmRouteMap.id, report }), null);
});

function realPilotMapOption(): RouteRunnerMapOption {
  const option = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.ok(option);

  return option;
}
