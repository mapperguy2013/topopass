import assert from "node:assert/strict";
import test from "node:test";
import { marloweDistrictMap } from "../../../lib/map-engine/index.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  getRouteRunnerMapOption,
  realLondonOsmPilotRouteExercises,
  realLondonOsmPilotRouteMap
} from "./routeRunnerMaps.ts";
import {
  buildCompactRestrictionOverlayModel,
  buildPracticeExercisesPanelModel,
  buildRouteRunnerPanelVisibility,
  isDefaultRouteRunnerMap
} from "./routeRunnerCompactPracticePanels.ts";
import { buildRouteRunnerMobileQaReport } from "./routeRunnerMobileQa.ts";
import { buildRealLondonPilotReadinessReport } from "./routeRunnerOsmRealPilotReadinessReport.ts";
import { buildRealLondonPilotQaPanelModel } from "./routeRunnerRealLondonPilotQaPanel.ts";

const MOBILE_VIEWPORT = {
  viewportWidth: 390,
  viewportHeight: 844
};

test("Stage 131.5 real London QA exercise rows use compact table formatting", () => {
  const panel = buildRealLondonPilotQaPanelModel(buildRealLondonPilotReadinessReport());

  assert.equal(panel.exerciseLayout, "compact-table");
  assert.equal(panel.exerciseRows.length, realLondonOsmPilotRouteExercises.length);
  assert.deepEqual(
    panel.exerciseRows.map((row) => row.compactDisplay),
    panel.exerciseRows.map(() => "table-row")
  );
});

test("Stage 131.5 compact QA rows preserve exercise metadata and readiness state", () => {
  const panel = buildRealLondonPilotQaPanelModel(buildRealLondonPilotReadinessReport());
  const firstRow = panel.exerciseRows[0];

  assert.ok(firstRow);
  assert.equal(firstRow.id, realLondonOsmPilotRouteExercises[0]?.id);
  assert.equal(firstRow.exerciseVersion, "1.0.0");
  assert.ok(["easy", "medium", "hard"].includes(firstRow.difficulty));
  assert.ok(firstRow.routeType.length > 0);
  assert.ok(firstRow.routeTypeLabel.length > 0);
  assert.match(firstRow.estimatedDistanceText, / m$/);
  assert.equal(firstRow.readinessLabel, "Pass");
  assert.equal(firstRow.readinessStatus, "pass");
});

test("Stage 131.5 compact QA rows preserve exercise descriptions as brief text", () => {
  const panel = buildRealLondonPilotQaPanelModel(buildRealLondonPilotReadinessReport());

  for (const row of panel.exerciseRows) {
    assert.ok(row.title.length > 0, row.id);
    assert.equal(row.brief, row.expectedComplexity, row.id);
    assert.ok(row.brief.length > 12, row.id);
  }
});

test("Stage 131.5 practice exercises panel combines official and recommended exercise display without duplicates", () => {
  const selectedExerciseId = realLondonOsmPilotRouteExercises[1]?.id ?? null;
  const model = buildPracticeExercisesPanelModel({
    exercises: realLondonOsmPilotRouteExercises,
    selectedExerciseId,
    recommendedExerciseIds: [
      realLondonOsmPilotRouteExercises[0]?.id ?? "",
      realLondonOsmPilotRouteExercises[0]?.id ?? "",
      realLondonOsmPilotRouteExercises[2]?.id ?? ""
    ]
  });

  assert.equal(model.title, "Practice Exercises");
  assert.equal(model.selectionEnabled, true);
  assert.equal(model.duplicateExerciseIds.length, 0);
  assert.deepEqual(model.recommendedExerciseIds, [
    realLondonOsmPilotRouteExercises[0]?.id,
    realLondonOsmPilotRouteExercises[2]?.id
  ]);
  assert.equal(model.exerciseRows.length, realLondonOsmPilotRouteExercises.length);
  assert.equal(model.exerciseRows.filter((row) => row.selected).map((row) => row.id)[0], selectedExerciseId);
  assert.equal(model.exerciseRows.some((row) => row.recommended), true);
});

test("Stage 131.5 restriction overlay panel is compact by default and hides beta debug details", () => {
  const model = buildCompactRestrictionOverlayModel({
    roadRestrictionOverlayCount: 7,
    turnRestrictionVisualCount: 2,
    visualItems: [
      {
        id: "one-way-a",
        kind: "one-way",
        symbol: "one-way-arrow",
        label: "One-way",
        point: { x: 1, y: 2 },
        points: [{ x: 1, y: 2 }],
        roadIds: ["r1"],
        priority: 1
      },
      {
        id: "wrong-way-a",
        kind: "illegal-movement",
        symbol: "illegal-route-section",
        label: "Wrong-way",
        point: { x: 3, y: 4 },
        points: [{ x: 3, y: 4 }],
        roadIds: ["r2"],
        priority: 2
      }
    ],
    showRoadRestrictions: false,
    showTurnRestrictions: false,
    detailsVisible: false
  });

  assert.equal(model.isCompactByDefault, true);
  assert.equal(model.detailsExpandedByDefault, false);
  assert.equal(model.detailsAccessible, false);
  assert.equal(model.fullDebugDetailsHidden, true);
  assert.deepEqual(
    model.summaryRows.map((row) => [row.id, row.value]),
    [
      ["one-way", "available"],
      ["road-overlays", "disabled"],
      ["turn-overlays", "disabled"],
      ["visible-symbols", "2"]
    ]
  );
});

test("Stage 131.5 restriction overlay debug details remain accessible for dev QA", () => {
  const model = buildCompactRestrictionOverlayModel({
    roadRestrictionOverlayCount: 1,
    turnRestrictionVisualCount: 0,
    visualItems: [
      {
        id: "one-way-a",
        kind: "one-way",
        symbol: "one-way-arrow",
        label: "One-way",
        point: { x: 1, y: 2 },
        points: [{ x: 1, y: 2 }],
        roadIds: ["r1"],
        priority: 1
      }
    ],
    showRoadRestrictions: true,
    showTurnRestrictions: false,
    detailsVisible: true,
    selectedVisualItemId: "one-way-a"
  });

  assert.equal(model.detailsAccessible, true);
  assert.equal(model.fullDebugDetailsHidden, false);
  assert.deepEqual(model.detailItems, [{ id: "one-way-a", label: "One-way", selected: true }]);
});

test("Stage 131.5 beta-student mode hides real London QA and internal diagnostics by default", () => {
  const visibility = buildRouteRunnerPanelVisibility({
    mapId: realLondonOsmPilotRouteMap.id,
    betaEnabled: true,
    devQaVisible: false
  });

  assert.equal(visibility.audience, "beta-student");
  assert.equal(visibility.showStudentBetaPracticePanel, true);
  assert.equal(visibility.showInternalQaPanels, false);
  assert.equal(visibility.showRealLondonQaReadinessPanel, false);
  assert.equal(visibility.showFixtureFilename, false);
  assert.equal(visibility.showQaCounts, false);
  assert.equal(visibility.showMetadataCoverageCounts, false);
  assert.equal(visibility.showFullRestrictionDebugDetails, false);
  assert.equal(visibility.hiddenInternalPanelIds.includes("real-london-readiness-qa"), true);
  assert.equal(visibility.hiddenInternalPanelIds.includes("fixture-filename"), true);
  assert.equal(visibility.visiblePanelIds.includes("real-london-practice-beta"), true);
  assert.equal(visibility.visiblePanelIds.includes("real-london-readiness-qa"), false);
});

test("Stage 131.5 dev QA users can reveal real London readiness diagnostics", () => {
  const visibility = buildRouteRunnerPanelVisibility({
    mapId: realLondonOsmPilotRouteMap.id,
    betaEnabled: true,
    devQaVisible: true
  });

  assert.equal(visibility.audience, "dev-qa");
  assert.equal(visibility.showInternalQaPanels, true);
  assert.equal(visibility.showRealLondonQaReadinessPanel, true);
  assert.equal(visibility.showFixtureFilename, true);
  assert.equal(visibility.visiblePanelIds.includes("real-london-readiness-qa"), true);
  assert.deepEqual(visibility.hiddenInternalPanelIds, []);
});

test("Stage 131.5 beta flag alone does not expose internal diagnostics", () => {
  const visibility = buildRouteRunnerPanelVisibility({
    mapId: realLondonOsmPilotRouteMap.id,
    betaEnabled: true,
    devQaVisible: false
  });

  assert.equal(visibility.devQaToggleLabel, "Show QA/debug panels");
  assert.equal(visibility.showInternalQaPanels, false);
});

test("Stage 131.5 Marlowe remains default and real London QA readiness remains passing", () => {
  const option = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);
  const report = buildRealLondonPilotReadinessReport();

  assert.ok(option);
  assert.equal(DEFAULT_ROUTE_RUNNER_MAP_ID, marloweDistrictMap.id);
  assert.equal(isDefaultRouteRunnerMap(DEFAULT_ROUTE_RUNNER_MAP_ID), true);
  assert.equal(report.isReady, true, report.failureMessages.join("\n"));
  assert.equal(report.acceptanceQa.status, "pass");
});

test("Stage 131.5 existing mobile route-runner layout remains acceptable", () => {
  const option = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.ok(option);

  const report = buildRouteRunnerMobileQaReport({
    mapOption: option,
    ...MOBILE_VIEWPORT
  });

  assert.equal(report.isPassing, true, report.failures.map((failure) => failure.code).join(", "));
  assert.equal(report.horizontalOverflowRisk, false);
});
