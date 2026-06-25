import type { UserProgressSummary } from "../db/progressRepository.ts";
import type {
  NormalizedMockAttempt,
  NormalizedPracticeAttempt
} from "../db/progressMigration.ts";

export type AccountProgressDisplayKind =
  | "account"
  | "local-browser"
  | "checking"
  | "empty";

export type AccountProgressChoice = {
  kind: AccountProgressDisplayKind;
  label: string;
  note: string;
};

export const emptyAccountProgressSummary: UserProgressSummary = {
  mockAttempts: 0,
  practiceAttempts: 0,
  averageScore: null,
  averageMockPercentage: null,
  mockPassRate: null,
  latestMockScore: null,
  routePracticeAttempts: 0,
  routePracticeAverageScore: null,
  latestAttemptAt: null
};

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(
    values.reduce((total, value) => total + value, 0) / values.length
  );
}

export function hasVisibleProgress(
  progress: UserProgressSummary,
  totalQuestionsAttempted = 0
) {
  return (
    progress.practiceAttempts > 0 ||
    progress.mockAttempts > 0 ||
    totalQuestionsAttempted > 0 ||
    Boolean(progress.latestAttemptAt)
  );
}

export function buildProgressSummaryFromAttempts({
  mockAttempts,
  practiceAttempts
}: {
  mockAttempts: NormalizedMockAttempt[];
  practiceAttempts: NormalizedPracticeAttempt[];
}): UserProgressSummary {
  const practicePercentages = practiceAttempts
    .map((attempt) => attempt.percentage)
    .filter((value): value is number => typeof value === "number");
  const mockPercentages = mockAttempts
    .map((attempt) => attempt.percentage)
    .filter((value): value is number => typeof value === "number");
  const routePracticeAttempts = practiceAttempts.filter(
    (attempt) => attempt.questionType === "route-drawing"
  );
  const routePercentages = routePracticeAttempts
    .map((attempt) => attempt.percentage)
    .filter((value): value is number => typeof value === "number");
  const latestMockAttempt = mockAttempts
    .slice()
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
  const latestAttemptAt =
    [
      ...practiceAttempts.map((attempt) => attempt.createdAt),
      ...mockAttempts.map((attempt) => attempt.submittedAt)
    ]
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;

  return {
    mockAttempts: mockAttempts.length,
    practiceAttempts: practiceAttempts.length,
    averageScore: average([...practicePercentages, ...mockPercentages]),
    averageMockPercentage: average(mockPercentages),
    mockPassRate:
      mockAttempts.length === 0
        ? null
        : Math.round(
            (mockAttempts.filter((attempt) => attempt.passed).length /
              mockAttempts.length) *
              100
          ),
    latestMockScore: latestMockAttempt
      ? {
          score: latestMockAttempt.score,
          maxScore: latestMockAttempt.maxScore,
          percentage: latestMockAttempt.percentage,
          passed: latestMockAttempt.passed
        }
      : null,
    routePracticeAttempts: routePracticeAttempts.length,
    routePracticeAverageScore: average(routePercentages),
    latestAttemptAt
  };
}

export function chooseAccountProgressDisplay({
  accountProgress,
  accountQuestionCount,
  localLoaded,
  localProgress,
  localQuestionCount,
  hasAccountError
}: {
  accountProgress: UserProgressSummary;
  accountQuestionCount: number;
  localLoaded: boolean;
  localProgress: UserProgressSummary;
  localQuestionCount: number;
  hasAccountError?: boolean;
}): AccountProgressChoice {
  const accountHasProgress = hasVisibleProgress(
    accountProgress,
    accountQuestionCount
  );
  const localHasProgress =
    localLoaded && hasVisibleProgress(localProgress, localQuestionCount);

  if (accountHasProgress) {
    return {
      kind: "account",
      label: "Account progress",
      note: localHasProgress
        ? "Showing account-backed progress. Browser-local history remains available separately until account sync is finalised."
        : "Showing progress saved to your signed-in TopoPass account."
    };
  }

  if (localHasProgress) {
    return {
      kind: "local-browser",
      label: "Local browser progress",
      note: hasAccountError
        ? "Your local browser progress is still available and shown below while account progress is temporarily unavailable."
        : "Account sync is still being finalised. Your current browser progress is shown here so your dashboard matches what you see in Progress."
    };
  }

  if (!localLoaded) {
    return {
      kind: "checking",
      label: "Checking browser progress",
      note: "Checking this browser for local progress before showing account summary totals."
    };
  }

  return {
    kind: "empty",
    label: "No progress yet",
    note: "Complete practice questions or a mock exam to build your progress summary."
  };
}
