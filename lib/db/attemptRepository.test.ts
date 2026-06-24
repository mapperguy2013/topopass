import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  listMockAttempts,
  saveMockAttempt,
  loadMockAttempt
} from "./mockAttemptRepository.ts";
import {
  listPracticeAttempts,
  savePracticeAttempt
} from "./practiceAttemptRepository.ts";
import { getUserProgressSummary } from "./progressRepository.ts";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "../..");

class MemoryStorage {
  store = new Map<string, string>();

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }
}

type RecordedDbCall = {
  table: string;
  operation: "eq" | "insert" | "select" | "upsert";
  column?: string;
  value?: unknown;
  values?: unknown;
};

class RecordingQuery {
  private readonly table: string;
  private readonly calls: RecordedDbCall[];
  private values: unknown;

  constructor(table: string, calls: RecordedDbCall[]) {
    this.table = table;
    this.calls = calls;
  }

  insert(values: unknown) {
    this.values = values;
    this.calls.push({ table: this.table, operation: "insert", values });
    return this;
  }

  upsert(values: unknown) {
    this.values = values;
    this.calls.push({ table: this.table, operation: "upsert", values });
    return this;
  }

  select() {
    this.calls.push({ table: this.table, operation: "select" });
    return this;
  }

  eq() {
    return this;
  }

  order() {
    return this;
  }

  single<T = unknown>() {
    const id =
      this.values &&
      typeof this.values === "object" &&
      !Array.isArray(this.values) &&
      typeof (this.values as { id?: unknown }).id === "string"
        ? (this.values as { id: string }).id
        : `${this.table}-id`;

    return Promise.resolve({
      data: { id } as T,
      error: null
    });
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown; error: null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return Promise.resolve({ data: null, error: null }).then(
      onfulfilled,
      onrejected
    );
  }
}

class RecordingClient {
  calls: RecordedDbCall[] = [];
  auth = {
    getUser: async () => ({
      data: {
        user: {
          id: "11111111-1111-4111-8111-111111111111"
        }
      },
      error: null
    })
  };

  from(table: string) {
    return new RecordingQuery(table, this.calls);
  }
}

class RejectingQuery {
  private readonly table: string;
  private readonly calls: RecordedDbCall[];

  constructor(table: string, calls: RecordedDbCall[]) {
    this.table = table;
    this.calls = calls;
  }

  insert(values: unknown) {
    this.calls.push({ table: this.table, operation: "insert", values });
    return this;
  }

  select() {
    this.calls.push({ table: this.table, operation: "select" });
    return this;
  }

  single<T = unknown>() {
    return Promise.resolve({
      data: null as T | null,
      error: { message: `${this.table} insert rejected` }
    });
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?:
      | ((value: {
          data: unknown;
          error: { message: string };
        }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return Promise.resolve({
      data: null,
      error: { message: `${this.table} insert rejected` }
    }).then(onfulfilled, onrejected);
  }
}

class RejectingClient {
  calls: RecordedDbCall[] = [];
  auth = {
    getUser: async () => ({
      data: {
        user: {
          id: "11111111-1111-4111-8111-111111111111"
        }
      },
      error: null
    })
  };

  from(table: string) {
    return new RejectingQuery(table, this.calls);
  }
}

class ProgressQuery {
  private readonly rows: unknown[];
  private readonly filters: Array<{ column: string; value: unknown }> = [];

  constructor(rows: unknown[]) {
    this.rows = rows;
  }

  select() {
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value });
    return this;
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown[]; error: null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    const data = this.rows.filter((row) =>
      this.filters.every(
        ({ column, value }) =>
          row &&
          typeof row === "object" &&
          !Array.isArray(row) &&
          (row as Record<string, unknown>)[column] === value
      )
    );

    return Promise.resolve({ data, error: null }).then(onfulfilled, onrejected);
  }
}

class ProgressSummaryClient {
  private readonly rowsByTable: Record<string, unknown[]>;

  constructor(rowsByTable: Record<string, unknown[]>) {
    this.rowsByTable = rowsByTable;
  }

  from(table: string) {
    return new ProgressQuery(this.rowsByTable[table] ?? []);
  }
}

class ScopedListQuery {
  private readonly filters: Array<{ column: string; value: unknown }> = [];
  private readonly table: string;
  private readonly calls: RecordedDbCall[];
  private readonly rows: unknown[];

  constructor(
    table: string,
    calls: RecordedDbCall[],
    rows: unknown[]
  ) {
    this.table = table;
    this.calls = calls;
    this.rows = rows;
  }

  select() {
    this.calls.push({ table: this.table, operation: "select" });
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value });
    this.calls.push({ table: this.table, operation: "eq", column, value });
    return this;
  }

  order() {
    return this;
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown[]; error: null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    const data = this.rows.filter((row) =>
      this.filters.every(
        ({ column, value }) =>
          row &&
          typeof row === "object" &&
          !Array.isArray(row) &&
          (row as Record<string, unknown>)[column] === value
      )
    );

    return Promise.resolve({ data, error: null }).then(onfulfilled, onrejected);
  }
}

class ScopedListClient {
  calls: RecordedDbCall[] = [];
  private readonly authUserId: string | null;
  private readonly rowsByTable: Record<string, unknown[]>;

  constructor(
    authUserId: string | null,
    rowsByTable: Record<string, unknown[]>
  ) {
    this.authUserId = authUserId;
    this.rowsByTable = rowsByTable;
  }

  auth = {
    getUser: async () => ({
      data: {
        user: this.authUserId ? { id: this.authUserId } : null
      },
      error: null
    })
  };

  from(table: string) {
    return new ScopedListQuery(
      table,
      this.calls,
      this.rowsByTable[table] ?? []
    );
  }
}

function installMemoryStorage() {
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: storage
    }
  });

  return storage;
}

test("mock attempt repository uses local fallback when Supabase is unavailable", async () => {
  const saveResult = await saveMockAttempt(
    {
      userId: "00000000-0000-0000-0000-000000000001",
      questionIds: ["knowledge-cardinal-direction"],
      answers: {}
    },
    { client: null }
  );
  const loadResult = await loadMockAttempt("attempt-id", { client: null });

  assert.equal(saveResult.source, "local-storage");
  assert.equal(saveResult.persisted, false);
  assert.equal(loadResult.source, "local-storage");
  assert.equal(loadResult.attempt, null);
});

test("practice attempts use local fallback without Supabase", async () => {
  const result = await savePracticeAttempt(
    {
      userId: "00000000-0000-0000-0000-000000000001",
      practiceMode: "route-drawing",
      questionId: "kings-cross-to-euston",
      questionType: "route-drawing"
    },
    { client: null }
  );

  assert.equal(result.source, "local-storage");
  assert.equal(result.persisted, false);
});

test("progress repository returns empty summary without Supabase", async () => {
  const result = await getUserProgressSummary(
    "00000000-0000-0000-0000-000000000001",
    { client: null }
  );

  assert.equal(result.source, "local-storage");
  assert.equal(result.progress.mockAttempts, 0);
  assert.equal(result.progress.practiceAttempts, 0);
  assert.equal(result.progress.averageMockPercentage, null);
});

test("local fallback persists attempts when browser storage is available", async () => {
  installMemoryStorage();

  const practiceResult = await savePracticeAttempt(
    {
      userId: "00000000-0000-0000-0000-000000000001",
      practiceMode: "knowledge",
      questionId: "knowledge-cardinal-direction",
      questionType: "knowledge",
      score: 1,
      maxScore: 1,
      passed: true
    },
    { client: null }
  );
  const mockResult = await saveMockAttempt(
    {
      id: "local-mock-attempt",
      userId: "00000000-0000-0000-0000-000000000001",
      questionIds: ["knowledge-cardinal-direction"],
      answers: {},
      result: {
        totalQuestions: 1,
        answeredQuestions: 1,
        passedQuestions: 1,
        score: 1,
        maxScore: 1,
        percentage: 100,
        passPercentage: 70,
        passed: true,
        breakdown: {
          knowledge: {
            type: "knowledge",
            total: 1,
            answered: 1,
            passed: 1,
            score: 1,
            maxScore: 1,
            percentage: 100
          },
          "map-click": {
            type: "map-click",
            total: 0,
            answered: 0,
            passed: 0,
            score: 0,
            maxScore: 0,
            percentage: 0
          },
          "route-drawing": {
            type: "route-drawing",
            total: 0,
            answered: 0,
            passed: 0,
            score: 0,
            maxScore: 0,
            percentage: 0
          }
        },
        questionResults: []
      }
    },
    { client: null }
  );
  const progress = await getUserProgressSummary(
    "00000000-0000-0000-0000-000000000001",
    { client: null }
  );
  const loadedMock = await loadMockAttempt("local-mock-attempt", {
    client: null
  });

  assert.equal(practiceResult.persisted, true);
  assert.equal(mockResult.persisted, true);
  assert.equal(progress.progress.practiceAttempts, 1);
  assert.equal(progress.progress.mockAttempts, 1);
  assert.equal(progress.progress.averageScore, 100);
  assert.equal(progress.progress.mockPassRate, 100);
  assert.equal(loadedMock.attempt?.id, "local-mock-attempt");

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: undefined
  });
});

test("failed Supabase writes preserve local practice and mock progress", async () => {
  installMemoryStorage();
  const client = new RejectingClient();

  const practiceResult = await savePracticeAttempt(
    {
      userId: "00000000-0000-0000-0000-000000000001",
      practiceMode: "knowledge",
      questionId: "knowledge-cardinal-direction",
      questionType: "knowledge",
      score: 1,
      maxScore: 1,
      passed: true
    },
    { client }
  );
  const mockResult = await saveMockAttempt(
    {
      id: "local-after-supabase-failure",
      userId: "00000000-0000-0000-0000-000000000001",
      questionIds: ["knowledge-cardinal-direction"],
      answers: {},
      result: {
        totalQuestions: 1,
        answeredQuestions: 1,
        passedQuestions: 1,
        score: 1,
        maxScore: 1,
        percentage: 100,
        passPercentage: 70,
        passed: true,
        breakdown: {
          knowledge: {
            type: "knowledge",
            total: 1,
            answered: 1,
            passed: 1,
            score: 1,
            maxScore: 1,
            percentage: 100
          },
          "map-click": {
            type: "map-click",
            total: 0,
            answered: 0,
            passed: 0,
            score: 0,
            maxScore: 0,
            percentage: 0
          },
          "route-drawing": {
            type: "route-drawing",
            total: 0,
            answered: 0,
            passed: 0,
            score: 0,
            maxScore: 0,
            percentage: 0
          }
        },
        questionResults: []
      }
    },
    { client }
  );
  const progress = await getUserProgressSummary(
    "00000000-0000-0000-0000-000000000001",
    { client: null }
  );

  assert.equal(practiceResult.source, "local-storage");
  assert.equal(practiceResult.persisted, true);
  assert.match(practiceResult.reason ?? "", /localStorage/);
  assert.equal(mockResult.source, "local-storage");
  assert.equal(mockResult.persisted, true);
  assert.match(mockResult.reason ?? "", /localStorage/);
  assert.equal(progress.progress.practiceAttempts, 1);
  assert.equal(progress.progress.mockAttempts, 1);
  assert.ok(
    client.calls.some(
      (call) =>
        call.table === "practice_attempts" && call.operation === "insert"
    )
  );
  assert.ok(
    client.calls.some(
      (call) => call.table === "mock_attempts" && call.operation === "insert"
    )
  );

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: undefined
  });
});

test("practice repository writes Stage 27 parent and question attempt rows", async () => {
  const client = new RecordingClient();
  const result = await savePracticeAttempt(
    {
      userId: "00000000-0000-0000-0000-000000000001",
      practiceMode: "knowledge",
      questionId: "knowledge-cardinal-direction",
      questionType: "knowledge",
      answer: { selectedAnswer: "North" },
      score: 1,
      maxScore: 1,
      passed: true
    },
    { client }
  );
  const practiceInsert = client.calls.find(
    (call) => call.table === "practice_attempts" && call.operation === "insert"
  );
  const questionInsert = client.calls.find(
    (call) => call.table === "question_attempts" && call.operation === "insert"
  );

  assert.equal(result.source, "supabase");
  assert.ok(practiceInsert);
  assert.ok(questionInsert);
  assert.equal(
    (practiceInsert.values as { question_id?: unknown }).question_id,
    undefined
  );
  assert.equal(
    (practiceInsert.values as { question_type?: unknown }).question_type,
    undefined
  );
  assert.equal(
    (questionInsert.values as { question_id?: unknown }).question_id,
    "knowledge-cardinal-direction"
  );
  assert.equal(
    (questionInsert.values as { user_id?: unknown }).user_id,
    "11111111-1111-4111-8111-111111111111"
  );
});

test("mock repository writes Stage 27 parent and mock question rows", async () => {
  const client = new RecordingClient();
  const result = await saveMockAttempt(
    {
      id: "mock-stage-29",
      userId: "00000000-0000-0000-0000-000000000001",
      questionIds: ["knowledge-cardinal-direction"],
      answers: {
        "knowledge-cardinal-direction": {
          type: "knowledge",
          selectedAnswer: "North"
        }
      },
      mode: "practice",
      result: {
        totalQuestions: 1,
        answeredQuestions: 1,
        passedQuestions: 1,
        score: 1,
        maxScore: 1,
        percentage: 100,
        passPercentage: 70,
        passed: true,
        breakdown: {
          knowledge: {
            type: "knowledge",
            total: 1,
            answered: 1,
            passed: 1,
            score: 1,
            maxScore: 1,
            percentage: 100
          },
          "map-click": {
            type: "map-click",
            total: 0,
            answered: 0,
            passed: 0,
            score: 0,
            maxScore: 0,
            percentage: 0
          },
          "route-drawing": {
            type: "route-drawing",
            total: 0,
            answered: 0,
            passed: 0,
            score: 0,
            maxScore: 0,
            percentage: 0
          }
        },
        questionResults: [
          {
            questionId: "knowledge-cardinal-direction",
            type: "knowledge",
            answered: true,
            passed: true,
            score: 1,
            maxScore: 1,
            percentage: 100,
            userAnswerSummary: "North",
            acceptedAnswerSummary: "North",
            details: {
              type: "knowledge",
              selectedAnswer: "North",
              correctAnswer: "North"
            }
          }
        ]
      }
    },
    { client }
  );
  const mockInsert = client.calls.find(
    (call) => call.table === "mock_attempts" && call.operation === "insert"
  );
  const questionInsert = client.calls.find(
    (call) =>
      call.table === "mock_question_attempts" && call.operation === "insert"
  );

  assert.equal(result.source, "supabase");
  assert.ok(mockInsert);
  assert.ok(questionInsert);
  assert.equal(
    (mockInsert.values as { user_id?: unknown }).user_id,
    "11111111-1111-4111-8111-111111111111"
  );
  assert.equal(
    ((questionInsert.values as unknown[])[0] as { question_id?: unknown })
      .question_id,
    "knowledge-cardinal-direction"
  );
  assert.equal(
    ((questionInsert.values as unknown[])[0] as { mock_attempt_id?: unknown })
      .mock_attempt_id,
    "mock-stage-29"
  );
});

test("account progress summary reads Supabase practice and mock data safely", async () => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: undefined
  });
  const userId = "11111111-1111-4111-8111-111111111111";
  const client = new ProgressSummaryClient({
    mock_attempts: [
      {
        user_id: userId,
        score: 7,
        max_score: 10,
        percentage: 70,
        passed: true,
        submitted_at: "2026-06-23T09:30:00.000Z",
        created_at: "2026-06-23T09:00:00.000Z"
      },
      {
        user_id: userId,
        score: 8,
        max_score: 10,
        percentage: 80,
        passed: false,
        submitted_at: "2026-06-24T10:30:00.000Z",
        created_at: "2026-06-24T10:00:00.000Z"
      }
    ],
    practice_attempts: [
      {
        user_id: userId,
        practice_mode: "route-drawing",
        score: 4,
        max_score: 5,
        percentage: 80,
        created_at: "2026-06-24T11:00:00.000Z"
      },
      {
        user_id: userId,
        practice_mode: "knowledge",
        score: 1,
        max_score: 1,
        percentage: 100,
        created_at: "2026-06-24T12:00:00.000Z"
      }
    ]
  });

  const summary = await getUserProgressSummary(userId, { client });

  assert.equal(summary.source, "supabase");
  assert.equal(summary.progress.mockAttempts, 2);
  assert.equal(summary.progress.practiceAttempts, 2);
  assert.equal(summary.progress.averageMockPercentage, 75);
  assert.equal(summary.progress.mockPassRate, 50);
  assert.equal(summary.progress.routePracticeAttempts, 1);
  assert.equal(summary.progress.latestMockScore?.percentage, 80);
  assert.equal(summary.progress.latestAttemptAt, "2026-06-24T12:00:00.000Z");
});

test("authenticated practice reads are scoped to the current Supabase user", async () => {
  const userA = "11111111-1111-4111-8111-111111111111";
  const userB = "22222222-2222-4222-8222-222222222222";
  const client = new ScopedListClient(userA, {
    practice_attempts: [
      {
        user_id: userA,
        practice_mode: "knowledge",
        created_at: "2026-06-24T10:00:00.000Z",
        question_attempts: [
          {
            user_id: userA,
            question_id: "a-question",
            question_type: "knowledge",
            score: 1,
            max_score: 1,
            passed: true,
            answer: { selectedAnswer: "A" },
            result: { correctAnswer: "A" },
            created_at: "2026-06-24T10:00:00.000Z"
          }
        ]
      },
      {
        user_id: userB,
        practice_mode: "knowledge",
        created_at: "2026-06-24T11:00:00.000Z",
        question_attempts: [
          {
            user_id: userB,
            question_id: "b-question",
            question_type: "knowledge",
            score: 0,
            max_score: 1,
            passed: false,
            answer: { selectedAnswer: "B" },
            result: { correctAnswer: "A" },
            created_at: "2026-06-24T11:00:00.000Z"
          }
        ]
      }
    ]
  });

  const result = await listPracticeAttempts(userB, { client });

  assert.equal(result.source, "supabase");
  assert.deepEqual(
    result.attempts.map((attempt) => attempt.questionId),
    ["a-question"]
  );
  assert.ok(
    client.calls.some(
      (call) =>
        call.table === "practice_attempts" &&
        call.operation === "eq" &&
        call.column === "user_id" &&
        call.value === userA
    )
  );
});

test("authenticated mock reads are scoped to the current Supabase user", async () => {
  const userA = "11111111-1111-4111-8111-111111111111";
  const userB = "22222222-2222-4222-8222-222222222222";
  const client = new ScopedListClient(userA, {
    mock_attempts: [
      {
        id: "mock-a",
        user_id: userA,
        score: 1,
        max_score: 1,
        percentage: 100,
        passed: true,
        submitted_at: "2026-06-24T10:00:00.000Z",
        created_at: "2026-06-24T10:00:00.000Z",
        result: { questionResults: [] }
      },
      {
        id: "mock-b",
        user_id: userB,
        score: 0,
        max_score: 1,
        percentage: 0,
        passed: false,
        submitted_at: "2026-06-24T11:00:00.000Z",
        created_at: "2026-06-24T11:00:00.000Z",
        result: { questionResults: [] }
      }
    ]
  });

  const result = await listMockAttempts(userB, { client });

  assert.equal(result.source, "supabase");
  assert.deepEqual(
    result.attempts.map((attempt) => attempt.id),
    ["mock-a"]
  );
  assert.ok(
    client.calls.some(
      (call) =>
        call.table === "mock_attempts" &&
        call.operation === "eq" &&
        call.column === "user_id" &&
        call.value === userA
    )
  );
});

test("signed-in Supabase reads stay separate from signed-out local progress", async () => {
  installMemoryStorage();
  await savePracticeAttempt(
    {
      userId: "00000000-0000-0000-0000-000000000001",
      practiceMode: "knowledge",
      questionId: "local-question",
      questionType: "knowledge",
      score: 1,
      maxScore: 1,
      passed: true
    },
    { client: null }
  );
  const client = new ScopedListClient(
    "11111111-1111-4111-8111-111111111111",
    {
      practice_attempts: []
    }
  );

  const result = await listPracticeAttempts(
    "00000000-0000-0000-0000-000000000001",
    { client }
  );

  assert.equal(result.source, "supabase");
  assert.deepEqual(result.attempts, []);

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: undefined
  });
});

test("progress repositories no longer target old mock table names", () => {
  const files = [
    "lib/db/mockAttemptRepository.ts",
    "lib/db/progressRepository.ts",
    "lib/db/practiceAttemptRepository.ts"
  ];

  for (const file of files) {
    const source = readFileSync(path.join(projectRoot, file), "utf8");
    assert.doesNotMatch(source, /mock_test_attempts|mock_test_answers/);
  }
});
