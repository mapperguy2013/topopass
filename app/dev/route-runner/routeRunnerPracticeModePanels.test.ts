import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildDevToolsHomeModel } from "../devTools.ts";
import { getRouteRunnerMapViewportBounds } from "./routeRunnerMapOptionUtils.ts";
import {
  DEV_TRAINING_ROUTE_AUTHOR_PATH,
  TRAINING_ROUTE_AUTHOR_BASELINE_CANVAS_HEIGHT,
  TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT,
  TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH,
  TRAINING_ROUTE_AUTHOR_DESKTOP_HEIGHT_SCALE,
  TRAINING_ROUTE_AUTHOR_SNAP_TOLERANCE,
  TRAINING_ROUTE_AUTHOR_AREA_OPTIONS,
  TRAINING_ROUTE_AUTHOR_MAP_LEGEND_ITEMS,
  addTrainingRouteAuthorCheckpoint,
  appendTrainingRouteAuthorStrokePoint,
  buildTrainingRouteAuthorViewportLayout,
  canContinueTrainingRouteAuthorDrawPointer,
  canContinueTrainingRouteAuthorPanPointer,
  canStartTrainingRouteAuthorPointer,
  classifyShortestRouteComparison,
  buildTrainingRouteAuthorModel,
  buildTrainingRouteAuthorMapLegendModel,
  clearTrainingRouteAuthorCheckpoints,
  clearTrainingRouteAuthorRoute,
  compareTrainingRouteAuthorShortestRoute,
  createEmptyTrainingRouteAuthorState,
  createSampleTrainingRouteAuthorState,
  dominantTrainingRouteAuthorWheelDelta,
  finishTrainingRouteAuthorStroke,
  getTrainingRouteAuthorMap,
  isTrainingRouteAuthorMiddlePanActive,
  isTrainingRouteAuthorMiddlePanPointer,
  resolveNearestTrainingRouteAuthorNodeSnap,
  setTrainingRouteAuthorDestination,
  setTrainingRouteAuthorMode,
  setTrainingRouteAuthorStart,
  shouldIsolateTrainingRouteAuthorMapWheel,
  shouldIsolateTrainingRouteAuthorPointer,
  shouldPreventTrainingRouteAuthorAuxiliaryClick,
  startTrainingRouteAuthorStroke,
  trainingRouteAuthorMapPointForClientPoint,
  trainingRouteAuthorMapPointForScreenPoint,
  trainingRouteAuthorViewportAspectRatioCss,
  trainingRouteAuthorWheelZoomFactor,
  updateTrainingRouteAuthorMetadataField,
  validateTrainingRouteAuthorState,
  zoomTrainingRouteAuthorBoundsAroundScreenPoint
} from "../training-route/trainingRouteAuthor.ts";
import {
  ROUTE_RUNNER_BETA_CORE_PANEL_LABELS,
  ROUTE_RUNNER_DEV_ONLY_PANEL_LABELS,
  buildRouteRunnerPracticeModePanelVisibility
} from "./routeRunnerPracticeModePanels.ts";

function assertClose(actual: number, expected: number, message: string): void {
  assert.ok(Math.abs(actual - expected) < 0.000001, `${message}: expected ${expected}, got ${actual}`);
}

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

test("learner real london practice page still mounts the shared route-runner map", () => {
  const pageSource = readFileSync("app/practice/real-london/page.tsx", "utf8");

  assert.match(pageSource, /RouteRunnerClient/);
  assert.match(pageSource, /REAL_LONDON_BETA_MAP_OPTIONS/);
  assert.match(pageSource, /showTrainingModePanel=\{false\}/);
  assert.match(pageSource, /RealLondonBetaFeedbackForm/);
});

test("curated training route author page renders the interactive authoring client", () => {
  const pageSource = readFileSync("app/dev/training-route/page.tsx", "utf8");
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");
  const model = buildTrainingRouteAuthorModel();
  const toolbarIndex = clientSource.indexOf('data-testid="training-author-top-toolbar"');
  const mapIndex = clientSource.indexOf('data-testid="training-author-map-workspace"');
  const drawerIndex = clientSource.indexOf('data-testid="training-author-bottom-drawer"');

  assert.match(pageSource, /Curated Training Route Author/);
  assert.match(pageSource, /TrainingRouteAuthorClient/);
  assert.match(clientSource, /buildTrainingRouteAuthorModel/);
  assert.match(clientSource, /Interactive Real London training route authoring map/);
  assert.match(clientSource, /data-testid="training-author-map-first-shell"/);
  assert.match(clientSource, /data-testid="training-author-top-toolbar"/);
  assert.match(clientSource, /data-testid="training-author-map-workspace"/);
  assert.match(clientSource, /data-testid="training-author-bottom-drawer"/);
  assert.ok(toolbarIndex > -1);
  assert.ok(mapIndex > -1);
  assert.ok(drawerIndex > -1);
  assert.ok(toolbarIndex < mapIndex);
  assert.ok(mapIndex < drawerIndex);
  assert.match(clientSource, /Route metadata/);
  assert.match(clientSource, /Validation panel/);
  assert.match(clientSource, /Shortest route comparison/);
  assert.match(clientSource, /Export panel/);
  assert.match(clientSource, /role="tablist"/);
  assert.match(clientSource, /useState<TrainingRouteAuthorDrawerTabId>\("authoring-steps"\)/);
  assert.deepEqual(model.saveTargets.map((target) => target.actionLabel), [
    "Save working draft",
    "Save review candidate",
    "Save complete route"
  ]);
  assert.doesNotMatch(clientSource, /Save validated draft/);
  assert.match(clientSource, /Download JSON/);
  assert.match(clientSource, /Copy JSON/);
  assert.match(clientSource, /Curated route JSON export/);
  assert.doesNotMatch(clientSource, /<aside className="space-y-4">/);
  assert.doesNotMatch(clientSource, /RouteRunnerClient/);
});

test("curated training route author map viewport uses the author canvas aspect ratio", () => {
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");
  const map = getTrainingRouteAuthorMap();
  const initialBounds = getRouteRunnerMapViewportBounds(
    map,
    TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH,
    TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT
  );
  const viewportLayout = buildTrainingRouteAuthorViewportLayout({
    mapBounds: initialBounds
  });

  assert.equal(TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH, 1120);
  assert.equal(TRAINING_ROUTE_AUTHOR_BASELINE_CANVAS_HEIGHT, 760);
  assert.equal(TRAINING_ROUTE_AUTHOR_DESKTOP_HEIGHT_SCALE, 0.75);
  assert.equal(TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT, 570);
  assert.equal(TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT, Math.round(TRAINING_ROUTE_AUTHOR_BASELINE_CANVAS_HEIGHT * 0.75));
  assert.ok(
    TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT <= TRAINING_ROUTE_AUTHOR_BASELINE_CANVAS_HEIGHT * 0.76,
    "author viewport height should be reduced by about 25 percent"
  );
  assertClose(
    viewportLayout.aspectRatio,
    TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH / TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT,
    "author viewport aspect ratio"
  );
  assertClose(
    (viewportLayout.mapBounds.maxX - viewportLayout.mapBounds.minX) /
      (viewportLayout.mapBounds.maxY - viewportLayout.mapBounds.minY),
    viewportLayout.aspectRatio,
    "author map bounds aspect ratio"
  );
  assert.equal(trainingRouteAuthorViewportAspectRatioCss(viewportLayout), "1120 / 570");
  assert.deepEqual(viewportLayout.contentRect, {
    left: 0,
    top: 0,
    width: TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH,
    height: TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT
  });
  assert.deepEqual(viewportLayout.unusedViewportInsets, {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });
  assert.match(clientSource, /buildTrainingRouteAuthorViewportLayout/);
  assert.match(clientSource, /trainingRouteAuthorViewportAspectRatioCss\(initialViewportLayout\)/);
  assert.match(clientSource, /height=\{initialViewportLayout\.screenSize\.height\}/);
  assert.match(clientSource, /width=\{initialViewportLayout\.screenSize\.width\}/);
  assert.match(clientSource, /preserveAspectRatio="xMidYMid meet"/);
  assert.match(clientSource, /block h-auto w-full touch-none select-none overscroll-contain/);
  assert.match(clientSource, /touch-none select-none overscroll-contain/);
  assert.doesNotMatch(clientSource, /aspect-\[1120\/760\]/);
  assert.doesNotMatch(clientSource, /h-\[420px\]/);
  assert.doesNotMatch(clientSource, /sm:h-\[560px\]/);
});

test("curated training route author map card does not stretch past the rendered viewport", () => {
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");

  assert.match(clientSource, /data-testid="training-author-map-workspace"/);
  assert.match(clientSource, /className="relative overflow-hidden" data-training-author-layer="map-viewport"/);
  assert.match(clientSource, /data-testid="training-route-author-map-viewport"/);
  assert.match(clientSource, /data-training-author-layer="interaction"/);
  assert.match(clientSource, /data-training-author-layer="base-map"/);
  assert.match(clientSource, /data-training-author-layer="restriction-overlays"/);
  assert.match(clientSource, /data-training-author-layer="route-overlays"/);
  assert.match(clientSource, /data-training-author-layer="map-labels"/);
  assert.match(clientSource, /data-training-author-layer="markers"/);
  assert.match(clientSource, /height=\{boundsHeight\(viewBounds\)\}/);
  assert.match(clientSource, /width=\{boundsWidth\(viewBounds\)\}/);
  assert.doesNotMatch(clientSource, /mt-4 grid items-start gap-4 xl:grid-cols-\[minmax\(0,1fr\)_360px\]/);
  assert.doesNotMatch(clientSource, /mt-4 grid gap-4 xl:grid-cols-\[minmax\(0,1fr\)_360px\]/);
  assert.doesNotMatch(clientSource, /<aside className="space-y-4">/);
});

test("curated training route author map legend is collapsed inside the map viewport", () => {
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");
  const routeRunnerSource = readFileSync("app/dev/route-runner/RouteRunnerClient.tsx", "utf8");
  const collapsedLegend = buildTrainingRouteAuthorMapLegendModel();
  const expandedLegend = buildTrainingRouteAuthorMapLegendModel({ expanded: true });

  assert.equal(collapsedLegend.controlLabel, "Map legend");
  assert.equal(collapsedLegend.presentation, "compact-collapsible-layer-control");
  assert.equal(collapsedLegend.placement, "map-viewport-bottom-left");
  assert.equal(collapsedLegend.collapsedByDefault, true);
  assert.deepEqual(collapsedLegend.items, []);
  assert.deepEqual(
    expandedLegend.items.map((item) => item.label),
    TRAINING_ROUTE_AUTHOR_MAP_LEGEND_ITEMS.map((item) => item.label)
  );
  assert.ok(expandedLegend.items.some((item) => item.label === "Raw drawing"));
  assert.ok(expandedLegend.items.some((item) => item.label === "Matched route"));
  assert.ok(expandedLegend.items.some((item) => item.label === "Shortest overlay"));
  assert.match(clientSource, /className="relative overflow-hidden" data-training-author-layer="map-viewport"/);
  assert.match(clientSource, /<details className="pointer-events-auto max-w-full rounded-lg/);
  assert.match(clientSource, /Map legend/);
  assert.match(clientSource, /absolute bottom-2 left-2/);
  assert.match(clientSource, /TRAINING_ROUTE_AUTHOR_MAP_LEGEND_ITEMS\.map/);
  assert.match(clientSource, /pointer-events-none absolute bottom-2 left-2/);
  assert.match(clientSource, /role="toolbar"/);
  assert.doesNotMatch(
    clientSource,
    /flex flex-wrap gap-3 border-t border-slate-200 bg-white p-3 text-xs font-semibold text-slate-700/
  );
  assert.match(routeRunnerSource, /<details className="pointer-events-auto max-w-full rounded-lg/);
  assert.match(routeRunnerSource, /Map legend/);
  assert.match(routeRunnerSource, /LEARNER_RESTRICTION_MAP_LEGEND_ITEMS/);
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
  assert.equal(model.toolbarActions.find((action) => action.id === "validate-route")?.disabled, undefined);
  assert.equal(model.toolbarActions.find((action) => action.id === "compare-shortest-route")?.disabled, undefined);
  assert.equal(model.toolbarActions.find((action) => action.id === "export-json")?.disabled, true);
  assert.match(clientSource, /role="toolbar"/);
  assert.match(clientSource, /TRAINING_ROUTE_AUTHOR_PRIMARY_TOOLBAR_ACTION_IDS/);
  assert.match(clientSource, /TRAINING_ROUTE_AUTHOR_MORE_TOOLBAR_ACTION_IDS/);
  assert.match(clientSource, /Redo will be enabled when redo history is available/);
  assert.match(clientSource, /Open export panel/);
  assert.match(clientSource, /More authoring actions/);
  assert.match(clientSource, /overflow-x-auto border-b border-slate-200/);
});

test("curated training route author uses a bottom drawer with tabbed panels", () => {
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");
  const mapIndex = clientSource.indexOf('data-testid="training-author-map-workspace"');
  const drawerIndex = clientSource.indexOf('data-testid="training-author-bottom-drawer"');
  const defaultAuthoringIndex = clientSource.indexOf('useState<TrainingRouteAuthorDrawerTabId>("authoring-steps")');
  const metadataBranchIndex = clientSource.indexOf('if (drawerTab === "metadata")');
  const defaultPanelIndex = clientSource.indexOf("return renderAuthoringStepsDrawer();");

  assert.match(clientSource, /TRAINING_ROUTE_AUTHOR_DRAWER_TABS/);
  assert.match(clientSource, /Authoring steps/);
  assert.match(clientSource, /Route state/);
  assert.match(clientSource, /Validation/);
  assert.match(clientSource, /Metadata/);
  assert.match(clientSource, /Export/);
  assert.match(clientSource, /data-testid="training-author-drawer-panel-authoring-steps"/);
  assert.match(clientSource, /data-testid="training-author-drawer-panel-route-state"/);
  assert.match(clientSource, /data-testid="training-author-drawer-panel-validation"/);
  assert.match(clientSource, /data-testid="training-author-drawer-panel-metadata"/);
  assert.match(clientSource, /data-testid="training-author-drawer-panel-export"/);
  assert.match(clientSource, /aria-selected=\{drawerTab === tab\.id\}/);
  assert.match(clientSource, /onClick=\{\(\) => setDrawerTab\(tab\.id\)\}/);
  assert.ok(defaultAuthoringIndex > -1);
  assert.ok(metadataBranchIndex > -1);
  assert.ok(defaultPanelIndex > metadataBranchIndex);
  assert.ok(mapIndex > -1);
  assert.ok(drawerIndex > -1);
  assert.ok(mapIndex < drawerIndex);
  assert.doesNotMatch(clientSource, /<aside className="space-y-4">/);
});

test("curated training route author keeps metadata and export controls out of the default map view", () => {
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");
  const model = buildTrainingRouteAuthorModel();

  assert.match(clientSource, /function renderMetadataDrawer\(\)/);
  assert.match(clientSource, /function renderExportDrawer\(\)/);
  assert.match(clientSource, /data-testid="training-author-metadata-form"/);
  assert.match(clientSource, /data-testid="training-author-drawer-panel-export"/);
  assert.match(clientSource, /Clear autosave recovery/);
  assert.deepEqual(model.saveTargets.map((target) => target.actionLabel), [
    "Save working draft",
    "Save review candidate",
    "Save complete route"
  ]);
  assert.doesNotMatch(
    clientSource,
    /<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">\s*<h2 className="text-xl font-bold text-ink">Route metadata/
  );
  assert.doesNotMatch(
    clientSource,
    /<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">\s*<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">\s*<div>\s*<h2 className="text-xl font-bold text-ink">Export panel/
  );
});

test("curated training route author mobile layout keeps toolbar and drawer controls scrollable", () => {
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");

  assert.match(clientSource, /className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white p-3"/);
  assert.match(clientSource, /inline-flex min-h-11 shrink-0/);
  assert.match(clientSource, /className="mt-4 flex gap-4 overflow-x-auto border-b border-slate-200"/);
  assert.match(clientSource, /min-h-11 shrink-0 border-b-2/);
  assert.match(clientSource, /rounded-2xl border border-slate-200 bg-white p-3 shadow-lg sm:p-4/);
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

test("curated training route author wheel zoom keeps the cursor world coordinate stable", () => {
  const initialBounds = {
    minX: 0,
    maxX: 1000,
    minY: 0,
    maxY: 500
  };
  const screenSize = {
    width: 1000,
    height: 500
  };
  const screenPoint = {
    x: 760,
    y: 140
  };
  const before = trainingRouteAuthorMapPointForScreenPoint(initialBounds, screenPoint, screenSize);
  const zoomed = zoomTrainingRouteAuthorBoundsAroundScreenPoint({
    currentBounds: initialBounds,
    initialBounds,
    screenPoint,
    screenSize,
    zoomFactor: trainingRouteAuthorWheelZoomFactor(-120)
  });
  const after = trainingRouteAuthorMapPointForScreenPoint(zoomed, screenPoint, screenSize);

  assert.ok(before);
  assert.ok(after);
  assertClose(after.x, before.x, "cursor-centred zoom should preserve x");
  assertClose(after.y, before.y, "cursor-centred zoom should preserve y");
  assert.ok(zoomed.maxX - zoomed.minX < initialBounds.maxX - initialBounds.minX);
});

test("curated training route author repeated wheel zoom does not drift from the cursor anchor", () => {
  const initialBounds = {
    minX: -100,
    maxX: 900,
    minY: 50,
    maxY: 550
  };
  const screenSize = {
    width: 1200,
    height: 600
  };
  const screenPoint = {
    x: 180,
    y: 490
  };
  const anchor = trainingRouteAuthorMapPointForScreenPoint(initialBounds, screenPoint, screenSize);
  let bounds = initialBounds;

  assert.ok(anchor);

  for (let index = 0; index < 8; index += 1) {
    bounds = zoomTrainingRouteAuthorBoundsAroundScreenPoint({
      currentBounds: bounds,
      initialBounds,
      screenPoint,
      screenSize,
      zoomFactor: trainingRouteAuthorWheelZoomFactor(-80)
    });
  }

  const after = trainingRouteAuthorMapPointForScreenPoint(bounds, screenPoint, screenSize);

  assert.ok(after);
  assertClose(after.x, anchor.x, "repeated cursor zoom should not drift x");
  assertClose(after.y, anchor.y, "repeated cursor zoom should not drift y");
});

test("curated training route author wheel zoom clamps to configured author bounds", () => {
  const initialBounds = {
    minX: 0,
    maxX: 1000,
    minY: 0,
    maxY: 500
  };
  const screenSize = {
    width: 1000,
    height: 500
  };
  const screenPoint = {
    x: 500,
    y: 250
  };
  let zoomedIn = initialBounds;
  let zoomedOut = initialBounds;

  for (let index = 0; index < 60; index += 1) {
    zoomedIn = zoomTrainingRouteAuthorBoundsAroundScreenPoint({
      currentBounds: zoomedIn,
      initialBounds,
      screenPoint,
      screenSize,
      zoomFactor: trainingRouteAuthorWheelZoomFactor(-120)
    });
    zoomedOut = zoomTrainingRouteAuthorBoundsAroundScreenPoint({
      currentBounds: zoomedOut,
      initialBounds,
      screenPoint,
      screenSize,
      zoomFactor: trainingRouteAuthorWheelZoomFactor(120)
    });
  }

  assertClose(zoomedIn.maxX - zoomedIn.minX, 80, "zoom-in width should clamp at 8 percent");
  assertClose(zoomedOut.maxX - zoomedOut.minX, 2400, "zoom-out width should clamp at 240 percent");
});

test("curated training route author converts client coordinates at map viewport corners", () => {
  const bounds = {
    minX: 0,
    maxX: TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH,
    minY: 0,
    maxY: TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT
  };
  const viewportRect = {
    left: 100,
    top: 200,
    width: TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH,
    height: TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT
  };
  const topLeft = trainingRouteAuthorMapPointForClientPoint({
    bounds,
    clientPoint: { clientX: 100, clientY: 200 },
    viewportRect
  });
  const center = trainingRouteAuthorMapPointForClientPoint({
    bounds,
    clientPoint: {
      clientX: 100 + TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH / 2,
      clientY: 200 + TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT / 2
    },
    viewportRect
  });
  const bottomRight = trainingRouteAuthorMapPointForClientPoint({
    bounds,
    clientPoint: {
      clientX: 100 + TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH,
      clientY: 200 + TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT
    },
    viewportRect
  });

  assert.ok(topLeft);
  assert.ok(center);
  assert.ok(bottomRight);
  assertClose(topLeft.mapPoint.x, 0, "top-left x");
  assertClose(topLeft.mapPoint.y, 0, "top-left y");
  assertClose(center.mapPoint.x, TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH / 2, "center x");
  assertClose(center.mapPoint.y, TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT / 2, "center y");
  assertClose(bottomRight.mapPoint.x, TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH, "bottom-right x");
  assertClose(bottomRight.mapPoint.y, TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT, "bottom-right y");
});

test("curated training route author coordinate conversion stays aligned after pan zoom scroll and resize", () => {
  const pannedZoomedBounds = {
    minX: 100,
    maxX: 660,
    minY: 50,
    maxY: 430
  };
  const scrolledViewportRect = {
    left: 75,
    top: 620,
    width: 560,
    height: 380
  };
  const center = trainingRouteAuthorMapPointForClientPoint({
    bounds: pannedZoomedBounds,
    clientPoint: { clientX: 355, clientY: 810 },
    viewportRect: scrolledViewportRect
  });
  const resizedTallViewportRect = {
    left: 20,
    top: 300,
    width: 560,
    height: 760
  };
  const tallCenter = trainingRouteAuthorMapPointForClientPoint({
    bounds: pannedZoomedBounds,
    clientPoint: { clientX: 300, clientY: 680 },
    viewportRect: resizedTallViewportRect
  });
  const letterboxClick = trainingRouteAuthorMapPointForClientPoint({
    bounds: pannedZoomedBounds,
    clientPoint: { clientX: 300, clientY: 330 },
    viewportRect: resizedTallViewportRect
  });

  assert.ok(center);
  assertClose(center.localPoint.x, 280, "scrolled local x");
  assertClose(center.localPoint.y, 190, "scrolled local y");
  assertClose(center.mapPoint.x, 380, "panned zoomed center x");
  assertClose(center.mapPoint.y, 240, "panned zoomed center y");
  assert.ok(tallCenter);
  assertClose(tallCenter.contentRect.top, 190, "tall viewport letterbox top");
  assertClose(tallCenter.mapPoint.x, 380, "resized center x");
  assertClose(tallCenter.mapPoint.y, 240, "resized center y");
  assert.equal(letterboxClick, null);
});

test("curated training route author viewport layout keeps conversion content full height", () => {
  const viewportLayout = buildTrainingRouteAuthorViewportLayout({
    mapBounds: {
      minX: -20,
      maxX: 80,
      minY: 10,
      maxY: 110
    }
  });
  const viewportRect = {
    left: 40,
    top: 120,
    width: TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH,
    height: TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT
  };
  const center = trainingRouteAuthorMapPointForClientPoint({
    bounds: viewportLayout.mapBounds,
    clientPoint: {
      clientX: 40 + TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH / 2,
      clientY: 120 + TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT / 2
    },
    viewportRect,
    screenSize: viewportLayout.screenSize
  });

  assert.ok(center);
  assertClose(center.contentRect.left, 0, "viewport layout content left");
  assertClose(center.contentRect.top, 0, "viewport layout content top");
  assertClose(center.contentRect.width, TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH, "viewport layout content width");
  assertClose(center.contentRect.height, TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT, "viewport layout content height");
  assertClose(
    center.mapPoint.x,
    (viewportLayout.mapBounds.minX + viewportLayout.mapBounds.maxX) / 2,
    "layout center map x"
  );
  assertClose(
    center.mapPoint.y,
    (viewportLayout.mapBounds.minY + viewportLayout.mapBounds.maxY) / 2,
    "layout center map y"
  );
});

test("curated training route author snapping uses corrected map coordinates and rejects distant clicks", () => {
  const map = getTrainingRouteAuthorMap();
  const startNode = map.nodes[0];
  const checkpointNode = map.nodes[1];
  const destinationNode = map.nodes[2];
  const startSnap = resolveNearestTrainingRouteAuthorNodeSnap(startNode, TRAINING_ROUTE_AUTHOR_SNAP_TOLERANCE);
  const farSnap = resolveNearestTrainingRouteAuthorNodeSnap({ x: -100000, y: -100000 }, TRAINING_ROUTE_AUTHOR_SNAP_TOLERANCE);
  let state = createEmptyTrainingRouteAuthorState();

  assert.ok(startSnap);
  assert.equal(startSnap.node.id, startNode.id);
  assert.equal(startSnap.roadDistance, 0);
  assert.equal(farSnap, null);

  state = setTrainingRouteAuthorStart(state, startSnap.node.id);
  state = addTrainingRouteAuthorCheckpoint(state, checkpointNode.id);
  state = setTrainingRouteAuthorDestination(state, destinationNode.id);

  const model = buildTrainingRouteAuthorModel({ state });
  const markers = new Map(model.mapModel.markers.map((marker) => [marker.kind, marker]));

  assert.deepEqual(markers.get("start")?.point, { x: startSnap.node.x, y: startSnap.node.y });
  assert.deepEqual(markers.get("checkpoint")?.point, { x: checkpointNode.x, y: checkpointNode.y });
  assert.deepEqual(markers.get("destination")?.point, { x: destinationNode.x, y: destinationNode.y });
});

test("curated training route author draw mode records converted cursor path points", () => {
  const bounds = {
    minX: 0,
    maxX: TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH,
    minY: 0,
    maxY: TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT
  };
  const viewportRect = {
    left: 10,
    top: 20,
    width: TRAINING_ROUTE_AUTHOR_CANVAS_WIDTH,
    height: TRAINING_ROUTE_AUTHOR_CANVAS_HEIGHT
  };
  const convertedPoints = [
    { clientX: 110, clientY: 120 },
    { clientX: 210, clientY: 220 },
    { clientX: 310, clientY: 320 }
  ].map((clientPoint) =>
    trainingRouteAuthorMapPointForClientPoint({
      bounds,
      clientPoint,
      viewportRect
    })
  );
  let state = setTrainingRouteAuthorMode(createEmptyTrainingRouteAuthorState(), "draw-route");

  assert.ok(convertedPoints.every(Boolean));

  state = startTrainingRouteAuthorStroke(state, convertedPoints[0]?.mapPoint ?? { x: 0, y: 0 });
  state = appendTrainingRouteAuthorStrokePoint(state, convertedPoints[1]?.mapPoint ?? { x: 0, y: 0 });
  state = appendTrainingRouteAuthorStrokePoint(state, convertedPoints[2]?.mapPoint ?? { x: 0, y: 0 });

  assert.deepEqual(state.routeDraft.strokes[0]?.points, [
    convertedPoints[0]?.mapPoint,
    convertedPoints[1]?.mapPoint,
    convertedPoints[2]?.mapPoint
  ]);
});

test("curated training route author UI uses canonical conversion and exposes click diagnostics", () => {
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");

  assert.match(clientSource, /trainingRouteAuthorMapPointForClientPoint/);
  assert.match(clientSource, /pointerMapConversionFromClientPoint/);
  assert.match(clientSource, /resolveNearestTrainingRouteAuthorNodeSnap/);
  assert.match(clientSource, /Show click diagnostics/);
  assert.match(clientSource, /Click closer to a road segment\./);
  assert.match(clientSource, /renderClickDiagnosticOverlay/);
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

test("curated training route author accepts only left mouse or primary touch for authoring starts", () => {
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");

  for (const activeMode of ["set-start", "set-destination", "add-checkpoint", "draw-route", "pan"] as const) {
    assert.equal(canStartTrainingRouteAuthorPointer({ button: 0, buttons: 1, pointerType: "mouse", isPrimary: true }), true);
    assert.equal(canStartTrainingRouteAuthorPointer({ button: 1, buttons: 4, pointerType: "mouse", isPrimary: true }), false);
    assert.equal(canStartTrainingRouteAuthorPointer({ button: 2, buttons: 2, pointerType: "mouse", isPrimary: true }), false);
    assert.equal(canStartTrainingRouteAuthorPointer({ button: 0, buttons: 1, pointerType: "touch", isPrimary: true }), true);
    assert.equal(canStartTrainingRouteAuthorPointer({ button: 0, buttons: 1, pointerType: "touch", isPrimary: false }), false);
    assert.equal(shouldIsolateTrainingRouteAuthorPointer({ targetInsideMap: true, activeMode }), true);
  }

  assert.match(clientSource, /canStartTrainingRouteAuthorPointer\(pointerInput\)/);
  assert.match(clientSource, /dragStateRef\.current = null/);
  assert.match(clientSource, /onMouseDown=\{handleMapMouseDown\}/);
  assert.match(clientSource, /onAuxClick=\{handleMapAuxClick\}/);
  assert.match(clientSource, /onContextMenu=\{handleMapContextMenu\}/);
});

test("curated training route author middle mouse temporarily pans without changing authoring mode", () => {
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");
  const middleInput = { button: 1, buttons: 4, pointerType: "mouse", isPrimary: true };
  const leftInput = { button: 0, buttons: 1, pointerType: "mouse", isPrimary: true };

  for (const activeMode of ["set-start", "set-destination", "add-checkpoint", "draw-route", "pan"] as const) {
    assert.equal(shouldIsolateTrainingRouteAuthorPointer({ targetInsideMap: true, activeMode }), true);
    assert.equal(isTrainingRouteAuthorMiddlePanPointer(middleInput), true);
    assert.equal(canStartTrainingRouteAuthorPointer(middleInput), false);
    assert.equal(canContinueTrainingRouteAuthorPanPointer(middleInput, "middle"), true);
    assert.equal(canContinueTrainingRouteAuthorPanPointer(leftInput, "middle"), false);
    assert.equal(canContinueTrainingRouteAuthorPanPointer(leftInput, "primary"), true);
  }

  assert.match(clientSource, /isTrainingRouteAuthorMiddlePanPointer\(pointerInput\)/);
  assert.match(clientSource, /source: "middle"/);
  assert.match(clientSource, /canContinueTrainingRouteAuthorPanPointer\(pointerButtonInput\(event\), dragState\.source\)/);
  assert.doesNotMatch(clientSource, /setTrainingRouteAuthorMode\(currentState, "pan"\)/);
});

test("curated training route author blocks auxiliary clicks from placement and drawing modes", () => {
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");

  assert.equal(shouldPreventTrainingRouteAuthorAuxiliaryClick({ button: 1, pointerType: "mouse" }), true);
  assert.equal(shouldPreventTrainingRouteAuthorAuxiliaryClick({ button: 2, pointerType: "mouse" }), true);
  assert.equal(shouldPreventTrainingRouteAuthorAuxiliaryClick({ button: 0, pointerType: "mouse" }), false);
  assert.equal(isTrainingRouteAuthorMiddlePanActive({ buttons: 4, pointerType: "mouse" }), true);
  assert.equal(isTrainingRouteAuthorMiddlePanActive({ buttons: 1, pointerType: "mouse" }), false);
  assert.equal(canContinueTrainingRouteAuthorDrawPointer({ button: 0, buttons: 1, pointerType: "mouse", isPrimary: true }), true);
  assert.equal(canContinueTrainingRouteAuthorDrawPointer({ button: 1, buttons: 4, pointerType: "mouse", isPrimary: true }), false);
  assert.equal(canContinueTrainingRouteAuthorDrawPointer({ button: 0, buttons: 0, pointerType: "mouse", isPrimary: true }), false);
  assert.equal(canContinueTrainingRouteAuthorDrawPointer({ button: 0, buttons: 1, pointerType: "touch", isPrimary: true }), true);
  assert.match(clientSource, /shouldPreventTrainingRouteAuthorAuxiliaryClick/);
  assert.match(clientSource, /canContinueTrainingRouteAuthorDrawPointer\(pointerButtonInput\(event\)\)/);
  assert.match(clientSource, /handleMapContextMenu/);
  assert.match(clientSource, /event\.preventDefault\(\)/);
  assert.match(clientSource, /event\.stopPropagation\(\)/);
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
  const statusItems = new Map(model.routeStatusItems.map((item) => [item.label, item]));

  assert.equal(model.exportReadiness.ready, false);
  assert.equal(model.validationRunStatus, "not-run");
  assert.equal(model.comparisonRunStatus, "not-run");
  assert.equal(model.exportData.routeSegmentIds.length, 0);
  assert.equal(model.exportData.nodeIds.length, 0);
  assert.equal(model.sampleLoaded, false);
  assert.equal(model.authoringSteps.find((step) => step.label === "Set start")?.complete, false);
  assert.equal(model.authoringSteps.find((step) => step.label === "Draw route")?.complete, false);
  assert.equal(model.authoringSteps.find((step) => step.label === "Export")?.complete, false);
  assert.equal(statusItems.get("Start")?.value, "missing");
  assert.equal(statusItems.get("Route")?.value, "missing");
  assert.equal(statusItems.get("Export")?.value, "not ready");
});

test("curated training route author validation reports missing empty-state requirements", () => {
  const state = validateTrainingRouteAuthorState(createEmptyTrainingRouteAuthorState());
  const model = buildTrainingRouteAuthorModel({ state });
  const blockingCodes = model.validation.blockingErrors.map((issue) => issue.code);

  assert.equal(model.validationRunStatus, "invalid");
  assert.equal(model.validation.valid, false);
  assert.ok(blockingCodes.includes("author-start-missing"));
  assert.ok(blockingCodes.includes("author-destination-missing"));
  assert.ok(blockingCodes.includes("author-route-missing"));
  assert.match(model.validation.explanation, /Start point is missing/);
  assert.equal(model.authoringSteps.find((step) => step.label === "Draw route")?.complete, false);
  assert.equal(model.authoringSteps.find((step) => step.label === "Validate")?.complete, false);
  assert.equal(model.exportReadiness.ready, false);
});

test("curated training route author validation reports route missing after endpoints are selected", () => {
  const map = getTrainingRouteAuthorMap();
  const startNode = map.nodes[0];
  const destinationNode = map.nodes[1];
  let state = createEmptyTrainingRouteAuthorState();

  state = setTrainingRouteAuthorStart(state, startNode.id);
  state = setTrainingRouteAuthorDestination(state, destinationNode.id);
  state = validateTrainingRouteAuthorState(state);

  const model = buildTrainingRouteAuthorModel({ state });
  const blockingCodes = model.validation.blockingErrors.map((issue) => issue.code);
  const statusItems = new Map(model.routeStatusItems.map((item) => [item.label, item]));

  assert.equal(model.validationRunStatus, "invalid");
  assert.equal(blockingCodes.includes("author-start-missing"), false);
  assert.equal(blockingCodes.includes("author-destination-missing"), false);
  assert.ok(blockingCodes.includes("author-route-missing"));
  assert.equal(model.authoringSteps.find((step) => step.label === "Set start")?.complete, true);
  assert.equal(model.authoringSteps.find((step) => step.label === "Set destination")?.complete, true);
  assert.equal(model.authoringSteps.find((step) => step.label === "Draw route")?.complete, false);
  assert.equal(statusItems.get("Start")?.value, "selected");
  assert.equal(statusItems.get("Destination")?.value, "selected");
  assert.equal(statusItems.get("Route")?.value, "missing");
});

test("curated training route author export checklist explains blocking validation gaps", () => {
  const state = validateTrainingRouteAuthorState(createEmptyTrainingRouteAuthorState());
  const model = buildTrainingRouteAuthorModel({ state });
  const checklist = new Map(model.exportReadiness.checklist.map((item) => [item.label, item.complete]));
  const reviewCandidate = model.saveTargets.find((target) => target.mode === "review-candidate");
  const completeRoute = model.saveTargets.find((target) => target.mode === "complete-route");

  assert.equal(model.exportReadiness.ready, false);
  assert.equal(reviewCandidate?.ready, false);
  assert.equal(completeRoute?.ready, false);
  assert.match(completeRoute?.unavailableMessage ?? "", /Save complete route unavailable/);
  assert.equal(checklist.get("Start selected"), false);
  assert.equal(checklist.get("Destination selected"), false);
  assert.equal(checklist.get("Route drawn and matched"), false);
  assert.equal(checklist.get("Validation has run"), true);
  assert.equal(checklist.get("Validation has no blocking errors"), false);
  assert.equal(checklist.get("Shortest-route comparison has run"), false);
});

test("curated training route author sample can produce Stage 19 route contract metadata", () => {
  const state = compareTrainingRouteAuthorShortestRoute(validateTrainingRouteAuthorState(createSampleTrainingRouteAuthorState()));
  const model = buildTrainingRouteAuthorModel({ state });
  const fieldIds = model.metadataFields.map((field) => field.id);
  const areaField = model.metadataFields.find((field) => field.id === "areaId");

  assert.equal(model.path, DEV_TRAINING_ROUTE_AUTHOR_PATH);
  assert.equal(model.exportData.schemaVersion, 1);
  assert.equal(model.exportData.mapId, model.sourceMapId);
  assert.equal(model.exportData.practiceMapId, model.sourceMapId);
  assert.equal(model.exportData.areaId, model.sourceMapId);
  assert.equal(model.exportData.areaName, "Real London");
  assert.equal(model.exportData.sourceFixture, "realLondonPilotOverpass.json");
  assert.ok(model.exportData.metadata.routeId.length > 0);
  assert.equal(model.exportData.metadata.practiceMapId, model.sourceMapId);
  assert.equal(model.exportData.metadata.areaId, model.sourceMapId);
  assert.equal(model.exportData.metadata.areaName, "Real London");
  assert.equal(model.selectedArea?.areaName, "Real London");
  assert.ok(model.exportData.start.nodeId.length > 0);
  assert.ok(model.exportData.destination.nodeId.length > 0);
  assert.ok(Array.isArray(model.exportData.checkpoints));
  assert.ok(model.exportData.routeSegmentIds.length > 0);
  assert.ok(model.exportData.complexitySummary.segmentCount > 0);
  assert.ok(model.exportJson.includes('"validationSummary"'));
  assert.ok(model.exportJson.includes('"complexitySummary"'));
  assert.ok(model.exportJson.includes('"shortestRouteComparison"'));
  assert.ok(model.exportReadiness.ready);
  assert.equal(model.exportData.lifecycleStage, "authoring");
  assert.equal(model.saveTargets.length, 3);
  assert.deepEqual(model.saveTargets.map((target) => target.label), [
    "Save working draft",
    "Save review candidate",
    "Save complete route"
  ]);
  assert.match(model.saveTargets[0]?.relativePath ?? "", /^data\/training-routes\/drafts\//);
  assert.match(model.saveTargets[1]?.relativePath ?? "", /^data\/training-routes\/review\//);
  assert.match(model.saveTargets[2]?.relativePath ?? "", /^data\/training-routes\/complete\//);
  assert.deepEqual(fieldIds, [
    "routeId",
    "title",
    "areaId",
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
  assert.equal(areaField?.label, "Practice map / area");
  assert.equal(areaField?.input, "select");
  assert.notEqual(areaField?.input, "text");
  assert.deepEqual(areaField?.options, TRAINING_ROUTE_AUTHOR_AREA_OPTIONS.map((option) => option.areaId));
  assert.match(areaField?.helpText ?? "", /Map id: osm-real-london-pilot/);
  assert.match(areaField?.helpText ?? "", /Source fixture: realLondonPilotOverpass\.json/);
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

test("curated route author suggests metadata-based route ids, filenames, and save paths", () => {
  let state = createEmptyTrainingRouteAuthorState();

  state = updateTrainingRouteAuthorMetadataField(state, "title", "Goodge to Tottenham");
  state = updateTrainingRouteAuthorMetadataField(state, "difficulty", "intermediate");
  state = updateTrainingRouteAuthorMetadataField(state, "exerciseType", "follow-planned-route");

  const model = buildTrainingRouteAuthorModel({ state });
  const routeIdField = model.metadataFields.find((field) => field.id === "routeId");
  const workingDraft = model.saveTargets.find((target) => target.mode === "working-draft");
  const reviewCandidate = model.saveTargets.find((target) => target.mode === "review-candidate");
  const completeRoute = model.saveTargets.find((target) => target.mode === "complete-route");

  assert.equal(model.suggestedRouteId, "real-london-intermediate-follow-planned-route-goodge-to-tottenham");
  assert.equal(model.effectiveRouteId, model.suggestedRouteId);
  assert.equal(routeIdField?.value, model.suggestedRouteId);
  assert.match(routeIdField?.helpText ?? "", /Auto-suggested from metadata/);
  assert.equal(workingDraft?.suggestedFilename, "real-london-intermediate-follow-planned-route-goodge-to-tottenham-draft.json");
  assert.equal(reviewCandidate?.suggestedFilename, "real-london-intermediate-follow-planned-route-goodge-to-tottenham.json");
  assert.equal(completeRoute?.suggestedFilename, "real-london-intermediate-follow-planned-route-goodge-to-tottenham.json");
  assert.equal(
    workingDraft?.relativePath,
    "data/training-routes/drafts/real-london-intermediate-follow-planned-route-goodge-to-tottenham-draft.json"
  );
  assert.equal(
    reviewCandidate?.relativePath,
    "data/training-routes/review/real-london-intermediate-follow-planned-route-goodge-to-tottenham.json"
  );
  assert.equal(
    completeRoute?.relativePath,
    "data/training-routes/complete/real-london-intermediate-follow-planned-route-goodge-to-tottenham.json"
  );
});

test("curated route author area selector updates metadata ids and filenames", () => {
  const areaOption = TRAINING_ROUTE_AUTHOR_AREA_OPTIONS[0];
  let state = createEmptyTrainingRouteAuthorState();

  assert.ok(areaOption);

  state = updateTrainingRouteAuthorMetadataField(state, "title", "Goodge to Tottenham");
  state = updateTrainingRouteAuthorMetadataField(state, "difficulty", "intermediate");
  state = updateTrainingRouteAuthorMetadataField(state, "exerciseType", "follow-planned-route");
  state = updateTrainingRouteAuthorMetadataField(state, "areaId", "");

  const missingAreaModel = buildTrainingRouteAuthorModel({ state });

  assert.equal(missingAreaModel.exportData.areaId, "");
  assert.equal(missingAreaModel.exportData.areaName, "");
  assert.equal(missingAreaModel.suggestedRouteId, "intermediate-follow-planned-route-goodge-to-tottenham");
  assert.equal(missingAreaModel.saveTargets.find((target) => target.mode === "complete-route")?.ready, false);
  assert.match(
    missingAreaModel.saveTargets.find((target) => target.mode === "complete-route")?.unavailableMessage ?? "",
    /Select a practice map or training area/
  );

  state = updateTrainingRouteAuthorMetadataField(state, "areaId", areaOption.areaId);

  const model = buildTrainingRouteAuthorModel({ state });

  assert.equal(model.exportData.practiceMapId, areaOption.practiceMapId);
  assert.equal(model.exportData.areaId, areaOption.areaId);
  assert.equal(model.exportData.areaName, areaOption.areaName);
  assert.equal(model.exportData.area, areaOption.areaName);
  assert.equal(model.suggestedRouteId, "real-london-intermediate-follow-planned-route-goodge-to-tottenham");
  assert.equal(
    model.saveTargets.find((target) => target.mode === "working-draft")?.suggestedFilename,
    "real-london-intermediate-follow-planned-route-goodge-to-tottenham-draft.json"
  );

  const manualRouteState = updateTrainingRouteAuthorMetadataField(state, "routeId", "manual-goodge-training-route");
  const manualRouteModel = buildTrainingRouteAuthorModel({ state: manualRouteState });

  assert.equal(manualRouteModel.suggestedRouteId, "real-london-intermediate-follow-planned-route-goodge-to-tottenham");
  assert.equal(manualRouteModel.effectiveRouteId, "manual-goodge-training-route");
});

test("curated route author blocks save readiness when no valid area is selected", () => {
  let state = createSampleTrainingRouteAuthorState();

  state = validateTrainingRouteAuthorState(state);
  state = compareTrainingRouteAuthorShortestRoute(state);
  state = updateTrainingRouteAuthorMetadataField(state, "areaId", "");

  const model = buildTrainingRouteAuthorModel({ state });
  const completeRoute = model.saveTargets.find((target) => target.mode === "complete-route");

  assert.equal(model.exportReadiness.ready, false);
  assert.equal(
    model.exportReadiness.checklist.find((item) => item.label === "Practice map or training area selected")?.complete,
    false
  );
  assert.equal(model.draftSaveReadiness.ready, false);
  assert.equal(completeRoute?.ready, false);
  assert.match(completeRoute?.unavailableMessage ?? "", /Select a practice map or training area/);
});

test("curated route author working draft save allows incomplete routes but blocks approved status", () => {
  const model = buildTrainingRouteAuthorModel();
  const approvedModel = buildTrainingRouteAuthorModel({
    state: updateTrainingRouteAuthorMetadataField(createEmptyTrainingRouteAuthorState(), "status", "approved"),
    statusOverride: "approved"
  });
  const workingDraft = model.saveTargets.find((target) => target.mode === "working-draft");
  const approvedDraft = approvedModel.saveTargets.find((target) => target.mode === "working-draft");

  assert.equal(workingDraft?.ready, true);
  assert.equal(workingDraft?.jsonStatus, "draft");
  assert.match(workingDraft?.relativePath ?? "", /^data\/training-routes\/drafts\//);
  assert.equal(approvedDraft?.ready, false);
  assert.ok(
    approvedDraft?.checklist.some((item) => item.label === "Approved routes use Save complete route" && !item.complete)
  );
  assert.match(approvedDraft?.unavailableMessage ?? "", /Save working draft unavailable/);
});

test("curated route author review and complete save targets explain validation and comparison gaps", () => {
  const unvalidatedModel = buildTrainingRouteAuthorModel({ state: createSampleTrainingRouteAuthorState() });
  const invalidModel = buildTrainingRouteAuthorModel();
  const readyModel = buildTrainingRouteAuthorModel({
    state: compareTrainingRouteAuthorShortestRoute(validateTrainingRouteAuthorState(createSampleTrainingRouteAuthorState()))
  });
  const unvalidatedReview = unvalidatedModel.saveTargets.find((target) => target.mode === "review-candidate");
  const unvalidatedComplete = unvalidatedModel.saveTargets.find((target) => target.mode === "complete-route");
  const invalidReview = invalidModel.saveTargets.find((target) => target.mode === "review-candidate");
  const readyReview = readyModel.saveTargets.find((target) => target.mode === "review-candidate");
  const readyComplete = readyModel.saveTargets.find((target) => target.mode === "complete-route");

  assert.equal(unvalidatedModel.draftSaveReadiness.ready, true);
  assert.equal(unvalidatedReview?.ready, false);
  assert.equal(unvalidatedComplete?.ready, false);
  assert.ok(
    unvalidatedReview?.checklist.some(
      (item) => item.label === "Validation has run" && !item.complete
    )
  );
  assert.ok(
    unvalidatedComplete?.checklist.some(
      (item) => item.label === "Shortest-route comparison has run" && !item.complete
    )
  );
  assert.equal(invalidReview?.ready, false);
  assert.equal(readyReview?.ready, true);
  assert.equal(readyComplete?.ready, true);
});

test("curated route author dev save UI keeps save tools off learner navigation", () => {
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");
  const sidebarSource = readFileSync("components/layout/Sidebar.tsx", "utf8");
  const practicePageSource = readFileSync("app/practice/page.tsx", "utf8");

  assert.match(clientSource, /TRAINING_ROUTE_SAVE_ENDPOINT/);
  assert.match(clientSource, /Explicit route save status/);
  assert.match(clientSource, /Autosave recovery:/);
  assert.match(clientSource, /Explicit saves write route JSON/);
  assert.match(clientSource, /Clear autosave recovery/);
  assert.match(clientSource, /topopass\.devTrainingRouteAuthor\.autosave\.v1/);
  assert.match(clientSource, /localStorage\.setItem/);
  assert.match(clientSource, /localStorage\.getItem/);
  assert.match(clientSource, /localStorage\.removeItem/);
  assert.doesNotMatch(clientSource, /Save validated draft/);
  assert.doesNotMatch(sidebarSource, /Save validated draft/);
  assert.doesNotMatch(practicePageSource, /Save validated draft/);
});

test("curated route author export includes save-ready route, metadata, validation, complexity, and shortest comparison", () => {
  const state = compareTrainingRouteAuthorShortestRoute(validateTrainingRouteAuthorState(createSampleTrainingRouteAuthorState()));
  const model = buildTrainingRouteAuthorModel({ state });
  const completeRoute = model.saveTargets.find((target) => target.mode === "complete-route");

  assert.equal(model.draftSaveReadiness.ready, true);
  assert.equal(model.validatedDraftSaveReadiness.ready, true);
  assert.equal(completeRoute?.ready, true);
  assert.equal(completeRoute?.jsonStatus, "beta");
  assert.equal(completeRoute?.learnerFacingLater, true);
  assert.ok(model.exportJson.includes('"start"'));
  assert.ok(model.exportJson.includes('"destination"'));
  assert.ok(model.exportJson.includes('"checkpoints"'));
  assert.ok(model.exportJson.includes('"routeId"'));
  assert.ok(model.exportJson.includes('"title"'));
  assert.ok(model.exportJson.includes('"area"'));
  assert.ok(model.exportJson.includes('"practiceMapId"'));
  assert.ok(model.exportJson.includes('"areaId"'));
  assert.ok(model.exportJson.includes('"areaName"'));
  assert.ok(model.exportJson.includes('"sourceFixture"'));
  assert.ok(model.exportJson.includes('"difficulty"'));
  assert.ok(model.exportJson.includes('"exerciseType"'));
  assert.ok(model.exportJson.includes('"status"'));
  assert.ok(model.exportJson.includes('"lifecycleStage"'));
  assert.ok(model.exportJson.includes('"metadata"'));
  assert.ok(model.exportJson.includes('"validationSummary"'));
  assert.ok(model.exportJson.includes('"complexitySummary"'));
  assert.ok(model.exportJson.includes('"shortestRouteComparison"'));
});

test("curated route author completion gate keeps the map-first workflow ready from an empty state", () => {
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");
  const model = buildTrainingRouteAuthorModel();
  const statusItems = new Map(model.routeStatusItems.map((item) => [item.label, item]));
  const toolbarActions = new Map(model.toolbarActions.map((action) => [action.id, action]));
  const legend = buildTrainingRouteAuthorMapLegendModel();

  assert.match(clientSource, /data-testid="training-author-top-toolbar"/);
  assert.match(clientSource, /data-testid="training-author-map-workspace"/);
  assert.match(clientSource, /data-testid="training-author-bottom-drawer"/);
  assert.match(clientSource, /useState<TrainingRouteAuthorDrawerTabId>\("authoring-steps"\)/);
  assert.match(clientSource, /Authoring steps/);
  assert.match(clientSource, /Route state/);
  assert.match(clientSource, /Validation/);
  assert.match(clientSource, /Metadata/);
  assert.match(clientSource, /Export/);
  assert.match(clientSource, /Load sample route/);
  assert.doesNotMatch(clientSource, /<aside className="space-y-4">/);

  assert.equal(legend.collapsedByDefault, true);
  assert.equal(model.sampleLoaded, false);
  assert.equal(model.sourceExerciseId, "none");
  assert.equal(model.mapModel.markers.length, 0);
  assert.equal(model.exportData.routeGeometry.length, 0);
  assert.equal(model.exportData.routeSegmentIds.length, 0);
  assert.equal(model.validationRunStatus, "not-run");
  assert.equal(model.comparisonRunStatus, "not-run");
  assert.equal(model.exportReadiness.ready, false);
  assert.equal(statusItems.get("Start")?.value, "missing");
  assert.equal(statusItems.get("Destination")?.value, "missing");
  assert.equal(statusItems.get("Route")?.value, "missing");
  assert.equal(statusItems.get("Validation")?.value, "not run");
  assert.equal(statusItems.get("Shortest comparison")?.value, "not run");
  assert.equal(toolbarActions.get("validate-route")?.disabled, undefined);
  assert.equal(toolbarActions.get("compare-shortest-route")?.disabled, undefined);
  assert.equal(toolbarActions.get("export-json")?.disabled, true);
  assert.equal(model.authoringSteps.find((step) => step.label === "Set start")?.complete, false);
  assert.equal(model.authoringSteps.find((step) => step.label === "Draw route")?.complete, false);
  assert.equal(model.authoringSteps.find((step) => step.label === "Set destination")?.complete, false);
  assert.equal(model.authoringSteps.find((step) => step.label === "Validate")?.complete, false);
  assert.equal(model.authoringSteps.find((step) => step.label === "Compare shortest route")?.complete, false);
  assert.equal(model.authoringSteps.find((step) => step.label === "Export")?.complete, false);
});

test("curated route author can produce beginner intermediate and advanced sample exports for Stage 19 review", () => {
  const variants = [
    {
      difficulty: "beginner",
      exerciseType: "follow-planned-route",
      title: "Completion gate beginner route"
    },
    {
      difficulty: "intermediate",
      exerciseType: "identify-next-safe-turn",
      title: "Completion gate intermediate route"
    },
    {
      difficulty: "advanced",
      exerciseType: "route-review-mistake-correction",
      title: "Completion gate advanced route"
    }
  ] as const;

  for (const variant of variants) {
    let state = createSampleTrainingRouteAuthorState();

    state = updateTrainingRouteAuthorMetadataField(state, "routeId", "curated-training-route-draft");
    state = updateTrainingRouteAuthorMetadataField(state, "title", variant.title);
    state = updateTrainingRouteAuthorMetadataField(state, "difficulty", variant.difficulty);
    state = updateTrainingRouteAuthorMetadataField(state, "exerciseType", variant.exerciseType);
    state = updateTrainingRouteAuthorMetadataField(state, "status", "beta");
    state = compareTrainingRouteAuthorShortestRoute(validateTrainingRouteAuthorState(state));

    const model = buildTrainingRouteAuthorModel({ state });
    const completeRoute = model.saveTargets.find((target) => target.mode === "complete-route");
    const exported = JSON.parse(model.exportJson) as {
      difficulty: string;
      exerciseType: string;
      title: string;
      status: string;
      lifecycleStage: string;
      start: { nodeId: string };
      destination: { nodeId: string };
      routeGeometry: unknown[];
      routeSegmentIds: string[];
      validationSummary: { valid: boolean; blockingErrors: unknown[] };
    };

    assert.equal(model.sampleLoaded, true);
    assert.equal(model.sourceExerciseId === "none", false);
    assert.equal(model.exportReadiness.ready, true);
    assert.equal(model.validationRunStatus === "valid" || model.validationRunStatus === "warning", true);
    assert.equal(model.comparisonRunStatus, "available");
    assert.equal(completeRoute?.ready, true);
    assert.equal(completeRoute?.learnerFacingLater, true);
    assert.match(completeRoute?.relativePath ?? "", /^data\/training-routes\/complete\/real-london-/);
    assert.equal(exported.difficulty, variant.difficulty);
    assert.equal(exported.exerciseType, variant.exerciseType);
    assert.equal(exported.title, variant.title);
    assert.equal(exported.status, "beta");
    assert.equal(exported.lifecycleStage, "authoring");
    assert.ok(exported.start.nodeId.length > 0);
    assert.ok(exported.destination.nodeId.length > 0);
    assert.ok(exported.routeGeometry.length > 1);
    assert.ok(exported.routeSegmentIds.length > 0);
    assert.equal(exported.validationSummary.valid, true);
    assert.equal(exported.validationSummary.blockingErrors.length, 0);
  }
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

test("curated route author uses shared practice map marker and restriction styling", () => {
  const sampleState = createSampleTrainingRouteAuthorState();
  const map = getTrainingRouteAuthorMap();
  const checkpointNode =
    map.nodes.find((node) => node.id !== sampleState.startNodeId && node.id !== sampleState.destinationNodeId) ??
    map.nodes[0];
  const model = buildTrainingRouteAuthorModel({
    state: addTrainingRouteAuthorCheckpoint(sampleState, checkpointNode.id)
  });
  const clientSource = readFileSync("app/dev/training-route/TrainingRouteAuthorClient.tsx", "utf8");
  const markerLabels = new Map(model.mapModel.markers.map((marker) => [marker.kind, marker.label]));

  assert.equal(markerLabels.get("start"), "START");
  assert.equal(markerLabels.get("destination"), "DESTINATION");
  assert.ok(model.mapModel.markers.some((marker) => marker.kind === "checkpoint"));
  assert.match(clientSource, /buildRoadRestrictionOverlays\(map\)/);
  assert.match(clientSource, /buildRestrictionMapVisualItems/);
  assert.match(clientSource, /filterRestrictionMapVisualItemsForViewport/);
  assert.match(clientSource, /restrictionMapVisualStyleForViewport/);
  assert.match(clientSource, /TOPOPASS_STREET_ATLAS_STYLE\.restrictions\.oneWay/);
  assert.match(clientSource, /cartographicCustomMarkerAssetScaleForZoom/);
  assert.match(clientSource, /TOPOPASS_STREET_ATLAS_STYLE\.learnerOverlays\.markers\.start\.asset/);
  assert.match(clientSource, /TOPOPASS_STREET_ATLAS_STYLE\.learnerOverlays\.markers\.destination\.asset/);
  assert.match(clientSource, /TOPOPASS_STREET_ATLAS_STYLE\.learnerOverlays\.markers\.checkpointBase\.asset/);
  assert.match(clientSource, /TOPOPASS_STREET_ATLAS_STYLE\.routeOverlays\.rawRoute/);
  assert.match(clientSource, /TOPOPASS_STREET_ATLAS_STYLE\.routeOverlays\.matchedRoute/);
  assert.match(clientSource, /TOPOPASS_STREET_ATLAS_STYLE\.routeOverlays\.shortestLegalRoute/);
  assert.match(clientSource, /TOPOPASS_STREET_ATLAS_STYLE\.canvas\.backgroundColor/);
  assert.doesNotMatch(clientSource, /hasNoEntryRestriction \|\| visual\.hasRoadClosedRestriction/);
  assert.doesNotMatch(clientSource, /stroke="#2563eb"/);
  assert.doesNotMatch(clientSource, /stroke="#f59e0b"/);
});

test("learner navigation does not expose dev training authoring tools", () => {
  const sidebarSource = readFileSync("components/layout/Sidebar.tsx", "utf8");
  const practicePageSource = readFileSync("app/practice/page.tsx", "utf8");

  assert.doesNotMatch(sidebarSource, /\/dev\/training-route/);
  assert.doesNotMatch(sidebarSource, /Training Route Author/);
  assert.doesNotMatch(practicePageSource, /\/dev\/training-route/);
  assert.doesNotMatch(practicePageSource, /Training Route Author/);
});
