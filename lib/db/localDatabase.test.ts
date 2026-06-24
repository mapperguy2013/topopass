import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  clearLocalDatabase,
  CURRENT_LOCAL_DATABASE_SCHEMA_VERSION,
  exportLocalDatabaseSnapshot,
  importLocalDatabaseSnapshot,
  LOCAL_DATABASE_STORAGE_KEYS,
  migrateLocalDatabase,
  readLocalDatabaseSnapshot
} from "./localDatabase.ts";
import {
  listLocalPracticeAttempts,
  saveLocalPracticeAttempt
} from "./localPersistence.ts";

class MemoryStorage implements Storage {
  store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  key(index: number) {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

function installMemoryStorage() {
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storage }
  });

  return storage;
}

const validPracticeAttempt = {
  id: "practice-1",
  userId: "local-user",
  practiceMode: "knowledge",
  questionId: "knowledge-cardinal-direction",
  questionType: "knowledge",
  score: 1,
  maxScore: 1,
  passed: true,
  createdAt: "2026-06-23T09:00:00.000Z"
};

const validMockAttempt = {
  id: "mock-1",
  userId: "local-user",
  questionIds: ["knowledge-cardinal-direction"],
  answers: {},
  createdAt: "2026-06-23T09:00:00.000Z",
  submittedAt: "2026-06-23T09:01:00.000Z",
  durationSeconds: 60
};

beforeEach(() => {
  installMemoryStorage();
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "localStorage");
  Reflect.deleteProperty(globalThis, "window");
});

test("localDatabase reads an empty database safely", () => {
  const snapshot = readLocalDatabaseSnapshot();

  assert.equal(snapshot.schemaVersion, CURRENT_LOCAL_DATABASE_SCHEMA_VERSION);
  assert.deepEqual(snapshot.practiceAttempts, []);
  assert.deepEqual(snapshot.mockAttempts, []);
  assert.deepEqual(snapshot.mistakeReviewState.reviewedMistakes, []);
  assert.deepEqual(snapshot.mistakeRetryQueue, []);
});

test("localDatabase migrates old unversioned storage and drops malformed records", () => {
  localStorage.setItem(
    LOCAL_DATABASE_STORAGE_KEYS.practiceAttempts,
    JSON.stringify([validPracticeAttempt, null, { id: "missing-date" }])
  );
  localStorage.setItem(
    LOCAL_DATABASE_STORAGE_KEYS.mockAttempts,
    JSON.stringify([validMockAttempt, { id: "bad-mock", createdAt: "bad" }])
  );

  const snapshot = migrateLocalDatabase();

  assert.equal(snapshot.practiceAttempts.length, 1);
  assert.equal(snapshot.mockAttempts.length, 1);
  assert.equal(
    localStorage.getItem(LOCAL_DATABASE_STORAGE_KEYS.schemaVersion),
    String(CURRENT_LOCAL_DATABASE_SCHEMA_VERSION)
  );
});

test("localDatabase handles corrupted JSON without throwing", () => {
  localStorage.setItem(LOCAL_DATABASE_STORAGE_KEYS.practiceAttempts, "{bad-json");

  const snapshot = readLocalDatabaseSnapshot();

  assert.deepEqual(snapshot.practiceAttempts, []);
  assert.ok(
    [...(localStorage as MemoryStorage).store.keys()].some((key) =>
      key.startsWith(`${LOCAL_DATABASE_STORAGE_KEYS.practiceAttempts}.corrupt.`)
    )
  );
});

test("localDatabase exports the current snapshot with exportedAt", () => {
  localStorage.setItem(
    LOCAL_DATABASE_STORAGE_KEYS.practiceAttempts,
    JSON.stringify([validPracticeAttempt])
  );

  const exported = exportLocalDatabaseSnapshot();

  assert.equal(exported.practiceAttempts.length, 1);
  assert.equal(typeof exported.exportedAt, "string");
});

test("localDatabase imports a valid snapshot and rejects invalid JSON", () => {
  const validImport = JSON.stringify({
    schemaVersion: CURRENT_LOCAL_DATABASE_SCHEMA_VERSION,
    practiceAttempts: [validPracticeAttempt],
    mockAttempts: [validMockAttempt],
    mistakeReviewState: {
      reviewedMistakes: [
        {
          key: "knowledge:knowledge-cardinal-direction",
          questionId: "knowledge-cardinal-direction",
          type: "knowledge",
          reviewedAt: "2026-06-23T09:00:00.000Z"
        }
      ]
    },
    mistakeRetryQueue: [
      {
        questionId: "knowledge-cardinal-direction",
        type: "knowledge",
        addedAt: "2026-06-23T09:00:00.000Z"
      }
    ]
  });

  const result = importLocalDatabaseSnapshot(validImport);
  const invalid = importLocalDatabaseSnapshot("{bad-json");

  assert.equal(result.ok, true);
  assert.equal(readLocalDatabaseSnapshot().practiceAttempts.length, 1);
  assert.equal(invalid.ok, false);
});

test("localDatabase rejects non TopoPass import shapes", () => {
  const result = importLocalDatabaseSnapshot(JSON.stringify({ hello: "world" }));

  assert.equal(result.ok, false);
});

test("localDatabase clears all progress keys", () => {
  localStorage.setItem(
    LOCAL_DATABASE_STORAGE_KEYS.practiceAttempts,
    JSON.stringify([validPracticeAttempt])
  );
  localStorage.setItem(
    LOCAL_DATABASE_STORAGE_KEYS.reviewedMistakes,
    JSON.stringify([])
  );

  assert.equal(clearLocalDatabase(), true);
  assert.equal(localStorage.getItem(LOCAL_DATABASE_STORAGE_KEYS.practiceAttempts), null);
  assert.equal(localStorage.getItem(LOCAL_DATABASE_STORAGE_KEYS.reviewedMistakes), null);
});

test("local repositories remain compatible after local database migration", () => {
  migrateLocalDatabase();
  const saved = saveLocalPracticeAttempt({
    userId: "local-user",
    practiceMode: "knowledge",
    questionId: "knowledge-cardinal-direction",
    questionType: "knowledge",
    score: 1,
    maxScore: 1,
    passed: true
  });

  assert.ok(saved?.id);
  assert.equal(listLocalPracticeAttempts().length, 1);
});
