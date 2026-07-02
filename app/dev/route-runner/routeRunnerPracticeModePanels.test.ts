import assert from "node:assert/strict";
import test from "node:test";
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
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("OSM debug"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("Converted OSM QA"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("Real London Pilot QA"));
  assert.ok(visibility.hiddenDevOnlyPanelLabels.includes("raw debug"));
});

test("dev route-runner mode keeps dev-only route-runner panel labels available", () => {
  const visibility = buildRouteRunnerPracticeModePanelVisibility({ mode: "dev" });

  assert.equal(visibility.showDeveloperPanels, true);
  assert.deepEqual(visibility.visibleDevOnlyPanelLabels, [...ROUTE_RUNNER_DEV_ONLY_PANEL_LABELS]);
  assert.deepEqual(visibility.hiddenDevOnlyPanelLabels, []);
});

test("beta practice mode preserves core student-facing route-runner labels", () => {
  const visibility = buildRouteRunnerPracticeModePanelVisibility({ mode: "student-beta" });

  assert.deepEqual(visibility.visibleCorePanelLabels, [...ROUTE_RUNNER_BETA_CORE_PANEL_LABELS]);
  assert.ok(visibility.visibleCorePanelLabels.includes("Real London Practice - Beta"));
  assert.ok(visibility.visibleCorePanelLabels.includes("Practice Exercises"));
  assert.ok(visibility.visibleCorePanelLabels.includes("Route instructions"));
  assert.ok(visibility.visibleCorePanelLabels.includes("Route map workspace"));
  assert.ok(visibility.visibleCorePanelLabels.includes("Attempt review"));
  assert.ok(visibility.visibleCorePanelLabels.includes("Submit Attempt"));
});
