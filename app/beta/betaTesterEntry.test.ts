import assert from "node:assert/strict";
import test from "node:test";
import { marloweDistrictMap } from "../../lib/map-engine/index.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  getRouteRunnerMapOption,
  realLondonOsmPilotRouteMap
} from "../dev/route-runner/routeRunnerMaps.ts";
import { REAL_LONDON_BETA_ENV_FLAG } from "../dev/route-runner/routeRunnerRealLondonBetaGate.ts";
import { REAL_LONDON_BETA_PRACTICE_PATH } from "../practice/real-london/realLondonBetaPracticeScreen.ts";
import {
  BETA_TESTER_ENTRY_PATH,
  buildBetaTesterEntryModel
} from "./betaTesterEntry.ts";

test("Stage 133 beta entry exposes the real London CTA when beta access is enabled", () => {
  const model = buildBetaTesterEntryModel({ betaEnabled: true });

  assert.equal(model.state, "available");
  assert.equal(model.pagePath, BETA_TESTER_ENTRY_PATH);
  assert.equal(model.betaFlagName, REAL_LONDON_BETA_ENV_FLAG);

  if (model.state !== "available") {
    throw new Error("Expected available beta entry model.");
  }

  assert.equal(model.practiceHref, REAL_LONDON_BETA_PRACTICE_PATH);
  assert.equal(model.mapId, realLondonOsmPilotRouteMap.id);
  assert.equal(model.mapVersion, "1.0.0");
  assert.equal(model.attribution, "OpenStreetMap contributors");
  assert.match(model.betaCopy, /limited beta/i);
  assert.ok(model.knownLimitations.some((limitation) => limitation.includes("committed local OSM fixtures only")));
  assert.equal(model.isDefaultExperience, false);
});

test("Stage 133 beta entry shows a safe unavailable state when beta access is disabled", () => {
  const model = buildBetaTesterEntryModel({ betaEnabled: false });

  assert.equal(model.state, "unavailable");
  assert.equal(model.reasonCode, "real-london-beta-disabled");
  assert.equal(model.defaultPracticeHref, "/practice");
  assert.equal(model.defaultMapId, DEFAULT_ROUTE_RUNNER_MAP_ID);
  assert.match(model.unavailableMessage, /beta-enabled testers/);
  assert.match(model.unavailableMessage, /Marlowe practice remains the default/);
  assert.equal(model.isDefaultExperience, false);
});

test("Stage 133 beta entry does not change the default map or real London registration", () => {
  assert.equal(DEFAULT_ROUTE_RUNNER_MAP_ID, marloweDistrictMap.id);
  assert.ok(getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id));
});
