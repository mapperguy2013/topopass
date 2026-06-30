import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMapGraph,
  marloweDistrictMap,
  type MapDefinition,
  type RouteExercise
} from "../../../lib/map-engine/index.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  getRouteRunnerMapFitBounds,
  getRealLondonPilotExerciseMetadata,
  mediumLondonOsmRouteExercises,
  mediumLondonOsmRouteMap,
  realLondonOsmPilotRouteExercises,
  realLondonOsmPilotRouteMap,
  tinyLondonOsmRouteExercises,
  tinyLondonOsmRouteMap
} from "./routeRunnerMaps.ts";
import { buildOsmRouteExerciseQaAcceptanceSuiteReport } from "./routeRunnerOsmExerciseQa.ts";
import {
  buildRealLondonPilotReadinessReport,
  stableOsmPilotReadinessReportSummary
} from "./routeRunnerOsmRealPilotReadinessReport.ts";
import { buildRealLondonPilotQaPanelModel } from "./routeRunnerRealLondonPilotQaPanel.ts";

const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const VALID_ROUTE_TYPES = new Set(["direct", "checkpoint", "multi-stop", "one-way-awareness"]);

const EXPECTED_REAL_LONDON_PILOT_METADATA = [
  [
    "osm-real-pilot-short-crossing",
    "easy",
    "direct",
    154.16,
    "Short direct A to B route with basic one-way compliance."
  ],
  [
    "osm-real-pilot-one-way-detour",
    "medium",
    "one-way-awareness",
    209.11,
    "One-way-aware A to B route that must follow the legal Torrington Place direction."
  ],
  [
    "osm-real-pilot-checkpoint-route",
    "medium",
    "checkpoint",
    181.27,
    "Checkpoint route that verifies Huntley Street to Chenies Street before Ridgmount Gardens."
  ],
  [
    "osm-real-pilot-longer-route",
    "hard",
    "direct",
    660.84,
    "Long A to B route with a legal path much longer than the visual straight-line trip."
  ],
  [
    "osm-real-pilot-turn-choice",
    "medium",
    "direct",
    159.33,
    "Medium A to B route with turn choice around Whitfield Street and Goodge Street."
  ],
  [
    "osm-real-pilot-store-street-short-hop",
    "easy",
    "direct",
    21.48,
    "Very short A to B route across the Store Street connector."
  ],
  [
    "osm-real-pilot-gower-to-torrington",
    "medium",
    "direct",
    142.74,
    "Medium A to B route from Gower Street into the Torrington Place approach."
  ],
  [
    "osm-real-pilot-goodge-chenies-ridgmount",
    "medium",
    "checkpoint",
    346.79,
    "A to B to C checkpoint route linking Goodge Street, Chenies Street, and Ridgmount Gardens."
  ],
  [
    "osm-real-pilot-torrington-byng",
    "easy",
    "direct",
    49.89,
    "Short A to B route from Torrington Place into Byng Place."
  ],
  [
    "osm-real-pilot-south-crescent-ridgmount-multistop",
    "hard",
    "multi-stop",
    294.06,
    "A to B to C to D multi-stop route through South Crescent and Ridgmount Street."
  ],
  [
    "osm-real-pilot-tottenham-to-gower-detour",
    "hard",
    "one-way-awareness",
    362.61,
    "One-way detour route where the legal path is longer than the visually obvious connection."
  ],
  [
    "osm-real-pilot-torrington-reverse-loop",
    "hard",
    "one-way-awareness",
    505.35,
    "Hard reverse-direction route that proves one-way awareness with a longer legal loop."
  ],
  [
    "osm-real-pilot-mortimer-goodge-options",
    "hard",
    "direct",
    512.86,
    "Long A to B route with multiple plausible legal street choices before Goodge Street."
  ]
] as const;

test("Stage 123 gives every real London pilot exercise valid difficulty metadata", () => {
  assert.equal(realLondonOsmPilotRouteExercises.length, EXPECTED_REAL_LONDON_PILOT_METADATA.length);

  for (const exercise of realLondonOsmPilotRouteExercises) {
    const metadata = getRealLondonPilotExerciseMetadata(exercise);

    assert.ok(metadata, `Missing metadata for ${exercise.id}`);
    assert.equal(metadata.difficulty, exercise.difficulty, exercise.id);
    assert.ok(VALID_DIFFICULTIES.has(metadata.difficulty), exercise.id);
    assert.ok(VALID_ROUTE_TYPES.has(metadata.routeType), exercise.id);
    assert.equal(Number.isFinite(metadata.estimatedDistanceMeters), true, exercise.id);
    assert.ok(metadata.estimatedDistanceMeters > 0, exercise.id);
    assert.ok(metadata.expectedComplexity.trim().length > 0, exercise.id);
  }
});

test("Stage 123 metadata is stable and human-readable", () => {
  assert.deepEqual(realLondonOsmPilotRouteExercises.map(stableMetadataSummary), EXPECTED_REAL_LONDON_PILOT_METADATA);
});

test("Stage 123 estimated distances match locked acceptance QA distances", () => {
  const suite = buildOsmRouteExerciseQaAcceptanceSuiteReport({
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises,
    graph: buildMapGraph(realLondonOsmPilotRouteMap),
    renderBounds: getRouteRunnerMapFitBounds(realLondonOsmPilotRouteMap)
  });

  assert.equal(suite.isValid, true, suite.failureMessages.join("\n"));

  for (const report of suite.reports) {
    const exercise = requireRealPilotExercise(report.exerciseId);
    const metadata = getRealLondonPilotExerciseMetadata(exercise);

    assert.ok(metadata, `Missing metadata for ${report.exerciseId}`);
    assert.equal(metadata.estimatedDistanceMeters, roundDistance(report.fastestRouteDistanceMeters), report.exerciseId);
  }
});

test("Stage 123 readiness output includes real London pilot exercise metadata", () => {
  const report = buildRealLondonPilotReadinessReport();
  const summary = stableOsmPilotReadinessReportSummary(report) as {
    exerciseMetadata: Array<{
      exerciseId: string;
      difficulty: string;
      routeType: string;
      estimatedDistanceMeters: number;
      expectedComplexity: string;
    }>;
  };

  assert.equal(report.isReady, true, report.failureMessages.join("\n"));
  assert.equal(report.exerciseMetadata.length, realLondonOsmPilotRouteExercises.length);
  assert.deepEqual(report.exerciseMetadata.map(stableReportMetadataSummary), EXPECTED_REAL_LONDON_PILOT_METADATA);
  assert.deepEqual(
    summary.exerciseMetadata.map((metadata) => [
      metadata.exerciseId,
      metadata.difficulty,
      metadata.routeType,
      metadata.estimatedDistanceMeters,
      metadata.expectedComplexity
    ]),
    EXPECTED_REAL_LONDON_PILOT_METADATA
  );
});

test("Stage 123 QA panel displays difficulty and route type metadata", () => {
  const panel = buildRealLondonPilotQaPanelModel(buildRealLondonPilotReadinessReport());

  assert.equal(panel.status, "ready");
  assert.equal(panel.exerciseRows.length, realLondonOsmPilotRouteExercises.length);
  assert.deepEqual(
    panel.exerciseRows.map((row) => [row.id, row.difficulty, row.routeType, row.routeTypeLabel, row.estimatedDistanceText]),
    [
      ["osm-real-pilot-short-crossing", "easy", "direct", "Direct", "154.16 m"],
      ["osm-real-pilot-one-way-detour", "medium", "one-way-awareness", "One-way awareness", "209.11 m"],
      ["osm-real-pilot-checkpoint-route", "medium", "checkpoint", "Checkpoint", "181.27 m"],
      ["osm-real-pilot-longer-route", "hard", "direct", "Direct", "660.84 m"],
      ["osm-real-pilot-turn-choice", "medium", "direct", "Direct", "159.33 m"],
      ["osm-real-pilot-store-street-short-hop", "easy", "direct", "Direct", "21.48 m"],
      ["osm-real-pilot-gower-to-torrington", "medium", "direct", "Direct", "142.74 m"],
      ["osm-real-pilot-goodge-chenies-ridgmount", "medium", "checkpoint", "Checkpoint", "346.79 m"],
      ["osm-real-pilot-torrington-byng", "easy", "direct", "Direct", "49.89 m"],
      ["osm-real-pilot-south-crescent-ridgmount-multistop", "hard", "multi-stop", "Multi-stop", "294.06 m"],
      ["osm-real-pilot-tottenham-to-gower-detour", "hard", "one-way-awareness", "One-way awareness", "362.61 m"],
      ["osm-real-pilot-torrington-reverse-loop", "hard", "one-way-awareness", "One-way awareness", "505.35 m"],
      ["osm-real-pilot-mortimer-goodge-options", "hard", "direct", "Direct", "512.86 m"]
    ]
  );
  assert.equal(panel.metricRows.find((row) => row.id === "metadata-count")?.value, String(realLondonOsmPilotRouteExercises.length));
  assert.ok(panel.exerciseRows.every((row) => row.expectedComplexity.length > 0));
});

test("Stage 123 metadata formatting is deterministic across repeated runs", () => {
  const firstPanel = buildRealLondonPilotQaPanelModel(buildRealLondonPilotReadinessReport());
  const secondPanel = buildRealLondonPilotQaPanelModel(buildRealLondonPilotReadinessReport());

  assert.deepEqual(secondPanel.exerciseRows, firstPanel.exerciseRows);
  assert.deepEqual(secondPanel.metricRows, firstPanel.metricRows);
});

test("Stage 123 leaves Marlowe default and tiny/medium OSM QA unchanged", () => {
  assert.equal(DEFAULT_ROUTE_RUNNER_MAP_ID, marloweDistrictMap.id);
  assert.notEqual(DEFAULT_ROUTE_RUNNER_MAP_ID, realLondonOsmPilotRouteMap.id);

  for (const { map, exercises } of [
    { map: tinyLondonOsmRouteMap, exercises: tinyLondonOsmRouteExercises },
    { map: mediumLondonOsmRouteMap, exercises: mediumLondonOsmRouteExercises }
  ]) {
    assert.equal(exercises.some((exercise) => getRealLondonPilotExerciseMetadata(exercise)), false, map.id);
    assertConvertedOsmAcceptancePasses(map, exercises);
  }
});

function stableMetadataSummary(exercise: RouteExercise): readonly [string, string, string, number, string] {
  const metadata = getRealLondonPilotExerciseMetadata(exercise);

  assert.ok(metadata, `Missing metadata for ${exercise.id}`);

  return [
    exercise.id,
    metadata.difficulty,
    metadata.routeType,
    metadata.estimatedDistanceMeters,
    metadata.expectedComplexity
  ];
}

function stableReportMetadataSummary(
  metadata: ReturnType<typeof buildRealLondonPilotReadinessReport>["exerciseMetadata"][number]
): readonly [string, string, string, number, string] {
  return [
    metadata.exerciseId,
    metadata.difficulty,
    metadata.routeType,
    metadata.estimatedDistanceMeters,
    metadata.expectedComplexity
  ];
}

function requireRealPilotExercise(id: string): RouteExercise {
  const exercise = realLondonOsmPilotRouteExercises.find((candidate) => candidate.id === id);

  assert.ok(exercise, `Missing real London pilot exercise ${id}`);

  return exercise;
}

function assertConvertedOsmAcceptancePasses(map: MapDefinition, exercises: readonly RouteExercise[]): void {
  const suite = buildOsmRouteExerciseQaAcceptanceSuiteReport({
    map,
    exercises,
    graph: buildMapGraph(map),
    renderBounds: getRouteRunnerMapFitBounds(map)
  });

  assert.equal(suite.isValid, true, suite.failureMessages.join("\n"));
  assert.deepEqual(suite.failureReasonCodes, [], map.id);
}

function roundDistance(distanceMeters: number | null): number | null {
  return distanceMeters === null ? null : Number(distanceMeters.toFixed(2));
}
