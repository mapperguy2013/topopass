import {
  normalizeMockAttempts,
  normalizePracticeAttempts
} from "../db/progressMigration.ts";

export type ProgressPoint = {
  date: string;
  score: number;
};

export function getProgressTrend(
  practiceAttempts: unknown[],
  mockAttempts: unknown[]
): ProgressPoint[] {
  const practicePoints = normalizePracticeAttempts(practiceAttempts)
    .filter((attempt) => typeof attempt.percentage === "number")
    .map((attempt) => ({
      date: attempt.createdAt,
      score: attempt.percentage as number
    }));
  const mockPoints = normalizeMockAttempts(mockAttempts)
    .filter((attempt) => typeof attempt.percentage === "number")
    .map((attempt) => ({
      date: attempt.submittedAt,
      score: attempt.percentage as number
    }));

  return [...practicePoints, ...mockPoints].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

export function getRecentTrendSummary(
  practiceAttempts: unknown[],
  mockAttempts: unknown[]
) {
  const points = getProgressTrend(practiceAttempts, mockAttempts);
  if (points.length < 2) {
    return {
      direction: "not-enough-data" as const,
      message: "Complete more attempts to see a trend."
    };
  }

  const recent = points.slice(-5);
  const first = recent[0].score;
  const last = recent.at(-1)?.score ?? first;
  const delta = last - first;

  if (delta > 3) {
    return {
      direction: "improving" as const,
      message: `Recent scores are improving by ${delta} percentage points.`
    };
  }

  if (delta < -3) {
    return {
      direction: "declining" as const,
      message: `Recent scores are down by ${Math.abs(delta)} percentage points.`
    };
  }

  return {
    direction: "steady" as const,
    message: "Recent scores are broadly steady."
  };
}
