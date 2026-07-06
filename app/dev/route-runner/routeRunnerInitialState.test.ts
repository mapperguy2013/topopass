import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  getRouteRunnerMapOption,
  realLondonOsmPilotRouteMap
} from "./routeRunnerMaps.ts";
import { ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON } from "./curatedRealLondonRouteRunnerMaps.ts";
import {
  createRouteRunnerInitialHydrationState,
  resolveRouteRunnerExerciseSelection
} from "./routeRunnerInitialState.ts";

test("route runner initial hydration state uses deterministic default map and exercise", () => {
  const defaultOption = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);
  const initialState = createRouteRunnerInitialHydrationState({
    mapOptions: ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON
  });

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
    initialExerciseId: explicitExerciseId,
    mapOptions: ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON
  });

  assert.equal(initialState.mapOptionId, realLondonOsmPilotRouteMap.id);
  assert.equal(initialState.exerciseId, explicitExerciseId);
});

test("route runner initial hydration state falls back from invalid explicit values", () => {
  const defaultOption = getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);
  const initialState = createRouteRunnerInitialHydrationState({
    initialMapOptionId: "unknown-map",
    initialExerciseId: "unknown-exercise",
    mapOptions: ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON
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

test("Stage 161.6.3 route runner initial heading is deterministic for beta map and exercise props", () => {
  const selectedMapId = "osm-curated-waterloo-bridge";
  const selectedExerciseId = "osm-curated-waterloo-bridge-station-context-checkpoint";
  const firstInitialState = createRouteRunnerInitialHydrationState({
    initialMapOptionId: selectedMapId,
    initialExerciseId: selectedExerciseId,
    mapOptions: ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON
  });
  const secondInitialState = createRouteRunnerInitialHydrationState({
    initialMapOptionId: selectedMapId,
    initialExerciseId: selectedExerciseId,
    mapOptions: ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON
  });
  const selectedOption = ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON.find(
    (option) => option.id === firstInitialState.mapOptionId
  );
  const heading =
    selectedOption?.exercises.find((exercise) => exercise.id === firstInitialState.exerciseId)?.title ??
    `${selectedOption?.label ?? "Unknown map"} route exercise runner`;

  assert.deepEqual(firstInitialState, secondInitialState);
  assert.equal(firstInitialState.mapOptionId, selectedMapId);
  assert.equal(firstInitialState.exerciseId, selectedExerciseId);
  assert.equal(heading, "Waterloo Bridge: riverside checkpoint route");
});

test("Stage 161.6.4 route runner exercise selection accepts non-default curated exercises", () => {
  const oneWayOption = ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON.find(
    (option) => option.id === "osm-curated-one-way-system-area"
  );

  assert.ok(oneWayOption);

  const restrictionExerciseId = "osm-curated-one-way-system-area-restriction-checkpoint-route";
  const selectedExerciseId = resolveRouteRunnerExerciseSelection({
    exercises: oneWayOption.exercises,
    requestedExerciseId: restrictionExerciseId,
    defaultExerciseId: oneWayOption.defaultExerciseId,
    scoreable: true
  });

  assert.equal(selectedExerciseId, restrictionExerciseId);
  assert.notEqual(selectedExerciseId, oneWayOption.defaultExerciseId);
});

test("Stage 161.6.4 route runner exercise selection falls back deterministically for invalid or visual-only fixtures", () => {
  const waterlooOption = ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON.find(
    (option) => option.id === "osm-curated-waterloo-bridge"
  );

  assert.ok(waterlooOption);

  assert.equal(
    resolveRouteRunnerExerciseSelection({
      exercises: waterlooOption.exercises,
      requestedExerciseId: "not-a-waterloo-exercise",
      defaultExerciseId: waterlooOption.defaultExerciseId,
      scoreable: true
    }),
    waterlooOption.defaultExerciseId
  );
  assert.equal(
    resolveRouteRunnerExerciseSelection({
      exercises: waterlooOption.exercises,
      requestedExerciseId: waterlooOption.exercises[1]?.id,
      defaultExerciseId: waterlooOption.defaultExerciseId,
      scoreable: false
    }),
    ""
  );
});
