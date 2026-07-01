import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  realLondonOsmPilotRouteMap,
  realLondonOsmPilotTwoRouteMap
} from "../../dev/route-runner/routeRunnerMaps.ts";
import {
  REAL_LONDON_BETA_ENV_FLAG
} from "../../dev/route-runner/routeRunnerRealLondonBetaGate.ts";
import {
  BETA_ATTEMPT_REVIEW_API_PATH,
  BETA_ATTEMPT_REVIEW_ENABLED_FLAG
} from "./betaAttemptReview.ts";
import {
  BETA_FEEDBACK_REVIEW_API_PATH,
  BETA_FEEDBACK_REVIEW_ENABLED_FLAG
} from "./betaFeedbackReview.ts";
import {
  REAL_LONDON_BETA_FEEDBACK_API_PATH
} from "./realLondonBetaFeedback.ts";
import {
  REAL_LONDON_BETA_PRACTICE_PATH
} from "./realLondonBetaPracticeScreen.ts";
import {
  assertPhase5BetaMapRegistration,
  buildPhase5BetaReadinessSignoffReport
} from "./realLondonPhase5BetaReadinessSignoff.ts";

test("Stage 140 readiness sign-off marks Phase 5 beta-ready but not production-ready", () => {
  const report = buildPhase5BetaReadinessSignoffReport();

  assert.equal(report.stage, 140);
  assert.equal(report.phase, "Phase 5");
  assert.equal(report.releaseScope, "real-london-beta");
  assert.equal(report.scopeFrozen, true);
  assert.equal(report.status, "beta-ready", report.failureReasonCodes.join(", "));
  assert.equal(report.isBetaReady, true);
  assert.equal(report.finalProductionReady, false);
  assert.deepEqual(report.failureReasonCodes, []);
});

test("Stage 140 report includes beta gate and non-beta default status", () => {
  const report = buildPhase5BetaReadinessSignoffReport();

  assert.equal(report.betaFlag, REAL_LONDON_BETA_ENV_FLAG);
  assert.equal(report.betaPracticePath, REAL_LONDON_BETA_PRACTICE_PATH);
  assert.ok(hasPassingCheck(report, "beta-gate-default-disabled"));
  assert.ok(hasPassingCheck(report, "non-beta-default-experience"));
  assert.ok(hasPassingCheck(report, "beta-practice-screen"));
  assert.match(DEFAULT_ROUTE_RUNNER_MAP_ID, /marlowe/);
});

test("Stage 140 report includes stable map and exercise version status", () => {
  const report = buildPhase5BetaReadinessSignoffReport();

  assert.equal(assertPhase5BetaMapRegistration(), true);
  assert.deepEqual(
    report.includedMaps.map((map) => map.mapId),
    [realLondonOsmPilotRouteMap.id, realLondonOsmPilotTwoRouteMap.id]
  );
  assert.deepEqual(
    report.includedMaps.map((map) => map.fixtureName),
    ["realLondonPilotOverpass.json", "realLondonPilotTwoOverpass.json"]
  );
  assert.ok(report.includedMaps.every((map) => map.mapVersion === "1.0.0"));
  assert.ok(report.includedMaps.every((map) => map.exerciseIds.length > 0));
  assert.ok(report.includedExerciseCount > 0);
  assert.ok(hasPassingCheck(report, "committed-fixture-maps"));
  assert.ok(hasPassingCheck(report, "starter-exercises-registered-versioned"));
});

test("Stage 140 report includes feedback storage and internal review/export status", () => {
  const report = buildPhase5BetaReadinessSignoffReport();

  assert.equal(report.feedbackStorageSummary.submitApiPath, REAL_LONDON_BETA_FEEDBACK_API_PATH);
  assert.equal(report.feedbackStorageSummary.localTestStore, ".local/beta-feedback.jsonl");
  assert.equal(report.feedbackStorageSummary.productionStore.backend, "supabase-rest");
  assert.equal(report.feedbackStorageSummary.productionStore.configuredStatus, "configured");
  assert.equal(report.feedbackStorageSummary.productionStore.missingStatus, "missing");
  assert.equal(report.feedbackStorageSummary.productionStore.serviceRoleKeyExposedToClient, false);
  assert.ok(hasPassingCheck(report, "feedback-storage"));
  assert.ok(hasPassingCheck(report, "feedback-review-export-internal-gated"));
  assert.ok(hasPassingCheck(report, "attempt-review-export-internal-gated"));
  assert.deepEqual(report.internalTools, [
    {
      label: "Feedback review/export",
      path: BETA_FEEDBACK_REVIEW_API_PATH,
      gate: BETA_FEEDBACK_REVIEW_ENABLED_FLAG,
      defaultEnabled: false
    },
    {
      label: "Attempt review/repro export",
      path: BETA_ATTEMPT_REVIEW_API_PATH,
      gate: BETA_ATTEMPT_REVIEW_ENABLED_FLAG,
      defaultEnabled: false
    }
  ]);
});

test("Stage 140 report includes attempt review mobile QA and known limitations", () => {
  const report = buildPhase5BetaReadinessSignoffReport();

  assert.ok(hasPassingCheck(report, "attempt-version-snapshots"));
  assert.ok(hasPassingCheck(report, "scoring-snapping-legality-pipelines"));
  assert.ok(hasPassingCheck(report, "osm-attribution"));
  assert.ok(hasPassingCheck(report, "mobile-qa"));
  assert.ok(hasPassingCheck(report, "known-limitations"));
  assert.ok(hasPassingCheck(report, "not-final-production-ready"));
  assert.ok(report.knownLimitations.some((limitation) => limitation.includes("committed local OSM fixtures only")));
  assert.ok(report.knownLimitations.some((limitation) => limitation.includes("does not fetch live OSM")));
  assert.ok(report.knownLimitations.some((limitation) => limitation.includes("Pilot coverage is limited")));
});

test("Stage 140 freeze documents exclusions tester prompts and Phase 6 handoff", () => {
  const report = buildPhase5BetaReadinessSignoffReport();

  assert.ok(report.intentionallyExcluded.includes("Live Overpass or other live OSM fetches"));
  assert.ok(report.intentionallyExcluded.includes("External routing APIs"));
  assert.ok(report.intentionallyExcluded.includes("Final production exposure for normal users"));
  assert.ok(report.deferredToPhase6.includes("Beta feedback triage and exercise iteration"));
  assert.ok(report.deferredToPhase6.includes("More London map areas and more official exercises"));
  assert.ok(report.testerReportPrompts.includes("wrong-way or restriction concerns"));
  assert.ok(report.testerReportPrompts.includes("touch, zoom, scroll, or drawing issues"));
});

test("Stage 140 report records validation and manual QA checklist", () => {
  const report = buildPhase5BetaReadinessSignoffReport();

  assert.deepEqual(report.validationCommands, [
    "npm.cmd run test:phase5-beta-readiness",
    "npm.cmd run test:public-beta-feedback",
    "npm.cmd run test:map",
    "npm.cmd run lint",
    "npm.cmd run build"
  ]);
  assert.ok(report.manualQaChecklist.includes("app starts with npm.cmd run dev"));
  assert.ok(report.manualQaChecklist.includes("feedback review tool is internal-gated"));
  assert.ok(report.manualQaChecklist.includes("attempt review tool is internal-gated"));
  assert.ok(report.manualQaChecklist.includes("mobile viewport remains usable"));
});

test("Stage 140 readiness report remains deterministic and does not expose secrets", () => {
  const first = JSON.stringify(buildPhase5BetaReadinessSignoffReport());
  const second = JSON.stringify(buildPhase5BetaReadinessSignoffReport());

  assert.equal(first, second);
  assert.doesNotMatch(first, /configured-for-signoff-only/);
  assert.doesNotMatch(first, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(first, /"finalProductionReady":false/);
  assert.match(first, /beta-ready/);
});

function hasPassingCheck(
  report: ReturnType<typeof buildPhase5BetaReadinessSignoffReport>,
  checkId: string
): boolean {
  return report.readinessChecks.some((check) => check.id === checkId && check.status === "pass");
}
