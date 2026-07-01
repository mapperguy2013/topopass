import assert from "node:assert/strict";
import test from "node:test";
import { marloweDistrictMap } from "../../../lib/map-engine/index.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  getRouteRunnerMapOption,
  mediumLondonOsmRouteMap,
  realLondonOsmPilotRouteMap,
  tinyLondonOsmRouteMap
} from "./routeRunnerMaps.ts";
import {
  buildRouteRunnerMobileQaReport,
  categorizeRouteRunnerViewport,
  type RouteRunnerMobileQaPanelId
} from "./routeRunnerMobileQa.ts";

const MOBILE_VIEWPORT = {
  viewportWidth: 390,
  viewportHeight: 844
};

test("Mobile Route Runner QA keeps Marlowe default route-runner layout passing", () => {
  const option = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);

  assert.ok(option);
  assert.equal(DEFAULT_ROUTE_RUNNER_MAP_ID, marloweDistrictMap.id);

  const report = buildRouteRunnerMobileQaReport({
    mapOption: option,
    ...MOBILE_VIEWPORT
  });

  assert.equal(report.isPassing, true, report.failures.map((failure) => failure.message).join("\n"));
  assert.equal(report.viewportCategory, "mobile");
  assert.equal(report.mapId, marloweDistrictMap.id);
  assert.equal(report.mapArea.visible, true);
  assert.equal(report.mapArea.bounded, true);
  assert.equal(report.selectedExerciseVisible, true);
  assert.equal(report.touchDrawingAvailable, true);
  assert.equal(report.zoomControlsReachable, true);
  assert.equal(report.pageScrollAccessible, true);
  assert.equal(report.horizontalOverflowRisk, false);
  assert.deepEqual(
    report.panelRows.map((panel) => panel.id),
    ["main-controls", "selected-exercise", "drawing-controls", "zoom-controls", "map-area", "version-metadata"]
  );
});

test("Mobile Route Runner QA keeps tiny and medium OSM maps compatible", () => {
  const mapIds = [tinyLondonOsmRouteMap.id, mediumLondonOsmRouteMap.id];

  for (const mapId of mapIds) {
    const option = getRouteRunnerMapOption(mapId);

    assert.ok(option);

    const report = buildRouteRunnerMobileQaReport({
      mapOption: option,
      ...MOBILE_VIEWPORT
    });

    assert.equal(report.isPassing, true, `${mapId}: ${report.failures.map((failure) => failure.code).join(", ")}`);
    assert.equal(report.viewportCategory, "mobile");
    assert.equal(report.mapArea.visible, true, mapId);
    assert.equal(report.mapArea.bounded, true, mapId);
    assert.equal(report.panelRows.some((panel) => panel.id === "osm-qa-status"), true, mapId);
  }
});

test("Mobile Route Runner QA includes real London pilot QA playthrough version and metadata panels without overflow risk", () => {
  const option = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.ok(option);
  assert.equal(option.fixtureName, "realLondonPilotOverpass.json");
  assert.ok(option.sourceOverpassFixture);

  const report = buildRouteRunnerMobileQaReport({
    mapOption: option,
    ...MOBILE_VIEWPORT
  });
  const panelIds = report.panelRows.map((panel) => panel.id);
  const expectedPanelIds: RouteRunnerMobileQaPanelId[] = [
    "version-metadata",
    "osm-qa-status",
    "real-london-readiness-qa",
    "real-london-playthrough",
    "real-london-exercise-metadata"
  ];

  assert.equal(report.isPassing, true, report.failures.map((failure) => failure.message).join("\n"));
  assert.equal(report.mapId, "osm-real-london-pilot");
  assert.equal(report.mapVersion, "1.0.0");
  assert.equal(report.exerciseVersion, "1.0.0");
  assert.equal(report.horizontalOverflowRisk, false);

  for (const panelId of expectedPanelIds) {
    assert.equal(panelIds.includes(panelId), true, panelId);
  }

  assert.deepEqual(
    report.panelRows.map((panel) => [panel.id, panel.mobileSafe, panel.horizontalOverflowRisk]),
    report.panelRows.map((panel) => [panel.id, true, false])
  );
});

test("Mobile Route Runner QA returns deterministic failure reasons for missing required controls", () => {
  const option = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);

  assert.ok(option);

  const report = buildRouteRunnerMobileQaReport({
    mapOption: option,
    ...MOBILE_VIEWPORT,
    controlAvailability: {
      "exercise-selector": false,
      "draw-mode": false,
      "zoom-in": false
    }
  });

  assert.equal(report.isPassing, false);
  assert.deepEqual(
    report.failures.map((failure) => failure.code),
    ["missing-exercise-selector", "missing-draw-control", "missing-zoom-in-control"]
  );

  const repeated = buildRouteRunnerMobileQaReport({
    mapOption: option,
    ...MOBILE_VIEWPORT,
    controlAvailability: {
      "exercise-selector": false,
      "draw-mode": false,
      "zoom-in": false
    }
  });

  assert.deepEqual(repeated.failures, report.failures);
});

test("Mobile Route Runner QA reports missing real London panels deterministically", () => {
  const option = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.ok(option);

  const report = buildRouteRunnerMobileQaReport({
    mapOption: option,
    ...MOBILE_VIEWPORT,
    panelAvailability: {
      "real-london-readiness-qa": false,
      "real-london-playthrough": false,
      "real-london-exercise-metadata": false
    }
  });

  assert.equal(report.isPassing, false);
  assert.deepEqual(
    report.failures.map((failure) => failure.code),
    [
      "missing-real-london-qa-panel",
      "missing-real-london-playthrough-panel",
      "missing-real-london-exercise-metadata"
    ]
  );
});

test("Mobile Route Runner QA keeps desktop assumptions intact", () => {
  const option = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);

  assert.ok(option);
  assert.equal(categorizeRouteRunnerViewport(1280), "desktop");

  const report = buildRouteRunnerMobileQaReport({
    mapOption: option,
    viewportWidth: 1280,
    viewportHeight: 900
  });

  assert.equal(report.isPassing, true, report.failures.map((failure) => failure.code).join(", "));
  assert.equal(report.viewportCategory, "desktop");
  assert.equal(report.mapArea.visible, true);
  assert.equal(report.mapArea.bounded, true);
  assert.deepEqual(report.controlIds, [
    "map-selector",
    "exercise-selector",
    "selected-exercise-info",
    "draw-mode",
    "pan-mode",
    "undo",
    "clear-drawing",
    "submit-attempt",
    "reveal-route",
    "reset-view",
    "zoom-in",
    "zoom-out"
  ]);
});

test("Mobile Route Runner QA stays separate from route engine behavior", () => {
  const option = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.ok(option);

  const report = buildRouteRunnerMobileQaReport({
    mapOption: option,
    ...MOBILE_VIEWPORT
  });

  assert.equal(report.scope, "layout-interaction-only");
  assert.equal(report.routeEngineChecks, "not-run");
  assert.equal(report.isPassing, true);
});
