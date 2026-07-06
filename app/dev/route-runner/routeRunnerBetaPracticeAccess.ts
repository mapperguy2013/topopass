import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  REAL_LONDON_OSM_PILOT_MAP_ID,
  REAL_LONDON_OSM_PILOT_TWO_MAP_ID,
  isDevOnlyRouteRunnerMapOption,
  type RouteRunnerMapOption
} from "./routeRunnerMapOptionUtils.ts";

export const REAL_LONDON_BETA_ENV_FLAG = "NEXT_PUBLIC_REAL_LONDON_BETA";
export const REAL_LONDON_BETA_LABEL = "Real London Practice Beta";
export const REAL_LONDON_BETA_FEEDBACK_PLACEHOLDER =
  "Beta testers can note route confusion, missing labels, awkward touch interactions, or fixture coverage gaps here before sharing feedback with the team.";

export type RealLondonBetaAccessEnv = Record<string, string | undefined>;
export type RealLondonBetaAvailabilityState = "available" | "beta-gated" | "unknown-map";

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

const BETA_ENABLED_VALUES = new Set(["1", "true", "yes", "on", "enabled"]);

export const REAL_LONDON_BETA_KNOWN_LIMITATIONS = [
  "Uses committed local OSM fixtures only; it does not fetch live OSM or Overpass data.",
  "Pilot coverage is limited to the current real London fixture areas and starter exercises.",
  "Team review is required before any production exposure.",
  "Mobile and touch interaction are still being checked before wider rollout."
] as const;

export function isRealLondonBetaAccessEnabled(env: RealLondonBetaAccessEnv = process.env): boolean {
  const rawValue = env[REAL_LONDON_BETA_ENV_FLAG];

  return typeof rawValue === "string" && BETA_ENABLED_VALUES.has(rawValue.trim().toLowerCase());
}

export function isRealLondonBetaMapId(mapId: string): boolean {
  return (
    mapId === REAL_LONDON_OSM_PILOT_MAP_ID ||
    mapId === REAL_LONDON_OSM_PILOT_TWO_MAP_ID ||
    mapId.startsWith("osm-curated-")
  );
}

function isRealLondonBetaMapOption(option: RouteRunnerMapOption): boolean {
  return isRealLondonBetaMapId(option.map.id);
}

export function isFictionalBetaPracticeMapId(mapId: string): boolean {
  return mapId === DEFAULT_ROUTE_RUNNER_MAP_ID;
}

function isFictionalBetaPracticeMapOption(option: RouteRunnerMapOption): boolean {
  return isFictionalBetaPracticeMapId(option.map.id);
}

function isBetaPracticeMapOption(option: RouteRunnerMapOption): boolean {
  return isRealLondonBetaMapOption(option) || isFictionalBetaPracticeMapOption(option);
}

export function routeRunnerMapOptionIsVisibleInBeta(option: RouteRunnerMapOption): boolean {
  if (!isBetaPracticeMapOption(option)) {
    return false;
  }

  if (option.fixturePerformanceGate === "devOnlyStressTest") {
    return false;
  }

  if (option.visibleInBeta !== undefined) {
    return option.visibleInBeta;
  }

  return true;
}

export function routeRunnerMapOptionIsScoreable(option: RouteRunnerMapOption): boolean {
  if (option.scoreable !== undefined) {
    return option.scoreable;
  }

  return option.fixtureUse === undefined || option.fixtureUse === "routableExercise";
}

export function routeRunnerMapOptionBetaStatusLabel(option: RouteRunnerMapOption): string {
  if (option.fixturePerformanceGate === "devOnlyStressTest") {
    return "Stress test / slow";
  }

  if (option.fixtureUse === "routeReviewFixture") {
    return "Route review";
  }

  if (option.fixtureUse === "visualQaOnly" || !routeRunnerMapOptionIsScoreable(option)) {
    return "Map preview only";
  }

  return "Scored practice";
}

export function getRealLondonBetaMapOptions(
  mapOptions: readonly RouteRunnerMapOption[] = []
): RouteRunnerMapOption[] {
  return mapOptions.filter(routeRunnerMapOptionIsVisibleInBeta);
}

export function getRouteRunnerVisibleMapOptions(input: {
  betaEnabled?: boolean;
  env?: RealLondonBetaAccessEnv;
  mapOptions?: readonly RouteRunnerMapOption[];
} = {}): RouteRunnerMapOption[] {
  const betaEnabled = input.betaEnabled ?? isRealLondonBetaAccessEnabled(input.env);
  const mapOptions = input.mapOptions ?? [];

  return mapOptions.filter((option) => {
    const realLondonMap = isRealLondonBetaMapOption(option);

    if (realLondonMap) {
      return betaEnabled && routeRunnerMapOptionIsVisibleInBeta(option);
    }

    if (isFictionalBetaPracticeMapOption(option)) {
      return true;
    }

    if (isDevOnlyRouteRunnerMapOption(option)) {
      return false;
    }

    return true;
  });
}

export function getRouteRunnerDevQaMapOptions(
  mapOptions: readonly RouteRunnerMapOption[] = []
): RouteRunnerMapOption[] {
  return [...mapOptions];
}

export function resolveRealLondonBetaMapAccess(input: {
  requestedMapId: string;
  betaEnabled?: boolean;
  env?: RealLondonBetaAccessEnv;
  mapOptions?: readonly RouteRunnerMapOption[];
  defaultMapId?: string;
}): RealLondonBetaMapAccess {
  const betaEnabled = input.betaEnabled ?? isRealLondonBetaAccessEnabled(input.env);
  const mapOptions = input.mapOptions ?? [];
  const defaultMapId = input.defaultMapId ?? DEFAULT_ROUTE_RUNNER_MAP_ID;
  const requestedMapOption = mapOptions.find(
    (option) =>
      option.map.id === input.requestedMapId &&
      (isRealLondonBetaMapOption(option)
        ? routeRunnerMapOptionIsVisibleInBeta(option)
        : !isDevOnlyRouteRunnerMapOption(option))
  );
  const defaultMapOption = mapOptions.find((option) => option.map.id === defaultMapId) ?? mapOptions[0];

  if (!defaultMapOption) {
    throw new Error("Route runner beta gate requires at least one map option.");
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
