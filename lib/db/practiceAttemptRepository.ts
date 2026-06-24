import type {
  Json,
  PracticeMode,
  QuestionType,
  TableInsert
} from "./types.ts";
import { asPersistenceClient, authenticatedUserId } from "./queryClient.ts";
import { getSupabaseClient } from "../supabaseClient.ts";
import {
  listLocalPracticeAttempts,
  saveLocalPracticeAttempt
} from "./localPersistence.ts";
import { normalizePracticeAttempts } from "./progressMigration.ts";

export type PracticeAttemptRecord = {
  userId: string;
  practiceMode: PracticeMode;
  questionId: string;
  questionType: QuestionType;
  answer?: Json | null;
  result?: Json | null;
  score?: number | null;
  maxScore?: number | null;
  passed?: boolean | null;
};

type PracticeAttemptInsert = TableInsert<"practice_attempts">;
type QuestionAttemptInsert = TableInsert<"question_attempts">;

function percentage(score?: number | null, maxScore?: number | null) {
  if (
    typeof score !== "number" ||
    typeof maxScore !== "number" ||
    maxScore <= 0
  ) {
    return null;
  }

  return Math.round((score / maxScore) * 100);
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function flattenPracticeRows(rows: unknown[]) {
  return rows.flatMap((row) => {
    const parent = objectValue(row);
    const questionAttempts = Array.isArray(parent.question_attempts)
      ? parent.question_attempts
      : [];

    if (questionAttempts.length === 0) {
      return [parent];
    }

    return questionAttempts.map((questionAttempt) => ({
      ...objectValue(questionAttempt),
      practiceMode: parent.practice_mode,
      practice_mode: parent.practice_mode,
      createdAt: objectValue(questionAttempt).created_at ?? parent.created_at,
      created_at: objectValue(questionAttempt).created_at ?? parent.created_at
    }));
  });
}

export async function savePracticeAttempt(
  attempt: PracticeAttemptRecord,
  options: { client?: unknown | null } = {}
) {
  const storedAttempt = saveLocalPracticeAttempt(attempt);
  const client = asPersistenceClient(
    Object.prototype.hasOwnProperty.call(options, "client")
      ? options.client
      : getSupabaseClient()
  );

  if (!client) {
    return {
      source: "local-storage" as const,
      persisted: Boolean(storedAttempt),
      id: storedAttempt?.id,
      reason: storedAttempt
        ? "Saved to browser localStorage because Supabase is not configured."
        : "Browser localStorage is unavailable; practice attempt was not persisted."
    };
  }

  const userId = await authenticatedUserId(client, attempt.userId);

  if (!userId) {
    return {
      source: "local-storage" as const,
      persisted: Boolean(storedAttempt),
      id: storedAttempt?.id,
      reason: storedAttempt
        ? "Saved to browser localStorage because no signed-in Supabase user was found."
        : "No signed-in Supabase user was found and browser localStorage is unavailable."
    };
  }

  const completedAt = new Date().toISOString();

  const payload: PracticeAttemptInsert = {
    user_id: userId,
    practice_mode: attempt.practiceMode,
    status: "submitted",
    completed_at: completedAt,
    score: attempt.score ?? null,
    max_score: attempt.maxScore ?? null,
    percentage: percentage(attempt.score, attempt.maxScore),
    passed: attempt.passed ?? null
  };
  const { data, error } = await client
    .from("practice_attempts")
    .insert(payload)
    .select("id")
    .single<{ id: string }>();

  if (error || !data?.id) {
    return {
      source: "local-storage" as const,
      persisted: Boolean(storedAttempt),
      id: storedAttempt?.id,
      reason: storedAttempt
        ? "Saved to browser localStorage after Supabase rejected the practice attempt insert."
        : "Supabase rejected the practice attempt insert and browser localStorage is unavailable.",
      error: error?.message ?? "Practice attempt insert returned no row."
    };
  }

  const questionPayload: QuestionAttemptInsert = {
    user_id: userId,
    practice_attempt_id: data.id,
    question_id: attempt.questionId,
    question_type: attempt.questionType,
    answer: attempt.answer ?? null,
    result: attempt.result ?? null,
    score: attempt.score ?? null,
    max_score: attempt.maxScore ?? null,
    passed: attempt.passed ?? null
  };
  const { error: questionError } = await client
    .from("question_attempts")
    .insert(questionPayload)
    .select("id")
    .single<{ id: string }>();

  if (questionError) {
    return {
      source: "local-storage" as const,
      persisted: Boolean(storedAttempt),
      id: storedAttempt?.id,
      reason: storedAttempt
        ? "Saved to browser localStorage after Supabase rejected the question attempt insert."
        : "Supabase rejected the question attempt insert and browser localStorage is unavailable.",
      error: questionError.message
    };
  }

  return {
    source: "supabase" as const,
    persisted: true,
    id: data?.id,
    localPersisted: Boolean(storedAttempt)
  };
}

export async function listPracticeAttempts(
  userId: string,
  options: { client?: unknown | null } = {}
) {
  const localAttempts = normalizePracticeAttempts(listLocalPracticeAttempts());
  const client = asPersistenceClient(
    Object.prototype.hasOwnProperty.call(options, "client")
      ? options.client
      : getSupabaseClient()
  );

  if (!client) {
    return {
      source: "local-storage" as const,
      attempts: localAttempts,
      reason: "Supabase is not configured; loaded browser-local practice attempts."
    };
  }

  const scopedUserId = await authenticatedUserId(client, userId);

  if (!scopedUserId) {
    return {
      source: "local-storage" as const,
      attempts: localAttempts,
      reason:
        "No signed-in Supabase user was found; loaded browser-local practice attempts."
    };
  }

  const { data, error } = await client
    .from("practice_attempts")
    .select("*, question_attempts(*)")
    .eq("user_id", scopedUserId)
    .order("created_at", { ascending: false });

  return {
    source: "supabase" as const,
    attempts:
      error || !Array.isArray(data)
        ? []
        : normalizePracticeAttempts(flattenPracticeRows(data)),
    error: error?.message
  };
}
