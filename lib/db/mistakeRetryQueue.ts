import type { MistakeReviewType } from "../analytics/mistakeReview.ts";
import {
  LOCAL_DATABASE_STORAGE_KEYS,
  readLocalDatabaseList,
  writeLocalDatabaseList
} from "./localDatabase.ts";

export type MistakeRetryQueueItem = {
  questionId: string;
  type: MistakeReviewType;
  addedAt: string;
};

export type MistakeRetryQueueInput = {
  questionId: string;
  type: MistakeReviewType;
};

function readQueue(): MistakeRetryQueueItem[] {
  return readLocalDatabaseList<MistakeRetryQueueItem>(
    LOCAL_DATABASE_STORAGE_KEYS.mistakeRetryQueue
  ).filter(
    (item): item is MistakeRetryQueueItem =>
      item &&
      typeof item === "object" &&
      typeof item.questionId === "string" &&
      (item.type === "knowledge" ||
        item.type === "map-click" ||
        item.type === "route") &&
      typeof item.addedAt === "string"
  );
}

function writeQueue(items: MistakeRetryQueueItem[]) {
  return writeLocalDatabaseList(
    LOCAL_DATABASE_STORAGE_KEYS.mistakeRetryQueue,
    items
  );
}

export function practiceHrefForMistakeType(type: MistakeReviewType) {
  if (type === "knowledge") return "/practice/knowledge";
  if (type === "map-click") return "/practice/map-click";
  return "/practice/routes";
}

export function saveMistakeRetryQueue(
  items: MistakeRetryQueueInput[],
  addedAt = new Date().toISOString()
) {
  const deduped = new Map<string, MistakeRetryQueueItem>();

  items.forEach((item) => {
    deduped.set(`${item.type}:${item.questionId}`, {
      ...item,
      addedAt
    });
  });

  const queue = [...deduped.values()];

  return {
    persisted: writeQueue(queue),
    items: queue,
    href: queue[0] ? practiceHrefForMistakeType(queue[0].type) : "/practice"
  };
}

export function listMistakeRetryQueue(type?: MistakeReviewType) {
  const queue = readQueue();
  return type ? queue.filter((item) => item.type === type) : queue;
}

export function clearMistakeRetryQueue(type?: MistakeReviewType) {
  if (!type) return writeQueue([]);
  return writeQueue(readQueue().filter((item) => item.type !== type));
}

export function orderQuestionsByRetryQueue<T extends { id: string }>(
  questions: T[],
  type: MistakeReviewType
) {
  const queueIds = listMistakeRetryQueue(type).map((item) => item.questionId);
  if (queueIds.length === 0) return questions;

  const order = new Map(queueIds.map((id, index) => [id, index]));
  const queued = questions
    .filter((question) => order.has(question.id))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  const remaining = questions.filter((question) => !order.has(question.id));

  return [...queued, ...remaining];
}
