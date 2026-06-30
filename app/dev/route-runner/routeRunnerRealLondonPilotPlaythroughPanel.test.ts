import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  mediumLondonOsmRouteMap,
  realLondonOsmPilotRouteMap,
  tinyLondonOsmRouteMap
} from "./routeRunnerMaps.ts";
import {
  buildRealLondonPilotPlaythroughPanelModel,
  shouldShowRealLondonPilotPlaythroughPanel,
  type BuildRealLondonPilotPlaythroughPanelInput
} from "./routeRunnerRealLondonPilotPlaythroughPanel.ts";

const CHECKPOINT_EXERCISE_INPUT: BuildRealLondonPilotPlaythroughPanelInput = {
  mapId: realLondonOsmPilotRouteMap.id,
  selectedExerciseId: "osm-real-pilot-checkpoint-route",
  startLabel: "Huntley Street south (osm-node-14725979)",
  destinationLabel: "Ridgmount Gardens (osm-node-108030)",
  checkpointLabels: ["Chenies Street checkpoint (osm-node-108025)"],
  hasLegalRevealRoute: true,
  isRevealRouteVisible: false,
  isDrawing: false,
  drawnPointCount: 0,
  drawnReviewStatus: "pending",
  manualRunStatus: null,
  illegalHighlightCount: 0
};

const DIRECT_EXERCISE_INPUT: BuildRealLondonPilotPlaythroughPanelInput = {
  ...CHECKPOINT_EXERCISE_INPUT,
  selectedExerciseId: "osm-real-pilot-short-crossing",
  startLabel: "Goodge Street west (osm-node-107319)",
  destinationLabel: "Tottenham Court Road (osm-node-107320)",
  checkpointLabels: []
};

test("playthrough panel shows for the real London pilot map", () => {
  const model = buildRealLondonPilotPlaythroughPanelModel(CHECKPOINT_EXERCISE_INPUT);

  assert.equal(shouldShowRealLondonPilotPlaythroughPanel(realLondonOsmPilotRouteMap.id), true);
  assert.equal(model.shouldShowPanel, true);
  assert.equal(model.title, "Real London Pilot Playthrough");
});

test("playthrough panel does not show for the Marlowe default synthetic map", () => {
  const model = buildRealLondonPilotPlaythroughPanelModel({
    ...DIRECT_EXERCISE_INPUT,
    mapId: DEFAULT_ROUTE_RUNNER_MAP_ID
  });

  assert.equal(shouldShowRealLondonPilotPlaythroughPanel(DEFAULT_ROUTE_RUNNER_MAP_ID), false);
  assert.equal(model.shouldShowPanel, false);
});

test("playthrough panel does not show for tiny or medium OSM maps", () => {
  const tinyModel = buildRealLondonPilotPlaythroughPanelModel({
    ...DIRECT_EXERCISE_INPUT,
    mapId: tinyLondonOsmRouteMap.id
  });
  const mediumModel = buildRealLondonPilotPlaythroughPanelModel({
    ...DIRECT_EXERCISE_INPUT,
    mapId: mediumLondonOsmRouteMap.id
  });

  assert.equal(tinyModel.shouldShowPanel, false);
  assert.equal(mediumModel.shouldShowPanel, false);
});

test("playthrough panel displays selected exercise id and stable stop labels", () => {
  const model = buildRealLondonPilotPlaythroughPanelModel(CHECKPOINT_EXERCISE_INPUT);

  assert.equal(model.selectedExerciseId, "osm-real-pilot-checkpoint-route");
  assert.equal(model.startLabel, "Huntley Street south (osm-node-14725979)");
  assert.equal(model.destinationLabel, "Ridgmount Gardens (osm-node-108030)");
  assert.equal(model.rows.find((row) => row.id === "exercise-id")?.value, "osm-real-pilot-checkpoint-route");
});

test("playthrough panel displays checkpoints in order", () => {
  const model = buildRealLondonPilotPlaythroughPanelModel({
    ...CHECKPOINT_EXERCISE_INPUT,
    checkpointLabels: [
      "First checkpoint (osm-node-a)",
      "Second checkpoint (osm-node-b)",
      "Third checkpoint (osm-node-c)"
    ]
  });

  assert.deepEqual(model.checkpointLabels, [
    "First checkpoint (osm-node-a)",
    "Second checkpoint (osm-node-b)",
    "Third checkpoint (osm-node-c)"
  ]);
  assert.equal(
    model.checkpointSummary,
    "First checkpoint (osm-node-a) -> Second checkpoint (osm-node-b) -> Third checkpoint (osm-node-c)"
  );
});

test("playthrough panel displays missing checkpoints as none", () => {
  const model = buildRealLondonPilotPlaythroughPanelModel(DIRECT_EXERCISE_INPUT);

  assert.deepEqual(model.checkpointLabels, []);
  assert.equal(model.checkpointSummary, "none");
  assert.equal(model.rows.find((row) => row.id === "checkpoints")?.value, "none");
});

test("playthrough panel formats reveal route availability clearly", () => {
  const availableModel = buildRealLondonPilotPlaythroughPanelModel(CHECKPOINT_EXERCISE_INPUT);
  const visibleModel = buildRealLondonPilotPlaythroughPanelModel({
    ...CHECKPOINT_EXERCISE_INPUT,
    isRevealRouteVisible: true
  });
  const unavailableModel = buildRealLondonPilotPlaythroughPanelModel({
    ...CHECKPOINT_EXERCISE_INPUT,
    hasLegalRevealRoute: false
  });

  assert.equal(availableModel.revealRouteStatus, "available");
  assert.equal(availableModel.revealRouteText, "Reveal route is available for comparison.");
  assert.equal(visibleModel.revealRouteStatus, "visible");
  assert.equal(visibleModel.revealRouteText, "Reveal route is visible for comparison.");
  assert.equal(unavailableModel.revealRouteStatus, "unavailable");
  assert.equal(unavailableModel.revealRouteText, "Reveal route is unavailable for this exercise.");
});

test("playthrough panel formats empty attempt state clearly", () => {
  const model = buildRealLondonPilotPlaythroughPanelModel(DIRECT_EXERCISE_INPUT);

  assert.equal(model.attemptStatus, "empty");
  assert.equal(model.attemptStatusText, "Current attempt has no route yet.");
  assert.equal(model.nextAction, "Draw from the start marker to the destination marker.");
});

test("playthrough panel formats accepted manual attempt state clearly", () => {
  const model = buildRealLondonPilotPlaythroughPanelModel({
    ...DIRECT_EXERCISE_INPUT,
    manualRunStatus: "accepted"
  });

  assert.equal(model.attemptStatus, "accepted");
  assert.equal(model.attemptStatusText, "Current attempt is legal.");
  assert.equal(model.nextAction, "Compare against the reveal route or try another real London exercise.");
});

test("playthrough panel formats rejected illegal-highlight state clearly", () => {
  const model = buildRealLondonPilotPlaythroughPanelModel({
    ...DIRECT_EXERCISE_INPUT,
    drawnPointCount: 24,
    drawnReviewStatus: "fail",
    illegalHighlightCount: 2
  });

  assert.equal(model.attemptStatus, "rejected");
  assert.equal(model.attemptStatusText, "Current attempt is rejected.");
  assert.equal(model.illegalHighlightStatus, "present");
  assert.equal(model.illegalHighlightText, "Current attempt has illegal movements highlighted.");
  assert.equal(model.nextAction, "Review the highlighted illegal movements, then redraw or adjust the route.");
});

test("playthrough panel next action text is deterministic for major states", () => {
  const noExerciseModel = buildRealLondonPilotPlaythroughPanelModel({
    ...DIRECT_EXERCISE_INPUT,
    selectedExerciseId: null,
    startLabel: null,
    destinationLabel: null,
    hasLegalRevealRoute: false
  });
  const checkpointEmptyModel = buildRealLondonPilotPlaythroughPanelModel(CHECKPOINT_EXERCISE_INPUT);
  const inProgressModel = buildRealLondonPilotPlaythroughPanelModel({
    ...DIRECT_EXERCISE_INPUT,
    isDrawing: true,
    drawnPointCount: 4
  });
  const rejectedModel = buildRealLondonPilotPlaythroughPanelModel({
    ...DIRECT_EXERCISE_INPUT,
    drawnPointCount: 12,
    drawnReviewStatus: "blocked"
  });

  assert.equal(noExerciseModel.nextAction, "Select a real London exercise to begin.");
  assert.equal(
    checkpointEmptyModel.nextAction,
    "Draw from the start marker, visit checkpoints in order, then finish at the destination marker."
  );
  assert.equal(inProgressModel.nextAction, "Finish drawing from the start marker to the destination marker.");
  assert.equal(rejectedModel.nextAction, "Use the feedback and redraw or edit the manual route before testing again.");
});

test("repeated playthrough panel formatting produces identical output", () => {
  assert.deepEqual(
    buildRealLondonPilotPlaythroughPanelModel(CHECKPOINT_EXERCISE_INPUT),
    buildRealLondonPilotPlaythroughPanelModel(CHECKPOINT_EXERCISE_INPUT)
  );
});
