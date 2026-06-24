import { asPersistenceClient, authenticatedUserId } from "./queryClient.ts";
import { getSupabaseClient } from "../supabaseClient.ts";
import {
  listLocalMockAttempts,
  listLocalPracticeAttempts
} from "./localPersistence.ts";
import {
  normalizeMockAttempts,
  normalizePracticeAttempts
} from "./progressMigration.ts";

export type UserProgressSummary = {
  mockAttempts: number;
  practiceAttempts: number;
  averageScore: number | null;
  averageMockPercentage: number | null;
  mockPassRate: number | null;
  latestMockScore: {
    score: number | null;
    maxScore: number | null;
    percentage: number | null;
    passed: boolean | null;
  } | null;
  routePracticeAttempts: number;
  routePracticeAverageScore: number | null;
  latestAttemptAt: string | null;
};

const emptyProgress: UserProgressSummary = {
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

function localProgressSummary(): UserProgressSummary {
  const practiceAttempts = normalizePracticeAttempts(listLocalPracticeAttempts());
  const mockAttempts = normalizeMockAttempts(listLocalMockAttempts());
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
  const passRate =
    mockAttempts.length === 0
      ? null
      : Math.round(
          (mockAttempts.filter((attempt) => attempt.passed).length /
            mockAttempts.length) *
            100
        );
  const latestAttemptAt =
    [
      ...practiceAttempts.map((attempt) => attempt.createdAt),
      ...mockAttempts.map((attempt) => attempt.submittedAt)
    ]
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;
  const latestMockAttempt = mockAttempts
    .slice()
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];

  return {
    mockAttempts: mockAttempts.length,
    practiceAttempts: practiceAttempts.length,
    averageScore: average([...practicePercentages, ...mockPercentages]),
    averageMockPercentage: average(mockPercentages),
    mockPassRate: passRate,
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

export async function getUserProgressSummary(
  userId: string,
  options: { client?: unknown | null } = {}
) {
  const localProgress = localProgressSummary();
  const client = asPersistenceClient(
    Object.prototype.hasOwnProperty.call(options, "client")
      ? options.client
      : getSupabaseClient()
  );

  if (!client) {
    return {
      source: "local-storage" as const,
      progress: localProgress,
      reason: "Supabase is not configured; loaded browser-local progress."
    };
  }

  const scopedUserId = await authenticatedUserId(client, userId);

  if (!scopedUserId) {
    return {
      source: "local-storage" as const,
      progress: localProgress,
      reason:
        "No signed-in Supabase user was found; loaded browser-local progress."
    };
  }

  const [mockResponse, practiceResponse] = await Promise.all([
    client
      .from("mock_attempts")
      .select("score, max_score, percentage, passed, submitted_at, created_at")
      .eq("user_id", scopedUserId),
    client
      .from("practice_attempts")
      .select("practice_mode, score, max_score, percentage, created_at")
      .eq("user_id", scopedUserId)
  ]);

  if (mockResponse.error || practiceResponse.error) {
    return {
      source: "supabase" as const,
      progress: emptyProgress,
      error: mockResponse.error?.message ?? practiceResponse.error?.message
    };
  }

  const mockRows = Array.isArray(mockResponse.data)
    ? (mockResponse.data as {
        percentage?: unknown;
        score?: unknown;
        max_score?: unknown;
        passed?: unknown;
        submitted_at?: unknown;
        created_at?: unknown;
      }[])
    : [];
  const practiceRows = Array.isArray(practiceResponse.data)
    ? (practiceResponse.data as {
        practice_mode?: unknown;
        score?: unknown;
        max_score?: unknown;
        percentage?: unknown;
        created_at?: unknown;
      }[])
    : [];
  const percentages = mockRows
    .map((attempt) =>
      typeof attempt === "object" && attempt && "percentage" in attempt
        ? attempt.percentage
        : null
    )
    .filter((value): value is number => typeof value === "number");
  const averageMockPercentage =
    average(percentages);
  const practicePercentages = practiceRows
    .map((attempt) => {
      if (typeof attempt.percentage === "number") return attempt.percentage;
      if (
        typeof attempt.score === "number" &&
        typeof attempt.max_score === "number" &&
        attempt.max_score > 0
      ) {
        return Math.round((attempt.score / attempt.max_score) * 100);
      }

      return null;
    })
    .filter((value): value is number => typeof value === "number");
  const routePercentages = practiceRows
    .filter((attempt) => attempt.practice_mode === "route-drawing")
    .map((attempt) => {
      if (typeof attempt.percentage === "number") return attempt.percentage;
      if (
        typeof attempt.score === "number" &&
        typeof attempt.max_score === "number" &&
        attempt.max_score > 0
      ) {
        return Math.round((attempt.score / attempt.max_score) * 100);
      }

      return null;
    })
    .filter((value): value is number => typeof value === "number");
  const mockPassValues = mockRows
    .map((attempt) =>
      typeof attempt === "object" && attempt && "passed" in attempt
        ? attempt.passed
        : null
    )
    .filter((value): value is boolean => typeof value === "boolean");
  const latestAttemptAt =
    [...mockRows, ...practiceRows]
      .map((attempt) => {
        if (!attempt || typeof attempt !== "object" || !("created_at" in attempt)) {
          return null;
        }
        return "submitted_at" in attempt
          ? attempt.submitted_at ?? attempt.created_at
          : attempt.created_at;
      })
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;
  const latestMockRow = mockRows
    .slice()
    .sort((a, b) => {
      const aDate =
        typeof a.submitted_at === "string"
          ? a.submitted_at
          : typeof a.created_at === "string"
            ? a.created_at
            : "";
      const bDate =
        typeof b.submitted_at === "string"
          ? b.submitted_at
          : typeof b.created_at === "string"
            ? b.created_at
            : "";
      return bDate.localeCompare(aDate);
    })[0];

  return {
    source: "supabase" as const,
    progress: {
      mockAttempts: mockRows.length,
      practiceAttempts: practiceRows.length,
      averageScore: average([...practicePercentages, ...percentages]),
      averageMockPercentage,
      mockPassRate:
        mockPassValues.length === 0
          ? null
          : Math.round(
              (mockPassValues.filter(Boolean).length / mockPassValues.length) *
                100
            ),
      latestMockScore: latestMockRow
        ? {
            score:
              typeof latestMockRow.score === "number"
                ? latestMockRow.score
                : null,
            maxScore:
              typeof latestMockRow.max_score === "number"
                ? latestMockRow.max_score
                : null,
            percentage:
              typeof latestMockRow.percentage === "number"
                ? latestMockRow.percentage
                : null,
            passed:
              typeof latestMockRow.passed === "boolean"
                ? latestMockRow.passed
                : null
          }
        : null,
      routePracticeAttempts: practiceRows.filter(
        (attempt) => attempt.practice_mode === "route-drawing"
      ).length,
      routePracticeAverageScore: average(routePercentages),
      latestAttemptAt
    }
  };
}
