import type { MistakeReviewType } from "../analytics/mistakeReview.ts";

export const CURRENT_LOCAL_DATABASE_SCHEMA_VERSION = 1;

export const LOCAL_DATABASE_STORAGE_KEYS = {
  schemaVersion: "topopass.local-db.schema-version.v1",
  practiceAttempts: "topopass.practice-attempts.v1",
  mockAttempts: "topopass.mock-attempts.v1",
  progressSummary: "topopass.progress-summary.v1",
  reviewedMistakes: "topopass.reviewed-mistakes.v1",
  mistakeRetryQueue: "topopass.mistake-retry-queue.v1"
} as const;

export type LocalDatabasePracticeAttempt = Record<string, unknown> & {
  id: string;
  createdAt: string;
};

export type LocalDatabaseMockAttempt = Record<string, unknown> & {
  id: string;
  createdAt: string;
  submittedAt: string;
};

export type LocalDatabaseReviewedMistake = {
  key: string;
  questionId: string;
  type: MistakeReviewType;
  reviewedAt: string;
};

export type LocalDatabaseRetryQueueItem = {
  questionId: string;
  type: MistakeReviewType;
  addedAt: string;
};

export type LocalDatabaseSnapshot = {
  schemaVersion: number;
  practiceAttempts: LocalDatabasePracticeAttempt[];
  mockAttempts: LocalDatabaseMockAttempt[];
  progressSummary: Record<string, unknown> | null;
  mistakeReviewState: {
    reviewedMistakes: LocalDatabaseReviewedMistake[];
  };
  mistakeRetryQueue: LocalDatabaseRetryQueueItem[];
  exportedAt?: string;
};

export type LocalDatabaseImportResult =
  | {
      ok: true;
      snapshot: LocalDatabaseSnapshot;
    }
  | {
      ok: false;
      error: string;
    };

export const emptyLocalDatabaseSnapshot: LocalDatabaseSnapshot = {
  schemaVersion: CURRENT_LOCAL_DATABASE_SCHEMA_VERSION,
  practiceAttempts: [],
  mockAttempts: [],
  progressSummary: null,
  mistakeReviewState: {
    reviewedMistakes: []
  },
  mistakeRetryQueue: []
};

export function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== "undefined") return window.localStorage;
    if (typeof globalThis.localStorage !== "undefined") {
      return globalThis.localStorage;
    }
  } catch {
    return null;
  }

  return null;
}

export function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidDate(value: unknown) {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function isMistakeType(value: unknown): value is MistakeReviewType {
  return value === "knowledge" || value === "map-click" || value === "route";
}

function safeReadJson(key: string) {
  const storage = getLocalStorage();
  if (!storage) return undefined;

  const raw = storage.getItem(key);
  if (!raw) return undefined;

  try {
    return JSON.parse(raw);
  } catch {
    const backupKey = `${key}.corrupt.${Date.now()}`;
    try {
      storage.setItem(backupKey, raw);
      storage.removeItem(key);
    } catch {
      // If backup fails, still return a safe value.
    }
    return undefined;
  }
}

function safeWriteJson(key: string, value: unknown) {
  const storage = getLocalStorage();
  if (!storage) return false;

  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function sanitizePracticeAttempts(value: unknown): LocalDatabasePracticeAttempt[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (attempt): attempt is LocalDatabasePracticeAttempt =>
      isObject(attempt) &&
      typeof attempt.id === "string" &&
      isValidDate(attempt.createdAt)
  );
}

function sanitizeMockAttempts(value: unknown): LocalDatabaseMockAttempt[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (attempt): attempt is LocalDatabaseMockAttempt =>
      isObject(attempt) &&
      typeof attempt.id === "string" &&
      isValidDate(attempt.createdAt) &&
      isValidDate(attempt.submittedAt)
  );
}

function sanitizeReviewedMistakes(value: unknown): LocalDatabaseReviewedMistake[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (record): record is LocalDatabaseReviewedMistake =>
      isObject(record) &&
      typeof record.key === "string" &&
      typeof record.questionId === "string" &&
      isMistakeType(record.type) &&
      isValidDate(record.reviewedAt)
  );
}

function sanitizeRetryQueue(value: unknown): LocalDatabaseRetryQueueItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is LocalDatabaseRetryQueueItem =>
      isObject(item) &&
      typeof item.questionId === "string" &&
      isMistakeType(item.type) &&
      isValidDate(item.addedAt)
  );
}

function sanitizeProgressSummary(value: unknown) {
  return isObject(value) ? value : null;
}

function sanitizeSnapshot(value: unknown): LocalDatabaseSnapshot {
  const input = isObject(value) ? value : {};
  const mistakeReviewState = isObject(input.mistakeReviewState)
    ? input.mistakeReviewState
    : {};

  return {
    schemaVersion: CURRENT_LOCAL_DATABASE_SCHEMA_VERSION,
    practiceAttempts: sanitizePracticeAttempts(input.practiceAttempts),
    mockAttempts: sanitizeMockAttempts(input.mockAttempts),
    progressSummary: sanitizeProgressSummary(input.progressSummary),
    mistakeReviewState: {
      reviewedMistakes: sanitizeReviewedMistakes(
        mistakeReviewState.reviewedMistakes ?? input.reviewedMistakes
      )
    },
    mistakeRetryQueue: sanitizeRetryQueue(input.mistakeRetryQueue),
    exportedAt: typeof input.exportedAt === "string" ? input.exportedAt : undefined
  };
}

function hasImportableShape(value: unknown) {
  if (!isObject(value)) return false;
  return (
    "schemaVersion" in value ||
    "practiceAttempts" in value ||
    "mockAttempts" in value ||
    "progressSummary" in value ||
    "mistakeReviewState" in value ||
    "mistakeRetryQueue" in value ||
    "reviewedMistakes" in value
  );
}

export function writeLocalDatabaseSnapshot(snapshot: LocalDatabaseSnapshot) {
  const sanitized = sanitizeSnapshot(snapshot);

  const wrotePractice = safeWriteJson(
    LOCAL_DATABASE_STORAGE_KEYS.practiceAttempts,
    sanitized.practiceAttempts
  );
  const wroteMock = safeWriteJson(
    LOCAL_DATABASE_STORAGE_KEYS.mockAttempts,
    sanitized.mockAttempts
  );
  const wroteSummary = safeWriteJson(
    LOCAL_DATABASE_STORAGE_KEYS.progressSummary,
    sanitized.progressSummary
  );
  const wroteReviewed = safeWriteJson(
    LOCAL_DATABASE_STORAGE_KEYS.reviewedMistakes,
    sanitized.mistakeReviewState.reviewedMistakes
  );
  const wroteRetry = safeWriteJson(
    LOCAL_DATABASE_STORAGE_KEYS.mistakeRetryQueue,
    sanitized.mistakeRetryQueue
  );
  const wroteVersion = safeWriteJson(
    LOCAL_DATABASE_STORAGE_KEYS.schemaVersion,
    CURRENT_LOCAL_DATABASE_SCHEMA_VERSION
  );

  return (
    wrotePractice &&
    wroteMock &&
    wroteSummary &&
    wroteReviewed &&
    wroteRetry &&
    wroteVersion
  );
}

export function readLocalDatabaseSnapshot({
  migrate = true
}: { migrate?: boolean } = {}): LocalDatabaseSnapshot {
  const snapshot = sanitizeSnapshot({
    schemaVersion: safeReadJson(LOCAL_DATABASE_STORAGE_KEYS.schemaVersion),
    practiceAttempts: safeReadJson(LOCAL_DATABASE_STORAGE_KEYS.practiceAttempts),
    mockAttempts: safeReadJson(LOCAL_DATABASE_STORAGE_KEYS.mockAttempts),
    progressSummary: safeReadJson(LOCAL_DATABASE_STORAGE_KEYS.progressSummary),
    reviewedMistakes: safeReadJson(LOCAL_DATABASE_STORAGE_KEYS.reviewedMistakes),
    mistakeRetryQueue: safeReadJson(LOCAL_DATABASE_STORAGE_KEYS.mistakeRetryQueue)
  });

  if (migrate) writeLocalDatabaseSnapshot(snapshot);
  return snapshot;
}

export function migrateLocalDatabase() {
  return readLocalDatabaseSnapshot({ migrate: true });
}

export function exportLocalDatabaseSnapshot(): LocalDatabaseSnapshot {
  return {
    ...readLocalDatabaseSnapshot(),
    exportedAt: new Date().toISOString()
  };
}

export function importLocalDatabaseSnapshot(input: string | unknown) {
  let parsed: unknown = input;

  if (typeof input === "string") {
    try {
      parsed = JSON.parse(input);
    } catch {
      return {
        ok: false,
        error: "Import JSON could not be parsed."
      } satisfies LocalDatabaseImportResult;
    }
  }

  if (!hasImportableShape(parsed)) {
    return {
      ok: false,
      error: "Import JSON is not a TopoPass progress snapshot."
    } satisfies LocalDatabaseImportResult;
  }

  const snapshot = sanitizeSnapshot(parsed);
  const persisted = writeLocalDatabaseSnapshot(snapshot);

  if (!persisted) {
    return {
      ok: false,
      error: "Progress snapshot could not be saved in this browser."
    } satisfies LocalDatabaseImportResult;
  }

  return {
    ok: true,
    snapshot
  } satisfies LocalDatabaseImportResult;
}

export function clearLocalDatabase() {
  const storage = getLocalStorage();
  if (!storage) return false;

  Object.values(LOCAL_DATABASE_STORAGE_KEYS).forEach((key) => {
    storage.removeItem(key);
  });

  return true;
}

export function readLocalDatabaseList<T>(key: string): T[] {
  const value = safeReadJson(key);
  return Array.isArray(value) ? (value as T[]) : [];
}

export function writeLocalDatabaseList<T>(key: string, records: T[]) {
  safeWriteJson(LOCAL_DATABASE_STORAGE_KEYS.schemaVersion, CURRENT_LOCAL_DATABASE_SCHEMA_VERSION);
  return safeWriteJson(key, records);
}
