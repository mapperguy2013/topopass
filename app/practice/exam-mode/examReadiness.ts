import {
  EXAM_SCORING_PASS_THRESHOLD_PERCENT,
  type ExamScoringCategoryId
} from "./examScoringRubric.ts";
import { EXAM_ROUTE_TAGS, type ExamRouteTag } from "./examRoutePack.ts";
import {
  buildExamProgressSummary,
  normaliseExamProgressState,
  type ExamProgressAttemptRecord,
  type ExamProgressState,
  type ExamProgressWeakCategory
} from "./examProgressTracking.ts";

export const EXAM_READINESS_MIN_ATTEMPTS = 3;
export const EXAM_READINESS_MIN_DISTINCT_TASKS = 2;
export const EXAM_READINESS_MIN_DISTINCT_TAGS = 3;
export const EXAM_READINESS_READY_SCORE_PERCENT = EXAM_SCORING_PASS_THRESHOLD_PERCENT;
export const EXAM_READINESS_NEARLY_SCORE_PERCENT = 70;
export const EXAM_READINESS_DISCLAIMER =
  "This TOPOPASS practice signal uses only saved exam attempts. It is not an official TfL assessment or certification.";

export type ExamReadinessStatusId =
  | "ready-for-harder-practice"
  | "nearly-ready"
  | "needs-more-practice"
  | "not-enough-attempts";

export type ExamReadinessDataState =
  | "empty"
  | "low-attempts"
  | "low-variety"
  | "sufficient";

export type ExamReadinessTagCoverage = {
  tag: ExamRouteTag;
  attemptCount: number;
  needsPracticeAttemptCount: number;
  recentNeedsPracticeAttemptCount: number;
  covered: boolean;
};

export type ExamReadinessStatus = {
  id: ExamReadinessStatusId;
  label:
    | "Ready for harder practice"
    | "Nearly ready"
    | "Needs more practice"
    | "Not enough attempts yet";
  summary: string;
};

export type ExamReadinessSummary = {
  status: ExamReadinessStatus;
  dataState: ExamReadinessDataState;
  officialTfLReadiness: false;
  disclaimer: typeof EXAM_READINESS_DISCLAIMER;
  totalCompletedAttempts: number;
  recentAttemptCount: number;
  distinctTaskCount: number;
  coveredTagCount: number;
  availableTagCount: number;
  latestScorePercent: number | null;
  bestScorePercent: number | null;
  averageScorePercent: number | null;
  recentAverageScorePercent: number | null;
  recentPassRatePercent: number | null;
  trend: ReturnType<typeof buildExamProgressSummary>["trend"];
  repeatedWeakCategories: ExamProgressWeakCategory[];
  tagCoverage: ExamReadinessTagCoverage[];
  tagsNeedingMoreEvidence: ExamReadinessTagCoverage[];
  lowDataReasons: string[];
  nextAction: string;
};

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function average(values: readonly number[]): number | null {
  return values.length > 0
    ? roundToOneDecimal(values.reduce((total, value) => total + value, 0) / values.length)
    : null;
}

function buildRecentWeakCategories(
  attempts: readonly ExamProgressAttemptRecord[]
): ExamProgressWeakCategory[] {
  const categories = new Map<ExamScoringCategoryId, ExamProgressWeakCategory>();

  for (const attempt of attempts) {
    for (const category of attempt.categories) {
      if (category.outcome !== "needs-practice") {
        continue;
      }

      const current = categories.get(category.id);
      categories.set(category.id, {
        id: category.id,
        label: category.label,
        needsPracticeCount: (current?.needsPracticeCount ?? 0) + 1,
        latestSummary: current?.latestSummary ?? category.summary
      });
    }
  }

  return [...categories.values()]
    .filter((category) => category.needsPracticeCount >= 2)
    .sort(
      (left, right) =>
        right.needsPracticeCount - left.needsPracticeCount || left.label.localeCompare(right.label)
    );
}

function buildTagCoverage(
  attempts: readonly ExamProgressAttemptRecord[],
  recentAttempts: readonly ExamProgressAttemptRecord[]
): ExamReadinessTagCoverage[] {
  return EXAM_ROUTE_TAGS.map((tag) => {
    const taggedAttempts = attempts.filter((attempt) => attempt.routeTags.includes(tag));
    const needsPracticeAttemptCount = taggedAttempts.filter(
      (attempt) => attempt.status === "needs-practice"
    ).length;
    const recentNeedsPracticeAttemptCount = recentAttempts.filter(
      (attempt) => attempt.status === "needs-practice" && attempt.routeTags.includes(tag)
    ).length;

    return {
      tag,
      attemptCount: taggedAttempts.length,
      needsPracticeAttemptCount,
      recentNeedsPracticeAttemptCount,
      covered: taggedAttempts.length > 0
    };
  });
}

function buildLowDataReasons(input: {
  attemptCount: number;
  distinctTaskCount: number;
  coveredTagCount: number;
}): string[] {
  const reasons: string[] = [];

  if (input.attemptCount === 0) {
    return ["No completed exam attempts are stored in this browser yet."];
  }

  if (input.attemptCount < EXAM_READINESS_MIN_ATTEMPTS) {
    reasons.push(
      `Complete ${EXAM_READINESS_MIN_ATTEMPTS - input.attemptCount} more exam attempt${
        EXAM_READINESS_MIN_ATTEMPTS - input.attemptCount === 1 ? "" : "s"
      } before treating the pattern as stable.`
    );
  }

  if (input.distinctTaskCount < EXAM_READINESS_MIN_DISTINCT_TASKS) {
    reasons.push(
      `Use at least ${EXAM_READINESS_MIN_DISTINCT_TASKS} different route tasks to add route variety.`
    );
  }

  if (input.coveredTagCount < EXAM_READINESS_MIN_DISTINCT_TAGS) {
    reasons.push(
      `Build evidence across at least ${EXAM_READINESS_MIN_DISTINCT_TAGS} route tags; ${input.coveredTagCount} ${
        input.coveredTagCount === 1 ? "is" : "are"
      } currently covered.`
    );
  }

  return reasons;
}

function dataState(input: {
  attemptCount: number;
  distinctTaskCount: number;
  coveredTagCount: number;
}): ExamReadinessDataState {
  if (input.attemptCount === 0) {
    return "empty";
  }

  if (input.attemptCount < EXAM_READINESS_MIN_ATTEMPTS) {
    return "low-attempts";
  }

  if (
    input.distinctTaskCount < EXAM_READINESS_MIN_DISTINCT_TASKS ||
    input.coveredTagCount < EXAM_READINESS_MIN_DISTINCT_TAGS
  ) {
    return "low-variety";
  }

  return "sufficient";
}

function readinessStatus(input: {
  enoughData: boolean;
  latestAttempt: ExamProgressAttemptRecord | null;
  latestScorePercent: number | null;
  recentAverageScorePercent: number | null;
  recentPassRatePercent: number | null;
  trend: ReturnType<typeof buildExamProgressSummary>["trend"];
  repeatedWeakCategories: readonly ExamProgressWeakCategory[];
}): ExamReadinessStatus {
  if (!input.enoughData) {
    return {
      id: "not-enough-attempts",
      label: "Not enough attempts yet",
      summary: "More varied completed exam attempts are needed before TOPOPASS can show a stable practice signal."
    };
  }

  const isReadyForHarderPractice =
    input.latestAttempt?.status === "pass" &&
    input.latestScorePercent !== null &&
    input.latestScorePercent >= EXAM_READINESS_READY_SCORE_PERCENT &&
    input.recentAverageScorePercent !== null &&
    input.recentAverageScorePercent >= EXAM_READINESS_READY_SCORE_PERCENT &&
    input.recentPassRatePercent !== null &&
    input.recentPassRatePercent >= 60 &&
    input.trend.direction !== "declining" &&
    input.repeatedWeakCategories.length === 0;

  if (isReadyForHarderPractice) {
    return {
      id: "ready-for-harder-practice",
      label: "Ready for harder practice",
      summary: "Recent stored attempts meet the current TOPOPASS consistency checks for moving to harder or less familiar practice routes."
    };
  }

  const isNearlyReady =
    input.latestScorePercent !== null &&
    input.latestScorePercent >= EXAM_READINESS_NEARLY_SCORE_PERCENT &&
    input.recentAverageScorePercent !== null &&
    input.recentAverageScorePercent >= EXAM_READINESS_NEARLY_SCORE_PERCENT &&
    input.recentPassRatePercent !== null &&
    input.recentPassRatePercent >= 40 &&
    input.repeatedWeakCategories.length <= 1;

  if (isNearlyReady) {
    return {
      id: "nearly-ready",
      label: "Nearly ready",
      summary: "Recent performance is close to the harder-practice checks, but consistency or an evidence-backed weak area still needs attention."
    };
  }

  return {
    id: "needs-more-practice",
    label: "Needs more practice",
    summary: "Recent stored attempts do not yet meet the current TOPOPASS consistency checks for harder practice."
  };
}

function nextAction(input: {
  dataState: ExamReadinessDataState;
  attemptCount: number;
  distinctTaskCount: number;
  coveredTagCount: number;
  repeatedWeakCategories: readonly ExamProgressWeakCategory[];
  tagsNeedingMoreEvidence: readonly ExamReadinessTagCoverage[];
  status: ExamReadinessStatus;
  trend: ReturnType<typeof buildExamProgressSummary>["trend"];
}): string {
  if (input.dataState === "empty") {
    return "Complete and submit a timed Exam Mode route to start building this dashboard.";
  }

  if (input.attemptCount < EXAM_READINESS_MIN_ATTEMPTS) {
    return "Complete another timed route without hints, then return to compare the stored result.";
  }

  if (input.distinctTaskCount < EXAM_READINESS_MIN_DISTINCT_TASKS) {
    return "Choose a different exam route task next so the signal is not based on one repeated route.";
  }

  if (input.coveredTagCount < EXAM_READINESS_MIN_DISTINCT_TAGS) {
    return "Choose a task with different route tags to widen the evidence behind this signal.";
  }

  const weakCategory = input.repeatedWeakCategories[0];

  if (weakCategory) {
    return `Focus the next attempt on ${weakCategory.label.toLowerCase()}; it was marked needs practice on ${weakCategory.needsPracticeCount} recent attempts.`;
  }

  const focusTag = input.tagsNeedingMoreEvidence[0];

  if (focusTag) {
    return `Try another ${focusTag.tag.replaceAll("-", " ")} task to gather more evidence; that tag appears on recent attempts that needed practice.`;
  }

  if (input.trend.direction === "declining") {
    return "Complete another varied route and compare it with the latest attempt before increasing difficulty.";
  }

  if (input.status.id === "ready-for-harder-practice") {
    return "Choose a harder or less familiar exam task while keeping the attempt independent and hint-free.";
  }

  return "Complete another varied exam task to strengthen the recent performance pattern.";
}

export function buildExamReadinessSummary(progress: ExamProgressState): ExamReadinessSummary {
  const normalisedProgress = normaliseExamProgressState(progress);
  const progressSummary = buildExamProgressSummary(normalisedProgress);
  const attempts = normalisedProgress.attempts;
  const recentAttempts = progressSummary.recentAttempts;
  const distinctTaskCount = new Set(attempts.map((attempt) => attempt.taskId)).size;
  const tagCoverage = buildTagCoverage(attempts, recentAttempts);
  const coveredTagCount = tagCoverage.filter((tag) => tag.covered).length;
  const repeatedWeakCategories = buildRecentWeakCategories(recentAttempts);
  const recentAverageScorePercent = average(recentAttempts.map((attempt) => attempt.scorePercent));
  const recentPassRatePercent = recentAttempts.length > 0
    ? roundToOneDecimal(
        (recentAttempts.filter((attempt) => attempt.status === "pass").length / recentAttempts.length) * 100
      )
    : null;
  const lowDataInput = {
    attemptCount: attempts.length,
    distinctTaskCount,
    coveredTagCount
  };
  const resolvedDataState = dataState(lowDataInput);
  const status = readinessStatus({
    enoughData: resolvedDataState === "sufficient",
    latestAttempt: progressSummary.latestAttempt,
    latestScorePercent: progressSummary.latestScorePercent,
    recentAverageScorePercent,
    recentPassRatePercent,
    trend: progressSummary.trend,
    repeatedWeakCategories
  });
  const tagsNeedingMoreEvidence = tagCoverage
    .filter((tag) => tag.recentNeedsPracticeAttemptCount > 0)
    .sort(
      (left, right) =>
        right.recentNeedsPracticeAttemptCount - left.recentNeedsPracticeAttemptCount ||
        right.attemptCount - left.attemptCount ||
        left.tag.localeCompare(right.tag)
    );

  return {
    status,
    dataState: resolvedDataState,
    officialTfLReadiness: false,
    disclaimer: EXAM_READINESS_DISCLAIMER,
    totalCompletedAttempts: attempts.length,
    recentAttemptCount: recentAttempts.length,
    distinctTaskCount,
    coveredTagCount,
    availableTagCount: EXAM_ROUTE_TAGS.length,
    latestScorePercent: progressSummary.latestScorePercent,
    bestScorePercent: progressSummary.bestScorePercent,
    averageScorePercent: progressSummary.averageScorePercent,
    recentAverageScorePercent,
    recentPassRatePercent,
    trend: progressSummary.trend,
    repeatedWeakCategories,
    tagCoverage,
    tagsNeedingMoreEvidence,
    lowDataReasons: buildLowDataReasons(lowDataInput),
    nextAction: nextAction({
      dataState: resolvedDataState,
      attemptCount: attempts.length,
      distinctTaskCount,
      coveredTagCount,
      repeatedWeakCategories,
      tagsNeedingMoreEvidence,
      status,
      trend: progressSummary.trend
    })
  };
}
