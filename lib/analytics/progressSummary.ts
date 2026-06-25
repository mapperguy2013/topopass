import type {
  NormalizedMockAttempt,
  NormalizedMockQuestionResult,
  NormalizedPracticeAttempt
} from "../db/progressMigration.ts";

export type ProgressSummaryAttempt =
  | NormalizedPracticeAttempt
  | NormalizedMockAttempt;

export type ScoredProgressAttempt = {
  id: string;
  source: "practice" | "mock";
  date: string;
  percentage: number;
  passed: boolean;
  correct: number;
  wrong: number;
};

export type AccuracySummary = {
  totalAttempts: number;
  correct: number;
  wrong: number;
  totalQuestions: number;
  accuracyPercent: number;
};

export type RecentTrendStatus =
  | "improving"
  | "stable"
  | "declining"
  | "not-enough-data";

export type RecentTrendSummary = {
  status: RecentTrendStatus;
  label: string;
  description: string;
  olderAverage: number | null;
  newerAverage: number | null;
};

export type LatestPerformanceSummary = {
  latestScore: number;
  latestSource: "practice" | "mock";
  latestDate: string;
  bestScore: number;
  averageScore: number;
  recommendation: string;
};

export const PROGRESS_PASS_THRESHOLD_PERCENT = 60;

function attemptDate(attempt: ProgressSummaryAttempt) {
  return attempt.source === "mock-test" ? attempt.submittedAt : attempt.createdAt;
}

function isScoredPercentage(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function questionResultPassed(result: NormalizedMockQuestionResult) {
  return result.passed || result.percentage >= PROGRESS_PASS_THRESHOLD_PERCENT;
}

function practiceAttemptCorrect(attempt: NormalizedPracticeAttempt) {
  if (!isScoredPercentage(attempt.percentage)) return 0;
  const passed =
    attempt.passed ?? attempt.percentage >= PROGRESS_PASS_THRESHOLD_PERCENT;

  return passed ? 1 : 0;
}

function practiceAttemptWrong(attempt: NormalizedPracticeAttempt) {
  return isScoredPercentage(attempt.percentage)
    ? 1 - practiceAttemptCorrect(attempt)
    : 0;
}

function mockAttemptCorrect(attempt: NormalizedMockAttempt) {
  const scoredQuestionResults = attempt.questionResults.filter((result) =>
    isScoredPercentage(result.percentage)
  );

  if (scoredQuestionResults.length === 0) {
    const passed =
      attempt.passed ?? (attempt.percentage ?? 0) >= PROGRESS_PASS_THRESHOLD_PERCENT;

    return passed ? 1 : 0;
  }

  return scoredQuestionResults.filter(questionResultPassed).length;
}

function mockAttemptWrong(attempt: NormalizedMockAttempt) {
  const scoredQuestionResults = attempt.questionResults.filter((result) =>
    isScoredPercentage(result.percentage)
  );

  if (scoredQuestionResults.length === 0) {
    return 1 - mockAttemptCorrect(attempt);
  }

  return scoredQuestionResults.length - mockAttemptCorrect(attempt);
}

function toScoredProgressAttempt(
  attempt: ProgressSummaryAttempt
): ScoredProgressAttempt | null {
  if (!isScoredPercentage(attempt.percentage)) {
    return null;
  }

  return {
    id: attempt.id,
    source: attempt.source === "mock-test" ? "mock" : "practice",
    date: attemptDate(attempt),
    percentage: attempt.percentage,
    passed:
      attempt.passed ?? attempt.percentage >= PROGRESS_PASS_THRESHOLD_PERCENT,
    correct:
      attempt.source === "mock-test"
        ? mockAttemptCorrect(attempt)
        : practiceAttemptCorrect(attempt),
    wrong:
      attempt.source === "mock-test"
        ? mockAttemptWrong(attempt)
        : practiceAttemptWrong(attempt)
  };
}

function scoredAttemptsOldestFirst(attempts: ProgressSummaryAttempt[]) {
  return attempts
    .map(toScoredProgressAttempt)
    .filter((attempt): attempt is ScoredProgressAttempt => Boolean(attempt))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function averageScore(attempts: ScoredProgressAttempt[]) {
  if (attempts.length === 0) return null;

  return Math.round(
    attempts.reduce((total, attempt) => total + attempt.percentage, 0) /
      attempts.length
  );
}

export function getRecentScoredAttempts(
  attempts: ProgressSummaryAttempt[],
  limit = 9
) {
  return scoredAttemptsOldestFirst(attempts).slice(-limit);
}

function performanceRecommendation(
  latestScore: number,
  averageScore: number,
  latestSource: ScoredProgressAttempt["source"]
) {
  if (latestScore < PROGRESS_PASS_THRESHOLD_PERCENT) {
    return "Review recent mistakes before starting another full mock.";
  }

  if (averageScore < 70) {
    return "Focus on weaker topics with a short practice session next.";
  }

  if (latestSource === "mock" && latestScore >= 80) {
    return "Keep the momentum with targeted review before your next mock.";
  }

  if (latestScore >= 80 && averageScore >= 80) {
    return "Try an exam-style mock to check your readiness.";
  }

  return "Continue with mixed practice to build a steadier score.";
}

export function calculateLatestPerformanceSummary(
  attempts: ProgressSummaryAttempt[]
): LatestPerformanceSummary | null {
  const scoredAttempts = scoredAttemptsOldestFirst(attempts);

  if (scoredAttempts.length === 0) return null;

  const latestAttempt = scoredAttempts[scoredAttempts.length - 1];
  const bestScore = Math.max(
    ...scoredAttempts.map((attempt) => attempt.percentage)
  );
  const averageScoreValue = averageScore(scoredAttempts) ?? 0;

  return {
    latestScore: latestAttempt.percentage,
    latestSource: latestAttempt.source,
    latestDate: latestAttempt.date,
    bestScore,
    averageScore: averageScoreValue,
    recommendation: performanceRecommendation(
      latestAttempt.percentage,
      averageScoreValue,
      latestAttempt.source
    )
  };
}

export function calculateAccuracySummary(
  attempts: ProgressSummaryAttempt[]
): AccuracySummary {
  const scoredAttempts = scoredAttemptsOldestFirst(attempts);
  const correct = scoredAttempts.reduce(
    (total, attempt) => total + attempt.correct,
    0
  );
  const wrong = scoredAttempts.reduce(
    (total, attempt) => total + attempt.wrong,
    0
  );
  const totalQuestions = correct + wrong;

  return {
    totalAttempts: scoredAttempts.length,
    correct,
    wrong,
    totalQuestions,
    accuracyPercent:
      totalQuestions === 0 ? 0 : Math.round((correct / totalQuestions) * 100)
  };
}

export function calculateRecentTrend(
  attempts: ProgressSummaryAttempt[]
): RecentTrendSummary {
  const recentAttempts = getRecentScoredAttempts(attempts, 9);

  if (recentAttempts.length < 3) {
    return {
      status: "not-enough-data",
      label: "Not enough data",
      description: "Complete more scored attempts to see your recent trend.",
      olderAverage: null,
      newerAverage: null
    };
  }

  const halfSize = Math.floor(recentAttempts.length / 2);
  const olderAverage = averageScore(recentAttempts.slice(0, halfSize)) ?? 0;
  const newerAverage =
    averageScore(recentAttempts.slice(recentAttempts.length - halfSize)) ?? 0;
  const delta = newerAverage - olderAverage;

  if (delta >= 5) {
    return {
      status: "improving",
      label: "Improving",
      description: "Recent scores are improving.",
      olderAverage,
      newerAverage
    };
  }

  if (delta <= -5) {
    return {
      status: "declining",
      label: "Declining",
      description: "Recent scores are dipping.",
      olderAverage,
      newerAverage
    };
  }

  return {
    status: "stable",
    label: "Stable",
    description: "Recent scores are stable.",
    olderAverage,
    newerAverage
  };
}

export function getLongestStreak(attempts: ProgressSummaryAttempt[]) {
  let longest = 0;
  let running = 0;

  scoredAttemptsOldestFirst(attempts).forEach((attempt) => {
    if (attempt.percentage >= PROGRESS_PASS_THRESHOLD_PERCENT) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  });

  return longest;
}

export function getRecentActivityCount(
  attempts: ProgressSummaryAttempt[],
  days = 7,
  referenceDate = new Date()
) {
  const referenceTime = referenceDate.getTime();
  const windowMs = days * 86_400_000;

  return scoredAttemptsOldestFirst(attempts).filter((attempt) => {
    const date = new Date(attempt.date);
    if (Number.isNaN(date.getTime())) return false;

    const ageMs = referenceTime - date.getTime();
    return ageMs >= 0 && ageMs <= windowMs;
  }).length;
}
