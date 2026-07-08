import {
  REAL_LONDON_BETA_DEFAULT_MAP_ID,
  REAL_LONDON_BETA_MAP_OPTIONS,
  REAL_LONDON_BETA_PRACTICE_PATH
} from "../real-london/realLondonBetaPracticeScreen.ts";
import {
  REAL_LONDON_BETA_ENV_FLAG,
  isRealLondonBetaAccessEnabled,
  type RealLondonBetaAccessEnv
} from "../../dev/route-runner/routeRunnerBetaPracticeAccess.ts";
import type { RouteRunnerMapOption } from "../../dev/route-runner/routeRunnerMapOptionUtils.ts";
import { LEARNER_TRAINING_MODE_LABEL } from "../../dev/route-runner/learnerTrainingModeUi.ts";

export const LEARNER_TRAINING_PRACTICE_PATH = "/practice/training";
export const LEARNER_TRAINING_PRACTICE_TITLE = "Learner Training";
export const LEARNER_TRAINING_PRACTICE_CARD_TITLE = "Training Mode";
export const LEARNER_TRAINING_PRACTICE_CARD_CTA = "Open Training Mode";
export const LEARNER_TRAINING_PRACTICE_STANDARD_MESSAGE =
  "Training Mode opens with the standard Marlowe practice map. Real London beta routes appear when the beta flag is enabled.";
export const LEARNER_TRAINING_PRACTICE_BETA_MESSAGE =
  "Training Mode includes the beta-safe Real London practice catalogue while the beta flag is enabled.";

export type LearnerTrainingPracticeEntryModel = {
  visible: true;
  title: typeof LEARNER_TRAINING_PRACTICE_CARD_TITLE;
  label: typeof LEARNER_TRAINING_MODE_LABEL;
  href: typeof LEARNER_TRAINING_PRACTICE_PATH;
  ctaLabel: typeof LEARNER_TRAINING_PRACTICE_CARD_CTA;
  betaFlagName: typeof REAL_LONDON_BETA_ENV_FLAG;
  betaStatus: "enabled" | "disabled";
  betaMessage: string;
  realLondonBetaHref: typeof REAL_LONDON_BETA_PRACTICE_PATH | null;
};

export type LearnerTrainingPracticePageModel = {
  path: typeof LEARNER_TRAINING_PRACTICE_PATH;
  title: typeof LEARNER_TRAINING_PRACTICE_TITLE;
  routeRunnerMode: "student-beta";
  initialMapOptionId: typeof REAL_LONDON_BETA_DEFAULT_MAP_ID;
  mapOptions: RouteRunnerMapOption[];
  betaFlagName: typeof REAL_LONDON_BETA_ENV_FLAG;
  betaStatus: LearnerTrainingPracticeEntryModel["betaStatus"];
  usesExistingRouteRunnerClient: true;
  keepsDevRouteAvailable: true;
  dedicatedTrainingPage: true;
  routeRunnerTrainingModeOnly: true;
  trainingModeDefaultOpen: true;
  realLondonPracticeKeepsTrainingLinkOnly: true;
  trainingSurface: {
    label: typeof LEARNER_TRAINING_MODE_LABEL;
    difficultySelectorLabel: "Difficulty";
    exerciseTypeSelectorLabel: "Exercise type";
    generateActionLabel: "Generate exercise";
    hintActionLabel: "Get hint";
    reviewActionLabel: "Complete and review";
    mapPanDefault: true;
  };
  mobile: {
    entryPointMinTouchTargetPx: 44;
    routeRunnerMode: "student-beta";
    keepsSiteHeaderNonStickyOnPhone: true;
    avoidsMapStretching: true;
  };
};

export function buildLearnerTrainingPracticeEntryModel(input: {
  betaEnabled?: boolean;
  env?: RealLondonBetaAccessEnv;
} = {}): LearnerTrainingPracticeEntryModel {
  const betaEnabled = input.betaEnabled ?? isRealLondonBetaAccessEnabled(input.env);

  return {
    visible: true,
    title: LEARNER_TRAINING_PRACTICE_CARD_TITLE,
    label: LEARNER_TRAINING_MODE_LABEL,
    href: LEARNER_TRAINING_PRACTICE_PATH,
    ctaLabel: LEARNER_TRAINING_PRACTICE_CARD_CTA,
    betaFlagName: REAL_LONDON_BETA_ENV_FLAG,
    betaStatus: betaEnabled ? "enabled" : "disabled",
    betaMessage: betaEnabled ? LEARNER_TRAINING_PRACTICE_BETA_MESSAGE : LEARNER_TRAINING_PRACTICE_STANDARD_MESSAGE,
    realLondonBetaHref: betaEnabled ? REAL_LONDON_BETA_PRACTICE_PATH : null
  };
}

function standardTrainingMapOptions(): RouteRunnerMapOption[] {
  return REAL_LONDON_BETA_MAP_OPTIONS.filter((option) => option.map.id === REAL_LONDON_BETA_DEFAULT_MAP_ID);
}

export function buildLearnerTrainingPracticePageModel(input: {
  betaEnabled?: boolean;
  env?: RealLondonBetaAccessEnv;
} = {}): LearnerTrainingPracticePageModel {
  const betaEnabled = input.betaEnabled ?? isRealLondonBetaAccessEnabled(input.env);
  const mapOptions = betaEnabled ? [...REAL_LONDON_BETA_MAP_OPTIONS] : standardTrainingMapOptions();

  return {
    path: LEARNER_TRAINING_PRACTICE_PATH,
    title: LEARNER_TRAINING_PRACTICE_TITLE,
    routeRunnerMode: "student-beta",
    initialMapOptionId: REAL_LONDON_BETA_DEFAULT_MAP_ID,
    mapOptions,
    betaFlagName: REAL_LONDON_BETA_ENV_FLAG,
    betaStatus: betaEnabled ? "enabled" : "disabled",
    usesExistingRouteRunnerClient: true,
    keepsDevRouteAvailable: true,
    dedicatedTrainingPage: true,
    routeRunnerTrainingModeOnly: true,
    trainingModeDefaultOpen: true,
    realLondonPracticeKeepsTrainingLinkOnly: true,
    trainingSurface: {
      label: LEARNER_TRAINING_MODE_LABEL,
      difficultySelectorLabel: "Difficulty",
      exerciseTypeSelectorLabel: "Exercise type",
      generateActionLabel: "Generate exercise",
      hintActionLabel: "Get hint",
      reviewActionLabel: "Complete and review",
      mapPanDefault: true
    },
    mobile: {
      entryPointMinTouchTargetPx: 44,
      routeRunnerMode: "student-beta",
      keepsSiteHeaderNonStickyOnPhone: true,
      avoidsMapStretching: true
    }
  };
}
