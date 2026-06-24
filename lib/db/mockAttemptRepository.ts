import type { Json, MockMode, TableInsert } from "./types.ts";
import { asPersistenceClient, authenticatedUserId } from "./queryClient.ts";
import { getSupabaseClient } from "../supabaseClient.ts";
import type {
  MockExamAnswers,
  MockExamResult,
  MockQuestionScoreResult
} from "../mockExamEngine.ts";
import type { MockExamModeId } from "../mockExamModes.ts";
import {
  listLocalMockAttempts,
  saveLocalMockAttempt
} from "./localPersistence.ts";
import { normalizeMockAttempts } from "./progressMigration.ts";

export type MockAttemptRecord = {
  id?: string;
  userId: string;
  questionIds: string[];
  answers: MockExamAnswers;
  result?: MockExamResult;
  expiresAt?: string | null;
  durationSeconds?: number | null;
  mode?: MockExamModeId;
};

export type PersistenceResult = {
  source: "supabase" | "local-storage" | "static";
  persisted: boolean;
  id?: string;
  localPersisted?: boolean;
  reason?: string;
  error?: string;
};

type MockAttemptInsert = TableInsert<"mock_attempts">;
type MockQuestionAttemptInsert = TableInsert<"mock_question_attempts">;

function submittedTimestamp() {
  return new Date().toISOString();
}

function startedAtFromDuration(
  submittedAt: string,
  durationSeconds?: number | null
) {
  if (typeof durationSeconds !== "number" || durationSeconds < 0) {
    return undefined;
  }

  return new Date(
    new Date(submittedAt).getTime() - durationSeconds * 1000
  ).toISOString();
}

function resultPayload(attempt: MockAttemptRecord): Json | null {
  if (!attempt.result) return null;

  return {
    ...attempt.result,
    mode: attempt.mode
  } as unknown as Json;
}

function databaseMockMode(mode?: MockExamModeId): MockMode {
  if (mode === "exam-simulation") return "exam";
  return mode ?? "practice";
}

function fallbackQuestionResults(
  attempt: MockAttemptRecord
): MockQuestionScoreResult[] {
  if (attempt.result?.questionResults.length) {
    return attempt.result.questionResults;
  }

  return Object.entries(attempt.answers).map(
    ([questionId, answer]) =>
      ({
        questionId,
        type: answer.type,
        answered: true,
        passed: false,
        score: 0,
        maxScore: 1,
        percentage: 0,
        userAnswerSummary: "Saved answer",
        acceptedAnswerSummary: "Not available",
        details: {
          type: answer.type
        }
      }) as MockQuestionScoreResult
  );
}

function questionAttemptPayloads(
  attempt: MockAttemptRecord,
  userId: string,
  mockAttemptId: string
): MockQuestionAttemptInsert[] {
  return fallbackQuestionResults(attempt).map((questionResult, index) => ({
    user_id: userId,
    mock_attempt_id: mockAttemptId,
    question_id: questionResult.questionId,
    question_type: questionResult.type,
    question_index: index,
    answer: (attempt.answers[questionResult.questionId] ?? null) as Json | null,
    result: questionResult as unknown as Json,
    score: questionResult.score,
    max_score: questionResult.maxScore,
    passed: questionResult.passed
  }));
}

export async function saveMockAttempt(
  attempt: MockAttemptRecord,
  options: { client?: unknown | null } = {}
): Promise<PersistenceResult> {
  const storedAttempt = saveLocalMockAttempt(attempt);
  const client = asPersistenceClient(
    Object.prototype.hasOwnProperty.call(options, "client")
      ? options.client
      : getSupabaseClient()
  );

  if (!client) {
    return {
      source: "local-storage",
      persisted: Boolean(storedAttempt),
      id: storedAttempt?.id,
      reason: storedAttempt
        ? "Saved to browser localStorage because Supabase is not configured."
        : "Browser localStorage is unavailable; mock attempt was not persisted."
    };
  }

  const userId = await authenticatedUserId(client, attempt.userId);

  if (!userId) {
    return {
      source: "local-storage",
      persisted: Boolean(storedAttempt),
      id: storedAttempt?.id,
      reason: storedAttempt
        ? "Saved to browser localStorage because no signed-in Supabase user was found."
        : "No signed-in Supabase user was found and browser localStorage is unavailable."
    };
  }

  const submittedAt = submittedTimestamp();
  const startedAt = startedAtFromDuration(submittedAt, attempt.durationSeconds);
  const attemptPayload: MockAttemptInsert = {
    id: attempt.id,
    user_id: userId,
    mode: databaseMockMode(attempt.mode),
    status: attempt.result ? "submitted" : "in_progress",
    started_at: startedAt,
    expires_at: attempt.expiresAt ?? null,
    submitted_at: attempt.result ? submittedAt : null,
    duration_seconds: attempt.durationSeconds ?? null,
    score: attempt.result?.score ?? null,
    max_score: attempt.result?.maxScore ?? null,
    percentage: attempt.result?.percentage ?? null,
    passed: attempt.result?.passed ?? null,
    result: resultPayload(attempt)
  };

  const { data, error } = await client
    .from("mock_attempts")
    .insert(attemptPayload)
    .select("id")
    .single<{ id: string }>();

  if (error || !data?.id) {
    return {
      source: "local-storage",
      persisted: Boolean(storedAttempt),
      id: storedAttempt?.id,
      reason: storedAttempt
        ? "Saved to browser localStorage after Supabase rejected the mock attempt insert."
        : "Supabase rejected the mock attempt insert and browser localStorage is unavailable.",
      error: error?.message ?? "Mock attempt insert returned no row."
    };
  }

  const questionAttempts = questionAttemptPayloads(attempt, userId, data.id);

  if (questionAttempts.length > 0) {
    const { error: questionError } = await client
      .from("mock_question_attempts")
      .insert(questionAttempts);

    if (questionError) {
      return {
        source: "local-storage",
        persisted: Boolean(storedAttempt),
        id: storedAttempt?.id ?? data.id,
        reason: storedAttempt
          ? "Saved to browser localStorage after Supabase rejected mock question inserts."
          : "Supabase rejected mock question inserts and browser localStorage is unavailable.",
        error: questionError.message
      };
    }
  }

  return {
    source: "supabase",
    persisted: true,
    id: data.id,
    localPersisted: Boolean(storedAttempt)
  };
}

export async function loadMockAttempt(
  attemptId: string,
  options: { client?: unknown | null } = {}
) {
  const client = asPersistenceClient(
    Object.prototype.hasOwnProperty.call(options, "client")
      ? options.client
      : getSupabaseClient()
  );

  if (!client) {
    const localAttempt =
      normalizeMockAttempts(listLocalMockAttempts()).find(
        (attempt) => attempt.id === attemptId
      ) ?? null;

    return {
      source: "local-storage" as const,
      attempt: localAttempt,
      reason: localAttempt
        ? "Loaded browser-local mock attempt."
        : "Supabase is not configured and no local attempt matched this ID."
    };
  }

  const userId = await authenticatedUserId(client, "");

  if (!userId) {
    return {
      source: "local-storage" as const,
      attempt: null,
      reason:
        "No signed-in Supabase user was found and no local attempt matched this ID."
    };
  }

  const { data, error } = await client
    .from("mock_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", userId)
    .single<unknown>();

  return {
    source: "supabase" as const,
    attempt: error ? null : data,
    error: error?.message
  };
}

export async function listMockAttempts(
  userId: string,
  options: { client?: unknown | null } = {}
) {
  const localAttempts = normalizeMockAttempts(listLocalMockAttempts());
  const client = asPersistenceClient(
    Object.prototype.hasOwnProperty.call(options, "client")
      ? options.client
      : getSupabaseClient()
  );

  if (!client) {
    return {
      source: "local-storage" as const,
      attempts: localAttempts,
      reason: "Supabase is not configured; loaded browser-local mock attempts."
    };
  }

  const scopedUserId = await authenticatedUserId(client, userId);

  if (!scopedUserId) {
    return {
      source: "local-storage" as const,
      attempts: localAttempts,
      reason:
        "No signed-in Supabase user was found; loaded browser-local mock attempts."
    };
  }

  const { data, error } = await client
    .from("mock_attempts")
    .select("*")
    .eq("user_id", scopedUserId)
    .order("submitted_at", { ascending: false });

  return {
    source: "supabase" as const,
    attempts: error || !Array.isArray(data) ? [] : normalizeMockAttempts(data),
    error: error?.message
  };
}
