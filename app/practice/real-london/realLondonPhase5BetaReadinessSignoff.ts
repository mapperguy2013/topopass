import { marloweDistrictMap } from "../../../lib/map-engine/index.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  ROUTE_RUNNER_MAP_OPTIONS,
  getRouteRunnerMapOption,
  realLondonOsmPilotRouteMap,
  realLondonOsmPilotTwoRouteMap,
  type RouteRunnerMapOption
} from "../../dev/route-runner/routeRunnerMaps.ts";
import {
  buildLondonPilotReadinessReportForMapId,
  stableOsmPilotReadinessReportSummary
} from "../../dev/route-runner/routeRunnerOsmRealPilotReadinessReport.ts";
import {
  REAL_LONDON_BETA_ENV_FLAG,
  REAL_LONDON_BETA_KNOWN_LIMITATIONS,
  buildPhase5RealLondonBetaReadinessReview,
  getRealLondonBetaMapOptions
} from "../../dev/route-runner/routeRunnerRealLondonBetaGate.ts";
import { buildRouteRunnerMobileQaReport } from "../../dev/route-runner/routeRunnerMobileQa.ts";
import { validateRegisteredRouteRunnerVersionMetadata } from "../../dev/route-runner/routeRunnerVersionMetadata.ts";
import {
  BETA_ATTEMPT_REVIEW_API_PATH,
  BETA_ATTEMPT_REVIEW_ENABLED_FLAG,
  isBetaAttemptReviewEnabled
} from "./betaAttemptReview.ts";
import {
  BETA_FEEDBACK_REVIEW_API_PATH,
  BETA_FEEDBACK_REVIEW_ENABLED_FLAG,
  isBetaFeedbackReviewEnabled
} from "./betaFeedbackReview.ts";
import {
  DEFAULT_BETA_FEEDBACK_TABLE,
  LOCAL_BETA_FEEDBACK_DIR,
  LOCAL_BETA_FEEDBACK_FILE,
  getSupabaseBetaFeedbackConfig
} from "./betaFeedbackStore.ts";
import { REAL_LONDON_BETA_FEEDBACK_API_PATH } from "./realLondonBetaFeedback.ts";
import {
  REAL_LONDON_BETA_PRACTICE_PATH,
  buildRealLondonBetaPracticeScreenModel
} from "./realLondonBetaPracticeScreen.ts";

export type Phase5BetaReadinessCheckStatus = "pass" | "documented-limited";

export type Phase5BetaReadinessCheck = {
  id: string;
  status: Phase5BetaReadinessCheckStatus;
  summary: string;
  evidence: string[];
};

export type Phase5BetaReadinessSignoffReport = {
  stage: 140;
  phase: "Phase 5";
  releaseScope: "real-london-beta";
  status: "beta-ready" | "not-ready";
  isBetaReady: boolean;
  finalProductionReady: false;
  scopeFrozen: true;
  betaFlag: typeof REAL_LONDON_BETA_ENV_FLAG;
  betaPracticePath: typeof REAL_LONDON_BETA_PRACTICE_PATH;
  includedMaps: Array<{
    mapId: string;
    label: string;
    mapVersion: string;
    exerciseIds: string[];
    fixtureName: string | null;
    readinessSummary: object;
  }>;
  includedExerciseCount: number;
  validationCommands: string[];
  readinessChecks: Phase5BetaReadinessCheck[];
  failureReasonCodes: string[];
  knownLimitations: string[];
  intentionallyExcluded: string[];
  deferredToPhase6: string[];
  testerReportPrompts: string[];
  internalTools: Array<{
    label: string;
    path: string;
    gate: string;
    defaultEnabled: false;
  }>;
  feedbackStorageSummary: {
    submitApiPath: typeof REAL_LONDON_BETA_FEEDBACK_API_PATH;
    localTestStore: string;
    productionStore: {
      backend: "supabase-rest";
      table: string;
      configuredStatus: "configured";
      missingStatus: "missing";
      serviceRoleKeyExposedToClient: false;
    };
  };
  manualQaChecklist: string[];
};

const PHASE_5_VALIDATION_COMMANDS = [
  "npm.cmd run test:phase5-beta-readiness",
  "npm.cmd run test:public-beta-feedback",
  "npm.cmd run test:map",
  "npm.cmd run lint",
  "npm.cmd run build"
] as const;

const PHASE_5_INTENTIONALLY_EXCLUDED = [
  "Live Overpass or other live OSM fetches",
  "External routing APIs",
  "Final production exposure for normal users",
  "Production admin authentication for review tools",
  "Analytics instrumentation for beta outcomes",
  "Additional London map areas beyond the committed pilot fixtures",
  "New scoring, snapping, legality, or route-solving behavior"
] as const;

const PHASE_6_DEFERRED_WORK = [
  "Beta feedback triage and exercise iteration",
  "More London map areas and more official exercises",
  "Production admin/auth hardening for internal review tools",
  "Analytics, if later desired",
  "Broader device QA and tester onboarding improvements",
  "Further map styling refinements after beta evidence"
] as const;

const TESTER_REPORT_PROMPTS = [
  "unclear route instructions",
  "missing or confusing map labels",
  "wrong-way or restriction concerns",
  "touch, zoom, scroll, or drawing issues",
  "exercise difficulty mismatches",
  "feedback submission problems"
] as const;

const MANUAL_QA_CHECKLIST = [
  "app starts with npm.cmd run dev",
  "default/non-beta route remains safe",
  "/practice/real-london is unavailable when NEXT_PUBLIC_REAL_LONDON_BETA is disabled",
  "/practice/real-london is available when NEXT_PUBLIC_REAL_LONDON_BETA is enabled",
  "feedback form submits in local/test mode",
  "feedback review tool is internal-gated",
  "attempt review tool is internal-gated",
  "mobile viewport remains usable",
  "README reflects beta-ready but not final-production-ready status"
] as const;

export function buildPhase5BetaReadinessSignoffReport(): Phase5BetaReadinessSignoffReport {
  const betaMapOptions = getRealLondonBetaMapOptions();
  const readinessReview = buildPhase5RealLondonBetaReadinessReview();
  const versionValidation = validateRegisteredRouteRunnerVersionMetadata(ROUTE_RUNNER_MAP_OPTIONS);
  const enabledPracticeModel = buildRealLondonBetaPracticeScreenModel({ betaEnabled: true });
  const disabledPracticeModel = buildRealLondonBetaPracticeScreenModel({ betaEnabled: false });
  const configuredFeedbackStore = getSupabaseBetaFeedbackConfig({
    NODE_ENV: "production",
    BETA_FEEDBACK_STORAGE: "supabase",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "configured-for-signoff-only"
  });
  const missingFeedbackStore = getSupabaseBetaFeedbackConfig({
    NODE_ENV: "production"
  });
  const mobileQaReports = betaMapOptions.map((option) =>
    buildRouteRunnerMobileQaReport({
      mapOption: option,
      viewportWidth: 390,
      viewportHeight: 844
    })
  );
  const includedMaps = betaMapOptions.map(buildIncludedMapSummary);
  const checks: Phase5BetaReadinessCheck[] = [
    {
      id: "beta-gate-default-disabled",
      status: readinessReview.betaDefaultEnabled ? "documented-limited" : "pass",
      summary: "Real London beta remains behind a default-disabled feature flag.",
      evidence: [readinessReview.betaFlagName, `defaultEnabled=${String(readinessReview.betaDefaultEnabled)}`]
    },
    {
      id: "non-beta-default-experience",
      status:
        disabledPracticeModel.state === "unavailable" &&
        disabledPracticeModel.defaultMapId === DEFAULT_ROUTE_RUNNER_MAP_ID &&
        DEFAULT_ROUTE_RUNNER_MAP_ID === marloweDistrictMap.id
          ? "pass"
          : "documented-limited",
      summary: "Non-beta users keep the existing Marlowe/default practice experience.",
      evidence: [DEFAULT_ROUTE_RUNNER_MAP_ID, disabledPracticeModel.state]
    },
    {
      id: "beta-practice-screen",
      status: enabledPracticeModel.state === "available" && enabledPracticeModel.routeRunnerMode === "student-beta" ? "pass" : "documented-limited",
      summary: "Beta-enabled testers have a student-facing Real London practice screen.",
      evidence:
        enabledPracticeModel.state === "available"
          ? [enabledPracticeModel.pagePath, enabledPracticeModel.mapId, enabledPracticeModel.routeRunnerMode]
          : [enabledPracticeModel.state]
    },
    {
      id: "committed-fixture-maps",
      status: betaMapOptions.length === 2 && includedMaps.every((map) => map.fixtureName?.startsWith("realLondonPilot")) ? "pass" : "documented-limited",
      summary: "The two Real London pilot maps are registered from committed fixtures.",
      evidence: includedMaps.map((map) => `${map.mapId}:${map.fixtureName ?? "missing-fixture"}`)
    },
    {
      id: "starter-exercises-registered-versioned",
      status: includedMaps.every((map) => map.exerciseIds.length > 0) && versionValidation.isValid ? "pass" : "documented-limited",
      summary: "Starter exercises are registered and map/exercise semver metadata is valid.",
      evidence: [
        `exerciseCount=${String(includedMaps.reduce((total, map) => total + map.exerciseIds.length, 0))}`,
        `versionErrors=${String(versionValidation.errors.length)}`
      ]
    },
    {
      id: "attempt-version-snapshots",
      status: readinessReview.sections.find((section) => section.id === "attempt-versioning")?.status === "pass" ? "pass" : "documented-limited",
      summary: "Route attempt version snapshots capture map and exercise versions.",
      evidence: ["routeAttemptVersionSnapshot.test.ts", "ready-review:attempt-versioning"]
    },
    {
      id: "scoring-snapping-legality-pipelines",
      status: readinessReview.sections.find((section) => section.id === "pilot-exercise-qa")?.status === "pass" ? "pass" : "documented-limited",
      summary: "Existing test suites continue to cover scoring, snapping, legality, restrictions, and route QA.",
      evidence: ["npm.cmd run test:map", "routeRunnerOsmRestrictionLegalityAudit.test.ts", "routeSnapping.test.ts"]
    },
    {
      id: "osm-attribution",
      status: enabledPracticeModel.state === "available" && enabledPracticeModel.attribution.includes("OpenStreetMap") ? "pass" : "documented-limited",
      summary: "OSM attribution is present where OSM beta map data is shown.",
      evidence: enabledPracticeModel.state === "available" ? [enabledPracticeModel.attribution] : [enabledPracticeModel.state]
    },
    {
      id: "feedback-storage",
      status: configuredFeedbackStore.status === "configured" && missingFeedbackStore.status === "missing" ? "pass" : "documented-limited",
      summary: "Feedback writes use local/test JSONL or configured production Supabase storage and fail safely when missing.",
      evidence: [
        `${LOCAL_BETA_FEEDBACK_DIR}/${LOCAL_BETA_FEEDBACK_FILE}`,
        `configured=${configuredFeedbackStore.status}`,
        `missing=${missingFeedbackStore.status}`
      ]
    },
    {
      id: "feedback-review-export-internal-gated",
      status: !isBetaFeedbackReviewEnabled({}) ? "pass" : "documented-limited",
      summary: "Feedback review and export stay internal-gated by default.",
      evidence: [BETA_FEEDBACK_REVIEW_ENABLED_FLAG, BETA_FEEDBACK_REVIEW_API_PATH, "csv", "json"]
    },
    {
      id: "attempt-review-export-internal-gated",
      status: !isBetaAttemptReviewEnabled({}) ? "pass" : "documented-limited",
      summary: "Attempt review and repro export stay internal-gated by default.",
      evidence: [BETA_ATTEMPT_REVIEW_ENABLED_FLAG, BETA_ATTEMPT_REVIEW_API_PATH, "json"]
    },
    {
      id: "mobile-qa",
      status:
        mobileQaReports.length > 0 &&
        mobileQaReports.every((report) => report.isPassing && report.horizontalOverflowRisk === false)
          ? "pass"
          : "documented-limited",
      summary: "Mobile layout QA is documented and passing for phone-sized Real London beta viewports.",
      evidence: mobileQaReports.map((report) => `${report.mapId}:passing=${String(report.isPassing)}`)
    },
    {
      id: "known-limitations",
      status: REAL_LONDON_BETA_KNOWN_LIMITATIONS.length > 0 ? "pass" : "documented-limited",
      summary: "Known limitations are documented and the release is beta-ready, not final-production-ready.",
      evidence: [...REAL_LONDON_BETA_KNOWN_LIMITATIONS]
    },
    {
      id: "not-final-production-ready",
      status: "pass",
      summary: "Phase 5 sign-off explicitly avoids claiming final production readiness.",
      evidence: ["finalProductionReady=false", "status=beta-ready"]
    }
  ];
  const failureReasonCodes = checks.flatMap((check) =>
    check.status === "documented-limited" ? [`${check.id}:documented-limited`] : []
  );

  return {
    stage: 140,
    phase: "Phase 5",
    releaseScope: "real-london-beta",
    status: failureReasonCodes.length === 0 ? "beta-ready" : "not-ready",
    isBetaReady: failureReasonCodes.length === 0,
    finalProductionReady: false,
    scopeFrozen: true,
    betaFlag: REAL_LONDON_BETA_ENV_FLAG,
    betaPracticePath: REAL_LONDON_BETA_PRACTICE_PATH,
    includedMaps,
    includedExerciseCount: includedMaps.reduce((total, map) => total + map.exerciseIds.length, 0),
    validationCommands: [...PHASE_5_VALIDATION_COMMANDS],
    readinessChecks: checks,
    failureReasonCodes,
    knownLimitations: [...REAL_LONDON_BETA_KNOWN_LIMITATIONS],
    intentionallyExcluded: [...PHASE_5_INTENTIONALLY_EXCLUDED],
    deferredToPhase6: [...PHASE_6_DEFERRED_WORK],
    testerReportPrompts: [...TESTER_REPORT_PROMPTS],
    internalTools: [
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
    ],
    feedbackStorageSummary: {
      submitApiPath: REAL_LONDON_BETA_FEEDBACK_API_PATH,
      localTestStore: `${LOCAL_BETA_FEEDBACK_DIR}/${LOCAL_BETA_FEEDBACK_FILE}`,
      productionStore: {
        backend: "supabase-rest",
        table: DEFAULT_BETA_FEEDBACK_TABLE,
        configuredStatus: "configured",
        missingStatus: "missing",
        serviceRoleKeyExposedToClient: false
      }
    },
    manualQaChecklist: [...MANUAL_QA_CHECKLIST]
  };
}

function buildIncludedMapSummary(option: RouteRunnerMapOption) {
  const readiness = buildLondonPilotReadinessReportForMapId(option.map.id);

  return {
    mapId: option.map.id,
    label: option.label,
    mapVersion: option.map.mapVersion ?? "missing",
    exerciseIds: option.exercises.map((exercise) => exercise.id),
    fixtureName: option.fixtureName ?? null,
    readinessSummary: stableOsmPilotReadinessReportSummary(readiness)
  };
}

export function assertPhase5BetaMapRegistration(): boolean {
  return Boolean(
    getRouteRunnerMapOption(realLondonOsmPilotRouteMap.id) &&
      getRouteRunnerMapOption(realLondonOsmPilotTwoRouteMap.id)
  );
}
