import assert from "node:assert/strict";
import { test } from "node:test";
import { getAllQuestions } from "../admin/questionAdminHelpers.ts";
import { hasSupabaseConfig } from "../supabaseClient.ts";
import {
  dbRowToStaticQuestion,
  readQuestions,
  staticQuestionToDbInsert
} from "./questionRepository.ts";
import type { TableRow } from "./types.ts";

test("Supabase config detection requires both public env values", () => {
  assert.equal(hasSupabaseConfig({}), false);
  assert.equal(
    hasSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co"
    }),
    false
  );
  assert.equal(
    hasSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key"
    }),
    true
  );
});

test("question repository falls back to static banks without Supabase", async () => {
  const result = await readQuestions({ client: null });

  assert.equal(result.source, "static");
  assert.equal(result.questions.length, getAllQuestions().length);
  assert.ok(result.questions.some((question) => question.type === "knowledge"));
  assert.ok(result.questions.some((question) => question.type === "map-click"));
  assert.ok(result.questions.some((question) => question.type === "route"));
});

test("knowledge question converts to database row shape and back", () => {
  const question = getAllQuestions().find(
    (entry) => entry.type === "knowledge"
  );
  assert.ok(question);

  const insert = staticQuestionToDbInsert(question, "phase-1");
  assert.equal(insert.question_type, "knowledge");
  assert.equal(insert.bank_id, "phase-1");
  assert.equal(insert.status, "active");

  const row: TableRow<"questions"> = {
    ...insert,
    bank_id: insert.bank_id ?? null,
    status: insert.status ?? "draft",
    difficulty: insert.difficulty ?? null,
    category: insert.category ?? null,
    explanation: insert.explanation ?? null,
    tags: insert.tags ?? [],
    source_note: insert.source_note ?? null,
    created_by: null,
    reviewed_by: null,
    published_at: null,
    created_at: "2026-06-23T00:00:00.000Z",
    updated_at: "2026-06-23T00:00:00.000Z"
  };
  const converted = dbRowToStaticQuestion(row);

  assert.equal(converted?.type, "knowledge");
  assert.equal(converted?.id, question.id);
});

test("map-click question conversion preserves coordinates and tolerance", () => {
  const question = getAllQuestions().find(
    (entry) => entry.type === "map-click"
  );
  assert.ok(question);

  const insert = staticQuestionToDbInsert(question);
  const row: TableRow<"questions"> = {
    ...insert,
    bank_id: null,
    status: insert.status ?? "draft",
    difficulty: insert.difficulty ?? null,
    category: insert.category ?? null,
    explanation: insert.explanation ?? null,
    tags: insert.tags ?? [],
    source_note: insert.source_note ?? null,
    created_by: null,
    reviewed_by: null,
    published_at: null,
    created_at: "2026-06-23T00:00:00.000Z",
    updated_at: "2026-06-23T00:00:00.000Z"
  };
  const converted = dbRowToStaticQuestion(row);

  assert.equal(converted?.type, "map-click");
  if (converted?.type === "map-click") {
    assert.equal(converted.answer.lat, question.answer.lat);
    assert.equal(converted.answer.lng, question.answer.lng);
    assert.equal(converted.toleranceMeters, question.toleranceMeters);
  }
});

test("route question conversion preserves map bounds and accepted geometry", () => {
  const question = getAllQuestions().find((entry) => entry.type === "route");
  assert.ok(question);

  const insert = staticQuestionToDbInsert(question);
  const row: TableRow<"questions"> = {
    ...insert,
    bank_id: null,
    status: insert.status ?? "draft",
    difficulty: insert.difficulty ?? null,
    category: insert.category ?? null,
    explanation: insert.explanation ?? null,
    tags: insert.tags ?? [],
    source_note: insert.source_note ?? null,
    created_by: null,
    reviewed_by: null,
    published_at: null,
    created_at: "2026-06-23T00:00:00.000Z",
    updated_at: "2026-06-23T00:00:00.000Z"
  };
  const converted = dbRowToStaticQuestion(row);

  assert.equal(converted?.type, "route");
  if (converted?.type === "route") {
    assert.deepEqual(converted.mapBounds, question.mapBounds);
    assert.equal(
      converted.acceptedRoute?.geometry.length,
      question.acceptedRoute?.geometry.length
    );
  }
});
