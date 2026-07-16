import {
  REAL_LONDON_BETA_DEFAULT_MAP_ID,
  REAL_LONDON_BETA_MAP_OPTIONS
} from "../real-london/realLondonBetaPracticeScreen.ts";
import { routeRunnerMapOptionIsScoreable } from "../../dev/route-runner/routeRunnerBetaPracticeAccess.ts";
import type { RouteRunnerMapOption } from "../../dev/route-runner/routeRunnerMapOptionUtils.ts";
import {
  EXAM_ROUTE_PACK_STAGE,
  buildExamRoutePackMapOptions,
  listExamRouteTasks,
  type ExamRouteTag
} from "./examRoutePack.ts";
import { EXAM_PROGRESS_SCHEMA_VERSION } from "./examProgressTracking.ts";

export const EXAM_MODE_PRACTICE_PATH = "/practice/exam-mode";
export const EXAM_MODE_PRACTICE_TITLE = "Exam Mode";
export const EXAM_MODE_PRACTICE_CARD_TITLE = "Timed Exam Mode";
export const EXAM_MODE_PRACTICE_CARD_CTA = "Start Exam Mode";

export type ExamModePracticePageModel = {
  path: typeof EXAM_MODE_PRACTICE_PATH;
  title: typeof EXAM_MODE_PRACTICE_TITLE;
  routeRunnerMode: "student-exam";
  initialMapOptionId: string;
  initialExerciseId: string | undefined;
  mapOptions: RouteRunnerMapOption[];
  usesExistingRouteRunnerClient: true;
  usesExistingRouteFixturesOnly: true;
  suppressesHintsDuringAttempt: true;
  locksAttemptAfterSubmission: true;
  reviewVisibleOnlyAfterSubmission: true;
  scoring: {
    runsOnlyAfterSubmission: true;
    deterministic: true;
    officialTfLScore: false;
    categoryIds: readonly [
      "legality",
      "destination-completion",
      "route-efficiency",
      "detour-backtracking",
      "road-suitability",
      "avoidable-mistakes"
    ];
  };
  review: {
    visibleOnlyAfterSubmission: true;
    includesOverallResult: true;
    includesCategoryExplanations: true;
    includesGroundedStrengthsAndImprovements: true;
    reportsAssessmentLimits: true;
    keepsSubmittedRouteLocked: true;
  };
  routePack: {
    stage: typeof EXAM_ROUTE_PACK_STAGE;
    taskCount: number;
    taskIds: string[];
    tags: ExamRouteTag[];
    usesExistingFixtureStopsOnly: true;
    leavesPracticeCatalogueUnchanged: true;
  };
  progress: {
    schemaVersion: typeof EXAM_PROGRESS_SCHEMA_VERSION;
    recordsSubmittedExamAttemptsOnly: true;
    persistence: "local-storage";
    includesScoringCategories: true;
    includesRouteTags: true;
    fullReadinessDashboard: false;
  };
  timer: {
    type: "elapsed";
    usesExistingExamTimeFormatter: true;
  };
  learnerRules: {
    modeSeparateFromPractice: true;
    routeEditingBeforeSubmit: true;
    routeEditingAfterSubmit: false;
    panZoomRemainAvailable: true;
    turnByTurnGuidance: false;
  };
  mobile: {
    routeRunnerMode: "student-exam";
    avoidsHorizontalOverflow: true;
    keepsTouchControlsAvailable: true;
  };
};

export type ExamModePracticeEntryModel = {
  visible: true;
  title: typeof EXAM_MODE_PRACTICE_CARD_TITLE;
  href: typeof EXAM_MODE_PRACTICE_PATH;
  ctaLabel: typeof EXAM_MODE_PRACTICE_CARD_CTA;
  message: string;
};

function examModeMapOptions(): RouteRunnerMapOption[] {
  return buildExamRoutePackMapOptions(REAL_LONDON_BETA_MAP_OPTIONS).filter(
    (option) => routeRunnerMapOptionIsScoreable(option) && option.exercises.length > 0
  );
}

export function buildExamModePracticeEntryModel(): ExamModePracticeEntryModel {
  return {
    visible: true,
    title: EXAM_MODE_PRACTICE_CARD_TITLE,
    href: EXAM_MODE_PRACTICE_PATH,
    ctaLabel: EXAM_MODE_PRACTICE_CARD_CTA,
    message: "Practise route planning against the atlas map with no hints during the active attempt."
  };
}

export function buildExamModePracticePageModel(): ExamModePracticePageModel {
  const mapOptions = examModeMapOptions();
  const routeTasks = listExamRouteTasks(mapOptions);
  const routeTags = [...new Set(routeTasks.flatMap((task) => task.examRouteMetadata.tags))];
  const defaultMapOption =
    mapOptions.find((option) => option.map.id === REAL_LONDON_BETA_DEFAULT_MAP_ID) ?? mapOptions[0];

  if (!defaultMapOption) {
    throw new Error("Exam Mode requires at least one existing scoreable route fixture.");
  }

  return {
    path: EXAM_MODE_PRACTICE_PATH,
    title: EXAM_MODE_PRACTICE_TITLE,
    routeRunnerMode: "student-exam",
    initialMapOptionId: defaultMapOption.map.id,
    initialExerciseId: defaultMapOption.defaultExerciseId || defaultMapOption.exercises[0]?.id,
    mapOptions,
    usesExistingRouteRunnerClient: true,
    usesExistingRouteFixturesOnly: true,
    suppressesHintsDuringAttempt: true,
    locksAttemptAfterSubmission: true,
    reviewVisibleOnlyAfterSubmission: true,
    scoring: {
      runsOnlyAfterSubmission: true,
      deterministic: true,
      officialTfLScore: false,
      categoryIds: [
        "legality",
        "destination-completion",
        "route-efficiency",
        "detour-backtracking",
        "road-suitability",
        "avoidable-mistakes"
      ]
    },
    review: {
      visibleOnlyAfterSubmission: true,
      includesOverallResult: true,
      includesCategoryExplanations: true,
      includesGroundedStrengthsAndImprovements: true,
      reportsAssessmentLimits: true,
      keepsSubmittedRouteLocked: true
    },
    routePack: {
      stage: EXAM_ROUTE_PACK_STAGE,
      taskCount: routeTasks.length,
      taskIds: routeTasks.map((task) => task.id),
      tags: routeTags,
      usesExistingFixtureStopsOnly: true,
      leavesPracticeCatalogueUnchanged: true
    },
    progress: {
      schemaVersion: EXAM_PROGRESS_SCHEMA_VERSION,
      recordsSubmittedExamAttemptsOnly: true,
      persistence: "local-storage",
      includesScoringCategories: true,
      includesRouteTags: true,
      fullReadinessDashboard: false
    },
    timer: {
      type: "elapsed",
      usesExistingExamTimeFormatter: true
    },
    learnerRules: {
      modeSeparateFromPractice: true,
      routeEditingBeforeSubmit: true,
      routeEditingAfterSubmit: false,
      panZoomRemainAvailable: true,
      turnByTurnGuidance: false
    },
    mobile: {
      routeRunnerMode: "student-exam",
      avoidsHorizontalOverflow: true,
      keepsTouchControlsAvailable: true
    }
  };
}
