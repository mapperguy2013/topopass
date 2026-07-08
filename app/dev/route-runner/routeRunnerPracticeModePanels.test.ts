import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildDevToolsHomeModel } from "../devTools.ts";
import {
  DEV_TRAINING_ROUTE_AUTHOR_PATH,
  addTrainingRouteAuthorCheckpoint,
  appendTrainingRouteAuthorStrokePoint,
  classifyShortestRouteComparison,
  buildTrainingRouteAuthorModel,
  clearTrainingRouteAuthorCheckpoints,
  clearTrainingRouteAuthorRoute,
  compareTrainingRouteAuthorShortestRoute,
  createEmptyTrainingRouteAuthorState,
  createSampleTrainingRouteAuthorState,
  dominantTrainingRouteAuthorWheelDelta,
  finishTrainingRouteAuthorStroke,
  getTrainingRouteAuthorMap,
  setTrainingRouteAuthorDestination,
  setTrainingRouteAuthorMode,
  setTrainingRouteAuthorStart,
  shouldIsolateTrainingRouteAuthorMapWheel,
  shouldIsolateTrainingRouteAuthorPointer,
  startTrainingRouteAuthorStroke,
  updateTrainingRouteAuthorMetadataField,
  validateTrainingRouteAuthorState
} from "../training-route/trainingRouteAuthor.ts";
import {
  ROUTE_RUNNER_BETA_CORE_PANEL_LABELS,
  ROUTE_RUNNER_DEV_ONLY_PANEL_LABELS,
  buildRouteRunnerPracticeModePanelVisibility
} from "./routeRunnerPracticeModePanels.ts";

test("beta practice mode hides dev-only route-runner panel labels", () => {
  const visibility = buildRouteRunnerPracticeModePanelVisibility({ mode: "student-beta" });

  assert.equal(visibility.showDeveloperPanels, false);
  assert.deepEqual(visibility.visibleDevOnlyPanelLabels, []);
  assert.deepEqual(visibility.hiddenDevOnlyPanelLabels, [...ROUTE_RUNNER_DEV_ONLY_PANEL_LABELS]);
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("Restriction overlays"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("Pipeline debug result"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("Manual route input"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("Manual run result"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("OSM debug"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("OSM QA"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("Exercise QA"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("Show graph overlay"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("Show node / segment IDs"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("Converted OSM QA"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("Road candidate IDs"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("Matched road IDs"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("Matched node IDs"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("Directed edge IDs"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("Blocked OSM way IDs"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("Real London Pilot QA"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("Learning dashboard"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("Adaptive practice queue"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("raw debug"));
});

test("dev route-runner mode keeps dev-only route-runner panel labels available", () => {
  const visibility = buildRouteRunnerPracticeModePanelVisibility({ mode: "dev" });

  assert.equal(visibility.showDeveloperPanels, true);
  assert.deepEqual(visibility.visibleDevOnlyPanelLabels, [...ROUTE_RUNNER_DEV_ONLY_PANEL_LABELS]);
  assert.deepEqual(visibility.hiddenDevOnlyPanelLabels, []);
  assert.ok(visibility.visibleDevOnlyPanelLabels.includes("Manual route input"));
  assert.ok(visibility.visibleDevOnlyPanelLabels.includes("Converted OSM QA"));
  assert.ok(visibility.visibleDevOnlyPanelLabels.includes("OSM QA"));
  assert.ok(visibility.visibleDevOnlyPanelLabels.includes("Exercise QA"));
  assert.ok(visibility.visibleDevOnlyPanelLabels.includes("Show graph overlay"));
  assert.ok(visibility.visibleDevOnlyPanelLabels.includes("Show node / segment IDs"));
  assert.ok(visibility.visibleDevOnlyPanelLabels.includes("Manual run result"));
  assert.ok(visibility.visibleDevOnlyPanelLabels.includes("Learning dashboard"));
});

test("beta practice mode preserves core student-facing route-runner labels", () => {
  const visibility = buildRouteRunnerPracticeModePanelVisibility({ mode: "student-beta" });

  assert.deepEqual(visibility.visibleCorePanelLabels, [...ROUTE_RUNNER_BETA_CORE_PANEL_LABELS]);
  assert.ok(visibility.visibleCorePanelLabels.includes("Real London Practice - Beta"));
  assert.ok(visibility.visibleCorePanelLabels.includes("Practice Exercises"));
  assert.ok(visibility.visibleCorePanelLabels.includes("Training Mode"));
  assert.ok(visibility.visibleCorePanelLabels.includes("Route instructions"));
  assert.ok(visibility.visibleCorePanelLabels.includes("Practice map"));
  assert.ok(visibility.visibleCorePanelLabels.includes("Route feedback"));
  assert.ok(visibility.visibleCorePanelLabels.includes("Submit"));
  assert.equal((visibility.visibleCorePanelLabels as readonly string[]).includes("Route map workspace"), false);
  assert.equal((visibility.visibleCorePanelLabels as readonly string[]).includes("Attempt review"), false);
  assert.equal((visibility.visibleCorePanelLabels as readonly string[]).includes("Submit Attempt"), false);
});

test("dev tools home exposes route-runner and curated training authoring tools", () => {
  const model = buildDevToolsHomeModel();
  const hrefs = model.cards.map((card) => card.href);
  const pageSource = readFileSync("app/dev/page.tsx", "utf8");

  assert.equal(model.path, "/dev");
  assert.equal(model.linkedFromLearnerNavigation, false);
  assert.ok(hrefs.includes("/dev/route-runner"));
  assert.ok(hrefs.includes(DEV_TRAINING_ROUTE_AUTHOR_PATH));
  assert.ok(hrefs.includes("/dev/beta-feedback"));
  assert.ok(hrefs.includes("/dev/beta-attempts"));
  assert.match(pageSource, /TOPOPASS Dev Tools/);
  assert.match(pageSource, /Internal dev tools/);
});

test("dev route-runner keeps existing RouteRunnerClient workspace available", () => {
  const pageSource = readFileSync("app/dev/route-runner/page.tsx", "utf8");

  assert.match(pageSource, /Dev Route Runner/);
  assert.match(pageSource, /RouteRunnerClient/);
  assert.match(pageSource, /ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON/);
  assert.match(pageSource, /href="\/dev"/);
});

test("curated training route author page renders the interactive authoring client", () => {
  const pageSource = readFileSync("app/dev/training-route/page.tsx", "utf8");
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");
  const mapIndex = clientSource.indexOf("Map authoring workspace");
  const metadataIndex = clientSource.indexOf("Route metadata");
  const exportIndex = clientSource.indexOf("Export panel");

  assert.match(pageSource, /Curated Training Route Author/);
  assert.match(pageSource, /TrainingRouteAuthorClient/);
  assert.match(clientSource, /buildTrainingRouteAuthorModel/);
  assert.match(clientSource, /Interactive Real London training route authoring map/);
  assert.match(clientSource, /Map authoring workspace/);
  assert.ok(mapIndex > -1);
  assert.ok(metadataIndex > mapIndex);
  assert.ok(exportIndex > metadataIndex);
  assert.match(clientSource, /Route metadata/);
  assert.match(clientSource, /Validation panel/);
  assert.match(clientSource, /Shortest route comparison/);
  assert.match(clientSource, /Export panel/);
  assert.match(clientSource, /Curated route JSON export/);
  assert.doesNotMatch(clientSource, /RouteRunnerClient/);
});

test("curated training route author toolbar exposes the route creation workflow", () => {
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");
  const model = buildTrainingRouteAuthorModel();
  const labels = model.toolbarActions.map((action) => action.label);

  assert.deepEqual(labels, [
    "Pan",
    "Set start",
    "Draw route",
    "Add checkpoint",
    "Set destination",
    "Undo",
    "Remove last checkpoint",
    "Clear route",
    "Clear checkpoints",
    "Reset view",
    "Validate route",
    "Compare shortest route",
    "Export JSON"
  ]);
  assert.equal(model.toolbarActions.find((action) => action.id === "validate-route")?.disabled, true);
  assert.equal(model.toolbarActions.find((action) => action.id === "compare-shortest-route")?.disabled, true);
  assert.equal(model.toolbarActions.find((action) => action.id === "export-json")?.disabled, true);
  assert.match(clientSource, /role="toolbar"/);
});

test("curated training route author wheel events isolate map zoom from page scroll", () => {
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");

  assert.equal(shouldIsolateTrainingRouteAuthorMapWheel({ targetInsideMap: true, deltaX: 0, deltaY: 120 }), true);
  assert.equal(shouldIsolateTrainingRouteAuthorMapWheel({ targetInsideMap: true, deltaX: 48, deltaY: 0 }), true);
  assert.equal(shouldIsolateTrainingRouteAuthorMapWheel({ targetInsideMap: false, deltaX: 0, deltaY: 120 }), false);
  assert.equal(shouldIsolateTrainingRouteAuthorMapWheel({ targetInsideMap: true, deltaX: 0, deltaY: 0 }), false);
  assert.equal(dominantTrainingRouteAuthorWheelDelta({ deltaX: 40, deltaY: 10 }), 40);
  assert.match(clientSource, /addEventListener\("wheel", handleNativeWheel, \{ passive: false \}\)/);
  assert.match(clientSource, /event\.preventDefault\(\)/);
  assert.match(clientSource, /event\.stopPropagation\(\)/);
  assert.doesNotMatch(clientSource, /onWheel=\{handleMapWheel\}/);
});

test("curated training route author pointer modes isolate map drags without trapping page scroll elsewhere", () => {
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");

  for (const activeMode of ["pan", "draw-route", "set-start", "add-checkpoint", "set-destination"] as const) {
    assert.equal(shouldIsolateTrainingRouteAuthorPointer({ targetInsideMap: true, activeMode }), true);
    assert.equal(shouldIsolateTrainingRouteAuthorPointer({ targetInsideMap: false, activeMode }), false);
  }

  assert.match(clientSource, /kind: "select"/);
  assert.match(clientSource, /setPointerCapture\?\.\(event\.pointerId\)/);
  assert.match(clientSource, /releasePointerCapture\?\.\(event\.pointerId\)/);
  assert.match(clientSource, /touch-none select-none overscroll-contain/);
  assert.match(clientSource, /ref=\{mapSvgRef\}/);
});

test("curated training route author keeps map controls clickable outside the isolated viewport", () => {
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");

  assert.match(clientSource, /role="toolbar"/);
  assert.match(clientSource, /onClick=\{\(\) => handleToolbarAction\(action\)\}/);
  assert.match(clientSource, /onChange=\{\(event\) => setShowRestrictions\(event\.target\.checked\)\}/);
  assert.match(clientSource, /svgElement\.addEventListener\("wheel"/);
  assert.doesNotMatch(clientSource, /document\.addEventListener\("wheel"/);
});

test("curated training route author hides unrelated route-runner panels by default", () => {
  const pageSource = readFileSync("app/dev/training-route/page.tsx", "utf8");
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");
  const combinedSource = `${pageSource}\n${clientSource}`;

  assert.doesNotMatch(combinedSource, /Training Mode/);
  assert.doesNotMatch(combinedSource, /Practice Exercises/);
  assert.doesNotMatch(combinedSource, /Adaptive Practice/);
  assert.doesNotMatch(combinedSource, /Manual route input/);
  assert.doesNotMatch(combinedSource, /Attempt Review/);
  assert.match(combinedSource, /Advanced diagnostics/);
});

test("curated training route author starts empty and does not export fake route data", () => {
  const model = buildTrainingRouteAuthorModel();

  assert.equal(model.exportReadiness.ready, false);
  assert.equal(model.validationRunStatus, "not-run");
  assert.equal(model.comparisonRunStatus, "not-run");
  assert.equal(model.exportData.routeSegmentIds.length, 0);
  assert.equal(model.exportData.nodeIds.length, 0);
  assert.equal(model.sampleLoaded, false);
  assert.equal(model.authoringSteps.find((step) => step.label === "Set start")?.complete, false);
  assert.equal(model.authoringSteps.find((step) => step.label === "Draw route")?.complete, false);
});

test("curated training route author sample can produce Stage 19 route contract metadata", () => {
  const state = compareTrainingRouteAuthorShortestRoute(validateTrainingRouteAuthorState(createSampleTrainingRouteAuthorState()));
  const model = buildTrainingRouteAuthorModel({ state });
  const fieldIds = model.metadataFields.map((field) => field.id);

  assert.equal(model.path, DEV_TRAINING_ROUTE_AUTHOR_PATH);
  assert.equal(model.exportData.schemaVersion, 1);
  assert.equal(model.exportData.mapId, model.sourceMapId);
  assert.ok(model.exportData.metadata.routeId.length > 0);
  assert.ok(model.exportData.start.nodeId.length > 0);
  assert.ok(model.exportData.destination.nodeId.length > 0);
  assert.ok(Array.isArray(model.exportData.checkpoints));
  assert.ok(model.exportData.routeSegmentIds.length > 0);
  assert.ok(model.exportData.complexitySummary.segmentCount > 0);
  assert.ok(model.exportJson.includes('"validationSummary"'));
  assert.ok(model.exportJson.includes('"complexitySummary"'));
  assert.ok(model.exportJson.includes('"shortestRouteComparison"'));
  assert.ok(model.exportReadiness.ready);
  assert.deepEqual(fieldIds, [
    "routeId",
    "title",
    "area",
    "difficulty",
    "exerciseType",
    "description",
    "objective",
    "skillsPractised",
    "expectedLearnerMistakes",
    "hintSequence",
    "scoringEmphasis",
    "instructorFeedbackNotes",
    "routeChoiceJustification",
    "status"
  ]);
  assert.equal(model.exportData.shortestRouteComparison.directComparison.comparisonStatus, "available");
});

test("curated route author blocks approved status until validation is clean", () => {
  const state = updateTrainingRouteAuthorMetadataField(createEmptyTrainingRouteAuthorState(), "status", "approved");
  const model = buildTrainingRouteAuthorModel({
    state,
    statusOverride: "approved"
  });

  assert.equal(model.validation.valid, false);
  assert.equal(model.shortestRouteComparison.directComparison.comparisonStatus, "unknown");
  assert.equal(model.approvalWarning?.blocking, true);
  assert.match(model.approvalWarning?.message ?? "", /Approved routes must be validated/);
});

test("curated route author returns near-shortest when authored route matches shortest metrics", () => {
  const comparison = classifyShortestRouteComparison({
    authoredLengthMeters: 1000,
    shortestLengthMeters: 1000,
    authoredSegmentCount: 4,
    shortestSegmentCount: 4,
    authoredTurnCount: 2,
    shortestTurnCount: 2,
    authoredDecisionPointCount: 2,
    shortestDecisionPointCount: 2,
    shortestRouteSegmentIds: ["edge-a", "edge-b"]
  });

  assert.equal(comparison.comparisonStatus, "available");
  assert.equal(comparison.verdict, "shortest-or-near-shortest");
  assert.equal(comparison.percentageLonger, 0);
  assert.deepEqual(comparison.shortestRouteSegmentIds, ["edge-a", "edge-b"]);
});

test("curated route author returns detour warning when authored route is much longer", () => {
  const comparison = classifyShortestRouteComparison({
    authoredLengthMeters: 1550,
    shortestLengthMeters: 1000,
    authoredSegmentCount: 9,
    shortestSegmentCount: 4,
    authoredTurnCount: 6,
    shortestTurnCount: 2,
    authoredDecisionPointCount: 7,
    shortestDecisionPointCount: 2
  });

  assert.equal(comparison.comparisonStatus, "available");
  assert.equal(comparison.verdict, "major-detour-warning");
  assert.equal(comparison.percentageLonger, 55);
  assert.equal(comparison.segmentCountDelta, 5);
  assert.equal(comparison.turnCountDelta, 4);
});

test("curated route author handles incomplete shortest-route data safely", () => {
  const comparison = classifyShortestRouteComparison({
    authoredLengthMeters: 1000,
    shortestLengthMeters: 0,
    authoredSegmentCount: 4,
    shortestSegmentCount: 0,
    authoredTurnCount: 2,
    shortestTurnCount: 0,
    authoredDecisionPointCount: 2,
    shortestDecisionPointCount: 0
  });

  assert.equal(comparison.comparisonStatus, "unknown");
  assert.equal(comparison.verdict, "unknown");
  assert.equal(comparison.percentageLonger, null);
});

test("curated route author includes checkpoint-aware comparison or a graceful unsupported state", () => {
  const state = compareTrainingRouteAuthorShortestRoute(validateTrainingRouteAuthorState(createSampleTrainingRouteAuthorState()));
  const model = buildTrainingRouteAuthorModel({ state });

  assert.ok(
    ["available", "unknown", "not-applicable"].includes(
      model.shortestRouteComparison.checkpointConstrainedComparison.comparisonStatus
    )
  );
  assert.ok(model.exportJson.includes('"checkpointConstrainedComparison"'));
});

test("significantly longer curated routes require route choice justification before approval", () => {
  const state = updateTrainingRouteAuthorMetadataField(createSampleTrainingRouteAuthorState(), "routeChoiceJustification", "");
  const model = buildTrainingRouteAuthorModel({
    state,
    routeChoiceJustification: ""
  });
  const comparison = classifyShortestRouteComparison({
    authoredLengthMeters: 1500,
    shortestLengthMeters: 1000,
    authoredSegmentCount: 8,
    shortestSegmentCount: 4,
    authoredTurnCount: 5,
    shortestTurnCount: 2,
    authoredDecisionPointCount: 6,
    shortestDecisionPointCount: 2
  });

  assert.equal(comparison.verdict, "major-detour-warning");
  assert.equal(model.exportData.shortestRouteComparison.routeChoiceJustification.length, 0);
  assert.ok(model.metadataFields.some((field) => field.id === "routeChoiceJustification"));
});

test("curated route author export is blocked until required route data exists", () => {
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");
  const model = buildTrainingRouteAuthorModel();

  assert.equal(model.exportReadiness.ready, false);
  assert.ok(model.exportReadiness.checklist.some((item) => item.label === "Route drawn and matched" && !item.complete));
  assert.match(clientSource, /disabled=\{!model\.exportReadiness\.ready\}/);
});

test("curated route author exposes difficulty mismatch warnings in validation", () => {
  const state = createSampleTrainingRouteAuthorState();
  const model = buildTrainingRouteAuthorModel({
    state,
    difficultyOverride: "advanced"
  });

  assert.ok(
    model.complexitySummary.warnings.some(
      (warning) => warning.includes("Advanced curated routes") || warning.includes("difficulty")
    )
  );
});

test("curated route author buttons and map interactions update real author state", () => {
  const map = getTrainingRouteAuthorMap();
  const startNode = map.nodes[0];
  const checkpointNode = map.nodes[1];
  const destinationNode = map.nodes[2];
  let state = createEmptyTrainingRouteAuthorState();

  state = setTrainingRouteAuthorMode(state, "set-start");
  state = setTrainingRouteAuthorStart(state, startNode.id);
  state = setTrainingRouteAuthorMode(state, "add-checkpoint");
  state = addTrainingRouteAuthorCheckpoint(state, checkpointNode.id);
  state = setTrainingRouteAuthorMode(state, "set-destination");
  state = setTrainingRouteAuthorDestination(state, destinationNode.id);

  const model = buildTrainingRouteAuthorModel({ state });

  assert.equal(model.activeMode, "set-destination");
  assert.equal(model.routeStatusItems.find((item) => item.label === "Start")?.value, "selected");
  assert.equal(model.routeStatusItems.find((item) => item.label === "Destination")?.value, "selected");
  assert.equal(model.routeStatusItems.find((item) => item.label === "Checkpoints")?.value, "1");
});

test("curated route author draw route mode creates matched route state from map points", () => {
  const sample = createSampleTrainingRouteAuthorState();
  const sampleStroke = sample.routeDraft.strokes[0]?.points ?? [];
  let state = createEmptyTrainingRouteAuthorState();

  assert.ok(sampleStroke.length >= 2);
  state = setTrainingRouteAuthorStart(state, sample.startNodeId ?? "");
  state = setTrainingRouteAuthorDestination(state, sample.destinationNodeId ?? "");
  state = setTrainingRouteAuthorMode(state, "draw-route");
  state = startTrainingRouteAuthorStroke(state, sampleStroke[0]);
  for (const point of sampleStroke.slice(1, -1)) {
    state = appendTrainingRouteAuthorStrokePoint(state, point);
  }
  state = finishTrainingRouteAuthorStroke(state, sampleStroke[sampleStroke.length - 1]);

  assert.equal(state.routeMatchStatus, "matched");
  assert.ok(state.validationSegments.length > 0);
  assert.ok(state.routeNodeIds.length > 1);
});

test("curated route author clear actions isolate route and checkpoints", () => {
  const sample = createSampleTrainingRouteAuthorState();
  const routeCleared = clearTrainingRouteAuthorRoute(sample);
  const checkpointsCleared = clearTrainingRouteAuthorCheckpoints(sample);

  assert.equal(routeCleared.validationSegments.length, 0);
  assert.equal(routeCleared.checkpointNodeIds.length, sample.checkpointNodeIds.length);
  assert.equal(checkpointsCleared.checkpointNodeIds.length, 0);
  assert.ok(checkpointsCleared.validationSegments.length > 0);
});

test("curated route author validates, compares, and exports current authored metadata", () => {
  let state = createSampleTrainingRouteAuthorState();

  state = updateTrainingRouteAuthorMetadataField(state, "title", "Edited interactive route title");
  state = validateTrainingRouteAuthorState(state);
  state = compareTrainingRouteAuthorShortestRoute(state);

  const model = buildTrainingRouteAuthorModel({ state });

  assert.equal(model.validationRunStatus === "valid" || model.validationRunStatus === "warning", true);
  assert.equal(model.comparisonRunStatus, "available");
  assert.equal(model.exportReadiness.ready, true);
  assert.equal(model.exportData.metadata.title, "Edited interactive route title");
  assert.ok(model.exportData.routeGeometry.length > 1);
});

test("curated route author marker sizing avoids oversized placeholder markers", () => {
  const model = buildTrainingRouteAuthorModel({ state: createSampleTrainingRouteAuthorState() });
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");

  assert.ok(model.mapModel.markerRadiusPixels <= 12);
  assert.doesNotMatch(clientSource, /r="34"/);
});

test("learner navigation does not expose dev training authoring tools", () => {
  const sidebarSource = readFileSync("components/layout/Sidebar.tsx", "utf8");
  const practicePageSource = readFileSync("app/practice/page.tsx", "utf8");

  assert.doesNotMatch(sidebarSource, /\/dev\/training-route/);
  assert.doesNotMatch(sidebarSource, /Training Route Author/);
  assert.doesNotMatch(practicePageSource, /\/dev\/training-route/);
  assert.doesNotMatch(practicePageSource, /Training Route Author/);
});
