import {
  mistakeReviewKey,
  type MistakeReviewType
} from "../analytics/mistakeReview.ts";
import {
  LOCAL_DATABASE_STORAGE_KEYS,
  readLocalDatabaseList,
  writeLocalDatabaseList
} from "./localDatabase.ts";

export type ReviewedMistakeRecord = {
  key: string;
  questionId: string;
  type: MistakeReviewType;
  reviewedAt: string;
};

function readReviewedRecords(): ReviewedMistakeRecord[] {
  return readLocalDatabaseList<ReviewedMistakeRecord>(
    LOCAL_DATABASE_STORAGE_KEYS.reviewedMistakes
  ).filter(
    (record): record is ReviewedMistakeRecord =>
      record &&
      typeof record === "object" &&
      typeof record.key === "string" &&
      typeof record.questionId === "string" &&
      (record.type === "knowledge" ||
        record.type === "map-click" ||
        record.type === "route") &&
      typeof record.reviewedAt === "string"
  );
}

function writeReviewedRecords(records: ReviewedMistakeRecord[]) {
  return writeLocalDatabaseList(
    LOCAL_DATABASE_STORAGE_KEYS.reviewedMistakes,
    records
  );
}

export function listReviewedMistakes() {
  return readReviewedRecords();
}

export function listReviewedMistakeKeys() {
  return readReviewedRecords().map((record) => record.key);
}

export function isMistakeReviewed(type: MistakeReviewType, questionId: string) {
  const key = mistakeReviewKey(type, questionId);
  return readReviewedRecords().some((record) => record.key === key);
}

export function markMistakeReviewed({
  questionId,
  type,
  reviewedAt = new Date().toISOString()
}: {
  questionId: string;
  type: MistakeReviewType;
  reviewedAt?: string;
}) {
  const key = mistakeReviewKey(type, questionId);
  const records = readReviewedRecords();
  const nextRecord: ReviewedMistakeRecord = {
    key,
    questionId,
    type,
    reviewedAt
  };
  const nextRecords = [
    nextRecord,
    ...records.filter((record) => record.key !== key)
  ];

  return writeReviewedRecords(nextRecords);
}

export function clearReviewedMistake(type: MistakeReviewType, questionId: string) {
  const key = mistakeReviewKey(type, questionId);
  return writeReviewedRecords(
    readReviewedRecords().filter((record) => record.key !== key)
  );
}
