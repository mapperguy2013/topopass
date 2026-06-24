import type { MockAttemptRecord } from "./mockAttemptRepository.ts";
import type { PracticeAttemptRecord } from "./practiceAttemptRepository.ts";
import {
  createLocalId,
  LOCAL_DATABASE_STORAGE_KEYS,
  readLocalDatabaseList,
  writeLocalDatabaseList
} from "./localDatabase.ts";

export const LOCAL_LEARNER_ID = "00000000-0000-0000-0000-000000000001";

export type StoredPracticeAttempt = PracticeAttemptRecord & {
  id: string;
  createdAt: string;
};

export type StoredMockAttempt = MockAttemptRecord & {
  id: string;
  createdAt: string;
  submittedAt: string;
  durationSeconds?: number | null;
};

export function saveLocalPracticeAttempt(
  attempt: PracticeAttemptRecord
): StoredPracticeAttempt | null {
  const storedAttempt: StoredPracticeAttempt = {
    ...attempt,
    id: createLocalId("practice"),
    createdAt: new Date().toISOString()
  };
  const attempts = readLocalDatabaseList<StoredPracticeAttempt>(
    LOCAL_DATABASE_STORAGE_KEYS.practiceAttempts
  );

  return writeLocalDatabaseList(LOCAL_DATABASE_STORAGE_KEYS.practiceAttempts, [
    storedAttempt,
    ...attempts
  ])
    ? storedAttempt
    : null;
}

export function listLocalPracticeAttempts() {
  return readLocalDatabaseList<StoredPracticeAttempt>(
    LOCAL_DATABASE_STORAGE_KEYS.practiceAttempts
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveLocalMockAttempt(
  attempt: MockAttemptRecord & { durationSeconds?: number | null }
): StoredMockAttempt | null {
  const now = new Date().toISOString();
  const storedAttempt: StoredMockAttempt = {
    ...attempt,
    id: attempt.id ?? createLocalId("mock"),
    createdAt: now,
    submittedAt: now,
    durationSeconds: attempt.durationSeconds ?? null
  };
  const attempts = readLocalDatabaseList<StoredMockAttempt>(
    LOCAL_DATABASE_STORAGE_KEYS.mockAttempts
  );
  const nextAttempts = [
    storedAttempt,
    ...attempts.filter((existing) => existing.id !== storedAttempt.id)
  ];

  return writeLocalDatabaseList(LOCAL_DATABASE_STORAGE_KEYS.mockAttempts, nextAttempts)
    ? storedAttempt
    : null;
}

export function listLocalMockAttempts() {
  return readLocalDatabaseList<StoredMockAttempt>(
    LOCAL_DATABASE_STORAGE_KEYS.mockAttempts
  ).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}
