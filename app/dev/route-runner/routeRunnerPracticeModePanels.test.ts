import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { RouteExercise } from "../../../lib/map-engine/index.ts";
import { buildDevToolsHomeModel } from "../devTools.ts";
import {
  DEV_TRAINING_ROUTE_AUTHOR_PATH,
  buildTrainingRouteAuthorModel
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

test("curated training route author page renders authoring, validation, preview, and export surfaces", () => {
  const pageSource = readFileSync("app/dev/training-route/page.tsx", "utf8");

  assert.match(pageSource, /Curated Training Route Author/);
  assert.match(pageSource, /buildTrainingRouteAuthorModel/);
  assert.match(pageSource, /Route metadata/);
  assert.match(pageSource, /Validation panel/);
  assert.match(pageSource, /Route complexity summary/);
  assert.match(pageSource, /Export panel/);
  assert.match(pageSource, /Curated route JSON export/);
  assert.match(pageSource, /RouteRunnerClient/);
});

test("curated training route author exports Stage 19 route contract metadata", () => {
  const model = buildTrainingRouteAuthorModel();
  const fieldIds = model.metadataFields.map((field) => field.id);

  assert.equal(model.path, DEV_TRAINING_ROUTE_AUTHOR_PATH);
  assert.equal(model.exportData.schemaVersion, 1);
  assert.equal(model.exportData.mapId, model.sourceMapId);
  assert.ok(model.exportData.metadata.routeId.length > 0);
  assert.ok(model.exportData.start.nodeId.length > 0);
  assert.ok(model.exportData.destination.nodeId.length > 0);
  assert.ok(model.exportData.routeSegmentIds.length > 0);
  assert.ok(model.exportData.complexitySummary.segmentCount > 0);
  assert.ok(model.exportJson.includes('"validationSummary"'));
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
    "status"
  ]);
});

test("curated route author blocks approved status for invalid route candidates", () => {
  const invalidExercise: RouteExercise = {
    id: "invalid-curated-route",
    title: "Invalid curated route",
    mapId: "osm-real-london-pilot",
    difficulty: "medium",
    stops: [
      { type: "node", nodeId: "missing-start" },
      { type: "node", nodeId: "missing-finish" }
    ]
  };
  const model = buildTrainingRouteAuthorModel({
    exercise: invalidExercise,
    statusOverride: "approved"
  });

  assert.equal(model.validation.valid, false);
  assert.equal(model.approvalWarning?.blocking, true);
  assert.match(model.approvalWarning?.message ?? "", /Invalid routes cannot be marked approved/);
});

test("learner navigation does not expose dev training authoring tools", () => {
  const sidebarSource = readFileSync("components/layout/Sidebar.tsx", "utf8");
  const practicePageSource = readFileSync("app/practice/page.tsx", "utf8");

  assert.doesNotMatch(sidebarSource, /\/dev\/training-route/);
  assert.doesNotMatch(sidebarSource, /Training Route Author/);
  assert.doesNotMatch(practicePageSource, /\/dev\/training-route/);
  assert.doesNotMatch(practicePageSource, /Training Route Author/);
});
