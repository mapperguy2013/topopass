import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { getAllQuestions } from "../admin/questionAdminHelpers.ts";
import { QUESTION_TOPICS } from "../questions/topics.ts";
import { hasSupabaseConfig } from "../supabaseClient.ts";
import {
  dbRowToStaticQuestion,
  exportQuestionBankItemsForAdmin,
  importQuestionBankItemsForAdmin,
  PUBLISHED_QUESTION_STATUS,
  readAdminQuestionById,
  readAdminQuestionItems,
  readPublishedQuestions,
  readQuestions,
  setQuestionStatusForAdmin,
  staticQuestionToDbInsert,
  upsertQuestionForAdmin
} from "./questionRepository.ts";
import { previewQuestionImport } from "./questionImportExport.ts";
import type { TableRow } from "./types.ts";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "../..");
const seedPath = path.join(projectRoot, "supabase/seed/question_bank_items.json");

type RecordedQuestionCall = {
  table: string;
  operation: "insert" | "select" | "eq" | "order" | "upsert" | "update";
  column?: string;
  value?: unknown;
  values?: unknown;
};

class RecordingQuestionQuery {
  private readonly filters: Array<{ column: string; value: unknown }> = [];
  private readonly table: string;
  private readonly calls: RecordedQuestionCall[];
  private readonly rows: unknown[];
  private readonly error: { message: string } | null;

  constructor(
    table: string,
    calls: RecordedQuestionCall[],
    rows: unknown[] = [],
    error: { message: string } | null = null
  ) {
    this.table = table;
    this.calls = calls;
    this.rows = rows;
    this.error = error;
  }

  select(columns = "*") {
    this.calls.push({ table: this.table, operation: "select", value: columns });
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value });
    this.calls.push({ table: this.table, operation: "eq", column, value });
    return this;
  }

  order(column: string) {
    this.calls.push({ table: this.table, operation: "order", column });
    return this;
  }

  single() {
    const data = this.error
      ? null
      : this.rows.filter((row) =>
          this.filters.every(
            ({ column, value }) =>
              row &&
              typeof row === "object" &&
              !Array.isArray(row) &&
              (row as Record<string, unknown>)[column] === value
          )
        )[0] ?? null;

    return Promise.resolve({ data, error: this.error });
  }

  upsert(values: unknown) {
    this.calls.push({ table: this.table, operation: "upsert", values });
    return this;
  }

  insert(values: unknown) {
    this.calls.push({ table: this.table, operation: "insert", values });
    return this;
  }

  update(values: unknown) {
    this.calls.push({ table: this.table, operation: "update", values });
    return this;
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown[] | null; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    const data = this.error
      ? null
      : this.rows.filter((row) =>
          this.filters.every(
            ({ column, value }) =>
              row &&
              typeof row === "object" &&
              !Array.isArray(row) &&
              (row as Record<string, unknown>)[column] === value
          )
        );

    return Promise.resolve({ data, error: this.error }).then(
      onfulfilled,
      onrejected
    );
  }
}

class RecordingQuestionClient {
  calls: RecordedQuestionCall[] = [];
  private readonly rows: unknown[];
  private readonly error: { message: string } | null;

  constructor(
    rows: unknown[] = [],
    error: { message: string } | null = null
  ) {
    this.rows = rows;
    this.error = error;
  }

  from(table: string) {
    return new RecordingQuestionQuery(table, this.calls, this.rows, this.error);
  }
}

function rowFromQuestion(
  question: ReturnType<typeof getAllQuestions>[number],
  status: "draft" | "published" | "archived"
): TableRow<"question_bank_items"> {
  const insert = staticQuestionToDbInsert(question, null, status);

  return {
    ...insert,
    status,
    difficulty: insert.difficulty ?? null,
    category: insert.category ?? null,
    explanation: insert.explanation ?? null,
    tip: insert.tip ?? null,
    tags: insert.tags ?? [],
    source: insert.source ?? "static",
    payload: insert.payload ?? {},
    version: 1,
    created_by: null,
    updated_by: null,
    published_at: insert.published_at ?? null,
    created_at: "2026-06-23T00:00:00.000Z",
    updated_at: "2026-06-23T00:00:00.000Z"
  };
}

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
  assert.equal(insert.status, PUBLISHED_QUESTION_STATUS);
  assert.equal(insert.source, question.sourceNote ?? "static");

  const row: TableRow<"question_bank_items"> = {
    ...insert,
    status: insert.status ?? "draft",
    difficulty: insert.difficulty ?? null,
    category: insert.category ?? null,
    explanation: insert.explanation ?? null,
    tip: insert.tip ?? null,
    tags: insert.tags ?? [],
    source: insert.source ?? "static",
    payload: insert.payload ?? {},
    version: 1,
    created_by: null,
    updated_by: null,
    published_at: null,
    created_at: "2026-06-23T00:00:00.000Z",
    updated_at: "2026-06-23T00:00:00.000Z"
  };
  const converted = dbRowToStaticQuestion(row);

  assert.equal(converted?.type, "knowledge");
  assert.equal(converted?.id, question.id);
  if (converted?.type === "knowledge" && question.type === "knowledge") {
    assert.equal(converted.tip, question.tip);
  }
});

test("learner question reads target only published question_bank_items", async () => {
  const [knowledgeQuestion, mapClickQuestion, routeQuestion] = [
    getAllQuestions().find((entry) => entry.type === "knowledge"),
    getAllQuestions().find((entry) => entry.type === "map-click"),
    getAllQuestions().find((entry) => entry.type === "route")
  ];
  assert.ok(knowledgeQuestion);
  assert.ok(mapClickQuestion);
  assert.ok(routeQuestion);

  const client = new RecordingQuestionClient([
    rowFromQuestion(knowledgeQuestion, "published"),
    rowFromQuestion(mapClickQuestion, "draft"),
    rowFromQuestion(routeQuestion, "archived")
  ]);
  const result = await readPublishedQuestions({ client });

  assert.equal(result.source, "supabase");
  assert.deepEqual(
    result.questions.map((question) => question.id),
    [knowledgeQuestion.id]
  );
  assert.ok(
    client.calls.some(
      (call) =>
        call.table === "question_bank_items" &&
        call.operation === "eq" &&
        call.column === "status" &&
        call.value === PUBLISHED_QUESTION_STATUS
    )
  );
});

test("draft and archived question rows are hidden from learner question reads", async () => {
  const knowledgeQuestion = getAllQuestions().find(
    (entry) => entry.type === "knowledge"
  );
  assert.ok(knowledgeQuestion);

  const client = new RecordingQuestionClient([
    rowFromQuestion(knowledgeQuestion, "draft"),
    rowFromQuestion(knowledgeQuestion, "archived")
  ]);
  const result = await readPublishedQuestions({ client });

  assert.equal(result.source, "supabase");
  assert.deepEqual(result.questions, []);
  assert.ok(
    client.calls.some(
      (call) =>
        call.table === "question_bank_items" &&
        call.operation === "eq" &&
        call.column === "status" &&
        call.value === "published"
    )
  );
});

test("admin question inventory can read all publishing statuses", async () => {
  const question = getAllQuestions().find((entry) => entry.type === "knowledge");
  assert.ok(question);

  const rows = [
    rowFromQuestion(question, "published"),
    rowFromQuestion(question, "draft"),
    rowFromQuestion(question, "archived")
  ];
  const client = new RecordingQuestionClient(rows);
  const result = await readAdminQuestionItems({ client });

  assert.equal(result.source, "supabase");
  assert.equal(result.items.length, 3);
  assert.deepEqual(
    result.items.map((item) => item.status),
    ["published", "draft", "archived"]
  );
  assert.equal(
    client.calls.some(
      (call) => call.operation === "eq" && call.column === "status"
    ),
    false
  );
  assert.equal(result.items[0].category, question.category);
  assert.equal(result.items[0].difficulty, question.difficulty);
});

test("admin question detail can read a single imported question_bank_items row", async () => {
  const question = getAllQuestions().find((entry) => entry.type === "knowledge");
  assert.ok(question);

  const client = new RecordingQuestionClient([
    rowFromQuestion(question, "draft")
  ]);
  const result = await readAdminQuestionById(question.id, { client });

  assert.equal(result.source, "supabase");
  assert.equal(result.question?.id, question.id);
  assert.equal(result.question?.type, "knowledge");
  assert.ok(
    client.calls.some(
      (call) =>
        call.table === "question_bank_items" &&
        call.operation === "eq" &&
        call.column === "id" &&
        call.value === question.id
    )
  );
});

test("admin batch actions and preview stay protected and target question_bank_items", () => {
  const actionsSource = readFileSync(
    path.join(projectRoot, "app/admin/questions/actions.ts"),
    "utf8"
  );
  const inventorySource = readFileSync(
    path.join(projectRoot, "src/components/admin/AdminQuestionInventory.tsx"),
    "utf8"
  );
  const detailSource = readFileSync(
    path.join(projectRoot, "app/admin/questions/[id]/page.tsx"),
    "utf8"
  );

  assert.match(actionsSource, /batchSetQuestionStatusAction/);
  assert.match(actionsSource, /requireAdmin\("\/admin\/questions"\)/);
  assert.match(actionsSource, /getAll\("questionId"\)/);
  assert.match(actionsSource, /upsertQuestionForAdmin/);
  assert.match(actionsSource, /setQuestionStatusForAdmin/);
  assert.match(inventorySource, /batch-question-status-form/);
  assert.match(inventorySource, /Publish selected/);
  assert.match(inventorySource, /Archive selected/);
  assert.match(detailSource, /LearnerPreview/);
  assert.match(detailSource, /readAdminQuestionById/);
  assert.match(detailSource, /Preview is admin-only and does not publish/);
});

test("admin export reads question_bank_items with optional status filter", async () => {
  const question = getAllQuestions().find((entry) => entry.type === "knowledge");
  assert.ok(question);

  const client = new RecordingQuestionClient([
    rowFromQuestion(question, "published"),
    rowFromQuestion(question, "draft")
  ]);
  const result = await exportQuestionBankItemsForAdmin("published", { client });

  assert.equal(result.source, "supabase");
  assert.deepEqual(
    result.items.map((item) => item.status),
    ["published"]
  );
  assert.equal(result.items[0].category, question.category);
  assert.equal(result.items[0].difficulty, question.difficulty);
  assert.ok(
    client.calls.some(
      (call) =>
        call.table === "question_bank_items" &&
        call.operation === "select" &&
        call.value === "*"
    )
  );
  assert.ok(
    client.calls.some(
      (call) =>
        call.table === "question_bank_items" &&
        call.operation === "eq" &&
        call.column === "status" &&
        call.value === "published"
      )
  );
});

test("admin export supports all publishing status filters", async () => {
  const question = getAllQuestions().find((entry) => entry.type === "knowledge");
  assert.ok(question);

  const filters = ["all", "published", "draft", "archived"] as const;

  for (const statusFilter of filters) {
    const client = new RecordingQuestionClient([
      rowFromQuestion(question, "published"),
      rowFromQuestion(question, "draft"),
      rowFromQuestion(question, "archived")
    ]);
    const result = await exportQuestionBankItemsForAdmin(statusFilter, {
      client
    });

    assert.equal(result.source, "supabase");
    assert.ok(
      client.calls.some(
        (call) =>
          call.table === "question_bank_items" &&
          call.operation === "select" &&
          call.value === "*"
      )
    );
    if (statusFilter === "all") {
      assert.equal(result.items.length, 3);
      assert.equal(
        client.calls.some(
          (call) => call.operation === "eq" && call.column === "status"
        ),
        false
      );
    } else {
      assert.deepEqual(
        result.items.map((item) => item.status),
        [statusFilter]
      );
      assert.ok(
        client.calls.some(
          (call) =>
            call.table === "question_bank_items" &&
            call.operation === "eq" &&
            call.column === "status" &&
            call.value === statusFilter
        )
      );
    }
  }
});

test("question import validation rejects invalid and old table-shaped payloads", () => {
  const invalid = previewQuestionImport(
    JSON.stringify({
      question_bank_items: [
        {
          id: "bad-knowledge",
          question_type: "knowledge",
          prompt: "Bad knowledge question",
          payload: {
            options: ["North"],
            correctAnswer: "South"
          }
        }
      ]
    })
  );
  const oldShape = previewQuestionImport(
    JSON.stringify({
      questions: [
        {
          id: "old-question",
          bank_id: "old-bank"
        }
      ]
    })
  );

  assert.equal(invalid.validRecords.length, 0);
  assert.ok(
    invalid.errors.some((error) => error.field === "payload.options")
  );
  assert.equal(oldShape.validRecords.length, 0);
  assert.ok(oldShape.errors.some((error) => error.field === "questions"));
});

test("question import validation rejects old fields and invalid statuses", () => {
  const question = getAllQuestions().find((entry) => entry.type === "knowledge");
  assert.ok(question);

  const oldFieldsRecord = rowFromQuestion(question, "draft") as Record<
    string,
    unknown
  >;
  oldFieldsRecord.bank_id = "legacy-bank";
  oldFieldsRecord.source_note = "legacy source";
  const invalidStatusRecord = {
    ...rowFromQuestion(question, "draft"),
    id: "invalid-status-question",
    status: "active"
  };
  const preview = previewQuestionImport(
    JSON.stringify({
      question_bank_items: [oldFieldsRecord, invalidStatusRecord]
    })
  );

  assert.equal(preview.validRecords.length, 0);
  assert.ok(preview.errors.some((error) => error.field === "bank_id"));
  assert.ok(preview.errors.some((error) => error.field === "source_note"));
  assert.ok(preview.errors.some((error) => error.field === "status"));
});

test("question import validation rejects invalid topics and difficulty values", () => {
  const question = getAllQuestions().find((entry) => entry.type === "knowledge");
  assert.ok(question);

  const invalidTopicRecord = {
    ...rowFromQuestion(question, "draft"),
    id: "invalid-topic-question",
    category: "Unofficial local trivia"
  };
  const invalidDifficultyRecord = {
    ...rowFromQuestion(question, "draft"),
    id: "invalid-difficulty-question",
    difficulty: "expert"
  };
  const preview = previewQuestionImport(
    JSON.stringify({
      question_bank_items: [invalidTopicRecord, invalidDifficultyRecord]
    })
  );

  assert.equal(preview.validRecords.length, 0);
  assert.ok(preview.errors.some((error) => error.field === "category"));
  assert.ok(preview.errors.some((error) => error.field === "difficulty"));
});

test("imported question records default to draft unless status is valid", () => {
  const question = getAllQuestions().find((entry) => entry.type === "knowledge");
  assert.ok(question);

  const importRecord: Record<string, unknown> = {
    ...rowFromQuestion(question, "published")
  };
  delete importRecord.status;
  delete importRecord.published_at;

  const preview = previewQuestionImport(
    JSON.stringify({ question_bank_items: [importRecord] })
  );

  assert.equal(preview.errors.length, 0);
  assert.equal(preview.validRecords.length, 1);
  assert.equal(preview.validRecords[0].status, "draft");
  assert.equal(preview.validRecords[0].published_at, null);
});

test("import preview preserves topic and difficulty metadata", () => {
  const question = getAllQuestions().find((entry) => entry.type === "knowledge");
  assert.ok(question);

  const record = {
    ...rowFromQuestion(question, "draft"),
    category: "Passenger scenario judgement",
    difficulty: "hard" as const
  };
  const preview = previewQuestionImport(
    JSON.stringify({ question_bank_items: [record] })
  );

  assert.equal(preview.errors.length, 0);
  assert.equal(preview.validRecords[0].category, "Passenger scenario judgement");
  assert.equal(preview.validRecords[0].difficulty, "hard");
  assert.equal(preview.previewItems[0].category, "Passenger scenario judgement");
  assert.equal(preview.previewItems[0].difficulty, "hard");
});

test("admin import writes validated records to question_bank_items", async () => {
  const question = getAllQuestions().find((entry) => entry.type === "knowledge");
  assert.ok(question);

  const preview = previewQuestionImport(
    JSON.stringify({
      question_bank_items: [rowFromQuestion(question, "published")]
    })
  );
  const client = new RecordingQuestionClient();
  const result = await importQuestionBankItemsForAdmin(preview.validRecords, {
    adminUserId: "admin-user-id",
    client,
    mode: "create"
  });
  const insertCall = client.calls.find(
    (call) =>
      call.table === "question_bank_items" && call.operation === "insert"
  );

  assert.equal(preview.errors.length, 0);
  assert.equal(result.source, "supabase");
  assert.equal(result.persisted, true);
  assert.equal(result.importedCount, 1);
  assert.ok(insertCall);
  assert.equal(
    client.calls.some(
      (call) =>
        call.table === "question_bank_items" && call.operation === "upsert"
    ),
    false
  );
  assert.ok(
    client.calls.every((call) => call.table === "question_bank_items")
  );
  assert.equal(
    ((insertCall.values as unknown[])[0] as { status?: unknown }).status,
    "published"
  );
  assert.equal(
    ((insertCall.values as unknown[])[0] as { updated_by?: unknown }).updated_by,
    "admin-user-id"
  );
});

test("admin import can upsert matching question ids when requested", async () => {
  const question = getAllQuestions().find((entry) => entry.type === "knowledge");
  assert.ok(question);

  const preview = previewQuestionImport(
    JSON.stringify({
      question_bank_items: [rowFromQuestion(question, "draft")]
    })
  );
  const client = new RecordingQuestionClient();
  const result = await importQuestionBankItemsForAdmin(preview.validRecords, {
    client,
    mode: "upsert"
  });

  assert.equal(result.persisted, true);
  assert.ok(
    client.calls.some(
      (call) =>
        call.table === "question_bank_items" && call.operation === "upsert"
    )
  );
  assert.ok(
    client.calls.every((call) => call.table === "question_bank_items")
  );
});

test("admin repository can create or update question_bank_items with publishing status", async () => {
  const question = getAllQuestions().find((entry) => entry.type === "knowledge");
  assert.ok(question);

  const client = new RecordingQuestionClient();
  const result = await upsertQuestionForAdmin(question, {
    adminUserId: "admin-user-id",
    client,
    status: "published"
  });
  const upsertCall = client.calls.find(
    (call) =>
      call.table === "question_bank_items" && call.operation === "upsert"
  );

  assert.equal(result.source, "supabase");
  assert.equal(result.persisted, true);
  assert.ok(upsertCall);
  assert.equal(
    (upsertCall.values as { status?: unknown }).status,
    "published"
  );
  assert.equal(
    (upsertCall.values as { created_by?: unknown }).created_by,
    "admin-user-id"
  );
  assert.equal(
    (upsertCall.values as { updated_by?: unknown }).updated_by,
    "admin-user-id"
  );
});

test("admin repository can change question publishing status", async () => {
  const client = new RecordingQuestionClient();
  const result = await setQuestionStatusForAdmin("question-id", "archived", {
    adminUserId: "admin-user-id",
    client
  });
  const updateCall = client.calls.find(
    (call) =>
      call.table === "question_bank_items" && call.operation === "update"
  );
  const idFilter = client.calls.find(
    (call) =>
      call.table === "question_bank_items" &&
      call.operation === "eq" &&
      call.column === "id"
  );

  assert.equal(result.source, "supabase");
  assert.equal(result.persisted, true);
  assert.ok(updateCall);
  assert.equal((updateCall.values as { status?: unknown }).status, "archived");
  assert.equal(
    (updateCall.values as { updated_by?: unknown }).updated_by,
    "admin-user-id"
  );
  assert.equal(
    (updateCall.values as { published_at?: unknown }).published_at,
    null
  );
  assert.equal(idFilter?.value, "question-id");
});

test("question publishing files do not reintroduce old table names or private keys", () => {
  const files = [
    "app/admin/questions/actions.ts",
    "app/admin/questions/import-export/actions.ts",
    "app/admin/questions/import-export/export/route.ts",
    "lib/db/questionRepository.ts",
    "lib/db/questionImportExport.ts",
    "src/components/admin/AdminQuestionInventory.tsx",
    "src/components/admin/QuestionImportExportPanel.tsx",
    "lib/supabase/types.ts",
    "supabase/migrations/002_question_publishing_workflow.sql"
  ];

  for (const file of files) {
    const source = readFileSync(path.join(projectRoot, file), "utf8");
    assert.doesNotMatch(
      source,
      /\.from\(["'](?:questions|mock_test_attempts|mock_test_answers)["']\)/
    );
    assert.doesNotMatch(source, /SERVICE_ROLE|service_role|SUPABASE_SERVICE/i);
  }
});

test("production question seed file exists and validates through import preview", () => {
  assert.equal(existsSync(seedPath), true);

  const seedJson = readFileSync(seedPath, "utf8");
  const seed = JSON.parse(seedJson) as {
    question_bank_items?: Array<{ question_type?: unknown; status?: unknown }>;
  };
  const preview = previewQuestionImport(seedJson);
  const questionTypes = new Set(
    preview.validRecords.map((record) => record.question_type)
  );

  assert.ok(Array.isArray(seed.question_bank_items));
  assert.equal(preview.errors.length, 0);
  assert.equal(preview.validRecords.length, seed.question_bank_items.length);
  assert.ok(preview.validRecords.length >= 18);
  assert.ok(questionTypes.has("knowledge"));
  assert.ok(questionTypes.has("map-click"));
  assert.ok(questionTypes.has("route-drawing"));
});

test("production question seed targets question_bank_items with safe draft statuses", () => {
  const seedJson = readFileSync(seedPath, "utf8");
  const seed = JSON.parse(seedJson) as Record<string, unknown>;
  const preview = previewQuestionImport(seedJson);

  assert.ok("question_bank_items" in seed);
  assert.equal("questions" in seed, false);
  assert.equal("mock_test_attempts" in seed, false);
  assert.equal("mock_test_answers" in seed, false);
  assert.ok(
    preview.validRecords.every((record) =>
      ["draft", "published", "archived"].includes(record.status ?? "draft")
    )
  );
  assert.ok(preview.validRecords.every((record) => record.status === "draft"));
  assert.ok(preview.validRecords.every((record) => record.published_at === null));
  assert.ok(
    preview.validRecords.every((record) =>
      QUESTION_TOPICS.includes(record.category as (typeof QUESTION_TOPICS)[number])
    )
  );
  assert.ok(
    new Set(preview.validRecords.map((record) => record.category)).size >= 8
  );
});

test("admin inventory supports topic, status, and difficulty organisation", () => {
  const source = readFileSync(
    path.join(projectRoot, "src/components/admin/AdminQuestionInventory.tsx"),
    "utf8"
  );

  assert.match(source, /QUESTION_TOPICS/);
  assert.match(source, /QUESTION_DIFFICULTIES/);
  assert.match(source, /statusCounts/);
  assert.match(source, /databaseOnlyRows/);
  assert.match(source, /name="topic"/);
  assert.match(source, /difficulty/);
});

test("manual seed script reuses Stage 32 validation and avoids old tables", () => {
  const source = readFileSync(
    path.join(projectRoot, "scripts/seed-question-bank.ts"),
    "utf8"
  );

  assert.match(source, /previewQuestionImport/);
  assert.match(source, /question_bank_items/);
  assert.match(source, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(source, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(source, /SUPABASE_SEED_ADMIN_EMAIL/);
  assert.match(source, /SUPABASE_SEED_ADMIN_PASSWORD/);
  assert.doesNotMatch(
    source,
    /\.from\(["'](?:questions|mock_test_attempts|mock_test_answers)["']\)/
  );
  assert.doesNotMatch(source, /SERVICE_ROLE|service_role|SUPABASE_SERVICE/i);
});

test("map-click question conversion preserves coordinates and tolerance", () => {
  const question = getAllQuestions().find(
    (entry) => entry.type === "map-click"
  );
  assert.ok(question);

  const insert = staticQuestionToDbInsert(question);
  const row: TableRow<"question_bank_items"> = {
    ...insert,
    status: insert.status ?? "draft",
    difficulty: insert.difficulty ?? null,
    category: insert.category ?? null,
    explanation: insert.explanation ?? null,
    tip: insert.tip ?? null,
    tags: insert.tags ?? [],
    source: insert.source ?? "static",
    payload: insert.payload ?? {},
    version: 1,
    created_by: null,
    updated_by: null,
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
    assert.equal(converted.tip, question.tip);
    assert.equal(
      converted.acceptedAreaDescription,
      question.acceptedAreaDescription
    );
  }
});

test("route question conversion preserves map bounds and accepted geometry", () => {
  const question = getAllQuestions().find((entry) => entry.type === "route");
  assert.ok(question);

  const insert = staticQuestionToDbInsert(question);
  const row: TableRow<"question_bank_items"> = {
    ...insert,
    status: insert.status ?? "draft",
    difficulty: insert.difficulty ?? null,
    category: insert.category ?? null,
    explanation: insert.explanation ?? null,
    tip: insert.tip ?? null,
    tags: insert.tags ?? [],
    source: insert.source ?? "static",
    payload: insert.payload ?? {},
    version: 1,
    created_by: null,
    updated_by: null,
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
    assert.equal(converted.tip, question.tip);
    assert.equal(converted.idealRouteDescription, question.idealRouteDescription);
  }
});
