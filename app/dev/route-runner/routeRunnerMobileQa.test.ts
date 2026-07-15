import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  categorizeRouteRunnerOrientation,
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
  assert.equal(report.orientation, "portrait");
  assert.equal(report.minimumTouchTargetPx, 44);
  assert.equal(report.setupCollapsedByDefault, true);
  assert.equal(report.safeAreaInsetsSupported, true);
  assert.equal(report.mapId, marloweDistrictMap.id);
  assert.equal(report.mapArea.visible, true);
  assert.equal(report.mapArea.bounded, true);
  assert.equal(report.mapArea.horizontalPadding, 16);
  assert.ok(report.mapArea.viewportWidthRatio >= 0.95);
  assert.equal(report.mapArea.isotropicProjection, true);
  assert.ok(report.practiceCardWidthRatio >= 0.95);
  assert.equal(report.outerHorizontalPadding, 16);
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

test("Stage 8.10 responsive matrix classifies portrait and landscape layouts deterministically", () => {
  const matrix = [
    [1440, 900, "desktop", "landscape", false],
    [1024, 768, "tablet", "landscape", true],
    [768, 1024, "tablet", "portrait", true],
    [390, 844, "mobile", "portrait", true],
    [360, 800, "mobile", "portrait", true],
    [844, 390, "tablet", "landscape", true]
  ] as const;
  const option = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);

  assert.ok(option);

  for (const [width, height, category, orientation, collapsed] of matrix) {
    const report = buildRouteRunnerMobileQaReport({
      mapOption: option,
      viewportWidth: width,
      viewportHeight: height
    });

    assert.equal(report.viewportCategory, category);
    assert.equal(report.orientation, orientation);
    assert.equal(report.setupCollapsedByDefault, collapsed);
    assert.equal(report.isPassing, true, `${width}x${height}: ${report.failures.map((failure) => failure.code).join(", ")}`);
  }

  assert.equal(categorizeRouteRunnerOrientation(500, 500), "square");
});

test("Stage 161.6.29 mobile practice layout uses reduced gutters and near full-width map", () => {
  const option = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.ok(option);

  const report = buildRouteRunnerMobileQaReport({
    mapOption: option,
    ...MOBILE_VIEWPORT
  });

  assert.equal(report.viewportCategory, "mobile");
  assert.equal(report.outerHorizontalPadding, 16);
  assert.equal(report.mapArea.horizontalPadding, 16);
  assert.ok(report.practiceCardWidthRatio >= 0.95);
  assert.ok(report.mapArea.viewportWidthRatio >= 0.95);
  assert.equal(report.horizontalOverflowRisk, false);
  assert.equal(report.mapArea.bounded, true);
  assert.equal(report.mapArea.isotropicProjection, true);
});

test("Stage 161.6.29 mobile feedback is compact and non-blocking by default", () => {
  const option = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.ok(option);

  const report = buildRouteRunnerMobileQaReport({
    mapOption: option,
    ...MOBILE_VIEWPORT
  });

  assert.equal(report.feedbackMode.compactBannerVisibleAfterSubmit, true);
  assert.deepEqual(report.feedbackMode.bannerStatuses, ["pass", "fail", "blocked"]);
  assert.equal(report.feedbackMode.detailsCollapsedByDefault, true);
  assert.ok(report.feedbackMode.detailsMaxViewportHeightRatio <= 0.55);
  assert.equal(report.feedbackMode.detailsCanExpandAndCollapse, true);
  assert.equal(report.feedbackMode.mapUsableWhenDetailsCollapsed, true);
  assert.equal(report.feedbackMode.showOnMapCollapsesDetails, true);
  assert.equal(report.feedbackMode.shortestRouteActionKeepsMapVisible, true);
});

test("Stage 161.6.29 desktop feedback drawer remains the non-mobile behaviour", () => {
  const option = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.ok(option);

  const report = buildRouteRunnerMobileQaReport({
    mapOption: option,
    viewportWidth: 1280,
    viewportHeight: 900
  });

  assert.equal(report.viewportCategory, "desktop");
  assert.equal(report.feedbackMode.compactBannerVisibleAfterSubmit, false);
  assert.equal(report.feedbackMode.detailsCollapsedByDefault, false);
  assert.equal(report.feedbackMode.desktopDrawerPreserved, true);
});

test("Stage 161.6.29 RouteRunner renders mobile feedback banner and collapsible details without beta QA panels", () => {
  const source = readFileSync("app/dev/route-runner/RouteRunnerClient.tsx", "utf8");

  assert.ok(source.includes("showMobileRouteFeedbackBanner"));
  assert.ok(source.includes("Route result"));
  assert.ok(source.includes("View details"));
  assert.ok(source.includes("Hide details"));
  assert.ok(source.includes("max-h-[55dvh]"));
  assert.ok(source.includes("setRouteFeedbackDrawerOpen(!isStudentBetaPhoneMap)"));
  assert.ok(source.includes("visibleOsmDebugOverlayAvailable"));
  assert.ok(source.includes("!routeRunnerPanelVisibility.isRealLondonBetaPractice"));
  assert.ok(source.includes("ROUTE_RUNNER_FEEDBACK_PANEL_ID"));
  assert.ok(source.includes('aria-controls={ROUTE_RUNNER_FEEDBACK_PANEL_ID}'));
  assert.ok(source.includes("routeFeedbackTriggerRef"));
  assert.ok(source.includes("closeRouteFeedbackDrawer(true)"));
  assert.ok(source.includes("safe-area-inset-bottom"));
  assert.ok(source.includes("handlePointerCancel"));
  assert.ok(source.includes("onPointerCancel={handlePointerCancel}"));
  assert.ok(source.includes("role=\"img\""));
  assert.ok(source.includes("ROUTE_RUNNER_MAP_INSTRUCTIONS_ID"));
  assert.ok(source.includes("grid-cols-[minmax(0,1fr)] gap-4"));
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
  assert.ok(report.mapArea.width > 1120);
  assert.ok(report.mapArea.height > 560);
  assert.ok(report.mapArea.height <= 820);
  assert.ok(report.mapArea.height < report.viewportHeight);
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
