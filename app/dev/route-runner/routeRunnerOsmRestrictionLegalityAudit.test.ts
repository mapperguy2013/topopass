import assert from "node:assert/strict";
import test from "node:test";
import { marloweDistrictMap, marloweDistrictRouteExercises } from "../../../lib/map-engine/index.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  ROUTE_RUNNER_MAP_OPTIONS,
  mediumLondonOsmRouteExercises,
  mediumLondonOsmRouteMap,
  realLondonOsmPilotRouteExercises,
  realLondonOsmPilotRouteMap,
  tinyLondonOsmRouteExercises,
  tinyLondonOsmRouteMap
} from "./routeRunnerMaps.ts";
import {
  buildOsmRestrictionLegalityAuditReport,
  type OsmRestrictionLegalityAuditCheckId
} from "./routeRunnerOsmRestrictionLegalityAudit.ts";

const EXPECTED_CHECK_ORDER: OsmRestrictionLegalityAuditCheckId[] = [
  "legal-osm-movement",
  "one-way-forward-legality",
  "one-way-reverse-legality",
  "blocked-edge-legality",
  "unknown-reference-legality",
  "unknown-edge-legality",
  "mixed-movement-legality",
  "generated-route-legality",
  "manual-attempt-illegal-feedback"
];

const convertedOsmAuditCases = [
  {
    map: tinyLondonOsmRouteMap,
    exercises: tinyLondonOsmRouteExercises
  },
  {
    map: mediumLondonOsmRouteMap,
    exercises: mediumLondonOsmRouteExercises
  },
  {
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises
  }
];

test("Stage 127 OSM restriction legality audit passes for committed OSM route-runner maps", () => {
  for (const { map, exercises } of convertedOsmAuditCases) {
    const report = buildOsmRestrictionLegalityAuditReport({ map, exercises });

    assert.equal(report.isValid, true, report.failureMessages.join("\n"));
    assert.equal(report.mapId, map.id);
    assert.equal(report.exerciseCount, exercises.length);
    assert.deepEqual(report.failureReasonCodes, []);
    assert.deepEqual(
      report.checks.map((check) => check.id),
      EXPECTED_CHECK_ORDER,
      map.id
    );
    assert.deepEqual(
      report.checks.map((check) => check.status),
      EXPECTED_CHECK_ORDER.map(() => "pass"),
      map.id
    );
  }
});

test("Stage 127 audit reports legal and reverse one-way movement outcomes deterministically", () => {
  const report = buildOsmRestrictionLegalityAuditReport({
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises
  });
  const forward = checkById(report, "one-way-forward-legality");
  const reverse = checkById(report, "one-way-reverse-legality");

  assert.equal(forward.status, "pass");
  assert.ok(forward.checkedRoadId);
  assert.ok(forward.checkedEdgeId);
  assert.deepEqual(forward.illegalMovementTypes, []);
  assert.equal(reverse.status, "pass");
  assert.equal(reverse.checkedRoadId, forward.checkedRoadId);
  assert.deepEqual(reverse.failureReasonCodes, []);
  assert.deepEqual(reverse.illegalMovementTypes, ["wrong_way_one_way"]);
  assert.match(reverse.messages.join("\n"), /wrong way on one-way road/i);
});

test("Stage 127 audit rejects blocked and unknown OSM-derived movement references", () => {
  const report = buildOsmRestrictionLegalityAuditReport({
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises
  });
  const blocked = checkById(report, "blocked-edge-legality");
  const unknownReferences = checkById(report, "unknown-reference-legality");
  const unknownEdge = checkById(report, "unknown-edge-legality");

  assert.equal(blocked.status, "pass");
  assert.deepEqual(blocked.failureReasonCodes, []);
  assert.deepEqual(blocked.illegalMovementTypes, ["road_closed"]);
  assert.match(blocked.messages.join("\n"), /closed or restricted road/i);
  assert.ok(blocked.messages.some((message) => message.includes("->")));

  assert.equal(unknownReferences.status, "pass");
  assert.deepEqual(unknownReferences.failureReasonCodes, []);
  assert.deepEqual(unknownReferences.illegalMovementTypes, [
    "disconnected_road_jump",
    "disconnected_road_jump",
    "disconnected_road_jump"
  ]);
  assert.match(unknownReferences.messages.join("\n"), /unknown road/);
  assert.match(unknownReferences.messages.join("\n"), /unknown node/);

  assert.equal(unknownEdge.status, "pass");
  assert.deepEqual(unknownEdge.failureReasonCodes, []);
  assert.deepEqual(unknownEdge.messages, ["osm-legality-audit-missing-edge"]);
});

test("Stage 127 audit gives stable results for mixed legal and illegal movements", () => {
  const report = buildOsmRestrictionLegalityAuditReport({
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises
  });
  const mixed = checkById(report, "mixed-movement-legality");

  assert.equal(mixed.status, "pass");
  assert.deepEqual(mixed.failureReasonCodes, []);
  assert.deepEqual(mixed.illegalMovementTypes, ["wrong_way_one_way", "no_u_turn"]);
  assert.match(mixed.messages.join("\n"), /wrong way on one-way road/i);
  assert.match(mixed.messages.join("\n"), /immediately reverses/i);
});

test("Stage 127 audit verifies revealed legal routes and manual QA illegal feedback for real London pilot", () => {
  const report = buildOsmRestrictionLegalityAuditReport({
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises
  });
  const generatedRoutes = checkById(report, "generated-route-legality");
  const manualAttempt = checkById(report, "manual-attempt-illegal-feedback");

  assert.equal(generatedRoutes.status, "pass");
  assert.deepEqual(generatedRoutes.failureReasonCodes, []);
  assert.deepEqual(generatedRoutes.illegalMovementTypes, []);
  assert.deepEqual(generatedRoutes.messages, []);

  assert.equal(manualAttempt.status, "pass");
  assert.equal(manualAttempt.exerciseId, realLondonOsmPilotRouteExercises[0].id);
  assert.deepEqual(manualAttempt.failureReasonCodes, []);
  assert.deepEqual(manualAttempt.illegalMovementTypes, ["wrong_way_one_way"]);
  assert.match(manualAttempt.messages.join("\n"), /manual-attempt-blocked-directed-edge/);
});

test("Stage 127 OSM restriction legality audit output is repeatable", () => {
  const first = buildOsmRestrictionLegalityAuditReport({
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises
  });
  const second = buildOsmRestrictionLegalityAuditReport({
    map: realLondonOsmPilotRouteMap,
    exercises: realLondonOsmPilotRouteExercises
  });

  assert.deepEqual(first, second);
});

test("Stage 127 preserves Marlowe default and real London committed fixture source", () => {
  const realPilotOption = ROUTE_RUNNER_MAP_OPTIONS.find((option) => option.id === realLondonOsmPilotRouteMap.id);

  assert.equal(DEFAULT_ROUTE_RUNNER_MAP_ID, marloweDistrictMap.id);
  assert.equal(ROUTE_RUNNER_MAP_OPTIONS[0]?.id, DEFAULT_ROUTE_RUNNER_MAP_ID);
  assert.equal(ROUTE_RUNNER_MAP_OPTIONS[0]?.map, marloweDistrictMap);
  assert.equal(ROUTE_RUNNER_MAP_OPTIONS[0]?.defaultExerciseId, marloweDistrictRouteExercises[0]?.id);
  assert.notEqual(DEFAULT_ROUTE_RUNNER_MAP_ID, realLondonOsmPilotRouteMap.id);
  assert.equal(realPilotOption?.source, "converted-osm");
  assert.equal(realPilotOption?.fixtureName, "realLondonPilotOverpass.json");
  assert.ok(realPilotOption?.sourceOverpassFixture);
});

function checkById(
  report: ReturnType<typeof buildOsmRestrictionLegalityAuditReport>,
  id: OsmRestrictionLegalityAuditCheckId
) {
  const check = report.checks.find((candidate) => candidate.id === id);

  assert.ok(check, `Missing audit check ${id}`);

  return check;
}
