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
      ["osm-real-pilot-turn-choice", "Whitfield Street to Goodge Street"],
      ["osm-real-pilot-store-street-short-hop", "Store Street short hop"],
      ["osm-real-pilot-gower-to-torrington", "Gower Street to Torrington Place"],
      ["osm-real-pilot-goodge-chenies-ridgmount", "Goodge Street via Chenies Street"],
      ["osm-real-pilot-torrington-byng", "Torrington Place to Byng Place"],
      ["osm-real-pilot-south-crescent-ridgmount-multistop", "South Crescent to Ridgmount Gardens"],
      ["osm-real-pilot-tottenham-to-gower-detour", "Tottenham Court Road to Gower Street"],
      ["osm-real-pilot-torrington-reverse-loop", "Tottenham Court Road to Torrington Place"],
      ["osm-real-pilot-mortimer-goodge-options", "Mortimer Market to Goodge Street"]
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
      ],
      [
        "osm-real-pilot-store-street-short-hop",
        "Start at Store Street east and route legally to Store Street west through the short one-way connector."
      ],
      [
        "osm-real-pilot-gower-to-torrington",
        "Start on Gower Street south and route legally to Torrington Place east."
      ],
      [
        "osm-real-pilot-goodge-chenies-ridgmount",
        "Start on Goodge Street west, pass the Chenies Street checkpoint, then finish at Ridgmount Gardens."
      ],
      [
        "osm-real-pilot-torrington-byng",
        "Start on Torrington Place and route legally to Byng Place."
      ],
      [
        "osm-real-pilot-south-crescent-ridgmount-multistop",
        "Start at Store Street, pass South Crescent and Ridgmount Street, then finish at Ridgmount Gardens."
      ],
      [
        "osm-real-pilot-tottenham-to-gower-detour",
        "Start on Tottenham Court Road north and route legally to Gower Street south via the one-way detour."
      ],
      [
        "osm-real-pilot-torrington-reverse-loop",
        "Start at Tottenham Court Road north and reach Torrington Place east without reversing one-way segments."
      ],
      [
        "osm-real-pilot-mortimer-goodge-options",
        "Start at Mortimer Market and route legally to Goodge Street at Tottenham Court Road, where several connected streets make plausible route choices."
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
      ["osm-real-pilot-turn-choice", "medium"],
      ["osm-real-pilot-store-street-short-hop", "easy"],
      ["osm-real-pilot-gower-to-torrington", "medium"],
      ["osm-real-pilot-goodge-chenies-ridgmount", "medium"],
      ["osm-real-pilot-torrington-byng", "easy"],
      ["osm-real-pilot-south-crescent-ridgmount-multistop", "hard"],
      ["osm-real-pilot-tottenham-to-gower-detour", "hard"],
      ["osm-real-pilot-torrington-reverse-loop", "hard"],
      ["osm-real-pilot-mortimer-goodge-options", "hard"]
    ]
  );
  assert.deepEqual(
    realLondonOsmPilotRouteExercises.map((exercise) => buildRouteExerciseDisplayModel(exercise).difficultyLabel),
    ["Easy", "Medium", "Medium", "Hard", "Medium", "Easy", "Medium", "Medium", "Easy", "Hard", "Hard", "Hard", "Hard"]
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
