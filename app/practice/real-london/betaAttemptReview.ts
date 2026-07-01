import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Json } from "../../../lib/db/types.ts";
import {
  ROUTE_RUNNER_MAP_OPTIONS,
  getRealLondonPilotExerciseMetadata
} from "../../dev/route-runner/routeRunnerMaps.ts";
import type { SavedRouteAttemptListItem } from "../../dev/route-runner/routeAttemptStorage.ts";

export const BETA_ATTEMPT_REVIEW_ENABLED_FLAG = "BETA_ATTEMPT_REVIEW_ENABLED";
export const BETA_ATTEMPT_REVIEW_API_PATH = "/api/beta-attempts/review";
export const LOCAL_BETA_ATTEMPT_REVIEW_DIR = ".local";
export const LOCAL_BETA_ATTEMPT_REVIEW_FILE = "beta-attempts.jsonl";

export type BetaAttemptReviewEnv = {
  NODE_ENV?: string;
  BETA_ATTEMPT_REVIEW_ENABLED?: string;
};

export type BetaAttemptReviewStatusFilter = "pass" | "fail" | "blocked" | "unknown";
export type BetaAttemptReviewLegalityFilter = "legal" | "illegal" | "unknown";

export type BetaAttemptReviewFilters = {
  mapId?: string;
  exerciseId?: string;
  status?: string;
  legality?: string;
};

export type NormalisedBetaAttemptReviewFilters = {
  mapId: string;
  exerciseId: string;
  status: BetaAttemptReviewStatusFilter | "";
  legality: BetaAttemptReviewLegalityFilter | "";
  newestFirst: true;
};

export type BetaAttemptReviewStorageSource = "local-jsonl";

export type BetaAttemptReproExport = {
  attemptId: string;
  createdAt: string | null;
  mapId: string | null;
  mapVersion: string | null;
  exerciseId: string;
  exerciseVersion: string | null;
  attemptSnapshot: {
    versionSnapshot: unknown;
    storageSource: BetaAttemptReviewStorageSource;
    storageStatus: "stored";
  };
  routeInput: {
    matchedRoute: Json | null;
    perLegBreakdown: Json;
    rawReviewPayload: Json;
  };
  scoringResult: {
    statusLabel: SavedRouteAttemptListItem["statusLabel"];
    scoreLabel: string;
    passed: boolean | null;
    userDistanceMeters: number | null;
    shortestDistanceMeters: number | null;
    extraDistanceMeters: number | null;
    failureReason: string;
  };
  legalityResult: {
    isLegal: boolean | null;
    legalityLabel: "Legal" | "Illegal" | "Unknown";
    failureReason: string;
    illegalMovements: unknown[];
  };
  appBuildVersion: string | null;
};

export type BetaAttemptReviewRecord = {
  id: string;
  createdAt: string | null;
  mapId: string | null;
  mapVersion: string | null;
  exerciseId: string;
  exerciseVersion: string | null;
  exerciseTitle: string;
  startLabel: string;
  destinationLabel: string;
  checkpointLabels: string[];
  difficulty: string | null;
  routeType: string | null;
  statusLabel: SavedRouteAttemptListItem["statusLabel"];
  scoreLabel: string;
  passed: boolean | null;
  legalityLabel: "Legal" | "Illegal" | "Unknown";
  isLegal: boolean | null;
  failureReason: string;
  reviewTitle: string;
  routeDistanceMeters: number | null;
  routeDistanceLabel: string;
  drawnManualRouteSummary: string;
  storageSource: BetaAttemptReviewStorageSource;
  storageStatus: "stored";
  rawAttemptSnapshot: unknown;
  reproExport: BetaAttemptReproExport;
};

export type BetaAttemptReviewRejectedRecord = {
  id: string;
  storageSource: BetaAttemptReviewStorageSource;
  reasonCodes: string[];
};

export type BetaAttemptReviewReport =
  | {
      status: "available";
      storageSource: BetaAttemptReviewStorageSource;
      storageStatus: "stored";
      filters: NormalisedBetaAttemptReviewFilters;
      totalRecordsConsidered: number;
      acceptedRecordCount: number;
      rejectedRecordCount: number;
      records: BetaAttemptReviewRecord[];
      rejectedRecords: BetaAttemptReviewRejectedRecord[];
      hasReviewableAttempts: boolean;
      message: string;
    }
  | {
      status: "unavailable";
      storageSource: "none";
      storageStatus: "unavailable";
      reasonCode: "beta-attempt-review-disabled" | "production-attempt-review-unavailable";
      message: string;
      filters: NormalisedBetaAttemptReviewFilters;
      totalRecordsConsidered: 0;
      acceptedRecordCount: 0;
      rejectedRecordCount: 0;
      records: [];
      rejectedRecords: [];
      hasReviewableAttempts: false;
    }
  | {
      status: "failed";
      storageSource: BetaAttemptReviewStorageSource;
      storageStatus: "failed";
      reasonCode: "beta-attempt-review-read-failed";
      message: string;
      filters: NormalisedBetaAttemptReviewFilters;
      totalRecordsConsidered: 0;
      acceptedRecordCount: 0;
      rejectedRecordCount: 0;
      records: [];
      rejectedRecords: [];
      hasReviewableAttempts: false;
    };

type LocalBetaAttemptRecord = {
  id?: unknown;
  storedAt?: unknown;
  attempt?: unknown;
};

export async function buildBetaAttemptReviewReport(input: {
  env?: BetaAttemptReviewEnv;
  cwd?: string;
  filters?: BetaAttemptReviewFilters;
} = {}): Promise<BetaAttemptReviewReport> {
  const env = input.env ?? process.env;
  const filters = normaliseBetaAttemptReviewFilters(input.filters);

  if (!isBetaAttemptReviewEnabled(env)) {
    return unavailableAttemptReport({
      filters,
      reasonCode: "beta-attempt-review-disabled",
      message: "Beta attempt review is disabled for this environment."
    });
  }

  if (env.NODE_ENV === "production") {
    return unavailableAttemptReport({
      filters,
      reasonCode: "production-attempt-review-unavailable",
      message: "Beta attempt review is not configured for production storage."
    });
  }

  const cwd = input.cwd ?? process.cwd();
  const filePath = path.join(cwd, LOCAL_BETA_ATTEMPT_REVIEW_DIR, LOCAL_BETA_ATTEMPT_REVIEW_FILE);

  return readLocalBetaAttemptsReport({ filePath, filters });
}

export function isBetaAttemptReviewEnabled(env: BetaAttemptReviewEnv | undefined): boolean {
  const flag = env?.BETA_ATTEMPT_REVIEW_ENABLED?.trim().toLowerCase();

  return flag === "true" || flag === "enabled" || flag === "1";
}

export function normaliseBetaAttemptReviewFilters(
  filters: BetaAttemptReviewFilters | undefined
): NormalisedBetaAttemptReviewFilters {
  return {
    mapId: filters?.mapId?.trim() ?? "",
    exerciseId: filters?.exerciseId?.trim() ?? "",
    status: normaliseStatusFilter(filters?.status),
    legality: normaliseLegalityFilter(filters?.legality),
    newestFirst: true
  };
}

export function exportBetaAttemptReviewJson(records: readonly BetaAttemptReviewRecord[]): string {
  return JSON.stringify(records.map((record) => record.reproExport), null, 2);
}

async function readLocalBetaAttemptsReport(input: {
  filePath: string;
  filters: NormalisedBetaAttemptReviewFilters;
}): Promise<BetaAttemptReviewReport> {
  let raw = "";

  try {
    raw = await readFile(input.filePath, "utf8");
  } catch (error) {
    if (isMissingFileError(error)) {
      return availableAttemptReport({
        filters: input.filters,
        totalRecordsConsidered: 0,
        records: [],
        rejectedRecords: [],
        message: "No local beta attempt review records were found."
      });
    }

    return {
      status: "failed",
      storageSource: "local-jsonl",
      storageStatus: "failed",
      reasonCode: "beta-attempt-review-read-failed",
      message: "Beta attempt review records could not be read.",
      filters: input.filters,
      totalRecordsConsidered: 0,
      acceptedRecordCount: 0,
      rejectedRecordCount: 0,
      records: [],
      rejectedRecords: [],
      hasReviewableAttempts: false
    };
  }

  const parsed = parseLocalAttemptLines(raw);
  const records = parsed.records.filter((record) => recordMatchesFilters(record, input.filters));

  return availableAttemptReport({
    filters: input.filters,
    totalRecordsConsidered: parsed.totalRecordsConsidered,
    records,
    rejectedRecords: parsed.rejectedRecords,
    message:
      parsed.records.length === 0
        ? "No valid beta attempt review records were found."
        : "Loaded local beta attempt review records."
  });
}

function parseLocalAttemptLines(raw: string): {
  totalRecordsConsidered: number;
  records: BetaAttemptReviewRecord[];
  rejectedRecords: BetaAttemptReviewRejectedRecord[];
} {
  const records: BetaAttemptReviewRecord[] = [];
  const rejectedRecords: BetaAttemptReviewRejectedRecord[] = [];
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);

  lines.forEach((line, index) => {
    let parsed: unknown;

    try {
      parsed = JSON.parse(line);
    } catch {
      rejectedRecords.push({
        id: `line-${index + 1}`,
        storageSource: "local-jsonl",
        reasonCodes: ["invalid-jsonl-record"]
      });
      return;
    }

    const record = normaliseLocalAttemptRecord(parsed as LocalBetaAttemptRecord, index);

    if ("record" in record) {
      records.push(record.record);
    } else {
      rejectedRecords.push(record.rejectedRecord);
    }
  });

  return {
    totalRecordsConsidered: lines.length,
    records: records.sort((left, right) => compareNewestFirst(left.createdAt, right.createdAt, left.id, right.id)),
    rejectedRecords
  };
}

function normaliseLocalAttemptRecord(
  value: LocalBetaAttemptRecord,
  index: number
):
  | { record: BetaAttemptReviewRecord }
  | { rejectedRecord: BetaAttemptReviewRejectedRecord } {
  const wrapper = objectValue(value);
  const attempt = objectValue(wrapper.attempt ?? value);
  const id = stringValue(attempt.id) || stringValue(wrapper.id) || `line-${index + 1}`;
  const exerciseId = stringValue(attempt.exerciseId);

  if (!exerciseId) {
    return {
      rejectedRecord: {
        id,
        storageSource: "local-jsonl",
        reasonCodes: ["invalid-attempt-record"]
      }
    };
  }

  const reviewPayload = toJson(attempt.reviewPayload, {});
  const reviewObject = objectValue(reviewPayload);
  const context = exerciseContext({
    mapId: stringOrNull(attempt.mapId),
    exerciseId
  });
  const isLegal = booleanOrNull(attempt.isLegal);
  const statusLabel = normaliseStatusLabel(attempt.statusLabel, booleanOrNull(attempt.passed));
  const legalityLabel = legalityDisplayLabel(isLegal);
  const matchedRoute = toJsonOrNull(attempt.matchedRoute);
  const perLegBreakdown = toJson(attempt.perLegBreakdown, []);
  const failureReason = stringValue(attempt.failureReason) || stringValue(reviewObject.suggestedFailureReason) || "None";
  const routeDistanceMeters = numberOrNull(attempt.userDistanceMeters);
  const routeDistanceLabel = stringValue(attempt.userDistanceLabel) || formatDistance(routeDistanceMeters);
  const rawAttemptSnapshot = value;
  const appBuildVersion = stringOrNull(reviewObject.appBuildVersion);

  const recordBase = {
    id,
    createdAt: stringOrNull(attempt.createdAt) ?? stringOrNull(wrapper.storedAt),
    mapId: stringOrNull(attempt.mapId),
    mapVersion: stringOrNull(attempt.mapVersion),
    exerciseId,
    exerciseVersion: stringOrNull(attempt.exerciseVersion),
    exerciseTitle: context.exerciseTitle || stringValue(attempt.exerciseLabel, exerciseId),
    startLabel: context.startLabel,
    destinationLabel: context.destinationLabel,
    checkpointLabels: context.checkpointLabels,
    difficulty: context.difficulty,
    routeType: context.routeType,
    statusLabel,
    scoreLabel: stringValue(attempt.scoreLabel, "n/a"),
    passed: booleanOrNull(attempt.passed),
    legalityLabel,
    isLegal,
    failureReason,
    reviewTitle: stringValue(attempt.reviewTitle) || stringValue(reviewObject.title, "Saved route attempt"),
    routeDistanceMeters,
    routeDistanceLabel,
    drawnManualRouteSummary: buildDrawnManualRouteSummary(matchedRoute),
    storageSource: "local-jsonl" as const,
    storageStatus: "stored" as const,
    rawAttemptSnapshot
  };

  return {
    record: {
      ...recordBase,
      reproExport: {
        attemptId: id,
        createdAt: recordBase.createdAt,
        mapId: recordBase.mapId,
        mapVersion: recordBase.mapVersion,
        exerciseId,
        exerciseVersion: recordBase.exerciseVersion,
        attemptSnapshot: {
          versionSnapshot: reviewObject.versionSnapshot ?? null,
          storageSource: "local-jsonl",
          storageStatus: "stored"
        },
        routeInput: {
          matchedRoute,
          perLegBreakdown,
          rawReviewPayload: reviewPayload
        },
        scoringResult: {
          statusLabel,
          scoreLabel: recordBase.scoreLabel,
          passed: recordBase.passed,
          userDistanceMeters: routeDistanceMeters,
          shortestDistanceMeters: numberOrNull(attempt.shortestDistanceMeters),
          extraDistanceMeters: numberOrNull(attempt.extraDistanceMeters),
          failureReason
        },
        legalityResult: {
          isLegal,
          legalityLabel,
          failureReason,
          illegalMovements: arrayValue(reviewObject.illegalMovements)
        },
        appBuildVersion
      }
    }
  };
}

function exerciseContext(input: {
  mapId: string | null;
  exerciseId: string;
}): {
  exerciseTitle: string;
  startLabel: string;
  destinationLabel: string;
  checkpointLabels: string[];
  difficulty: string | null;
  routeType: string | null;
} {
  const options = ROUTE_RUNNER_MAP_OPTIONS.filter((option) => !input.mapId || option.id === input.mapId);
  const exercise = options.flatMap((option) => option.exercises).find((candidate) => candidate.id === input.exerciseId);
  const stops = exercise?.stops ?? [];
  const metadata = exercise ? getRealLondonPilotExerciseMetadata(exercise) : null;
  const labels = stops.map(stopLabel);

  return {
    exerciseTitle: exercise?.title ?? "",
    startLabel: labels[0] ?? "Start unavailable",
    destinationLabel: labels[labels.length - 1] ?? "Destination unavailable",
    checkpointLabels: labels.slice(1, -1),
    difficulty: exercise?.difficulty ?? metadata?.difficulty ?? null,
    routeType: metadata?.routeType ?? null
  };
}

function availableAttemptReport(input: {
  filters: NormalisedBetaAttemptReviewFilters;
  totalRecordsConsidered: number;
  records: BetaAttemptReviewRecord[];
  rejectedRecords: BetaAttemptReviewRejectedRecord[];
  message: string;
}): BetaAttemptReviewReport {
  return {
    status: "available",
    storageSource: "local-jsonl",
    storageStatus: "stored",
    filters: input.filters,
    totalRecordsConsidered: input.totalRecordsConsidered,
    acceptedRecordCount: input.records.length,
    rejectedRecordCount: input.rejectedRecords.length,
    records: input.records,
    rejectedRecords: input.rejectedRecords,
    hasReviewableAttempts: input.records.length > 0,
    message: input.message
  };
}

function unavailableAttemptReport(input: {
  filters: NormalisedBetaAttemptReviewFilters;
  reasonCode: Extract<BetaAttemptReviewReport, { status: "unavailable" }>["reasonCode"];
  message: string;
}): BetaAttemptReviewReport {
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
    hasReviewableAttempts: false
  };
}

function recordMatchesFilters(record: BetaAttemptReviewRecord, filters: NormalisedBetaAttemptReviewFilters): boolean {
  if (filters.mapId && record.mapId !== filters.mapId) {
    return false;
  }

  if (filters.exerciseId && record.exerciseId !== filters.exerciseId) {
    return false;
  }

  if (filters.status && statusFilterValue(record.statusLabel) !== filters.status) {
    return false;
  }

  if (filters.legality && legalityFilterValue(record.isLegal) !== filters.legality) {
    return false;
  }

  return true;
}

function buildDrawnManualRouteSummary(matchedRoute: Json | null): string {
  const route = objectValue(matchedRoute);
  const roadCount = stringArray(route.selectedRoadIds).length || stringArray(route.orderedRoadIds).length;
  const nodeCount = stringArray(route.selectedNodeIds).length;
  const edgeCount = stringArray(route.directedEdgeIds).length;

  if (roadCount === 0 && nodeCount === 0 && edgeCount === 0) {
    return "No compact route geometry was stored.";
  }

  return [
    roadCount > 0 ? `${roadCount} road${roadCount === 1 ? "" : "s"}` : null,
    nodeCount > 0 ? `${nodeCount} node${nodeCount === 1 ? "" : "s"}` : null,
    edgeCount > 0 ? `${edgeCount} directed edge${edgeCount === 1 ? "" : "s"}` : null
  ]
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

function stopLabel(stop: { type: string; nodeId?: string; landmarkId?: string }): string {
  if (stop.type === "node" && stop.nodeId) {
    return stop.nodeId;
  }

  if (stop.type === "landmark" && stop.landmarkId) {
    return stop.landmarkId;
  }

  return "unknown stop";
}

function normaliseStatusFilter(value: string | undefined): NormalisedBetaAttemptReviewFilters["status"] {
  const status = value?.trim().toLowerCase() ?? "";

  return status === "pass" || status === "fail" || status === "blocked" || status === "unknown" ? status : "";
}

function normaliseLegalityFilter(value: string | undefined): NormalisedBetaAttemptReviewFilters["legality"] {
  const legality = value?.trim().toLowerCase() ?? "";

  return legality === "legal" || legality === "illegal" || legality === "unknown" ? legality : "";
}

function statusFilterValue(status: SavedRouteAttemptListItem["statusLabel"]): BetaAttemptReviewStatusFilter {
  return status.toLowerCase() as BetaAttemptReviewStatusFilter;
}

function legalityFilterValue(value: boolean | null): BetaAttemptReviewLegalityFilter {
  if (value === true) {
    return "legal";
  }

  if (value === false) {
    return "illegal";
  }

  return "unknown";
}

function normaliseStatusLabel(value: unknown, passed: boolean | null): SavedRouteAttemptListItem["statusLabel"] {
  if (value === "Pass" || value === "Fail" || value === "Blocked" || value === "Unknown") {
    return value;
  }

  if (passed === true) {
    return "Pass";
  }

  if (passed === false) {
    return "Fail";
  }

  return "Unknown";
}

function legalityDisplayLabel(value: boolean | null): "Legal" | "Illegal" | "Unknown" {
  if (value === true) {
    return "Legal";
  }

  if (value === false) {
    return "Illegal";
  }

  return "Unknown";
}

function compareNewestFirst(leftDate: string | null, rightDate: string | null, leftId: string, rightId: string): number {
  const dateDifference = timestamp(rightDate) - timestamp(leftDate);

  return dateDifference || leftId.localeCompare(rightId);
}

function timestamp(value: string | null): number {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const time = Date.parse(value);

  return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY;
}

function formatDistance(distance: number | null): string {
  if (distance === null) {
    return "n/a";
  }

  return Math.abs(distance) >= 1000 ? `${(distance / 1000).toFixed(2)} km` : `${Math.round(distance)} m`;
}

function isMissingFileError(error: unknown): boolean {
  return objectValue(error).code === "ENOENT";
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toJson(value: unknown, fallback: Json): Json {
  if (typeof value === "undefined") {
    return fallback;
  }

  return JSON.parse(JSON.stringify(value)) as Json;
}

function toJsonOrNull(value: unknown): Json | null {
  if (typeof value === "undefined" || value === null) {
    return null;
  }

  return toJson(value, null);
}
