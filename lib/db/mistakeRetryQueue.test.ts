import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  clearMistakeRetryQueue,
  listMistakeRetryQueue,
  orderQuestionsByRetryQueue,
  saveMistakeRetryQueue
} from "./mistakeRetryQueue.ts";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    }
  };
}

beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: createMemoryStorage()
  });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "localStorage");
});

test("mistakeRetryQueue stores deduped retry items and returns the first practice href", () => {
  const result = saveMistakeRetryQueue(
    [
      { questionId: "route-1", type: "route" },
      { questionId: "route-1", type: "route" },
      { questionId: "knowledge-1", type: "knowledge" }
    ],
    "2026-06-23T09:00:00.000Z"
  );

  assert.equal(result.persisted, true);
  assert.equal(result.href, "/practice/routes");
  assert.deepEqual(
    listMistakeRetryQueue().map((item) => `${item.type}:${item.questionId}`),
    ["route:route-1", "knowledge:knowledge-1"]
  );
});

test("mistakeRetryQueue orders matching practice questions first", () => {
  saveMistakeRetryQueue(
    [
      { questionId: "q3", type: "knowledge" },
      { questionId: "q1", type: "knowledge" }
    ],
    "2026-06-23T09:00:00.000Z"
  );

  const ordered = orderQuestionsByRetryQueue(
    [{ id: "q1" }, { id: "q2" }, { id: "q3" }],
    "knowledge"
  );

  assert.deepEqual(
    ordered.map((question) => question.id),
    ["q3", "q1", "q2"]
  );
});

test("mistakeRetryQueue can clear only one question type", () => {
  saveMistakeRetryQueue(
    [
      { questionId: "q1", type: "knowledge" },
      { questionId: "q2", type: "map-click" }
    ],
    "2026-06-23T09:00:00.000Z"
  );

  assert.equal(clearMistakeRetryQueue("knowledge"), true);
  assert.deepEqual(
    listMistakeRetryQueue().map((item) => `${item.type}:${item.questionId}`),
    ["map-click:q2"]
  );
});
