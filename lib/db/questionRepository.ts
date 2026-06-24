import {
  getAllQuestions,
  type AdminQuestion
} from "../admin/questionAdminHelpers.ts";
import type {
  QuestionDifficulty,
  QuestionStatus,
  TableInsert,
  TableRow,
  TableUpdate
} from "./types.ts";
import type {
  QuestionExportRecord,
  QuestionExportStatusFilter,
  QuestionImportMode,
  QuestionImportRecord
} from "./questionImportExport.ts";
import { asPersistenceClient } from "./queryClient.ts";
import { getSupabaseClient } from "../supabaseClient.ts";
import type { KnowledgeQuestionData } from "../knowledgeQuestions.ts";
import type { MapClickQuestionData } from "../mapClickQuestions.ts";
import type { RouteQuestion } from "../../src/data/routeQuestions.ts";

export type QuestionRepositorySource = "supabase" | "static";

export type QuestionRepositoryResult = {
  source: QuestionRepositorySource;
  questions: AdminQuestion[];
};

export type QuestionRepositoryOptions = {
  client?: unknown | null;
};

type QuestionRow = TableRow<"question_bank_items">;
type QuestionInsert = TableInsert<"question_bank_items">;
type QuestionUpdate = TableUpdate<"question_bank_items">;

export const PUBLISHED_QUESTION_STATUS = "published" satisfies QuestionStatus;
const QUESTION_STATUSES = ["draft", "published", "archived"] as const;

export type QuestionBankItemSummary = Pick<
  QuestionRow,
  | "id"
  | "question_type"
  | "status"
  | "prompt"
  | "updated_at"
  | "published_at"
>;

export type QuestionExportResult = {
  source: QuestionRepositorySource;
  items: QuestionExportRecord[];
  error?: string;
};

export type QuestionImportResult = {
  source: QuestionRepositorySource;
  persisted: boolean;
  importedCount: number;
  error?: string;
  reason?: string;
};

function questionStatus(question: AdminQuestion): QuestionStatus {
  if (question.type === "route") {
    return question.status === "active" ? "published" : question.status;
  }

  return question.isActive ? "published" : "draft";
}

function questionDifficulty(question: AdminQuestion): QuestionDifficulty {
  return question.difficulty;
}

function questionCategory(question: AdminQuestion) {
  return question.type === "route"
    ? question.tags[0] ?? "Route planning"
    : question.category;
}

function questionTags(question: AdminQuestion) {
  return question.type === "route" ? question.tags : [question.category];
}

export function staticQuestionToDbInsert(
  question: AdminQuestion,
  _bankId: string | null = null,
  statusOverride?: QuestionStatus
): QuestionInsert {
  void _bankId;
  const status = statusOverride ?? questionStatus(question);
  const publishedAt =
    status === PUBLISHED_QUESTION_STATUS ? new Date().toISOString() : null;

  if (question.type === "knowledge") {
    return {
      id: question.id,
      question_type: "knowledge",
      status,
      difficulty: questionDifficulty(question),
      category: questionCategory(question),
      prompt: question.prompt,
      explanation: question.explanation,
      tip: question.tip,
      tags: questionTags(question),
      source: question.sourceNote ?? "static",
      published_at: publishedAt,
      payload: {
        options: question.options,
        correctAnswer: question.correctAnswer,
        incorrectExplanations: question.incorrectExplanations
      }
    };
  }

  if (question.type === "map-click") {
    return {
      id: question.id,
      question_type: "map-click",
      status,
      difficulty: questionDifficulty(question),
      category: questionCategory(question),
      prompt: question.prompt,
      explanation: question.explanation,
      tip: question.tip,
      tags: questionTags(question),
      source: question.sourceNote ?? "static",
      published_at: publishedAt,
      payload: {
        targetName: question.targetName,
        answer: question.answer,
        toleranceMeters: question.toleranceMeters,
        acceptedAreaDescription: question.acceptedAreaDescription
      }
    };
  }

  return {
    id: question.id,
    question_type: "route-drawing",
    status,
    difficulty: question.difficulty,
    category: question.tags[0] ?? "Route planning",
    prompt: question.prompt,
    explanation: question.explanation,
    tip: question.tip,
    tags: question.tags,
    source: "Route question bank",
    published_at: publishedAt,
    payload: {
      title: question.title,
      fromLabel: question.fromLabel,
      toLabel: question.toLabel,
      from: question.from,
      to: question.to,
      acceptedRoute: question.acceptedRoute,
      mapArea: question.mapArea,
      mapBounds: question.mapBounds,
      idealRouteDescription: question.idealRouteDescription,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
    }
  };
}

function payloadObject(row: QuestionRow) {
  return row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
    ? row.payload
    : {};
}

function stringArray(value: unknown) {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string")
    ? value
    : [];
}

function coordinates(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const lat = (value as { lat?: unknown }).lat;
  const lng = (value as { lng?: unknown }).lng;
  return typeof lat === "number" && typeof lng === "number" ? { lat, lng } : null;
}

function mapBounds(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const bounds = value as {
    minX?: unknown;
    minY?: unknown;
    maxX?: unknown;
    maxY?: unknown;
  };
  return typeof bounds.minX === "number" &&
    typeof bounds.minY === "number" &&
    typeof bounds.maxX === "number" &&
    typeof bounds.maxY === "number"
    ? {
        minX: bounds.minX,
        minY: bounds.minY,
        maxX: bounds.maxX,
        maxY: bounds.maxY
      }
    : null;
}

function acceptedRoute(value: unknown): RouteQuestion["acceptedRoute"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const route = value as {
    geometry?: unknown;
    source?: unknown;
    coordinateSystem?: unknown;
    reviewed?: unknown;
  };
  const geometry =
    Array.isArray(route.geometry) &&
    route.geometry.every(
      (point) =>
        Array.isArray(point) &&
        point.length === 2 &&
        typeof point[0] === "number" &&
        typeof point[1] === "number"
    )
      ? (route.geometry as [number, number][])
      : [];
  if (
    geometry.length === 0 ||
    (route.source !== "osrm" && route.source !== "manual" && route.source !== "stored")
  ) {
    return undefined;
  }
  return {
    geometry,
    source: route.source,
    coordinateSystem: route.coordinateSystem === "map" ? "map" : "map",
    reviewed: route.reviewed === true
  };
}

export function dbRowToStaticQuestion(row: QuestionRow): AdminQuestion | null {
  const payload = payloadObject(row);
  const common = {
    id: row.id,
    prompt: row.prompt,
    difficulty: row.difficulty ?? "medium",
    explanation: row.explanation ?? "",
    sourceNote: row.source ?? "Supabase question row"
  } as const;

  if (row.question_type === "knowledge") {
    const options = stringArray((payload as { options?: unknown }).options);
    const correctAnswer = (payload as { correctAnswer?: unknown }).correctAnswer;
    const incorrectExplanations = (payload as { incorrectExplanations?: unknown }).incorrectExplanations;
    if (options.length < 2 || typeof correctAnswer !== "string") return null;
    return {
      ...common,
      type: "knowledge",
      options,
      correctAnswer,
      tip: row.tip ?? undefined,
      incorrectExplanations:
        incorrectExplanations &&
        typeof incorrectExplanations === "object" &&
        !Array.isArray(incorrectExplanations)
          ? (incorrectExplanations as Record<string, string>)
          : undefined,
      category: row.category ?? "Knowledge",
      isActive: row.status === PUBLISHED_QUESTION_STATUS
    } satisfies KnowledgeQuestionData;
  }

  if (row.question_type === "map-click") {
    const answer = coordinates((payload as { answer?: unknown }).answer);
    const targetName = (payload as { targetName?: unknown }).targetName;
    const toleranceMeters = (payload as { toleranceMeters?: unknown }).toleranceMeters;
    const acceptedAreaDescription = (payload as { acceptedAreaDescription?: unknown }).acceptedAreaDescription;
    if (!answer || typeof targetName !== "string" || typeof toleranceMeters !== "number") {
      return null;
    }
    return {
      ...common,
      type: "map-click",
      answer,
      toleranceMeters,
      targetName,
      tip: row.tip ?? undefined,
      acceptedAreaDescription:
        typeof acceptedAreaDescription === "string"
          ? acceptedAreaDescription
          : undefined,
      category: row.category ?? "Location knowledge",
      isActive: row.status === PUBLISHED_QUESTION_STATUS
    } satisfies MapClickQuestionData;
  }

  const from = coordinates((payload as { from?: unknown }).from);
  const to = coordinates((payload as { to?: unknown }).to);
  const bounds = mapBounds((payload as { mapBounds?: unknown }).mapBounds);
  const title = (payload as { title?: unknown }).title;
  const fromLabel = (payload as { fromLabel?: unknown }).fromLabel;
  const toLabel = (payload as { toLabel?: unknown }).toLabel;
  const mapArea = (payload as { mapArea?: unknown }).mapArea;
  const idealRouteDescription = (payload as { idealRouteDescription?: unknown }).idealRouteDescription;
  if (
    !from ||
    !to ||
    !bounds ||
    typeof title !== "string" ||
    typeof fromLabel !== "string" ||
    typeof toLabel !== "string" ||
    typeof mapArea !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    title,
    prompt: row.prompt,
    fromLabel,
    toLabel,
    from,
    to,
    acceptedRoute: acceptedRoute((payload as { acceptedRoute?: unknown }).acceptedRoute),
    mapArea,
    mapBounds: bounds,
    difficulty: row.difficulty ?? "medium",
    status: row.status === PUBLISHED_QUESTION_STATUS ? "active" : row.status,
    tags: row.tags,
    explanation: row.explanation ?? "",
    tip: row.tip ?? undefined,
    idealRouteDescription:
      typeof idealRouteDescription === "string"
        ? idealRouteDescription
        : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    type: "route"
  } satisfies AdminQuestion;
}

export async function readQuestions(
  options: QuestionRepositoryOptions = {}
): Promise<QuestionRepositoryResult> {
  return readPublishedQuestions(options);
}

export async function readPublishedQuestions(
  options: QuestionRepositoryOptions = {}
): Promise<QuestionRepositoryResult> {
  const client = asPersistenceClient(
    Object.prototype.hasOwnProperty.call(options, "client")
      ? options.client
      : getSupabaseClient()
  );

  if (!client) {
    return { source: "static", questions: getAllQuestions() };
  }

  const { data, error } = await client
    .from("question_bank_items")
    .select("*")
    .eq("status", PUBLISHED_QUESTION_STATUS)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return { source: "static", questions: getAllQuestions() };
  }

  const rows = Array.isArray(data) ? (data as QuestionRow[]) : [];
  const questions = rows
    .map((row) => dbRowToStaticQuestion(row))
    .filter((question): question is AdminQuestion => Boolean(question));

  return { source: "supabase", questions };
}

export async function readAdminQuestionItems(
  options: QuestionRepositoryOptions = {}
) {
  const client = asPersistenceClient(
    Object.prototype.hasOwnProperty.call(options, "client")
      ? options.client
      : getSupabaseClient()
  );

  if (!client) {
    return {
      source: "static" as const,
      items: [] as QuestionBankItemSummary[],
      error: "Supabase is not configured."
    };
  }

  const { data, error } = await client
    .from("question_bank_items")
    .select("id, question_type, status, prompt, updated_at, published_at")
    .order("updated_at", { ascending: false });

  return {
    source: "supabase" as const,
    items: error || !Array.isArray(data) ? [] : (data as QuestionBankItemSummary[]),
    error: error?.message
  };
}

export async function exportQuestionBankItemsForAdmin(
  statusFilter: QuestionExportStatusFilter = "all",
  options: QuestionRepositoryOptions = {}
): Promise<QuestionExportResult> {
  const client = asPersistenceClient(
    Object.prototype.hasOwnProperty.call(options, "client")
      ? options.client
      : getSupabaseClient()
  );

  if (!client) {
    return {
      source: "static",
      items: [],
      error: "Supabase is not configured."
    };
  }

  let query = client.from("question_bank_items").select("*");
  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query.order("id", { ascending: true });

  return {
    source: "supabase",
    items: error || !Array.isArray(data) ? [] : (data as QuestionExportRecord[]),
    error: error?.message
  };
}

export function normalizeQuestionStatus(value: unknown): QuestionStatus {
  return QUESTION_STATUSES.includes(value as QuestionStatus)
    ? (value as QuestionStatus)
    : "draft";
}

export async function upsertQuestion(
  question: AdminQuestion,
  options: QuestionRepositoryOptions = {}
) {
  return upsertQuestionForAdmin(question, {
    ...options,
    status: questionStatus(question)
  });
}

export async function upsertQuestionForAdmin(
  question: AdminQuestion,
  options: QuestionRepositoryOptions & {
    status?: QuestionStatus;
    adminUserId?: string | null;
  } = {}
) {
  const client = asPersistenceClient(options.client ?? getSupabaseClient());
  if (!client) {
    return {
      source: "static" as const,
      persisted: false,
      reason: "Supabase is not configured; export JSON or commit source-bank changes."
    };
  }

  const insert = staticQuestionToDbInsert(
    question,
    null,
    options.status ?? questionStatus(question)
  );
  const payload: QuestionInsert = {
    ...insert,
    created_by: options.adminUserId ?? insert.created_by ?? null,
    updated_by: options.adminUserId ?? null
  };
  const { error } = await client
    .from("question_bank_items")
    .upsert(payload, { onConflict: "id" });

  return {
    source: "supabase" as const,
    persisted: !error,
    error: error?.message
  };
}

export async function importQuestionBankItemsForAdmin(
  records: QuestionImportRecord[],
  options: QuestionRepositoryOptions & {
    mode?: QuestionImportMode;
    adminUserId?: string | null;
  } = {}
): Promise<QuestionImportResult> {
  const client = asPersistenceClient(options.client ?? getSupabaseClient());
  if (!client) {
    return {
      source: "static",
      persisted: false,
      importedCount: 0,
      reason: "Supabase is not configured; question import was not saved."
    };
  }

  if (records.length === 0) {
    return {
      source: "supabase",
      persisted: false,
      importedCount: 0,
      reason: "No valid question records were provided for import."
    };
  }

  const importedAt = new Date().toISOString();
  const payload = records.map((record) => ({
    ...record,
    created_by: options.adminUserId ?? record.created_by ?? null,
    updated_by: options.adminUserId ?? null,
    published_at:
      record.status === PUBLISHED_QUESTION_STATUS
        ? record.published_at ?? importedAt
        : null
  }));
  const query =
    options.mode === "upsert"
      ? client.from("question_bank_items").upsert(payload, { onConflict: "id" })
      : client.from("question_bank_items").insert(payload);
  const { error } = await query;

  return {
    source: "supabase",
    persisted: !error,
    importedCount: error ? 0 : records.length,
    error: error?.message
  };
}

export async function setQuestionStatusForAdmin(
  questionId: string,
  status: QuestionStatus,
  options: QuestionRepositoryOptions & {
    adminUserId?: string | null;
  } = {}
) {
  const client = asPersistenceClient(options.client ?? getSupabaseClient());
  if (!client) {
    return {
      source: "static" as const,
      persisted: false,
      reason: "Supabase is not configured; status was not changed."
    };
  }

  const nextStatus = normalizeQuestionStatus(status);
  const update: QuestionUpdate = {
    status: nextStatus,
    updated_by: options.adminUserId ?? null,
    published_at:
      nextStatus === PUBLISHED_QUESTION_STATUS ? new Date().toISOString() : null
  };
  const { error } = await client
    .from("question_bank_items")
    .update(update)
    .eq("id", questionId);

  return {
    source: "supabase" as const,
    persisted: !error,
    error: error?.message
  };
}
