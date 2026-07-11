import assert from "node:assert/strict";
import test from "node:test";
import {
  MARLOWE_DISTRICT_EXERCISE_METADATA,
  MARLOWE_DISTRICT_MAP_METADATA,
  MARLOWE_DISTRICT_METADATA_CATALOGUE,
  createExerciseMetadataIndex,
  createMapMetadataIndex,
  exerciseMetadataCatalogueToAdaptivePracticeExercises,
  exerciseMetadataToAdaptivePracticeExercise,
  findExerciseMetadataByDifficulty,
  findExerciseMetadataBySkill,
  findExerciseMetadataByWeakArea,
  getExerciseMetadata,
  getMapMetadataForExercise,
  routeExerciseToAdaptivePracticeExercise,
  validateExerciseMapMetadata,
  type ExerciseMetadata,
  type MapMetadata
} from "./exerciseMapMetadata.ts";
import {
  marloweDistrictMap,
  marloweDistrictRouteExercises
} from "../../../lib/map-engine/fixtures/marloweDistrictMap.ts";

test("Marlowe District map metadata identifies the dev map and restriction tags", () => {
  assert.equal(MARLOWE_DISTRICT_MAP_METADATA.id, marloweDistrictMap.id);
  assert.equal(MARLOWE_DISTRICT_MAP_METADATA.mapKind, "synthetic-dev");
  assert.ok(MARLOWE_DISTRICT_MAP_METADATA.featureTags.includes("dense-network"));
  assert.ok(MARLOWE_DISTRICT_MAP_METADATA.restrictionTags.includes("no-entry"));
  assert.ok(MARLOWE_DISTRICT_MAP_METADATA.restrictionTags.includes("prohibited-turn"));
});

test("Marlowe exercise metadata covers every current route exercise", () => {
  assert.deepEqual(
    MARLOWE_DISTRICT_EXERCISE_METADATA.map((metadata) => metadata.exerciseId).sort(),
    marloweDistrictRouteExercises.map((exercise) => exercise.id).sort()
  );
});

test("Marlowe metadata validates against current map and exercises", () => {
  const result = validateExerciseMapMetadata({
    maps: MARLOWE_DISTRICT_METADATA_CATALOGUE.maps,
    exercises: MARLOWE_DISTRICT_METADATA_CATALOGUE.exercises,
    routeExercises: marloweDistrictRouteExercises,
    mapDefinitions: [marloweDistrictMap]
  });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.issues, []);
});

test("metadata indexes and lookups return defensive copies", () => {
  const mapIndex = createMapMetadataIndex(MARLOWE_DISTRICT_METADATA_CATALOGUE.maps);
  const exerciseIndex = createExerciseMetadataIndex(MARLOWE_DISTRICT_METADATA_CATALOGUE.exercises);
  const exercise = getExerciseMetadata(MARLOWE_DISTRICT_METADATA_CATALOGUE.exercises, "ex-station-to-hospital");
  const map = getMapMetadataForExercise(MARLOWE_DISTRICT_METADATA_CATALOGUE, "ex-station-to-hospital");

  assert.equal(mapIndex.get(marloweDistrictMap.id)?.title, "Marlowe District");
  assert.equal(exerciseIndex.get("ex-station-to-hospital")?.difficulty, "easy");
  assert.equal(exercise?.title, "Fox Lane Station to Northgate Hospital");
  assert.equal(map?.id, marloweDistrictMap.id);

  if (!exercise || !map) {
    throw new Error("Expected metadata lookup results.");
  }

  exercise.skillTags.push("map-reading");
  map.featureTags.push("long-route");

  assert.notDeepEqual(
    exercise.skillTags,
    getExerciseMetadata(MARLOWE_DISTRICT_METADATA_CATALOGUE.exercises, "ex-station-to-hospital")?.skillTags
  );
  assert.notDeepEqual(
    map.featureTags,
    getMapMetadataForExercise(MARLOWE_DISTRICT_METADATA_CATALOGUE, "ex-station-to-hospital")?.featureTags
  );
});

test("metadata search helpers filter by weak area skill and difficulty", () => {
  assert.deepEqual(
    findExerciseMetadataByWeakArea(MARLOWE_DISTRICT_EXERCISE_METADATA, "prohibited-turn").map(
      (metadata) => metadata.exerciseId
    ),
    [
      "ex-church-to-east-dock",
      "ex-crown-market-gardens",
      "ex-prohibited-turn-albion-theatre",
      "ex-mixed-difficulty-church-market-theatre-dock"
    ]
  );
  assert.deepEqual(
    findExerciseMetadataBySkill(MARLOWE_DISTRICT_EXERCISE_METADATA, "checkpoint-ordering").map(
      (metadata) => metadata.exerciseId
    ),
    [
      "ex-library-market-museum",
      "ex-gardens-yard-exchange",
      "ex-crown-market-gardens",
      "ex-checkpoint-order-library-dock",
      "ex-mixed-difficulty-church-market-theatre-dock"
    ]
  );
  assert.deepEqual(
    findExerciseMetadataByDifficulty(MARLOWE_DISTRICT_EXERCISE_METADATA, "hard").map(
      (metadata) => metadata.exerciseId
    ),
    [
      "ex-church-to-east-dock",
      "ex-crown-market-gardens",
      "ex-no-entry-eastgate-market",
      "ex-prohibited-turn-albion-theatre",
      "ex-checkpoint-order-library-dock"
    ]
  );
});

test("exercise metadata converts into the adaptive practice catalogue shape", () => {
  const metadata = getExerciseMetadata(MARLOWE_DISTRICT_EXERCISE_METADATA, "ex-canal-to-theatre");

  if (!metadata) {
    throw new Error("Expected exercise metadata.");
  }

  const adaptiveExercise = exerciseMetadataToAdaptivePracticeExercise(metadata);

  assert.equal(adaptiveExercise.id, "ex-canal-to-theatre");
  assert.equal(adaptiveExercise.difficulty, "medium");
  assert.ok(adaptiveExercise.focusAreas.includes("disconnected-drawing"));
  assert.ok(adaptiveExercise.focusAreas.includes("insufficient-drawing"));
  assert.ok(adaptiveExercise.focusAreas.includes("map-reading"));
});

test("metadata catalogue conversion preserves stable exercise order", () => {
  assert.deepEqual(
    exerciseMetadataCatalogueToAdaptivePracticeExercises(MARLOWE_DISTRICT_EXERCISE_METADATA).map(
      (exercise) => exercise.id
    ),
    MARLOWE_DISTRICT_EXERCISE_METADATA.map((metadata) => metadata.exerciseId)
  );
});

test("route exercises convert into adaptive candidates for Real London route metadata", () => {
  const adaptiveExercise = routeExerciseToAdaptivePracticeExercise({
    id: "osm-curated-one-way-system-area-short-one-way-route",
    mapId: "osm-curated-one-way-system-area",
    title: "One-way system: short legal route",
    description: "Short beta route for one-way and restriction cartography.",
    difficulty: "medium",
    stops: [
      {
        type: "node",
        nodeId: "start"
      },
      {
        type: "node",
        nodeId: "finish"
      }
    ],
    realLondonPilotMetadata: {
      difficulty: "medium",
      routeType: "one-way-awareness",
      estimatedDistanceMeters: 520,
      expectedComplexity: "Medium one-way-awareness route where the legal path checks traffic flow."
    }
  });

  assert.equal(adaptiveExercise.id, "osm-curated-one-way-system-area-short-one-way-route");
  assert.equal(adaptiveExercise.difficulty, "medium");
  assert.ok(adaptiveExercise.focusAreas.includes("one-way-direction"));
  assert.ok(adaptiveExercise.focusAreas.includes("restriction-focus"));
  assert.ok(adaptiveExercise.focusAreas.includes("route-drawing-focus"));
  assert.ok(adaptiveExercise.focusAreas.includes("route-efficiency"));
});

test("route exercise adaptive conversion recognises checkpoint and no-entry language", () => {
  const adaptiveExercise = routeExerciseToAdaptivePracticeExercise({
    id: "real-london-checkpoint-no-entry",
    mapId: "osm-real-london-pilot",
    title: "Checkpoint route around no-entry roads",
    description: "Visit the checkpoint in order, avoid no-entry approaches, and choose the shortest legal route.",
    difficulty: "hard",
    stops: [
      {
        type: "node",
        nodeId: "start"
      },
      {
        type: "node",
        nodeId: "checkpoint"
      },
      {
        type: "node",
        nodeId: "finish"
      }
    ]
  });

  assert.equal(adaptiveExercise.difficulty, "hard");
  assert.ok(adaptiveExercise.focusAreas.includes("checkpoint-focus"));
  assert.ok(adaptiveExercise.focusAreas.includes("missed-checkpoint"));
  assert.ok(adaptiveExercise.focusAreas.includes("no-entry"));
  assert.ok(adaptiveExercise.focusAreas.includes("route-efficiency"));
  assert.ok(adaptiveExercise.focusAreas.includes("advanced-route"));
});

test("metadata validation reports duplicate ids unknown maps missing route coverage and invalid durations", () => {
  const badMap: MapMetadata = {
    ...MARLOWE_DISTRICT_MAP_METADATA,
    id: "unknown-map",
    title: "",
    featureTags: [],
    restrictionTags: []
  };
  const badExercise: ExerciseMetadata = {
    ...MARLOWE_DISTRICT_EXERCISE_METADATA[0],
    exerciseId: "unknown-exercise",
    mapId: "missing-map",
    title: "",
    estimatedMinutes: 0,
    skillTags: [],
    weakAreaTags: [],
    routeFeatureTags: [],
    prerequisiteExerciseIds: ["missing-prerequisite"],
    relatedExerciseIds: ["missing-related"]
  };
  const result = validateExerciseMapMetadata({
    maps: [badMap, badMap],
    exercises: [badExercise, badExercise],
    routeExercises: marloweDistrictRouteExercises,
    mapDefinitions: [marloweDistrictMap]
  });
  const codes = result.issues.map((issue) => issue.code);

  assert.equal(result.isValid, false);
  assert.ok(codes.includes("duplicate-map-id"));
  assert.ok(codes.includes("duplicate-exercise-id"));
  assert.ok(codes.includes("unknown-map-id"));
  assert.ok(codes.includes("unknown-route-exercise-id"));
  assert.ok(codes.includes("missing-exercise-metadata"));
  assert.ok(codes.includes("invalid-estimated-minutes"));
  assert.ok(codes.includes("unknown-related-exercise"));
  assert.ok(codes.includes("unknown-prerequisite-exercise"));
});
