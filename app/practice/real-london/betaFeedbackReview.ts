import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_BETA_FEEDBACK_TABLE,
  LOCAL_BETA_FEEDBACK_DIR,
  LOCAL_BETA_FEEDBACK_FILE,
  getSupabaseBetaFeedbackConfig,
  type BetaFeedbackStoreEnv,
  type SupabaseBetaFeedbackConfig
} from "./betaFeedbackStore.ts";
import {
  validateRealLondonBetaFeedbackSubmissionPayload,
  type RealLondonBetaFeedbackPayload
} from "./realLondonBetaFeedback.ts";

export const BETA_FEEDBACK_REVIEW_ENABLED_FLAG = "BETA_FEEDBACK_REVIEW_ENABLED";
export const BETA_FEEDBACK_REVIEW_API_PATH = "/api/beta-feedback/review";

export type BetaFeedbackReviewEnv = BetaFeedbackStoreEnv & {
  BETA_FEEDBACK_REVIEW_ENABLED?: string;
};

export type BetaFeedbackReviewStorageSource = "local-jsonl" | "supabase-rest";

export type BetaFeedbackReviewFilters = {
  mapId?: string;
  exerciseId?: string;
  rating?: number;
  feedbackType?: string;
};

export type BetaFeedbackReviewRecord = {
  id: string;
  createdAt: string;
  mapId: string;
  exerciseId: string;
  rating: number;
  feedbackType: string;
  feedbackText: string;
  mapVersion: string;
  exerciseVersion: string;
  exerciseTitle: string;
  appBuildVersion: string | null;
  storageSource: BetaFeedbackReviewStorageSource;
  storageStatus: "stored";
  rawPayload: RealLondonBetaFeedbackPayload;
};

export type BetaFeedbackReviewRejectedRecord = {
  id: string;
  storageSource: BetaFeedbackReviewStorageSource;
  reasonCodes: string[];
};

export type BetaFeedbackReviewReport =
  | {
      status: "available";
      storageSource: BetaFeedbackReviewStorageSource;
      storageStatus: "stored";
      filters: Required<BetaFeedbackReviewFilters> & { newestFirst: true };
      totalRecordsConsidered: number;
      acceptedRecordCount: number;
      rejectedRecordCount: number;
      records: BetaFeedbackReviewRecord[];
      rejectedRecords: BetaFeedbackReviewRejectedRecord[];
      hasReviewableFeedback: boolean;
    }
  | {
      status: "unavailable";
      storageSource: "none";
      storageStatus: "unavailable";
      reasonCode:
        | "beta-feedback-review-disabled"
        | "production-store-not-configured"
        | "unsupported-production-feedback-storage";
      message: string;
      filters: Required<BetaFeedbackReviewFilters> & { newestFirst: true };
      totalRecordsConsidered: 0;
      acceptedRecordCount: 0;
      rejectedRecordCount: 0;
      records: [];
      rejectedRecords: [];
      hasReviewableFeedback: false;
    }
  | {
      status: "failed";
      storageSource: BetaFeedbackReviewStorageSource;
      storageStatus: "failed";
      reasonCode: "feedback-review-read-failed";
      message: string;
      filters: Required<BetaFeedbackReviewFilters> & { newestFirst: true };
      totalRecordsConsidered: 0;
      acceptedRecordCount: 0;
      rejectedRecordCount: 0;
      records: [];
      rejectedRecords: [];
      hasReviewableFeedback: false;
    };

export type BetaFeedbackReviewFetch = (
  input: string,
  init: {
    method: "GET";
    headers: Record<string, string>;
  }
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text?: () => Promise<string>;
}>;

type LocalJsonlStoredFeedbackRecord = {
  submissionId?: unknown;
  storedAt?: unknown;
  payload?: unknown;
};

type SupabaseStoredFeedbackRecord = {
  id?: unknown;
  created_at?: unknown;
  payload?: unknown;
  map_id?: unknown;
  exercise_id?: unknown;
  rating?: unknown;
  feedback_type?: unknown;
};

type RawStoredFeedbackRecord = {
  id: string;
  createdAt: string;
  payload: unknown;
  storageSource: BetaFeedbackReviewStorageSource;
};

export async function buildBetaFeedbackReviewReport(input: {
  env?: BetaFeedbackReviewEnv;
  cwd?: string;
  filters?: BetaFeedbackReviewFilters;
  fetcher?: BetaFeedbackReviewFetch;
} = {}): Promise<BetaFeedbackReviewReport> {
  const env = input.env ?? process.env;
  const filters = normaliseBetaFeedbackReviewFilters(input.filters);

  if (!isBetaFeedbackReviewEnabled(env)) {
    return unavailableReviewReport({
      filters,
      reasonCode: "beta-feedback-review-disabled",
      message: "Beta feedback review is disabled for this environment."
    });
  }

  if (env.NODE_ENV === "production") {
    const config = getSupabaseBetaFeedbackConfig(env);

    if (config.status !== "configured") {
      return unavailableReviewReport({
        filters,
        reasonCode: config.reasonCode,
        message:
          config.status === "unsupported"
            ? "Beta feedback review storage is configured with an unsupported production backend."
            : "Beta feedback review storage is not configured for this production environment."
      });
    }

    return readSupabaseFeedbackReport({
      config,
      filters,
      fetcher: input.fetcher
    });
  }

  const cwd = input.cwd ?? process.cwd();
  const filePath = path.join(cwd, LOCAL_BETA_FEEDBACK_DIR, LOCAL_BETA_FEEDBACK_FILE);

  return readLocalJsonlFeedbackReport({ filePath, filters });
}

export function isBetaFeedbackReviewEnabled(env: BetaFeedbackReviewEnv | undefined): boolean {
  const value = env?.BETA_FEEDBACK_REVIEW_ENABLED?.trim().toLowerCase() ?? "";

  return ["1", "true", "yes", "on", "enabled"].includes(value);
}

export function normaliseBetaFeedbackReviewFilters(
  filters: BetaFeedbackReviewFilters | undefined
): Required<BetaFeedbackReviewFilters> & { newestFirst: true } {
  const rating = filters?.rating;

  return {
    mapId: filters?.mapId?.trim() ?? "",
    exerciseId: filters?.exerciseId?.trim() ?? "",
    rating: typeof rating === "number" && Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : 0,
    feedbackType: filters?.feedbackType?.trim() ?? "",
    newestFirst: true
  };
}

export function exportBetaFeedbackReviewCsv(records: BetaFeedbackReviewRecord[]): string {
  const headers = [
    "createdAt",
    "mapId",
    "exerciseId",
    "rating",
    "feedbackType",
    "feedbackText",
    "mapVersion",
    "exerciseVersion",
    "exerciseTitle",
    "appBuildVersion",
    "storageSource",
    "storageStatus",
    "recordId"
  ];
  const rows = records.map((record) => [
    record.createdAt,
    record.mapId,
    record.exerciseId,
    String(record.rating),
    record.feedbackType,
    record.feedbackText,
    record.mapVersion,
    record.exerciseVersion,
    record.exerciseTitle,
    record.appBuildVersion ?? "",
    record.storageSource,
    record.storageStatus,
    record.id
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

export function exportBetaFeedbackReviewJson(records: BetaFeedbackReviewRecord[]): string {
  return JSON.stringify(
    records.map((record) => ({
      id: record.id,
      createdAt: record.createdAt,
      mapId: record.mapId,
      exerciseId: record.exerciseId,
      rating: record.rating,
      feedbackType: record.feedbackType,
      feedbackText: record.feedbackText,
      mapVersion: record.mapVersion,
      exerciseVersion: record.exerciseVersion,
      exerciseTitle: record.exerciseTitle,
      appBuildVersion: record.appBuildVersion,
      storageSource: record.storageSource,
      storageStatus: record.storageStatus,
      rawPayload: record.rawPayload
    })),
    null,
    2
  );
}

async function readLocalJsonlFeedbackReport(input: {
  filePath: string;
  filters: Required<BetaFeedbackReviewFilters> & { newestFirst: true };
}): Promise<BetaFeedbackReviewReport> {
  let contents = "";

  try {
    contents = await readFile(input.filePath, "utf8");
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return availableReviewReport({
        filters: input.filters,
        records: [],
        rejectedRecords: [],
        storageSource: "local-jsonl"
      });
    }

    return failedReviewReport({
      filters: input.filters,
      storageSource: "local-jsonl",
      message: "Local beta feedback review storage could not be read."
    });
  }

  const rawRecords: RawStoredFeedbackRecord[] = [];
  const rejectedRecords: BetaFeedbackReviewRejectedRecord[] = [];
  const lines = contents.split(/\r?\n/).filter((line) => line.trim().length > 0);

  for (const [index, line] of lines.entries()) {
    try {
      const record = JSON.parse(line) as LocalJsonlStoredFeedbackRecord;
      const id = typeof record.submissionId === "string" && record.submissionId ? record.submissionId : `line-${index + 1}`;
      const createdAt = typeof record.storedAt === "string" ? record.storedAt : "";

      rawRecords.push({
        id,
        createdAt,
        payload: record.payload,
        storageSource: "local-jsonl"
      });
    } catch {
      rejectedRecords.push({
        id: `line-${index + 1}`,
        storageSource: "local-jsonl",
        reasonCodes: ["invalid-jsonl-record"]
      });
    }
  }

  return buildAvailableReportFromRawRecords({
    rawRecords,
    rejectedRecords,
    filters: input.filters,
    storageSource: "local-jsonl"
  });
}

async function readSupabaseFeedbackReport(input: {
  config: Extract<SupabaseBetaFeedbackConfig, { status: "configured" }>;
  filters: Required<BetaFeedbackReviewFilters> & { newestFirst: true };
  fetcher?: BetaFeedbackReviewFetch;
}): Promise<BetaFeedbackReviewReport> {
  const endpoint = `${input.config.url}/rest/v1/${input.config.table || DEFAULT_BETA_FEEDBACK_TABLE}?select=id,created_at,payload,map_id,exercise_id,rating,feedback_type&order=created_at.desc`;
  const fetcher: BetaFeedbackReviewFetch =
    input.fetcher ??
    ((url, init) =>
      fetch(url, {
        method: init.method,
        headers: init.headers
      }));

  try {
    const response = await fetcher(endpoint, {
      method: "GET",
      headers: {
        apikey: input.config.serviceRoleKey,
        Authorization: `Bearer ${input.config.serviceRoleKey}`,
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      await response.text?.().catch(() => "");

      return failedReviewReport({
        filters: input.filters,
        storageSource: "supabase-rest",
        message: "Production beta feedback review storage could not be read."
      });
    }

    const rows = await response.json();

    if (!Array.isArray(rows)) {
      return failedReviewReport({
        filters: input.filters,
        storageSource: "supabase-rest",
        message: "Production beta feedback review storage returned an invalid response."
      });
    }

    const rawRecords = rows.map((row, index) => normaliseSupabaseRow(row as SupabaseStoredFeedbackRecord, index));

    return buildAvailableReportFromRawRecords({
      rawRecords,
      rejectedRecords: [],
      filters: input.filters,
      storageSource: "supabase-rest"
    });
  } catch {
    return failedReviewReport({
      filters: input.filters,
      storageSource: "supabase-rest",
      message: "Production beta feedback review storage could not be reached."
    });
  }
}

function buildAvailableReportFromRawRecords(input: {
  rawRecords: RawStoredFeedbackRecord[];
  rejectedRecords: BetaFeedbackReviewRejectedRecord[];
  filters: Required<BetaFeedbackReviewFilters> & { newestFirst: true };
  storageSource: BetaFeedbackReviewStorageSource;
}): BetaFeedbackReviewReport {
  const records: BetaFeedbackReviewRecord[] = [];
  const rejectedRecords = [...input.rejectedRecords];

  for (const rawRecord of input.rawRecords) {
    const validation = validateRealLondonBetaFeedbackSubmissionPayload(rawRecord.payload);

    if (!validation.isValid) {
      rejectedRecords.push({
        id: rawRecord.id,
        storageSource: rawRecord.storageSource,
        reasonCodes: validation.errors.map((error) => error.code)
      });
      continue;
    }

    records.push(toReviewRecord(rawRecord, validation.payload));
  }

  const filteredRecords = records.filter((record) => matchesReviewFilters(record, input.filters));

  return availableReviewReport({
    filters: input.filters,
    records: sortReviewRecords(filteredRecords),
    rejectedRecords,
    totalRecordsConsidered: input.rawRecords.length + input.rejectedRecords.length,
    storageSource: input.storageSource
  });
}

function toReviewRecord(
  rawRecord: RawStoredFeedbackRecord,
  payload: RealLondonBetaFeedbackPayload
): BetaFeedbackReviewRecord {
  const metadataExtras = payload.metadata as Record<string, unknown>;
  const appBuildVersion =
    firstStringValue(metadataExtras.appVersion, metadataExtras.buildVersion, metadataExtras.version) ?? null;

  return {
    id: rawRecord.id,
    createdAt: rawRecord.createdAt || payload.metadata.timestamp,
    mapId: payload.metadata.mapId,
    exerciseId: payload.metadata.exerciseId,
    rating: payload.rating,
    feedbackType: payload.issueType,
    feedbackText: payload.comments,
    mapVersion: payload.metadata.mapVersion,
    exerciseVersion: payload.metadata.exerciseVersion,
    exerciseTitle: payload.metadata.exerciseTitle,
    appBuildVersion,
    storageSource: rawRecord.storageSource,
    storageStatus: "stored",
    rawPayload: payload
  };
}

function normaliseSupabaseRow(row: SupabaseStoredFeedbackRecord, index: number): RawStoredFeedbackRecord {
  return {
    id: typeof row.id === "string" && row.id ? row.id : `supabase-row-${index + 1}`,
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    payload: row.payload,
    storageSource: "supabase-rest"
  };
}

function matchesReviewFilters(
  record: BetaFeedbackReviewRecord,
  filters: Required<BetaFeedbackReviewFilters> & { newestFirst: true }
): boolean {
  return (
    (!filters.mapId || record.mapId === filters.mapId) &&
    (!filters.exerciseId || record.exerciseId === filters.exerciseId) &&
    (!filters.rating || record.rating === filters.rating) &&
    (!filters.feedbackType || record.feedbackType === filters.feedbackType)
  );
}

function sortReviewRecords(records: BetaFeedbackReviewRecord[]): BetaFeedbackReviewRecord[] {
  return [...records].sort((left, right) => {
    const timeDifference = Date.parse(right.createdAt) - Date.parse(left.createdAt);

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return left.id.localeCompare(right.id);
  });
}

function availableReviewReport(input: {
  filters: Required<BetaFeedbackReviewFilters> & { newestFirst: true };
  records: BetaFeedbackReviewRecord[];
  rejectedRecords: BetaFeedbackReviewRejectedRecord[];
  storageSource: BetaFeedbackReviewStorageSource;
  totalRecordsConsidered?: number;
}): BetaFeedbackReviewReport {
  return {
    status: "available",
    storageSource: input.storageSource,
    storageStatus: "stored",
    filters: input.filters,
    totalRecordsConsidered: input.totalRecordsConsidered ?? input.records.length + input.rejectedRecords.length,
    acceptedRecordCount: input.records.length,
    rejectedRecordCount: input.rejectedRecords.length,
    records: input.records,
    rejectedRecords: input.rejectedRecords,
    hasReviewableFeedback: input.records.length > 0
  };
}

function unavailableReviewReport(input: {
  filters: Required<BetaFeedbackReviewFilters> & { newestFirst: true };
  reasonCode: Extract<BetaFeedbackReviewReport, { status: "unavailable" }>["reasonCode"];
  message: string;
}): BetaFeedbackReviewReport {
  return {
    status: "unavailable",
    storageSource: "none",
    storageStatus: "unavailable",
    reasonCode: input.reasonCode,
    message: input.message,
    filters: input.filters,
    totalRecordsConsidered: 0,
    acceptedRecordCount: 0,
    rejectedRecordCount: 0,
    records: [],
    rejectedRecords: [],
    hasReviewableFeedback: false
  };
}

function failedReviewReport(input: {
  filters: Required<BetaFeedbackReviewFilters> & { newestFirst: true };
  storageSource: BetaFeedbackReviewStorageSource;
  message: string;
}): BetaFeedbackReviewReport {
  return {
    status: "failed",
    storageSource: input.storageSource,
    storageStatus: "failed",
    reasonCode: "feedback-review-read-failed",
    message: input.message,
    filters: input.filters,
    totalRecordsConsidered: 0,
    acceptedRecordCount: 0,
    rejectedRecordCount: 0,
    records: [],
    rejectedRecords: [],
    hasReviewableFeedback: false
  };
}

function escapeCsvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function isFileNotFoundError(error: unknown): boolean {
  return !!error && typeof error === "object" && "code" in error && error.code === "ENOENT";
}

function firstStringValue(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}
