import assert from "node:assert/strict";
import test from "node:test";
import type { MapDefinition } from "../../../lib/map-engine/index.ts";
import { marloweDistrictMap } from "../../../lib/map-engine/fixtures/index.ts";
import {
  buildLearnerTrainingModePanelModel,
  createLearnerTrainingModeState,
  openLearnerTrainingMode,
  requestLearnerTrainingHint,
  reviewLearnerTrainingAttempt,
  selectLearnerTrainingDifficulty,
  selectLearnerTrainingExerciseType,
  startLearnerTrainingExercise
} from "./learnerTrainingModeUi.ts";

function generatedState(seed = "training-ui-test") {
  return startLearnerTrainingExercise({
    state: openLearnerTrainingMode(createLearnerTrainingModeState()),
    map: marloweDistrictMap,
    seed
  });
}

test("training mode opens from the route runner model", () => {
  const state = openLearnerTrainingMode(createLearnerTrainingModeState());
  const model = buildLearnerTrainingModePanelModel({
    state,
    map: marloweDistrictMap,
    viewport: "desktop"
  });

  assert.equal(model.isOpen, true);
  assert.equal(model.label, "Training Mode");
  assert.ok(model.primaryActions.some((action) => action.id === "generate-exercise" && !action.disabled));
});

test("difficulty and exercise type can be selected", () => {
  const state = selectLearnerTrainingExerciseType(
    selectLearnerTrainingDifficulty(createLearnerTrainingModeState(), "advanced"),
    "practise-junction-decision-making"
  );
  const model = buildLearnerTrainingModePanelModel({
    state,
    map: marloweDistrictMap,
    viewport: "desktop"
  });

  assert.equal(state.selectedDifficulty, "advanced");
  assert.equal(state.selectedExerciseType, "practise-junction-decision-making");
  assert.equal(model.difficultyOptions.find((option) => option.value === "advanced")?.selected, true);
  assert.equal(
    model.exerciseTypeOptions.find((option) => option.value === "practise-junction-decision-making")?.selected,
    true
  );
});

test("exercise generation produces a startable route model", () => {
  const state = generatedState();
  const model = buildLearnerTrainingModePanelModel({
    state,
    map: marloweDistrictMap,
    viewport: "desktop"
  });

  assert.notEqual(state.activeExercise, null);
  assert.match(state.generation.status, /generated|degraded/);
  assert.equal(model.routeSummary?.difficulty, "beginner");
  assert.ok((model.routeSummary?.segmentCount ?? 0) > 0);
  assert.equal(model.validation?.blockingErrorCount, 0);
  assert.ok(model.currentObjective?.title);
  assert.ok(model.currentInstruction?.text);
});

test("hint button advances progressive hint output", () => {
  const firstHintState = requestLearnerTrainingHint({
    state: generatedState("training-ui-hints")
  });
  const firstHintModel = buildLearnerTrainingModePanelModel({
    state: firstHintState,
    map: marloweDistrictMap,
    viewport: "desktop"
  });
  const secondHintState = requestLearnerTrainingHint({
    state: firstHintState
  });
  const secondHintModel = buildLearnerTrainingModePanelModel({
    state: secondHintState,
    map: marloweDistrictMap,
    viewport: "desktop"
  });

  assert.equal(firstHintModel.hint?.requestNumber, 1);
  assert.equal(secondHintModel.hint?.requestNumber, 2);
  assert.ok((secondHintModel.hint?.specificity ?? 0) > (firstHintModel.hint?.specificity ?? 0));
  assert.notEqual(secondHintModel.hint?.text, firstHintModel.hint?.text);
});

test("route and checkpoint overlays render for generated exercises", () => {
  const state = generatedState("training-ui-overlays");
  const model = buildLearnerTrainingModePanelModel({
    state,
    map: marloweDistrictMap,
    viewport: "desktop"
  });

  assert.equal(model.overlay.visible, true);
  assert.ok(model.overlay.route.points.length >= 2);
  assert.ok(model.overlay.route.segmentIds.length > 0);
  assert.ok(model.overlay.checkpoints.some((checkpoint) => checkpoint.role === "start"));
  assert.ok(model.overlay.checkpoints.some((checkpoint) => checkpoint.role === "finish"));
});

test("existing Phase 6 map controls remain present in the training model", () => {
  const model = buildLearnerTrainingModePanelModel({
    state: generatedState("training-ui-phase6-controls"),
    map: marloweDistrictMap,
    viewport: "desktop"
  });

  assert.ok(model.phase6Controls.includes("Practice map"));
  assert.ok(model.phase6Controls.includes("Pan"));
  assert.ok(model.phase6Controls.includes("Draw"));
  assert.ok(model.phase6Controls.includes("Zoom in"));
  assert.ok(model.phase6Controls.includes("Zoom out"));
  assert.ok(model.phase6Controls.includes("Submit"));
});

test("mobile layout keeps primary training actions available", () => {
  const model = buildLearnerTrainingModePanelModel({
    state: generatedState("training-ui-mobile"),
    map: marloweDistrictMap,
    viewport: "mobile"
  });
  const actionIds = model.primaryActions.map((action) => action.id);

  assert.equal(model.mobile.primaryActionsSticky, false);
  assert.equal(model.mobile.controlsAvoidMapOverlay, true);
  assert.equal(model.mobile.minimumTouchTargetPx >= 44, true);
  assert.deepEqual(model.mobile.hiddenPrimaryActionIds, []);
  assert.deepEqual(actionIds, ["open-training-mode", "generate-exercise", "request-hint", "complete-review"]);
});

test("completion review action returns instructor-style feedback", () => {
  const state = reviewLearnerTrainingAttempt({
    state: requestLearnerTrainingHint({
      state: generatedState("training-ui-review")
    }),
    map: marloweDistrictMap
  });
  const model = buildLearnerTrainingModePanelModel({
    state,
    map: marloweDistrictMap,
    viewport: "desktop"
  });

  assert.ok(model.review);
  assert.equal(typeof model.review?.scorePercent, "number");
  assert.ok(model.review?.summary);
});

test("generation failure degrades gracefully without route context", () => {
  const emptyMap: MapDefinition = {
    id: "empty-training-map",
    name: "Empty Training Map",
    nodes: [],
    roads: [],
    restrictions: [],
    landmarks: []
  };
  const state = startLearnerTrainingExercise({
    state: openLearnerTrainingMode(createLearnerTrainingModeState()),
    map: emptyMap,
    seed: "empty"
  });
  const model = buildLearnerTrainingModePanelModel({
    state,
    map: emptyMap,
    viewport: "mobile"
  });

  assert.equal(state.generation.status, "failed");
  assert.equal(state.activeExercise, null);
  assert.equal(model.overlay.visible, false);
  assert.equal(model.primaryActions.find((action) => action.id === "request-hint")?.disabled, true);
  assert.ok(state.generation.explanation);
});
