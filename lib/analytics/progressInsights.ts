import {
  mistakeReviewKey,
  type MistakeReviewType
} from "./mistakeReview.ts";
import {
  normalizeMockAttempts,
  normalizePracticeAttempts,
  type NormalizedMockAttempt,
  type NormalizedPracticeAttempt
} from "../db/progressMigration.ts";

export type ProgressInsightQuestionType = "knowledge" | "map-click" | "route";

export type ProgressTrendDirection =
  | "improving"
  | "declining"
  | "stable"
  | "insufficient-data";

export type ProgressTrendPoint = {
  attemptId: string;
  date: string;
  score: number;
  source: "practice" | "mock";
  questionType?: ProgressInsightQuestionType;
};

export type ProgressTypeBreakdown = {
  type: ProgressInsightQuestionType;
  label: string;
  attempts: number;
  averageScore: number | null;
  failedAttempts: number;
};

export type ProgressMistakeSummary = {
  totalMistakes: number;
  uniqueMistakes: number;
  unreviewedMistakes: number;
  mostRepeatedMistake: {
    questionId: string;
    type: MistakeReviewType;
    missedCount: number;
  } | null;
};

export type ProgressInsights = {
  totalAttempts: number;
  totalPracticeAttempts: number;
  totalMockAttempts: number;
  averageScore: number | null;
  bestScore: number | null;
  latestScore: number | null;
  mockPassRate: number | null;
  typeBreakdown: ProgressTypeBreakdown[];
  weakestType: ProgressTypeBreakdown | null;
  strongestType: ProgressTypeBreakdown | null;
  recentActivityCount: number;
  trendPoints: ProgressTrendPoint[];
  trendDirection: ProgressTrendDirection;
  studyRecommendation: string;
  mistakeSummary: ProgressMistakeSummary;
};

type ScoreBucket = Record<ProgressInsightQuestionType, number[]>;
type FailureBucket = Record<ProgressInsightQuestionType, number>;

const typeLabels: Record<ProgressInsightQuestionType, string> = {
  knowledge: "Knowledge",
  "map-click": "Map-click",
  route: "Route"
};

function normalizeType(value: string): ProgressInsightQuestionType {
  return value === "route-drawing" || value === "route"
    ? "route"
    : value === "map-click"
      ? "map-click"
      : "knowledge";
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(
    values.reduce((total, value) => total + value, 0) / values.length
  );
}

function isFailed(passed: boolean | null, percentage: number | null) {
  if (typeof passed === "boolean") return !passed;
  return typeof percentage === "number" ? percentage < 70 : true;
}

function attemptDate(attempt: NormalizedPracticeAttempt | NormalizedMockAttempt) {
  return attempt.source === "mock-test" ? attempt.submittedAt : attempt.createdAt;
}

function getScoredAttempts(
  practiceAttempts: NormalizedPracticeAttempt[],
  mockAttempts: NormalizedMockAttempt[]
) {
  return [...practiceAttempts, ...mockAttempts]
    .filter((attempt) => typeof attempt.percentage === "number")
    .sort((a, b) => attemptDate(a).localeCompare(attemptDate(b)));
}

function getTypeBreakdown(
  practiceAttempts: NormalizedPracticeAttempt[],
  mockAttempts: NormalizedMockAttempt[]
): ProgressTypeBreakdown[] {
  const scores: ScoreBucket = {
    knowledge: [],
    "map-click": [],
    route: []
  };
  const failures: FailureBucket = {
    knowledge: 0,
    "map-click": 0,
    route: 0
  };

  practiceAttempts.forEach((attempt) => {
    if (typeof attempt.percentage !== "number") return;
    const type = normalizeType(attempt.questionType);
    scores[type].push(attempt.percentage);
    if (isFailed(attempt.passed, attempt.percentage)) failures[type] += 1;
  });

  mockAttempts.forEach((attempt) => {
    attempt.questionResults.forEach((result) => {
      const type = normalizeType(result.type);
      scores[type].push(result.percentage);
      if (!result.passed) failures[type] += 1;
    });
  });

  return (Object.keys(scores) as ProgressInsightQuestionType[]).map((type) => ({
    type,
    label: typeLabels[type],
    attempts: scores[type].length,
    averageScore: average(scores[type]),
    failedAttempts: failures[type]
  }));
}

function getWeakestType(breakdown: ProgressTypeBreakdown[]) {
  return (
    breakdown
      .filter((item) => typeof item.averageScore === "number")
      .sort((a, b) => (a.averageScore ?? 0) - (b.averageScore ?? 0))[0] ?? null
  );
}

function getStrongestType(breakdown: ProgressTypeBreakdown[]) {
  return (
    breakdown
      .filter((item) => typeof item.averageScore === "number")
      .sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0))[0] ?? null
  );
}

function getTrendDirection(points: ProgressTrendPoint[]): ProgressTrendDirection {
  if (points.length < 2) return "insufficient-data";

  const recent = points.slice(-5);
  const first = recent[0].score;
  const last = recent.at(-1)?.score ?? first;
  const delta = last - first;

  if (delta > 3) return "improving";
  if (delta < -3) return "declining";
  return "stable";
}

function getRecentActivityCount(points: ProgressTrendPoint[], referenceDate: Date) {
  const referenceTime = referenceDate.getTime();

  return points.filter((point) => {
    const date = new Date(point.date);
    if (Number.isNaN(date.getTime())) return false;
    return referenceTime - date.getTime() <= 7 * 86_400_000;
  }).length;
}

function getMistakeSummary(
  practiceAttempts: NormalizedPracticeAttempt[],
  mockAttempts: NormalizedMockAttempt[],
  reviewedMistakeKeys: string[]
): ProgressMistakeSummary {
  const reviewed = new Set(reviewedMistakeKeys);
  const grouped = new Map<
    string,
    {
      questionId: string;
      type: MistakeReviewType;
      missedCount: number;
    }
  >();

  function addMistake(type: MistakeReviewType, questionId: string) {
    const key = mistakeReviewKey(type, questionId);
    const existing = grouped.get(key);
    grouped.set(key, {
      questionId,
      type,
      missedCount: (existing?.missedCount ?? 0) + 1
    });
  }

  practiceAttempts.forEach((attempt) => {
    if (!isFailed(attempt.passed, attempt.percentage)) return;
    addMistake(normalizeType(attempt.questionType), attempt.questionId);
  });

  mockAttempts.forEach((attempt) => {
    attempt.questionResults.forEach((result) => {
      if (!result.passed) addMistake(normalizeType(result.type), result.questionId);
    });
  });

  const mistakes = [...grouped.entries()];
  const mostRepeatedMistake =
    mistakes
      .map(([, value]) => value)
      .sort((a, b) => b.missedCount - a.missedCount)[0] ?? null;

  return {
    totalMistakes: mistakes.reduce(
      (total, [, mistake]) => total + mistake.missedCount,
      0
    ),
    uniqueMistakes: mistakes.length,
    unreviewedMistakes: mistakes.filter(([key]) => !reviewed.has(key)).length,
    mostRepeatedMistake
  };
}

function getStudyRecommendation({
  totalAttempts,
  totalMockAttempts,
  mockPassRate,
  weakestType,
  trendDirection,
  mistakeSummary
}: Pick<
  ProgressInsights,
  | "totalAttempts"
  | "totalMockAttempts"
  | "mockPassRate"
  | "weakestType"
  | "trendDirection"
  | "mistakeSummary"
>) {
  if (totalAttempts === 0) {
    return "Start with a few short practice sessions so TopoPass can build a useful progress picture.";
  }

  if (mistakeSummary.unreviewedMistakes > 0) {
    return `Review ${mistakeSummary.unreviewedMistakes} unreviewed mistake${mistakeSummary.unreviewedMistakes === 1 ? "" : "s"} before starting a full mock exam.`;
  }

  if (weakestType && (weakestType.averageScore ?? 100) < 70) {
    return `${weakestType.label} questions are currently your weakest area. Prioritise targeted practice there next.`;
  }

  if (totalMockAttempts > 0 && typeof mockPassRate === "number" && mockPassRate < 70) {
    return "Mock exam pass rate is below target. Use targeted practice before another timed attempt.";
  }

  if (trendDirection === "improving") {
    return "Recent scores are improving. Keep the same study rhythm and add a mixed mock when ready.";
  }

  if (trendDirection === "declining") {
    return "Recent scores are dipping. Review mistakes first, then return to focused practice.";
  }

  return "Keep a balanced mix of knowledge, map-click, and route practice to maintain progress.";
}

export function getProgressInsights({
  practiceAttempts = [],
  mockAttempts = [],
  reviewedMistakeKeys = [],
  referenceDate = new Date()
}: {
  practiceAttempts?: unknown[];
  mockAttempts?: unknown[];
  reviewedMistakeKeys?: string[];
  referenceDate?: Date;
} = {}): ProgressInsights {
  const normalizedPracticeAttempts = normalizePracticeAttempts(practiceAttempts);
  const normalizedMockAttempts = normalizeMockAttempts(mockAttempts);
  const scoredAttempts = getScoredAttempts(
    normalizedPracticeAttempts,
    normalizedMockAttempts
  );
  const scoredPercentages = scoredAttempts
    .map((attempt) => attempt.percentage)
    .filter((value): value is number => typeof value === "number");
  const mockPassRate =
    normalizedMockAttempts.length === 0
      ? null
      : Math.round(
          (normalizedMockAttempts.filter((attempt) => attempt.passed).length /
            normalizedMockAttempts.length) *
            100
        );
  const typeBreakdown = getTypeBreakdown(
    normalizedPracticeAttempts,
    normalizedMockAttempts
  );
  const trendPoints: ProgressTrendPoint[] = scoredAttempts.map((attempt) => ({
    attemptId: attempt.id,
    date: attemptDate(attempt),
    score: attempt.percentage ?? 0,
    source: attempt.source === "mock-test" ? "mock" : "practice",
    questionType:
      attempt.source === "practice" ? normalizeType(attempt.questionType) : undefined
  }));
  const trendDirection = getTrendDirection(trendPoints);
  const weakestType = getWeakestType(typeBreakdown);
  const strongestType = getStrongestType(typeBreakdown);
  const mistakeSummary = getMistakeSummary(
    normalizedPracticeAttempts,
    normalizedMockAttempts,
    reviewedMistakeKeys
  );
  const insights: Omit<ProgressInsights, "studyRecommendation"> = {
    totalAttempts:
      normalizedPracticeAttempts.length + normalizedMockAttempts.length,
    totalPracticeAttempts: normalizedPracticeAttempts.length,
    totalMockAttempts: normalizedMockAttempts.length,
    averageScore: average(scoredPercentages),
    bestScore:
      scoredPercentages.length === 0 ? null : Math.max(...scoredPercentages),
    latestScore: scoredPercentages.at(-1) ?? null,
    mockPassRate,
    typeBreakdown,
    weakestType,
    strongestType,
    recentActivityCount: getRecentActivityCount(trendPoints, referenceDate),
    trendPoints,
    trendDirection,
    mistakeSummary
  };

  return {
    ...insights,
    studyRecommendation: getStudyRecommendation(insights)
  };
}
