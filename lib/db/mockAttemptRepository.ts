import type { Json, TableInsert } from "./types.ts";
import { asPersistenceClient } from "./queryClient.ts";
import { getSupabaseClient } from "../supabaseClient.ts";
import type { MockExamAnswers, MockExamResult } from "../mockExamEngine.ts";

export type MockAttemptRecord = {
  id?: string;
  userId: string;
  questionIds: string[];
  answers: MockExamAnswers;
  result?: MockExamResult;
  expiresAt?: string | null;
};

export type PersistenceResult = {
  source: "supabase" | "static";
  persisted: boolean;
  id?: string;
  reason?: string;
  error?: string;
};

type MockAttemptInsert = TableInsert<"mock_test_attempts">;
type MockAnswerInsert = TableInsert<"mock_test_answers">;

export async function saveMockAttempt(
  attempt: MockAttemptRecord,
  options: { client?: unknown | null } = {}
): Promise<PersistenceResult> {
  const client = asPersistenceClient(
    Object.prototype.hasOwnProperty.call(options, "client")
      ? options.client
      : getSupabaseClient()
  );

  if (!client) {
    return {
      source: "static",
      persisted: false,
      reason: "Supabase is not configured; mock attempts remain browser-local."
    };
  }

  const attemptPayload: MockAttemptInsert = {
    id: attempt.id,
    user_id: attempt.userId,
    status: attempt.result ? "submitted" : "in_progress",
    question_ids: attempt.questionIds,
    expires_at: attempt.expiresAt ?? null,
    submitted_at: attempt.result ? new Date().toISOString() : null,
    score: attempt.result?.score ?? null,
    max_score: attempt.result?.maxScore ?? null,
    percentage: attempt.result?.percentage ?? null,
    passed: attempt.result?.passed ?? null,
    result: attempt.result as unknown as Json
  };

  const { data, error } = await client
    .from("mock_test_attempts")
    .insert(attemptPayload)
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    return {
      source: "supabase",
      persisted: false,
      error: error?.message ?? "Attempt insert returned no row."
    };
  }

  const answers: MockAnswerInsert[] = Object.entries(attempt.answers).map(
    ([questionId, answer]) => ({
      attempt_id: data.id,
      user_id: attempt.userId,
      question_id: questionId,
      question_type: answer.type,
      answer: answer as unknown as Json
    })
  );

  if (answers.length > 0) {
    const { error: answerError } = await client
      .from("mock_test_answers")
      .insert(answers);
    if (answerError) {
      return {
        source: "supabase",
        persisted: false,
        id: data.id,
        error: answerError.message
      };
    }
  }

  return { source: "supabase", persisted: true, id: data.id };
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
    return {
      source: "static" as const,
      attempt: null,
      reason: "Supabase is not configured; persisted attempts are unavailable."
    };
  }

  const { data, error } = await client
    .from("mock_test_attempts")
    .select("*")
    .eq("id", attemptId)
    .single<unknown>();

  return {
    source: "supabase" as const,
    attempt: error ? null : data,
    error: error?.message
  };
}
