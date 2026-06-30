import type { Json, TableInsert, TableRow } from "../../../lib/db/types.ts";
import { asPersistenceClient, type PersistenceClient } from "../../../lib/db/queryClient.ts";
import { getSupabaseClient } from "../../../lib/supabaseClient.ts";
import type { RouteAttemptReview } from "./routeAttemptReview.ts";

export const ROUTE_ATTEMPT_REVIEW_SCHEMA_VERSION = 1;

export type RouteAttemptStorageScore = {
  scorePercent?: number | null;
  passed?: boolean | null;
  userRouteDistanceMeters?: number | null;
  shortestLegalRouteDistanceMeters?: number | null;
  failureReasons?: readonly string[];
};

export type SaveRouteAttemptInput = {
  userId?: string | null;
  exerciseId: string;
  review: RouteAttemptReview;
  score?: RouteAttemptStorageScore | null;
  matchedRoute?: unknown;
};

export type SaveRouteAttemptResult = {
  source: "supabase" | "not-configured";
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
  createdAt: string | null;
  dateLabel: string;
  scoreLabel: string;
  statusLabel: "Pass" | "Fail" | "Blocked" | "Unknown";
  passed: boolean | null;
  failureReason: string;
  reviewTitle: string;
  reviewPayload: Json;
  matchedRoute: Json | null;
};

export type ListRouteAttemptsResult = {
  source: "supabase" | "not-configured";
  attempts: SavedRouteAttemptListItem[];
  reason?: string;
  error?: string;
};

type RouteAttemptInsert = TableInsert<"route_attempts">;
type RouteAttemptRow = TableRow<"route_attempts">;

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

function toJson(value: unknown, fallback: Json): Json {
  if (typeof value === "undefined") {
    return fallback;
  }

  return JSON.parse(JSON.stringify(value)) as Json;
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
    createdAt: row.created_at ?? null,
    dateLabel: formatSavedRouteAttemptDate(row.created_at),
    scoreLabel: scoreDisplayLabel(row.score),
    statusLabel: statusDisplayLabel(row),
    passed: row.passed,
    failureReason: failureReasonLabel(row),
    reviewTitle:
      typeof objectValue(reviewPayload).title === "string"
        ? (objectValue(reviewPayload).title as string)
        : "Saved route attempt",
    reviewPayload,
    matchedRoute: row.matched_route ?? null
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

  const score = finiteNumber(input.score?.scorePercent) ?? scorePercentFromLabel(input.review.scoreLabel);
  const userDistance = finiteNumber(input.score?.userRouteDistanceMeters);
  const shortestDistance = finiteNumber(input.score?.shortestLegalRouteDistanceMeters);
  const extraDistance = userDistance !== null && shortestDistance !== null ? Math.max(0, userDistance - shortestDistance) : null;

  return {
    user_id: input.userId ?? null,
    exercise_id: input.exerciseId,
    score,
    passed: typeof input.score?.passed === "boolean" ? input.score.passed : reviewPassed(input.review),
    failure_reason: firstFailureReason(input),
    user_distance_m: userDistance,
    shortest_distance_m: shortestDistance,
    extra_distance_m: extraDistance,
    violations: toJson(input.review.illegalMovements, []),
    missed_restrictions: toJson(input.review.missedRestrictions, []),
    correction_hints: toJson(input.review.correctionHints, []),
    practice_recommendations: toJson(input.review.practiceRecommendations, []),
    matched_route: toJson(input.matchedRoute, null),
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
  options: { client?: unknown | null } = {}
): Promise<SaveRouteAttemptResult> {
  const client = asPersistenceClient(
    Object.prototype.hasOwnProperty.call(options, "client") ? options.client : getSupabaseClient()
  );

  if (!client) {
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
  options: { client?: unknown | null; exerciseTitleById?: Record<string, string> } = {}
): Promise<ListRouteAttemptsResult> {
  const client = asPersistenceClient(
    Object.prototype.hasOwnProperty.call(options, "client") ? options.client : getSupabaseClient()
  );

  if (!client) {
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
