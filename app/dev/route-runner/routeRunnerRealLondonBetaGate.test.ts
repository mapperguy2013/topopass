import assert from "node:assert/strict";
import test from "node:test";
import { marloweDistrictMap } from "../../../lib/map-engine/index.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  ROUTE_RUNNER_MAP_OPTIONS,
  getRouteRunnerMapOption,
  realLondonOsmPilotRouteMap,
  realLondonOsmPilotTwoRouteMap
} from "./routeRunnerMaps.ts";
import { ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON } from "./curatedRealLondonRouteRunnerMaps.ts";
import { phase6RealLondonVisualQaRouteMap } from "./realLondonVisualQaScenario.ts";
import { buildRealLondonPilotReadinessReport } from "./routeRunnerOsmRealPilotReadinessReport.ts";
import { createRouteAttemptVersionSnapshot } from "./routeAttemptVersionSnapshot.ts";
import {
  REAL_LONDON_BETA_ENV_FLAG,
  REAL_LONDON_BETA_LABEL,
  buildPhase5RealLondonBetaReadinessReview,
  buildRealLondonBetaPracticePanelModel,
  getRouteRunnerDevQaMapOptions,
  getRouteRunnerVisibleMapOptions,
  isRealLondonBetaAccessEnabled,
  resolveRealLondonBetaMapAccess
} from "./routeRunnerRealLondonBetaGate.ts";

test("Stage 130 real London beta flag defaults to disabled", () => {
  assert.equal(isRealLondonBetaAccessEnabled({}), false);
  assert.equal(isRealLondonBetaAccessEnabled({ [REAL_LONDON_BETA_ENV_FLAG]: "" }), false);
  assert.equal(isRealLondonBetaAccessEnabled({ [REAL_LONDON_BETA_ENV_FLAG]: "false" }), false);
});

test("Stage 130 real London beta flag enabled states are deterministic", () => {
  for (const enabledValue of ["1", "true", "TRUE", " yes ", "on", "enabled"]) {
    assert.equal(isRealLondonBetaAccessEnabled({ [REAL_LONDON_BETA_ENV_FLAG]: enabledValue }), true, enabledValue);
  }

  for (const disabledValue of ["0", "no", "off", "disabled", "beta"]) {
    assert.equal(isRealLondonBetaAccessEnabled({ [REAL_LONDON_BETA_ENV_FLAG]: disabledValue }), false, disabledValue);
  }
});

test("Stage 130 non-beta users do not see real London maps in route-runner options", () => {
  const visibleOptions = getRouteRunnerVisibleMapOptions({ betaEnabled: false });
  const visibleMapIds = visibleOptions.map((option) => option.map.id);

  assert.equal(DEFAULT_ROUTE_RUNNER_MAP_ID, marloweDistrictMap.id);
  assert.equal(visibleMapIds[0], DEFAULT_ROUTE_RUNNER_MAP_ID);
  assert.equal(visibleMapIds.includes(realLondonOsmPilotRouteMap.id), false);
  assert.equal(visibleMapIds.includes(realLondonOsmPilotTwoRouteMap.id), false);
  assert.equal(visibleMapIds.includes(phase6RealLondonVisualQaRouteMap.id), false);
  assert.ok(visibleMapIds.includes("osm-tiny-london-prototype"));
  assert.ok(visibleMapIds.includes("osm-medium-london-prototype"));
});

test("Stage 130 beta users can access real London practice maps", () => {
  const visibleOptions = getRouteRunnerVisibleMapOptions({ betaEnabled: true });
  const visibleMapIds = visibleOptions.map((option) => option.map.id);
  const access = resolveRealLondonBetaMapAccess({
    requestedMapId: realLondonOsmPilotRouteMap.id,
    betaEnabled: true
  });

  assert.equal(visibleMapIds.includes(realLondonOsmPilotRouteMap.id), true);
  assert.equal(visibleMapIds.includes(realLondonOsmPilotTwoRouteMap.id), true);
  assert.equal(visibleMapIds.includes(phase6RealLondonVisualQaRouteMap.id), false);
  assert.equal(access.state, "available");
  assert.equal(access.selectedMapOption.map.id, realLondonOsmPilotRouteMap.id);
  assert.equal(access.unavailableState, null);
});

test("Stage 161.6 beta users can access curated Real London fixture maps", () => {
  const visibleOptions = getRouteRunnerVisibleMapOptions({
    betaEnabled: true,
    mapOptions: ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON
  });
  const nonBetaVisibleOptions = getRouteRunnerVisibleMapOptions({
    betaEnabled: false,
    mapOptions: ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON
  });
  const visibleMapIds = visibleOptions.map((option) => option.map.id);
  const nonBetaVisibleMapIds = nonBetaVisibleOptions.map((option) => option.map.id);
  const curatedMapIds = [
    "osm-curated-piccadilly-circus",
    "osm-curated-waterloo-bridge",
    "osm-curated-one-way-system-area",
    "osm-curated-quiet-residential-roads",
    "osm-curated-centralLondon"
  ];
  const access = resolveRealLondonBetaMapAccess({
    requestedMapId: "osm-curated-waterloo-bridge",
    betaEnabled: true,
    mapOptions: ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON
  });

  for (const mapId of curatedMapIds) {
    assert.equal(visibleMapIds.includes(mapId), true, mapId);
    assert.equal(nonBetaVisibleMapIds.includes(mapId), false, mapId);
  }

  assert.equal(visibleMapIds.includes(phase6RealLondonVisualQaRouteMap.id), false);
  assert.equal(access.state, "available");
  assert.equal(access.selectedMapOption.map.id, "osm-curated-waterloo-bridge");
  assert.equal(access.selectedMapOption.fixtureUse, "routableExercise");
  assert.equal(access.unavailableState, null);

  const centralLondonAccess = resolveRealLondonBetaMapAccess({
    requestedMapId: "osm-curated-centralLondon",
    betaEnabled: true,
    mapOptions: ROUTE_RUNNER_MAP_OPTIONS_WITH_CURATED_REAL_LONDON
  });

  assert.equal(centralLondonAccess.state, "available");
  assert.equal(centralLondonAccess.selectedMapOption.fixtureUse, "visualQaOnly");
  assert.equal(centralLondonAccess.selectedMapOption.exercises.length, 0);
});

test("dev QA route-runner map options expose every registered map regardless of beta flag", () => {
  const publicNonBetaMapIds = getRouteRunnerVisibleMapOptions({ betaEnabled: false }).map((option) => option.map.id);
  const devQaMapIds = getRouteRunnerDevQaMapOptions().map((option) => option.map.id);

  assert.equal(publicNonBetaMapIds.includes(realLondonOsmPilotRouteMap.id), false);
  assert.equal(publicNonBetaMapIds.includes(realLondonOsmPilotTwoRouteMap.id), false);
  assert.deepEqual(devQaMapIds, ROUTE_RUNNER_MAP_OPTIONS.map((option) => option.map.id));
  assert.equal(devQaMapIds.includes(realLondonOsmPilotRouteMap.id), true);
  assert.equal(devQaMapIds.includes(realLondonOsmPilotTwoRouteMap.id), true);
  assert.equal(devQaMapIds.includes("osm-large-london"), true);
  assert.equal(devQaMapIds.includes(phase6RealLondonVisualQaRouteMap.id), true);
});

test("Stage 151 visual QA scenario is dev-only and resolves unavailable outside dev QA mode", () => {
  const access = resolveRealLondonBetaMapAccess({
    requestedMapId: phase6RealLondonVisualQaRouteMap.id,
    betaEnabled: true
  });

  assert.equal(access.state, "unknown-map");
  assert.equal(access.selectedMapOption.map.id, DEFAULT_ROUTE_RUNNER_MAP_ID);
  assert.equal(access.unavailableState?.reasonCode, "unknown-map");
});

test("Stage 130 requesting real London while disabled returns safe unavailable state", () => {
  const access = resolveRealLondonBetaMapAccess({
    requestedMapId: realLondonOsmPilotRouteMap.id,
    betaEnabled: false
  });

  assert.equal(access.state, "beta-gated");
  assert.equal(access.selectedMapOption.map.id, DEFAULT_ROUTE_RUNNER_MAP_ID);
  assert.equal(access.unavailableState?.reasonCode, "real-london-beta-disabled");
  assert.match(access.unavailableState?.message ?? "", /beta-enabled testers/);
  assert.match(access.unavailableState?.message ?? "", /Marlowe remains the default/);
});

test("Stage 130 beta panel includes label limitations feedback hook and attribution", () => {
  const option = requireMapOption(realLondonOsmPilotRouteMap.id);
  const panel = buildRealLondonBetaPracticePanelModel({
    mapOption: option,
    betaEnabled: true
  });

  assert.ok(panel);
  assert.equal(panel.label, REAL_LONDON_BETA_LABEL);
  assert.match(panel.statusText, /Not final production-ready/);
  assert.equal(panel.fixtureName, "realLondonPilotOverpass.json");
  assert.equal(panel.attribution, "OpenStreetMap contributors");
  assert.match(panel.feedbackPlaceholder, /Beta testers can note/);
  assert.ok(panel.knownLimitations.some((limitation) => limitation.includes("committed local OSM fixtures only")));
  assert.ok(panel.knownLimitations.some((limitation) => limitation.includes("does not fetch live OSM")));
  assert.ok(panel.knownLimitations.some((limitation) => limitation.includes("Pilot coverage is limited")));
  assert.ok(panel.knownLimitations.some((limitation) => limitation.includes("Mobile and touch interaction")));
});

test("Stage 130 beta panel stays hidden for non-beta users and non-real maps", () => {
  const realOption = requireMapOption(realLondonOsmPilotRouteMap.id);
  const defaultOption = requireMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);

  assert.equal(buildRealLondonBetaPracticePanelModel({ mapOption: realOption, betaEnabled: false }), null);
  assert.equal(buildRealLondonBetaPracticePanelModel({ mapOption: defaultOption, betaEnabled: true }), null);
});

test("Stage 130 readiness review reports expected Phase 5 statuses", () => {
  const review = buildPhase5RealLondonBetaReadinessReview();

  assert.equal(review.betaFlagName, REAL_LONDON_BETA_ENV_FLAG);
  assert.equal(review.betaDefaultEnabled, false);
  assert.equal(review.overallStatus, "ready-for-beta-review", review.failureReasonCodes.join(", "));
  assert.equal(review.isReadyForBetaReview, true);
  assert.deepEqual(review.realLondonMapIds, [realLondonOsmPilotRouteMap.id, realLondonOsmPilotTwoRouteMap.id]);
  assert.deepEqual(review.betaEnabledAccessMapIds, [realLondonOsmPilotRouteMap.id, realLondonOsmPilotTwoRouteMap.id]);
  assert.equal(review.nonBetaVisibleMapIds.includes(realLondonOsmPilotRouteMap.id), false);
  assert.equal(review.nonBetaVisibleMapIds[0], DEFAULT_ROUTE_RUNNER_MAP_ID);
  assert.deepEqual(review.failureReasonCodes, []);
  assert.deepEqual(
    review.sections.map((section) => [section.id, section.status]),
    [
      ["beta-flag-default-disabled", "pass"],
      ["beta-access-enabled", "pass"],
      ["non-beta-default-experience", "pass"],
      ["safe-unavailable-state", "pass"],
      ["real-map-stability", "pass"],
      ["pilot-exercise-qa", "pass"],
      ["attempt-versioning", "pass"],
      ["student-route-flow", "pass"],
      ["osm-attribution", "pass"],
      ["known-limitations", "pass"],
      ["mobile-interaction", "documented-limited"]
    ]
  );
  assert.ok(review.documentedLimitations.some((limitation) => limitation.includes("Mobile and touch interaction")));
});

test("Stage 130 keeps map and exercise version metadata present", () => {
  for (const mapId of [realLondonOsmPilotRouteMap.id, realLondonOsmPilotTwoRouteMap.id]) {
    const option = requireMapOption(mapId);

    assert.equal(option.map.mapVersion, "1.0.0");
    assert.ok(option.exercises.length > 0);

    for (const exercise of option.exercises) {
      assert.equal(exercise.exerciseVersion, "1.0.0", exercise.id);
    }
  }
});

test("Stage 130 route attempt version snapshot metadata remains intact", () => {
  const option = requireMapOption(realLondonOsmPilotRouteMap.id);
  const exercise = option.exercises[0];

  assert.ok(exercise);

  const snapshot = createRouteAttemptVersionSnapshot({
    map: option.map,
    exercise
  });

  assert.deepEqual(snapshot, {
    mapId: realLondonOsmPilotRouteMap.id,
    mapVersion: "1.0.0",
    exerciseId: exercise.id,
    exerciseVersion: "1.0.0"
  });
});

test("Stage 130 real London pilot QA remains green", () => {
  const report = buildRealLondonPilotReadinessReport();

  assert.equal(report.isReady, true, report.failureMessages.join("\n"));
  assert.equal(report.acceptanceQa.status, "pass");
  assert.equal(report.manualAttemptQa.status, "pass");
  assert.equal(report.drawnRouteQa.status, "pass");
  assert.deepEqual(report.failureReasonCodes, []);
});

test("Stage 130 does not change the registered map catalogue or Marlowe default", () => {
  const defaultOption = requireMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);

  assert.equal(DEFAULT_ROUTE_RUNNER_MAP_ID, marloweDistrictMap.id);
  assert.equal(ROUTE_RUNNER_MAP_OPTIONS[0]?.id, DEFAULT_ROUTE_RUNNER_MAP_ID);
  assert.equal(defaultOption.map, marloweDistrictMap);
  assert.ok(getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id));
  assert.ok(getRouteRunnerMapOption(realLondonOsmPilotTwoRouteMap.id));
});

function requireMapOption(mapId: string) {
  const option = getRouteRunnerMapOption(mapId);

  assert.ok(option, mapId);

  return option;
}
