import assert from "node:assert/strict";
import test from "node:test";
import { marloweDistrictMap, marloweDistrictRouteExercises } from "../../../lib/map-engine/index.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  ROUTE_RUNNER_MAP_OPTIONS,
  getRouteRunnerMapOption,
  getRealLondonPilotExerciseMetadata,
  realLondonOsmPilotRouteExercises,
  realLondonOsmPilotRouteMap
} from "./routeRunnerMaps.ts";
import { buildRealLondonPilotReadinessReport } from "./routeRunnerOsmRealPilotReadinessReport.ts";
import { buildRealLondonPilotQaPanelModel } from "./routeRunnerRealLondonPilotQaPanel.ts";
import {
  isSimpleSemverVersion,
  validateExerciseVersionMetadata,
  validateMapVersionMetadata,
  validateRegisteredRouteRunnerVersionMetadata
} from "./routeRunnerVersionMetadata.ts";

test("Stage 124 every registered route-runner map has valid mapVersion metadata", () => {
  const result = validateRegisteredRouteRunnerVersionMetadata(ROUTE_RUNNER_MAP_OPTIONS);

  assert.equal(result.isValid, true, result.errors.map((error) => error.message).join("\n"));
  assert.deepEqual(result.errors, []);

  for (const option of ROUTE_RUNNER_MAP_OPTIONS) {
    assert.equal(option.map.mapVersion, "1.0.0", option.id);
    assert.equal(isSimpleSemverVersion(option.map.mapVersion), true, option.id);
  }
});

test("Stage 124 every registered route-runner exercise has valid exerciseVersion metadata", () => {
  for (const option of ROUTE_RUNNER_MAP_OPTIONS) {
    for (const exercise of option.exercises) {
      assert.equal(exercise.exerciseVersion, "1.0.0", `${option.id} ${exercise.id}`);
      assert.equal(isSimpleSemverVersion(exercise.exerciseVersion), true, exercise.id);
    }
  }
});

test("Stage 124 version validation rejects missing empty and non-semver values", () => {
  assert.deepEqual(validateMapVersionMetadata({ id: "missing-map-version" })[0], {
    scope: "map",
    mapId: "missing-map-version",
    field: "mapVersion",
    value: undefined,
    message: "map-version:invalid | map=missing-map-version | mapVersion must use major.minor.patch semver format."
  });
  assert.deepEqual(validateMapVersionMetadata({ id: "empty-map-version", mapVersion: "" })[0], {
    scope: "map",
    mapId: "empty-map-version",
    field: "mapVersion",
    value: "",
    message: "map-version:invalid | map=empty-map-version | mapVersion must use major.minor.patch semver format."
  });
  assert.deepEqual(validateExerciseVersionMetadata("marlowe-district-dev-map", { id: "bad-exercise", exerciseVersion: "v1" })[0], {
    scope: "exercise",
    mapId: "marlowe-district-dev-map",
    exerciseId: "bad-exercise",
    field: "exerciseVersion",
    value: "v1",
    message:
      "exercise-version:invalid | map=marlowe-district-dev-map | exercise=bad-exercise | exerciseVersion must use major.minor.patch semver format."
  });

  assert.equal(isSimpleSemverVersion("1.0.0"), true);
  assert.equal(isSimpleSemverVersion("10.20.30"), true);
  assert.equal(isSimpleSemverVersion(""), false);
  assert.equal(isSimpleSemverVersion("1"), false);
  assert.equal(isSimpleSemverVersion("1.0"), false);
  assert.equal(isSimpleSemverVersion("1.0.0-beta"), false);
  assert.equal(isSimpleSemverVersion(1), false);
});

test("Stage 124 keeps real London pilot Stage 123 metadata and adds exercise versions", () => {
  for (const exercise of realLondonOsmPilotRouteExercises) {
    const metadata = getRealLondonPilotExerciseMetadata(exercise);

    assert.ok(metadata, exercise.id);
    assert.equal(exercise.exerciseVersion, "1.0.0", exercise.id);
    assert.ok(metadata.expectedComplexity.length > 0, exercise.id);
    assert.ok(metadata.estimatedDistanceMeters > 0, exercise.id);
  }
});

test("Stage 124 readiness report and QA panel include map and exercise versions", () => {
  const report = buildRealLondonPilotReadinessReport();
  const panel = buildRealLondonPilotQaPanelModel(report);

  assert.equal(report.mapVersion, "1.0.0");
  assert.equal(panel.mapVersion, "1.0.0");
  assert.equal(panel.metricRows.find((row) => row.id === "map-version")?.value, "1.0.0");
  assert.deepEqual(
    report.exerciseMetadata.map((metadata) => [metadata.exerciseId, metadata.exerciseVersion]),
    realLondonOsmPilotRouteExercises.map((exercise) => [exercise.id, "1.0.0"])
  );
  assert.deepEqual(
    panel.exerciseRows.map((row) => [row.id, row.exerciseVersion]),
    realLondonOsmPilotRouteExercises.map((exercise) => [exercise.id, "1.0.0"])
  );
});

test("Stage 124 preserves Marlowe default map and committed real London fixture source", () => {
  const realPilotOption = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.equal(DEFAULT_ROUTE_RUNNER_MAP_ID, marloweDistrictMap.id);
  assert.notEqual(DEFAULT_ROUTE_RUNNER_MAP_ID, realLondonOsmPilotRouteMap.id);
  assert.equal(ROUTE_RUNNER_MAP_OPTIONS[0]?.id, marloweDistrictMap.id);
  assert.equal(marloweDistrictMap.mapVersion, "1.0.0");
  assert.ok(marloweDistrictRouteExercises.every((exercise) => exercise.exerciseVersion === "1.0.0"));
  assert.equal(realPilotOption?.fixtureName, "realLondonPilotOverpass.json");
  assert.equal(realPilotOption?.map.mapVersion, "1.0.0");
  assert.ok(realPilotOption?.sourceOverpassFixture);
});
