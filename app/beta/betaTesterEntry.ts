import {
  DEFAULT_ROUTE_RUNNER_MAP_ID,
  realLondonOsmPilotRouteMap
} from "../dev/route-runner/routeRunnerMaps.ts";
import {
  REAL_LONDON_BETA_ENV_FLAG,
  REAL_LONDON_BETA_KNOWN_LIMITATIONS,
  isRealLondonBetaAccessEnabled,
  type RealLondonBetaAccessEnv
} from "../dev/route-runner/routeRunnerRealLondonBetaGate.ts";
import {
  REAL_LONDON_BETA_PRACTICE_DISPLAY_LABEL,
  REAL_LONDON_BETA_PRACTICE_PATH
} from "../practice/real-london/realLondonBetaPracticeScreen.ts";

export const BETA_TESTER_ENTRY_PATH = "/beta";
export const BETA_TESTER_ENTRY_LABEL = "TopoPass Beta";
export const BETA_TESTER_ENTRY_TITLE = "Real London Practice Beta";

export type BetaTesterEntryModel =
  | {
      state: "available";
      pagePath: typeof BETA_TESTER_ENTRY_PATH;
      label: typeof BETA_TESTER_ENTRY_LABEL;
      title: typeof BETA_TESTER_ENTRY_TITLE;
      betaFlagName: typeof REAL_LONDON_BETA_ENV_FLAG;
      practiceLabel: typeof REAL_LONDON_BETA_PRACTICE_DISPLAY_LABEL;
      practiceHref: typeof REAL_LONDON_BETA_PRACTICE_PATH;
      defaultPracticeHref: "/practice";
      defaultMapId: typeof DEFAULT_ROUTE_RUNNER_MAP_ID;
      mapId: string;
      mapVersion: string;
      attribution: string;
      knownLimitations: string[];
      betaCopy: string;
      ctaLabel: "Start Real London beta practice";
      isDefaultExperience: false;
    }
  | {
      state: "unavailable";
      pagePath: typeof BETA_TESTER_ENTRY_PATH;
      label: typeof BETA_TESTER_ENTRY_LABEL;
      title: typeof BETA_TESTER_ENTRY_TITLE;
      betaFlagName: typeof REAL_LONDON_BETA_ENV_FLAG;
      practiceLabel: typeof REAL_LONDON_BETA_PRACTICE_DISPLAY_LABEL;
      defaultPracticeHref: "/practice";
      defaultMapId: typeof DEFAULT_ROUTE_RUNNER_MAP_ID;
      reasonCode: "real-london-beta-disabled";
      unavailableTitle: "Real London beta is not available";
      unavailableMessage: string;
      ctaLabel: "Go to standard practice";
      isDefaultExperience: false;
    };

export function buildBetaTesterEntryModel(input: {
  betaEnabled?: boolean;
  env?: RealLondonBetaAccessEnv;
} = {}): BetaTesterEntryModel {
  const betaEnabled = input.betaEnabled ?? isRealLondonBetaAccessEnabled(input.env);

  if (!betaEnabled) {
    return {
      state: "unavailable",
      pagePath: BETA_TESTER_ENTRY_PATH,
      label: BETA_TESTER_ENTRY_LABEL,
      title: BETA_TESTER_ENTRY_TITLE,
      betaFlagName: REAL_LONDON_BETA_ENV_FLAG,
      practiceLabel: REAL_LONDON_BETA_PRACTICE_DISPLAY_LABEL,
      defaultPracticeHref: "/practice",
      defaultMapId: DEFAULT_ROUTE_RUNNER_MAP_ID,
      reasonCode: "real-london-beta-disabled",
      unavailableTitle: "Real London beta is not available",
      unavailableMessage:
        "Real London practice is limited to beta-enabled testers while the pilot map and exercises remain under review. Standard Marlowe practice remains the default experience.",
      ctaLabel: "Go to standard practice",
      isDefaultExperience: false
    };
  }

  return {
    state: "available",
    pagePath: BETA_TESTER_ENTRY_PATH,
    label: BETA_TESTER_ENTRY_LABEL,
    title: BETA_TESTER_ENTRY_TITLE,
    betaFlagName: REAL_LONDON_BETA_ENV_FLAG,
    practiceLabel: REAL_LONDON_BETA_PRACTICE_DISPLAY_LABEL,
    practiceHref: REAL_LONDON_BETA_PRACTICE_PATH,
    defaultPracticeHref: "/practice",
    defaultMapId: DEFAULT_ROUTE_RUNNER_MAP_ID,
    mapId: realLondonOsmPilotRouteMap.id,
    mapVersion: realLondonOsmPilotRouteMap.mapVersion ?? "missing",
    attribution: "OpenStreetMap contributors",
    knownLimitations: [...REAL_LONDON_BETA_KNOWN_LIMITATIONS],
    betaCopy:
      "Real London practice is a limited beta using committed local OSM fixture data. Try the pilot exercises, then share feedback from the practice screen.",
    ctaLabel: "Start Real London beta practice",
    isDefaultExperience: false
  };
}
