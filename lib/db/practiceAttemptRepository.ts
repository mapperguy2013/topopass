import type {
  Json,
  PracticeMode,
  QuestionType,
  TableInsert
} from "./types.ts";
import { asPersistenceClient } from "./queryClient.ts";
import { getSupabaseClient } from "../supabaseClient.ts";

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

export async function savePracticeAttempt(
  attempt: PracticeAttemptRecord,
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
      persisted: false,
      reason: "Supabase is not configured; practice attempts are not persisted."
    };
  }

  const payload: PracticeAttemptInsert = {
    user_id: attempt.userId,
    practice_mode: attempt.practiceMode,
    question_id: attempt.questionId,
    question_type: attempt.questionType,
    answer: attempt.answer ?? null,
    result: attempt.result ?? null,
    score: attempt.score ?? null,
    max_score: attempt.maxScore ?? null,
    passed: attempt.passed ?? null
  };

  const { data, error } = await client
    .from("practice_attempts")
    .insert(payload)
    .select("id")
    .single<{ id: string }>();

  return {
    source: "supabase" as const,
    persisted: !error,
    id: data?.id,
    error: error?.message
  };
}
