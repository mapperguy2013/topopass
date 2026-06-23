import { asPersistenceClient } from "./queryClient.ts";
import { getSupabaseClient } from "../supabaseClient.ts";

export type UserProgressSummary = {
  mockAttempts: number;
  practiceAttempts: number;
  averageMockPercentage: number | null;
  latestAttemptAt: string | null;
};

const emptyProgress: UserProgressSummary = {
  mockAttempts: 0,
  practiceAttempts: 0,
  averageMockPercentage: null,
  latestAttemptAt: null
};

export async function getUserProgressSummary(
  userId: string,
  options: { client?: unknown | null } = {}
) {
  const client = asPersistenceClient(
    Object.prototype.hasOwnProperty.call(options, "client")
      ? options.client
      : getSupabaseClient()
  );

  if (!client) {
    return {
      source: "static" as const,
      progress: emptyProgress,
      reason: "Supabase is not configured; progress is not persisted."
    };
  }

  const [mockResponse, practiceResponse] = await Promise.all([
    client
      .from("mock_test_attempts")
      .select("percentage, submitted_at, created_at")
      .eq("user_id", userId),
    client
      .from("practice_attempts")
      .select("created_at")
      .eq("user_id", userId)
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
        submitted_at?: unknown;
        created_at?: unknown;
      }[])
    : [];
  const practiceRows = Array.isArray(practiceResponse.data)
    ? (practiceResponse.data as { created_at?: unknown }[])
    : [];
  const percentages = mockRows
    .map((attempt) =>
      typeof attempt === "object" && attempt && "percentage" in attempt
        ? attempt.percentage
        : null
    )
    .filter((value): value is number => typeof value === "number");
  const averageMockPercentage =
    percentages.length === 0
      ? null
      : Math.round(
          percentages.reduce((total, value) => total + value, 0) /
            percentages.length
        );
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

  return {
    source: "supabase" as const,
    progress: {
      mockAttempts: mockRows.length,
      practiceAttempts: practiceRows.length,
      averageMockPercentage,
      latestAttemptAt
    }
  };
}
