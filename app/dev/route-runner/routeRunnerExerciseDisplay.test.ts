import assert from "node:assert/strict";
import test from "node:test";
import type { RouteExercise } from "../../../lib/map-engine/index.ts";
import { realLondonOsmPilotRouteExercises } from "./routeRunnerMaps.ts";
import {
  buildRouteExerciseDisplayModel,
  formatRouteExerciseSelectorLabel,
  getRouteExerciseDescription,
  getRouteExerciseDifficulty,
  getRouteExerciseDifficultyLabel,
  getRouteExerciseDisplayTitle
} from "./routeRunnerExerciseDisplay.ts";

test("real London pilot exercises have trainee-facing display labels", () => {
  assert.deepEqual(
    realLondonOsmPilotRouteExercises.map((exercise) => [exercise.id, buildRouteExerciseDisplayModel(exercise).title]),
    [
      ["osm-real-pilot-short-crossing", "Goodge Street to Tottenham Court Road"],
      ["osm-real-pilot-one-way-detour", "Torrington Place one-way check"],
      ["osm-real-pilot-checkpoint-route", "Huntley Street via Chenies Street"],
      ["osm-real-pilot-longer-route", "Goodge Street to Byng Place"],
      ["osm-real-pilot-turn-choice", "Whitfield Street to Goodge Street"]
    ]
  );

  assert.equal(realLondonOsmPilotRouteExercises.some((exercise) => exercise.title.startsWith("Real OSM pilot:")), false);
});

test("real London pilot exercises have concise trainee-facing descriptions", () => {
  assert.deepEqual(
    realLondonOsmPilotRouteExercises.map((exercise) => [exercise.id, buildRouteExerciseDisplayModel(exercise).description]),
    [
      [
        "osm-real-pilot-short-crossing",
        "Start on Goodge Street west and route legally to Tottenham Court Road, respecting one-way restrictions."
      ],
      [
        "osm-real-pilot-one-way-detour",
        "Start at Torrington Place east and route legally to Tottenham Court Road north on the committed real London pilot graph."
      ],
      [
        "osm-real-pilot-checkpoint-route",
        "Start on Huntley Street south, pass the Chenies Street checkpoint, then finish at Ridgmount Gardens."
      ],
      ["osm-real-pilot-longer-route", "Start on Goodge Street west and route legally to Byng Place."],
      [
        "osm-real-pilot-turn-choice",
        "Start on Whitfield Street and route legally to Goodge Street at Tottenham Court Road."
      ]
    ]
  );
});

test("real London pilot exercises expose valid difficulty labels without changing ids", () => {
  assert.deepEqual(
    realLondonOsmPilotRouteExercises.map((exercise) => [exercise.id, exercise.difficulty]),
    [
      ["osm-real-pilot-short-crossing", "easy"],
      ["osm-real-pilot-one-way-detour", "medium"],
      ["osm-real-pilot-checkpoint-route", "medium"],
      ["osm-real-pilot-longer-route", "hard"],
      ["osm-real-pilot-turn-choice", "medium"]
    ]
  );
  assert.deepEqual(
    realLondonOsmPilotRouteExercises.map((exercise) => buildRouteExerciseDisplayModel(exercise).difficultyLabel),
    ["Easy", "Medium", "Medium", "Hard", "Medium"]
  );
});

test("route exercise display helpers fall back safely for older exercise metadata", () => {
  const legacyExercise: RouteExercise = {
    id: "legacy-exercise-id",
    title: "  ",
    mapId: "legacy-map",
    stops: []
  };
  const display = buildRouteExerciseDisplayModel(legacyExercise);

  assert.equal(getRouteExerciseDisplayTitle(legacyExercise), "legacy-exercise-id");
  assert.equal(getRouteExerciseDescription(legacyExercise), null);
  assert.equal(getRouteExerciseDifficulty(legacyExercise), null);
  assert.equal(getRouteExerciseDifficultyLabel(legacyExercise), null);
  assert.deepEqual(display, {
    id: "legacy-exercise-id",
    title: "legacy-exercise-id",
    selectorLabel: "legacy-exercise-id",
    description: null,
    difficulty: null,
    difficultyLabel: null
  });
  assert.equal(formatRouteExerciseSelectorLabel(legacyExercise), "legacy-exercise-id");
  assert.equal(
    formatRouteExerciseSelectorLabel(legacyExercise, "Invalid - no legal route"),
    "legacy-exercise-id (Invalid - no legal route)"
  );
});

test("route exercise display helpers ignore unknown difficulty values", () => {
  const exerciseWithUnknownDifficulty = {
    id: "unknown-difficulty",
    title: "Unknown difficulty",
    mapId: "legacy-map",
    stops: [],
    difficulty: "expert",
    description: "  "
  } as unknown as RouteExercise;

  assert.equal(getRouteExerciseDescription(exerciseWithUnknownDifficulty), null);
  assert.equal(getRouteExerciseDifficulty(exerciseWithUnknownDifficulty), null);
  assert.equal(getRouteExerciseDifficultyLabel(exerciseWithUnknownDifficulty), null);
});
