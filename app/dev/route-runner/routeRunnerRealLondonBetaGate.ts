import {
  buildMapGraph,
  findShortestLegalRouteThroughStops,
  runRouteExercise,
  type RouteExercise
} from "../../../lib/map-engine/index.ts";
import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  ROUTE_RUNNER_MAP_OPTIONS,
  getRouteRunnerMapOption,
  realLondonOsmPilotRouteMap,
  realLondonOsmPilotTwoRouteMap,
  type RouteRunnerMapOption
} from "./routeRunnerMaps.ts";
import {
  buildLondonPilotReadinessReportForMapId,
  type OsmPilotReadinessReport
} from "./routeRunnerOsmRealPilotReadinessReport.ts";
import { createRouteAttemptVersionSnapshot } from "./routeAttemptVersionSnapshot.ts";

export const REAL_LONDON_BETA_ENV_FLAG = "NEXT_PUBLIC_REAL_LONDON_BETA";
export const REAL_LONDON_BETA_LABEL = "Real London beta";
export const REAL_LONDON_BETA_FEEDBACK_PLACEHOLDER =
  "Beta testers can note route confusion, missing labels, awkward touch interactions, or fixture coverage gaps here before sharing feedback with the team.";

export type RealLondonBetaAccessEnv = Record<string, string | undefined>;
export type RealLondonBetaAvailabilityState = "available" | "beta-gated" | "unknown-map";
export type Phase5RealLondonBetaReviewStatus = "pass" | "fail" | "documented-limited";
export type Phase5RealLondonBetaOverallStatus = "ready-for-beta-review" | "not-ready";

export type RealLondonBetaUnavailableState = {
  mapId: string;
  title: string;
  message: string;
  reasonCode: "real-london-beta-disabled" | "unknown-map";
};

export type RealLondonBetaMapAccess = {
  requestedMapId: string;
  selectedMapOption: RouteRunnerMapOption;
  state: RealLondonBetaAvailabilityState;
  betaEnabled: boolean;
  unavailableState: RealLondonBetaUnavailableState | null;
};

export type RealLondonBetaPracticePanelModel = {
  mapId: string;
  label: string;
  statusText: string;
  fixtureName: string | null;
  attribution: string | null;
  feedbackPlaceholder: string;
  knownLimitations: string[];
};

export type Phase5RealLondonBetaReviewSection = {
  id:
    | "beta-flag-default-disabled"
    | "beta-access-enabled"
    | "non-beta-default-experience"
    | "safe-unavailable-state"
    | "real-map-stability"
    | "pilot-exercise-qa"
    | "attempt-versioning"
    | "student-route-flow"
    | "osm-attribution"
    | "known-limitations"
    | "mobile-interaction";
  status: Phase5RealLondonBetaReviewStatus;
  summary: string;
  reasonCodes: string[];
};

export type Phase5RealLondonBetaReadinessReview = {
  overallStatus: Phase5RealLondonBetaOverallStatus;
  isReadyForBetaReview: boolean;
  betaFlagName: typeof REAL_LONDON_BETA_ENV_FLAG;
  betaDefaultEnabled: boolean;
  betaEnabledAccessMapIds: string[];
  nonBetaVisibleMapIds: string[];
  realLondonMapIds: string[];
  sections: Phase5RealLondonBetaReviewSection[];
  failureReasonCodes: string[];
  documentedLimitations: string[];
};

const BETA_ENABLED_VALUES = new Set(["1", "true", "yes", "on", "enabled"]);

export const REAL_LONDON_BETA_KNOWN_LIMITATIONS = [
  "Uses committed local OSM fixtures only; it does not fetch live OSM or Overpass data.",
  "Pilot coverage is limited to the current real London fixture areas and starter exercises.",
  "QA and beta review are required before any production exposure.",
  "Mobile and touch interaction have separate QA coverage and still need final acceptance before public rollout."
] as const;

export function isRealLondonBetaAccessEnabled(env: RealLondonBetaAccessEnv = process.env): boolean {
  const rawValue = env[REAL_LONDON_BETA_ENV_FLAG];

  return typeof rawValue === "string" && BETA_ENABLED_VALUES.has(rawValue.trim().toLowerCase());
}

export function isRealLondonBetaMapId(mapId: string): boolean {
  return mapId === realLondonOsmPilotRouteMap.id || mapId === realLondonOsmPilotTwoRouteMap.id;
}

export function getRealLondonBetaMapOptions(
  mapOptions: readonly RouteRunnerMapOption[] = ROUTE_RUNNER_MAP_OPTIONS
): RouteRunnerMapOption[] {
  return mapOptions.filter((option) => isRealLondonBetaMapId(option.map.id));
}

export function getRouteRunnerVisibleMapOptions(input: {
  betaEnabled?: boolean;
  env?: RealLondonBetaAccessEnv;
  mapOptions?: readonly RouteRunnerMapOption[];
} = {}): RouteRunnerMapOption[] {
  const betaEnabled = input.betaEnabled ?? isRealLondonBetaAccessEnabled(input.env);
  const mapOptions = input.mapOptions ?? ROUTE_RUNNER_MAP_OPTIONS;

  return mapOptions.filter((option) => betaEnabled || !isRealLondonBetaMapId(option.map.id));
}

export function resolveRealLondonBetaMapAccess(input: {
  requestedMapId: string;
  betaEnabled?: boolean;
  env?: RealLondonBetaAccessEnv;
  mapOptions?: readonly RouteRunnerMapOption[];
  defaultMapId?: string;
}): RealLondonBetaMapAccess {
  const betaEnabled = input.betaEnabled ?? isRealLondonBetaAccessEnabled(input.env);
  const mapOptions = input.mapOptions ?? ROUTE_RUNNER_MAP_OPTIONS;
  const defaultMapId = input.defaultMapId ?? DEFAULT_ROUTE_RUNNER_MAP_ID;
  const requestedMapOption = mapOptions.find((option) => option.map.id === input.requestedMapId);
  const defaultMapOption =
    mapOptions.find((option) => option.map.id === defaultMapId) ?? getRouteRunnerMapOption(DEFAULT_ROUTE_RUNNER_MAP_ID);

  if (!defaultMapOption) {
    throw new Error("Route runner beta gate requires a default map option.");
  }

  if (!requestedMapOption) {
    return {
      requestedMapId: input.requestedMapId,
      selectedMapOption: defaultMapOption,
      state: "unknown-map",
      betaEnabled,
      unavailableState: {
        mapId: input.requestedMapId,
        title: "Map unavailable",
        message: "The requested route-runner map is not registered, so the default Marlowe practice map is shown.",
        reasonCode: "unknown-map"
      }
    };
  }

  if (isRealLondonBetaMapId(requestedMapOption.map.id) && !betaEnabled) {
    return {
      requestedMapId: input.requestedMapId,
      selectedMapOption: defaultMapOption,
      state: "beta-gated",
      betaEnabled,
      unavailableState: {
        mapId: requestedMapOption.map.id,
        title: "Real London practice is beta-gated",
        message: "Real London practice is currently available only to beta-enabled testers. Marlowe remains the default practice map.",
        reasonCode: "real-london-beta-disabled"
      }
    };
  }

  return {
    requestedMapId: input.requestedMapId,
    selectedMapOption: requestedMapOption,
    state: "available",
    betaEnabled,
    unavailableState: null
  };
}

export function buildRealLondonBetaPracticePanelModel(input: {
  mapOption: RouteRunnerMapOption;
  betaEnabled?: boolean;
  env?: RealLondonBetaAccessEnv;
}): RealLondonBetaPracticePanelModel | null {
  const betaEnabled = input.betaEnabled ?? isRealLondonBetaAccessEnabled(input.env);

  if (!betaEnabled || !isRealLondonBetaMapId(input.mapOption.map.id)) {
    return null;
  }

  return {
    mapId: input.mapOption.map.id,
    label: REAL_LONDON_BETA_LABEL,
    statusText: "Beta review map. Not final production-ready map behavior.",
    fixtureName: input.mapOption.fixtureName ?? null,
    attribution: input.mapOption.attribution ?? null,
    feedbackPlaceholder: REAL_LONDON_BETA_FEEDBACK_PLACEHOLDER,
    knownLimitations: [...REAL_LONDON_BETA_KNOWN_LIMITATIONS]
  };
}

export function buildPhase5RealLondonBetaReadinessReview(input: {
  env?: RealLondonBetaAccessEnv;
  mapOptions?: readonly RouteRunnerMapOption[];
} = {}): Phase5RealLondonBetaReadinessReview {
  const mapOptions = input.mapOptions ?? ROUTE_RUNNER_MAP_OPTIONS;
  const realLondonMapOptions = getRealLondonBetaMapOptions(mapOptions);
  const betaEnabledVisibleMapIds = getRouteRunnerVisibleMapOptions({ betaEnabled: true, mapOptions }).map(
    (option) => option.map.id
  );
  const nonBetaVisibleMapIds = getRouteRunnerVisibleMapOptions({ betaEnabled: false, mapOptions }).map(
    (option) => option.map.id
  );
  const betaAccess = resolveRealLondonBetaMapAccess({
    requestedMapId: realLondonMapOptions[0]?.map.id ?? realLondonOsmPilotRouteMap.id,
    betaEnabled: true,
    mapOptions
  });
  const nonBetaAccess = resolveRealLondonBetaMapAccess({
    requestedMapId: realLondonMapOptions[0]?.map.id ?? realLondonOsmPilotRouteMap.id,
    betaEnabled: false,
    mapOptions
  });
  const readinessReports = realLondonMapOptions.map((option) => buildLondonPilotReadinessReportForMapId(option.map.id));
  const attemptVersioningOk = realLondonMapOptions.every((option) => buildAttemptVersioningStatus(option));
  const studentRouteFlowOk = realLondonMapOptions.every((option) => buildStudentRouteFlowStatus(option));
  const attributionOk = realLondonMapOptions.every((option) => option.attribution?.includes("OpenStreetMap"));
  const limitationsOk = REAL_LONDON_BETA_KNOWN_LIMITATIONS.length >= 4;
  const sections: Phase5RealLondonBetaReviewSection[] = [
    {
      id: "beta-flag-default-disabled",
      status: isRealLondonBetaAccessEnabled({}) ? "fail" : "pass",
      summary: `${REAL_LONDON_BETA_ENV_FLAG} defaults to disabled unless explicitly enabled.`,
      reasonCodes: isRealLondonBetaAccessEnabled({}) ? ["beta-default-enabled"] : []
    },
    {
      id: "beta-access-enabled",
      status: betaAccess.state === "available" && realLondonMapOptions.length > 0 ? "pass" : "fail",
      summary: "Beta-enabled testers can access registered real London pilot maps.",
      reasonCodes: betaAccess.state === "available" && realLondonMapOptions.length > 0 ? [] : ["beta-access-blocked"]
    },
    {
      id: "non-beta-default-experience",
      status:
        nonBetaAccess.selectedMapOption.map.id === DEFAULT_ROUTE_RUNNER_MAP_ID &&
        !nonBetaVisibleMapIds.some(isRealLondonBetaMapId)
          ? "pass"
          : "fail",
      summary: "Non-beta users keep the default Marlowe route-runner experience.",
      reasonCodes:
        nonBetaAccess.selectedMapOption.map.id === DEFAULT_ROUTE_RUNNER_MAP_ID &&
        !nonBetaVisibleMapIds.some(isRealLondonBetaMapId)
          ? []
          : ["non-beta-real-london-visible"]
    },
    {
      id: "safe-unavailable-state",
      status: nonBetaAccess.unavailableState?.reasonCode === "real-london-beta-disabled" ? "pass" : "fail",
      summary: "Requests for real London maps while beta is disabled return a safe unavailable state.",
      reasonCodes: nonBetaAccess.unavailableState?.reasonCode === "real-london-beta-disabled" ? [] : ["missing-unavailable-state"]
    },
    {
      id: "real-map-stability",
      status: readinessReports.length > 0 && readinessReports.every((report) => report.isReady) ? "pass" : "fail",
      summary: `Stable real London readiness reports found for ${readinessReports.length} map(s).`,
      reasonCodes: readinessReports.length > 0 && readinessReports.every((report) => report.isReady) ? [] : ["real-map-readiness-failed"]
    },
    {
      id: "pilot-exercise-qa",
      status: readinessReports.every((report) => pilotExerciseQaPasses(report)) ? "pass" : "fail",
      summary: "Pilot exercises pass acceptance, manual-attempt, drawn-route, and legal-route QA.",
      reasonCodes: readinessReports.every((report) => pilotExerciseQaPasses(report)) ? [] : ["pilot-exercise-qa-failed"]
    },
    {
      id: "attempt-versioning",
      status: attemptVersioningOk ? "pass" : "fail",
      summary: "Route attempt version snapshots can capture real London map and exercise versions.",
      reasonCodes: attemptVersioningOk ? [] : ["attempt-version-snapshot-missing"]
    },
    {
      id: "student-route-flow",
      status: studentRouteFlowOk ? "pass" : "fail",
      summary: "A fastest legal route can run through the existing student route flow for each real London map.",
      reasonCodes: studentRouteFlowOk ? [] : ["student-route-flow-failed"]
    },
    {
      id: "osm-attribution",
      status: attributionOk ? "pass" : "fail",
      summary: "OSM-derived beta maps expose OpenStreetMap attribution in route-runner map metadata.",
      reasonCodes: attributionOk ? [] : ["osm-attribution-missing"]
    },
    {
      id: "known-limitations",
      status: limitationsOk ? "pass" : "fail",
      summary: "Real London beta limitations are documented for the UI and README.",
      reasonCodes: limitationsOk ? [] : ["known-limitations-missing"]
    },
    {
      id: "mobile-interaction",
      status: "documented-limited",
      summary: "Mobile/touch interaction is covered by the separate mobile route-runner QA stage and still needs final beta acceptance.",
      reasonCodes: ["mobile-acceptance-separate"]
    }
  ];
  const failureReasonCodes = sections.flatMap((section) =>
    section.status === "fail" ? section.reasonCodes.map((reasonCode) => `${section.id}:${reasonCode}`) : []
  );

  return {
    overallStatus: failureReasonCodes.length === 0 ? "ready-for-beta-review" : "not-ready",
    isReadyForBetaReview: failureReasonCodes.length === 0,
    betaFlagName: REAL_LONDON_BETA_ENV_FLAG,
    betaDefaultEnabled: isRealLondonBetaAccessEnabled({}),
    betaEnabledAccessMapIds: betaEnabledVisibleMapIds.filter(isRealLondonBetaMapId),
    nonBetaVisibleMapIds,
    realLondonMapIds: realLondonMapOptions.map((option) => option.map.id),
    sections,
    failureReasonCodes,
    documentedLimitations: [...REAL_LONDON_BETA_KNOWN_LIMITATIONS]
  };
}

function pilotExerciseQaPasses(report: OsmPilotReadinessReport): boolean {
  return (
    report.acceptanceQa.status === "pass" &&
    report.manualAttemptQa.status === "pass" &&
    report.drawnRouteQa.status === "pass" &&
    report.fastestLegalRouteAvailability.status === "pass"
  );
}

function buildAttemptVersioningStatus(option: RouteRunnerMapOption): boolean {
  const exercise = option.exercises[0];

  if (!exercise) {
    return false;
  }

  const snapshot = createRouteAttemptVersionSnapshot({
    map: option.map,
    exercise
  });

  return (
    snapshot.mapId === option.map.id &&
    snapshot.mapVersion === option.map.mapVersion &&
    snapshot.exerciseId === exercise.id &&
    snapshot.exerciseVersion === exercise.exerciseVersion
  );
}

function buildStudentRouteFlowStatus(option: RouteRunnerMapOption): boolean {
  const exercise = option.exercises[0];

  if (!exercise) {
    return false;
  }

  const stopNodeIds = exercise.stops.map(resolveNodeStopId).filter(isString);
  const graph = buildMapGraph(option.map);
  const fastestRoute = findShortestLegalRouteThroughStops({
    graph,
    stopNodeIds,
    restrictions: option.map.restrictions
  });

  if (!fastestRoute.found) {
    return false;
  }

  const result = runRouteExercise({
    map: option.map,
    exercises: option.exercises,
    exerciseId: exercise.id,
    userRoute: {
      nodeIds: fastestRoute.nodeIds,
      roadIds: fastestRoute.roadIds
    }
  });

  return result.score.passed && result.score.isLegal;
}

function resolveNodeStopId(stop: RouteExercise["stops"][number]): string | null {
  return stop.type === "node" ? stop.nodeId : null;
}

function isString(value: string | null): value is string {
  return typeof value === "string";
}
