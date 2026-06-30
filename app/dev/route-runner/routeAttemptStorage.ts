import type { Json, TableInsert, TableRow } from "../../../lib/db/types.ts";
import { asPersistenceClient, type PersistenceClient } from "../../../lib/db/queryClient.ts";
import { getSupabaseClient } from "../../../lib/supabaseClient.ts";
import type { RouteAttemptReview } from "./routeAttemptReview.ts";

export const ROUTE_ATTEMPT_REVIEW_SCHEMA_VERSION = 1;
export const LOCAL_ROUTE_ATTEMPTS_STORAGE_KEY = "topopass.devRouteRunner.routeAttempts";

export type RouteAttemptStorageScore = {
  scorePercent?: number | null;
  passed?: boolean | null;
  isLegal?: boolean | null;
  userRouteDistanceMeters?: number | null;
  shortestLegalRouteDistanceMeters?: number | null;
  failureReasons?: readonly string[];
  legBreakdown?: unknown;
};

export type SaveRouteAttemptInput = {
  userId?: string | null;
  exerciseId: string;
  mapId?: string | null;
  mapVersion?: string | number | null;
  exerciseVersion?: string | number | null;
  review: RouteAttemptReview;
  score?: RouteAttemptStorageScore | null;
  matchedRoute?: unknown;
};

export type SaveRouteAttemptResult = {
  source: "supabase" | "local" | "not-configured";
  persisted: boolean;
  id?: string;
  reason?: string;
  error?: string;
};

export type ListRouteAttemptsInput = {
  userId?: string | null;
  exerciseId?: string;
  limit?: number;
};

export type SavedRouteAttemptListItem = {
  id: string;
  exerciseId: string;
  exerciseLabel: string;
  mapId: string | null;
  mapVersion: string | null;
  exerciseVersion: string | null;
  createdAt: string | null;
  dateLabel: string;
  scoreLabel: string;
  statusLabel: "Pass" | "Fail" | "Blocked" | "Unknown";
  passed: boolean | null;
  isLegal: boolean | null;
  userDistanceMeters: number | null;
  shortestDistanceMeters: number | null;
  extraDistanceMeters: number | null;
  userDistanceLabel: string;
  shortestDistanceLabel: string;
  extraDistanceLabel: string;
  failureReason: string;
  reviewTitle: string;
  reviewPayload: Json;
  matchedRoute: Json | null;
  perLegBreakdown: Json;
};

export type ListRouteAttemptsResult = {
  source: "supabase" | "local" | "not-configured";
  attempts: SavedRouteAttemptListItem[];
  reason?: string;
  error?: string;
};

type RouteAttemptInsert = TableInsert<"route_attempts">;
type RouteAttemptRow = TableRow<"route_attempts">;
type RouteAttemptLocalStore = Pick<Storage, "getItem" | "setItem">;

function currentIsoTimestamp(): string {
  return new Date().toISOString();
}

function localAttemptId(): string {
  return `local-route-attempt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function numericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function scorePercentFromLabel(scoreLabel: string): number | null {
  const match = /^(-?\d+(?:\.\d+)?)/.exec(scoreLabel);

  if (!match) {
    return null;
  }

  return finiteNumber(Number.parseFloat(match[1]));
}

function reviewPassed(review: RouteAttemptReview): boolean | null {
  if (review.status === "pass") {
    return true;
  }

  if (review.status === "fail" || review.status === "blocked") {
    return false;
  }

  return null;
}

function reviewLegality(review: RouteAttemptReview, score?: RouteAttemptStorageScore | null): boolean | null {
  if (typeof score?.isLegal === "boolean") {
    return score.isLegal;
  }

  if (review.status === "blocked" || review.illegalMovements.length > 0) {
    return false;
  }

  if (review.status === "pass") {
    return true;
  }

  return null;
}

function toJson(value: unknown, fallback: Json): Json {
  if (typeof value === "undefined") {
    return fallback;
  }

  return JSON.parse(JSON.stringify(value)) as Json;
}

function compactStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function compactMatchedRoutePayload(value: unknown): Json | null {
  const payload = objectValue(value);

  if (Object.keys(payload).length === 0) {
    return null;
  }

  return toJson(
    {
      status: typeof payload.status === "string" ? payload.status : undefined,
      isReadyForRunRouteExercise:
        typeof payload.isReadyForRunRouteExercise === "boolean" ? payload.isReadyForRunRouteExercise : undefined,
      orderedRoadIds: compactStringArray(payload.orderedRoadIds),
      selectedRoadIds: compactStringArray(payload.selectedRoadIds),
      selectedNodeIds: compactStringArray(payload.selectedNodeIds),
      directedEdgeIds: compactStringArray(payload.directedEdgeIds),
      requiredNodeIds: compactStringArray(payload.requiredNodeIds)
    },
    null
  );
}

function firstFailureReason(input: {
  review: RouteAttemptReview;
  score?: RouteAttemptStorageScore | null;
}): string | null {
  return input.review.suggestedFailureReason ?? input.score?.failureReasons?.[0] ?? null;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function timestampValue(value: string | null): number {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

function stringVersion(value: string | number | null | undefined): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return null;
}

function getRouteAttemptLocalStore(options: { localStore?: RouteAttemptLocalStore | null } = {}): RouteAttemptLocalStore | null {
  if (Object.prototype.hasOwnProperty.call(options, "localStore")) {
    return options.localStore ?? null;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function routeAttemptInsertToRow(
  insert: RouteAttemptInsert,
  options: { id?: string; createdAt?: string } = {}
): RouteAttemptRow {
  return {
    id: options.id ?? localAttemptId(),
    user_id: insert.user_id ?? null,
    exercise_id: insert.exercise_id,
    map_id: insert.map_id ?? null,
    map_version: insert.map_version ?? null,
    exercise_version: insert.exercise_version ?? null,
    score: insert.score ?? null,
    passed: insert.passed ?? null,
    is_legal: insert.is_legal ?? null,
    failure_reason: insert.failure_reason ?? null,
    user_distance_m: insert.user_distance_m ?? null,
    shortest_distance_m: insert.shortest_distance_m ?? null,
    extra_distance_m: insert.extra_distance_m ?? null,
    violations: insert.violations ?? [],
    missed_restrictions: insert.missed_restrictions ?? [],
    correction_hints: insert.correction_hints ?? [],
    practice_recommendations: insert.practice_recommendations ?? [],
    matched_route: insert.matched_route ?? null,
    per_leg_breakdown: insert.per_leg_breakdown ?? [],
    review_payload: insert.review_payload,
    review_schema_version: insert.review_schema_version ?? ROUTE_ATTEMPT_REVIEW_SCHEMA_VERSION,
    created_at: options.createdAt ?? currentIsoTimestamp()
  };
}

function readLocalRouteAttemptRows(store: RouteAttemptLocalStore): RouteAttemptRow[] {
  const rawValue = store.getItem(LOCAL_ROUTE_ATTEMPTS_STORAGE_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);

    return Array.isArray(parsed) ? (parsed as RouteAttemptRow[]) : [];
  } catch {
    return [];
  }
}

function writeLocalRouteAttemptRows(store: RouteAttemptLocalStore, rows: readonly RouteAttemptRow[]): void {
  store.setItem(LOCAL_ROUTE_ATTEMPTS_STORAGE_KEY, JSON.stringify(rows));
}

function saveRouteAttemptLocally(
  input: SaveRouteAttemptInput,
  store: RouteAttemptLocalStore,
  options: { reason?: string; error?: string } = {}
): SaveRouteAttemptResult {
  const payload = buildRouteAttemptInsert(input);
  const row = routeAttemptInsertToRow(payload);
  const rows = readLocalRouteAttemptRows(store);
  writeLocalRouteAttemptRows(store, [row, ...rows].slice(0, 50));

  return {
    source: "local",
    persisted: true,
    id: row.id,
    reason: options.reason,
    error: options.error
  };
}

export function formatSavedRouteAttemptDate(createdAt: string | null | undefined): string {
  if (!createdAt) {
    return "Date unavailable";
  }

  const date = new Date(createdAt);

  if (!Number.isFinite(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(date);
}

function scoreDisplayLabel(score: unknown): string {
  const scorePercent = numericValue(score);

  return scorePercent === null ? "n/a" : `${scorePercent.toFixed(1)}%`;
}

function distanceDisplayLabel(distance: unknown): string {
  const distanceMeters = numericValue(distance);

  if (distanceMeters === null) {
    return "n/a";
  }

  if (Math.abs(distanceMeters) >= 1000) {
    return `${(distanceMeters / 1000).toFixed(2)} km`;
  }

  return `${Math.round(distanceMeters)} m`;
}

function extraDistanceDisplayLabel(distance: unknown): string {
  const label = distanceDisplayLabel(distance);

  return label === "n/a" ? label : `+${label}`;
}

function statusDisplayLabel(row: Pick<RouteAttemptRow, "passed" | "review_payload">): SavedRouteAttemptListItem["statusLabel"] {
  const reviewPayload = objectValue(row.review_payload);

  if (reviewPayload.status === "blocked") {
    return "Blocked";
  }

  if (row.passed === true) {
    return "Pass";
  }

  if (row.passed === false) {
    return "Fail";
  }

  return "Unknown";
}

function failureReasonLabel(row: Pick<RouteAttemptRow, "failure_reason" | "passed" | "review_payload">): string {
  if (row.failure_reason) {
    return row.failure_reason;
  }

  const reviewPayload = objectValue(row.review_payload);
  const suggestedFailureReason =
    typeof reviewPayload.suggestedFailureReason === "string" ? reviewPayload.suggestedFailureReason : "";

  if (suggestedFailureReason) {
    return suggestedFailureReason;
  }

  return row.passed === true ? "None" : "No failure reason recorded";
}

export function mapRouteAttemptRow(
  row: RouteAttemptRow,
  options: { exerciseTitleById?: Record<string, string> } = {}
): SavedRouteAttemptListItem {
  const reviewPayload = toJson(row.review_payload, {});

  return {
    id: row.id,
    exerciseId: row.exercise_id,
    exerciseLabel: options.exerciseTitleById?.[row.exercise_id] ?? row.exercise_id,
    mapId: row.map_id ?? null,
    mapVersion: row.map_version ?? null,
    exerciseVersion: row.exercise_version ?? null,
    createdAt: row.created_at ?? null,
    dateLabel: formatSavedRouteAttemptDate(row.created_at),
    scoreLabel: scoreDisplayLabel(row.score),
    statusLabel: statusDisplayLabel(row),
    passed: row.passed,
    isLegal: row.is_legal,
    userDistanceMeters: numericValue(row.user_distance_m),
    shortestDistanceMeters: numericValue(row.shortest_distance_m),
    extraDistanceMeters: numericValue(row.extra_distance_m),
    userDistanceLabel: distanceDisplayLabel(row.user_distance_m),
    shortestDistanceLabel: distanceDisplayLabel(row.shortest_distance_m),
    extraDistanceLabel: extraDistanceDisplayLabel(row.extra_distance_m),
    failureReason: failureReasonLabel(row),
    reviewTitle:
      typeof objectValue(reviewPayload).title === "string"
        ? (objectValue(reviewPayload).title as string)
        : "Saved route attempt",
    reviewPayload,
    matchedRoute: row.matched_route ?? null,
    perLegBreakdown: row.per_leg_breakdown ?? []
  };
}

export function mapRouteAttemptRows(
  rows: readonly RouteAttemptRow[],
  options: { exerciseTitleById?: Record<string, string> } = {}
): SavedRouteAttemptListItem[] {
  return [...rows]
    .sort((left, right) => timestampValue(right.created_at) - timestampValue(left.created_at))
    .map((row) => mapRouteAttemptRow(row, options));
}

export function buildRouteAttemptInsert(input: SaveRouteAttemptInput): RouteAttemptInsert {
  if (input.review.status === "pending") {
    throw new Error("Cannot store a pending route attempt review.");
  }

  const snapshot = input.review.versionSnapshot;
  const score = finiteNumber(input.score?.scorePercent) ?? scorePercentFromLabel(input.review.scoreLabel);
  const userDistance = finiteNumber(input.score?.userRouteDistanceMeters);
  const shortestDistance = finiteNumber(input.score?.shortestLegalRouteDistanceMeters);
  const extraDistance = userDistance !== null && shortestDistance !== null ? Math.max(0, userDistance - shortestDistance) : null;

  return {
    user_id: input.userId ?? null,
    exercise_id: input.exerciseId,
    map_id: input.mapId ?? snapshot?.mapId ?? null,
    map_version: stringVersion(input.mapVersion) ?? stringVersion(snapshot?.mapVersion),
    exercise_version: stringVersion(input.exerciseVersion) ?? stringVersion(snapshot?.exerciseVersion),
    score,
    passed: typeof input.score?.passed === "boolean" ? input.score.passed : reviewPassed(input.review),
    is_legal: reviewLegality(input.review, input.score),
    failure_reason: firstFailureReason(input),
    user_distance_m: userDistance,
    shortest_distance_m: shortestDistance,
    extra_distance_m: extraDistance,
    violations: toJson(input.review.illegalMovements, []),
    missed_restrictions: toJson(input.review.missedRestrictions, []),
    correction_hints: toJson(input.review.correctionHints, []),
    practice_recommendations: toJson(input.review.practiceRecommendations, []),
    matched_route: compactMatchedRoutePayload(input.matchedRoute),
    per_leg_breakdown: toJson(input.score?.legBreakdown, []),
    review_payload: toJson(input.review, {}),
    review_schema_version: ROUTE_ATTEMPT_REVIEW_SCHEMA_VERSION
  };
}

async function resolveRouteAttemptUserId(client: PersistenceClient, fallbackUserId: string | null): Promise<string | null> {
  const authClient = client as PersistenceClient & {
    auth?: {
      getUser?: () => Promise<{
        data?: {
          user?: {
            id?: string;
          } | null;
        };
      }>;
    };
  };

  if (!authClient.auth?.getUser) {
    return fallbackUserId;
  }

  const {
    data: { user } = {}
  } = await authClient.auth.getUser();

  return user?.id ?? null;
}

export async function saveRouteAttempt(
  input: SaveRouteAttemptInput,
  options: { client?: unknown | null; localStore?: RouteAttemptLocalStore | null } = {}
): Promise<SaveRouteAttemptResult> {
  const client = asPersistenceClient(
    Object.prototype.hasOwnProperty.call(options, "client") ? options.client : getSupabaseClient()
  );
  const localStore = getRouteAttemptLocalStore(options);

  if (!client) {
    if (localStore) {
      return saveRouteAttemptLocally(input, localStore, {
        reason: "Supabase is not configured; route attempt was saved locally on this device."
      });
    }

    return {
      source: "not-configured",
      persisted: false,
      reason: "Supabase is not configured; route attempt was reviewed locally but not saved."
    };
  }

  const userId = await resolveRouteAttemptUserId(client, input.userId ?? null);
  const payload = buildRouteAttemptInsert({
    ...input,
    userId
  });
  const { data, error } = await client
    .from("route_attempts")
    .insert(payload)
    .select("id")
    .single<{ id: string }>();

  if (error || !data?.id) {
    if (localStore) {
      return saveRouteAttemptLocally(
        {
          ...input,
          userId
        },
        localStore,
        {
          reason: "Attempt reviewed, but Supabase could not save it; saved locally on this device.",
          error: error?.message ?? "Route attempt insert returned no row."
        }
      );
    }

    return {
      source: "supabase",
      persisted: false,
      reason: "Attempt reviewed, but could not be saved.",
      error: error?.message ?? "Route attempt insert returned no row."
    };
  }

  return {
    source: "supabase",
    persisted: true,
    id: data.id
  };
}

export async function listRouteAttempts(
  input: ListRouteAttemptsInput = {},
  options: { client?: unknown | null; exerciseTitleById?: Record<string, string>; localStore?: RouteAttemptLocalStore | null } = {}
): Promise<ListRouteAttemptsResult> {
  const client = asPersistenceClient(
    Object.prototype.hasOwnProperty.call(options, "client") ? options.client : getSupabaseClient()
  );
  const localStore = getRouteAttemptLocalStore(options);

  if (!client) {
    if (localStore) {
      return {
        source: "local",
        attempts: mapRouteAttemptRows(readLocalRouteAttemptRows(localStore), options),
        reason: "Supabase is not configured; showing locally saved route attempts from this device."
      };
    }

    return {
      source: "not-configured",
      attempts: [],
      reason: "Supabase is not configured; saved route attempts are unavailable."
    };
  }

  const userId = await resolveRouteAttemptUserId(client, input.userId ?? null);
  let query = client.from("route_attempts").select("*");

  if (userId) {
    query = query.eq("user_id", userId);
  } else {
    query = query.is("user_id", null);
  }

  if (input.exerciseId) {
    query = query.eq("exercise_id", input.exerciseId);
  }

  query = query.order("created_at", { ascending: false });

  if (typeof input.limit === "number" && Number.isFinite(input.limit) && input.limit > 0) {
    query = query.limit(Math.floor(input.limit));
  }

  const { data, error } = await query;

  if (error) {
    if (localStore) {
      return {
        source: "local",
        attempts: mapRouteAttemptRows(readLocalRouteAttemptRows(localStore), options),
        reason: "Saved route attempts could not be loaded from Supabase; showing local attempts from this device.",
        error: error.message
      };
    }

    return {
      source: "supabase",
      attempts: [],
      reason: "Saved route attempts could not be loaded.",
      error: error.message
    };
  }

  return {
    source: "supabase",
    attempts: Array.isArray(data) ? mapRouteAttemptRows(data as RouteAttemptRow[], options) : []
  };
}
