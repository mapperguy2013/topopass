import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  clearReviewedMistake,
  isMistakeReviewed,
  listReviewedMistakeKeys,
  markMistakeReviewed
} from "./mistakeReviewRepository.ts";

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

test("mistakeReviewRepository persists reviewed status locally", () => {
  const saved = markMistakeReviewed({
    questionId: "knowledge-1",
    type: "knowledge",
    reviewedAt: "2026-06-23T09:00:00.000Z"
  });

  assert.equal(saved, true);
  assert.equal(isMistakeReviewed("knowledge", "knowledge-1"), true);
  assert.deepEqual(listReviewedMistakeKeys(), ["knowledge:knowledge-1"]);
});

test("mistakeReviewRepository clears reviewed status", () => {
  markMistakeReviewed({
    questionId: "map-1",
    type: "map-click",
    reviewedAt: "2026-06-23T09:00:00.000Z"
  });

  assert.equal(clearReviewedMistake("map-click", "map-1"), true);
  assert.equal(isMistakeReviewed("map-click", "map-1"), false);
});
