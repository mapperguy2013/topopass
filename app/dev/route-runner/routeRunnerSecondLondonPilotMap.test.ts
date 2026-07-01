import assert from "node:assert/strict";
import test from "node:test";
import { buildMapGraph, marloweDistrictMap } from "../../../lib/map-engine/index.ts";
import { parseOverpassRoadExtract } from "../../../lib/map-engine/osm/index.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  ROUTE_RUNNER_MAP_OPTIONS,
  getRealLondonPilotExerciseMetadata,
  getRouteRunnerMapFitBounds,
  getRouteRunnerMapOption,
  realLondonOsmPilotRouteExercises,
  realLondonOsmPilotRouteMap,
  realLondonOsmPilotTwoRouteExercises,
  realLondonOsmPilotTwoRouteMap
} from "./routeRunnerMaps.ts";
import { buildOsmRouteExerciseQaAcceptanceSuiteReport, validateOsmRouteExerciseQaSuite } from "./routeRunnerOsmExerciseQa.ts";
import {
  buildRealLondonPilotReadinessReport,
  buildSecondLondonPilotReadinessReport,
  stableOsmPilotReadinessReportSummary
} from "./routeRunnerOsmRealPilotReadinessReport.ts";
import {
  buildRealLondonPilotQaPanelModel,
  buildRealLondonPilotQaPanelModelForMap,
  shouldShowRealLondonPilotQaPanel
} from "./routeRunnerRealLondonPilotQaPanel.ts";
import {
  buildRealLondonPilotPlaythroughPanelModel,
  shouldShowRealLondonPilotPlaythroughPanel
} from "./routeRunnerRealLondonPilotPlaythroughPanel.ts";
import { isSimpleSemverVersion } from "./routeRunnerVersionMetadata.ts";

const EXPECTED_SECOND_PILOT_EXERCISE_METADATA = [
  [
    "osm-real-pilot-2-euston-crossing",
    "easy",
    "direct",
    443.21,
    "Easy direct A to B route across the second committed London pilot fixture."
  ],
  [
    "osm-real-pilot-2-bloomsbury-checkpoint",
    "medium",
    "checkpoint",
    560.75,
    "Medium checkpoint route with one ordered intermediate stop before the destination."
  ],
  [
    "osm-real-pilot-2-tavistock-one-way-detour",
    "medium",
    "one-way-awareness",
    643.58,
    "Medium one-way-awareness route where the legal path is longer than the visual reverse trip."
  ]
] as const;

test("Stage 128 second London pilot fixture imports through the existing OSM path", () => {
  const option = requireSecondPilotOption();
  const imported = parseOverpassRoadExtract(option.sourceOverpassFixture);

  assert.equal(option.fixtureName, "realLondonPilotTwoOverpass.json");
  assert.ok(imported.roads.length > 0);
  assert.ok(imported.nodeCount > 0);
  assert.equal(option.map.id, "osm-real-london-pilot-2");
  assert.equal(option.map.name, "OSM Real London Pilot 2");
  assert.ok(option.map.nodes.length > 0);
  assert.ok(option.map.roads.length > 0);
});

test("Stage 128 registers the second London pilot without changing defaults or the first pilot", () => {
  const secondOption = requireSecondPilotOption();
  const firstOption = getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id);

  assert.equal(DEFAULT_ROUTE_RUNNER_MAP_ID, marloweDistrictMap.id);
  assert.equal(ROUTE_RUNNER_MAP_OPTIONS[0]?.id, DEFAULT_ROUTE_RUNNER_MAP_ID);
  assert.notEqual(DEFAULT_ROUTE_RUNNER_MAP_ID, realLondonOsmPilotTwoRouteMap.id);
  assert.ok(firstOption);
  assert.equal(firstOption.fixtureName, "realLondonPilotOverpass.json");
  assert.equal(firstOption.defaultExerciseId, realLondonOsmPilotRouteExercises[0].id);
  assert.deepEqual(
    firstOption.exercises.map((exercise) => exercise.id),
    realLondonOsmPilotRouteExercises.map((exercise) => exercise.id)
  );
  assert.equal(secondOption.source, "converted-osm");
  assert.equal(secondOption.defaultExerciseId, realLondonOsmPilotTwoRouteExercises[0].id);
  assert.deepEqual(
    secondOption.exercises.map((exercise) => exercise.id),
    EXPECTED_SECOND_PILOT_EXERCISE_METADATA.map(([exerciseId]) => exerciseId)
  );
});

test("Stage 128 starter exercises have stable metadata and semver versions", () => {
  assert.equal(realLondonOsmPilotTwoRouteMap.mapVersion, "1.0.0");
  assert.equal(isSimpleSemverVersion(realLondonOsmPilotTwoRouteMap.mapVersion), true);
  assert.equal(realLondonOsmPilotTwoRouteExercises.length, 3);
  assert.deepEqual(realLondonOsmPilotTwoRouteExercises.map(stableExerciseMetadata), EXPECTED_SECOND_PILOT_EXERCISE_METADATA);

  for (const exercise of realLondonOsmPilotTwoRouteExercises) {
    const metadata = getRealLondonPilotExerciseMetadata(exercise);

    assert.ok(metadata, exercise.id);
    assert.equal(exercise.mapId, realLondonOsmPilotTwoRouteMap.id, exercise.id);
    assert.equal(exercise.exerciseVersion, "1.0.0", exercise.id);
    assert.equal(isSimpleSemverVersion(exercise.exerciseVersion), true, exercise.id);
    assert.equal(metadata.difficulty, exercise.difficulty, exercise.id);
    assert.ok(metadata.estimatedDistanceMeters > 0, exercise.id);
    assert.ok(Number.isFinite(metadata.estimatedDistanceMeters), exercise.id);
    assert.ok(metadata.expectedComplexity.trim().length > 0, exercise.id);
  }
});

test("Stage 128 starter exercises resolve against the committed local fixture", () => {
  const graph = buildMapGraph(realLondonOsmPilotTwoRouteMap);
  const qaSuite = validateOsmRouteExerciseQaSuite({
    map: realLondonOsmPilotTwoRouteMap,
    exercises: realLondonOsmPilotTwoRouteExercises,
    graph
  });
  const acceptance = buildOsmRouteExerciseQaAcceptanceSuiteReport({
    map: realLondonOsmPilotTwoRouteMap,
    exercises: realLondonOsmPilotTwoRouteExercises,
    graph,
    renderBounds: getRouteRunnerMapFitBounds(realLondonOsmPilotTwoRouteMap)
  });

  assert.equal(qaSuite.isValid, true, qaSuite.failures.map((failure) => failure.message).join("\n"));
  assert.equal(acceptance.isValid, true, acceptance.failureMessages.join("\n"));
  assert.equal(acceptance.exerciseCount, realLondonOsmPilotTwoRouteExercises.length);
  assert.ok(acceptance.reports.every((report) => report.hasLegalRoute));
  assert.deepEqual(
    acceptance.reports.map((report) => [report.exerciseId, roundDistance(report.fastestRouteDistanceMeters)]),
    EXPECTED_SECOND_PILOT_EXERCISE_METADATA.map(([exerciseId, , , distance]) => [exerciseId, distance])
  );
});

test("Stage 128 readiness report includes the second pilot deterministically", () => {
  const first = buildSecondLondonPilotReadinessReport();
  const second = buildSecondLondonPilotReadinessReport();

  assert.equal(first.mapId, realLondonOsmPilotTwoRouteMap.id);
  assert.equal(first.fixtureSource.source, "committed-local-overpass-fixture");
  assert.equal(first.fixtureSource.fixtureName, "realLondonPilotTwoOverpass.json");
  assert.equal(first.fixtureSource.path, "lib/map-engine/osm/fixtures/realLondonPilotTwoOverpass.json");
  assert.equal(first.exerciseCount, realLondonOsmPilotTwoRouteExercises.length);
  assert.equal(first.isReady, true, first.failureMessages.join("\n"));
  assert.deepEqual(first.failureReasonCodes, []);
  assert.deepEqual(first.exerciseMetadata.map(stableReportMetadata), EXPECTED_SECOND_PILOT_EXERCISE_METADATA);
  assert.deepEqual(stableOsmPilotReadinessReportSummary(second), stableOsmPilotReadinessReportSummary(first));
});

test("Stage 128 QA and playthrough panels support both London pilots only", () => {
  const firstReport = buildRealLondonPilotReadinessReport();
  const secondReport = buildSecondLondonPilotReadinessReport();
  const secondPanel = buildRealLondonPilotQaPanelModel(secondReport);
  const secondPanelForMap = buildRealLondonPilotQaPanelModelForMap({
    mapId: realLondonOsmPilotTwoRouteMap.id,
    report: secondReport
  });
  const playthroughModel = buildRealLondonPilotPlaythroughPanelModel({
    mapId: realLondonOsmPilotTwoRouteMap.id,
    selectedExerciseId: realLondonOsmPilotTwoRouteExercises[1].id,
    startLabel: "King's Cross Road north",
    destinationLabel: "Store Street east",
    checkpointLabels: ["Russell Square checkpoint"],
    hasLegalRevealRoute: true,
    isRevealRouteVisible: false,
    isDrawing: false,
    drawnPointCount: 0,
    drawnReviewStatus: "pending",
    manualRunStatus: null,
    illegalHighlightCount: 0
  });

  assert.equal(shouldShowRealLondonPilotQaPanel(realLondonOsmPilotRouteMap.id), true);
  assert.equal(shouldShowRealLondonPilotQaPanel(realLondonOsmPilotTwoRouteMap.id), true);
  assert.equal(shouldShowRealLondonPilotQaPanel(DEFAULT_ROUTE_RUNNER_MAP_ID), false);
  assert.equal(shouldShowRealLondonPilotPlaythroughPanel(realLondonOsmPilotRouteMap.id), true);
  assert.equal(shouldShowRealLondonPilotPlaythroughPanel(realLondonOsmPilotTwoRouteMap.id), true);
  assert.equal(shouldShowRealLondonPilotPlaythroughPanel(DEFAULT_ROUTE_RUNNER_MAP_ID), false);
  assert.equal(firstReport.isReady, true);
  assert.equal(secondPanel.mapId, realLondonOsmPilotTwoRouteMap.id);
  assert.equal(secondPanel.fixtureName, "realLondonPilotTwoOverpass.json");
  assert.equal(secondPanel.exerciseProgressText, "3/3 passing");
  assert.deepEqual(secondPanelForMap, secondPanel);
  assert.equal(playthroughModel.shouldShowPanel, true);
  assert.equal(playthroughModel.selectedExerciseId, "osm-real-pilot-2-bloomsbury-checkpoint");
});

test("Stage 128 second London pilot remains fixture-only with no network dependency", () => {
  const option = requireSecondPilotOption();
  const report = buildSecondLondonPilotReadinessReport();

  assert.equal(option.fixtureName, "realLondonPilotTwoOverpass.json");
  assert.ok(option.sourceOverpassFixture);
  assert.equal(report.fixtureSource.source, "committed-local-overpass-fixture");
  assert.equal(report.fixtureSource.path?.startsWith("lib/map-engine/osm/fixtures/"), true);
  assert.equal(String(report.fixtureSource.path).includes("http://"), false);
  assert.equal(String(report.fixtureSource.path).includes("https://"), false);
});

function stableExerciseMetadata(exercise: (typeof realLondonOsmPilotTwoRouteExercises)[number]): readonly [
  string,
  string,
  string,
  number,
  string
] {
  const metadata = getRealLondonPilotExerciseMetadata(exercise);

  assert.ok(metadata, exercise.id);

  return [
    exercise.id,
    metadata.difficulty,
    metadata.routeType,
    metadata.estimatedDistanceMeters,
    metadata.expectedComplexity
  ];
}

function stableReportMetadata(metadata: {
  exerciseId: string;
  difficulty: string;
  routeType: string;
  estimatedDistanceMeters: number;
  expectedComplexity: string;
}): readonly [string, string, string, number, string] {
  return [
    metadata.exerciseId,
    metadata.difficulty,
    metadata.routeType,
    metadata.estimatedDistanceMeters,
    metadata.expectedComplexity
  ];
}

function roundDistance(distance: number | null): number {
  assert.equal(typeof distance, "number");

  return Math.round(distance * 100) / 100;
}

function requireSecondPilotOption() {
  const option = getRouteRunnerMapOption(realLondonOsmPilotTwoRouteMap.id);

  assert.ok(option);

  return option;
}
