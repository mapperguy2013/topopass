import assert from "node:assert/strict";
import test from "node:test";
import { marloweDistrictMap, marloweDistrictRouteExercises, runRouteExercise } from "../../../lib/map-engine/index.ts";
import {
  type RouteRunnerMapOption,
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  getRouteRunnerMapOption,
  realLondonOsmPilotRouteMap
} from "../../dev/route-runner/routeRunnerMaps.ts";
import { ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON } from "../../dev/route-runner/curatedRealLondonRouteRunnerMaps.ts";
import { buildLondonPilotReadinessReportForMapId } from "../../dev/route-runner/routeRunnerOsmRealPilotReadinessReport.ts";
import { buildRouteRunnerMobileQaReport } from "../../dev/route-runner/routeRunnerMobileQa.ts";
import { ONE_WAY_ARROW_MIN_SPACING_METERS } from "../../dev/route-runner/restrictionMapVisuals.ts";
import {
  REAL_LONDON_BETA_ENV_FLAG
} from "../../dev/route-runner/routeRunnerRealLondonBetaGate.ts";
import {
  REAL_LONDON_BETA_COMPACT_LEGEND_MAX_HEIGHT_PX,
  REAL_LONDON_BETA_DESKTOP_CANVAS_HEIGHT_PX,
  REAL_LONDON_BETA_DESKTOP_CANVAS_WIDTH_PX,
  REAL_LONDON_BETA_DESKTOP_MAP_MAX_HEIGHT_CSS,
  REAL_LONDON_BETA_DESKTOP_MAP_MAX_WIDTH_RULE,
  REAL_LONDON_BETA_DESKTOP_MAP_WIDTH_CSS,
  REAL_LONDON_BETA_MAP_OPTIONS,
  REAL_LONDON_BETA_PRACTICE_DISPLAY_LABEL,
  REAL_LONDON_BETA_PRACTICE_PATH,
  type RealLondonBetaPracticeScreenModel,
  buildRealLondonBetaPracticeScreenModel
} from "./realLondonBetaPracticeScreen.ts";

type AvailablePracticeModel = Extract<RealLondonBetaPracticeScreenModel, { state: "available" }>;
type ScoreablePracticeModel = AvailablePracticeModel & {
  selectedExercise: NonNullable<AvailablePracticeModel["selectedExercise"]>;
};

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
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("manual-run-result"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("osm-qa-button"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("exercise-qa-button"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("graph-overlay-controls"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("node-segment-id-controls"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("road-node-edge-diagnostics"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("blocked-way-ids"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("raw-osm-node-ids"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("raw-road-ids"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("raw-route-graph-ids"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("raw-graph-ids"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("local-route-attempt-ids"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("technical-per-leg-labels"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("drawn-route-score-summary"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("duplicate-route-controls"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("duplicate-submit-status"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("route-replay-panel"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("real-london-pilot-qa"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("real-london-pilot-playthrough"));
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("adaptive-dev-dashboard"));
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
  assert.deepEqual(
    model.legendItems.map((item) => item.label),
    [
      "Start",
      "Destination",
      "Checkpoint",
      "Your route",
      "Shortest legal route",
      "Accepted alternative",
      "Illegal / wrong way",
      "Missed checkpoint",
      "One-way",
      "No entry",
      "No left turn",
      "No right turn",
      "No U-turn",
      "No straight on",
      "Restricted movement",
      "Major road",
      "Secondary road",
      "Local street",
      "Park / open space",
      "Water",
      "Rail / station"
    ]
  );
  assert.ok(model.legendItems.some((item) => item.id === "one-way" && /one-way/i.test(item.description)));
  assert.ok(model.legendItems.some((item) => item.id === "no-entry" && /no entry/i.test(item.label)));
  assert.ok(model.legendItems.some((item) => item.id === "no-left-turn" && /left turn/i.test(item.label)));
  assert.ok(model.legendItems.some((item) => item.id === "no-right-turn" && /right turn/i.test(item.label)));
  assert.ok(model.legendItems.some((item) => item.id === "no-u-turn" && /u-turn/i.test(item.label)));
  assert.ok(model.legendItems.some((item) => item.id === "restricted-movement" && /movement/i.test(item.label)));
  assert.ok(
    model.legendItems.every((item) => !/\b(osm|relation|way id|node id|road id|graph id)\b/i.test(`${item.label} ${item.description}`))
  );
  assert.ok(model.legendItems.length <= 22);
});

test("Stage 132 route attempt flow uses existing runner and remains scoreable", () => {
  const model = requireAvailableModel();

  assert.equal(model.routeFlow.shortestRouteFound, true);
  assert.equal(model.routeFlow.existingRunnerScorePassed, true);
  assert.ok(model.routeFlow.selectedEdgeCount > 0);
  assert.equal(model.mapInteraction.submitActionLabel, "Submit");
  assert.equal(model.mapInteraction.clearActionLabel, "Erase route");
  assert.equal(model.mapInteraction.resetActionLabel, "Reset view");
  assert.equal(model.mapInteraction.mapSwitchClearsAttemptState, true);
  assert.equal(model.mapInteraction.eraseClearsDrawingAndResult, true);
  assert.equal(model.mapInteraction.eraseKeepsSelectedMapAndExercise, true);
  assert.equal(model.mapInteraction.eraseKeepsCurrentMapView, true);
  assert.equal(model.mapInteraction.resetClearsDrawingAndResult, false);
  assert.equal(model.mapInteraction.resetResetsMapView, true);
  assert.equal(model.mapInteraction.resetKeepsCurrentDrawing, true);
  assert.equal(model.mapInteraction.resetKeepsSubmittedResult, true);
  assert.equal(model.mapInteraction.resetKeepsSelectedMapAndExercise, true);
  assert.equal(model.mapInteraction.resetReturnsToDrawMode, true);
  assert.equal(model.mapInteraction.restrictionToggleLabel, "Show restrictions");
  assert.equal(model.mapInteraction.restrictionLayerDefaultVisible, true);
});

test("Stage 161.6.11 beta practice exposes one clean route control set", () => {
  const model = requireAvailableModel();

  assert.equal(model.learnerUi.shell.layoutPattern, "modern-map-app");
  assert.equal(model.learnerUi.shell.mapIsPrimaryWorkspace, true);
  assert.equal(model.learnerUi.shell.routeHeaderIsCompact, true);
  assert.equal(model.learnerUi.shell.routeSetupPanelCollapsible, true);
  assert.equal(model.learnerUi.shell.routeSetupPanelDefaultOpen, false);
  assert.deepEqual(model.learnerUi.shell.visualOrder, ["route-header", "route-setup", "map", "route-feedback"]);
  assert.equal(model.learnerUi.shell.feedbackPanelPlacement, "post-submit-side-or-bottom-panel");
  assert.equal(model.learnerUi.routeHeaderCount, 1);
  assert.equal(model.learnerUi.visibleMapWorkspaceHeading, false);
  assert.equal(model.learnerUi.routeControls.toolbarCount, 1);
  assert.equal(model.learnerUi.routeControls.undoCount, 1);
  assert.equal(model.learnerUi.routeControls.eraseRouteCount, 1);
  assert.equal(model.learnerUi.routeControls.resetViewCount, 1);
  assert.equal(model.learnerUi.routeControls.submitCount, 1);
  assert.equal(model.learnerUi.routeControls.restrictionToggleCount, 1);
  assert.equal(model.learnerUi.routeControls.submitPlacement, "route-header");
  assert.deepEqual(model.learnerUi.routeControls.mapToolbarActionLabels, [
    "Draw",
    "Pan",
    "Undo",
    "Erase route",
    "Reset view"
  ]);
  assert.equal(model.learnerUi.routeControls.mapToolbarSubmitVisible, false);
  assert.equal(model.learnerUi.routeControls.mapToolbarRestrictionToggleVisible, false);
  assert.equal(model.learnerUi.routeControls.restrictionControlPlacement, "legend-control");
  assert.equal(model.learnerUi.routeControls.duplicateControlGroupsVisible, false);
});

test("Stage 161.6.11 beta practice has one learner-facing result panel without internal IDs", () => {
  const model = requireAvailableModel();

  assert.equal(model.learnerUi.resultPanels.learnerPanelTitle, "Route feedback");
  assert.equal(model.learnerUi.resultPanels.preSubmitFeedbackPanelVisible, false);
  assert.equal(model.learnerUi.resultPanels.postSubmitFeedbackPanelVisible, true);
  assert.equal(model.learnerUi.resultPanels.submittedResultPanelCount, 1);
  assert.equal(model.learnerUi.resultPanels.betaCoachingNoteCount, 1);
  assert.equal(model.learnerUi.resultPanels.drawnRouteScoreSummaryVisible, false);
  assert.equal(model.learnerUi.resultPanels.routeAttemptReviewAndDrawnScoreSummaryTogether, false);
  assert.equal(model.learnerUi.resultPanels.routeReplayVisibleByDefault, false);
  assert.equal(model.learnerUi.resultPanels.summaryHeaderFirst, true);
  assert.deepEqual(model.learnerUi.resultPanels.metricLabels, [
    "Score",
    "Your route",
    "Shortest legal route",
    "Extra distance"
  ]);
  assert.equal(model.learnerUi.resultPanels.whatHappenedSectionVisible, true);
  assert.deepEqual(model.learnerUi.resultPanels.issueCategories, [
    "Route efficiency",
    "Illegal movements",
    "Required stops",
    "Matching"
  ]);
  assert.equal(model.learnerUi.resultPanels.routeTooLongCategory, "Route efficiency");
  assert.equal(model.learnerUi.resultPanels.routeTooLongShowOnMapVisible, false);
  assert.equal(model.learnerUi.resultPanels.emptyIssueCategoriesHidden, true);
  assert.equal(model.learnerUi.resultPanels.requiredStopProgressUsesLearnerLabels, true);
  assert.equal(model.learnerUi.resultPanels.duplicateRequiredStopProgressPanelVisible, false);
  assert.equal(model.learnerUi.resultPanels.rawInternalIdsVisible, false);
  assert.equal(model.learnerUi.resultPanels.shortestLegalRouteComparisonAvailableAfterSubmit, true);
  assert.equal(model.learnerUi.resultPanels.shortestLegalRouteComparisonKeepsAttemptVisible, true);
  assert.equal(model.learnerUi.resultPanels.shortestLegalRouteComparisonActionLabel, "Show shortest legal route");
  assert.equal(model.learnerUi.instructionArea.visibleInstructionAreaCount, 1);
  assert.equal(model.learnerUi.instructionArea.mapWorkspaceInstructionVisible, false);
  assert.equal(
    model.learnerUi.instructionArea.instructionText,
    "Draw from the start marker to the destination marker. Visit checkpoints in order and follow road restrictions."
  );
  assert.equal(
    model.learnerUi.instructionArea.panModeText,
    "Pan mode is on. Drag the map to move the view. Switch back to Draw to add route strokes."
  );
  assert.equal(model.learnerUi.routeStatus.badgeCount, 1);
  assert.deepEqual(model.learnerUi.routeStatus.labels, ["Not started", "Drawing", "Ready to submit", "Submitted"]);
  assert.equal(model.learnerUi.legendControl.presentation, "compact-collapsible-layer-control");
  assert.equal(model.learnerUi.legendControl.collapsedByDefault, true);
  assert.equal(model.learnerUi.legendControl.scrollbarHeavyPanel, false);
  assert.equal(model.learnerUi.legendControl.rawOsmTagsVisible, false);
  assert.equal(model.learnerUi.legendControl.learnerRestrictionEntriesVisible, true);
  assert.equal(model.learnerUi.legendControl.restrictionToggleVisible, true);
  assert.equal(model.learnerUi.hiddenTechnicalDetails.rawOsmNodeIds, true);
  assert.equal(model.learnerUi.hiddenTechnicalDetails.rawGraphIds, true);
  assert.equal(model.learnerUi.hiddenTechnicalDetails.rawRoadIds, true);
  assert.equal(model.learnerUi.hiddenTechnicalDetails.localRouteAttemptIds, true);
  assert.equal(model.learnerUi.hiddenTechnicalDetails.fixtureIds, true);
  assert.equal(model.learnerUi.hiddenTechnicalDetails.technicalPerLegLabels, true);
  assert.equal(model.learnerUi.hiddenTechnicalDetails.debugDiagnostics, true);
  assert.equal(model.learnerUi.feedbackEntryPoints, 1);
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
  assert.equal(model.mobileLayout.mapFirstLayout, true);
  assert.equal(model.mobileLayout.taskSummaryVisible, true);
  assert.equal(model.mobileLayout.compactSelector, true);
  assert.equal(model.mobileLayout.combinedExerciseAndRecommendationPanel, true);
  assert.equal(model.mobileLayout.duplicateRecommendedPracticePanel, false);
  assert.equal(model.mobileLayout.compactMapControls, true);
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
  assert.equal(model.mobileLayout.baseRestrictionOverlaysDefaultVisible, true);
  assert.equal(model.devDiagnostics.visible, false);
  assert.ok(model.devDiagnostics.hiddenPanelIds.includes("full-restriction-debug-details"));
});

test("Stage 139 mobile feedback and map interaction affordances stay usable", () => {
  const model = requireAvailableModel();

  assert.equal(model.feedback.visible, true);
  assert.equal(model.mobileLayout.feedbackFormMobileSafe, true);
  assert.equal(model.mobileLayout.feedbackMinTouchTargetPx, 44);
  assert.equal(model.mobileLayout.routeRunnerMapMinHeightPx, 360);
  assert.equal(model.mobileLayout.routeRunnerMapPreferredMinHeightPx, 420);
  assert.equal(model.mobileLayout.routeRunnerMapTouchAction, "none");
  assert.equal(model.mapInteraction.drawingEnabled, true);
  assert.equal(model.mapInteraction.clearActionLabel, "Erase route");
  assert.equal(model.mapInteraction.submitActionLabel, "Submit");
});

test("Stage 156 mobile and tablet map readability contract uses central touch-safe values", () => {
  const model = requireAvailableModel();

  assert.equal(model.mobileLayout.mapFirstLayout, true);
  assert.equal(model.mobileLayout.mapControlsMinTouchTargetPx, 44);
  assert.equal(model.mobileLayout.mapControlsAvoidPrimaryMarkers, true);
  assert.equal(model.mobileLayout.mapLegendCollapsedByDefault, true);
  assert.equal(model.mobileLayout.mapLegendMaxHeightPx, REAL_LONDON_BETA_COMPACT_LEGEND_MAX_HEIGHT_PX);
  assert.equal(model.mobileLayout.markerHitTargetMinPx, 44);
  assert.ok(model.mobileLayout.reviewIssueHitTargetMinPx > model.mobileLayout.markerHitTargetMinPx);
  assert.ok(model.mobileLayout.calloutMinHeightPx >= 34);
  assert.equal(model.mobileLayout.routeRunnerMapPreferredMinHeightPx, 420);
  assert.equal(model.mobileLayout.routeRunnerTabletMapPreferredMinHeightPx, 560);
  assert.equal(model.mobileLayout.routeRunnerLandscapeMapPreferredMinHeightPx, 360);
  assert.ok(
    model.mobileLayout.routeRunnerTabletMapPreferredMinHeightPx >
      model.mobileLayout.routeRunnerMapPreferredMinHeightPx
  );
  assert.equal(model.mobileLayout.horizontalOverflowRisk, false);
});

test("Stage 139 one-way arrow visual thinning remains presentation-only", () => {
  const model = requireAvailableModel();

  assert.equal(ONE_WAY_ARROW_MIN_SPACING_METERS, 56);
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

test("Stage 161.6 beta screen exposes curated Real London map choices", () => {
  const model = buildRealLondonBetaPracticeScreenModel({ betaEnabled: true });

  assert.equal(model.state, "available");

  if (model.state !== "available") {
    throw new Error("Expected available beta practice screen.");
  }

  const mapIds = model.mapRows.map((row) => row.id);

  assert.ok(mapIds.includes("marlowe-district-dev-map"));
  assert.ok(mapIds.includes("osm-real-london-pilot"));
  assert.ok(mapIds.includes("osm-curated-piccadilly-circus"));
  assert.ok(mapIds.includes("osm-curated-waterloo-bridge"));
  assert.ok(mapIds.includes("osm-curated-one-way-system-area"));
  assert.ok(mapIds.includes("osm-curated-quiet-residential-roads"));
  assert.ok(mapIds.includes("osm-curated-kings-cross-euston"));
  assert.ok(mapIds.includes("osm-curated-centralLondon"));
  assert.ok(model.mapRows.every((row) => row.description.length > 0));
  assert.ok(model.mapRows.every((row) => row.fixtureUseLabel.length > 0));
  assert.ok(model.mapRows.every((row) => row.visibleInBeta));
  const marloweRow = model.mapRows.find((row) => row.id === "marlowe-district-dev-map");
  const kingsCrossRow = model.mapRows.find((row) => row.id === "osm-curated-kings-cross-euston");
  const centralLondonRow = model.mapRows.find((row) => row.id === "osm-curated-centralLondon");

  assert.ok(marloweRow);
  assert.ok(kingsCrossRow);
  assert.ok(centralLondonRow);
  assert.equal(marloweRow.label, "Marlowe District - Fictional London-style practice");
  assert.match(marloweRow.description, /Fictional London-style practice/);
  assert.doesNotMatch(marloweRow.label, /Real London|OSM/i);
  assert.equal(marloweRow.fixtureUseLabel, "Scored practice");
  assert.equal(marloweRow.scoreable, true);
  assert.equal(marloweRow.betaPracticeAllowed, true);
  assert.equal(kingsCrossRow.fixturePerformanceGate, "betaPracticeAllowedWithLoading");
  assert.equal(kingsCrossRow.lazyLoadId, "kingsCrossEuston");
  assert.equal(centralLondonRow.fixtureUseLabel, "Stress test / slow");
  assert.equal(centralLondonRow.fixturePerformanceGate, "devOnlyStressTest");
  assert.equal(centralLondonRow.lazyLoadId, "centralLondonStressTest");
  assert.equal(centralLondonRow.scoreable, false);
  assert.equal(centralLondonRow.visualQaOnly, true);
  assert.equal(centralLondonRow.devOnlyStressTest, true);
  assert.equal(centralLondonRow.betaPracticeAllowed, false);
});

test("Stage 161.6.19 beta screen can select Marlowe District fictional scored practice", () => {
  const model = buildRealLondonBetaPracticeScreenModel({
    betaEnabled: true,
    requestedMapId: "marlowe-district-dev-map"
  });

  assert.equal(model.state, "available");

  if (model.state !== "available") {
    throw new Error("Expected available Marlowe beta practice screen.");
  }

  assert.equal(model.mapId, "marlowe-district-dev-map");
  assert.equal(model.selectedMap.label, "Marlowe District - Fictional London-style practice");
  assert.match(model.selectedMap.description, /Fictional London-style practice/);
  assert.equal(model.selectedMap.fixtureUse, "routableExercise");
  assert.equal(model.selectedMap.fixtureUseLabel, "Scored practice");
  assert.equal(model.selectedMap.scoreable, true);
  assert.equal(model.selectedMap.fixturePerformanceGate, "betaPracticeAllowed");
  assert.equal(model.attribution, "Fictional practice map");
  assert.doesNotMatch(model.attribution, /OpenStreetMap/i);
  assert.ok(model.exerciseRows.length >= 3);
  assert.ok(model.selectedExercise);
  assert.ok(model.exerciseRows.every((row) => row.title.length > 0));
  assert.ok(model.exerciseRows.some((row) => row.id === "ex-station-to-hospital"));
  assert.equal(model.exerciseRows.some((row) => row.id === "ex-no-entry-eastgate-market"), false);
  assert.equal(model.routeFlow.shortestRouteFound, true);
  assert.equal(model.routeFlow.existingRunnerScorePassed, true);
  assert.equal(model.mapInteraction.mapSwitchClearsAttemptState, true);
});

test("Stage 161.6.19 Marlowe beta exercises are validated and restrictions still fail illegal routes", () => {
  const model = buildRealLondonBetaPracticeScreenModel({
    betaEnabled: true,
    requestedMapId: "marlowe-district-dev-map",
    selectedExerciseId: "ex-station-to-hospital"
  });

  assert.equal(model.state, "available");

  if (model.state !== "available" || !model.selectedExercise) {
    throw new Error("Expected selected Marlowe beta exercise.");
  }

  assert.equal(model.selectedExercise.id, "ex-station-to-hospital");
  assert.equal(model.routeFlow.shortestRouteFound, true);
  assert.equal(model.routeFlow.existingRunnerScorePassed, true);

  const illegalResult = runRouteExercise({
    map: marloweDistrictMap,
    exercises: marloweDistrictRouteExercises,
    exerciseId: "ex-station-to-hospital",
    userRoute: {
      nodeIds: ["n14", "n13", "n14", "n18", "n17", "n12", "n04", "n05", "n09"],
      roadIds: ["r14", "r14", "r26", "r22", "r24", "r16", "r04", "r15"]
    }
  });

  assert.equal(illegalResult.score.passed, false);
  assert.equal(illegalResult.score.automaticFail, true);
  assert.ok(illegalResult.score.failureReasons.includes("illegal_route"));
  assert.ok(illegalResult.score.legality.illegalMovements.some((movement) => movement.type === "no_entry"));
});

test("Stage 161.6 beta screen can select a curated routable fixture", () => {
  const model = buildRealLondonBetaPracticeScreenModel({
    betaEnabled: true,
    requestedMapId: "osm-curated-quiet-residential-roads"
  });

  assert.equal(model.state, "available");

  if (model.state !== "available") {
    throw new Error("Expected available beta practice screen.");
  }

  assert.equal(model.mapId, "osm-curated-quiet-residential-roads");
  assert.equal(model.selectedMap.fixtureUse, "routableExercise");
  assert.equal(model.selectedMap.scoreable, true);
  assert.match(model.attribution, /OpenStreetMap/i);
  assert.ok(model.selectedExercise);
  assert.equal(model.routeFlow.shortestRouteFound, true);
  assert.equal(model.routeFlow.existingRunnerScorePassed, true);
  assert.equal(model.mapInteraction.mapSwitchClearsAttemptState, true);
});

test("Stage 161.6.3 beta screen deterministically selects requested curated map and exercise", () => {
  const model = buildRealLondonBetaPracticeScreenModel({
    betaEnabled: true,
    requestedMapId: "osm-curated-waterloo-bridge",
    selectedExerciseId: "osm-curated-waterloo-bridge-station-context-checkpoint"
  });

  assert.equal(model.state, "available");

  if (model.state !== "available") {
    throw new Error("Expected available beta practice screen.");
  }

  assert.equal(model.mapId, "osm-curated-waterloo-bridge");
  assert.equal(model.selectedExercise?.id, "osm-curated-waterloo-bridge-station-context-checkpoint");
  assert.equal(model.selectedExercise?.title, "Waterloo Bridge: riverside checkpoint route");
  assert.equal(model.exerciseRows.filter((row) => row.selected).length, 1);
  assert.equal(model.routeFlow.shortestRouteFound, true);
  assert.equal(model.routeFlow.existingRunnerScorePassed, true);
});

test("Stage 161.6.3 imported curated maps expose multiple scoreable beta exercises", () => {
  const expectedImportedMapIds = [
    "osm-curated-piccadilly-circus",
    "osm-curated-waterloo-bridge",
    "osm-curated-one-way-system-area",
    "osm-curated-quiet-residential-roads"
  ];

  for (const mapId of expectedImportedMapIds) {
    const model = buildRealLondonBetaPracticeScreenModel({
      betaEnabled: true,
      requestedMapId: mapId
    });

    assert.equal(model.state, "available", mapId);

    if (model.state !== "available") {
      throw new Error(`Expected available beta practice screen for ${mapId}.`);
    }

    assert.equal(model.mapId, mapId);
    assert.equal(model.selectedMap.fixtureUse, "routableExercise");
    assert.equal(model.selectedMap.scoreable, true);
    assert.equal(model.exerciseRows.length, 3, mapId);
    assert.equal(model.exerciseRows.filter((row) => row.selected).length, 1, mapId);
    assert.ok(model.exerciseRows.some((row) => row.routeType === "direct" || row.routeType === "one-way-awareness"), mapId);
    assert.ok(
      mapId === "osm-curated-one-way-system-area"
        ? model.exerciseRows.every((row) => row.routeType === "one-way-awareness")
        : model.exerciseRows.some((row) => row.routeType === "checkpoint"),
      mapId
    );
    assert.equal(model.routeFlow.shortestRouteFound, true, mapId);
    assert.equal(model.routeFlow.existingRunnerScorePassed, true, mapId);
  }
});

test("Stage 161.8.4 beta screen labels King's Cross as lazy loaded scored practice", () => {
  const model = buildRealLondonBetaPracticeScreenModel({
    betaEnabled: true,
    requestedMapId: "osm-curated-kings-cross-euston"
  });

  assert.equal(model.state, "available");

  if (model.state !== "available") {
    throw new Error("Expected available King's Cross beta practice screen.");
  }

  assert.equal(model.mapId, "osm-curated-kings-cross-euston");
  assert.equal(model.selectedMap.fixtureUse, "routableExercise");
  assert.equal(model.selectedMap.scoreable, true);
  assert.equal(model.selectedMap.fixturePerformanceGate, "betaPracticeAllowedWithLoading");
  assert.equal(model.selectedMap.lazyLoadId, "kingsCrossEuston");
  assert.equal(model.selectedMap.lazyLoadingLabel, "Loading King's Cross / Euston map...");
  assert.equal(model.exerciseRows.length, 0);
  assert.equal(model.selectedExercise, null);
  assert.equal(model.routeFlow.shortestRouteFound, false);
  assert.equal(model.routeFlow.existingRunnerScorePassed, false);
});

test("Stage 161.6.4 curated route exercise selector changes active stops and route flow", () => {
  const mapId = "osm-curated-one-way-system-area";
  const exerciseIds = [
    "osm-curated-one-way-system-area-short-one-way-route",
    "osm-curated-one-way-system-area-restriction-checkpoint-route",
    "osm-curated-one-way-system-area-longer-one-way-route"
  ];
  const selectedModels = exerciseIds.map((selectedExerciseId) => {
    const model = buildRealLondonBetaPracticeScreenModel({
      betaEnabled: true,
      requestedMapId: mapId,
      selectedExerciseId
    });

    assert.equal(model.state, "available", selectedExerciseId);

    if (model.state !== "available" || !model.selectedExercise) {
      throw new Error(`Expected selected scoreable exercise for ${selectedExerciseId}.`);
    }

    assert.equal(model.mapId, mapId);
    assert.equal(model.selectedExercise.id, selectedExerciseId);
    assert.deepEqual(
      model.exerciseRows.map((row) => [row.id, row.selected]),
      exerciseIds.map((exerciseId) => [exerciseId, exerciseId === selectedExerciseId])
    );
    assert.equal(model.routeFlow.shortestRouteFound, true);
    assert.equal(model.routeFlow.existingRunnerScorePassed, true);

    return model;
  });

  assert.ok(new Set(selectedModels.map((model) => model.selectedExercise.compactStopSummary)).size > 1);
  assert.ok(new Set(selectedModels.map((model) => model.routeFlow.selectedEdgeCount)).size > 1);
});

test("Stage 161.6.4 every imported curated map resolves each offered route exercise", () => {
  const expectedImportedMapIds = [
    "osm-curated-piccadilly-circus",
    "osm-curated-waterloo-bridge",
    "osm-curated-one-way-system-area",
    "osm-curated-quiet-residential-roads"
  ];

  for (const mapId of expectedImportedMapIds) {
    const initialModel = buildRealLondonBetaPracticeScreenModel({
      betaEnabled: true,
      requestedMapId: mapId
    });

    assert.equal(initialModel.state, "available", mapId);

    if (initialModel.state !== "available") {
      throw new Error(`Expected available beta practice screen for ${mapId}.`);
    }

    for (const row of initialModel.exerciseRows) {
      const selectedModel = buildRealLondonBetaPracticeScreenModel({
        betaEnabled: true,
        requestedMapId: mapId,
        selectedExerciseId: row.id
      });

      assert.equal(selectedModel.state, "available", `${mapId} ${row.id}`);

      if (selectedModel.state !== "available" || !selectedModel.selectedExercise) {
        throw new Error(`Expected selected beta practice exercise for ${mapId} ${row.id}.`);
      }

      assert.equal(selectedModel.selectedExercise.id, row.id);
      assert.equal(selectedModel.exerciseRows.filter((exerciseRow) => exerciseRow.selected).length, 1);
      assert.equal(selectedModel.routeFlow.shortestRouteFound, true);
      assert.equal(selectedModel.routeFlow.existingRunnerScorePassed, true);
      assert.ok(selectedModel.selectedExercise.startLabel.length > 0);
      assert.ok(selectedModel.selectedExercise.destinationLabel.length > 0);
    }
  }
});

test("Stage 161.6 visual QA fixtures are labelled and not treated as scoreable practice", () => {
  const visualOnlyOption: RouteRunnerMapOption = {
    id: "osm-curated-visual-only-test",
    label: "Visual-only curated test",
    description: "Visual-only map selector regression fixture.",
    source: "converted-osm",
    map: {
      ...marloweDistrictMap,
      id: "osm-curated-visual-only-test",
      name: "Visual-only curated test"
    },
    exercises: [],
    defaultExerciseId: "",
    attribution: "OpenStreetMap contributors",
    devOnly: true,
    fixtureUse: "visualQaOnly"
  };
  const model = buildRealLondonBetaPracticeScreenModel({
    betaEnabled: true,
    requestedMapId: visualOnlyOption.map.id,
    mapOptions: [...REAL_LONDON_BETA_MAP_OPTIONS, visualOnlyOption]
  });

  assert.equal(model.state, "available");

  if (model.state !== "available") {
    throw new Error("Expected available beta practice screen.");
  }

  assert.equal(model.selectedMap.fixtureUse, "visualQaOnly");
  assert.equal(model.selectedMap.scoreable, false);
  assert.equal(model.selectedExercise, null);
  assert.equal(model.exerciseRows.length, 0);
  assert.equal(model.routeFlow.shortestRouteFound, false);
  assert.equal(model.routeFlow.existingRunnerScorePassed, false);
});

test("Stage 161.6.9 centralLondon stress fixture is visible on beta practice without scoring", () => {
  const model = buildRealLondonBetaPracticeScreenModel({
    betaEnabled: true,
    requestedMapId: "osm-curated-centralLondon"
  });

  assert.equal(model.state, "available");

  if (model.state !== "available") {
    throw new Error("Expected available Central London stress fixture.");
  }

  assert.equal(model.mapId, "osm-curated-centralLondon");
  assert.equal(model.selectedMap.fixtureUseLabel, "Stress test / slow");
  assert.equal(model.selectedMap.scoreable, false);
  assert.equal(model.selectedMap.visualQaOnly, true);
  assert.equal(model.selectedMap.devOnlyStressTest, true);
  assert.equal(model.selectedMap.lazyLoadId, "centralLondonStressTest");
  assert.equal(model.selectedMap.lazyLoadingLabel, "Loading Central London stress-test map...");
  assert.equal(model.exerciseRows.length, 0);
  assert.equal(model.selectedExercise, null);
  assert.equal(model.routeFlow.shortestRouteFound, false);
  assert.equal(model.routeFlow.existingRunnerScorePassed, false);
  assert.equal(model.mapInteraction.mapSwitchClearsAttemptState, true);
  assert.equal(
    REAL_LONDON_BETA_MAP_OPTIONS.flatMap((option) => option.exercises).some((exercise) =>
      exercise.id.includes("centralLondon")
    ),
    false
  );
});

test("Stage 161.6.1 beta desktop map sizing fills width and remains viewport bounded", () => {
  const model = requireAvailableModel();

  assert.equal(model.desktopLayout.fillsAvailablePracticePanelWidth, true);
  assert.equal(model.desktopLayout.viewportBoundedMap, true);
  assert.equal(model.desktopLayout.mapWidthCss, REAL_LONDON_BETA_DESKTOP_MAP_WIDTH_CSS);
  assert.equal(model.desktopLayout.mapMaxWidthRule, REAL_LONDON_BETA_DESKTOP_MAP_MAX_WIDTH_RULE);
  assert.equal(model.desktopLayout.mapMaxHeightCss, REAL_LONDON_BETA_DESKTOP_MAP_MAX_HEIGHT_CSS);
  assert.equal(model.desktopLayout.canvasWidthPx, REAL_LONDON_BETA_DESKTOP_CANVAS_WIDTH_PX);
  assert.equal(model.desktopLayout.canvasHeightPx, REAL_LONDON_BETA_DESKTOP_CANVAS_HEIGHT_PX);
  assert.equal(model.desktopLayout.canvasHeightIncreaseRatio, 1.2);
  assert.equal(model.desktopLayout.preservesCartographicProportions, true);
  assert.equal(model.desktopLayout.artificiallyCappedSmallWidth, false);
  assert.equal(model.desktopLayout.unnecessaryVerticalScrollRisk, false);
});

test("Stage 161.6 curated map option bundle is the beta practice catalogue", () => {
  assert.equal(REAL_LONDON_BETA_MAP_OPTIONS, ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON);
});

function requireAvailableModel(selectedExerciseId?: string): ScoreablePracticeModel {
  const model = buildRealLondonBetaPracticeScreenModel({
    betaEnabled: true,
    selectedExerciseId
  });

  if (model.state !== "available") {
    throw new Error("Expected available beta practice screen.");
  }

  if (!model.selectedExercise) {
    throw new Error("Expected a selected scoreable beta practice exercise.");
  }

  return model as ScoreablePracticeModel;
}
