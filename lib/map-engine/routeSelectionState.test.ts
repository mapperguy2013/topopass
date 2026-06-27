import assert from "node:assert/strict";
import test from "node:test";
import {
  addDraftSelectedNode,
  addDraftSelectedRoad,
  clearDraftRouteSelection,
  clearDraftSelectedExercise,
  clearDraftSelectedNodes,
  clearDraftSelectedRoads,
  createDraftRouteSelectionState,
  removeLastDraftSelectedNode,
  removeLastDraftSelectedRoad,
  setDraftSelectedExercise,
  toRunRouteExerciseDraftInput,
  toUserRouteSelectionInput,
  type DraftRouteSelectionState
} from "./index.ts";

function populatedState(): DraftRouteSelectionState {
  return {
    selectedExerciseId: "exercise-a",
    draftSelectedNodeIds: ["node-a", "node-b"],
    draftSelectedRoadIds: ["road-a"]
  };
}

test("draft route selection initial state is empty", () => {
  assert.deepEqual(createDraftRouteSelectionState(), {
    selectedExerciseId: null,
    draftSelectedNodeIds: [],
    draftSelectedRoadIds: []
  });
});

test("selecting an exercise stores the ID", () => {
  const state = setDraftSelectedExercise(createDraftRouteSelectionState(), "exercise-a");

  assert.equal(state.selectedExerciseId, "exercise-a");
});

test("changing exercise clears draft node and road selections", () => {
  const initial = populatedState();
  const next = setDraftSelectedExercise(initial, "exercise-b");

  assert.deepEqual(initial, populatedState());
  assert.deepEqual(next, {
    selectedExerciseId: "exercise-b",
    draftSelectedNodeIds: [],
    draftSelectedRoadIds: []
  });
});

test("re-selecting the same exercise preserves the current draft", () => {
  const initial = populatedState();
  const next = setDraftSelectedExercise(initial, "exercise-a");

  assert.deepEqual(next, initial);
});

test("clearing exercise clears selected exercise, nodes, and roads", () => {
  const next = clearDraftSelectedExercise(populatedState());

  assert.deepEqual(next, createDraftRouteSelectionState());
});

test("clearing already-empty draft state is safe", () => {
  const initial = createDraftRouteSelectionState();

  assert.deepEqual(clearDraftSelectedExercise(initial), initial);
  assert.deepEqual(clearDraftSelectedNodes(initial), initial);
  assert.deepEqual(clearDraftSelectedRoads(initial), initial);
  assert.deepEqual(clearDraftRouteSelection(initial), initial);
});

test("adding nodes preserves order and does not mutate input", () => {
  const initial = createDraftRouteSelectionState();
  const withFirst = addDraftSelectedNode(initial, "node-a");
  const withSecond = addDraftSelectedNode(withFirst, "node-b");

  assert.deepEqual(initial.draftSelectedNodeIds, []);
  assert.deepEqual(withSecond.draftSelectedNodeIds, ["node-a", "node-b"]);
});

test("adding repeated nodes is allowed", () => {
  const state = addDraftSelectedNode(addDraftSelectedNode(createDraftRouteSelectionState(), "node-a"), "node-a");

  assert.deepEqual(state.draftSelectedNodeIds, ["node-a", "node-a"]);
});

test("removing the last node works", () => {
  const state = removeLastDraftSelectedNode({
    ...createDraftRouteSelectionState(),
    draftSelectedNodeIds: ["node-a", "node-b"]
  });

  assert.deepEqual(state.draftSelectedNodeIds, ["node-a"]);
});

test("removing a node from empty state is safe", () => {
  const initial = createDraftRouteSelectionState();

  assert.deepEqual(removeLastDraftSelectedNode(initial), initial);
});

test("clearing nodes works and leaves roads untouched", () => {
  const state = clearDraftSelectedNodes(populatedState());

  assert.deepEqual(state.draftSelectedNodeIds, []);
  assert.deepEqual(state.draftSelectedRoadIds, ["road-a"]);
});

test("adding roads preserves order and does not mutate input", () => {
  const initial = createDraftRouteSelectionState();
  const withFirst = addDraftSelectedRoad(initial, "road-a");
  const withSecond = addDraftSelectedRoad(withFirst, "road-b");

  assert.deepEqual(initial.draftSelectedRoadIds, []);
  assert.deepEqual(withSecond.draftSelectedRoadIds, ["road-a", "road-b"]);
});

test("adding repeated roads is allowed", () => {
  const state = addDraftSelectedRoad(addDraftSelectedRoad(createDraftRouteSelectionState(), "road-a"), "road-a");

  assert.deepEqual(state.draftSelectedRoadIds, ["road-a", "road-a"]);
});

test("removing the last road works", () => {
  const state = removeLastDraftSelectedRoad({
    ...createDraftRouteSelectionState(),
    draftSelectedRoadIds: ["road-a", "road-b"]
  });

  assert.deepEqual(state.draftSelectedRoadIds, ["road-a"]);
});

test("removing a road from empty state is safe", () => {
  const initial = createDraftRouteSelectionState();

  assert.deepEqual(removeLastDraftSelectedRoad(initial), initial);
});

test("clearing roads works and leaves nodes untouched", () => {
  const state = clearDraftSelectedRoads(populatedState());

  assert.deepEqual(state.draftSelectedNodeIds, ["node-a", "node-b"]);
  assert.deepEqual(state.draftSelectedRoadIds, []);
});

test("clearing the route clears node and road selections but keeps the exercise", () => {
  const state = clearDraftRouteSelection(populatedState());

  assert.equal(state.selectedExerciseId, "exercise-a");
  assert.deepEqual(state.draftSelectedNodeIds, []);
  assert.deepEqual(state.draftSelectedRoadIds, []);
});

test("node and road state are independent", () => {
  const withNode = addDraftSelectedNode(createDraftRouteSelectionState(), "node-a");
  const withRoad = addDraftSelectedRoad(withNode, "road-a");

  assert.deepEqual(withRoad.draftSelectedNodeIds, ["node-a"]);
  assert.deepEqual(withRoad.draftSelectedRoadIds, ["road-a"]);
});

test("derived route selection returns expected nodeIds and roadIds", () => {
  assert.deepEqual(toUserRouteSelectionInput(populatedState()), {
    nodeIds: ["node-a", "node-b"],
    roadIds: ["road-a"]
  });
});

test("derived route selection returns defensive array copies", () => {
  const state = populatedState();
  const selection = toUserRouteSelectionInput(state);

  selection.nodeIds?.push("mutated-node");
  selection.roadIds?.push("mutated-road");

  assert.deepEqual(state.draftSelectedNodeIds, ["node-a", "node-b"]);
  assert.deepEqual(state.draftSelectedRoadIds, ["road-a"]);
});

test("runnable parsed draft returns null when no exercise is selected", () => {
  assert.equal(toRunRouteExerciseDraftInput(createDraftRouteSelectionState()), null);
});

test("runnable parsed draft returns exercise ID plus selection when selected", () => {
  assert.deepEqual(toRunRouteExerciseDraftInput(populatedState()), {
    exerciseId: "exercise-a",
    selection: {
      nodeIds: ["node-a", "node-b"],
      roadIds: ["road-a"]
    }
  });
});
