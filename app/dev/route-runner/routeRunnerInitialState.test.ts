import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  getRouteRunnerMapOption,
  realLondonOsmPilotRouteMap
} from "./routeRunnerMaps.ts";
import { createRouteRunnerInitialHydrationState } from "./routeRunnerInitialState.ts";

test("route runner initial hydration state uses deterministic default map and exercise", () => {
  const defaultOption = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);
  const initialState = createRouteRunnerInitialHydrationState();

  assert.ok(defaultOption);
  assert.equal(initialState.mapOptionId, defaultOption.id);
  assert.equal(initialState.exerciseId, defaultOption.defaultExerciseId);
});

test("route runner initial hydration state accepts valid explicit map and exercise", () => {
  const realLondonOption = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.ok(realLondonOption);

  const explicitExerciseId = realLondonOption.exercises[1]?.id;

  assert.ok(explicitExerciseId);

  const initialState = createRouteRunnerInitialHydrationState({
    initialMapOptionId: realLondonOsmPilotRouteMap.id,
    initialExerciseId: explicitExerciseId
  });

  assert.equal(initialState.mapOptionId, realLondonOsmPilotRouteMap.id);
  assert.equal(initialState.exerciseId, explicitExerciseId);
});

test("route runner initial hydration state falls back from invalid explicit values", () => {
  const defaultOption = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);
  const initialState = createRouteRunnerInitialHydrationState({
    initialMapOptionId: "unknown-map",
    initialExerciseId: "unknown-exercise"
  });

  assert.ok(defaultOption);
  assert.equal(initialState.mapOptionId, defaultOption.id);
  assert.equal(initialState.exerciseId, defaultOption.defaultExerciseId);
});

test("route runner initial hydration state does not restore browser storage during first render", () => {
  const initialState = createRouteRunnerInitialHydrationState();

  assert.deepEqual(initialState.weakAreaProfile, {
    attemptsReviewed: 0,
    totalWeaknessCount: 0,
    weaknesses: []
  });
  assert.equal(initialState.adaptiveLauncherState.activeAdaptivePracticeItemId, null);
  assert.deepEqual(initialState.adaptiveLauncherState.skippedPracticeItemIds, []);
  assert.deepEqual(initialState.adaptiveLauncherState.dismissedPracticeItemIds, []);
  assert.deepEqual(initialState.adaptiveLauncherState.completedPracticeItemIds, []);
  assert.equal(initialState.adaptiveLauncherState.lastStartedPracticeItemId, null);
  assert.equal(initialState.adaptiveLauncherState.practiceSessionStartedAt, null);
  assert.deepEqual(initialState.adaptiveLauncherState.outcomeFeedbackHistory, []);
});
