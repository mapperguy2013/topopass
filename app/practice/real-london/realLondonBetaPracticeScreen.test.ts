import assert from "node:assert/strict";
import test from "node:test";
import { marloweDistrictMap } from "../../../lib/map-engine/index.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  getRouteRunnerMapOption,
  realLondonOsmPilotRouteMap
} from "../../dev/route-runner/routeRunnerMaps.ts";
import { buildLondonPilotReadinessReportForMapId } from "../../dev/route-runner/routeRunnerOsmRealPilotReadinessReport.ts";
import { buildRouteRunnerMobileQaReport } from "../../dev/route-runner/routeRunnerMobileQa.ts";
import { ONE_WAY_ARROW_MIN_SPACING_METERS } from "../../dev/route-runner/restrictionMapVisuals.ts";
import {
  REAL_LONDON_BETA_ENV_FLAG
} from "../../dev/route-runner/routeRunnerRealLondonBetaGate.ts";
import {
  REAL_LONDON_BETA_PRACTICE_DISPLAY_LABEL,
  REAL_LONDON_BETA_PRACTICE_PATH,
  buildRealLondonBetaPracticeScreenModel
} from "./realLondonBetaPracticeScreen.ts";

test("Stage 132 beta users can access the real London practice screen", () => {
  const model = buildRealLondonBetaPracticeScreenModel({ betaEnabled: true });

  assert.equal(model.state, "available");
  assert.equal(model.pagePath, REAL_LONDON_BETA_PRACTICE_PATH);
  assert.equal(model.label, REAL_LONDON_BETA_PRACTICE_DISPLAY_LABEL);

  if (model.state !== "available") {
    throw new Error("Expected available beta practice screen.");
  }

  assert.equal(model.mapId, realLondonOsmPilotRouteMap.id);
  assert.equal(model.routeRunnerMode, "student-beta");
  assert.equal(model.mapInteraction.drawingEnabled, true);
  assert.equal(model.mapInteraction.usesExistingRouteRunnerLogic, true);
});

test("Stage 132 non-beta users see a safe unavailable state", () => {
  const model = buildRealLondonBetaPracticeScreenModel({ betaEnabled: false });

  assert.equal(model.state, "unavailable");
  assert.equal(model.betaFlagName, REAL_LONDON_BETA_ENV_FLAG);

  if (model.state !== "unavailable") {
    throw new Error("Expected unavailable beta practice screen.");
  }

  assert.equal(model.unavailableState.reasonCode, "real-london-beta-disabled");
  assert.equal(model.defaultMapId, DEFAULT_ROUTE_RUNNER_MAP_ID);
  assert.match(model.unavailableState.message, /beta-enabled testers/);
  assert.match(model.unavailableState.message, /Marlowe remains the default/);
});

test("Stage 132 screen exposes compact exercise selector metadata", () => {
  const model = requireAvailableModel();

  assert.equal(model.exerciseSelectorTitle, "Practice Exercises");
  assert.ok(model.exerciseRows.length >= 5);
  assert.ok(model.exerciseRows.every((row) => row.exerciseVersion === "1.0.0"));
  assert.ok(model.exerciseRows.every((row) => ["easy", "medium", "hard"].includes(row.difficulty)));
  assert.ok(
    model.exerciseRows.every((row) =>
      ["direct", "checkpoint", "multi-stop", "one-way-awareness"].includes(row.routeType)
    )
  );
  assert.ok(model.exerciseRows.every((row) => Number.isFinite(row.estimatedDistanceMeters)));
  assert.ok(model.exerciseRows.every((row) => row.estimatedDistanceLabel.length > 0));
  assert.equal(model.exerciseRows.filter((row) => row.selected).length, 1);
});

test("Stage 132 selected exercise instructions include start destination and checkpoints", () => {
  const model = requireAvailableModel("osm-real-pilot-checkpoint-route");

  assert.equal(model.selectedExercise.id, "osm-real-pilot-checkpoint-route");
  assert.ok(model.selectedExercise.startLabel.length > 0);
  assert.ok(model.selectedExercise.destinationLabel.length > 0);
  assert.ok(model.selectedExercise.checkpointLabels.length > 0);
  assert.ok(model.selectedExercise.instructionLines.some((line) => line.includes("Start at")));
  assert.ok(model.selectedExercise.instructionLines.some((line) => line.includes("Visit checkpoints in order")));
  assert.ok(model.selectedExercise.instructionLines.some((line) => line.includes("Finish at")));
});

test("Stage 132 beta screen hides dev QA diagnostics", () => {
  const model = requireAvailableModel();

  assert.equal(model.devDiagnostics.visible, false);
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("real-london-readiness-qa"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("fixture-filename"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("qa-counts"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("metadata-coverage-counts"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("internal-readiness-diagnostics"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("full-restriction-debug-details"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("converted-osm-qa"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("restriction-overlays"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("pipeline-debug-result"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("manual-route-input"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("osm-debug"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("raw-debug-output"));
  assert.equal("fixtureName" in model, false);
});

test("Stage 132 screen includes OSM attribution limitations feedback hook and legend", () => {
  const model = requireAvailableModel();

  assert.equal(model.attribution, "OpenStreetMap contributors");
  assert.ok(model.feedback.visible);
  assert.match(model.feedback.placeholder, /Beta testers can note/);
  assert.ok(model.knownLimitations.some((limitation) => limitation.includes("committed local OSM fixtures only")));
  assert.ok(model.knownLimitations.some((limitation) => limitation.includes("does not fetch live OSM")));
  assert.ok(model.knownLimitations.every((limitation) => !limitation.includes("QA")));
  assert.ok(model.legendItems.some((item) => item.id === "one-way" && /one-way/i.test(item.description)));
  assert.ok(model.legendItems.some((item) => item.id === "context-roads" && /context/i.test(item.description)));
});

test("Stage 132 route attempt flow uses existing runner and remains scoreable", () => {
  const model = requireAvailableModel();

  assert.equal(model.routeFlow.shortestRouteFound, true);
  assert.equal(model.routeFlow.existingRunnerScorePassed, true);
  assert.ok(model.routeFlow.selectedEdgeCount > 0);
  assert.equal(model.mapInteraction.submitActionLabel, "Submit Attempt");
  assert.equal(model.mapInteraction.clearActionLabel, "Clear");
});

test("Stage 132 real London readiness and dev QA remain available separately", () => {
  const report = buildLondonPilotReadinessReportForMapId(realLondonOsmPilotRouteMap.id);

  assert.equal(report.isReady, true, report.failureMessages.join("\n"));
  assert.equal(report.acceptanceQa.status, "pass");
  assert.equal(report.manualAttemptQa.status, "pass");
  assert.equal(report.drawnRouteQa.status, "pass");
});

test("Stage 132 Marlowe remains the default map", () => {
  assert.equal(DEFAULT_ROUTE_RUNNER_MAP_ID, marloweDistrictMap.id);
});

test("Stage 132 mobile layout remains acceptable for the beta map", () => {
  const mapOption = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.ok(mapOption);

  const mobileQa = buildRouteRunnerMobileQaReport({
    mapOption,
    viewportWidth: 390,
    viewportHeight: 844
  });
  const model = requireAvailableModel();

  assert.equal(model.mobileLayout.compactSelector, true);
  assert.equal(model.mobileLayout.horizontalOverflowRisk, false);
  assert.equal(mobileQa.isPassing, true, mobileQa.failures.map((failure) => failure.code).join(", "));
});

test("Stage 139 beta mobile layout exposes compact task state without duplicate practice panels", () => {
  const model = requireAvailableModel("osm-real-pilot-checkpoint-route");

  assert.equal(model.mobileLayout.compactHeader, true);
  assert.equal(model.mobileLayout.taskSummaryVisible, true);
  assert.equal(model.mobileLayout.compactSelector, true);
  assert.equal(model.mobileLayout.combinedExerciseAndRecommendationPanel, true);
  assert.equal(model.mobileLayout.duplicateRecommendedPracticePanel, false);
  assert.equal(model.exerciseSelectorTitle, "Practice Exercises");
  assert.equal(model.selectedExercise.mobileInstructionSummary.includes("Start at"), true);
  assert.equal(model.selectedExercise.compactStopSummary.includes("->"), true);
  assert.equal(model.exerciseRows.filter((row) => row.selected).length, 1);
});

test("Stage 139 mobile instructions limitations and restriction overlays are collapsed or summary-first", () => {
  const model = requireAvailableModel();

  assert.equal(model.mobileLayout.instructionsCollapsedByDefault, true);
  assert.equal(model.mobileLayout.limitationsCollapsedByDefault, true);
  assert.equal(model.mobileLayout.restrictionSummaryFirst, true);
  assert.equal(model.mobileLayout.restrictionDetailsCollapsedByDefault, true);
  assert.equal(model.mobileLayout.restrictionDebugDetailsHidden, true);
  assert.equal(model.devDiagnostics.visible, false);
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("full-restriction-debug-details"));
});

test("Stage 139 mobile feedback and map interaction affordances stay usable", () => {
  const model = requireAvailableModel();

  assert.equal(model.feedback.visible, true);
  assert.equal(model.mobileLayout.feedbackFormMobileSafe, true);
  assert.equal(model.mobileLayout.feedbackMinTouchTargetPx, 44);
  assert.equal(model.mobileLayout.routeRunnerMapMinHeightPx, 360);
  assert.equal(model.mobileLayout.routeRunnerMapTouchAction, "none");
  assert.equal(model.mapInteraction.drawingEnabled, true);
  assert.equal(model.mapInteraction.clearActionLabel, "Clear");
  assert.equal(model.mapInteraction.submitActionLabel, "Submit Attempt");
});

test("Stage 139 one-way arrow visual thinning remains presentation-only", () => {
  const model = requireAvailableModel();

  assert.equal(ONE_WAY_ARROW_MIN_SPACING_METERS, 50);
  assert.equal(model.mobileLayout.oneWayArrowMinSpacingMeters, ONE_WAY_ARROW_MIN_SPACING_METERS);
  assert.equal(model.routeFlow.shortestRouteFound, true);
  assert.equal(model.routeFlow.existingRunnerScorePassed, true);
});

test("Stage 139 mobile route-runner QA remains layout-only and passing", () => {
  const mapOption = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.ok(mapOption);

  const report = buildRouteRunnerMobileQaReport({
    mapOption,
    viewportWidth: 390,
    viewportHeight: 844
  });

  assert.equal(report.scope, "layout-interaction-only");
  assert.equal(report.routeEngineChecks, "not-run");
  assert.equal(report.touchDrawingAvailable, true);
  assert.equal(report.zoomControlsReachable, true);
  assert.equal(report.pageScrollAccessible, true);
  assert.equal(report.horizontalOverflowRisk, false);
  assert.equal(report.isPassing, true, report.failures.map((failure) => failure.code).join(", "));
});

function requireAvailableModel(selectedExerciseId?: string) {
  const model = buildRealLondonBetaPracticeScreenModel({
    betaEnabled: true,
    selectedExerciseId
  });

  if (model.state !== "available") {
    throw new Error("Expected available beta practice screen.");
  }

  return model;
}
